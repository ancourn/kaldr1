//! Quantum-Resistant Messaging Layer
//! End-to-end encrypted messaging system using post-quantum algorithms
//! Hybrid PQC + classical approach with comprehensive security features

use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use sha3::{Digest, Sha3_256, Sha3_512};
use crate::quantum::qke_module::{QkeEngine, QkeAlgorithm, QkePublicKey, QkePrivateKey, HybridKeyExchange};
use crate::quantum::pqc_signatures::{PqcSignatureEngine, SignatureAlgorithm, PqcPublicKey, PqcPrivateKey, PqcSignature};
use crate::quantum::secure_protocol::{SecureKeyExchangeProtocol, ProtocolConfig, ProtocolSession};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessagingMode {
    QuantumOnly,
    Hybrid,
    ClassicalFallback,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageConfig {
    pub messaging_mode: MessagingMode,
    pub preferred_pqc_algorithm: QkeAlgorithm,
    pub preferred_signature_algorithm: SignatureAlgorithm,
    pub classical_fallback_enabled: bool,
    pub message_lifetime: Duration,
    pub session_key_lifetime: Duration,
    pub max_message_size: usize,
    pub enable_compression: bool,
    pub enable_forward_secrecy: bool,
    pub enable_replay_protection: bool,
    pub max_replay_window: u64,
    pub security_parameters: MessageSecurityParameters,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageSecurityParameters {
    pub min_security_level: u32,
    pub require_signature_verification: bool,
    pub enable_origin_tracking: bool,
    pub enable_message_integrity: bool,
    pub enable_confidentiality: bool,
    pub enable_audit_logging: bool,
    pub enable_anomaly_detection: bool,
    pub allowed_message_types: HashSet<MessageType>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageType {
    Consensus,
    Transaction,
    Block,
    Heartbeat,
    PeerDiscovery,
    KeyExchange,
    Authentication,
    DataSync,
    Control,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedMessage {
    pub message_id: String,
    pub message_type: MessageType,
    pub sender_id: String,
    pub recipient_id: String,
    pub timestamp: u64,
    pub encrypted_payload: Vec<u8>,
    pub signature: Option<Vec<u8>>,
    pub encryption_metadata: EncryptionMetadata,
    pub routing_info: RoutingInfo,
    pub security_context: SecurityContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionMetadata {
    pub encryption_algorithm: String,
    pub key_exchange_algorithm: QkeAlgorithm,
    pub signature_algorithm: Option<SignatureAlgorithm>,
    pub nonce: Vec<u8>,
    pub key_id: String,
    pub session_id: String,
    pub is_hybrid: bool,
    pub fallback_used: bool,
    pub compression_used: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingInfo {
    pub hop_count: u32,
    pub max_hops: u32,
    pub route_path: Vec<String>,
    pub priority: MessagePriority,
    pub delivery_guarantee: DeliveryGuarantee,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessagePriority {
    Low,
    Normal,
    High,
    Critical,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeliveryGuarantee {
    AtMostOnce,
    AtLeastOnce,
    ExactlyOnce,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityContext {
    pub security_level: u32,
    pub forward_secrecy_enabled: bool,
    pub replay_protection_enabled: bool,
    pub origin_verified: bool,
    pub integrity_checked: bool,
    pub confidentiality_enabled: bool,
    pub audit_trail_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageSession {
    pub session_id: String,
    pub peer_id: String,
    pub session_key: Vec<u8>,
    pub encryption_key: Vec<u8>,
    pub authentication_key: Vec<u8>,
    pub created_at: u64,
    pub expires_at: u64,
    pub last_used: u64,
    pub message_count: u64,
    pub security_level: u32,
    pub is_active: bool,
    pub key_exchange_info: KeyExchangeInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyExchangeInfo {
    pub algorithm_used: QkeAlgorithm,
    pub signature_algorithm_used: Option<SignatureAlgorithm>,
    pub hybrid_mode: bool,
    pub fallback_used: bool,
    pub key_exchange_time_ms: u64,
    pub security_score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecryptedMessage {
    pub message_id: String,
    pub message_type: MessageType,
    pub sender_id: String,
    pub recipient_id: String,
    pub timestamp: u64,
    pub payload: Vec<u8>,
    pub signature: Option<Vec<u8>>,
    pub is_verified: bool,
    pub is_intact: bool,
    pub decryption_time_ms: u64,
    pub security_context: SecurityContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageQueue {
    pub pending_messages: VecDeque<QueuedMessage>,
    pub processing_messages: HashMap<String, ProcessingMessage>,
    pub completed_messages: HashMap<String, CompletedMessage>,
    pub failed_messages: HashMap<String, FailedMessage>,
    pub queue_stats: QueueStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueuedMessage {
    pub message: EncryptedMessage,
    pub priority: MessagePriority,
    pub queued_at: u64,
    pub retry_count: u32,
    pub max_retries: u32,
    pub timeout: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingMessage {
    pub message: EncryptedMessage,
    pub started_at: u64,
    pub processing_steps: Vec<ProcessingStep>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingStep {
    pub step_name: String,
    pub started_at: u64,
    pub completed_at: Option<u64>,
    pub status: ProcessingStatus,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletedMessage {
    pub message_id: String,
    pub decrypted_message: DecryptedMessage,
    pub completed_at: u64,
    pub processing_time_ms: u64,
    pub verification_result: VerificationResult,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    pub signature_verified: bool,
    pub integrity_checked: bool,
    pub origin_verified: bool,
    pub replay_detected: bool,
    pub security_score: u32,
    pub issues: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedMessage {
    pub message_id: String,
    pub failed_at: u64,
    pub error_reason: String,
    pub retry_count: u32,
    pub error_details: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueStats {
    pub total_queued: u64,
    pub total_processed: u64,
    pub total_failed: u64,
    pub average_processing_time_ms: f64,
    pub current_queue_size: usize,
    pub peak_queue_size: usize,
    pub throughput_messages_per_sec: f64,
}

#[derive(Debug, Error)]
pub enum MessagingError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    #[error("Key exchange failed: {0}")]
    KeyExchangeFailed(String),
    #[error("Signature verification failed: {0}")]
    SignatureVerificationFailed(String),
    #[error("Message validation failed: {0}")]
    MessageValidationFailed(String),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
    #[error("Session expired: {0}")]
    SessionExpired(String),
    #[error("Message too large: {0}")]
    MessageTooLarge(String),
    #[error("Replay detected: {0}")]
    ReplayDetected(String),
    #[error("Security violation: {0}")]
    SecurityViolation(String),
    #[error("Network error: {0}")]
    NetworkError(String),
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    #[error("Internal error: {0}")]
    InternalError(String),
}

/// Quantum-Resistant Messaging Engine
pub struct QuantumMessagingEngine {
    config: MessageConfig,
    qke_engine: QkeEngine,
    signature_engine: PqcSignatureEngine,
    protocol_engine: Option<SecureKeyExchangeProtocol>,
    message_sessions: Arc<RwLock<HashMap<String, MessageSession>>>,
    message_queue: Arc<RwLock<MessageQueue>>,
    replay_cache: Arc<RwLock<HashMap<String, u64>>>, // message_id -> timestamp
    peer_sessions: Arc<RwLock<HashMap<String, String>>>, // peer_id -> session_id
    rng: SystemRandom,
    audit_log: Arc<RwLock<Vec<MessageAuditEvent>>>,
    performance_metrics: Arc<RwLock<MessagingPerformanceMetrics>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageAuditEvent {
    pub timestamp: u64,
    pub event_type: MessageEventType,
    pub message_id: Option<String>,
    pub session_id: Option<String>,
    pub peer_id: Option<String>,
    pub details: HashMap<String, String>,
    pub severity: AuditSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageEventType {
    MessageSent,
    MessageReceived,
    MessageDecrypted,
    MessageVerified,
    MessageFailed,
    SessionCreated,
    SessionExpired,
    SessionRenewed,
    KeyExchangeInitiated,
    KeyExchangeCompleted,
    SecurityEvent,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuditSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MessagingPerformanceMetrics {
    pub messages_sent: u64,
    pub messages_received: u64,
    pub messages_decrypted: u64,
    pub messages_verified: u64,
    pub messages_failed: u64,
    pub average_encryption_time_ms: f64,
    pub average_decryption_time_ms: f64,
    pub average_verification_time_ms: f64,
    pub total_bytes_encrypted: u64,
    pub total_bytes_decrypted: u64,
    pub session_count: u32,
    pub key_exchange_count: u32,
    pub replay_attempts_detected: u32,
    pub security_violations: u32,
}

impl QuantumMessagingEngine {
    pub fn new(config: MessageConfig) -> Result<Self, MessagingError> {
        let qke_engine = QkeEngine::new().map_err(|e| {
            MessagingError::ConfigurationError(format!("Failed to create QKE engine: {}", e))
        })?;

        let signature_engine = PqcSignatureEngine::new().map_err(|e| {
            MessagingError::ConfigurationError(format!("Failed to create signature engine: {}", e))
        })?;

        let protocol_config = ProtocolConfig {
            version: crate::quantum::secure_protocol::ProtocolVersion::V2_0,
            supported_algorithms: vec![config.preferred_pqc_algorithm.clone()],
            preferred_algorithm: config.preferred_pqc_algorithm.clone(),
            enable_hybrid_mode: matches!(config.messaging_mode, MessagingMode::Hybrid),
            enable_forward_secrecy: config.enable_forward_secrecy,
            enable_key_confirmation: true,
            session_timeout: config.session_key_lifetime,
            max_retries: 3,
            enable_mitm_protection: true,
            enable_rate_limiting: true,
            security_parameters: crate::quantum::secure_protocol::SecurityParameters {
                min_key_size_bits: 256,
                min_security_level: config.security_parameters.min_security_level,
                max_session_duration: config.session_key_lifetime,
                require_key_rotation: true,
                enable_audit_logging: config.security_parameters.enable_audit_logging,
                enable_anomaly_detection: config.security_parameters.enable_anomaly_detection,
                allowed_key_types: HashSet::from([
                    crate::quantum::key_generation::KeyType::KeyExchange,
                    crate::quantum::key_generation::KeyType::Encryption,
                ]),
            },
        };

        let protocol_engine = SecureKeyExchangeProtocol::new(protocol_config).map_err(|e| {
            MessagingError::ConfigurationError(format!("Failed to create protocol engine: {}", e))
        })?;

        Ok(Self {
            config,
            qke_engine,
            signature_engine,
            protocol_engine: Some(protocol_engine),
            message_sessions: Arc::new(RwLock::new(HashMap::new())),
            message_queue: Arc::new(RwLock::new(MessageQueue {
                pending_messages: VecDeque::new(),
                processing_messages: HashMap::new(),
                completed_messages: HashMap::new(),
                failed_messages: HashMap::new(),
                queue_stats: QueueStats::default(),
            })),
            replay_cache: Arc::new(RwLock::new(HashMap::new())),
            peer_sessions: Arc::new(RwLock::new(HashMap::new())),
            rng: SystemRandom::new(),
            audit_log: Arc::new(RwLock::new(Vec::new())),
            performance_metrics: Arc::new(RwLock::new(MessagingPerformanceMetrics::default())),
        })
    }

    /// Establish a secure messaging session with a peer
    pub fn establish_session(&self, peer_id: &str, peer_public_key: Option<QkePublicKey>) -> Result<String, MessagingError> {
        let session_id = self.generate_session_id();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Perform key exchange
        let key_exchange_result = if let Some(protocol) = &self.protocol_engine {
            // Use protocol engine for key exchange
            let init_result = protocol.initiate_key_exchange("self", peer_id, None);
            match init_result {
                Ok(_) => {
                    // In a real implementation, this would complete the key exchange
                    // For now, simulate successful key exchange
                    self.simulate_key_exchange(peer_id)?
                }
                Err(e) => return Err(MessagingError::KeyExchangeFailed(format!("Protocol key exchange failed: {}", e))),
            }
        } else {
            // Use direct QKE engine
            if let Some(pub_key) = peer_public_key {
                let classical_pk = if self.config.classical_fallback_enabled {
                    Some(self.generate_classical_public_key()?)
                } else {
                    None
                };

                let hybrid_result = self.qke_engine.hybrid_key_exchange(&pub_key, classical_pk, Some(session_id.clone()));
                hybrid_result.map_err(|e| {
                    MessagingError::KeyExchangeFailed(format!("Hybrid key exchange failed: {}", e))
                })?
            } else {
                return Err(MessagingError::KeyExchangeFailed("No peer public key provided".to_string()));
            }
        };

        // Derive session keys
        let session_keys = self.derive_session_keys(&key_exchange_result.combined_secret, &session_id, peer_id)?;

        // Create message session
        let session = MessageSession {
            session_id: session_id.clone(),
            peer_id: peer_id.to_string(),
            session_key: session_keys.session_key.clone(),
            encryption_key: session_keys.encryption_key.clone(),
            authentication_key: session_keys.authentication_key.clone(),
            created_at: current_time,
            expires_at: current_time + self.config.session_key_lifetime.as_secs(),
            last_used: current_time,
            message_count: 0,
            security_level: key_exchange_result.security_level,
            is_active: true,
            key_exchange_info: KeyExchangeInfo {
                algorithm_used: key_exchange_result.quantum_component
                    .as_ref()
                    .map(|qc| qc.algorithm.clone())
                    .unwrap_or(self.config.preferred_pqc_algorithm.clone()),
                signature_algorithm_used: Some(self.config.preferred_signature_algorithm.clone()),
                hybrid_mode: key_exchange_result.quantum_component.is_some(),
                fallback_used: key_exchange_result.fallback_used,
                key_exchange_time_ms: 0, // Would be measured in real implementation
                security_score: self.calculate_security_score(&key_exchange_result),
            },
        };

        // Store session
        {
            let mut sessions = self.message_sessions.write().unwrap();
            sessions.insert(session_id.clone(), session);
        }

        // Store peer-session mapping
        {
            let mut peer_sessions = self.peer_sessions.write().unwrap();
            peer_sessions.insert(peer_id.to_string(), session_id.clone());
        }

        // Update metrics
        {
            let mut metrics = self.performance_metrics.write().unwrap();
            metrics.session_count += 1;
            metrics.key_exchange_count += 1;
        }

        // Log audit event
        self.log_audit_event(MessageAuditEvent {
            timestamp: current_time,
            event_type: MessageEventType::SessionCreated,
            message_id: None,
            session_id: Some(session_id.clone()),
            peer_id: Some(peer_id.to_string()),
            details: {
                let mut details = HashMap::new();
                details.insert("security_level".to_string(), key_exchange_result.security_level.to_string());
                details.insert("hybrid_mode".to_string(), key_exchange_result.quantum_component.is_some().to_string());
                details.insert("fallback_used".to_string(), key_exchange_result.fallback_used.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(session_id)
    }

    /// Send an encrypted message to a peer
    pub fn send_message(
        &self,
        recipient_id: &str,
        message_type: MessageType,
        payload: &[u8],
        priority: MessagePriority,
        delivery_guarantee: DeliveryGuarantee,
    ) -> Result<String, MessagingError> {
        // Validate message size
        if payload.len() > self.config.max_message_size {
            return Err(MessagingError::MessageTooLarge(
                format!("Message size {} exceeds maximum {}", payload.len(), self.config.max_message_size)
            ));
        }

        // Get or create session
        let session_id = self.get_or_create_session(recipient_id)?;
        let session = self.get_session(&session_id)?;

        // Check if session is expired
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        if session.expires_at <= current_time {
            self.renew_session(&session_id)?;
        }

        // Generate message ID
        let message_id = self.generate_message_id();

        // Encrypt payload
        let encryption_start = Instant::now();
        let (encrypted_payload, nonce) = self.encrypt_payload(payload, &session.encryption_key)?;
        let encryption_time = encryption_start.elapsed().as_millis() as u64;

        // Sign message if required
        let signature = if self.config.security_parameters.require_signature_verification {
            let signature_start = Instant::now();
            let signature_result = self.sign_message(&message_id, message_type, payload, &session.authentication_key);
            let signature_time = signature_start.elapsed().as_millis() as u64;
            
            // Update metrics
            {
                let mut metrics = self.performance_metrics.write().unwrap();
                metrics.average_verification_time_ms = 
                    (metrics.average_verification_time_ms * (metrics.messages_verified as f64) + signature_time as f64) 
                    / (metrics.messages_verified + 1) as f64;
                metrics.messages_verified += 1;
            }
            
            Some(signature_result?)
        } else {
            None
        };

        // Create encrypted message
        let encrypted_message = EncryptedMessage {
            message_id: message_id.clone(),
            message_type,
            sender_id: "self".to_string(), // Would be actual sender ID
            recipient_id: recipient_id.to_string(),
            timestamp: current_time,
            encrypted_payload,
            signature,
            encryption_metadata: EncryptionMetadata {
                encryption_algorithm: "AES-256-GCM".to_string(),
                key_exchange_algorithm: session.key_exchange_info.algorithm_used.clone(),
                signature_algorithm: session.key_exchange_info.signature_algorithm_used.clone(),
                nonce,
                key_id: session.session_id.clone(),
                session_id: session.session_id.clone(),
                is_hybrid: session.key_exchange_info.hybrid_mode,
                fallback_used: session.key_exchange_info.fallback_used,
                compression_used: self.config.enable_compression,
            },
            routing_info: RoutingInfo {
                hop_count: 0,
                max_hops: 10, // Default max hops
                route_path: vec!["self".to_string()],
                priority,
                delivery_guarantee,
            },
            security_context: SecurityContext {
                security_level: session.security_level,
                forward_secrecy_enabled: self.config.enable_forward_secrecy,
                replay_protection_enabled: self.config.enable_replay_protection,
                origin_verified: false, // Will be verified by recipient
                integrity_checked: true, // AES-GCM provides integrity
                confidentiality_enabled: true,
                audit_trail_id: Some(format!("audit_{}", self.generate_random_id())),
            },
        };

        // Add to message queue
        self.queue_message(encrypted_message.clone())?;

        // Update session
        {
            let mut sessions = self.message_sessions.write().unwrap();
            if let Some(session) = sessions.get_mut(&session_id) {
                session.last_used = current_time;
                session.message_count += 1;
            }
        }

        // Update metrics
        {
            let mut metrics = self.performance_metrics.write().unwrap();
            metrics.messages_sent += 1;
            metrics.total_bytes_encrypted += encrypted_message.encrypted_payload.len() as u64;
            metrics.average_encryption_time_ms = 
                (metrics.average_encryption_time_ms * (metrics.messages_sent as f64 - 1.0) + encryption_time as f64) 
                / metrics.messages_sent as f64;
        }

        // Log audit event
        self.log_audit_event(MessageAuditEvent {
            timestamp: current_time,
            event_type: MessageEventType::MessageSent,
            message_id: Some(message_id.clone()),
            session_id: Some(session_id),
            peer_id: Some(recipient_id.to_string()),
            details: {
                let mut details = HashMap::new();
                details.insert("message_type".to_string(), format!("{:?}", message_type));
                details.insert("priority".to_string(), format!("{:?}", priority));
                details.insert("payload_size".to_string(), payload.len().to_string());
                details.insert("encryption_time_ms".to_string(), encryption_time.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(message_id)
    }

    /// Receive and decrypt a message
    pub fn receive_message(&self, encrypted_message: EncryptedMessage) -> Result<DecryptedMessage, MessagingError> {
        let message_id = encrypted_message.message_id.clone();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check for replay attacks
        if self.config.enable_replay_protection {
            if self.is_replay_attack(&message_id, current_time)? {
                return Err(MessagingError::ReplayDetected(format!("Replay attack detected for message {}", message_id)));
            }
        }

        // Get session
        let session = self.get_session(&encrypted_message.encryption_metadata.session_id)?;

        // Check session expiration
        if session.expires_at <= current_time {
            return Err(MessagingError::SessionExpired(format!("Session {} expired", session.session_id)));
        }

        // Start processing
        self.start_message_processing(&encrypted_message)?;

        // Decrypt payload
        let decryption_start = Instant::now();
        let decrypted_payload = self.decrypt_payload(
            &encrypted_message.encrypted_payload,
            &encrypted_message.encryption_metadata.nonce,
            &session.encryption_key,
        )?;
        let decryption_time = decryption_start.elapsed().as_millis() as u64;

        // Verify signature if present
        let mut is_verified = false;
        let mut verification_issues = Vec::new();
        
        if let Some(signature) = &encrypted_message.signature {
            let verification_start = Instant::now();
            let verification_result = self.verify_message(
                &encrypted_message.message_id,
                encrypted_message.message_type.clone(),
                &decrypted_payload,
                signature,
                &session.authentication_key,
            );
            let verification_time = verification_start.elapsed().as_millis() as u64;
            
            match verification_result {
                Ok(verified) => {
                    is_verified = verified;
                    if !verified {
                        verification_issues.push("Signature verification failed".to_string());
                    }
                }
                Err(e) => {
                    verification_issues.push(format!("Signature verification error: {}", e));
                }
            }

            // Update metrics
            {
                let mut metrics = self.performance_metrics.write().unwrap();
                metrics.average_verification_time_ms = 
                    (metrics.average_verification_time_ms * (metrics.messages_verified as f64) + verification_time as f64) 
                    / (metrics.messages_verified + 1) as f64;
                metrics.messages_verified += 1;
            }
        } else if self.config.security_parameters.require_signature_verification {
            verification_issues.push("Signature required but not provided".to_string());
        }

        // Check message integrity
        let is_intact = !decrypted_payload.is_empty();

        // Verify origin (simplified - would need proper peer verification)
        let origin_verified = self.verify_message_origin(&encrypted_message.sender_id, &session.peer_id)?;

        // Create decrypted message
        let decrypted_message = DecryptedMessage {
            message_id: encrypted_message.message_id.clone(),
            message_type: encrypted_message.message_type.clone(),
            sender_id: encrypted_message.sender_id.clone(),
            recipient_id: encrypted_message.recipient_id.clone(),
            timestamp: encrypted_message.timestamp,
            payload: decrypted_payload,
            signature: encrypted_message.signature.clone(),
            is_verified,
            is_intact,
            decryption_time_ms: decryption_time,
            security_context: SecurityContext {
                security_level: session.security_level,
                forward_secrecy_enabled: self.config.enable_forward_secrecy,
                replay_protection_enabled: self.config.enable_replay_protection,
                origin_verified,
                integrity_checked: is_intact,
                confidentiality_enabled: true,
                audit_trail_id: encrypted_message.security_context.audit_trail_id.clone(),
            },
        };

        // Complete message processing
        self.complete_message_processing(
            &encrypted_message.message_id,
            &decrypted_message,
            VerificationResult {
                signature_verified: is_verified,
                integrity_checked: is_intact,
                origin_verified,
                replay_detected: false,
                security_score: self.calculate_message_security_score(&decrypted_message),
                issues: verification_issues,
            },
        )?;

        // Update session
        {
            let mut sessions = self.message_sessions.write().unwrap();
            if let Some(session) = sessions.get_mut(&encrypted_message.encryption_metadata.session_id) {
                session.last_used = current_time;
                session.message_count += 1;
            }
        }

        // Add to replay cache
        if self.config.enable_replay_protection {
            let mut replay_cache = self.replay_cache.write().unwrap();
            replay_cache.insert(message_id.clone(), current_time);
        }

        // Update metrics
        {
            let mut metrics = self.performance_metrics.write().unwrap();
            metrics.messages_received += 1;
            metrics.messages_decrypted += 1;
            metrics.total_bytes_decrypted += encrypted_message.encrypted_payload.len() as u64;
            metrics.average_decryption_time_ms = 
                (metrics.average_decryption_time_ms * (metrics.messages_decrypted as f64 - 1.0) + decryption_time as f64) 
                / metrics.messages_decrypted as f64;
        }

        // Log audit event
        self.log_audit_event(MessageAuditEvent {
            timestamp: current_time,
            event_type: MessageEventType::MessageReceived,
            message_id: Some(message_id.clone()),
            session_id: Some(session.session_id.clone()),
            peer_id: Some(session.peer_id.clone()),
            details: {
                let mut details = HashMap::new();
                details.insert("message_type".to_string(), format!("{:?}", encrypted_message.message_type));
                details.insert("decryption_time_ms".to_string(), decryption_time.to_string());
                details.insert("verified".to_string(), is_verified.to_string());
                details.insert("intact".to_string(), is_intact.to_string());
                details
            },
            severity: if verification_issues.is_empty() { AuditSeverity::Info } else { AuditSeverity::Warning },
        });

        Ok(decrypted_message)
    }

    /// Renew an existing session
    pub fn renew_session(&self, session_id: &str) -> Result<(), MessagingError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut sessions = self.message_sessions.write().unwrap();
        let session = sessions.get_mut(session_id).ok_or_else(|| {
            MessagingError::SessionNotFound(session_id.to_string())
        })?;

        // Perform key renewal
        let new_key_exchange = self.simulate_key_exchange(&session.peer_id)?;
        let new_session_keys = self.derive_session_keys(&new_key_exchange.combined_secret, session_id, &session.peer_id)?;

        // Update session
        session.session_key = new_session_keys.session_key;
        session.encryption_key = new_session_keys.encryption_key;
        session.authentication_key = new_session_keys.authentication_key;
        session.created_at = current_time;
        session.expires_at = current_time + self.config.session_key_lifetime.as_secs();
        session.key_exchange_info = KeyExchangeInfo {
            algorithm_used: new_key_exchange.quantum_component
                .as_ref()
                .map(|qc| qc.algorithm.clone())
                .unwrap_or(self.config.preferred_pqc_algorithm.clone()),
            signature_algorithm_used: Some(self.config.preferred_signature_algorithm.clone()),
            hybrid_mode: new_key_exchange.quantum_component.is_some(),
            fallback_used: new_key_exchange.fallback_used,
            key_exchange_time_ms: 0,
            security_score: self.calculate_security_score(&new_key_exchange),
        };

        // Update metrics
        {
            let mut metrics = self.performance_metrics.write().unwrap();
            metrics.key_exchange_count += 1;
        }

        // Log audit event
        self.log_audit_event(MessageAuditEvent {
            timestamp: current_time,
            event_type: MessageEventType::SessionRenewed,
            message_id: None,
            session_id: Some(session_id.to_string()),
            peer_id: Some(session.peer_id.clone()),
            details: {
                let mut details = HashMap::new();
                details.insert("new_security_level".to_string(), new_key_exchange.security_level.to_string());
                details.insert("hybrid_mode".to_string(), new_key_exchange.quantum_component.is_some().to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(())
    }

    /// Get session information
    pub fn get_session_info(&self, session_id: &str) -> Result<MessageSession, MessagingError> {
        let sessions = self.message_sessions.read().unwrap();
        sessions.get(session_id)
            .cloned()
            .ok_or_else(|| MessagingError::SessionNotFound(session_id.to_string()))
    }

    /// List active sessions
    pub fn list_active_sessions(&self) -> Result<Vec<MessageSession>, MessagingError> {
        let sessions = self.message_sessions.read().unwrap();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let active_sessions: Vec<MessageSession> = sessions
            .values()
            .filter(|session| session.is_active && session.expires_at > current_time)
            .cloned()
            .collect();

        Ok(active_sessions)
    }

    /// Get message queue statistics
    pub fn get_queue_stats(&self) -> Result<QueueStats, MessagingError> {
        let queue = self.message_queue.read().unwrap();
        Ok(queue.queue_stats.clone())
    }

    /// Get performance metrics
    pub fn get_performance_metrics(&self) -> Result<MessagingPerformanceMetrics, MessagingError> {
        let metrics = self.performance_metrics.read().unwrap();
        Ok(metrics.clone())
    }

    /// Get audit log
    pub fn get_audit_log(&self) -> Result<Vec<MessageAuditEvent>, MessagingError> {
        let log = self.audit_log.read().unwrap();
        Ok(log.clone())
    }

    /// Cleanup expired sessions and replay cache
    pub fn cleanup(&self) -> Result<u32, MessagingError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let mut cleaned_count = 0;

        // Clean expired sessions
        {
            let mut sessions = self.message_sessions.write().unwrap();
            let initial_count = sessions.len();
            
            sessions.retain(|_, session| {
                if session.expires_at <= current_time {
                    // Log session expiration
                    self.log_audit_event(MessageAuditEvent {
                        timestamp: current_time,
                        event_type: MessageEventType::SessionExpired,
                        message_id: None,
                        session_id: Some(session.session_id.clone()),
                        peer_id: Some(session.peer_id.clone()),
                        details: {
                            let mut details = HashMap::new();
                            details.insert("session_age_hours".to_string(), 
                                ((current_time - session.created_at) / 3600).to_string());
                            details.insert("message_count".to_string(), session.message_count.to_string());
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
            let window_start = current_time.saturating_sub(self.config.max_replay_window);
            
            let initial_count = replay_cache.len();
            replay_cache.retain(|_, &mut timestamp| timestamp > window_start);
            cleaned_count += initial_count - replay_cache.len();
        }

        // Clean message queue
        {
            let mut queue = self.message_queue.write().unwrap();
            
            // Clean failed messages older than 1 hour
            let failed_cutoff = current_time.saturating_sub(3600);
            let initial_failed = queue.failed_messages.len();
            queue.failed_messages.retain(|_, failed| failed.failed_at > failed_cutoff);
            cleaned_count += initial_failed - queue.failed_messages.len();
            
            // Clean completed messages older than 1 day
            let completed_cutoff = current_time.saturating_sub(86400);
            let initial_completed = queue.completed_messages.len();
            queue.completed_messages.retain(|_, completed| completed.completed_at > completed_cutoff);
            cleaned_count += initial_completed - queue.completed_messages.len();
        }

        Ok(cleaned_count as u32)
    }

    // Private helper methods
    fn get_or_create_session(&self, peer_id: &str) -> Result<String, MessagingError> {
        let peer_sessions = self.peer_sessions.read().unwrap();
        
        if let Some(session_id) = peer_sessions.get(peer_id) {
            // Check if session is still valid
            let sessions = self.message_sessions.read().unwrap();
            if let Some(session) = sessions.get(session_id) {
                let current_time = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                if session.expires_at > current_time {
                    return Ok(session_id.clone());
                }
            }
        }

        // Create new session
        self.establish_session(peer_id, None)
    }

    fn get_session(&self, session_id: &str) -> Result<MessageSession, MessagingError> {
        let sessions = self.message_sessions.read().unwrap();
        sessions.get(session_id)
            .cloned()
            .ok_or_else(|| MessagingError::SessionNotFound(session_id.to_string()))
    }

    fn encrypt_payload(&self, payload: &[u8], encryption_key: &[u8]) -> Result<(Vec<u8>, Vec<u8>), MessagingError> {
        if encryption_key.len() != 32 {
            return Err(MessagingError::EncryptionFailed(
                "Encryption key must be 32 bytes for AES-256-GCM".to_string()
            ));
        }

        let key = Key::from_slice(encryption_key);
        let cipher = Aes256Gcm::new(key);

        // Generate nonce
        let mut nonce_bytes = [0u8; 12];
        self.rng.fill(&mut nonce_bytes).map_err(|e| {
            MessagingError::EncryptionFailed(format!("Failed to generate nonce: {}", e))
        })?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt payload
        let ciphertext = cipher.encrypt(nonce, payload)
            .map_err(|e| MessagingError::EncryptionFailed(format!("AES-GCM encryption failed: {}", e)))?;

        Ok((ciphertext, nonce_bytes.to_vec()))
    }

    fn decrypt_payload(&self, ciphertext: &[u8], nonce: &[u8], encryption_key: &[u8]) -> Result<Vec<u8>, MessagingError> {
        if encryption_key.len() != 32 {
            return Err(MessagingError::DecryptionFailed(
                "Encryption key must be 32 bytes for AES-256-GCM".to_string()
            ));
        }

        if nonce.len() != 12 {
            return Err(MessagingError::DecryptionFailed(
                "Nonce must be 12 bytes for AES-256-GCM".to_string()
            ));
        }

        let key = Key::from_slice(encryption_key);
        let cipher = Aes256Gcm::new(key);
        let nonce = Nonce::from_slice(nonce);

        // Decrypt ciphertext
        let plaintext = cipher.decrypt(nonce, ciphertext)
            .map_err(|e| MessagingError::DecryptionFailed(format!("AES-GCM decryption failed: {}", e)))?;

        Ok(plaintext)
    }

    fn sign_message(&self, message_id: &str, message_type: MessageType, payload: &[u8], auth_key: &[u8]) -> Result<Vec<u8>, MessagingError> {
        // Create message hash
        let mut hasher = Sha3_256::new();
        hasher.update(message_id.as_bytes());
        hasher.update(format!("{:?}", message_type).as_bytes());
        hasher.update(payload);
        let message_hash = hasher.finalize();

        // Sign the hash
        let signature = self.signature_engine.sign(
            &message_hash,
            &self.config.preferred_signature_algorithm,
            auth_key,
        ).map_err(|e| {
            MessagingError::EncryptionFailed(format!("Signature generation failed: {}", e))
        })?;

        Ok(signature.signature_data)
    }

    fn verify_message(&self, message_id: &str, message_type: MessageType, payload: &[u8], signature: &[u8], auth_key: &[u8]) -> Result<bool, MessagingError> {
        // Create message hash
        let mut hasher = Sha3_256::new();
        hasher.update(message_id.as_bytes());
        hasher.update(format!("{:?}", message_type).as_bytes());
        hasher.update(payload);
        let message_hash = hasher.finalize();

        // Verify signature
        let verification_result = self.signature_engine.verify(
            &message_hash,
            signature,
            &self.config.preferred_signature_algorithm,
            auth_key,
        ).map_err(|e| {
            MessagingError::SignatureVerificationFailed(format!("Signature verification failed: {}", e))
        })?;

        Ok(verification_result.is_valid)
    }

    fn derive_session_keys(&self, shared_secret: &[u8], session_id: &str, peer_id: &str) -> Result<SessionKeys, MessagingError> {
        use sha3::{Digest, Sha3_256, Sha3_512};
        
        // Derive session key
        let mut session_key_hasher = Sha3_256::new();
        session_key_hasher.update(shared_secret);
        session_key_hasher.update(session_id.as_bytes());
        session_key_hasher.update(peer_id.as_bytes());
        session_key_hasher.update(b"session_key");
        let session_key = session_key_hasher.finalize().to_vec();

        // Derive encryption key
        let mut encryption_key_hasher = Sha3_256::new();
        encryption_key_hasher.update(shared_secret);
        encryption_key_hasher.update(session_id.as_bytes());
        encryption_key_hasher.update(peer_id.as_bytes());
        encryption_key_hasher.update(b"encryption_key");
        let encryption_key = encryption_key_hasher.finalize().to_vec();

        // Derive authentication key
        let mut auth_key_hasher = Sha3_512::new();
        auth_key_hasher.update(shared_secret);
        auth_key_hasher.update(session_id.as_bytes());
        auth_key_hasher.update(peer_id.as_bytes());
        auth_key_hasher.update(b"authentication_key");
        let authentication_key = auth_key_hasher.finalize().to_vec();

        Ok(SessionKeys {
            session_key,
            encryption_key,
            authentication_key,
        })
    }

    fn is_replay_attack(&self, message_id: &str, current_time: u64) -> Result<bool, MessagingError> {
        let replay_cache = self.replay_cache.read().unwrap();
        
        if let Some(&timestamp) = replay_cache.get(message_id) {
            // Check if within replay window
            if current_time.saturating_sub(timestamp) <= self.config.max_replay_window {
                return Ok(true);
            }
        }
        
        Ok(false)
    }

    fn verify_message_origin(&self, sender_id: &str, expected_peer_id: &str) -> Result<bool, MessagingError> {
        // Simplified origin verification
        // In a real implementation, this would involve proper peer identity verification
        Ok(sender_id == expected_peer_id)
    }

    fn queue_message(&self, message: EncryptedMessage) -> Result<(), MessagingError> {
        let mut queue = self.message_queue.write().unwrap();
        
        let queued_message = QueuedMessage {
            message: message.clone(),
            priority: message.routing_info.priority.clone(),
            queued_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            retry_count: 0,
            max_retries: 3,
            timeout: Duration::from_secs(30), // 30 second timeout
        };

        // Insert based on priority
        let mut inserted = false;
        for (i, existing_msg) in queue.pending_messages.iter().enumerate() {
            if queued_message.priority as i32 > existing_msg.priority as i32 {
                queue.pending_messages.insert(i, queued_message);
                inserted = true;
                break;
            }
        }

        if !inserted {
            queue.pending_messages.push_back(queued_message);
        }

        // Update queue stats
        queue.queue_stats.total_queued += 1;
        queue.queue_stats.current_queue_size = queue.pending_messages.len();
        if queue.queue_stats.current_queue_size > queue.queue_stats.peak_queue_size {
            queue.queue_stats.peak_queue_size = queue.queue_stats.current_queue_size;
        }

        Ok(())
    }

    fn start_message_processing(&self, message: &EncryptedMessage) -> Result<(), MessagingError> {
        let mut queue = self.message_queue.write().unwrap();
        
        let processing_message = ProcessingMessage {
            message: message.clone(),
            started_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            processing_steps: vec![
                ProcessingStep {
                    step_name: "decryption".to_string(),
                    started_at: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    completed_at: None,
                    status: ProcessingStatus::InProgress,
                    error_message: None,
                }
            ],
        };

        queue.processing_messages.insert(message.message_id.clone(), processing_message);
        Ok(())
    }

    fn complete_message_processing(
        &self,
        message_id: &str,
        decrypted_message: &DecryptedMessage,
        verification_result: VerificationResult,
    ) -> Result<(), MessagingError> {
        let mut queue = self.message_queue.write().unwrap();
        
        // Remove from processing
        queue.processing_messages.remove(message_id);
        
        // Add to completed
        let completed_message = CompletedMessage {
            message_id: message_id.to_string(),
            decrypted_message: decrypted_message.clone(),
            completed_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            processing_time_ms: decrypted_message.decryption_time_ms,
            verification_result,
        };

        queue.completed_messages.insert(message_id.to_string(), completed_message);
        
        // Update queue stats
        queue.queue_stats.total_processed += 1;
        queue.queue_stats.current_queue_size = queue.pending_messages.len();

        Ok(())
    }

    fn simulate_key_exchange(&self, peer_id: &str) -> Result<HybridKeyExchange, MessagingError> {
        // Simulate key exchange with the QKE engine
        let key_pair_result = self.qke_engine.generate_key_pair(self.config.preferred_pqc_algorithm.clone(), None);
        let (public_key, _) = key_pair_result.map_err(|e| {
            MessagingError::KeyExchangeFailed(format!("Failed to generate key pair: {}", e))
        })?;

        let classical_pk = if self.config.classical_fallback_enabled {
            Some(self.generate_classical_public_key()?)
        } else {
            None
        };

        let hybrid_result = self.qke_engine.hybrid_key_exchange(&public_key, classical_pk, None);
        hybrid_result.map_err(|e| {
            MessagingError::KeyExchangeFailed(format!("Hybrid key exchange failed: {}", e))
        })
    }

    fn generate_classical_public_key(&self) -> Result<Vec<u8>, MessagingError> {
        let mut classical_key = vec![0u8; 32];
        self.rng.fill(&mut classical_key).map_err(|e| {
            MessagingError::InternalError(format!("Failed to generate classical public key: {}", e))
        })?;
        Ok(classical_key)
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

    fn calculate_security_score(&self, key_exchange: &HybridKeyExchange) -> u32 {
        let mut score = 50; // Base score

        // Add points for quantum resistance
        if key_exchange.quantum_component.is_some() {
            score += 30;
        }

        // Add points for security level
        score += key_exchange.security_level / 4;

        // Subtract points for fallback usage
        if key_exchange.fallback_used {
            score -= 20;
        }

        // Ensure score is within bounds
        score.max(0).min(100)
    }

    fn calculate_message_security_score(&self, message: &DecryptedMessage) -> u32 {
        let mut score = 50; // Base score

        // Add points for verification
        if message.is_verified {
            score += 20;
        }

        // Add points for integrity
        if message.is_intact {
            score += 15;
        }

        // Add points for origin verification
        if message.security_context.origin_verified {
            score += 10;
        }

        // Add points for security level
        score += message.security_context.security_level / 8;

        // Ensure score is within bounds
        score.max(0).min(100)
    }

    fn log_audit_event(&self, event: MessageAuditEvent) {
        let mut log = self.audit_log.write().unwrap();
        log.push(event);
        
        // Keep only last 1000 events
        if log.len() > 1000 {
            log.drain(0..log.len() - 1000);
        }

        // Update security metrics
        if matches!(event.event_type, MessageEventType::SecurityEvent | MessageEventType::Error) {
            let mut metrics = self.performance_metrics.write().unwrap();
            metrics.security_violations += 1;
        }
    }
}

#[derive(Debug, Clone)]
struct SessionKeys {
    session_key: Vec<u8>,
    encryption_key: Vec<u8>,
    authentication_key: Vec<u8>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_messaging_engine_creation() {
        let config = MessageConfig {
            messaging_mode: MessagingMode::Hybrid,
            preferred_pqc_algorithm: QkeAlgorithm::Kyber768,
            preferred_signature_algorithm: SignatureAlgorithm::Dilithium2,
            classical_fallback_enabled: true,
            message_lifetime: Duration::from_secs(3600),
            session_key_lifetime: Duration::from_secs(1800),
            max_message_size: 1024 * 1024, // 1MB
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            max_replay_window: 300, // 5 minutes
            security_parameters: MessageSecurityParameters {
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
                    MessageType::Heartbeat,
                ]),
            },
        };

        let engine = QuantumMessagingEngine::new(config);
        assert!(engine.is_ok());
    }

    #[test]
    fn test_session_establishment() {
        let config = MessageConfig {
            messaging_mode: MessagingMode::Hybrid,
            preferred_pqc_algorithm: QkeAlgorithm::Kyber768,
            preferred_signature_algorithm: SignatureAlgorithm::Dilithium2,
            classical_fallback_enabled: true,
            message_lifetime: Duration::from_secs(3600),
            session_key_lifetime: Duration::from_secs(1800),
            max_message_size: 1024 * 1024,
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            max_replay_window: 300,
            security_parameters: MessageSecurityParameters {
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
                    MessageType::Heartbeat,
                ]),
            },
        };

        let engine = QuantumMessagingEngine::new(config).unwrap();
        let session_id = engine.establish_session("peer1", None);
        assert!(session_id.is_ok());
        
        let session_id = session_id.unwrap();
        let session_info = engine.get_session_info(&session_id);
        assert!(session_info.is_ok());
    }

    #[test]
    fn test_message_encryption_decryption() {
        let config = MessageConfig {
            messaging_mode: MessagingMode::Hybrid,
            preferred_pqc_algorithm: QkeAlgorithm::Kyber768,
            preferred_signature_algorithm: SignatureAlgorithm::Dilithium2,
            classical_fallback_enabled: true,
            message_lifetime: Duration::from_secs(3600),
            session_key_lifetime: Duration::from_secs(1800),
            max_message_size: 1024 * 1024,
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            max_replay_window: 300,
            security_parameters: MessageSecurityParameters {
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
                    MessageType::Heartbeat,
                ]),
            },
        };

        let engine = QuantumMessagingEngine::new(config).unwrap();
        let session_id = engine.establish_session("peer1", None).unwrap();
        
        let test_payload = b"Hello, quantum world!";
        let message_id = engine.send_message(
            "peer1",
            MessageType::Heartbeat,
            test_payload,
            MessagePriority::Normal,
            DeliveryGuarantee::AtLeastOnce,
        ).unwrap();

        // Get the encrypted message from the queue (simplified for testing)
        let queue = engine.message_queue.read().unwrap();
        let queued_message = queue.pending_messages.front().unwrap();
        let encrypted_message = queued_message.message.clone();

        // Decrypt the message
        let decrypted_result = engine.receive_message(encrypted_message);
        assert!(decrypted_result.is_ok());
        
        let decrypted_message = decrypted_result.unwrap();
        assert_eq!(decrypted_message.payload, test_payload);
        assert_eq!(decrypted_message.message_id, message_id);
    }

    #[test]
    fn test_replay_protection() {
        let config = MessageConfig {
            messaging_mode: MessagingMode::Hybrid,
            preferred_pqc_algorithm: QkeAlgorithm::Kyber768,
            preferred_signature_algorithm: SignatureAlgorithm::Dilithium2,
            classical_fallback_enabled: true,
            message_lifetime: Duration::from_secs(3600),
            session_key_lifetime: Duration::from_secs(1800),
            max_message_size: 1024 * 1024,
            enable_compression: false,
            enable_forward_secrecy: true,
            enable_replay_protection: true,
            max_replay_window: 300,
            security_parameters: MessageSecurityParameters {
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
                    MessageType::Heartbeat,
                ]),
            },
        };

        let engine = QuantumMessagingEngine::new(config).unwrap();
        let session_id = engine.establish_session("peer1", None).unwrap();
        
        let test_payload = b"Test message for replay protection";
        let message_id = engine.send_message(
            "peer1",
            MessageType::Heartbeat,
            test_payload,
            MessagePriority::Normal,
            DeliveryGuarantee::AtLeastOnce,
        ).unwrap();

        // Get the encrypted message
        let queue = engine.message_queue.read().unwrap();
        let queued_message = queue.pending_messages.front().unwrap();
        let encrypted_message = queued_message.message.clone();

        // First decryption should succeed
        let first_result = engine.receive_message(encrypted_message.clone());
        assert!(first_result.is_ok());

        // Second decryption should fail due to replay protection
        let second_result = engine.receive_message(encrypted_message);
        assert!(second_result.is_err());
        assert!(matches!(second_result.unwrap_err(), MessagingError::ReplayDetected(_)));
    }
}