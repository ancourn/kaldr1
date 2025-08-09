use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use ed25519_dalek::{PublicKey, Signature, Signer, Verifier};
use thiserror::Error;
use crate::bridge::validators::{ValidatorSet, ValidatorSignature};

#[derive(Error, Debug)]
pub enum NFTBridgeError {
    #[error("NFT not found")]
    NFTNotFound,
    #[error("NFT already locked")]
    NFTAlreadyLocked,
    #[error("NFT not locked")]
    NFTNotLocked,
    #[error("Invalid owner")]
    InvalidOwner,
    #[error("Invalid recipient")]
    InvalidRecipient,
    #[error("Unsupported token")]
    UnsupportedToken,
    #[error("Invalid proof")]
    InvalidProof,
    #[error("Proof already used")]
    ProofAlreadyUsed,
    #[error("Insufficient signatures")]
    InsufficientSignatures,
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Bridge paused")]
    BridgePaused,
    #[error("Serialization error")]
    SerializationError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NFTInfo {
    pub token_id: String,
    pub collection_id: String,
    pub owner: String,
    pub metadata_uri: String,
    pub is_locked: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NFTCollection {
    pub id: String,
    pub name: String,
    pub symbol: String,
    pub owner: String,
    pub metadata_uri: String,
    pub is_supported: bool,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NFTLockData {
    pub proof_id: String,
    pub token_id: String,
    pub collection_id: String,
    pub owner: String,
    pub recipient: String,
    pub source_chain: String,
    pub target_chain: String,
    pub source_chain_id: u64,
    pub target_chain_id: u64,
    pub timestamp: u64,
    pub metadata_uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NFTBridgeConfig {
    pub supported_collections: HashMap<String, NFTCollection>,
    pub validator_set: ValidatorSet,
    pub is_paused: bool,
    pub signature_timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NFTBridgeProof {
    pub proof_id: String,
    pub token_id: String,
    pub collection_id: String,
    pub source_chain: String,
    pub target_chain: String,
    pub source_chain_id: u64,
    pub target_chain_id: u64,
    pub owner: String,
    pub recipient: String,
    pub metadata_uri: String,
    pub message_hash: String,
    pub signatures: Vec<ValidatorSignature>,
    pub status: ProofStatus,
    pub created_at: u64,
    pub expires_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProofStatus {
    Pending,
    Collecting,
    Verifying,
    Verified,
    Failed,
    Expired,
    Used,
}

pub struct KaldrixNFTBridge {
    config: NFTBridgeConfig,
    nfts: HashMap<String, NFTInfo>, // token_id -> NFTInfo
    locked_nfts: HashMap<String, NFTLockData>, // proof_id -> NFTLockData
    proofs: HashMap<String, NFTBridgeProof>, // proof_id -> NFTBridgeProof
    used_proofs: HashMap<String, bool>, // proof_id -> bool
}

impl KaldrixNFTBridge {
    /// Create a new KALDRIX NFT bridge
    pub fn new(validator_set: ValidatorSet) -> Self {
        let config = NFTBridgeConfig {
            supported_collections: HashMap::new(),
            validator_set,
            is_paused: false,
            signature_timeout: 300, // 5 minutes
        };

        Self {
            config,
            nfts: HashMap::new(),
            locked_nfts: HashMap::new(),
            proofs: HashMap::new(),
            used_proofs: HashMap::new(),
        }
    }

    /// Add supported NFT collection
    pub fn add_supported_collection(&mut self, collection: NFTCollection) -> Result<(), NFTBridgeError> {
        self.config.supported_collections.insert(collection.id.clone(), collection);
        Ok(())
    }

    /// Remove supported NFT collection
    pub fn remove_supported_collection(&mut self, collection_id: &str) -> Result<(), NFTBridgeError> {
        self.config.supported_collections.remove(collection_id);
        Ok(())
    }

    /// Mint or register NFT on KALDRIX
    pub fn mint_nft(&mut self, token_id: String, collection_id: String, owner: String, metadata_uri: String) -> Result<NFTInfo, NFTBridgeError> {
        if !self.config.supported_collections.contains_key(&collection_id) {
            return Err(NFTBridgeError::UnsupportedToken);
        }

        let nft = NFTInfo {
            token_id: token_id.clone(),
            collection_id,
            owner: owner.clone(),
            metadata_uri,
            is_locked: false,
            created_at: Self::current_timestamp(),
            updated_at: Self::current_timestamp(),
        };

        self.nfts.insert(token_id, nft.clone());
        Ok(nft)
    }

    /// Lock NFT for cross-chain transfer
    pub fn lock_nft(
        &mut self,
        token_id: &str,
        recipient: String,
        target_chain: String,
        target_chain_id: u64,
    ) -> Result<NFTBridgeProof, NFTBridgeError> {
        if self.config.is_paused {
            return Err(NFTBridgeError::BridgePaused);
        }

        let nft = self.nfts.get_mut(token_id)
            .ok_or(NFTBridgeError::NFTNotFound)?;

        if nft.is_locked {
            return Err(NFTBridgeError::NFTAlreadyLocked);
        }

        let collection = self.config.supported_collections.get(&nft.collection_id)
            .ok_or(NFTBridgeError::UnsupportedToken)?;

        // Generate proof ID
        let proof_id = self.generate_proof_id(token_id, &nft.owner, &recipient, target_chain_id);

        // Create message hash
        let message = self.create_bridge_message(
            &proof_id,
            token_id,
            &nft.collection_id,
            &nft.owner,
            &recipient,
            target_chain_id,
        );

        let message_hash = Self::hash_message(&message);

        // Create bridge proof
        let proof = NFTBridgeProof {
            proof_id: proof_id.clone(),
            token_id: token_id.to_string(),
            collection_id: nft.collection_id.clone(),
            source_chain: "kaldrix".to_string(),
            target_chain: target_chain.clone(),
            source_chain_id: 1, // KALDRIX chain ID
            target_chain_id,
            owner: nft.owner.clone(),
            recipient: recipient.clone(),
            metadata_uri: nft.metadata_uri.clone(),
            message_hash,
            signatures: Vec::new(),
            status: ProofStatus::Pending,
            created_at: Self::current_timestamp(),
            expires_at: Self::current_timestamp() + self.config.signature_timeout,
        };

        // Lock NFT
        nft.is_locked = true;
        nft.updated_at = Self::current_timestamp();

        // Store lock data
        let lock_data = NFTLockData {
            proof_id: proof_id.clone(),
            token_id: token_id.to_string(),
            collection_id: nft.collection_id.clone(),
            owner: nft.owner.clone(),
            recipient: recipient.clone(),
            source_chain: "kaldrix".to_string(),
            target_chain,
            source_chain_id: 1,
            target_chain_id,
            timestamp: Self::current_timestamp(),
            metadata_uri: nft.metadata_uri.clone(),
        };

        self.locked_nfts.insert(proof_id.clone(), lock_data);
        self.proofs.insert(proof_id.clone(), proof.clone());

        Ok(proof)
    }

    /// Unlock NFT with validator signatures
    pub fn unlock_nft(
        &mut self,
        proof_id: &str,
        token_id: &str,
        collection_id: &str,
        recipient: String,
        source_chain: String,
        source_chain_id: u64,
        signatures: Vec<ValidatorSignature>,
    ) -> Result<NFTInfo, NFTBridgeError> {
        if self.config.is_paused {
            return Err(NFTBridgeError::BridgePaused);
        }

        if self.used_proofs.contains_key(proof_id) {
            return Err(NFTBridgeError::ProofAlreadyUsed);
        }

        if !self.config.supported_collections.contains_key(collection_id) {
            return Err(NFTBridgeError::UnsupportedToken);
        }

        // Create message hash for verification
        let message = self.create_bridge_message(
            proof_id,
            token_id,
            collection_id,
            &recipient,
            source_chain_id,
        );

        let message_hash = Self::hash_message(&message);

        // Verify signatures
        let multi_sig = self.config.validator_set.collect_signatures(signatures, &message)
            .map_err(|e| NFTBridgeError::InvalidSignature)?;

        if !multi_sig.threshold_reached {
            return Err(NFTBridgeError::InsufficientSignatures);
        }

        // Mark proof as used
        self.used_proofs.insert(proof_id.to_string(), true);

        // Mint or transfer NFT to recipient
        let nft = self.mint_nft(
            token_id.to_string(),
            collection_id.to_string(),
            recipient.clone(),
            "".to_string(), // Will be set by the bridge
        )?;

        // Update proof status
        if let Some(proof) = self.proofs.get_mut(proof_id) {
            proof.status = ProofStatus::Used;
            proof.signatures = multi_sig.signatures;
        }

        Ok(nft)
    }

    /// Submit validator signature for NFT proof
    pub fn submit_signature(&mut self, proof_id: &str, signature: ValidatorSignature) -> Result<(), NFTBridgeError> {
        let proof = self.proofs.get_mut(proof_id)
            .ok_or(NFTBridgeError::InvalidProof)?;

        if proof.status != ProofStatus::Pending && proof.status != ProofStatus::Collecting {
            return Err(NFTBridgeError::InvalidProof);
        }

        if Self::current_timestamp() > proof.expires_at {
            proof.status = ProofStatus::Expired;
            return Err(NFTBridgeError::InvalidProof);
        }

        // Verify message hash matches
        if signature.message_hash != proof.message_hash {
            return Err(NFTBridgeError::InvalidSignature);
        }

        // Verify signature
        let message = self.create_bridge_message(
            &proof.proof_id,
            &proof.token_id,
            &proof.collection_id,
            &proof.owner,
            &proof.recipient,
            proof.target_chain_id,
        );

        match self.config.validator_set.verify_signature(&signature, &message) {
            Ok(true) => {
                proof.signatures.push(signature);
                proof.status = ProofStatus::Collecting;

                // Check if we have enough signatures
                if proof.signatures.len() >= self.config.validator_set.threshold {
                    proof.status = ProofStatus::Verified;
                }

                Ok(())
            }
            Ok(false) => Err(NFTBridgeError::InvalidSignature),
            Err(_) => Err(NFTBridgeError::InvalidSignature),
        }
    }

    /// Get NFT information
    pub fn get_nft(&self, token_id: &str) -> Option<&NFTInfo> {
        self.nfts.get(token_id)
    }

    /// Get lock data for a proof
    pub fn get_lock_data(&self, proof_id: &str) -> Option<&NFTLockData> {
        self.locked_nfts.get(proof_id)
    }

    /// Get proof information
    pub fn get_proof(&self, proof_id: &str) -> Option<&NFTBridgeProof> {
        self.proofs.get(proof_id)
    }

    /// List all NFTs
    pub fn list_nfts(&self) -> Vec<&NFTInfo> {
        self.nfts.values().collect()
    }

    /// List locked NFTs
    pub fn list_locked_nfts(&self) -> Vec<&NFTLockData> {
        self.locked_nfts.values().collect()
    }

    /// List proofs
    pub fn list_proofs(&self) -> Vec<&NFTBridgeProof> {
        self.proofs.values().collect()
    }

    /// Pause bridge
    pub fn pause(&mut self) {
        self.config.is_paused = true;
    }

    /// Resume bridge
    pub fn resume(&mut self) {
        self.config.is_paused = false;
    }

    /// Get bridge statistics
    pub fn get_stats(&self) -> NFTBridgeStats {
        let total_nfts = self.nfts.len();
        let locked_nfts = self.nfts.values().filter(|nft| nft.is_locked).count();
        let supported_collections = self.config.supported_collections.len();
        let total_proofs = self.proofs.len();
        let pending_proofs = self.proofs.values().filter(|p| p.status == ProofStatus::Pending).count();
        let verified_proofs = self.proofs.values().filter(|p| p.status == ProofStatus::Verified).count();
        let used_proofs = self.used_proofs.len();

        NFTBridgeStats {
            total_nfts,
            locked_nfts,
            supported_collections,
            total_proofs,
            pending_proofs,
            verified_proofs,
            used_proofs,
            is_paused: self.config.is_paused,
            validator_threshold: self.config.validator_set.threshold,
            active_validators: self.config.validator_set.active_validators,
        }
    }

    /// Create bridge message for signing
    fn create_bridge_message(
        &self,
        proof_id: &str,
        token_id: &str,
        collection_id: &str,
        owner: &str,
        recipient: &str,
        target_chain_id: u64,
    ) -> Vec<u8> {
        let message = format!(
            "KALDRIX_NFT_BRIDGE:{}:{}:{}:{}:{}:{}",
            proof_id, token_id, collection_id, owner, recipient, target_chain_id
        );
        message.into_bytes()
    }

    /// Generate unique proof ID
    fn generate_proof_id(&self, token_id: &str, owner: &str, recipient: &str, target_chain_id: u64) -> String {
        let timestamp = Self::current_timestamp();
        let random = (rand::random::<u64>() % 1000000).to_string();
        format!("nft_proof_{}_{}_{}_{}_{}", timestamp, token_id, owner, recipient, target_chain_id)
    }

    /// Hash message using SHA256
    fn hash_message(message: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(message);
        base64::encode(hasher.finalize())
    }

    /// Get current timestamp
    fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NFTBridgeStats {
    pub total_nfts: usize,
    pub locked_nfts: usize,
    pub supported_collections: usize,
    pub total_proofs: usize,
    pub pending_proofs: usize,
    pub verified_proofs: usize,
    pub used_proofs: usize,
    pub is_paused: bool,
    pub validator_threshold: usize,
    pub active_validators: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::validators::Validator;

    fn create_test_validator(address: &str) -> Validator {
        Validator {
            address: address.to_string(),
            public_key: "test_public_key_base64_encoded_32bytes".to_string(),
            stake_amount: 1000,
            is_active: true,
            is_slashed: false,
            joined_at: 1640995200,
            last_seen: 1640995200,
            reputation_score: 100,
        }
    }

    #[test]
    fn test_nft_bridge_creation() {
        let validator_set = ValidatorSet::new();
        let bridge = KaldrixNFTBridge::new(validator_set);
        assert_eq!(bridge.nfts.len(), 0);
        assert_eq!(bridge.locked_nfts.len(), 0);
        assert!(!bridge.config.is_paused);
    }

    #[test]
    fn test_add_supported_collection() {
        let validator_set = ValidatorSet::new();
        let mut bridge = KaldrixNFTBridge::new(validator_set);
        
        let collection = NFTCollection {
            id: "test_collection".to_string(),
            name: "Test Collection".to_string(),
            symbol: "TEST".to_string(),
            owner: "0x123".to_string(),
            metadata_uri: "https://test.com/metadata".to_string(),
            is_supported: true,
            created_at: 1640995200,
        };
        
        assert!(bridge.add_supported_collection(collection).is_ok());
        assert_eq!(bridge.config.supported_collections.len(), 1);
    }

    #[test]
    fn test_mint_nft() {
        let validator_set = ValidatorSet::new();
        let mut bridge = KaldrixNFTBridge::new(validator_set);
        
        let collection = NFTCollection {
            id: "test_collection".to_string(),
            name: "Test Collection".to_string(),
            symbol: "TEST".to_string(),
            owner: "0x123".to_string(),
            metadata_uri: "https://test.com/metadata".to_string(),
            is_supported: true,
            created_at: 1640995200,
        };
        
        bridge.add_supported_collection(collection).unwrap();
        
        let nft = bridge.mint_nft(
            "token_1".to_string(),
            "test_collection".to_string(),
            "0x123".to_string(),
            "https://test.com/token/1".to_string(),
        ).unwrap();
        
        assert_eq!(nft.token_id, "token_1");
        assert_eq!(nft.owner, "0x123");
        assert!(!nft.is_locked);
    }
}