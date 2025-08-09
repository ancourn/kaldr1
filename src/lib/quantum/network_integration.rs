//! Network Layer Integration for Quantum-Resistant Messaging
//! Integrates the quantum messaging system with the existing network layer and peer manager
//! Provides seamless quantum-resistant communication for KALDRIX network components

use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::sync::mpsc;
use crate::quantum::qke_module::{QkeEngine, QkeAlgorithm, QkePublicKey, QkePrivateKey};
use crate::quantum::pqc_signatures::{PqcSignatureEngine, SignatureAlgorithm, PqcPublicKey, PqcPrivateKey, PqcSignature};
use crate::quantum::quantum_messaging::{
    QuantumMessagingEngine, MessageConfig, MessageType, MessagePriority, DeliveryGuarantee,
    EncryptedMessage, DecryptedMessage, MessageSession, MessagingError,
};
use crate::quantum::encryption_layer::{
    QuantumEncryptionLayer, EncryptionConfig, EncryptionScheme, KeyBundle,
};
use crate::quantum::messaging_protocol::{
    SecureMessagingProtocol, ProtocolConfig, ProtocolSession, ProtocolMessage, ProtocolError,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkIntegrationConfig {
    pub enable_quantum_messaging: bool,
    pub fallback_to_classical: bool,
    pub auto_session_management: bool,
    pub peer_discovery_enabled: bool,
    pub message_routing_enabled: bool,
    pub network_monitoring_enabled: bool,
    pub max_peers: usize,
    pub max_sessions_per_peer: u32,
    pub session_timeout: Duration,
    pub message_timeout: Duration,
    pub retry_policy: RetryPolicy,
    pub network_parameters: NetworkParameters,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryPolicy {
    pub max_retries: u32,
    pub retry_delay: Duration,
    pub backoff_multiplier: f64,
    pub max_retry_delay: Duration,
    pub timeout_multiplier: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkParameters {
    pub max_message_size: usize,
    pub max_concurrent_connections: u32,
    pub connection_timeout: Duration,
    pub read_timeout: Duration,
    pub write_timeout: Duration,
    pub keep_alive_interval: Duration,
    pub enable_compression: bool,
    pub enable_encryption: bool,
    pub enable_authentication: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkPeer {
    pub peer_id: String,
    pub peer_address: String,
    pub peer_port: u16,
    pub public_key: Option<QkePublicKey>,
    pub signature_public_key: Option<PqcPublicKey>,
    pub connection_status: ConnectionStatus,
    pub last_seen: u64,
    pub session_id: Option<String>,
    pub capabilities: PeerCapabilities,
    pub trust_level: TrustLevel,
    pub network_info: NetworkInfo,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
    Authenticating,
    Authenticated,
    Secured,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerCapabilities {
    pub supports_quantum: bool,
    pub supports_classical: bool,
    pub supported_algorithms: Vec<QkeAlgorithm>,
    pub supported_signatures: Vec<SignatureAlgorithm>,
    pub max_message_size: usize,
    pub version: String,
    pub features: HashSet<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TrustLevel {
    Unknown,
    Untrusted,
    PartiallyTrusted,
    Trusted,
    FullyTrusted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub latency_ms: u32,
    pub bandwidth_kbps: u32,
    pub packet_loss_rate: f64,
    pub uptime_seconds: u64,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMessage {
    pub message_id: String,
    pub source_peer_id: String,
    pub destination_peer_id: String,
    pub message_type: NetworkMessageType,
    pub payload: Vec<u8>,
    pub timestamp: u64,
    pub priority: MessagePriority,
    pub requires_ack: bool,
    pub routing_info: RoutingInfo,
    pub security_info: SecurityInfo,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum NetworkMessageType {
    PeerDiscovery,
    PeerAnnouncement,
    SessionRequest,
    SessionResponse,
    Data,
    Heartbeat,
    Acknowledgment,
    Error,
    Control,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingInfo {
    pub hop_count: u32,
    pub max_hops: u32,
    pub route_path: Vec<String>,
    pub next_hop: Option<String>,
    pub ttl: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityInfo {
    pub encrypted: bool,
    pub signed: bool,
    pub authenticated: bool,
    pub integrity_protected: bool,
    pub security_level: u32,
    pub algorithm_used: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSession {
    pub session_id: String,
    pub peer_id: String,
    pub connection_id: String,
    pub protocol_session_id: String,
    pub created_at: u64,
    pub expires_at: u64,
    pub last_activity: u64,
    pub status: SessionStatus,
    pub security_level: u32,
    pub encryption_used: bool,
    pub quantum_enabled: bool,
    pub performance_metrics: SessionPerformanceMetrics,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SessionStatus {
    Initializing,
    Established,
    Active,
    Renewing,
    Closing,
    Closed,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionPerformanceMetrics {
    pub messages_sent: u64,
    pub messages_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub average_latency_ms: f64,
    pub encryption_time_avg_ms: f64,
    pub decryption_time_avg_ms: f64,
    pub error_count: u32,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub total_peers: u32,
    pub active_peers: u32,
    pub total_sessions: u64,
    pub active_sessions: u32,
    pub total_messages_sent: u64,
    pub total_messages_received: u64,
    pub total_bytes_sent: u64,
    pub total_bytes_received: u64,
    pub average_latency_ms: f64,
    pub message_loss_rate: f64,
    pub quantum_sessions: u32,
    pub classical_sessions: u32,
    pub security_violations: u32,
}

#[derive(Debug, Error)]
pub enum NetworkIntegrationError {
    #[error("Peer not found: {0}")]
    PeerNotFound(String),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    #[error("Message routing failed: {0}")]
    RoutingFailed(String),
    #[error("Network timeout: {0}")]
    Timeout(String),
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    #[error("Security violation: {0}")]
    SecurityViolation(String),
    #[error("Internal error: {0}")]
    InternalError(String),
}

/// Quantum-Resistant Network Integration Layer
pub struct QuantumNetworkIntegration {
    config: NetworkIntegrationConfig,
    messaging_engine: QuantumMessagingEngine,
    encryption_layer: QuantumEncryptionLayer,
    protocol_engine: SecureMessagingProtocol,
    peers: Arc<RwLock<HashMap<String, NetworkPeer>>>,
    sessions: Arc<RwLock<HashMap<String, NetworkSession>>>,
    message_queue: Arc<RwLock<VecDeque<NetworkMessage>>>,
    network_stats: Arc<RwLock<NetworkStats>>,
    event_log: Arc<RwLock<Vec<NetworkEvent>>>,
    command_channel: Option<mpsc::UnboundedSender<NetworkCommand>>,
    event_channel: Option<mpsc::UnboundedReceiver<NetworkEvent>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkCommand {
    ConnectPeer { peer_id: String, address: String, port: u16 },
    DisconnectPeer { peer_id: String },
    SendMessage { message: NetworkMessage },
    EstablishSession { peer_id: String },
    CloseSession { session_id: String },
    UpdatePeerInfo { peer_id: String, info: NetworkPeer },
    StartMonitoring,
    StopMonitoring,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkEvent {
    pub timestamp: u64,
    pub event_type: NetworkEventType,
    pub peer_id: Option<String>,
    pub session_id: Option<String>,
    pub message_id: Option<String>,
    pub details: HashMap<String, String>,
    pub severity: EventSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkEventType {
    PeerConnected,
    PeerDisconnected,
    SessionEstablished,
    SessionClosed,
    MessageSent,
    MessageReceived,
    MessageDelivered,
    MessageFailed,
    AuthenticationSuccess,
    AuthenticationFailure,
    SecurityViolation,
    NetworkError,
    QuantumSessionEstablished,
    ClassicalFallbackUsed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

impl QuantumNetworkIntegration {
    pub fn new(config: NetworkIntegrationConfig) -> Result<Self, NetworkIntegrationError> {
        // Create messaging engine configuration
        let messaging_config = MessageConfig {
            messaging_mode: if config.enable_quantum_messaging {
                crate::quantum::quantum_messaging::MessagingMode::Hybrid
            } else {
                crate::quantum::quantum_messaging::MessagingMode::ClassicalFallback
            },
            preferred_pqc_algorithm: QkeAlgorithm::Kyber768,
            preferred_signature_algorithm: SignatureAlgorithm::Dilithium2,
            classical_fallback_enabled: config.fallback_to_classical,
            message_lifetime: Duration::from_secs(3600),
            session_key_lifetime: config.session_timeout,
            max_message_size: config.network_parameters.max_message_size,
            enable_compression: config.network_parameters.enable_compression,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            max_replay_window: Duration::from_secs(300),
            security_parameters: crate::quantum::quantum_messaging::MessageSecurityParameters {
                min_security_level: 128,
                require_signature_verification: true,
                enable_origin_tracking: true,
                enable_message_integrity: true,
                enable_confidentiality: true,
                enable_audit_logging: true,
                enable_anomaly_detection: true,
                allowed_message_types: HashSet::from([
                    MessageType::Consensus,
                    MessageType::Transaction,
                    MessageType::Block,
                    MessageType::Heartbeat,
                    MessageType::PeerDiscovery,
                ]),
            },
        };

        let messaging_engine = QuantumMessagingEngine::new(messaging_config).map_err(|e| {
            NetworkIntegrationError::ConfigurationError(format!("Failed to create messaging engine: {}", e))
        })?;

        // Create encryption layer configuration
        let encryption_config = EncryptionConfig {
            primary_encryption: EncryptionScheme::Aes256Gcm,
            fallback_encryption: if config.fallback_to_classical {
                Some(EncryptionScheme::ChaCha20Poly1305)
            } else {
                None
            },
            key_derivation_method: crate::quantum::encryption_layer::KeyDerivationMethod::HkdfSha3256,
            nonce_generation_method: crate::quantum::encryption_layer::NonceGenerationMethod::Random,
            compression_enabled: config.network_parameters.enable_compression,
            integrity_check_enabled: true,
            forward_secrecy_enabled: true,
            key_rotation_policy: crate::quantum::encryption_layer::KeyRotationPolicy {
                rotation_interval: config.session_timeout,
                usage_threshold: 1000,
                time_based_rotation: true,
                usage_based_rotation: true,
                automatic_rotation: true,
            },
            security_parameters: crate::quantum::encryption_layer::EncryptionSecurityParameters {
                min_key_strength_bits: 256,
                require_forward_secrecy: true,
                require_key_separation: true,
                enable_key_zeroization: true,
                secure_memory_enabled: true,
                side_channel_protection: true,
                audit_encryption_operations: true,
            },
        };

        let encryption_layer = QuantumEncryptionLayer::new(encryption_config).map_err(|e| {
            NetworkIntegrationError::ConfigurationError(format!("Failed to create encryption layer: {}", e))
        })?;

        // Create protocol engine configuration
        let protocol_config = ProtocolConfig {
            protocol_version: crate::quantum::messaging_protocol::ProtocolVersion::V2_0_Quantum,
            supported_encryption_schemes: vec![EncryptionScheme::Aes256Gcm],
            supported_signature_algorithms: vec![SignatureAlgorithm::Dilithium2],
            max_message_size: config.network_parameters.max_message_size,
            session_timeout: config.session_timeout,
            key_renewal_interval: config.session_timeout / 2,
            max_replay_window: Duration::from_secs(300),
            max_hops: 10,
            enable_compression: config.network_parameters.enable_compression,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            enable_message_integrity: true,
            enable_origin_authentication: true,
            enable_anomaly_detection: true,
            security_parameters: crate::quantum::messaging_protocol::ProtocolSecurityParameters {
                min_security_level: 128,
                require_mutual_authentication: true,
                require_key_confirmation: true,
                enable_session_resumption: true,
                enable_anti_replay: true,
                enable_anti_flooding: true,
                max_sessions_per_peer: config.max_sessions_per_peer,
                max_messages_per_session: 10000,
                rate_limiting: crate::quantum::messaging_protocol::RateLimitingConfig {
                    enabled: true,
                    max_messages_per_second: 100,
                    max_bytes_per_second: 1024 * 1024,
                    burst_size: 10,
                    penalty_duration: Duration::from_secs(60),
                },
            },
        };

        let protocol_engine = SecureMessagingProtocol::new(protocol_config).map_err(|e| {
            NetworkIntegrationError::ConfigurationError(format!("Failed to create protocol engine: {}", e))
        })?;

        // Create command and event channels
        let (command_tx, command_rx) = mpsc::unbounded_channel();
        let (event_tx, event_rx) = mpsc::unbounded_channel();

        Ok(Self {
            config,
            messaging_engine,
            encryption_layer,
            protocol_engine,
            peers: Arc::new(RwLock::new(HashMap::new())),
            sessions: Arc::new(RwLock::new(HashMap::new())),
            message_queue: Arc::new(RwLock::new(VecDeque::new())),
            network_stats: Arc::new(RwLock::new(NetworkStats::default())),
            event_log: Arc::new(RwLock::new(Vec::new())),
            command_channel: Some(command_tx),
            event_channel: Some(event_rx),
        })
    }

    /// Add a new peer to the network
    pub fn add_peer(&self, peer_id: &str, address: &str, port: u16, metadata: Option<HashMap<String, String>>) -> Result<(), NetworkIntegrationError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let peer = NetworkPeer {
            peer_id: peer_id.to_string(),
            peer_address: address.to_string(),
            peer_port: port,
            public_key: None,
            signature_public_key: None,
            connection_status: ConnectionStatus::Disconnected,
            last_seen: current_time,
            session_id: None,
            capabilities: PeerCapabilities {
                supports_quantum: self.config.enable_quantum_messaging,
                supports_classical: self.config.fallback_to_classical,
                supported_algorithms: vec![QkeAlgorithm::Kyber768],
                supported_signatures: vec![SignatureAlgorithm::Dilithium2],
                max_message_size: self.config.network_parameters.max_message_size,
                version: "1.0.0".to_string(),
                features: HashSet::from([
                    "quantum_resistant".to_string(),
                    "hybrid_mode".to_string(),
                    "forward_secrecy".to_string(),
                ]),
            },
            trust_level: TrustLevel::Unknown,
            network_info: NetworkInfo {
                latency_ms: 0,
                bandwidth_kbps: 0,
                packet_loss_rate: 0.0,
                uptime_seconds: 0,
                last_error: None,
            },
            metadata: metadata.unwrap_or_default(),
        };

        // Store peer
        {
            let mut peers = self.peers.write().unwrap();
            peers.insert(peer_id.to_string(), peer);
        }

        // Update stats
        {
            let mut stats = self.network_stats.write().unwrap();
            stats.total_peers += 1;
        }

        // Log event
        self.log_event(NetworkEvent {
            timestamp: current_time,
            event_type: NetworkEventType::PeerConnected,
            peer_id: Some(peer_id.to_string()),
            session_id: None,
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("address".to_string(), address.to_string());
                details.insert("port".to_string(), port.to_string());
                details.insert("quantum_capable".to_string(), self.config.enable_quantum_messaging.to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(())
    }

    /// Connect to a peer
    pub fn connect_to_peer(&self, peer_id: &str) -> Result<String, NetworkIntegrationError> {
        let mut peers = self.peers.write().unwrap();
        let peer = peers.get_mut(peer_id).ok_or_else(|| {
            NetworkIntegrationError::PeerNotFound(peer_id.to_string())
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Update peer status
        peer.connection_status = ConnectionStatus::Connecting;
        peer.last_seen = current_time;

        // Simulate connection (in real implementation, this would establish actual network connection)
        let connection_id = format!("conn_{}_{}", peer_id, current_time);

        // Update peer status
        peer.connection_status = ConnectionStatus::Connected;

        // Log event
        self.log_event(NetworkEvent {
            timestamp: current_time,
            event_type: NetworkEventType::PeerConnected,
            peer_id: Some(peer_id.to_string()),
            session_id: None,
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("connection_id".to_string(), connection_id.clone());
                details.insert("status".to_string(), "connected".to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(connection_id)
    }

    /// Establish a secure session with a peer
    pub fn establish_session(&self, peer_id: &str) -> Result<String, NetworkIntegrationError> {
        let peers = self.peers.read().unwrap();
        let peer = peers.get(peer_id).ok_or_else(|| {
            NetworkIntegrationError::PeerNotFound(peer_id.to_string())
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check if peer supports quantum messaging
        if !peer.capabilities.supports_quantum && !self.config.fallback_to_classical {
            return Err(NetworkIntegrationError::ConfigurationError(
                "Peer does not support quantum messaging and fallback is disabled".to_string()
            ));
        }

        // Create network session
        let session_id = format!("net_session_{}_{}", peer_id, current_time);
        let connection_id = format!("conn_{}_{}", peer_id, current_time);

        // Establish protocol session
        let protocol_session_id = self.protocol_engine.initiate_session(peer_id).map_err(|e| {
            NetworkIntegrationError::ConnectionFailed(format!("Failed to initiate protocol session: {}", e))
        })?;

        // Perform handshake if peer public key is available
        if let Some(public_key) = &peer.public_key {
            self.protocol_engine.perform_handshake(&protocol_session_id, Some(public_key.clone())).map_err(|e| {
                NetworkIntegrationError::AuthenticationFailed(format!("Handshake failed: {}", e))
            })?;
        }

        // Create network session
        let network_session = NetworkSession {
            session_id: session_id.clone(),
            peer_id: peer_id.to_string(),
            connection_id,
            protocol_session_id,
            created_at: current_time,
            expires_at: current_time + self.config.session_timeout.as_secs(),
            last_activity: current_time,
            status: SessionStatus::Established,
            security_level: 128, // Default security level
            encryption_used: true,
            quantum_enabled: peer.capabilities.supports_quantum,
            performance_metrics: SessionPerformanceMetrics::default(),
        };

        // Store session
        {
            let mut sessions = self.sessions.write().unwrap();
            sessions.insert(session_id.clone(), network_session);
        }

        // Update peer session reference
        {
            let mut peers = self.peers.write().unwrap();
            if let Some(peer) = peers.get_mut(peer_id) {
                peer.session_id = Some(session_id.clone());
                peer.connection_status = ConnectionStatus::Secured;
            }
        }

        // Update stats
        {
            let mut stats = self.network_stats.write().unwrap();
            stats.total_sessions += 1;
            stats.active_sessions += 1;
            if peer.capabilities.supports_quantum {
                stats.quantum_sessions += 1;
            } else {
                stats.classical_sessions += 1;
            }
        }

        // Log event
        self.log_event(NetworkEvent {
            timestamp: current_time,
            event_type: if peer.capabilities.supports_quantum {
                NetworkEventType::QuantumSessionEstablished
            } else {
                NetworkEventType::SessionEstablished
            },
            peer_id: Some(peer_id.to_string()),
            session_id: Some(session_id.clone()),
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("security_level".to_string(), "128".to_string());
                details.insert("quantum_enabled".to_string(), peer.capabilities.supports_quantum.to_string());
                details.insert("session_timeout".to_string(), self.config.session_timeout.as_secs().to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(session_id)
    }

    /// Send a message to a peer
    pub fn send_message(
        &self,
        peer_id: &str,
        message_type: MessageType,
        payload: &[u8],
        priority: MessagePriority,
        requires_ack: bool,
    ) -> Result<String, NetworkIntegrationError> {
        let peers = self.peers.read().unwrap();
        let peer = peers.get(peer_id).ok_or_else(|| {
            NetworkIntegrationError::PeerNotFound(peer_id.to_string())
        })?;

        // Check if peer is connected
        if peer.connection_status != ConnectionStatus::Connected && peer.connection_status != ConnectionStatus::Secured {
            return Err(NetworkIntegrationError::ConnectionFailed(
                format!("Peer {} is not connected", peer_id)
            ));
        }

        // Get or create session
        let session_id = if let Some(session_id) = &peer.session_id {
            session_id.clone()
        } else {
            self.establish_session(peer_id)?
        };

        // Send message through messaging engine
        let message_id = self.messaging_engine.send_message(
            peer_id,
            message_type,
            payload,
            priority,
            if requires_ack {
                DeliveryGuarantee::AtLeastOnce
            } else {
                DeliveryGuarantee::AtMostOnce
            },
        ).map_err(|e| {
            NetworkIntegrationError::InternalError(format!("Failed to send message: {}", e))
        })?;

        // Create network message for tracking
        let network_message = NetworkMessage {
            message_id: message_id.clone(),
            source_peer_id: "self".to_string(), // Would be actual source ID
            destination_peer_id: peer_id.to_string(),
            message_type: NetworkMessageType::Data,
            payload: payload.to_vec(),
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            priority,
            requires_ack,
            routing_info: RoutingInfo {
                hop_count: 0,
                max_hops: self.config.network_parameters.max_hops as u32,
                route_path: vec!["self".to_string()],
                next_hop: Some(peer_id.to_string()),
                ttl: 64,
            },
            security_info: SecurityInfo {
                encrypted: true,
                signed: true,
                authenticated: true,
                integrity_protected: true,
                security_level: 128,
                algorithm_used: Some("Hybrid PQC + AES-GCM".to_string()),
            },
        };

        // Add to message queue
        {
            let mut message_queue = self.message_queue.write().unwrap();
            message_queue.push_back(network_message);
        }

        // Update session metrics
        {
            let mut sessions = self.sessions.write().unwrap();
            if let Some(session) = sessions.get_mut(&session_id) {
                session.performance_metrics.messages_sent += 1;
                session.performance_metrics.bytes_sent += payload.len() as u64;
                session.last_activity = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
            }
        }

        // Update network stats
        {
            let mut stats = self.network_stats.write().unwrap();
            stats.total_messages_sent += 1;
            stats.total_bytes_sent += payload.len() as u64;
        }

        // Log event
        self.log_event(NetworkEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: NetworkEventType::MessageSent,
            peer_id: Some(peer_id.to_string()),
            session_id: Some(session_id),
            message_id: Some(message_id.clone()),
            details: {
                let mut details = HashMap::new();
                details.insert("message_type".to_string(), format!("{:?}", message_type));
                details.insert("priority".to_string(), format!("{:?}", priority));
                details.insert("payload_size".to_string(), payload.len().to_string());
                details.insert("requires_ack".to_string(), requires_ack.to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(message_id)
    }

    /// Process incoming network message
    pub fn process_message(&self, network_message: NetworkMessage) -> Result<DecryptedMessage, NetworkIntegrationError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Validate message routing
        if network_message.routing_info.hop_count >= network_message.routing_info.max_hops {
            return Err(NetworkIntegrationError::RoutingFailed(
                "Maximum hop count exceeded".to_string()
            ));
        }

        // Check TTL
        if network_message.routing_info.ttl == 0 {
            return Err(NetworkIntegrationError::RoutingFailed(
                "Message TTL expired".to_string()
            ));
        }

        // Get peer session
        let peers = self.peers.read().unwrap();
        let peer = peers.get(&network_message.source_peer_id).ok_or_else(|| {
            NetworkIntegrationError::PeerNotFound(network_message.source_peer_id.clone())
        })?;

        let session_id = peer.session_id.as_ref().ok_or_else(|| {
            NetworkIntegrationError::SessionNotFound("No session established with peer".to_string())
        })?;

        // Convert network message to encrypted message (simplified)
        let encrypted_message = EncryptedMessage {
            message_id: network_message.message_id.clone(),
            message_type: match network_message.message_type {
                NetworkMessageType::Data => MessageType::Transaction,
                NetworkMessageType::Heartbeat => MessageType::Heartbeat,
                NetworkMessageType::PeerDiscovery => MessageType::PeerDiscovery,
                _ => MessageType::Custom(network_message.message_type.to_string()),
            },
            sender_id: network_message.source_peer_id.clone(),
            recipient_id: network_message.destination_peer_id.clone(),
            timestamp: network_message.timestamp,
            encrypted_payload: network_message.payload.clone(),
            signature: None, // Would be extracted from actual message
            encryption_metadata: crate::quantum::quantum_messaging::EncryptionMetadata {
                encryption_algorithm: "AES-256-GCM".to_string(),
                key_exchange_algorithm: QkeAlgorithm::Kyber768,
                signature_algorithm: Some(SignatureAlgorithm::Dilithium2),
                nonce: vec![0u8; 12], // Would get from actual message
                key_id: session_id.clone(),
                session_id: session_id.clone(),
                is_hybrid: true,
                fallback_used: false,
                compression_used: false,
            },
            routing_info: crate::quantum::quantum_messaging::RoutingInfo {
                hop_count: network_message.routing_info.hop_count,
                max_hops: network_message.routing_info.max_hops,
                route_path: network_message.routing_info.route_path.clone(),
                priority: network_message.priority.clone(),
                delivery_guarantee: if network_message.requires_ack {
                    DeliveryGuarantee::AtLeastOnce
                } else {
                    DeliveryGuarantee::AtMostOnce
                },
            },
            security_context: crate::quantum::quantum_messaging::SecurityContext {
                security_level: network_message.security_info.security_level,
                forward_secrecy_enabled: true,
                replay_protection_enabled: true,
                origin_verified: network_message.security_info.authenticated,
                integrity_checked: network_message.security_info.integrity_protected,
                confidentiality_enabled: network_message.security_info.encrypted,
                audit_trail_id: Some(format!("audit_{}", current_time)),
            },
        };

        // Process message through messaging engine
        let decrypted_message = self.messaging_engine.receive_message(encrypted_message).map_err(|e| {
            NetworkIntegrationError::InternalError(format!("Failed to process message: {}", e))
        })?;

        // Update session metrics
        {
            let mut sessions = self.sessions.write().unwrap();
            if let Some(session) = sessions.get_mut(session_id) {
                session.performance_metrics.messages_received += 1;
                session.performance_metrics.bytes_received += network_message.payload.len() as u64;
                session.last_activity = current_time;
            }
        }

        // Update network stats
        {
            let mut stats = self.network_stats.write().unwrap();
            stats.total_messages_received += 1;
            stats.total_bytes_received += network_message.payload.len() as u64;
        }

        // Send acknowledgment if required
        if network_message.requires_ack {
            self.send_acknowledgment(&network_message.source_peer_id, &network_message.message_id)?;
        }

        // Log event
        self.log_event(NetworkEvent {
            timestamp: current_time,
            event_type: NetworkEventType::MessageReceived,
            peer_id: Some(network_message.source_peer_id.clone()),
            session_id: Some(session_id.clone()),
            message_id: Some(network_message.message_id.clone()),
            details: {
                let mut details = HashMap::new();
                details.insert("message_type".to_string(), format!("{:?}", network_message.message_type));
                details.insert("decrypted_size".to_string(), decrypted_message.payload.len().to_string());
                details.insert("verified".to_string(), decrypted_message.is_verified.to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(decrypted_message)
    }

    /// Send acknowledgment for a message
    fn send_acknowledgment(&self, peer_id: &str, message_id: &str) -> Result<(), NetworkIntegrationError> {
        let ack_payload = format!("ACK:{}", message_id).into_bytes();
        
        self.send_message(
            peer_id,
            MessageType::Heartbeat,
            &ack_payload,
            MessagePriority::High,
            false,
        )?;

        Ok(())
    }

    /// Disconnect from a peer
    pub fn disconnect_peer(&self, peer_id: &str, reason: Option<String>) -> Result<(), NetworkIntegrationError> {
        let mut peers = self.peers.write().unwrap();
        let peer = peers.get_mut(peer_id).ok_or_else(|| {
            NetworkIntegrationError::PeerNotFound(peer_id.to_string())
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Close session if exists
        if let Some(session_id) = &peer.session_id {
            self.close_session(session_id)?;
        }

        // Update peer status
        peer.connection_status = ConnectionStatus::Disconnected;
        peer.session_id = None;
        peer.last_seen = current_time;

        // Update stats
        {
            let mut stats = self.network_stats.write().unwrap();
            stats.active_peers = stats.active_peers.saturating_sub(1);
        }

        // Log event
        self.log_event(NetworkEvent {
            timestamp: current_time,
            event_type: NetworkEventType::PeerDisconnected,
            peer_id: Some(peer_id.to_string()),
            session_id: None,
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("reason".to_string(), reason.unwrap_or_else(|| "normal".to_string()));
                details.insert("connection_duration".to_string(), (current_time - peer.last_seen).to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(())
    }

    /// Close a session
    pub fn close_session(&self, session_id: &str) -> Result<(), NetworkIntegrationError> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id).ok_or_else(|| {
            NetworkIntegrationError::SessionNotFound(session_id.to_string())
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Update session status
        session.status = SessionStatus::Closing;

        // Close protocol session
        if let Ok(protocol_session) = self.protocol_engine.get_session_info(&session.protocol_session_id) {
            // Terminate protocol session
            let _ = self.protocol_engine.terminate_session(
                &session.protocol_session_id,
                crate::quantum::messaging_protocol::TerminationReason::Normal,
                true,
            );
        }

        // Update peer session reference
        {
            let mut peers = self.peers.write().unwrap();
            if let Some(peer) = peers.get_mut(&session.peer_id) {
                peer.session_id = None;
                peer.connection_status = ConnectionStatus::Connected;
            }
        }

        // Mark session as closed
        session.status = SessionStatus::Closed;
        session.expires_at = current_time;

        // Update stats
        {
            let mut stats = self.network_stats.write().unwrap();
            stats.active_sessions = stats.active_sessions.saturating_sub(1);
        }

        // Log event
        self.log_event(NetworkEvent {
            timestamp: current_time,
            event_type: NetworkEventType::SessionClosed,
            peer_id: Some(session.peer_id.clone()),
            session_id: Some(session_id.to_string()),
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("session_duration".to_string(), (current_time - session.created_at).to_string());
                details.insert("messages_sent".to_string(), session.performance_metrics.messages_sent.to_string());
                details.insert("messages_received".to_string(), session.performance_metrics.messages_received.to_string());
                details
            },
            severity: EventSeverity::Info,
        });

        Ok(())
    }

    /// Get peer information
    pub fn get_peer_info(&self, peer_id: &str) -> Result<NetworkPeer, NetworkIntegrationError> {
        let peers = self.peers.read().unwrap();
        peers.get(peer_id)
            .cloned()
            .ok_or_else(|| NetworkIntegrationError::PeerNotFound(peer_id.to_string()))
    }

    /// Get session information
    pub fn get_session_info(&self, session_id: &str) -> Result<NetworkSession, NetworkIntegrationError> {
        let sessions = self.sessions.read().unwrap();
        sessions.get(session_id)
            .cloned()
            .ok_or_else(|| NetworkIntegrationError::SessionNotFound(session_id.to_string()))
    }

    /// List all peers
    pub fn list_peers(&self) -> Result<Vec<NetworkPeer>, NetworkIntegrationError> {
        let peers = self.peers.read().unwrap();
        Ok(peers.values().cloned().collect())
    }

    /// List active sessions
    pub fn list_active_sessions(&self) -> Result<Vec<NetworkSession>, NetworkIntegrationError> {
        let sessions = self.sessions.read().unwrap();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let active_sessions: Vec<NetworkSession> = sessions
            .values()
            .filter(|session| session.status == SessionStatus::Active && session.expires_at > current_time)
            .cloned()
            .collect();

        Ok(active_sessions)
    }

    /// Get network statistics
    pub fn get_network_stats(&self) -> Result<NetworkStats, NetworkIntegrationError> {
        let stats = self.network_stats.read().unwrap();
        Ok(stats.clone())
    }

    /// Get event log
    pub fn get_event_log(&self) -> Result<Vec<NetworkEvent>, NetworkIntegrationError> {
        let log = self.event_log.read().unwrap();
        Ok(log.clone())
    }

    /// Process message queue (simulate message processing)
    pub fn process_message_queue(&self) -> Result<u32, NetworkIntegrationError> {
        let mut processed_count = 0;
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Process messages from queue
        {
            let mut message_queue = self.message_queue.write().unwrap();
            let initial_size = message_queue.len();

            while let Some(message) = message_queue.pop_front() {
                // Simulate message processing
                if message.routing_info.ttl > 0 {
                    // Update TTL and hop count
                    let mut updated_message = message;
                    updated_message.routing_info.ttl -= 1;
                    updated_message.routing_info.hop_count += 1;

                    // In a real implementation, this would forward the message
                    // For now, just mark as processed
                    processed_count += 1;
                }
            }

            // Log processing
            if processed_count > 0 {
                self.log_event(NetworkEvent {
                    timestamp: current_time,
                    event_type: NetworkEventType::MessageDelivered,
                    peer_id: None,
                    session_id: None,
                    message_id: None,
                    details: {
                        let mut details = HashMap::new();
                        details.insert("processed_count".to_string(), processed_count.to_string());
                        details.insert("queue_size_before".to_string(), initial_size.to_string());
                        details.insert("queue_size_after".to_string(), message_queue.len().to_string());
                        details
                    },
                    severity: EventSeverity::Info,
                });
            }
        }

        Ok(processed_count)
    }

    /// Cleanup expired sessions and stale data
    pub fn cleanup(&self) -> Result<u32, NetworkIntegrationError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let mut cleaned_count = 0;

        // Clean expired sessions
        {
            let mut sessions = self.sessions.write().unwrap();
            let initial_count = sessions.len();
            
            sessions.retain(|_, session| {
                if session.expires_at <= current_time {
                    // Log session expiration
                    self.log_event(NetworkEvent {
                        timestamp: current_time,
                        event_type: NetworkEventType::SessionClosed,
                        peer_id: Some(session.peer_id.clone()),
                        session_id: Some(session.session_id.clone()),
                        message_id: None,
                        details: {
                            let mut details = HashMap::new();
                            details.insert("reason".to_string(), "expired".to_string());
                            details.insert("session_duration".to_string(), (current_time - session.created_at).to_string());
                            details
                        },
                        severity: EventSeverity::Info,
                    });
                    false
                } else {
                    true
                }
            });
            
            cleaned_count += initial_count - sessions.len();
        }

        // Clean disconnected peers without recent activity
        {
            let mut peers = self.peers.write().unwrap();
            let initial_count = peers.len();
            
            peers.retain(|_, peer| {
                let is_disconnected = peer.connection_status == ConnectionStatus::Disconnected;
                let is_stale = current_time.saturating_sub(peer.last_seen) > 3600; // 1 hour
                
                if is_disconnected && is_stale {
                    // Log peer removal
                    self.log_event(NetworkEvent {
                        timestamp: current_time,
                        event_type: NetworkEventType::PeerDisconnected,
                        peer_id: Some(peer.peer_id.clone()),
                        session_id: None,
                        message_id: None,
                        details: {
                            let mut details = HashMap::new();
                            details.insert("reason".to_string(), "stale_disconnected".to_string());
                            details.insert("last_seen".to_string(), peer.last_seen.to_string());
                            details
                        },
                        severity: EventSeverity::Info,
                    });
                    false
                } else {
                    true
                }
            });
            
            cleaned_count += initial_count - peers.len();
        }

        // Update active peer count
        {
            let peers = self.peers.read().unwrap();
            let active_peers = peers.values()
                .filter(|p| p.connection_status == ConnectionStatus::Connected || p.connection_status == ConnectionStatus::Secured)
                .count() as u32;
            
            let mut stats = self.network_stats.write().unwrap();
            stats.active_peers = active_peers;
        }

        Ok(cleaned_count)
    }

    // Private helper methods
    fn log_event(&self, event: NetworkEvent) {
        let mut log = self.event_log.write().unwrap();
        log.push(event);
        
        // Keep only last 1000 events
        if log.len() > 1000 {
            log.drain(0..log.len() - 1000);
        }

        // Update security metrics
        if matches!(event.event_type, NetworkEventType::SecurityViolation) {
            let mut stats = self.network_stats.write().unwrap();
            stats.security_violations += 1;
        }

        // Send event through channel if available
        if let Some(ref event_channel) = self.event_channel {
            let _ = event_channel.try_send(event.clone());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_network_integration_creation() {
        let config = NetworkIntegrationConfig {
            enable_quantum_messaging: true,
            fallback_to_classical: true,
            auto_session_management: true,
            peer_discovery_enabled: true,
            message_routing_enabled: true,
            network_monitoring_enabled: true,
            max_peers: 100,
            max_sessions_per_peer: 5,
            session_timeout: Duration::from_secs(3600),
            message_timeout: Duration::from_secs(30),
            retry_policy: RetryPolicy {
                max_retries: 3,
                retry_delay: Duration::from_secs(1),
                backoff_multiplier: 2.0,
                max_retry_delay: Duration::from_secs(10),
                timeout_multiplier: 1.5,
            },
            network_parameters: NetworkParameters {
                max_message_size: 1024 * 1024,
                max_concurrent_connections: 50,
                connection_timeout: Duration::from_secs(30),
                read_timeout: Duration::from_secs(10),
                write_timeout: Duration::from_secs(10),
                keep_alive_interval: Duration::from_secs(30),
                enable_compression: true,
                enable_encryption: true,
                enable_authentication: true,
            },
        };

        let integration = QuantumNetworkIntegration::new(config);
        assert!(integration.is_ok());
    }

    #[test]
    fn test_peer_management() {
        let config = NetworkIntegrationConfig {
            enable_quantum_messaging: true,
            fallback_to_classical: true,
            auto_session_management: true,
            peer_discovery_enabled: true,
            message_routing_enabled: true,
            network_monitoring_enabled: true,
            max_peers: 100,
            max_sessions_per_peer: 5,
            session_timeout: Duration::from_secs(3600),
            message_timeout: Duration::from_secs(30),
            retry_policy: RetryPolicy {
                max_retries: 3,
                retry_delay: Duration::from_secs(1),
                backoff_multiplier: 2.0,
                max_retry_delay: Duration::from_secs(10),
                timeout_multiplier: 1.5,
            },
            network_parameters: NetworkParameters {
                max_message_size: 1024 * 1024,
                max_concurrent_connections: 50,
                connection_timeout: Duration::from_secs(30),
                read_timeout: Duration::from_secs(10),
                write_timeout: Duration::from_secs(10),
                keep_alive_interval: Duration::from_secs(30),
                enable_compression: true,
                enable_encryption: true,
                enable_authentication: true,
            },
        };

        let integration = QuantumNetworkIntegration::new(config).unwrap();
        
        // Add peer
        let result = integration.add_peer("peer1", "127.0.0.1", 8080, None);
        assert!(result.is_ok());
        
        // Get peer info
        let peer_info = integration.get_peer_info("peer1");
        assert!(peer_info.is_ok());
        
        let peer = peer_info.unwrap();
        assert_eq!(peer.peer_id, "peer1");
        assert_eq!(peer.peer_address, "127.0.0.1");
        assert_eq!(peer.peer_port, 8080);
        assert_eq!(peer.connection_status, ConnectionStatus::Disconnected);
        
        // Connect to peer
        let connection_id = integration.connect_to_peer("peer1");
        assert!(connection_id.is_ok());
        
        // Check peer status after connection
        let peer_info = integration.get_peer_info("peer1").unwrap();
        assert_eq!(peer_info.connection_status, ConnectionStatus::Connected);
    }

    #[test]
    fn test_session_establishment() {
        let config = NetworkIntegrationConfig {
            enable_quantum_messaging: true,
            fallback_to_classical: true,
            auto_session_management: true,
            peer_discovery_enabled: true,
            message_routing_enabled: true,
            network_monitoring_enabled: true,
            max_peers: 100,
            max_sessions_per_peer: 5,
            session_timeout: Duration::from_secs(3600),
            message_timeout: Duration::from_secs(30),
            retry_policy: RetryPolicy {
                max_retries: 3,
                retry_delay: Duration::from_secs(1),
                backoff_multiplier: 2.0,
                max_retry_delay: Duration::from_secs(10),
                timeout_multiplier: 1.5,
            },
            network_parameters: NetworkParameters {
                max_message_size: 1024 * 1024,
                max_concurrent_connections: 50,
                connection_timeout: Duration::from_secs(30),
                read_timeout: Duration::from_secs(10),
                write_timeout: Duration::from_secs(10),
                keep_alive_interval: Duration::from_secs(30),
                enable_compression: true,
                enable_encryption: true,
                enable_authentication: true,
            },
        };

        let integration = QuantumNetworkIntegration::new(config).unwrap();
        
        // Add and connect peer
        integration.add_peer("peer1", "127.0.0.1", 8080, None).unwrap();
        integration.connect_to_peer("peer1").unwrap();
        
        // Establish session
        let session_id = integration.establish_session("peer1");
        assert!(session_id.is_ok());
        
        let session_id = session_id.unwrap();
        
        // Get session info
        let session_info = integration.get_session_info(&session_id);
        assert!(session_info.is_ok());
        
        let session = session_info.unwrap();
        assert_eq!(session.peer_id, "peer1");
        assert_eq!(session.status, SessionStatus::Established);
        assert!(session.quantum_enabled);
        assert!(session.encryption_used);
        
        // Check peer session reference
        let peer_info = integration.get_peer_info("peer1").unwrap();
        assert_eq!(peer_info.session_id, Some(session_id));
        assert_eq!(peer_info.connection_status, ConnectionStatus::Secured);
    }

    #[test]
    fn test_message_sending() {
        let config = NetworkIntegrationConfig {
            enable_quantum_messaging: true,
            fallback_to_classical: true,
            auto_session_management: true,
            peer_discovery_enabled: true,
            message_routing_enabled: true,
            network_monitoring_enabled: true,
            max_peers: 100,
            max_sessions_per_peer: 5,
            session_timeout: Duration::from_secs(3600),
            message_timeout: Duration::from_secs(30),
            retry_policy: RetryPolicy {
                max_retries: 3,
                retry_delay: Duration::from_secs(1),
                backoff_multiplier: 2.0,
                max_retry_delay: Duration::from_secs(10),
                timeout_multiplier: 1.5,
            },
            network_parameters: NetworkParameters {
                max_message_size: 1024 * 1024,
                max_concurrent_connections: 50,
                connection_timeout: Duration::from_secs(30),
                read_timeout: Duration::from_secs(10),
                write_timeout: Duration::from_secs(10),
                keep_alive_interval: Duration::from_secs(30),
                enable_compression: true,
                enable_encryption: true,
                enable_authentication: true,
            },
        };

        let integration = QuantumNetworkIntegration::new(config).unwrap();
        
        // Add, connect, and establish session with peer
        integration.add_peer("peer1", "127.0.0.1", 8080, None).unwrap();
        integration.connect_to_peer("peer1").unwrap();
        integration.establish_session("peer1").unwrap();
        
        // Send message
        let test_payload = b"Hello, quantum-secure network!";
        let message_id = integration.send_message(
            "peer1",
            MessageType::Heartbeat,
            test_payload,
            MessagePriority::Normal,
            true,
        );
        assert!(message_id.is_ok());
        
        let message_id = message_id.unwrap();
        assert!(!message_id.is_empty());
        
        // Check network stats
        let stats = integration.get_network_stats().unwrap();
        assert_eq!(stats.total_messages_sent, 1);
        assert!(stats.total_bytes_sent > 0);
        assert_eq!(stats.quantum_sessions, 1);
    }

    #[test]
    fn test_network_stats() {
        let config = NetworkIntegrationConfig {
            enable_quantum_messaging: true,
            fallback_to_classical: true,
            auto_session_management: true,
            peer_discovery_enabled: true,
            message_routing_enabled: true,
            network_monitoring_enabled: true,
            max_peers: 100,
            max_sessions_per_peer: 5,
            session_timeout: Duration::from_secs(3600),
            message_timeout: Duration::from_secs(30),
            retry_policy: RetryPolicy {
                max_retries: 3,
                retry_delay: Duration::from_secs(1),
                backoff_multiplier: 2.0,
                max_retry_delay: Duration::from_secs(10),
                timeout_multiplier: 1.5,
            },
            network_parameters: NetworkParameters {
                max_message_size: 1024 * 1024,
                max_concurrent_connections: 50,
                connection_timeout: Duration::from_secs(30),
                read_timeout: Duration::from_secs(10),
                write_timeout: Duration::from_secs(10),
                keep_alive_interval: Duration::from_secs(30),
                enable_compression: true,
                enable_encryption: true,
                enable_authentication: true,
            },
        };

        let integration = QuantumNetworkIntegration::new(config).unwrap();
        
        // Add some peers
        integration.add_peer("peer1", "127.0.0.1", 8080, None).unwrap();
        integration.add_peer("peer2", "127.0.0.1", 8081, None).unwrap();
        integration.add_peer("peer3", "127.0.0.1", 8082, None).unwrap();
        
        // Connect to peers
        integration.connect_to_peer("peer1").unwrap();
        integration.connect_to_peer("peer2").unwrap();
        
        // Check initial stats
        let stats = integration.get_network_stats().unwrap();
        assert_eq!(stats.total_peers, 3);
        assert_eq!(stats.active_peers, 2);
        assert_eq!(stats.total_sessions, 0);
        assert_eq!(stats.active_sessions, 0);
        
        // Establish sessions
        integration.establish_session("peer1").unwrap();
        integration.establish_session("peer2").unwrap();
        
        // Send some messages
        integration.send_message("peer1", MessageType::Heartbeat, b"test1", MessagePriority::Normal, false).unwrap();
        integration.send_message("peer2", MessageType::Heartbeat, b"test2", MessagePriority::Normal, false).unwrap();
        
        // Check updated stats
        let stats = integration.get_network_stats().unwrap();
        assert_eq!(stats.total_peers, 3);
        assert_eq!(stats.active_peers, 2);
        assert_eq!(stats.total_sessions, 2);
        assert_eq!(stats.active_sessions, 2);
        assert_eq!(stats.total_messages_sent, 2);
        assert_eq!(stats.quantum_sessions, 2);
        assert!(stats.total_bytes_sent > 0);
    }
}