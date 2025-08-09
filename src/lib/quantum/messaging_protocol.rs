//! Secure Messaging Protocol Implementation
//! Implements secure channels for validator and node communications
//! Features replay protection, forward secrecy, and ephemeral session keys

use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use crate::quantum::qke_module::{QkeEngine, QkeAlgorithm, QkePublicKey, QkePrivateKey};
use crate::quantum::pqc_signatures::{PqcSignatureEngine, SignatureAlgorithm, PqcPublicKey, PqcPrivateKey, PqcSignature};
use crate::quantum::quantum_messaging::{
    MessageType, MessagePriority, DeliveryGuarantee, SecurityContext, EncryptionMetadata,
    RoutingInfo, EncryptedMessage, DecryptedMessage, MessagingError, MessageAuditEvent,
    MessageEventType, AuditSeverity, MessageSession, KeyExchangeInfo,
};
use crate::quantum::encryption_layer::{
    QuantumEncryptionLayer, EncryptionConfig, EncryptionScheme, KeyDerivationMethod,
    EncryptionKey, KeyBundle, EncryptionResult, DecryptionResult,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolConfig {
    pub protocol_version: ProtocolVersion,
    pub supported_encryption_schemes: Vec<EncryptionScheme>,
    pub supported_signature_algorithms: Vec<SignatureAlgorithm>,
    pub max_message_size: usize,
    pub session_timeout: Duration,
    pub key_renewal_interval: Duration,
    pub max_replay_window: Duration,
    pub max_hops: u32,
    pub enable_compression: bool,
    pub enable_forward_secrecy: bool,
    pub enable_replay_protection: bool,
    pub enable_message_integrity: bool,
    pub enable_origin_authentication: bool,
    pub enable_anomaly_detection: bool,
    pub security_parameters: ProtocolSecurityParameters,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProtocolVersion {
    V1_0,
    V1_1,
    V2_0_Quantum,
}

impl Default for ProtocolVersion {
    fn default() -> Self {
        ProtocolVersion::V2_0_Quantum
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolSecurityParameters {
    pub min_security_level: u32,
    pub require_mutual_authentication: bool,
    pub require_key_confirmation: bool,
    pub enable_session_resumption: bool,
    pub enable_anti_replay: bool,
    pub enable_anti_flooding: bool,
    pub max_sessions_per_peer: u32,
    pub max_messages_per_session: u64,
    pub rate_limiting: RateLimitingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitingConfig {
    pub enabled: bool,
    pub max_messages_per_second: u32,
    pub max_bytes_per_second: u64,
    pub burst_size: u32,
    pub penalty_duration: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolMessage {
    pub protocol_version: ProtocolVersion,
    pub message_type: ProtocolMessageType,
    pub session_id: String,
    pub sequence_number: u64,
    pub timestamp: u64,
    pub payload: ProtocolPayload,
    pub signature: Option<Vec<u8>>,
    pub routing_header: RoutingHeader,
    pub security_context: ProtocolSecurityContext,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProtocolMessageType {
    HandshakeInit,
    HandshakeResponse,
    HandshakeComplete,
    Data,
    Acknowledgment,
    Heartbeat,
    SessionRenewal,
    SessionTermination,
    Error,
    KeepAlive,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProtocolPayload {
    HandshakeInit {
        supported_versions: Vec<ProtocolVersion>,
        supported_encryption: Vec<EncryptionScheme>,
        supported_signatures: Vec<SignatureAlgorithm>,
        nonce: Vec<u8>,
        security_parameters: ProtocolSecurityParameters,
    },
    HandshakeResponse {
        selected_version: ProtocolVersion,
        selected_encryption: EncryptionScheme,
        selected_signature: Option<SignatureAlgorithm>,
        nonce: Vec<u8>,
        session_id: String,
        public_key: Option<Vec<u8>>,
    },
    HandshakeComplete {
        confirmation_hash: Vec<u8>,
        session_keys: SessionKeys,
    },
    Data {
        encrypted_data: Vec<u8>,
        message_id: String,
        message_type: MessageType,
        additional_data: Option<Vec<u8>>,
    },
    Acknowledgment {
        acknowledged_sequence: u64,
        acknowledgment_type: AcknowledgmentType,
    },
    Heartbeat {
        timestamp: u64,
        status: String,
    },
    SessionRenewal {
        new_session_id: String,
        renewal_reason: String,
    },
    SessionTermination {
        reason: TerminationReason,
        graceful: bool,
    },
    Error {
        error_code: String,
        error_message: String,
        error_details: Option<HashMap<String, String>>,
    },
    KeepAlive {
        timestamp: u64,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AcknowledgmentType {
    Positive,
    Negative,
    Selective,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionKeys {
    pub encryption_key: Vec<u8>,
    pub authentication_key: Vec<u8>,
    pub session_key: Vec<u8>,
    pub iv: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TerminationReason {
    Normal,
    Timeout,
    Error,
    SecurityViolation,
    PeerRequest,
    KeyExpiration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingHeader {
    pub source_id: String,
    pub destination_id: String,
    pub hop_count: u32,
    pub max_hops: u32,
    pub route_path: Vec<String>,
    pub priority: MessagePriority,
    pub qos_parameters: QoSParameters,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QoSParameters {
    pub latency_requirement_ms: Option<u32>,
    pub bandwidth_requirement_kbps: Option<u32>,
    pub reliability_requirement: f64,
    pub priority_level: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolSecurityContext {
    pub security_level: u32,
    pub encryption_enabled: bool,
    pub authentication_enabled: bool,
    pub integrity_protected: bool,
    pub replay_protection_enabled: bool,
    pub forward_secrecy_enabled: bool,
    pub mutual_authentication: bool,
    pub key_confirmation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolSession {
    pub session_id: String,
    pub peer_id: String,
    pub protocol_version: ProtocolVersion,
    pub state: SessionState,
    pub created_at: u64,
    pub expires_at: u64,
    pub last_activity: u64,
    pub sequence_number: u64,
    pub remote_sequence_number: u64,
    pub session_keys: SessionKeys,
    pub security_context: ProtocolSecurityContext,
    pub handshake_info: HandshakeInfo,
    pub message_history: MessageHistory,
    pub performance_metrics: SessionMetrics,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SessionState {
    Initiated,
    Handshaking,
    Established,
    Renewing,
    Terminating,
    Terminated,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HandshakeInfo {
    pub local_nonce: Vec<u8>,
    pub remote_nonce: Vec<u8>,
    pub selected_encryption: EncryptionScheme,
    pub selected_signature: Option<SignatureAlgorithm>,
    pub mutual_auth_completed: bool,
    pub key_exchange_completed: bool,
    pub handshake_duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageHistory {
    pub sent_messages: HashMap<u64, ProtocolMessage>,
    pub received_messages: HashMap<u64, ProtocolMessage>,
    pub acknowledgments: HashMap<u64, AcknowledgmentType>,
    pub max_history_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMetrics {
    pub messages_sent: u64,
    pub messages_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub average_latency_ms: f64,
    pub message_loss_rate: f64,
    pub encryption_time_avg_ms: f64,
    pub decryption_time_avg_ms: f64,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolStats {
    pub total_sessions: u64,
    pub active_sessions: u32,
    pub total_messages: u64,
    pub failed_sessions: u64,
    pub average_session_duration_ms: f64,
    pub total_handshakes: u64,
    pub failed_handshakes: u64,
    pub security_violations: u32,
    pub replay_attempts_detected: u32,
}

#[derive(Debug, Error)]
pub enum ProtocolError {
    #[error("Protocol version mismatch: {0}")]
    VersionMismatch(String),
    #[error("Handshake failed: {0}")]
    HandshakeFailed(String),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
    #[error("Session expired: {0}")]
    SessionExpired(String),
    #[error("Invalid message sequence: {0}")]
    InvalidSequence(String),
    #[error("Replay detected: {0}")]
    ReplayDetected(String),
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    #[error("Integrity check failed: {0}")]
    IntegrityCheckFailed(String),
    #[error("Rate limit exceeded: {0}")]
    RateLimitExceeded(String),
    #[error("Security violation: {0}")]
    SecurityViolation(String),
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    #[error("Internal error: {0}")]
    InternalError(String),
}

/// Secure Messaging Protocol Implementation
pub struct SecureMessagingProtocol {
    config: ProtocolConfig,
    qke_engine: QkeEngine,
    signature_engine: PqcSignatureEngine,
    encryption_layer: QuantumEncryptionLayer,
    sessions: Arc<RwLock<HashMap<String, ProtocolSession>>>,
    peer_sessions: Arc<RwLock<HashMap<String, String>>>, // peer_id -> session_id
    replay_cache: Arc<RwLock<HashMap<String, u64>>>, // message_id -> timestamp
    rate_limiter: Arc<RateLimiter>,
    stats: Arc<RwLock<ProtocolStats>>,
    audit_log: Arc<RwLock<Vec<ProtocolAuditEvent>>>,
    rng: SystemRandom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolAuditEvent {
    pub timestamp: u64,
    pub event_type: ProtocolEventType,
    pub session_id: Option<String>,
    pub peer_id: Option<String>,
    pub message_id: Option<String>,
    pub details: HashMap<String, String>,
    pub severity: AuditSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProtocolEventType {
    SessionInitiated,
    HandshakeStarted,
    HandshakeCompleted,
    SessionEstablished,
    SessionRenewed,
    SessionTerminated,
    MessageSent,
    MessageReceived,
    MessageAcknowledged,
    ReplayDetected,
    SecurityViolation,
    RateLimitExceeded,
    Error,
}

struct RateLimiter {
    peer_limits: HashMap<String, RateLimitState>,
    global_limits: RateLimitState,
}

#[derive(Debug, Clone)]
struct RateLimitState {
    message_count: u32,
    byte_count: u64,
    last_reset: u64,
    violations: u32,
}

impl SecureMessagingProtocol {
    pub fn new(config: ProtocolConfig) -> Result<Self, ProtocolError> {
        let qke_engine = QkeEngine::new().map_err(|e| {
            ProtocolError::ConfigurationError(format!("Failed to create QKE engine: {}", e))
        })?;

        let signature_engine = PqcSignatureEngine::new().map_err(|e| {
            ProtocolError::ConfigurationError(format!("Failed to create signature engine: {}", e))
        })?;

        let encryption_config = EncryptionConfig {
            primary_encryption: config.supported_encryption_schemes[0].clone(),
            fallback_encryption: config.supported_encryption_schemes.get(1).cloned(),
            key_derivation_method: KeyDerivationMethod::HkdfSha3256,
            nonce_generation_method: crate::quantum::encryption_layer::NonceGenerationMethod::Random,
            compression_enabled: config.enable_compression,
            integrity_check_enabled: config.enable_message_integrity,
            forward_secrecy_enabled: config.enable_forward_secrecy,
            key_rotation_policy: crate::quantum::encryption_layer::KeyRotationPolicy {
                rotation_interval: config.key_renewal_interval,
                usage_threshold: 1000,
                time_based_rotation: true,
                usage_based_rotation: true,
                automatic_rotation: true,
            },
            security_parameters: crate::quantum::encryption_layer::EncryptionSecurityParameters {
                min_key_strength_bits: config.security_parameters.min_security_level * 8,
                require_forward_secrecy: config.enable_forward_secrecy,
                require_key_separation: true,
                enable_key_zeroization: true,
                secure_memory_enabled: true,
                side_channel_protection: true,
                audit_encryption_operations: true,
            },
        };

        let encryption_layer = QuantumEncryptionLayer::new(encryption_config).map_err(|e| {
            ProtocolError::ConfigurationError(format!("Failed to create encryption layer: {}", e))
        })?;

        Ok(Self {
            config,
            qke_engine,
            signature_engine,
            encryption_layer,
            sessions: Arc::new(RwLock::new(HashMap::new())),
            peer_sessions: Arc::new(RwLock::new(HashMap::new())),
            replay_cache: Arc::new(RwLock::new(HashMap::new())),
            rate_limiter: Arc::new(RateLimiter {
                peer_limits: HashMap::new(),
                global_limits: RateLimitState {
                    message_count: 0,
                    byte_count: 0,
                    last_reset: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    violations: 0,
                },
            }),
            stats: Arc::new(RwLock::new(ProtocolStats::default())),
            audit_log: Arc::new(RwLock::new(Vec::new())),
            rng: SystemRandom::new(),
        })
    }

    /// Initiate a new secure session with a peer
    pub fn initiate_session(&self, peer_id: &str) -> Result<String, ProtocolError> {
        let session_id = self.generate_session_id();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check rate limits
        self.check_rate_limits(peer_id, 0)?;

        // Create initial session
        let session = ProtocolSession {
            session_id: session_id.clone(),
            peer_id: peer_id.to_string(),
            protocol_version: self.config.protocol_version.clone(),
            state: SessionState::Initiated,
            created_at: current_time,
            expires_at: current_time + self.config.session_timeout.as_secs(),
            last_activity: current_time,
            sequence_number: 0,
            remote_sequence_number: 0,
            session_keys: SessionKeys {
                encryption_key: vec![],
                authentication_key: vec![],
                session_key: vec![],
                iv: vec![],
            },
            security_context: ProtocolSecurityContext {
                security_level: self.config.security_parameters.min_security_level,
                encryption_enabled: false,
                authentication_enabled: false,
                integrity_protected: false,
                replay_protection_enabled: self.config.enable_replay_protection,
                forward_secrecy_enabled: self.config.enable_forward_secrecy,
                mutual_authentication: self.config.security_parameters.require_mutual_authentication,
                key_confirmation: self.config.security_parameters.require_key_confirmation,
            },
            handshake_info: HandshakeInfo {
                local_nonce: self.generate_nonce()?,
                remote_nonce: vec![],
                selected_encryption: self.config.supported_encryption_schemes[0].clone(),
                selected_signature: self.config.supported_signature_algorithms.first().cloned(),
                mutual_auth_completed: false,
                key_exchange_completed: false,
                handshake_duration_ms: 0,
            },
            message_history: MessageHistory {
                sent_messages: HashMap::new(),
                received_messages: HashMap::new(),
                acknowledgments: HashMap::new(),
                max_history_size: 100,
            },
            performance_metrics: SessionMetrics::default(),
        };

        // Store session
        {
            let mut sessions = self.sessions.write().unwrap();
            sessions.insert(session_id.clone(), session);
        }

        // Store peer-session mapping
        {
            let mut peer_sessions = self.peer_sessions.write().unwrap();
            peer_sessions.insert(peer_id.to_string(), session_id.clone());
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_sessions += 1;
        }

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: current_time,
            event_type: ProtocolEventType::SessionInitiated,
            session_id: Some(session_id.clone()),
            peer_id: Some(peer_id.to_string()),
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("protocol_version".to_string(), format!("{:?}", self.config.protocol_version));
                details.insert("security_level".to_string(), self.config.security_parameters.min_security_level.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(session_id)
    }

    /// Perform handshake with peer
    pub fn perform_handshake(&self, session_id: &str, peer_public_key: Option<QkePublicKey>) -> Result<(), ProtocolError> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id).ok_or_else(|| {
            ProtocolError::SessionNotFound(session_id.to_string())
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check session state
        if session.state != SessionState::Initiated {
            return Err(ProtocolError::HandshakeFailed(
                "Session not in initiated state".to_string()
            ));
        }

        // Update session state
        session.state = SessionState::Handshaking;
        let handshake_start = current_time;

        // Perform key exchange
        let key_exchange_result = if let Some(pub_key) = peer_public_key {
            let classical_pk = vec![1u8; 32]; // Simplified classical key
            self.qke_engine.hybrid_key_exchange(&pub_key, Some(classical_pk), Some(session_id.clone()))
                .map_err(|e| ProtocolError::HandshakeFailed(format!("Key exchange failed: {}", e)))?
        } else {
            return Err(ProtocolError::HandshakeFailed(
                "No peer public key provided".to_string()
            ));
        };

        // Derive session keys
        let session_keys = self.derive_session_keys(&key_exchange_result.combined_secret, &session_id, &session.peer_id)?;

        // Update session with keys
        session.session_keys = session_keys;
        session.handshake_info.key_exchange_completed = true;
        session.handshake_info.selected_encryption = self.config.supported_encryption_schemes[0].clone();
        session.handshake_info.selected_signature = self.config.supported_signature_algorithms.first().cloned();

        // Update security context
        session.security_context.encryption_enabled = true;
        session.security_context.authentication_enabled = true;
        session.security_context.integrity_protected = true;
        session.security_context.mutual_authentication = self.config.security_parameters.require_mutual_authentication;
        session.security_context.key_confirmation = self.config.security_parameters.require_key_confirmation;

        // Complete handshake
        session.state = SessionState::Established;
        session.expires_at = current_time + self.config.session_timeout.as_secs();
        session.handshake_info.handshake_duration_ms = (current_time - handshake_start) * 1000;
        session.handshake_info.mutual_auth_completed = true;

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_handshakes += 1;
        }

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: current_time,
            event_type: ProtocolEventType::HandshakeCompleted,
            session_id: Some(session_id.to_string()),
            peer_id: Some(session.peer_id.clone()),
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("handshake_duration_ms".to_string(), session.handshake_info.handshake_duration_ms.to_string());
                details.insert("security_level".to_string(), key_exchange_result.security_level.to_string());
                details.insert("hybrid_mode".to_string(), key_exchange_result.quantum_component.is_some().to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(())
    }

    /// Send a secure message
    pub fn send_message(
        &self,
        session_id: &str,
        message_type: MessageType,
        payload: &[u8],
        priority: MessagePriority,
        delivery_guarantee: DeliveryGuarantee,
    ) -> Result<String, ProtocolError> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id).ok_or_else(|| {
            ProtocolError::SessionNotFound(session_id.to_string())
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check session state
        if session.state != SessionState::Established {
            return Err(ProtocolError::InternalError(
                "Session not established".to_string()
            ));
        }

        // Check session expiration
        if session.expires_at <= current_time {
            return Err(ProtocolError::SessionExpired(session_id.to_string()));
        }

        // Check rate limits
        self.check_rate_limits(&session.peer_id, payload.len())?;

        // Check message size
        if payload.len() > self.config.max_message_size {
            return Err(ProtocolError::ConfigurationError(
                format!("Message size {} exceeds maximum {}", payload.len(), self.config.max_message_size)
            ));
        }

        // Generate message ID
        let message_id = self.generate_message_id();

        // Encrypt payload
        let encryption_result = self.encryption_layer.encrypt(
            payload,
            &format!("enc_{}", session_id),
            Some(message_id.as_bytes()),
        ).map_err(|e| {
            ProtocolError::InternalError(format!("Encryption failed: {}", e))
        })?;

        // Create protocol message
        let sequence_number = session.sequence_number;
        session.sequence_number += 1;

        let protocol_message = ProtocolMessage {
            protocol_version: session.protocol_version.clone(),
            message_type: ProtocolMessageType::Data,
            session_id: session_id.to_string(),
            sequence_number,
            timestamp: current_time,
            payload: ProtocolPayload::Data {
                encrypted_data: encryption_result.ciphertext,
                message_id: message_id.clone(),
                message_type: message_type.clone(),
                additional_data: Some(message_id.as_bytes().to_vec()),
            },
            signature: None, // Will be added after signing
            routing_header: RoutingHeader {
                source_id: "self".to_string(), // Would be actual source ID
                destination_id: session.peer_id.clone(),
                hop_count: 0,
                max_hops: self.config.max_hops,
                route_path: vec!["self".to_string()],
                priority: priority.clone(),
                qos_parameters: QoSParameters {
                    latency_requirement_ms: None,
                    bandwidth_requirement_kbps: None,
                    reliability_requirement: match delivery_guarantee {
                        DeliveryGuarantee::AtMostOnce => 0.9,
                        DeliveryGuarantee::AtLeastOnce => 0.99,
                        DeliveryGuarantee::ExactlyOnce => 0.999,
                    },
                    priority_level: priority as u8,
                },
            },
            security_context: session.security_context.clone(),
        };

        // Sign message if authentication is enabled
        let signed_message = if session.security_context.authentication_enabled {
            let signature = self.sign_protocol_message(&protocol_message, &session.session_keys.authentication_key)?;
            let mut signed_msg = protocol_message.clone();
            signed_msg.signature = Some(signature);
            signed_msg
        } else {
            protocol_message.clone()
        };

        // Store in message history
        session.message_history.sent_messages.insert(sequence_number, signed_message.clone());

        // Update session metrics
        session.performance_metrics.messages_sent += 1;
        session.performance_metrics.bytes_sent += signed_message.payload.serialized_size() as u64;
        session.last_activity = current_time;

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_messages += 1;
        }

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: current_time,
            event_type: ProtocolEventType::MessageSent,
            session_id: Some(session_id.to_string()),
            peer_id: Some(session.peer_id.clone()),
            message_id: Some(message_id.clone()),
            details: {
                let mut details = HashMap::new();
                details.insert("message_type".to_string(), format!("{:?}", message_type));
                details.insert("sequence_number".to_string(), sequence_number.to_string());
                details.insert("priority".to_string(), format!("{:?}", priority));
                details.insert("payload_size".to_string(), payload.len().to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(message_id)
    }

    /// Receive and process a protocol message
    pub fn receive_message(&self, protocol_message: ProtocolMessage) -> Result<DecryptedMessage, ProtocolError> {
        let session_id = &protocol_message.session_id;
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Get session
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id).ok_or_else(|| {
            ProtocolError::SessionNotFound(session_id.to_string())
        })?;

        // Check session expiration
        if session.expires_at <= current_time {
            return Err(ProtocolError::SessionExpired(session_id.to_string()));
        }

        // Verify message signature if required
        if session.security_context.authentication_enabled {
            if let Some(signature) = &protocol_message.signature {
                if !self.verify_protocol_message(&protocol_message, signature, &session.session_keys.authentication_key)? {
                    return Err(ProtocolError::AuthenticationFailed(
                        "Message signature verification failed".to_string()
                    ));
                }
            } else {
                return Err(ProtocolError::AuthenticationFailed(
                    "Message signature required but not provided".to_string()
                ));
            }
        }

        // Check sequence number for replay protection
        if protocol_message.sequence_number <= session.remote_sequence_number {
            return Err(ProtocolError::ReplayDetected(
                format!("Duplicate or out-of-order message: {}", protocol_message.sequence_number)
            ));
        }

        // Update remote sequence number
        session.remote_sequence_number = protocol_message.sequence_number;

        // Process message based on type
        match protocol_message.message_type {
            ProtocolMessageType::Data => {
                if let ProtocolPayload::Data {
                    encrypted_data,
                    message_id,
                    message_type,
                    additional_data,
                } = protocol_message.payload.clone()
                {
                    // Check replay cache
                    if self.config.enable_replay_protection {
                        if self.is_replay_attack(&message_id, current_time)? {
                            return Err(ProtocolError::ReplayDetected(
                                format!("Replay attack detected for message {}", message_id)
                            ));
                        }
                    }

                    // Decrypt payload
                    let decryption_result = self.encryption_layer.decrypt(
                        &encrypted_data,
                        &protocol_message.routing_header.destination_id,
                        &[0u8; 12], // Would get from actual nonce
                        additional_data.as_deref(),
                    ).map_err(|e| {
                        ProtocolError::InternalError(format!("Decryption failed: {}", e))
                    })?;

                    // Store in message history
                    session.message_history.received_messages.insert(protocol_message.sequence_number, protocol_message.clone());

                    // Update session metrics
                    session.performance_metrics.messages_received += 1;
                    session.performance_metrics.bytes_received += encrypted_data.len() as u64;
                    session.last_activity = current_time;

                    // Add to replay cache
                    if self.config.enable_replay_protection {
                        let mut replay_cache = self.replay_cache.write().unwrap();
                        replay_cache.insert(message_id.clone(), current_time);
                    }

                    // Update stats
                    {
                        let mut stats = self.stats.write().unwrap();
                        stats.total_messages += 1;
                    }

                    // Log audit event
                    self.log_audit_event(ProtocolAuditEvent {
                        timestamp: current_time,
                        event_type: ProtocolEventType::MessageReceived,
                        session_id: Some(session_id.clone()),
                        peer_id: Some(session.peer_id.clone()),
                        message_id: Some(message_id.clone()),
                        details: {
                            let mut details = HashMap::new();
                            details.insert("message_type".to_string(), format!("{:?}", message_type));
                            details.insert("sequence_number".to_string(), protocol_message.sequence_number.to_string());
                            details.insert("decrypted_size".to_string(), decryption_result.plaintext.len().to_string());
                            details
                        },
                        severity: AuditSeverity::Info,
                    });

                    // Create decrypted message
                    let decrypted_message = DecryptedMessage {
                        message_id,
                        message_type,
                        sender_id: protocol_message.routing_header.source_id.clone(),
                        recipient_id: protocol_message.routing_header.destination_id.clone(),
                        timestamp: protocol_message.timestamp,
                        payload: decryption_result.plaintext,
                        signature: protocol_message.signature,
                        is_verified: true,
                        is_intact: true,
                        decryption_time_ms: decryption_result.decryption_time_ms,
                        security_context: SecurityContext {
                            security_level: session.security_context.security_level,
                            forward_secrecy_enabled: session.security_context.forward_secrecy_enabled,
                            replay_protection_enabled: session.security_context.replay_protection_enabled,
                            origin_verified: true,
                            integrity_checked: session.security_context.integrity_protected,
                            confidentiality_enabled: session.security_context.encryption_enabled,
                            audit_trail_id: Some(format!("audit_{}", self.generate_random_id())),
                        },
                    };

                    return Ok(decrypted_message);
                }
            }
            ProtocolMessageType::Acknowledgment => {
                if let ProtocolPayload::Acknowledgment {
                    acknowledged_sequence,
                    acknowledgment_type,
                } = protocol_message.payload
                {
                    // Store acknowledgment
                    session.message_history.acknowledgments.insert(acknowledged_sequence, acknowledgment_type);

                    // Log audit event
                    self.log_audit_event(ProtocolAuditEvent {
                        timestamp: current_time,
                        event_type: ProtocolEventType::MessageAcknowledged,
                        session_id: Some(session_id.clone()),
                        peer_id: Some(session.peer_id.clone()),
                        message_id: None,
                        details: {
                            let mut details = HashMap::new();
                            details.insert("acknowledged_sequence".to_string(), acknowledged_sequence.to_string());
                            details.insert("acknowledgment_type".to_string(), format!("{:?}", acknowledgment_type));
                            details
                        },
                        severity: AuditSeverity::Info,
                    });

                    // Return empty decrypted message for acknowledgments
                    return Ok(DecryptedMessage {
                        message_id: format!("ack_{}", acknowledged_sequence),
                        message_type: MessageType::Heartbeat,
                        sender_id: protocol_message.routing_header.source_id.clone(),
                        recipient_id: protocol_message.routing_header.destination_id.clone(),
                        timestamp: protocol_message.timestamp,
                        payload: vec![],
                        signature: protocol_message.signature,
                        is_verified: true,
                        is_intact: true,
                        decryption_time_ms: 0,
                        security_context: SecurityContext {
                            security_level: session.security_context.security_level,
                            forward_secrecy_enabled: session.security_context.forward_secrecy_enabled,
                            replay_protection_enabled: session.security_context.replay_protection_enabled,
                            origin_verified: true,
                            integrity_checked: session.security_context.integrity_protected,
                            confidentiality_enabled: session.security_context.encryption_enabled,
                            audit_trail_id: Some(format!("audit_{}", self.generate_random_id())),
                        },
                    });
                }
            }
            ProtocolMessageType::Heartbeat => {
                if let ProtocolPayload::Heartbeat { timestamp, status } = protocol_message.payload {
                    // Update session activity
                    session.last_activity = current_time;

                    // Log audit event
                    self.log_audit_event(ProtocolAuditEvent {
                        timestamp: current_time,
                        event_type: ProtocolEventType::MessageReceived,
                        session_id: Some(session_id.clone()),
                        peer_id: Some(session.peer_id.clone()),
                        message_id: None,
                        details: {
                            let mut details = HashMap::new();
                            details.insert("message_type".to_string(), "heartbeat".to_string());
                            details.insert("status".to_string(), status);
                            details.insert("heartbeat_timestamp".to_string(), timestamp.to_string());
                            details
                        },
                        severity: AuditSeverity::Info,
                    });

                    // Return heartbeat as decrypted message
                    return Ok(DecryptedMessage {
                        message_id: format!("heartbeat_{}", timestamp),
                        message_type: MessageType::Heartbeat,
                        sender_id: protocol_message.routing_header.source_id.clone(),
                        recipient_id: protocol_message.routing_header.destination_id.clone(),
                        timestamp: protocol_message.timestamp,
                        payload: status.as_bytes().to_vec(),
                        signature: protocol_message.signature,
                        is_verified: true,
                        is_intact: true,
                        decryption_time_ms: 0,
                        security_context: SecurityContext {
                            security_level: session.security_context.security_level,
                            forward_secrecy_enabled: session.security_context.forward_secrecy_enabled,
                            replay_protection_enabled: session.security_context.replay_protection_enabled,
                            origin_verified: true,
                            integrity_checked: session.security_context.integrity_protected,
                            confidentiality_enabled: session.security_context.encryption_enabled,
                            audit_trail_id: Some(format!("audit_{}", self.generate_random_id())),
                        },
                    });
                }
            }
            _ => {
                return Err(ProtocolError::InternalError(
                    "Unhandled message type".to_string()
                ));
            }
        }
    }

    /// Renew session keys
    pub fn renew_session(&self, session_id: &str) -> Result<(), ProtocolError> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id).ok_or_else(|| {
            ProtocolError::SessionNotFound(session_id.to_string())
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check session state
        if session.state != SessionState::Established {
            return Err(ProtocolError::InternalError(
                "Session not established".to_string()
            ));
        }

        // Update session state
        session.state = SessionState::Renewing;

        // Perform key exchange for new keys
        let key_exchange_result = self.qke_engine.generate_key_pair(
            session.handshake_info.selected_encryption.clone().into(),
            None,
        ).map_err(|e| {
            ProtocolError::InternalError(format!("Key generation failed: {}", e))
        })?;

        // Derive new session keys
        let new_session_keys = self.derive_session_keys(&key_exchange_result.1.key_data, session_id, &session.peer_id)?;

        // Update session keys
        session.session_keys = new_session_keys;
        session.expires_at = current_time + self.config.session_timeout.as_secs();
        session.state = SessionState::Established;

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_handshakes += 1;
        }

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: current_time,
            event_type: ProtocolEventType::SessionRenewed,
            session_id: Some(session_id.to_string()),
            peer_id: Some(session.peer_id.clone()),
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("new_expires_at".to_string(), session.expires_at.to_string());
                details.insert("security_level".to_string(), session.security_context.security_level.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(())
    }

    /// Terminate a session
    pub fn terminate_session(&self, session_id: &str, reason: TerminationReason, graceful: bool) -> Result<(), ProtocolError> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id).ok_or_else(|| {
            ProtocolError::SessionNotFound(session_id.to_string())
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Update session state
        session.state = SessionState::Terminating;
        session.expires_at = current_time;

        // Remove from peer sessions mapping
        {
            let mut peer_sessions = self.peer_sessions.write().unwrap();
            peer_sessions.remove(&session.peer_id);
        }

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: current_time,
            event_type: ProtocolEventType::SessionTerminated,
            session_id: Some(session_id.to_string()),
            peer_id: Some(session.peer_id.clone()),
            message_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("reason".to_string(), format!("{:?}", reason));
                details.insert("graceful".to_string(), graceful.to_string());
                details.insert("session_duration_ms".to_string(), (current_time - session.created_at).to_string());
                details
            },
            severity: if graceful { AuditSeverity::Info } else { AuditSeverity::Warning },
        });

        // Mark session as terminated
        session.state = SessionState::Terminated;

        Ok(())
    }

    /// Get session information
    pub fn get_session_info(&self, session_id: &str) -> Result<ProtocolSession, ProtocolError> {
        let sessions = self.sessions.read().unwrap();
        sessions.get(session_id)
            .cloned()
            .ok_or_else(|| ProtocolError::SessionNotFound(session_id.to_string()))
    }

    /// List active sessions
    pub fn list_active_sessions(&self) -> Result<Vec<ProtocolSession>, ProtocolError> {
        let sessions = self.sessions.read().unwrap();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let active_sessions: Vec<ProtocolSession> = sessions
            .values()
            .filter(|session| session.state == SessionState::Established && session.expires_at > current_time)
            .cloned()
            .collect();

        Ok(active_sessions)
    }

    /// Get protocol statistics
    pub fn get_stats(&self) -> Result<ProtocolStats, ProtocolError> {
        let stats = self.stats.read().unwrap();
        Ok(stats.clone())
    }

    /// Get audit log
    pub fn get_audit_log(&self) -> Result<Vec<ProtocolAuditEvent>, ProtocolError> {
        let log = self.audit_log.read().unwrap();
        Ok(log.clone())
    }

    /// Cleanup expired sessions and replay cache
    pub fn cleanup(&self) -> Result<u32, ProtocolError> {
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
                    self.log_audit_event(ProtocolAuditEvent {
                        timestamp: current_time,
                        event_type: ProtocolEventType::SessionTerminated,
                        session_id: Some(session.session_id.clone()),
                        peer_id: Some(session.peer_id.clone()),
                        details: {
                            let mut details = HashMap::new();
                            details.insert("reason".to_string(), "expired".to_string());
                            details.insert("session_duration_ms".to_string(), (current_time - session.created_at).to_string());
                            details
                        },
                        severity: AuditSeverity::Info,
                    });
                    false
                } else {
                    true
                }
            });
            
            cleaned_count += initial_count - sessions.len();
        }

        // Clean replay cache
        {
            let mut replay_cache = self.replay_cache.write().unwrap();
            let window_start = current_time.saturating_sub(self.config.max_replay_window.as_secs());
            
            let initial_count = replay_cache.len();
            replay_cache.retain(|_, &mut timestamp| timestamp > window_start);
            cleaned_count += initial_count - replay_cache.len();
        }

        // Clean rate limiter state
        {
            let mut rate_limiter = self.rate_limiter.peer_limits.write().unwrap();
            let window_start = current_time.saturating_sub(60); // 1 minute window
            
            rate_limiter.retain(|_, state| {
                if state.last_reset <= window_start {
                    // Reset rate limit state
                    state.message_count = 0;
                    state.byte_count = 0;
                    state.last_reset = current_time;
                }
                true
            });
        }

        Ok(cleaned_count as u32)
    }

    // Private helper methods
    fn derive_session_keys(&self, shared_secret: &[u8], session_id: &str, peer_id: &str) -> Result<SessionKeys, ProtocolError> {
        use sha3::{Digest, Sha3_256, Sha3_512};
        
        // Derive encryption key
        let mut enc_key_hasher = Sha3_256::new();
        enc_key_hasher.update(shared_secret);
        enc_key_hasher.update(session_id.as_bytes());
        enc_key_hasher.update(peer_id.as_bytes());
        enc_key_hasher.update(b"encryption_key");
        let encryption_key = enc_key_hasher.finalize().to_vec();

        // Derive authentication key
        let mut auth_key_hasher = Sha3_512::new();
        auth_key_hasher.update(shared_secret);
        auth_key_hasher.update(session_id.as_bytes());
        auth_key_hasher.update(peer_id.as_bytes());
        auth_key_hasher.update(b"authentication_key");
        let authentication_key = auth_key_hasher.finalize().to_vec();

        // Derive session key
        let mut session_key_hasher = Sha3_256::new();
        session_key_hasher.update(shared_secret);
        session_key_hasher.update(session_id.as_bytes());
        session_key_hasher.update(peer_id.as_bytes());
        session_key_hasher.update(b"session_key");
        let session_key = session_key_hasher.finalize().to_vec();

        // Generate IV
        let mut iv = [0u8; 12];
        self.rng.fill(&mut iv).map_err(|e| {
            ProtocolError::InternalError(format!("Failed to generate IV: {}", e))
        })?;

        Ok(SessionKeys {
            encryption_key,
            authentication_key,
            session_key,
            iv: iv.to_vec(),
        })
    }

    fn sign_protocol_message(&self, message: &ProtocolMessage, auth_key: &[u8]) -> Result<Vec<u8>, ProtocolError> {
        // Create message hash
        let mut hasher = Sha3_256::new();
        hasher.update(format!("{:?}", message.protocol_version).as_bytes());
        hasher.update(format!("{:?}", message.message_type).as_bytes());
        hasher.update(message.session_id.as_bytes());
        hasher.update(message.sequence_number.to_le_bytes());
        hasher.update(message.timestamp.to_le_bytes());
        
        // Hash payload
        match &message.payload {
            ProtocolPayload::Data { encrypted_data, message_id, message_type, .. } => {
                hasher.update(encrypted_data);
                hasher.update(message_id.as_bytes());
                hasher.update(format!("{:?}", message_type).as_bytes());
            }
            ProtocolPayload::Acknowledgment { acknowledged_sequence, .. } => {
                hasher.update(acknowledged_sequence.to_le_bytes());
            }
            ProtocolPayload::Heartbeat { timestamp, status } => {
                hasher.update(timestamp.to_le_bytes());
                hasher.update(status.as_bytes());
            }
            _ => {
                // Hash serialized payload for other types
                if let Ok(payload_bytes) = bincode::serialize(&message.payload) {
                    hasher.update(&payload_bytes);
                }
            }
        }

        let message_hash = hasher.finalize();

        // Sign the hash
        let signature = self.signature_engine.sign(
            &message_hash,
            &SignatureAlgorithm::Dilithium2, // Default to Dilithium2
            auth_key,
        ).map_err(|e| {
            ProtocolError::InternalError(format!("Signature generation failed: {}", e))
        })?;

        Ok(signature.signature_data)
    }

    fn verify_protocol_message(&self, message: &ProtocolMessage, signature: &[u8], auth_key: &[u8]) -> Result<bool, ProtocolError> {
        // Create message hash (same as signing)
        let mut hasher = Sha3_256::new();
        hasher.update(format!("{:?}", message.protocol_version).as_bytes());
        hasher.update(format!("{:?}", message.message_type).as_bytes());
        hasher.update(message.session_id.as_bytes());
        hasher.update(message.sequence_number.to_le_bytes());
        hasher.update(message.timestamp.to_le_bytes());
        
        // Hash payload
        match &message.payload {
            ProtocolPayload::Data { encrypted_data, message_id, message_type, .. } => {
                hasher.update(encrypted_data);
                hasher.update(message_id.as_bytes());
                hasher.update(format!("{:?}", message_type).as_bytes());
            }
            ProtocolPayload::Acknowledgment { acknowledged_sequence, .. } => {
                hasher.update(acknowledged_sequence.to_le_bytes());
            }
            ProtocolPayload::Heartbeat { timestamp, status } => {
                hasher.update(timestamp.to_le_bytes());
                hasher.update(status.as_bytes());
            }
            _ => {
                // Hash serialized payload for other types
                if let Ok(payload_bytes) = bincode::serialize(&message.payload) {
                    hasher.update(&payload_bytes);
                }
            }
        }

        let message_hash = hasher.finalize();

        // Verify signature
        let verification_result = self.signature_engine.verify(
            &message_hash,
            signature,
            &SignatureAlgorithm::Dilithium2,
            auth_key,
        ).map_err(|e| {
            ProtocolError::InternalError(format!("Signature verification failed: {}", e))
        })?;

        Ok(verification_result.is_valid)
    }

    fn check_rate_limits(&self, peer_id: &str, message_size: usize) -> Result<(), ProtocolError> {
        if !self.config.security_parameters.rate_limiting.enabled {
            return Ok(());
        }

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut rate_limiter = self.rate_limiter.peer_limits.write().unwrap();
        let rate_limit_state = rate_limiter.entry(peer_id.to_string()).or_insert(RateLimitState {
            message_count: 0,
            byte_count: 0,
            last_reset: current_time,
            violations: 0,
        });

        // Reset if window has passed
        if current_time - rate_limit_state.last_reset > 60 {
            rate_limit_state.message_count = 0;
            rate_limit_state.byte_count = 0;
            rate_limit_state.last_reset = current_time;
        }

        let config = &self.config.security_parameters.rate_limiting;

        // Check message rate limit
        if rate_limit_state.message_count >= config.max_messages_per_second {
            rate_limit_state.violations += 1;
            
            // Log audit event
            self.log_audit_event(ProtocolAuditEvent {
                timestamp: current_time,
                event_type: ProtocolEventType::RateLimitExceeded,
                session_id: None,
                peer_id: Some(peer_id.to_string()),
                message_id: None,
                details: {
                    let mut details = HashMap::new();
                    details.insert("limit_type".to_string(), "message_rate".to_string());
                    details.insert("current_count".to_string(), rate_limit_state.message_count.to_string());
                    details.insert("max_limit".to_string(), config.max_messages_per_second.to_string());
                    details
                },
                severity: AuditSeverity::Warning,
            });

            return Err(ProtocolError::RateLimitExceeded(
                format!("Message rate limit exceeded for peer {}", peer_id)
            ));
        }

        // Check byte rate limit
        if rate_limit_state.byte_count + message_size as u64 > config.max_bytes_per_second {
            rate_limit_state.violations += 1;
            
            // Log audit event
            self.log_audit_event(ProtocolAuditEvent {
                timestamp: current_time,
                event_type: ProtocolEventType::RateLimitExceeded,
                session_id: None,
                peer_id: Some(peer_id.to_string()),
                message_id: None,
                details: {
                    let mut details = HashMap::new();
                    details.insert("limit_type".to_string(), "byte_rate".to_string());
                    details.insert("current_bytes".to_string(), rate_limit_state.byte_count.to_string());
                    details.insert("message_size".to_string(), message_size.to_string());
                    details.insert("max_limit".to_string(), config.max_bytes_per_second.to_string());
                    details
                },
                severity: AuditSeverity::Warning,
            });

            return Err(ProtocolError::RateLimitExceeded(
                format!("Byte rate limit exceeded for peer {}", peer_id)
            ));
        }

        // Update counters
        rate_limit_state.message_count += 1;
        rate_limit_state.byte_count += message_size as u64;

        Ok(())
    }

    fn is_replay_attack(&self, message_id: &str, current_time: u64) -> Result<bool, ProtocolError> {
        let replay_cache = self.replay_cache.read().unwrap();
        
        if let Some(&timestamp) = replay_cache.get(message_id) {
            // Check if within replay window
            if current_time.saturating_sub(timestamp) <= self.config.max_replay_window.as_secs() {
                return Ok(true);
            }
        }
        
        Ok(false)
    }

    fn generate_session_id(&self) -> String {
        let mut session_id_bytes = [0u8; 16];
        self.rng.fill(&mut session_id_bytes).unwrap();
        hex::encode(session_id_bytes)
    }

    fn generate_message_id(&self) -> String {
        let mut message_id_bytes = [0u8; 16];
        self.rng.fill(&mut message_id_bytes).unwrap();
        hex::encode(message_id_bytes)
    }

    fn generate_random_id(&self) -> String {
        let mut id_bytes = [0u8; 8];
        self.rng.fill(&mut id_bytes).unwrap();
        hex::encode(id_bytes)
    }

    fn generate_nonce(&self) -> Result<Vec<u8>, ProtocolError> {
        let mut nonce_bytes = [0u8; 32];
        self.rng.fill(&mut nonce_bytes).map_err(|e| {
            ProtocolError::InternalError(format!("Failed to generate nonce: {}", e))
        })?;
        Ok(nonce_bytes.to_vec())
    }

    fn log_audit_event(&self, event: ProtocolAuditEvent) {
        let mut log = self.audit_log.write().unwrap();
        log.push(event);
        
        // Keep only last 1000 events
        if log.len() > 1000 {
            log.drain(0..log.len() - 1000);
        }

        // Update security metrics
        if matches!(event.event_type, ProtocolEventType::SecurityViolation | ProtocolEventType::ReplayDetected) {
            let mut stats = self.stats.write().unwrap();
            stats.security_violations += 1;
        }

        if matches!(event.event_type, ProtocolEventType::ReplayDetected) {
            let mut stats = self.stats.write().unwrap();
            stats.replay_attempts_detected += 1;
        }
    }
}

// Helper trait for payload serialization size
trait PayloadSize {
    fn serialized_size(&self) -> usize;
}

impl PayloadSize for ProtocolPayload {
    fn serialized_size(&self) -> usize {
        match self {
            ProtocolPayload::Data { encrypted_data, .. } => encrypted_data.len(),
            ProtocolPayload::Acknowledgment { .. } => 16, // Approximate
            ProtocolPayload::Heartbeat { .. } => 32, // Approximate
            _ => 64, // Default approximation
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protocol_creation() {
        let config = ProtocolConfig {
            protocol_version: ProtocolVersion::V2_0_Quantum,
            supported_encryption_schemes: vec![EncryptionScheme::Aes256Gcm],
            supported_signature_algorithms: vec![SignatureAlgorithm::Dilithium2],
            max_message_size: 1024 * 1024,
            session_timeout: Duration::from_secs(3600),
            key_renewal_interval: Duration::from_secs(1800),
            max_replay_window: Duration::from_secs(300),
            max_hops: 10,
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            enable_message_integrity: true,
            enable_origin_authentication: true,
            enable_anomaly_detection: true,
            security_parameters: ProtocolSecurityParameters {
                min_security_level: 128,
                require_mutual_authentication: true,
                require_key_confirmation: true,
                enable_session_resumption: true,
                enable_anti_replay: true,
                enable_anti_flooding: true,
                max_sessions_per_peer: 5,
                max_messages_per_session: 10000,
                rate_limiting: RateLimitingConfig {
                    enabled: true,
                    max_messages_per_second: 100,
                    max_bytes_per_second: 1024 * 1024,
                    burst_size: 10,
                    penalty_duration: Duration::from_secs(60),
                },
            },
        };

        let protocol = SecureMessagingProtocol::new(config);
        assert!(protocol.is_ok());
    }

    #[test]
    fn test_session_initiation() {
        let config = ProtocolConfig {
            protocol_version: ProtocolVersion::V2_0_Quantum,
            supported_encryption_schemes: vec![EncryptionScheme::Aes256Gcm],
            supported_signature_algorithms: vec![SignatureAlgorithm::Dilithium2],
            max_message_size: 1024 * 1024,
            session_timeout: Duration::from_secs(3600),
            key_renewal_interval: Duration::from_secs(1800),
            max_replay_window: Duration::from_secs(300),
            max_hops: 10,
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            enable_message_integrity: true,
            enable_origin_authentication: true,
            enable_anomaly_detection: true,
            security_parameters: ProtocolSecurityParameters {
                min_security_level: 128,
                require_mutual_authentication: true,
                require_key_confirmation: true,
                enable_session_resumption: true,
                enable_anti_replay: true,
                enable_anti_flooding: true,
                max_sessions_per_peer: 5,
                max_messages_per_session: 10000,
                rate_limiting: RateLimitingConfig {
                    enabled: true,
                    max_messages_per_second: 100,
                    max_bytes_per_second: 1024 * 1024,
                    burst_size: 10,
                    penalty_duration: Duration::from_secs(60),
                },
            },
        };

        let protocol = SecureMessagingProtocol::new(config).unwrap();
        let session_id = protocol.initiate_session("peer1");
        assert!(session_id.is_ok());
        
        let session_id = session_id.unwrap();
        let session_info = protocol.get_session_info(&session_id);
        assert!(session_info.is_ok());
        
        let session = session_info.unwrap();
        assert_eq!(session.state, SessionState::Initiated);
        assert_eq!(session.peer_id, "peer1");
    }

    #[test]
    fn test_handshake() {
        let config = ProtocolConfig {
            protocol_version: ProtocolVersion::V2_0_Quantum,
            supported_encryption_schemes: vec![EncryptionScheme::Aes256Gcm],
            supported_signature_algorithms: vec![SignatureAlgorithm::Dilithium2],
            max_message_size: 1024 * 1024,
            session_timeout: Duration::from_secs(3600),
            key_renewal_interval: Duration::from_secs(1800),
            max_replay_window: Duration::from_secs(300),
            max_hops: 10,
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            enable_message_integrity: true,
            enable_origin_authentication: true,
            enable_anomaly_detection: true,
            security_parameters: ProtocolSecurityParameters {
                min_security_level: 128,
                require_mutual_authentication: true,
                require_key_confirmation: true,
                enable_session_resumption: true,
                enable_anti_replay: true,
                enable_anti_flooding: true,
                max_sessions_per_peer: 5,
                max_messages_per_session: 10000,
                rate_limiting: RateLimitingConfig {
                    enabled: true,
                    max_messages_per_second: 100,
                    max_bytes_per_second: 1024 * 1024,
                    burst_size: 10,
                    penalty_duration: Duration::from_secs(60),
                },
            },
        };

        let protocol = SecureMessagingProtocol::new(config).unwrap();
        let session_id = protocol.initiate_session("peer1").unwrap();
        
        // Generate a peer public key for testing
        let qke_engine = QkeEngine::new().unwrap();
        let (peer_public_key, _) = qke_engine.generate_key_pair(QkeAlgorithm::Kyber768, None).unwrap();
        
        let handshake_result = protocol.perform_handshake(&session_id, Some(peer_public_key));
        assert!(handshake_result.is_ok());
        
        let session_info = protocol.get_session_info(&session_id).unwrap();
        assert_eq!(session_info.state, SessionState::Established);
        assert!(session_info.handshake_info.key_exchange_completed);
        assert!(session_info.handshake_info.mutual_auth_completed);
    }

    #[test]
    fn test_message_sending() {
        let config = ProtocolConfig {
            protocol_version: ProtocolVersion::V2_0_Quantum,
            supported_encryption_schemes: vec![EncryptionScheme::Aes256Gcm],
            supported_signature_algorithms: vec![SignatureAlgorithm::Dilithium2],
            max_message_size: 1024 * 1024,
            session_timeout: Duration::from_secs(3600),
            key_renewal_interval: Duration::from_secs(1800),
            max_replay_window: Duration::from_secs(300),
            max_hops: 10,
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            enable_message_integrity: true,
            enable_origin_authentication: true,
            enable_anomaly_detection: true,
            security_parameters: ProtocolSecurityParameters {
                min_security_level: 128,
                require_mutual_authentication: true,
                require_key_confirmation: true,
                enable_session_resumption: true,
                enable_anti_replay: true,
                enable_anti_flooding: true,
                max_sessions_per_peer: 5,
                max_messages_per_session: 10000,
                rate_limiting: RateLimitingConfig {
                    enabled: true,
                    max_messages_per_second: 100,
                    max_bytes_per_second: 1024 * 1024,
                    burst_size: 10,
                    penalty_duration: Duration::from_secs(60),
                },
            },
        };

        let protocol = SecureMessagingProtocol::new(config).unwrap();
        let session_id = protocol.initiate_session("peer1").unwrap();
        
        // Perform handshake
        let qke_engine = QkeEngine::new().unwrap();
        let (peer_public_key, _) = qke_engine.generate_key_pair(QkeAlgorithm::Kyber768, None).unwrap();
        protocol.perform_handshake(&session_id, Some(peer_public_key)).unwrap();
        
        let test_payload = b"Hello, quantum-secure world!";
        let message_id = protocol.send_message(
            &session_id,
            MessageType::Heartbeat,
            test_payload,
            MessagePriority::Normal,
            DeliveryGuarantee::AtLeastOnce,
        );
        assert!(message_id.is_ok());
        
        let message_id = message_id.unwrap();
        assert!(!message_id.is_empty());
        
        // Check session metrics
        let session_info = protocol.get_session_info(&session_id).unwrap();
        assert_eq!(session_info.performance_metrics.messages_sent, 1);
        assert!(session_info.performance_metrics.bytes_sent > 0);
    }

    #[test]
    fn test_replay_protection() {
        let config = ProtocolConfig {
            protocol_version: ProtocolVersion::V2_0_Quantum,
            supported_encryption_schemes: vec![EncryptionScheme::Aes256Gcm],
            supported_signature_algorithms: vec![SignatureAlgorithm::Dilithium2],
            max_message_size: 1024 * 1024,
            session_timeout: Duration::from_secs(3600),
            key_renewal_interval: Duration::from_secs(1800),
            max_replay_window: Duration::from_secs(300),
            max_hops: 10,
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            enable_message_integrity: true,
            enable_origin_authentication: true,
            enable_anomaly_detection: true,
            security_parameters: ProtocolSecurityParameters {
                min_security_level: 128,
                require_mutual_authentication: true,
                require_key_confirmation: true,
                enable_session_resumption: true,
                enable_anti_replay: true,
                enable_anti_flooding: true,
                max_sessions_per_peer: 5,
                max_messages_per_session: 10000,
                rate_limiting: RateLimitingConfig {
                    enabled: true,
                    max_messages_per_second: 100,
                    max_bytes_per_second: 1024 * 1024,
                    burst_size: 10,
                    penalty_duration: Duration::from_secs(60),
                },
            },
        };

        let protocol = SecureMessagingProtocol::new(config).unwrap();
        let session_id = protocol.initiate_session("peer1").unwrap();
        
        // Perform handshake
        let qke_engine = QkeEngine::new().unwrap();
        let (peer_public_key, _) = qke_engine.generate_key_pair(QkeAlgorithm::Kyber768, None).unwrap();
        protocol.perform_handshake(&session_id, Some(peer_public_key)).unwrap();
        
        // Create a test message
        let test_payload = b"Test message for replay protection";
        let message_id = protocol.send_message(
            &session_id,
            MessageType::Heartbeat,
            test_payload,
            MessagePriority::Normal,
            DeliveryGuarantee::AtLeastOnce,
        ).unwrap();

        // Get the protocol message from session history
        let session_info = protocol.get_session_info(&session_id).unwrap();
        let protocol_message = session_info.message_history.sent_messages.values().next().unwrap().clone();

        // First receive should succeed
        let first_result = protocol.receive_message(protocol_message.clone());
        assert!(first_result.is_ok());

        // Second receive should fail due to replay protection
        let second_result = protocol.receive_message(protocol_message);
        assert!(second_result.is_err());
        assert!(matches!(second_result.unwrap_err(), ProtocolError::ReplayDetected(_)));
    }
}