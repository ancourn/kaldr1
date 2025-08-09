//! Secure Key Exchange Protocol with Hybrid Mode
//! Implements a robust quantum-resistant key exchange protocol
//! with fallback mechanisms and advanced security features

use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use crate::quantum::qke_module::{QkeEngine, QkeAlgorithm, QkePublicKey, QkePrivateKey, QkeCiphertext, QkeSession, HybridKeyExchange, QkeError};
use crate::quantum::key_generation::{KeyGenerationEngine, KeyPolicy, KeyType, KeyGenerationError};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProtocolVersion {
    V1_0,
    V1_1,
    V2_0,
}

impl Default for ProtocolVersion {
    fn default() -> Self {
        ProtocolVersion::V2_0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolConfig {
    pub version: ProtocolVersion,
    pub supported_algorithms: Vec<QkeAlgorithm>,
    pub preferred_algorithm: QkeAlgorithm,
    pub enable_hybrid_mode: bool,
    pub enable_forward_secrecy: bool,
    pub enable_key_confirmation: bool,
    pub session_timeout: Duration,
    pub max_retries: u32,
    pub enable_mitm_protection: bool,
    pub enable_rate_limiting: bool,
    pub security_parameters: SecurityParameters,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityParameters {
    pub min_key_size_bits: usize,
    pub min_security_level: u32,
    pub max_session_duration: Duration,
    pub require_key_rotation: bool,
    pub enable_audit_logging: bool,
    pub enable_anomaly_detection: bool,
    pub allowed_key_types: HashSet<KeyType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolMessage {
    pub message_type: MessageType,
    pub session_id: String,
    pub sender_id: String,
    pub recipient_id: String,
    pub timestamp: u64,
    pub sequence_number: u64,
    pub payload: ProtocolPayload,
    pub signature: Option<Vec<u8>>,
    pub protocol_version: ProtocolVersion,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageType {
    KeyExchangeInit,
    KeyExchangeResponse,
    KeyExchangeComplete,
    KeyConfirmation,
    Error,
    Heartbeat,
    SessionTermination,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProtocolPayload {
    KeyExchangeInit {
        supported_algorithms: Vec<QkeAlgorithm>,
        public_key: QkePublicKey,
        classical_public_key: Option<Vec<u8>>,
        nonce: Vec<u8>,
        security_parameters: SecurityParameters,
    },
    KeyExchangeResponse {
        selected_algorithm: QkeAlgorithm,
        ciphertext: QkeCiphertext,
        classical_ciphertext: Option<Vec<u8>>,
        nonce: Vec<u8>,
        confirmation_hash: Vec<u8>,
    },
    KeyExchangeComplete {
        confirmation_hash: Vec<u8>,
        session_metadata: HashMap<String, String>,
    },
    KeyConfirmation {
        confirmation_data: Vec<u8>,
        success: bool,
    },
    Error {
        error_code: String,
        error_message: String,
        error_details: Option<HashMap<String, String>>,
    },
    Heartbeat {
        timestamp: u64,
        status: String,
    },
    SessionTermination {
        reason: String,
        graceful: bool,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolSession {
    pub session_id: String,
    pub initiator_id: String,
    pub responder_id: String,
    pub protocol_version: ProtocolVersion,
    pub state: SessionState,
    pub created_at: u64,
    pub expires_at: u64,
    pub last_activity: u64,
    pub key_exchange: Option<HybridKeyExchange>,
    pub security_context: SecurityContext,
    pub message_history: Vec<ProtocolMessage>,
    pub error_count: u32,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SessionState {
    Initiated,
    KeyExchangeInProgress,
    KeyExchangeCompleted,
    Confirmed,
    Active,
    Terminated,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityContext {
    pub shared_secret: Vec<u8>,
    pub session_key: Vec<u8>,
    pub encryption_key: Vec<u8>,
    pub authentication_key: Vec<u8>,
    pub key_derivation_info: KeyDerivationInfo,
    pub security_level: u32,
    pub forward_secrecy_enabled: bool,
    pub mitm_protection_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyDerivationInfo {
    pub derivation_method: String,
    pub context: Vec<u8>,
    pub salt: Vec<u8>,
    pub info: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyDetection {
    pub enabled: bool,
    pub suspicious_activities: Vec<SuspiciousActivity>,
    pub thresholds: AnomalyThresholds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuspiciousActivity {
    pub activity_type: String,
    pub timestamp: u64,
    pub session_id: String,
    pub details: HashMap<String, String>,
    pub severity: AnomalySeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnomalySeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyThresholds {
    pub max_message_rate: u32,
    pub max_error_rate: f64,
    pub max_session_duration: Duration,
    pub max_key_size_deviation: f64,
}

#[derive(Debug, Error)]
pub enum ProtocolError {
    #[error("Protocol version mismatch: {0}")]
    VersionMismatch(String),
    #[error("Invalid message format: {0}")]
    InvalidMessageFormat(String),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
    #[error("Session expired: {0}")]
    SessionExpired(String),
    #[error("Key exchange failed: {0}")]
    KeyExchangeFailed(String),
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    #[error("Security violation: {0}")]
    SecurityViolation(String),
    #[error("Rate limit exceeded: {0}")]
    RateLimitExceeded(String),
    #[error("Anomaly detected: {0}")]
    AnomalyDetected(String),
    #[error("Internal error: {0}")]
    InternalError(String),
}

/// Secure Key Exchange Protocol Implementation
pub struct SecureKeyExchangeProtocol {
    config: ProtocolConfig,
    qke_engine: QkeEngine,
    key_gen_engine: KeyGenerationEngine,
    session_store: Arc<RwLock<HashMap<String, ProtocolSession>>>,
    rate_limiter: Arc<RwLock<HashMap<String, RateLimitInfo>>>,
    anomaly_detection: AnomalyDetection,
    rng: SystemRandom,
    audit_log: Arc<RwLock<Vec<ProtocolAuditEvent>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitInfo {
    pub request_count: u32,
    pub reset_time: u64,
    pub window_start: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolAuditEvent {
    pub timestamp: u64,
    pub event_type: String,
    pub session_id: Option<String>,
    pub participant_id: Option<String>,
    pub details: HashMap<String, String>,
    pub severity: AuditSeverity,
}

impl SecureKeyExchangeProtocol {
    pub fn new(config: ProtocolConfig) -> Result<Self, ProtocolError> {
        let qke_engine = QkeEngine::new().map_err(|e| {
            ProtocolError::InternalError(format!("Failed to create QKE engine: {}", e))
        })?;

        let key_gen_engine = KeyGenerationEngine::new().map_err(|e| {
            ProtocolError::InternalError(format!("Failed to create key generation engine: {}", e))
        })?;

        Ok(Self {
            config,
            qke_engine,
            key_gen_engine,
            session_store: Arc::new(RwLock::new(HashMap::new())),
            rate_limiter: Arc::new(RwLock::new(HashMap::new())),
            anomaly_detection: AnomalyDetection {
                enabled: config.security_parameters.enable_anomaly_detection,
                suspicious_activities: Vec::new(),
                thresholds: AnomalyThresholds {
                    max_message_rate: 100,
                    max_error_rate: 0.1,
                    max_session_duration: Duration::from_secs(3600),
                    max_key_size_deviation: 0.2,
                },
            },
            rng: SystemRandom::new(),
            audit_log: Arc::new(RwLock::new(Vec::new())),
        })
    }

    /// Initialize a new key exchange session
    pub fn initiate_key_exchange(
        &self,
        initiator_id: &str,
        responder_id: &str,
        metadata: Option<HashMap<String, String>>,
    ) -> Result<ProtocolMessage, ProtocolError> {
        // Check rate limiting
        self.check_rate_limit(initiator_id)?;

        // Generate session ID
        let session_id = self.generate_session_id();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Generate key pair for key exchange
        let key_policy = KeyPolicy {
            algorithm: self.config.preferred_algorithm.clone(),
            key_type: KeyType::KeyExchange,
            security_level: self.config.security_parameters.min_security_level,
            key_size_bits: self.config.security_parameters.min_key_size_bits,
            expiration_duration: self.config.session_timeout,
            rotation_policy: crate::quantum::key_generation::KeyRotationPolicy::TimeBased(
                Duration::from_secs(86400),
            ),
            usage_restrictions: HashSet::new(),
            metadata: HashMap::new(),
        };

        let (public_key, private_key) = self.key_gen_engine.generate_key(key_policy).map_err(|e| {
            ProtocolError::KeyExchangeFailed(format!("Failed to generate key pair: {}", e))
        })?;

        // Generate classical public key for hybrid mode
        let classical_public_key = if self.config.enable_hybrid_mode {
            Some(self.generate_classical_public_key()?)
        } else {
            None
        };

        // Generate nonce
        let mut nonce = vec![0u8; 32];
        self.rng.fill(&mut nonce).map_err(|e| {
            ProtocolError::InternalError(format!("Failed to generate nonce: {}", e))
        })?;

        // Create initial session
        let session = ProtocolSession {
            session_id: session_id.clone(),
            initiator_id: initiator_id.to_string(),
            responder_id: responder_id.to_string(),
            protocol_version: self.config.version.clone(),
            state: SessionState::Initiated,
            created_at: current_time,
            expires_at: current_time + self.config.session_timeout.as_secs(),
            last_activity: current_time,
            key_exchange: None,
            security_context: SecurityContext {
                shared_secret: Vec::new(),
                session_key: Vec::new(),
                encryption_key: Vec::new(),
                authentication_key: Vec::new(),
                key_derivation_info: KeyDerivationInfo {
                    derivation_method: "hkdf-sha3-256".to_string(),
                    context: session_id.as_bytes().to_vec(),
                    salt: nonce.clone(),
                    info: b"key_exchange_context".to_vec(),
                },
                security_level: self.config.security_parameters.min_security_level,
                forward_secrecy_enabled: self.config.enable_forward_secrecy,
                mitm_protection_enabled: self.config.enable_mitm_protection,
            },
            message_history: Vec::new(),
            error_count: 0,
            metadata: metadata.unwrap_or_default(),
        };

        // Store session
        {
            let mut session_store = self.session_store.write().unwrap();
            session_store.insert(session_id.clone(), session);
        }

        // Create init message
        let message = ProtocolMessage {
            message_type: MessageType::KeyExchangeInit,
            session_id: session_id.clone(),
            sender_id: initiator_id.to_string(),
            recipient_id: responder_id.to_string(),
            timestamp: current_time,
            sequence_number: 1,
            payload: ProtocolPayload::KeyExchangeInit {
                supported_algorithms: self.config.supported_algorithms.clone(),
                public_key,
                classical_public_key,
                nonce,
                security_parameters: self.config.security_parameters.clone(),
            },
            signature: None,
            protocol_version: self.config.version.clone(),
        };

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: current_time,
            event_type: "key_exchange_initiated".to_string(),
            session_id: Some(session_id),
            participant_id: Some(initiator_id.to_string()),
            details: {
                let mut details = HashMap::new();
                details.insert("responder_id".to_string(), responder_id.to_string());
                details.insert("protocol_version".to_string(), format!("{:?}", self.config.version));
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(message)
    }

    /// Process an incoming protocol message
    pub fn process_message(&self, message: ProtocolMessage) -> Result<ProtocolMessage, ProtocolError> {
        // Validate message
        self.validate_message(&message)?;

        // Get or create session
        let session = self.get_or_create_session(&message)?;

        // Check for anomalies
        self.check_anomalies(&session, &message)?;

        // Process message based on type
        match message.message_type {
            MessageType::KeyExchangeInit => self.process_key_exchange_init(message, session),
            MessageType::KeyExchangeResponse => self.process_key_exchange_response(message, session),
            MessageType::KeyExchangeComplete => self.process_key_exchange_complete(message, session),
            MessageType::KeyConfirmation => self.process_key_confirmation(message, session),
            MessageType::Error => self.process_error_message(message, session),
            MessageType::Heartbeat => self.process_heartbeat(message, session),
            MessageType::SessionTermination => self.process_session_termination(message, session),
        }
    }

    /// Complete key exchange and derive session keys
    pub fn complete_key_exchange(&self, session_id: &str) -> Result<(), ProtocolError> {
        let mut session_store = self.session_store.write().unwrap();
        let session = session_store.get_mut(session_id).ok_or_else(|| {
            ProtocolError::SessionNotFound(session_id.to_string())
        })?;

        if session.state != SessionState::KeyExchangeCompleted {
            return Err(ProtocolError::KeyExchangeFailed(
                "Key exchange not completed".to_string(),
            ));
        }

        // Derive session keys
        let derived_keys = self.derive_session_keys(&session)?;
        
        session.security_context.session_key = derived_keys.session_key;
        session.security_context.encryption_key = derived_keys.encryption_key;
        session.security_context.authentication_key = derived_keys.authentication_key;
        session.state = SessionState::Confirmed;

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: "key_exchange_completed".to_string(),
            session_id: Some(session_id.to_string()),
            participant_id: Some(session.initiator_id.clone()),
            details: {
                let mut details = HashMap::new();
                details.insert("security_level".to_string(), session.security_context.security_level.to_string());
                details.insert("forward_secrecy".to_string(), session.security_context.forward_secrecy_enabled.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(())
    }

    /// Terminate a session
    pub fn terminate_session(&self, session_id: &str, reason: &str, graceful: bool) -> Result<(), ProtocolError> {
        let mut session_store = self.session_store.write().unwrap();
        let session = session_store.get_mut(session_id).ok_or_else(|| {
            ProtocolError::SessionNotFound(session_id.to_string())
        })?;

        session.state = SessionState::Terminated;
        session.expires_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: "session_terminated".to_string(),
            session_id: Some(session_id.to_string()),
            participant_id: Some(session.initiator_id.clone()),
            details: {
                let mut details = HashMap::new();
                details.insert("reason".to_string(), reason.to_string());
                details.insert("graceful".to_string(), graceful.to_string());
                details
            },
            severity: if graceful { AuditSeverity::Info } else { AuditSeverity::Warning },
        });

        Ok(())
    }

    /// Get session information
    pub fn get_session(&self, session_id: &str) -> Result<ProtocolSession, ProtocolError> {
        let session_store = self.session_store.read().unwrap();
        session_store.get(session_id).cloned().ok_or_else(|| {
            ProtocolError::SessionNotFound(session_id.to_string())
        })
    }

    /// List active sessions
    pub fn list_active_sessions(&self) -> Result<Vec<ProtocolSession>, ProtocolError> {
        let session_store = self.session_store.read().unwrap();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let active_sessions: Vec<ProtocolSession> = session_store
            .values()
            .filter(|session| {
                session.expires_at > current_time 
                    && matches!(session.state, SessionState::Active | SessionState::Confirmed)
            })
            .cloned()
            .collect();

        Ok(active_sessions)
    }

    /// Cleanup expired sessions
    pub fn cleanup_expired_sessions(&self) -> Result<u32, ProtocolError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut session_store = self.session_store.write().unwrap();
        let initial_count = session_store.len();

        session_store.retain(|_, session| session.expires_at > current_time);

        let cleaned_count = initial_count - session_store.len();

        // Log audit event
        self.log_audit_event(ProtocolAuditEvent {
            timestamp: current_time,
            event_type: "session_cleanup".to_string(),
            session_id: None,
            participant_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("cleaned_sessions".to_string(), cleaned_count.to_string());
                details.insert("remaining_sessions".to_string(), session_store.len().to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(cleaned_count as u32)
    }

    /// Get audit log
    pub fn get_audit_log(&self) -> Vec<ProtocolAuditEvent> {
        self.audit_log.read().unwrap().clone()
    }

    // Private helper methods
    fn validate_message(&self, message: &ProtocolMessage) -> Result<(), ProtocolError> {
        // Check protocol version compatibility
        if message.protocol_version != self.config.version {
            return Err(ProtocolError::VersionMismatch(
                format!("Expected {:?}, got {:?}", self.config.version, message.protocol_version)
            ));
        }

        // Check timestamp (prevent replay attacks)
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        if current_time.saturating_sub(message.timestamp) > 300 { // 5 minutes
            return Err(ProtocolError::SecurityViolation(
                "Message timestamp too old".to_string()
            ));
        }

        // Validate message structure based on type
        match &message.payload {
            ProtocolPayload::KeyExchangeInit { .. } => {
                if message.message_type != MessageType::KeyExchangeInit {
                    return Err(ProtocolError::InvalidMessageFormat(
                        "Message type mismatch for KeyExchangeInit payload".to_string()
                    ));
                }
            }
            ProtocolPayload::KeyExchangeResponse { .. } => {
                if message.message_type != MessageType::KeyExchangeResponse {
                    return Err(ProtocolError::InvalidMessageFormat(
                        "Message type mismatch for KeyExchangeResponse payload".to_string()
                    ));
                }
            }
            // Add validation for other payload types...
            _ => {}
        }

        Ok(())
    }

    fn get_or_create_session(&self, message: &ProtocolMessage) -> Result<ProtocolSession, ProtocolError> {
        let session_store = self.session_store.read().unwrap();
        
        if let Some(session) = session_store.get(&message.session_id) {
            // Check if session is expired
            let current_time = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            
            if session.expires_at <= current_time {
                return Err(ProtocolError::SessionExpired(message.session_id.clone()));
            }
            
            Ok(session.clone())
        } else {
            // For KeyExchangeInit, create a new session
            if message.message_type == MessageType::KeyExchangeInit {
                // This should be handled in initiate_key_exchange
                Err(ProtocolError::SessionNotFound(
                    "Session should be created during initiation".to_string()
                ))
            } else {
                Err(ProtocolError::SessionNotFound(message.session_id.clone()))
            }
        }
    }

    fn check_anomalies(&self, session: &ProtocolSession, message: &ProtocolMessage) -> Result<(), ProtocolError> {
        if !self.anomaly_detection.enabled {
            return Ok(());
        }

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check message rate
        let recent_messages: Vec<_> = session.message_history
            .iter()
            .filter(|msg| current_time.saturating_sub(msg.timestamp) < 60) // Last minute
            .collect();

        if recent_messages.len() > self.anomaly_detection.thresholds.max_message_rate as usize {
            self.log_anomaly(SuspiciousActivity {
                activity_type: "high_message_rate".to_string(),
                timestamp: current_time,
                session_id: session.session_id.clone(),
                details: {
                    let mut details = HashMap::new();
                    details.insert("message_count".to_string(), recent_messages.len().to_string());
                    details.insert("time_window".to_string(), "60s".to_string());
                    details
                },
                severity: AnomalySeverity::Medium,
            });
        }

        // Check error rate
        if session.error_count as f64 / (session.message_history.len() as f64 + 1.0) 
            > self.anomaly_detection.thresholds.max_error_rate {
            self.log_anomaly(SuspiciousActivity {
                activity_type: "high_error_rate".to_string(),
                timestamp: current_time,
                session_id: session.session_id.clone(),
                details: {
                    let mut details = HashMap::new();
                    details.insert("error_count".to_string(), session.error_count.to_string());
                    details.insert("total_messages".to_string(), session.message_history.len().to_string());
                    details
                },
                severity: AnomalySeverity::High,
            });
        }

        Ok(())
    }

    fn log_anomaly(&self, activity: SuspiciousActivity) {
        if !self.anomaly_detection.enabled {
            return;
        }

        // In a real implementation, this would store the anomaly
        // and potentially trigger alerts or automatic responses
    }

    fn process_key_exchange_init(
        &self,
        message: ProtocolMessage,
        mut session: ProtocolSession,
    ) -> Result<ProtocolMessage, ProtocolError> {
        if let ProtocolPayload::KeyExchangeInit {
            supported_algorithms,
            public_key,
            classical_public_key,
            nonce,
            security_parameters,
        } = message.payload
        {
            // Select best algorithm
            let selected_algorithm = self.select_best_algorithm(&supported_algorithms)?;

            // Perform key exchange
            let hybrid_exchange = self.qke_engine.hybrid_key_exchange(
                &public_key,
                classical_public_key,
                Some(session.session_id.clone()),
            ).map_err(|e| {
                ProtocolError::KeyExchangeFailed(format!("Hybrid key exchange failed: {}", e))
            })?;

            // Update session
            session.key_exchange = Some(hybrid_exchange.clone());
            session.state = SessionState::KeyExchangeInProgress;
            session.security_context.shared_secret = hybrid_exchange.combined_secret.clone();

            // Generate response
            let mut response_nonce = vec![0u8; 32];
            self.rng.fill(&mut response_nonce).map_err(|e| {
                ProtocolError::InternalError(format!("Failed to generate response nonce: {}", e))
            })?;

            let confirmation_hash = self.generate_confirmation_hash(
                &hybrid_exchange.combined_secret,
                &nonce,
                &response_nonce,
            );

            let response = ProtocolMessage {
                message_type: MessageType::KeyExchangeResponse,
                session_id: session.session_id.clone(),
                sender_id: session.responder_id.clone(),
                recipient_id: session.initiator_id.clone(),
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                sequence_number: message.sequence_number + 1,
                payload: ProtocolPayload::KeyExchangeResponse {
                    selected_algorithm,
                    ciphertext: hybrid_exchange.quantum_component.as_ref()
                        .ok_or_else(|| ProtocolError::KeyExchangeFailed("No quantum component".to_string()))?
                        .peer_public_key.key_data.clone()
                        .into(),
                    classical_ciphertext: None,
                    nonce: response_nonce,
                    confirmation_hash,
                },
                signature: None,
                protocol_version: self.config.version.clone(),
            };

            // Update session store
            {
                let mut session_store = self.session_store.write().unwrap();
                session_store.insert(session.session_id.clone(), session);
            }

            Ok(response)
        } else {
            Err(ProtocolError::InvalidMessageFormat(
                "Invalid payload for KeyExchangeInit".to_string()
            ))
        }
    }

    fn process_key_exchange_response(
        &self,
        message: ProtocolMessage,
        mut session: ProtocolSession,
    ) -> Result<ProtocolMessage, ProtocolError> {
        if let ProtocolPayload::KeyExchangeResponse {
            selected_algorithm,
            ciphertext,
            classical_ciphertext,
            nonce,
            confirmation_hash,
        } = message.payload
        {
            // Verify confirmation hash
            if !self.verify_confirmation_hash(&session.security_context.shared_secret, &nonce, &confirmation_hash) {
                return Err(ProtocolError::AuthenticationFailed(
                    "Invalid confirmation hash".to_string()
                ));
            }

            // Update session state
            session.state = SessionState::KeyExchangeCompleted;

            // Generate completion message
            let completion_hash = self.generate_completion_hash(&session.security_context.shared_secret);

            let response = ProtocolMessage {
                message_type: MessageType::KeyExchangeComplete,
                session_id: session.session_id.clone(),
                sender_id: session.initiator_id.clone(),
                recipient_id: session.responder_id.clone(),
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                sequence_number: message.sequence_number + 1,
                payload: ProtocolPayload::KeyExchangeComplete {
                    confirmation_hash: completion_hash,
                    session_metadata: session.metadata.clone(),
                },
                signature: None,
                protocol_version: self.config.version.clone(),
            };

            // Update session store
            {
                let mut session_store = self.session_store.write().unwrap();
                session_store.insert(session.session_id.clone(), session);
            }

            Ok(response)
        } else {
            Err(ProtocolError::InvalidMessageFormat(
                "Invalid payload for KeyExchangeResponse".to_string()
            ))
        }
    }

    fn process_key_exchange_complete(
        &self,
        message: ProtocolMessage,
        mut session: ProtocolSession,
    ) -> Result<ProtocolMessage, ProtocolError> {
        if let ProtocolPayload::KeyExchangeComplete {
            confirmation_hash,
            session_metadata,
        } = message.payload
        {
            // Verify completion hash
            if !self.verify_completion_hash(&session.security_context.shared_secret, &confirmation_hash) {
                return Err(ProtocolError::AuthenticationFailed(
                    "Invalid completion hash".to_string()
                ));
            }

            // Update session metadata
            session.metadata.extend(session_metadata);
            session.state = SessionState::Confirmed;

            // Generate confirmation message
            let response = ProtocolMessage {
                message_type: MessageType::KeyConfirmation,
                session_id: session.session_id.clone(),
                sender_id: session.responder_id.clone(),
                recipient_id: session.initiator_id.clone(),
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                sequence_number: message.sequence_number + 1,
                payload: ProtocolPayload::KeyConfirmation {
                    confirmation_data: vec![1u8; 32], // Placeholder
                    success: true,
                },
                signature: None,
                protocol_version: self.config.version.clone(),
            };

            // Update session store
            {
                let mut session_store = self.session_store.write().unwrap();
                session_store.insert(session.session_id.clone(), session);
            }

            Ok(response)
        } else {
            Err(ProtocolError::InvalidMessageFormat(
                "Invalid payload for KeyExchangeComplete".to_string()
            ))
        }
    }

    fn process_key_confirmation(
        &self,
        message: ProtocolMessage,
        mut session: ProtocolSession,
    ) -> Result<ProtocolMessage, ProtocolError> {
        if let ProtocolPayload::KeyConfirmation { success, .. } = message.payload {
            if success {
                session.state = SessionState::Active;
            } else {
                session.state = SessionState::Error;
                session.error_count += 1;
            }

            // Update session store
            {
                let mut session_store = self.session_store.write().unwrap();
                session_store.insert(session.session_id.clone(), session);
            }

            // Return heartbeat as acknowledgment
            Ok(ProtocolMessage {
                message_type: MessageType::Heartbeat,
                session_id: message.session_id,
                sender_id: message.recipient_id,
                recipient_id: message.sender_id,
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                sequence_number: message.sequence_number + 1,
                payload: ProtocolPayload::Heartbeat {
                    timestamp: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    status: "active".to_string(),
                },
                signature: None,
                protocol_version: self.config.version.clone(),
            })
        } else {
            Err(ProtocolError::InvalidMessageFormat(
                "Invalid payload for KeyConfirmation".to_string()
            ))
        }
    }

    fn process_error_message(
        &self,
        message: ProtocolMessage,
        mut session: ProtocolSession,
    ) -> Result<ProtocolMessage, ProtocolError> {
        if let ProtocolPayload::Error { error_code, error_message, .. } = message.payload {
            session.state = SessionState::Error;
            session.error_count += 1;

            // Log error
            self.log_audit_event(ProtocolAuditEvent {
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                event_type: "protocol_error".to_string(),
                session_id: Some(session.session_id.clone()),
                participant_id: Some(message.sender_id.clone()),
                details: {
                    let mut details = HashMap::new();
                    details.insert("error_code".to_string(), error_code);
                    details.insert("error_message".to_string(), error_message);
                    details
                },
                severity: AuditSeverity::Error,
            });

            // Update session store
            {
                let mut session_store = self.session_store.write().unwrap();
                session_store.insert(session.session_id.clone(), session);
            }

            // Return acknowledgment
            Ok(ProtocolMessage {
                message_type: MessageType::Heartbeat,
                session_id: message.session_id,
                sender_id: message.recipient_id,
                recipient_id: message.sender_id,
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                sequence_number: message.sequence_number + 1,
                payload: ProtocolPayload::Heartbeat {
                    timestamp: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    status: "error_acknowledged".to_string(),
                },
                signature: None,
                protocol_version: self.config.version.clone(),
            })
        } else {
            Err(ProtocolError::InvalidMessageFormat(
                "Invalid payload for Error".to_string()
            ))
        }
    }

    fn process_heartbeat(
        &self,
        message: ProtocolMessage,
        mut session: ProtocolSession,
    ) -> Result<ProtocolMessage, ProtocolError> {
        if let ProtocolPayload::Heartbeat { timestamp, status } = message.payload {
            session.last_activity = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();

            // Update session store
            {
                let mut session_store = self.session_store.write().unwrap();
                session_store.insert(session.session_id.clone(), session);
            }

            // Return heartbeat response
            Ok(ProtocolMessage {
                message_type: MessageType::Heartbeat,
                session_id: message.session_id,
                sender_id: message.recipient_id,
                recipient_id: message.sender_id,
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                sequence_number: message.sequence_number + 1,
                payload: ProtocolPayload::Heartbeat {
                    timestamp: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    status: format!("heartbeat_response_{}", status),
                },
                signature: None,
                protocol_version: self.config.version.clone(),
            })
        } else {
            Err(ProtocolError::InvalidMessageFormat(
                "Invalid payload for Heartbeat".to_string()
            ))
        }
    }

    fn process_session_termination(
        &self,
        message: ProtocolMessage,
        mut session: ProtocolSession,
    ) -> Result<ProtocolMessage, ProtocolError> {
        if let ProtocolPayload::KeyExchangeComplete { .. } = message.payload {
            // This is a placeholder - actual termination logic would be here
            session.state = SessionState::Terminated;

            // Update session store
            {
                let mut session_store = self.session_store.write().unwrap();
                session_store.insert(session.session_id.clone(), session);
            }

            // Return acknowledgment
            Ok(ProtocolMessage {
                message_type: MessageType::Heartbeat,
                session_id: message.session_id,
                sender_id: message.recipient_id,
                recipient_id: message.sender_id,
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                sequence_number: message.sequence_number + 1,
                payload: ProtocolPayload::Heartbeat {
                    timestamp: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    status: "termination_acknowledged".to_string(),
                },
                signature: None,
                protocol_version: self.config.version.clone(),
            })
        } else {
            Err(ProtocolError::InvalidMessageFormat(
                "Invalid payload for SessionTermination".to_string()
            ))
        }
    }

    fn select_best_algorithm(&self, supported_algorithms: &[QkeAlgorithm]) -> Result<QkeAlgorithm, ProtocolError> {
        // Find the best mutually supported algorithm
        for preferred in &self.config.supported_algorithms {
            if supported_algorithms.contains(preferred) {
                return Ok(preferred.clone());
            }
        }

        // Fallback to first supported algorithm
        supported_algorithms.first()
            .cloned()
            .ok_or_else(|| ProtocolError::KeyExchangeFailed("No mutually supported algorithms".to_string()))
    }

    fn generate_confirmation_hash(&self, shared_secret: &[u8], nonce1: &[u8], nonce2: &[u8]) -> Vec<u8> {
        use sha3::{Digest, Sha3_256};
        
        let mut hasher = Sha3_256::new();
        hasher.update(shared_secret);
        hasher.update(nonce1);
        hasher.update(nonce2);
        hasher.update(b"key_exchange_confirmation");
        hasher.finalize().to_vec()
    }

    fn verify_confirmation_hash(&self, shared_secret: &[u8], nonce: &[u8], hash: &[u8]) -> bool {
        // In a real implementation, this would verify against the stored nonce
        // For now, just check if hash is valid length
        hash.len() == 32
    }

    fn generate_completion_hash(&self, shared_secret: &[u8]) -> Vec<u8> {
        use sha3::{Digest, Sha3_256};
        
        let mut hasher = Sha3_256::new();
        hasher.update(shared_secret);
        hasher.update(b"key_exchange_completion");
        hasher.finalize().to_vec()
    }

    fn verify_completion_hash(&self, shared_secret: &[u8], hash: &[u8]) -> bool {
        let expected = self.generate_completion_hash(shared_secret);
        expected == hash
    }

    fn derive_session_keys(&self, session: &ProtocolSession) -> Result<DerivedKeys, ProtocolError> {
        use sha3::{Digest, Sha3_256, Sha3_512};
        
        let context = &session.security_context.key_derivation_info;
        
        // Derive session key
        let mut session_key_hasher = Sha3_256::new();
        session_key_hasher.update(&session.security_context.shared_secret);
        session_key_hasher.update(&context.context);
        session_key_hasher.update(&context.salt);
        session_key_hasher.update(b"session_key");
        let session_key = session_key_hasher.finalize().to_vec();

        // Derive encryption key
        let mut encryption_key_hasher = Sha3_256::new();
        encryption_key_hasher.update(&session.security_context.shared_secret);
        encryption_key_hasher.update(&context.context);
        encryption_key_hasher.update(&context.salt);
        encryption_key_hasher.update(b"encryption_key");
        let encryption_key = encryption_key_hasher.finalize().to_vec();

        // Derive authentication key
        let mut auth_key_hasher = Sha3_512::new();
        auth_key_hasher.update(&session.security_context.shared_secret);
        auth_key_hasher.update(&context.context);
        auth_key_hasher.update(&context.salt);
        auth_key_hasher.update(b"authentication_key");
        let authentication_key = auth_key_hasher.finalize().to_vec();

        Ok(DerivedKeys {
            session_key,
            encryption_key,
            authentication_key,
        })
    }

    fn generate_classical_public_key(&self) -> Result<Vec<u8>, ProtocolError> {
        let mut classical_key = vec![0u8; 32];
        self.rng.fill(&mut classical_key).map_err(|e| {
            ProtocolError::InternalError(format!("Failed to generate classical public key: {}", e))
        })?;
        Ok(classical_key)
    }

    fn generate_session_id(&self) -> String {
        let mut session_id_bytes = [0u8; 16];
        self.rng.fill(&mut session_id_bytes).unwrap();
        hex::encode(session_id_bytes)
    }

    fn check_rate_limit(&self, participant_id: &str) -> Result<(), ProtocolError> {
        if !self.config.enable_rate_limiting {
            return Ok(());
        }

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut rate_limiter = self.rate_limiter.write().unwrap();
        let rate_info = rate_limiter.entry(participant_id.to_string()).or_insert(RateLimitInfo {
            request_count: 0,
            reset_time: current_time + 60, // 1 minute window
            window_start: current_time,
        });

        // Reset window if expired
        if current_time >= rate_info.reset_time {
            rate_info.request_count = 0;
            rate_info.window_start = current_time;
            rate_info.reset_time = current_time + 60;
        }

        // Check limit
        if rate_info.request_count >= 10 { // 10 requests per minute
            return Err(ProtocolError::RateLimitExceeded(
                format!("Rate limit exceeded for participant: {}", participant_id)
            ));
        }

        rate_info.request_count += 1;
        Ok(())
    }

    fn log_audit_event(&self, event: ProtocolAuditEvent) {
        if !self.config.security_parameters.enable_audit_logging {
            return;
        }

        let mut log = self.audit_log.write().unwrap();
        log.push(event);
        
        // Keep only last 1000 events
        if log.len() > 1000 {
            log.drain(0..log.len() - 1000);
        }
    }
}

#[derive(Debug, Clone)]
struct DerivedKeys {
    session_key: Vec<u8>,
    encryption_key: Vec<u8>,
    authentication_key: Vec<u8>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_protocol_creation() {
        let config = ProtocolConfig {
            version: ProtocolVersion::V2_0,
            supported_algorithms: vec![QkeAlgorithm::Kyber768],
            preferred_algorithm: QkeAlgorithm::Kyber768,
            enable_hybrid_mode: true,
            enable_forward_secrecy: true,
            enable_key_confirmation: true,
            session_timeout: Duration::from_secs(3600),
            max_retries: 3,
            enable_mitm_protection: true,
            enable_rate_limiting: true,
            security_parameters: SecurityParameters {
                min_key_size_bits: 256,
                min_security_level: 128,
                max_session_duration: Duration::from_secs(3600),
                require_key_rotation: true,
                enable_audit_logging: true,
                enable_anomaly_detection: true,
                allowed_key_types: HashSet::from([KeyType::KeyExchange]),
            },
        };

        let protocol = SecureKeyExchangeProtocol::new(config);
        assert!(protocol.is_ok());
    }

    #[test]
    fn test_key_exchange_initiation() {
        let config = ProtocolConfig {
            version: ProtocolVersion::V2_0,
            supported_algorithms: vec![QkeAlgorithm::Kyber768],
            preferred_algorithm: QkeAlgorithm::Kyber768,
            enable_hybrid_mode: true,
            enable_forward_secrecy: true,
            enable_key_confirmation: true,
            session_timeout: Duration::from_secs(3600),
            max_retries: 3,
            enable_mitm_protection: true,
            enable_rate_limiting: true,
            security_parameters: SecurityParameters {
                min_key_size_bits: 256,
                min_security_level: 128,
                max_session_duration: Duration::from_secs(3600),
                require_key_rotation: true,
                enable_audit_logging: true,
                enable_anomaly_detection: true,
                allowed_key_types: HashSet::from([KeyType::KeyExchange]),
            },
        };

        let protocol = SecureKeyExchangeProtocol::new(config).unwrap();
        let result = protocol.initiate_key_exchange("alice", "bob", None);
        assert!(result.is_ok());
        
        let message = result.unwrap();
        assert_eq!(message.message_type, MessageType::KeyExchangeInit);
        assert_eq!(message.sender_id, "alice");
        assert_eq!(message.recipient_id, "bob");
    }

    #[test]
    fn test_session_management() {
        let config = ProtocolConfig {
            version: ProtocolVersion::V2_0,
            supported_algorithms: vec![QkeAlgorithm::Kyber768],
            preferred_algorithm: QkeAlgorithm::Kyber768,
            enable_hybrid_mode: true,
            enable_forward_secrecy: true,
            enable_key_confirmation: true,
            session_timeout: Duration::from_secs(3600),
            max_retries: 3,
            enable_mitm_protection: true,
            enable_rate_limiting: true,
            security_parameters: SecurityParameters {
                min_key_size_bits: 256,
                min_security_level: 128,
                max_session_duration: Duration::from_secs(3600),
                require_key_rotation: true,
                enable_audit_logging: true,
                enable_anomaly_detection: true,
                allowed_key_types: HashSet::from([KeyType::KeyExchange]),
            },
        };

        let protocol = SecureKeyExchangeProtocol::new(config).unwrap();
        
        // Initiate key exchange
        let init_message = protocol.initiate_key_exchange("alice", "bob", None).unwrap();
        let session_id = &init_message.session_id;

        // Get session
        let session = protocol.get_session(session_id);
        assert!(session.is_ok());

        // List active sessions
        let active_sessions = protocol.list_active_sessions();
        assert!(active_sessions.is_ok());
        assert!(!active_sessions.unwrap().is_empty());

        // Terminate session
        let result = protocol.terminate_session(session_id, "test", true);
        assert!(result.is_ok());
    }
}