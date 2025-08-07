//! Cryptographic services for the Mobile SDK

use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sha2::{Sha256, Digest};
use hmac::{Hmac, Mac};
use pbkdf2::pbkdf2;
use aes::cipher::{KeyIvInit, StreamCipher};
use aes::Aes256;
use ctr::Ctr64BE;
use rand::Rng;
use rand::rngs::OsRng;

use crate::types::*;
use crate::{SecurityConfig, SDKResult, SDKError};

/// Cryptographic service
pub struct CryptoService {
    config: SecurityConfig,
    key_cache: HashMap<String, Vec<u8>>,
}

impl CryptoService {
    /// Create new crypto service
    pub fn new(config: &SecurityConfig) -> SDKResult<Self> {
        Ok(Self {
            config: config.clone(),
            key_cache: HashMap::new(),
        })
    }

    /// Generate random bytes
    pub fn generate_random_bytes(&self, length: usize) -> SDKResult<Vec<u8>> {
        let mut rng = OsRng;
        let mut bytes = vec![0u8; length];
        rng.fill(&mut bytes);
        Ok(bytes)
    }

    /// Generate mnemonic phrase
    pub fn generate_mnemonic(&self) -> SDKResult<String> {
        let entropy = self.generate_random_bytes(16)?;
        let mnemonic = bip39::Mnemonic::from_entropy(&entropy)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        Ok(mnemonic.to_string())
    }

    /// Validate mnemonic phrase
    pub fn validate_mnemonic(&self, mnemonic: &str) -> SDKResult<bool> {
        let result = bip39::Mnemonic::from_phrase(mnemonic);
        Ok(result.is_ok())
    }

    /// Convert mnemonic to seed
    pub fn mnemonic_to_seed(&self, mnemonic: &str, passphrase: &str) -> SDKResult<Vec<u8>> {
        let mnemonic = bip39::Mnemonic::from_phrase(mnemonic)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        let seed = mnemonic.to_seed(passphrase);
        Ok(seed.to_vec())
    }

    /// Derive key from seed
    pub fn derive_key_from_seed(&self, seed: &[u8], path: &str) -> SDKResult<Vec<u8>> {
        // Simple key derivation (in production, use BIP32 or similar)
        let mut hasher = Sha256::new();
        hasher.update(seed);
        hasher.update(path.as_bytes());
        let key = hasher.finalize();
        Ok(key.to_vec())
    }

    /// Generate key pair from seed
    pub fn generate_key_pair(&self, seed: &[u8]) -> SDKResult<KeyPair> {
        // Use Ed25519 for key generation
        use ed25519_dalek::{Keypair, PublicKey, SecretKey, Signature};
        
        let secret_key = SecretKey::from_bytes(&seed[..32])
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        
        let public_key = PublicKey::from(&secret_key);
        let keypair = Keypair { secret: secret_key, public: public_key };
        
        Ok(KeyPair {
            private_key: keypair.secret.to_bytes().to_vec(),
            public_key: keypair.public.to_bytes().to_vec(),
            address: self.public_key_to_address(&keypair.public.to_bytes()),
        })
    }

    /// Convert public key to address
    pub fn public_key_to_address(&self, public_key: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(public_key);
        let hash = hasher.finalize();
        
        // Take first 20 bytes as address
        let address_bytes = &hash[..20];
        hex::encode(address_bytes)
    }

    /// Sign data
    pub fn sign(&self, data: &[u8], private_key: &[u8]) -> SDKResult<Vec<u8>> {
        use ed25519_dalek::{Keypair, SecretKey, Signature, Signer};
        
        let secret_key = SecretKey::from_bytes(private_key)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        
        let public_key = PublicKey::from(&secret_key);
        let keypair = Keypair { secret: secret_key, public: public_key };
        
        let signature = keypair.sign(data);
        Ok(signature.to_bytes().to_vec())
    }

    /// Verify signature
    pub fn verify_signature(&self, data: &[u8], signature: &[u8], public_key: &[u8]) -> SDKResult<bool> {
        use ed25519_dalek::{PublicKey, Signature, Verifier};
        
        let public_key = PublicKey::from_bytes(public_key)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        
        let signature = Signature::from_bytes(signature)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        
        Ok(public_key.verify(data, &signature).is_ok())
    }

    /// Hash data
    pub fn hash_data(&self, data: &[u8]) -> SDKResult<Vec<u8>> {
        let mut hasher = Sha256::new();
        hasher.update(data);
        Ok(hasher.finalize().to_vec())
    }

    /// Hash transaction
    pub fn hash_transaction(&self, transaction: &UnsignedTransaction) -> SDKResult<Vec<u8>> {
        let tx_data = serde_json::to_vec(transaction)
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        self.hash_data(&tx_data)
    }

    /// Encrypt data
    pub fn encrypt(&self, data: &[u8], key: &[u8]) -> SDKResult<Vec<u8>> {
        if key.len() != 32 {
            return Err(SDKError::Crypto("Key must be 32 bytes".to_string()));
        }

        // Generate random IV
        let iv = self.generate_random_bytes(16)?;
        
        // Encrypt using AES-256-CTR
        let cipher = Ctr64BE::new_from_slices(key, &iv)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        
        let mut encrypted_data = data.to_vec();
        cipher.apply_keystream(&mut encrypted_data);
        
        // Prepend IV to encrypted data
        let mut result = iv;
        result.extend(encrypted_data);
        
        Ok(result)
    }

    /// Decrypt data
    pub fn decrypt(&self, data: &[u8], key: &[u8]) -> SDKResult<Vec<u8>> {
        if key.len() != 32 {
            return Err(SDKError::Crypto("Key must be 32 bytes".to_string()));
        }

        if data.len() < 16 {
            return Err(SDKError::Crypto("Invalid encrypted data".to_string()));
        }

        // Extract IV and encrypted data
        let (iv, encrypted_data) = data.split_at(16);
        
        // Decrypt using AES-256-CTR
        let cipher = Ctr64BE::new_from_slices(key, iv)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        
        let mut decrypted_data = encrypted_data.to_vec();
        cipher.apply_keystream(&mut decrypted_data);
        
        Ok(decrypted_data)
    }

    /// Derive encryption key from passphrase
    pub fn derive_encryption_key(&self, passphrase: &str, salt: &[u8]) -> SDKResult<Vec<u8>> {
        let mut key = [0u8; 32];
        pbkdf2::<Hmac<Sha256>>(
            passphrase.as_bytes(),
            salt,
            self.config.key_derivation_iterations,
            &mut key,
        );
        Ok(key.to_vec())
    }

    /// Generate secure random password
    pub fn generate_password(&self, length: usize) -> SDKResult<String> {
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                                abcdefghijklmnopqrstuvwxyz\
                                0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        
        let mut rng = OsRng;
        let password: String = (0..length)
            .map(|_| {
                let idx = rng.gen_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect();
        
        Ok(password)
    }

    /// Generate secure PIN
    pub fn generate_pin(&self) -> SDKResult<String> {
        let mut rng = OsRng;
        let pin: String = (0..self.config.pin_length)
            .map(|_| rng.gen_range(0..10).to_string())
            .collect();
        Ok(pin)
    }

    /// Validate PIN
    pub fn validate_pin(&self, pin: &str) -> SDKResult<bool> {
        if pin.len() != self.config.pin_length as usize {
            return Ok(false);
        }
        
        pin.chars().all(|c| c.is_ascii_digit())
    }

    /// Generate HMAC
    pub fn generate_hmac(&self, data: &[u8], key: &[u8]) -> SDKResult<Vec<u8>> {
        let mut mac = Hmac::<Sha256>::new_from_slice(key)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        mac.update(data);
        Ok(mac.finalize().into_bytes().to_vec())
    }

    /// Verify HMAC
    pub fn verify_hmac(&self, data: &[u8], hmac: &[u8], key: &[u8]) -> SDKResult<bool> {
        let mut mac = Hmac::<Sha256>::new_from_slice(key)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        mac.update(data);
        Ok(mac.verify_slice(hmac).is_ok())
    }

    /// Generate session token
    pub fn generate_session_token(&self) -> SDKResult<String> {
        let token_data = self.generate_random_bytes(32)?;
        Ok(hex::encode(token_data))
    }

    /// Validate session token
    pub fn validate_session_token(&self, token: &str) -> SDKResult<bool> {
        hex::decode(token)
            .map(|_| true)
            .map_err(|_| false)
    }

    /// Cache key for performance
    pub fn cache_key(&mut self, key_id: &str, key_data: &[u8]) {
        self.key_cache.insert(key_id.to_string(), key_data.to_vec());
    }

    /// Get cached key
    pub fn get_cached_key(&self, key_id: &str) -> Option<&[u8]> {
        self.key_cache.get(key_id).map(|k| k.as_slice())
    }

    /// Clear key cache
    pub fn clear_key_cache(&mut self) {
        self.key_cache.clear();
    }

    /// Generate quantum-resistant signature (placeholder)
    pub fn generate_quantum_signature(&self, data: &[u8], private_key: &[u8]) -> SDKResult<Vec<u8>> {
        // In a real implementation, this would use quantum-resistant algorithms
        // For now, we'll use a combination of Ed25519 and additional hashing
        let ed25519_sig = self.sign(data, private_key)?;
        
        let mut hasher = Sha256::new();
        hasher.update(&ed25519_sig);
        hasher.update(b"quantum");
        let quantum_sig = hasher.finalize();
        
        let mut combined_sig = ed25519_sig;
        combined_sig.extend(quantum_sig);
        
        Ok(combined_sig)
    }

    /// Verify quantum-resistant signature (placeholder)
    pub fn verify_quantum_signature(&self, data: &[u8], signature: &[u8], public_key: &[u8]) -> SDKResult<bool> {
        if signature.len() < 64 {
            return Ok(false);
        }
        
        let (ed25519_sig, quantum_hash) = signature.split_at(64);
        
        // Verify Ed25519 signature
        let ed25519_valid = self.verify_signature(data, ed25519_sig, public_key)?;
        
        if !ed25519_valid {
            return Ok(false);
        }
        
        // Verify quantum hash
        let mut hasher = Sha256::new();
        hasher.update(ed25519_sig);
        hasher.update(b"quantum");
        let expected_quantum_hash = hasher.finalize();
        
        Ok(quantum_hash == expected_quantum_hash)
    }

    /// Calculate quantum resistance score (placeholder)
    pub fn calculate_quantum_resistance_score(&self, signature: &[u8]) -> SDKResult<u8> {
        // Simple scoring based on signature length and complexity
        let base_score = 50;
        let length_bonus = (signature.len() as u8).saturating_sub(64) / 4;
        let complexity_bonus = if signature.len() > 96 { 20 } else { 0 };
        
        Ok((base_score + length_bonus + complexity_bonus).min(100))
    }
}

/// Key pair
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyPair {
    pub private_key: Vec<u8>,
    pub public_key: Vec<u8>,
    pub address: String,
}

impl KeyPair {
    /// Create new key pair
    pub fn new(private_key: Vec<u8>, public_key: Vec<u8>, address: String) -> Self {
        Self {
            private_key,
            public_key,
            address,
        }
    }

    /// Get public key as hex string
    pub fn public_key_hex(&self) -> String {
        hex::encode(&self.public_key)
    }

    /// Get private key as hex string
    pub fn private_key_hex(&self) -> String {
        hex::encode(&self.private_key)
    }
}

/// Encrypted data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedData {
    pub iv: Vec<u8>,
    pub data: Vec<u8>,
    pub algorithm: String,
    pub key_id: Option<String>,
}

impl EncryptedData {
    /// Create new encrypted data
    pub fn new(iv: Vec<u8>, data: Vec<u8>, algorithm: String, key_id: Option<String>) -> Self {
        Self {
            iv,
            data,
            algorithm,
            key_id,
        }
    }

    /// Combine IV and data for storage
    pub fn to_combined(&self) -> Vec<u8> {
        let mut combined = self.iv.clone();
        combined.extend(&self.data);
        combined
    }

    /// Parse combined data
    pub fn from_combined(data: &[u8], algorithm: String, key_id: Option<String>) -> SDKResult<Self> {
        if data.len() < 16 {
            return Err(SDKError::Crypto("Invalid encrypted data".to_string()));
        }

        let (iv, encrypted_data) = data.split_at(16);
        Ok(Self::new(iv.to_vec(), encrypted_data.to_vec(), algorithm, key_id))
    }
}

/// Session token
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionToken {
    pub token: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub user_id: Option<String>,
    pub permissions: Vec<String>,
}

impl SessionToken {
    /// Create new session token
    pub fn new(token: String, expires_in_minutes: u64, user_id: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            token,
            created_at: now,
            expires_at: now + chrono::Duration::minutes(expires_in_minutes as i64),
            user_id,
            permissions: vec!["read".to_string(), "write".to_string()],
        }
    }

    /// Check if token is expired
    pub fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }

    /// Check if token has permission
    pub fn has_permission(&self, permission: &str) -> bool {
        self.permissions.contains(&permission.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::SecurityConfig;

    #[test]
    fn test_crypto_service_creation() {
        let config = SecurityConfig::default();
        let crypto = CryptoService::new(&config);
        assert!(crypto.is_ok());
    }

    #[test]
    fn test_generate_mnemonic() {
        let config = SecurityConfig::default();
        let crypto = CryptoService::new(&config).unwrap();
        let mnemonic = crypto.generate_mnemonic();
        assert!(mnemonic.is_ok());
        let mnemonic = mnemonic.unwrap();
        assert!(!mnemonic.is_empty());
    }

    #[test]
    fn test_validate_mnemonic() {
        let config = SecurityConfig::default();
        let crypto = CryptoService::new(&config).unwrap();
        
        let valid_mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        assert!(crypto.validate_mnemonic(valid_mnemonic).unwrap());
        
        let invalid_mnemonic = "invalid mnemonic phrase";
        assert!(!crypto.validate_mnemonic(invalid_mnemonic).unwrap());
    }

    #[test]
    fn test_key_pair_generation() {
        let config = SecurityConfig::default();
        let crypto = CryptoService::new(&config).unwrap();
        
        let seed = crypto.generate_random_bytes(32).unwrap();
        let keypair = crypto.generate_key_pair(&seed);
        assert!(keypair.is_ok());
        
        let keypair = keypair.unwrap();
        assert_eq!(keypair.private_key.len(), 32);
        assert_eq!(keypair.public_key.len(), 32);
        assert!(!keypair.address.is_empty());
    }

    #[test]
    fn test_sign_and_verify() {
        let config = SecurityConfig::default();
        let crypto = CryptoService::new(&config).unwrap();
        
        let seed = crypto.generate_random_bytes(32).unwrap();
        let keypair = crypto.generate_key_pair(&seed).unwrap();
        
        let data = b"test data";
        let signature = crypto.sign(data, &keypair.private_key);
        assert!(signature.is_ok());
        
        let signature = signature.unwrap();
        let verified = crypto.verify_signature(data, &signature, &keypair.public_key);
        assert!(verified.unwrap());
    }

    #[test]
    fn test_encrypt_decrypt() {
        let config = SecurityConfig::default();
        let crypto = CryptoService::new(&config).unwrap();
        
        let data = b"secret message";
        let key = crypto.generate_random_bytes(32).unwrap();
        
        let encrypted = crypto.encrypt(data, &key);
        assert!(encrypted.is_ok());
        
        let encrypted = encrypted.unwrap();
        let decrypted = crypto.decrypt(&encrypted, &key);
        assert!(decrypted.is_ok());
        
        let decrypted = decrypted.unwrap();
        assert_eq!(decrypted, data);
    }

    #[test]
    fn test_password_generation() {
        let config = SecurityConfig::default();
        let crypto = CryptoService::new(&config).unwrap();
        
        let password = crypto.generate_password(16);
        assert!(password.is_ok());
        let password = password.unwrap();
        assert_eq!(password.len(), 16);
    }

    #[test]
    fn test_pin_generation() {
        let config = SecurityConfig::default();
        let crypto = CryptoService::new(&config).unwrap();
        
        let pin = crypto.generate_pin();
        assert!(pin.is_ok());
        let pin = pin.unwrap();
        assert_eq!(pin.len(), config.pin_length as usize);
        assert!(pin.chars().all(|c| c.is_ascii_digit()));
    }
}