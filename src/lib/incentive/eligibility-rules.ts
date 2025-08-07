/**
 * Eligibility Rules Module
 * 
 * Handles eligibility checking for incentive programs
 */

import { IncentiveProgram, Participant, EligibilityResult } from './types';

export class EligibilityRules {
  /**
   * Check if participant is eligible for a specific program
   */
  checkEligibility(participant: Participant, program: IncentiveProgram): EligibilityResult {
    if (!participant.isActive) {
      return {
        isEligible: false,
        reason: 'Participant is not active'
      };
    }

    // Check if program is still active
    if (!program.isActive) {
      return {
        isEligible: false,
        reason: 'Program is not active'
      };
    }

    // Check if program has expired
    if (new Date() > program.endDate) {
      return {
        isEligible: false,
        reason: 'Program has expired'
      };
    }

    // Check if program hasn't started yet
    if (new Date() < program.startDate) {
      return {
        isEligible: false,
        reason: 'Program has not started yet'
      };
    }

    // Check max participants limit
    if (program.maxParticipants) {
      // This would need to be implemented with actual participant count
      // For now, we'll assume there's room
    }

    // Check specific requirements based on program type
    switch (program.type) {
      case 'transaction':
        return this.checkTransactionEligibility(participant, program);
      case 'referral':
        return this.checkReferralEligibility(participant, program);
      case 'uptime':
        return this.checkUptimeEligibility(participant, program);
      case 'staking':
        return this.checkStakingEligibility(participant, program);
      case 'governance':
        return this.checkGovernanceEligibility(participant, program);
      default:
        return {
          isEligible: false,
          reason: 'Unknown program type'
        };
    }
  }

  /**
   * Check transaction-based eligibility
   */
  private checkTransactionEligibility(participant: Participant, program: IncentiveProgram): EligibilityResult {
    const minTransactions = program.requirements.minTransactions || 0;
    const progress = participant.transactionCount;
    const target = minTransactions;

    return {
      isEligible: participant.transactionCount >= minTransactions,
      reason: participant.transactionCount >= minTransactions 
        ? undefined 
        : `Insufficient transactions: ${participant.transactionCount}/${minTransactions}`,
      progress,
      target
    };
  }

  /**
   * Check referral-based eligibility
   */
  private checkReferralEligibility(participant: Participant, program: IncentiveProgram): EligibilityResult {
    const minReferrals = program.requirements.referralCount || 0;
    const progress = participant.referrals.length;
    const target = minReferrals;

    return {
      isEligible: participant.referrals.length >= minReferrals,
      reason: participant.referrals.length >= minReferrals 
        ? undefined 
        : `Insufficient referrals: ${participant.referrals.length}/${minReferrals}`,
      progress,
      target
    };
  }

  /**
   * Check uptime-based eligibility
   */
  private checkUptimeEligibility(participant: Participant, program: IncentiveProgram): EligibilityResult {
    const minUptime = program.requirements.minUptime || 0;
    const progress = participant.uptime;
    const target = minUptime;

    return {
      isEligible: participant.uptime >= minUptime,
      reason: participant.uptime >= minUptime 
        ? undefined 
        : `Insufficient uptime: ${participant.uptime}%/${minUptime}%`,
      progress,
      target
    };
  }

  /**
   * Check staking-based eligibility
   */
  private checkStakingEligibility(participant: Participant, program: IncentiveProgram): EligibilityResult {
    const minStake = program.requirements.minStake || 0;
    const progress = participant.stakedAmount;
    const target = minStake;

    return {
      isEligible: participant.stakedAmount >= minStake,
      reason: participant.stakedAmount >= minStake 
        ? undefined 
        : `Insufficient stake: ${participant.stakedAmount}/${minStake}`,
      progress,
      target
    };
  }

  /**
   * Check governance-based eligibility
   */
  private checkGovernanceEligibility(participant: Participant, program: IncentiveProgram): EligibilityResult {
    // Governance programs are typically open to all active participants
    return {
      isEligible: true,
      reason: undefined
    };
  }

  /**
   * Get all eligible programs for a participant
   */
  getEligiblePrograms(participant: Participant, programs: IncentiveProgram[]): IncentiveProgram[] {
    return programs.filter(program => {
      const eligibility = this.checkEligibility(participant, program);
      return eligibility.isEligible;
    });
  }

  /**
   * Check if participant has already received a reward for a program
   */
  hasAlreadyReceivedReward(participantId: string, programId: string, existingRewards: any[]): boolean {
    return existingRewards.some(reward => 
      reward.participantId === participantId && reward.programId === programId
    );
  }

  /**
   * Calculate eligibility progress percentage
   */
  calculateProgressPercentage(eligibility: EligibilityResult): number {
    if (!eligibility.target || eligibility.target === 0) {
      return eligibility.isEligible ? 100 : 0;
    }
    
    if (!eligibility.progress) {
      return 0;
    }

    return Math.min((eligibility.progress / eligibility.target) * 100, 100);
  }
}