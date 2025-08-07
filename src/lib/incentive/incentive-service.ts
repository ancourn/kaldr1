/**
 * Incentive Service
 * 
 * Main service that orchestrates the incentive system modules
 */

import { ParticipantRegistry } from './participant-registry';
import { EligibilityRules } from './eligibility-rules';
import { PayoutEngine } from './payout-engine';
import { 
  IncentiveProgram, 
  Participant, 
  RewardTransaction, 
  LeaderboardEntry, 
  ProgramStats,
  ParticipantStats
} from './types';

export class IncentiveService {
  private static instance: IncentiveService;
  private participantRegistry: ParticipantRegistry;
  private eligibilityRules: EligibilityRules;
  private payoutEngine: PayoutEngine;
  private programs: Map<string, IncentiveProgram> = new Map();

  /**
   * Get singleton instance
   */
  static getInstance(): IncentiveService {
    if (!IncentiveService.instance) {
      IncentiveService.instance = new IncentiveService();
    }
    return IncentiveService.instance;
  }

  /**
   * Private constructor
   */
  private constructor() {
    this.participantRegistry = new ParticipantRegistry();
    this.eligibilityRules = new EligibilityRules();
    this.payoutEngine = new PayoutEngine();
    this.initializeDefaultPrograms();
  }

  /**
   * Initialize default incentive programs
   */
  private initializeDefaultPrograms(): void {
    const defaultPrograms: IncentiveProgram[] = [
      {
        id: 'first-100-tx',
        name: 'First 100 Transactions',
        description: 'Get 100 KALD for your first 100 transactions',
        type: 'transaction',
        rewardAmount: 100,
        maxParticipants: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        requirements: {
          minTransactions: 100
        }
      },
      {
        id: 'referral-program',
        name: 'Referral Program',
        description: 'Earn 50 KALD for each successful referral',
        type: 'referral',
        rewardAmount: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true,
        requirements: {
          referralCount: 1
        }
      },
      {
        id: 'uptime-rewards',
        name: 'Uptime Rewards',
        description: 'Earn 10 KALD per day for maintaining 99%+ uptime',
        type: 'uptime',
        rewardAmount: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
        isActive: true,
        requirements: {
          minUptime: 99
        }
      },
      {
        id: 'staking-bonus',
        name: 'Staking Bonus',
        description: 'Extra 5% bonus on staking rewards for testnet participants',
        type: 'staking',
        rewardAmount: 5, // 5% bonus
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        requirements: {
          minStake: 1000
        }
      },
      {
        id: 'governance-participation',
        name: 'Governance Participation',
        description: 'Earn 25 KALD for voting on governance proposals',
        type: 'governance',
        rewardAmount: 25,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
        requirements: {}
      }
    ];

    defaultPrograms.forEach(program => {
      this.programs.set(program.id, program);
    });
  }

  /**
   * Register a new participant
   */
  async registerParticipant(address: string, nodeId?: string): Promise<Participant> {
    return await this.participantRegistry.registerParticipant(address, nodeId);
  }

  /**
   * Track a transaction for a participant
   */
  async trackTransaction(address: string): Promise<void> {
    const participant = await this.participantRegistry.registerParticipant(address);
    
    // Update transaction count
    await this.participantRegistry.updateTransactionCount(
      address, 
      participant.transactionCount + 1
    );

    // Check for transaction-based rewards
    await this.checkAndAwardTransactionRewards(participant);
  }

  /**
   * Track a referral
   */
  async trackReferral(referrerAddress: string, referredAddress: string): Promise<boolean> {
    const success = await this.participantRegistry.addReferral(referrerAddress, referredAddress);
    
    if (success) {
      const referrer = this.participantRegistry.getParticipant(referrerAddress);
      if (referrer) {
        await this.checkAndAwardReferralRewards(referrer);
      }
    }

    return success;
  }

  /**
   * Track uptime for a node
   */
  async trackUptime(nodeId: string, uptime: number): Promise<void> {
    await this.participantRegistry.updateUptime(nodeId, uptime);
    
    const participant = this.participantRegistry.getParticipantByNodeId(nodeId);
    if (participant) {
      await this.checkAndAwardUptimeRewards(participant);
    }
  }

  /**
   * Track staking for a participant
   */
  async trackStaking(address: string, amount: number): Promise<void> {
    await this.participantRegistry.updateStakedAmount(address, amount);
    
    const participant = this.participantRegistry.getParticipant(address);
    if (participant) {
      await this.checkAndAwardStakingRewards(participant);
    }
  }

  /**
   * Check and award transaction rewards
   */
  private async checkAndAwardTransactionRewards(participant: Participant): Promise<void> {
    const program = this.programs.get('first-100-tx');
    if (!program || !program.isActive) return;

    const eligibility = this.eligibilityRules.checkEligibility(participant, program);
    if (!eligibility.isEligible) return;

    // Check if already received
    const existingRewards = this.payoutEngine.getParticipantRewards(participant.id);
    const hasReceived = this.eligibilityRules.hasAlreadyReceivedReward(
      participant.id, 
      program.id, 
      existingRewards
    );

    if (!hasReceived) {
      await this.payoutEngine.createAndProcessReward(participant, program);
    }
  }

  /**
   * Check and award referral rewards
   */
  private async checkAndAwardReferralRewards(participant: Participant): Promise<void> {
    const program = this.programs.get('referral-program');
    if (!program || !program.isActive) return;

    const eligibility = this.eligibilityRules.checkEligibility(participant, program);
    if (!eligibility.isEligible) return;

    // Award for each new referral
    const existingRewards = this.payoutEngine.getParticipantRewards(participant.id);
    const referralCount = participant.referrals.length;
    const existingReferralRewards = existingRewards.filter(
      reward => reward.programId === program.id
    ).length;

    const rewardsToAward = referralCount - existingReferralRewards;
    for (let i = 0; i < rewardsToAward; i++) {
      await this.payoutEngine.createAndProcessReward(participant, program);
    }
  }

  /**
   * Check and award uptime rewards
   */
  private async checkAndAwardUptimeRewards(participant: Participant): Promise<void> {
    const program = this.programs.get('uptime-rewards');
    if (!program || !program.isActive) return;

    const eligibility = this.eligibilityRules.checkEligibility(participant, program);
    if (!eligibility.isEligible) return;

    // Award daily (simplified - in production would track actual uptime periods)
    const today = new Date().toDateString();
    const existingRewards = this.payoutEngine.getParticipantRewards(participant.id);
    const hasRewardToday = existingRewards.some(reward => 
      reward.programId === program.id &&
      reward.createdAt.toDateString() === today
    );

    if (!hasRewardToday) {
      await this.payoutEngine.createAndProcessReward(participant, program);
    }
  }

  /**
   * Check and award staking rewards
   */
  private async checkAndAwardStakingRewards(participant: Participant): Promise<void> {
    const program = this.programs.get('staking-bonus');
    if (!program || !program.isActive) return;

    const eligibility = this.eligibilityRules.checkEligibility(participant, program);
    if (!eligibility.isEligible) return;

    // Check if already received
    const existingRewards = this.payoutEngine.getParticipantRewards(participant.id);
    const hasReceived = this.eligibilityRules.hasAlreadyReceivedReward(
      participant.id, 
      program.id, 
      existingRewards
    );

    if (!hasReceived) {
      await this.payoutEngine.createAndProcessReward(participant, program);
    }
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 10): LeaderboardEntry[] {
    const participants = this.participantRegistry.getActiveParticipants()
      .sort((a, b) => b.totalRewards - a.totalRewards)
      .slice(0, limit);

    return participants.map((participant, index) => ({
      rank: index + 1,
      address: participant.address,
      rewards: participant.totalRewards,
      transactions: participant.transactionCount,
      uptime: participant.uptime
    }));
  }

  /**
   * Get participant statistics
   */
  async getParticipantStats(address: string): Promise<ParticipantStats> {
    const participant = this.participantRegistry.getParticipant(address);
    const programs = Array.from(this.programs.values());
    
    const eligiblePrograms = this.eligibilityRules.getEligiblePrograms(
      participant || { 
        id: '', 
        address: '', 
        joinDate: new Date(), 
        totalRewards: 0, 
        transactionCount: 0, 
        uptime: 0, 
        referrals: [], 
        stakedAmount: 0, 
        isActive: false 
      }, 
      programs
    );

    const recentRewards = this.payoutEngine.getParticipantRewards(
      participant?.id || ''
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      participant: participant || null,
      eligiblePrograms,
      recentRewards
    };
  }

  /**
   * Get program statistics
   */
  getProgramStats(): ProgramStats {
    const totalParticipants = this.participantRegistry.getParticipantCount();
    const totalRewardsDistributed = this.payoutEngine.getTotalRewardsDistributed();
    const activePrograms = Array.from(this.programs.values()).filter(p => p.isActive).length;

    const programBreakdown = Array.from(this.programs.values()).map(program => ({
      programId: program.id,
      programName: program.name,
      participants: new Set(
        this.payoutEngine.getProgramRewards(program.id)
          .map(reward => reward.participantId)
      ).size,
      rewardsDistributed: this.payoutEngine.getRewardsByProgram(program.id)
    }));

    return {
      totalParticipants,
      totalRewardsDistributed,
      activePrograms,
      programBreakdown
    };
  }

  /**
   * Generate referral link
   */
  async generateReferralLink(address: string): Promise<string> {
    await this.registerParticipant(address);
    const referralCode = Buffer.from(address).toString('base64').substr(0, 16);
    return `https://kaldrix.network/join?ref=${referralCode}`;
  }

  /**
   * Process referral from referral code
   */
  async processReferral(referralCode: string, newAddress: string): Promise<boolean> {
    try {
      const referrerAddress = Buffer.from(referralCode, 'base64').toString('utf-8');
      return await this.trackReferral(referrerAddress, newAddress);
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  }

  /**
   * Get all programs
   */
  getPrograms(): IncentiveProgram[] {
    return Array.from(this.programs.values());
  }

  /**
   * Get program by ID
   */
  getProgram(id: string): IncentiveProgram | undefined {
    return this.programs.get(id);
  }

  /**
   * Add a new program
   */
  addProgram(program: IncentiveProgram): void {
    this.programs.set(program.id, program);
  }

  /**
   * Update a program
   */
  updateProgram(id: string, updates: Partial<IncentiveProgram>): boolean {
    const program = this.programs.get(id);
    if (!program) return false;

    this.programs.set(id, { ...program, ...updates });
    return true;
  }

  /**
   * Deactivate a program
   */
  deactivateProgram(id: string): boolean {
    return this.updateProgram(id, { isActive: false });
  }

  /**
   * Activate a program
   */
  activateProgram(id: string): boolean {
    return this.updateProgram(id, { isActive: true });
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    participants: number;
    programs: number;
    activePrograms: number;
    rewards: {
      total: number;
      completed: number;
      pending: number;
      failed: number;
      totalAmount: number;
    };
  } {
    const rewardStats = this.payoutEngine.getRewardStats();
    
    return {
      participants: this.participantRegistry.getParticipantCount(),
      programs: this.programs.size,
      activePrograms: Array.from(this.programs.values()).filter(p => p.isActive).length,
      rewards: rewardStats
    };
  }

  /**
   * Reset service (for testing)
   */
  reset(): void {
    this.participantRegistry.clear();
    this.payoutEngine.clear();
    this.programs.clear();
    this.initializeDefaultPrograms();
  }
}

// Export singleton instance
export const incentiveService = IncentiveService.getInstance();