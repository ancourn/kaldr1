//! Bridge Protocol Types
//! 
//! This module contains the core types and structures used throughout the bridge protocol.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Transfer ID type
pub type TransferId = Uuid;
/// Chain ID type
pub type ChainId = u32;
/// Message ID type
pub type MessageId = Uuid;
/// Asset ID type
pub type AssetId = String;

/// Environment type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Environment {
    Development,
    Staging,
    Production,
}

/// Security Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    /// Enable post-quantum cryptography
    pub enable_post_quantum: bool,
    /// Multi-signature threshold
    pub multi_signature_threshold: u32,
    /// Rate limiting requests per second
    pub rate_limit_requests_per_second: u32,
    /// Enable anomaly detection
    pub enable_anomaly_detection: bool,
}

/// Performance Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    /// Maximum concurrent transfers
    pub max_concurrent_transfers: u32,
    /// Target latency in milliseconds
    pub target_latency_ms: u32,
    /// Retry attempts
    pub retry_attempts: u32,
    /// Enable performance monitoring
    pub enable_performance_monitoring: bool,
}

/// Network Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Listen port
    pub listen_port: u16,
    /// Maximum connections
    pub max_connections: u32,
    /// Timeout in seconds
    pub timeout_seconds: u32,
    /// Enable TLS
    pub enable_tls: bool,
}

/// Bridge Status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BridgeStatus {
    Initializing,
    Running,
    Paused,
    Stopping,
    Error(String),
}

/// Transfer Status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransferStatus {
    Initiated,
    Processing,
    Routed,
    Completed,
    Failed(String),
}

/// Message Type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    Transfer,
    StateSync,
    Heartbeat,
    Error,
}

/// Message Payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessagePayload {
    Transfer(TransferPayload),
    StateSync(StateSyncPayload),
    Heartbeat(HeartbeatPayload),
    Error(ErrorPayload),
}

/// Transfer Payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferPayload {
    /// Transfer ID
    pub transfer_id: TransferId,
    /// Asset ID
    pub asset_id: AssetId,
    /// Transfer amount
    pub amount: u128,
    /// Sender address
    pub sender: String,
    /// Recipient address
    pub recipient: String,
}

/// State Sync Payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateSyncPayload {
    /// Sync ID
    pub sync_id: Uuid,
    /// State data
    pub state_data: Vec<u8>,
    /// Timestamp
    pub timestamp: u64,
}

/// Heartbeat Payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatPayload {
    /// Node ID
    pub node_id: String,
    /// Status
    pub status: String,
    /// Timestamp
    pub timestamp: u64,
}

/// Error Payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorPayload {
    /// Error code
    pub error_code: String,
    /// Error message
    pub error_message: String,
    /// Timestamp
    pub timestamp: u64,
}

/// Cross-Chain Message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossChainMessage {
    /// Message ID
    pub id: MessageId,
    /// Source chain ID
    pub source_chain: ChainId,
    /// Target chain ID
    pub target_chain: ChainId,
    /// Message type
    pub message_type: MessageType,
    /// Message payload
    pub payload: MessagePayload,
    /// Timestamp
    pub timestamp: u64,
    /// Message signature
    pub signature: Vec<u8>,
}

/// Transfer Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferRequest {
    /// Source chain ID
    pub source_chain: ChainId,
    /// Target chain ID
    pub target_chain: ChainId,
    /// Asset ID
    pub asset_id: AssetId,
    /// Transfer amount
    pub amount: u128,
    /// Sender address
    pub sender: String,
    /// Recipient address
    pub recipient: String,
}

/// Transfer State
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferState {
    /// Transfer ID
    pub id: TransferId,
    /// Source chain ID
    pub source_chain: ChainId,
    /// Target chain ID
    pub target_chain: ChainId,
    /// Asset ID
    pub asset_id: AssetId,
    /// Transfer amount
    pub amount: u128,
    /// Sender address
    pub sender: String,
    /// Recipient address
    pub recipient: String,
    /// Transfer status
    pub status: TransferStatus,
    /// Created timestamp
    pub created_at: u64,
    /// Updated timestamp
    pub updated_at: u64,
}

/// Bridge Metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeMetrics {
    /// Total transfers processed
    pub total_transfers: u64,
    /// Active transfers
    pub active_transfers: u64,
    /// Bridge status
    pub status: BridgeStatus,
    /// Uptime in seconds
    pub uptime: u64,
}

/// Connector Status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConnectorStatus {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

/// Bridge Error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BridgeError {
    UnsupportedChain(ChainId),
    InvalidAmount,
    InvalidAddress,
    TransferNotFound(TransferId),
    SecurityValidationFailed(String),
    NetworkError(String),
    InternalError(String),
}

impl std::fmt::Display for BridgeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BridgeError::UnsupportedChain(chain_id) => write!(f, "Unsupported chain: {}", chain_id),
            BridgeError::InvalidAmount => write!(f, "Invalid transfer amount"),
            BridgeError::InvalidAddress => write!(f, "Invalid address"),
            BridgeError::TransferNotFound(transfer_id) => write!(f, "Transfer not found: {}", transfer_id),
            BridgeError::SecurityValidationFailed(msg) => write!(f, "Security validation failed: {}", msg),
            BridgeError::NetworkError(msg) => write!(f, "Network error: {}", msg),
            BridgeError::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for BridgeError {}

/// Connector Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectorConfig {
    /// Chain ID
    pub chain_id: ChainId,
    /// Chain name
    pub chain_name: String,
    /// RPC endpoint
    pub rpc_endpoint: String,
    /// WebSocket endpoint (optional)
    pub ws_endpoint: Option<String>,
    /// Chain-specific configuration
    pub chain_config: serde_json::Value,
    /// Security configuration
    pub security: ConnectorSecurityConfig,
}

/// Connector Security Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectorSecurityConfig {
    /// Enable private key encryption
    pub enable_private_key_encryption: bool,
    /// Enable transaction signing
    pub enable_transaction_signing: bool,
    /// Enable message verification
    pub enable_message_verification: bool,
    /// Rate limiting configuration
    pub rate_limit: Option<RateLimitConfig>,
}

/// Rate Limit Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    /// Maximum requests per second
    pub max_requests_per_second: u32,
    /// Burst size
    pub burst_size: u32,
    /// Time window in seconds
    pub time_window_seconds: u32,
}

/// Message Routing Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingConfig {
    /// Enable message routing
    pub enable_routing: bool,
    /// Routing strategy
    pub routing_strategy: RoutingStrategy,
    /// Maximum message size in bytes
    pub max_message_size: u32,
    /// Message timeout in seconds
    pub message_timeout_seconds: u32,
}

/// Routing Strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RoutingStrategy {
    /// Direct routing
    Direct,
    /// Round-robin routing
    RoundRobin,
    /// Least connections routing
    LeastConnections,
    /// Weighted routing
    Weighted(Vec<(ChainId, u32)>),
}

/// State Sync Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateSyncConfig {
    /// Enable state synchronization
    pub enable_sync: bool,
    /// Sync interval in seconds
    pub sync_interval_seconds: u32,
    /// Sync strategy
    pub sync_strategy: SyncStrategy,
    /// Maximum state size in bytes
    pub max_state_size: u32,
}

/// Sync Strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncStrategy {
    /// Full sync
    Full,
    /// Incremental sync
    Incremental,
    /// Event-based sync
    EventBased,
    /// Hybrid sync
    Hybrid,
}

/// Security Validation Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityValidationConfig {
    /// Enable security validation
    pub enable_validation: bool,
    /// Validation level
    pub validation_level: ValidationLevel,
    /// Maximum validation time in milliseconds
    pub max_validation_time_ms: u32,
    /// Enable post-quantum validation
    pub enable_post_quantum_validation: bool,
}

/// Validation Level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationLevel {
    /// Basic validation
    Basic,
    /// Standard validation
    Standard,
    /// Strict validation
    Strict,
    /// Custom validation
    Custom(String),
}

/// Performance Monitoring Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMonitoringConfig {
    /// Enable performance monitoring
    pub enable_monitoring: bool,
    /// Metrics collection interval in seconds
    pub metrics_interval_seconds: u32,
    /// Enable alerting
    pub enable_alerting: bool,
    /// Alert thresholds
    pub alert_thresholds: AlertThresholds,
}

/// Alert Thresholds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertThresholds {
    /// High latency threshold in milliseconds
    pub high_latency_threshold_ms: u32,
    /// Low throughput threshold
    pub low_throughput_threshold: u32,
    /// High error rate threshold (percentage)
    pub high_error_rate_threshold: f64,
    /// Low success rate threshold (percentage)
    pub low_success_rate_threshold: f64,
}

/// Bridge Protocol Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeProtocolConfig {
    /// Bridge name
    pub name: String,
    /// Bridge version
    pub version: String,
    /// Environment
    pub environment: Environment,
    /// Security configuration
    pub security: SecurityConfig,
    /// Performance configuration
    pub performance: PerformanceConfig,
    /// Network configuration
    pub network: NetworkConfig,
    /// Connector configurations
    pub connectors: Vec<ConnectorConfig>,
    /// Routing configuration
    pub routing: RoutingConfig,
    /// State sync configuration
    pub state_sync: StateSyncConfig,
    /// Security validation configuration
    pub security_validation: SecurityValidationConfig,
    /// Performance monitoring configuration
    pub performance_monitoring: PerformanceMonitoringConfig,
}

impl Default for BridgeProtocolConfig {
    fn default() -> Self {
        Self {
            name: "kaldr1-bridge".to_string(),
            version: "1.0.0".to_string(),
            environment: Environment::Development,
            security: SecurityConfig {
                enable_post_quantum: true,
                multi_signature_threshold: 3,
                rate_limit_requests_per_second: 1000,
                enable_anomaly_detection: true,
            },
            performance: PerformanceConfig {
                max_concurrent_transfers: 1000,
                target_latency_ms: 500,
                retry_attempts: 3,
                enable_performance_monitoring: true,
            },
            network: NetworkConfig {
                listen_port: 8080,
                max_connections: 10000,
                timeout_seconds: 30,
                enable_tls: true,
            },
            connectors: Vec::new(),
            routing: RoutingConfig {
                enable_routing: true,
                routing_strategy: RoutingStrategy::Direct,
                max_message_size: 1024 * 1024, // 1MB
                message_timeout_seconds: 300, // 5 minutes
            },
            state_sync: StateSyncConfig {
                enable_sync: true,
                sync_interval_seconds: 60,
                sync_strategy: SyncStrategy::Incremental,
                max_state_size: 10 * 1024 * 1024, // 10MB
            },
            security_validation: SecurityValidationConfig {
                enable_validation: true,
                validation_level: ValidationLevel::Standard,
                max_validation_time_ms: 5000,
                enable_post_quantum_validation: true,
            },
            performance_monitoring: PerformanceMonitoringConfig {
                enable_monitoring: true,
                metrics_interval_seconds: 30,
                enable_alerting: true,
                alert_thresholds: AlertThresholds {
                    high_latency_threshold_ms: 1000,
                    low_throughput_threshold: 100,
                    high_error_rate_threshold: 5.0,
                    low_success_rate_threshold: 95.0,
                },
            },
        }
    }
}