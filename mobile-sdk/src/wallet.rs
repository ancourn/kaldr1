//! Wallet management for the Mobile SDK

use std::collections::HashMap;
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::types::*;
use crate::crypto::{CryptoService, KeyPair, EncryptedData, SessionToken};
use crate::storage::SecureStorage;
use crate::{SDKResult, SDKError};

/// Wallet manager
pub struct WalletManager {
    storage: Arc<SecureStorage>,
    crypto: Arc<CryptoService>,
    current_wallet_id: Option<String>,
}

impl WalletManager {
    /// Create new wallet manager
    pub fn new(storage: Arc<SecureStorage>, crypto: Arc<CryptoService>) -> SDKResult<Self> {
        Ok(Self {
            storage,
            crypto,
            current_wallet_id: None,
        })
    }

    /// Create new wallet
    pub async fn create_wallet(&self, passphrase: &str) -> SDKResult<Wallet> {
        // Generate mnemonic
        let mnemonic = self.crypto.generate_mnemonic()?;
        
        // Generate seed from mnemonic
        let seed = self.crypto.mnemonic_to_seed(&mnemonic, "")?;
        
        // Generate key pair
        let keypair = self.crypto.generate_key_pair(&seed)?;
        
        // Create wallet
        let wallet = Wallet {
            id: Uuid::new_v4().to_string(),
            name: "My Wallet".to_string(),
            address: keypair.address.clone(),
            public_key: hex::encode(&keypair.public_key),
            mnemonic,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            is_active: true,
            metadata: HashMap::new(),
        };
        
        // Encrypt private key
        let encryption_key = self.crypto.derive_encryption_key(passphrase, b"salt")?;
        let encrypted_private_key = self.crypto.encrypt(&keypair.private_key, &encryption_key)?;
        
        // Store wallet data
        let wallet_data = WalletData {
            id: wallet.id.clone(),
            name: wallet.name.clone(),
            address: wallet.address.clone(),
            public_key: wallet.public_key.clone(),
            encrypted_private_key,
            created_at: wallet.created_at,
            updated_at: wallet.updated_at,
            is_active: wallet.is_active,
            metadata: wallet.metadata.clone(),
        };
        
        self.storage.store_wallet(&wallet_data).await?;
        
        // Set as current wallet
        self.current_wallet_id = Some(wallet.id.clone());
        self.storage.set_current_wallet_id(&wallet.id).await?;
        
        Ok(wallet)
    }

    /// Import wallet from mnemonic
    pub async fn import_wallet(&self, mnemonic: &str, passphrase: &str) -> SDKResult<Wallet> {
        // Validate mnemonic
        if !self.crypto.validate_mnemonic(mnemonic)? {
            return Err(SDKError::Wallet("Invalid mnemonic phrase".to_string()));
        }
        
        // Generate seed from mnemonic
        let seed = self.crypto.mnemonic_to_seed(mnemonic, "")?;
        
        // Generate key pair
        let keypair = self.crypto.generate_key_pair(&seed)?;
        
        // Create wallet
        let wallet = Wallet {
            id: Uuid::new_v4().to_string(),
            name: "Imported Wallet".to_string(),
            address: keypair.address.clone(),
            public_key: hex::encode(&keypair.public_key),
            mnemonic: mnemonic.to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            is_active: true,
            metadata: HashMap::new(),
        };
        
        // Encrypt private key
        let encryption_key = self.crypto.derive_encryption_key(passphrase, b"salt")?;
        let encrypted_private_key = self.crypto.encrypt(&keypair.private_key, &encryption_key)?;
        
        // Store wallet data
        let wallet_data = WalletData {
            id: wallet.id.clone(),
            name: wallet.name.clone(),
            address: wallet.address.clone(),
            public_key: wallet.public_key.clone(),
            encrypted_private_key,
            created_at: wallet.created_at,
            updated_at: wallet.updated_at,
            is_active: wallet.is_active,
            metadata: wallet.metadata.clone(),
        };
        
        self.storage.store_wallet(&wallet_data).await?;
        
        // Set as current wallet
        self.current_wallet_id = Some(wallet.id.clone());
        self.storage.set_current_wallet_id(&wallet.id).await?;
        
        Ok(wallet)
    }

    /// Get current wallet
    pub async fn get_current_wallet(&self) -> SDKResult<Option<Wallet>> {
        let wallet_id = match &self.current_wallet_id {
            Some(id) => id.clone(),
            None => {
                // Try to get from storage
                match self.storage.get_current_wallet_id().await? {
                    Some(id) => {
                        self.current_wallet_id = Some(id.clone());
                        id
                    },
                    None => return Ok(None),
                }
            },
        };
        
        let wallet_data = self.storage.get_wallet(&wallet_id).await?;
        let wallet = self.wallet_data_to_wallet(wallet_data)?;
        
        Ok(Some(wallet))
    }

    /// Get wallet by ID
    pub async fn get_wallet(&self, wallet_id: &str) -> SDKResult<Option<Wallet>> {
        let wallet_data = self.storage.get_wallet(wallet_id).await?;
        match wallet_data {
            Some(data) => Ok(Some(self.wallet_data_to_wallet(data)?)),
            None => Ok(None),
        }
    }

    /// List all wallets
    pub async fn list_wallets(&self) -> SDKResult<Vec<Wallet>> {
        let wallet_data_list = self.storage.list_wallets().await?;
        let mut wallets = Vec::new();
        
        for wallet_data in wallet_data_list {
            wallets.push(self.wallet_data_to_wallet(wallet_data)?);
        }
        
        Ok(wallets)
    }

    /// Set current wallet
    pub async fn set_current_wallet(&mut self, wallet_id: &str) -> SDKResult<()> {
        // Check if wallet exists
        let wallet_data = self.storage.get_wallet(wallet_id).await?;
        if wallet_data.is_none() {
            return Err(SDKError::Wallet("Wallet not found".to_string()));
        }
        
        self.current_wallet_id = Some(wallet_id.to_string());
        self.storage.set_current_wallet_id(wallet_id).await?;
        
        Ok(())
    }

    /// Update wallet name
    pub async fn update_wallet_name(&self, wallet_id: &str, name: &str) -> SDKResult<()> {
        let mut wallet_data = self.storage.get_wallet(wallet_id).await?
            .ok_or_else(|| SDKError::Wallet("Wallet not found".to_string()))?;
        
        wallet_data.name = name.to_string();
        wallet_data.updated_at = Utc::now();
        
        self.storage.update_wallet(&wallet_data).await?;
        
        Ok(())
    }

    /// Delete wallet
    pub async fn delete_wallet(&mut self, wallet_id: &str) -> SDKResult<()> {
        // Check if it's the current wallet
        if let Some(current_id) = &self.current_wallet_id {
            if current_id == wallet_id {
                self.current_wallet_id = None;
                self.storage.remove_current_wallet_id().await?;
            }
        }
        
        self.storage.delete_wallet(wallet_id).await?;
        
        Ok(())
    }

    /// Sign transaction
    pub async fn sign_transaction(&self, transaction: &UnsignedTransaction, passphrase: &str) -> SDKResult<Vec<u8>> {
        let wallet = self.get_current_wallet().await?
            .ok_or_else(|| SDKError::Wallet("No wallet loaded".to_string()))?;
        
        // Get wallet data
        let wallet_data = self.storage.get_wallet(&wallet.id).await?
            .ok_or_else(|| SDKError::Wallet("Wallet data not found".to_string()))?;
        
        // Decrypt private key
        let encryption_key = self.crypto.derive_encryption_key(passphrase, b"salt")?;
        let private_key = self.crypto.decrypt(&wallet_data.encrypted_private_key, &encryption_key)?;
        
        // Hash transaction
        let tx_hash = self.crypto.hash_transaction(transaction)?;
        
        // Sign transaction
        let signature = self.crypto.sign(&tx_hash, &private_key)?;
        
        Ok(signature)
    }

    /// Verify transaction signature
    pub async fn verify_transaction_signature(&self, transaction: &Transaction) -> SDKResult<bool> {
        let public_key = hex::decode(&transaction.sender)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        
        // Reconstruct unsigned transaction
        let unsigned_tx = UnsignedTransaction {
            sender: transaction.sender.clone(),
            receiver: transaction.receiver.clone(),
            amount: transaction.amount,
            fee: transaction.fee,
            nonce: transaction.nonce,
            timestamp: transaction.timestamp,
            metadata: transaction.metadata.clone(),
        };
        
        // Hash transaction
        let tx_hash = self.crypto.hash_transaction(&unsigned_tx)?;
        
        // Verify signature
        let signature = hex::decode(&transaction.signature)
            .map_err(|e| SDKError::Crypto(e.to_string()))?;
        
        self.crypto.verify_signature(&tx_hash, &signature, &public_key)
    }

    /// Backup wallet
    pub async fn backup_wallet(&self, backup_path: &str) -> SDKResult<()> {
        let wallet_data_list = self.storage.list_wallets().await?;
        
        let backup_data = WalletBackup {
            version: "1.0".to_string(),
            created_at: Utc::now(),
            wallets: wallet_data_list,
            current_wallet_id: self.current_wallet_id.clone(),
        };
        
        let backup_json = serde_json::to_string_pretty(&backup_data)
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        tokio::fs::write(backup_path, backup_json).await
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        
        Ok(())
    }

    /// Restore wallet from backup
    pub async fn restore_wallet(&self, backup_path: &str, passphrase: &str) -> SDKResult<Wallet> {
        let backup_content = tokio::fs::read_to_string(backup_path).await
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        
        let backup_data: WalletBackup = serde_json::from_str(&backup_content)
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        // Validate backup version
        if backup_data.version != "1.0" {
            return Err(SDKError::Wallet("Unsupported backup version".to_string()));
        }
        
        // Restore wallets
        for wallet_data in &backup_data.wallets {
            self.storage.store_wallet(wallet_data).await?;
        }
        
        // Set current wallet
        if let Some(current_id) = &backup_data.current_wallet_id {
            self.current_wallet_id = Some(current_id.clone());
            self.storage.set_current_wallet_id(current_id).await?;
        }
        
        // Get the current wallet
        self.get_current_wallet().await?
            .ok_or_else(|| SDKError::Wallet("Failed to restore wallet".to_string()))
    }

    /// Clear all wallets
    pub async fn clear_all_wallets(&mut self) -> SDKResult<()> {
        self.storage.clear_all_wallets().await?;
        self.current_wallet_id = None;
        self.storage.remove_current_wallet_id().await?;
        Ok(())
    }

    /// Change wallet passphrase
    pub async fn change_passphrase(&self, wallet_id: &str, old_passphrase: &str, new_passphrase: &str) -> SDKResult<()> {
        let mut wallet_data = self.storage.get_wallet(wallet_id).await?
            .ok_or_else(|| SDKError::Wallet("Wallet not found".to_string()))?;
        
        // Decrypt private key with old passphrase
        let old_key = self.crypto.derive_encryption_key(old_passphrase, b"salt")?;
        let private_key = self.crypto.decrypt(&wallet_data.encrypted_private_key, &old_key)?;
        
        // Encrypt private key with new passphrase
        let new_key = self.crypto.derive_encryption_key(new_passphrase, b"salt")?;
        wallet_data.encrypted_private_key = self.crypto.encrypt(&private_key, &new_key)?;
        wallet_data.updated_at = Utc::now();
        
        self.storage.update_wallet(&wallet_data).await?;
        
        Ok(())
    }

    /// Validate wallet passphrase
    pub async fn validate_passphrase(&self, wallet_id: &str, passphrase: &str) -> SDKResult<bool> {
        let wallet_data = self.storage.get_wallet(wallet_id).await?
            .ok_or_else(|| SDKError::Wallet("Wallet not found".to_string()))?;
        
        // Try to decrypt private key
        let encryption_key = self.crypto.derive_encryption_key(passphrase, b"salt")?;
        let result = self.crypto.decrypt(&wallet_data.encrypted_private_key, &encryption_key);
        
        Ok(result.is_ok())
    }

    /// Get wallet statistics
    pub async fn get_wallet_stats(&self) -> SDKResult<WalletStats> {
        let wallets = self.list_wallets().await?;
        let current_wallet = self.get_current_wallet().await?;
        
        Ok(WalletStats {
            total_wallets: wallets.len(),
            active_wallets: wallets.iter().filter(|w| w.is_active).count(),
            current_wallet_id: current_wallet.map(|w| w.id),
            total_addresses: wallets.len(),
            creation_date: wallets.first().map(|w| w.created_at),
        })
    }

    /// Convert wallet data to wallet
    fn wallet_data_to_wallet(&self, wallet_data: WalletData) -> SDKResult<Wallet> {
        // Note: We don't include the mnemonic in the converted wallet
        // for security reasons
        Ok(Wallet {
            id: wallet_data.id,
            name: wallet_data.name,
            address: wallet_data.address,
            public_key: wallet_data.public_key,
            mnemonic: "".to_string(), // Mnemonic is not stored in plain text
            created_at: wallet_data.created_at,
            updated_at: wallet_data.updated_at,
            is_active: wallet_data.is_active,
            metadata: wallet_data.metadata,
        })
    }
}

/// Wallet data for storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletData {
    pub id: String,
    pub name: String,
    pub address: String,
    pub public_key: String,
    pub encrypted_private_key: Vec<u8>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Wallet backup structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletBackup {
    pub version: String,
    pub created_at: DateTime<Utc>,
    pub wallets: Vec<WalletData>,
    pub current_wallet_id: Option<String>,
}

/// Wallet statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletStats {
    pub total_wallets: usize,
    pub active_wallets: usize,
    pub current_wallet_id: Option<String>,
    pub total_addresses: usize,
    pub creation_date: Option<DateTime<Utc>>,
}

/// Wallet session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletSession {
    pub wallet_id: String,
    pub session_token: SessionToken,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub is_active: bool,
}

impl WalletSession {
    /// Create new wallet session
    pub fn new(wallet_id: String, session_token: SessionToken) -> Self {
        Self {
            wallet_id,
            session_token,
            created_at: Utc::now(),
            expires_at: session_token.expires_at,
            is_active: true,
        }
    }

    /// Check if session is expired
    pub fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }

    /// Check if session is active
    pub fn is_active(&self) -> bool {
        self.is_active && !self.is_expired()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::CryptoService;
    use crate::storage::SecureStorage;
    use crate::SecurityConfig, StorageConfig;

    #[tokio::test]
    async fn test_wallet_manager_creation() {
        let storage = Arc::new(SecureStorage::new(&StorageConfig::default()).unwrap());
        let crypto = Arc::new(CryptoService::new(&SecurityConfig::default()).unwrap());
        let wallet_manager = WalletManager::new(storage, crypto);
        assert!(wallet_manager.is_ok());
    }

    #[tokio::test]
    async fn test_create_wallet() {
        let storage = Arc::new(SecureStorage::new(&StorageConfig::default()).unwrap());
        let crypto = Arc::new(CryptoService::new(&SecurityConfig::default()).unwrap());
        let wallet_manager = WalletManager::new(storage, crypto).unwrap();
        
        let wallet = wallet_manager.create_wallet("test_passphrase").await;
        assert!(wallet.is_ok());
        
        let wallet = wallet.unwrap();
        assert!(!wallet.id.is_empty());
        assert!(!wallet.address.is_empty());
        assert!(!wallet.public_key.is_empty());
        assert!(wallet.is_active);
    }

    #[tokio::test]
    async fn test_import_wallet() {
        let storage = Arc::new(SecureStorage::new(&StorageConfig::default()).unwrap());
        let crypto = Arc::new(CryptoService::new(&SecurityConfig::default()).unwrap());
        let wallet_manager = WalletManager::new(storage, crypto).unwrap();
        
        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let wallet = wallet_manager.import_wallet(mnemonic, "test_passphrase").await;
        assert!(wallet.is_ok());
        
        let wallet = wallet.unwrap();
        assert!(!wallet.id.is_empty());
        assert!(!wallet.address.is_empty());
    }

    #[tokio::test]
    async fn test_wallet_operations() {
        let storage = Arc::new(SecureStorage::new(&StorageConfig::default()).unwrap());
        let crypto = Arc::new(CryptoService::new(&SecurityConfig::default()).unwrap());
        let wallet_manager = WalletManager::new(storage, crypto).unwrap();
        
        // Create wallet
        let wallet = wallet_manager.create_wallet("test_passphrase").await.unwrap();
        
        // Get current wallet
        let current_wallet = wallet_manager.get_current_wallet().await.unwrap();
        assert!(current_wallet.is_some());
        assert_eq!(current_wallet.unwrap().id, wallet.id);
        
        // List wallets
        let wallets = wallet_manager.list_wallets().await.unwrap();
        assert_eq!(wallets.len(), 1);
        
        // Get wallet stats
        let stats = wallet_manager.get_wallet_stats().await.unwrap();
        assert_eq!(stats.total_wallets, 1);
        assert_eq!(stats.active_wallets, 1);
    }
}