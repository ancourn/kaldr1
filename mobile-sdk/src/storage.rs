//! Secure storage for the Mobile SDK

use std::collections::HashMap;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use tokio::fs;
use tokio::io::AsyncReadExt;
use tokio::io::AsyncWriteExt;

use crate::wallet::WalletData;
use crate::{StorageConfig, SDKResult, SDKError};

/// Secure storage implementation
pub struct SecureStorage {
    config: StorageConfig,
    base_path: PathBuf,
    encryption_key: Option<Vec<u8>>,
}

impl SecureStorage {
    /// Create new secure storage
    pub fn new(config: &StorageConfig) -> SDKResult<Self> {
        let base_path = if let Some(ref path) = config.database_path {
            PathBuf::from(path)
        } else {
            // Use default path
            let mut path = dirs::data_dir()
                .ok_or_else(|| SDKError::Storage("Could not get data directory".to_string()))?;
            path.push("quantum-dag-sdk");
            path
        };
        
        // Create directory if it doesn't exist
        std::fs::create_dir_all(&base_path)
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        
        Ok(Self {
            config: config.clone(),
            base_path,
            encryption_key: None,
        })
    }

    /// Initialize storage with encryption key
    pub fn with_encryption_key(mut self, key: Vec<u8>) -> Self {
        self.encryption_key = Some(key);
        self
    }

    /// Store wallet data
    pub async fn store_wallet(&self, wallet_data: &WalletData) -> SDKResult<()> {
        let wallet_path = self.get_wallet_path(&wallet_data.id);
        let wallet_json = serde_json::to_string(wallet_data)
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        let data_to_store = if let Some(ref key) = self.encryption_key {
            self.encrypt_data(&wallet_json, key)?
        } else {
            wallet_json.into_bytes()
        };
        
        self.write_file(&wallet_path, &data_to_store).await?;
        
        Ok(())
    }

    /// Get wallet data
    pub async fn get_wallet(&self, wallet_id: &str) -> SDKResult<Option<WalletData>> {
        let wallet_path = self.get_wallet_path(wallet_id);
        
        if !self.file_exists(&wallet_path).await? {
            return Ok(None);
        }
        
        let data = self.read_file(&wallet_path).await?;
        let wallet_json = if let Some(ref key) = self.encryption_key {
            self.decrypt_data(&data, key)?
        } else {
            String::from_utf8(data)?
        };
        
        let wallet_data: WalletData = serde_json::from_str(&wallet_json)
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(Some(wallet_data))
    }

    /// Update wallet data
    pub async fn update_wallet(&self, wallet_data: &WalletData) -> SDKResult<()> {
        self.store_wallet(wallet_data).await
    }

    /// Delete wallet
    pub async fn delete_wallet(&self, wallet_id: &str) -> SDKResult<()> {
        let wallet_path = self.get_wallet_path(wallet_id);
        
        if self.file_exists(&wallet_path).await? {
            fs::remove_file(&wallet_path).await
                .map_err(|e| SDKError::Storage(e.to_string()))?;
        }
        
        Ok(())
    }

    /// List all wallets
    pub async fn list_wallets(&self) -> SDKResult<Vec<WalletData>> {
        let wallets_dir = self.base_path.join("wallets");
        
        if !self.dir_exists(&wallets_dir).await? {
            return Ok(Vec::new());
        }
        
        let mut entries = fs::read_dir(&wallets_dir).await
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        
        let mut wallets = Vec::new();
        
        while let Some(entry) = entries.next_entry().await
            .map_err(|e| SDKError::Storage(e.to_string()))?
        {
            let path = entry.path();
            
            if path.extension().and_then(|s| s.to_str()) == Some("wallet") {
                let data = self.read_file(&path).await?;
                let wallet_json = if let Some(ref key) = self.encryption_key {
                    self.decrypt_data(&data, key)?
                } else {
                    String::from_utf8(data)?
                };
                
                let wallet_data: WalletData = serde_json::from_str(&wallet_json)
                    .map_err(|e| SDKError::Serialization(e.to_string()))?;
                
                wallets.push(wallet_data);
            }
        }
        
        Ok(wallets)
    }

    /// Set current wallet ID
    pub async fn set_current_wallet_id(&self, wallet_id: &str) -> SDKResult<()> {
        let current_wallet_path = self.base_path.join("current_wallet.txt");
        let data = wallet_id.as_bytes();
        self.write_file(&current_wallet_path, data).await?;
        Ok(())
    }

    /// Get current wallet ID
    pub async fn get_current_wallet_id(&self) -> SDKResult<Option<String>> {
        let current_wallet_path = self.base_path.join("current_wallet.txt");
        
        if !self.file_exists(&current_wallet_path).await? {
            return Ok(None);
        }
        
        let data = self.read_file(&current_wallet_path).await?;
        let wallet_id = String::from_utf8(data)?;
        Ok(Some(wallet_id))
    }

    /// Remove current wallet ID
    pub async fn remove_current_wallet_id(&self) -> SDKResult<()> {
        let current_wallet_path = self.base_path.join("current_wallet.txt");
        
        if self.file_exists(&current_wallet_path).await? {
            fs::remove_file(&current_wallet_path).await
                .map_err(|e| SDKError::Storage(e.to_string()))?;
        }
        
        Ok(())
    }

    /// Clear all wallets
    pub async fn clear_all_wallets(&self) -> SDKResult<()> {
        let wallets_dir = self.base_path.join("wallets");
        
        if self.dir_exists(&wallets_dir).await? {
            fs::remove_dir_all(&wallets_dir).await
                .map_err(|e| SDKError::Storage(e.to_string()))?;
        }
        
        // Remove current wallet ID
        self.remove_current_wallet_id().await?;
        
        Ok(())
    }

    /// Store cache data
    pub async fn store_cache(&self, key: &str, data: &[u8], ttl_seconds: u64) -> SDKResult<()> {
        if !self.config.enable_cache {
            return Ok(());
        }
        
        let cache_dir = self.base_path.join("cache");
        if !self.dir_exists(&cache_dir).await? {
            fs::create_dir_all(&cache_dir).await
                .map_err(|e| SDKError::Storage(e.to_string()))?;
        }
        
        let cache_entry = CacheEntry {
            key: key.to_string(),
            data: data.to_vec(),
            created_at: Utc::now(),
            expires_at: Utc::now() + chrono::Duration::seconds(ttl_seconds as i64),
        };
        
        let cache_path = cache_dir.join(format!("{}.cache", key));
        let cache_json = serde_json::to_string(&cache_entry)
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        self.write_file(&cache_path, cache_json.as_bytes()).await?;
        
        Ok(())
    }

    /// Get cache data
    pub async fn get_cache(&self, key: &str) -> SDKResult<Option<Vec<u8>>> {
        if !self.config.enable_cache {
            return Ok(None);
        }
        
        let cache_path = self.base_path.join("cache").join(format!("{}.cache", key));
        
        if !self.file_exists(&cache_path).await? {
            return Ok(None);
        }
        
        let data = self.read_file(&cache_path).await?;
        let cache_json = String::from_utf8(data)?;
        let cache_entry: CacheEntry = serde_json::from_str(&cache_json)
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        // Check if cache entry is expired
        if Utc::now() > cache_entry.expires_at {
            fs::remove_file(&cache_path).await
                .map_err(|e| SDKError::Storage(e.to_string()))?;
            return Ok(None);
        }
        
        Ok(Some(cache_entry.data))
    }

    /// Clear expired cache entries
    pub async fn clear_expired_cache(&self) -> SDKResult<()> {
        if !self.config.enable_cache {
            return Ok(());
        }
        
        let cache_dir = self.base_path.join("cache");
        
        if !self.dir_exists(&cache_dir).await? {
            return Ok(());
        }
        
        let mut entries = fs::read_dir(&cache_dir).await
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        
        let now = Utc::now();
        
        while let Some(entry) = entries.next_entry().await
            .map_err(|e| SDKError::Storage(e.to_string()))?
        {
            let path = entry.path();
            
            if path.extension().and_then(|s| s.to_str()) == Some("cache") {
                let data = self.read_file(&path).await?;
                let cache_json = String::from_utf8(data)?;
                let cache_entry: CacheEntry = serde_json::from_str(&cache_json)
                    .map_err(|e| SDKError::Serialization(e.to_string()))?;
                
                if now > cache_entry.expires_at {
                    fs::remove_file(&path).await
                        .map_err(|e| SDKError::Storage(e.to_string()))?;
                }
            }
        }
        
        Ok(())
    }

    /// Clear all cache
    pub async fn clear_all_cache(&self) -> SDKResult<()> {
        let cache_dir = self.base_path.join("cache");
        
        if self.dir_exists(&cache_dir).await? {
            fs::remove_dir_all(&cache_dir).await
                .map_err(|e| SDKError::Storage(e.to_string()))?;
        }
        
        Ok(())
    }

    /// Create backup
    pub async fn create_backup(&self) -> SDKResult<String> {
        let backup_id = Uuid::new_v4().to_string();
        let backup_dir = self.base_path.join("backups");
        
        if !self.dir_exists(&backup_dir).await? {
            fs::create_dir_all(&backup_dir).await
                .map_err(|e| SDKError::Storage(e.to_string()))?;
        }
        
        let backup_path = backup_dir.join(format!("{}.backup", backup_id));
        
        // Create backup archive
        let mut archive = zip::ZipWriter::new(fs::File::create(&backup_path).await?);
        
        // Add wallets
        let wallets_dir = self.base_path.join("wallets");
        if self.dir_exists(&wallets_dir).await? {
            self.add_directory_to_archive(&mut archive, &wallets_dir, "wallets").await?;
        }
        
        // Add current wallet file
        let current_wallet_path = self.base_path.join("current_wallet.txt");
        if self.file_exists(&current_wallet_path).await? {
            let mut file = fs::File::open(&current_wallet_path).await?;
            let mut data = Vec::new();
            file.read_to_end(&mut data).await?;
            archive.start_file("current_wallet.txt", zip::write::FileOptions::default())?;
            archive.write_all(&data).await?;
        }
        
        archive.finish().await?;
        
        Ok(backup_id)
    }

    /// Restore from backup
    pub async fn restore_from_backup(&self, backup_id: &str) -> SDKResult<()> {
        let backup_path = self.base_path.join("backups").join(format!("{}.backup", backup_id));
        
        if !self.file_exists(&backup_path).await? {
            return Err(SDKError::Storage("Backup not found".to_string()));
        }
        
        let mut archive = zip::ZipArchive::new(fs::File::open(&backup_path).await?)?;
        
        // Clear existing data
        self.clear_all_wallets().await?;
        
        // Extract backup
        for i in 0..archive.len() {
            let mut file = archive.by_index(i).unwrap();
            let out_path = self.base_path.join(file.name());
            
            if file.name().ends_with('/') {
                fs::create_dir_all(&out_path).await?;
            } else {
                if let Some(parent) = out_path.parent() {
                    fs::create_dir_all(parent).await?;
                }
                
                let mut out_file = fs::File::create(&out_path).await?;
                tokio::io::copy(&mut file, &mut out_file).await?;
            }
        }
        
        Ok(())
    }

    /// Get storage statistics
    pub async fn get_storage_stats(&self) -> SDKResult<StorageStats> {
        let mut total_size = 0;
        let mut wallet_count = 0;
        let mut cache_count = 0;
        let mut backup_count = 0;
        
        // Count wallets
        let wallets_dir = self.base_path.join("wallets");
        if self.dir_exists(&wallets_dir).await? {
            let mut entries = fs::read_dir(&wallets_dir).await?;
            while let Some(entry) = entries.next_entry().await? {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("wallet") {
                    wallet_count += 1;
                    total_size += entry.metadata().await?.len();
                }
            }
        }
        
        // Count cache entries
        let cache_dir = self.base_path.join("cache");
        if self.dir_exists(&cache_dir).await? {
            let mut entries = fs::read_dir(&cache_dir).await?;
            while let Some(entry) = entries.next_entry().await? {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("cache") {
                    cache_count += 1;
                    total_size += entry.metadata().await?.len();
                }
            }
        }
        
        // Count backups
        let backups_dir = self.base_path.join("backups");
        if self.dir_exists(&backups_dir).await? {
            let mut entries = fs::read_dir(&backups_dir).await?;
            while let Some(entry) = entries.next_entry().await? {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("backup") {
                    backup_count += 1;
                    total_size += entry.metadata().await?.len();
                }
            }
        }
        
        Ok(StorageStats {
            total_size_bytes: total_size,
            wallet_count,
            cache_count,
            backup_count,
            base_path: self.base_path.to_string_lossy(),
        })
    }

    /// Clear all data
    pub async fn clear_all(&self) -> SDKResult<()> {
        // Clear wallets
        self.clear_all_wallets().await?;
        
        // Clear cache
        self.clear_all_cache().await?;
        
        // Clear backups
        let backups_dir = self.base_path.join("backups");
        if self.dir_exists(&backups_dir).await? {
            fs::remove_dir_all(&backups_dir).await?;
        }
        
        Ok(())
    }

    // Helper methods

    fn get_wallet_path(&self, wallet_id: &str) -> PathBuf {
        let wallets_dir = self.base_path.join("wallets");
        wallets_dir.join(format!("{}.wallet", wallet_id))
    }

    async fn file_exists(&self, path: &PathBuf) -> SDKResult<bool> {
        Ok(path.exists())
    }

    async fn dir_exists(&self, path: &PathBuf) -> SDKResult<bool> {
        Ok(path.exists() && path.is_dir())
    }

    async fn read_file(&self, path: &PathBuf) -> SDKResult<Vec<u8>> {
        let mut file = fs::File::open(path).await
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        let mut data = Vec::new();
        file.read_to_end(&mut data).await
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        Ok(data)
    }

    async fn write_file(&self, path: &PathBuf, data: &[u8]) -> SDKResult<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await
                .map_err(|e| SDKError::Storage(e.to_string()))?;
        }
        
        let mut file = fs::File::create(path).await
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        file.write_all(data).await
            .map_err(|e| SDKError::Storage(e.to_string()))?;
        Ok(())
    }

    fn encrypt_data(&self, data: &str, key: &[u8]) -> SDKResult<Vec<u8>> {
        // Simple XOR encryption for demonstration
        // In production, use proper encryption like AES
        let mut encrypted = Vec::with_capacity(data.len());
        for (i, byte) in data.bytes().enumerate() {
            encrypted.push(byte ^ key[i % key.len()]);
        }
        Ok(encrypted)
    }

    fn decrypt_data(&self, data: &[u8], key: &[u8]) -> SDKResult<String> {
        // Simple XOR decryption for demonstration
        let mut decrypted = Vec::with_capacity(data.len());
        for (i, byte) in data.iter().enumerate() {
            decrypted.push(byte ^ key[i % key.len()]);
        }
        String::from_utf8(decrypted)
            .map_err(|e| SDKError::Storage(e.to_string()))
    }

    async fn add_directory_to_archive<W: tokio::io::AsyncWrite + Unpin>(
        &self,
        archive: &mut zip::ZipWriter<W>,
        dir_path: &PathBuf,
        archive_path: &str,
    ) -> SDKResult<()> {
        let mut entries = fs::read_dir(dir_path).await?;
        
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            let relative_path = path.strip_prefix(dir_path)?;
            let archive_file_path = format!("{}/{}", archive_path, relative_path.to_string_lossy());
            
            if path.is_dir() {
                self.add_directory_to_archive(archive, &path, &archive_file_path).await?;
            } else {
                let mut file = fs::File::open(&path).await?;
                let mut data = Vec::new();
                file.read_to_end(&mut data).await?;
                
                archive.start_file(&archive_file_path, zip::write::FileOptions::default())?;
                archive.write_all(&data).await?;
            }
        }
        
        Ok(())
    }
}

/// Cache entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
    pub key: String,
    pub data: Vec<u8>,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

/// Storage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_size_bytes: u64,
    pub wallet_count: u32,
    pub cache_count: u32,
    pub backup_count: u32,
    pub base_path: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_secure_storage_creation() {
        let temp_dir = TempDir::new().unwrap();
        let config = StorageConfig {
            database_path: Some(temp_dir.path().to_string_lossy().to_string()),
            ..Default::default()
        };
        
        let storage = SecureStorage::new(&config);
        assert!(storage.is_ok());
    }

    #[tokio::test]
    async fn test_wallet_storage() {
        let temp_dir = TempDir::new().unwrap();
        let config = StorageConfig {
            database_path: Some(temp_dir.path().to_string_lossy().to_string()),
            ..Default::default()
        };
        
        let storage = SecureStorage::new(&config).unwrap();
        
        // Create test wallet data
        let wallet_data = WalletData {
            id: "test_wallet".to_string(),
            name: "Test Wallet".to_string(),
            address: "test_address".to_string(),
            public_key: "test_public_key".to_string(),
            encrypted_private_key: vec![1, 2, 3, 4],
            created_at: Utc::now(),
            updated_at: Utc::now(),
            is_active: true,
            metadata: HashMap::new(),
        };
        
        // Store wallet
        storage.store_wallet(&wallet_data).await.unwrap();
        
        // Get wallet
        let retrieved_wallet = storage.get_wallet("test_wallet").await.unwrap();
        assert!(retrieved_wallet.is_some());
        assert_eq!(retrieved_wallet.unwrap().id, wallet_data.id);
        
        // List wallets
        let wallets = storage.list_wallets().await.unwrap();
        assert_eq!(wallets.len(), 1);
        
        // Delete wallet
        storage.delete_wallet("test_wallet").await.unwrap();
        let retrieved_wallet = storage.get_wallet("test_wallet").await.unwrap();
        assert!(retrieved_wallet.is_none());
    }

    #[tokio::test]
    async fn test_cache_operations() {
        let temp_dir = TempDir::new().unwrap();
        let config = StorageConfig {
            database_path: Some(temp_dir.path().to_string_lossy().to_string()),
            enable_cache: true,
            ..Default::default()
        };
        
        let storage = SecureStorage::new(&config).unwrap();
        
        // Store cache
        let test_data = b"test_cache_data";
        storage.store_cache("test_key", test_data, 3600).await.unwrap();
        
        // Get cache
        let retrieved_data = storage.get_cache("test_key").await.unwrap();
        assert!(retrieved_data.is_some());
        assert_eq!(retrieved_data.unwrap(), test_data);
        
        // Clear cache
        storage.clear_all_cache().await.unwrap();
        let retrieved_data = storage.get_cache("test_key").await.unwrap();
        assert!(retrieved_data.is_none());
    }
}