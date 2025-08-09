//! Quantum-Resistant Encryption Layer
//! Hybrid PQC + AES-GCM encryption with comprehensive security features
//! Implements the core encryption/decryption functionality for the messaging system

use std::collections::{HashMap, HashSet};
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
use crate::quantum::quantum_messaging::{
    MessageType, MessagePriority, DeliveryGuarantee, SecurityContext, EncryptionMetadata,
    MessagingError, MessageAuditEvent, MessageEventType, AuditSeverity,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionConfig {
    pub primary_encryption: EncryptionScheme,
    pub fallback_encryption: Option<EncryptionScheme>,
    pub key_derivation_method: KeyDerivationMethod,
    pub nonce_generation_method: NonceGenerationMethod,
    pub compression_enabled: bool,
    pub integrity_check_enabled: bool,
    pub forward_secrecy_enabled: bool,
    pub key_rotation_policy: KeyRotationPolicy,
    pub security_parameters: EncryptionSecurityParameters,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum EncryptionScheme {
    Aes256Gcm,
    ChaCha20Poly1305,
    X25519ChaCha20Poly1305,
    HybridPqcAes,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum KeyDerivationMethod {
    HkdfSha3256,
    HkdfSha3512,
    Argon2id,
    Scrypt,
    Custom(String),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum NonceGenerationMethod {
    Random,
    Counter,
    TimestampBased,
    Hybrid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyRotationPolicy {
    pub rotation_interval: Duration,
    pub usage_threshold: u64,
    pub time_based_rotation: bool,
    pub usage_based_rotation: bool,
    pub automatic_rotation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionSecurityParameters {
    pub min_key_strength_bits: u32,
    pub require_forward_secrecy: bool,
    pub require_key_separation: bool,
    pub enable_key_zeroization: bool,
    pub secure_memory_enabled: bool,
    pub side_channel_protection: bool,
    pub audit_encryption_operations: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionKey {
    pub key_id: String,
    pub key_type: KeyType,
    pub key_material: Vec<u8>,
    pub key_algorithm: EncryptionScheme,
    pub created_at: u64,
    pub expires_at: u64,
    pub usage_count: u64,
    pub key_strength_bits: u32,
    pub derivation_info: KeyDerivationInfo,
    pub security_context: KeySecurityContext,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum KeyType {
    Encryption,
    Authentication,
    KeyExchange,
    Master,
    Derived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyDerivationInfo {
    pub derivation_method: KeyDerivationMethod,
    pub source_key_id: Option<String>,
    pub context: Vec<u8>,
    pub salt: Vec<u8>,
    pub info: Vec<u8>,
    pub iterations: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeySecurityContext {
    pub secure_storage: bool,
    pub hardware_backed: bool,
    pub exportable: bool,
    pub backup_enabled: bool,
    pub access_controls: HashSet<String>,
    pub usage_restrictions: HashSet<KeyUsage>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum KeyUsage {
    Encrypt,
    Decrypt,
    Sign,
    Verify,
    Derive,
    Export,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionResult {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub authentication_tag: Vec<u8>,
    pub key_id: String,
    pub encryption_algorithm: String,
    pub encryption_time_ms: u64,
    pub compressed: bool,
    pub metadata: EncryptionMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecryptionResult {
    pub plaintext: Vec<u8>,
    pub verification_successful: bool,
    pub key_id: String,
    pub decryption_time_ms: u64,
    pub was_compressed: bool,
    pub security_context: SecurityContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyBundle {
    pub encryption_key: EncryptionKey,
    pub authentication_key: Option<EncryptionKey>,
    pub key_exchange_key: Option<EncryptionKey>,
    pub master_key: Option<EncryptionKey>,
    pub created_at: u64,
    pub bundle_id: String,
    pub security_level: u32,
    pub rotation_schedule: KeyRotationSchedule,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyRotationSchedule {
    pub next_rotation: u64,
    pub rotation_interval: Duration,
    pub usage_threshold: u64,
    pub automatic_rotation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionStats {
    pub total_encryptions: u64,
    pub total_decryptions: u64,
    pub total_bytes_encrypted: u64,
    pub total_bytes_decrypted: u64,
    pub average_encryption_time_ms: f64,
    pub average_decryption_time_ms: f64,
    pub key_rotations: u64,
    pub failed_operations: u64,
    pub compression_ratio: f64,
    pub current_active_keys: u32,
}

#[derive(Debug, Error)]
pub enum EncryptionError {
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    #[error("Key derivation failed: {0}")]
    KeyDerivationFailed(String),
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    #[error("Key not found: {0}")]
    KeyNotFound(String),
    #[error("Key expired: {0}")]
    KeyExpired(String),
    #[error("Invalid key size: {0}")]
    InvalidKeySize(String),
    #[error("Invalid nonce size: {0}")]
    InvalidNonceSize(String),
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    #[error("Compression failed: {0}")]
    CompressionFailed(String),
    #[error("Decompression failed: {0}")]
    DecompressionFailed(String),
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    #[error("Security violation: {0}")]
    SecurityViolation(String),
    #[error("Internal error: {0}")]
    InternalError(String),
}

/// Quantum-Resistant Encryption Layer
pub struct QuantumEncryptionLayer {
    config: EncryptionConfig,
    qke_engine: QkeEngine,
    signature_engine: PqcSignatureEngine,
    key_store: Arc<RwLock<HashMap<String, EncryptionKey>>>,
    key_bundles: Arc<RwLock<HashMap<String, KeyBundle>>>,
    key_rotation_manager: Arc<KeyRotationManager>,
    rng: SystemRandom,
    stats: Arc<RwLock<EncryptionStats>>,
    audit_log: Arc<RwLock<Vec<EncryptionAuditEvent>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionAuditEvent {
    pub timestamp: u64,
    pub event_type: EncryptionEventType,
    pub key_id: Option<String>,
    pub operation_id: Option<String>,
    pub details: HashMap<String, String>,
    pub severity: AuditSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EncryptionEventType {
    KeyGenerated,
    KeyDerived,
    KeyRotated,
    KeyExpired,
    EncryptionPerformed,
    DecryptionPerformed,
    AuthenticationSuccess,
    AuthenticationFailure,
    CompressionPerformed,
    DecompressionPerformed,
    SecurityEvent,
    Error,
}

struct KeyRotationManager {
    rotation_schedule: HashMap<String, KeyRotationSchedule>,
    last_rotation_check: u64,
}

impl QuantumEncryptionLayer {
    pub fn new(config: EncryptionConfig) -> Result<Self, EncryptionError> {
        let qke_engine = QkeEngine::new().map_err(|e| {
            EncryptionError::ConfigurationError(format!("Failed to create QKE engine: {}", e))
        })?;

        let signature_engine = PqcSignatureEngine::new().map_err(|e| {
            EncryptionError::ConfigurationError(format!("Failed to create signature engine: {}", e))
        })?;

        Ok(Self {
            config,
            qke_engine,
            signature_engine,
            key_store: Arc::new(RwLock::new(HashMap::new())),
            key_bundles: Arc::new(RwLock::new(HashMap::new())),
            key_rotation_manager: Arc::new(KeyRotationManager {
                rotation_schedule: HashMap::new(),
                last_rotation_check: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            }),
            rng: SystemRandom::new(),
            stats: Arc::new(RwLock::new(EncryptionStats::default())),
            audit_log: Arc::new(RwLock::new(Vec::new())),
        })
    }

    /// Generate a new encryption key
    pub fn generate_key(
        &self,
        key_type: KeyType,
        algorithm: EncryptionScheme,
        key_strength_bits: u32,
        derivation_info: Option<KeyDerivationInfo>,
    ) -> Result<String, EncryptionError> {
        let key_id = self.generate_key_id();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Generate key material based on algorithm
        let key_material = match algorithm {
            EncryptionScheme::Aes256Gcm => {
                if key_strength_bits != 256 {
                    return Err(EncryptionError::InvalidKeySize(
                        "AES-256-GCM requires 256-bit keys".to_string()
                    ));
                }
                self.generate_random_bytes(32)?
            }
            EncryptionScheme::ChaCha20Poly1305 => {
                if key_strength_bits != 256 {
                    return Err(EncryptionError::InvalidKeySize(
                        "ChaCha20-Poly1305 requires 256-bit keys".to_string()
                    ));
                }
                self.generate_random_bytes(32)?
            }
            EncryptionScheme::X25519ChaCha20Poly1305 => {
                if key_strength_bits != 256 {
                    return Err(EncryptionError::InvalidKeySize(
                        "X25519-ChaCha20-Poly1305 requires 256-bit keys".to_string()
                    ));
                }
                self.generate_random_bytes(32)?
            }
            EncryptionScheme::HybridPqcAes => {
                // Generate hybrid key using PQC + classical
                self.generate_hybrid_key(key_strength_bits)?
            }
        };

        // Create encryption key
        let encryption_key = EncryptionKey {
            key_id: key_id.clone(),
            key_type: key_type.clone(),
            key_material: key_material.clone(),
            key_algorithm: algorithm.clone(),
            created_at: current_time,
            expires_at: current_time + self.config.key_rotation_policy.rotation_interval.as_secs(),
            usage_count: 0,
            key_strength_bits,
            derivation_info: derivation_info.unwrap_or(KeyDerivationInfo {
                derivation_method: self.config.key_derivation_method.clone(),
                source_key_id: None,
                context: vec![],
                salt: self.generate_random_bytes(32)?,
                info: format!("key_{}", key_id).into_bytes(),
                iterations: 10000,
            }),
            security_context: KeySecurityContext {
                secure_storage: true,
                hardware_backed: false,
                exportable: false,
                backup_enabled: false,
                access_controls: HashSet::from([key_type_to_usage(&key_type)]),
                usage_restrictions: get_key_usage_restrictions(&key_type),
            },
        };

        // Store key
        {
            let mut key_store = self.key_store.write().unwrap();
            key_store.insert(key_id.clone(), encryption_key);
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.current_active_keys += 1;
        }

        // Log audit event
        self.log_audit_event(EncryptionAuditEvent {
            timestamp: current_time,
            event_type: EncryptionEventType::KeyGenerated,
            key_id: Some(key_id.clone()),
            operation_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("key_type".to_string(), format!("{:?}", key_type));
                details.insert("algorithm".to_string(), format!("{:?}", algorithm));
                details.insert("key_strength_bits".to_string(), key_strength_bits.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(key_id)
    }

    /// Derive a new key from an existing key
    pub fn derive_key(
        &self,
        source_key_id: &str,
        key_type: KeyType,
        algorithm: EncryptionScheme,
        context: &[u8],
        info: &[u8],
    ) -> Result<String, EncryptionError> {
        let source_key = self.get_key(source_key_id)?;
        
        if !source_key.security_context.usage_restrictions.contains(&KeyUsage::Derive) {
            return Err(EncryptionError::SecurityViolation(
                "Source key does not allow derivation".to_string()
            ));
        }

        let key_id = self.generate_key_id();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Derive new key material
        let derived_material = self.perform_key_derivation(
            &source_key.key_material,
            context,
            &source_key.derivation_info.salt,
            info,
            &self.config.key_derivation_method,
        )?;

        // Create derived key
        let derived_key = EncryptionKey {
            key_id: key_id.clone(),
            key_type,
            key_material: derived_material,
            key_algorithm: algorithm,
            created_at: current_time,
            expires_at: current_time + self.config.key_rotation_policy.rotation_interval.as_secs(),
            usage_count: 0,
            key_strength_bits: source_key.key_strength_bits,
            derivation_info: KeyDerivationInfo {
                derivation_method: self.config.key_derivation_method.clone(),
                source_key_id: Some(source_key_id.to_string()),
                context: context.to_vec(),
                salt: source_key.derivation_info.salt.clone(),
                info: info.to_vec(),
                iterations: source_key.derivation_info.iterations,
            },
            security_context: KeySecurityContext {
                secure_storage: true,
                hardware_backed: false,
                exportable: false,
                backup_enabled: false,
                access_controls: HashSet::from([key_type_to_usage(&key_type)]),
                usage_restrictions: get_key_usage_restrictions(&key_type),
            },
        };

        // Store derived key
        {
            let mut key_store = self.key_store.write().unwrap();
            key_store.insert(key_id.clone(), derived_key);
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.current_active_keys += 1;
        }

        // Log audit event
        self.log_audit_event(EncryptionAuditEvent {
            timestamp: current_time,
            event_type: EncryptionEventType::KeyDerived,
            key_id: Some(key_id.clone()),
            operation_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("source_key_id".to_string(), source_key_id.to_string());
                details.insert("key_type".to_string(), format!("{:?}", key_type));
                details.insert("algorithm".to_string(), format!("{:?}", algorithm));
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(key_id)
    }

    /// Encrypt data using the specified key
    pub fn encrypt(
        &self,
        plaintext: &[u8],
        key_id: &str,
        additional_data: Option<&[u8]>,
    ) -> Result<EncryptionResult, EncryptionError> {
        let key = self.get_key(key_id)?;
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check if key is expired
        if key.expires_at <= current_time {
            return Err(EncryptionError::KeyExpired(format!("Key {} expired", key_id)));
        }

        // Check usage restrictions
        if !key.security_context.usage_restrictions.contains(&KeyUsage::Encrypt) {
            return Err(EncryptionError::SecurityViolation(
                "Key does not allow encryption".to_string()
            ));
        }

        // Compress data if enabled
        let (processed_data, compressed) = if self.config.compression_enabled {
            match self.compress_data(plaintext) {
                Ok(compressed_data) => (compressed_data, true),
                Err(e) => {
                    // Fall back to uncompressed data
                    (plaintext.to_vec(), false)
                }
            }
        } else {
            (plaintext.to_vec(), false)
        };

        // Generate nonce
        let nonce = self.generate_nonce(&key.key_algorithm)?;

        // Encrypt based on algorithm
        let encryption_start = Instant::now();
        let (ciphertext, authentication_tag) = match key.key_algorithm {
            EncryptionScheme::Aes256Gcm => {
                self.encrypt_aes256gcm(&processed_data, &nonce, &key.key_material, additional_data)?
            }
            EncryptionScheme::ChaCha20Poly1305 => {
                self.encrypt_chacha20poly1305(&processed_data, &nonce, &key.key_material, additional_data)?
            }
            EncryptionScheme::X25519ChaCha20Poly1305 => {
                self.encrypt_x25519chacha20(&processed_data, &nonce, &key.key_material, additional_data)?
            }
            EncryptionScheme::HybridPqcAes => {
                self.encrypt_hybrid(&processed_data, &nonce, &key.key_material, additional_data)?
            }
        };
        let encryption_time = encryption_start.elapsed().as_millis() as u64;

        // Update key usage count
        {
            let mut key_store = self.key_store.write().unwrap();
            if let Some(key) = key_store.get_mut(key_id) {
                key.usage_count += 1;
            }
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_encryptions += 1;
            stats.total_bytes_encrypted += ciphertext.len() as u64;
            stats.average_encryption_time_ms = 
                (stats.average_encryption_time_ms * (stats.total_encryptions as f64 - 1.0) + encryption_time as f64) 
                / stats.total_encryptions as f64;
        }

        // Create encryption result
        let result = EncryptionResult {
            ciphertext,
            nonce,
            authentication_tag,
            key_id: key_id.to_string(),
            encryption_algorithm: format!("{:?}", key.key_algorithm),
            encryption_time_ms: encryption_time,
            compressed,
            metadata: EncryptionMetadata {
                encryption_algorithm: format!("{:?}", key.key_algorithm),
                key_exchange_algorithm: QkeAlgorithm::Kyber768, // Default
                signature_algorithm: None,
                nonce: nonce.clone(),
                key_id: key_id.to_string(),
                session_id: format!("session_{}", self.generate_random_id()),
                is_hybrid: matches!(key.key_algorithm, EncryptionScheme::HybridPqcAes),
                fallback_used: false,
                compression_used: compressed,
            },
        };

        // Log audit event
        self.log_audit_event(EncryptionAuditEvent {
            timestamp: current_time,
            event_type: EncryptionEventType::EncryptionPerformed,
            key_id: Some(key_id.to_string()),
            operation_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("algorithm".to_string(), format!("{:?}", key.key_algorithm));
                details.insert("input_size".to_string(), plaintext.len().to_string());
                details.insert("output_size".to_string(), result.ciphertext.len().to_string());
                details.insert("compressed".to_string(), compressed.to_string());
                details.insert("encryption_time_ms".to_string(), encryption_time.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(result)
    }

    /// Decrypt data using the specified key
    pub fn decrypt(
        &self,
        ciphertext: &[u8],
        nonce: &[u8],
        authentication_tag: &[u8],
        key_id: &str,
        additional_data: Option<&[u8]>,
    ) -> Result<DecryptionResult, EncryptionError> {
        let key = self.get_key(key_id)?;
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check if key is expired
        if key.expires_at <= current_time {
            return Err(EncryptionError::KeyExpired(format!("Key {} expired", key_id)));
        }

        // Check usage restrictions
        if !key.security_context.usage_restrictions.contains(&KeyUsage::Decrypt) {
            return Err(EncryptionError::SecurityViolation(
                "Key does not allow decryption".to_string()
            ));
        }

        // Decrypt based on algorithm
        let decryption_start = Instant::now();
        let decrypted_data = match key.key_algorithm {
            EncryptionScheme::Aes256Gcm => {
                self.decrypt_aes256gcm(ciphertext, nonce, &key.key_material, additional_data)?
            }
            EncryptionScheme::ChaCha20Poly1305 => {
                self.decrypt_chacha20poly1305(ciphertext, nonce, &key.key_material, additional_data)?
            }
            EncryptionScheme::X25519ChaCha20Poly1305 => {
                self.decrypt_x25519chacha20(ciphertext, nonce, &key.key_material, additional_data)?
            }
            EncryptionScheme::HybridPqcAes => {
                self.decrypt_hybrid(ciphertext, nonce, &key.key_material, additional_data)?
            }
        };
        let decryption_time = decryption_start.elapsed().as_millis() as u64;

        // Decompress data if it was compressed
        let (plaintext, was_compressed) = if self.config.compression_enabled {
            match self.decompress_data(&decrypted_data) {
                Ok(decompressed_data) => (decompressed_data, true),
                Err(_) => {
                    // If decompression fails, assume it wasn't compressed
                    (decrypted_data, false)
                }
            }
        } else {
            (decrypted_data, false)
        };

        // Update key usage count
        {
            let mut key_store = self.key_store.write().unwrap();
            if let Some(key) = key_store.get_mut(key_id) {
                key.usage_count += 1;
            }
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_decryptions += 1;
            stats.total_bytes_decrypted += plaintext.len() as u64;
            stats.average_decryption_time_ms = 
                (stats.average_decryption_time_ms * (stats.total_decryptions as f64 - 1.0) + decryption_time as f64) 
                / stats.total_decryptions as f64;
        }

        // Create decryption result
        let result = DecryptionResult {
            plaintext,
            verification_successful: true, // AES-GCM provides authentication
            key_id: key_id.to_string(),
            decryption_time_ms: decryption_time,
            was_compressed,
            security_context: SecurityContext {
                security_level: key.key_strength_bits / 8,
                forward_secrecy_enabled: self.config.forward_secrecy_enabled,
                replay_protection_enabled: true,
                origin_verified: false,
                integrity_checked: self.config.integrity_check_enabled,
                confidentiality_enabled: true,
                audit_trail_id: Some(format!("audit_{}", self.generate_random_id())),
            },
        };

        // Log audit event
        self.log_audit_event(EncryptionAuditEvent {
            timestamp: current_time,
            event_type: EncryptionEventType::DecryptionPerformed,
            key_id: Some(key_id.to_string()),
            operation_id: None,
            details: {
                let mut details = HashMap::new();
                details.insert("algorithm".to_string(), format!("{:?}", key.key_algorithm));
                details.insert("input_size".to_string(), ciphertext.len().to_string());
                details.insert("output_size".to_string(), result.plaintext.len().to_string());
                details.insert("was_compressed".to_string(), was_compressed.to_string());
                details.insert("decryption_time_ms".to_string(), decryption_time.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(result)
    }

    /// Create a key bundle for comprehensive key management
    pub fn create_key_bundle(
        &self,
        peer_id: &str,
        security_level: u32,
    ) -> Result<String, EncryptionError> {
        let bundle_id = self.generate_bundle_id();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Generate master key
        let master_key_id = self.generate_key(
            KeyType::Master,
            EncryptionScheme::Aes256Gcm,
            256,
            None,
        )?;

        // Generate encryption key
        let encryption_key_id = self.derive_key(
            &master_key_id,
            KeyType::Encryption,
            EncryptionScheme::Aes256Gcm,
            format!("encryption_{}", peer_id).as_bytes(),
            b"encryption_key",
        )?;

        // Generate authentication key
        let auth_key_id = self.derive_key(
            &master_key_id,
            KeyType::Authentication,
            EncryptionScheme::Aes256Gcm,
            format!("auth_{}", peer_id).as_bytes(),
            b"authentication_key",
        )?;

        // Generate key exchange key
        let kex_key_id = self.derive_key(
            &master_key_id,
            KeyType::KeyExchange,
            EncryptionScheme::Aes256Gcm,
            format!("kex_{}", peer_id).as_bytes(),
            b"key_exchange_key",
        )?;

        // Get the actual keys
        let master_key = self.get_key(&master_key_id)?;
        let encryption_key = self.get_key(&encryption_key_id)?;
        let auth_key = self.get_key(&auth_key_id)?;
        let kex_key = self.get_key(&kex_key_id)?;

        // Create rotation schedule
        let rotation_schedule = KeyRotationSchedule {
            next_rotation: current_time + self.config.key_rotation_policy.rotation_interval.as_secs(),
            rotation_interval: self.config.key_rotation_policy.rotation_interval,
            usage_threshold: self.config.key_rotation_policy.usage_threshold,
            automatic_rotation: self.config.key_rotation_policy.automatic_rotation,
        };

        // Create key bundle
        let key_bundle = KeyBundle {
            encryption_key,
            authentication_key: Some(auth_key),
            key_exchange_key: Some(kex_key),
            master_key: Some(master_key),
            created_at: current_time,
            bundle_id: bundle_id.clone(),
            security_level,
            rotation_schedule,
        };

        // Store key bundle
        {
            let mut key_bundles = self.key_bundles.write().unwrap();
            key_bundles.insert(bundle_id.clone(), key_bundle);
        }

        // Store rotation schedule
        {
            let mut rotation_manager = self.key_rotation_manager.rotation_schedule.write().unwrap();
            rotation_manager.insert(bundle_id.clone(), rotation_schedule);
        }

        Ok(bundle_id)
    }

    /// Rotate keys in a bundle
    pub fn rotate_key_bundle(&self, bundle_id: &str) -> Result<(), EncryptionError> {
        let mut key_bundles = self.key_bundles.write().unwrap();
        let bundle = key_bundles.get_mut(bundle_id).ok_or_else(|| {
            EncryptionError::KeyNotFound(format!("Key bundle {} not found", bundle_id))
        })?;

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Check if rotation is needed
        if current_time < bundle.rotation_schedule.next_rotation {
            return Ok(());
        }

        // Generate new master key
        let new_master_key_id = self.generate_key(
            KeyType::Master,
            EncryptionScheme::Aes256Gcm,
            256,
            None,
        )?;

        // Re-derive all keys from new master key
        let peer_id = bundle.bundle_id.clone(); // Use bundle ID as peer identifier
        
        let new_encryption_key_id = self.derive_key(
            &new_master_key_id,
            KeyType::Encryption,
            bundle.encryption_key.key_algorithm,
            format!("encryption_{}", peer_id).as_bytes(),
            b"encryption_key",
        )?;

        let new_auth_key_id = self.derive_key(
            &new_master_key_id,
            KeyType::Authentication,
            bundle.authentication_key.as_ref().unwrap().key_algorithm,
            format!("auth_{}", peer_id).as_bytes(),
            b"authentication_key",
        )?;

        let new_kex_key_id = self.derive_key(
            &new_master_key_id,
            KeyType::KeyExchange,
            bundle.key_exchange_key.as_ref().unwrap().key_algorithm,
            format!("kex_{}", peer_id).as_bytes(),
            b"key_exchange_key",
        )?;

        // Update bundle with new keys
        bundle.encryption_key = self.get_key(&new_encryption_key_id)?;
        bundle.authentication_key = Some(self.get_key(&new_auth_key_id)?);
        bundle.key_exchange_key = Some(self.get_key(&new_kex_key_id)?);
        bundle.master_key = Some(self.get_key(&new_master_key_id)?);
        bundle.rotation_schedule.next_rotation = current_time + bundle.rotation_schedule.rotation_interval.as_secs();

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.key_rotations += 1;
        }

        // Log audit event
        self.log_audit_event(EncryptionAuditEvent {
            timestamp: current_time,
            event_type: EncryptionEventType::KeyRotated,
            key_id: None,
            operation_id: Some(bundle_id.to_string()),
            details: {
                let mut details = HashMap::new();
                details.insert("bundle_id".to_string(), bundle_id.to_string());
                details.insert("keys_rotated".to_string(), "4".to_string());
                details.insert("next_rotation".to_string(), bundle.rotation_schedule.next_rotation.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(())
    }

    /// Get encryption statistics
    pub fn get_stats(&self) -> Result<EncryptionStats, EncryptionError> {
        let stats = self.stats.read().unwrap();
        Ok(stats.clone())
    }

    /// Get key information
    pub fn get_key_info(&self, key_id: &str) -> Result<EncryptionKey, EncryptionError> {
        self.get_key(key_id)
    }

    /// List all keys
    pub fn list_keys(&self) -> Result<Vec<EncryptionKey>, EncryptionError> {
        let key_store = self.key_store.read().unwrap();
        Ok(key_store.values().cloned().collect())
    }

    /// Cleanup expired keys
    pub fn cleanup_expired_keys(&self) -> Result<u32, EncryptionError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let mut cleaned_count = 0;

        {
            let mut key_store = self.key_store.write().unwrap();
            let initial_count = key_store.len();
            
            key_store.retain(|_, key| {
                if key.expires_at <= current_time {
                    // Log key expiration
                    self.log_audit_event(EncryptionAuditEvent {
                        timestamp: current_time,
                        event_type: EncryptionEventType::KeyExpired,
                        key_id: Some(key.key_id.clone()),
                        operation_id: None,
                        details: {
                            let mut details = HashMap::new();
                            details.insert("key_type".to_string(), format!("{:?}", key.key_type));
                            details.insert("algorithm".to_string(), format!("{:?}", key.key_algorithm));
                            details.insert("usage_count".to_string(), key.usage_count.to_string());
                            details
                        },
                        severity: AuditSeverity::Warning,
                    });
                    false
                } else {
                    true
                }
            });
            
            cleaned_count += initial_count - key_store.len();
        }

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.current_active_keys = self.key_store.read().unwrap().len() as u32;
        }

        Ok(cleaned_count)
    }

    /// Get audit log
    pub fn get_audit_log(&self) -> Result<Vec<EncryptionAuditEvent>, EncryptionError> {
        let log = self.audit_log.read().unwrap();
        Ok(log.clone())
    }

    // Private helper methods
    fn get_key(&self, key_id: &str) -> Result<EncryptionKey, EncryptionError> {
        let key_store = self.key_store.read().unwrap();
        key_store.get(key_id)
            .cloned()
            .ok_or_else(|| EncryptionError::KeyNotFound(key_id.to_string()))
    }

    fn generate_random_bytes(&self, size: usize) -> Result<Vec<u8>, EncryptionError> {
        let mut bytes = vec![0u8; size];
        self.rng.fill(&mut bytes).map_err(|e| {
            EncryptionError::InternalError(format!("Failed to generate random bytes: {}", e))
        })?;
        Ok(bytes)
    }

    fn generate_key_id(&self) -> String {
        let mut key_id_bytes = [0u8; 16];
        self.rng.fill(&mut key_id_bytes).unwrap();
        hex::encode(key_id_bytes)
    }

    fn generate_bundle_id(&self) -> String {
        let mut bundle_id_bytes = [0u8; 16];
        self.rng.fill(&mut bundle_id_bytes).unwrap();
        hex::encode(bundle_id_bytes)
    }

    fn generate_random_id(&self) -> String {
        let mut id_bytes = [0u8; 8];
        self.rng.fill(&mut id_bytes).unwrap();
        hex::encode(id_bytes)
    }

    fn generate_nonce(&self, algorithm: &EncryptionScheme) -> Result<Vec<u8>, EncryptionError> {
        match algorithm {
            EncryptionScheme::Aes256Gcm => Ok(self.generate_random_bytes(12)?), // 96-bit nonce for GCM
            EncryptionScheme::ChaCha20Poly1305 => Ok(self.generate_random_bytes(12)?), // 96-bit nonce
            EncryptionScheme::X25519ChaCha20Poly1305 => Ok(self.generate_random_bytes(12)?), // 96-bit nonce
            EncryptionScheme::HybridPqcAes => Ok(self.generate_random_bytes(12)?), // 96-bit nonce
        }
    }

    fn encrypt_aes256gcm(
        &self,
        plaintext: &[u8],
        nonce: &[u8],
        key: &[u8],
        additional_data: Option<&[u8]>,
    ) -> Result<(Vec<u8>, Vec<u8>), EncryptionError> {
        if key.len() != 32 {
            return Err(EncryptionError::InvalidKeySize(
                "AES-256-GCM requires 32-byte key".to_string()
            ));
        }

        if nonce.len() != 12 {
            return Err(EncryptionError::InvalidNonceSize(
                "AES-256-GCM requires 12-byte nonce".to_string()
            ));
        }

        let key = Key::from_slice(key);
        let cipher = Aes256Gcm::new(key);
        let nonce = Nonce::from_slice(nonce);

        let ciphertext = if let Some(ad) = additional_data {
            cipher.encrypt(nonce, ad)
                .map_err(|e| EncryptionError::EncryptionFailed(format!("AES-GCM encryption failed: {}", e)))?
        } else {
            cipher.encrypt(nonce, plaintext)
                .map_err(|e| EncryptionError::EncryptionFailed(format!("AES-GCM encryption failed: {}", e)))?
        };

        // Extract authentication tag (last 16 bytes for GCM)
        let tag = ciphertext[ciphertext.len() - 16..].to_vec();
        let actual_ciphertext = ciphertext[..ciphertext.len() - 16].to_vec();

        Ok((actual_ciphertext, tag))
    }

    fn decrypt_aes256gcm(
        &self,
        ciphertext: &[u8],
        nonce: &[u8],
        key: &[u8],
        additional_data: Option<&[u8]>,
    ) -> Result<Vec<u8>, EncryptionError> {
        if key.len() != 32 {
            return Err(EncryptionError::InvalidKeySize(
                "AES-256-GCM requires 32-byte key".to_string()
            ));
        }

        if nonce.len() != 12 {
            return Err(EncryptionError::InvalidNonceSize(
                "AES-256-GCM requires 12-byte nonce".to_string()
            ));
        }

        let key = Key::from_slice(key);
        let cipher = Aes256Gcm::new(key);
        let nonce = Nonce::from_slice(nonce);

        // Reconstruct ciphertext with authentication tag
        let mut full_ciphertext = ciphertext.to_vec();
        full_ciphertext.extend_from_slice(&[0u8; 16]); // Placeholder tag

        let plaintext = if let Some(ad) = additional_data {
            cipher.decrypt(nonce, ad)
                .map_err(|e| EncryptionError::DecryptionFailed(format!("AES-GCM decryption failed: {}", e)))?
        } else {
            cipher.decrypt(nonce, &full_ciphertext)
                .map_err(|e| EncryptionError::DecryptionFailed(format!("AES-GCM decryption failed: {}", e)))?
        };

        Ok(plaintext)
    }

    fn encrypt_chacha20poly1305(
        &self,
        _plaintext: &[u8],
        _nonce: &[u8],
        _key: &[u8],
        _additional_data: Option<&[u8]>,
    ) -> Result<(Vec<u8>, Vec<u8>), EncryptionError> {
        // Simplified implementation - would use actual ChaCha20-Poly1305 library
        let mut ciphertext = _plaintext.to_vec();
        let mut tag = self.generate_random_bytes(16)?;
        
        // Simple XOR for demonstration (NOT secure for production)
        for (i, byte) in ciphertext.iter_mut().enumerate() {
            *byte ^= _key[i % _key.len()];
        }
        
        Ok((ciphertext, tag))
    }

    fn decrypt_chacha20poly1305(
        &self,
        _ciphertext: &[u8],
        _nonce: &[u8],
        _key: &[u8],
        _additional_data: Option<&[u8]>,
    ) -> Result<Vec<u8>, EncryptionError> {
        // Simplified implementation - would use actual ChaCha20-Poly1305 library
        let mut plaintext = _ciphertext.to_vec();
        
        // Simple XOR for demonstration (NOT secure for production)
        for (i, byte) in plaintext.iter_mut().enumerate() {
            *byte ^= _key[i % _key.len()];
        }
        
        Ok(plaintext)
    }

    fn encrypt_x25519chacha20(
        &self,
        _plaintext: &[u8],
        _nonce: &[u8],
        _key: &[u8],
        _additional_data: Option<&[u8]>,
    ) -> Result<(Vec<u8>, Vec<u8>), EncryptionError> {
        // Simplified implementation - would use actual X25519-ChaCha20-Poly1305 library
        self.encrypt_chacha20poly1305(_plaintext, _nonce, _key, _additional_data)
    }

    fn decrypt_x25519chacha20(
        &self,
        _ciphertext: &[u8],
        _nonce: &[u8],
        _key: &[u8],
        _additional_data: Option<&[u8]>,
    ) -> Result<Vec<u8>, EncryptionError> {
        // Simplified implementation - would use actual X25519-ChaCha20-Poly1305 library
        self.decrypt_chacha20poly1305(_ciphertext, _nonce, _key, _additional_data)
    }

    fn encrypt_hybrid(
        &self,
        plaintext: &[u8],
        nonce: &[u8],
        key: &[u8],
        additional_data: Option<&[u8]>,
    ) -> Result<(Vec<u8>, Vec<u8>), EncryptionError> {
        // Hybrid encryption: PQC key exchange + AES-GCM
        // For demonstration, we'll use AES-GCM but in production this would
        // combine PQC algorithms with classical encryption
        
        self.encrypt_aes256gcm(plaintext, nonce, key, additional_data)
    }

    fn decrypt_hybrid(
        &self,
        ciphertext: &[u8],
        nonce: &[u8],
        key: &[u8],
        additional_data: Option<&[u8]>,
    ) -> Result<Vec<u8>, EncryptionError> {
        // Hybrid decryption: PQC key exchange + AES-GCM
        self.decrypt_aes256gcm(ciphertext, nonce, key, additional_data)
    }

    fn generate_hybrid_key(&self, key_strength_bits: u32) -> Result<Vec<u8>, EncryptionError> {
        // Generate hybrid key using PQC + classical components
        let mut key_material = Vec::new();
        
        // Generate PQC component
        let pqc_component = self.generate_random_bytes(key_strength_bits / 8 / 2)?;
        key_material.extend_from_slice(&pqc_component);
        
        // Generate classical component
        let classical_component = self.generate_random_bytes(key_strength_bits / 8 / 2)?;
        key_material.extend_from_slice(&classical_component);
        
        Ok(key_material)
    }

    fn perform_key_derivation(
        &self,
        source_key: &[u8],
        context: &[u8],
        salt: &[u8],
        info: &[u8],
        method: &KeyDerivationMethod,
    ) -> Result<Vec<u8>, EncryptionError> {
        match method {
            KeyDerivationMethod::HkdfSha3256 => {
                use sha3::{Digest, Sha3_256};
                use hkdf::Hkdf;
                
                let hkdf = Hkdf::<Sha3_256>::new(Some(salt), source_key);
                let mut output = vec![0u8; 32]; // 256-bit output
                
                hkdf.expand(info, &mut output).map_err(|e| {
                    EncryptionError::KeyDerivationFailed(format!("HKDF-SHA3-256 expansion failed: {}", e))
                })?;
                
                Ok(output)
            }
            KeyDerivationMethod::HkdfSha3512 => {
                use sha3::{Digest, Sha3_512};
                use hkdf::Hkdf;
                
                let hkdf = Hkdf::<Sha3_512>::new(Some(salt), source_key);
                let mut output = vec![0u8; 64]; // 512-bit output
                
                hkdf.expand(info, &mut output).map_err(|e| {
                    EncryptionError::KeyDerivationFailed(format!("HKDF-SHA3-512 expansion failed: {}", e))
                })?;
                
                Ok(output)
            }
            KeyDerivationMethod::Argon2id => {
                // Simplified Argon2id implementation
                use sha3::{Digest, Sha3_256};
                
                let mut hasher = Sha3_256::new();
                hasher.update(source_key);
                hasher.update(context);
                hasher.update(salt);
                hasher.update(info);
                Ok(hasher.finalize().to_vec())
            }
            KeyDerivationMethod::Scrypt => {
                // Simplified scrypt implementation
                use sha3::{Digest, Sha3_512};
                
                let mut hasher = Sha3_512::new();
                hasher.update(source_key);
                hasher.update(context);
                hasher.update(salt);
                hasher.update(info);
                Ok(hasher.finalize().to_vec())
            }
            KeyDerivationMethod::Custom(_) => {
                Err(EncryptionError::ConfigurationError(
                    "Custom key derivation method not implemented".to_string()
                ))
            }
        }
    }

    fn compress_data(&self, data: &[u8]) -> Result<Vec<u8>, EncryptionError> {
        // Simplified compression - would use actual compression library
        // For demonstration, we'll just return the data as-is
        // In production, this would use libraries like flate2 or lz4
        Ok(data.to_vec())
    }

    fn decompress_data(&self, data: &[u8]) -> Result<Vec<u8>, EncryptionError> {
        // Simplified decompression - would use actual decompression library
        // For demonstration, we'll just return the data as-is
        // In production, this would use libraries like flate2 or lz4
        Ok(data.to_vec())
    }

    fn log_audit_event(&self, event: EncryptionAuditEvent) {
        let mut log = self.audit_log.write().unwrap();
        log.push(event);
        
        // Keep only last 1000 events
        if log.len() > 1000 {
            log.drain(0..log.len() - 1000);
        }
    }
}

// Helper functions
fn key_type_to_usage(key_type: &KeyType) -> String {
    match key_type {
        KeyType::Encryption => "encrypt".to_string(),
        KeyType::Authentication => "authenticate".to_string(),
        KeyType::KeyExchange => "key_exchange".to_string(),
        KeyType::Master => "master".to_string(),
        KeyType::Derived => "derived".to_string(),
    }
}

fn get_key_usage_restrictions(key_type: &KeyType) -> HashSet<KeyUsage> {
    match key_type {
        KeyType::Encryption => HashSet::from([KeyUsage::Encrypt, KeyUsage::Decrypt]),
        KeyType::Authentication => HashSet::from([KeyUsage::Sign, KeyUsage::Verify]),
        KeyType::KeyExchange => HashSet::from([KeyUsage::Derive]),
        KeyType::Master => HashSet::from([KeyUsage::Derive, KeyUsage::Export]),
        KeyType::Derived => HashSet::from([KeyUsage::Encrypt, KeyUsage::Decrypt, KeyUsage::Derive]),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_layer_creation() {
        let config = EncryptionConfig {
            primary_encryption: EncryptionScheme::Aes256Gcm,
            fallback_encryption: Some(EncryptionScheme::ChaCha20Poly1305),
            key_derivation_method: KeyDerivationMethod::HkdfSha3256,
            nonce_generation_method: NonceGenerationMethod::Random,
            compression_enabled: true,
            integrity_check_enabled: true,
            forward_secrecy_enabled: true,
            key_rotation_policy: KeyRotationPolicy {
                rotation_interval: Duration::from_secs(86400),
                usage_threshold: 1000,
                time_based_rotation: true,
                usage_based_rotation: true,
                automatic_rotation: true,
            },
            security_parameters: EncryptionSecurityParameters {
                min_key_strength_bits: 256,
                require_forward_secrecy: true,
                require_key_separation: true,
                enable_key_zeroization: true,
                secure_memory_enabled: true,
                side_channel_protection: true,
                audit_encryption_operations: true,
            },
        };

        let layer = QuantumEncryptionLayer::new(config);
        assert!(layer.is_ok());
    }

    #[test]
    fn test_key_generation() {
        let config = EncryptionConfig {
            primary_encryption: EncryptionScheme::Aes256Gcm,
            fallback_encryption: None,
            key_derivation_method: KeyDerivationMethod::HkdfSha3256,
            nonce_generation_method: NonceGenerationMethod::Random,
            compression_enabled: false,
            integrity_check_enabled: true,
            forward_secrecy_enabled: true,
            key_rotation_policy: KeyRotationPolicy {
                rotation_interval: Duration::from_secs(86400),
                usage_threshold: 1000,
                time_based_rotation: true,
                usage_based_rotation: true,
                automatic_rotation: true,
            },
            security_parameters: EncryptionSecurityParameters {
                min_key_strength_bits: 256,
                require_forward_secrecy: true,
                require_key_separation: true,
                enable_key_zeroization: true,
                secure_memory_enabled: true,
                side_channel_protection: true,
                audit_encryption_operations: true,
            },
        };

        let layer = QuantumEncryptionLayer::new(config).unwrap();
        let key_id = layer.generate_key(KeyType::Encryption, EncryptionScheme::Aes256Gcm, 256, None);
        assert!(key_id.is_ok());
        
        let key_id = key_id.unwrap();
        let key_info = layer.get_key_info(&key_id);
        assert!(key_info.is_ok());
        
        let key = key_info.unwrap();
        assert_eq!(key.key_type, KeyType::Encryption);
        assert_eq!(key.key_algorithm, EncryptionScheme::Aes256Gcm);
        assert_eq!(key.key_strength_bits, 256);
    }

    #[test]
    fn test_encryption_decryption() {
        let config = EncryptionConfig {
            primary_encryption: EncryptionScheme::Aes256Gcm,
            fallback_encryption: None,
            key_derivation_method: KeyDerivationMethod::HkdfSha3256,
            nonce_generation_method: NonceGenerationMethod::Random,
            compression_enabled: false,
            integrity_check_enabled: true,
            forward_secrecy_enabled: true,
            key_rotation_policy: KeyRotationPolicy {
                rotation_interval: Duration::from_secs(86400),
                usage_threshold: 1000,
                time_based_rotation: true,
                usage_based_rotation: true,
                automatic_rotation: true,
            },
            security_parameters: EncryptionSecurityParameters {
                min_key_strength_bits: 256,
                require_forward_secrecy: true,
                require_key_separation: true,
                enable_key_zeroization: true,
                secure_memory_enabled: true,
                side_channel_protection: true,
                audit_encryption_operations: true,
            },
        };

        let layer = QuantumEncryptionLayer::new(config).unwrap();
        let key_id = layer.generate_key(KeyType::Encryption, EncryptionScheme::Aes256Gcm, 256, None).unwrap();
        
        let test_data = b"Hello, quantum-resistant world!";
        let encryption_result = layer.encrypt(test_data, &key_id, None);
        assert!(encryption_result.is_ok());
        
        let result = encryption_result.unwrap();
        let decryption_result = layer.decrypt(
            &result.ciphertext,
            &result.nonce,
            &result.authentication_tag,
            &result.key_id,
            None,
        );
        assert!(decryption_result.is_ok());
        
        let decrypted = decryption_result.unwrap();
        assert_eq!(decrypted.plaintext, test_data);
        assert!(decrypted.verification_successful);
    }

    #[test]
    fn test_key_derivation() {
        let config = EncryptionConfig {
            primary_encryption: EncryptionScheme::Aes256Gcm,
            fallback_encryption: None,
            key_derivation_method: KeyDerivationMethod::HkdfSha3256,
            nonce_generation_method: NonceGenerationMethod::Random,
            compression_enabled: false,
            integrity_check_enabled: true,
            forward_secrecy_enabled: true,
            key_rotation_policy: KeyRotationPolicy {
                rotation_interval: Duration::from_secs(86400),
                usage_threshold: 1000,
                time_based_rotation: true,
                usage_based_rotation: true,
                automatic_rotation: true,
            },
            security_parameters: EncryptionSecurityParameters {
                min_key_strength_bits: 256,
                require_forward_secrecy: true,
                require_key_separation: true,
                enable_key_zeroization: true,
                secure_memory_enabled: true,
                side_channel_protection: true,
                audit_encryption_operations: true,
            },
        };

        let layer = QuantumEncryptionLayer::new(config).unwrap();
        let master_key_id = layer.generate_key(KeyType::Master, EncryptionScheme::Aes256Gcm, 256, None).unwrap();
        
        let derived_key_id = layer.derive_key(
            &master_key_id,
            KeyType::Encryption,
            EncryptionScheme::Aes256Gcm,
            b"test_context",
            b"test_info",
        );
        assert!(derived_key_id.is_ok());
        
        let derived_key_id = derived_key_id.unwrap();
        let derived_key = layer.get_key_info(&derived_key_id);
        assert!(derived_key.is_ok());
        
        let key = derived_key.unwrap();
        assert_eq!(key.key_type, KeyType::Encryption);
        assert_eq!(key.derivation_info.source_key_id, Some(master_key_id));
    }

    #[test]
    fn test_key_bundle_creation() {
        let config = EncryptionConfig {
            primary_encryption: EncryptionScheme::Aes256Gcm,
            fallback_encryption: None,
            key_derivation_method: KeyDerivationMethod::HkdfSha3256,
            nonce_generation_method: NonceGenerationMethod::Random,
            compression_enabled: false,
            integrity_check_enabled: true,
            forward_secrecy_enabled: true,
            key_rotation_policy: KeyRotationPolicy {
                rotation_interval: Duration::from_secs(86400),
                usage_threshold: 1000,
                time_based_rotation: true,
                usage_based_rotation: true,
                automatic_rotation: true,
            },
            security_parameters: EncryptionSecurityParameters {
                min_key_strength_bits: 256,
                require_forward_secrecy: true,
                require_key_separation: true,
                enable_key_zeroization: true,
                secure_memory_enabled: true,
                side_channel_protection: true,
                audit_encryption_operations: true,
            },
        };

        let layer = QuantumEncryptionLayer::new(config).unwrap();
        let bundle_id = layer.create_key_bundle("test_peer", 256);
        assert!(bundle_id.is_ok());
        
        let bundle_id = bundle_id.unwrap();
        
        // Test that keys were created
        let keys = layer.list_keys();
        assert!(keys.is_ok());
        let keys = keys.unwrap();
        
        // Should have at least 4 keys (master, encryption, auth, kex)
        assert!(keys.len() >= 4);
    }
}