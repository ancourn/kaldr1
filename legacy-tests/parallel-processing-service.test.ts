import { ParallelProcessingService } from '@/lib/legacy/parallel-processing-service';

// Mock the missing dependencies
jest.mock('@/lib/legacy/parallel-processor', () => {
  return jest.fn().mockImplementation((maxWorkers) => ({
    submitJob: jest.fn().mockResolvedValue({ id: 'job_1', status: 'completed' }),
    getStats: jest.fn().mockReturnValue({
      throughput: 1250,
      activeWorkers: maxWorkers,
      completedJobs: 100,
      totalJobs: 100
    }),
    shutdown: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
  }))
});

jest.mock('@/lib/legacy/transaction-batcher', () => {
  return jest.fn().mockImplementation((config) => ({
    addTransaction: jest.fn().mockResolvedValue('batch_1'),
    getQueueSize: jest.fn().mockReturnValue(0),
    getStats: jest.fn().mockReturnValue({
      batchSize: config.maxSize,
      queueSize: 0
    }),
    shutdown: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
  }))
});

jest.mock('@/lib/legacy/load-balancer', () => {
  return jest.fn().mockImplementation((config) => ({
    addNode: jest.fn(),
    removeNode: jest.fn(),
    getNodeStatus: jest.fn().mockReturnValue({
      id: 'node_1',
      quantumReady: true
    }),
    getStats: jest.fn().mockReturnValue({
      healthyNodes: config.maxWorkers || 4
    }),
    shutdown: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
  }))
});

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date = class extends Date {
  constructor() {
    super();
    return mockDate;
  }
  
  static now() {
    return mockDate.getTime();
  }
};

describe('ParallelProcessingService (Legacy)', () => {
  let service: ParallelProcessingService;

  beforeEach(() => {
    service = new ParallelProcessingService();
  });

  describe('Initialization', () => {
    it('should initialize parallel processing service', async () => {
      await service.start();
      
      expect(service).toBeDefined();
      // The service should be running after start
      expect((service as any).isRunning).toBe(true);
    });

    it('should not start twice when already running', async () => {
      await service.start();
      expect((service as any).isRunning).toBe(true);
      
      // Second call should return early
      await service.start();
      expect((service as any).isRunning).toBe(true);
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop service correctly', async () => {
      await service.start();
      expect((service as any).isRunning).toBe(true);
      
      await service.stop();
      expect((service as any).isRunning).toBe(false);
    });

    it('should handle stop when not running', async () => {
      expect((service as any).isRunning).toBe(false);
      
      // Should not throw error
      await service.stop();
      expect((service as any).isRunning).toBe(false);
    });
  });

  describe('Transaction Processing', () => {
    beforeEach(async () => {
      await service.start();
    });

    it('should process single transaction', async () => {
      const transaction = {
        id: 'tx_1',
        from: '0x123',
        to: '0x456',
        amount: 100,
        data: 'test data',
        gasLimit: 21000,
        quantumSignature: 'sig_123'
      };
      
      const result = await service.processTransaction(transaction);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('batchId');
      expect(result).toHaveProperty('result');
    });

    it('should process transaction with priority', async () => {
      const transaction = {
        id: 'tx_1',
        from: '0x123',
        to: '0x456',
        amount: 100,
        data: 'test data',
        gasLimit: 21000,
        quantumSignature: 'sig_123',
        priority: 10
      };
      
      const result = await service.processTransaction(transaction);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('batchId');
      expect(result).toHaveProperty('result');
    });

    it('should reject transaction processing when service is not running', async () => {
      await service.stop();
      
      const transaction = {
        id: 'tx_1',
        from: '0x123',
        to: '0x456',
        amount: 100,
        data: 'test data',
        gasLimit: 21000,
        quantumSignature: 'sig_123'
      };
      
      await expect(service.processTransaction(transaction)).rejects.toThrow('Service is not running');
    });

    it('should process batch of transactions', async () => {
      const transactions = [
        {
          id: 'tx_1',
          from: '0x123',
          to: '0x456',
          amount: 100,
          data: 'test data 1',
          gasLimit: 21000,
          quantumSignature: 'sig_123'
        },
        {
          id: 'tx_2',
          from: '0x456',
          to: '0x789',
          amount: 200,
          data: 'test data 2',
          gasLimit: 21000,
          quantumSignature: 'sig_456'
        }
      ];
      
      const result = await service.processBatch(transactions);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('batchId');
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBe(transactions.length);
    });
  });

  describe('Quantum Operations', () => {
    beforeEach(async () => {
      await service.start();
    });

    it('should process quantum validation', async () => {
      const quantumData = {
        signature: 'quantum_sig',
        data: 'test quantum data'
      };
      
      const result = await service.processQuantumValidation(quantumData);
      
      expect(result).toBeDefined();
    });

    it('should process DAG traversal', async () => {
      const dagData = {
        nodeId: 'node_1',
        traversalDepth: 3
      };
      
      const result = await service.processDAGTraversal(dagData);
      
      expect(result).toBeDefined();
    });
  });

  describe('Metrics and Performance', () => {
    beforeEach(async () => {
      await service.start();
    });

    it('should return processing metrics', () => {
      const metrics = service.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('tps');
      expect(metrics).toHaveProperty('avgLatency');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('activeWorkers');
      expect(metrics).toHaveProperty('queueSize');
      expect(metrics).toHaveProperty('nodeCount');
      expect(metrics).toHaveProperty('quantumNodes');
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('networkBandwidth');
    });

    it('should return performance benchmarks', () => {
      const benchmarks = service.getBenchmarks();
      
      expect(benchmarks).toBeDefined();
      expect(Array.isArray(benchmarks)).toBe(true);
    });

    it('should return performance summary', () => {
      const summary = service.getPerformanceSummary();
      
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('currentTps');
      expect(summary).toHaveProperty('targetTps');
      expect(summary).toHaveProperty('progress');
      expect(summary).toHaveProperty('avgLatency');
      expect(summary).toHaveProperty('uptime');
      expect(summary).toHaveProperty('totalProcessed');
      expect(summary).toHaveProperty('successRate');
    });
  });

  describe('Worker Node Management', () => {
    beforeEach(async () => {
      await service.start();
    });

    it('should add worker node', async () => {
      const node = {
        id: 'worker_new',
        address: '127.0.0.1',
        port: 9000,
        region: 'eu-west',
        quantumReady: true
      };
      
      await service.addWorkerNode(node);
      
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should remove worker node', async () => {
      const nodeId = 'worker_1';
      
      await service.removeWorkerNode(nodeId);
      
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should return component stats', () => {
      const stats = service.getComponentStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('processor');
      expect(stats).toHaveProperty('batcher');
      expect(stats).toHaveProperty('loadBalancer');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during transaction processing', async () => {
      await service.start();
      
      const transaction = {
        id: 'tx_1',
        from: '0x123',
        to: '0x456',
        amount: 100,
        data: 'test data',
        gasLimit: 21000,
        quantumSignature: 'sig_123'
      };
      
      // Mock the processor to throw an error
      const processor = (service as any).processor;
      processor.submitJob = jest.fn().mockRejectedValue(new Error('Processing error'));
      
      await expect(service.processTransaction(transaction)).rejects.toThrow('Processing error');
    });

    it('should handle errors during batch processing', async () => {
      await service.start();
      
      const transactions = [
        {
          id: 'tx_1',
          from: '0x123',
          to: '0x456',
          amount: 100,
          data: 'test data',
          gasLimit: 21000,
          quantumSignature: 'sig_123'
        }
      ];
      
      // Mock the processor to throw an error
      const processor = (service as any).processor;
      processor.submitJob = jest.fn().mockRejectedValue(new Error('Batch processing error'));
      
      await expect(service.processBatch(transactions)).rejects.toThrow('Batch processing error');
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when no config provided', () => {
      const service = new ParallelProcessingService();
      
      expect(service).toBeDefined();
      expect((service as any).config).toBeDefined();
      expect((service as any).config.maxWorkers).toBe(4);
      expect((service as any).config.batchSize).toBe(50);
      expect((service as any).config.loadBalancingStrategy).toBe('least-connections');
    });

    it('should use custom configuration when provided', () => {
      const customConfig = {
        maxWorkers: 8,
        batchSize: 100,
        loadBalancingStrategy: 'round-robin' as const
      };
      
      const service = new ParallelProcessingService(customConfig);
      
      expect(service).toBeDefined();
      expect((service as any).config.maxWorkers).toBe(8);
      expect((service as any).config.batchSize).toBe(100);
      expect((service as any).config.loadBalancingStrategy).toBe('round-robin');
    });
  });

  describe('Event Emission', () => {
    it('should emit events during service lifecycle', async () => {
      const service = new ParallelProcessingService();
      
      const startSpy = jest.fn();
      const stopSpy = jest.fn();
      
      service.on('service_started', startSpy);
      service.on('service_stopped', stopSpy);
      
      await service.start();
      expect(startSpy).toHaveBeenCalled();
      
      await service.stop();
      expect(stopSpy).toHaveBeenCalled();
    });
  });
});