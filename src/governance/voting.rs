//! Voting system for governance

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// Vote types (re-export from proposals)
pub use crate::governance::proposals::{Vote, VoteType, Votes, VotingStats};

/// Voting power calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VotingPower {
    pub validator_id: String,
    pub stake_amount: u64,
    pub voting_weight: f64,
    pub delegation_power: u64,
    pub reputation_score: f64,
    pub total_power: f64,
}

impl VotingPower {
    /// Create new voting power calculation
    pub fn new(
        validator_id: String,
        stake_amount: u64,
        delegation_power: u64,
        reputation_score: f64,
    ) -> Self {
        let base_power = stake_amount as f64;
        let delegation_power_sqrt = (delegation_power as f64).sqrt();
        let reputation_multiplier = reputation_score.clamp(0.5, 2.0);
        let total_power = (base_power + delegation_power_sqrt) * reputation_multiplier;

        Self {
            validator_id,
            stake_amount,
            voting_weight: total_power,
            delegation_power,
            reputation_score,
            total_power,
        }
    }

    /// Calculate adjusted voting power for specific proposal types
    pub fn adjusted_power(&self, proposal_type: &str) -> f64 {
        match proposal_type {
            "EmergencyAction" => self.total_power * 1.5, // Emergency proposals get more weight
            "ProtocolUpgrade" => self.total_power * 1.2, // Protocol upgrades get slightly more weight
            _ => self.total_power,
        }
    }
}

/// Voting calculator
pub struct VotingCalculator {
    reputation_weights: HashMap<String, f64>,
    stake_multiplier: f64,
    delegation_multiplier: f64,
}

impl VotingCalculator {
    /// Create new voting calculator
    pub fn new() -> Self {
        Self {
            reputation_weights: HashMap::new(),
            stake_multiplier: 1.0,
            delegation_multiplier: 0.1, // Delegated power has diminishing returns
        }
    }

    /// Set reputation weight for a validator
    pub fn set_reputation_weight(&mut self, validator_id: String, weight: f64) {
        self.reputation_weights.insert(validator_id, weight);
    }

    /// Calculate voting power for a validator
    pub fn calculate_voting_power(
        &self,
        validator_id: &str,
        stake_amount: u64,
        delegation_power: u64,
    ) -> f64 {
        let base_power = stake_amount as f64 * self.stake_multiplier;
        let delegation_power = (delegation_power as f64).sqrt() * self.delegation_multiplier;
        let reputation_multiplier = self.reputation_weights
            .get(validator_id)
            .copied()
            .unwrap_or(1.0)
            .clamp(0.5, 2.0);

        (base_power + delegation_power) * reputation_multiplier
    }

    /// Calculate total network voting power
    pub fn calculate_network_power(&self, validators: &[VotingPower]) -> f64 {
        validators.iter().map(|v| v.total_power).sum()
    }

    /// Calculate quorum threshold
    pub fn calculate_quorum_threshold(&self, total_power: f64, required_percentage: f64) -> f64 {
        total_power * required_percentage
    }

    /// Check if quorum is reached
    pub fn is_quorum_reached(&self, votes: &Votes, total_network_power: f64, quorum_threshold: f64) -> bool {
        let participating_power = votes.for_votes + votes.against_votes + votes.abstain_votes;
        participating_power >= (total_network_power * quorum_threshold)
    }

    /// Check if majority is reached
    pub fn is_majority_reached(&self, votes: &Votes, majority_threshold: f64) -> bool {
        let total_votes = votes.for_votes + votes.against_votes;
        if total_votes == 0.0 {
            return false;
        }
        
        (votes.for_votes / total_votes) >= majority_threshold
    }
}

/// Delegation system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Delegation {
    pub delegator: String,
    pub delegate: String,
    pub amount: u64,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: bool,
}

impl Delegation {
    /// Create new delegation
    pub fn new(
        delegator: String,
        delegate: String,
        amount: u64,
        expires_at: Option<DateTime<Utc>>,
    ) -> Self {
        Self {
            delegator,
            delegate,
            amount,
            created_at: Utc::now(),
            expires_at,
            is_active: true,
        }
    }

    /// Check if delegation is expired
    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            Utc::now() > expires_at
        } else {
            false
        }
    }

    /// Calculate effective delegation power (with time decay)
    pub fn effective_power(&self) -> f64 {
        if !self.is_active || self.is_expired() {
            return 0.0;
        }

        let time_factor = if let Some(expires_at) = self.expires_at {
            let total_duration = (expires_at - self.created_at).num_seconds() as f64;
            let elapsed = (Utc::now() - self.created_at).num_seconds() as f64;
            if total_duration > 0.0 {
                1.0 - (elapsed / total_duration).min(1.0)
            } else {
                1.0
            }
        } else {
            1.0
        };

        self.amount as f64 * time_factor
    }
}

/// Delegation manager
pub struct DelegationManager {
    delegations: HashMap<String, Vec<Delegation>>, // key: delegate_id
}

impl DelegationManager {
    /// Create new delegation manager
    pub fn new() -> Self {
        Self {
            delegations: HashMap::new(),
        }
    }

    /// Add delegation
    pub fn add_delegation(&mut self, delegation: Delegation) {
        let delegate_delegations = self.delegations
            .entry(delegation.delegate.clone())
            .or_insert_with(Vec::new);
        
        delegate_delegations.push(delegation);
    }

    /// Get total delegation power for a delegate
    pub fn get_delegation_power(&self, delegate_id: &str) -> u64 {
        self.delegations.get(delegate_id)
            .map(|delegations| {
                delegations.iter()
                    .filter(|d| d.is_active && !d.is_expired())
                    .map(|d| d.amount)
                    .sum()
            })
            .unwrap_or(0)
    }

    /// Get all delegations for a delegate
    pub fn get_delegations(&self, delegate_id: &str) -> Vec<Delegation> {
        self.delegations.get(delegate_id)
            .map(|delegations| delegations.clone())
            .unwrap_or_else(Vec::new)
    }

    /// Remove expired delegations
    pub fn cleanup_expired_delegations(&mut self) {
        for delegations in self.delegations.values_mut() {
            delegations.retain(|d| !d.is_expired());
        }
    }

    /// Calculate delegation statistics
    pub fn get_delegation_stats(&self) -> DelegationStats {
        let mut total_delegations = 0;
        let mut total_delegated_amount = 0;
        let mut active_delegations = 0;
        let mut unique_delegators = std::collections::HashSet::new();
        let mut unique_delegates = std::collections::HashSet::new();

        for (delegate, delegations) in &self.delegations {
            unique_delegates.insert(delegate.clone());
            for delegation in delegations {
                total_delegations += 1;
                total_delegated_amount += delegation.amount;
                unique_delegators.insert(delegation.delegator.clone());
                if delegation.is_active && !delegation.is_expired() {
                    active_delegations += 1;
                }
            }
        }

        DelegationStats {
            total_delegations,
            total_delegated_amount,
            active_delegations,
            unique_delegators: unique_delegators.len(),
            unique_delegates: unique_delegates.len(),
        }
    }
}

/// Delegation statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationStats {
    pub total_delegations: u64,
    pub total_delegated_amount: u64,
    pub active_delegations: u64,
    pub unique_delegators: usize,
    pub unique_delegates: usize,
}

/// Reputation system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReputationScore {
    pub validator_id: String,
    pub score: f64,
    pub contributions: Vec<Contribution>,
    pub penalties: Vec<Penalty>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contribution {
    pub contribution_type: String,
    pub description: String,
    pub weight: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Penalty {
    pub penalty_type: String,
    pub description: String,
    pub severity: f64,
    pub timestamp: DateTime<Utc>,
}

impl ReputationScore {
    /// Create new reputation score
    pub fn new(validator_id: String) -> Self {
        Self {
            validator_id,
            score: 1.0, // Start with neutral reputation
            contributions: Vec::new(),
            penalties: Vec::new(),
            last_updated: Utc::now(),
        }
    }

    /// Add contribution
    pub fn add_contribution(&mut self, contribution: Contribution) {
        self.contributions.push(contribution);
        self.recalculate_score();
    }

    /// Add penalty
    pub fn add_penalty(&mut self, penalty: Penalty) {
        self.penalties.push(penalty);
        self.recalculate_score();
    }

    /// Recalculate reputation score
    fn recalculate_score(&mut self) {
        let contribution_score: f64 = self.contributions
            .iter()
            .map(|c| c.weight)
            .sum();

        let penalty_score: f64 = self.penalties
            .iter()
            .map(|p| p.severity)
            .sum();

        self.score = (1.0 + contribution_score - penalty_score).clamp(0.0, 3.0);
        self.last_updated = Utc::now();
    }

    /// Get reputation multiplier for voting
    pub fn voting_multiplier(&self) -> f64 {
        self.score.clamp(0.5, 2.0)
    }
}

/// Reputation manager
pub struct ReputationManager {
    reputations: HashMap<String, ReputationScore>,
}

impl ReputationManager {
    /// Create new reputation manager
    pub fn new() -> Self {
        Self {
            reputations: HashMap::new(),
        }
    }

    /// Get or create reputation score
    pub fn get_or_create_reputation(&mut self, validator_id: String) -> &mut ReputationScore {
        self.reputations
            .entry(validator_id)
            .or_insert_with(|| ReputationScore::new(validator_id))
    }

    /// Get reputation score
    pub fn get_reputation(&self, validator_id: &str) -> Option<&ReputationScore> {
        self.reputations.get(validator_id)
    }

    /// Add contribution to validator
    pub fn add_contribution(
        &mut self,
        validator_id: String,
        contribution_type: String,
        description: String,
        weight: f64,
    ) {
        let reputation = self.get_or_create_reputation(validator_id);
        reputation.add_contribution(Contribution {
            contribution_type,
            description,
            weight,
            timestamp: Utc::now(),
        });
    }

    /// Add penalty to validator
    pub fn add_penalty(
        &mut self,
        validator_id: String,
        penalty_type: String,
        description: String,
        severity: f64,
    ) {
        let reputation = self.get_or_create_reputation(validator_id);
        reputation.add_penalty(Penalty {
            penalty_type,
            description,
            severity,
            timestamp: Utc::now(),
        });
    }

    /// Get reputation statistics
    pub fn get_reputation_stats(&self) -> ReputationStats {
        let mut total_validators = 0;
        let mut average_score = 0.0;
        let mut high_reputation_count = 0;
        let mut low_reputation_count = 0;

        if !self.reputations.is_empty() {
            total_validators = self.reputations.len();
            average_score = self.reputations
                .values()
                .map(|r| r.score)
                .sum::<f64>() / total_validators as f64;
            
            high_reputation_count = self.reputations
                .values()
                .filter(|r| r.score >= 1.5)
                .count();
            
            low_reputation_count = self.reputations
                .values()
                .filter(|r| r.score <= 0.5)
                .count();
        }

        ReputationStats {
            total_validators,
            average_score,
            high_reputation_count,
            low_reputation_count,
        }
    }
}

/// Reputation statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReputationStats {
    pub total_validators: usize,
    pub average_score: f64,
    pub high_reputation_count: usize,
    pub low_reputation_count: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_voting_power_calculation() {
        let voting_power = VotingPower::new(
            "validator1".to_string(),
            1000000,
            500000,
            1.5,
        );

        assert_eq!(voting_power.stake_amount, 1000000);
        assert_eq!(voting_power.delegation_power, 500000);
        assert_eq!(voting_power.reputation_score, 1.5);
        assert!(voting_power.total_power > 1000000.0);
    }

    #[test]
    fn test_delegation_creation() {
        let delegation = Delegation::new(
            "delegator1".to_string(),
            "delegate1".to_string(),
            100000,
            Some(Utc::now() + chrono::Duration::days(30)),
        );

        assert_eq!(delegation.delegator, "delegator1");
        assert_eq!(delegation.delegate, "delegate1");
        assert_eq!(delegation.amount, 100000);
        assert!(delegation.is_active);
        assert!(!delegation.is_expired());
    }

    #[test]
    fn test_reputation_score() {
        let mut reputation = ReputationScore::new("validator1".to_string());
        
        assert_eq!(reputation.score, 1.0);
        assert_eq!(reputation.voting_multiplier(), 1.0);

        reputation.add_contribution(Contribution {
            contribution_type: "code_contribution".to_string(),
            description: "Fixed critical bug".to_string(),
            weight: 0.5,
            timestamp: Utc::now(),
        });

        assert!(reputation.score > 1.0);
        assert!(reputation.voting_multiplier() > 1.0);
    }

    #[test]
    fn test_voting_calculator() {
        let calculator = VotingCalculator::new();
        
        let power = calculator.calculate_voting_power("validator1", 1000000, 500000);
        assert!(power > 1000000.0);

        let total_power = calculator.calculate_network_power(&[
            VotingPower::new("v1".to_string(), 1000000, 0, 1.0),
            VotingPower::new("v2".to_string(), 2000000, 0, 1.0),
        ]);
        
        assert_eq!(total_power, 3000000.0);
    }
}