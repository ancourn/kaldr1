//! Bridge Protocol Module
//! 
//! This module contains the core components for the KALDRIX cross-chain bridge protocol,
//! including the bridge protocol core, connectors, message routing, and security layers.

pub mod bridge_core;
pub mod connectors;
pub mod message_router;
pub mod state_sync;
pub mod security;
pub mod types;

// Re-export main types for convenience
pub use bridge_core::{
    BridgeProtocolCore, BridgeConfig, BridgeState, BridgeStatus, BridgeMetrics,
    TransferRequest, TransferState, TransferStatus, BridgeError,
};
pub use types::{
    ChainId, TransferId, MessageId, CrossChainMessage, MessageType, MessagePayload,
    TransferPayload, StateSyncPayload, HeartbeatPayload, ErrorPayload,
};
pub use connectors::BridgeConnector;
pub use message_router::MessageRouter;
pub use state_sync::StateSyncManager;
pub use security::BridgeSecurityValidator;

/// Bridge protocol version
pub const BRIDGE_PROTOCOL_VERSION: &str = "1.0.0";

/// Supported chain IDs
pub mod chains {
    pub const ETHEREUM: u32 = 1;
    pub const BSC: u32 = 56;
    pub const POLYGON: u32 = 137;
    pub const AVALANCHE: u32 = 43114;
    pub const ARBITRUM: u32 = 42161;
}

/// Bridge protocol configuration defaults
pub mod defaults {
    use super::*;
    
    pub fn default_security_config() -> SecurityConfig {
        SecurityConfig {
            enable_post_quantum: true,
            multi_signature_threshold: 3,
            rate_limit_requests_per_second: 1000,
            enable_anomaly_detection: true,
        }
    }
    
    pub fn default_performance_config() -> PerformanceConfig {
        PerformanceConfig {
            max_concurrent_transfers: 1000,
            target_latency_ms: 500,
            retry_attempts: 3,
            enable_performance_monitoring: true,
        }
    }
    
    pub fn default_network_config() -> NetworkConfig {
        NetworkConfig {
            listen_port: 8080,
            max_connections: 10000,
            timeout_seconds: 30,
            enable_tls: true,
        }
    }
}

/// Bridge protocol utilities
pub mod utils {
    use super::*;
    use chrono::{DateTime, Utc};
    
    /// Get current timestamp
    pub fn current_timestamp() -> u64 {
        Utc::now().timestamp() as u64
    }
    
    /// Generate unique transfer ID
    pub fn generate_transfer_id() -> TransferId {
        uuid::Uuid::new_v4()
    }
    
    /// Generate unique message ID
    pub fn generate_message_id() -> MessageId {
        uuid::Uuid::new_v4()
    }
    
    /// Validate chain ID
    pub fn validate_chain_id(chain_id: ChainId) -> bool {
        matches!(chain_id, chains::ETHEREUM | chains::BSC | chains::POLYGON | chains::AVALANCHE | chains::ARBITRUM)
    }
    
    /// Format timestamp to human-readable string
    pub fn format_timestamp(timestamp: u64) -> String {
        let datetime = DateTime::from_timestamp(timestamp as i64, 0)
            .unwrap_or_else(|| Utc::now());
        datetime.format("%Y-%m-%d %H:%M:%S UTC").to_string()
    }
}

/// Bridge protocol errors
pub mod errors {
    use thiserror::Error;
    
    #[derive(Error, Debug)]
    pub enum BridgeProtocolError {
        #[error("Unsupported chain: {0}")]
        UnsupportedChain(u32),
        
        #[error("Invalid transfer amount")]
        InvalidAmount,
        
        #[error("Invalid address")]
        InvalidAddress,
        
        #[error("Transfer not found: {0}")]
        TransferNotFound(String),
        
        #[error("Security validation failed: {0}")]
        SecurityValidationFailed(String),
        
        #[error("Network error: {0}")]
        NetworkError(String),
        
        #[error("Internal error: {0}")]
        InternalError(String),
        
        #[error("Configuration error: {0}")]
        ConfigurationError(String),
        
        #[error("Serialization error: {0}")]
        SerializationError(String),
        
        #[error("Deserialization error: {0}")]
        DeserializationError(String),
    }
    
    impl From<BridgeProtocolError> for BridgeError {
        fn from(err: BridgeProtocolError) -> Self {
            match err {
                BridgeProtocolError::UnsupportedChain(chain_id) => BridgeError::UnsupportedChain(chain_id),
                BridgeProtocolError::InvalidAmount => BridgeError::InvalidAmount,
                BridgeProtocolError::InvalidAddress => BridgeError::InvalidAddress,
                BridgeProtocolError::TransferNotFound(id) => BridgeError::TransferNotFound(uuid::Uuid::parse_str(&id).unwrap_or_default()),
                BridgeProtocolError::SecurityValidationFailed(msg) => BridgeError::SecurityValidationFailed(msg),
                BridgeProtocolError::NetworkError(msg) => BridgeError::NetworkError(msg),
                BridgeProtocolError::InternalError(msg) => BridgeError::InternalError(msg),
                _ => BridgeError::InternalError(err.to_string()),
            }
        }
    }
}

/// Bridge protocol events
pub mod events {
    use super::*;
    use serde::{Deserialize, Serialize};
    
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub enum BridgeEvent {
        /// Transfer initiated
        TransferInitiated {
            transfer_id: TransferId,
            source_chain: ChainId,
            target_chain: ChainId,
            amount: u128,
        },
        
        /// Transfer processed
        TransferProcessed {
            transfer_id: TransferId,
            status: TransferStatus,
        },
        
        /// Transfer completed
        TransferCompleted {
            transfer_id: TransferId,
            timestamp: u64,
        },
        
        /// Transfer failed
        TransferFailed {
            transfer_id: TransferId,
            error: String,
            timestamp: u64,
        },
        
        /// Connector registered
        ConnectorRegistered {
            chain_id: ChainId,
            connector_type: String,
        },
        
        /// Bridge status changed
        BridgeStatusChanged {
            old_status: BridgeStatus,
            new_status: BridgeStatus,
            timestamp: u64,
        },
        
        /// Security event
        SecurityEvent {
            event_type: String,
            severity: String,
            message: String,
            timestamp: u64,
        },
        
        /// Performance alert
        PerformanceAlert {
            metric_name: String,
            current_value: f64,
            threshold: f64,
            timestamp: u64,
        },
    }
    
    impl BridgeEvent {
        pub fn timestamp(&self) -> u64 {
            match self {
                BridgeEvent::TransferCompleted { timestamp, .. } => *timestamp,
                BridgeEvent::TransferFailed { timestamp, .. } => *timestamp,
                BridgeEvent::BridgeStatusChanged { timestamp, .. } => *timestamp,
                BridgeEvent::SecurityEvent { timestamp, .. } => *timestamp,
                BridgeEvent::PerformanceAlert { timestamp, .. } => *timestamp,
                _ => utils::current_timestamp(),
            }
        }
        
        pub fn event_type(&self) -> String {
            match self {
                BridgeEvent::TransferInitiated { .. } => "transfer_initiated".to_string(),
                BridgeEvent::TransferProcessed { .. } => "transfer_processed".to_string(),
                BridgeEvent::TransferCompleted { .. } => "transfer_completed".to_string(),
                BridgeEvent::TransferFailed { .. } => "transfer_failed".to_string(),
                BridgeEvent::ConnectorRegistered { .. } => "connector_registered".to_string(),
                BridgeEvent::BridgeStatusChanged { .. } => "bridge_status_changed".to_string(),
                BridgeEvent::SecurityEvent { .. } => "security_event".to_string(),
                BridgeEvent::PerformanceAlert { .. } => "performance_alert".to_string(),
            }
        }
    }
}

/// Bridge protocol metrics
pub mod metrics {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};
    
    pub struct BridgeMetricsCollector {
        /// Total transfers processed
        pub total_transfers: AtomicU64,
        /// Successful transfers
        pub successful_transfers: AtomicU64,
        /// Failed transfers
        pub failed_transfers: AtomicU64,
        /// Active transfers
        pub active_transfers: AtomicU64,
        /// Total volume transferred
        pub total_volume: AtomicU64,
        /// Average transfer time
        pub average_transfer_time: AtomicU64,
        /// Last update timestamp
        pub last_update: AtomicU64,
    }
    
    impl BridgeMetricsCollector {
        pub fn new() -> Self {
            Self {
                total_transfers: AtomicU64::new(0),
                successful_transfers: AtomicU64::new(0),
                failed_transfers: AtomicU64::new(0),
                active_transfers: AtomicU64::new(0),
                total_volume: AtomicU64::new(0),
                average_transfer_time: AtomicU64::new(0),
                last_update: AtomicU64::new(utils::current_timestamp()),
            }
        }
        
        pub fn increment_total_transfers(&self) {
            self.total_transfers.fetch_add(1, Ordering::Relaxed);
            self.last_update.store(utils::current_timestamp(), Ordering::Relaxed);
        }
        
        pub fn increment_successful_transfers(&self) {
            self.successful_transfers.fetch_add(1, Ordering::Relaxed);
            self.last_update.store(utils::current_timestamp(), Ordering::Relaxed);
        }
        
        pub fn increment_failed_transfers(&self) {
            self.failed_transfers.fetch_add(1, Ordering::Relaxed);
            self.last_update.store(utils::current_timestamp(), Ordering::Relaxed);
        }
        
        pub fn add_volume(&self, amount: u128) {
            self.total_volume.fetch_add(amount as u64, Ordering::Relaxed);
            self.last_update.store(utils::current_timestamp(), Ordering::Relaxed);
        }
        
        pub fn update_average_transfer_time(&self, time_ms: u64) {
            // Simple moving average
            let current = self.average_transfer_time.load(Ordering::Relaxed);
            let updated = (current + time_ms) / 2;
            self.average_transfer_time.store(updated, Ordering::Relaxed);
            self.last_update.store(utils::current_timestamp(), Ordering::Relaxed);
        }
        
        pub fn get_metrics(&self) -> ProtocolMetrics {
            ProtocolMetrics {
                total_transfers: self.total_transfers.load(Ordering::Relaxed),
                successful_transfers: self.successful_transfers.load(Ordering::Relaxed),
                failed_transfers: self.failed_transfers.load(Ordering::Relaxed),
                active_transfers: self.active_transfers.load(Ordering::Relaxed),
                total_volume: self.total_volume.load(Ordering::Relaxed),
                average_transfer_time: self.average_transfer_time.load(Ordering::Relaxed),
                success_rate: self.calculate_success_rate(),
                last_update: self.last_update.load(Ordering::Relaxed),
            }
        }
        
        fn calculate_success_rate(&self) -> f64 {
            let total = self.total_transfers.load(Ordering::Relaxed);
            if total == 0 {
                0.0
            } else {
                let successful = self.successful_transfers.load(Ordering::Relaxed);
                (successful as f64 / total as f64) * 100.0
            }
        }
    }
    
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct ProtocolMetrics {
        pub total_transfers: u64,
        pub successful_transfers: u64,
        pub failed_transfers: u64,
        pub active_transfers: u64,
        pub total_volume: u64,
        pub average_transfer_time: u64,
        pub success_rate: f64,
        pub last_update: u64,
    }
}

// Re-export for convenience
pub use utils::*;
pub use errors::*;
pub use events::*;
pub use metrics::*;