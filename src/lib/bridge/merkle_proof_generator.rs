use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use thiserror::Error;

/// Merkle Proof Generator for Cross-Chain Bridge
/// Handles batched events and generates Merkle proofs for efficient validation

#[derive(Debug, Error)]
pub enum MerkleError {
    #[error("Invalid leaf data")]
    InvalidLeafData,
    #[error("Invalid proof format")]
    InvalidProofFormat,
    #[error("Leaf not found in tree")]
    LeafNotFound,
    #[error("Invalid tree structure")]
    InvalidTreeStructure,
    #[error("Serialization error")]
    SerializationError,
    #[error("Hash error")]
    HashError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeEvent {
    pub event_type: String,
    pub token_id: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: u64,
    pub nonce: u64,
    pub timestamp: u64,
    pub chain_id: u64,
    pub transaction_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleProof {
    pub root: String,
    pub leaf: String,
    pub proof: Vec<String>,
    pub index: u64,
    pub leaf_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchedEvents {
    pub batch_id: u64,
    pub merkle_root: String,
    pub events: Vec<BridgeEvent>,
    pub created_at: u64,
    pub total_amount: u64,
    pub event_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleTree {
    pub root: String,
    pub leaves: Vec<String>,
    pub levels: Vec<Vec<String>>,
    pub depth: usize,
}

pub struct MerkleProofGenerator {
    batch_size: usize,
    current_batch: Vec<BridgeEvent>,
    batch_counter: u64,
    event_history: HashMap<u64, BatchedEvents>,
}

impl MerkleProofGenerator {
    /// Create a new Merkle proof generator
    pub fn new(batch_size: usize) -> Self {
        Self {
            batch_size,
            current_batch: Vec::new(),
            batch_counter: 0,
            event_history: HashMap::new(),
        }
    }

    /// Add a bridge event to the current batch
    pub fn add_event(&mut self, event: BridgeEvent) -> Result<(), MerkleError> {
        // Validate event data
        self.validate_event(&event)?;

        // Add to current batch
        self.current_batch.push(event);

        // Check if batch is full
        if self.current_batch.len() >= self.batch_size {
            self.finalize_batch()?;
        }

        Ok(())
    }

    /// Finalize current batch and create Merkle tree
    pub fn finalize_batch(&mut self) -> Result<BatchedEvents, MerkleError> {
        if self.current_batch.is_empty() {
            return Err(MerkleError::InvalidLeafData);
        }

        // Create leaf hashes
        let leaf_hashes: Vec<String> = self.current_batch
            .iter()
            .map(|event| self.hash_event(event))
            .collect::<Result<Vec<_>, _>>()?;

        // Build Merkle tree
        let tree = self.build_merkle_tree(&leaf_hashes)?;

        // Calculate total amount
        let total_amount = self.current_batch.iter().map(|e| e.amount).sum();

        // Create batched events
        let batched_events = BatchedEvents {
            batch_id: self.batch_counter,
            merkle_root: tree.root.clone(),
            events: self.current_batch.clone(),
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            total_amount,
            event_count: self.current_batch.len(),
        };

        // Store in history
        self.event_history.insert(self.batch_counter, batched_events.clone());

        // Reset for next batch
        self.current_batch.clear();
        self.batch_counter += 1;

        Ok(batched_events)
    }

    /// Generate Merkle proof for a specific event
    pub fn generate_proof(&self, batch_id: u64, event_index: usize) -> Result<MerkleProof, MerkleError> {
        let batch = self.event_history.get(&batch_id)
            .ok_or(MerkleError::LeafNotFound)?;

        if event_index >= batch.events.len() {
            return Err(MerkleError::LeafNotFound);
        }

        // Get event and create leaf hash
        let event = &batch.events[event_index];
        let leaf_hash = self.hash_event(event)?;

        // Generate Merkle proof
        let proof = self.generate_merkle_proof(&leaf_hash, event_index, &batch.merkle_root)?;

        Ok(MerkleProof {
            root: batch.merkle_root.clone(),
            leaf: serde_json::to_string(event).map_err(|_| MerkleError::SerializationError)?,
            proof,
            index: event_index as u64,
            leaf_hash,
        })
    }

    /// Verify a Merkle proof
    pub fn verify_proof(&self, proof: &MerkleProof) -> Result<bool, MerkleError> {
        // Parse root hash
        let root_hash = hex::decode(&proof.root)
            .map_err(|_| MerkleError::InvalidProofFormat)?;
        
        if root_hash.len() != 32 {
            return Err(MerkleError::InvalidProofFormat);
        }

        // Parse leaf hash
        let leaf_hash = hex::decode(&proof.leaf_hash)
            .map_err(|_| MerkleError::InvalidProofFormat)?;
        
        if leaf_hash.len() != 32 {
            return Err(MerkleError::InvalidProofFormat);
        }

        // Verify proof
        let computed_root = self.compute_merkle_root(&leaf_hash, &proof.proof, proof.index)?;
        
        Ok(computed_root == root_hash)
    }

    /// Get batch by ID
    pub fn get_batch(&self, batch_id: u64) -> Option<&BatchedEvents> {
        self.event_history.get(&batch_id)
    }

    /// Get all batches
    pub fn get_all_batches(&self) -> Vec<&BatchedEvents> {
        self.event_history.values().collect()
    }

    /// Get current batch size
    pub fn get_current_batch_size(&self) -> usize {
        self.current_batch.len()
    }

    /// Force finalize current batch even if not full
    pub fn force_finalize_batch(&mut self) -> Result<BatchedEvents, MerkleError> {
        if self.current_batch.is_empty() {
            return Err(MerkleError::InvalidLeafData);
        }
        self.finalize_batch()
    }

    /// Validate bridge event
    fn validate_event(&self, event: &BridgeEvent) -> Result<(), MerkleError> {
        if event.amount == 0 {
            return Err(MerkleError::InvalidLeafData);
        }

        if event.from_address.is_empty() || event.to_address.is_empty() {
            return Err(MerkleError::InvalidLeafData);
        }

        if event.transaction_hash.is_empty() {
            return Err(MerkleError::InvalidLeafData);
        }

        Ok(())
    }

    /// Hash bridge event
    fn hash_event(&self, event: &BridgeEvent) -> Result<String, MerkleError> {
        let event_data = format!(
            "{}{}{}{}{}{}{}{}",
            event.event_type,
            event.token_id,
            event.from_address,
            event.to_address,
            event.amount,
            event.nonce,
            event.timestamp,
            event.chain_id
        );

        let hash = Keccak256::digest(event_data.as_bytes());
        Ok(hex::encode(hash))
    }

    /// Build Merkle tree from leaf hashes
    fn build_merkle_tree(&self, leaves: &[String]) -> Result<MerkleTree, MerkleError> {
        if leaves.is_empty() {
            return Err(MerkleError::InvalidTreeStructure);
        }

        let mut levels = Vec::new();
        levels.push(leaves.to_vec());

        let mut current_level = leaves.to_vec();
        let mut depth = 0;

        while current_level.len() > 1 {
            let mut next_level = Vec::new();

            for i in (0..current_level.len()).step_by(2) {
                if i + 1 < current_level.len() {
                    // Hash two nodes
                    let hash1 = hex::decode(&current_level[i])
                        .map_err(|_| MerkleError::HashError)?;
                    let hash2 = hex::decode(&current_level[i + 1])
                        .map_err(|_| MerkleError::HashError)?;
                    
                    let combined_hash = self.hash_pair(&hash1, &hash2);
                    next_level.push(combined_hash);
                } else {
                    // Odd number of nodes, duplicate the last one
                    next_level.push(current_level[i].clone());
                }
            }

            levels.push(next_level.clone());
            current_level = next_level;
            depth += 1;
        }

        let root = current_level.first()
            .ok_or(MerkleError::InvalidTreeStructure)?
            .clone();

        Ok(MerkleTree {
            root,
            leaves: leaves.to_vec(),
            levels,
            depth,
        })
    }

    /// Generate Merkle proof for a leaf
    fn generate_merkle_proof(
        &self,
        leaf_hash: &str,
        leaf_index: usize,
        expected_root: &str,
    ) -> Result<Vec<String>, MerkleError> {
        // Rebuild tree to generate proof
        let leaf_hashes = vec![leaf_hash.to_string()];
        let tree = self.build_merkle_tree(&leaf_hashes)?;

        // Generate proof path
        let mut proof = Vec::new();
        let mut current_index = leaf_index;
        let mut level_size = 1; // Start with leaves

        for level in &tree.levels[1..] {
            let sibling_index = if current_index % 2 == 0 {
                current_index + 1
            } else {
                current_index - 1
            };

            if sibling_index < level.len() {
                proof.push(level[sibling_index].clone());
            }

            current_index /= 2;
            level_size = (level_size + 1) / 2;
        }

        Ok(proof)
    }

    /// Compute Merkle root from proof
    fn compute_merkle_root(
        &self,
        leaf_hash: &[u8],
        proof: &[String],
        index: u64,
    ) -> Result<Vec<u8>, MerkleError> {
        let mut computed_hash = leaf_hash.to_vec();
        let mut current_index = index;

        for proof_hash_str in proof {
            let proof_hash = hex::decode(proof_hash_str)
                .map_err(|_| MerkleError::InvalidProofFormat)?;

            if proof_hash.len() != 32 {
                return Err(MerkleError::InvalidProofFormat);
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
    fn hash_pair(&self, a: &[u8], b: &[u8]) -> String {
        let mut hasher = Keccak256::new();
        hasher.update(a);
        hasher.update(b);
        let result = hasher.finalize();
        hex::encode(result)
    }

    /// Get statistics
    pub fn get_statistics(&self) -> serde_json::Value {
        serde_json::json!({
            "total_batches": self.batch_counter,
            "current_batch_size": self.current_batch.len(),
            "batch_size_limit": self.batch_size,
            "total_events_processed": self.event_history.values().map(|b| b.event_count).sum::<usize>(),
            "total_amount_processed": self.event_history.values().map(|b| b.total_amount).sum::<u64>(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_proof_generator() {
        let mut generator = MerkleProofGenerator::new(3);

        // Add events
        let event1 = BridgeEvent {
            event_type: "lock".to_string(),
            token_id: "KALD".to_string(),
            from_address: "0x123".to_string(),
            to_address: "kaldrix1".to_string(),
            amount: 100,
            nonce: 1,
            timestamp: 1640995200,
            chain_id: 1,
            transaction_hash: "0xabc".to_string(),
        };

        let event2 = BridgeEvent {
            event_type: "unlock".to_string(),
            token_id: "ETH".to_string(),
            from_address: "kaldrix1".to_string(),
            to_address: "0x456".to_string(),
            amount: 50,
            nonce: 2,
            timestamp: 1640995201,
            chain_id: 1,
            transaction_hash: "0xdef".to_string(),
        };

        generator.add_event(event1.clone()).unwrap();
        generator.add_event(event2.clone()).unwrap();

        // Finalize batch
        let batch = generator.force_finalize_batch().unwrap();
        assert_eq!(batch.event_count, 2);
        assert_eq!(batch.total_amount, 150);

        // Generate proof
        let proof = generator.generate_proof(batch.batch_id, 0).unwrap();
        assert_eq!(proof.index, 0);

        // Verify proof
        let is_valid = generator.verify_proof(&proof).unwrap();
        assert!(is_valid);
    }

    #[test]
    fn test_merkle_tree_building() {
        let generator = MerkleProofGenerator::new(4);

        let leaves = vec![
            "leaf1".to_string(),
            "leaf2".to_string(),
            "leaf3".to_string(),
            "leaf4".to_string(),
        ];

        let tree = generator.build_merkle_tree(&leaves).unwrap();
        assert!(!tree.root.is_empty());
        assert_eq!(tree.depth, 2);
        assert_eq!(tree.leaves.len(), 4);
    }
}