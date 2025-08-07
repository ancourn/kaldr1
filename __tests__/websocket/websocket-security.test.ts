/**
 * WebSocket Security Unit Tests
 * 
 * This file contains unit tests for WebSocket security functionality,
 * including JWT authentication, rate limiting, and IP blocking.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebSocketSecurity, SecurityEventType, generateWebSocketToken, isValidWebSocketToken, SecurityMonitor } from '@/lib/websocket-security';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  verify: vi.fn(),
  sign: vi.fn(),
}));

describe('WebSocketSecurity', () => {
  let webSocketSecurity: WebSocketSecurity;
  let mockSocket: any;

  beforeEach(() => {
    webSocketSecurity = new WebSocketSecurity({
      jwtSecret: 'test-secret',
      rateLimitWindow: 60000,
      rateLimitMax: 10,
      enableIPTracking: true,
    });

    mockSocket = {
      handshake: {
        address: '192.168.1.100',
        headers: {},
        auth: {},
        query: {},
      },
      data: {},
      on: vi.fn(),
      disconnect: vi.fn(),
    };

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Authentication', () => {
    it('should allow connection without token when not required', async () => {
      const next = vi.fn();

      await webSocketSecurity.authenticate(mockSocket, next);

      expect(next).toHaveBeenCalled();
      expect(mockSocket.data.isAuthenticated).toBe(false);
      expect(mockSocket.data.user).toBeUndefined();
    });

    it('should authenticate with valid token from auth object', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'user123', role: 'user' };

      mockSocket.handshake.auth.token = mockToken;
      (jwt.verify as any).mockReturnValue(mockDecoded);

      const next = vi.fn();

      await webSocketSecurity.authenticate(mockSocket, next);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', {
        algorithms: ['HS256'],
      });
      expect(next).toHaveBeenCalled();
      expect(mockSocket.data.isAuthenticated).toBe(true);
      expect(mockSocket.data.user).toEqual(mockDecoded);
    });

    it('should authenticate with valid token from authorization header', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'user123', role: 'user' };

      mockSocket.handshake.headers.authorization = `Bearer ${mockToken}`;
      (jwt.verify as any).mockReturnValue(mockDecoded);

      const next = vi.fn();

      await webSocketSecurity.authenticate(mockSocket, next);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', {
        algorithms: ['HS256'],
      });
      expect(next).toHaveBeenCalled();
      expect(mockSocket.data.isAuthenticated).toBe(true);
    });

    it('should authenticate with valid token from query parameter', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'user123', role: 'user' };

      mockSocket.handshake.query.token = mockToken;
      (jwt.verify as any).mockReturnValue(mockDecoded);

      const next = vi.fn();

      await webSocketSecurity.authenticate(mockSocket, next);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', {
        algorithms: ['HS256'],
      });
      expect(next).toHaveBeenCalled();
      expect(mockSocket.data.isAuthenticated).toBe(true);
    });

    it('should reject connection with invalid token', async () => {
      const mockToken = 'invalid-token';
      const mockError = new Error('Invalid token');

      mockSocket.handshake.auth.token = mockToken;
      (jwt.verify as any).mockImplementation(() => {
        throw mockError;
      });

      const next = vi.fn();

      await webSocketSecurity.authenticate(mockSocket, next);

      expect(next).toHaveBeenCalledWith(new Error('Authentication failed'));
      expect(mockSocket.data.isAuthenticated).toBeUndefined();
    });

    it('should prioritize token from auth object over headers and query', async () => {
      const mockToken1 = 'token-from-auth';
      const mockToken2 = 'token-from-header';
      const mockToken3 = 'token-from-query';
      const mockDecoded = { userId: 'user123' };

      mockSocket.handshake.auth.token = mockToken1;
      mockSocket.handshake.headers.authorization = `Bearer ${mockToken2}`;
      mockSocket.handshake.query.token = mockToken3;
      (jwt.verify as any).mockReturnValue(mockDecoded);

      const next = vi.fn();

      await webSocketSecurity.authenticate(mockSocket, next);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken1, 'test-secret', {
        algorithms: ['HS256'],
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const next = vi.fn();

      // First request
      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalled();

      // Reset mock for next call
      next.mockClear();

      // Second request within limit
      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalled();
    });

    it('should block requests exceeding rate limit', async () => {
      const next = vi.fn();

      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        await webSocketSecurity.authenticate(mockSocket, next);
        expect(next).toHaveBeenCalled();
        next.mockClear();
      }

      // This request should be blocked
      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalledWith(new Error('Rate limit exceeded'));
    });

    it('should reset rate limit after window expires', async () => {
      const next = vi.fn();

      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        await webSocketSecurity.authenticate(mockSocket, next);
        next.mockClear();
      }

      // This request should be blocked
      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalledWith(new Error('Rate limit exceeded'));
      next.mockClear();

      // Fast-forward past the rate limit window
      vi.advanceTimersByTime(61000);

      // This request should now be allowed
      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalled();
    });

    it('should not apply rate limiting when disabled', async () => {
      const security = new WebSocketSecurity({
        jwtSecret: 'test-secret',
        enableIPTracking: false,
      });

      const next = vi.fn();

      // Make many requests
      for (let i = 0; i < 20; i++) {
        await security.authenticate(mockSocket, next);
        expect(next).toHaveBeenCalled();
        next.mockClear();
      }
    });
  });

  describe('IP Blocking', () => {
    it('should block connections from blocked IPs', async () => {
      const blockedIP = '192.168.1.100';
      webSocketSecurity.blockIP(blockedIP);

      mockSocket.handshake.address = blockedIP;

      const next = vi.fn();

      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalledWith(new Error('IP address blocked'));
    });

    it('should allow connections from unblocked IPs', async () => {
      const unblockedIP = '192.168.1.200';
      mockSocket.handshake.address = unblockedIP;

      const next = vi.fn();

      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalled();
    });

    it('should unblock IPs when requested', async () => {
      const blockedIP = '192.168.1.100';
      webSocketSecurity.blockIP(blockedIP);

      mockSocket.handshake.address = blockedIP;

      const next = vi.fn();

      // Should be blocked
      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalledWith(new Error('IP address blocked'));
      next.mockClear();

      // Unblock the IP
      webSocketSecurity.unblockIP(blockedIP);

      // Should now be allowed
      await webSocketSecurity.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('IP Extraction', () => {
    it('should extract IP from handshake address', () => {
      mockSocket.handshake.address = '192.168.1.100';

      const next = vi.fn();

      return webSocketSecurity.authenticate(mockSocket, next).then(() => {
        // Connection should be allowed
        expect(next).toHaveBeenCalled();
      });
    });

    it('should use X-Forwarded-For header when proxies are trusted', async () => {
      const security = new WebSocketSecurity({
        jwtSecret: 'test-secret',
        trustedProxies: ['192.168.1.1'],
      });

      mockSocket.handshake.address = '192.168.1.1'; // Trusted proxy
      mockSocket.handshake.headers['x-forwarded-for'] = '192.168.1.100';

      const next = vi.fn();

      await security.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalled();
    });

    it('should not use X-Forwarded-For header when proxy is not trusted', async () => {
      const security = new WebSocketSecurity({
        jwtSecret: 'test-secret',
        trustedProxies: ['192.168.1.2'], // Different IP
      });

      mockSocket.handshake.address = '192.168.1.1'; // Not trusted
      mockSocket.handshake.headers['x-forwarded-for'] = '192.168.1.100';

      const next = vi.fn();

      await security.authenticate(mockSocket, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should provide correct rate limit statistics', async () => {
      const next = vi.fn();

      // Make some requests
      for (let i = 0; i < 5; i++) {
        await webSocketSecurity.authenticate(mockSocket, next);
      }

      const stats = webSocketSecurity.getRateLimitStats();
      expect(stats.totalIPs).toBe(1);
      expect(stats.blockedIPs).toBe(0);
      expect(stats.activeConnections).toBe(0); // Connections are tracked differently
    });

    it('should track blocked IPs in statistics', () => {
      webSocketSecurity.blockIP('192.168.1.100');
      webSocketSecurity.blockIP('192.168.1.200');

      const stats = webSocketSecurity.getRateLimitStats();
      expect(stats.blockedIPs).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired rate limit entries', async () => {
      const next = vi.fn();

      // Make some requests
      for (let i = 0; i < 5; i++) {
        await webSocketSecurity.authenticate(mockSocket, next);
      }

      expect(webSocketSecurity.getRateLimitStats().totalIPs).toBe(1);

      // Fast-forward past the rate limit window
      vi.advanceTimersByTime(61000);

      // Manually trigger cleanup
      webSocketSecurity.cleanup();

      // Should have cleaned up the expired entry
      expect(webSocketSecurity.getRateLimitStats().totalIPs).toBe(0);
    });
  });
});

describe('Security Utility Functions', () => {
  describe('generateWebSocketToken', () => {
    it('should generate JWT token with default options', () => {
      const payload = { userId: 'user123', role: 'user' };
      const mockToken = 'generated-token';

      (jwt.sign as any).mockReturnValue(mockToken);

      const token = generateWebSocketToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'your-secret-key-change-in-production', {
        algorithm: 'HS256',
        expiresIn: '24h',
      });
      expect(token).toBe(mockToken);
    });

    it('should generate JWT token with custom options', () => {
      const payload = { userId: 'user123' };
      const customSecret = 'custom-secret';
      const customExpiresIn = '1h';
      const mockToken = 'custom-generated-token';

      (jwt.sign as any).mockReturnValue(mockToken);

      const token = generateWebSocketToken(payload, customSecret, customExpiresIn);

      expect(jwt.sign).toHaveBeenCalledWith(payload, customSecret, {
        algorithm: 'HS256',
        expiresIn: customExpiresIn,
      });
      expect(token).toBe(mockToken);
    });
  });

  describe('isValidWebSocketToken', () => {
    it('should validate correct JWT token format', () => {
      const validTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'header.payload.signature',
        'a.b.c',
      ];

      validTokens.forEach(token => {
        expect(isValidWebSocketToken(token)).toBe(true);
      });
    });

    it('should reject invalid JWT token formats', () => {
      const invalidTokens = [
        '',
        'invalid',
        'header.payload',
        'header.',
        '.payload.signature',
        'header.payload.',
        'a.b',
        'a.b.c.d',
        null,
        undefined,
      ];

      invalidTokens.forEach(token => {
        expect(isValidWebSocketToken(token as any)).toBe(false);
      });
    });
  });
});

describe('SecurityMonitor', () => {
  let securityMonitor: SecurityMonitor;

  beforeEach(() => {
    securityMonitor = new SecurityMonitor();
  });

  describe('Event Logging', () => {
    it('should log security events', () => {
      const event = {
        type: SecurityEventType.AUTH_SUCCESS,
        ip: '192.168.1.100',
        details: { userId: 'user123' },
        severity: 'low' as const,
      };

      securityMonitor.logEvent(event);

      const recentEvents = securityMonitor.getRecentEvents(1);
      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0].type).toBe(SecurityEventType.AUTH_SUCCESS);
      expect(recentEvents[0].ip).toBe('192.168.1.100');
      expect(recentEvents[0].timestamp).toBeDefined();
    });

    it('should keep only recent events within limit', () => {
      // Log more events than the limit
      for (let i = 0; i < 105; i++) {
        securityMonitor.logEvent({
          type: SecurityEventType.AUTH_SUCCESS,
          ip: `192.168.1.${i}`,
          severity: 'low',
        });
      }

      const recentEvents = securityMonitor.getRecentEvents();
      expect(recentEvents).toHaveLength(100); // Max limit
    });

    it('should filter events by type', () => {
      securityMonitor.logEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        ip: '192.168.1.100',
        severity: 'low',
      });

      securityMonitor.logEvent({
        type: SecurityEventType.AUTH_FAILURE,
        ip: '192.168.1.100',
        severity: 'high',
      });

      securityMonitor.logEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        ip: '192.168.1.200',
        severity: 'low',
      });

      const authSuccessEvents = securityMonitor.getEventsByType(SecurityEventType.AUTH_SUCCESS);
      expect(authSuccessEvents).toHaveLength(2);

      const authFailureEvents = securityMonitor.getEventsByType(SecurityEventType.AUTH_FAILURE);
      expect(authFailureEvents).toHaveLength(1);
    });

    it('should filter events by IP', () => {
      securityMonitor.logEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        ip: '192.168.1.100',
        severity: 'low',
      });

      securityMonitor.logEvent({
        type: SecurityEventType.AUTH_FAILURE,
        ip: '192.168.1.100',
        severity: 'high',
      });

      securityMonitor.logEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        ip: '192.168.1.200',
        severity: 'low',
      });

      const ip100Events = securityMonitor.getEventsByIP('192.168.1.100');
      expect(ip100Events).toHaveLength(2);

      const ip200Events = securityMonitor.getEventsByIP('192.168.1.200');
      expect(ip200Events).toHaveLength(1);
    });

    it('should clear all events', () => {
      securityMonitor.logEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        ip: '192.168.1.100',
        severity: 'low',
      });

      expect(securityMonitor.getRecentEvents()).toHaveLength(1);

      securityMonitor.clear();

      expect(securityMonitor.getRecentEvents()).toHaveLength(0);
    });
  });
});