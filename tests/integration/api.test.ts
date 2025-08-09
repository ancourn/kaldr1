import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { apiResolver } from 'next/dist/server/api-utils/node';
import handler from '@/pages/api/blockchain/status';

describe('API Integration Tests', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Create test server
    server = createServer(async (req, res) => {
      try {
        await apiResolver(
          req,
          res,
          undefined,
          handler,
          {
            previewModeId: '',
            previewModeEncryptionKey: '',
            previewModeSigningKey: '',
          },
          false
        );
      } catch (error) {
        console.error('API Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(resolve));
    }
  });

  describe('Blockchain Status API', () => {
    it('should return blockchain status', async () => {
      const response = await fetch(`${baseUrl}/api/blockchain/status`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('networks');
      expect(data).toHaveProperty('lastUpdated');
    });

    it('should handle CORS headers', async () => {
      const response = await fetch(`${baseUrl}/api/blockchain/status`);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('should return JSON content type', async () => {
      const response = await fetch(`${baseUrl}/api/blockchain/status`);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid endpoints', async () => {
      const response = await fetch(`${baseUrl}/api/invalid-endpoint`);
      expect(response.status).toBe(404);
    });

    it('should handle invalid methods', async () => {
      const response = await fetch(`${baseUrl}/api/blockchain/status`, {
        method: 'POST',
      });
      expect(response.status).toBe(405);
    });
  });
});