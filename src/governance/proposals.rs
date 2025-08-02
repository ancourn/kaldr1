//! Proposal management for governance system

use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Unique identifier for proposals
pub type ProposalId = String;

/// Proposal types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProposalType {
    /// Protocol upgrade proposal
    ProtocolUpgrade(ProtocolUpgrade),
    /// Parameter change proposal
    ParameterChange(ParameterChange),
    /// Emergency action proposal
    EmergencyAction(EmergencyAction),
    /// Treasury management proposal
    TreasuryManagement(TreasuryManagement),
    /// Custom proposal
    Custom(CustomProposal),
}

/// Protocol upgrade details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolUpgrade {
    pub version: String,
    pub description: String,
    pub implementation_url: String,
    pub activation_height: Option<u64>,
    pub rollback_height: Option<u64>,
    pub testnet_results: Option<TestnetResults>,
}

/// Testnet results for protocol upgrades
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestnetResults {
    pub duration_hours: u64,
    pub transactions_processed: u64,
    pub blocks_produced: u64,
    pub performance_metrics: HashMap<String, f64>,
    pub security_audit_passed: bool,
}

/// Parameter change details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterChange {
    pub parameter: String,
    pub current_value: serde_json::Value,
    pub proposed_value: serde_json::Value,
    pub rationale: String,
    pub impact_analysis: ImpactAnalysis,
}

/// Impact analysis for parameter changes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactAnalysis {
    pub performance_impact: ImpactLevel,
    pub security_impact: ImpactLevel,
    pub compatibility_impact: ImpactLevel,
    pub estimated_benefits: String,
    pub potential_risks: Vec<String>,
}

/// Impact level assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImpactLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Emergency action types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EmergencyActionType {
    PauseNetwork,
    Rollback,
    FreezeAccounts,
    EnableMaintenance,
}

/// Emergency action details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmergencyAction {
    pub action_type: EmergencyActionType,
    pub reason: String,
    pub immediate_effect: bool,
    pub affected_components: Vec<String>,
}

/// Treasury action types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TreasuryAction {
    Transfer,
    Grant,
    Investment,
    Burn,
}

/// Treasury management details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreasuryManagement {
    pub action: TreasuryAction,
    pub amount: u64,
    pub recipient: String,
    pub purpose: String,
    pub budget_category: String,
}

/// Custom proposal details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomProposal {
    pub title: String,
    pub description: String,
    pub implementation_plan: String,
    pub required_resources: Vec<String>,
    pub expected_outcomes: Vec<String>,
}

/// Proposal status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProposalStatus {
    Draft,
    Discussion,
    Voting,
    Approved,
    Rejected,
    Executed,
    Cancelled,
    Expired,
}

/// Main proposal structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proposal {
    pub id: ProposalId,
    pub proposal_type: ProposalType,
    pub title: String,
    pub description: String,
    pub proposer: String,
    pub created_at: DateTime<Utc>,
    pub discussion_period: u64,
    pub voting_period: u64,
    pub execution_delay: u64,
    pub status: ProposalStatus,
    pub votes: Votes,
    pub voting_start_time: DateTime<Utc>,
    pub voting_end_time: DateTime<Utc>,
    pub execution_time: DateTime<Utc>,
    pub metadata: ProposalMetadata,
    pub execution_result: Option<ExecutionResult>,
}

/// Proposal metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProposalMetadata {
    pub tags: Vec<String>,
    pub links: Vec<Link>,
    pub attachments: Vec<Attachment>,
    pub discussion_thread: Option<String>,
    pub audit_trail: Vec<AuditEntry>,
}

/// Link to external resources
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    pub title: String,
    pub url: String,
    pub description: Option<String>,
}

/// Attachment for proposals
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub name: String,
    pub content_type: String,
    pub size_bytes: u64,
    pub hash: String,
    pub url: String,
}

/// Audit entry for proposals
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub timestamp: DateTime<Utc>,
    pub action: String,
    pub actor: String,
    pub details: String,
}

/// Execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub message: String,
    pub details: serde_json::Value,
    pub executed_at: DateTime<Utc>,
}

impl Proposal {
    /// Create a new proposal
    pub fn new(
        proposal_type: ProposalType,
        title: String,
        description: String,
        proposer: String,
        discussion_period: u64,
        voting_period: u64,
        execution_delay: u64,
    ) -> Self {
        let now = Utc::now();
        let voting_start_time = now + chrono::Duration::seconds(discussion_period as i64);
        let voting_end_time = voting_start_time + chrono::Duration::seconds(voting_period as i64);
        let execution_time = voting_end_time + chrono::Duration::seconds(execution_delay as i64);

        Self {
            id: Uuid::new_v4().to_string(),
            proposal_type,
            title,
            description,
            proposer,
            created_at: now,
            discussion_period,
            voting_period,
            execution_delay,
            status: ProposalStatus::Discussion,
            votes: Votes::new(),
            voting_start_time,
            voting_end_time,
            execution_time,
            metadata: ProposalMetadata {
                tags: Vec::new(),
                links: Vec::new(),
                attachments: Vec::new(),
                discussion_thread: None,
                audit_trail: Vec::new(),
            },
            execution_result: None,
        }
    }

    /// Add a vote to the proposal
    pub fn add_vote(&mut self, vote: Vote) -> Result<(), ProposalError> {
        // Check if voter has already voted
        if self.votes.has_voted(&vote.voter) {
            return Err(ProposalError::AlreadyVoted);
        }

        // Add the vote
        self.votes.add_vote(vote);
        Ok(())
    }

    /// Check if proposal is ready for execution
    pub fn is_ready_for_execution(&self) -> bool {
        self.status == ProposalStatus::Approved && 
        Utc::now() >= self.execution_time
    }

    /// Get proposal summary
    pub fn summary(&self) -> ProposalSummary {
        ProposalSummary {
            id: self.id.clone(),
            title: self.title.clone(),
            status: self.status.clone(),
            proposal_type: self.proposal_type.type_name(),
            created_at: self.created_at,
            voting_end_time: self.voting_end_time,
            for_votes: self.votes.for_votes,
            against_votes: self.votes.against_votes,
            total_voting_power: self.votes.total_power,
        }
    }
}

/// Proposal summary for listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProposalSummary {
    pub id: ProposalId,
    pub title: String,
    pub status: ProposalStatus,
    pub proposal_type: String,
    pub created_at: DateTime<Utc>,
    pub voting_end_time: DateTime<Utc>,
    pub for_votes: f64,
    pub against_votes: f64,
    pub total_voting_power: f64,
}

impl ProposalType {
    /// Get the type name as string
    pub fn type_name(&self) -> String {
        match self {
            ProposalType::ProtocolUpgrade(_) => "Protocol Upgrade".to_string(),
            ProposalType::ParameterChange(_) => "Parameter Change".to_string(),
            ProposalType::EmergencyAction(_) => "Emergency Action".to_string(),
            ProposalType::TreasuryManagement(_) => "Treasury Management".to_string(),
            ProposalType::Custom(_) => "Custom".to_string(),
        }
    }
}

/// Vote structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vote {
    pub id: String,
    pub proposal_id: ProposalId,
    pub voter: String,
    pub vote_type: VoteType,
    pub voting_power: f64,
    pub timestamp: DateTime<Utc>,
    pub justification: Option<String>,
    pub signature: Option<String>,
}

/// Vote types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoteType {
    For,
    Against,
    Abstain,
    Veto, // Emergency veto power
}

impl Vote {
    /// Create a new vote
    pub fn new(
        proposal_id: ProposalId,
        voter: String,
        vote_type: VoteType,
        voting_power: f64,
        justification: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            proposal_id,
            voter,
            vote_type,
            voting_power,
            timestamp: Utc::now(),
            justification,
            signature: None,
        }
    }
}

/// Votes tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Votes {
    pub for_votes: f64,
    pub against_votes: f64,
    pub abstain_votes: f64,
    pub veto_votes: f64,
    pub total_power: f64,
    pub votes_by_voter: HashMap<String, Vote>,
}

impl Votes {
    /// Create new votes structure
    pub fn new() -> Self {
        Self {
            for_votes: 0.0,
            against_votes: 0.0,
            abstain_votes: 0.0,
            veto_votes: 0.0,
            total_power: 0.0,
            votes_by_voter: HashMap::new(),
        }
    }

    /// Add a vote
    pub fn add_vote(&mut self, vote: Vote) {
        let voting_power = vote.voting_power;
        
        match vote.vote_type {
            VoteType::For => self.for_votes += voting_power,
            VoteType::Against => self.against_votes += voting_power,
            VoteType::Abstain => self.abstain_votes += voting_power,
            VoteType::Veto => self.veto_votes += voting_power,
        }
        
        self.total_power += voting_power;
        self.votes_by_voter.insert(vote.voter, vote);
    }

    /// Check if voter has already voted
    pub fn has_voted(&self, voter: &str) -> bool {
        self.votes_by_voter.contains_key(voter)
    }

    /// Check if proposal is approved based on config
    pub fn is_approved(&self, config: &GovernanceConfig) -> bool {
        // Check quorum
        let participation_rate = if self.total_power > 0.0 {
            self.total_power / self.total_power // This needs to be adjusted based on total network power
        } else {
            0.0
        };

        if participation_rate < config.quorum_threshold {
            return false;
        }

        // Check majority
        if self.for_votes <= self.against_votes {
            return false;
        }

        // Check for veto votes
        if self.veto_votes > 0.0 {
            return false;
        }

        true
    }

    /// Get voting statistics
    pub fn get_stats(&self) -> VotingStats {
        VotingStats {
            for_votes: self.for_votes,
            against_votes: self.against_votes,
            abstain_votes: self.abstain_votes,
            veto_votes: self.veto_votes,
            total_power: self.total_power,
            participation_rate: if self.total_power > 0.0 {
                (self.for_votes + self.against_votes + self.abstain_votes) / self.total_power
            } else {
                0.0
            },
            approval_rate: if (self.for_votes + self.against_votes) > 0.0 {
                self.for_votes / (self.for_votes + self.against_votes)
            } else {
                0.0
            },
        }
    }
}

/// Voting statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VotingStats {
    pub for_votes: f64,
    pub against_votes: f64,
    pub abstain_votes: f64,
    pub veto_votes: f64,
    pub total_power: f64,
    pub participation_rate: f64,
    pub approval_rate: f64,
}

/// Governance configuration (re-export for proposals)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceConfig {
    pub min_proposal_stake: u64,
    pub discussion_period: u64,
    pub voting_period: u64,
    pub execution_delay: u64,
    pub quorum_threshold: f64,
    pub majority_threshold: f64,
    pub emergency_threshold: f64,
    pub max_active_proposals: usize,
    pub proposal_fee: u64,
}

/// Proposal error types
#[derive(Debug, thiserror::Error)]
pub enum ProposalError {
    #[error("Already voted")]
    AlreadyVoted,
    #[error("Invalid proposal type")]
    InvalidProposalType,
    #[error("Invalid proposal status")]
    InvalidStatus,
    #[error("Proposal expired")]
    ProposalExpired,
    #[error("Insufficient voting power")]
    InsufficientVotingPower,
    #[error("Invalid voter")]
    InvalidVoter,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_proposal_creation() {
        let proposal_type = ProposalType::ParameterChange(ParameterChange {
            parameter: "block_size".to_string(),
            current_value: serde_json::json!(1000000),
            proposed_value: serde_json::json!(2000000),
            rationale: "Increase block size".to_string(),
            impact_analysis: ImpactAnalysis {
                performance_impact: ImpactLevel::Medium,
                security_impact: ImpactLevel::Low,
                compatibility_impact: ImpactLevel::Low,
                estimated_benefits: "Better throughput".to_string(),
                potential_risks: vec!["Increased storage requirements".to_string()],
            },
        });

        let proposal = Proposal::new(
            proposal_type,
            "Increase Block Size".to_string(),
            "Proposal to increase block size".to_string(),
            "validator1".to_string(),
            604800,
            604800,
            86400,
        );

        assert_eq!(proposal.status, ProposalStatus::Discussion);
        assert!(proposal.voting_start_time > proposal.created_at);
        assert!(proposal.voting_end_time > proposal.voting_start_time);
        assert!(proposal.execution_time > proposal.voting_end_time);
    }

    #[test]
    fn test_vote_addition() {
        let mut proposal = Proposal::new(
            ProposalType::ParameterChange(ParameterChange {
                parameter: "test".to_string(),
                current_value: serde_json::json!(1),
                proposed_value: serde_json::json!(2),
                rationale: "Test".to_string(),
                impact_analysis: ImpactAnalysis {
                    performance_impact: ImpactLevel::Low,
                    security_impact: ImpactLevel::Low,
                    compatibility_impact: ImpactLevel::Low,
                    estimated_benefits: "Test".to_string(),
                    potential_risks: vec![],
                },
            }),
            "Test".to_string(),
            "Test proposal".to_string(),
            "validator1".to_string(),
            604800,
            604800,
            86400,
        );

        let vote = Vote::new(
            proposal.id.clone(),
            "validator1".to_string(),
            VoteType::For,
            1000.0,
            None,
        );

        assert!(proposal.add_vote(vote).is_ok());
        assert_eq!(proposal.votes.for_votes, 1000.0);
        assert_eq!(proposal.votes.total_power, 1000.0);
    }

    #[test]
    fn test_double_voting() {
        let mut proposal = Proposal::new(
            ProposalType::ParameterChange(ParameterChange {
                parameter: "test".to_string(),
                current_value: serde_json::json!(1),
                proposed_value: serde_json::json!(2),
                rationale: "Test".to_string(),
                impact_analysis: ImpactAnalysis {
                    performance_impact: ImpactLevel::Low,
                    security_impact: ImpactLevel::Low,
                    compatibility_impact: ImpactLevel::Low,
                    estimated_benefits: "Test".to_string(),
                    potential_risks: vec![],
                },
            }),
            "Test".to_string(),
            "Test proposal".to_string(),
            "validator1".to_string(),
            604800,
            604800,
            86400,
        );

        let vote1 = Vote::new(
            proposal.id.clone(),
            "validator1".to_string(),
            VoteType::For,
            1000.0,
            None,
        );

        let vote2 = Vote::new(
            proposal.id.clone(),
            "validator1".to_string(),
            VoteType::Against,
            1000.0,
            None,
        );

        assert!(proposal.add_vote(vote1).is_ok());
        assert!(matches!(proposal.add_vote(vote2), Err(ProposalError::AlreadyVoted)));
    }
}