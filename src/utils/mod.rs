//! Utility functions for the blockchain

use crate::BlockchainError;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// Cryptographic utilities
pub mod crypto {
    use super::*;
    use sha3::{Digest, Sha3_256};

    /// Generate a random byte array
    pub fn generate_random_bytes(length: usize) -> Vec<u8> {
        use rand::RngCore;
        let mut bytes = vec![0u8; length];
        rand::thread_rng().fill_bytes(&mut bytes);
        bytes
    }

    /// Compute SHA3-256 hash
    pub fn sha3_256(data: &[u8]) -> Vec<u8> {
        let mut hasher = Sha3_256::new();
        hasher.update(data);
        hasher.finalize().to_vec()
    }

    /// Verify a hash
    pub fn verify_hash(data: &[u8], expected_hash: &[u8]) -> bool {
        let computed_hash = sha3_256(data);
        computed_hash == expected_hash
    }

    /// Generate a key pair (simplified for prototype)
    pub fn generate_key_pair() -> (Vec<u8>, Vec<u8>) {
        let private_key = generate_random_bytes(32);
        let public_key = sha3_256(&private_key);
        (private_key, public_key)
    }
}

/// Time utilities
pub mod time {
    use super::*;

    /// Get current timestamp in seconds
    pub fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    /// Get current timestamp in milliseconds
    pub fn current_timestamp_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    }

    /// Format timestamp as human-readable string
    pub fn format_timestamp(timestamp: u64) -> String {
        let datetime = chrono::DateTime::from_timestamp(timestamp as i64, 0);
        datetime
            .map(|dt| dt.format("%Y-%m-%d %H:%M:%S UTC").to_string())
            .unwrap_or_else(|| "Invalid timestamp".to_string())
    }
}

/// Serialization utilities
pub mod serialization {
    use super::*;

    /// Serialize to JSON
    pub fn to_json<T: Serialize>(value: &T) -> Result<String, BlockchainError> {
        serde_json::to_string_pretty(value)
            .map_err(|e| BlockchainError::Serialization(e.into()))
    }

    /// Deserialize from JSON
    pub fn from_json<T: Deserialize<'static>>(json: &str) -> Result<T, BlockchainError> {
        serde_json::from_str(json)
            .map_err(|e| BlockchainError::Serialization(e.into()))
    }

    /// Serialize to binary
    pub fn to_binary<T: Serialize>(value: &T) -> Result<Vec<u8>, BlockchainError> {
        bincode::serialize(value)
            .map_err(|e| BlockchainError::Serialization(e.into()))
    }

    /// Deserialize from binary
    pub fn from_binary<T: Deserialize<'static>>(data: &[u8]) -> Result<T, BlockchainError> {
        bincode::deserialize(data)
            .map_err(|e| BlockchainError::Serialization(e.into()))
    }
}

/// Validation utilities
pub mod validation {
    use super::*;

    /// Validate a public key
    pub fn validate_public_key(public_key: &[u8]) -> Result<(), BlockchainError> {
        if public_key.len() != 32 {
            return Err(BlockchainError::Validation("Public key must be 32 bytes".to_string()));
        }

        // Check if it's not all zeros
        if public_key.iter().all(|&b| b == 0) {
            return Err(BlockchainError::Validation("Public key cannot be all zeros".to_string()));
        }

        Ok(())
    }

    /// Validate a signature
    pub fn validate_signature(signature: &[u8]) -> Result<(), BlockchainError> {
        if signature.len() < 64 {
            return Err(BlockchainError::Validation("Signature must be at least 64 bytes".to_string()));
        }

        // Check for sufficient entropy
        let mut frequency = [0u32; 256];
        for &byte in signature {
            frequency[byte as usize] += 1;
        }

        let mut entropy = 0.0;
        let len = signature.len() as f64;
        for count in frequency {
            if count > 0 {
                let probability = count as f64 / len;
                entropy -= probability * probability.log2();
            }
        }

        if entropy < 3.0 {
            return Err(BlockchainError::Validation("Signature has insufficient entropy".to_string()));
        }

        Ok(())
    }

    /// Validate an amount
    pub fn validate_amount(amount: u64) -> Result<(), BlockchainError> {
        if amount == 0 {
            return Err(BlockchainError::Validation("Amount cannot be zero".to_string()));
        }

        // Check for reasonable maximum (prevent overflow)
        if amount > u64::MAX / 1000 {
            return Err(BlockchainError::Validation("Amount too large".to_string()));
        }

        Ok(())
    }

    /// Validate a timestamp
    pub fn validate_timestamp(timestamp: u64) -> Result<(), BlockchainError> {
        let current_time = time::current_timestamp();

        // Check if timestamp is in the future (more than 5 minutes)
        if timestamp > current_time + 300 {
            return Err(BlockchainError::Validation("Timestamp is too far in the future".to_string()));
        }

        // Check if timestamp is too far in the past (more than 1 day)
        if timestamp < current_time.saturating_sub(86400) {
            return Err(BlockchainError::Validation("Timestamp is too far in the past".to_string()));
        }

        Ok(())
    }
}

/// Network utilities
pub mod network {
    use super::*;

    /// Parse a multiaddress
    pub fn parse_multiaddr(addr: &str) -> Result<(), BlockchainError> {
        // Simple validation for prototype
        if addr.is_empty() {
            return Err(BlockchainError::Validation("Address cannot be empty".to_string()));
        }

        if !addr.starts_with("/ip4/") && !addr.starts_with("/ip6/") {
            return Err(BlockchainError::Validation("Invalid address format".to_string()));
        }

        Ok(())
    }

    /// Validate a peer ID
    pub fn validate_peer_id(peer_id: &str) -> Result<(), BlockchainError> {
        if peer_id.is_empty() {
            return Err(BlockchainError::Validation("Peer ID cannot be empty".to_string()));
        }

        if peer_id.len() > 255 {
            return Err(BlockchainError::Validation("Peer ID too long".to_string()));
        }

        Ok(())
    }

    /// Generate a random peer ID (for testing)
    pub fn generate_peer_id() -> String {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        format!("Qm{:040x}", rng.gen::<u64>())
    }
}

/// Math utilities
pub mod math {
    use super::*;

    /// Calculate modular exponentiation
    pub fn mod_exp(base: u64, exp: u64, modulus: u64) -> u64 {
        if modulus == 1 {
            return 0;
        }

        let mut result = 1;
        let mut base = base % modulus;
        let mut exp = exp;

        while exp > 0 {
            if exp % 2 == 1 {
                result = (result * base) % modulus;
            }
            exp = exp >> 1;
            base = (base * base) % modulus;
        }

        result
    }

    /// Calculate greatest common divisor
    pub fn gcd(a: u64, b: u64) -> u64 {
        if b == 0 {
            a
        } else {
            gcd(b, a % b)
        }
    }

    /// Check if a number is prime (simple implementation)
    pub fn is_prime(n: u64) -> bool {
        if n <= 1 {
            return false;
        }
        if n <= 3 {
            return true;
        }
        if n % 2 == 0 || n % 3 == 0 {
            return false;
        }

        let mut i = 5;
        while i * i <= n {
            if n % i == 0 || n % (i + 2) == 0 {
                return false;
            }
            i += 6;
        }

        true
    }

    /// Generate a random prime number
    pub fn generate_prime(min: u64, max: u64) -> Result<u64, BlockchainError> {
        if min >= max {
            return Err(BlockchainError::Validation("Invalid range for prime generation".to_string()));
        }

        use rand::Rng;
        let mut rng = rand::thread_rng();

        for _ in 0..1000 { // Prevent infinite loop
            let candidate = rng.gen_range(min..max);
            if is_prime(candidate) {
                return Ok(candidate);
            }
        }

        Err(BlockchainError::Validation("Failed to generate prime number".to_string()))
    }
}

/// Error utilities
pub mod error {
    use super::*;

    /// Create a user-friendly error message
    pub fn user_friendly_error(error: &BlockchainError) -> String {
        match error {
            BlockchainError::Core(core_error) => match core_error {
                crate::core::CoreError::TransactionExists(_) => "Transaction already exists in the blockchain".to_string(),
                crate::core::CoreError::ParentNotFound(_) => "Parent transaction not found".to_string(),
                crate::core::CoreError::InvalidTimestamp => "Transaction timestamp is invalid".to_string(),
                crate::core::CoreError::InsufficientQuantumResistance => "Transaction has insufficient quantum resistance".to_string(),
                crate::core::CoreError::InvalidTransactionStructure => "Transaction structure is invalid".to_string(),
                crate::core::CoreError::Serialization(_) => "Failed to serialize transaction data".to_string(),
            },
            BlockchainError::Network(network_error) => match network_error {
                crate::network::NetworkError::NotRunning => "Network layer is not running".to_string(),
                crate::network::NetworkError::PeerNotFound(_) => "Peer not found".to_string(),
                crate::network::NetworkError::ConnectionFailed(_) => "Failed to establish connection".to_string(),
                crate::network::NetworkError::ProtocolError(_) => "Network protocol error".to_string(),
            },
            BlockchainError::Consensus(consensus_error) => match consensus_error {
                crate::consensus::ConsensusError::NoValidators => "No validators available".to_string(),
                crate::consensus::ConsensusError::ConsensusNotReached => "Consensus could not be reached".to_string(),
                crate::consensus::ConsensusError::InvalidTransaction => "Transaction is invalid for consensus".to_string(),
                crate::consensus::ConsensusError::ValidatorNotFound(_) => "Validator not found".to_string(),
                crate::consensus::ConsensusError::Timeout => "Consensus operation timed out".to_string(),
            },
            BlockchainError::Security(security_error) => match security_error {
                crate::security::SecurityError::AddressBlocked(_) => "Address is blocked".to_string(),
                crate::security::SecurityError::InvalidSignature => "Invalid digital signature".to_string(),
                crate::security::SecurityError::InsufficientQuantumResistance => "Insufficient quantum resistance".to_string(),
                crate::security::SecurityError::InvalidTimestamp => "Invalid timestamp".to_string(),
                crate::security::SecurityError::ThreatDetected(_) => "Security threat detected".to_string(),
                crate::security::SecurityError::KeyGenerationFailed(_) => "Failed to generate cryptographic keys".to_string(),
                crate::security::SecurityError::EncryptionFailed(_) => "Encryption failed".to_string(),
            },
            BlockchainError::Math(math_error) => match math_error {
                crate::math::MathError::InvalidPrimeHash => "Invalid prime hash".to_string(),
                crate::math::MathError::InsufficientQuantumResistance => "Insufficient quantum resistance".to_string(),
                crate::math::MathError::InvalidTimestamp => "Invalid timestamp".to_string(),
                crate::math::MathError::NoValidators => "No validators available".to_string(),
                crate::math::MathError::PrimeGeneration(_) => "Failed to generate prime number".to_string(),
                crate::math::MathError::Calculation(_) => "Mathematical calculation error".to_string(),
            },
            BlockchainError::Io(_) => "Input/output error".to_string(),
            BlockchainError::Serialization(_) => "Serialization error".to_string(),
            BlockchainError::Other(msg) => msg.clone(),
            BlockchainError::Validation(msg) => msg.clone(),
        }
    }
}

/// Logging utilities
pub mod logging {
    use super::*;

    /// Initialize logging
    pub fn init_logging() -> Result<(), BlockchainError> {
        env_logger::Builder::from_default_env()
            .filter_level(log::LevelFilter::Info)
            .init();
        Ok(())
    }

    /// Log transaction creation
    pub fn log_transaction_created(tx_id: &str, amount: u64) {
        log::info!("📝 Transaction created: {} (amount: {})", tx_id, amount);
    }

    /// Log consensus event
    pub fn log_consensus_event(event: &str, height: u64) {
        log::info!("⚖️  Consensus {} at height {}", event, height);
    }

    /// Log network event
    pub fn log_network_event(event: &str, peer_count: u32) {
        log::info!("🌐 Network {} ({} peers)", event, peer_count);
    }

    /// Log security event
    pub fn log_security_event(event: &str, level: &str) {
        log::warn!("🔒 Security {} (level: {})", event, level);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crypto_utilities() {
        let bytes = crypto::generate_random_bytes(32);
        assert_eq!(bytes.len(), 32);
        
        let hash = crypto::sha3_256(b"test");
        assert_eq!(hash.len(), 32);
        
        assert!(crypto::verify_hash(b"test", &hash));
    }

    #[test]
    fn test_time_utilities() {
        let timestamp = time::current_timestamp();
        assert!(timestamp > 0);
        
        let formatted = time::format_timestamp(timestamp);
        assert!(!formatted.is_empty());
    }

    #[test]
    fn test_validation_utilities() {
        let public_key = crypto::generate_random_bytes(32);
        assert!(validation::validate_public_key(&public_key).is_ok());
        
        let signature = crypto::generate_random_bytes(64);
        assert!(validation::validate_signature(&signature).is_ok());
        
        assert!(validation::validate_amount(100).is_ok());
        assert!(validation::validate_timestamp(time::current_timestamp()).is_ok());
    }

    #[test]
    fn test_math_utilities() {
        assert_eq!(math::gcd(48, 18), 6);
        assert_eq!(math::gcd(17, 5), 1);
        
        assert!(math::is_prime(2));
        assert!(math::is_prime(3));
        assert!(math::is_prime(5));
        assert!(!math::is_prime(4));
        
        let prime = math::generate_prime(1000, 2000);
        assert!(prime.is_ok());
        let prime = prime.unwrap();
        assert!(math::is_prime(prime));
    }

    #[test]
    fn test_serialization_utilities() {
        #[derive(Serialize, Deserialize, Debug, PartialEq)]
        struct TestStruct {
            name: String,
            value: u64,
        }

        let test_data = TestStruct {
            name: "test".to_string(),
            value: 42,
        };

        let json = serialization::to_json(&test_data);
        assert!(json.is_ok());
        
        let deserialized: TestStruct = serialization::from_json(&json.unwrap());
        assert!(deserialized.is_ok());
        assert_eq!(deserialized.unwrap(), test_data);
    }
}