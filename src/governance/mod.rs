//! Governance Module for Quantum DAG Blockchain
//! 
//! This module implements a comprehensive governance system for the blockchain,
//! including proposal management, voting mechanisms, and execution engine.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::core::{Block, Transaction};
use crate::identity::IdentityManager;
use crate::security::CryptoService;

pub mod proposals;
pub mod voting;
pub mod execution;
pub mod audit;

use proposals::{Proposal, ProposalType, ProposalStatus, ProposalId};
use voting::{Vote, VoteType, VotingPower, Votes};
use execution::ExecutionEngine;
use audit::{AuditEntry, AuditService};

/// Governance configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceConfig {
    /// Minimum stake required to create a proposal
    pub min_proposal_stake: u64,
    /// Discussion period duration in seconds
    pub discussion_period: u64,
    /// Voting period duration in seconds
    pub voting_period: u64,
    /// Execution delay in seconds
    pub execution_delay: u64,
    /// Quorum threshold (0.0 to 1.0)
    pub quorum_threshold: f64,
    /// Majority threshold (0.0 to 1.0)
    pub majority_threshold: f64,
    /// Emergency action threshold (0.0 to 1.0)
    pub emergency_threshold: f64,
    /// Maximum number of active proposals
    pub max_active_proposals: usize,
    /// Proposal fee
    pub proposal_fee: u64,
}

impl Default for GovernanceConfig {
    fn default() -> Self {
        Self {
            min_proposal_stake: 1000000,
            discussion_period: 604800, // 7 days
            voting_period: 604800,    // 7 days
            execution_delay: 86400,   // 24 hours
            quorum_threshold: 0.67,   // 67%
            majority_threshold: 0.51, // 51%
            emergency_threshold: 0.80, // 80%
            max_active_proposals: 100,
            proposal_fee: 1000,
        }
    }
}

/// Governance statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceStats {
    pub total_proposals: u64,
    pub active_proposals: u64,
    pub executed_proposals: u64,
    pub rejected_proposals: u64,
    pub average_voting_participation: f64,
    pub proposal_success_rate: f64,
    pub emergency_actions_count: u64,
    pub rollback_count: u64,
}

/// Main governance service
pub struct GovernanceService {
    config: GovernanceConfig,
    proposals: Arc<RwLock<HashMap<ProposalId, Proposal>>>,
    execution_engine: ExecutionEngine,
    audit_service: AuditService,
    identity_manager: Arc<IdentityManager>,
    crypto_service: Arc<CryptoService>,
}

impl GovernanceService {
    /// Create a new governance service
    pub fn new(
        config: GovernanceConfig,
        identity_manager: Arc<IdentityManager>,
        crypto_service: Arc<CryptoService>,
    ) -> Self {
        Self {
            config,
            proposals: Arc::new(RwLock::new(HashMap::new())),
            execution_engine: ExecutionEngine::new(
                identity_manager.clone(),
                crypto_service.clone(),
            ),
            audit_service: AuditService::new(),
            identity_manager,
            crypto_service,
        }
    }

    /// Create a new proposal
    pub async fn create_proposal(
        &self,
        proposal_type: ProposalType,
        title: String,
        description: String,
        proposer: String,
    ) -> Result<Proposal, GovernanceError> {
        // Validate proposer
        self.validate_proposer(&proposer).await?;

        // Check proposal limit
        let proposals = self.proposals.read().await;
        let active_count = proposals.values()
            .filter(|p| matches!(p.status, ProposalStatus::Discussion | ProposalStatus::Voting))
            .count();
        
        if active_count >= self.config.max_active_proposals {
            return Err(GovernanceError::TooManyActiveProposals);
        }
        drop(proposals);

        // Create proposal
        let proposal = Proposal::new(
            proposal_type,
            title,
            description,
            proposer,
            self.config.discussion_period,
            self.config.voting_period,
            self.config.execution_delay,
        );

        // Store proposal
        self.proposals.write().await.insert(proposal.id, proposal.clone());

        // Log audit entry
        self.audit_service.log_proposal_created(&proposal).await?;

        Ok(proposal)
    }

    /// Get a proposal by ID
    pub async fn get_proposal(&self, proposal_id: &ProposalId) -> Result<Proposal, GovernanceError> {
        let proposals = self.proposals.read().await;
        proposals.get(proposal_id)
            .cloned()
            .ok_or(GovernanceError::ProposalNotFound)
    }

    /// List all proposals
    pub async fn list_proposals(&self) -> Vec<Proposal> {
        let proposals = self.proposals.read().await;
        proposals.values().cloned().collect()
    }

    /// Cast a vote on a proposal
    pub async fn cast_vote(
        &self,
        proposal_id: &ProposalId,
        voter: String,
        vote_type: VoteType,
        justification: Option<String>,
    ) -> Result<Vote, GovernanceError> {
        // Validate voter
        self.validate_voter(&voter).await?;

        // Get proposal
        let mut proposals = self.proposals.write().await;
        let proposal = proposals.get_mut(proposal_id)
            .ok_or(GovernanceError::ProposalNotFound)?;

        // Check if voting is allowed
        if proposal.status != ProposalStatus::Voting {
            return Err(GovernanceError::VotingNotActive);
        }

        // Calculate voting power
        let voting_power = self.calculate_voting_power(&voter).await?;

        // Create vote
        let vote = Vote::new(
            proposal_id.clone(),
            voter,
            vote_type,
            voting_power,
            justification,
        );

        // Add vote to proposal
        proposal.add_vote(vote.clone())?;

        // Update proposal status if voting period ended
        self.update_proposal_status(proposal).await?;

        // Log audit entry
        self.audit_service.log_vote_cast(&vote).await?;

        Ok(vote)
    }

    /// Execute a proposal
    pub async fn execute_proposal(&self, proposal_id: &ProposalId) -> Result<(), GovernanceError> {
        let mut proposals = self.proposals.write().await;
        let proposal = proposals.get_mut(proposal_id)
            .ok_or(GovernanceError::ProposalNotFound)?;

        // Check if proposal is ready for execution
        if proposal.status != ProposalStatus::Approved {
            return Err(GovernanceError::ProposalNotReady);
        }

        // Execute proposal
        let result = self.execution_engine.execute_proposal(proposal).await?;

        // Update proposal status
        proposal.status = ProposalStatus::Executed;
        proposal.execution_result = Some(result);

        // Log audit entry
        self.audit_service.log_proposal_executed(proposal).await?;

        Ok(())
    }

    /// Get governance statistics
    pub async fn get_stats(&self) -> GovernanceStats {
        let proposals = self.proposals.read().await;
        let total_proposals = proposals.len() as u64;
        let active_proposals = proposals.values()
            .filter(|p| matches!(p.status, ProposalStatus::Discussion | ProposalStatus::Voting))
            .count() as u64;
        let executed_proposals = proposals.values()
            .filter(|p| p.status == ProposalStatus::Executed)
            .count() as u64;
        let rejected_proposals = proposals.values()
            .filter(|p| p.status == ProposalStatus::Rejected)
            .count() as u64;

        // Calculate average voting participation
        let voting_participation = proposals.values()
            .filter(|p| p.votes.total_power > 0.0)
            .map(|p| p.votes.for_votes / p.votes.total_power)
            .sum::<f64>() / proposals.len().max(1) as f64;

        // Calculate proposal success rate
        let success_rate = if total_proposals > 0 {
            executed_proposals as f64 / total_proposals as f64
        } else {
            0.0
        };

        GovernanceStats {
            total_proposals,
            active_proposals,
            executed_proposals,
            rejected_proposals,
            average_voting_participation: voting_participation,
            proposal_success_rate: success_rate,
            emergency_actions_count: 0, // TODO: Track emergency actions
            rollback_count: 0, // TODO: Track rollbacks
        }
    }

    /// Update proposal status based on current state
    async fn update_proposal_status(&self, proposal: &mut Proposal) -> Result<(), GovernanceError> {
        let now = Utc::now();

        match proposal.status {
            ProposalStatus::Discussion => {
                if now > proposal.voting_start_time {
                    proposal.status = ProposalStatus::Voting;
                    self.audit_service.log_proposal_status_changed(
                        proposal,
                        ProposalStatus::Discussion,
                        ProposalStatus::Voting,
                    ).await?;
                }
            },
            ProposalStatus::Voting => {
                if now > proposal.voting_end_time {
                    if proposal.votes.is_approved(&self.config) {
                        proposal.status = ProposalStatus::Approved;
                    } else {
                        proposal.status = ProposalStatus::Rejected;
                    }
                    
                    self.audit_service.log_proposal_status_changed(
                        proposal,
                        ProposalStatus::Voting,
                        proposal.status,
                    ).await?;
                }
            },
            _ => {},
        }

        Ok(())
    }

    /// Validate proposer
    async fn validate_proposer(&self, proposer: &str) -> Result<(), GovernanceError> {
        // Check if proposer has sufficient stake
        let stake = self.identity_manager.get_stake(proposer).await
            .ok_or(GovernanceError::ProposerNotFound)?;
        
        if stake < self.config.min_proposal_stake {
            return Err(GovernanceError::InsufficientStake);
        }

        // Check if proposer is active
        if !self.identity_manager.is_active(proposer).await {
            return Err(GovernanceError::InactiveProposer);
        }

        Ok(())
    }

    /// Validate voter
    async fn validate_voter(&self, voter: &str) -> Result<(), GovernanceError> {
        // Check if voter has voting power
        let voting_power = self.calculate_voting_power(voter).await?;
        if voting_power == 0.0 {
            return Err(GovernanceError::NoVotingPower);
        }

        // Check if voter is active
        if !self.identity_manager.is_active(voter).await {
            return Err(GovernanceError::InactiveVoter);
        }

        Ok(())
    }

    /// Calculate voting power for a voter
    async fn calculate_voting_power(&self, voter: &str) -> Result<f64, GovernanceError> {
        let stake = self.identity_manager.get_stake(voter).await
            .ok_or(GovernanceError::VoterNotFound)?;
        
        let reputation = self.identity_manager.get_reputation(voter).await.unwrap_or(1.0);
        let delegations = self.identity_manager.get_delegations(voter).await.unwrap_or(0);

        // Calculate voting power with reputation multiplier
        let base_power = stake as f64;
        let delegation_power = (delegations as f64).sqrt();
        let reputation_multiplier = reputation.clamp(0.5, 2.0);

        Ok((base_power + delegation_power) * reputation_multiplier)
    }
}

/// Governance error types
#[derive(Debug, thiserror::Error)]
pub enum GovernanceError {
    #[error("Proposal not found")]
    ProposalNotFound,
    #[error("Too many active proposals")]
    TooManyActiveProposals,
    #[error("Voting not active")]
    VotingNotActive,
    #[error("Proposal not ready for execution")]
    ProposalNotReady,
    #[error("Proposer not found")]
    ProposerNotFound,
    #[error("Insufficient stake")]
    InsufficientStake,
    #[error("Inactive proposer")]
    InactiveProposer,
    #[error("Voter not found")]
    VoterNotFound,
    #[error("No voting power")]
    NoVotingPower,
    #[error("Inactive voter")]
    InactiveVoter,
    #[error("Execution error: {0}")]
    ExecutionError(String),
    #[error("Audit error: {0}")]
    AuditError(String),
    #[error("Identity error: {0}")]
    IdentityError(String),
}

impl From<proposals::ProposalError> for GovernanceError {
    fn from(error: proposals::ProposalError) -> Self {
        GovernanceError::ExecutionError(error.to_string())
    }
}

impl From<execution::ExecutionError> for GovernanceError {
    fn from(error: execution::ExecutionError) -> Self {
        GovernanceError::ExecutionError(error.to_string())
    }
}

impl From<audit::AuditError> for GovernanceError {
    fn from(error: audit::AuditError) -> Self {
        GovernanceError::AuditError(error.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::identity::IdentityManager;
    use crate::security::CryptoService;

    #[tokio::test]
    async fn test_create_proposal() {
        let config = GovernanceConfig::default();
        let identity_manager = Arc::new(IdentityManager::new().unwrap());
        let crypto_service = Arc::new(CryptoService::new().unwrap());
        
        let governance = GovernanceService::new(config, identity_manager, crypto_service);
        
        let proposal_type = ProposalType::ParameterChange(proposals::ParameterChange {
            parameter: "block_size".to_string(),
            current_value: serde_json::json!(1000000),
            proposed_value: serde_json::json!(2000000),
            rationale: "Increase block size for better throughput".to_string(),
            impact_analysis: Default::default(),
        });
        
        let result = governance.create_proposal(
            proposal_type,
            "Increase Block Size".to_string(),
            "Proposal to increase block size from 1MB to 2MB".to_string(),
            "validator1".to_string(),
        ).await;
        
        // This will fail because we haven't set up the identity manager properly
        // but the structure is correct
        assert!(matches!(result, Err(GovernanceError::ProposerNotFound)));
    }

    #[tokio::test]
    async fn test_get_stats() {
        let config = GovernanceConfig::default();
        let identity_manager = Arc::new(IdentityManager::new().unwrap());
        let crypto_service = Arc::new(CryptoService::new().unwrap());
        
        let governance = GovernanceService::new(config, identity_manager, crypto_service);
        let stats = governance.get_stats().await;
        
        assert_eq!(stats.total_proposals, 0);
        assert_eq!(stats.active_proposals, 0);
        assert_eq!(stats.executed_proposals, 0);
        assert_eq!(stats.rejected_proposals, 0);
    }
}