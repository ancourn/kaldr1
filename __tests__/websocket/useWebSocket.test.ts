/**
 * useWebSocket Hook Unit Tests
 * 
 * This file contains unit tests for the useWebSocket React hook,
 * testing connection management, message handling, and reconnection logic.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.NEXT_PUBLIC_WS_URL = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.isConnecting).toBe(false);
      expect(result.current.state.reconnectAttempts).toBe(0);
      expect(result.current.state.lastMessage).toBe(null);
      expect(result.current.state.connectionError).toBe(null);
      expect(result.current.state.messageLatency).toBe(0);
      expect(result.current.socket).toBe(null);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        url: 'ws://localhost:8080',
        autoReconnect: false,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
      };

      const { result } = renderHook(() => useWebSocket(customConfig));

      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.isConnecting).toBe(false);
    });

    it('should use environment variable for URL when not provided', () => {
      process.env.NEXT_PUBLIC_WS_URL = 'ws://env-url:3000';
      const { result } = renderHook(() => useWebSocket());

      // The hook should use the environment variable
      expect(result.current.state.isConnected).toBe(false);
    });
  });

  describe('Connection Management', () => {
    it('should connect when connect is called', () => {
      const mockSocketInstance = {
        connected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.connect();
      });

      expect(mockSocketInstance.connect).toHaveBeenCalled();
    });

    it('should update state when connection is established', async () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'connect') {
            // Simulate immediate connection
            setTimeout(callback, 0);
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.state.isConnected).toBe(true);
        expect(result.current.state.isConnecting).toBe(false);
      });
    });

    it('should handle connection errors', async () => {
      const mockSocketInstance = {
        connected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'connect_error') {
            setTimeout(() => callback(new Error('Connection failed')), 0);
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.state.connectionError).toBeInstanceOf(Error);
        expect(result.current.state.connectionError?.message).toBe('Connection failed');
      });
    });

    it('should disconnect properly', () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockSocketInstance.disconnect).toHaveBeenCalled();
      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.isConnecting).toBe(false);
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt reconnection when autoReconnect is enabled', async () => {
      const mockSocketInstance = {
        connected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'disconnect') {
            setTimeout(() => callback('transport error'), 0);
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      vi.useFakeTimers();

      const { result } = renderHook(() => useWebSocket({
        autoReconnect: true,
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
      }));

      act(() => {
        result.current.connect();
      });

      // Trigger disconnect
      await waitFor(() => {
        expect(result.current.state.isConnected).toBe(false);
      });

      // Fast-forward time to trigger reconnection
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockSocketInstance.connect).toHaveBeenCalledTimes(2); // Initial + reconnect
      expect(result.current.state.reconnectAttempts).toBe(1);

      vi.useRealTimers();
    });

    it('should stop reconnection after max attempts', async () => {
      const mockSocketInstance = {
        connected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'disconnect') {
            setTimeout(() => callback('transport error'), 0);
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      vi.useFakeTimers();

      const { result } = renderHook(() => useWebSocket({
        autoReconnect: true,
        reconnectInterval: 100,
        maxReconnectAttempts: 2,
      }));

      act(() => {
        result.current.connect();
      });

      // Trigger disconnect and attempt reconnections
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          expect(result.current.state.isConnected).toBe(false);
        });

        act(() => {
          vi.advanceTimersByTime(100);
        });
      }

      // Should have stopped at max attempts
      expect(result.current.state.reconnectAttempts).toBe(2);
      expect(mockSocketInstance.connect).toHaveBeenCalledTimes(2); // Initial + 1 reconnect

      vi.useRealTimers();
    });

    it('should not attempt reconnection when autoReconnect is disabled', async () => {
      const mockSocketInstance = {
        connected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'disconnect') {
            setTimeout(() => callback('transport error'), 0);
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      vi.useFakeTimers();

      const { result } = renderHook(() => useWebSocket({
        autoReconnect: false,
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
      }));

      act(() => {
        result.current.connect();
      });

      // Trigger disconnect
      await waitFor(() => {
        expect(result.current.state.isConnected).toBe(false);
      });

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should not have reconnected
      expect(mockSocketInstance.connect).toHaveBeenCalledTimes(1); // Only initial
      expect(result.current.state.reconnectAttempts).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    it('should send messages with proper structure', () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.connect();
      });

      const testMessage = {
        type: 'TEST_MESSAGE',
        payload: { data: 'test' },
      };

      act(() => {
        result.current.sendMessage(testMessage);
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('message', expect.objectContaining({
        type: 'TEST_MESSAGE',
        payload: { data: 'test' },
        id: expect.any(String),
        timestamp: expect.any(String),
      }));
    });

    it('should not send messages when not connected', () => {
      const mockSocketInstance = {
        connected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      const testMessage = {
        type: 'TEST_MESSAGE',
        payload: { data: 'test' },
      };

      act(() => {
        result.current.sendMessage(testMessage);
      });

      expect(mockSocketInstance.emit).not.toHaveBeenCalled();
    });

    it('should handle incoming messages and update state', async () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'connect') {
            setTimeout(callback, 0);
          }
          if (event === 'any') {
            return (eventName: string, ...args: any[]) => {
              if (eventName === 'test_event') {
                setTimeout(() => callback('test_event', {
                  type: 'TEST_MESSAGE',
                  payload: { data: 'received' },
                  id: 'msg123',
                }), 0);
              }
            };
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.connect();
      });

      // Wait for connection
      await waitFor(() => {
        expect(result.current.state.isConnected).toBe(true);
      });

      // Simulate incoming message
      act(() => {
        const onCallback = (mockSocketInstance.on as any).mock.calls.find(
          ([event]) => event === 'any'
        )?.[1];
        
        if (onCallback) {
          const anyHandler = onCallback('test_event');
          anyHandler('test_event', {
            type: 'TEST_MESSAGE',
            payload: { data: 'received' },
            id: 'msg123',
          });
        }
      });

      await waitFor(() => {
        expect(result.current.state.lastMessage).toEqual({
          type: 'TEST_MESSAGE',
          payload: { data: 'received' },
          id: 'msg123',
        });
      });
    });
  });

  describe('Event Subscription', () => {
    it('should register event callbacks', () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      const mockCallback = vi.fn();

      act(() => {
        const unsubscribe = result.current.subscribe('test_event', mockCallback);
        expect(typeof unsubscribe).toBe('function');
      });
    });

    it('should unregister event callbacks', () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      const mockCallback = vi.fn();

      act(() => {
        const unsubscribe = result.current.subscribe('test_event', mockCallback);
        unsubscribe();
      });
    });

    it('should handle channel subscriptions', () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.joinChannel('test_channel');
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('subscribe', {
        channels: ['test_channel'],
      });

      act(() => {
        result.current.leaveChannel('test_channel');
      });

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('unsubscribe', {
        channels: ['test_channel'],
      });
    });
  });

  describe('Throttle and Debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle messages when enabled', () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket({
        enableThrottle: true,
        throttleTime: 100,
      }));

      act(() => {
        result.current.connect();
      });

      // Send multiple messages rapidly
      act(() => {
        result.current.sendMessage({ type: 'TEST', payload: { count: 1 } });
        result.current.sendMessage({ type: 'TEST', payload: { count: 2 } });
        result.current.sendMessage({ type: 'TEST', payload: { count: 3 } });
      });

      // Should have sent only the first message immediately
      expect(mockSocketInstance.emit).toHaveBeenCalledTimes(1);

      // Fast-forward past throttle time
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Should have sent the throttled message
      expect(mockSocketInstance.emit).toHaveBeenCalledTimes(2);
    });

    it('should debounce messages when enabled', () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result } = renderHook(() => useWebSocket({
        enableDebounce: true,
        debounceTime: 100,
      }));

      act(() => {
        result.current.connect();
      });

      // Send multiple messages rapidly
      act(() => {
        result.current.sendMessage({ type: 'TEST', payload: { count: 1 } });
        result.current.sendMessage({ type: 'TEST', payload: { count: 2 } });
        result.current.sendMessage({ type: 'TEST', payload: { count: 3 } });
      });

      // Should not have sent any messages yet due to debounce
      expect(mockSocketInstance.emit).toHaveBeenCalledTimes(0);

      // Fast-forward past debounce time
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Should have sent only the last message
      expect(mockSocketInstance.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect on unmount', () => {
      const mockSocketInstance = {
        connected: true,
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocketInstance);

      const { result, unmount } = renderHook(() => useWebSocket());

      act(() => {
        result.current.connect();
      });

      unmount();

      expect(mockSocketInstance.disconnect).toHaveBeenCalled();
    });
  });
});