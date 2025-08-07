/**
 * WebSocket Integration Tests
 * 
 * This file contains integration tests for WebSocket functionality,
 * including testing 500+ concurrent connections, message broadcasting,
 * and performance under load.
 */

import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { WebSocketSecurity, SecurityEventType } from '@/lib/websocket-security';

describe('WebSocket Integration Tests', () => {
  let httpServer: any;
  let ioServer: Server;
  let serverUrl: string;
  let security: WebSocketSecurity;

  beforeAll(async () => {
    // Create HTTP server
    httpServer = createServer();
    
    // Create security instance
    security = new WebSocketSecurity({
      jwtSecret: 'test-secret-key',
      rateLimitWindow: 60000,
      rateLimitMax: 1000, // Higher limit for testing
      enableIPTracking: true,
    });

    // Create Socket.IO server with security
    ioServer = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Apply security middleware
    ioServer.use(security.authenticate);

    // Setup connection handlers
    ioServer.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle basic events
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      socket.on('message', (data) => {
        socket.emit('message_response', {
          original: data,
          timestamp: new Date().toISOString(),
          serverId: socket.id,
        });
      });

      socket.on('join_room', (room) => {
        socket.join(room);
        socket.emit('joined_room', { room, timestamp: new Date().toISOString() });
      });

      socket.on('leave_room', (room) => {
        socket.leave(room);
        socket.emit('left_room', { room, timestamp: new Date().toISOString() });
      });

      socket.on('broadcast', (data) => {
        ioServer.emit('broadcast_message', {
          ...data,
          from: socket.id,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });
    });

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const port = httpServer.address().port;
        serverUrl = `http://localhost:${port}`;
        console.log(`Test server running on port ${port}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (ioServer) {
      ioServer.close();
    }
    if (httpServer) {
      httpServer.close();
    }
  });

  describe('Single Connection Tests', () => {
    it('should establish connection and handle basic events', async () => {
      const client = ClientIO(serverUrl);
      
      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          expect(client.connected).toBe(true);
          resolve();
        });

        client.on('connect_error', (error) => {
          reject(error);
        });
      });

      // Test ping/pong
      const pongPromise = new Promise<any>((resolve) => {
        client.on('pong', (data) => {
          resolve(data);
        });
      });

      client.emit('ping');
      const pongResponse = await pongPromise;
      expect(pongResponse.timestamp).toBeDefined();

      // Test message echo
      const messagePromise = new Promise<any>((resolve) => {
        client.on('message_response', (data) => {
          resolve(data);
        });
      });

      const testMessage = { type: 'test', content: 'Hello World' };
      client.emit('message', testMessage);
      const messageResponse = await messagePromise;
      expect(messageResponse.original).toEqual(testMessage);
      expect(messageResponse.timestamp).toBeDefined();

      client.disconnect();
    });

    it('should handle room joining and leaving', async () => {
      const client = ClientIO(serverUrl);
      
      await new Promise<void>((resolve) => {
        client.on('connect', resolve);
      });

      // Join room
      const joinPromise = new Promise<any>((resolve) => {
        client.on('joined_room', (data) => {
          resolve(data);
        });
      });

      client.emit('join_room', 'test-room');
      const joinResponse = await joinPromise;
      expect(joinResponse.room).toBe('test-room');

      // Leave room
      const leavePromise = new Promise<any>((resolve) => {
        client.on('left_room', (data) => {
          resolve(data);
        });
      });

      client.emit('leave_room', 'test-room');
      const leaveResponse = await leavePromise;
      expect(leaveResponse.room).toBe('test-room');

      client.disconnect();
    });

    it('should handle broadcasting', async () => {
      const client1 = ClientIO(serverUrl);
      const client2 = ClientIO(serverUrl);

      await Promise.all([
        new Promise<void>(resolve => client1.on('connect', resolve)),
        new Promise<void>(resolve => client2.on('connect', resolve)),
      ]);

      // Both clients join the same room
      await Promise.all([
        new Promise<void>(resolve => {
          client1.on('joined_room', () => resolve());
          client1.emit('join_room', 'broadcast-room');
        }),
        new Promise<void>(resolve => {
          client2.on('joined_room', () => resolve());
          client2.emit('join_room', 'broadcast-room');
        }),
      ]);

      // Set up broadcast listeners
      const broadcast1Promise = new Promise<any>((resolve) => {
        client1.on('broadcast_message', resolve);
      });

      const broadcast2Promise = new Promise<any>((resolve) => {
        client2.on('broadcast_message', resolve);
      });

      // Send broadcast from client1
      const broadcastData = { message: 'Hello everyone!', type: 'broadcast' };
      client1.emit('broadcast', broadcastData);

      // Both clients should receive the broadcast
      const [response1, response2] = await Promise.all([
        broadcast1Promise,
        broadcast2Promise,
      ]);

      expect(response1.message).toBe(broadcastData.message);
      expect(response2.message).toBe(broadcastData.message);
      expect(response1.from).toBe(client1.id);
      expect(response2.from).toBe(client1.id);

      client1.disconnect();
      client2.disconnect();
    });
  });

  describe('Concurrent Connection Tests', () => {
    it('should handle 100 concurrent connections', async () => {
      const numClients = 100;
      const clients: ClientSocket[] = [];
      const connectionPromises: Promise<void>[] = [];
      const results = {
        connected: 0,
        failed: 0,
        avgConnectionTime: 0,
      };

      const connectionTimes: number[] = [];

      // Create connection promises
      for (let i = 0; i < numClients; i++) {
        const startTime = Date.now();
        const client = ClientIO(serverUrl);

        const connectionPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 10000);

          client.on('connect', () => {
            clearTimeout(timeout);
            const connectionTime = Date.now() - startTime;
            connectionTimes.push(connectionTime);
            results.connected++;
            resolve();
          });

          client.on('connect_error', (error) => {
            clearTimeout(timeout);
            results.failed++;
            reject(error);
          });
        });

        connectionPromises.push(connectionPromise);
        clients.push(client);
      }

      // Wait for all connections to complete
      try {
        await Promise.allSettled(connectionPromises);
      } catch (error) {
        console.error('Some connections failed:', error);
      }

      // Calculate average connection time
      if (connectionTimes.length > 0) {
        results.avgConnectionTime = connectionTimes.reduce((sum, time) => sum + time, 0) / connectionTimes.length;
      }

      // Verify results
      expect(results.connected).toBeGreaterThan(90); // Allow some failures
      expect(results.failed).toBeLessThan(10);
      expect(results.avgConnectionTime).toBeLessThan(1000); // Should connect quickly

      console.log(`Connection Results: ${results.connected} connected, ${results.failed} failed, avg time: ${results.avgConnectionTime}ms`);

      // Clean up
      clients.forEach(client => client.disconnect());
    });

    it('should handle 500 concurrent connections with load testing', async () => {
      const numClients = 500;
      const clients: ClientSocket[] = [];
      const results = {
        connected: 0,
        failed: 0,
        messagesSent: 0,
        messagesReceived: 0,
        avgConnectionTime: 0,
        avgMessageLatency: 0,
      };

      const connectionTimes: number[] = [];
      const messageLatencies: number[] = [];

      // Connect clients in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let batch = 0; batch < numClients / batchSize; batch++) {
        const batchPromises: Promise<void>[] = [];
        const batchClients: ClientSocket[] = [];

        for (let i = 0; i < batchSize; i++) {
          const startTime = Date.now();
          const client = ClientIO(serverUrl);

          const connectionPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout'));
            }, 15000);

            client.on('connect', () => {
              clearTimeout(timeout);
              const connectionTime = Date.now() - startTime;
              connectionTimes.push(connectionTime);
              results.connected++;
              resolve();
            });

            client.on('connect_error', (error) => {
              clearTimeout(timeout);
              results.failed++;
              reject(error);
            });
          });

          batchPromises.push(connectionPromise);
          batchClients.push(client);
        }

        // Wait for batch to connect
        try {
          await Promise.allSettled(batchPromises);
        } catch (error) {
          console.error(`Batch ${batch} connection errors:`, error);
        }

        clients.push(...batchClients);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate average connection time
      if (connectionTimes.length > 0) {
        results.avgConnectionTime = connectionTimes.reduce((sum, time) => sum + time, 0) / connectionTimes.length;
      }

      console.log(`Connected ${results.connected}/${numClients} clients, avg connection time: ${results.avgConnectionTime}ms`);

      // Test message handling with connected clients
      const messagePromises: Promise<any>[] = [];
      const activeClients = clients.filter(client => client.connected);

      for (const client of activeClients) {
        const messagePromise = new Promise<any>((resolve) => {
          const startTime = Date.now();
          
          const messageHandler = (data: any) => {
            const latency = Date.now() - startTime;
            messageLatencies.push(latency);
            results.messagesReceived++;
            client.off('message_response', messageHandler);
            resolve(data);
          };

          client.on('message_response', messageHandler);

          // Send test message
          setTimeout(() => {
            if (client.connected) {
              client.emit('message', { 
                type: 'load_test', 
                clientId: client.id,
                timestamp: Date.now(),
              });
              results.messagesSent++;
            } else {
              client.off('message_response', messageHandler);
              resolve(null);
            }
          }, Math.random() * 1000); // Stagger message sending
        });

        messagePromises.push(messagePromise);
      }

      // Wait for message responses
      const messageResponses = await Promise.allSettled(messagePromises);
      const successfulMessages = messageResponses.filter(response => response.status === 'fulfilled' && response.value !== null);

      // Calculate average message latency
      if (messageLatencies.length > 0) {
        results.avgMessageLatency = messageLatencies.reduce((sum, latency) => sum + latency, 0) / messageLatencies.length;
      }

      console.log(`Message Results: ${successfulMessages.length}/${results.messagesSent} messages received, avg latency: ${results.avgMessageLatency}ms`);

      // Verify performance metrics
      expect(results.connected).toBeGreaterThan(400); // At least 80% success rate
      expect(results.failed).toBeLessThan(100);
      expect(results.avgConnectionTime).toBeLessThan(2000); // Should connect within 2 seconds
      expect(results.avgMessageLatency).toBeLessThan(100); // Messages should be fast

      // Test broadcasting under load
      const broadcastPromises: Promise<any>[] = [];
      const broadcaster = activeClients[0];

      if (broadcaster) {
        for (const client of activeClients) {
          const broadcastPromise = new Promise<any>((resolve) => {
            const startTime = Date.now();
            
            const broadcastHandler = (data: any) => {
              const latency = Date.now() - startTime;
              messageLatencies.push(latency);
              client.off('broadcast_message', broadcastHandler);
              resolve(data);
            };

            client.on('broadcast_message', broadcastHandler);
          });

          broadcastPromises.push(broadcastPromise);
        }

        // Send broadcast
        broadcaster.emit('broadcast', { 
          type: 'load_test_broadcast', 
          message: 'Load test broadcast message',
          timestamp: Date.now(),
        });

        // Wait for broadcast responses
        const broadcastResponses = await Promise.allSettled(broadcastPromises);
        const successfulBroadcasts = broadcastResponses.filter(response => response.status === 'fulfilled');

        console.log(`Broadcast Results: ${successfulBroadcasts.length}/${activeClients.length} clients received broadcast`);
        expect(successfulBroadcasts.length).toBeGreaterThan(activeClients.length * 0.8); // 80% success rate
      }

      // Clean up
      clients.forEach(client => {
        if (client.connected) {
          client.disconnect();
        }
      });
    });

    it('should handle connection churn (rapid connect/disconnect)', async () => {
      const numCycles = 10;
      const clientsPerCycle = 20;
      const results = {
        totalConnections: 0,
        successfulConnections: 0,
        failedConnections: 0,
      };

      for (let cycle = 0; cycle < numCycles; cycle++) {
        const cycleClients: ClientSocket[] = [];
        const cyclePromises: Promise<void>[] = [];

        for (let i = 0; i < clientsPerCycle; i++) {
          results.totalConnections++;
          const client = ClientIO(serverUrl);

          const connectionPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              results.failedConnections++;
              reject(new Error('Connection timeout'));
            }, 5000);

            client.on('connect', () => {
              clearTimeout(timeout);
              results.successfulConnections++;
              
              // Disconnect quickly after connecting
              setTimeout(() => {
                client.disconnect();
                resolve();
              }, 100);
            });

            client.on('connect_error', (error) => {
              clearTimeout(timeout);
              results.failedConnections++;
              reject(error);
            });
          });

          cyclePromises.push(connectionPromise);
          cycleClients.push(client);
        }

        try {
          await Promise.allSettled(cyclePromises);
        } catch (error) {
          console.error(`Cycle ${cycle} errors:`, error);
        }

        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`Churn Test Results: ${results.successfulConnections}/${results.totalConnections} successful connections`);

      // Verify results
      expect(results.successfulConnections).toBeGreaterThan(results.totalConnections * 0.8); // 80% success rate
      expect(results.failedConnections).toBeLessThan(results.totalConnections * 0.2);
    });
  });

  describe('Security Integration Tests', () => {
    it('should enforce rate limiting under load', async () => {
      const numClients = 50;
      const clients: ClientSocket[] = [];
      const results = {
        allowedConnections: 0,
        blockedConnections: 0,
      };

      // Create a strict security instance for this test
      const strictSecurity = new WebSocketSecurity({
        jwtSecret: 'test-secret',
        rateLimitWindow: 60000,
        rateLimitMax: 10, // Very low limit for testing
        enableIPTracking: true,
      });

      // Temporarily replace the security middleware
      const originalUse = ioServer.use;
      ioServer.use = (middleware: any) => {
        // Simulate the same IP for all clients to trigger rate limiting
        return originalUse.call(ioServer, (socket: any, next: any) => {
          // Modify the handshake to use the same IP
          socket.handshake.address = '192.168.1.100';
          strictSecurity.authenticate(socket, next);
        });
      };

      // Try to connect more clients than the rate limit allows
      for (let i = 0; i < numClients; i++) {
        const client = ClientIO(serverUrl);

        try {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              results.blockedConnections++;
              resolve();
            }, 2000);

            client.on('connect', () => {
              clearTimeout(timeout);
              results.allowedConnections++;
              resolve();
            });

            client.on('connect_error', (error) => {
              clearTimeout(timeout);
              if (error.message === 'Rate limit exceeded') {
                results.blockedConnections++;
              } else {
                results.allowedConnections++; // Other errors shouldn't count as rate limiting
              }
              resolve();
            });
          });
        } catch (error) {
          results.blockedConnections++;
        }

        clients.push(client);
      }

      console.log(`Rate Limit Test: ${results.allowedConnections} allowed, ${results.blockedConnections} blocked`);

      // Verify rate limiting worked
      expect(results.allowedConnections).toBeLessThanOrEqual(10); // Should not exceed rate limit
      expect(results.blockedConnections).toBeGreaterThan(0); // Some should be blocked

      // Restore original middleware
      ioServer.use = originalUse;

      // Clean up
      clients.forEach(client => client.disconnect());
    });

    it('should handle authentication under load', async () => {
      const numClients = 100;
      const clients: ClientSocket[] = [];
      const results = {
        authenticatedConnections: 0,
        unauthenticatedConnections: 0,
        failedConnections: 0,
      };

      // Create security instance that requires authentication
      const authSecurity = new WebSocketSecurity({
        jwtSecret: 'test-secret',
        rateLimitWindow: 60000,
        rateLimitMax: 200,
        enableIPTracking: true,
      });

      // Generate a valid token for testing
      const validToken = 'valid-test-token';

      // Mock JWT verification to succeed for valid token
      const { verify } = await import('jsonwebtoken');
      vi.spyOn(verify, 'verify').mockImplementation((token: string) => {
        if (token === validToken) {
          return { userId: 'test-user', role: 'user' };
        }
        throw new Error('Invalid token');
      });

      // Temporarily replace the security middleware
      const originalUse = ioServer.use;
      ioServer.use = (middleware: any) => {
        return originalUse.call(ioServer, (socket: any, next: any) => {
          authSecurity.authenticate(socket, next);
        });
      };

      // Connect clients with mixed authentication
      for (let i = 0; i < numClients; i++) {
        const useAuth = i % 2 === 0; // Half with auth, half without
        const client = ClientIO(serverUrl, {
          auth: useAuth ? { token: validToken } : {},
        });

        try {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              results.failedConnections++;
              resolve();
            }, 5000);

            client.on('connect', () => {
              clearTimeout(timeout);
              if (useAuth) {
                results.authenticatedConnections++;
              } else {
                results.unauthenticatedConnections++;
              }
              resolve();
            });

            client.on('connect_error', (error) => {
              clearTimeout(timeout);
              results.failedConnections++;
              resolve();
            });
          });
        } catch (error) {
          results.failedConnections++;
        }

        clients.push(client);
      }

      console.log(`Auth Test: ${results.authenticatedConnections} authenticated, ${results.unauthenticatedConnections} unauthenticated, ${results.failedConnections} failed`);

      // Verify authentication worked
      expect(results.authenticatedConnections + results.unauthenticatedConnections + results.failedConnections).toBe(numClients);
      expect(results.authenticatedConnections).toBeGreaterThan(40); // Most should succeed
      expect(results.failedConnections).toBeLessThan(20); // Few should fail

      // Restore original middleware and cleanup
      ioServer.use = originalUse;
      vi.restoreAllMocks();
      clients.forEach(client => client.disconnect());
    });
  });

  describe('Performance Monitoring', () => {
    it('should monitor server performance under load', async () => {
      const numClients = 200;
      const clients: ClientSocket[] = [];
      const performanceMetrics = {
        connectionTimes: [] as number[],
        messageLatencies: [] as number[],
        broadcastLatencies: [] as number[],
        memoryUsage: [] as number[],
      };

      // Monitor memory usage
      const measureMemory = () => {
        if (global.process && process.memoryUsage) {
          const usage = process.memoryUsage();
          performanceMetrics.memoryUsage.push(usage.heapUsed);
        }
      };

      // Connect clients
      for (let i = 0; i < numClients; i++) {
        const startTime = Date.now();
        const client = ClientIO(serverUrl);

        await new Promise<void>((resolve) => {
          client.on('connect', () => {
            const connectionTime = Date.now() - startTime;
            performanceMetrics.connectionTimes.push(connectionTime);
            resolve();
          });

          client.on('connect_error', () => {
            resolve(); // Continue even if some fail
          });
        });

        clients.push(client);

        // Measure memory periodically
        if (i % 50 === 0) {
          measureMemory();
        }
      }

      console.log(`Connected ${clients.filter(c => c.connected).length}/${numClients} clients`);

      // Test message performance
      const messagePromises: Promise<number>[] = [];
      const activeClients = clients.filter(client => client.connected);

      for (const client of activeClients) {
        const startTime = Date.now();
        const promise = new Promise<number>((resolve) => {
          const handler = () => {
            const latency = Date.now() - startTime;
            client.off('message_response', handler);
            resolve(latency);
          };
          
          client.on('message_response', handler);
          client.emit('message', { type: 'performance_test' });
        });

        messagePromises.push(promise);
      }

      const messageResults = await Promise.allSettled(messagePromises);
      messageResults.forEach(result => {
        if (result.status === 'fulfilled') {
          performanceMetrics.messageLatencies.push(result.value);
        }
      });

      // Test broadcast performance
      const broadcaster = activeClients[0];
      if (broadcaster) {
        const broadcastPromises: Promise<number>[] = [];

        for (const client of activeClients) {
          const startTime = Date.now();
          const promise = new Promise<number>((resolve) => {
            const handler = () => {
              const latency = Date.now() - startTime;
              client.off('broadcast_message', handler);
              resolve(latency);
            };
            
            client.on('broadcast_message', handler);
          });

          broadcastPromises.push(promise);
        }

        broadcaster.emit('broadcast', { type: 'performance_broadcast' });

        const broadcastResults = await Promise.allSettled(broadcastPromises);
        broadcastResults.forEach(result => {
          if (result.status === 'fulfilled') {
            performanceMetrics.broadcastLatencies.push(result.value);
          }
        });
      }

      // Final memory measurement
      measureMemory();

      // Calculate statistics
      const avgConnectionTime = performanceMetrics.connectionTimes.reduce((sum, time) => sum + time, 0) / performanceMetrics.connectionTimes.length;
      const avgMessageLatency = performanceMetrics.messageLatencies.reduce((sum, latency) => sum + latency, 0) / performanceMetrics.messageLatencies.length;
      const avgBroadcastLatency = performanceMetrics.broadcastLatencies.reduce((sum, latency) => sum + latency, 0) / performanceMetrics.broadcastLatencies.length;
      const maxMemoryUsage = Math.max(...performanceMetrics.memoryUsage);

      console.log('Performance Metrics:');
      console.log(`- Avg Connection Time: ${avgConnectionTime.toFixed(2)}ms`);
      console.log(`- Avg Message Latency: ${avgMessageLatency.toFixed(2)}ms`);
      console.log(`- Avg Broadcast Latency: ${avgBroadcastLatency.toFixed(2)}ms`);
      console.log(`- Max Memory Usage: ${(maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);

      // Verify performance is within acceptable bounds
      expect(avgConnectionTime).toBeLessThan(1000); // Should connect within 1 second
      expect(avgMessageLatency).toBeLessThan(50); // Messages should be fast
      expect(avgBroadcastLatency).toBeLessThan(100); // Broadcast should be efficient
      expect(maxMemoryUsage).toBeLessThan(100 * 1024 * 1024); // Memory usage should be reasonable (<100MB)

      // Clean up
      clients.forEach(client => client.disconnect());
    });
  });
});