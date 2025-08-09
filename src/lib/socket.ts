import { Server } from 'socket.io';

interface ChatMessage {
  text: string;
  senderId: string;
  timestamp?: string;
  type?: 'user' | 'assistant' | 'system';
}

interface AIRequest {
  type: 'chat' | 'image' | 'search';
  data: any;
  requestId: string;
}

interface AIResponse {
  type: 'chat' | 'image' | 'search';
  data: any;
  requestId: string;
  success: boolean;
  error?: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join a room for general updates
    socket.join('general');
    
    // Handle chat messages
    socket.on('message', (msg: ChatMessage) => {
      const response: ChatMessage = {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      
      // Send back to the same client
      socket.emit('message', response);
      
      // Broadcast to other clients in the room
      socket.to('general').emit('message', {
        ...msg,
        timestamp: new Date().toISOString()
      });
    });

    // Handle AI requests
    socket.on('ai-request', async (request: AIRequest) => {
      try {
        let response: AIResponse;
        
        switch (request.type) {
          case 'chat':
            // Simulate AI chat response
            setTimeout(() => {
              response = {
                type: 'chat',
                data: {
                  message: 'This is a simulated AI chat response via WebSocket.',
                  timestamp: new Date().toISOString()
                },
                requestId: request.requestId,
                success: true
              };
              socket.emit('ai-response', response);
            }, 1000);
            break;
            
          case 'image':
            // Simulate image generation
            setTimeout(() => {
              response = {
                type: 'image',
                data: {
                  image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNTAiIGZpbGw9IiM0Rjc1RkYiLz4KPC9zdmc+',
                  prompt: request.data.prompt,
                  timestamp: new Date().toISOString()
                },
                requestId: request.requestId,
                success: true
              };
              socket.emit('ai-response', response);
            }, 2000);
            break;
            
          case 'search':
            // Simulate web search
            setTimeout(() => {
              response = {
                type: 'search',
                data: {
                  results: [
                    {
                      url: 'https://example.com',
                      name: 'Example Result',
                      snippet: 'This is a simulated search result.',
                      host_name: 'example.com',
                      rank: 1,
                      date: new Date().toISOString(),
                      favicon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiIGZpbGw9IiM0Rjc1RkYiLz4KPC9zdmc+'
                    }
                  ],
                  query: request.data.query,
                  timestamp: new Date().toISOString()
                },
                requestId: request.requestId,
                success: true
              };
              socket.emit('ai-response', response);
            }, 1500);
            break;
            
          default:
            response = {
              type: request.type,
              data: null,
              requestId: request.requestId,
              success: false,
              error: 'Unsupported request type'
            };
            socket.emit('ai-response', response);
        }
      } catch (error) {
        const errorResponse: AIResponse = {
          type: request.type,
          data: null,
          requestId: request.requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        socket.emit('ai-response', errorResponse);
      }
    });

    // Handle room joining
    socket.on('join-room', (room: string) => {
      socket.join(room);
      socket.emit('message', {
        text: `Joined room: ${room}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      });
    });

    // Handle room leaving
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      socket.emit('message', {
        text: `Left room: ${room}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      });
    });

    // Handle broadcasting to room
    socket.on('broadcast-to-room', (data: { room: string; message: ChatMessage }) => {
      socket.to(data.room).emit('message', {
        ...data.message,
        timestamp: new Date().toISOString()
      });
    });

    // Handle typing indicators
    socket.on('typing', (data: { isTyping: boolean; room?: string }) => {
      const targetRoom = data.room || 'general';
      socket.to(targetRoom).emit('user-typing', {
        userId: socket.id,
        isTyping: data.isTyping,
        timestamp: new Date().toISOString()
      });
    });

    // Handle real-time status updates
    socket.on('status-update', (status: { type: string; data: any }) => {
      socket.to('general').emit('status-update', {
        ...status,
        timestamp: new Date().toISOString(),
        sourceId: socket.id
      });
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to KALDRIX WebSocket Server! You can now use real-time AI features.',
      senderId: 'system',
      timestamp: new Date().toISOString(),
      type: 'system'
    });

    // Broadcast user joined
    socket.to('general').emit('message', {
      text: 'A new user joined the session',
      senderId: 'system',
      timestamp: new Date().toISOString(),
      type: 'system'
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      socket.to('general').emit('message', {
        text: 'A user left the session',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      });
    });
  });

  // Periodic status broadcast
  setInterval(() => {
    io.to('general').emit('status-update', {
      type: 'server-health',
      data: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connectedClients: io.engine.clientsCount,
        timestamp: new Date().toISOString()
      }
    });
  }, 30000); // Every 30 seconds
};