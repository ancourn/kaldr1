use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use ed25519_dalek::{PublicKey, Signature, Verifier};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ValidatorError {
    #[error("Validator not found")]
    ValidatorNotFound,
    #[error("Invalid public key")]
    InvalidPublicKey,
    #[error("Insufficient validator quorum")]
    InsufficientQuorum,
    #[error("Validator is slashed")]
    ValidatorSlashed,
    #[error("Validator is inactive")]
    ValidatorInactive,
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Invalid threshold")]
    InvalidThreshold,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Validator {
    pub address: String,
    pub public_key: String, // Base64 encoded public key
    pub stake_amount: u64,
    pub is_active: bool,
    pub is_slashed: bool,
    pub joined_at: u64,
    pub last_seen: u64,
    pub reputation_score: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorSet {
    pub validators: HashMap<String, Validator>, // address -> Validator
    pub threshold: usize, // Minimum validators required for quorum (2/3 by default)
    pub total_stake: u64,
    pub active_validators: usize,
    pub last_updated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorSignature {
    pub validator_address: String,
    pub signature: String, // Base64 encoded signature
    pub message_hash: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultiSignature {
    pub signatures: Vec<ValidatorSignature>,
    pub message_hash: String,
    pub threshold_reached: bool,
    pub aggregated_signature: Option<String>,
}

impl ValidatorSet {
    /// Create a new validator set with default threshold (2/3)
    pub fn new() -> Self {
        Self {
            validators: HashMap::new(),
            threshold: 0, // Will be calculated as 2/3 of total validators
            total_stake: 0,
            active_validators: 0,
            last_updated: Self::current_timestamp(),
        }
    }

    /// Create a new validator set with specific threshold
    pub fn with_threshold(threshold: usize) -> Result<Self, ValidatorError> {
        if threshold == 0 {
            return Err(ValidatorError::InvalidThreshold);
        }
        
        Ok(Self {
            validators: HashMap::new(),
            threshold,
            total_stake: 0,
            active_validators: 0,
            last_updated: Self::current_timestamp(),
        })
    }

    /// Add a new validator to the set
    pub fn add_validator(&mut self, validator: Validator) -> Result<(), ValidatorError> {
        // Validate public key format
        if validator.public_key.len() != 44 { // Base64 encoded Ed25519 public key
            return Err(ValidatorError::InvalidPublicKey);
        }

        let address = validator.address.clone();
        
        // Remove existing validator if any
        if self.validators.contains_key(&address) {
            let existing = self.validators.remove(&address).unwrap();
            self.total_stake -= existing.stake_amount;
            if existing.is_active {
                self.active_validators -= 1;
            }
        }

        // Add new validator
        self.validators.insert(address.clone(), validator.clone());
        self.total_stake += validator.stake_amount;
        if validator.is_active {
            self.active_validators += 1;
        }

        // Update threshold if not explicitly set (2/3 rule)
        if self.threshold == 0 {
            self.threshold = (self.validators.len() * 2 + 2) / 3; // Ceiling of 2/3
        }

        self.last_updated = Self::current_timestamp();
        Ok(())
    }

    /// Remove a validator from the set
    pub fn remove_validator(&mut self, address: &str) -> Result<(), ValidatorError> {
        let validator = self.validators.remove(address)
            .ok_or(ValidatorError::ValidatorNotFound)?;
        
        self.total_stake -= validator.stake_amount;
        if validator.is_active {
            self.active_validators -= 1;
        }

        // Update threshold
        if self.threshold == 0 && !self.validators.is_empty() {
            self.threshold = (self.validators.len() * 2 + 2) / 3;
        }

        self.last_updated = Self::current_timestamp();
        Ok(())
    }

    /// Update validator status (active/inactive)
    pub fn set_validator_status(&mut self, address: &str, is_active: bool) -> Result<(), ValidatorError> {
        let validator = self.validators.get_mut(address)
            .ok_or(ValidatorError::ValidatorNotFound)?;
        
        if validator.is_active != is_active {
            validator.is_active = is_active;
            validator.last_seen = Self::current_timestamp();
            
            if is_active {
                self.active_validators += 1;
            } else {
                self.active_validators -= 1;
            }
            
            self.last_updated = Self::current_timestamp();
        }
        
        Ok(())
    }

    /// Slash a validator (penalty for misbehavior)
    pub fn slash_validator(&mut self, address: &str) -> Result<(), ValidatorError> {
        let validator = self.validators.get_mut(address)
            .ok_or(ValidatorError::ValidatorNotFound)?;
        
        validator.is_slashed = true;
        validator.is_active = false;
        validator.reputation_score = 0;
        
        self.active_validators -= 1;
        self.last_updated = Self::current_timestamp();
        
        Ok(())
    }

    /// Get active validators only
    pub fn get_active_validators(&self) -> Vec<&Validator> {
        self.validators.values()
            .filter(|v| v.is_active && !v.is_slashed)
            .collect()
    }

    /// Check if quorum is reached
    pub fn has_quorum(&self) -> bool {
        self.active_validators >= self.threshold
    }

    /// Get quorum status
    pub fn get_quorum_status(&self) -> (usize, usize, bool) {
        let active = self.active_validators;
        let required = self.threshold;
        let has_quorum = active >= required;
        (active, required, has_quorum)
    }

    /// Verify a single validator signature
    pub fn verify_signature(&self, signature: &ValidatorSignature, message: &[u8]) -> Result<bool, ValidatorError> {
        let validator = self.validators.get(&signature.validator_address)
            .ok_or(ValidatorError::ValidatorNotFound)?;
        
        if !validator.is_active {
            return Err(ValidatorError::ValidatorInactive);
        }
        
        if validator.is_slashed {
            return Err(ValidatorError::ValidatorSlashed);
        }

        // Decode public key and signature
        let public_key_bytes = base64::decode(&validator.public_key)
            .map_err(|_| ValidatorError::InvalidPublicKey)?;
        
        let signature_bytes = base64::decode(&signature.signature)
            .map_err(|_| ValidatorError::InvalidSignature)?;
        
        let public_key = PublicKey::from_bytes(&public_key_bytes)
            .map_err(|_| ValidatorError::InvalidPublicKey)?;
        
        let signature = Signature::from_bytes(&signature_bytes)
            .map_err(|_| ValidatorError::InvalidSignature)?;
        
        // Verify signature
        public_key.verify(message, &signature)
            .map_err(|_| ValidatorError::InvalidSignature)
    }

    /// Collect and verify multiple signatures for a message
    pub fn collect_signatures(&self, signatures: Vec<ValidatorSignature>, message: &[u8]) -> Result<MultiSignature, ValidatorError> {
        let mut valid_signatures = Vec::new();
        let message_hash = Self::hash_message(message);
        
        for sig in signatures {
            match self.verify_signature(&sig, message) {
                Ok(true) => {
                    // Verify message hash matches
                    if sig.message_hash == message_hash {
                        valid_signatures.push(sig);
                    }
                }
                Ok(false) => continue, // Invalid signature, skip
                Err(e) => return Err(e),
            }
        }

        let threshold_reached = valid_signatures.len() >= self.threshold;
        
        // Simple aggregation (in production, use BLS or Schnorr for proper aggregation)
        let aggregated_signature = if threshold_reached && !valid_signatures.is_empty() {
            Some(Self::simple_aggregate_signatures(&valid_signatures))
        } else {
            None
        };

        Ok(MultiSignature {
            signatures: valid_signatures,
            message_hash,
            threshold_reached,
            aggregated_signature,
        })
    }

    /// Simple signature aggregation (concatenation for demo)
    /// In production, use BLS or Schnorr signature aggregation
    fn simple_aggregate_signatures(signatures: &[ValidatorSignature]) -> String {
        let mut combined = String::new();
        for sig in signatures {
            combined.push_str(&sig.signature);
        }
        base64::encode(combined.as_bytes())
    }

    /// Hash a message using SHA256
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

    /// Get validator statistics
    pub fn get_stats(&self) -> ValidatorStats {
        let total_validators = self.validators.len();
        let slashed_validators = self.validators.values().filter(|v| v.is_slashed).count();
        let inactive_validators = self.validators.values().filter(|v| !v.is_active && !v.is_slashed).count();
        
        ValidatorStats {
            total_validators,
            active_validators: self.active_validators,
            slashed_validators,
            inactive_validators,
            threshold: self.threshold,
            total_stake: self.total_stake,
            has_quorum: self.has_quorum(),
            last_updated: self.last_updated,
        }
    }

    /// Update validator last seen timestamp
    pub fn update_validator_heartbeat(&mut self, address: &str) -> Result<(), ValidatorError> {
        let validator = self.validators.get_mut(address)
            .ok_or(ValidatorError::ValidatorNotFound)?;
        
        validator.last_seen = Self::current_timestamp();
        self.last_updated = Self::current_timestamp();
        
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorStats {
    pub total_validators: usize,
    pub active_validators: usize,
    pub slashed_validators: usize,
    pub inactive_validators: usize,
    pub threshold: usize,
    pub total_stake: u64,
    pub has_quorum: bool,
    pub last_updated: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_validator(address: &str, stake: u64) -> Validator {
        Validator {
            address: address.to_string(),
            public_key: "test_public_key_base64_encoded_32bytes".to_string(),
            stake_amount: stake,
            is_active: true,
            is_slashed: false,
            joined_at: 1640995200, // 2022-01-01
            last_seen: 1640995200,
            reputation_score: 100,
        }
    }

    #[test]
    fn test_validator_set_creation() {
        let validator_set = ValidatorSet::new();
        assert_eq!(validator_set.validators.len(), 0);
        assert_eq!(validator_set.threshold, 0);
        assert_eq!(validator_set.total_stake, 0);
        assert_eq!(validator_set.active_validators, 0);
    }

    #[test]
    fn test_add_validator() {
        let mut validator_set = ValidatorSet::new();
        let validator = create_test_validator("0x123", 1000);
        
        assert!(validator_set.add_validator(validator).is_ok());
        assert_eq!(validator_set.validators.len(), 1);
        assert_eq!(validator_set.total_stake, 1000);
        assert_eq!(validator_set.active_validators, 1);
        assert_eq!(validator_set.threshold, 1); // 2/3 of 1 = 1
    }

    #[test]
    fn test_quorum_calculation() {
        let mut validator_set = ValidatorSet::new();
        
        // Add 3 validators
        for i in 0..3 {
            let validator = create_test_validator(&format!("0x{}", i), 1000);
            validator_set.add_validator(validator).unwrap();
        }
        
        // Threshold should be 2 (2/3 of 3)
        assert_eq!(validator_set.threshold, 2);
        assert!(validator_set.has_quorum());
        
        // Deactivate one validator
        validator_set.set_validator_status("0x0", false).unwrap();
        assert_eq!(validator_set.active_validators, 2);
        assert!(validator_set.has_quorum());
        
        // Deactivate another validator
        validator_set.set_validator_status("0x1", false).unwrap();
        assert_eq!(validator_set.active_validators, 1);
        assert!(!validator_set.has_quorum());
    }

    #[test]
    fn test_validator_slashing() {
        let mut validator_set = ValidatorSet::new();
        let validator = create_test_validator("0x123", 1000);
        
        validator_set.add_validator(validator).unwrap();
        assert_eq!(validator_set.active_validators, 1);
        
        validator_set.slash_validator("0x123").unwrap();
        assert_eq!(validator_set.active_validators, 0);
        
        let validator = validator_set.validators.get("0x123").unwrap();
        assert!(validator.is_slashed);
        assert!(!validator.is_active);
        assert_eq!(validator.reputation_score, 0);
    }
}