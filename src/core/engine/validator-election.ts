/**
 * KALDRIX Validator Election Improvements
 * 
 * Advanced validator management system with dynamic replacement,
 * slashing logic, and reward tracking for enhanced network security.
 */

import { DAGBlockEngine } from './dag-engine';
import type { Validator } from './types';

export interface ValidatorElectionConfig {
  maxValidators: number;
  minValidators: number;
  replacementThreshold: number; // Uptime percentage below which validators get replaced
  slashThreshold: number; // Uptime percentage below which validators get slashed
  rewardMultiplier: number;
  slashRate: number; // Percentage of stake to slash
  healthCheckInterval: number; // in seconds
  electionInterval: number; // in seconds
  minStake: bigint;
  reputationBonus: number;
}

export interface ValidatorStats {
  validatorId: string;
  uptime: number;
  responseTime: number;
  contributionScore: number;
  blocksProduced: number;
  transactionsProcessed: number;
  rewardsEarned: bigint;
  penalties: bigint;
  reputation: number;
  lastHealthCheck: number;
  isActive: boolean;
  isSlashed: boolean;
  slashCount: number;
  region: string;
}

export interface ElectionResult {
  electionId: string;
  timestamp: number;
  addedValidators: string[];
  removedValidators: string[];
  slashedValidators: string[];
  totalValidators: number;
  averageUptime: number;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RewardDistribution {
  distributionId: string;
  timestamp: number;
  totalRewards: bigint;
  validatorRewards: Record<string, bigint>;
  slashPenalties: Record<string, bigint>;
  networkFee: bigint;
}

export class ValidatorElectionManager {
  private engine: DAGBlockEngine;
  private config: ValidatorElectionConfig;
  private validatorStats: Map<string, ValidatorStats> = new Map();
  private candidateValidators: Validator[] = [];
  private electionHistory: ElectionResult[] = [];
  private rewardHistory: RewardDistribution[] = [];
  private isRunning = false;
  private electionInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(engine: DAGBlockEngine, config: Partial<ValidatorElectionConfig> = {}) {
    this.engine = engine;
    
    this.config = {
      maxValidators: config.maxValidators || 21,
      minValidators: config.minValidators || 7,
      replacementThreshold: config.replacementThreshold || 80,
      slashThreshold: config.slashThreshold || 50,
      rewardMultiplier: config.rewardMultiplier || 1.0,
      slashRate: config.slashRate || 0.1, // 10% slash rate
      healthCheckInterval: config.healthCheckInterval || 30,
      electionInterval: config.electionInterval || 300, // 5 minutes
      minStake: config.minStake || BigInt('1000000000000000000000'),
      reputationBonus: config.reputationBonus || 0.1
    };
  }

  /**
   * Start validator election system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Validator election system already running');
      return;
    }

    this.isRunning = true;
    console.log('🗳️ Starting validator election system...');
    console.log(`📊 Config: ${this.config.minValidators}-${this.config.maxValidators} validators`);
    console.log(`⚡ Health check every ${this.config.healthCheckInterval}s, election every ${this.config.electionInterval}s`);

    // Initialize validator stats
    this.initializeValidatorStats();

    // Start health monitoring
    this.startHealthMonitoring();

    // Start election process
    this.startElectionProcess();

    console.log('✅ Validator election system started');
  }

  /**
   * Stop validator election system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Validator election system not running');
      return;
    }

    this.isRunning = false;

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.electionInterval) {
      clearInterval(this.electionInterval);
    }

    console.log('🛑 Validator election system stopped');
  }

  /**
   * Add candidate validator for election
   */
  addCandidateValidator(validator: Validator): void {
    if (validator.stake < this.config.minStake) {
      console.log(`❌ Validator ${validator.id} stake below minimum requirement`);
      return;
    }

    this.candidateValidators.push(validator);
    console.log(`📝 Added candidate validator: ${validator.id}`);
  }

  /**
   * Remove candidate validator
   */
  removeCandidateValidator(validatorId: string): void {
    this.candidateValidators = this.candidateValidators.filter(v => v.id !== validatorId);
    console.log(`🗑️ Removed candidate validator: ${validatorId}`);
  }

  /**
   * Get current validator statistics
   */
  getValidatorStats(): ValidatorStats[] {
    return Array.from(this.validatorStats.values());
  }

  /**
   * Get election history
   */
  getElectionHistory(): ElectionResult[] {
    return [...this.electionHistory];
  }

  /**
   * Get reward distribution history
   */
  getRewardHistory(): RewardDistribution[] {
    return [...this.rewardHistory];
  }

  /**
   * Force election process
   */
  async forceElection(): Promise<ElectionResult> {
    console.log('🗳️ Forcing validator election...');
    return await this.performElection();
  }

  /**
   * Get network health status
   */
  getNetworkHealth(): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    averageUptime: number;
    activeValidators: number;
    slashedValidators: number;
  } {
    const stats = Array.from(this.validatorStats.values());
    const averageUptime = stats.reduce((sum, stat) => sum + stat.uptime, 0) / stats.length;
    const activeValidators = stats.filter(stat => stat.isActive).length;
    const slashedValidators = stats.filter(stat => stat.isSlashed).length;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageUptime >= 95) status = 'excellent';
    else if (averageUptime >= 85) status = 'good';
    else if (averageUptime >= 70) status = 'fair';
    else status = 'poor';

    return {
      status,
      averageUptime,
      activeValidators,
      slashedValidators
    };
  }

  private initializeValidatorStats(): void {
    const currentValidators = this.engine.getValidators();
    
    currentValidators.forEach(validator => {
      this.validatorStats.set(validator.id, {
        validatorId: validator.id,
        uptime: 100,
        responseTime: 100,
        contributionScore: 0,
        blocksProduced: 0,
        transactionsProcessed: 0,
        rewardsEarned: BigInt('0'),
        penalties: BigInt('0'),
        reputation: validator.reputation,
        lastHealthCheck: Date.now(),
        isActive: validator.isActive,
        isSlashed: false,
        slashCount: 0,
        region: validator.region
      });
    });

    console.log(`📊 Initialized stats for ${this.validatorStats.size} validators`);
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.performHealthChecks();
    }, this.config.healthCheckInterval * 1000);
  }

  private startElectionProcess(): void {
    this.electionInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.performElection();
    }, this.config.electionInterval * 1000);
  }

  private performHealthChecks(): void {
    const now = Date.now();
    
    this.validatorStats.forEach((stats, validatorId) => {
      const timeSinceCheck = now - stats.lastHealthCheck;
      
      // Simulate validator health check
      const shouldFail = Math.random() < 0.05; // 5% chance of failure
      
      if (shouldFail) {
        stats.uptime = Math.max(0, stats.uptime - 5);
        stats.isActive = false;
        
        console.log(`❌ Validator ${validatorId} failed health check`);
        
        // Check for slashing
        if (stats.uptime < this.config.slashThreshold && !stats.isSlashed) {
          this.slashValidator(validatorId);
        }
      } else {
        stats.uptime = Math.min(100, stats.uptime + 0.5);
        stats.isActive = true;
        stats.contributionScore += 1;
        stats.responseTime = 50 + Math.random() * 100; // 50-150ms response time
      }
      
      stats.lastHealthCheck = now;
    });
  }

  private async performElection(): Promise<ElectionResult> {
    const electionId = `election_${Date.now()}`;
    const timestamp = Date.now();
    
    const currentValidators = Array.from(this.validatorStats.values());
    const activeValidators = currentValidators.filter(v => v.isActive);
    
    console.log(`🗳️ Performing election ${electionId}`);
    console.log(`📊 Current validators: ${currentValidators.length}, Active: ${activeValidators.length}`);

    const result: ElectionResult = {
      electionId,
      timestamp,
      addedValidators: [],
      removedValidators: [],
      slashedValidators: [],
      totalValidators: currentValidators.length,
      averageUptime: currentValidators.reduce((sum, v) => sum + v.uptime, 0) / currentValidators.length,
      networkHealth: 'good'
    };

    // Check for validators to remove (below replacement threshold)
    const validatorsToRemove = currentValidators.filter(
      v => v.uptime < this.config.replacementThreshold && !v.isSlashed
    );
    
    validatorsToRemove.forEach(validator => {
      this.removeValidator(validator.validatorId);
      result.removedValidators.push(validator.validatorId);
      console.log(`🗑️ Marked validator ${validator.validatorId} for removal (uptime: ${validator.uptime.toFixed(1)}%)`);
    });

    // Check for validators to add from candidate pool
    const validatorsToAdd = this.selectValidatorsToAdd(validatorsToRemove.length);
    
    validatorsToAdd.forEach(validator => {
      this.addValidator(validator);
      result.addedValidators.push(validator.id);
      console.log(`➕ Added validator ${validator.id} from candidate pool`);
    });

    // Check for validators to slash
    const validatorsToSlash = currentValidators.filter(
      v => v.uptime < this.config.slashThreshold && !v.isSlashed
    );
    
    validatorsToSlash.forEach(validator => {
      this.slashValidator(validator.validatorId);
      result.slashedValidators.push(validator.validatorId);
    });

    // Update network health
    const networkHealth = this.getNetworkHealth();
    result.networkHealth = networkHealth.status;
    result.totalValidators = Array.from(this.validatorStats.values()).length;

    // Record election result
    this.electionHistory.push(result);
    
    // Keep only last 50 elections
    if (this.electionHistory.length > 50) {
      this.electionHistory.shift();
    }

    console.log(`✅ Election completed: ${result.addedValidators.length} added, ${result.removedValidators.length} removed, ${result.slashedValidators.length} slashed`);
    console.log(`📊 Network health: ${result.networkHealth}, Average uptime: ${result.averageUptime.toFixed(1)}%`);

    // Distribute rewards
    await this.distributeRewards();

    return result;
  }

  private selectValidatorsToAdd(count: number): Validator[] {
    if (this.candidateValidators.length === 0) {
      console.log('⚠️ No candidate validators available');
      return [];
    }

    // Sort candidates by stake and reputation
    const sortedCandidates = [...this.candidateValidators].sort((a, b) => {
      const aWeight = Number(a.stake) * a.reputation;
      const bWeight = Number(b.stake) * b.reputation;
      return bWeight - aWeight;
    });

    // Select top candidates
    const selected = sortedCandidates.slice(0, Math.min(count, sortedCandidates.length));
    
    // Remove selected from candidate pool
    selected.forEach(validator => {
      this.candidateValidators = this.candidateValidators.filter(v => v.id !== validator.id);
    });

    return selected;
  }

  private addValidator(validator: Validator): void {
    this.engine.addValidator(validator);
    
    this.validatorStats.set(validator.id, {
      validatorId: validator.id,
      uptime: 100,
      responseTime: 100,
      contributionScore: 0,
      blocksProduced: 0,
      transactionsProcessed: 0,
      rewardsEarned: BigInt('0'),
      penalties: BigInt('0'),
      reputation: validator.reputation,
      lastHealthCheck: Date.now(),
      isActive: true,
      isSlashed: false,
      slashCount: 0,
      region: validator.region
    });
  }

  private removeValidator(validatorId: string): void {
    this.engine.removeValidator(validatorId);
    this.validatorStats.delete(validatorId);
  }

  private slashValidator(validatorId: string): void {
    const stats = this.validatorStats.get(validatorId);
    if (!stats || stats.isSlashed) return;

    console.log(`⚔️ Slashing validator ${validatorId}`);
    
    const slashAmount = stats.rewardsEarned * BigInt(Math.floor(this.config.slashRate * 100)) / BigInt('100');
    stats.penalties += slashAmount;
    stats.isSlashed = true;
    stats.slashCount += 1;
    stats.reputation = Math.max(0, stats.reputation - 20);

    // Remove from active validator set
    this.engine.removeValidator(validatorId);
  }

  private async distributeRewards(): Promise<void> {
    const distributionId = `reward_${Date.now()}`;
    const timestamp = Date.now();
    
    const activeValidators = Array.from(this.validatorStats.values()).filter(v => v.isActive && !v.isSlashed);
    
    if (activeValidators.length === 0) {
      console.log('⚠️ No active validators to reward');
      return;
    }

    // Calculate total rewards based on network activity
    const totalRewards = this.calculateTotalRewards();
    const networkFee = totalRewards / BigInt('20'); // 5% network fee
    const validatorRewards = totalRewards - networkFee;

    // Distribute rewards based on contribution score
    const totalContribution = activeValidators.reduce((sum, v) => sum + v.contributionScore, 0);
    
    const validatorRewardMap: Record<string, bigint> = {};
    const slashPenaltyMap: Record<string, bigint> = {};

    activeValidators.forEach(validator => {
      const rewardShare = validator.contributionScore / totalContribution;
      const baseReward = validatorRewards * BigInt(Math.floor(rewardShare * 10000)) / BigInt('10000');
      
      // Apply reputation bonus
      const reputationBonus = baseReward * BigInt(Math.floor(validator.reputation * this.config.reputationBonus * 100)) / BigInt('100');
      const totalReward = baseReward + reputationBonus;
      
      validatorRewardMap[validator.validatorId] = totalReward;
      validator.rewardsEarned += totalReward;
      
      console.log(`💰 Validator ${validator.validatorId} earned: ${Number(totalReward) / 1e18} KALD`);
    });

    // Apply slash penalties
    const slashedValidators = Array.from(this.validatorStats.values()).filter(v => v.isSlashed);
    slashedValidators.forEach(validator => {
      slashPenaltyMap[validator.validatorId] = validator.penalties;
      console.log(`⚔️ Validator ${validator.validatorId} penalized: ${Number(validator.penalties) / 1e18} KALD`);
    });

    const distribution: RewardDistribution = {
      distributionId,
      timestamp,
      totalRewards,
      validatorRewards: validatorRewardMap,
      slashPenalties: slashPenaltyMap,
      networkFee
    };

    this.rewardHistory.push(distribution);
    
    // Keep only last 100 distributions
    if (this.rewardHistory.length > 100) {
      this.rewardHistory.shift();
    }

    console.log(`💰 Reward distribution completed: ${Number(totalRewards) / 1e18} KALD total`);
  }

  private calculateTotalRewards(): bigint {
    // Calculate rewards based on network activity
    const metrics = this.engine.getMetrics();
    const baseReward = BigInt('100000000000000000000'); // 100 KALD base reward
    
    // Scale by TPS and confirmation rate
    const tpsMultiplier = Math.min(metrics.tps / 1000, 10); // Max 10x multiplier
    const confirmationMultiplier = metrics.confirmationRate / 100;
    
    return baseReward * BigInt(Math.floor(tpsMultiplier * confirmationMultiplier * 100)) / BigInt('100');
  }

  /**
   * Get validator performance summary
   */
  getValidatorPerformanceSummary(): {
    topPerformers: ValidatorStats[];
    underperformers: ValidatorStats[];
    slashedValidators: ValidatorStats[];
    averageMetrics: {
      uptime: number;
      responseTime: number;
      contributionScore: number;
      rewardsEarned: bigint;
    };
  } {
    const stats = Array.from(this.validatorStats.values());
    
    const topPerformers = stats
      .filter(v => v.isActive && !v.isSlashed)
      .sort((a, b) => b.contributionScore - a.contributionScore)
      .slice(0, 5);

    const underperformers = stats
      .filter(v => v.uptime < this.config.replacementThreshold)
      .sort((a, b) => a.uptime - b.uptime)
      .slice(0, 5);

    const slashedValidators = stats
      .filter(v => v.isSlashed)
      .sort((a, b) => b.slashCount - a.slashCount)
      .slice(0, 5);

    const averageMetrics = {
      uptime: stats.reduce((sum, v) => sum + v.uptime, 0) / stats.length,
      responseTime: stats.reduce((sum, v) => sum + v.responseTime, 0) / stats.length,
      contributionScore: stats.reduce((sum, v) => sum + v.contributionScore, 0) / stats.length,
      rewardsEarned: stats.reduce((sum, v) => sum + v.rewardsEarned, BigInt('0'))
    };

    return {
      topPerformers,
      underperformers,
      slashedValidators,
      averageMetrics
    };
  }
}