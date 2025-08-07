/**
 * KALDRIX Real-World Simulation Mode
 * 
 * Simulates realistic blockchain network behavior with mock validators,
 * user wallets, and various network conditions including malicious actors.
 */

import { DAGBlockEngine } from './dag-engine';
import type { Transaction, Validator } from './types';

export interface SimulationConfig {
  duration: number; // in seconds
  userWallets: number;
  validatorNodes: number;
  maliciousValidators: number;
  slowValidators: number;
  regionDistribution: string[];
  transactionBurst: boolean;
  idlePeriods: boolean;
  networkLatency: {
    min: number;
    max: number;
    regions: Record<string, number>;
  };
  failureRate: number; // percentage of transactions that should fail
  healthCheckInterval: number; // in seconds
  retryLogic: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  transactionTypes: {
    transfer: number; // percentage
    contract: number; // percentage
    staking: number; // percentage
    defi: number; // percentage
  };
  userBehavior: {
    sessionLength: {
      min: number; // in seconds
      max: number; // in seconds
    };
    burstProbability: number; // probability of burst mode
    burstDuration: {
      min: number; // in seconds
      max: number; // in seconds
    };
    idleProbability: number; // probability of idle periods
    idleDuration: {
      min: number; // in seconds
      max: number; // in seconds
    };
  };
}

export interface UserWallet {
  id: string;
  address: string;
  balance: bigint;
  transactionHistory: Transaction[];
  behavior: 'active' | 'normal' | 'idle';
  region: string;
  lastActivity: number;
  sessionStart: number;
  sessionTransactions: number;
  retryAttempts: number;
  consecutiveFailures: number;
  burstMode: boolean;
  burstStartTime: number;
  avgTransactionValue: bigint;
  preferredTransactionType: 'transfer' | 'contract' | 'staking' | 'defi';
}

export interface SimulatedValidator extends Validator {
  isMalicious: boolean;
  isSlow: boolean;
  failureRate: number;
  region: string;
  uptime: number;
  responseTime: number;
  lastHealthCheck: number;
  contributionScore: number;
}

export interface SimulationResults {
  simulationId: string;
  config: SimulationConfig;
  startTime: number;
  endTime: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  maliciousActions: number;
  recoveryEvents: number;
  validatorPerformance: ValidatorPerformance[];
  userActivity: UserActivitySummary[];
  networkHealth: NetworkHealthMetrics;
}

export interface ValidatorPerformance {
  validatorId: string;
  uptime: number;
  responseTime: number;
  contributionScore: number;
  maliciousActions: number;
  recoveryEvents: number;
  health: 'healthy' | 'degraded' | 'failed' | 'malicious';
}

export interface UserActivitySummary {
  walletId: string;
  transactionsSent: number;
  averageValue: bigint;
  behavior: 'active' | 'normal' | 'idle';
  region: string;
}

export interface NetworkHealthMetrics {
  averageLatency: number;
  uptime: number;
  failureRate: number;
  recoveryTime: number;
  consensusHealth: number;
  maliciousActivity: number;
}

export class RealWorldSimulation {
  private engine: DAGBlockEngine;
  private isRunning = false;
  private config: SimulationConfig;
  private userWallets: UserWallet[] = [];
  private simulatedValidators: SimulatedValidator[] = [];
  private currentSimulation: SimulationResults | null = null;
  private transactionCount = 0;
  private failureCount = 0;
  private maliciousActions = 0;
  private recoveryEvents = 0;

  constructor(engine: DAGBlockEngine) {
    this.engine = engine;
  }

  /**
   * Start real-world simulation
   */
  async startSimulation(config: SimulationConfig): Promise<SimulationResults> {
    if (this.isRunning) {
      throw new Error('Simulation already running');
    }

    this.isRunning = true;
    this.config = config;
    const simulationId = `sim_${Date.now()}_${config.userWallets}users`;
    const startTime = Date.now();

    console.log(`🌍 Starting real-world simulation: ${simulationId}`);
    console.log(`👥 Users: ${config.userWallets}, Validators: ${config.validatorNodes}`);
    console.log(`⚠️  Malicious validators: ${config.maliciousValidators}, Slow: ${config.slowValidators}`);

    // Initialize simulation components
    this.initializeUserWallets();
    this.initializeSimulatedValidators();

    // Set up simulation
    this.currentSimulation = {
      simulationId,
      config,
      startTime,
      endTime: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      maliciousActions: 0,
      recoveryEvents: 0,
      validatorPerformance: [],
      userActivity: [],
      networkHealth: {
        averageLatency: 0,
        uptime: 100,
        failureRate: 0,
        recoveryTime: 0,
        consensusHealth: 100,
        maliciousActivity: 0
      }
    };

    try {
      // Run simulation
      await this.executeSimulation();
      
      // Analyze results
      const results = await this.analyzeResults();
      
      console.log(`✅ Simulation completed: ${simulationId}`);
      console.log(`📊 Total transactions: ${results.totalTransactions}`);
      console.log(`🚨 Malicious actions: ${results.maliciousActions}`);
      console.log(`🔄 Recovery events: ${results.recoveryEvents}`);
      
      return results;
    } catch (error) {
      console.error('❌ Simulation failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.cleanup();
    }
  }

  private initializeUserWallets(): void {
    this.userWallets = [];
    
    for (let i = 0; i < this.config.userWallets; i++) {
      const region = this.config.regionDistribution[
        Math.floor(Math.random() * this.config.regionDistribution.length)
      ];
      
      const behavior = this.getRandomBehavior();
      const preferredType = this.getPreferredTransactionType();
      
      const wallet: UserWallet = {
        id: `wallet_${i}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        balance: BigInt(Math.floor(Math.random() * 1000000) + 1000) * BigInt('1000000000000000000'),
        transactionHistory: [],
        behavior,
        region,
        lastActivity: Date.now(),
        sessionStart: Date.now(),
        sessionTransactions: 0,
        retryAttempts: 0,
        consecutiveFailures: 0,
        burstMode: false,
        burstStartTime: 0,
        avgTransactionValue: this.calculateAverageTransactionValue(behavior),
        preferredTransactionType: preferredType
      };
      
      this.userWallets.push(wallet);
    }
    
    console.log(`👛 Initialized ${this.userWallets.length} user wallets with enhanced behavior patterns`);
  }

  private initializeSimulatedValidators(): void {
    this.simulatedValidators = [];
    
    // Create validator pool
    const validatorPool: SimulatedValidator[] = [];
    
    for (let i = 0; i < this.config.validatorNodes; i++) {
      const region = this.config.regionDistribution[
        Math.floor(Math.random() * this.config.regionDistribution.length)
      ];
      
      const validator: SimulatedValidator = {
        id: `sim_validator_${i}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        stake: BigInt(Math.floor(Math.random() * 5000) + 1000) * BigInt('1000000000000000000'),
        isActive: true,
        lastActive: Date.now(),
        reputation: 90 + Math.random() * 10,
        region,
        isMalicious: false,
        isSlow: false,
        failureRate: 0.01, // 1% base failure rate
        uptime: 100,
        responseTime: this.getRegionalLatency(region),
        lastHealthCheck: Date.now(),
        contributionScore: 0
      };
      
      validatorPool.push(validator);
    }
    
    // Designate malicious validators
    for (let i = 0; i < this.config.maliciousValidators; i++) {
      if (i < validatorPool.length) {
        validatorPool[i].isMalicious = true;
        validatorPool[i].failureRate = 0.3; // 30% failure rate for malicious validators
        console.log(`⚠️  Designated validator ${validatorPool[i].id} as malicious`);
      }
    }
    
    // Designate slow validators
    for (let i = this.config.maliciousValidators; i < this.config.maliciousValidators + this.config.slowValidators; i++) {
      if (i < validatorPool.length) {
        validatorPool[i].isSlow = true;
        validatorPool[i].responseTime *= 3; // 3x slower response
        console.log(`🐌 Designated validator ${validatorPool[i].id} as slow`);
      }
    }
    
    this.simulatedValidators = validatorPool;
    
    // Add simulated validators to the DAG engine
    this.simulatedValidators.forEach(validator => {
      this.engine.addValidator(validator);
    });
    
    console.log(`🔧 Initialized ${this.simulatedValidators.length} simulated validators`);
  }

  private getRandomBehavior(): 'active' | 'normal' | 'idle' {
    const rand = Math.random();
    if (rand < 0.2) return 'active';
    if (rand < 0.7) return 'normal';
    return 'idle';
  }

  private getPreferredTransactionType(): 'transfer' | 'contract' | 'staking' | 'defi' {
    const rand = Math.random();
    if (rand < 0.6) return 'transfer';
    if (rand < 0.75) return 'contract';
    if (rand < 0.9) return 'staking';
    return 'defi';
  }

  private calculateAverageTransactionValue(behavior: 'active' | 'normal' | 'idle'): bigint {
    switch (behavior) {
      case 'active':
        return BigInt(Math.floor(Math.random() * 50) + 10) * BigInt('1000000000000000000');
      case 'normal':
        return BigInt(Math.floor(Math.random() * 100) + 20) * BigInt('1000000000000000000');
      case 'idle':
        return BigInt(Math.floor(Math.random() * 200) + 50) * BigInt('1000000000000000000');
      default:
        return BigInt('1000000000000000000');
    }
  }

  private getRegionalLatency(region: string): number {
    const baseLatency = this.config.networkLatency.regions[region] || 100;
    return baseLatency + Math.random() * (this.config.networkLatency.max - this.config.networkLatency.min);
  }

  private async executeSimulation(): Promise<void> {
    const endTime = Date.now() + (this.config.duration * 1000);
    
    // Start user transaction simulation
    this.startUserTransactionSimulation();
    
    // Start validator health monitoring
    this.startValidatorHealthMonitoring();
    
    // Start malicious behavior simulation
    this.startMaliciousBehaviorSimulation();
    
    // Wait for simulation completion
    await new Promise(resolve => setTimeout(resolve, this.config.duration * 1000));
  }

  private startUserTransactionSimulation(): void {
    const simulateUserTransactions = () => {
      if (!this.isRunning) return;
      
      // Simulate different user behaviors
      this.userWallets.forEach(wallet => {
        if (this.shouldUserTransact(wallet)) {
          this.generateUserTransaction(wallet);
        }
      });
      
      // Schedule next batch
      const nextInterval = this.getTransactionInterval();
      setTimeout(simulateUserTransactions, nextInterval);
    };
    
    // Start simulation
    setTimeout(simulateUserTransactions, 100);
  }

  private shouldUserTransact(wallet: UserWallet): boolean {
    const now = Date.now();
    const timeSinceActivity = now - wallet.lastActivity;
    const sessionLength = now - wallet.sessionStart;
    
    // Check if session should end
    const maxSessionLength = this.config.userBehavior.sessionLength.max * 1000;
    if (sessionLength > maxSessionLength) {
      // Start new session
      wallet.sessionStart = now;
      wallet.sessionTransactions = 0;
      wallet.retryAttempts = 0;
      wallet.consecutiveFailures = 0;
      wallet.burstMode = false;
    }
    
    // Handle burst mode
    if (wallet.burstMode) {
      const burstDuration = now - wallet.burstStartTime;
      const maxBurstDuration = this.config.userBehavior.burstDuration.max * 1000;
      
      if (burstDuration > maxBurstDuration) {
        wallet.burstMode = false;
      } else {
        // High activity during burst
        return timeSinceActivity < 1000 && Math.random() > 0.1;
      }
    }
    
    // Check for idle periods
    if (this.config.idlePeriods && Math.random() < this.config.userBehavior.idleProbability) {
      const idleDuration = this.config.userBehavior.idleDuration.min * 1000 + 
                         Math.random() * (this.config.userBehavior.idleDuration.max - this.config.userBehavior.idleDuration.min) * 1000;
      return timeSinceActivity > idleDuration && Math.random() > 0.95;
    }
    
    // Check for burst mode activation
    if (this.config.transactionBurst && Math.random() < this.config.userBehavior.burstProbability) {
      wallet.burstMode = true;
      wallet.burstStartTime = now;
      return true;
    }
    
    // Different activity patterns based on behavior
    switch (wallet.behavior) {
      case 'active':
        return timeSinceActivity < 3000 && Math.random() > 0.2 && wallet.sessionTransactions < 50;
      case 'normal':
        return timeSinceActivity < 10000 && Math.random() > 0.6 && wallet.sessionTransactions < 20;
      case 'idle':
        return timeSinceActivity < 30000 && Math.random() > 0.8 && wallet.sessionTransactions < 5;
      default:
        return false;
    }
  }

  private getTransactionInterval(): number {
    if (this.config.transactionBurst && Math.random() > 0.8) {
      // Burst mode: high frequency transactions
      return Math.random() * 100 + 50; // 50-150ms
    }
    
    if (this.config.idlePeriods && Math.random() > 0.9) {
      // Idle period: low frequency
      return Math.random() * 5000 + 2000; // 2-7 seconds
    }
    
    // Normal operation
    return Math.random() * 1000 + 200; // 200-1200ms
  }

  private generateUserTransaction(wallet: UserWallet): void {
    const recipientWallet = this.userWallets[Math.floor(Math.random() * this.userWallets.length)];
    if (recipientWallet.id === wallet.id) return; // Don't send to self
    
    // Determine transaction type based on wallet preference and config
    const txType = this.determineTransactionType(wallet);
    
    // Calculate amount based on transaction type and wallet behavior
    const amount = this.calculateTransactionAmount(wallet, txType);
    
    if (wallet.balance < amount) return; // Insufficient balance
    
    const transaction: Transaction = {
      id: `sim_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: wallet.address,
      to: recipientWallet.address,
      amount,
      gasLimit: this.calculateGasLimit(txType),
      gasPrice: this.calculateGasPrice(txType),
      nonce: wallet.transactionHistory.length,
      signature: '0x' + Math.random().toString(16).substr(2, 128),
      timestamp: Date.now(),
      priority: this.calculateTransactionPriority(wallet, txType),
      quantumSignature: Math.random() > 0.7 ? '0x' + Math.random().toString(16).substr(2, 128) : undefined,
      type: txType
    };
    
    // Simulate network latency
    const latency = this.getRegionalLatency(wallet.region);
    
    this.executeTransactionWithRetry(wallet, recipientWallet, transaction, latency);
  }

  private determineTransactionType(wallet: UserWallet): 'transfer' | 'contract' | 'staking' | 'defi' {
    // 70% chance to use preferred type, 30% random
    if (Math.random() < 0.7) {
      return wallet.preferredTransactionType;
    }
    
    const rand = Math.random();
    const types = this.config.transactionTypes;
    const cumulative = types.transfer + types.contract + types.staking;
    
    if (rand < types.transfer / 100) return 'transfer';
    if (rand < (types.transfer + types.contract) / 100) return 'contract';
    if (rand < cumulative / 100) return 'staking';
    return 'defi';
  }

  private calculateTransactionAmount(wallet: UserWallet, txType: 'transfer' | 'contract' | 'staking' | 'defi'): bigint {
    const baseAmount = wallet.avgTransactionValue;
    const variance = 0.5; // ±50% variance
    
    switch (txType) {
      case 'transfer':
        return baseAmount * BigInt(Math.floor(Math.random() * variance * 2 + (1 - variance)));
      case 'contract':
        return baseAmount * BigInt(Math.floor(Math.random() * variance * 3 + (1 - variance))); // Higher variance for contract calls
      case 'staking':
        return baseAmount * BigInt(Math.floor(Math.random() * variance + 0.5)); // More consistent for staking
      case 'defi':
        return baseAmount * BigInt(Math.floor(Math.random() * variance * 4 + (1 - variance))); // Highest variance for DeFi
      default:
        return baseAmount;
    }
  }

  private calculateGasLimit(txType: 'transfer' | 'contract' | 'staking' | 'defi'): bigint {
    switch (txType) {
      case 'transfer':
        return BigInt('21000');
      case 'contract':
        return BigInt(Math.floor(Math.random() * 200000 + 100000)); // 100K-300K gas
      case 'staking':
        return BigInt(Math.floor(Math.random() * 80000 + 40000)); // 40K-120K gas
      case 'defi':
        return BigInt(Math.floor(Math.random() * 500000 + 200000)); // 200K-700K gas
      default:
        return BigInt('21000');
    }
  }

  private calculateGasPrice(txType: 'transfer' | 'contract' | 'staking' | 'defi'): bigint {
    const baseGasPrice = BigInt('1000000000'); // 1 gwei
    const priorityMultiplier = {
      transfer: 1.0,
      contract: 1.5,
      staking: 1.2,
      defi: 2.0
    };
    
    return baseGasPrice * BigInt(Math.floor(priorityMultiplier[txType] * (Math.random() * 0.5 + 1)));
  }

  private calculateTransactionPriority(wallet: UserWallet, txType: 'transfer' | 'contract' | 'staking' | 'defi'): number {
    let priority = 1;
    
    // Base priority from wallet behavior
    switch (wallet.behavior) {
      case 'active': priority += 2; break;
      case 'normal': priority += 1; break;
      case 'idle': priority += 0; break;
    }
    
    // Priority from transaction type
    switch (txType) {
      case 'defi': priority += 2; break;
      case 'contract': priority += 1; break;
      case 'staking': priority += 0; break;
      case 'transfer': priority += 0; break;
    }
    
    // Burst mode bonus
    if (wallet.burstMode) priority += 1;
    
    // Retry penalty
    priority -= wallet.retryAttempts;
    
    return Math.max(1, priority);
  }

  private async executeTransactionWithRetry(
    wallet: UserWallet, 
    recipientWallet: UserWallet, 
    transaction: Transaction, 
    latency: number
  ): Promise<void> {
    const executeWithDelay = async (attempt: number) => {
      if (!this.isRunning) return;
      
      try {
        const success = await this.engine.addTransaction(transaction);
        
        if (success) {
          // Update wallet balances
          const gasCost = transaction.gasLimit * transaction.gasPrice;
          wallet.balance -= transaction.amount + gasCost;
          recipientWallet.balance += transaction.amount;
          
          // Update transaction history
          wallet.transactionHistory.push(transaction);
          wallet.lastActivity = Date.now();
          wallet.sessionTransactions++;
          wallet.retryAttempts = 0;
          wallet.consecutiveFailures = 0;
          
          this.transactionCount++;
        } else {
          await this.handleTransactionFailure(wallet, transaction, attempt);
        }
      } catch (error) {
        await this.handleTransactionFailure(wallet, transaction, attempt);
      }
    };
    
    setTimeout(() => executeWithDelay(0), latency);
  }

  private async handleTransactionFailure(wallet: UserWallet, transaction: Transaction, attempt: number): Promise<void> {
    wallet.consecutiveFailures++;
    wallet.retryAttempts++;
    
    if (attempt < this.config.retryLogic.maxRetries) {
      // Retry with exponential backoff
      const retryDelay = this.config.retryLogic.retryDelay * 
                        Math.pow(this.config.retryLogic.backoffMultiplier, attempt);
      
      setTimeout(() => {
        if (this.isRunning) {
          this.executeTransactionWithRetry(
            wallet,
            this.userWallets.find(w => w.address === transaction.to)!,
            transaction,
            this.getRegionalLatency(wallet.region)
          );
        }
      }, retryDelay);
    } else {
      // Max retries reached, give up
      this.failureCount++;
      wallet.retryAttempts = 0; // Reset retry counter for next transaction
    }
  }

  private startValidatorHealthMonitoring(): void {
    const monitorValidatorHealth = () => {
      if (!this.isRunning) return;
      
      this.simulatedValidators.forEach(validator => {
        this.performValidatorHealthCheck(validator);
      });
      
      setTimeout(monitorValidatorHealth, this.config.healthCheckInterval * 1000);
    };
    
    setTimeout(monitorValidatorHealth, this.config.healthCheckInterval * 1000);
  }

  private performValidatorHealthCheck(validator: SimulatedValidator): void {
    const now = Date.now();
    const timeSinceCheck = now - validator.lastHealthCheck;
    
    // Simulate validator response time
    const responseTime = validator.responseTime + (Math.random() * 50 - 25);
    
    // Check if validator should fail
    const shouldFail = Math.random() < validator.failureRate;
    
    if (shouldFail) {
      validator.uptime = Math.max(0, validator.uptime - 5);
      validator.isActive = false;
      
      if (validator.isMalicious) {
        this.maliciousActions++;
        console.log(`⚠️  Malicious validator ${validator.id} failed health check`);
      } else {
        console.log(`❌ Validator ${validator.id} failed health check`);
      }
      
      // Simulate recovery
      setTimeout(() => {
        validator.isActive = true;
        validator.uptime = Math.min(100, validator.uptime + 2);
        validator.lastActive = Date.now();
        this.recoveryEvents++;
        console.log(`✅ Validator ${validator.id} recovered`);
      }, Math.random() * 10000 + 5000); // 5-15 second recovery
    } else {
      validator.uptime = Math.min(100, validator.uptime + 0.1);
      validator.contributionScore += 1;
      validator.lastHealthCheck = now;
    }
    
    validator.responseTime = responseTime;
  }

  private startMaliciousBehaviorSimulation(): void {
    const simulateMaliciousBehavior = () => {
      if (!this.isRunning) return;
      
      this.simulatedValidators.forEach(validator => {
        if (validator.isMalicious && validator.isActive) {
          this.simulateMaliciousActions(validator);
        }
      });
      
      setTimeout(simulateMaliciousBehavior, Math.random() * 30000 + 10000); // 10-40 seconds
    };
    
    setTimeout(simulateMaliciousBehavior, 10000); // Start after 10 seconds
  }

  private simulateMaliciousActions(validator: SimulatedValidator): void {
    const actionType = Math.random();
    
    if (actionType < 0.3) {
      // Double-spend attempt
      this.simulateDoubleSpend(validator);
    } else if (actionType < 0.6) {
      // Spam transactions
      this.simulateTransactionSpam(validator);
    } else {
      // Delay validation
      this.simulateValidationDelay(validator);
    }
  }

  private simulateDoubleSpend(validator: SimulatedValidator): void {
    console.log(`⚠️  Malicious validator ${validator.id} attempting double-spend`);
    this.maliciousActions++;
    
    // This would be detected and handled by the consensus algorithm
    // For simulation, we just log the attempt
  }

  private simulateTransactionSpam(validator: SimulatedValidator): void {
    console.log(`⚠️  Malicious validator ${validator.id} spamming transactions`);
    this.maliciousActions++;
    
    // Generate spam transactions
    for (let i = 0; i < 10; i++) {
      const spamTransaction: Transaction = {
        id: `spam_${Date.now()}_${i}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        amount: BigInt('1'),
        gasLimit: BigInt('21000'),
        gasPrice: BigInt('1000000000'),
        nonce: Math.floor(Math.random() * 1000000),
        signature: '0x' + Math.random().toString(16).substr(2, 128),
        timestamp: Date.now(),
        priority: 1,
        quantumSignature: undefined
      };
      
      this.engine.addTransaction(spamTransaction).catch(() => {
        // Spam transactions expected to fail
      });
    }
  }

  private simulateValidationDelay(validator: SimulatedValidator): void {
    console.log(`⚠️  Malicious validator ${validator.id} delaying validation`);
    this.maliciousActions++;
    
    // Simulate delayed validation by increasing response time
    validator.responseTime *= 5;
    
    // Recover after some time
    setTimeout(() => {
      validator.responseTime /= 5;
    }, Math.random() * 20000 + 10000);
  }

  private async analyzeResults(): Promise<SimulationResults> {
    if (!this.currentSimulation) {
      throw new Error('No simulation results available');
    }

    const results = { ...this.currentSimulation };
    results.endTime = Date.now();
    results.totalTransactions = this.transactionCount;
    results.successfulTransactions = this.transactionCount - this.failureCount;
    results.failedTransactions = this.failureCount;
    results.maliciousActions = this.maliciousActions;
    results.recoveryEvents = this.recoveryEvents;

    // Analyze validator performance
    results.validatorPerformance = this.simulatedValidators.map(validator => ({
      validatorId: validator.id,
      uptime: validator.uptime,
      responseTime: validator.responseTime,
      contributionScore: validator.contributionScore,
      maliciousActions: validator.isMalicious ? this.maliciousActions / this.config.maliciousValidators : 0,
      recoveryEvents: validator.uptime < 100 ? this.recoveryEvents / this.simulatedValidators.length : 0,
      health: this.getValidatorHealth(validator)
    }));

    // Analyze user activity
    results.userActivity = this.userWallets.map(wallet => ({
      walletId: wallet.id,
      transactionsSent: wallet.transactionHistory.length,
      averageValue: wallet.transactionHistory.length > 0 
        ? wallet.transactionHistory.reduce((sum, tx) => sum + tx.amount, BigInt('0')) / BigInt(wallet.transactionHistory.length)
        : BigInt('0'),
      behavior: wallet.behavior,
      region: wallet.region
    }));

    // Calculate network health metrics
    results.networkHealth = this.calculateNetworkHealth();

    return results;
  }

  private getValidatorHealth(validator: SimulatedValidator): 'healthy' | 'degraded' | 'failed' | 'malicious' {
    if (validator.isMalicious) return 'malicious';
    if (validator.uptime < 50) return 'failed';
    if (validator.uptime < 90) return 'degraded';
    return 'healthy';
  }

  private calculateNetworkHealth(): NetworkHealthMetrics {
    const avgUptime = this.simulatedValidators.reduce((sum, v) => sum + v.uptime, 0) / this.simulatedValidators.length;
    const avgLatency = this.simulatedValidators.reduce((sum, v) => sum + v.responseTime, 0) / this.simulatedValidators.length;
    const failureRate = (this.failureCount / this.transactionCount) * 100;
    
    return {
      averageLatency: avgLatency,
      uptime: avgUptime,
      failureRate,
      recoveryTime: this.recoveryEvents > 0 ? (this.config.duration * 1000) / this.recoveryEvents : 0,
      consensusHealth: avgUptime,
      maliciousActivity: (this.maliciousActions / this.config.duration) * 100 // Actions per second
    };
  }

  private cleanup(): void {
    this.userWallets = [];
    this.simulatedValidators = [];
    this.transactionCount = 0;
    this.failureCount = 0;
    this.maliciousActions = 0;
    this.recoveryEvents = 0;
  }

  /**
   * Get current simulation status
   */
  getCurrentSimulation(): SimulationResults | null {
    return this.currentSimulation;
  }

  /**
   * Check if simulation is running
   */
  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get user wallets
   */
  getUserWallets(): UserWallet[] {
    return [...this.userWallets];
  }

  /**
   * Get simulated validators
   */
  getSimulatedValidators(): SimulatedValidator[] {
    return [...this.simulatedValidators];
  }
}