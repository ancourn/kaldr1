import { BlockchainService } from '@/lib/legacy/blockchain-service';

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

describe('BlockchainService (Legacy)', () => {
  let service: BlockchainService;

  beforeEach(() => {
    service = new BlockchainService();
  });

  describe('Initialization', () => {
    it('should initialize blockchain service', async () => {
      await service.initializeBlockchain();
      
      const status = await service.getBlockchainStatus();
      const metrics = await service.getNetworkMetrics();
      
      expect(status).toBeDefined();
      expect(status.network_status).toBe('online');
      expect(status.network_peers).toBe(12);
      expect(metrics).toBeDefined();
      expect(metrics.node_health_score).toBe(98.2);
    });

    it('should not initialize twice when called explicitly', async () => {
      const service = new BlockchainService();
      
      // First call should initialize
      await service.initializeBlockchain();
      expect((service as any).initialized).toBe(true);
      
      // Second call should return early
      const blockchainStatusBefore = (service as any).blockchainStatus;
      await service.initializeBlockchain();
      const blockchainStatusAfter = (service as any).blockchainStatus;
      
      // The blockchain status should be the same (not reinitialized)
      expect(blockchainStatusBefore).toBe(blockchainStatusAfter);
    });
  });

  describe('Blockchain Status', () => {
    beforeEach(async () => {
      await service.initializeBlockchain();
    });

    it('should return blockchain status', async () => {
      const status = await service.getBlockchainStatus();
      
      expect(status).toHaveProperty('network_status');
      expect(status).toHaveProperty('network_peers');
      expect(status).toHaveProperty('consensus_height');
      expect(status).toHaveProperty('transactions_per_second');
      expect(status).toHaveProperty('last_block_timestamp');
      
      expect(status.network_status).toBe('online');
      expect(status.network_peers).toBe(12);
      expect(status.consensus_height).toBe(15372);
      expect(status.transactions_per_second).toBe(1250);
    });
  });

  describe('Network Metrics', () => {
    beforeEach(async () => {
      await service.initializeBlockchain();
    });

    it('should return network metrics', async () => {
      const metrics = await service.getNetworkMetrics();
      
      expect(metrics).toHaveProperty('network_latency');
      expect(metrics).toHaveProperty('network_throughput');
      expect(metrics).toHaveProperty('node_health_score');
      expect(metrics).toHaveProperty('consensus_health');
      
      expect(metrics.network_latency).toBe(45);
      expect(metrics.network_throughput).toBe(85.5);
      expect(metrics.node_health_score).toBe(98.2);
      expect(metrics.consensus_health).toBe(99.1);
    });
  });

  describe('Consensus Information', () => {
    it('should return consensus information', async () => {
      const consensus = await service.getConsensusInfo();
      
      expect(consensus).toHaveProperty('type');
      expect(consensus).toHaveProperty('shard_count');
      expect(consensus).toHaveProperty('validators');
      expect(consensus).toHaveProperty('consensus_height');
      expect(consensus).toHaveProperty('last_block_time');
      expect(consensus).toHaveProperty('health_score');
      
      expect(consensus.type).toBe('QuantumDAG');
      expect(consensus.shard_count).toBe(16);
      expect(consensus.validators).toBe(7);
      expect(consensus.consensus_height).toBe(15372);
      expect(consensus.last_block_time).toBe(800);
      expect(consensus.health_score).toBe(98.5);
    });
  });

  describe('Transaction Statistics', () => {
    it('should return transaction statistics', async () => {
      const stats = await service.getTransactionStats();
      
      expect(stats).toHaveProperty('total_transactions');
      expect(stats).toHaveProperty('successful_transactions');
      expect(stats).toHaveProperty('failed_transactions');
      expect(stats).toHaveProperty('average_gas_price');
      expect(stats).toHaveProperty('average_block_time');
      
      expect(stats.total_transactions).toBe(245680);
      expect(stats.successful_transactions).toBe(245120);
      expect(stats.failed_transactions).toBe(560);
      expect(stats.average_gas_price).toBe(20000000000);
      expect(stats.average_block_time).toBe(820);
    });

    it('should calculate success rate correctly', async () => {
      const stats = await service.getTransactionStats();
      const successRate = (stats.successful_transactions / stats.total_transactions) * 100;
      
      expect(successRate).toBeCloseTo(99.77, 2);
    });
  });

  describe('Validator Information', () => {
    it('should return validator information', async () => {
      const validatorInfo = await service.getValidatorInfo();
      
      expect(validatorInfo).toHaveProperty('total_validators');
      expect(validatorInfo).toHaveProperty('active_validators');
      expect(validatorInfo).toHaveProperty('minimum_stake');
      expect(validatorInfo).toHaveProperty('total_staked');
      expect(validatorInfo).toHaveProperty('average_reward_rate');
      
      expect(validatorInfo.total_validators).toBe(7);
      expect(validatorInfo.active_validators).toBe(7);
      expect(validatorInfo.minimum_stake).toBe('1000000000000000000000');
      expect(validatorInfo.total_staked).toBe('2500000000000000000000000000');
      expect(validatorInfo.average_reward_rate).toBe(5.2);
    });
  });

  describe('Network Topology', () => {
    it('should return network topology', async () => {
      const topology = await service.getNetworkTopology();
      
      expect(topology).toHaveProperty('total_nodes');
      expect(topology).toHaveProperty('regions');
      expect(topology).toHaveProperty('average_latency');
      expect(topology).toHaveProperty('network_partition_resistance');
      expect(topology).toHaveProperty('byzantine_fault_tolerance');
      
      expect(topology.total_nodes).toBe(12);
      expect(Array.isArray(topology.regions)).toBe(true);
      expect(topology.regions).toEqual(['US-East', 'EU-West', 'Asia-Pacific']);
      expect(topology.average_latency).toBe(45);
      expect(topology.network_partition_resistance).toBe('HIGH');
      expect(topology.byzantine_fault_tolerance).toBe('66%');
    });
  });

  describe('Security Metrics', () => {
    it('should return security metrics', async () => {
      const security = await service.getSecurityMetrics();
      
      expect(security).toHaveProperty('vulnerability_score');
      expect(security).toHaveProperty('attack_attempts_detected');
      expect(security).toHaveProperty('attack_attempts_prevented');
      expect(security).toHaveProperty('audit_status');
      expect(security).toHaveProperty('last_audit_date');
      
      expect(security.vulnerability_score).toBe(95);
      expect(security.attack_attempts_detected).toBe(0);
      expect(security.attack_attempts_prevented).toBe(0);
      expect(security.audit_status).toBe('PASSED');
      expect(security.last_audit_date).toBe(mockDate.toISOString());
    });
  });

  describe('Economic Metrics', () => {
    it('should return economic metrics', async () => {
      const economic = await service.getEconomicMetrics();
      
      expect(economic).toHaveProperty('total_supply');
      expect(economic).toHaveProperty('circulating_supply');
      expect(economic).toHaveProperty('staked_supply');
      expect(economic).toHaveProperty('burned_supply');
      expect(economic).toHaveProperty('token_symbol');
      expect(economic).toHaveProperty('decimals');
      expect(economic).toHaveProperty('current_price_usd');
      
      expect(economic.total_supply).toBe('10000000000000000000000000000');
      expect(economic.circulating_supply).toBe('2500000000000000000000000000');
      expect(economic.staked_supply).toBe('2500000000000000000000000000');
      expect(economic.burned_supply).toBe('0');
      expect(economic.token_symbol).toBe('KALD');
      expect(economic.decimals).toBe(18);
      expect(economic.current_price_usd).toBe(0.85);
    });
  });

  describe('Auto-initialization', () => {
    it('should auto-initialize when calling methods', async () => {
      const service = new BlockchainService();
      
      // Call a method that requires initialization
      const status = await service.getBlockchainStatus();
      
      expect(status).toBeDefined();
      expect(status.network_status).toBe('online');
    });

    it('should auto-initialize for network metrics', async () => {
      const service = new BlockchainService();
      
      const metrics = await service.getNetworkMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.node_health_score).toBe(98.2);
    });
  });
});