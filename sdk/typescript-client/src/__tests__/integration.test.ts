import { DevAssistantClient } from '../src/client';
import { HealthResponse, ChatRequest, ChatResponse, ImageRequest, ImageResponse, SearchRequest, SearchResponse } from '../src/types';

describe('DevAssistantClient Integration Tests', () => {
  let client: DevAssistantClient;
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';

  beforeAll(() => {
    client = new DevAssistantClient({
      baseURL: baseUrl,
      timeout: 30000,
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await client.health.getHealth();
      
      expect(response.status).toBe('healthy');
      expect(response.timestamp).toBeDefined();
      expect(response.services).toBeDefined();
      expect(response.services.server).toBe('online');
      expect(response.endpoints).toBeDefined();
      expect(response.endpoints.health).toBe('/api/health');
    });

    test('should handle connection errors', async () => {
      const invalidClient = new DevAssistantClient({
        baseURL: 'http://localhost:9999',
        timeout: 5000,
      });

      await expect(invalidClient.health.getHealth()).rejects.toThrow();
    });
  });

  describe('Chat API', () => {
    test('should send chat message and receive response', async () => {
      const request: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?'
          }
        ]
      };

      const response: ChatResponse = await client.chat.createChatCompletion(request);
      
      expect(response.success).toBe(true);
      expect(response.response).toBeDefined();
      expect(response.timestamp).toBeDefined();
      expect(typeof response.response).toBe('string');
    });

    test('should handle invalid chat requests', async () => {
      const invalidRequest: ChatRequest = {
        messages: [] as any
      };

      await expect(client.chat.createChatCompletion(invalidRequest)).rejects.toThrow();
    });

    test('should handle empty messages', async () => {
      const invalidRequest: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: ''
          }
        ]
      };

      await expect(client.chat.createChatCompletion(invalidRequest)).rejects.toThrow();
    });
  });

  describe('Image Generation API', () => {
    test('should generate image from prompt', async () => {
      const request: ImageRequest = {
        prompt: 'A beautiful sunset over mountains',
        size: '1024x1024'
      };

      const response: ImageResponse = await client.image.generateImage(request);
      
      expect(response.success).toBe(true);
      expect(response.image).toBeDefined();
      expect(response.size).toBe('1024x1024');
      expect(response.timestamp).toBeDefined();
      expect(typeof response.image).toBe('string');
      expect(response.image.startsWith('data:image/')).toBe(true);
    });

    test('should handle invalid image requests', async () => {
      const invalidRequest: ImageRequest = {
        prompt: '',
        size: '1024x1024'
      };

      await expect(client.image.generateImage(invalidRequest)).rejects.toThrow();
    });

    test('should use default size when not specified', async () => {
      const request: ImageRequest = {
        prompt: 'A simple test image'
      };

      const response: ImageResponse = await client.image.generateImage(request);
      
      expect(response.success).toBe(true);
      expect(response.image).toBeDefined();
      expect(response.size).toBe('1024x1024'); // default size
    });
  });

  describe('Web Search API', () => {
    test('should perform web search', async () => {
      const request: SearchRequest = {
        query: 'What is artificial intelligence?',
        num: 5
      };

      const response: SearchResponse = await client.search.webSearch(request);
      
      expect(response.success).toBe(true);
      expect(response.results).toBeDefined();
      expect(Array.isArray(response.results)).toBe(true);
      expect(response.query).toBe('What is artificial intelligence?');
      expect(response.timestamp).toBeDefined();
      
      if (response.results.length > 0) {
        const firstResult = response.results[0];
        expect(firstResult.url).toBeDefined();
        expect(firstResult.name).toBeDefined();
        expect(firstResult.snippet).toBeDefined();
      }
    });

    test('should handle empty search query', async () => {
      const invalidRequest: SearchRequest = {
        query: '',
        num: 5
      };

      await expect(client.search.webSearch(invalidRequest)).rejects.toThrow();
    });

    test('should use default num when not specified', async () => {
      const request: SearchRequest = {
        query: 'Test search query'
      };

      const response: SearchResponse = await client.search.webSearch(request);
      
      expect(response.success).toBe(true);
      expect(response.results).toBeDefined();
    });

    test('should handle large num parameter', async () => {
      const request: SearchRequest = {
        query: 'Technology news',
        num: 20
      };

      const response: SearchResponse = await client.search.webSearch(request);
      
      expect(response.success).toBe(true);
      expect(response.results).toBeDefined();
      expect(response.results.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Error Handling', () => {
    test('should handle network timeouts', async () => {
      const timeoutClient = new DevAssistantClient({
        baseURL: baseUrl,
        timeout: 1, // 1ms timeout
      });

      await expect(timeoutClient.health.getHealth()).rejects.toThrow();
    });

    test('should handle malformed responses', async () => {
      // This test would require mocking a malformed response
      // For now, we'll test with a non-existent endpoint
      await expect((client as any).get('/api/non-existent')).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = [];
      const numRequests = 5;
      
      for (let i = 0; i < numRequests; i++) {
        requests.push(client.health.getHealth());
      }
      
      const results = await Promise.allSettled(requests);
      
      // All requests should either succeed or fail gracefully
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe('healthy');
        } else {
          // Should fail with a rate limit error or timeout
          expect(result.reason).toBeDefined();
        }
      });
    });
  });

  describe('Authentication', () => {
    test('should work without authentication for public endpoints', async () => {
      const response = await client.health.getHealth();
      expect(response.status).toBe('healthy');
    });

    test('should handle authentication errors if required', async () => {
      // This test assumes the API might require authentication in the future
      // For now, it tests that the client handles auth headers properly
      const authClient = new DevAssistantClient({
        baseURL: baseUrl,
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      // This should either work (if auth is not required) or fail gracefully
      try {
        const response = await authClient.health.getHealth();
        expect(response.status).toBe('healthy');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle concurrent requests', async () => {
      const promises = [
        client.health.getHealth(),
        client.chat.createChatCompletion({
          messages: [{ role: 'user', content: 'Test message 1' }]
        }),
        client.search.webSearch({
          query: 'concurrent test',
          num: 3
        })
      ];

      const results = await Promise.allSettled(promises);
      
      // All requests should complete without throwing
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });
});