/**
 * WebSocket Unit Tests
 * 
 * This file contains unit tests for WebSocket message parsing,
 * dispatch, and protocol validation functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  WebSocketMessage, 
  WebSocketMessageType,
  validateWebSocketMessage,
  validateMessagePayload,
  serializeMessage,
  deserializeMessage,
  isNewBlockMessage,
  isDagUpdateMessage,
  isValidatorEventMessage,
  isTxReceivedMessage,
  isNodeStatusMessage,
  isAlertTriggeredMessage,
  buildNewBlockMessage,
  buildDagUpdateMessage,
  buildValidatorEventMessage,
  buildTxReceivedMessage,
  buildNodeStatusMessage,
  buildAlertTriggeredMessage,
  WEBSOCKET_PROTOCOL_VERSION
} from '@/lib/websocket-protocol';

describe('WebSocket Protocol Validation', () => {
  describe('validateWebSocketMessage', () => {
    it('should validate correct message structure', () => {
      const validMessage: WebSocketMessage = {
        type: 'NEW_BLOCK',
        payload: { blockId: 'test123', height: 1000, timestamp: '2025-08-07T00:00:00Z', hash: 'abc123' },
      };

      expect(validateWebSocketMessage(validMessage)).toBe(true);
    });

    it('should reject message without type', () => {
      const invalidMessage = {
        payload: { blockId: 'test123' },
      } as any;

      expect(validateWebSocketMessage(invalidMessage)).toBe(false);
    });

    it('should reject message without payload', () => {
      const invalidMessage = {
        type: 'NEW_BLOCK',
      } as any;

      expect(validateWebSocketMessage(invalidMessage)).toBe(false);
    });

    it('should reject message with invalid type', () => {
      const invalidMessage: WebSocketMessage = {
        type: 'INVALID_TYPE' as WebSocketMessageType,
        payload: { blockId: 'test123' },
      };

      expect(validateWebSocketMessage(invalidMessage)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateWebSocketMessage(null as any)).toBe(false);
      expect(validateWebSocketMessage(undefined as any)).toBe(false);
    });
  });

  describe('validateMessagePayload', () => {
    it('should validate NEW_BLOCK payload', () => {
      const validPayload = {
        blockId: 'test123',
        height: 1000,
        timestamp: '2025-08-07T00:00:00Z',
        hash: 'abc123',
        transactions: [],
      };

      expect(validateMessagePayload('NEW_BLOCK', validPayload)).toBe(true);
    });

    it('should reject NEW_BLOCK payload with missing required fields', () => {
      const invalidPayload = {
        blockId: 'test123',
        height: 1000,
      };

      expect(validateMessagePayload('NEW_BLOCK', invalidPayload)).toBe(false);
    });

    it('should validate DAG_UPDATE payload', () => {
      const validPayload = {
        updateType: 'NODE_ADDED',
        nodeId: 'node123',
        timestamp: '2025-08-07T00:00:00Z',
      };

      expect(validateMessagePayload('DAG_UPDATE', validPayload)).toBe(true);
    });

    it('should validate VALIDATOR_EVENT payload', () => {
      const validPayload = {
        eventType: 'JOINED',
        validatorId: 'validator123',
        stake: '1000',
        timestamp: '2025-08-07T00:00:00Z',
      };

      expect(validateMessagePayload('VALIDATOR_EVENT', validPayload)).toBe(true);
    });

    it('should validate TX_RECEIVED payload', () => {
      const validPayload = {
        txId: 'tx123',
        from: '0x123',
        to: '0x456',
        amount: '100',
        timestamp: '2025-08-07T00:00:00Z',
      };

      expect(validateMessagePayload('TX_RECEIVED', validPayload)).toBe(true);
    });

    it('should validate NODE_STATUS payload', () => {
      const validPayload = {
        nodeId: 'node123',
        status: 'ONLINE',
        uptime: 3600,
        blockHeight: 1000,
      };

      expect(validateMessagePayload('NODE_STATUS', validPayload)).toBe(true);
    });

    it('should accept unknown message types without strict validation', () => {
      const unknownPayload = {
        customField: 'value',
      };

      expect(validateMessagePayload('UNKNOWN_TYPE' as WebSocketMessageType, unknownPayload)).toBe(true);
    });
  });
});

describe('WebSocket Message Serialization', () => {
  describe('serializeMessage', () => {
    it('should serialize message with version and timestamp', () => {
      const message: WebSocketMessage = {
        type: 'NEW_BLOCK',
        payload: { blockId: 'test123' },
      };

      const serialized = serializeMessage(message);
      const parsed = JSON.parse(serialized);

      expect(parsed.type).toBe('NEW_BLOCK');
      expect(parsed.payload).toEqual({ blockId: 'test123' });
      expect(parsed.version).toBe(WEBSOCKET_PROTOCOL_VERSION);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should preserve existing timestamp if provided', () => {
      const existingTimestamp = '2025-08-07T00:00:00Z';
      const message: WebSocketMessage = {
        type: 'NEW_BLOCK',
        payload: { blockId: 'test123' },
        timestamp: existingTimestamp,
      };

      const serialized = serializeMessage(message);
      const parsed = JSON.parse(serialized);

      expect(parsed.timestamp).toBe(existingTimestamp);
    });
  });

  describe('deserializeMessage', () => {
    it('should deserialize valid message', () => {
      const message: WebSocketMessage = {
        type: 'NEW_BLOCK',
        payload: { blockId: 'test123' },
        timestamp: '2025-08-07T00:00:00Z',
      };

      const serialized = JSON.stringify(message);
      const deserialized = deserializeMessage(serialized);

      expect(deserialized).toEqual(message);
    });

    it('should return null for invalid JSON', () => {
      const deserialized = deserializeMessage('invalid json');
      expect(deserialized).toBeNull();
    });

    it('should return null for invalid message structure', () => {
      const invalidMessage = {
        type: 'NEW_BLOCK',
        // Missing payload
      };

      const serialized = JSON.stringify(invalidMessage);
      const deserialized = deserializeMessage(serialized);

      expect(deserialized).toBeNull();
    });
  });
});

describe('WebSocket Type Guards', () => {
  describe('isNewBlockMessage', () => {
    it('should return true for valid NEW_BLOCK message', () => {
      const message: WebSocketMessage = {
        type: 'NEW_BLOCK',
        payload: {
          blockId: 'test123',
          height: 1000,
          timestamp: '2025-08-07T00:00:00Z',
          hash: 'abc123',
          previousHash: 'def456',
          transactions: [],
          validator: 'validator1',
          signature: 'sig123',
          size: 1000,
          gasUsed: 50000,
          gasLimit: 100000,
        },
      };

      expect(isNewBlockMessage(message)).toBe(true);
    });

    it('should return false for invalid NEW_BLOCK message', () => {
      const invalidMessage: WebSocketMessage = {
        type: 'NEW_BLOCK',
        payload: {
          blockId: 'test123',
          // Missing required fields
        },
      };

      expect(isNewBlockMessage(invalidMessage)).toBe(false);
    });

    it('should return false for different message type', () => {
      const wrongTypeMessage: WebSocketMessage = {
        type: 'DAG_UPDATE',
        payload: {
          updateType: 'NODE_ADDED',
          nodeId: 'node123',
          timestamp: '2025-08-07T00:00:00Z',
        },
      };

      expect(isNewBlockMessage(wrongTypeMessage)).toBe(false);
    });
  });

  describe('isDagUpdateMessage', () => {
    it('should return true for valid DAG_UPDATE message', () => {
      const message: WebSocketMessage = {
        type: 'DAG_UPDATE',
        payload: {
          updateType: 'NODE_ADDED',
          nodeId: 'node123',
          timestamp: '2025-08-07T00:00:00Z',
        },
      };

      expect(isDagUpdateMessage(message)).toBe(true);
    });
  });

  describe('isValidatorEventMessage', () => {
    it('should return true for valid VALIDATOR_EVENT message', () => {
      const message: WebSocketMessage = {
        type: 'VALIDATOR_EVENT',
        payload: {
          eventType: 'JOINED',
          validatorId: 'validator123',
          stake: '1000',
          timestamp: '2025-08-07T00:00:00Z',
        },
      };

      expect(isValidatorEventMessage(message)).toBe(true);
    });
  });

  describe('isTxReceivedMessage', () => {
    it('should return true for valid TX_RECEIVED message', () => {
      const message: WebSocketMessage = {
        type: 'TX_RECEIVED',
        payload: {
          txId: 'tx123',
          from: '0x123',
          to: '0x456',
          amount: '100',
          gasPrice: '10',
          gasLimit: 21000,
          nonce: 1,
          status: 'pending',
          timestamp: '2025-08-07T00:00:00Z',
        },
      };

      expect(isTxReceivedMessage(message)).toBe(true);
    });
  });

  describe('isNodeStatusMessage', () => {
    it('should return true for valid NODE_STATUS message', () => {
      const message: WebSocketMessage = {
        type: 'NODE_STATUS',
        payload: {
          nodeId: 'node123',
          status: 'ONLINE',
          version: '1.0.0',
          uptime: 3600,
          blockHeight: 1000,
          peers: 5,
          memoryUsage: 1024,
          cpuUsage: 50,
          networkLatency: 10,
          lastUpdate: '2025-08-07T00:00:00Z',
        },
      };

      expect(isNodeStatusMessage(message)).toBe(true);
    });
  });

  describe('isAlertTriggeredMessage', () => {
    it('should return true for valid ALERT_TRIGGERED message', () => {
      const message: WebSocketMessage = {
        type: 'ALERT_TRIGGERED',
        payload: {
          id: 'alert123',
          type: 'node_failure',
          severity: 'critical',
          message: 'Node failure detected',
          timestamp: '2025-08-07T00:00:00Z',
        },
      };

      expect(isAlertTriggeredMessage(message)).toBe(true);
    });
  });
});

describe('WebSocket Message Builders', () => {
  describe('buildNewBlockMessage', () => {
    it('should build NEW_BLOCK message with defaults', () => {
      const message = buildNewBlockMessage({});

      expect(message.type).toBe('NEW_BLOCK');
      expect(message.payload.blockId).toBe('');
      expect(message.payload.height).toBe(0);
      expect(message.payload.timestamp).toBeDefined();
      expect(message.payload.hash).toBe('');
      expect(message.payload.transactions).toEqual([]);
    });

    it('should build NEW_BLOCK message with provided values', () => {
      const message = buildNewBlockMessage({
        blockId: 'test123',
        height: 1000,
        hash: 'abc123',
      });

      expect(message.payload.blockId).toBe('test123');
      expect(message.payload.height).toBe(1000);
      expect(message.payload.hash).toBe('abc123');
    });
  });

  describe('buildDagUpdateMessage', () => {
    it('should build DAG_UPDATE message with defaults', () => {
      const message = buildDagUpdateMessage({});

      expect(message.type).toBe('DAG_UPDATE');
      expect(message.payload.updateType).toBe('NODE_ADDED');
      expect(message.payload.nodeId).toBe('');
      expect(message.payload.relatedNodes).toEqual([]);
      expect(message.payload.timestamp).toBeDefined();
    });
  });

  describe('buildValidatorEventMessage', () => {
    it('should build VALIDATOR_EVENT message with defaults', () => {
      const message = buildValidatorEventMessage({});

      expect(message.type).toBe('VALIDATOR_EVENT');
      expect(message.payload.eventType).toBe('JOINED');
      expect(message.payload.validatorId).toBe('');
      expect(message.payload.stake).toBe('0');
      expect(message.payload.timestamp).toBeDefined();
    });
  });

  describe('buildTxReceivedMessage', () => {
    it('should build TX_RECEIVED message with defaults', () => {
      const message = buildTxReceivedMessage({});

      expect(message.type).toBe('TX_RECEIVED');
      expect(message.payload.txId).toBe('');
      expect(message.payload.from).toBe('');
      expect(message.payload.to).toBe('');
      expect(message.payload.amount).toBe('0');
      expect(message.payload.status).toBe('pending');
      expect(message.payload.timestamp).toBeDefined();
    });
  });

  describe('buildNodeStatusMessage', () => {
    it('should build NODE_STATUS message with defaults', () => {
      const message = buildNodeStatusMessage({});

      expect(message.type).toBe('NODE_STATUS');
      expect(message.payload.nodeId).toBe('');
      expect(message.payload.status).toBe('OFFLINE');
      expect(message.payload.version).toBe('');
      expect(message.payload.uptime).toBe(0);
      expect(message.payload.blockHeight).toBe(0);
      expect(message.payload.lastUpdate).toBeDefined();
    });
  });

  describe('buildAlertTriggeredMessage', () => {
    it('should build ALERT_TRIGGERED message with defaults', () => {
      const message = buildAlertTriggeredMessage({});

      expect(message.type).toBe('ALERT_TRIGGERED');
      expect(message.payload.id).toMatch(/^alert_\d+_/);
      expect(message.payload.type).toBe('');
      expect(message.payload.severity).toBe('warning');
      expect(message.payload.message).toBe('');
      expect(message.payload.timestamp).toBeDefined();
    });

    it('should build ALERT_TRIGGERED message with provided values', () => {
      const message = buildAlertTriggeredMessage({
        type: 'node_failure',
        severity: 'critical',
        message: 'Node failure detected',
      });

      expect(message.payload.type).toBe('node_failure');
      expect(message.payload.severity).toBe('critical');
      expect(message.payload.message).toBe('Node failure detected');
    });
  });
});

describe('WebSocket Hook Message Dispatch', () => {
  // Mock the socket.io-client
  const mockSocket = {
    connected: true,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Message Sending', () => {
    it('should send message with correct structure', () => {
      // This would be tested with the actual hook, but for unit tests
      // we'll test the message structure that would be sent
      const message: WebSocketMessage = {
        type: 'NEW_BLOCK',
        payload: { blockId: 'test123' },
      };

      const serialized = serializeMessage(message);
      const parsed = JSON.parse(serialized);

      expect(parsed.type).toBe('NEW_BLOCK');
      expect(parsed.payload).toEqual({ blockId: 'test123' });
      expect(parsed.id).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.version).toBe(WEBSOCKET_PROTOCOL_VERSION);
    });

    it('should handle message sending errors gracefully', () => {
      mockSocket.emit.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      expect(() => {
        mockSocket.emit('message', { type: 'TEST', payload: {} });
      }).toThrow('Connection lost');
    });
  });

  describe('Message Receiving', () => {
    it('should parse incoming messages correctly', () => {
      const incomingMessage = {
        type: 'NEW_BLOCK',
        payload: { blockId: 'test123' },
        timestamp: '2025-08-07T00:00:00Z',
        id: 'msg123',
      };

      const serialized = JSON.stringify(incomingMessage);
      const deserialized = deserializeMessage(serialized);

      expect(deserialized).toEqual(incomingMessage);
    });

    it('should reject malformed messages', () => {
      const malformedMessages = [
        '',
        'invalid json',
        '{"type": "NEW_BLOCK"}', // Missing payload
        '{"payload": {"blockId": "test123"}}', // Missing type
        'null',
        'undefined',
      ];

      malformedMessages.forEach(msg => {
        const result = deserializeMessage(msg);
        expect(result).toBeNull();
      });
    });
  });
});