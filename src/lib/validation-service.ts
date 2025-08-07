/**
 * Validation Service
 * 
 * This service provides centralized validation for all incoming data using Zod schemas.
 * It ensures type safety and data integrity across the application.
 */

import {
  TransactionSchema,
  TransactionInputSchema,
  BatchTransactionSchema,
  TransactionResultSchema,
  PerformanceMetricsSchema,
  DetailedPerformanceMetricsSchema,
  PerformanceBenchmarkSchema,
  TokenTransferSchema,
  ValidatedTokenTransferSchema,
  BatchTokenTransferSchema,
  TokenBalanceSchema,
  BlockSchema,
  NetworkStatusSchema,
  ValidatorInfoSchema,
  StakingRewardSchema,
  ApiResponseSchema,
  validateTransactionInput,
  validatePerformanceMetrics,
  validateTokenTransfer,
  safeValidate,
  createApiResponse,
  type Transaction,
  type TransactionInput,
  type BatchTransaction,
  type TransactionResult,
  type PerformanceMetrics,
  type DetailedPerformanceMetrics,
  type PerformanceBenchmark,
  type TokenTransfer,
  type ValidatedTokenTransfer,
  type BatchTokenTransfer,
  type TokenBalance,
  type Block,
  type NetworkStatus,
  type ValidatorInfo,
  type StakingReward,
  type ApiResponse,
} from './schemas';

export class ValidationService {
  private static instance: ValidationService;

  /**
   * Get singleton instance
   */
  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Transaction validation methods
   */

  /**
   * Validate a single transaction input
   */
  validateTransaction(data: unknown): TransactionInput {
    try {
      return validateTransactionInput(data);
    } catch (error) {
      throw new Error(`Invalid transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a batch of transactions
   */
  validateBatchTransaction(data: unknown): BatchTransaction {
    try {
      return BatchTransactionSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid batch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate transaction result
   */
  validateTransactionResult(data: unknown): TransactionResult {
    try {
      return TransactionResultSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid transaction result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Safe transaction validation with error handling
   */
  safeValidateTransaction(data: unknown) {
    return safeValidate(TransactionInputSchema, data);
  }

  /**
   * Performance metrics validation methods
   */

  /**
   * Validate performance metrics
   */
  validatePerformanceMetrics(data: unknown): PerformanceMetrics {
    try {
      return validatePerformanceMetrics(data);
    } catch (error) {
      throw new Error(`Invalid performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate detailed performance metrics
   */
  validateDetailedPerformanceMetrics(data: unknown): DetailedPerformanceMetrics {
    try {
      return DetailedPerformanceMetricsSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid detailed performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate performance benchmark
   */
  validatePerformanceBenchmark(data: unknown): PerformanceBenchmark {
    try {
      return PerformanceBenchmarkSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid performance benchmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Safe performance metrics validation
   */
  safeValidatePerformanceMetrics(data: unknown) {
    return safeValidate(PerformanceMetricsSchema, data);
  }

  /**
   * Token transfer validation methods
   */

  /**
   * Validate token transfer
   */
  validateTokenTransfer(data: unknown): TokenTransfer {
    try {
      return validateTokenTransfer(data);
    } catch (error) {
      throw new Error(`Invalid token transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate validated token transfer
   */
  validateValidatedTokenTransfer(data: unknown): ValidatedTokenTransfer {
    try {
      return ValidatedTokenTransferSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid validated token transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate batch token transfer
   */
  validateBatchTokenTransfer(data: unknown): BatchTokenTransfer {
    try {
      return BatchTokenTransferSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid batch token transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate token balance
   */
  validateTokenBalance(data: unknown): TokenBalance {
    try {
      return TokenBalanceSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Safe token transfer validation
   */
  safeValidateTokenTransfer(data: unknown) {
    return safeValidate(TokenTransferSchema, data);
  }

  /**
   * Blockchain validation methods
   */

  /**
   * Validate block data
   */
  validateBlock(data: unknown): Block {
    try {
      return BlockSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid block data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate network status
   */
  validateNetworkStatus(data: unknown): NetworkStatus {
    try {
      return NetworkStatusSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid network status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validator validation methods
   */

  /**
   * Validate validator info
   */
  validateValidatorInfo(data: unknown): ValidatorInfo {
    try {
      return ValidatorInfoSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid validator info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate staking reward
   */
  validateStakingReward(data: unknown): StakingReward {
    try {
      return StakingRewardSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid staking reward: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * API response validation
   */

  /**
   * Validate API response
   */
  validateApiResponse(data: unknown): ApiResponse {
    try {
      return ApiResponseSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create validated API response
   */
  createValidatedApiResponse<T>(
    success: boolean,
    data: T | { code: string; message: string; details?: any },
    timestamp: Date = new Date()
  ): ApiResponse {
    return createApiResponse(success, data, timestamp);
  }

  /**
   * Utility methods for common validation patterns
   */

  /**
   * Validate and sanitize transaction input
   */
  validateAndSanitizeTransaction(data: unknown): TransactionInput {
    // First validate with the base schema
    const baseValidated = TransactionInputSchema.safeParse(data);
    if (!baseValidated.success) {
      throw new Error(`Invalid transaction: ${baseValidated.error.message}`);
    }
    
    // Sanitize data
    const sanitized = {
      ...baseValidated.data,
      data: baseValidated.data.data || '',
      gasLimit: Math.max(21000, baseValidated.data.gasLimit),
      priority: Math.max(0, Math.min(10, baseValidated.data.priority || 0)),
    };
    
    // Validate the sanitized data
    return TransactionInputSchema.parse(sanitized);
  }

  /**
   * Validate and sanitize performance metrics
   */
  validateAndSanitizePerformanceMetrics(data: unknown): PerformanceMetrics {
    const validated = this.validatePerformanceMetrics(data);
    
    // Sanitize data
    return {
      ...validated,
      tps: Math.max(0, validated.tps),
      avgLatency: Math.max(0, validated.avgLatency),
      throughput: Math.max(0, validated.throughput),
      successRate: Math.max(0, Math.min(100, validated.successRate)),
      activeWorkers: Math.max(0, validated.activeWorkers),
      queueSize: Math.max(0, validated.queueSize),
      nodeCount: Math.max(0, validated.nodeCount),
      quantumNodes: Math.max(0, validated.quantumNodes),
      cpuUsage: Math.max(0, Math.min(100, validated.cpuUsage)),
      memoryUsage: Math.max(0, validated.memoryUsage),
      networkBandwidth: Math.max(0, validated.networkBandwidth),
    };
  }

  /**
   * Validate and sanitize token transfer
   */
  validateAndSanitizeTokenTransfer(data: unknown): TokenTransfer {
    const validated = this.validateTokenTransfer(data);
    
    // Sanitize data
    return {
      ...validated,
      amount: Math.max(0, validated.amount),
      decimals: Math.max(0, Math.min(18, validated.decimals)),
      memo: validated.memo ? validated.memo.substring(0, 256) : undefined,
    };
  }

  /**
   * Batch validation with error collection
   */
  validateBatch<T>(
    items: unknown[],
    validator: (item: unknown) => T,
    maxErrors: number = 10
  ): { validItems: T[]; errors: { index: number; error: string }[] } {
    const validItems: T[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const validated = validator(items[i]);
        validItems.push(validated);
      } catch (error) {
        if (errors.length < maxErrors) {
          errors.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return { validItems, errors };
  }

  /**
   * Validate transaction batch with error collection
   */
  validateTransactionBatch(
    transactions: unknown[]
  ): { validTransactions: TransactionInput[]; errors: { index: number; error: string }[] } {
    return this.validateBatch(transactions, (tx) => this.validateAndSanitizeTransaction(tx));
  }

  /**
   * Validate token transfer batch with error collection
   */
  validateTokenTransferBatch(
    transfers: unknown[]
  ): { validTransfers: TokenTransfer[]; errors: { index: number; error: string }[] } {
    return this.validateBatch(transfers, (transfer) => this.validateAndSanitizeTokenTransfer(transfer));
  }

  /**
   * Schema validation for legacy code integration
   */

  /**
   * Validate legacy blockchain service data
   */
  validateLegacyBlockchainData(data: unknown): {
    status: NetworkStatus;
    metrics: PerformanceMetrics;
  } {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Legacy blockchain data must be an object');
    }

    const legacyData = data as any;

    return {
      status: this.validateNetworkStatus(legacyData.status || {}),
      metrics: this.validatePerformanceMetrics(legacyData.metrics || {}),
    };
  }

  /**
   * Validate legacy parallel processing data
   */
  validateLegacyParallelProcessingData(data: unknown): {
    metrics: PerformanceMetrics;
    benchmarks: PerformanceBenchmark[];
  } {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Legacy parallel processing data must be an object');
    }

    const legacyData = data as any;

    return {
      metrics: this.validatePerformanceMetrics(legacyData.metrics || {}),
      benchmarks: Array.isArray(legacyData.benchmarks) 
        ? legacyData.benchmarks.map((b: unknown) => this.validatePerformanceBenchmark(b))
        : [],
    };
  }

  /**
   * Validate legacy tokenomics data
   */
  validateLegacyTokenomicsData(data: unknown): {
    supplyMetrics: any;
    economicMetrics: any;
  } {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Legacy tokenomics data must be an object');
    }

    const legacyData = data as any;

    // Basic validation for legacy data structure
    return {
      supplyMetrics: legacyData.supplyMetrics || {},
      economicMetrics: legacyData.economicMetrics || {},
    };
  }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();

// Export convenience functions
export const validateTx = validationService.validateTransaction.bind(validationService);
export const validatePerf = validationService.validatePerformanceMetrics.bind(validationService);
export const validateTokenXfer = validationService.validateTokenTransfer.bind(validationService);