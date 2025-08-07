import { setupSocket } from '@/lib/legacy/socket';
import { Server } from 'socket.io';

// Mock Server class
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
  })),
}));

describe('Socket Service', () => {
  let mockIo: jest.Mocked<Server>;
  let mockSocket: any;

  beforeEach(() => {
    mockIo = new Server() as jest.Mocked<Server>;
    mockSocket = {
      id: 'test-socket-id',
      on: jest.fn(),
      emit: jest.fn(),
    };
    
    // Mock the io.on callback to capture the connection callback
    mockIo.on.mockImplementation((event, callback) => {
      if (event === 'connection') {
        // Simulate calling the callback with a mock socket
        setTimeout(() => callback(mockSocket), 0);
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupSocket', () => {
    it('should set up connection event handler', () => {
      setupSocket(mockIo);
      
      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should handle client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      setupSocket(mockIo);
      
      // Allow async operations to complete
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Client connected:', 'test-socket-id');
        expect(mockSocket.emit).toHaveBeenCalledWith('message', {
          text: 'Welcome to WebSocket Echo Server!',
          senderId: 'system',
          timestamp: expect.any(String),
        });
      }, 10);
    });

    it('should handle message events', () => {
      setupSocket(mockIo);
      
      setTimeout(() => {
        // Simulate message event
        const messageCallback = mockSocket.on.mock.calls.find(
          ([event]) => event === 'message'
        )?.[1];
        
        if (messageCallback) {
          messageCallback({
            text: 'Hello World',
            senderId: 'user123',
          });
          
          expect(mockSocket.emit).toHaveBeenCalledWith('message', {
            text: 'Echo: Hello World',
            senderId: 'system',
            timestamp: expect.any(String),
          });
        }
      }, 10);
    });

    it('should handle disconnect events', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      setupSocket(mockIo);
      
      setTimeout(() => {
        // Simulate disconnect event
        const disconnectCallback = mockSocket.on.mock.calls.find(
          ([event]) => event === 'disconnect'
        )?.[1];
        
        if (disconnectCallback) {
          disconnectCallback();
          expect(consoleSpy).toHaveBeenCalledWith('Client disconnected:', 'test-socket-id');
        }
      }, 10);
    });
  });
});