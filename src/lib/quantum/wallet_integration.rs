//! Quantum Key Exchange Wallet Integration
//! Integrates QKE with existing wallet and network layers
//! Provides seamless quantum-resistant key management for wallets

use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use crate::quantum::qke_module::{QkeEngine, QkeAlgorithm, QkePublicKey, QkePrivateKey, QkeSession, HybridKeyExchange, QkeError};
use crate::quantum::key_generation::{KeyGenerationEngine, KeyPolicy, KeyType, KeyMetadata, KeyGenerationError};
use crate::quantum::secure_protocol::{SecureKeyExchangeProtocol, ProtocolConfig, ProtocolSession, ProtocolError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletConfig {
    pub wallet_id: String,
    pub wallet_name: String,
    pub supported_algorithms: Vec<QkeAlgorithm>,
    pub preferred_algorithm: QkeAlgorithm,
    pub enable_hybrid_mode: bool,
    pub auto_key_rotation: bool,
    pub key_backup_enabled: bool,
    pub network_config: NetworkConfig,
    pub security_config: WalletSecurityConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub peer_discovery_enabled: bool,
    pub max_peers: usize,
    pub connection_timeout: Duration,
    pub message_timeout: Duration,
    pub enable_encryption: bool,
    pub enable_compression: bool,
    pub retry_policy: RetryPolicy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryPolicy {
    pub max_retries: u32,
    pub retry_delay: Duration,
    pub backoff_multiplier: f64,
    pub max_retry_delay: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletSecurityConfig {
    pub min_security_level: u32,
    pub require_key_confirmation: bool,
    pub enable_audit_logging: bool,
    pub enable_anomaly_detection: bool,
    pub session_timeout: Duration,
    pub key_derivation_iterations: u32,
    pub biometric_auth_required: bool,
    pub hardware_wallet_integration: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletInfo {
    pub wallet_id: String,
    pub wallet_name: String,
    pub created_at: u64,
    pub last_accessed: u64,
    pub key_count: u32,
    pub active_sessions: u32,
    pub total_exchanges: u64,
    pub security_level: u32,
    pub version: String,
    pub capabilities: WalletCapabilities,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletCapabilities {
    pub quantum_resistant: bool,
    pub hybrid_mode: bool,
    pub key_derivation: bool,
    pub multi_signature: bool,
    pub hardware_wallet: bool,
    pub biometric_auth: bool,
    pub backup_restore: bool,
    pub peer_to_peer: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletKey {
    pub key_id: String,
    pub key_type: KeyType,
    pub algorithm: QkeAlgorithm,
    pub created_at: u64,
    pub last_used: u64,
    pub usage_count: u64,
    pub security_level: u32,
    pub is_primary: bool,
    pub is_backup: bool,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub peer_id: String,
    pub peer_address: String,
    pub supported_algorithms: Vec<QkeAlgorithm>,
    pub last_seen: u64,
    pub connection_status: ConnectionStatus,
    pub trust_level: TrustLevel,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
    Authenticating,
    Authenticated,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TrustLevel {
    Unknown,
    Low,
    Medium,
    High,
    Trusted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeSession {
    pub session_id: String,
    pub peer_id: String,
    pub algorithm: QkeAlgorithm,
    pub security_level: u32,
    pub created_at: u64,
    pub expires_at: u64,
    pub status: SessionStatus,
    pub bytes_exchanged: u64,
    pub key_exchange_time_ms: u64,
    pub is_hybrid: bool,
    pub fallback_used: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SessionStatus {
    Initiated,
    InProgress,
    Completed,
    Failed,
    Expired,
    Terminated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletStats {
    pub total_keys: u32,
    pub active_keys: u32,
    pub expired_keys: u32,
    pub total_sessions: u64,
    pub successful_sessions: u64,
    pub failed_sessions: u64,
    pub average_exchange_time_ms: f64,
    pub total_bytes_exchanged: u64,
    pub last_activity: u64,
    pub security_events: u32,
}

#[derive(Debug, Error)]
pub enum WalletIntegrationError {
    #[error("Wallet not found: {0}")]
    WalletNotFound(String),
    #[error("Key not found: {0}")]
    KeyNotFound(String),
    #[error("Peer not found: {0}")]
    PeerNotFound(String),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    #[error("Network error: {0}")]
    NetworkError(String),
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    #[error("Security violation: {0}")]
    SecurityViolation(String),
    #[error("Operation failed: {0}")]
    OperationFailed(String),
}

/// Quantum-Resistant Wallet Integration
pub struct QuantumWallet {
    config: WalletConfig,
    qke_engine: QkeEngine,
    key_gen_engine: KeyGenerationEngine,
    protocol: SecureKeyExchangeProtocol,
    wallet_store: Arc<RwLock<HashMap<String, WalletInfo>>>,
    key_store: Arc<RwLock<HashMap<String, WalletKey>>>,
    peer_store: Arc<RwLock<HashMap<String, PeerInfo>>>,
    session_store: Arc<RwLock<HashMap<String, ExchangeSession>>>,
    stats: Arc<RwLock<WalletStats>>,
    network_manager: Arc<NetworkManager>,
    event_log: Arc<RwLock<Vec<WalletEvent>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletEvent {
    pub timestamp: u64,
    pub event_type: WalletEventType,
    pub wallet_id: String,
    pub details: HashMap<String, String>,
    pub severity: EventSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WalletEventType {
    KeyGenerated,
    KeyRotated,
    KeyExpired,
    KeyRevoked,
    SessionStarted,
    SessionCompleted,
    SessionFailed,
    PeerConnected,
    PeerDisconnected,
    SecurityEvent,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

struct NetworkManager {
    peers: HashMap<String, PeerConnection>,
    config: NetworkConfig,
}

struct PeerConnection {
    peer_id: String,
    address: String,
    status: ConnectionStatus,
    last_activity: u64,
    connection_time: u64,
}

impl QuantumWallet {
    pub fn new(config: WalletConfig) -> Result<Self, WalletIntegrationError> {
        let qke_engine = QkeEngine::new().map_err(|e| {
            WalletIntegrationError::ConfigurationError(format!("Failed to create QKE engine: {}", e))
        })?;

        let key_gen_engine = KeyGenerationEngine::new().map_err(|e| {
            WalletIntegrationError::ConfigurationError(format!("Failed to create key generation engine: {}", e))
        })?;

        let protocol_config = ProtocolConfig {
            version: crate::quantum::secure_protocol::ProtocolVersion::V2_0,
            supported_algorithms: config.supported_algorithms.clone(),
            preferred_algorithm: config.preferred_algorithm.clone(),
            enable_hybrid_mode: config.enable_hybrid_mode,
            enable_forward_secrecy: true,
            enable_key_confirmation: config.security_config.require_key_confirmation,
            session_timeout: config.security_config.session_timeout,
            max_retries: config.network_config.retry_policy.max_retries,
            enable_mitm_protection: true,
            enable_rate_limiting: true,
            security_parameters: crate::quantum::secure_protocol::SecurityParameters {
                min_key_size_bits: 256,
                min_security_level: config.security_config.min_security_level,
                max_session_duration: config.security_config.session_timeout,
                require_key_rotation: config.auto_key_rotation,
                enable_audit_logging: config.security_config.enable_audit_logging,
                enable_anomaly_detection: config.security_config.enable_anomaly_detection,
                allowed_key_types: HashSet::from([KeyType::KeyExchange, KeyType::Encryption]),
            },
        };

        let protocol = SecureKeyExchangeProtocol::new(protocol_config).map_err(|e| {
            WalletIntegrationError::ConfigurationError(format!("Failed to create protocol: {}", e))
        })?;

        let network_manager = Arc::new(NetworkManager {
            peers: HashMap::new(),
            config: config.network_config.clone(),
        });

        let wallet_info = WalletInfo {
            wallet_id: config.wallet_id.clone(),
            wallet_name: config.wallet_name.clone(),
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            last_accessed: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            key_count: 0,
            active_sessions: 0,
            total_exchanges: 0,
            security_level: config.security_config.min_security_level,
            version: "1.0.0".to_string(),
            capabilities: WalletCapabilities {
                quantum_resistant: true,
                hybrid_mode: config.enable_hybrid_mode,
                key_derivation: true,
                multi_signature: false, // Could be extended
                hardware_wallet: config.security_config.hardware_wallet_integration,
                biometric_auth: config.security_config.biometric_auth_required,
                backup_restore: config.key_backup_enabled,
                peer_to_peer: config.network_config.peer_discovery_enabled,
            },
        };

        Ok(Self {
            config,
            qke_engine,
            key_gen_engine,
            protocol,
            wallet_store: Arc::new(RwLock::new(HashMap::from([(
                config.wallet_id.clone(),
                wallet_info,
            )]))),
            key_store: Arc::new(RwLock::new(HashMap::new())),
            peer_store: Arc::new(RwLock::new(HashMap::new())),
            session_store: Arc::new(RwLock::new(HashMap::new())),
            stats: Arc::new(RwLock::new(WalletStats {
                total_keys: 0,
                active_keys: 0,
                expired_keys: 0,
                total_sessions: 0,
                successful_sessions: 0,
                failed_sessions: 0,
                average_exchange_time_ms: 0.0,
                total_bytes_exchanged: 0,
                last_activity: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                security_events: 0,
            })),
            network_manager,
            event_log: Arc::new(RwLock::new(Vec::new())),
        })
    }

    /// Generate a new key for the wallet
    pub fn generate_key(
        &self,
        key_type: KeyType,
        algorithm: Option<QkeAlgorithm>,
        is_primary: bool,
        metadata: Option<HashMap<String, String>>,
    ) -> Result<String, WalletIntegrationError> {
        let algorithm = algorithm.unwrap_or_else(|| self.config.preferred_algorithm.clone());
        
        if !self.config.supported_algorithms.contains(&algorithm) {
            return Err(WalletIntegrationError::ConfigurationError(
                format!("Algorithm {} not supported", algorithm)
            ));
        }

        let key_policy = KeyPolicy {
            algorithm: algorithm.clone(),
            key_type: key_type.clone(),
            security_level: self.config.security_config.min_security_level,
            key_size_bits: self.get_key_size_for_algorithm(&algorithm),
            expiration_duration: Duration::from_secs(86400 * 365), // 1 year
            rotation_policy: if self.config.auto_key_rotation {
                crate::quantum::key_generation::KeyRotationPolicy::TimeBased(Duration::from_secs(86400 * 30)) // 30 days
            } else {
                crate::quantum::key_generation::KeyRotationPolicy::Manual
            },
            usage_restrictions: HashSet::new(),
            metadata: metadata.unwrap_or_default(),
        };

        let (public_key, private_key) = self.key_gen_engine.generate_key(key_policy).map_err(|e| {
            WalletIntegrationError::OperationFailed(format!("Failed to generate key: {}", e))
        })?;

        let wallet_key = WalletKey {
            key_id: public_key.key_id.clone(),
            key_type,
            algorithm,
            created_at: public_key.created_at,
            last_used: public_key.created_at,
            usage_count: 0,
            security_level: self.config.security_config.min_security_level,
            is_primary,
            is_backup: false,
            metadata: public_key.metadata,
        };

        // Store key
        {
            let mut key_store = self.key_store.write().unwrap();
            key_store.insert(public_key.key_id.clone(), wallet_key);
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_keys += 1;
            stats.active_keys += 1;
            stats.last_activity = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }

        // Update wallet info
        {
            let mut wallet_store = self.wallet_store.write().unwrap();
            if let Some(wallet_info) = wallet_store.get_mut(&self.config.wallet_id) {
                wallet_info.key_count += 1;
                wallet_info.last_accessed = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
            }
        }

        // Log event
        self.log_event(WalletEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: WalletEventType::KeyGenerated,
            wallet_id: self.config.wallet_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("key_id".to_string(), public_key.key_id.clone());
                details.insert("algorithm".to_string(), algorithm.to_string());
                details.insert("key_type".to_string(), format!("{:?}", key_type));
                details.insert("is_primary".to_string(), is_primary.to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(public_key.key_id)
    }

    /// Initiate key exchange with a peer
    pub fn initiate_key_exchange(
        &self,
        peer_id: &str,
        key_id: Option<String>,
        metadata: Option<HashMap<String, String>>,
    ) -> Result<String, WalletIntegrationError> {
        // Get peer info
        let peer_info = self.get_peer_info(peer_id)?;

        // Get or use default key
        let key_id = key_id.unwrap_or_else(|| self.get_primary_key_id()?);
        let wallet_key = self.get_wallet_key(&key_id)?;

        // Initiate protocol exchange
        let protocol_message = self.protocol.initiate_key_exchange(
            &self.config.wallet_id,
            peer_id,
            metadata,
        ).map_err(|e| {
            WalletIntegrationError::OperationFailed(format!("Failed to initiate key exchange: {}", e))
        })?;

        let session_id = protocol_message.session_id.clone();
        let start_time = SystemTime::now();

        // Create exchange session
        let exchange_session = ExchangeSession {
            session_id: session_id.clone(),
            peer_id: peer_id.to_string(),
            algorithm: wallet_key.algorithm.clone(),
            security_level: wallet_key.security_level,
            created_at: start_time
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            expires_at: start_time
                .checked_add(self.config.security_config.session_timeout)
                .unwrap()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            status: SessionStatus::Initiated,
            bytes_exchanged: 0,
            key_exchange_time_ms: 0,
            is_hybrid: self.config.enable_hybrid_mode,
            fallback_used: false,
        };

        // Store session
        {
            let mut session_store = self.session_store.write().unwrap();
            session_store.insert(session_id.clone(), exchange_session);
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_sessions += 1;
            stats.last_activity = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }

        // Log event
        self.log_event(WalletEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: WalletEventType::SessionStarted,
            wallet_id: self.config.wallet_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("session_id".to_string(), session_id.clone());
                details.insert("peer_id".to_string(), peer_id.to_string());
                details.insert("key_id".to_string(), key_id);
                details.insert("algorithm".to_string(), wallet_key.algorithm.to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        // Send message to peer (simplified - in real implementation would use network layer)
        self.send_message_to_peer(peer_id, protocol_message)?;

        Ok(session_id)
    }

    /// Complete key exchange for a session
    pub fn complete_key_exchange(&self, session_id: &str) -> Result<(), WalletIntegrationError> {
        // Complete protocol exchange
        self.protocol.complete_key_exchange(session_id).map_err(|e| {
            WalletIntegrationError::OperationFailed(format!("Failed to complete key exchange: {}", e))
        })?;

        // Update session
        {
            let mut session_store = self.session_store.write().unwrap();
            if let Some(session) = session_store.get_mut(session_id) {
                session.status = SessionStatus::Completed;
                session.key_exchange_time_ms = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs().saturating_sub(session.created_at) * 1000;
            }
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.successful_sessions += 1;
            
            // Update average exchange time
            let session = self.session_store.read().unwrap().get(session_id).cloned()
                .ok_or_else(|| WalletIntegrationError::SessionNotFound(session_id.to_string()))?;
            
            if stats.successful_sessions > 1 {
                let total_time = stats.average_exchange_time_ms * (stats.successful_sessions - 1) as f64;
                stats.average_exchange_time_ms = (total_time + session.key_exchange_time_ms as f64) / stats.successful_sessions as f64;
            } else {
                stats.average_exchange_time_ms = session.key_exchange_time_ms as f64;
            }
            
            stats.last_activity = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }

        // Update wallet info
        {
            let mut wallet_store = self.wallet_store.write().unwrap();
            if let Some(wallet_info) = wallet_store.get_mut(&self.config.wallet_id) {
                wallet_info.total_exchanges += 1;
                wallet_info.active_sessions = wallet_info.active_sessions.saturating_sub(1);
                wallet_info.last_accessed = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
            }
        }

        // Log event
        self.log_event(WalletEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: WalletEventType::SessionCompleted,
            wallet_id: self.config.wallet_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("session_id".to_string(), session_id.to_string());
                details.insert("status".to_string(), "completed".to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(())
    }

    /// Add a peer to the wallet
    pub fn add_peer(&self, peer_id: &str, peer_address: &str, metadata: Option<HashMap<String, String>>) -> Result<(), WalletIntegrationError> {
        let peer_info = PeerInfo {
            peer_id: peer_id.to_string(),
            peer_address: peer_address.to_string(),
            supported_algorithms: self.config.supported_algorithms.clone(), // Default to wallet's supported algorithms
            last_seen: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            connection_status: ConnectionStatus::Disconnected,
            trust_level: TrustLevel::Unknown,
            metadata: metadata.unwrap_or_default(),
        };

        // Store peer
        {
            let mut peer_store = self.peer_store.write().unwrap();
            peer_store.insert(peer_id.to_string(), peer_info);
        }

        // Log event
        self.log_event(WalletEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: WalletEventType::PeerConnected,
            wallet_id: self.config.wallet_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("peer_id".to_string(), peer_id.to_string());
                details.insert("peer_address".to_string(), peer_address.to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(())
    }

    /// Connect to a peer
    pub fn connect_to_peer(&self, peer_id: &str) -> Result<(), WalletIntegrationError> {
        let peer_info = self.get_peer_info(peer_id)?;

        // Update peer status
        {
            let mut peer_store = self.peer_store.write().unwrap();
            if let Some(peer) = peer_store.get_mut(peer_id) {
                peer.connection_status = ConnectionStatus::Connecting;
                peer.last_seen = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
            }
        }

        // Simulate connection (in real implementation, this would establish network connection)
        let mut network_manager = self.network_manager.peers.lock().unwrap();
        network_manager.insert(peer_id.to_string(), PeerConnection {
            peer_id: peer_id.to_string(),
            address: peer_info.peer_address.clone(),
            status: ConnectionStatus::Connected,
            last_activity: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            connection_time: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        });

        // Update peer status
        {
            let mut peer_store = self.peer_store.write().unwrap();
            if let Some(peer) = peer_store.get_mut(peer_id) {
                peer.connection_status = ConnectionStatus::Connected;
                peer.last_seen = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
            }
        }

        Ok(())
    }

    /// Get wallet information
    pub fn get_wallet_info(&self) -> Result<WalletInfo, WalletIntegrationError> {
        let wallet_store = self.wallet_store.read().unwrap();
        wallet_store.get(&self.config.wallet_id)
            .cloned()
            .ok_or_else(|| WalletIntegrationError::WalletNotFound(self.config.wallet_id.clone()))
    }

    /// Get wallet keys
    pub fn get_wallet_keys(&self) -> Result<Vec<WalletKey>, WalletIntegrationError> {
        let key_store = self.key_store.read().unwrap();
        Ok(key_store.values().cloned().collect())
    }

    /// Get wallet peers
    pub fn get_wallet_peers(&self) -> Result<Vec<PeerInfo>, WalletIntegrationError> {
        let peer_store = self.peer_store.read().unwrap();
        Ok(peer_store.values().cloned().collect())
    }

    /// Get exchange sessions
    pub fn get_exchange_sessions(&self) -> Result<Vec<ExchangeSession>, WalletIntegrationError> {
        let session_store = self.session_store.read().unwrap();
        Ok(session_store.values().cloned().collect())
    }

    /// Get wallet statistics
    pub fn get_wallet_stats(&self) -> Result<WalletStats, WalletIntegrationError> {
        let stats = self.stats.read().unwrap();
        Ok(stats.clone())
    }

    /// Rotate keys automatically
    pub fn rotate_keys(&self) -> Result<u32, WalletIntegrationError> {
        if !self.config.auto_key_rotation {
            return Ok(0);
        }

        let mut rotated_count = 0;
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let key_store = self.key_store.read().unwrap();
        let keys_to_rotate: Vec<String> = key_store
            .values()
            .filter(|key| {
                // Check if key needs rotation based on age or usage
                let key_age = current_time.saturating_sub(key.created_at);
                key_age > 86400 * 30 || key.usage_count > 1000 // 30 days or 1000 uses
            })
            .map(|key| key.key_id.clone())
            .collect();

        drop(key_store);

        for key_id in keys_to_rotate {
            if let Err(e) = self.rotate_key(&key_id) {
                self.log_event(WalletEvent {
                    timestamp: current_time,
                    event_type: WalletEventType::Error,
                    wallet_id: self.config.wallet_id.clone(),
                    details: {
                        let mut details = HashMap::new();
                        details.insert("key_id".to_string(), key_id.clone());
                        details.insert("error".to_string(), format!("Key rotation failed: {}", e));
                        details
                    },
                    severity: EventSeverity::Error,
                });
            } else {
                rotated_count += 1;
            }
        }

        Ok(rotated_count)
    }

    /// Backup wallet keys
    pub fn backup_wallet(&self, backup_path: &str) -> Result<(), WalletIntegrationError> {
        if !self.config.key_backup_enabled {
            return Err(WalletIntegrationError::ConfigurationError(
                "Key backup is not enabled".to_string()
            ));
        }

        // In a real implementation, this would encrypt and save keys to backup location
        self.log_event(WalletEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: WalletEventType::SecurityEvent,
            wallet_id: self.config.wallet_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("backup_path".to_string(), backup_path.to_string());
                details.insert("action".to_string(), "backup".to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(())
    }

    /// Restore wallet from backup
    pub fn restore_wallet(&self, backup_path: &str) -> Result<(), WalletIntegrationError> {
        if !self.config.key_backup_enabled {
            return Err(WalletIntegrationError::ConfigurationError(
                "Key backup is not enabled".to_string()
            ));
        }

        // In a real implementation, this would load and decrypt keys from backup
        self.log_event(WalletEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: WalletEventType::SecurityEvent,
            wallet_id: self.config.wallet_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("backup_path".to_string(), backup_path.to_string());
                details.insert("action".to_string(), "restore".to_string());
                details
            },
            severity: EventSeverity::Warning,
        });

        Ok(())
    }

    /// Get event log
    pub fn get_event_log(&self) -> Result<Vec<WalletEvent>, WalletIntegrationError> {
        let event_log = self.event_log.read().unwrap();
        Ok(event_log.clone())
    }

    // Private helper methods
    fn get_key_size_for_algorithm(&self, algorithm: &QkeAlgorithm) -> usize {
        match algorithm {
            QkeAlgorithm::Kyber512 => 512,
            QkeAlgorithm::Kyber768 => 768,
            QkeAlgorithm::Kyber1024 => 1024,
            QkeAlgorithm::ClassicMcEliece => 2048,
            QkeAlgorithm::Ntru => 1024,
            QkeAlgorithm::Saber => 768,
        }
    }

    fn get_primary_key_id(&self) -> Result<String, WalletIntegrationError> {
        let key_store = self.key_store.read().unwrap();
        
        key_store.values()
            .find(|key| key.is_primary)
            .map(|key| key.key_id.clone())
            .ok_or_else(|| WalletIntegrationError::KeyNotFound("No primary key found".to_string()))
    }

    fn get_wallet_key(&self, key_id: &str) -> Result<WalletKey, WalletIntegrationError> {
        let key_store = self.key_store.read().unwrap();
        key_store.get(key_id)
            .cloned()
            .ok_or_else(|| WalletIntegrationError::KeyNotFound(key_id.to_string()))
    }

    fn get_peer_info(&self, peer_id: &str) -> Result<PeerInfo, WalletIntegrationError> {
        let peer_store = self.peer_store.read().unwrap();
        peer_store.get(peer_id)
            .cloned()
            .ok_or_else(|| WalletIntegrationError::PeerNotFound(peer_id.to_string()))
    }

    fn rotate_key(&self, key_id: &str) -> Result<(), WalletIntegrationError> {
        let wallet_key = self.get_wallet_key(key_id)?;
        
        // Generate new key with same parameters
        let new_key_id = self.generate_key(
            wallet_key.key_type.clone(),
            Some(wallet_key.algorithm.clone()),
            wallet_key.is_primary,
            Some(wallet_key.metadata.clone()),
        )?;

        // Mark old key as backup
        {
            let mut key_store = self.key_store.write().unwrap();
            if let Some(key) = key_store.get_mut(key_id) {
                key.is_backup = true;
            }
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.active_keys = stats.active_keys.saturating_sub(1);
        }

        // Log event
        self.log_event(WalletEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: WalletEventType::KeyRotated,
            wallet_id: self.config.wallet_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("old_key_id".to_string(), key_id.to_string());
                details.insert("new_key_id".to_string(), new_key_id);
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(())
    }

    fn send_message_to_peer(&self, peer_id: &str, message: crate::quantum::secure_protocol::ProtocolMessage) -> Result<(), WalletIntegrationError> {
        // In a real implementation, this would send the message over the network
        // For now, just simulate the message sending
        let message_size = serde_json::to_string(&message)
            .map_err(|e| WalletIntegrationError::NetworkError(format!("Failed to serialize message: {}", e)))?
            .len();

        // Update session bytes exchanged
        {
            let mut session_store = self.session_store.write().unwrap();
            if let Some(session) = session_store.get_mut(&message.session_id) {
                session.bytes_exchanged += message_size as u64;
            }
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_bytes_exchanged += message_size as u64;
        }

        Ok(())
    }

    fn log_event(&self, event: WalletEvent) {
        let mut event_log = self.event_log.write().unwrap();
        event_log.push(event);
        
        // Keep only last 1000 events
        if event_log.len() > 1000 {
            event_log.drain(0..event_log.len() - 1000);
        }

        // Update security events count
        if matches!(event.event_type, WalletEventType::SecurityEvent | WalletEventType::Error) {
            let mut stats = self.stats.write().unwrap();
            stats.security_events += 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_wallet_creation() {
        let config = WalletConfig {
            wallet_id: "test_wallet".to_string(),
            wallet_name: "Test Quantum Wallet".to_string(),
            supported_algorithms: vec![QkeAlgorithm::Kyber768],
            preferred_algorithm: QkeAlgorithm::Kyber768,
            enable_hybrid_mode: true,
            auto_key_rotation: true,
            key_backup_enabled: true,
            network_config: NetworkConfig {
                peer_discovery_enabled: true,
                max_peers: 10,
                connection_timeout: Duration::from_secs(30),
                message_timeout: Duration::from_secs(10),
                enable_encryption: true,
                enable_compression: false,
                retry_policy: RetryPolicy {
                    max_retries: 3,
                    retry_delay: Duration::from_secs(1),
                    backoff_multiplier: 2.0,
                    max_retry_delay: Duration::from_secs(10),
                },
            },
            security_config: WalletSecurityConfig {
                min_security_level: 192,
                require_key_confirmation: true,
                enable_audit_logging: true,
                enable_anomaly_detection: true,
                session_timeout: Duration::from_secs(3600),
                key_derivation_iterations: 10000,
                biometric_auth_required: false,
                hardware_wallet_integration: false,
            },
        };

        let wallet = QuantumWallet::new(config);
        assert!(wallet.is_ok());
    }

    #[test]
    fn test_key_generation() {
        let config = WalletConfig {
            wallet_id: "test_wallet".to_string(),
            wallet_name: "Test Quantum Wallet".to_string(),
            supported_algorithms: vec![QkeAlgorithm::Kyber768],
            preferred_algorithm: QkeAlgorithm::Kyber768,
            enable_hybrid_mode: true,
            auto_key_rotation: true,
            key_backup_enabled: true,
            network_config: NetworkConfig {
                peer_discovery_enabled: true,
                max_peers: 10,
                connection_timeout: Duration::from_secs(30),
                message_timeout: Duration::from_secs(10),
                enable_encryption: true,
                enable_compression: false,
                retry_policy: RetryPolicy {
                    max_retries: 3,
                    retry_delay: Duration::from_secs(1),
                    backoff_multiplier: 2.0,
                    max_retry_delay: Duration::from_secs(10),
                },
            },
            security_config: WalletSecurityConfig {
                min_security_level: 192,
                require_key_confirmation: true,
                enable_audit_logging: true,
                enable_anomaly_detection: true,
                session_timeout: Duration::from_secs(3600),
                key_derivation_iterations: 10000,
                biometric_auth_required: false,
                hardware_wallet_integration: false,
            },
        };

        let wallet = QuantumWallet::new(config).unwrap();
        let key_id = wallet.generate_key(KeyType::KeyExchange, None, true, None);
        assert!(key_id.is_ok());
        
        let keys = wallet.get_wallet_keys();
        assert!(keys.is_ok());
        assert!(!keys.unwrap().is_empty());
    }

    #[test]
    fn test_peer_management() {
        let config = WalletConfig {
            wallet_id: "test_wallet".to_string(),
            wallet_name: "Test Quantum Wallet".to_string(),
            supported_algorithms: vec![QkeAlgorithm::Kyber768],
            preferred_algorithm: QkeAlgorithm::Kyber768,
            enable_hybrid_mode: true,
            auto_key_rotation: true,
            key_backup_enabled: true,
            network_config: NetworkConfig {
                peer_discovery_enabled: true,
                max_peers: 10,
                connection_timeout: Duration::from_secs(30),
                message_timeout: Duration::from_secs(10),
                enable_encryption: true,
                enable_compression: false,
                retry_policy: RetryPolicy {
                    max_retries: 3,
                    retry_delay: Duration::from_secs(1),
                    backoff_multiplier: 2.0,
                    max_retry_delay: Duration::from_secs(10),
                },
            },
            security_config: WalletSecurityConfig {
                min_security_level: 192,
                require_key_confirmation: true,
                enable_audit_logging: true,
                enable_anomaly_detection: true,
                session_timeout: Duration::from_secs(3600),
                key_derivation_iterations: 10000,
                biometric_auth_required: false,
                hardware_wallet_integration: false,
            },
        };

        let wallet = QuantumWallet::new(config).unwrap();
        
        // Add peer
        let result = wallet.add_peer("peer1", "127.0.0.1:8080", None);
        assert!(result.is_ok());
        
        let peers = wallet.get_wallet_peers();
        assert!(peers.is_ok());
        assert_eq!(peers.unwrap().len(), 1);
        
        // Connect to peer
        let result = wallet.connect_to_peer("peer1");
        assert!(result.is_ok());
    }

    #[test]
    fn test_wallet_stats() {
        let config = WalletConfig {
            wallet_id: "test_wallet".to_string(),
            wallet_name: "Test Quantum Wallet".to_string(),
            supported_algorithms: vec![QkeAlgorithm::Kyber768],
            preferred_algorithm: QkeAlgorithm::Kyber768,
            enable_hybrid_mode: true,
            auto_key_rotation: true,
            key_backup_enabled: true,
            network_config: NetworkConfig {
                peer_discovery_enabled: true,
                max_peers: 10,
                connection_timeout: Duration::from_secs(30),
                message_timeout: Duration::from_secs(10),
                enable_encryption: true,
                enable_compression: false,
                retry_policy: RetryPolicy {
                    max_retries: 3,
                    retry_delay: Duration::from_secs(1),
                    backoff_multiplier: 2.0,
                    max_retry_delay: Duration::from_secs(10),
                },
            },
            security_config: WalletSecurityConfig {
                min_security_level: 192,
                require_key_confirmation: true,
                enable_audit_logging: true,
                enable_anomaly_detection: true,
                session_timeout: Duration::from_secs(3600),
                key_derivation_iterations: 10000,
                biometric_auth_required: false,
                hardware_wallet_integration: false,
            },
        };

        let wallet = QuantumWallet::new(config).unwrap();
        
        // Generate key
        let _key_id = wallet.generate_key(KeyType::KeyExchange, None, true, None).unwrap();
        
        // Get stats
        let stats = wallet.get_wallet_stats();
        assert!(stats.is_ok());
        
        let stats = stats.unwrap();
        assert_eq!(stats.total_keys, 1);
        assert_eq!(stats.active_keys, 1);
    }
}