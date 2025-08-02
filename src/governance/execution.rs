//! Execution engine for governance proposals

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::governance::proposals::{Proposal, ProposalType, ExecutionResult};
use crate::identity::IdentityManager;
use crate::security::CryptoService;
use crate::core::{Block, Transaction};

/// Execution engine for governance proposals
pub struct ExecutionEngine {
    identity_manager: Arc<IdentityManager>,
    crypto_service: Arc<CryptoService>,
    execution_history: Arc<RwLock<HashMap<String, ExecutionRecord>>>,
    rollback_manager: RollbackManager,
}

impl ExecutionEngine {
    /// Create new execution engine
    pub fn new(
        identity_manager: Arc<IdentityManager>,
        crypto_service: Arc<CryptoService>,
    ) -> Self {
        Self {
            identity_manager,
            crypto_service,
            execution_history: Arc::new(RwLock::new(HashMap::new())),
            rollback_manager: RollbackManager::new(),
        }
    }

    /// Execute a proposal
    pub async fn execute_proposal(&self, proposal: &Proposal) -> Result<ExecutionResult, ExecutionError> {
        let execution_id = Uuid::new_v4().to_string();
        let start_time = Utc::now();

        // Validate proposal is ready for execution
        if !self.is_ready_for_execution(proposal).await {
            return Err(ExecutionError::ProposalNotReady);
        }

        // Execute based on proposal type
        let result = match &proposal.proposal_type {
            ProposalType::ProtocolUpgrade(upgrade) => {
                self.execute_protocol_upgrade(upgrade, execution_id.clone()).await
            },
            ProposalType::ParameterChange(change) => {
                self.execute_parameter_change(change, execution_id.clone()).await
            },
            ProposalType::EmergencyAction(action) => {
                self.execute_emergency_action(action, execution_id.clone()).await
            },
            ProposalType::TreasuryManagement(treasury) => {
                self.execute_treasury_management(treasury, execution_id.clone()).await
            },
            ProposalType::Custom(custom) => {
                self.execute_custom_proposal(custom, execution_id.clone()).await
            },
        };

        // Record execution
        let execution_record = ExecutionRecord {
            id: execution_id,
            proposal_id: proposal.id.clone(),
            proposal_type: proposal.proposal_type.type_name(),
            start_time,
            end_time: Utc::now(),
            result: result.clone(),
            executor: "system".to_string(), // This should be the actual executor
        };

        self.execution_history.write().await.insert(execution_id, execution_record);

        result
    }

    /// Check if proposal is ready for execution
    async fn is_ready_for_execution(&self, proposal: &Proposal) -> bool {
        // Check if proposal is approved
        if proposal.status != crate::governance::proposals::ProposalStatus::Approved {
            return false;
        }

        // Check if execution delay has passed
        if Utc::now() < proposal.execution_time {
            return false;
        }

        // Check if executor has permission
        if !self.has_execution_permission("system").await {
            return false;
        }

        true
    }

    /// Execute protocol upgrade
    async fn execute_protocol_upgrade(
        &self,
        upgrade: &crate::governance::proposals::ProtocolUpgrade,
        execution_id: String,
    ) -> Result<ExecutionResult, ExecutionError> {
        // Validate upgrade
        self.validate_protocol_upgrade(upgrade).await?;

        // Create upgrade plan
        let upgrade_plan = UpgradePlan {
            version: upgrade.version.clone(),
            activation_height: upgrade.activation_height.unwrap_or(0),
            rollback_height: upgrade.rollback_height,
            implementation_url: upgrade.implementation_url.clone(),
            execution_id,
        };

        // Schedule upgrade
        self.schedule_upgrade(&upgrade_plan).await?;

        Ok(ExecutionResult {
            success: true,
            message: "Protocol upgrade scheduled successfully".to_string(),
            details: serde_json::json!({
                "upgrade_plan": upgrade_plan,
                "status": "scheduled"
            }),
            executed_at: Utc::now(),
        })
    }

    /// Execute parameter change
    async fn execute_parameter_change(
        &self,
        change: &crate::governance::proposals::ParameterChange,
        execution_id: String,
    ) -> Result<ExecutionResult, ExecutionError> {
        // Validate parameter change
        self.validate_parameter_change(change).await?;

        // Apply parameter change
        self.apply_parameter_change(change).await?;

        Ok(ExecutionResult {
            success: true,
            message: "Parameter changed successfully".to_string(),
            details: serde_json::json!({
                "parameter": change.parameter,
                "old_value": change.current_value,
                "new_value": change.proposed_value,
                "execution_id": execution_id
            }),
            executed_at: Utc::now(),
        })
    }

    /// Execute emergency action
    async fn execute_emergency_action(
        &self,
        action: &crate::governance::proposals::EmergencyAction,
        execution_id: String,
    ) -> Result<ExecutionResult, ExecutionError> {
        // Validate emergency action
        self.validate_emergency_action(action).await?;

        // Execute based on action type
        let result = match action.action_type {
            crate::governance::proposals::EmergencyActionType::PauseNetwork => {
                self.pause_network().await?
            },
            crate::governance::proposals::EmergencyActionType::Rollback => {
                self.rollback_manager.execute_rollback(action).await?
            },
            crate::governance::proposals::EmergencyActionType::FreezeAccounts => {
                self.freeze_accounts(&action.affected_components).await?
            },
            crate::governance::proposals::EmergencyActionType::EnableMaintenance => {
                self.enable_maintenance_mode().await?
            },
        };

        Ok(ExecutionResult {
            success: true,
            message: "Emergency action executed successfully".to_string(),
            details: serde_json::json!({
                "action_type": format!("{:?}", action.action_type),
                "affected_components": action.affected_components,
                "execution_id": execution_id,
                "result": result
            }),
            executed_at: Utc::now(),
        })
    }

    /// Execute treasury management
    async fn execute_treasury_management(
        &self,
        treasury: &crate::governance::proposals::TreasuryManagement,
        execution_id: String,
    ) -> Result<ExecutionResult, ExecutionError> {
        // Validate treasury action
        self.validate_treasury_action(treasury).await?;

        // Execute treasury action
        let result = match treasury.action {
            crate::governance::proposals::TreasuryAction::Transfer => {
                self.execute_treasury_transfer(treasury).await?
            },
            crate::governance::proposals::TreasuryAction::Grant => {
                self.execute_treasury_grant(treasury).await?
            },
            crate::governance::proposals::TreasuryAction::Investment => {
                self.execute_treasury_investment(treasury).await?
            },
            crate::governance::proposals::TreasuryAction::Burn => {
                self.execute_treasury_burn(treasury).await?
            },
        };

        Ok(ExecutionResult {
            success: true,
            message: "Treasury action executed successfully".to_string(),
            details: serde_json::json!({
                "action": format!("{:?}", treasury.action),
                "amount": treasury.amount,
                "recipient": treasury.recipient,
                "purpose": treasury.purpose,
                "execution_id": execution_id,
                "result": result
            }),
            executed_at: Utc::now(),
        })
    }

    /// Execute custom proposal
    async fn execute_custom_proposal(
        &self,
        custom: &crate::governance::proposals::CustomProposal,
        execution_id: String,
    ) -> Result<ExecutionResult, ExecutionError> {
        // Validate custom proposal
        self.validate_custom_proposal(custom).await?;

        // Execute custom proposal (placeholder implementation)
        let result = serde_json::json!({
            "status": "executed",
            "title": custom.title,
            "implementation_plan": custom.implementation_plan,
            "expected_outcomes": custom.expected_outcomes
        });

        Ok(ExecutionResult {
            success: true,
            message: "Custom proposal executed successfully".to_string(),
            details: serde_json::json!({
                "custom_proposal": custom,
                "execution_id": execution_id,
                "result": result
            }),
            executed_at: Utc::now(),
        })
    }

    /// Check if executor has permission
    async fn has_execution_permission(&self, executor: &str) -> bool {
        // Check if executor is a system account or has proper permissions
        executor == "system" || self.identity_manager.is_active(executor).await
    }

    /// Validate protocol upgrade
    async fn validate_protocol_upgrade(
        &self,
        upgrade: &crate::governance::proposals::ProtocolUpgrade,
    ) -> Result<(), ExecutionError> {
        // Check if version is valid
        if upgrade.version.is_empty() {
            return Err(ExecutionError::InvalidUpgrade("Invalid version".to_string()));
        }

        // Check if implementation URL is valid
        if upgrade.implementation_url.is_empty() {
            return Err(ExecutionError::InvalidUpgrade("Invalid implementation URL".to_string()));
        }

        // Check if testnet results are available for major upgrades
        if upgrade.version.contains("major") && upgrade.testnet_results.is_none() {
            return Err(ExecutionError::InvalidUpgrade("Testnet results required for major upgrade".to_string()));
        }

        Ok(())
    }

    /// Validate parameter change
    async fn validate_parameter_change(
        &self,
        change: &crate::governance::proposals::ParameterChange,
    ) -> Result<(), ExecutionError> {
        // Check if parameter exists
        if change.parameter.is_empty() {
            return Err(ExecutionError::InvalidParameter("Parameter name is empty".to_string()));
        }

        // Check if values are valid
        if change.current_value.is_null() || change.proposed_value.is_null() {
            return Err(ExecutionError::InvalidParameter("Invalid parameter values".to_string()));
        }

        // Validate parameter-specific constraints
        self.validate_parameter_constraints(change).await?;

        Ok(())
    }

    /// Validate parameter constraints
    async fn validate_parameter_constraints(
        &self,
        change: &crate::governance::proposals::ParameterChange,
    ) -> Result<(), ExecutionError> {
        match change.parameter.as_str() {
            "block_size" => {
                let new_size = change.proposed_value.as_u64()
                    .ok_or_else(|| ExecutionError::InvalidParameter("Block size must be a number".to_string()))?;
                if new_size < 1000 || new_size > 100000000 {
                    return Err(ExecutionError::InvalidParameter("Block size out of range".to_string()));
                }
            },
            "block_time" => {
                let new_time = change.proposed_value.as_u64()
                    .ok_or_else(|| ExecutionError::InvalidParameter("Block time must be a number".to_string()))?;
                if new_time < 1 || new_time > 3600 {
                    return Err(ExecutionError::InvalidParameter("Block time out of range".to_string()));
                }
            },
            "max_supply" => {
                let new_supply = change.proposed_value.as_u64()
                    .ok_or_else(|| ExecutionError::InvalidParameter("Max supply must be a number".to_string()))?;
                if new_supply < 1000000 {
                    return Err(ExecutionError::InvalidParameter("Max supply too small".to_string()));
                }
            },
            _ => {
                // Unknown parameter, allow for extensibility
            }
        }

        Ok(())
    }

    /// Validate emergency action
    async fn validate_emergency_action(
        &self,
        action: &crate::governance::proposals::EmergencyAction,
    ) -> Result<(), ExecutionError> {
        // Check if reason is provided
        if action.reason.is_empty() {
            return Err(ExecutionError::InvalidEmergencyAction("Reason is required".to_string()));
        }

        // Check if affected components are specified
        if action.affected_components.is_empty() {
            return Err(ExecutionError::InvalidEmergencyAction("Affected components must be specified".to_string()));
        }

        // Validate action-specific constraints
        match action.action_type {
            crate::governance::proposals::EmergencyActionType::Rollback => {
                self.rollback_manager.validate_rollback_feasibility().await?;
            },
            _ => {}
        }

        Ok(())
    }

    /// Validate treasury action
    async fn validate_treasury_action(
        &self,
        treasury: &crate::governance::proposals::TreasuryManagement,
    ) -> Result<(), ExecutionError> {
        // Check if amount is valid
        if treasury.amount == 0 {
            return Err(ExecutionError::InvalidTreasuryAction("Amount must be greater than 0".to_string()));
        }

        // Check if recipient is valid
        if treasury.recipient.is_empty() {
            return Err(ExecutionError::InvalidTreasuryAction("Recipient is required".to_string()));
        }

        // Check if purpose is provided
        if treasury.purpose.is_empty() {
            return Err(ExecutionError::InvalidTreasuryAction("Purpose is required".to_string()));
        }

        // Check treasury balance
        let balance = self.get_treasury_balance().await?;
        if balance < treasury.amount {
            return Err(ExecutionError::InsufficientTreasuryBalance);
        }

        Ok(())
    }

    /// Validate custom proposal
    async fn validate_custom_proposal(
        &self,
        custom: &crate::governance::proposals::CustomProposal,
    ) -> Result<(), ExecutionError> {
        // Check if title is provided
        if custom.title.is_empty() {
            return Err(ExecutionError::InvalidCustomProposal("Title is required".to_string()));
        }

        // Check if description is provided
        if custom.description.is_empty() {
            return Err(ExecutionError::InvalidCustomProposal("Description is required".to_string()));
        }

        // Check if implementation plan is provided
        if custom.implementation_plan.is_empty() {
            return Err(ExecutionError::InvalidCustomProposal("Implementation plan is required".to_string()));
        }

        Ok(())
    }

    // Helper methods for execution (placeholder implementations)

    async fn schedule_upgrade(&self, upgrade_plan: &UpgradePlan) -> Result<(), ExecutionError> {
        // Placeholder: Schedule upgrade in the system
        Ok(())
    }

    async fn apply_parameter_change(
        &self,
        change: &crate::governance::proposals::ParameterChange,
    ) -> Result<(), ExecutionError> {
        // Placeholder: Apply parameter change in the system
        Ok(())
    }

    async fn pause_network(&self) -> Result<serde_json::Value, ExecutionError> {
        // Placeholder: Pause network
        Ok(serde_json::json!({"status": "paused"}))
    }

    async fn freeze_accounts(&self, accounts: &[String]) -> Result<serde_json::Value, ExecutionError> {
        // Placeholder: Freeze accounts
        Ok(serde_json::json!({"frozen_accounts": accounts}))
    }

    async fn enable_maintenance_mode(&self) -> Result<serde_json::Value, ExecutionError> {
        // Placeholder: Enable maintenance mode
        Ok(serde_json::json!({"status": "maintenance_enabled"}))
    }

    async fn execute_treasury_transfer(
        &self,
        treasury: &crate::governance::proposals::TreasuryManagement,
    ) -> Result<serde_json::Value, ExecutionError> {
        // Placeholder: Execute treasury transfer
        Ok(serde_json::json!({"transfer_id": Uuid::new_v4().to_string()}))
    }

    async fn execute_treasury_grant(
        &self,
        treasury: &crate::governance::proposals::TreasuryManagement,
    ) -> Result<serde_json::Value, ExecutionError> {
        // Placeholder: Execute treasury grant
        Ok(serde_json::json!({"grant_id": Uuid::new_v4().to_string()}))
    }

    async fn execute_treasury_investment(
        &self,
        treasury: &crate::governance::proposals::TreasuryManagement,
    ) -> Result<serde_json::Value, ExecutionError> {
        // Placeholder: Execute treasury investment
        Ok(serde_json::json!({"investment_id": Uuid::new_v4().to_string()}))
    }

    async fn execute_treasury_burn(
        &self,
        treasury: &crate::governance::proposals::TreasuryManagement,
    ) -> Result<serde_json::Value, ExecutionError> {
        // Placeholder: Execute treasury burn
        Ok(serde_json::json!({"burn_id": Uuid::new_v4().to_string()}))
    }

    async fn get_treasury_balance(&self) -> Result<u64, ExecutionError> {
        // Placeholder: Get treasury balance
        Ok(1000000000) // 1 billion tokens
    }

    /// Get execution history
    pub async fn get_execution_history(&self) -> Vec<ExecutionRecord> {
        let history = self.execution_history.read().await;
        history.values().cloned().collect()
    }

    /// Get execution record by ID
    pub async fn get_execution_record(&self, execution_id: &str) -> Option<ExecutionRecord> {
        let history = self.execution_history.read().await;
        history.get(execution_id).cloned()
    }
}

/// Rollback manager for emergency actions
pub struct RollbackManager {
    rollback_history: Arc<RwLock<Vec<RollbackRecord>>>,
}

impl RollbackManager {
    /// Create new rollback manager
    pub fn new() -> Self {
        Self {
            rollback_history: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Execute rollback
    pub async fn execute_rollback(
        &self,
        action: &crate::governance::proposals::EmergencyAction,
    ) -> Result<serde_json::Value, ExecutionError> {
        // Validate rollback feasibility
        self.validate_rollback_feasibility().await?;

        // Determine rollback target
        let target_height = self.determine_rollback_target().await?;

        // Create rollback record
        let rollback_record = RollbackRecord {
            id: Uuid::new_v4().to_string(),
            target_height,
            reason: action.reason.clone(),
            executed_at: Utc::now(),
            status: "executing".to_string(),
        };

        // Execute rollback
        let result = self.perform_rollback(target_height).await?;

        // Update rollback record
        let mut history = self.rollback_history.write().await;
        let mut record = rollback_record;
        record.status = "completed".to_string();
        record.result = Some(result.clone());
        history.push(record);

        Ok(result)
    }

    /// Validate rollback feasibility
    async fn validate_rollback_feasibility(&self) -> Result<(), ExecutionError> {
        // Placeholder: Validate rollback feasibility
        Ok(())
    }

    /// Determine rollback target height
    async fn determine_rollback_target(&self) -> Result<u64, ExecutionError> {
        // Placeholder: Determine rollback target height
        Ok(0) // This should be calculated based on current height and rollback strategy
    }

    /// Perform rollback
    async fn perform_rollback(&self, target_height: u64) -> Result<serde_json::Value, ExecutionError> {
        // Placeholder: Perform actual rollback
        Ok(serde_json::json!({
            "target_height": target_height,
            "status": "rolled_back",
            "blocks_affected": 1000 // This should be calculated
        }))
    }

    /// Get rollback history
    pub async fn get_rollback_history(&self) -> Vec<RollbackRecord> {
        let history = self.rollback_history.read().await;
        history.clone()
    }
}

/// Data structures for execution

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionRecord {
    pub id: String,
    pub proposal_id: String,
    pub proposal_type: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub result: Result<ExecutionResult, ExecutionError>,
    pub executor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpgradePlan {
    pub version: String,
    pub activation_height: u64,
    pub rollback_height: Option<u64>,
    pub implementation_url: String,
    pub execution_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackRecord {
    pub id: String,
    pub target_height: u64,
    pub reason: String,
    pub executed_at: DateTime<Utc>,
    pub status: String,
    pub result: Option<serde_json::Value>,
}

/// Execution error types
#[derive(Debug, thiserror::Error)]
pub enum ExecutionError {
    #[error("Proposal not ready for execution")]
    ProposalNotReady,
    #[error("Invalid upgrade: {0}")]
    InvalidUpgrade(String),
    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),
    #[error("Invalid emergency action: {0}")]
    InvalidEmergencyAction(String),
    #[error("Invalid treasury action: {0}")]
    InvalidTreasuryAction(String),
    #[error("Invalid custom proposal: {0}")]
    InvalidCustomProposal(String),
    #[error("Insufficient treasury balance")]
    InsufficientTreasuryBalance,
    #[error("Execution failed: {0}")]
    ExecutionFailed(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::identity::IdentityManager;
    use crate::security::CryptoService;

    #[tokio::test]
    async fn test_execution_engine_creation() {
        let identity_manager = Arc::new(IdentityManager::new().unwrap());
        let crypto_service = Arc::new(CryptoService::new().unwrap());
        
        let engine = ExecutionEngine::new(identity_manager, crypto_service);
        assert!(engine.get_execution_history().await.is_empty());
    }

    #[tokio::test]
    async fn test_protocol_upgrade_validation() {
        let identity_manager = Arc::new(IdentityManager::new().unwrap());
        let crypto_service = Arc::new(CryptoService::new().unwrap());
        
        let engine = ExecutionEngine::new(identity_manager, crypto_service);
        
        let upgrade = crate::governance::proposals::ProtocolUpgrade {
            version: "1.0.0".to_string(),
            description: "Test upgrade".to_string(),
            implementation_url: "https://example.com/upgrade".to_string(),
            activation_height: Some(1000),
            rollback_height: Some(999),
            testnet_results: None,
        };

        let result = engine.validate_protocol_upgrade(&upgrade).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_parameter_change_validation() {
        let identity_manager = Arc::new(IdentityManager::new().unwrap());
        let crypto_service = Arc::new(CryptoService::new().unwrap());
        
        let engine = ExecutionEngine::new(identity_manager, crypto_service);
        
        let change = crate::governance::proposals::ParameterChange {
            parameter: "block_size".to_string(),
            current_value: serde_json::json!(1000000),
            proposed_value: serde_json::json!(2000000),
            rationale: "Increase block size".to_string(),
            impact_analysis: crate::governance::proposals::ImpactAnalysis {
                performance_impact: crate::governance::proposals::ImpactLevel::Medium,
                security_impact: crate::governance::proposals::ImpactLevel::Low,
                compatibility_impact: crate::governance::proposals::ImpactLevel::Low,
                estimated_benefits: "Better throughput".to_string(),
                potential_risks: vec!["Increased storage".to_string()],
            },
        };

        let result = engine.validate_parameter_change(&change).await;
        assert!(result.is_ok());
    }
}