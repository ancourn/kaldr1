//! Identity and key management for Quantum-Proof DAG Blockchain
//! 
//! This module handles cryptographic keypair generation, signing operations,
//! and node identity management for post-quantum security.

use crate::{BlockchainError, TransactionId, core::{Transaction, QuantumProof}};
use ed25519_dalek::{Keypair, PublicKey, Signature, Signer, Verifier};
use x25519_dalek::{StaticSecret};
use pqcrypto_dilithium::{dilithium3, dilithium5};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;

/// Node identity with cryptographic keys
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeIdentity {
    /// Unique node identifier
    pub node_id: String,
    /// Ed25519 keypair for general signing
    pub ed25519_keypair: Vec<u8>,
    /// Ed25519 public key
    pub ed25519_public: Vec<u8>,
    /// X25519 static secret for key exchange
    pub x25519_secret: Vec<u8>,
    /// X25519 public key for key exchange
    pub x25519_public: Vec<u8>,
    /// Dilithium3 keypair for post-quantum signing
    pub dilithium3_keypair: Vec<u8>,
    pub dilithium3_public: Vec<u8>,
    /// Dilithium5 keypair for higher security
    pub dilithium5_keypair: Vec<u8>,
    pub dilithium5_public: Vec<u8>,
    /// Node creation timestamp
    pub created_at: u64,
    /// Node metadata
    pub metadata: HashMap<String, String>,
}

/// Identity manager for handling node identities
pub struct IdentityManager {
    /// Current node identity
    current_identity: Arc<RwLock<Option<NodeIdentity>>>,
    /// Known peer identities
    peer_identities: HashMap<String, NodeIdentity>,
    /// Identity storage path
    storage_path: String,
}

/// Signature types supported by the identity system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SignatureType {
    /// Ed25519 signature (classical)
    Ed25519,
    /// Dilithium3 signature (post-quantum, level 3)
    Dilithium3,
    /// Dilithium5 signature (post-quantum, level 5)
    Dilithium5,
    /// Hybrid signature (Ed25519 + Dilithium3)
    Hybrid,
}

/// Signature wrapper for different signature types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeSignature {
    pub signature_type: SignatureType,
    pub signature_data: Vec<u8>,
    pub public_key: Vec<u8>,
    pub timestamp: u64,
    pub nonce: u64,
}

/// Identity information for API endpoints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdentityInfo {
    pub node_id: String,
    pub ed25519_public: String,
    pub x25519_public: String,
    pub dilithium3_public: String,
    pub dilithium5_public: String,
    pub signature_types: Vec<String>,
    pub created_at: u64,
    pub metadata: HashMap<String, String>,
}

impl IdentityManager {
    /// Create a new identity manager
    pub fn new(storage_path: String) -> Self {
        Self {
            current_identity: Arc::new(RwLock::new(None)),
            peer_identities: HashMap::new(),
            storage_path,
        }
    }

    /// Generate or load node identity
    pub async fn initialize_identity(&mut self) -> Result<NodeIdentity, BlockchainError> {
        // Try to load existing identity
        if let Some(identity) = self.load_identity().await? {
            *self.current_identity.write().await = Some(identity.clone());
            log::info!("🔑 Loaded existing node identity: {}", identity.node_id);
            return Ok(identity);
        }

        // Generate new identity
        let identity = self.generate_identity().await?;
        *self.current_identity.write().await = Some(identity.clone());
        
        // Save identity to storage
        self.save_identity(&identity).await?;
        
        log::info!("🔑 Generated new node identity: {}", identity.node_id);
        Ok(identity)
    }

    /// Generate a new node identity
    async fn generate_identity(&self) -> Result<NodeIdentity, BlockchainError> {
        // Generate Ed25519 keypair
        let ed25519_keypair = Keypair::generate(&mut rand::thread_rng());
        let ed25519_public = ed25519_keypair.public.to_bytes().to_vec();

        // Generate X25519 keypair
        let x25519_secret = StaticSecret::random_from_rng(&mut rand::thread_rng());
        let x25519_public = x25519_dalek::PublicKey::from(&x25519_secret).to_bytes().to_vec();

        // Generate Dilithium3 keypair
        let (dilithium3_pk, dilithium3_sk) = dilithium3::keypair();
        let dilithium3_keypair = [dilithium3_pk.as_ref(), dilithium3_sk.as_ref()].concat();
        let dilithium3_public = dilithium3_pk.as_ref().to_vec();

        // Generate Dilithium5 keypair
        let (dilithium5_pk, dilithium5_sk) = dilithium5::keypair();
        let dilithium5_keypair = [dilithium5_pk.as_ref(), dilithium5_sk.as_ref()].concat();
        let dilithium5_public = dilithium5_pk.as_ref().to_vec();

        // Generate node ID
        let node_id = self.generate_node_id(&ed25519_public, &dilithium3_public);

        let mut metadata = HashMap::new();
        metadata.insert("version".to_string(), env!("CARGO_PKG_VERSION").to_string());
        metadata.insert("network".to_string(), "quantum-dag".to_string());
        metadata.insert("signature_schemes".to_string(), "ed25519,dilithium3,dilithium5".to_string());

        Ok(NodeIdentity {
            node_id,
            ed25519_keypair: ed25519_keypair.to_bytes().to_vec(),
            ed25519_public,
            x25519_secret: x25519_secret.to_bytes().to_vec(),
            x25519_public,
            dilithium3_keypair,
            dilithium3_public,
            dilithium5_keypair,
            dilithium5_public,
            created_at: chrono::Utc::now().timestamp() as u64,
            metadata,
        })
    }

    /// Generate node ID from public keys
    fn generate_node_id(&self, ed25519_public: &[u8], dilithium_public: &[u8]) -> String {
        use sha3::{Digest, Sha3_256};
        
        let mut hasher = Sha3_256::new();
        hasher.update(ed25519_public);
        hasher.update(dilithium_public);
        hasher.update(b"quantum-dag-node");
        
        let result = hasher.finalize();
        format!("qd_{}", hex::encode(result))
    }

    /// Sign data using the specified signature type
    pub async fn sign(&self, data: &[u8], signature_type: SignatureType) -> Result<NodeSignature, BlockchainError> {
        let identity = self.current_identity.read().await;
        let identity = identity.as_ref()
            .ok_or_else(|| BlockchainError::Other("Node identity not initialized".to_string()))?;

        let signature_data = match signature_type {
            SignatureType::Ed25519 => {
                let keypair = Keypair::from_bytes(&identity.ed25519_keypair)?;
                let signature = keypair.sign(data);
                signature.to_bytes().to_vec()
            }
            SignatureType::Dilithium3 => {
                let sk = dilithium3::SecretKey::from_slice(&identity.dilithium3_keypair[32..])?;
                let signature = dilithium3::sign(&sk, data);
                signature.as_ref().to_vec()
            }
            SignatureType::Dilithium5 => {
                let sk = dilithium5::SecretKey::from_slice(&identity.dilithium5_keypair[64..])?;
                let signature = dilithium5::sign(&sk, data);
                signature.as_ref().to_vec()
            }
            SignatureType::Hybrid => {
                // Create hybrid signature (Ed25519 + Dilithium3)
                let ed25519_sig = {
                    let keypair = Keypair::from_bytes(&identity.ed25519_keypair)?;
                    keypair.sign(data).to_bytes().to_vec()
                };
                
                let dilithium_sig = {
                    let sk = dilithium3::SecretKey::from_slice(&identity.dilithium3_keypair[32..])?;
                    dilithium3::sign(&sk, data).as_ref().to_vec()
                };
                
                [ed25519_sig, dilithium_sig].concat()
            }
        };

        let public_key = match signature_type {
            SignatureType::Ed25519 => identity.ed25519_public.clone(),
            SignatureType::Dilithium3 => identity.dilithium3_public.clone(),
            SignatureType::Dilithium5 => identity.dilithium5_public.clone(),
            SignatureType::Hybrid => {
                // For hybrid, use both public keys
                [identity.ed25519_public.clone(), identity.dilithium3_public.clone()].concat()
            }
        };

        Ok(NodeSignature {
            signature_type,
            signature_data,
            public_key,
            timestamp: chrono::Utc::now().timestamp() as u64,
            nonce: rand::random(),
        })
    }

    /// Verify a signature
    pub async fn verify(&self, data: &[u8], signature: &NodeSignature) -> Result<bool, BlockchainError> {
        match signature.signature_type {
            SignatureType::Ed25519 => {
                let public_key = PublicKey::from_bytes(&signature.public_key)?;
                let sig = Signature::from_bytes(&signature.signature_data)?;
                Ok(public_key.verify(data, &sig).is_ok())
            }
            SignatureType::Dilithium3 => {
                let pk = dilithium3::PublicKey::from_slice(&signature.public_key)?;
                let sig = dilithium3::Signature::from_slice(&signature.signature_data)?;
                Ok(dilithium3::verify(&pk, data, &sig))
            }
            SignatureType::Dilithium5 => {
                let pk = dilithium5::PublicKey::from_slice(&signature.public_key)?;
                let sig = dilithium5::Signature::from_slice(&signature.signature_data)?;
                Ok(dilithium5::verify(&pk, data, &sig))
            }
            SignatureType::Hybrid => {
                // Verify both signatures
                if signature.signature_data.len() < 96 {
                    return Ok(false);
                }

                // Split into Ed25519 and Dilithium3 signatures
                let ed25519_sig_data = &signature.signature_data[..64];
                let dilithium_sig_data = &signature.signature_data[64..];

                // Verify Ed25519 part
                let ed25519_pk = PublicKey::from_bytes(&signature.public_key[..32])?;
                let ed25519_sig = Signature::from_bytes(ed25519_sig_data)?;
                let ed25519_valid = ed25519_pk.verify(data, &ed25519_sig).is_ok();

                // Verify Dilithium3 part
                let dilithium_pk = dilithium3::PublicKey::from_slice(&signature.public_key[32..])?;
                let dilithium_sig = dilithium3::Signature::from_slice(dilithium_sig_data)?;
                let dilithium_valid = dilithium3::verify(&dilithium_pk, data, &dilithium_sig);

                Ok(ed25519_valid && dilithium_valid)
            }
        }
    }

    /// Sign a transaction
    pub async fn sign_transaction(&self, transaction: &Transaction) -> Result<NodeSignature, BlockchainError> {
        // Create transaction hash for signing
        let tx_hash = self.create_transaction_hash(transaction)?;
        
        // Use hybrid signature for maximum security
        self.sign(&tx_hash, SignatureType::Hybrid).await
    }

    /// Verify transaction signature
    pub async fn verify_transaction_signature(&self, transaction: &Transaction, signature: &NodeSignature) -> Result<bool, BlockchainError> {
        let tx_hash = self.create_transaction_hash(transaction)?;
        self.verify(&tx_hash, signature).await
    }

    /// Create transaction hash for signing
    fn create_transaction_hash(&self, transaction: &Transaction) -> Result<Vec<u8>, BlockchainError> {
        use sha3::{Digest, Sha3_256};
        
        let mut hasher = Sha3_256::new();
        hasher.update(transaction.id.as_bytes());
        hasher.update(&transaction.sender);
        hasher.update(&transaction.receiver);
        hasher.update(transaction.amount.to_le_bytes());
        hasher.update(transaction.nonce.to_le_bytes());
        hasher.update(transaction.timestamp.to_le_bytes());
        
        // Hash parent transactions
        for parent_id in &transaction.parents {
            hasher.update(parent_id.as_bytes());
        }
        
        Ok(hasher.finalize().to_vec())
    }

    /// Get current node identity
    pub async fn get_current_identity(&self) -> Result<Option<NodeIdentity>, BlockchainError> {
        Ok(self.current_identity.read().await.clone())
    }

    /// Get identity info for API endpoints
    pub async fn get_identity_info(&self) -> Result<IdentityInfo, BlockchainError> {
        let identity = self.current_identity.read().await;
        let identity = identity.as_ref()
            .ok_or_else(|| BlockchainError::Other("Node identity not initialized".to_string()))?;

        Ok(IdentityInfo {
            node_id: identity.node_id.clone(),
            ed25519_public: hex::encode(&identity.ed25519_public),
            x25519_public: hex::encode(&identity.x25519_public),
            dilithium3_public: hex::encode(&identity.dilithium3_public),
            dilithium5_public: hex::encode(&identity.dilithium5_public),
            signature_types: vec![
                "ed25519".to_string(),
                "dilithium3".to_string(),
                "dilithium5".to_string(),
                "hybrid".to_string(),
            ],
            created_at: identity.created_at,
            metadata: identity.metadata.clone(),
        })
    }

    /// Add peer identity
    pub async fn add_peer_identity(&mut self, identity: NodeIdentity) -> Result<(), BlockchainError> {
        self.peer_identities.insert(identity.node_id.clone(), identity);
        Ok(())
    }

    /// Get peer identity
    pub async fn get_peer_identity(&self, node_id: &str) -> Option<&NodeIdentity> {
        self.peer_identities.get(node_id)
    }

    /// Save identity to storage
    async fn save_identity(&self, identity: &NodeIdentity) -> Result<(), BlockchainError> {
        let identity_path = format!("{}/identity.json", self.storage_path);
        
        // Ensure directory exists
        if let Some(parent) = std::path::Path::new(&identity_path).parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let identity_json = serde_json::to_string_pretty(identity)?;
        tokio::fs::write(&identity_path, identity_json).await?;
        
        log::debug!("Saved identity to {}", identity_path);
        Ok(())
    }

    /// Load identity from storage
    async fn load_identity(&self) -> Result<Option<NodeIdentity>, BlockchainError> {
        let identity_path = format!("{}/identity.json", self.storage_path);
        
        if !tokio::fs::metadata(&identity_path).await.is_ok() {
            return Ok(None);
        }

        let identity_json = tokio::fs::read_to_string(&identity_path).await?;
        let identity: NodeIdentity = serde_json::from_str(&identity_json)?;
        
        log::debug!("Loaded identity from {}", identity_path);
        Ok(Some(identity))
    }

    /// Create quantum proof for identity
    pub async fn create_quantum_proof(&self, data: &[u8]) -> Result<QuantumProof, BlockchainError> {
        // Use Dilithium3 for quantum proof
        let signature = self.sign(data, SignatureType::Dilithium3).await?;
        
        // Calculate resistance score based on signature strength
        let resistance_score = self.calculate_quantum_resistance_score(&signature).await?;
        
        Ok(QuantumProof {
            prime_hash: signature.signature_data.clone(),
            resistance_score,
            proof_timestamp: signature.timestamp,
        })
    }

    /// Calculate quantum resistance score for a signature
    async fn calculate_quantum_resistance_score(&self, signature: &NodeSignature) -> Result<u32, BlockchainError> {
        let mut score = 0;

        // Base score from signature type
        match signature.signature_type {
            SignatureType::Ed25519 => score += 60,  // Classical, vulnerable to quantum attacks
            SignatureType::Dilithium3 => score += 85, // Post-quantum secure
            SignatureType::Dilithium5 => score += 95, // Higher post-quantum security
            SignatureType::Hybrid => score += 90,    // Best of both worlds
        }

        // Score from signature entropy
        let entropy = self.calculate_signature_entropy(&signature.signature_data);
        score += (entropy * 10.0) as u32;

        // Score from timestamp freshness
        let age = chrono::Utc::now().timestamp() as u64 - signature.timestamp;
        if age < 3600 { // Less than 1 hour old
            score += 5;
        }

        Ok(score.min(100))
    }

    /// Calculate signature entropy
    fn calculate_signature_entropy(&self, signature_data: &[u8]) -> f64 {
        if signature_data.is_empty() {
            return 0.0;
        }

        let mut frequency = [0u32; 256];
        for &byte in signature_data {
            frequency[byte as usize] += 1;
        }

        let mut entropy = 0.0;
        let len = signature_data.len() as f64;
        for count in frequency {
            if count > 0 {
                let probability = count as f64 / len;
                entropy -= probability * probability.log2();
            }
        }

        entropy / 8.0 // Normalize to 0-1 range
    }

    /// Validate that PQC keys are being used for signing
    pub async fn validate_pqc_key_usage(&self, signature: &NodeSignature) -> Result<bool, BlockchainError> {
        match signature.signature_type {
            SignatureType::Ed25519 => {
                // Ed25519 is not post-quantum secure
                log::warn!("⚠️  Transaction signed with classical Ed25519 - not quantum-resistant");
                return Ok(false);
            }
            SignatureType::Dilithium3 | SignatureType::Dilithium5 => {
                // These are post-quantum secure
                log::info!("✅ Transaction signed with post-quantum {}", match signature.signature_type {
                    SignatureType::Dilithium3 => "Dilithium3",
                    SignatureType::Dilithium5 => "Dilithium5",
                    _ => unreachable!(),
                });
                
                // Validate signature structure
                self.validate_dilithium_signature_structure(signature).await?;
                Ok(true)
            }
            SignatureType::Hybrid => {
                // Hybrid is acceptable as it includes PQC
                log::info!("✅ Transaction signed with hybrid (Ed25519 + Dilithium3)");
                
                // Validate hybrid signature structure
                self.validate_hybrid_signature_structure(signature).await?;
                Ok(true)
            }
        }
    }

    /// Validate Dilithium signature structure
    async fn validate_dilithium_signature_structure(&self, signature: &NodeSignature) -> Result<(), BlockchainError> {
        // Check minimum signature size for Dilithium
        let expected_size = match signature.signature_type {
            SignatureType::Dilithium3 => dilithium3::signature_size(),
            SignatureType::Dilithium5 => dilithium5::signature_size(),
            _ => return Err(BlockchainError::Other("Invalid signature type for Dilithium validation".to_string())),
        };

        if signature.signature_data.len() != expected_size {
            return Err(BlockchainError::Other(format!(
                "Invalid {} signature size: expected {}, got {}",
                format!("{:?}", signature.signature_type),
                expected_size,
                signature.signature_data.len()
            )));
        }

        // Check public key size
        let expected_pk_size = match signature.signature_type {
            SignatureType::Dilithium3 => dilithium3::public_key_size(),
            SignatureType::Dilithium5 => dilithium5::public_key_size(),
            _ => return Err(BlockchainError::Other("Invalid signature type for Dilithium validation".to_string())),
        };

        if signature.public_key.len() != expected_pk_size {
            return Err(BlockchainError::Other(format!(
                "Invalid {} public key size: expected {}, got {}",
                format!("{:?}", signature.signature_type),
                expected_pk_size,
                signature.public_key.len()
            )));
        }

        // Check signature entropy (should be high for valid cryptographic signatures)
        let entropy = self.calculate_signature_entropy(&signature.signature_data);
        if entropy < 0.7 {
            log::warn!("⚠️  Low signature entropy detected: {:.2}", entropy);
            return Err(BlockchainError::Other(format!(
                "Low signature entropy: {:.2} (minimum: 0.7)",
                entropy
            )));
        }

        // Check timestamp freshness
        let age = chrono::Utc::now().timestamp() as u64 - signature.timestamp;
        if age > 86400 { // Older than 24 hours
            log::warn!("⚠️  Old signature detected: {} seconds", age);
            return Err(BlockchainError::Other(format!(
                "Signature too old: {} seconds (maximum: 86400)",
                age
            )));
        }

        Ok(())
    }

    /// Validate hybrid signature structure
    async fn validate_hybrid_signature_structure(&self, signature: &NodeSignature) -> Result<(), BlockchainError> {
        // Hybrid signature should contain both Ed25519 and Dilithium3 parts
        let ed25519_size = 64; // Ed25519 signature size
        let dilithium3_size = dilithium3::signature_size();
        let expected_size = ed25519_size + dilithium3_size;

        if signature.signature_data.len() != expected_size {
            return Err(BlockchainError::Other(format!(
                "Invalid hybrid signature size: expected {}, got {}",
                expected_size,
                signature.signature_data.len()
            )));
        }

        // Public key should contain both Ed25519 and Dilithium3 public keys
        let ed25519_pk_size = 32; // Ed25519 public key size
        let dilithium3_pk_size = dilithium3::public_key_size();
        let expected_pk_size = ed25519_pk_size + dilithium3_pk_size;

        if signature.public_key.len() != expected_pk_size {
            return Err(BlockchainError::Other(format!(
                "Invalid hybrid public key size: expected {}, got {}",
                expected_pk_size,
                signature.public_key.len()
            )));
        }

        // Validate Ed25519 part
        let ed25519_sig_data = &signature.signature_data[..ed25519_size];
        let ed25519_entropy = self.calculate_signature_entropy(ed25519_sig_data);
        if ed25519_entropy < 0.7 {
            return Err(BlockchainError::Other(format!(
                "Low Ed25519 signature entropy: {:.2}",
                ed25519_entropy
            )));
        }

        // Validate Dilithium3 part
        let dilithium_sig_data = &signature.signature_data[ed25519_size..];
        let dilithium_entropy = self.calculate_signature_entropy(dilithium_sig_data);
        if dilithium_entropy < 0.7 {
            return Err(BlockchainError::Other(format!(
                "Low Dilithium3 signature entropy: {:.2}",
                dilithium_entropy
            )));
        }

        Ok(())
    }

    /// Test rejection of invalid signatures
    pub async fn test_signature_rejection(&self) -> Result<SignatureRejectionTest, BlockchainError> {
        let mut test_results = SignatureRejectionTest {
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            test_details: Vec::new(),
        };

        let test_data = b"test data for signature validation";

        // Test 1: Invalid signature size
        test_results.total_tests += 1;
        let invalid_sig = NodeSignature {
            signature_type: SignatureType::Dilithium3,
            signature_data: vec![0u8; 10], // Too small
            public_key: vec![0u8; 32],
            timestamp: chrono::Utc::now().timestamp() as u64,
            nonce: rand::random(),
        };

        match self.validate_pqc_key_usage(&invalid_sig).await {
            Ok(_) => {
                test_results.failed_tests += 1;
                test_results.test_details.push("Invalid signature size test: FAILED (should have been rejected)".to_string());
                log::error!("❌ Invalid signature size test failed - should have been rejected");
            }
            Err(_) => {
                test_results.passed_tests += 1;
                test_results.test_details.push("Invalid signature size test: PASSED (correctly rejected)".to_string());
                log::info!("✅ Invalid signature size test passed - correctly rejected");
            }
        }

        // Test 2: Old signature
        test_results.total_tests += 1;
        let old_sig = NodeSignature {
            signature_type: SignatureType::Dilithium3,
            signature_data: vec![1u8; dilithium3::signature_size()],
            public_key: vec![1u8; dilithium3::public_key_size()],
            timestamp: chrono::Utc::now().timestamp() as u64 - 172800, // 2 days ago
            nonce: rand::random(),
        };

        match self.validate_pqc_key_usage(&old_sig).await {
            Ok(_) => {
                test_results.failed_tests += 1;
                test_results.test_details.push("Old signature test: FAILED (should have been rejected)".to_string());
                log::error!("❌ Old signature test failed - should have been rejected");
            }
            Err(_) => {
                test_results.passed_tests += 1;
                test_results.test_details.push("Old signature test: PASSED (correctly rejected)".to_string());
                log::info!("✅ Old signature test passed - correctly rejected");
            }
        }

        // Test 3: Low entropy signature
        test_results.total_tests += 1;
        let low_entropy_sig = NodeSignature {
            signature_type: SignatureType::Dilithium3,
            signature_data: vec![0u8; dilithium3::signature_size()], // All zeros - low entropy
            public_key: vec![1u8; dilithium3::public_key_size()],
            timestamp: chrono::Utc::now().timestamp() as u64,
            nonce: rand::random(),
        };

        match self.validate_pqc_key_usage(&low_entropy_sig).await {
            Ok(_) => {
                test_results.failed_tests += 1;
                test_results.test_details.push("Low entropy signature test: FAILED (should have been rejected)".to_string());
                log::error!("❌ Low entropy signature test failed - should have been rejected");
            }
            Err(_) => {
                test_results.passed_tests += 1;
                test_results.test_details.push("Low entropy signature test: PASSED (correctly rejected)".to_string());
                log::info!("✅ Low entropy signature test passed - correctly rejected");
            }
        }

        // Test 4: Valid PQC signature (should pass)
        test_results.total_tests += 1;
        let valid_sig = self.sign(test_data, SignatureType::Dilithium3).await?;

        match self.validate_pqc_key_usage(&valid_sig).await {
            Ok(valid) => {
                if valid {
                    test_results.passed_tests += 1;
                    test_results.test_details.push("Valid PQC signature test: PASSED (correctly accepted)".to_string());
                    log::info!("✅ Valid PQC signature test passed - correctly accepted");
                } else {
                    test_results.failed_tests += 1;
                    test_results.test_details.push("Valid PQC signature test: FAILED (incorrectly rejected)".to_string());
                    log::error!("❌ Valid PQC signature test failed - incorrectly rejected");
                }
            }
            Err(e) => {
                test_results.failed_tests += 1;
                test_results.test_details.push(format!("Valid PQC signature test: FAILED (error: {})", e));
                log::error!("❌ Valid PQC signature test failed with error: {}", e);
            }
        }

        // Test 5: Classical signature (should be rejected)
        test_results.total_tests += 1;
        let classical_sig = self.sign(test_data, SignatureType::Ed25519).await?;

        match self.validate_pqc_key_usage(&classical_sig).await {
            Ok(valid) => {
                if !valid {
                    test_results.passed_tests += 1;
                    test_results.test_details.push("Classical signature test: PASSED (correctly rejected)".to_string());
                    log::info!("✅ Classical signature test passed - correctly rejected");
                } else {
                    test_results.failed_tests += 1;
                    test_results.test_details.push("Classical signature test: FAILED (incorrectly accepted)".to_string());
                    log::error!("❌ Classical signature test failed - incorrectly accepted");
                }
            }
            Err(e) => {
                test_results.passed_tests += 1;
                test_results.test_details.push(format!("Classical signature test: PASSED (rejected with error: {})", e));
                log::info!("✅ Classical signature test passed - rejected with error: {}", e);
            }
        }

        Ok(test_results)
    }

    /// Simulate invalid signature and test rejection
    pub async fn simulate_invalid_signature_rejection(&self, transaction: &Transaction) -> Result<SignatureRejectionTest, BlockchainError> {
        let mut test_results = SignatureRejectionTest {
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            test_details: Vec::new(),
        };

        // Test with tampered signature
        test_results.total_tests += 1;
        let mut tampered_signature = self.sign_transaction(transaction).await?;
        tampered_signature.signature_data[0] ^= 0x01; // Flip first bit

        match self.verify_transaction_signature(transaction, &tampered_signature).await {
            Ok(valid) => {
                if !valid {
                    test_results.passed_tests += 1;
                    test_results.test_details.push("Tampered signature test: PASSED (correctly rejected)".to_string());
                    log::info!("✅ Tampered signature test passed - correctly rejected");
                } else {
                    test_results.failed_tests += 1;
                    test_results.test_details.push("Tampered signature test: FAILED (incorrectly accepted)".to_string());
                    log::error!("❌ Tampered signature test failed - incorrectly accepted");
                }
            }
            Err(e) => {
                test_results.passed_tests += 1;
                test_results.test_details.push(format!("Tampered signature test: PASSED (rejected with error: {})", e));
                log::info!("✅ Tampered signature test passed - rejected with error: {}", e);
            }
        }

        // Test with wrong public key
        test_results.total_tests += 1;
        let mut wrong_key_signature = self.sign_transaction(transaction).await?;
        wrong_key_signature.public_key = vec![0u8; 32]; // Wrong public key

        match self.verify_transaction_signature(transaction, &wrong_key_signature).await {
            Ok(valid) => {
                if !valid {
                    test_results.passed_tests += 1;
                    test_results.test_details.push("Wrong public key test: PASSED (correctly rejected)".to_string());
                    log::info!("✅ Wrong public key test passed - correctly rejected");
                } else {
                    test_results.failed_tests += 1;
                    test_results.test_details.push("Wrong public key test: FAILED (incorrectly accepted)".to_string());
                    log::error!("❌ Wrong public key test failed - incorrectly accepted");
                }
            }
            Err(e) => {
                test_results.passed_tests += 1;
                test_results.test_details.push(format!("Wrong public key test: PASSED (rejected with error: {})", e));
                log::info!("✅ Wrong public key test passed - rejected with error: {}", e);
            }
        }

        Ok(test_results)
    }

    /// Rotate node identity (generate new keys)
    pub async fn rotate_identity(&mut self) -> Result<NodeIdentity, BlockchainError> {
        log::info!("🔄 Starting identity rotation...");
        
        // Generate new identity
        let new_identity = self.generate_identity().await?;
        
        // Backup old identity if it exists
        if let Some(old_identity) = self.current_identity.read().await.as_ref() {
            self.backup_identity(old_identity).await?;
            log::info!("📦 Backed up previous identity: {}", old_identity.node_id);
        }
        
        // Update current identity
        *self.current_identity.write().await = Some(new_identity.clone());
        
        // Save new identity
        self.save_identity(&new_identity).await?;
        
        // Update metadata with rotation info
        let mut identity = self.current_identity.write().await;
        if let Some(ref mut id) = *identity {
            id.metadata.insert("last_rotation".to_string(), chrono::Utc::now().to_rfc3339());
            id.metadata.insert("rotation_count".to_string(), 
                id.metadata.get("rotation_count")
                    .and_then(|s| s.parse::<u64>().ok())
                    .map(|c| (c + 1).to_string())
                    .unwrap_or_else(|| "1".to_string()));
        }
        drop(identity);
        
        log::info!("✅ Identity rotation completed. New node ID: {}", new_identity.node_id);
        Ok(new_identity)
    }

    /// Backup existing identity
    async fn backup_identity(&self, identity: &NodeIdentity) -> Result<(), BlockchainError> {
        let timestamp = chrono::Utc::now().timestamp();
        let backup_path = format!("{}/identity_backup_{}.json", self.storage_path, timestamp);
        
        // Ensure directory exists
        if let Some(parent) = std::path::Path::new(&backup_path).parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        // Create backup metadata
        let mut backup_data = identity.clone();
        backup_data.metadata.insert("backup_timestamp".to_string(), timestamp.to_string());
        backup_data.metadata.insert("backup_reason".to_string(), "rotation".to_string());
        
        let backup_json = serde_json::to_string_pretty(&backup_data)?;
        tokio::fs::write(&backup_path, backup_json).await?;
        
        log::debug!("Created identity backup at {}", backup_path);
        
        // Clean up old backups (keep last 5)
        self.cleanup_old_backups().await?;
        
        Ok(())
    }

    /// Clean up old identity backups
    async fn cleanup_old_backups(&self) -> Result<(), BlockchainError> {
        let backup_dir = std::path::Path::new(&self.storage_path);
        
        if !backup_dir.exists() {
            return Ok(());
        }
        
        let mut entries = tokio::fs::read_dir(backup_dir).await?;
        let mut backups = Vec::new();
        
        while let Ok(entry) = entries.next_entry().await {
            if let Ok(file_name) = entry.file_name().into_string() {
                if file_name.starts_with("identity_backup_") && file_name.ends_with(".json") {
                    if let Ok(metadata) = entry.metadata().await {
                        if let Ok(modified) = metadata.modified() {
                            backups.push((file_name, modified));
                        }
                    }
                }
            }
        }
        
        // Sort by modification time (oldest first)
        backups.sort_by_key(|(_, time)| *time);
        
        // Keep only the 5 most recent backups
        if backups.len() > 5 {
            for (file_name, _) in backups.iter().take(backups.len() - 5) {
                let file_path = backup_dir.join(file_name);
                if let Err(e) = tokio::fs::remove_file(&file_path).await {
                    log::warn!("Failed to remove old backup {}: {}", file_name, e);
                } else {
                    log::debug!("Removed old backup: {}", file_name);
                }
            }
        }
        
        Ok(())
    }

    /// Get identity rotation history
    pub async fn get_rotation_history(&self) -> Result<Vec<IdentityRotationEvent>, BlockchainError> {
        let backup_dir = std::path::Path::new(&self.storage_path);
        let mut events = Vec::new();
        
        if !backup_dir.exists() {
            return Ok(events);
        }
        
        let mut entries = tokio::fs::read_dir(backup_dir).await?;
        
        while let Ok(entry) = entries.next_entry().await {
            if let Ok(file_name) = entry.file_name().into_string() {
                if file_name.starts_with("identity_backup_") && file_name.ends_with(".json") {
                    let file_path = backup_dir.join(&file_name);
                    
                    match tokio::fs::read_to_string(&file_path).await {
                        Ok(content) => {
                            match serde_json::from_str::<NodeIdentity>(&content) {
                                Ok(identity) => {
                                    // Extract timestamp from filename
                                    if let Some(timestamp_str) = file_name
                                        .strip_prefix("identity_backup_")
                                        .and_then(|s| s.strip_suffix(".json")) {
                                        
                                        if let Ok(timestamp) = timestamp_str.parse::<i64>() {
                                            events.push(IdentityRotationEvent {
                                                timestamp,
                                                node_id: identity.node_id.clone(),
                                                backup_file: file_name,
                                                metadata: identity.metadata.clone(),
                                            });
                                        }
                                    }
                                }
                                Err(e) => {
                                    log::warn!("Failed to parse backup file {}: {}", file_name, e);
                                }
                            }
                        }
                        Err(e) => {
                            log::warn!("Failed to read backup file {}: {}", file_name, e);
                        }
                    }
                }
            }
        }
        
        // Sort by timestamp (newest first)
        events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        Ok(events)
    }

    /// Schedule automatic key rotation
    pub async fn schedule_rotation(&self, interval_hours: u64) -> Result<(), BlockchainError> {
        let current_identity = self.current_identity.read().await;
        let identity = current_identity.as_ref()
            .ok_or_else(|| BlockchainError::Other("Node identity not initialized".to_string()))?;
        
        let last_rotation = identity.metadata.get("last_rotation")
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(identity.created_at as i64);
        
        let now = chrono::Utc::now().timestamp();
        let hours_since_rotation = (now - last_rotation) / 3600;
        
        if hours_since_rotation >= interval_hours as i64 {
            log::info!("⏰ Scheduled identity rotation triggered ({} hours since last rotation)", hours_since_rotation);
            drop(current_identity);
            
            // Note: This would need to be called through a mutable reference
            // In a real implementation, you'd use a message queue or similar
            return Err(BlockchainError::Other("Rotation scheduled - call rotate_identity() with mutable access".to_string()));
        }
        
        let hours_until_rotation = interval_hours as i64 - hours_since_rotation;
        log::debug!("Next identity rotation in {} hours", hours_until_rotation);
        
        Ok(())
    }

    /// Validate identity before rotation
    pub async fn validate_rotation_readiness(&self) -> Result<IdentityRotationReadiness, BlockchainError> {
        let mut readiness = IdentityRotationReadiness {
            is_ready: true,
            reasons: Vec::new(),
            recommendations: Vec::new(),
        };
        
        let current_identity = self.current_identity.read().await;
        let identity = current_identity.as_ref()
            .ok_or_else(|| BlockchainError::Other("Node identity not initialized".to_string()))?;
        
        // Check identity age
        let age_hours = (chrono::Utc::now().timestamp() as i64 - identity.created_at as i64) / 3600;
        if age_hours < 24 {
            readiness.is_ready = false;
            readiness.reasons.push(format!("Identity is too young ({} hours old, minimum: 24 hours)", age_hours));
        }
        
        // Check recent activity
        let last_rotation = identity.metadata.get("last_rotation")
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(identity.created_at as i64);
        let hours_since_rotation = (chrono::Utc::now().timestamp() as i64 - last_rotation) / 3600;
        
        if hours_since_rotation < 12 {
            readiness.is_ready = false;
            readiness.reasons.push(format!("Recent rotation ({} hours ago, minimum: 12 hours between rotations)", hours_since_rotation));
        }
        
        // Check backup system
        match self.get_rotation_history().await {
            Ok(backups) => {
                if backups.len() >= 5 {
                    readiness.recommendations.push("Consider cleaning up old identity backups".to_string());
                }
                readiness.recommendations.push(format!("Found {} backup identities", backups.len()));
            }
            Err(e) => {
                readiness.is_ready = false;
                readiness.reasons.push(format!("Cannot access backup system: {}", e));
            }
        }
        
        // Check storage space
        if let Ok(metadata) = tokio::fs::metadata(&self.storage_path).await {
            if let Ok(space_available) = self.check_available_space().await {
                if space_available < 10 * 1024 * 1024 { // Less than 10MB
                    readiness.is_ready = false;
                    readiness.reasons.push("Insufficient storage space for identity backup".to_string());
                }
            }
        }
        
        if readiness.is_ready {
            readiness.recommendations.push("Identity rotation is ready".to_string());
        }
        
        Ok(readiness)
    }

    /// Check available disk space
    async fn check_available_space(&self) -> Result<u64, BlockchainError> {
        // This is a simplified implementation
        // In a real implementation, you'd use platform-specific APIs
        Ok(100 * 1024 * 1024) // Mock 100MB available
    }
}

/// Identity rotation event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdentityRotationEvent {
    pub timestamp: i64,
    pub node_id: String,
    pub backup_file: String,
    pub metadata: HashMap<String, String>,
}

/// Identity rotation readiness check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdentityRotationReadiness {
    pub is_ready: bool,
    pub reasons: Vec<String>,
    pub recommendations: Vec<String>,
}

/// Test results for signature rejection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureRejectionTest {
    pub total_tests: usize,
    pub passed_tests: usize,
    pub failed_tests: usize,
    pub test_details: Vec<String>,
}

impl SignatureRejectionTest {
    pub fn success_rate(&self) -> f64 {
        if self.total_tests == 0 {
            0.0
        } else {
            (self.passed_tests as f64 / self.total_tests as f64) * 100.0
        }
    }

    pub fn all_passed(&self) -> bool {
        self.failed_tests == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_identity_generation() {
        let temp_dir = TempDir::new().unwrap();
        let storage_path = temp_dir.path().to_string_lossy().to_string();
        
        let mut manager = IdentityManager::new(storage_path);
        let identity = manager.initialize_identity().await;
        
        assert!(identity.is_ok());
        let identity = identity.unwrap();
        
        assert!(!identity.node_id.is_empty());
        assert!(!identity.ed25519_public.is_empty());
        assert!(!identity.dilithium3_public.is_empty());
        assert!(!identity.dilithium5_public.is_empty());
        assert!(identity.created_at > 0);
    }

    #[tokio::test]
    async fn test_signing_and_verification() {
        let temp_dir = TempDir::new().unwrap();
        let storage_path = temp_dir.path().to_string_lossy().to_string();
        
        let mut manager = IdentityManager::new(storage_path);
        manager.initialize_identity().await.unwrap();
        
        let test_data = b"test data for signing";
        
        // Test Ed25519 signing
        let signature = manager.sign(test_data, SignatureType::Ed25519).await.unwrap();
        let verified = manager.verify(test_data, &signature).await.unwrap();
        assert!(verified);
        
        // Test Dilithium3 signing
        let signature = manager.sign(test_data, SignatureType::Dilithium3).await.unwrap();
        let verified = manager.verify(test_data, &signature).await.unwrap();
        assert!(verified);
        
        // Test Hybrid signing
        let signature = manager.sign(test_data, SignatureType::Hybrid).await.unwrap();
        let verified = manager.verify(test_data, &signature).await.unwrap();
        assert!(verified);
    }

    #[tokio::test]
    async fn test_transaction_signing() {
        let temp_dir = TempDir::new().unwrap();
        let storage_path = temp_dir.path().to_string_lossy().to_string();
        
        let mut manager = IdentityManager::new(storage_path);
        manager.initialize_identity().await.unwrap();
        
        let transaction = Transaction {
            id: TransactionId::new(),
            sender: vec![1u8; 32],
            receiver: vec![2u8; 32],
            amount: 100,
            nonce: 1,
            timestamp: chrono::Utc::now().timestamp() as u64,
            parents: vec![],
            signature: vec![0u8; 64],
            quantum_proof: QuantumProof {
                prime_hash: vec![0u8; 32],
                resistance_score: 80,
                proof_timestamp: chrono::Utc::now().timestamp() as u64,
            },
            metadata: None,
        };
        
        let signature = manager.sign_transaction(&transaction).await.unwrap();
        let verified = manager.verify_transaction_signature(&transaction, &signature).await.unwrap();
        assert!(verified);
    }

    #[tokio::test]
    async fn test_identity_persistence() {
        let temp_dir = TempDir::new().unwrap();
        let storage_path = temp_dir.path().to_string_lossy().to_string();
        
        // Create and save identity
        let mut manager1 = IdentityManager::new(storage_path.clone());
        let identity1 = manager1.initialize_identity().await.unwrap();
        let node_id1 = identity1.node_id.clone();
        
        // Load identity in new manager
        let mut manager2 = IdentityManager::new(storage_path);
        let identity2 = manager2.initialize_identity().await.unwrap();
        
        // Should be the same identity
        assert_eq!(identity2.node_id, node_id1);
        assert_eq!(identity2.ed25519_public, identity1.ed25519_public);
        assert_eq!(identity2.dilithium3_public, identity1.dilithium3_public);
    }

    #[test]
    fn test_signature_entropy() {
        let manager = IdentityManager::new("./test".to_string());
        
        // High entropy signature
        let high_entropy_sig = (0..255).collect::<Vec<u8>>();
        let high_entropy = manager.calculate_signature_entropy(&high_entropy_sig);
        assert!(high_entropy > 0.9);
        
        // Low entropy signature
        let low_entropy_sig = vec![0u8; 100];
        let low_entropy = manager.calculate_signature_entropy(&low_entropy_sig);
        assert_eq!(low_entropy, 0.0);
    }
}