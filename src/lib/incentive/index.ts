/**
 * KALDRIX Incentive System
 * 
 * A comprehensive testnet incentive program management system
 * for the KALDRIX quantum DAG blockchain.
 * 
 * @module IncentiveSystem
 */

export { IncentiveService } from './incentive-service';
export { incentiveService } from './incentive-service';
export { ParticipantRegistry } from './participant-registry';
export { EligibilityRules } from './eligibility-rules';
export { PayoutEngine } from './payout-engine';
export * from './types';

/**
 * Main incentive service instance
 * 
 * Use this singleton instance to interact with the incentive system:
 * 
 * ```typescript
 * import { incentiveService } from '@/lib/incentive';
 * 
 * // Register a participant
 * const participant = await incentiveService.registerParticipant(address);
 * 
 * // Track transactions
 * await incentiveService.trackTransaction(address);
 * 
 * // Get leaderboard
 * const leaderboard = incentiveService.getLeaderboard();
 * ```
 */
export { incentiveService as default };