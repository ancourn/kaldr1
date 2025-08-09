use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use ed25519_dalek::{PublicKey, Signature, Verifier};
use base64;
use crate::bridge::validators::{ValidatorSet, ValidatorSignature, MultiSignature, ValidatorError};

#[derive(Error, Debug)]
pub enum MultisigError {
    #[error("Validator error: {0}")]
    ValidatorError(#[from] ValidatorError),
    #[error("Proof not found")]
    ProofNotFound,
    #[error("Proof expired")]
    ProofExpired,
    #[error("Invalid proof format")]
    InvalidProofFormat,
    #[error("Signature aggregation failed")]
    SignatureAggregationFailed,
    #[error("Insufficient signatures")]
    InsufficientSignatures,
    #[error("Duplicate signature")]
    DuplicateSignature,
    #[error("Proof already verified")]
    ProofAlreadyVerified,
    #[error("Invalid message hash")]
    InvalidMessageHash,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeProof {
    pub proof_id: String,
    pub transaction_hash: String,
    pub source_chain: String,
    pub target_chain: String,
    pub token_address: String,
    pub amount: String,
    pub recipient: String,
    pub block_number: u64,
    pub timestamp: u64,
    pub message_hash: String,
    pub status: ProofStatus,
    pub signatures: Vec<ValidatorSignature>,
    pub aggregated_signature: Option<String>,
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultisigConfig {
    pub signature_timeout: u64, // Timeout in seconds for signature collection
    pub max_signatures_per_proof: usize,
    pub enable_aggregation: bool,
    pub aggregation_method: AggregationMethod,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AggregationMethod {
    Simple, // Base64 concatenation (for demo)
    BLS,    // BLS signature aggregation
    Schnorr, // Schnorr signature aggregation
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureCollection {
    pub proof_id: String,
    pub required_signatures: usize,
    pub collected_signatures: usize,
    pub deadline: u64,
    pub validator_addresses: Vec<String>,
    pub is_complete: bool,
}

pub struct MultisigService {
    validator_set: ValidatorSet,
    proofs: HashMap<String, BridgeProof>,
    config: MultisigConfig,
}

impl MultisigService {
    /// Create a new multisig service
    pub fn new(validator_set: ValidatorSet) -> Self {
        let config = MultisigConfig {
            signature_timeout: 300, // 5 minutes
            max_signatures_per_proof: 100,
            enable_aggregation: true,
            aggregation_method: AggregationMethod::Simple,
        };

        Self {
            validator_set,
            proofs: HashMap::new(),
            config,
        }
    }

    /// Create a new bridge proof for multisig collection
    pub fn create_proof(
        &mut self,
        transaction_hash: String,
        source_chain: String,
        target_chain: String,
        token_address: String,
        amount: String,
        recipient: String,
        block_number: u64,
    ) -> Result<String, MultisigError> {
        let proof_id = self.generate_proof_id();
        let timestamp = Self::current_timestamp();
        let expires_at = timestamp + self.config.signature_timeout;

        // Create message for signing
        let message = self.create_bridge_message(
            &transaction_hash,
            &source_chain,
            &target_chain,
            &token_address,
            &amount,
            &recipient,
            block_number,
        );

        let message_hash = Self::hash_message(&message);

        let proof = BridgeProof {
            proof_id: proof_id.clone(),
            transaction_hash,
            source_chain,
            target_chain,
            token_address,
            amount,
            recipient,
            block_number,
            timestamp,
            message_hash,
            status: ProofStatus::Pending,
            signatures: Vec::new(),
            aggregated_signature: None,
            created_at: timestamp,
            expires_at,
        };

        self.proofs.insert(proof_id.clone(), proof);
        Ok(proof_id)
    }

    /// Start collecting signatures for a proof
    pub fn start_signature_collection(&mut self, proof_id: &str) -> Result<SignatureCollection, MultisigError> {
        let proof = self.proofs.get_mut(proof_id)
            .ok_or(MultisigError::ProofNotFound)?;

        if proof.status != ProofStatus::Pending {
            return Err(MultisigError::ProofAlreadyVerified);
        }

        proof.status = ProofStatus::Collecting;

        let active_validators = self.validator_set.get_active_validators();
        let validator_addresses: Vec<String> = active_validators
            .iter()
            .map(|v| v.address.clone())
            .collect();

        let collection = SignatureCollection {
            proof_id: proof_id.to_string(),
            required_signatures: self.validator_set.threshold,
            collected_signatures: 0,
            deadline: proof.expires_at,
            validator_addresses,
            is_complete: false,
        };

        Ok(collection)
    }

    /// Submit a validator signature for a proof
    pub fn submit_signature(
        &mut self,
        proof_id: &str,
        validator_signature: ValidatorSignature,
    ) -> Result<(), MultisigError> {
        let proof = self.proofs.get_mut(proof_id)
            .ok_or(MultisigError::ProofNotFound)?;

        // Check proof status
        if proof.status != ProofStatus::Collecting {
            return Err(MultisigError::ProofAlreadyVerified);
        }

        // Check if proof is expired
        if Self::current_timestamp() > proof.expires_at {
            proof.status = ProofStatus::Expired;
            return Err(MultisigError::ProofExpired);
        }

        // Check for duplicate signature
        if proof.signatures.iter().any(|s| s.validator_address == validator_signature.validator_address) {
            return Err(MultisigError::DuplicateSignature);
        }

        // Verify the signature
        let message = self.create_bridge_message(
            &proof.transaction_hash,
            &proof.source_chain,
            &proof.target_chain,
            &proof.token_address,
            &proof.amount,
            &proof.recipient,
            proof.block_number,
        );

        match self.validator_set.verify_signature(&validator_signature, &message) {
            Ok(true) => {
                // Verify message hash matches
                if validator_signature.message_hash != proof.message_hash {
                    return Err(MultisigError::InvalidMessageHash);
                }

                proof.signatures.push(validator_signature);

                // Check if we have enough signatures
                if proof.signatures.len() >= self.validator_set.threshold {
                    self.finalize_proof(proof_id)?;
                }

                Ok(())
            }
            Ok(false) => Err(MultisigError::ValidatorError(ValidatorError::InvalidSignature)),
            Err(e) => Err(MultisigError::ValidatorError(e)),
        }
    }

    /// Finalize a proof by aggregating signatures
    fn finalize_proof(&mut self, proof_id: &str) -> Result<(), MultisigError> {
        let proof = self.proofs.get_mut(proof_id)
            .ok_or(MultisigError::ProofNotFound)?;

        proof.status = ProofStatus::Verifying;

        // Aggregate signatures
        if self.config.enable_aggregation {
            let aggregated = self.aggregate_signatures(&proof.signatures, &proof.message_hash)?;
            proof.aggregated_signature = Some(aggregated);
        }

        proof.status = ProofStatus::Verified;
        Ok(())
    }

    /// Aggregate multiple signatures into one
    fn aggregate_signatures(
        &self,
        signatures: &[ValidatorSignature],
        message_hash: &str,
    ) -> Result<String, MultisigError> {
        match self.config.aggregation_method {
            AggregationMethod::Simple => self.simple_aggregation(signatures),
            AggregationMethod::BLS => self.bls_aggregation(signatures, message_hash),
            AggregationMethod::Schnorr => self.schnorr_aggregation(signatures, message_hash),
        }
    }

    /// Simple aggregation (base64 concatenation for demo)
    fn simple_aggregation(&self, signatures: &[ValidatorSignature]) -> Result<String, MultisigError> {
        if signatures.is_empty() {
            return Err(MultisigError::InsufficientSignatures);
        }

        let mut combined = String::new();
        for sig in signatures {
            combined.push_str(&sig.signature);
        }
        Ok(base64::encode(combined.as_bytes()))
    }

    /// BLS signature aggregation (placeholder for actual BLS implementation)
    fn bls_aggregation(&self, signatures: &[ValidatorSignature], message_hash: &str) -> Result<String, MultisigError> {
        // In production, implement actual BLS signature aggregation
        // For now, use simple aggregation as fallback
        self.simple_aggregation(signatures)
    }

    /// Schnorr signature aggregation (placeholder for actual Schnorr implementation)
    fn schnorr_aggregation(&self, signatures: &[ValidatorSignature], message_hash: &str) -> Result<String, MultisigError> {
        // In production, implement actual Schnorr signature aggregation
        // For now, use simple aggregation as fallback
        self.simple_aggregation(signatures)
    }

    /// Verify a multisig proof
    pub fn verify_proof(&self, proof_id: &str) -> Result<bool, MultisigError> {
        let proof = self.proofs.get(proof_id)
            .ok_or(MultisigError::ProofNotFound)?;

        if proof.status != ProofStatus::Verified {
            return Ok(false);
        }

        // Verify all signatures
        let message = self.create_bridge_message(
            &proof.transaction_hash,
            &proof.source_chain,
            &proof.target_chain,
            &proof.token_address,
            &proof.amount,
            &proof.recipient,
            proof.block_number,
        );

        let mut valid_signatures = 0;
        for sig in &proof.signatures {
            match self.validator_set.verify_signature(sig, &message) {
                Ok(true) => valid_signatures += 1,
                _ => continue,
            }
        }

        Ok(valid_signatures >= self.validator_set.threshold)
    }

    /// Get proof status
    pub fn get_proof_status(&self, proof_id: &str) -> Result<ProofStatus, MultisigError> {
        let proof = self.proofs.get(proof_id)
            .ok_or(MultisigError::ProofNotFound)?;
        Ok(proof.status.clone())
    }

    /// Get proof details
    pub fn get_proof(&self, proof_id: &str) -> Result<&BridgeProof, MultisigError> {
        self.proofs.get(proof_id)
            .ok_or(MultisigError::ProofNotFound)
    }

    /// List all proofs
    pub fn list_proofs(&self) -> Vec<&BridgeProof> {
        self.proofs.values().collect()
    }

    /// Clean up expired proofs
    pub fn cleanup_expired_proofs(&mut self) -> usize {
        let current_time = Self::current_timestamp();
        let expired: Vec<String> = self.proofs
            .iter()
            .filter(|(_, proof)| 
                proof.expires_at < current_time && 
                proof.status != ProofStatus::Verified
            )
            .map(|(id, _)| id.clone())
            .collect();

        let count = expired.len();
        for id in expired {
            self.proofs.remove(&id);
        }

        count
    }

    /// Get collection status for a proof
    pub fn get_collection_status(&self, proof_id: &str) -> Result<SignatureCollection, MultisigError> {
        let proof = self.proofs.get(proof_id)
            .ok_or(MultisigError::ProofNotFound)?;

        let active_validators = self.validator_set.get_active_validators();
        let validator_addresses: Vec<String> = active_validators
            .iter()
            .map(|v| v.address.clone())
            .collect();

        Ok(SignatureCollection {
            proof_id: proof_id.to_string(),
            required_signatures: self.validator_set.threshold,
            collected_signatures: proof.signatures.len(),
            deadline: proof.expires_at,
            validator_addresses,
            is_complete: proof.status == ProofStatus::Verified,
        })
    }

    /// Create bridge message for signing
    fn create_bridge_message(
        &self,
        transaction_hash: &str,
        source_chain: &str,
        target_chain: &str,
        token_address: &str,
        amount: &str,
        recipient: &str,
        block_number: u64,
    ) -> Vec<u8> {
        let message = format!(
            "KALDRIX_BRIDGE:{}:{}:{}:{}:{}:{}:{}",
            transaction_hash, source_chain, target_chain, token_address, amount, recipient, block_number
        );
        message.into_bytes()
    }

    /// Generate unique proof ID
    fn generate_proof_id(&self) -> String {
        let timestamp = Self::current_timestamp();
        let random = (rand::random::<u64>() % 1000000).to_string();
        format!("proof_{}_{}", timestamp, random)
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

    /// Get multisig service statistics
    pub fn get_stats(&self) -> MultisigStats {
        let total_proofs = self.proofs.len();
        let pending_proofs = self.proofs.values().filter(|p| p.status == ProofStatus::Pending).count();
        let collecting_proofs = self.proofs.values().filter(|p| p.status == ProofStatus::Collecting).count();
        let verifying_proofs = self.proofs.values().filter(|p| p.status == ProofStatus::Verifying).count();
        let verified_proofs = self.proofs.values().filter(|p| p.status == ProofStatus::Verified).count();
        let failed_proofs = self.proofs.values().filter(|p| p.status == ProofStatus::Failed).count();
        let expired_proofs = self.proofs.values().filter(|p| p.status == ProofStatus::Expired).count();

        MultisigStats {
            total_proofs,
            pending_proofs,
            collecting_proofs,
            verifying_proofs,
            verified_proofs,
            failed_proofs,
            expired_proofs,
            validator_threshold: self.validator_set.threshold,
            active_validators: self.validator_set.active_validators,
            signature_timeout: self.config.signature_timeout,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultisigStats {
    pub total_proofs: usize,
    pub pending_proofs: usize,
    pub collecting_proofs: usize,
    pub verifying_proofs: usize,
    pub verified_proofs: usize,
    pub failed_proofs: usize,
    pub expired_proofs: usize,
    pub validator_threshold: usize,
    pub active_validators: usize,
    pub signature_timeout: u64,
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
    fn test_multisig_service_creation() {
        let validator_set = ValidatorSet::new();
        let service = MultisigService::new(validator_set);
        assert_eq!(service.proofs.len(), 0);
    }

    #[test]
    fn test_proof_creation() {
        let mut validator_set = ValidatorSet::new();
        let validator = create_test_validator("0x123");
        validator_set.add_validator(validator).unwrap();
        
        let mut service = MultisigService::new(validator_set);
        let proof_id = service.create_proof(
            "0xtxhash".to_string(),
            "ethereum".to_string(),
            "kaldrix".to_string(),
            "0xtoken".to_string(),
            "100".to_string(),
            "0xrecipient".to_string(),
            12345,
        ).unwrap();

        assert!(!proof_id.is_empty());
        assert_eq!(service.proofs.len(), 1);
    }

    #[test]
    fn test_signature_collection() {
        let mut validator_set = ValidatorSet::new();
        let validator = create_test_validator("0x123");
        validator_set.add_validator(validator).unwrap();
        
        let mut service = MultisigService::new(validator_set);
        let proof_id = service.create_proof(
            "0xtxhash".to_string(),
            "ethereum".to_string(),
            "kaldrix".to_string(),
            "0xtoken".to_string(),
            "100".to_string(),
            "0xrecipient".to_string(),
            12345,
        ).unwrap();

        let collection = service.start_signature_collection(&proof_id).unwrap();
        assert_eq!(collection.required_signatures, 1);
        assert_eq!(collection.collected_signatures, 0);
        assert!(!collection.is_complete);
    }
}