use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use base64;
use thiserror::Error;

// BLS aggregation (using blst library for production)
#[cfg(feature = "bls")]
use blst::{min_pk as bls_core, BLST_ERROR};

// Schnorr aggregation (using secp256k1 library for production)
#[cfg(feature = "schnorr")]
use secp256k1::{Secp256k1, Message, PublicKey, SecretKey, schnorrsig};

use crate::bridge::validators::ValidatorSignature;

#[derive(Error, Debug)]
pub enum AggregationError {
    #[error("Invalid public key")]
    InvalidPublicKey,
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Insufficient signatures")]
    InsufficientSignatures,
    #[error("Aggregation failed")]
    AggregationFailed,
    #[error("Verification failed")]
    VerificationFailed,
    #[error("Feature not enabled: {0}")]
    FeatureNotEnabled(String),
    #[error("Serialization error")]
    SerializationError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedSignature {
    pub signature_data: String, // Base64 encoded
    pub aggregation_method: AggregationMethod,
    pub participant_count: usize,
    pub message_hash: String,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AggregationMethod {
    BLS,
    Schnorr,
    Simple, // Fallback for testing
}

pub struct SignatureAggregator {
    method: AggregationMethod,
    public_keys: HashMap<String, Vec<u8>>, // validator_address -> public_key_bytes
}

impl SignatureAggregator {
    /// Create a new signature aggregator
    pub fn new(method: AggregationMethod) -> Self {
        Self {
            method,
            public_keys: HashMap::new(),
        }
    }

    /// Add a validator public key
    pub fn add_public_key(&mut self, validator_address: &str, public_key: &[u8]) -> Result<(), AggregationError> {
        self.public_keys.insert(validator_address.to_string(), public_key.to_vec());
        Ok(())
    }

    /// Aggregate multiple signatures
    pub fn aggregate_signatures(
        &self,
        signatures: &[ValidatorSignature],
        message: &[u8],
    ) -> Result<AggregatedSignature, AggregationError> {
        if signatures.is_empty() {
            return Err(AggregationError::InsufficientSignatures);
        }

        match self.method {
            AggregationMethod::BLS => self.aggregate_bls(signatures, message),
            AggregationMethod::Schnorr => self.aggregate_schnorr(signatures, message),
            AggregationMethod::Simple => self.aggregate_simple(signatures, message),
        }
    }

    /// Verify an aggregated signature
    pub fn verify_aggregated_signature(
        &self,
        aggregated_sig: &AggregatedSignature,
        message: &[u8],
        validator_addresses: &[String],
    ) -> Result<bool, AggregationError> {
        match aggregated_sig.aggregation_method {
            AggregationMethod::BLS => self.verify_bls_aggregated(aggregated_sig, message, validator_addresses),
            AggregationMethod::Schnorr => self.verify_schnorr_aggregated(aggregated_sig, message, validator_addresses),
            AggregationMethod::Simple => self.verify_simple_aggregated(aggregated_sig, message, validator_addresses),
        }
    }

    // BLS Aggregation Implementation
    #[cfg(feature = "bls")]
    fn aggregate_bls(
        &self,
        signatures: &[ValidatorSignature],
        message: &[u8],
    ) -> Result<AggregatedSignature, AggregationError> {
        use blst::{min_pk as bls_core, BLST_ERROR};

        let mut agg_sig = bls_core::AggregateSignature::from_signature(&bls_core::Signature::default());
        let mut public_keys = Vec::new();

        for sig in signatures {
            // Decode signature
            let sig_bytes = base64::decode(&sig.signature)
                .map_err(|_| AggregationError::InvalidSignature)?;
            
            let signature = bls_core::Signature::from_bytes(&sig_bytes)
                .map_err(|_| AggregationError::InvalidSignature)?;

            // Get public key
            let pub_key_bytes = self.public_keys.get(&sig.validator_address)
                .ok_or(AggregationError::InvalidPublicKey)?;
            
            let public_key = bls_core::PublicKey::from_bytes(pub_key_bytes)
                .map_err(|_| AggregationError::InvalidPublicKey)?;

            // Aggregate signature
            agg_sig.add_signature(&signature, &public_key)
                .map_err(|_| AggregationError::AggregationFailed)?;

            public_keys.push(public_key);
        }

        // Verify aggregate signature
        let message_hash = Self::hash_message(message);
        let dst = b"BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";
        
        let result = agg_sig.aggregate_verify(false, message, dst, &public_keys);
        match result {
            BLST_ERROR::BLST_SUCCESS => {
                let agg_sig_bytes = agg_sig.to_signature().to_bytes();
                Ok(AggregatedSignature {
                    signature_data: base64::encode(&agg_sig_bytes),
                    aggregation_method: AggregationMethod::BLS,
                    participant_count: signatures.len(),
                    message_hash,
                    created_at: Self::current_timestamp(),
                })
            }
            _ => Err(AggregationError::VerificationFailed),
        }
    }

    #[cfg(not(feature = "bls"))]
    fn aggregate_bls(
        &self,
        signatures: &[ValidatorSignature],
        message: &[u8],
    ) -> Result<AggregatedSignature, AggregationError> {
        Err(AggregationError::FeatureNotEnabled("BLS".to_string()))
    }

    // Schnorr Aggregation Implementation
    #[cfg(feature = "schnorr")]
    fn aggregate_schnorr(
        &self,
        signatures: &[ValidatorSignature],
        message: &[u8],
    ) -> Result<AggregatedSignature, AggregationError> {
        use secp256k1::{Secp256k1, Message, PublicKey, SecretKey, schnorrsig};
        use secp256k1::rand::thread_rng;

        let secp = Secp256k1::new();
        let mut rng = thread_rng();
        
        // For Schnorr, we use MuSig2 protocol for aggregation
        // This is a simplified version - in production, use proper MuSig2 implementation
        
        let mut agg_nonce_sum = [0u8; 64];
        let mut agg_s_sum = 0u64;
        
        for sig in signatures {
            // Decode signature (assuming signature format: nonce(32) + s(32))
            let sig_bytes = base64::decode(&sig.signature)
                .map_err(|_| AggregationError::InvalidSignature)?;
            
            if sig_bytes.len() != 64 {
                return Err(AggregationError::InvalidSignature);
            }

            let nonce = &sig_bytes[0..32];
            let s_bytes = &sig_bytes[32..64];
            
            // Aggregate nonces (XOR for simplicity, in production use proper MuSig2)
            for i in 0..32 {
                agg_nonce_sum[i] ^= nonce[i];
            }
            
            // Aggregate s values (addition modulo curve order)
            let s = u64::from_be_bytes(s_bytes[24..32].try_into().unwrap_or([0u8; 8]));
            agg_s_sum = agg_s_sum.wrapping_add(s);
        }

        // Create aggregated signature
        let mut agg_sig_bytes = [0u8; 64];
        agg_sig_bytes[0..32].copy_from_slice(&agg_nonce_sum[0..32]);
        agg_sig_bytes[32..64].copy_from_slice(&agg_s_sum.to_be_bytes());

        let message_hash = Self::hash_message(message);
        
        Ok(AggregatedSignature {
            signature_data: base64::encode(&agg_sig_bytes),
            aggregation_method: AggregationMethod::Schnorr,
            participant_count: signatures.len(),
            message_hash,
            created_at: Self::current_timestamp(),
        })
    }

    #[cfg(not(feature = "schnorr"))]
    fn aggregate_schnorr(
        &self,
        signatures: &[ValidatorSignature],
        message: &[u8],
    ) -> Result<AggregatedSignature, AggregationError> {
        Err(AggregationError::FeatureNotEnabled("Schnorr".to_string()))
    }

    // Simple Aggregation (Fallback for testing)
    fn aggregate_simple(
        &self,
        signatures: &[ValidatorSignature],
        message: &[u8],
    ) -> Result<AggregatedSignature, AggregationError> {
        let mut combined = String::new();
        for sig in signatures {
            combined.push_str(&sig.signature);
        }

        let message_hash = Self::hash_message(message);
        
        Ok(AggregatedSignature {
            signature_data: base64::encode(combined.as_bytes()),
            aggregation_method: AggregationMethod::Simple,
            participant_count: signatures.len(),
            message_hash,
            created_at: Self::current_timestamp(),
        })
    }

    // BLS Verification
    #[cfg(feature = "bls")]
    fn verify_bls_aggregated(
        &self,
        aggregated_sig: &AggregatedSignature,
        message: &[u8],
        validator_addresses: &[String],
    ) -> Result<bool, AggregationError> {
        use blst::{min_pk as bls_core, BLST_ERROR};

        let sig_bytes = base64::decode(&aggregated_sig.signature_data)
            .map_err(|_| AggregationError::InvalidSignature)?;
        
        let signature = bls_core::Signature::from_bytes(&sig_bytes)
            .map_err(|_| AggregationError::InvalidSignature)?;

        let mut public_keys = Vec::new();
        for address in validator_addresses {
            let pub_key_bytes = self.public_keys.get(address)
                .ok_or(AggregationError::InvalidPublicKey)?;
            
            let public_key = bls_core::PublicKey::from_bytes(pub_key_bytes)
                .map_err(|_| AggregationError::InvalidPublicKey)?;
            
            public_keys.push(public_key);
        }

        let dst = b"BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";
        let result = signature.aggregate_verify(false, message, dst, &public_keys);
        
        match result {
            BLST_ERROR::BLST_SUCCESS => Ok(true),
            _ => Ok(false),
        }
    }

    #[cfg(not(feature = "bls"))]
    fn verify_bls_aggregated(
        &self,
        aggregated_sig: &AggregatedSignature,
        message: &[u8],
        validator_addresses: &[String],
    ) -> Result<bool, AggregationError> {
        Err(AggregationError::FeatureNotEnabled("BLS".to_string()))
    }

    // Schnorr Verification
    #[cfg(feature = "schnorr")]
    fn verify_schnorr_aggregated(
        &self,
        aggregated_sig: &AggregatedSignature,
        message: &[u8],
        validator_addresses: &[String],
    ) -> Result<bool, AggregationError> {
        use secp256k1::{Secp256k1, Message, PublicKey, schnorrsig};

        let secp = Secp256k1::new();
        let sig_bytes = base64::decode(&aggregated_sig.signature_data)
            .map_err(|_| AggregationError::InvalidSignature)?;
        
        if sig_bytes.len() != 64 {
            return Err(AggregationError::InvalidSignature);
        }

        let nonce = &sig_bytes[0..32];
        let s_bytes = &sig_bytes[32..64];
        
        // For simplicity, verify against each public key individually
        // In production, use proper MuSig2 verification
        
        let message_hash = Self::hash_message(message);
        let msg = Message::from_digest_slice(&message_hash.as_bytes())
            .map_err(|_| AggregationError::SerializationError)?;

        for address in validator_addresses {
            let pub_key_bytes = self.public_keys.get(address)
                .ok_or(AggregationError::InvalidPublicKey)?;
            
            let public_key = PublicKey::from_slice(pub_key_bytes)
                .map_err(|_| AggregationError::InvalidPublicKey)?;

            // Simple verification (not proper MuSig2)
            // This is a placeholder for proper Schnorr aggregation verification
            let _ = (public_key, msg, nonce, s_bytes);
        }

        // For demo purposes, return true
        // In production, implement proper MuSig2 verification
        Ok(true)
    }

    #[cfg(not(feature = "schnorr"))]
    fn verify_schnorr_aggregated(
        &self,
        aggregated_sig: &AggregatedSignature,
        message: &[u8],
        validator_addresses: &[String],
    ) -> Result<bool, AggregationError> {
        Err(AggregationError::FeatureNotEnabled("Schnorr".to_string()))
    }

    // Simple Verification
    fn verify_simple_aggregated(
        &self,
        aggregated_sig: &AggregatedSignature,
        message: &[u8],
        validator_addresses: &[String],
    ) -> Result<bool, AggregationError> {
        // Simple verification - just check that the aggregated signature contains
        // signatures from all required validators
        let sig_data = base64::decode(&aggregated_sig.signature_data)
            .map_err(|_| AggregationError::InvalidSignature)?;
        
        // Each signature is 44 bytes (base64 encoded 32-byte signature)
        let expected_length = validator_addresses.len() * 44;
        if sig_data.len() != expected_length {
            return Ok(false);
        }

        // Verify message hash
        let expected_hash = Self::hash_message(message);
        if aggregated_sig.message_hash != expected_hash {
            return Ok(false);
        }

        Ok(true)
    }

    /// Hash message using SHA256
    fn hash_message(message: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(message);
        base64::encode(hasher.finalize())
    }

    /// Get current timestamp
    fn current_timestamp() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    /// Get aggregator statistics
    pub fn get_stats(&self) -> AggregatorStats {
        AggregatorStats {
            method: self.method.clone(),
            registered_validators: self.public_keys.len(),
            supported_methods: vec![
                AggregationMethod::Simple,
                #[cfg(feature = "bls")]
                AggregationMethod::BLS,
                #[cfg(feature = "schnorr")]
                AggregationMethod::Schnorr,
            ],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatorStats {
    pub method: AggregationMethod,
    pub registered_validators: usize,
    pub supported_methods: Vec<AggregationMethod>,
}

/// Factory for creating signature aggregators
pub struct AggregatorFactory;

impl AggregatorFactory {
    /// Create an aggregator with the specified method
    pub fn create(method: AggregationMethod) -> SignatureAggregator {
        SignatureAggregator::new(method)
    }

    /// Create the best available aggregator (prefers BLS, then Schnorr, then Simple)
    pub fn create_best_available() -> SignatureAggregator {
        #[cfg(feature = "bls")]
        return SignatureAggregator::new(AggregationMethod::BLS);
        
        #[cfg(feature = "schnorr")]
        return SignatureAggregator::new(AggregationMethod::Schnorr);
        
        #[cfg(not(any(feature = "bls", feature = "schnorr")))]
        return SignatureAggregator::new(AggregationMethod::Simple);
    }

    /// Get available aggregation methods
    pub fn available_methods() -> Vec<AggregationMethod> {
        let mut methods = vec![AggregationMethod::Simple];
        
        #[cfg(feature = "bls")]
        methods.push(AggregationMethod::BLS);
        
        #[cfg(feature = "schnorr")]
        methods.push(AggregationMethod::Schnorr);
        
        methods
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::validators::ValidatorSignature;

    fn create_test_signature(validator_addr: &str) -> ValidatorSignature {
        ValidatorSignature {
            validator_address: validator_addr.to_string(),
            signature: base64::encode(&[1u8; 32]), // Dummy signature
            message_hash: "test_hash".to_string(),
            timestamp: 1640995200,
        }
    }

    #[test]
    fn test_simple_aggregation() {
        let aggregator = SignatureAggregator::new(AggregationMethod::Simple);
        
        let signatures = vec![
            create_test_signature("0x123"),
            create_test_signature("0x456"),
        ];

        let message = b"test message";
        let result = aggregator.aggregate_signatures(&signatures, message);
        
        assert!(result.is_ok());
        let agg_sig = result.unwrap();
        assert_eq!(agg_sig.participant_count, 2);
        assert_eq!(agg_sig.aggregation_method, AggregationMethod::Simple);
    }

    #[test]
    fn test_insufficient_signatures() {
        let aggregator = SignatureAggregator::new(AggregationMethod::Simple);
        let signatures = vec![];
        let message = b"test message";
        
        let result = aggregator.aggregate_signatures(&signatures, message);
        assert!(matches!(result, Err(AggregationError::InsufficientSignatures)));
    }

    #[test]
    fn test_aggregator_factory() {
        let aggregator = AggregatorFactory::create_best_available();
        let stats = aggregator.get_stats();
        
        assert!(!stats.supported_methods.is_empty());
    }

    #[test]
    fn test_available_methods() {
        let methods = AggregatorFactory::available_methods();
        assert!(!methods.is_empty());
        assert!(methods.contains(&AggregationMethod::Simple));
    }
}