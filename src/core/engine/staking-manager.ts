/**
 * KALDRIX Staking Manager
 * 
 * Manages validator staking, delegation, rewards, and economic incentivization
 */

import { Validator, Delegator, StakingTransaction, StakingRewards, StakingPool, RewardHistory } from './types';

export interface StakingConfig {
  minimumValidatorStake: bigint;
  maximumValidatorStake: bigint;
  minimumDelegation: bigint;
  unstakingPeriod: number; // in seconds
  rewardRate: number; // Annual reward rate as decimal (e.g., 0.05 for 5%)
  commissionRange: {
    min: number;
    max: number;
  };
  maxDelegatorsPerValidator: number;
  enableAutoCompounding: boolean;
}

export interface StakingStats {
  totalStaked: bigint;
  totalValidators: number;
  activeValidators: number;
  totalDelegators: number;
  averageApy: number;
  totalRewardsDistributed: bigint;
  stakingRatio: number;
}

export class StakingManager {
  private config: StakingConfig;
  private stakingTransactions: Map<string, StakingTransaction> = new Map();
  private rewardHistory: RewardHistory[] = [];
  private totalSupply: bigint;
  private blockReward: bigint;

  constructor(config: Partial<StakingConfig> = {}, totalSupply: bigint = BigInt('1000000000000000000000000')) {
    this.config = {
      minimumValidatorStake: config.minimumValidatorStake || BigInt('1000000000000000000000'), // 1000 KALD
      maximumValidatorStake: config.maximumValidatorStake || BigInt('10000000000000000000000'), // 10000 KALD
      minimumDelegation: config.minimumDelegation || BigInt('100000000000000000000'), // 100 KALD
      unstakingPeriod: config.unstakingPeriod || 604800, // 7 days
      rewardRate: config.rewardRate || 0.05, // 5% annual reward
      commissionRange: config.commissionRange || { min: 0, max: 0.1 }, // 0-10% commission
      maxDelegatorsPerValidator: config.maxDelegatorsPerValidator || 1000,
      enableAutoCompounding: config.enableAutoCompounding || true
    };

    this.totalSupply = totalSupply;
    this.blockReward = BigInt('100000000000000000000'); // 100 KALD per block
  }

  /**
   * Stake tokens to become a validator
   */
  async stakeAsValidator(
    validatorAddress: string,
    amount: bigint,
    commissionRate: number
  ): Promise<StakingTransaction> {
    if (amount < this.config.minimumValidatorStake) {
      throw new Error(`Minimum validator stake is ${this.config.minimumValidatorStake.toString()}`);
    }

    if (amount > this.config.maximumValidatorStake) {
      throw new Error(`Maximum validator stake is ${this.config.maximumValidatorStake.toString()}`);
    }

    if (commissionRate < this.config.commissionRange.min || commissionRate > this.config.commissionRange.max) {
      throw new Error(`Commission rate must be between ${this.config.commissionRange.min * 100}% and ${this.config.commissionRange.max * 100}%`);
    }

    const transaction: StakingTransaction = {
      id: `stake_validator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: validatorAddress,
      to: validatorAddress,
      amount,
      type: 'stake',
      timestamp: Date.now(),
      status: 'pending',
      gasUsed: BigInt('50000')
    };

    this.stakingTransactions.set(transaction.id, transaction);

    // Simulate processing
    setTimeout(() => {
      transaction.status = 'completed';
      transaction.blockNumber = Math.floor(Math.random() * 1000000);
      console.log(`✅ Validator staked: ${validatorAddress} with ${amount.toString()} tokens at ${commissionRate * 100}% commission`);
    }, 5000);

    return transaction;
  }

  /**
   * Delegate tokens to a validator
   */
  async delegateToValidator(
    delegatorAddress: string,
    validatorAddress: string,
    amount: bigint
  ): Promise<StakingTransaction> {
    if (amount < this.config.minimumDelegation) {
      throw new Error(`Minimum delegation is ${this.config.minimumDelegation.toString()}`);
    }

    const transaction: StakingTransaction = {
      id: `delegate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: delegatorAddress,
      to: validatorAddress,
      amount,
      type: 'delegate',
      timestamp: Date.now(),
      status: 'pending',
      gasUsed: BigInt('30000')
    };

    this.stakingTransactions.set(transaction.id, transaction);

    // Simulate processing
    setTimeout(() => {
      transaction.status = 'completed';
      transaction.blockNumber = Math.floor(Math.random() * 1000000);
      console.log(`✅ Delegation completed: ${delegatorAddress} delegated ${amount.toString()} to ${validatorAddress}`);
    }, 3000);

    return transaction;
  }

  /**
   * Unstake tokens from validator
   */
  async unstakeFromValidator(
    validatorAddress: string,
    amount: bigint
  ): Promise<StakingTransaction> {
    const transaction: StakingTransaction = {
      id: `unstake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: validatorAddress,
      to: validatorAddress,
      amount,
      type: 'unstake',
      timestamp: Date.now(),
      status: 'pending',
      gasUsed: BigInt('40000')
    };

    this.stakingTransactions.set(transaction.id, transaction);

    // Simulate processing with unstaking period
    setTimeout(() => {
      transaction.status = 'completed';
      transaction.blockNumber = Math.floor(Math.random() * 1000000);
      console.log(`✅ Unstaking completed: ${validatorAddress} unstaked ${amount.toString()} tokens`);
    }, this.config.unstakingPeriod * 1000);

    return transaction;
  }

  /**
   * Undelegate tokens from validator
   */
  async undelegateFromValidator(
    delegatorAddress: string,
    validatorAddress: string,
    amount: bigint
  ): Promise<StakingTransaction> {
    const transaction: StakingTransaction = {
      id: `undelegate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: delegatorAddress,
      to: validatorAddress,
      amount,
      type: 'undelegate',
      timestamp: Date.now(),
      status: 'pending',
      gasUsed: BigInt('35000')
    };

    this.stakingTransactions.set(transaction.id, transaction);

    // Simulate processing with unstaking period
    setTimeout(() => {
      transaction.status = 'completed';
      transaction.blockNumber = Math.floor(Math.random() * 1000000);
      console.log(`✅ Undelegation completed: ${delegatorAddress} undelegated ${amount.toString()} from ${validatorAddress}`);
    }, this.config.unstakingPeriod * 1000);

    return transaction;
  }

  /**
   * Claim staking rewards
   */
  async claimRewards(
    address: string,
    isValidator: boolean = false
  ): Promise<StakingTransaction> {
    const transaction: StakingTransaction = {
      id: `claim_rewards_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: address,
      to: address,
      amount: BigInt('0'), // Will be calculated based on accumulated rewards
      type: 'claim_rewards',
      timestamp: Date.now(),
      status: 'pending',
      gasUsed: BigInt('25000')
    };

    this.stakingTransactions.set(transaction.id, transaction);

    // Simulate processing
    setTimeout(() => {
      transaction.status = 'completed';
      transaction.blockNumber = Math.floor(Math.random() * 1000000);
      
      // Calculate rewards (simplified)
      const rewards = this.calculateAccumulatedRewards(address, isValidator);
      transaction.amount = rewards;
      
      console.log(`✅ Rewards claimed: ${address} claimed ${rewards.toString()} tokens`);
    }, 2000);

    return transaction;
  }

  /**
   * Calculate accumulated rewards for an address
   */
  private calculateAccumulatedRewards(address: string, isValidator: boolean): bigint {
    // Simplified reward calculation
    const baseReward = BigInt('100000000000000000000'); // 100 KALD base reward
    const timeMultiplier = Math.floor(Math.random() * 10) + 1; // 1-10x multiplier
    return baseReward * BigInt(timeMultiplier);
  }

  /**
   * Distribute block rewards to validators
   */
  distributeBlockRewards(validators: Validator[], blockNumber: number): void {
    const activeValidators = validators.filter(v => v.isActive);
    
    if (activeValidators.length === 0) {
      return;
    }

    const rewardPerValidator = this.blockReward / BigInt(activeValidators.length);

    activeValidators.forEach(validator => {
      const validatorReward = rewardPerValidator;
      const commission = validatorReward * BigInt(Math.floor(validator.commissionRate * 10000)) / BigInt('10000');
      const delegatorReward = validatorReward - commission;

      // Add to validator rewards
      validator.stakingRewards += commission;
      validator.totalRewards += commission;

      // Distribute to delegators
      validator.delegators.forEach(delegator => {
        const delegatorShare = (delegator.stakedAmount * delegatorReward) / 
                              (validator.stake + validator.delegators.reduce((sum, d) => sum + d.stakedAmount, BigInt('0')));
        delegator.rewards += delegatorShare;
      });

      // Record reward history
      this.rewardHistory.push({
        timestamp: Date.now(),
        amount: validatorReward,
        blockNumber,
        rewardType: 'block'
      });

      console.log(`🎁 Block reward distributed: ${validator.id} received ${validatorReward.toString()}`);
    });
  }

  /**
   * Get staking statistics
   */
  getStakingStats(validators: Validator[]): StakingStats {
    const activeValidators = validators.filter(v => v.isActive);
    const totalStaked = validators.reduce((sum, v) => sum + v.stake, BigInt('0')) +
                       validators.reduce((sum, v) => sum + v.delegators.reduce((dSum, d) => dSum + d.stakedAmount, BigInt('0')), BigInt('0'));
    const totalDelegators = validators.reduce((sum, v) => sum + v.delegators.length, 0);
    const totalRewards = validators.reduce((sum, v) => sum + v.totalRewards, BigInt('0'));
    const stakingRatio = Number(totalStaked) / Number(this.totalSupply);
    const averageApy = this.config.rewardRate; // Simplified

    return {
      totalStaked,
      totalValidators: validators.length,
      activeValidators: activeValidators.length,
      totalDelegators,
      averageApy,
      totalRewardsDistributed: totalRewards,
      stakingRatio
    };
  }

  /**
   * Get staking pool information
   */
  getStakingPool(validators: Validator[]): StakingPool {
    const stats = this.getStakingStats(validators);
    
    return {
      totalStaked: stats.totalStaked,
      activeValidators: stats.activeValidators,
      totalRewards: stats.totalRewardsDistributed,
      averageApy: stats.averageApy,
      stakingRatio: stats.stakingRatio
    };
  }

  /**
   * Get validator rewards information
   */
  getValidatorRewards(validator: Validator): StakingRewards {
    const delegatorRewards = validator.delegators.reduce((sum, d) => sum + d.rewards, BigInt('0'));
    const commissionRewards = validator.stakingRewards;
    const totalRewards = validator.totalRewards;
    const apy = this.config.rewardRate; // Simplified

    return {
      validatorId: validator.id,
      totalRewards,
      delegatorRewards,
      commissionRewards,
      apy,
      rewardHistory: this.rewardHistory.filter(h => 
        this.rewardHistory.some(rh => rh.blockNumber === h.blockNumber)
      )
    };
  }

  /**
   * Get staking transactions for an address
   */
  getStakingTransactions(address: string): StakingTransaction[] {
    return Array.from(this.stakingTransactions.values())
      .filter(tx => tx.from === address || tx.to === address)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all staking transactions
   */
  getAllStakingTransactions(): StakingTransaction[] {
    return Array.from(this.stakingTransactions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get reward history
   */
  getRewardHistory(): RewardHistory[] {
    return [...this.rewardHistory].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear old reward history (keep last 1000 entries)
   */
  clearOldRewardHistory(): void {
    if (this.rewardHistory.length > 1000) {
      this.rewardHistory = this.rewardHistory.slice(-1000);
    }
  }

  /**
   * Update validator commission rate
   */
  async updateValidatorCommission(
    validatorAddress: string,
    newCommissionRate: number
  ): Promise<void> {
    if (newCommissionRate < this.config.commissionRange.min || 
        newCommissionRate > this.config.commissionRange.max) {
      throw new Error(`Commission rate must be between ${this.config.commissionRange.min * 100}% and ${this.config.commissionRange.max * 100}%`);
    }

    // In a real implementation, this would update the validator's commission rate
    console.log(`📊 Commission rate updated for ${validatorAddress}: ${newCommissionRate * 100}%`);
  }

  /**
   * Get staking configuration
   */
  getStakingConfig(): StakingConfig {
    return { ...this.config };
  }

  /**
   * Update staking configuration
   */
  updateStakingConfig(newConfig: Partial<StakingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Staking configuration updated');
  }
}