/**
 * Payout Engine Module
 * 
 * Handles reward calculation, processing, and distribution
 */

import { db } from '@/lib/db';
import { IncentiveProgram, Participant, RewardTransaction } from './types';

export class PayoutEngine {
  private rewards: Map<string, RewardTransaction> = new Map();

  /**
   * Create and process a reward transaction
   */
  async createAndProcessReward(
    participant: Participant,
    program: IncentiveProgram
  ): Promise<RewardTransaction> {
    const reward: RewardTransaction = {
      id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participantId: participant.id,
      programId: program.id,
      amount: program.rewardAmount,
      type: 'earned',
      status: 'pending',
      createdAt: new Date()
    };

    // Store in memory
    this.rewards.set(reward.id, reward);

    // Update participant total rewards
    participant.totalRewards += program.rewardAmount;

    // Store in database
    try {
      await db.rewardTransaction.create({
        data: {
          participantId: participant.id,
          programId: program.id,
          amount: program.rewardAmount,
          type: 'earned',
          status: 'pending',
          createdAt: reward.createdAt
        }
      });

      await db.participant.update({
        where: { address: participant.address },
        data: { totalRewards: participant.totalRewards }
      });
    } catch (error) {
      console.error('Error storing reward in database:', error);
    }

    // Process the reward asynchronously
    this.processReward(reward);

    console.log(`Awarded ${program.rewardAmount} KALD to ${participant.address} for ${program.name}`);

    return reward;
  }

  /**
   * Process a reward (simulate blockchain transaction)
   */
  private async processReward(reward: RewardTransaction): Promise<void> {
    // Simulate processing delay
    setTimeout(async () => {
      try {
        reward.status = 'completed';
        reward.processedAt = new Date();
        reward.txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

        // Update database
        try {
          await db.rewardTransaction.update({
            where: { id: reward.id },
            data: {
              status: 'completed',
              processedAt: reward.processedAt,
              txHash: reward.txHash
            }
          });
        } catch (error) {
          console.error('Error updating reward status:', error);
        }

        console.log(`Reward ${reward.id} processed successfully`);
      } catch (error) {
        console.error('Error processing reward:', error);
        reward.status = 'failed';
      }
    }, 5000); // 5 second processing time
  }

  /**
   * Get reward by ID
   */
  getReward(id: string): RewardTransaction | undefined {
    return this.rewards.get(id);
  }

  /**
   * Get all rewards for a participant
   */
  getParticipantRewards(participantId: string): RewardTransaction[] {
    return Array.from(this.rewards.values())
      .filter(reward => reward.participantId === participantId);
  }

  /**
   * Get all rewards for a program
   */
  getProgramRewards(programId: string): RewardTransaction[] {
    return Array.from(this.rewards.values())
      .filter(reward => reward.programId === programId);
  }

  /**
   * Get completed rewards
   */
  getCompletedRewards(): RewardTransaction[] {
    return Array.from(this.rewards.values())
      .filter(reward => reward.status === 'completed');
  }

  /**
   * Get pending rewards
   */
  getPendingRewards(): RewardTransaction[] {
    return Array.from(this.rewards.values())
      .filter(reward => reward.status === 'pending');
  }

  /**
   * Get failed rewards
   */
  getFailedRewards(): RewardTransaction[] {
    return Array.from(this.rewards.values())
      .filter(reward => reward.status === 'failed');
  }

  /**
   * Calculate total rewards distributed
   */
  getTotalRewardsDistributed(): number {
    return this.getCompletedRewards()
      .reduce((sum, reward) => sum + reward.amount, 0);
  }

  /**
   * Calculate total rewards by program
   */
  getRewardsByProgram(programId: string): number {
    return this.getProgramRewards(programId)
      .filter(reward => reward.status === 'completed')
      .reduce((sum, reward) => sum + reward.amount, 0);
  }

  /**
   * Get reward statistics
   */
  getRewardStats(): {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalAmount: number;
  } {
    const allRewards = Array.from(this.rewards.values());
    const completed = this.getCompletedRewards();
    const pending = this.getPendingRewards();
    const failed = this.getFailedRewards();

    return {
      total: allRewards.length,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      totalAmount: this.getTotalRewardsDistributed()
    };
  }

  /**
   * Clear all rewards (for testing/reset)
   */
  clear(): void {
    this.rewards.clear();
  }
}