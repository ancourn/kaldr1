use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::quantum::pqc_signatures::{
    PQCSignatureEngine, PQCAlgorithm, PQCKeyPair, PQCSignature, 
    HybridSignature, PQCConfig, PQCError
};

#[derive(Error, Debug)]
pub enum SignatureAbstractionError {
    #[error("PQC error: {0}")]
    PQCError(#[from] PQCError),
    #[error("Wallet not found: {0}")]
    WalletNotFound(String),
    #[error("Invalid signature scheme: {0}")]
    InvalidSignatureScheme(String),
    #[error("Key derivation failed: {0}")]
    KeyDerivationFailed(String),
    #[error("Signature verification failed: {0}")]
    SignatureVerificationFailed(String),
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    #[error("Migration error: {0}")]
    MigrationError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SignatureScheme {
    // Post-Quantum Schemes
    Dilithium2,
    Dilithium3,
    Dilithium5,
    Falcon512,
    Falcon1024,
    Picnic3L1,
    Picnic3L3,
    Picnic3L5,
    
    // Traditional Schemes
    ECDSA,
    Ed25519,
    Schnorr,
    
    // Hybrid Schemes
    HybridECDSADilithium,
    HybridEd25519Falcon,
    HybridSchnorrPicnic,
    
    // Adaptive Scheme (automatically selects best option)
    Adaptive,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletConfig {
    pub wallet_id: String,
    pub primary_scheme: SignatureScheme,
    pub fallback_schemes: Vec<SignatureScheme>,
    pub security_level: u32,
    pub enable_hybrid: bool,
    pub key_derivation_path: String,
    pub metadata: WalletMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletMetadata {
    pub created_at: u64,
    pub updated_at: u64,
    pub last_used: u64,
    pub total_signatures: usize,
    pub is_active: bool,
    pub backup_enabled: bool,
    pub multi_sig_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureContext {
    pub network_id: String,
    pub chain_id: u64,
    pub purpose: String,
    pub additional_data: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureResult {
    pub signature: Vec<u8>,
    pub scheme_used: SignatureScheme,
    pub verification_key: Vec<u8>,
    pub context: SignatureContext,
    pub timestamp: u64,
    pub gas_estimate: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    pub is_valid: bool,
    pub scheme_used: SignatureScheme,
    pub security_score: f64,
    pub verification_time_ms: f64,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationPlan {
    pub from_scheme: SignatureScheme,
    pub to_scheme: SignatureScheme,
    pub migration_strategy: MigrationStrategy,
    pub timeline_days: u32,
    pub rollback_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MigrationStrategy {
    Immediate,
    Gradual { daily_percentage: u8 },
    Parallel { verification_period_days: u32 },
}

pub struct SignatureAbstractionLayer {
    pqc_engine: Arc<RwLock<PQCSignatureEngine>>,
    wallets: Arc<RwLock<HashMap<String, QuantumWallet>>>,
    benchmarks: Arc<RwLock<HashMap<SignatureScheme, SchemeBenchmark>>>,
    config: AbstractionConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbstractionConfig {
    pub default_scheme: SignatureScheme,
    pub supported_schemes: Vec<SignatureScheme>,
    pub enable_adaptive_selection: bool,
    pub enable_migration: bool,
    pub benchmark_interval_seconds: u64,
    pub cache_signatures: bool,
    pub security_threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemeBenchmark {
    pub scheme: SignatureScheme,
    pub avg_signing_time_ms: f64,
    pub avg_verification_time_ms: f64,
    pub success_rate: f64,
    pub security_score: f64,
    pub performance_score: f64,
    pub last_updated: u64,
}

pub struct QuantumWallet {
    pub config: WalletConfig,
    pub primary_keypair: PQCKeyPair,
    pub fallback_keypairs: HashMap<SignatureScheme, PQCKeyPair>,
    pub signature_history: Vec<SignatureRecord>,
    pub engine: Arc<RwLock<PQCSignatureEngine>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureRecord {
    pub signature_hash: String,
    pub scheme_used: SignatureScheme,
    pub context: SignatureContext,
    pub timestamp: u64,
    pub verification_result: Option<bool>,
}

impl SignatureAbstractionLayer {
    /// Create a new signature abstraction layer
    pub fn new(config: AbstractionConfig) -> Result<Self, SignatureAbstractionError> {
        let pqc_config = PQCConfig {
            default_algorithm: Self::map_to_pqc_algorithm(&config.default_scheme)?,
            supported_algorithms: Self::map_supported_algorithms(&config.supported_schemes)?,
            enable_hybrid_mode: config.supported_schemes.iter().any(|s| s.is_hybrid()),
            security_level: 128,
            benchmark_mode: true,
            cache_signatures: config.cache_signatures,
        };

        let pqc_engine = Arc::new(RwLock::new(PQCSignatureEngine::new(pqc_config)));
        
        Ok(Self {
            pqc_engine,
            wallets: Arc::new(RwLock::new(HashMap::new())),
            benchmarks: Arc::new(RwLock::new(HashMap::new())),
            config,
        })
    }

    /// Create a new quantum wallet
    pub fn create_wallet(&self, wallet_config: WalletConfig) -> Result<String, SignatureAbstractionError> {
        let mut engine = self.pqc_engine.write().unwrap();
        
        // Generate primary keypair
        let primary_algorithm = Self::map_to_pqc_algorithm(&wallet_config.primary_scheme)?;
        let primary_keypair = engine.generate_key_pair(Some(primary_algorithm))?;
        
        // Generate fallback keypairs
        let mut fallback_keypairs = HashMap::new();
        for scheme in &wallet_config.fallback_schemes {
            let algorithm = Self::map_to_pqc_algorithm(scheme)?;
            let keypair = engine.generate_key_pair(Some(algorithm))?;
            fallback_keypairs.insert(scheme.clone(), keypair);
        }
        
        let wallet = QuantumWallet {
            config: wallet_config.clone(),
            primary_keypair,
            fallback_keypairs,
            signature_history: Vec::new(),
            engine: Arc::clone(&self.pqc_engine),
        };
        
        let mut wallets = self.wallets.write().unwrap();
        wallets.insert(wallet_config.wallet_id.clone(), wallet);
        
        Ok(wallet_config.wallet_id)
    }

    /// Sign a message using the specified wallet
    pub fn sign(
        &self,
        wallet_id: &str,
        message: &[u8],
        context: SignatureContext,
    ) -> Result<SignatureResult, SignatureAbstractionError> {
        let wallets = self.wallets.read().unwrap();
        let wallet = wallets.get(wallet_id)
            .ok_or(SignatureAbstractionError::WalletNotFound(wallet_id.to_string()))?;
        
        let scheme = if self.config.enable_adaptive_selection {
            self.select_optimal_scheme(wallet)?
        } else {
            wallet.config.primary_scheme.clone()
        };
        
        self.sign_with_scheme(wallet, message, &scheme, context)
    }

    /// Sign with a specific scheme
    pub fn sign_with_scheme(
        &self,
        wallet: &QuantumWallet,
        message: &[u8],
        scheme: &SignatureScheme,
        context: SignatureContext,
    ) -> Result<SignatureResult, SignatureAbstractionError> {
        let engine = self.pqc_engine.read().unwrap();
        
        let signature_data = match scheme {
            SignatureScheme::HybridECDSADilithium => {
                let ecdsa_key = wallet.fallback_keypairs.get(&SignatureScheme::ECDSA)
                    .ok_or(SignatureAbstractionError::KeyDerivationFailed("ECDSA key not found".to_string()))?;
                let dilithium_key = wallet.fallback_keypairs.get(&SignatureScheme::Dilithium2)
                    .ok_or(SignatureAbstractionError::KeyDerivationFailed("Dilithium key not found".to_string()))?;
                
                let hybrid_sig = engine.create_hybrid_signature(message, ecdsa_key, dilithium_key, Some(format!("{:?}", context)))?;
                bincode::serialize(&hybrid_sig)?
            },
            SignatureScheme::HybridEd25519Falcon => {
                let ed25519_key = wallet.fallback_keypairs.get(&SignatureScheme::Ed25519)
                    .ok_or(SignatureAbstractionError::KeyDerivationFailed("Ed25519 key not found".to_string()))?;
                let falcon_key = wallet.fallback_keypairs.get(&SignatureScheme::Falcon512)
                    .ok_or(SignatureAbstractionError::KeyDerivationFailed("Falcon key not found".to_string()))?;
                
                let hybrid_sig = engine.create_hybrid_signature(message, ed25519_key, falcon_key, Some(format!("{:?}", context)))?;
                bincode::serialize(&hybrid_sig)?
            },
            SignatureScheme::HybridSchnorrPicnic => {
                let schnorr_key = wallet.fallback_keypairs.get(&SignatureScheme::Schnorr)
                    .ok_or(SignatureAbstractionError::KeyDerivationFailed("Schnorr key not found".to_string()))?;
                let picnic_key = wallet.fallback_keypairs.get(&SignatureScheme::Picnic3L1)
                    .ok_or(SignatureAbstractionError::KeyDerivationFailed("Picnic key not found".to_string()))?;
                
                let hybrid_sig = engine.create_hybrid_signature(message, schnorr_key, picnic_key, Some(format!("{:?}", context)))?;
                bincode::serialize(&hybrid_sig)?
            },
            _ => {
                let keypair = self.get_keypair_for_scheme(wallet, scheme)?;
                let pqc_sig = engine.sign(message, keypair, Some(format!("{:?}", context)))?;
                bincode::serialize(&pqc_sig)?
            }
        };
        
        let verification_key = self.get_verification_key(wallet, scheme)?;
        let gas_estimate = self.estimate_gas_cost(scheme, &signature_data);
        
        Ok(SignatureResult {
            signature: signature_data,
            scheme_used: scheme.clone(),
            verification_key,
            context,
            timestamp: self.current_timestamp(),
            gas_estimate,
        })
    }

    /// Verify a signature
    pub fn verify(
        &self,
        signature_data: &[u8],
        message: &[u8],
        verification_key: &[u8],
        expected_scheme: &SignatureScheme,
    ) -> Result<VerificationResult, SignatureAbstractionError> {
        let start_time = std::time::SystemTime::now();
        let engine = self.pqc_engine.read().unwrap();
        
        let is_valid = match expected_scheme {
            SignatureScheme::HybridECDSADilithium | 
            SignatureScheme::HybridEd25519Falcon | 
            SignatureScheme::HybridSchnorrPicnic => {
                let hybrid_sig: HybridSignature = bincode::deserialize(signature_data)
                    .map_err(|e| SignatureAbstractionError::SignatureVerificationFailed(e.to_string()))?;
                engine.verify_hybrid_signature(&hybrid_sig, message)?
            },
            _ => {
                let pqc_sig: PQCSignature = bincode::deserialize(signature_data)
                    .map_err(|e| SignatureAbstractionError::SignatureVerificationFailed(e.to_string()))?;
                
                // Verify the scheme matches
                let sig_scheme = Self::map_from_pqc_algorithm(&pqc_sig.algorithm);
                if sig_scheme != *expected_scheme {
                    return Err(SignatureAbstractionError::SignatureVerificationFailed(
                        format!("Scheme mismatch: expected {:?}, got {:?}", expected_scheme, sig_scheme)
                    ));
                }
                
                engine.verify(&pqc_sig, message)?
            }
        };
        
        let verification_time = start_time.elapsed().unwrap().as_millis() as f64;
        let security_score = self.calculate_security_score(expected_scheme);
        
        Ok(VerificationResult {
            is_valid,
            scheme_used: expected_scheme.clone(),
            security_score,
            verification_time_ms: verification_time,
            warnings: Vec::new(),
        })
    }

    /// Select optimal signature scheme based on benchmarks and context
    fn select_optimal_scheme(&self, wallet: &QuantumWallet) -> Result<SignatureScheme, SignatureAbstractionError> {
        let benchmarks = self.benchmarks.read().unwrap();
        
        let mut best_scheme = wallet.config.primary_scheme.clone();
        let mut best_score = 0.0;
        
        let candidate_schemes = vec![wallet.config.primary_scheme.clone()]
            .into_iter()
            .chain(wallet.config.fallback_schemes.clone())
            .collect::<Vec<_>>();
        
        for scheme in candidate_schemes {
            if let Some(benchmark) = benchmarks.get(&scheme) {
                let score = self.calculate_scheme_score(benchmark);
                if score > best_score {
                    best_score = score;
                    best_scheme = scheme;
                }
            }
        }
        
        Ok(best_scheme)
    }

    /// Calculate scheme score based on performance and security
    fn calculate_scheme_score(&self, benchmark: &SchemeBenchmark) -> f64 {
        let performance_weight = 0.4;
        let security_weight = 0.6;
        
        let performance_score = benchmark.performance_score;
        let security_score = benchmark.security_score;
        
        (performance_score * performance_weight) + (security_score * security_weight)
    }

    /// Calculate security score for a scheme
    fn calculate_security_score(&self, scheme: &SignatureScheme) -> f64 {
        match scheme {
            // Post-Quantum schemes get highest scores
            SignatureScheme::Dilithium5 => 1.0,
            SignatureScheme::Dilithium3 => 0.95,
            SignatureScheme::Dilithium2 => 0.9,
            SignatureScheme::Falcon1024 => 0.95,
            SignatureScheme::Falcon512 => 0.9,
            SignatureScheme::Picnic3L5 => 0.9,
            SignatureScheme::Picnic3L3 => 0.85,
            SignatureScheme::Picnic3L1 => 0.8,
            
            // Hybrid schemes get good scores
            SignatureScheme::HybridECDSADilithium => 0.95,
            SignatureScheme::HybridEd25519Falcon => 0.9,
            SignatureScheme::HybridSchnorrPicnic => 0.85,
            
            // Traditional schemes get lower scores
            SignatureScheme::Ed25519 => 0.7,
            SignatureScheme::Schnorr => 0.65,
            SignatureScheme::ECDSA => 0.6,
            
            // Adaptive scheme gets dynamic score
            SignatureScheme::Adaptive => 0.85,
        }
    }

    /// Get keypair for a specific scheme
    fn get_keypair_for_scheme(&self, wallet: &QuantumWallet, scheme: &SignatureScheme) -> Result<&PQCKeyPair, SignatureAbstractionError> {
        if scheme == &wallet.config.primary_scheme {
            Ok(&wallet.primary_keypair)
        } else {
            wallet.fallback_keypairs.get(scheme)
                .ok_or(SignatureAbstractionError::KeyDerivationFailed(
                    format!("Keypair not found for scheme: {:?}", scheme)
                ))
        }
    }

    /// Get verification key for a scheme
    fn get_verification_key(&self, wallet: &QuantumWallet, scheme: &SignatureScheme) -> Result<Vec<u8>, SignatureAbstractionError> {
        let keypair = self.get_keypair_for_scheme(wallet, scheme)?;
        Ok(keypair.public_key.clone())
    }

    /// Estimate gas cost for signature
    fn estimate_gas_cost(&self, scheme: &SignatureScheme, signature_data: &[u8]) -> u64 {
        let base_cost = match scheme {
            SignatureScheme::ECDSA => 21000,
            SignatureScheme::Ed25519 => 25000,
            SignatureScheme::Schnorr => 23000,
            SignatureScheme::Dilithium2 => 50000,
            SignatureScheme::Dilithium3 => 60000,
            SignatureScheme::Dilithium5 => 70000,
            SignatureScheme::Falcon512 => 45000,
            SignatureScheme::Falcon1024 => 55000,
            SignatureScheme::Picnic3L1 => 40000,
            SignatureScheme::Picnic3L3 => 50000,
            SignatureScheme::Picnic3L5 => 60000,
            SignatureScheme::HybridECDSADilithium => 75000,
            SignatureScheme::HybridEd25519Falcon => 70000,
            SignatureScheme::HybridSchnorrPicnic => 65000,
            SignatureScheme::Adaptive => 50000,
        };
        
        // Add size-based cost
        let size_cost = (signature_data.len() as u64) * 10;
        
        base_cost + size_cost
    }

    /// Create migration plan
    pub fn create_migration_plan(
        &self,
        from_scheme: SignatureScheme,
        to_scheme: SignatureScheme,
        strategy: MigrationStrategy,
    ) -> Result<MigrationPlan, SignatureAbstractionError> {
        if !self.config.supported_schemes.contains(&from_scheme) {
            return Err(SignatureAbstractionError::InvalidSignatureScheme(
                format!("From scheme {:?} not supported", from_scheme)
            ));
        }
        
        if !self.config.supported_schemes.contains(&to_scheme) {
            return Err(SignatureAbstractionError::InvalidSignatureScheme(
                format!("To scheme {:?} not supported", to_scheme)
            ));
        }
        
        Ok(MigrationPlan {
            from_scheme,
            to_scheme,
            migration_strategy: strategy.clone(),
            timeline_days: match strategy {
                MigrationStrategy::Immediate => 1,
                MigrationStrategy::Gradual { .. } => 30,
                MigrationStrategy::Parallel { .. } => 60,
            },
            rollback_enabled: true,
        })
    }

    /// Execute migration for a wallet
    pub fn execute_migration(
        &self,
        wallet_id: &str,
        migration_plan: &MigrationPlan,
    ) -> Result<(), SignatureAbstractionError> {
        let mut wallets = self.wallets.write().unwrap();
        let wallet = wallets.get_mut(wallet_id)
            .ok_or(SignatureAbstractionError::WalletNotFound(wallet_id.to_string()))?;
        
        // Generate new keypair for target scheme
        let mut engine = self.pqc_engine.write().unwrap();
        let target_algorithm = Self::map_to_pqc_algorithm(&migration_plan.to_scheme)?;
        let new_keypair = engine.generate_key_pair(Some(target_algorithm))?;
        
        // Update wallet configuration
        wallet.config.primary_scheme = migration_plan.to_scheme.clone();
        wallet.config.updated_at = self.current_timestamp();
        
        // Replace primary keypair
        let old_keypair = std::mem::replace(&mut wallet.primary_keypair, new_keypair);
        
        // Store old keypair as fallback
        wallet.fallback_keypairs.insert(migration_plan.from_scheme.clone(), old_keypair);
        
        Ok(())
    }

    /// Update benchmarks
    pub fn update_benchmarks(&self) -> Result<(), SignatureAbstractionError> {
        let engine = self.pqc_engine.read().unwrap();
        let pqc_benchmarks = engine.get_benchmarks();
        
        let mut benchmarks = self.benchmarks.write().unwrap();
        
        for (scheme, pqc_benchmark) in pqc_benchmarks {
            let scheme_enum = Self::map_from_pqc_algorithm(&scheme);
            
            let benchmark = SchemeBenchmark {
                scheme: scheme_enum.clone(),
                avg_signing_time_ms: pqc_benchmark.signing_time_ms,
                avg_verification_time_ms: pqc_benchmark.verification_time_ms,
                success_rate: 1.0, // Assuming 100% success for now
                security_score: self.calculate_security_score(&scheme_enum),
                performance_score: 1000.0 / (pqc_benchmark.signing_time_ms + pqc_benchmark.verification_time_ms),
                last_updated: self.current_timestamp(),
            };
            
            benchmarks.insert(scheme_enum, benchmark);
        }
        
        Ok(())
    }

    /// Get wallet information
    pub fn get_wallet_info(&self, wallet_id: &str) -> Result<WalletConfig, SignatureAbstractionError> {
        let wallets = self.wallets.read().unwrap();
        let wallet = wallets.get(wallet_id)
            .ok_or(SignatureAbstractionError::WalletNotFound(wallet_id.to_string()))?;
        
        Ok(wallet.config.clone())
    }

    /// List all wallets
    pub fn list_wallets(&self) -> Vec<String> {
        let wallets = self.wallets.read().unwrap();
        wallets.keys().cloned().collect()
    }

    /// Get supported schemes
    pub fn supported_schemes(&self) -> Vec<SignatureScheme> {
        self.config.supported_schemes.clone()
    }

    /// Get benchmarks
    pub fn get_benchmarks(&self) -> HashMap<SignatureScheme, SchemeBenchmark> {
        self.benchmarks.read().unwrap().clone()
    }

    // Helper methods
    fn map_to_pqc_algorithm(scheme: &SignatureScheme) -> Result<PQCAlgorithm, SignatureAbstractionError> {
        match scheme {
            SignatureScheme::Dilithium2 => Ok(PQCAlgorithm::Dilithium2),
            SignatureScheme::Dilithium3 => Ok(PQCAlgorithm::Dilithium3),
            SignatureScheme::Dilithium5 => Ok(PQCAlgorithm::Dilithium5),
            SignatureScheme::Falcon512 => Ok(PQCAlgorithm::Falcon512),
            SignatureScheme::Falcon1024 => Ok(PQCAlgorithm::Falcon1024),
            SignatureScheme::Picnic3L1 => Ok(PQCAlgorithm::Picnic3L1),
            SignatureScheme::Picnic3L3 => Ok(PQCAlgorithm::Picnic3L3),
            SignatureScheme::Picnic3L5 => Ok(PQCAlgorithm::Picnic3L5),
            SignatureScheme::ECDSA => Ok(PQCAlgorithm::ECDSA),
            SignatureScheme::Ed25519 => Ok(PQCAlgorithm::Ed25519),
            SignatureScheme::Schnorr => Ok(PQCAlgorithm::Schnorr),
            SignatureScheme::HybridECDSADilithium => Ok(PQCAlgorithm::Ed25519), // Default for hybrid
            SignatureScheme::HybridEd25519Falcon => Ok(PQCAlgorithm::Ed25519),
            SignatureScheme::HybridSchnorrPicnic => Ok(PQCAlgorithm::Ed25519),
            SignatureScheme::Adaptive => Ok(PQCAlgorithm::Ed25519), // Default for adaptive
        }
    }

    fn map_from_pqc_algorithm(algorithm: &PQCAlgorithm) -> SignatureScheme {
        match algorithm {
            PQCAlgorithm::Dilithium2 => SignatureScheme::Dilithium2,
            PQCAlgorithm::Dilithium3 => SignatureScheme::Dilithium3,
            PQCAlgorithm::Dilithium5 => SignatureScheme::Dilithium5,
            PQCAlgorithm::Falcon512 => SignatureScheme::Falcon512,
            PQCAlgorithm::Falcon1024 => SignatureScheme::Falcon1024,
            PQCAlgorithm::Picnic3L1 => SignatureScheme::Picnic3L1,
            PQCAlgorithm::Picnic3L3 => SignatureScheme::Picnic3L3,
            PQCAlgorithm::Picnic3L5 => SignatureScheme::Picnic3L5,
            PQCAlgorithm::ECDSA => SignatureScheme::ECDSA,
            PQCAlgorithm::Ed25519 => SignatureScheme::Ed25519,
            PQCAlgorithm::Schnorr => SignatureScheme::Schnorr,
        }
    }

    fn map_supported_algorithms(schemes: &[SignatureScheme]) -> Result<Vec<PQCAlgorithm>, SignatureAbstractionError> {
        let mut algorithms = Vec::new();
        for scheme in schemes {
            algorithms.push(Self::map_to_pqc_algorithm(scheme)?);
        }
        Ok(algorithms)
    }

    fn current_timestamp(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }
}

impl SignatureScheme {
    pub fn is_hybrid(&self) -> bool {
        matches!(
            self,
            SignatureScheme::HybridECDSADilithium |
            SignatureScheme::HybridEd25519Falcon |
            SignatureScheme::HybridSchnorrPicnic
        )
    }

    pub fn is_post_quantum(&self) -> bool {
        matches!(
            self,
            SignatureScheme::Dilithium2 |
            SignatureScheme::Dilithium3 |
            SignatureScheme::Dilithium5 |
            SignatureScheme::Falcon512 |
            SignatureScheme::Falcon1024 |
            SignatureScheme::Picnic3L1 |
            SignatureScheme::Picnic3L3 |
            SignatureScheme::Picnic3L5
        )
    }

    pub fn security_level(&self) -> u32 {
        match self {
            SignatureScheme::Dilithium2 => 128,
            SignatureScheme::Dilithium3 => 192,
            SignatureScheme::Dilithium5 => 256,
            SignatureScheme::Falcon512 => 128,
            SignatureScheme::Falcon1024 => 256,
            SignatureScheme::Picnic3L1 => 128,
            SignatureScheme::Picnic3L3 => 192,
            SignatureScheme::Picnic3L5 => 256,
            SignatureScheme::ECDSA => 128,
            SignatureScheme::Ed25519 => 128,
            SignatureScheme::Schnorr => 128,
            SignatureScheme::HybridECDSADilithium => 128,
            SignatureScheme::HybridEd25519Falcon => 128,
            SignatureScheme::HybridSchnorrPicnic => 128,
            SignatureScheme::Adaptive => 128,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_signature_abstraction_creation() {
        let config = AbstractionConfig {
            default_scheme: SignatureScheme::Ed25519,
            supported_schemes: vec![
                SignatureScheme::Ed25519,
                SignatureScheme::ECDSA,
                SignatureScheme::Dilithium2,
            ],
            enable_adaptive_selection: true,
            enable_migration: true,
            benchmark_interval_seconds: 3600,
            cache_signatures: true,
            security_threshold: 0.8,
        };

        let layer = SignatureAbstractionLayer::new(config).unwrap();
        assert_eq!(layer.supported_schemes().len(), 3);
    }

    #[test]
    fn test_wallet_creation() {
        let config = AbstractionConfig {
            default_scheme: SignatureScheme::Ed25519,
            supported_schemes: vec![SignatureScheme::Ed25519],
            enable_adaptive_selection: false,
            enable_migration: false,
            benchmark_interval_seconds: 3600,
            cache_signatures: false,
            security_threshold: 0.8,
        };

        let layer = SignatureAbstractionLayer::new(config).unwrap();
        
        let wallet_config = WalletConfig {
            wallet_id: "test_wallet".to_string(),
            primary_scheme: SignatureScheme::Ed25519,
            fallback_schemes: vec![],
            security_level: 128,
            enable_hybrid: false,
            key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
            metadata: WalletMetadata {
                created_at: 0,
                updated_at: 0,
                last_used: 0,
                total_signatures: 0,
                is_active: true,
                backup_enabled: false,
                multi_sig_enabled: false,
            },
        };

        let wallet_id = layer.create_wallet(wallet_config).unwrap();
        assert_eq!(wallet_id, "test_wallet");
        assert_eq!(layer.list_wallets().len(), 1);
    }

    #[test]
    fn test_signing_and_verification() {
        let config = AbstractionConfig {
            default_scheme: SignatureScheme::Ed25519,
            supported_schemes: vec![SignatureScheme::Ed25519],
            enable_adaptive_selection: false,
            enable_migration: false,
            benchmark_interval_seconds: 3600,
            cache_signatures: false,
            security_threshold: 0.8,
        };

        let layer = SignatureAbstractionLayer::new(config).unwrap();
        
        let wallet_config = WalletConfig {
            wallet_id: "test_wallet".to_string(),
            primary_scheme: SignatureScheme::Ed25519,
            fallback_schemes: vec![],
            security_level: 128,
            enable_hybrid: false,
            key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
            metadata: WalletMetadata {
                created_at: 0,
                updated_at: 0,
                last_used: 0,
                total_signatures: 0,
                is_active: true,
                backup_enabled: false,
                multi_sig_enabled: false,
            },
        };

        let wallet_id = layer.create_wallet(wallet_config).unwrap();
        
        let context = SignatureContext {
            network_id: "ethereum".to_string(),
            chain_id: 1,
            purpose: "transaction_signing".to_string(),
            additional_data: HashMap::new(),
        };

        let message = b"Test message for quantum signing";
        let signature_result = layer.sign(&wallet_id, message, context.clone()).unwrap();
        
        assert_eq!(signature_result.scheme_used, SignatureScheme::Ed25519);
        assert!(!signature_result.signature.is_empty());
        assert!(!signature_result.verification_key.is_empty());
        
        let verification_result = layer.verify(
            &signature_result.signature,
            message,
            &signature_result.verification_key,
            &signature_result.scheme_used,
        ).unwrap();
        
        assert!(verification_result.is_valid);
        assert_eq!(verification_result.scheme_used, SignatureScheme::Ed25519);
    }

    #[test]
    fn test_migration_plan() {
        let config = AbstractionConfig {
            default_scheme: SignatureScheme::Ed25519,
            supported_schemes: vec![SignatureScheme::Ed25519, SignatureScheme::Dilithium2],
            enable_adaptive_selection: false,
            enable_migration: true,
            benchmark_interval_seconds: 3600,
            cache_signatures: false,
            security_threshold: 0.8,
        };

        let layer = SignatureAbstractionLayer::new(config).unwrap();
        
        let migration_plan = layer.create_migration_plan(
            SignatureScheme::Ed25519,
            SignatureScheme::Dilithium2,
            MigrationStrategy::Immediate,
        ).unwrap();
        
        assert_eq!(migration_plan.from_scheme, SignatureScheme::Ed25519);
        assert_eq!(migration_plan.to_scheme, SignatureScheme::Dilithium2);
        assert_eq!(migration_plan.timeline_days, 1);
        assert!(migration_plan.rollback_enabled);
    }
}