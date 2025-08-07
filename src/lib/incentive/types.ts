/**
 * Incentive System Types and Interfaces
 * 
 * Core types for the KALDRIX testnet incentive system
 */

export interface IncentiveProgram {
  id: string;
  name: string;
  description: string;
  type: 'transaction' | 'referral' | 'uptime' | 'staking' | 'governance';
  rewardAmount: number;
  maxParticipants?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  requirements: {
    minTransactions?: number;
    minUptime?: number;
    minStake?: number;
    referralCount?: number;
  };
}

export interface Participant {
  id: string;
  address: string;
  nodeId?: string;
  joinDate: Date;
  totalRewards: number;
  transactionCount: number;
  uptime: number;
  referrals: string[];
  stakedAmount: number;
  isActive: boolean;
}

export interface RewardTransaction {
  id: string;
  participantId: string;
  programId: string;
  amount: number;
  type: 'earned' | 'claimed';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  txHash?: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  progress?: number;
  target?: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  rewards: number;
  transactions: number;
  uptime: number;
}

export interface ProgramStats {
  totalParticipants: number;
  totalRewardsDistributed: number;
  activePrograms: number;
  programBreakdown: Array<{
    programId: string;
    programName: string;
    participants: number;
    rewardsDistributed: number;
  }>;
}

export interface ParticipantStats {
  participant: Participant | null;
  eligiblePrograms: IncentiveProgram[];
  recentRewards: RewardTransaction[];
}