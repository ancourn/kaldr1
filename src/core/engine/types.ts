/**
 * Core types and interfaces for the KALDRIX DAG-based blockchain engine
 */

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: bigint;
  gasLimit: bigint;
  gasPrice: bigint;
  nonce: number;
  data?: string;
  signature: string;
  timestamp: number;
  priority: number;
  quantumSignature?: string;
  type?: 'transfer' | 'contract' | 'staking' | 'defi';
  contractData?: ContractData;
}

export interface ContractData {
  bytecode?: string; // For contract deployment
  functionSignature?: string; // For contract calls (e.g., "transfer(address,uint256)")
  args: any[]; // Function arguments
  value: bigint; // ETH value sent with contract call
  contractAddress?: string; // For existing contract calls
  deployment?: boolean; // True if this is a contract deployment
}

export interface ContractExecutionResult {
  success: boolean;
  returnValue?: any;
  gasUsed: bigint;
  logs: ContractLog[];
  error?: string;
  contractAddress?: string; // For deployments
}

export interface ContractLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber?: number;
  transactionIndex?: number;
  logIndex?: number;
}

export interface ContractState {
  address: string;
  bytecode: string;
  storage: Map<string, string>;
  balance: bigint;
  nonce: number;
}

export interface DAGNode {
  id: string;
  hash: string;
  parentHashes: string[];
  transactions: Transaction[];
  timestamp: number;
  validator: string;
  signature: string;
  level: number; // DAG level for ordering
  weight: number; // Cumulative weight for consensus
  confirmed: boolean;
  gasUsed: bigint;
  gasLimit: bigint;
  contractResults?: ContractExecutionResult[]; // Contract execution results
}

export interface Validator {
  id: string;
  address: string;
  stake: bigint;
  isActive: boolean;
  lastActive: number;
  reputation: number;
  region: string;
  stakingRewards: bigint;
  totalRewards: bigint;
  delegators: Delegator[];
  commissionRate: number; // Percentage of rewards kept by validator
  minimumStake: bigint;
  maximumStake: bigint;
  unstakingTime: number; // Timestamp when unstaking completes
  isUnstaking: boolean;
}

export interface Delegator {
  address: string;
  stakedAmount: bigint;
  rewards: bigint;
  stakeTimestamp: number;
  lastRewardTimestamp: number;
}

export interface StakingTransaction {
  id: string;
  from: string;
  to: string; // validator address for delegation
  amount: bigint;
  type: 'stake' | 'unstake' | 'claim_rewards' | 'delegate' | 'undelegate';
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  gasUsed: bigint;
  blockNumber?: number;
}

export interface StakingRewards {
  validatorId: string;
  totalRewards: bigint;
  delegatorRewards: bigint;
  commissionRewards: bigint;
  apy: number; // Annual Percentage Yield
  rewardHistory: RewardHistory[];
}

export interface RewardHistory {
  timestamp: number;
  amount: bigint;
  blockNumber: number;
  rewardType: 'block' | 'commission' | 'penalty';
}

export interface StakingPool {
  totalStaked: bigint;
  activeValidators: number;
  totalRewards: bigint;
  averageApy: number;
  stakingRatio: number; // Percentage of total supply staked
}

export interface MempoolEntry {
  transaction: Transaction;
  timestamp: number;
  priorityScore: number;
  gasPrice: bigint;
  bundleId?: string;
}

export interface TransactionBundle {
  id: string;
  transactions: Transaction[];
  totalFee: bigint;
  estimatedGas: bigint;
  preConfirmed: boolean;
  timestamp: number;
  validatorSignatures: string[];
  priority: number;
}

export interface DAGMetrics {
  tps: number;
  latency: number;
  confirmationTime: number;
  successRate: number;
  memoryUsage: number;
  cpuUsage: number;
  nodeCount: number;
  averageLevel: number;
  confirmationRate: number;
}

export interface ConsensusState {
  currentLevel: number;
  confirmedNodes: Set<string>;
  pendingNodes: Set<string>;
  totalWeight: number;
  validatorSet: Set<string>;
  lastConfirmed: string;
}

export interface EngineConfig {
  maxMempoolSize: number;
  targetBlockTime: number;
  maxTransactionsPerBundle: number;
  maxNodesPerLevel: number;
  confirmationThreshold: number;
  validatorCount: number;
  priorityLevels: number;
  baseFee: bigint;
  feeAdjustmentFactor: number;
  preConfirmationTimeout: number;
  enableQuantumFeatures: boolean;
}

export interface PerformanceSnapshot {
  timestamp: number;
  tps: number;
  latency: number;
  memoryUsage: number;
  cpuUsage: number;
  nodeCount: number;
  bundleCount: number;
  confirmationRate: number;
}

export interface DAGEngineEvents {
  'nodeAdded': (node: DAGNode) => void;
  'nodeConfirmed': (nodeId: string) => void;
  'bundleCreated': (bundle: TransactionBundle) => void;
  'bundlePreConfirmed': (bundleId: string) => void;
  'transactionAdded': (transaction: Transaction) => void;
  'metricsUpdated': (metrics: DAGMetrics) => void;
  'validatorAdded': (validator: Validator) => void;
  'validatorRemoved': (validatorId: string) => void;
  'error': (error: Error) => void;
}