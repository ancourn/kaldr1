//! Audit service for governance system

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::governance::proposals::{Proposal, ProposalStatus, Vote, ExecutionResult};

/// Audit service for governance operations
pub struct AuditService {
    audit_log: Arc<RwLock<Vec<AuditEntry>>>,
    event_handlers: Vec<Box<dyn AuditEventHandler>>,
}

impl AuditService {
    /// Create new audit service
    pub fn new() -> Self {
        Self {
            audit_log: Arc::new(RwLock::new(Vec::new())),
            event_handlers: Vec::new(),
        }
    }

    /// Add event handler
    pub fn add_event_handler<H: AuditEventHandler + 'static>(&mut self, handler: H) {
        self.event_handlers.push(Box::new(handler));
    }

    /// Log proposal created event
    pub async fn log_proposal_created(&self, proposal: &Proposal) -> Result<(), AuditError> {
        let event = AuditEvent::ProposalCreated {
            proposal_id: proposal.id.clone(),
            proposer: proposal.proposer.clone(),
            proposal_type: proposal.proposal_type.type_name(),
        };

        self.log_event(event).await
    }

    /// Log proposal status changed event
    pub async fn log_proposal_status_changed(
        &self,
        proposal: &Proposal,
        old_status: ProposalStatus,
        new_status: ProposalStatus,
    ) -> Result<(), AuditError> {
        let event = AuditEvent::ProposalStatusChanged {
            proposal_id: proposal.id.clone(),
            old_status: format!("{:?}", old_status),
            new_status: format!("{:?}", new_status),
        };

        self.log_event(event).await
    }

    /// Log vote cast event
    pub async fn log_vote_cast(&self, vote: &Vote) -> Result<(), AuditError> {
        let event = AuditEvent::VoteCast {
            proposal_id: vote.proposal_id.clone(),
            voter: vote.voter.clone(),
            vote_type: format!("{:?}", vote.vote_type),
            voting_power: vote.voting_power,
        };

        self.log_event(event).await
    }

    /// Log proposal executed event
    pub async fn log_proposal_executed(&self, proposal: &Proposal) -> Result<(), AuditError> {
        let event = AuditEvent::ProposalExecuted {
            proposal_id: proposal.id.clone(),
            execution_result: proposal.execution_result.clone(),
        };

        self.log_event(event).await
    }

    /// Log emergency action triggered event
    pub async fn log_emergency_action_triggered(
        &self,
        action_type: &str,
        triggered_by: &str,
        reason: &str,
    ) -> Result<(), AuditError> {
        let event = AuditEvent::EmergencyActionTriggered {
            action_type: action_type.to_string(),
            triggered_by: triggered_by.to_string(),
            reason: reason.to_string(),
        };

        self.log_event(event).await
    }

    /// Log rollback executed event
    pub async fn log_rollback_executed(
        &self,
        target_height: u64,
        blocks_rolled_back: u64,
        reason: &str,
    ) -> Result<(), AuditError> {
        let event = AuditEvent::RollbackExecuted {
            target_height,
            blocks_rolled_back,
            reason: reason.to_string(),
        };

        self.log_event(event).await
    }

    /// Log custom event
    pub async fn log_custom_event(
        &self,
        event_type: String,
        actor: String,
        details: serde_json::Value,
    ) -> Result<(), AuditError> {
        let event = AuditEvent::Custom {
            event_type,
            actor,
            details,
        };

        self.log_event(event).await
    }

    /// Log event
    async fn log_event(&self, event: AuditEvent) -> Result<(), AuditError> {
        let entry = AuditEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type: event.event_type(),
            severity: event.severity(),
            actor: event.actor(),
            action: event.action(),
            details: event.details(),
            signature: None, // To be signed by the system
        };

        // Store in audit log
        self.audit_log.write().await.push(entry.clone());

        // Notify event handlers
        for handler in &self.event_handlers {
            if let Err(e) = handler.handle_event(&entry).await {
                eprintln!("Event handler error: {}", e);
            }
        }

        Ok(())
    }

    /// Get audit log entries
    pub async fn get_audit_log(
        &self,
        filters: AuditFilters,
    ) -> Result<Vec<AuditEntry>, AuditError> {
        let log = self.audit_log.read().await;
        let mut filtered = log.clone();

        // Apply filters
        if let Some(event_type) = filters.event_type {
            filtered.retain(|entry| entry.event_type == event_type);
        }

        if let Some(severity) = filters.severity {
            filtered.retain(|entry| entry.severity == severity);
        }

        if let Some(actor) = filters.actor {
            filtered.retain(|entry| entry.actor == actor);
        }

        if let Some(start_time) = filters.start_time {
            filtered.retain(|entry| entry.timestamp >= start_time);
        }

        if let Some(end_time) = filters.end_time {
            filtered.retain(|entry| entry.timestamp <= end_time);
        }

        // Sort by timestamp (newest first)
        filtered.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        // Apply pagination
        if let Some(limit) = filters.limit {
            let offset = filters.offset.unwrap_or(0);
            filtered = filtered.into_iter().skip(offset).take(limit).collect();
        }

        Ok(filtered)
    }

    /// Get audit statistics
    pub async fn get_audit_stats(&self) -> AuditStats {
        let log = self.audit_log.read().await;
        let mut stats = AuditStats::new();

        for entry in log {
            stats.total_events += 1;
            
            *stats.event_type_counts.entry(entry.event_type.clone()).or_insert(0) += 1;
            *stats.severity_counts.entry(entry.severity.clone()).or_insert(0) += 1;
            *stats.actor_counts.entry(entry.actor.clone()).or_insert(0) += 1;

            if entry.timestamp > stats.last_event_time {
                stats.last_event_time = entry.timestamp;
            }
        }

        stats
    }

    /// Export audit log
    pub async fn export_audit_log(&self, format: ExportFormat) -> Result<Vec<u8>, AuditError> {
        let log = self.audit_log.read().await;
        
        match format {
            ExportFormat::Json => {
                let json = serde_json::to_vec_pretty(&*log)?;
                Ok(json)
            },
            ExportFormat::Csv => {
                let mut csv = Vec::new();
                writeln!(&mut csv, "id,timestamp,event_type,severity,actor,action,details")?;
                
                for entry in log.iter() {
                    writeln!(
                        &mut csv,
                        "{},{},{},{},{},{},{}",
                        entry.id,
                        entry.timestamp.to_rfc3339(),
                        entry.event_type,
                        format!("{:?}", entry.severity),
                        entry.actor,
                        entry.action,
                        serde_json::to_string(&entry.details)?
                    )?;
                }
                
                Ok(csv)
            },
        }
    }

    /// Verify audit log integrity
    pub async fn verify_integrity(&self) -> Result<IntegrityReport, AuditError> {
        let log = self.audit_log.read().await;
        let mut report = IntegrityReport {
            total_entries: log.len(),
            valid_entries: 0,
            invalid_entries: 0,
            missing_signatures: 0,
            timestamp_anomalies: 0,
            sequence_gaps: 0,
            details: Vec::new(),
        };

        let mut last_timestamp: Option<DateTime<Utc>> = None;

        for (index, entry) in log.iter().enumerate() {
            let mut entry_valid = true;

            // Check signature
            if entry.signature.is_none() {
                report.missing_signatures += 1;
                entry_valid = false;
            }

            // Check timestamp sequence
            if let Some(last) = last_timestamp {
                if entry.timestamp < last {
                    report.timestamp_anomalies += 1;
                    entry_valid = false;
                }
            }
            last_timestamp = Some(entry.timestamp);

            // Check sequence continuity
            if index > 0 && entry.timestamp.signed_duration_since(log[index - 1].timestamp).num_seconds() > 3600 {
                report.sequence_gaps += 1;
                entry_valid = false;
            }

            if entry_valid {
                report.valid_entries += 1;
            } else {
                report.invalid_entries += 1;
                report.details.push(format!("Invalid entry at index {}: {:?}", index, entry));
            }
        }

        Ok(report)
    }
}

/// Audit event types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuditEvent {
    ProposalCreated {
        proposal_id: String,
        proposer: String,
        proposal_type: String,
    },
    ProposalStatusChanged {
        proposal_id: String,
        old_status: String,
        new_status: String,
    },
    VoteCast {
        proposal_id: String,
        voter: String,
        vote_type: String,
        voting_power: f64,
    },
    ProposalExecuted {
        proposal_id: String,
        execution_result: Option<ExecutionResult>,
    },
    EmergencyActionTriggered {
        action_type: String,
        triggered_by: String,
        reason: String,
    },
    RollbackExecuted {
        target_height: u64,
        blocks_rolled_back: u64,
        reason: String,
    },
    Custom {
        event_type: String,
        actor: String,
        details: serde_json::Value,
    },
}

impl AuditEvent {
    /// Get event type
    pub fn event_type(&self) -> String {
        match self {
            AuditEvent::ProposalCreated { .. } => "proposal_created".to_string(),
            AuditEvent::ProposalStatusChanged { .. } => "proposal_status_changed".to_string(),
            AuditEvent::VoteCast { .. } => "vote_cast".to_string(),
            AuditEvent::ProposalExecuted { .. } => "proposal_executed".to_string(),
            AuditEvent::EmergencyActionTriggered { .. } => "emergency_action_triggered".to_string(),
            AuditEvent::RollbackExecuted { .. } => "rollback_executed".to_string(),
            AuditEvent::Custom { event_type, .. } => event_type.clone(),
        }
    }

    /// Get event severity
    pub fn severity(&self) -> EventSeverity {
        match self {
            AuditEvent::ProposalCreated { .. } => EventSeverity::Info,
            AuditEvent::ProposalStatusChanged { .. } => EventSeverity::Info,
            AuditEvent::VoteCast { .. } => EventSeverity::Info,
            AuditEvent::ProposalExecuted { .. } => EventSeverity::Info,
            AuditEvent::EmergencyActionTriggered { .. } => EventSeverity::Critical,
            AuditEvent::RollbackExecuted { .. } => EventSeverity::Critical,
            AuditEvent::Custom { .. } => EventSeverity::Info,
        }
    }

    /// Get event actor
    pub fn actor(&self) -> String {
        match self {
            AuditEvent::ProposalCreated { proposer, .. } => proposer.clone(),
            AuditEvent::ProposalStatusChanged { .. } => "system".to_string(),
            AuditEvent::VoteCast { voter, .. } => voter.clone(),
            AuditEvent::ProposalExecuted { .. } => "system".to_string(),
            AuditEvent::EmergencyActionTriggered { triggered_by, .. } => triggered_by.clone(),
            AuditEvent::RollbackExecuted { .. } => "system".to_string(),
            AuditEvent::Custom { actor, .. } => actor.clone(),
        }
    }

    /// Get event action
    pub fn action(&self) -> String {
        match self {
            AuditEvent::ProposalCreated { .. } => "created_proposal".to_string(),
            AuditEvent::ProposalStatusChanged { .. } => "changed_status".to_string(),
            AuditEvent::VoteCast { .. } => "cast_vote".to_string(),
            AuditEvent::ProposalExecuted { .. } => "executed_proposal".to_string(),
            AuditEvent::EmergencyActionTriggered { action_type, .. } => format!("triggered_{}", action_type),
            AuditEvent::RollbackExecuted { .. } => "executed_rollback".to_string(),
            AuditEvent::Custom { event_type, .. } => event_type.clone(),
        }
    }

    /// Get event details
    pub fn details(&self) -> serde_json::Value {
        match self {
            AuditEvent::ProposalCreated { proposal_id, proposer, proposal_type } => {
                serde_json::json!({
                    "proposal_id": proposal_id,
                    "proposer": proposer,
                    "proposal_type": proposal_type
                })
            },
            AuditEvent::ProposalStatusChanged { proposal_id, old_status, new_status } => {
                serde_json::json!({
                    "proposal_id": proposal_id,
                    "old_status": old_status,
                    "new_status": new_status
                })
            },
            AuditEvent::VoteCast { proposal_id, voter, vote_type, voting_power } => {
                serde_json::json!({
                    "proposal_id": proposal_id,
                    "voter": voter,
                    "vote_type": vote_type,
                    "voting_power": voting_power
                })
            },
            AuditEvent::ProposalExecuted { proposal_id, execution_result } => {
                serde_json::json!({
                    "proposal_id": proposal_id,
                    "execution_result": execution_result
                })
            },
            AuditEvent::EmergencyActionTriggered { action_type, triggered_by, reason } => {
                serde_json::json!({
                    "action_type": action_type,
                    "triggered_by": triggered_by,
                    "reason": reason
                })
            },
            AuditEvent::RollbackExecuted { target_height, blocks_rolled_back, reason } => {
                serde_json::json!({
                    "target_height": target_height,
                    "blocks_rolled_back": blocks_rolled_back,
                    "reason": reason
                })
            },
            AuditEvent::Custom { details, .. } => details.clone(),
        }
    }
}

/// Audit entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub event_type: String,
    pub severity: EventSeverity,
    pub actor: String,
    pub action: String,
    pub details: serde_json::Value,
    pub signature: Option<String>,
}

/// Event severity levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EventSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

/// Event handler trait
#[async_trait::async_trait]
pub trait AuditEventHandler: Send + Sync {
    async fn handle_event(&self, entry: &AuditEntry) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;
}

/// Audit filters
#[derive(Debug, Clone)]
pub struct AuditFilters {
    pub event_type: Option<String>,
    pub severity: Option<EventSeverity>,
    pub actor: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

impl Default for AuditFilters {
    fn default() -> Self {
        Self {
            event_type: None,
            severity: None,
            actor: None,
            start_time: None,
            end_time: None,
            limit: None,
            offset: None,
        }
    }
}

/// Export format
#[derive(Debug, Clone)]
pub enum ExportFormat {
    Json,
    Csv,
}

/// Audit statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditStats {
    pub total_events: usize,
    pub event_type_counts: HashMap<String, usize>,
    pub severity_counts: HashMap<EventSeverity, usize>,
    pub actor_counts: HashMap<String, usize>,
    pub last_event_time: DateTime<Utc>,
}

impl AuditStats {
    pub fn new() -> Self {
        Self {
            total_events: 0,
            event_type_counts: HashMap::new(),
            severity_counts: HashMap::new(),
            actor_counts: HashMap::new(),
            last_event_time: Utc::now(),
        }
    }
}

/// Integrity report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrityReport {
    pub total_entries: usize,
    pub valid_entries: usize,
    pub invalid_entries: usize,
    pub missing_signatures: usize,
    pub timestamp_anomalies: usize,
    pub sequence_gaps: usize,
    pub details: Vec<String>,
}

/// Audit error types
#[derive(Debug, thiserror::Error)]
pub enum AuditError {
    #[error("Serialization error: {0}")]
    SerializationError(String),
    #[error("Export error: {0}")]
    ExportError(String),
    #[error("Validation error: {0}")]
    ValidationError(String),
}

impl From<serde_json::Error> for AuditError {
    fn from(error: serde_json::Error) -> Self {
        AuditError::SerializationError(error.to_string())
    }
}

impl From<std::io::Error> for AuditError {
    fn from(error: std::io::Error) -> Self {
        AuditError::ExportError(error.to_string())
    }
}

// Example event handler implementation
pub struct LoggingEventHandler;

#[async_trait::async_trait]
impl AuditEventHandler for LoggingEventHandler {
    async fn handle_event(&self, entry: &AuditEntry) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        println!(
            "[AUDIT] {} - {} - {} - {}",
            entry.timestamp.to_rfc3339(),
            entry.event_type,
            entry.actor,
            entry.action
        );
        Ok(())
    }
}

pub struct MetricsEventHandler;

#[async_trait::async_trait]
impl AuditEventHandler for MetricsEventHandler {
    async fn handle_event(&self, entry: &AuditEntry) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // Update metrics based on audit events
        // This would integrate with your metrics system
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_audit_service_creation() {
        let audit_service = AuditService::new();
        assert!(audit_service.get_audit_log(AuditFilters::default()).await.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_proposal_created_event() {
        let mut audit_service = AuditService::new();
        audit_service.add_event_handler(LoggingEventHandler);

        let proposal = Proposal::new(
            crate::governance::proposals::ProposalType::ParameterChange(
                crate::governance::proposals::ParameterChange {
                    parameter: "test".to_string(),
                    current_value: serde_json::json!(1),
                    proposed_value: serde_json::json!(2),
                    rationale: "Test".to_string(),
                    impact_analysis: crate::governance::proposals::ImpactAnalysis {
                        performance_impact: crate::governance::proposals::ImpactLevel::Low,
                        security_impact: crate::governance::proposals::ImpactLevel::Low,
                        compatibility_impact: crate::governance::proposals::ImpactLevel::Low,
                        estimated_benefits: "Test".to_string(),
                        potential_risks: vec![],
                    },
                }
            ),
            "Test".to_string(),
            "Test proposal".to_string(),
            "validator1".to_string(),
            604800,
            604800,
            86400,
        );

        let result = audit_service.log_proposal_created(&proposal).await;
        assert!(result.is_ok());

        let log = audit_service.get_audit_log(AuditFilters::default()).await.unwrap();
        assert_eq!(log.len(), 1);
        assert_eq!(log[0].event_type, "proposal_created");
    }

    #[tokio::test]
    async fn test_audit_filters() {
        let mut audit_service = AuditService::new();

        // Log some events
        audit_service.log_custom_event(
            "test_event".to_string(),
            "actor1".to_string(),
            serde_json::json!({"test": "data"}),
        ).await.unwrap();

        audit_service.log_custom_event(
            "other_event".to_string(),
            "actor2".to_string(),
            serde_json::json!({"other": "data"}),
        ).await.unwrap();

        // Test filtering by event type
        let filters = AuditFilters {
            event_type: Some("test_event".to_string()),
            ..Default::default()
        };

        let log = audit_service.get_audit_log(filters).await.unwrap();
        assert_eq!(log.len(), 1);
        assert_eq!(log[0].event_type, "test_event");
    }

    #[tokio::test]
    async fn test_audit_stats() {
        let mut audit_service = AuditService::new();

        // Log some events
        audit_service.log_custom_event(
            "event1".to_string(),
            "actor1".to_string(),
            serde_json::json!({}),
        ).await.unwrap();

        audit_service.log_custom_event(
            "event2".to_string(),
            "actor2".to_string(),
            serde_json::json!({}),
        ).await.unwrap();

        let stats = audit_service.get_audit_stats().await;
        assert_eq!(stats.total_events, 2);
        assert_eq!(stats.event_type_counts.get("event1"), Some(&1));
        assert_eq!(stats.event_type_counts.get("event2"), Some(&1));
    }
}