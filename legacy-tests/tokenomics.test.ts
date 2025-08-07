import { TokenomicsModel } from '@/lib/legacy/tokenomics';

// Mock the dependencies that are missing
jest.mock('@/lib/utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

jest.mock('@/lib/db', () => ({
  Database: jest.fn().mockImplementation(() => ({
    tokenomicsHistory: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({})
    },
    block: {
      findFirst: jest.fn().mockResolvedValue({ height: 1000 })
    },
    kaldTransaction: {
      count: jest.fn().mockResolvedValue(500)
    },
    kaldBalance: {
      count: jest.fn().mockResolvedValue(1000)
    }
  }))
}));

// Mock the native-coin dependency
jest.mock('@/lib/legacy/native-coin', () => ({
  KaldNativeCoin: jest.fn().mockImplementation(() => ({
    getSupplyInfo: jest.fn().mockResolvedValue({
      totalSupply: 10000000000000000000000000000n,
      circulatingSupply: 2500000000000000000000000000n,
      stakedSupply: 2500000000000000000000000000n,
      burnedSupply: 0n
    })
  }))
}));

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

describe('TokenomicsModel (Legacy)', () => {
  let tokenomics: TokenomicsModel;
  let mockKaldCoin: any;
  let mockDb: any;

  beforeEach(() => {
    // Create mock instances
    mockKaldCoin = {
      getSupplyInfo: jest.fn().mockResolvedValue({
        totalSupply: 10000000000000000000000000000n,
        circulatingSupply: 2500000000000000000000000000n,
        stakedSupply: 2500000000000000000000000000n,
        burnedSupply: 0n
      })
    };

    mockDb = {
      tokenomicsHistory: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({})
      },
      block: {
        findFirst: jest.fn().mockResolvedValue({ height: 1000 })
      },
      kaldTransaction: {
        count: jest.fn().mockResolvedValue(500)
      },
      kaldBalance: {
        count: jest.fn().mockResolvedValue(1000)
      }
    };

    // Create tokenomics instance with mocked dependencies
    const { TokenomicsModel } = require('@/lib/legacy/tokenomics');
    tokenomics = new TokenomicsModel({}, mockKaldCoin, mockDb);
  });

  describe('Initialization', () => {
    it('should initialize tokenomics model with correct config', () => {
      const config = tokenomics.getConfig();
      
      expect(config).toBeDefined();
      expect(config.initialSupply).toBe(500000000n * 1000000000000000000n);
      expect(config.maxSupply).toBe(2000000000n * 1000000000000000000n);
      expect(config.annualInflationRate).toBe(0.02);
      expect(config.stakingRewardsRate).toBe(0.6);
      expect(config.halvingCycle).toBe(4);
    });
  });

  describe('Supply Metrics', () => {
    it('should return supply metrics', async () => {
      const metrics = await tokenomics.getSupplyMetrics();
      
      expect(metrics).toHaveProperty('totalSupply');
      expect(metrics).toHaveProperty('circulatingSupply');
      expect(metrics).toHaveProperty('stakedSupply');
      expect(metrics).toHaveProperty('burnedSupply');
      expect(metrics).toHaveProperty('inflationRate');
      expect(metrics).toHaveProperty('annualInflation');
      expect(metrics).toHaveProperty('nextHalving');
      expect(metrics).toHaveProperty('blocksUntilHalving');
      
      expect(metrics.totalSupply).toBe(10000000000000000000000000000n);
      expect(metrics.circulatingSupply).toBe(2500000000000000000000000000n);
      expect(metrics.stakedSupply).toBe(2500000000000000000000000000n);
      expect(metrics.burnedSupply).toBe(0n);
      expect(metrics.inflationRate).toBe(0.02);
    });

    it('should calculate inflation correctly', async () => {
      const metrics = await tokenomics.getSupplyMetrics();
      
      // Annual inflation should be calculated correctly
      const expectedInflation = 2500000000000000000000000000n * BigInt(Math.floor(0.02 * 1000000000000000000)) / 1000000000000000000n;
      expect(metrics.annualInflation).toBe(expectedInflation);
    });
  });

  describe('Reward Distribution', () => {
    it('should calculate reward distribution correctly', async () => {
      const blockReward = 1000000000000000000000n; // 1000 tokens
      
      const distribution = await tokenomics.calculateRewardDistribution(blockReward);
      
      expect(distribution).toHaveProperty('stakingRewards');
      expect(distribution).toHaveProperty('developmentFund');
      expect(distribution).toHaveProperty('ecosystemFund');
      expect(distribution).toHaveProperty('liquidityMining');
      expect(distribution).toHaveProperty('burnAmount');
      expect(distribution).toHaveProperty('totalRewards');
      
      expect(distribution.stakingRewards).toBe(blockReward * 600000000000000000n / 1000000000000000000n);
      expect(distribution.developmentFund).toBe(blockReward * 150000000000000000n / 1000000000000000000n);
      expect(distribution.ecosystemFund).toBe(blockReward * 150000000000000000n / 1000000000000000000n);
      expect(distribution.liquidityMining).toBe(blockReward * 50000000000000000n / 1000000000000000000n);
      expect(distribution.burnAmount).toBe(blockReward * 50000000000000000n / 1000000000000000000n);
      expect(distribution.totalRewards).toBe(blockReward);
    });

    it('should verify reward distribution percentages', async () => {
      const blockReward = 1000000000000000000000n;
      const distribution = await tokenomics.calculateRewardDistribution(blockReward);
      
      const totalRewards = distribution.stakingRewards + distribution.developmentFund + 
                          distribution.ecosystemFund + distribution.liquidityMining + distribution.burnAmount;
      
      expect(totalRewards).toBe(blockReward);
    });
  });

  describe('Economic Metrics', () => {
    it('should return economic metrics', async () => {
      const metrics = await tokenomics.getEconomicMetrics();
      
      expect(metrics).toHaveProperty('marketCap');
      expect(metrics).toHaveProperty('pricePerToken');
      expect(metrics).toHaveProperty('volume24h');
      expect(metrics).toHaveProperty('marketCapRank');
      expect(metrics).toHaveProperty('liquidity');
      expect(metrics).toHaveProperty('holders');
      expect(metrics).toHaveProperty('transactions24h');
      
      expect(metrics.marketCap).toBe(1000000000n * 1000000000000000000n);
      expect(metrics.pricePerToken).toBe(2.0);
      expect(metrics.volume24h).toBe(50000000n * 1000000000000000000n);
      expect(metrics.marketCapRank).toBe(150);
      expect(metrics.liquidity).toBe(100000000n * 1000000000000000000n);
      expect(metrics.holders).toBe(1000);
      expect(metrics.transactions24h).toBe(500);
    });
  });

  describe('Tokenomics Analysis', () => {
    it('should analyze tokenomics and return comprehensive analysis', async () => {
      const analysis = await tokenomics.analyzeTokenomics();
      
      expect(analysis).toHaveProperty('sustainabilityScore');
      expect(analysis).toHaveProperty('inflationPressure');
      expect(analysis).toHaveProperty('stakingParticipation');
      expect(analysis).toHaveProperty('economicHealth');
      expect(analysis).toHaveProperty('recommendations');
      
      expect(analysis.sustainabilityScore).toBeGreaterThan(0);
      expect(analysis.sustainabilityScore).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high']).toContain(analysis.inflationPressure);
      expect(analysis.stakingParticipation).toBeGreaterThanOrEqual(0);
      expect(analysis.stakingParticipation).toBeLessThanOrEqual(1);
      expect(['excellent', 'good', 'fair', 'poor']).toContain(analysis.economicHealth);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should calculate staking participation correctly', async () => {
      const analysis = await tokenomics.analyzeTokenomics();
      
      // With mocked data, staking participation should be 100% (staked supply = circulating supply)
      expect(analysis.stakingParticipation).toBe(1);
    });

    it('should determine inflation pressure correctly', async () => {
      const analysis = await tokenomics.analyzeTokenomics();
      
      // With 2% inflation rate, pressure should be 'low'
      expect(analysis.inflationPressure).toBe('low');
    });
  });

  describe('Configuration', () => {
    it('should return correct configuration', () => {
      const config = tokenomics.getConfig();
      
      expect(config).toHaveProperty('initialSupply');
      expect(config).toHaveProperty('maxSupply');
      expect(config).toHaveProperty('annualInflationRate');
      expect(config).toHaveProperty('stakingRewardsRate');
      expect(config).toHaveProperty('developmentFundRate');
      expect(config).toHaveProperty('ecosystemFundRate');
      expect(config).toHaveProperty('liquidityMiningRate');
      expect(config).toHaveProperty('burnRate');
      expect(config).toHaveProperty('halvingCycle');
      
      expect(config.annualInflationRate).toBe(0.02);
      expect(config.stakingRewardsRate).toBe(0.6);
      expect(config.developmentFundRate).toBe(0.15);
      expect(config.ecosystemFundRate).toBe(0.15);
      expect(config.liquidityMiningRate).toBe(0.05);
      expect(config.burnRate).toBe(0.05);
      expect(config.halvingCycle).toBe(4);
    });
  });

  describe('Inflation Calculations', () => {
    it('should calculate current inflation rate correctly', () => {
      // This is a private method, so we need to test it indirectly through other methods
      // The inflation rate should be 2% for the first halving cycle
      expect(tokenomics.getConfig().annualInflationRate).toBe(0.02);
    });

    it('should handle halving calculations correctly', async () => {
      const metrics = await tokenomics.getSupplyMetrics();
      
      expect(metrics.nextHalving).toBeDefined();
      expect(metrics.nextHalving).not.toBeNull();
      expect(typeof metrics.nextHalving.getTime()).toBe('number');
      expect(metrics.blocksUntilHalving).toBeGreaterThan(0);
    });
  });

  describe('Market Data Integration', () => {
    it('should provide simulated market data', async () => {
      const metrics = await tokenomics.getEconomicMetrics();
      
      // Verify that market data is reasonable
      expect(metrics.pricePerToken).toBeGreaterThan(0);
      expect(Number(metrics.marketCap)).toBeGreaterThan(0);
      expect(Number(metrics.volume24h)).toBeGreaterThan(0);
      expect(metrics.marketCapRank).toBeGreaterThan(0);
    });
  });

  describe('Database Operations', () => {
    it('should interact with database for historical data', async () => {
      await tokenomics.getSupplyMetrics();
      
      // Verify that database methods were called
      expect(mockDb.block.findFirst).toHaveBeenCalled();
    });

    it('should interact with database for transaction counts', async () => {
      await tokenomics.getEconomicMetrics();
      
      // Verify that database methods were called
      expect(mockDb.kaldTransaction.count).toHaveBeenCalled();
      expect(mockDb.kaldBalance.count).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database to throw an error
      mockDb.block.findFirst.mockRejectedValueOnce(new Error('Database error'));
      
      // The method should still return a result (with fallback values)
      const metrics = await tokenomics.getSupplyMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalSupply).toBeDefined();
    });

    it('should handle native coin errors gracefully', async () => {
      // Mock native coin to throw an error
      mockKaldCoin.getSupplyInfo.mockRejectedValueOnce(new Error('Native coin error'));
      
      // The method should still handle the error
      await expect(tokenomics.getSupplyMetrics()).rejects.toThrow();
    });
  });
});