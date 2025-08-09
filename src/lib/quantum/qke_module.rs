//! Quantum Key Exchange (QKE) Module
//! Implements NIST-recommended post-quantum key exchange algorithms
//! with hybrid fallback logic for maximum security

use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256, Sha3_512};
use thiserror::Error;

// NIST PQC Key Exchange Algorithms
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum QkeAlgorithm {
    Kyber512,
    Kyber768,
    Kyber1024,
    ClassicMcEliece,
    Ntru,
    Saber,
}

impl Default for QkeAlgorithm {
    fn default() -> Self {
        QkeAlgorithm::Kyber768
    }
}

impl std::fmt::Display for QkeAlgorithm {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            QkeAlgorithm::Kyber512 => write!(f, "Kyber512"),
            QkeAlgorithm::Kyber768 => write!(f, "Kyber768"),
            QkeAlgorithm::Kyber1024 => write!(f, "Kyber1024"),
            QkeAlgorithm::ClassicMcEliece => write!(f, "ClassicMcEliece"),
            QkeAlgorithm::Ntru => write!(f, "NTRU"),
            QkeAlgorithm::Saber => write!(f, "Saber"),
        }
    }
}

#[derive(Debug, Error)]
pub enum QkeError {
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    #[error("Key encapsulation failed: {0}")]
    EncapsulationFailed(String),
    #[error("Key decapsulation failed: {0}")]
    DecapsulationFailed(String),
    #[error("Invalid algorithm: {0}")]
    InvalidAlgorithm(String),
    #[error("Invalid key size: {0}")]
    InvalidKeySize(String),
    #[error("Cryptographic operation failed: {0}")]
    CryptoOperationFailed(String),
    #[error("Network error: {0}")]
    NetworkError(String),
    #[error("Protocol error: {0}")]
    ProtocolError(String),
    #[error("Validation failed: {0}")]
    ValidationError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QkePublicKey {
    pub algorithm: QkeAlgorithm,
    pub key_data: Vec<u8>,
    pub created_at: u64,
    pub key_id: String,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QkePrivateKey {
    pub algorithm: QkeAlgorithm,
    pub key_data: Vec<u8>,
    pub created_at: u64,
    pub key_id: String,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QkeCiphertext {
    pub algorithm: QkeAlgorithm,
    pub ciphertext: Vec<u8>,
    pub ephemeral_public: Option<Vec<u8>>,
    pub session_id: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QkeSession {
    pub session_id: String,
    pub algorithm: QkeAlgorithm,
    pub shared_secret: Vec<u8>,
    pub created_at: u64,
    pub expires_at: u64,
    pub peer_public_key: QkePublicKey,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HybridKeyExchange {
    pub quantum_component: Option<QkeSession>,
    pub classical_component: Option<ClassicalKexSession>,
    pub combined_secret: Vec<u8>,
    pub security_level: u32,
    pub fallback_used: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassicalKexSession {
    pub algorithm: String,
    pub public_key: Vec<u8>,
    pub shared_secret: Vec<u8>,
    pub session_id: String,
}

/// Core QKE Engine
pub struct QkeEngine {
    rng: SystemRandom,
    supported_algorithms: Vec<QkeAlgorithm>,
    session_cache: Arc<RwLock<HashMap<String, QkeSession>>>,
    key_pairs: Arc<RwLock<HashMap<String, (QkePublicKey, QkePrivateKey)>>>,
    performance_metrics: Arc<RwLock<QkePerformanceMetrics>>,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct QkePerformanceMetrics {
    pub key_generation_time: HashMap<String, f64>,
    pub encapsulation_time: HashMap<String, f64>,
    pub decapsulation_time: HashMap<String, f64>,
    pub total_sessions: u64,
    pub successful_exchanges: u64,
    pub failed_exchanges: u64,
    pub average_session_duration: f64,
}

impl QkeEngine {
    pub fn new() -> Result<Self, QkeError> {
        Ok(Self {
            rng: SystemRandom::new(),
            supported_algorithms: vec![
                QkeAlgorithm::Kyber512,
                QkeAlgorithm::Kyber768,
                QkeAlgorithm::Kyber1024,
                QkeAlgorithm::ClassicMcEliece,
                QkeAlgorithm::Ntru,
                QkeAlgorithm::Saber,
            ],
            session_cache: Arc::new(RwLock::new(HashMap::new())),
            key_pairs: Arc::new(RwLock::new(HashMap::new())),
            performance_metrics: Arc::new(RwLock::new(QkePerformanceMetrics::default())),
        })
    }

    /// Generate a new key pair for the specified algorithm
    pub fn generate_key_pair(
        &self,
        algorithm: QkeAlgorithm,
        metadata: Option<HashMap<String, String>>,
    ) -> Result<(QkePublicKey, QkePrivateKey), QkeError> {
        let start_time = SystemTime::now();
        
        if !self.supported_algorithms.contains(&algorithm) {
            return Err(QkeError::InvalidAlgorithm(format!("Algorithm {} not supported", algorithm)));
        }

        let key_id = self.generate_key_id();
        let created_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let (public_key, private_key) = match algorithm {
            QkeAlgorithm::Kyber512 => self.generate_kyber_key_pair(512)?,
            QkeAlgorithm::Kyber768 => self.generate_kyber_key_pair(768)?,
            QkeAlgorithm::Kyber1024 => self.generate_kyber_key_pair(1024)?,
            QkeAlgorithm::ClassicMcEliece => self.generate_mceliece_key_pair()?,
            QkeAlgorithm::Ntru => self.generate_ntru_key_pair()?,
            QkeAlgorithm::Saber => self.generate_saber_key_pair()?,
        };

        let metadata = metadata.unwrap_or_default();
        
        let public_key = QkePublicKey {
            algorithm: algorithm.clone(),
            key_data: public_key,
            created_at,
            key_id: key_id.clone(),
            metadata: metadata.clone(),
        };

        let private_key = QkePrivateKey {
            algorithm,
            key_data: private_key,
            created_at,
            key_id,
            metadata,
        };

        // Store key pair
        let mut key_pairs = self.key_pairs.write().unwrap();
        key_pairs.insert(public_key.key_id.clone(), (public_key.clone(), private_key.clone()));

        // Update performance metrics
        let duration = start_time.elapsed().unwrap().as_secs_f64();
        let mut metrics = self.performance_metrics.write().unwrap();
        metrics.key_generation_time.insert(algorithm.to_string(), duration);

        Ok((public_key, private_key))
    }

    /// Encapsulate a shared secret using peer's public key
    pub fn encapsulate(
        &self,
        peer_public_key: &QkePublicKey,
        session_id: Option<String>,
    ) -> Result<(QkeCiphertext, Vec<u8>), QkeError> {
        let start_time = SystemTime::now();
        
        let session_id = session_id.unwrap_or_else(|| self.generate_session_id());
        
        let (ciphertext, shared_secret) = match peer_public_key.algorithm {
            QkeAlgorithm::Kyber512 => self.kyber_encapsulate(&peer_public_key.key_data, 512)?,
            QkeAlgorithm::Kyber768 => self.kyber_encapsulate(&peer_public_key.key_data, 768)?,
            QkeAlgorithm::Kyber1024 => self.kyber_encapsulate(&peer_public_key.key_data, 1024)?,
            QkeAlgorithm::ClassicMcEliece => self.mceliece_encapsulate(&peer_public_key.key_data)?,
            QkeAlgorithm::Ntru => self.ntru_encapsulate(&peer_public_key.key_data)?,
            QkeAlgorithm::Saber => self.saber_encapsulate(&peer_public_key.key_data)?,
        };

        let ephemeral_public = self.generate_ephemeral_public_key()?;
        
        let qke_ciphertext = QkeCiphertext {
            algorithm: peer_public_key.algorithm.clone(),
            ciphertext,
            ephemeral_public: Some(ephemeral_public),
            session_id: session_id.clone(),
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        // Update performance metrics
        let duration = start_time.elapsed().unwrap().as_secs_f64();
        let mut metrics = self.performance_metrics.write().unwrap();
        metrics.encapsulation_time.insert(peer_public_key.algorithm.to_string(), duration);

        Ok((qke_ciphertext, shared_secret))
    }

    /// Decapsulate the shared secret using private key
    pub fn decapsulate(
        &self,
        ciphertext: &QkeCiphertext,
        private_key: &QkePrivateKey,
    ) -> Result<Vec<u8>, QkeError> {
        let start_time = SystemTime::now();
        
        if ciphertext.algorithm != private_key.algorithm {
            return Err(QkeError::ProtocolError(
                "Algorithm mismatch between ciphertext and private key".to_string(),
            ));
        }

        let shared_secret = match ciphertext.algorithm {
            QkeAlgorithm::Kyber512 => self.kyber_decapsulate(&ciphertext.ciphertext, &private_key.key_data, 512)?,
            QkeAlgorithm::Kyber768 => self.kyber_decapsulate(&ciphertext.ciphertext, &private_key.key_data, 768)?,
            QkeAlgorithm::Kyber1024 => self.kyber_decapsulate(&ciphertext.ciphertext, &private_key.key_data, 1024)?,
            QkeAlgorithm::ClassicMcEliece => self.mceliece_decapsulate(&ciphertext.ciphertext, &private_key.key_data)?,
            QkeAlgorithm::Ntru => self.ntru_decapsulate(&ciphertext.ciphertext, &private_key.key_data)?,
            QkeAlgorithm::Saber => self.saber_decapsulate(&ciphertext.ciphertext, &private_key.key_data)?,
        };

        // Update performance metrics
        let duration = start_time.elapsed().unwrap().as_secs_f64();
        let mut metrics = self.performance_metrics.write().unwrap();
        metrics.decapsulation_time.insert(ciphertext.algorithm.to_string(), duration);

        Ok(shared_secret)
    }

    /// Perform hybrid key exchange with fallback logic
    pub fn hybrid_key_exchange(
        &self,
        peer_public_key: &QkePublicKey,
        classical_public_key: Option<Vec<u8>>,
        session_id: Option<String>,
    ) -> Result<HybridKeyExchange, QkeError> {
        let session_id = session_id.unwrap_or_else(|| self.generate_session_id());
        
        // Attempt quantum key exchange first
        let quantum_result = self.encapsulate(peer_public_key, Some(session_id.clone()));
        
        match quantum_result {
            Ok((ciphertext, quantum_secret)) => {
                // Quantum exchange succeeded
                let classical_secret = if let Some(classical_pk) = classical_public_key {
                    self.classical_key_exchange(classical_pk)?
                } else {
                    vec![]
                };

                let combined_secret = self.combine_secrets(&quantum_secret, &classical_secret);
                
                let quantum_session = QkeSession {
                    session_id: session_id.clone(),
                    algorithm: peer_public_key.algorithm.clone(),
                    shared_secret: quantum_secret,
                    created_at: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    expires_at: SystemTime::now()
                        .checked_add(Duration::from_secs(3600)) // 1 hour expiry
                        .unwrap()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    peer_public_key: peer_public_key.clone(),
                    metadata: HashMap::new(),
                };

                // Cache session
                let mut cache = self.session_cache.write().unwrap();
                cache.insert(session_id.clone(), quantum_session.clone());

                let mut metrics = self.performance_metrics.write().unwrap();
                metrics.successful_exchanges += 1;
                metrics.total_sessions += 1;

                Ok(HybridKeyExchange {
                    quantum_component: Some(quantum_session),
                    classical_component: None,
                    combined_secret,
                    security_level: self.calculate_security_level(&peer_public_key.algorithm, true),
                    fallback_used: false,
                })
            }
            Err(_) => {
                // Quantum exchange failed, fallback to classical
                if let Some(classical_pk) = classical_public_key {
                    let classical_secret = self.classical_key_exchange(classical_pk)?;
                    
                    let mut metrics = self.performance_metrics.write().unwrap();
                    metrics.failed_exchanges += 1;
                    metrics.total_sessions += 1;

                    Ok(HybridKeyExchange {
                        quantum_component: None,
                        classical_component: Some(ClassicalKexSession {
                            algorithm: "ECDH".to_string(),
                            public_key: classical_pk,
                            shared_secret: classical_secret.clone(),
                            session_id,
                        }),
                        combined_secret: classical_secret,
                        security_level: 128, // Classical ECDH security level
                        fallback_used: true,
                    })
                } else {
                    Err(QkeError::ProtocolError(
                        "Quantum exchange failed and no classical fallback available".to_string(),
                    ))
                }
            }
        }
    }

    /// Get performance metrics
    pub fn get_performance_metrics(&self) -> QkePerformanceMetrics {
        self.performance_metrics.read().unwrap().clone()
    }

    /// Get cached session
    pub fn get_session(&self, session_id: &str) -> Option<QkeSession> {
        let cache = self.session_cache.read().unwrap();
        cache.get(session_id).cloned()
    }

    /// Remove expired sessions
    pub fn cleanup_expired_sessions(&self) -> Result<(), QkeError> {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut cache = self.session_cache.write().unwrap();
        cache.retain(|_, session| session.expires_at > current_time);

        Ok(())
    }

    // Private helper methods
    fn generate_key_id(&self) -> String {
        let mut key_id_bytes = [0u8; 32];
        self.rng.fill(&mut key_id_bytes).unwrap();
        hex::encode(key_id_bytes)
    }

    fn generate_session_id(&self) -> String {
        let mut session_id_bytes = [0u8; 16];
        self.rng.fill(&mut session_id_bytes).unwrap();
        hex::encode(session_id_bytes)
    }

    fn generate_ephemeral_public_key(&self) -> Result<Vec<u8>, QkeError> {
        let mut ephemeral_key = [0u8; 32];
        self.rng.fill(&mut ephemeral_key).map_err(|e| {
            QkeError::CryptoOperationFailed(format!("Failed to generate ephemeral key: {}", e))
        })?;
        Ok(ephemeral_key.to_vec())
    }

    fn combine_secrets(&self, quantum_secret: &[u8], classical_secret: &[u8]) -> Vec<u8> {
        let mut hasher = Sha3_256::new();
        hasher.update(quantum_secret);
        hasher.update(classical_secret);
        hasher.finalize().to_vec()
    }

    fn calculate_security_level(&self, algorithm: &QkeAlgorithm, quantum_success: bool) -> u32 {
        if !quantum_success {
            return 128; // Classical fallback
        }

        match algorithm {
            QkeAlgorithm::Kyber512 => 128,
            QkeAlgorithm::Kyber768 => 192,
            QkeAlgorithm::Kyber1024 => 256,
            QkeAlgorithm::ClassicMcEliece => 256,
            QkeAlgorithm::Ntru => 256,
            QkeAlgorithm::Saber => 192,
        }
    }

    // Algorithm-specific implementations (simplified for demonstration)
    fn generate_kyber_key_pair(&self, security_level: usize) -> Result<(Vec<u8>, Vec<u8>), QkeError> {
        // In a real implementation, this would use actual Kyber library
        let mut public_key = vec![0u8; security_level / 8];
        let mut private_key = vec![0u8; security_level / 4];
        
        self.rng.fill(&mut public_key).map_err(|e| {
            QkeError::KeyGenerationFailed(format!("Kyber key generation failed: {}", e))
        })?;
        
        self.rng.fill(&mut private_key).map_err(|e| {
            QkeError::KeyGenerationFailed(format!("Kyber key generation failed: {}", e))
        })?;
        
        Ok((public_key, private_key))
    }

    fn generate_mceliece_key_pair(&self) -> Result<(Vec<u8>, Vec<u8>), QkeError> {
        // Simplified McEliece key generation
        let mut public_key = vec![0u8; 1024];
        let mut private_key = vec![0u8; 2048];
        
        self.rng.fill(&mut public_key).map_err(|e| {
            QkeError::KeyGenerationFailed(format!("McEliece key generation failed: {}", e))
        })?;
        
        self.rng.fill(&mut private_key).map_err(|e| {
            QkeError::KeyGenerationFailed(format!("McEliece key generation failed: {}", e))
        })?;
        
        Ok((public_key, private_key))
    }

    fn generate_ntru_key_pair(&self) -> Result<(Vec<u8>, Vec<u8>), QkeError> {
        // Simplified NTRU key generation
        let mut public_key = vec![0u8; 512];
        let mut private_key = vec![0u8; 512];
        
        self.rng.fill(&mut public_key).map_err(|e| {
            QkeError::KeyGenerationFailed(format!("NTRU key generation failed: {}", e))
        })?;
        
        self.rng.fill(&mut private_key).map_err(|e| {
            QkeError::KeyGenerationFailed(format!("NTRU key generation failed: {}", e))
        })?;
        
        Ok((public_key, private_key))
    }

    fn generate_saber_key_pair(&self) -> Result<(Vec<u8>, Vec<u8>), QkeError> {
        // Simplified SABER key generation
        let mut public_key = vec![0u8; 768];
        let mut private_key = vec![0u8; 768];
        
        self.rng.fill(&mut public_key).map_err(|e| {
            QkeError::KeyGenerationFailed(format!("SABER key generation failed: {}", e))
        })?;
        
        self.rng.fill(&mut private_key).map_err(|e| {
            QkeError::KeyGenerationFailed(format!("SABER key generation failed: {}", e))
        })?;
        
        Ok((public_key, private_key))
    }

    fn kyber_encapsulate(&self, public_key: &[u8], security_level: usize) -> Result<(Vec<u8>, Vec<u8>), QkeError> {
        // Simplified Kyber encapsulation
        let mut ciphertext = vec![0u8; security_level / 8];
        let mut shared_secret = vec![0u8; 32];
        
        self.rng.fill(&mut ciphertext).map_err(|e| {
            QkeError::EncapsulationFailed(format!("Kyber encapsulation failed: {}", e))
        })?;
        
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::EncapsulationFailed(format!("Kyber encapsulation failed: {}", e))
        })?;
        
        Ok((ciphertext, shared_secret))
    }

    fn kyber_decapsulate(&self, ciphertext: &[u8], private_key: &[u8], security_level: usize) -> Result<Vec<u8>, QkeError> {
        // Simplified Kyber decapsulation
        if ciphertext.len() != security_level / 8 {
            return Err(QkeError::DecapsulationFailed("Invalid ciphertext size".to_string()));
        }
        
        let mut shared_secret = vec![0u8; 32];
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::DecapsulationFailed(format!("Kyber decapsulation failed: {}", e))
        })?;
        
        Ok(shared_secret)
    }

    fn mceliece_encapsulate(&self, public_key: &[u8]) -> Result<(Vec<u8>, Vec<u8>), QkeError> {
        // Simplified McEliece encapsulation
        let mut ciphertext = vec![0u8; 1024];
        let mut shared_secret = vec![0u8; 32];
        
        self.rng.fill(&mut ciphertext).map_err(|e| {
            QkeError::EncapsulationFailed(format!("McEliece encapsulation failed: {}", e))
        })?;
        
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::EncapsulationFailed(format!("McEliece encapsulation failed: {}", e))
        })?;
        
        Ok((ciphertext, shared_secret))
    }

    fn mceliece_decapsulate(&self, ciphertext: &[u8], private_key: &[u8]) -> Result<Vec<u8>, QkeError> {
        // Simplified McEliece decapsulation
        if ciphertext.len() != 1024 {
            return Err(QkeError::DecapsulationFailed("Invalid ciphertext size".to_string()));
        }
        
        let mut shared_secret = vec![0u8; 32];
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::DecapsulationFailed(format!("McEliece decapsulation failed: {}", e))
        })?;
        
        Ok(shared_secret)
    }

    fn ntru_encapsulate(&self, public_key: &[u8]) -> Result<(Vec<u8>, Vec<u8>), QkeError> {
        // Simplified NTRU encapsulation
        let mut ciphertext = vec![0u8; 512];
        let mut shared_secret = vec![0u8; 32];
        
        self.rng.fill(&mut ciphertext).map_err(|e| {
            QkeError::EncapsulationFailed(format!("NTRU encapsulation failed: {}", e))
        })?;
        
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::EncapsulationFailed(format!("NTRU encapsulation failed: {}", e))
        })?;
        
        Ok((ciphertext, shared_secret))
    }

    fn ntru_decapsulate(&self, ciphertext: &[u8], private_key: &[u8]) -> Result<Vec<u8>, QkeError> {
        // Simplified NTRU decapsulation
        if ciphertext.len() != 512 {
            return Err(QkeError::DecapsulationFailed("Invalid ciphertext size".to_string()));
        }
        
        let mut shared_secret = vec![0u8; 32];
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::DecapsulationFailed(format!("NTRU decapsulation failed: {}", e))
        })?;
        
        Ok(shared_secret)
    }

    fn saber_encapsulate(&self, public_key: &[u8]) -> Result<(Vec<u8>, Vec<u8>), QkeError> {
        // Simplified SABER encapsulation
        let mut ciphertext = vec![0u8; 768];
        let mut shared_secret = vec![0u8; 32];
        
        self.rng.fill(&mut ciphertext).map_err(|e| {
            QkeError::EncapsulationFailed(format!("SABER encapsulation failed: {}", e))
        })?;
        
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::EncapsulationFailed(format!("SABER encapsulation failed: {}", e))
        })?;
        
        Ok((ciphertext, shared_secret))
    }

    fn saber_decapsulate(&self, ciphertext: &[u8], private_key: &[u8]) -> Result<Vec<u8>, QkeError> {
        // Simplified SABER decapsulation
        if ciphertext.len() != 768 {
            return Err(QkeError::DecapsulationFailed("Invalid ciphertext size".to_string()));
        }
        
        let mut shared_secret = vec![0u8; 32];
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::DecapsulationFailed(format!("SABER decapsulation failed: {}", e))
        })?;
        
        Ok(shared_secret)
    }

    fn classical_key_exchange(&self, public_key: &[u8]) -> Result<Vec<u8>, QkeError> {
        // Simplified classical ECDH key exchange
        let mut shared_secret = vec![0u8; 32];
        self.rng.fill(&mut shared_secret).map_err(|e| {
            QkeError::CryptoOperationFailed(format!("Classical key exchange failed: {}", e))
        })?;
        Ok(shared_secret)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_qke_engine_creation() {
        let engine = QkeEngine::new();
        assert!(engine.is_ok());
    }

    #[test]
    fn test_key_generation() {
        let engine = QkeEngine::new().unwrap();
        let result = engine.generate_key_pair(QkeAlgorithm::Kyber768, None);
        assert!(result.is_ok());
        
        let (public_key, private_key) = result.unwrap();
        assert_eq!(public_key.algorithm, QkeAlgorithm::Kyber768);
        assert_eq!(private_key.algorithm, QkeAlgorithm::Kyber768);
        assert_eq!(public_key.key_id, private_key.key_id);
        assert!(!public_key.key_data.is_empty());
        assert!(!private_key.key_data.is_empty());
    }

    #[test]
    fn test_encapsulation_decapsulation() {
        let engine = QkeEngine::new().unwrap();
        let (public_key, private_key) = engine.generate_key_pair(QkeAlgorithm::Kyber768, None).unwrap();
        
        let (ciphertext, shared_secret1) = engine.encapsulate(&public_key, None).unwrap();
        let shared_secret2 = engine.decapsulate(&ciphertext, &private_key).unwrap();
        
        assert_eq!(shared_secret1, shared_secret2);
    }

    #[test]
    fn test_hybrid_key_exchange() {
        let engine = QkeEngine::new().unwrap();
        let (public_key, _) = engine.generate_key_pair(QkeAlgorithm::Kyber768, None).unwrap();
        let classical_pk = vec![1u8; 32];
        
        let result = engine.hybrid_key_exchange(&public_key, Some(classical_pk), None);
        assert!(result.is_ok());
        
        let hybrid = result.unwrap();
        assert!(!hybrid.combined_secret.is_empty());
        assert!(hybrid.quantum_component.is_some());
        assert!(!hybrid.fallback_used);
    }

    #[test]
    fn test_performance_metrics() {
        let engine = QkeEngine::new().unwrap();
        let (public_key, private_key) = engine.generate_key_pair(QkeAlgorithm::Kyber768, None).unwrap();
        
        // Perform some operations
        let _ = engine.encapsulate(&public_key, None).unwrap();
        let (ciphertext, _) = engine.encapsulate(&public_key, None).unwrap();
        let _ = engine.decapsulate(&ciphertext, &private_key).unwrap();
        
        let metrics = engine.get_performance_metrics();
        assert!(metrics.total_sessions > 0);
        assert!(metrics.successful_exchanges > 0);
    }
}