//! Mathematical foundation for quantum-proof blockchain

use crate::{BlockchainError, TransactionId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Prime layer for quantum-resistant mathematics
pub struct PrimeLayer {
    /// Pre-computed primes for efficiency
    prime_cache: Vec<u64>,
    /// Prime modulus for cryptographic operations
    prime_modulus: u64,
    /// Security parameters
    security_level: u32,
}

impl PrimeLayer {
    /// Create a new prime layer
    pub fn new() -> Result<Self, BlockchainError> {
        let prime_modulus = 2147483647; // Large prime (2^31 - 1)
        let prime_cache = Self::generate_prime_cache(1000)?;
        
        Ok(Self {
            prime_cache,
            prime_modulus,
            security_level: 128,
        })
    }

    /// Generate cache of prime numbers
    fn generate_prime_cache(count: usize) -> Result<Vec<u64>, BlockchainError> {
        let mut primes = Vec::new();
        let mut num = 2;
        
        while primes.len() < count {
            if Self::is_prime(num) {
                primes.push(num);
            }
            num += 1;
        }
        
        Ok(primes)
    }

    /// Check if a number is prime
    fn is_prime(n: u64) -> bool {
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

    /// Get the nth prime number
    pub fn get_nth_prime(&self, n: usize) -> Result<u64, BlockchainError> {
        if n < self.prime_cache.len() {
            Ok(self.prime_cache[n])
        } else {
            // Generate primes beyond cache
            let mut primes = self.prime_cache.clone();
            let mut num = primes.last().unwrap() + 1;
            
            while primes.len() <= n {
                if Self::is_prime(num) {
                    primes.push(num);
                }
                num += 1;
            }
            
            Ok(primes[n])
        }
    }

    /// Prime-based hash function
    pub fn prime_hash(&self, data: &[u8]) -> Result<Vec<u8>, BlockchainError> {
        let mut result = 1u64;
        
        // Use prime number transformation
        for (i, &byte) in data.iter().enumerate() {
            let prime = self.get_nth_prime(byte as usize)?;
            result = result.wrapping_mul(prime);
            result %= self.prime_modulus;
        }
        
        // Convert to bytes
        Ok(result.to_be_bytes().to_vec())
    }

    /// Validate transaction using prime-based mathematics
    pub async fn validate_transaction(&self, transaction: &crate::core::Transaction) -> Result<(), BlockchainError> {
        // Validate prime-based hash
        let expected_hash = self.prime_hash(&transaction.id.as_bytes())?;
        if expected_hash != transaction.quantum_proof.prime_hash {
            return Err(BlockchainError::Math(MathError::InvalidPrimeHash));
        }

        // Calculate quantum resistance score
        let calculated_score = self.calculate_quantum_resistance_score(transaction)?;
        if calculated_score < transaction.quantum_proof.resistance_score {
            return Err(BlockchainError::Math(MathError::InsufficientQuantumResistance));
        }

        // Validate timestamp with prime-based check
        self.validate_timestamp_prime(transaction)?;

        Ok(())
    }

    /// Calculate quantum resistance score for a transaction
    pub fn calculate_quantum_resistance_score(&self, transaction: &crate::core::Transaction) -> Result<u32, BlockchainError> {
        let mut score = 0;

        // Score based on prime hash complexity
        let hash_complexity = self.calculate_hash_complexity(&transaction.quantum_proof.prime_hash)?;
        score += (hash_complexity * 30) as u32;

        // Score based on signature strength
        let signature_strength = self.calculate_signature_strength(&transaction.signature)?;
        score += (signature_strength * 40) as u32;

        // Score based on transaction structure
        let structure_score = self.calculate_structure_score(transaction)?;
        score += structure_score;

        // Score based on timestamp validity
        let time_score = self.calculate_time_score(transaction)?;
        score += time_score;

        Ok(score.min(100))
    }

    /// Calculate hash complexity based on prime factors
    fn calculate_hash_complexity(&self, hash: &[u8]) -> Result<f64, BlockchainError> {
        let hash_num = u64::from_be_bytes(
            hash.iter()
                .take(8)
                .copied()
                .chain(std::iter::repeat(0).take(8 - hash.len()))
                .collect::<Vec<_>>()
                .try_into()
                .unwrap_or([0u8; 8])
        );

        // Count prime factors
        let prime_factors = self.prime_factors(hash_num);
        let factor_count = prime_factors.len();

        // Complexity based on number and size of prime factors
        let complexity = (factor_count as f64).log2() / 8.0;
        Ok(complexity.min(1.0))
    }

    /// Calculate signature strength
    fn calculate_signature_strength(&self, signature: &[u8]) -> Result<f64, BlockchainError> {
        // Simple heuristic based on signature length and entropy
        if signature.len() < 64 {
            return Ok(0.0);
        }

        // Calculate byte entropy
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

        // Normalize to 0-1 range
        Ok((entropy / 8.0).min(1.0))
    }

    /// Calculate transaction structure score
    fn calculate_structure_score(&self, transaction: &crate::core::Transaction) -> Result<u32, BlockchainError> {
        let mut score = 0;

        // Score for having parents (not genesis)
        if !transaction.parents.is_empty() {
            score += 20;
        }

        // Score for reasonable number of parents
        if transaction.parents.len() <= 8 {
            score += 15;
        }

        // Score for having metadata
        if transaction.metadata.is_some() {
            score += 10;
        }

        // Score for valid amount
        if transaction.amount > 0 {
            score += 10;
        }

        Ok(score)
    }

    /// Calculate timestamp score
    fn calculate_time_score(&self, transaction: &crate::core::Transaction) -> Result<u32, BlockchainError> {
        let current_time = chrono::Utc::now().timestamp() as u64;
        let time_diff = current_time.saturating_sub(transaction.timestamp);

        // Score for reasonable timestamp
        if time_diff < 3600 { // Within 1 hour
            Ok(25)
        } else if time_diff < 86400 { // Within 1 day
            Ok(15)
        } else if time_diff < 604800 { // Within 1 week
            Ok(5)
        } else {
            Ok(0)
        }
    }

    /// Validate timestamp using prime-based check
    fn validate_timestamp_prime(&self, transaction: &crate::core::Transaction) -> Result<(), BlockchainError> {
        let timestamp = transaction.timestamp;
        
        // Check if timestamp is a prime number (simple validation)
        if timestamp > 1000 && Self::is_prime(timestamp) {
            return Ok(());
        }

        // Alternative validation: check timestamp + nonce is prime
        let combined = timestamp.wrapping_add(transaction.nonce);
        if combined > 1000 && Self::is_prime(combined) {
            return Ok(());
        }

        // Fallback: check if timestamp is divisible by small primes
        let small_primes = &[2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
        for &prime in small_primes {
            if timestamp % prime == 0 {
                return Ok(());
            }
        }

        Err(BlockchainError::Math(MathError::InvalidTimestamp))
    }

    /// Get prime factors of a number
    fn prime_factors(&self, mut n: u64) -> Vec<u64> {
        let mut factors = Vec::new();
        
        // Handle 2 separately
        while n % 2 == 0 {
            factors.push(2);
            n /= 2;
        }
        
        // Check odd divisors up to sqrt(n)
        let mut i = 3;
        while i * i <= n {
            while n % i == 0 {
                factors.push(i);
                n /= i;
            }
            i += 2;
        }
        
        if n > 1 {
            factors.push(n);
        }
        
        factors
    }

    /// Calculate consensus weight using prime number properties
    pub fn calculate_consensus_weight(&self, transaction: &crate::core::Transaction) -> Result<u64, BlockchainError> {
        let mut weight = 1;

        // Base weight from transaction ID
        let tx_hash = u64::from_be_bytes(
            transaction.id.as_bytes()[..8].try_into().unwrap_or([0u8; 8])
        );
        weight = weight.wrapping_mul(tx_hash);

        // Weight from prime factors of timestamp
        let time_factors = self.prime_factors(transaction.timestamp);
        for factor in time_factors {
            weight = weight.wrapping_mul(factor);
        }

        // Weight from nonce
        weight = weight.wrapping_add(transaction.nonce);

        // Apply prime modulus
        weight %= self.prime_modulus;

        // Ensure minimum weight
        Ok(weight.max(1))
    }

    /// Get quantum resistance score for the layer
    pub fn quantum_resistance_score(&self) -> f64 {
        // Calculate based on prime modulus size and security level
        let modulus_bits = (self.prime_modulus as f64).log2();
        let base_score = modulus_bits / 256.0; // Normalize to 256-bit security
        
        (base_score * (self.security_level as f64 / 128.0)).min(1.0)
    }

    /// Generate prime-based validator selection
    pub fn select_validator(&self, validators: &[ValidatorInfo], block_height: u64) -> Result<usize, BlockchainError> {
        if validators.is_empty() {
            return Err(BlockchainError::Math(MathError::NoValidators));
        }

        // Calculate selection hash
        let selection_input = format!("{}{}", block_height, validators.len());
        let selection_hash = self.prime_hash(selection_input.as_bytes())?;
        
        // Convert to selection number
        let selection_num = u64::from_be_bytes(
            selection_hash[..8].try_into().unwrap_or([0u8; 8])
        );

        // Calculate total weight
        let total_weight: u64 = validators.iter()
            .map(|v| v.weight)
            .sum();

        // Select validator using weighted random selection
        let target = selection_num % total_weight;
        let mut current_weight = 0;
        
        for (i, validator) in validators.iter().enumerate() {
            current_weight += validator.weight;
            if current_weight >= target {
                return Ok(i);
            }
        }

        Ok(0) // Fallback to first validator
    }
}

/// Validator information
#[derive(Debug, Clone)]
pub struct ValidatorInfo {
    pub public_key: Vec<u8>,
    pub weight: u64,
    pub prime_base: u64,
    pub stake_amount: u64,
}

/// Mathematical error types
#[derive(Debug, thiserror::Error)]
pub enum MathError {
    #[error("Invalid prime hash")]
    InvalidPrimeHash,
    #[error("Insufficient quantum resistance")]
    InsufficientQuantumResistance,
    #[error("Invalid timestamp")]
    InvalidTimestamp,
    #[error("No validators available")]
    NoValidators,
    #[error("Prime generation error: {0}")]
    PrimeGeneration(String),
    #[error("Calculation error: {0}")]
    Calculation(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prime_layer_creation() {
        let prime_layer = PrimeLayer::new();
        assert!(prime_layer.is_ok());
        
        let layer = prime_layer.unwrap();
        assert!(!layer.prime_cache.is_empty());
        assert!(layer.prime_modulus > 0);
    }

    #[test]
    fn test_prime_generation() {
        assert!(PrimeLayer::is_prime(2));
        assert!(PrimeLayer::is_prime(3));
        assert!(PrimeLayer::is_prime(5));
        assert!(PrimeLayer::is_prime(7));
        assert!(!PrimeLayer::is_prime(4));
        assert!(!PrimeLayer::is_prime(6));
        assert!(!PrimeLayer::is_prime(8));
    }

    #[test]
    fn test_prime_hash() {
        let layer = PrimeLayer::new().unwrap();
        let data = b"test data";
        
        let hash = layer.prime_hash(data);
        assert!(hash.is_ok());
        
        let hash1 = hash.unwrap();
        let hash2 = layer.prime_hash(data).unwrap();
        
        assert_eq!(hash1, hash2); // Same input should produce same hash
    }

    #[test]
    fn test_nth_prime() {
        let layer = PrimeLayer::new().unwrap();
        
        assert_eq!(layer.get_nth_prime(0).unwrap(), 2);
        assert_eq!(layer.get_nth_prime(1).unwrap(), 3);
        assert_eq!(layer.get_nth_prime(2).unwrap(), 5);
        assert_eq!(layer.get_nth_prime(3).unwrap(), 7);
    }

    #[test]
    fn test_prime_factors() {
        let layer = PrimeLayer::new().unwrap();
        
        let factors = layer.prime_factors(12);
        assert_eq!(factors, vec![2, 2, 3]);
        
        let factors = layer.prime_factors(17);
        assert_eq!(factors, vec![17]);
        
        let factors = layer.prime_factors(100);
        assert_eq!(factors, vec![2, 2, 5, 5]);
    }

    #[test]
    fn test_quantum_resistance_score() {
        let layer = PrimeLayer::new().unwrap();
        let score = layer.quantum_resistance_score();
        
        assert!(score > 0.0);
        assert!(score <= 1.0);
    }

    #[test]
    fn test_validator_selection() {
        let layer = PrimeLayer::new().unwrap();
        
        let validators = vec![
            ValidatorInfo {
                public_key: vec![1u8; 32],
                weight: 100,
                prime_base: 2,
                stake_amount: 1000,
            },
            ValidatorInfo {
                public_key: vec![2u8; 32],
                weight: 200,
                prime_base: 3,
                stake_amount: 2000,
            },
        ];
        
        let selection = layer.select_validator(&validators, 1);
        assert!(selection.is_ok());
        
        let selected = selection.unwrap();
        assert!(selected < validators.len());
    }
}