/**
 * WebSocket Benchmark Runner
 * 
 * This script provides a command-line interface for running WebSocket benchmarks
 * and performance tests on the KALDRIX blockchain system.
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createSecureSocketIO } from '@/lib/websocket-security';
import { createWebSocketBenchmark, WebSocketPerformanceThresholds, evaluatePerformance } from '@/lib/websocket-benchmark';
import { io as ClientIO } from 'socket.io-client';

interface BenchmarkConfig {
  port: number;
  duration: number;
  clients: number;
  messageRate: number;
  broadcastRate: number;
  outputFormat: 'json' | 'console' | 'csv';
  stressTest: boolean;
  enableSecurity: boolean;
  logLevel: 'none' | 'basic' | 'detailed' | 'verbose';
}

class WebSocketBenchmarkRunner {
  private config: BenchmarkConfig;
  private server?: any;
  private io?: Server;
  private benchmark?: any;

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = {
      port: 3001,
      duration: 30000,
      clients: 100,
      messageRate: 100,
      broadcastRate: 10,
      outputFormat: 'console',
      stressTest: false,
      enableSecurity: true,
      logLevel: 'basic',
      ...config,
    };
  }

  async run(): Promise<void> {
    console.log('🚀 Starting WebSocket Benchmark Runner');
    console.log('=====================================');
    console.log(`Configuration:`);
    console.log(`- Port: ${this.config.port}`);
    console.log(`- Duration: ${this.config.duration / 1000}s`);
    console.log(`- Clients: ${this.config.clients}`);
    console.log(`- Message Rate: ${this.config.messageRate}/s`);
    console.log(`- Broadcast Rate: ${this.config.broadcastRate}/s`);
    console.log(`- Stress Test: ${this.config.stressTest}`);
    console.log(`- Security: ${this.config.enableSecurity}`);
    console.log(`- Output Format: ${this.config.outputFormat}`);
    console.log('');

    try {
      await this.setupServer();
      await this.runBenchmark();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async setupServer(): Promise<void> {
    console.log('📡 Setting up WebSocket server...');

    // Create HTTP server
    this.server = createServer();

    // Create Socket.IO server
    if (this.config.enableSecurity) {
      this.io = createSecureSocketIO(this.server, {
        jwtSecret: 'benchmark-secret-key',
        rateLimitWindow: 60000,
        rateLimitMax: 10000, // High limit for benchmarking
        enableIPTracking: false, // Disable IP tracking for benchmarking
      });
    } else {
      this.io = new Server(this.server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });
    }

    // Setup connection handlers
    this.io.on('connection', (socket) => {
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('benchmark_message', (data) => {
        socket.emit('benchmark_response', {
          ...data,
          serverTimestamp: Date.now(),
          socketId: socket.id,
        });
      });

      socket.on('benchmark_broadcast', (data) => {
        this.io!.emit('broadcast_response', {
          ...data,
          serverTimestamp: Date.now(),
          from: socket.id,
        });
      });
    });

    // Create benchmark instance
    this.benchmark = createWebSocketBenchmark(this.io, {
      enabled: true,
      samplingInterval: 1000,
      maxSamples: this.config.duration / 1000 * 2, // 2x duration worth of samples
      logLevel: this.config.logLevel,
    });

    // Start server
    await new Promise<void>((resolve, reject) => {
      this.server.listen(this.config.port, () => {
        console.log(`✅ Server listening on port ${this.config.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  private async runBenchmark(): Promise<void> {
    console.log('🏃 Running benchmark...');

    if (this.config.stressTest) {
      await this.runStressTest();
    } else {
      await this.runStandardTest();
    }
  }

  private async runStandardTest(): Promise<void> {
    const clients: any[] = [];
    const results = {
      connected: 0,
      failed: 0,
      messagesSent: 0,
      messagesReceived: 0,
      broadcastsSent: 0,
      broadcastsReceived: 0,
      latencies: [] as number[],
    };

    console.log(`🔌 Connecting ${this.config.clients} clients...`);

    // Connect clients
    const connectionPromises = Array.from({ length: this.config.clients }, async (_, i) => {
      const client = ClientIO(`http://localhost:${this.config.port}`, {
        timeout: 5000,
        transports: ['websocket'],
      });

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 10000);

          client.on('connect', () => {
            clearTimeout(timeout);
            results.connected++;
            resolve();
          });

          client.on('connect_error', (error) => {
            clearTimeout(timeout);
            results.failed++;
            reject(error);
          });
        });

        // Set up message handlers
        client.on('benchmark_response', (data) => {
          results.messagesReceived++;
          const latency = Date.now() - data.clientTimestamp;
          results.latencies.push(latency);
        });

        client.on('broadcast_response', (data) => {
          results.broadcastsReceived++;
        });

        clients.push(client);
      } catch (error) {
        results.failed++;
        console.warn(`Client ${i} failed to connect:`, error.message);
      }
    });

    await Promise.allSettled(connectionPromises);
    console.log(`✅ Connected ${results.connected}/${this.config.clients} clients`);

    if (results.connected === 0) {
      throw new Error('No clients connected successfully');
    }

    // Wait for warm-up
    console.log('⏳ Warming up...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Run message test
    console.log('📨 Running message test...');
    const messageTestDuration = this.config.duration / 2;
    const messageTestStart = Date.now();

    while (Date.now() - messageTestStart < messageTestDuration) {
      const messagesToSend = Math.floor(this.config.messageRate / 10); // Per 100ms
      const activeClients = clients.filter(c => c.connected);

      for (let i = 0; i < messagesToSend && i < activeClients.length; i++) {
        const client = activeClients[Math.floor(Math.random() * activeClients.length)];
        client.emit('benchmark_message', {
          clientTimestamp: Date.now(),
          messageId: `msg_${Date.now()}_${i}`,
        });
        results.messagesSent++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Run broadcast test
    console.log('📢 Running broadcast test...');
    const broadcastTestStart = Date.now();

    while (Date.now() - broadcastTestStart < messageTestDuration) {
      const broadcastsToSend = Math.floor(this.config.broadcastRate / 10); // Per 100ms

      for (let i = 0; i < broadcastsToSend; i++) {
        this.io!.emit('benchmark_broadcast', {
          timestamp: Date.now(),
          broadcastId: `broadcast_${Date.now()}_${i}`,
        });
        results.broadcastsSent++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for final messages to be processed
    console.log('⏳ Waiting for final messages...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Disconnect clients
    console.log('🔌 Disconnecting clients...');
    clients.forEach(client => {
      if (client.connected) {
        client.disconnect();
      }
    });

    // Print results
    console.log('\n📊 Standard Test Results:');
    console.log('========================');
    console.log(`Connections: ${results.connected} successful, ${results.failed} failed`);
    console.log(`Messages: ${results.messagesSent} sent, ${results.messagesReceived} received`);
    console.log(`Broadcasts: ${results.broadcastsSent} sent, ${results.broadcastsReceived} received`);
    
    if (results.latencies.length > 0) {
      const avgLatency = results.latencies.reduce((sum, latency) => sum + latency, 0) / results.latencies.length;
      const minLatency = Math.min(...results.latencies);
      const maxLatency = Math.max(...results.latencies);
      
      console.log(`Latency: avg ${avgLatency.toFixed(2)}ms, min ${minLatency.toFixed(2)}ms, max ${maxLatency.toFixed(2)}ms`);
    }

    console.log('');
  }

  private async runStressTest(): Promise<void> {
    console.log('💪 Running stress test...');

    const stressConfig = {
      duration: this.config.duration,
      clients: this.config.clients,
      messageRate: this.config.messageRate,
      broadcastRate: this.config.broadcastRate,
    };

    const metrics = await this.benchmark!.startStressTest(stressConfig);

    console.log('\n📊 Stress Test Results:');
    console.log('======================');
    console.log(`Event Delivery:`);
    console.log(`- Average: ${metrics.eventDeliveryTime.avg.toFixed(2)}ms`);
    console.log(`- Min: ${metrics.eventDeliveryTime.min.toFixed(2)}ms`);
    console.log(`- Max: ${metrics.eventDeliveryTime.max.toFixed(2)}ms`);
    console.log(`- 95th percentile: ${metrics.eventDeliveryTime.p95.toFixed(2)}ms`);
    console.log(`- 99th percentile: ${metrics.eventDeliveryTime.p99.toFixed(2)}ms`);
    console.log(`- Total events: ${metrics.eventDeliveryTime.count}`);
    
    console.log(`\nThroughput:`);
    console.log(`- Messages/sec: ${metrics.throughput.messagesPerSecond.toFixed(2)}`);
    console.log(`- Events/sec: ${metrics.throughput.eventsPerSecond.toFixed(2)}`);
    console.log(`- Broadcasts/sec: ${metrics.throughput.broadcastsPerSecond.toFixed(2)}`);
    
    console.log(`\nConnections:`);
    console.log(`- Active: ${metrics.connectionStats.activeConnections}`);
    console.log(`- Total: ${metrics.connectionStats.totalConnections}`);
    console.log(`- Failed: ${metrics.connectionStats.failedConnections}`);
    console.log(`- Avg connection time: ${metrics.connectionStats.avgConnectionTime.toFixed(2)}ms`);
    
    if (metrics.resourceUsage.memory) {
      console.log(`\nResource Usage:`);
      console.log(`- Memory: ${(metrics.resourceUsage.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`- Connections: ${metrics.resourceUsage.network?.connections || 0}`);
    }

    console.log('');
  }

  private async generateReport(): Promise<void> {
    console.log('📋 Generating performance report...');

    const metrics = this.benchmark!.getMetrics();
    const evaluation = evaluatePerformance(metrics);

    console.log('\n🎯 Performance Evaluation:');
    console.log('========================');
    console.log(`Overall Rating: ${evaluation.overall.toUpperCase()} (${evaluation.score}/100)`);
    
    console.log('\nDetailed Ratings:');
    Object.entries(evaluation.details).forEach(([metric, rating]) => {
      console.log(`- ${metric}: ${rating.toUpperCase()}`);
    });

    // Compare against thresholds
    console.log('\n📏 Threshold Comparison:');
    console.log('========================');
    
    const eventRating = this.getThresholdRating(
      metrics.eventDeliveryTime.avg,
      WebSocketPerformanceThresholds.eventDelivery,
      true
    );
    console.log(`Event Delivery (${metrics.eventDeliveryTime.avg.toFixed(2)}ms): ${eventRating}`);

    const throughputRating = this.getThresholdRating(
      metrics.throughput.messagesPerSecond,
      WebSocketPerformanceThresholds.throughput,
      false
    );
    console.log(`Throughput (${metrics.throughput.messagesPerSecond.toFixed(2)} msg/s): ${throughputRating}`);

    const connectionRating = this.getThresholdRating(
      metrics.connectionStats.avgConnectionTime,
      WebSocketPerformanceThresholds.connectionTime,
      true
    );
    console.log(`Connection Time (${metrics.connectionStats.avgConnectionTime.toFixed(2)}ms): ${connectionRating}`);

    // Export data if requested
    if (this.config.outputFormat !== 'console') {
      const data = this.benchmark!.exportData(this.config.outputFormat);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `websocket-benchmark-${timestamp}.${this.config.outputFormat}`;
      
      require('fs').writeFileSync(filename, data);
      console.log(`\n💾 Data exported to: ${filename}`);
    }

    console.log('');
  }

  private getThresholdRating(
    value: number,
    thresholds: { excellent: number; good: number; acceptable: number; poor: number },
    lowerIsBetter: boolean
  ): string {
    if (lowerIsBetter) {
      if (value <= thresholds.excellent) return 'EXCELLENT';
      if (value <= thresholds.good) return 'GOOD';
      if (value <= thresholds.acceptable) return 'ACCEPTABLE';
      if (value <= thresholds.poor) return 'POOR';
      return 'VERY POOR';
    } else {
      if (value >= thresholds.excellent) return 'EXCELLENT';
      if (value >= thresholds.good) return 'GOOD';
      if (value >= thresholds.acceptable) return 'ACCEPTABLE';
      if (value >= thresholds.poor) return 'POOR';
      return 'VERY POOR';
    }
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up...');

    if (this.benchmark) {
      this.benchmark.stop();
    }

    if (this.io) {
      this.io.close();
    }

    if (this.server) {
      this.server.close();
    }

    console.log('✅ Benchmark completed');
  }
}

// CLI interface
function parseArgs(): BenchmarkConfig {
  const args = process.argv.slice(2);
  const config: Partial<BenchmarkConfig> = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--port':
        config.port = parseInt(value);
        break;
      case '--duration':
        config.duration = parseInt(value) * 1000; // Convert to milliseconds
        break;
      case '--clients':
        config.clients = parseInt(value);
        break;
      case '--message-rate':
        config.messageRate = parseInt(value);
        break;
      case '--broadcast-rate':
        config.broadcastRate = parseInt(value);
        break;
      case '--output':
        config.outputFormat = value as 'json' | 'console' | 'csv';
        break;
      case '--stress-test':
        config.stressTest = value === 'true';
        break;
      case '--no-security':
        config.enableSecurity = false;
        break;
      case '--log-level':
        config.logLevel = value as 'none' | 'basic' | 'detailed' | 'verbose';
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return {
    port: 3001,
    duration: 30000,
    clients: 100,
    messageRate: 100,
    broadcastRate: 10,
    outputFormat: 'console',
    stressTest: false,
    enableSecurity: true,
    logLevel: 'basic',
    ...config,
  };
}

function printHelp(): void {
  console.log(`
WebSocket Benchmark Runner

Usage: node websocket-benchmark.js [options]

Options:
  --port <number>           Server port (default: 3001)
  --duration <seconds>      Test duration in seconds (default: 30)
  --clients <number>        Number of concurrent clients (default: 100)
  --message-rate <number>   Messages per second (default: 100)
  --broadcast-rate <number> Broadcasts per second (default: 10)
  --output <format>         Output format: json|console|csv (default: console)
  --stress-test <boolean>   Run stress test (default: false)
  --no-security             Disable security features
  --log-level <level>       Log level: none|basic|detailed|verbose (default: basic)
  --help                    Show this help message

Examples:
  node websocket-benchmark.js --clients 500 --duration 60 --stress-test true
  node websocket-benchmark.js --message-rate 1000 --broadcast-rate 50 --output json
  node websocket-benchmark.js --no-security --log-level detailed
  `);
}

// Main execution
async function main() {
  try {
    const config = parseArgs();
    const runner = new WebSocketBenchmarkRunner(config);
    await runner.run();
  } catch (error) {
    console.error('❌ Benchmark runner failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { WebSocketBenchmarkRunner };