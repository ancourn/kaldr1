use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use std::collections::HashMap;
use thiserror::Error;

/// Cryptographic proof verification for cross-chain bridge
/// Handles Merkle proofs, signature verification, and hash validation

#[derive(Debug, Error)]
pub enum VerificationError {
    #[error("Invalid proof format")]
    InvalidProofFormat,
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Insufficient signatures")]
    InsufficientSignatures,
    #[error("Invalid Merkle proof")]
    InvalidMerkleProof,
    #[error("Invalid hash")]
    InvalidHash,
    #[error("Proof expired")]
    ProofExpired,
    #[error("Invalid validator")]
    InvalidValidator,
    #[error("Duplicate signature")]
    DuplicateSignature,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleProof {
    pub root: String,
    pub leaf: String,
    pub proof: Vec<String>,
    pub index: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureProof {
    pub message_hash: String,
    pub signatures: Vec<String>,
    pub signers: Vec<String>,
    pub threshold: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeProof {
    pub merkle_proof: Option<MerkleProof>,
    pub signature_proof: SignatureProof,
    pub timestamp: u64,
    pub expiry_time: u64,
    pub chain_id: u64,
}

pub struct CryptoVerifier {
    validators: HashMap<String, ValidatorInfo>,
    max_proof_age: u64, // Maximum proof age in seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorInfo {
    pub address: String,
    pub public_key: String,
    pub stake_amount: u64,
    pub is_active: bool,
    pub join_time: u64,
}

impl CryptoVerifier {
    /// Create a new crypto verifier
    pub fn new(max_proof_age: u64) -> Self {
        Self {
            validators: HashMap::new(),
            max_proof_age,
        }
    }

    /// Add a validator
    pub fn add_validator(&mut self, validator: ValidatorInfo) -> Result<(), VerificationError> {
        if self.validators.contains_key(&validator.address) {
            return Err(VerificationError::InvalidValidator);
        }

        self.validators.insert(validator.address.clone(), validator);
        Ok(())
    }

    /// Remove a validator
    pub fn remove_validator(&mut self, address: &str) -> Result<(), VerificationError> {
        if !self.validators.contains_key(address) {
            return Err(VerificationError::InvalidValidator);
        }

        self.validators.remove(address);
        Ok(())
    }

    /// Verify a complete bridge proof
    pub fn verify_bridge_proof(&self, proof: &BridgeProof) -> Result<(), VerificationError> {
        // Check proof expiry
        self.check_proof_expiry(proof.timestamp, proof.expiry_time)?;

        // Verify Merkle proof if present
        if let Some(ref merkle_proof) = proof.merkle_proof {
            self.verify_merkle_proof(merkle_proof)?;
        }

        // Verify signature proof
        self.verify_signature_proof(&proof.signature_proof)?;

        Ok(())
    }

    /// Verify Merkle proof
    pub fn verify_merkle_proof(&self, proof: &MerkleProof) -> Result<(), VerificationError> {
        // Parse root hash
        let root_hash = hex::decode(&proof.root)
            .map_err(|_| VerificationError::InvalidMerkleProof)?;
        
        if root_hash.len() != 32 {
            return Err(VerificationError::InvalidMerkleProof);
        }

        // Parse leaf hash
        let leaf_hash = hex::decode(&proof.leaf)
            .map_err(|_| VerificationError::InvalidMerkleProof)?;
        
        if leaf_hash.len() != 32 {
            return Err(VerificationError::InvalidMerkleProof);
        }

        // Verify proof
        let computed_root = self.compute_merkle_root(&leaf_hash, &proof.proof, proof.index)?;
        
        if computed_root != root_hash {
            return Err(VerificationError::InvalidMerkleProof);
        }

        Ok(())
    }

    /// Verify signature proof
    pub fn verify_signature_proof(&self, proof: &SignatureProof) -> Result<(), VerificationError> {
        if proof.signatures.len() < proof.threshold as usize {
            return Err(VerificationError::InsufficientSignatures);
        }

        let message_hash = hex::decode(&proof.message_hash)
            .map_err(|_| VerificationError::InvalidHash)?;
        
        if message_hash.len() != 32 {
            return Err(VerificationError::InvalidHash);
        }

        let mut valid_signatures = 0;
        let mut used_signers = std::collections::HashSet::new();

        for (signature_str, signer_address) in proof.signatures.iter().zip(&proof.signers) {
            // Parse signature
            let signature = self.parse_signature(signature_str)?;

            // Verify signature
            if self.verify_signature(&message_hash, &signature, signer_address)? {
                // Check if signer is a validator and not duplicate
                if let Some(validator) = self.validators.get(signer_address) {
                    if validator.is_active && !used_signers.contains(signer_address) {
                        valid_signatures += 1;
                        used_signers.insert(signer_address.clone());
                    }
                }
            }
        }

        if valid_signatures < proof.threshold as usize {
            return Err(VerificationError::InsufficientSignatures);
        }

        Ok(())
    }

    /// Check proof expiry
    fn check_proof_expiry(&self, timestamp: u64, expiry_time: u64) -> Result<(), VerificationError> {
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if current_time > expiry_time {
            return Err(VerificationError::ProofExpired);
        }

        if current_time - timestamp > self.max_proof_age {
            return Err(VerificationError::ProofExpired);
        }

        Ok(())
    }

    /// Compute Merkle root from proof
    fn compute_merkle_root(
        &self,
        leaf: &[u8],
        proof: &[String],
        index: u64,
    ) -> Result<Vec<u8>, VerificationError> {
        let mut computed_hash = leaf.to_vec();
        let mut current_index = index;

        for proof_hash_str in proof {
            let proof_hash = hex::decode(proof_hash_str)
                .map_err(|_| VerificationError::InvalidMerkleProof)?;

            if proof_hash.len() != 32 {
                return Err(VerificationError::InvalidMerkleProof);
            }

            // Hash based on index (even or odd)
            if current_index % 2 == 0 {
                computed_hash = self.hash_pair(&computed_hash, &proof_hash);
            } else {
                computed_hash = self.hash_pair(&proof_hash, &computed_hash);
            }

            current_index /= 2;
        }

        Ok(computed_hash)
    }

    /// Hash two values together
    fn hash_pair(&self, a: &[u8], b: &[u8]) -> Vec<u8> {
        let mut hasher = Keccak256::new();
        hasher.update(a);
        hasher.update(b);
        hasher.finalize().to_vec()
    }

    /// Parse ECDSA signature
    fn parse_signature(&self, signature_str: &str) -> Result<Vec<u8>, VerificationError> {
        let signature_bytes = hex::decode(signature_str)
            .map_err(|_| VerificationError::InvalidSignature)?;

        if signature_bytes.len() != 65 {
            return Err(VerificationError::InvalidSignature);
        }

        Ok(signature_bytes)
    }

    /// Verify ECDSA signature
    fn verify_signature(
        &self,
        message_hash: &[u8],
        signature: &[u8],
        signer_address: &str,
    ) -> Result<bool, VerificationError> {
        use libsecp256k1::{SecretKey, PublicKey, Signature, Message, recover};

        if signature.len() != 65 {
            return Err(VerificationError::InvalidSignature);
        }

        // Parse signature
        let mut sig_array = [0u8; 65];
        sig_array.copy_from_slice(signature);

        let signature = Signature::parse_standard(&sig_array)
            .map_err(|_| VerificationError::InvalidSignature)?;

        // Create message
        let message = Message::parse_slice(message_hash)
            .map_err(|_| VerificationError::InvalidSignature)?;

        // Recover public key
        let public_key = recover(&message, &signature)
            .map_err(|_| VerificationError::InvalidSignature)?;

        // Get address from public key
        let public_key_bytes = public_key.serialize();
        let address = format!("0x{}", hex::encode(&public_key_bytes[1..]));

        Ok(address == signer_address)
    }

    /// Generate Merkle proof for a leaf in a tree
    pub fn generate_merkle_proof(&self, leaves: &[String], leaf_index: usize) -> Result<MerkleProof, VerificationError> {
        if leaf_index >= leaves.len() {
            return Err(VerificationError::InvalidMerkleProof);
        }

        // Build Merkle tree
        let tree = self.build_merkle_tree(leaves)?;
        
        // Generate proof
        let proof = self.generate_proof_from_tree(&tree, leaf_index)?;
        
        Ok(MerkleProof {
            root: tree[0].clone(),
            leaf: leaves[leaf_index].clone(),
            proof,
            index: leaf_index as u64,
        })
    }

    /// Build Merkle tree from leaves
    fn build_merkle_tree(&self, leaves: &[String]) -> Result<Vec<String>, VerificationError> {
        if leaves.is_empty() {
            return Err(VerificationError::InvalidMerkleProof);
        }

        let mut tree = Vec::new();
        
        // Add leaves to tree
        for leaf in leaves {
            tree.push(leaf.clone());
        }

        // Build tree levels
        let mut level = 0;
        while tree.len() > 1 {
            let mut next_level = Vec::new();
            
            for i in (0..tree.len()).step_by(2) {
                if i + 1 < tree.len() {
                    // Hash two nodes
                    let hash1 = hex::decode(&tree[i])
                        .map_err(|_| VerificationError::InvalidMerkleProof)?;
                    let hash2 = hex::decode(&tree[i + 1])
                        .map_err(|_| VerificationError::InvalidMerkleProof)?;
                    
                    let combined_hash = self.hash_pair(&hash1, &hash2);
                    next_level.push(hex::encode(combined_hash));
                } else {
                    // Odd number of nodes, duplicate the last one
                    next_level.push(tree[i].clone());
                }
            }
            
            tree = next_level;
            level += 1;
        }

        Ok(tree)
    }

    /// Generate proof from Merkle tree
    fn generate_proof_from_tree(&self, tree: &[String], leaf_index: usize) -> Result<Vec<String>, VerificationError> {
        let mut proof = Vec::new();
        let mut current_index = leaf_index;
        let mut level_size = tree.len();

        while level_size > 1 {
            let sibling_index = if current_index % 2 == 0 {
                current_index + 1
            } else {
                current_index - 1
            };

            if sibling_index < level_size {
                // Find the position in the tree
                let mut current_level_start = 0;
                let mut current_level_size = level_size;
                
                while current_level_size > 1 {
                    if current_index < current_level_start + current_level_size {
                        break;
                    }
                    current_level_start += current_level_size;
                    current_level_size = (current_level_size + 1) / 2;
                }

                let actual_sibling_index = current_level_start + sibling_index;
                if actual_sibling_index < tree.len() {
                    proof.push(tree[actual_sibling_index].clone());
                }
            }

            current_index /= 2;
            level_size = (level_size + 1) / 2;
        }

        Ok(proof)
    }

    /// Get validator information
    pub fn get_validator(&self, address: &str) -> Option<&ValidatorInfo> {
        self.validators.get(address)
    }

    /// Get all validators
    pub fn get_validators(&self) -> Vec<&ValidatorInfo> {
        self.validators.values().collect()
    }

    /// Get active validators
    pub fn get_active_validators(&self) -> Vec<&ValidatorInfo> {
        self.validators
            .values()
            .filter(|v| v.is_active)
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_proof_generation() {
        let verifier = CryptoVerifier::new(3600);
        
        let leaves = vec![
            "leaf1".to_string(),
            "leaf2".to_string(),
            "leaf3".to_string(),
            "leaf4".to_string(),
        ];

        let proof = verifier.generate_merkle_proof(&leaves, 1).unwrap();
        
        assert_eq!(proof.index, 1);
        assert_eq!(proof.leaf, "leaf2");
        assert!(!proof.proof.is_empty());
    }

    #[test]
    fn test_merkle_proof_verification() {
        let verifier = CryptoVerifier::new(3600);
        
        let leaves = vec![
            "leaf1".to_string(),
            "leaf2".to_string(),
            "leaf3".to_string(),
            "leaf4".to_string(),
        ];

        let proof = verifier.generate_merkle_proof(&leaves, 1).unwrap();
        
        // Verify the proof
        assert!(verifier.verify_merkle_proof(&proof).is_ok());
    }

    #[test]
    fn test_invalid_merkle_proof() {
        let verifier = CryptoVerifier::new(3600);
        
        let mut proof = MerkleProof {
            root: "invalid_root".to_string(),
            leaf: "leaf1".to_string(),
            proof: vec!["invalid_proof".to_string()],
            index: 0,
        };
        
        assert!(verifier.verify_merkle_proof(&proof).is_err());
    }
}