/**
 * Participant Registry Module
 * 
 * Manages participant registration, tracking, and data persistence
 */

import { db } from '@/lib/db';
import { Participant } from './types';

export class ParticipantRegistry {
  private participants: Map<string, Participant> = new Map();

  /**
   * Register a new participant in the incentive system
   */
  async registerParticipant(address: string, nodeId?: string): Promise<Participant> {
    // Check if participant already exists
    const existingParticipant = this.participants.get(address);
    if (existingParticipant) {
      return existingParticipant;
    }

    // Create new participant
    const participant: Participant = {
      id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      address,
      nodeId,
      joinDate: new Date(),
      totalRewards: 0,
      transactionCount: 0,
      uptime: 100,
      referrals: [],
      stakedAmount: 0,
      isActive: true
    };

    // Store in memory
    this.participants.set(address, participant);

    // Store in database
    try {
      await db.participant.create({
        data: {
          address,
          nodeId,
          joinDate: participant.joinDate,
          totalRewards: 0,
          transactionCount: 0,
          uptime: 100,
          referrals: [],
          stakedAmount: 0,
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error storing participant in database:', error);
      // Continue even if database storage fails
    }

    return participant;
  }

  /**
   * Get participant by address
   */
  getParticipant(address: string): Participant | undefined {
    return this.participants.get(address);
  }

  /**
   * Get participant by node ID
   */
  getParticipantByNodeId(nodeId: string): Participant | undefined {
    for (const participant of this.participants.values()) {
      if (participant.nodeId === nodeId) {
        return participant;
      }
    }
    return undefined;
  }

  /**
   * Update participant transaction count
   */
  async updateTransactionCount(address: string, count: number): Promise<void> {
    const participant = this.participants.get(address);
    if (!participant) {
      await this.registerParticipant(address);
      return;
    }

    participant.transactionCount = count;

    // Update database
    try {
      await db.participant.update({
        where: { address },
        data: { transactionCount: count }
      });
    } catch (error) {
      console.error('Error updating transaction count:', error);
    }
  }

  /**
   * Update participant uptime
   */
  async updateUptime(nodeId: string, uptime: number): Promise<void> {
    const participant = this.getParticipantByNodeId(nodeId);
    if (!participant) {
      return;
    }

    participant.uptime = uptime;

    // Update database
    try {
      await db.participant.update({
        where: { address: participant.address },
        data: { uptime }
      });
    } catch (error) {
      console.error('Error updating uptime:', error);
    }
  }

  /**
   * Update participant staked amount
   */
  async updateStakedAmount(address: string, amount: number): Promise<void> {
    const participant = this.participants.get(address);
    if (!participant) {
      await this.registerParticipant(address);
      return;
    }

    participant.stakedAmount = amount;

    // Update database
    try {
      await db.participant.update({
        where: { address },
        data: { stakedAmount: amount }
      });
    } catch (error) {
      console.error('Error updating staked amount:', error);
    }
  }

  /**
   * Add referral to participant
   */
  async addReferral(referrerAddress: string, referredAddress: string): Promise<boolean> {
    const referrer = this.participants.get(referrerAddress);
    if (!referrer) {
      await this.registerParticipant(referrerAddress);
      return false;
    }

    // Check if already referred
    if (referrer.referrals.includes(referredAddress)) {
      return false;
    }

    referrer.referrals.push(referredAddress);

    // Update database
    try {
      await db.participant.update({
        where: { address: referrerAddress },
        data: { referrals: referrer.referrals }
      });
    } catch (error) {
      console.error('Error updating referrals:', error);
    }

    return true;
  }

  /**
   * Update participant total rewards
   */
  async updateTotalRewards(address: string, amount: number): Promise<void> {
    const participant = this.participants.get(address);
    if (!participant) {
      return;
    }

    participant.totalRewards = amount;

    // Update database
    try {
      await db.participant.update({
        where: { address },
        data: { totalRewards: amount }
      });
    } catch (error) {
      console.error('Error updating total rewards:', error);
    }
  }

  /**
   * Get all participants
   */
  getAllParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Get active participants
   */
  getActiveParticipants(): Participant[] {
    return this.getAllParticipants().filter(p => p.isActive);
  }

  /**
   * Get participant count
   */
  getParticipantCount(): number {
    return this.participants.size;
  }

  /**
   * Clear all participants (for testing/reset)
   */
  clear(): void {
    this.participants.clear();
  }
}