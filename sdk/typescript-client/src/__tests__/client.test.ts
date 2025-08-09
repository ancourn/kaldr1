import { DevAssistantClient, DevAssistantError } from '../client';
import { mock } from './setup';

describe('DevAssistantClient', () => {
  const client = new DevAssistantClient({
    baseURL: 'https://api.kaldrix.com',
    apiKey: 'test-api-key',
  });

  describe('analyzeContract', () => {
    it('should analyze a contract successfully', async () => {
      const mockResponse = {
        contract_id: 'test-contract',
        analysis_timestamp: '2024-01-01T00:00:00Z',
        issues_found: [],
        gas_analysis: {
          total_gas: 100000,
          optimization_potential: 10.0,
          high_cost_functions: [],
        },
        security_score: 95.0,
        performance_score: 90.0,
      };

      mock.onGet('/contracts/test-contract/analyze').reply(200, mockResponse);

      const result = await client.analyzeContract('test-contract');
      
      expect(result.contract_id).toBe('test-contract');
      expect(result.security_score).toBe(95.0);
      expect(result.issues_found).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        error: 'Contract not found',
        code: 'NOT_FOUND',
        timestamp: '2024-01-01T00:00:00Z',
      };

      mock.onGet('/contracts/invalid-contract/analyze').reply(404, errorResponse);

      await expect(client.analyzeContract('invalid-contract')).rejects.toThrow(DevAssistantError);
    });
  });

  describe('optimizeContract', () => {
    it('should optimize a contract successfully', async () => {
      const mockRequest = {
        contract_code: 'contract Test { }',
        optimization_level: 'basic' as const,
      };

      const mockResponse = {
        optimized_code: 'contract Optimized { }',
        optimization_summary: {
          gas_reduction_percent: 15.0,
          optimizations_applied: [],
          original_gas_estimate: 100000,
          optimized_gas_estimate: 85000,
        },
        warnings: [],
        optimization_timestamp: '2024-01-01T00:00:00Z',
      };

      mock.onPost('/contracts/optimize', mockRequest).reply(200, mockResponse);

      const result = await client.optimizeContract(mockRequest);
      
      expect(result.optimized_code).toBe('contract Optimized { }');
      expect(result.optimization_summary.gas_reduction_percent).toBe(15.0);
    });

    it('should handle validation errors', async () => {
      const invalidRequest = {
        contract_code: '',
      };

      mock.onPost('/contracts/optimize', invalidRequest).reply(400, {
        error: 'contract_code is required',
        code: 'VALIDATION_ERROR',
        timestamp: '2024-01-01T00:00:00Z',
      });

      await expect(client.optimizeContract(invalidRequest as any)).rejects.toThrow(DevAssistantError);
    });
  });

  describe('healthCheck', () => {
    it('should return health status successfully', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0.0',
        services: {
          server: 'online',
          database: 'connected',
          ai_services: 'active',
        },
      };

      mock.onGet('/health').reply(200, mockResponse);

      const result = await client.healthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.version).toBe('1.0.0');
      expect(result.services.ai_services).toBe('active');
    });
  });

  describe('configuration', () => {
    it('should update API key', () => {
      const newApiKey = 'new-api-key';
      client.updateApiKey(newApiKey);
      
      expect(client.getConfig().apiKey).toBe(newApiKey);
    });

    it('should update base URL', () => {
      const newBaseURL = 'https://new-api.kaldrix.com';
      client.updateBaseURL(newBaseURL);
      
      expect(client.getConfig().baseURL).toBe(newBaseURL);
    });

    it('should create new client with modified config', () => {
      const newClient = client.withConfig({
        apiKey: 'different-key',
      });
      
      expect(newClient.getConfig().apiKey).toBe('different-key');
      expect(newClient.getConfig().baseURL).toBe(client.getConfig().baseURL);
    });
  });
});