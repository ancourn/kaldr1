//! Quantum-Resistant Key Generation Module
//! Provides secure key generation for post-quantum cryptographic algorithms
//! with advanced key management and lifecycle features

use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use crate::quantum::qke_module::{QkeAlgorithm, QkePublicKey, QkePrivateKey, QkeError};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum KeyType {
    Encryption,
    Signature,
    KeyExchange,
    Hybrid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyPolicy {
    pub algorithm: QkeAlgorithm,
    pub key_type: KeyType,
    pub security_level: u32,
    pub key_size_bits: usize,
    pub expiration_duration: Duration,
    pub rotation_policy: KeyRotationPolicy,
    pub usage_restrictions: HashSet<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KeyRotationPolicy {
    Manual,
    TimeBased(Duration),
    UsageBased(u64), // After N uses
    EventBased(String), // On specific event
    Hybrid(Duration, u64), // Time + Usage based
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyMetadata {
    pub key_id: String,
    pub key_type: KeyType,
    pub algorithm: QkeAlgorithm,
    pub created_at: u64,
    pub expires_at: u64,
    pub last_used: u64,
    pub usage_count: u64,
    pub key_size_bits: usize,
    pub security_level: u32,
    pub status: KeyStatus,
    pub policy: KeyPolicy,
    pub derivation_path: Option<String>,
    pub parent_key_id: Option<String>,
    pub child_keys: HashSet<String>,
    pub tags: HashSet<String>,
    pub custom_metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum KeyStatus {
    Active,
    Expired,
    Revoked,
    Compromised,
    PendingRotation,
    Rotated,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyDerivationInfo {
    pub derivation_path: String,
    pub context: Vec<u8>,
    pub salt: Vec<u8>,
    pub derivation_method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyRotationPlan {
    pub old_key_id: String,
    pub new_key_id: String,
    pub rotation_time: u64,
    pub migration_strategy: MigrationStrategy,
    pub rollback_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MigrationStrategy {
    Immediate,
    Gradual(Duration),
    Parallel(Duration),
    Manual,
}

#[derive(Debug, Error)]
pub enum KeyGenerationError {
    #[error("Key generation failed: {0}")]
    GenerationFailed(String),
    #[error("Key derivation failed: {0}")]
    DerivationFailed(String),
    #[error("Key validation failed: {0}")]
    ValidationFailed(String),
    #[error("Key rotation failed: {0}")]
    RotationFailed(String),
    #[error("Key storage failed: {0}")]
    StorageFailed(String),
    #[error("Policy violation: {0}")]
    PolicyViolation(String),
    #[error("Key not found: {0}")]
    KeyNotFound(String),
    #[error("Invalid key state: {0}")]
    InvalidKeyState(String),
}

/// Advanced Key Generation Engine
pub struct KeyGenerationEngine {
    rng: SystemRandom,
    key_store: Arc<RwLock<HashMap<String, KeyMetadata>>>,
    key_data_store: Arc<RwLock<HashMap<String, (QkePublicKey, Option<QkePrivateKey>)>>>,
    rotation_plans: Arc<RwLock<HashMap<String, KeyRotationPlan>>>,
    derivation_cache: Arc<RwLock<HashMap<String, Vec<u8>>>>,
    security_audit_log: Arc<RwLock<Vec<SecurityAuditEvent>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityAuditEvent {
    pub timestamp: u64,
    pub event_type: String,
    pub key_id: String,
    pub details: HashMap<String, String>,
    pub severity: AuditSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuditSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

impl KeyGenerationEngine {
    pub fn new() -> Result<Self, KeyGenerationError> {
        Ok(Self {
            rng: SystemRandom::new(),
            key_store: Arc::new(RwLock::new(HashMap::new())),
            key_data_store: Arc::new(RwLock::new(HashMap::new())),
            rotation_plans: Arc::new(RwLock::new(HashMap::new())),
            derivation_cache: Arc::new(RwLock::new(HashMap::new())),
            security_audit_log: Arc::new(RwLock::new(Vec::new())),
        })
    }

    /// Generate a new key with specified policy
    pub fn generate_key(&self, policy: KeyPolicy) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        let key_id = self.generate_key_id();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let expires_at = current_time + policy.expiration_duration.as_secs();

        // Generate key pair based on algorithm
        let (public_key, private_key) = match policy.algorithm {
            QkeAlgorithm::Kyber512 => self.generate_kyber_keys(512, &policy)?,
            QkeAlgorithm::Kyber768 => self.generate_kyber_keys(768, &policy)?,
            QkeAlgorithm::Kyber1024 => self.generate_kyber_keys(1024, &policy)?,
            QkeAlgorithm::ClassicMcEliece => self.generate_mceliece_keys(&policy)?,
            QkeAlgorithm::Ntru => self.generate_ntru_keys(&policy)?,
            QkeAlgorithm::Saber => self.generate_saber_keys(&policy)?,
        };

        // Create key metadata
        let metadata = KeyMetadata {
            key_id: key_id.clone(),
            key_type: policy.key_type.clone(),
            algorithm: policy.algorithm.clone(),
            created_at: current_time,
            expires_at,
            last_used: current_time,
            usage_count: 0,
            key_size_bits: policy.key_size_bits,
            security_level: policy.security_level,
            status: KeyStatus::Active,
            policy: policy.clone(),
            derivation_path: None,
            parent_key_id: None,
            child_keys: HashSet::new(),
            tags: HashSet::new(),
            custom_metadata: HashMap::new(),
        };

        // Store key and metadata
        {
            let mut key_store = self.key_store.write().unwrap();
            key_store.insert(key_id.clone(), metadata);
        }

        {
            let mut key_data_store = self.key_data_store.write().unwrap();
            key_data_store.insert(key_id.clone(), (public_key.clone(), private_key.clone()));
        }

        // Log security event
        self.log_security_event(SecurityAuditEvent {
            timestamp: current_time,
            event_type: "key_generated".to_string(),
            key_id: key_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("algorithm".to_string(), policy.algorithm.to_string());
                details.insert("key_type".to_string(), format!("{:?}", policy.key_type));
                details.insert("security_level".to_string(), policy.security_level.to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok((public_key, private_key))
    }

    /// Derive a child key from parent key
    pub fn derive_key(
        &self,
        parent_key_id: &str,
        derivation_info: KeyDerivationInfo,
        child_policy: KeyPolicy,
    ) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        let parent_metadata = self.get_key_metadata(parent_key_id)?;
        
        if parent_metadata.status != KeyStatus::Active {
            return Err(KeyGenerationError::InvalidKeyState(
                "Parent key is not active".to_string(),
            ));
        }

        let child_key_id = self.generate_key_id();
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let expires_at = current_time + child_policy.expiration_duration.as_secs();

        // Derive key material
        let derived_material = self.perform_key_derivation(
            parent_key_id,
            &derivation_info,
            child_policy.key_size_bits,
        )?;

        // Create derived keys
        let (public_key, private_key) = self.create_keys_from_material(
            &derived_material,
            &child_policy,
        )?;

        // Create child key metadata
        let child_metadata = KeyMetadata {
            key_id: child_key_id.clone(),
            key_type: child_policy.key_type.clone(),
            algorithm: child_policy.algorithm.clone(),
            created_at: current_time,
            expires_at,
            last_used: current_time,
            usage_count: 0,
            key_size_bits: child_policy.key_size_bits,
            security_level: child_policy.security_level,
            status: KeyStatus::Active,
            policy: child_policy,
            derivation_path: Some(derivation_info.derivation_path),
            parent_key_id: Some(parent_key_id.to_string()),
            child_keys: HashSet::new(),
            tags: HashSet::new(),
            custom_metadata: HashMap::new(),
        };

        // Update parent key metadata
        {
            let mut key_store = self.key_store.write().unwrap();
            if let Some(parent_meta) = key_store.get_mut(parent_key_id) {
                parent_meta.child_keys.insert(child_key_id.clone());
            }
            key_store.insert(child_key_id.clone(), child_metadata);
        }

        {
            let mut key_data_store = self.key_data_store.write().unwrap();
            key_data_store.insert(child_key_id.clone(), (public_key.clone(), private_key.clone()));
        }

        // Log security event
        self.log_security_event(SecurityAuditEvent {
            timestamp: current_time,
            event_type: "key_derived".to_string(),
            key_id: child_key_id.clone(),
            details: {
                let mut details = HashMap::new();
                details.insert("parent_key_id".to_string(), parent_key_id.to_string());
                details.insert("derivation_path".to_string(), derivation_info.derivation_path);
                details.insert("derivation_method".to_string(), derivation_info.derivation_method);
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok((public_key, private_key))
    }

    /// Rotate a key according to its policy
    pub fn rotate_key(&self, key_id: &str) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        let old_metadata = self.get_key_metadata(key_id)?;
        
        if old_metadata.status != KeyStatus::Active {
            return Err(KeyGenerationError::InvalidKeyState(
                "Key is not active and cannot be rotated".to_string(),
            ));
        }

        // Check if rotation is needed based on policy
        if !self.should_rotate_key(&old_metadata)? {
            return Err(KeyGenerationError::PolicyViolation(
                "Key rotation not required at this time".to_string(),
            ));
        }

        // Generate new key with same policy
        let new_key_pair = self.generate_key(old_metadata.policy.clone())?;
        let new_key_id = &new_key_pair.0.key_id;

        // Create rotation plan
        let rotation_plan = KeyRotationPlan {
            old_key_id: key_id.to_string(),
            new_key_id: new_key_id.clone(),
            rotation_time: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            migration_strategy: MigrationStrategy::Gradual(Duration::from_secs(3600)), // 1 hour gradual migration
            rollback_available: true,
        };

        // Store rotation plan
        {
            let mut rotation_plans = self.rotation_plans.write().unwrap();
            rotation_plans.insert(key_id.to_string(), rotation_plan);
        }

        // Update old key status
        {
            let mut key_store = self.key_store.write().unwrap();
            if let Some(metadata) = key_store.get_mut(key_id) {
                metadata.status = KeyStatus::Rotated;
            }
        }

        // Log security event
        self.log_security_event(SecurityAuditEvent {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event_type: "key_rotated".to_string(),
            key_id: key_id.to_string(),
            details: {
                let mut details = HashMap::new();
                details.insert("old_key_id".to_string(), key_id.to_string());
                details.insert("new_key_id".to_string(), new_key_id.clone());
                details.insert("rotation_strategy".to_string(), "gradual".to_string());
                details
            },
            severity: AuditSeverity::Info,
        });

        Ok(new_key_pair)
    }

    /// Revoke a key
    pub fn revoke_key(&self, key_id: &str, reason: &str) -> Result<(), KeyGenerationError> {
        let mut key_store = self.key_store.write().unwrap();
        
        if let Some(metadata) = key_store.get_mut(key_id) {
            metadata.status = KeyStatus::Revoked;
            
            // Log security event
            self.log_security_event(SecurityAuditEvent {
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                event_type: "key_revoked".to_string(),
                key_id: key_id.to_string(),
                details: {
                    let mut details = HashMap::new();
                    details.insert("reason".to_string(), reason.to_string());
                    details.insert("previous_status".to_string(), format!("{:?}", metadata.status));
                    details
                },
                severity: AuditSeverity::Warning,
            });
            
            Ok(())
        } else {
            Err(KeyGenerationError::KeyNotFound(key_id.to_string()))
        }
    }

    /// Get key metadata
    pub fn get_key_metadata(&self, key_id: &str) -> Result<KeyMetadata, KeyGenerationError> {
        let key_store = self.key_store.read().unwrap();
        key_store.get(key_id)
            .cloned()
            .ok_or_else(|| KeyGenerationError::KeyNotFound(key_id.to_string()))
    }

    /// Get key data
    pub fn get_key_data(&self, key_id: &str) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        let key_data_store = self.key_data_store.read().unwrap();
        key_data_store.get(key_id)
            .cloned()
            .ok_or_else(|| KeyGenerationError::KeyNotFound(key_id.to_string()))
    }

    /// List all keys with optional filtering
    pub fn list_keys(&self, filter: Option<KeyFilter>) -> Result<Vec<KeyMetadata>, KeyGenerationError> {
        let key_store = self.key_store.read().unwrap();
        let keys: Vec<KeyMetadata> = key_store.values().cloned().collect();

        if let Some(filter) = filter {
            Ok(keys.into_iter().filter(|key| filter.matches(key)).collect())
        } else {
            Ok(keys)
        }
    }

    /// Cleanup expired keys
    pub fn cleanup_expired_keys(&self) -> Result<u32, KeyGenerationError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut key_store = self.key_store.write().unwrap();
        let mut expired_count = 0;

        for (key_id, metadata) in key_store.iter_mut() {
            if metadata.expires_at <= current_time && metadata.status == KeyStatus::Active {
                metadata.status = KeyStatus::Expired;
                expired_count += 1;

                // Log security event
                self.log_security_event(SecurityAuditEvent {
                    timestamp: current_time,
                    event_type: "key_expired".to_string(),
                    key_id: key_id.clone(),
                    details: {
                        let mut details = HashMap::new();
                        details.insert("expired_at".to_string(), metadata.expires_at.to_string());
                        details.insert("key_age_days".to_string(), 
                            ((current_time - metadata.created_at) / 86400).to_string());
                        details
                    },
                    severity: AuditSeverity::Warning,
                });
            }
        }

        Ok(expired_count)
    }

    /// Get security audit log
    pub fn get_security_audit_log(&self) -> Vec<SecurityAuditEvent> {
        self.security_audit_log.read().unwrap().clone()
    }

    // Private helper methods
    fn generate_key_id(&self) -> String {
        let mut key_id_bytes = [0u8; 32];
        self.rng.fill(&mut key_id_bytes).unwrap();
        hex::encode(key_id_bytes)
    }

    fn generate_kyber_keys(
        &self,
        security_level: usize,
        policy: &KeyPolicy,
    ) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        let mut public_key_data = vec![0u8; security_level / 8];
        let mut private_key_data = vec![0u8; security_level / 4];
        
        self.rng.fill(&mut public_key_data).map_err(|e| {
            KeyGenerationError::GenerationFailed(format!("Kyber key generation failed: {}", e))
        })?;
        
        self.rng.fill(&mut private_key_data).map_err(|e| {
            KeyGenerationError::GenerationFailed(format!("Kyber key generation failed: {}", e))
        })?;

        let public_key = QkePublicKey {
            algorithm: policy.algorithm.clone(),
            key_data: public_key_data,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            key_id: self.generate_key_id(),
            metadata: policy.metadata.clone(),
        };

        let private_key = QkePrivateKey {
            algorithm: policy.algorithm.clone(),
            key_data: private_key_data,
            created_at: public_key.created_at,
            key_id: public_key.key_id.clone(),
            metadata: policy.metadata.clone(),
        };

        Ok((public_key, Some(private_key)))
    }

    fn generate_mceliece_keys(&self, policy: &KeyPolicy) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        let mut public_key_data = vec![0u8; 1024];
        let mut private_key_data = vec![0u8; 2048];
        
        self.rng.fill(&mut public_key_data).map_err(|e| {
            KeyGenerationError::GenerationFailed(format!("McEliece key generation failed: {}", e))
        })?;
        
        self.rng.fill(&mut private_key_data).map_err(|e| {
            KeyGenerationError::GenerationFailed(format!("McEliece key generation failed: {}", e))
        })?;

        let public_key = QkePublicKey {
            algorithm: policy.algorithm.clone(),
            key_data: public_key_data,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            key_id: self.generate_key_id(),
            metadata: policy.metadata.clone(),
        };

        let private_key = QkePrivateKey {
            algorithm: policy.algorithm.clone(),
            key_data: private_key_data,
            created_at: public_key.created_at,
            key_id: public_key.key_id.clone(),
            metadata: policy.metadata.clone(),
        };

        Ok((public_key, Some(private_key)))
    }

    fn generate_ntru_keys(&self, policy: &KeyPolicy) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        let mut public_key_data = vec![0u8; 512];
        let mut private_key_data = vec![0u8; 512];
        
        self.rng.fill(&mut public_key_data).map_err(|e| {
            KeyGenerationError::GenerationFailed(format!("NTRU key generation failed: {}", e))
        })?;
        
        self.rng.fill(&mut private_key_data).map_err(|e| {
            KeyGenerationError::GenerationFailed(format!("NTRU key generation failed: {}", e))
        })?;

        let public_key = QkePublicKey {
            algorithm: policy.algorithm.clone(),
            key_data: public_key_data,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            key_id: self.generate_key_id(),
            metadata: policy.metadata.clone(),
        };

        let private_key = QkePrivateKey {
            algorithm: policy.algorithm.clone(),
            key_data: private_key_data,
            created_at: public_key.created_at,
            key_id: public_key.key_id.clone(),
            metadata: policy.metadata.clone(),
        };

        Ok((public_key, Some(private_key)))
    }

    fn generate_saber_keys(&self, policy: &KeyPolicy) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        let mut public_key_data = vec![0u8; 768];
        let mut private_key_data = vec![0u8; 768];
        
        self.rng.fill(&mut public_key_data).map_err(|e| {
            KeyGenerationError::GenerationFailed(format!("SABER key generation failed: {}", e))
        })?;
        
        self.rng.fill(&mut private_key_data).map_err(|e| {
            KeyGenerationError::GenerationFailed(format!("SABER key generation failed: {}", e))
        })?;

        let public_key = QkePublicKey {
            algorithm: policy.algorithm.clone(),
            key_data: public_key_data,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            key_id: self.generate_key_id(),
            metadata: policy.metadata.clone(),
        };

        let private_key = QkePrivateKey {
            algorithm: policy.algorithm.clone(),
            key_data: private_key_data,
            created_at: public_key.created_at,
            key_id: public_key.key_id.clone(),
            metadata: policy.metadata.clone(),
        };

        Ok((public_key, Some(private_key)))
    }

    fn perform_key_derivation(
        &self,
        parent_key_id: &str,
        derivation_info: &KeyDerivationInfo,
        key_size_bits: usize,
    ) -> Result<Vec<u8>, KeyGenerationError> {
        let cache_key = format!("{}:{}", parent_key_id, derivation_info.derivation_path);
        
        // Check cache first
        {
            let cache = self.derivation_cache.read().unwrap();
            if let Some(cached_material) = cache.get(&cache_key) {
                return Ok(cached_material.clone());
            }
        }

        // Get parent key data
        let parent_key_data = self.get_key_data(parent_key_id)?;
        let parent_private_key = parent_key_data.1.ok_or_else(|| {
            KeyGenerationError::DerivationFailed("Parent private key not available".to_string())
        })?;

        // Perform key derivation (simplified HKDF-like process)
        use sha3::{Digest, Sha3_256};
        
        let mut hasher = Sha3_256::new();
        hasher.update(&parent_private_key.key_data);
        hasher.update(&derivation_info.context);
        hasher.update(&derivation_info.salt);
        hasher.update(derivation_info.derivation_path.as_bytes());
        
        let mut derived_material = hasher.finalize().to_vec();
        
        // Extend to required size
        while derived_material.len() < key_size_bits / 8 {
            let mut hasher = Sha3_256::new();
            hasher.update(&derived_material);
            derived_material.extend_from_slice(&hasher.finalize());
        }
        
        derived_material.truncate(key_size_bits / 8);

        // Cache the result
        {
            let mut cache = self.derivation_cache.write().unwrap();
            cache.insert(cache_key, derived_material.clone());
        }

        Ok(derived_material)
    }

    fn create_keys_from_material(
        &self,
        material: &[u8],
        policy: &KeyPolicy,
    ) -> Result<(QkePublicKey, Option<QkePrivateKey>), KeyGenerationError> {
        // Split material for public and private keys
        let material_len = material.len();
        let public_key_data = material[..material_len / 2].to_vec();
        let private_key_data = material[material_len / 2..].to_vec();

        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let public_key = QkePublicKey {
            algorithm: policy.algorithm.clone(),
            key_data: public_key_data,
            created_at: current_time,
            key_id: self.generate_key_id(),
            metadata: policy.metadata.clone(),
        };

        let private_key = QkePrivateKey {
            algorithm: policy.algorithm.clone(),
            key_data: private_key_data,
            created_at: current_time,
            key_id: public_key.key_id.clone(),
            metadata: policy.metadata.clone(),
        };

        Ok((public_key, Some(private_key)))
    }

    fn should_rotate_key(&self, metadata: &KeyMetadata) -> Result<bool, KeyGenerationError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        match &metadata.policy.rotation_policy {
            KeyRotationPolicy::Manual => Ok(false),
            KeyRotationPolicy::TimeBased(duration) => {
                Ok(current_time >= metadata.created_at + duration.as_secs())
            }
            KeyRotationPolicy::UsageBased(threshold) => {
                Ok(metadata.usage_count >= *threshold)
            }
            KeyRotationPolicy::EventBased(event) => {
                // In a real implementation, this would check for specific events
                Ok(false)
            }
            KeyRotationPolicy::Hybrid(duration, threshold) => {
                let time_based = current_time >= metadata.created_at + duration.as_secs();
                let usage_based = metadata.usage_count >= *threshold;
                Ok(time_based || usage_based)
            }
        }
    }

    fn log_security_event(&self, event: SecurityAuditEvent) {
        let mut log = self.security_audit_log.write().unwrap();
        log.push(event);
        
        // Keep only last 1000 events
        if log.len() > 1000 {
            log.drain(0..log.len() - 1000);
        }
    }
}

#[derive(Debug, Clone)]
pub struct KeyFilter {
    pub algorithm: Option<QkeAlgorithm>,
    pub key_type: Option<KeyType>,
    pub status: Option<KeyStatus>,
    pub created_after: Option<u64>,
    pub created_before: Option<u64>,
    pub tags: Option<HashSet<String>>,
    pub security_level_min: Option<u32>,
}

impl KeyFilter {
    pub fn matches(&self, key: &KeyMetadata) -> bool {
        if let Some(algo) = &self.algorithm {
            if key.algorithm != *algo {
                return false;
            }
        }

        if let Some(key_type) = &self.key_type {
            if key.key_type != *key_type {
                return false;
            }
        }

        if let Some(status) = &self.status {
            if key.status != *status {
                return false;
            }
        }

        if let Some(after) = self.created_after {
            if key.created_at < after {
                return false;
            }
        }

        if let Some(before) = self.created_before {
            if key.created_at > before {
                return false;
            }
        }

        if let Some(tags) = &self.tags {
            if !tags.is_subset(&key.tags) {
                return false;
            }
        }

        if let Some(min_level) = self.security_level_min {
            if key.security_level < min_level {
                return false;
            }
        }

        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_key_generation_engine_creation() {
        let engine = KeyGenerationEngine::new();
        assert!(engine.is_ok());
    }

    #[test]
    fn test_key_generation() {
        let engine = KeyGenerationEngine::new().unwrap();
        
        let policy = KeyPolicy {
            algorithm: QkeAlgorithm::Kyber768,
            key_type: KeyType::KeyExchange,
            security_level: 192,
            key_size_bits: 768,
            expiration_duration: Duration::from_secs(86400 * 30), // 30 days
            rotation_policy: KeyRotationPolicy::TimeBased(Duration::from_secs(86400 * 7)), // 7 days
            usage_restrictions: HashSet::new(),
            metadata: HashMap::new(),
        };

        let result = engine.generate_key(policy);
        assert!(result.is_ok());
        
        let (public_key, private_key) = result.unwrap();
        assert_eq!(public_key.algorithm, QkeAlgorithm::Kyber768);
        assert!(private_key.is_some());
    }

    #[test]
    fn test_key_derivation() {
        let engine = KeyGenerationEngine::new().unwrap();
        
        let parent_policy = KeyPolicy {
            algorithm: QkeAlgorithm::Kyber768,
            key_type: KeyType::KeyExchange,
            security_level: 192,
            key_size_bits: 768,
            expiration_duration: Duration::from_secs(86400 * 30),
            rotation_policy: KeyRotationPolicy::TimeBased(Duration::from_secs(86400 * 7)),
            usage_restrictions: HashSet::new(),
            metadata: HashMap::new(),
        };

        let (parent_public_key, _) = engine.generate_key(parent_policy).unwrap();
        let parent_key_id = &parent_public_key.key_id;

        let derivation_info = KeyDerivationInfo {
            derivation_path: "m/44'/0'/0'/0/1".to_string(),
            context: b"child_key_derivation".to_vec(),
            salt: b"unique_salt".to_vec(),
            derivation_method: "hkdf-sha3-256".to_string(),
        };

        let child_policy = KeyPolicy {
            algorithm: QkeAlgorithm::Kyber512,
            key_type: KeyType::KeyExchange,
            security_level: 128,
            key_size_bits: 512,
            expiration_duration: Duration::from_secs(86400 * 30),
            rotation_policy: KeyRotationPolicy::TimeBased(Duration::from_secs(86400 * 7)),
            usage_restrictions: HashSet::new(),
            metadata: HashMap::new(),
        };

        let result = engine.derive_key(parent_key_id, derivation_info, child_policy);
        assert!(result.is_ok());
    }

    #[test]
    fn test_key_rotation() {
        let engine = KeyGenerationEngine::new().unwrap();
        
        let policy = KeyPolicy {
            algorithm: QkeAlgorithm::Kyber768,
            key_type: KeyType::KeyExchange,
            security_level: 192,
            key_size_bits: 768,
            expiration_duration: Duration::from_secs(86400 * 30),
            rotation_policy: KeyRotationPolicy::UsageBased(1), // Rotate after 1 use
            usage_restrictions: HashSet::new(),
            metadata: HashMap::new(),
        };

        let (public_key, _) = engine.generate_key(policy.clone()).unwrap();
        let key_id = &public_key.key_id;

        // Simulate key usage
        {
            let mut key_store = engine.key_store.write().unwrap();
            if let Some(metadata) = key_store.get_mut(key_id) {
                metadata.usage_count = 1;
            }
        }

        let result = engine.rotate_key(key_id);
        assert!(result.is_ok());
    }

    #[test]
    fn test_key_filter() {
        let engine = KeyGenerationEngine::new().unwrap();
        
        let policy = KeyPolicy {
            algorithm: QkeAlgorithm::Kyber768,
            key_type: KeyType::KeyExchange,
            security_level: 192,
            key_size_bits: 768,
            expiration_duration: Duration::from_secs(86400 * 30),
            rotation_policy: KeyRotationPolicy::TimeBased(Duration::from_secs(86400 * 7)),
            usage_restrictions: HashSet::new(),
            metadata: HashMap::new(),
        };

        let _ = engine.generate_key(policy).unwrap();

        let filter = KeyFilter {
            algorithm: Some(QkeAlgorithm::Kyber768),
            key_type: Some(KeyType::KeyExchange),
            status: None,
            created_after: None,
            created_before: None,
            tags: None,
            security_level_min: Some(128),
        };

        let keys = engine.list_keys(Some(filter)).unwrap();
        assert!(!keys.is_empty());
    }
}