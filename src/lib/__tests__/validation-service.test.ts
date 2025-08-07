/**
 * Validation Service Tests
 * 
 * Comprehensive tests for the validation service and Zod schemas
 */

import { validationService } from '../validation-service';
import {
  TransactionSchema,
  PerformanceMetricsSchema,
  TokenTransferSchema,
  ApiResponseSchema,
  type TransactionInput,
  type PerformanceMetrics,
  type TokenTransfer,
} from '../schemas';

describe('ValidationService', () => {
  describe('Transaction Validation', () => {
    it('should validate correct transaction input', () => {
      const validTransaction: TransactionInput = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: 100,
        data: '0x',
        gasLimit: 21000,
        gasPrice: 20000000000,
        priority: 5,
      };

      const result = validationService.validateTransaction(validTransaction);
      expect(result).toEqual(validTransaction);
    });

    it('should reject transaction with missing required fields', () => {
      const invalidTransaction = {
        from: '0x1234567890123456789012345678901234567890',
        // Missing 'to' and 'amount'
      };

      expect(() => {
        validationService.validateTransaction(invalidTransaction);
      }).toThrow('Invalid transaction');
    });

    it('should reject transaction with negative amount', () => {
      const invalidTransaction: any = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: -100,
      };

      expect(() => {
        validationService.validateTransaction(invalidTransaction);
      }).toThrow('Invalid transaction');
    });

    it('should sanitize transaction input', () => {
      const unsanitizedTransaction: any = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: 100,
        gasLimit: 20000, // Below minimum
        priority: 15, // Above maximum
        data: '',
      };

      const result = validationService.validateAndSanitizeTransaction(unsanitizedTransaction);
      
      expect(result.gasLimit).toBe(21000); // Should be normalized to minimum
      expect(result.priority).toBe(10); // Should be normalized to maximum
    });

    it('should validate batch transactions', () => {
      const validBatch = {
        transactions: [
          {
            from: '0x1234567890123456789012345678901234567890',
            to: '0x0987654321098765432109876543210987654321',
            amount: 100,
          },
          {
            from: '0x0987654321098765432109876543210987654321',
            to: '0x1234567890123456789012345678901234567890',
            amount: 50,
          },
        ],
      };

      const result = validationService.validateBatchTransaction(validBatch);
      expect(result.transactions).toHaveLength(2);
    });

    it('should handle batch validation with errors', () => {
      const mixedBatch = [
        {
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          amount: 100,
        },
        {
          from: '0x0987654321098765432109876543210987654321',
          to: '0x1234567890123456789012345678901234567890',
          amount: -50, // Invalid
        },
        {
          from: '0x1111111111111111111111111111111111111111',
          to: '0x2222222222222222222222222222222222222222',
          amount: 75,
        },
      ];

      const result = validationService.validateTransactionBatch(mixedBatch);
      
      expect(result.validTransactions).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });
  });

  describe('Performance Metrics Validation', () => {
    it('should validate correct performance metrics', () => {
      const validMetrics: PerformanceMetrics = {
        tps: 1250,
        avgLatency: 45,
        throughput: 85.5,
        successRate: 98.2,
        activeWorkers: 8,
        queueSize: 0,
        nodeCount: 12,
        quantumNodes: 8,
        cpuUsage: 65,
        memoryUsage: 512,
        networkBandwidth: 30,
        timestamp: new Date(),
      };

      const result = validationService.validatePerformanceMetrics(validMetrics);
      expect(result).toEqual(validMetrics);
    });

    it('should reject metrics with negative values', () => {
      const invalidMetrics: any = {
        tps: -100, // Invalid
        avgLatency: 45,
        throughput: 85.5,
        successRate: 98.2,
        timestamp: new Date(),
      };

      expect(() => {
        validationService.validatePerformanceMetrics(invalidMetrics);
      }).toThrow('Invalid performance metrics');
    });

    it('should reject metrics with success rate > 100', () => {
      const invalidMetrics: any = {
        tps: 1000,
        avgLatency: 45,
        throughput: 85.5,
        successRate: 150, // Invalid
        timestamp: new Date(),
      };

      expect(() => {
        validationService.validatePerformanceMetrics(invalidMetrics);
      }).toThrow('Invalid performance metrics');
    });

    it('should sanitize performance metrics', () => {
      const unsanitizedMetrics: any = {
        tps: -100, // Should be normalized to 0
        avgLatency: 45,
        throughput: 85.5,
        successRate: 150, // Should be normalized to 100
        cpuUsage: 150, // Should be normalized to 100
        timestamp: new Date(),
      };

      const result = validationService.validateAndSanitizePerformanceMetrics(unsanitizedMetrics);
      
      expect(result.tps).toBe(0);
      expect(result.successRate).toBe(100);
      expect(result.cpuUsage).toBe(100);
    });

    it('should validate detailed performance metrics', () => {
      const validDetailedMetrics = {
        tps: 1250,
        avgLatency: 45,
        throughput: 85.5,
        successRate: 98.2,
        activeWorkers: 8,
        queueSize: 0,
        nodeCount: 12,
        quantumNodes: 8,
        cpuUsage: 65,
        memoryUsage: 512,
        networkBandwidth: 30,
        timestamp: new Date(),
        blockTime: 820,
        validatorCount: 7,
        activeValidators: 7,
        networkPartitionResistance: 'HIGH' as const,
        byzantineFaultTolerance: '66%',
        uptime: 99.5,
      };

      const result = validationService.validateDetailedPerformanceMetrics(validDetailedMetrics);
      expect(result).toEqual(validDetailedMetrics);
    });
  });

  describe('Token Transfer Validation', () => {
    it('should validate correct token transfer', () => {
      const validTransfer: TokenTransfer = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: 1000,
        tokenSymbol: 'KALD',
        decimals: 18,
        timestamp: new Date(),
        memo: 'Test transfer',
      };

      const result = validationService.validateTokenTransfer(validTransfer);
      expect(result).toEqual(validTransfer);
    });

    it('should reject token transfer with missing required fields', () => {
      const invalidTransfer = {
        from: '0x1234567890123456789012345678901234567890',
        // Missing 'to', 'amount', 'tokenSymbol'
      };

      expect(() => {
        validationService.validateTokenTransfer(invalidTransfer);
      }).toThrow('Invalid token transfer');
    });

    it('should reject token transfer with invalid decimals', () => {
      const invalidTransfer: any = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: 1000,
        tokenSymbol: 'KALD',
        decimals: 25, // Invalid, should be <= 18
        timestamp: new Date(),
      };

      expect(() => {
        validationService.validateTokenTransfer(invalidTransfer);
      }).toThrow('Invalid token transfer');
    });

    it('should sanitize token transfer memo', () => {
      const longMemo = 'a'.repeat(300); // 300 characters, exceeds 256 limit
      const transferWithLongMemo: any = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: 1000,
        tokenSymbol: 'KALD',
        decimals: 18,
        timestamp: new Date(),
        memo: longMemo,
      };

      const result = validationService.validateAndSanitizeTokenTransfer(transferWithLongMemo);
      
      expect(result.memo).toHaveLength(256);
    });

    it('should validate batch token transfers', () => {
      const validBatch = {
        transfers: [
          {
            from: '0x1234567890123456789012345678901234567890',
            to: '0x0987654321098765432109876543210987654321',
            amount: 1000,
            tokenSymbol: 'KALD',
            decimals: 18,
            timestamp: new Date(),
          },
          {
            from: '0x0987654321098765432109876543210987654321',
            to: '0x1234567890123456789012345678901234567890',
            amount: 500,
            tokenSymbol: 'KALD',
            decimals: 18,
            timestamp: new Date(),
          },
        ],
      };

      const result = validationService.validateBatchTokenTransfer(validBatch);
      expect(result.transfers).toHaveLength(2);
    });
  });

  describe('Blockchain Validation', () => {
    it('should validate network status', () => {
      const validStatus = {
        networkStatus: 'online' as const,
        networkPeers: 12,
        consensusHeight: 15372,
        transactionsPerSecond: 1250,
        lastBlockTimestamp: new Date(),
        chainId: '1',
        version: '1.0.0',
      };

      const result = validationService.validateNetworkStatus(validStatus);
      expect(result).toEqual(validStatus);
    });

    it('should validate block data', () => {
      const validBlock = {
        number: 15372,
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        parentHash: '0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
        timestamp: new Date(),
        transactions: [],
        gasUsed: 21000,
        gasLimit: 30000000,
        difficulty: 1000000,
        totalDifficulty: 2000000,
        size: 1024,
        validator: '0x1234567890123456789012345678901234567890',
      };

      const result = validationService.validateBlock(validBlock);
      expect(result).toEqual(validBlock);
    });
  });

  describe('Validator Validation', () => {
    it('should validate validator info', () => {
      const validValidator = {
        address: '0x1234567890123456789012345678901234567890',
        stake: 1000000,
        commission: 5,
        status: 'active' as const,
        uptime: 99.5,
        rewards: 1000,
        lastActive: new Date(),
      };

      const result = validationService.validateValidatorInfo(validValidator);
      expect(result).toEqual(validValidator);
    });

    it('should validate staking reward', () => {
      const validReward = {
        validatorAddress: '0x1234567890123456789012345678901234567890',
        delegatorAddress: '0x0987654321098765432109876543210987654321',
        amount: 100,
        tokenSymbol: 'KALD',
        timestamp: new Date(),
        blockNumber: 15372,
        rewardType: 'block_reward' as const,
      };

      const result = validationService.validateStakingReward(validReward);
      expect(result).toEqual(validReward);
    });
  });

  describe('API Response Validation', () => {
    it('should validate success response', () => {
      const successResponse = {
        success: true as const,
        data: { message: 'Operation completed successfully' },
        timestamp: new Date(),
      };

      const result = validationService.validateApiResponse(successResponse);
      expect(result).toEqual(successResponse);
    });

    it('should validate error response', () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: { field: 'amount', message: 'Amount must be positive' },
        },
        timestamp: new Date(),
      };

      const result = validationService.validateApiResponse(errorResponse);
      expect(result).toEqual(errorResponse);
    });

    it('should create validated API response', () => {
      const successData = { transactionId: 'tx_123' };
      const successResponse = validationService.createValidatedApiResponse(true, successData);
      
      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toEqual(successData);
      expect(successResponse.timestamp).toBeInstanceOf(Date);

      const errorData = { code: 'NOT_FOUND', message: 'Transaction not found' };
      const errorResponse = validationService.createValidatedApiResponse(false, errorData);
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toEqual(errorData);
      expect(errorResponse.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Legacy Data Validation', () => {
    it('should validate legacy blockchain data', () => {
      const legacyData = {
        status: {
          networkStatus: 'online' as const,
          networkPeers: 12,
          consensusHeight: 15372,
          transactionsPerSecond: 1250,
          lastBlockTimestamp: new Date(),
        },
        metrics: {
          tps: 1250,
          avgLatency: 45,
          throughput: 85.5,
          successRate: 98.2,
          activeWorkers: 8,
          queueSize: 0,
          nodeCount: 12,
          quantumNodes: 8,
          cpuUsage: 65,
          memoryUsage: 512,
          networkBandwidth: 30,
          timestamp: new Date(),
        },
      };

      const result = validationService.validateLegacyBlockchainData(legacyData);
      expect(result.status.networkStatus).toBe('online');
      expect(result.metrics.tps).toBe(1250);
    });

    it('should validate legacy parallel processing data', () => {
      const legacyData = {
        metrics: {
          tps: 1250,
          avgLatency: 45,
          throughput: 85.5,
          successRate: 98.2,
          activeWorkers: 8,
          queueSize: 0,
          nodeCount: 12,
          quantumNodes: 8,
          cpuUsage: 65,
          memoryUsage: 512,
          networkBandwidth: 30,
          timestamp: new Date(),
        },
        benchmarks: [
          {
            timestamp: new Date(),
            tps: 1200,
            latency: 42,
            throughput: 82.5,
            successRate: 97.8,
            resourceUsage: {
              cpu: 63,
              memory: 510,
              network: 28,
            },
          },
        ],
      };

      const result = validationService.validateLegacyParallelProcessingData(legacyData);
      expect(result.metrics.tps).toBe(1250);
      expect(result.benchmarks).toHaveLength(1);
    });

    it('should validate legacy tokenomics data', () => {
      const legacyData = {
        supplyMetrics: {
          totalSupply: '10000000000000000000000000000',
          circulatingSupply: '2500000000000000000000000000',
          stakedSupply: '2500000000000000000000000000',
          burnedSupply: '0',
          inflationRate: 0.02,
        },
        economicMetrics: {
          marketCap: 1000000000,
          pricePerToken: 2.0,
          volume24h: 50000000,
          marketCapRank: 150,
          liquidity: 100000000,
          holders: 1000,
          transactions24h: 500,
        },
      };

      const result = validationService.validateLegacyTokenomicsData(legacyData);
      expect(result.supplyMetrics.totalSupply).toBe('10000000000000000000000000000');
      expect(result.economicMetrics.marketCap).toBe(1000000000);
    });
  });

  describe('Safe Validation', () => {
    it('should return success for valid data', () => {
      const validTransaction: TransactionInput = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: 100,
      };

      const result = validationService.safeValidateTransaction(validTransaction);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validTransaction);
      }
    });

    it('should return error for invalid data', () => {
      const invalidTransaction = {
        from: '0x1234567890123456789012345678901234567890',
        // Missing required fields
      };

      const result = validationService.safeValidateTransaction(invalidTransaction);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues).toHaveLengthGreaterThan(0);
      }
    });
  });

  describe('Schema Direct Validation', () => {
    it('should validate using schema directly', () => {
      const validTransaction: TransactionInput = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: 100,
      };

      const result = TransactionInputSchema.parse(validTransaction);
      expect(result).toEqual(validTransaction);
    });

    it('should throw error for invalid schema validation', () => {
      const invalidTransaction = {
        from: '0x1234567890123456789012345678901234567890',
        // Missing required fields
      };

      expect(() => {
        TransactionInputSchema.parse(invalidTransaction);
      }).toThrow();
    });
  });
});