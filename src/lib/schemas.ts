/**
 * Type Safety Schemas with Zod
 * 
 * This module provides comprehensive Zod schemas for validating and ensuring type safety
 * across the application, particularly for transaction objects, performance metrics, and token transfers.
 */

import { z } from 'zod';

/**
 * Transaction-related schemas
 */

// Basic transaction schema
export const TransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
  hash: z.string().min(1, 'Transaction hash is required'),
  from: z.string().min(1, 'From address is required'),
  to: z.string().min(1, 'To address is required'),
  amount: z.number().positive('Amount must be positive'),
  gasLimit: z.number().positive('Gas limit must be positive'),
  gasPrice: z.number().positive('Gas price must be positive'),
  nonce: z.number().nonnegative('Nonce must be non-negative'),
  data: z.string().optional(),
  timestamp: z.date().or(z.number().transform(n => new Date(n))),
  blockNumber: z.number().nonnegative('Block number must be non-negative').optional(),
  status: z.enum(['pending', 'confirmed', 'failed', 'reverted']).default('pending'),
  quantumSignature: z.string().optional(),
});

// Transaction input schema for processing
export const TransactionInputSchema = z.object({
  from: z.string().min(1, 'From address is required'),
  to: z.string().min(1, 'To address is required'),
  amount: z.number().positive('Amount must be positive'),
  data: z.string().default(''),
  gasLimit: z.number().min(21000, 'Gas limit must be at least 21000').default(21000),
  gasPrice: z.number().positive('Gas price must be positive').optional(),
  quantumSignature: z.string().optional(),
  priority: z.number().min(0).max(10).default(0),
});

// Batch transaction schema
export const BatchTransactionSchema = z.object({
  transactions: z.array(TransactionInputSchema).min(1, 'At least one transaction is required'),
  batchId: z.string().optional(),
  maxWaitTime: z.number().positive('Max wait time must be positive').default(1000),
});

// Transaction result schema
export const TransactionResultSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  status: z.enum(['success', 'failed', 'pending']),
  hash: z.string().optional(),
  blockNumber: z.number().optional(),
  gasUsed: z.number().optional(),
  error: z.string().optional(),
  timestamp: z.date(),
});

/**
 * Performance Metrics Schemas
 */

// Basic performance metrics
export const PerformanceMetricsSchema = z.object({
  tps: z.number().nonnegative('TPS must be non-negative'),
  avgLatency: z.number().nonnegative('Average latency must be non-negative'),
  throughput: z.number().nonnegative('Throughput must be non-negative'),
  successRate: z.number().min(0).max(100, 'Success rate must be between 0 and 100'),
  activeWorkers: z.number().nonnegative('Active workers must be non-negative'),
  queueSize: z.number().nonnegative('Queue size must be non-negative'),
  nodeCount: z.number().nonnegative('Node count must be non-negative'),
  quantumNodes: z.number().nonnegative('Quantum nodes must be non-negative'),
  cpuUsage: z.number().min(0).max(100, 'CPU usage must be between 0 and 100'),
  memoryUsage: z.number().nonnegative('Memory usage must be non-negative'),
  networkBandwidth: z.number().nonnegative('Network bandwidth must be non-negative'),
  timestamp: z.date(),
});

// Detailed performance metrics with additional fields
export const DetailedPerformanceMetricsSchema = PerformanceMetricsSchema.extend({
  blockTime: z.number().nonnegative('Block time must be non-negative'),
  validatorCount: z.number().nonnegative('Validator count must be non-negative'),
  activeValidators: z.number().nonnegative('Active validators must be non-negative'),
  networkPartitionResistance: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  byzantineFaultTolerance: z.string(),
  uptime: z.number().min(0).max(100, 'Uptime must be between 0 and 100'),
});

// Performance benchmark schema
export const PerformanceBenchmarkSchema = z.object({
  timestamp: z.date(),
  tps: z.number().nonnegative(),
  latency: z.number().nonnegative(),
  throughput: z.number().nonnegative(),
  successRate: z.number().min(0).max(100),
  resourceUsage: z.object({
    cpu: z.number().min(0).max(100),
    memory: z.number().min(0).max(100),
    network: z.number().min(0).max(100),
  }),
});

/**
 * Token Transfer Schemas
 */

// Basic token transfer
export const TokenTransferSchema = z.object({
  from: z.string().min(1, 'From address is required'),
  to: z.string().min(1, 'To address is required'),
  amount: z.number().positive('Amount must be positive'),
  tokenSymbol: z.string().min(1, 'Token symbol is required'),
  decimals: z.number().min(0).max(18, 'Decimals must be between 0 and 18'),
  transactionHash: z.string().optional(),
  blockNumber: z.number().nonnegative().optional(),
  timestamp: z.date(),
  memo: z.string().max(256, 'Memo must be less than 256 characters').optional(),
});

// Token transfer with validation
export const ValidatedTokenTransferSchema = TokenTransferSchema.extend({
  id: z.string(),
  status: z.enum(['pending', 'confirmed', 'failed']),
  gasUsed: z.number().nonnegative().optional(),
  fee: z.number().nonnegative().optional(),
});

// Batch token transfer
export const BatchTokenTransferSchema = z.object({
  transfers: z.array(TokenTransferSchema).min(1, 'At least one transfer is required'),
  batchId: z.string().optional(),
  maxFee: z.number().positive().optional(),
  deadline: z.date().optional(),
});

// Token balance schema
export const TokenBalanceSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  tokenSymbol: z.string().min(1, 'Token symbol is required'),
  balance: z.number().nonnegative('Balance must be non-negative'),
  decimals: z.number().min(0).max(18, 'Decimals must be between 0 and 18'),
  lastUpdated: z.date(),
});

/**
 * Blockchain-specific schemas
 */

// Block schema
export const BlockSchema = z.object({
  number: z.number().nonnegative('Block number must be non-negative'),
  hash: z.string().min(1, 'Block hash is required'),
  parentHash: z.string().min(1, 'Parent hash is required'),
  timestamp: z.date(),
  transactions: z.array(TransactionSchema),
  gasUsed: z.number().nonnegative('Gas used must be non-negative'),
  gasLimit: z.number().positive('Gas limit must be positive'),
  difficulty: z.number().nonnegative('Difficulty must be non-negative'),
  totalDifficulty: z.number().nonnegative('Total difficulty must be non-negative'),
  size: z.number().positive('Block size must be positive'),
  validator: z.string().optional(),
});

// Network status schema
export const NetworkStatusSchema = z.object({
  networkStatus: z.enum(['online', 'offline', 'degraded']),
  networkPeers: z.number().nonnegative('Network peers must be non-negative'),
  consensusHeight: z.number().nonnegative('Consensus height must be non-negative'),
  transactionsPerSecond: z.number().nonnegative('TPS must be non-negative'),
  lastBlockTimestamp: z.date(),
  chainId: z.string().optional(),
  version: z.string().optional(),
});

/**
 * Validator and Staking Schemas
 */

// Validator info schema
export const ValidatorInfoSchema = z.object({
  address: z.string().min(1, 'Validator address is required'),
  stake: z.number().nonnegative('Stake must be non-negative'),
  commission: z.number().min(0).max(100, 'Commission must be between 0 and 100'),
  status: z.enum(['active', 'inactive', 'slashed', 'pending']),
  uptime: z.number().min(0).max(100, 'Uptime must be between 0 and 100'),
  rewards: z.number().nonnegative('Rewards must be non-negative'),
  lastActive: z.date(),
});

// Staking reward schema
export const StakingRewardSchema = z.object({
  validatorAddress: z.string().min(1, 'Validator address is required'),
  delegatorAddress: z.string().min(1, 'Delegator address is required'),
  amount: z.number().positive('Reward amount must be positive'),
  tokenSymbol: z.string().min(1, 'Token symbol is required'),
  timestamp: z.date(),
  blockNumber: z.number().nonnegative(),
  rewardType: z.enum(['block_reward', 'transaction_fee', 'penalty']),
});

/**
 * Error and Response Schemas
 */

// API error response schema
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  timestamp: z.date(),
});

// API success response schema
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  timestamp: z.date(),
});

// Generic API response schema
export const ApiResponseSchema = z.discriminatedUnion('success', [
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
]);

/**
 * Type inference from schemas
 */

// Transaction types
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;
export type BatchTransaction = z.infer<typeof BatchTransactionSchema>;
export type TransactionResult = z.infer<typeof TransactionResultSchema>;

// Performance metrics types
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type DetailedPerformanceMetrics = z.infer<typeof DetailedPerformanceMetricsSchema>;
export type PerformanceBenchmark = z.infer<typeof PerformanceBenchmarkSchema>;

// Token transfer types
export type TokenTransfer = z.infer<typeof TokenTransferSchema>;
export type ValidatedTokenTransfer = z.infer<typeof ValidatedTokenTransferSchema>;
export type BatchTokenTransfer = z.infer<typeof BatchTokenTransferSchema>;
export type TokenBalance = z.infer<typeof TokenBalanceSchema>;

// Blockchain types
export type Block = z.infer<typeof BlockSchema>;
export type NetworkStatus = z.infer<typeof NetworkStatusSchema>;

// Validator types
export type ValidatorInfo = z.infer<typeof ValidatorInfoSchema>;
export type StakingReward = z.infer<typeof StakingRewardSchema>;

// API response types
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

/**
 * Validation utility functions
 */

/**
 * Validate transaction input
 */
export function validateTransactionInput(data: unknown): TransactionInput {
  return TransactionInputSchema.parse(data);
}

/**
 * Validate performance metrics
 */
export function validatePerformanceMetrics(data: unknown): PerformanceMetrics {
  return PerformanceMetricsSchema.parse(data);
}

/**
 * Validate token transfer
 */
export function validateTokenTransfer(data: unknown): TokenTransfer {
  return TokenTransferSchema.parse(data);
}

/**
 * Safe validation with error handling
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Create API response
 */
export function createApiResponse<T>(
  success: boolean,
  data: T | { code: string; message: string; details?: any },
  timestamp: Date = new Date()
): ApiResponse {
  if (success) {
    return {
      success: true as const,
      data,
      timestamp,
    };
  } else {
    return {
      success: false as const,
      error: data as { code: string; message: string; details?: any },
      timestamp,
    };
  }
}

/**
 * Middleware for request validation
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return schema.parse(data);
  };
}

// Export commonly used validation middleware
export const validateTransactionMiddleware = createValidationMiddleware(TransactionInputSchema);
export const validatePerformanceMetricsMiddleware = createValidationMiddleware(PerformanceMetricsSchema);
export const validateTokenTransferMiddleware = createValidationMiddleware(TokenTransferSchema);