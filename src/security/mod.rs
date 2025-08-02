//! Security layer for blockchain protection

use crate::{BlockchainError, TransactionId};
use std::collections::HashMap;
use tokio::sync::RwLock;

/// Security configuration
#[derive(Debug, Clone)]
pub struct SecurityConfig {
    pub quantum_resistance_level: u32,
    pub signature_scheme: String,
    pub key_rotation_interval_hours: u64,
}

/// Security manager implementation
pub struct SecurityManager {
    config: SecurityConfig,
    threat_level: ThreatLevel,
    blocked_addresses: HashMap<String, std::time::Instant>,
    is_running: bool,
}

/// Threat level enumeration
#[derive(Debug, Clone, PartialEq)]
pub enum ThreatLevel {
    Low,
    Medium,
    High,
    Critical,
}

impl SecurityManager {
    /// Create a new security manager
    pub fn new(config: &SecurityConfig) -> Result<Self, BlockchainError> {
        Ok(Self {
            config: config.clone(),
            threat_level: ThreatLevel::Low,
            blocked_addresses: HashMap::new(),
            is_running: false,
        })
    }

    /// Start the security manager
    pub async fn start(&mut self) -> Result<(), BlockchainError> {
        println!("🔒 Starting security manager");
        self.is_running = true;
        
        // Start security monitoring
        self.start_threat_detection().await;
        self.start_key_rotation().await;
        
        Ok(())
    }

    /// Stop the security manager
    pub async fn stop(&mut self) -> Result<(), BlockchainError> {
        println!("🔒 Stopping security manager");
        self.is_running = false;
        self.blocked_addresses.clear();
        Ok(())
    }

    /// Validate transaction security
    pub async fn validate_transaction(&self, transaction: &crate::core::Transaction) -> Result<(), BlockchainError> {
        // Check if sender is blocked
        let sender_addr = hex::encode(&transaction.sender);
        if self.is_address_blocked(&sender_addr) {
            return Err(BlockchainError::Security(SecurityError::AddressBlocked(sender_addr)));
        }

        // Validate signature
        if !self.validate_signature(&transaction.sender, &transaction.signature, &transaction.id)? {
            return Err(BlockchainError::Security(SecurityError::InvalidSignature));
        }

        // Check quantum resistance
        if transaction.quantum_proof.resistance_score < self.config.quantum_resistance_level {
            return Err(BlockchainError::Security(SecurityError::InsufficientQuantumResistance));
        }

        // Validate timestamp
        let current_time = chrono::Utc::now().timestamp() as u64;
        if transaction.timestamp > current_time + 300 {
            return Err(BlockchainError::Security(SecurityError::InvalidTimestamp));
        }

        Ok(())
    }

    /// Validate digital signature
    fn validate_signature(&self, public_key: &[u8], signature: &[u8], message: &TransactionId) -> Result<bool, BlockchainError> {
        // In a real implementation, this would use proper cryptographic validation
        // For prototype, we'll use a simple heuristic
        
        // Check signature length
        if signature.len() < 64 {
            return Ok(false);
        }

        // Check if signature has sufficient entropy
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

        // Require at least 3 bits of entropy per byte
        Ok(entropy >= 3.0 * signature.len() as f64)
    }

    /// Check if address is blocked
    fn is_address_blocked(&self, address: &str) -> bool {
        self.blocked_addresses.contains_key(address)
    }

    /// Block an address
    pub fn block_address(&mut self, address: String) {
        println!("🚫 Blocking address: {}", address);
        self.blocked_addresses.insert(address, std::time::Instant::now());
    }

    /// Get current threat level
    pub fn threat_level(&self) -> ThreatLevel {
        self.threat_level.clone()
    }

    /// Update threat level
    pub fn update_threat_level(&mut self, new_level: ThreatLevel) {
        if new_level != self.threat_level {
            println!("🚨 Threat level changed: {:?} -> {:?}", self.threat_level, new_level);
            self.threat_level = new_level;
        }
    }

    /// Start threat detection
    async fn start_threat_detection(&self) {
        tokio::spawn(async {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
            
            while interval.tick().await.is_some() {
                // Simulate threat detection
                println!("🔍 Running threat detection scan...");
                
                // In real implementation, this would:
                // 1. Monitor network traffic
                // 2. Analyze transaction patterns
                // 3. Detect anomalies
                // 4. Update threat level
            }
        });
    }

    /// Start key rotation
    async fn start_key_rotation(&self) {
        let rotation_interval = tokio::time::Duration::from_secs(
            self.config.key_rotation_interval_hours * 3600
        );
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(rotation_interval);
            
            while interval.tick().await.is_some() {
                println!("🔄 Rotating cryptographic keys...");
                
                // In real implementation, this would:
                // 1. Generate new key pairs
                // 2. Update key stores
                // 3. Re-encrypt sensitive data
                // 4. Archive old keys
            }
        });
    }

    /// Generate security report
    pub fn generate_security_report(&self) -> SecurityReport {
        SecurityReport {
            threat_level: self.threat_level.clone(),
            blocked_addresses: self.blocked_addresses.len(),
            quantum_resistance_level: self.config.quantum_resistance_level,
            signature_scheme: self.config.signature_scheme.clone(),
            timestamp: chrono::Utc::now(),
        }
    }
}

/// Security report
#[derive(Debug, Clone)]
pub struct SecurityReport {
    pub threat_level: ThreatLevel,
    pub blocked_addresses: usize,
    pub quantum_resistance_level: u32,
    pub signature_scheme: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Security error types
#[derive(Debug, thiserror::Error)]
pub enum SecurityError {
    #[error("Address blocked: {0}")]
    AddressBlocked(String),
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Insufficient quantum resistance")]
    InsufficientQuantumResistance,
    #[error("Invalid timestamp")]
    InvalidTimestamp,
    #[error("Threat detected: {0}")]
    ThreatDetected(String),
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
}

/// Security service trait
pub trait SecurityService: Send + Sync {
    async fn validate_transaction(&self, transaction: &crate::core::Transaction) -> Result<(), BlockchainError>;
    fn threat_level(&self) -> ThreatLevel;
    fn block_address(&mut self, address: String);
    fn generate_security_report(&self) -> SecurityReport;
}

impl SecurityService for SecurityManager {
    async fn validate_transaction(&self, transaction: &crate::core::Transaction) -> Result<(), BlockchainError> {
        self.validate_transaction(transaction).await
    }

    fn threat_level(&self) -> ThreatLevel {
        self.threat_level()
    }

    fn block_address(&mut self, address: String) {
        self.block_address(address);
    }

    fn generate_security_report(&self) -> SecurityReport {
        self.generate_security_report()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_security_manager_creation() {
        let config = SecurityConfig {
            quantum_resistance_level: 128,
            signature_scheme: "dilithium".to_string(),
            key_rotation_interval_hours: 24,
        };

        let manager = SecurityManager::new(&config);
        assert!(manager.is_ok());
        
        let manager = manager.unwrap();
        assert_eq!(manager.threat_level(), ThreatLevel::Low);
        assert_eq!(manager.blocked_addresses.len(), 0);
    }

    #[test]
    fn test_address_blocking() {
        let config = SecurityConfig {
            quantum_resistance_level: 128,
            signature_scheme: "dilithium".to_string(),
            key_rotation_interval_hours: 24,
        };

        let mut manager = SecurityManager::new(&config).unwrap();
        let test_address = "test_address".to_string();
        
        assert!(!manager.is_address_blocked(&test_address));
        
        manager.block_address(test_address.clone());
        assert!(manager.is_address_blocked(&test_address));
    }

    #[test]
    fn test_threat_level_update() {
        let config = SecurityConfig {
            quantum_resistance_level: 128,
            signature_scheme: "dilithium".to_string(),
            key_rotation_interval_hours: 24,
        };

        let mut manager = SecurityManager::new(&config).unwrap();
        
        assert_eq!(manager.threat_level(), ThreatLevel::Low);
        
        manager.update_threat_level(ThreatLevel::High);
        assert_eq!(manager.threat_level(), ThreatLevel::High);
    }

    #[test]
    fn test_signature_validation() {
        let config = SecurityConfig {
            quantum_resistance_level: 128,
            signature_scheme: "dilithium".to_string(),
            key_rotation_interval_hours: 24,
        };

        let manager = SecurityManager::new(&config).unwrap();
        let public_key = vec![1u8; 32];
        let tx_id = TransactionId::new();
        
        // Test with valid signature (sufficient entropy)
        let valid_signature = {
            let mut sig = vec![0u8; 64];
            rand::thread_rng().fill_bytes(&mut sig);
            sig
        };
        
        let result = manager.validate_signature(&public_key, &valid_signature, &tx_id);
        assert!(result.unwrap());
        
        // Test with invalid signature (insufficient entropy)
        let invalid_signature = vec![0u8; 64];
        let result = manager.validate_signature(&public_key, &invalid_signature, &tx_id);
        assert!(!result.unwrap());
    }

    #[test]
    fn test_security_report() {
        let config = SecurityConfig {
            quantum_resistance_level: 128,
            signature_scheme: "dilithium".to_string(),
            key_rotation_interval_hours: 24,
        };

        let manager = SecurityManager::new(&config).unwrap();
        let report = manager.generate_security_report();
        
        assert_eq!(report.threat_level, ThreatLevel::Low);
        assert_eq!(report.blocked_addresses, 0);
        assert_eq!(report.quantum_resistance_level, 128);
        assert_eq!(report.signature_scheme, "dilithium");
    }
}