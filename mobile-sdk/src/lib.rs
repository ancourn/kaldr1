//! Quantum DAG Blockchain Mobile SDK
//! 
//! A comprehensive SDK for mobile applications to interact with the Quantum DAG Blockchain.

pub mod client;
pub mod wallet;
pub mod network;
pub mod storage;
pub mod crypto;
pub mod types;
pub mod utils;

pub use client::*;
pub use wallet::*;
pub use network::*;
pub use storage::*;
pub use crypto::*;
pub use types::*;
pub use utils::*;

/// SDK Configuration
#[derive(Debug, Clone)]
pub struct SDKConfig {
    /// Network configuration
    pub network: NetworkConfig,
    /// Security configuration
    pub security: SecurityConfig,
    /// Storage configuration
    pub storage: StorageConfig,
    /// Logging configuration
    pub logging: LoggingConfig,
}

impl Default for SDKConfig {
    fn default() -> Self {
        Self {
            network: NetworkConfig::default(),
            security: SecurityConfig::default(),
            storage: StorageConfig::default(),
            logging: LoggingConfig::default(),
        }
    }
}

/// Network configuration
#[derive(Debug, Clone)]
pub struct NetworkConfig {
    /// Node URLs
    pub node_urls: Vec<String>,
    /// WebSocket URLs
    pub ws_urls: Vec<String>,
    /// Network type
    pub network_type: NetworkType,
    /// Timeout in seconds
    pub timeout_secs: u64,
    /// Maximum retry attempts
    pub max_retries: u32,
    /// Request delay between retries
    pub retry_delay_ms: u64,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            node_urls: vec!["https://api.quantum-dag.com".to_string()],
            ws_urls: vec!["wss://api.quantum-dag.com/ws".to_string()],
            network_type: NetworkType::Mainnet,
            timeout_secs: 30,
            max_retries: 3,
            retry_delay_ms: 1000,
        }
    }
}

/// Network types
#[derive(Debug, Clone, PartialEq)]
pub enum NetworkType {
    Mainnet,
    Testnet,
    Devnet,
    Custom(String),
}

/// Security configuration
#[derive(Debug, Clone)]
pub struct SecurityConfig {
    /// Enable encryption
    pub enable_encryption: bool,
    /// Key derivation iterations
    pub key_derivation_iterations: u32,
    /// Enable biometric authentication
    pub enable_biometric: bool,
    /// Enable face ID
    pub enable_face_id: bool,
    /// Enable touch ID
    pub enable_touch_id: bool,
    /// Enable PIN protection
    pub enable_pin: bool,
    /// PIN length
    pub pin_length: u8,
    /// Session timeout in minutes
    pub session_timeout_mins: u64,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            enable_encryption: true,
            key_derivation_iterations: 100000,
            enable_biometric: true,
            enable_face_id: true,
            enable_touch_id: true,
            enable_pin: true,
            pin_length: 6,
            session_timeout_mins: 30,
        }
    }
}

/// Storage configuration
#[derive(Debug, Clone)]
pub struct StorageConfig {
    /// Enable caching
    pub enable_cache: bool,
    /// Cache size in MB
    pub cache_size_mb: u64,
    /// Database path
    pub database_path: Option<String>,
    /// Enable backup
    pub enable_backup: bool,
    /// Backup interval in hours
    pub backup_interval_hours: u64,
    /// Maximum backup files
    pub max_backup_files: u32,
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            enable_cache: true,
            cache_size_mb: 50,
            database_path: None,
            enable_backup: true,
            backup_interval_hours: 24,
            max_backup_files: 10,
        }
    }
}

/// Logging configuration
#[derive(Debug, Clone)]
pub struct LoggingConfig {
    /// Enable logging
    pub enable_logging: bool,
    /// Log level
    pub log_level: LogLevel,
    /// Enable console logging
    pub enable_console: bool,
    /// Enable file logging
    pub enable_file: bool,
    /// Log file path
    pub log_file_path: Option<String>,
    /// Maximum log file size in MB
    pub max_log_size_mb: u64,
    /// Maximum log files
    pub max_log_files: u32,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            enable_logging: true,
            log_level: LogLevel::Info,
            enable_console: true,
            enable_file: false,
            log_file_path: None,
            max_log_size_mb: 10,
            max_log_files: 5,
        }
    }
}

/// Log levels
#[derive(Debug, Clone, PartialEq)]
pub enum LogLevel {
    Error,
    Warn,
    Info,
    Debug,
    Trace,
}

/// SDK Result type
pub type SDKResult<T> = Result<T, SDKError>;

/// SDK Error types
#[derive(Debug, thiserror::Error)]
pub enum SDKError {
    #[error("Network error: {0}")]
    Network(String),
    #[error("Wallet error: {0}")]
    Wallet(String),
    #[error("Crypto error: {0}")]
    Crypto(String),
    #[error("Storage error: {0}")]
    Storage(String),
    #[error("Configuration error: {0}")]
    Config(String),
    #[error("Validation error: {0}")]
    Validation(String),
    #[error("Authentication error: {0}")]
    Auth(String),
    #[error("Serialization error: {0}")]
    Serialization(String),
    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<reqwest::Error> for SDKError {
    fn from(error: reqwest::Error) -> Self {
        SDKError::Network(error.to_string())
    }
}

impl From<serde_json::Error> for SDKError {
    fn from(error: serde_json::Error) -> Self {
        SDKError::Serialization(error.to_string())
    }
}

impl From<std::io::Error> for SDKError {
    fn from(error: std::io::Error) -> Self {
        SDKError::Storage(error.to_string())
    }
}

/// SDK Builder
pub struct SDKBuilder {
    config: SDKConfig,
}

impl SDKBuilder {
    /// Create new SDK builder
    pub fn new() -> Self {
        Self {
            config: SDKConfig::default(),
        }
    }

    /// Set network configuration
    pub fn network(mut self, network: NetworkConfig) -> Self {
        self.config.network = network;
        self
    }

    /// Set security configuration
    pub fn security(mut self, security: SecurityConfig) -> Self {
        self.config.security = security;
        self
    }

    /// Set storage configuration
    pub fn storage(mut self, storage: StorageConfig) -> Self {
        self.config.storage = storage;
        self
    }

    /// Set logging configuration
    pub fn logging(mut self, logging: LoggingConfig) -> Self {
        self.config.logging = logging;
        self
    }

    /// Build the SDK
    pub fn build(self) -> SDKResult<QuantumDAGSDK> {
        QuantumDAGSDK::new(self.config)
    }
}

impl Default for SDKBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Main SDK class
pub struct QuantumDAGSDK {
    config: SDKConfig,
    client: Arc<MobileClient>,
    wallet_manager: Arc<WalletManager>,
    storage: Arc<SecureStorage>,
    crypto: Arc<CryptoService>,
}

impl QuantumDAGSDK {
    /// Create new SDK instance
    pub fn new(config: SDKConfig) -> SDKResult<Self> {
        // Initialize storage
        let storage = Arc::new(SecureStorage::new(&config.storage)?);
        
        // Initialize crypto service
        let crypto = Arc::new(CryptoService::new(&config.security)?);
        
        // Initialize network client
        let client = Arc::new(MobileClient::new(&config.network, crypto.clone())?);
        
        // Initialize wallet manager
        let wallet_manager = Arc::new(WalletManager::new(storage.clone(), crypto.clone())?);
        
        Ok(Self {
            config,
            client,
            wallet_manager,
            storage,
            crypto,
        })
    }

    /// Get SDK configuration
    pub fn config(&self) -> &SDKConfig {
        &self.config
    }

    /// Get client instance
    pub fn client(&self) -> &MobileClient {
        &self.client
    }

    /// Get wallet manager
    pub fn wallet_manager(&self) -> &WalletManager {
        &self.wallet_manager
    }

    /// Get storage instance
    pub fn storage(&self) -> &SecureStorage {
        &self.storage
    }

    /// Get crypto service
    pub fn crypto(&self) -> &CryptoService {
        &self.crypto
    }

    /// Create new wallet
    pub async fn create_wallet(&self, passphrase: &str) -> SDKResult<Wallet> {
        self.wallet_manager.create_wallet(passphrase).await
    }

    /// Import wallet from mnemonic
    pub async fn import_wallet(&self, mnemonic: &str, passphrase: &str) -> SDKResult<Wallet> {
        self.wallet_manager.import_wallet(mnemonic, passphrase).await
    }

    /// Get current wallet
    pub async fn get_current_wallet(&self) -> SDKResult<Option<Wallet>> {
        self.wallet_manager.get_current_wallet().await
    }

    /// Get wallet balance
    pub async fn get_balance(&self, address: &str) -> SDKResult<u64> {
        self.client.get_balance(address).await
    }

    /// Send transaction
    pub async fn send_transaction(
        &self,
        to: &str,
        amount: u64,
        fee: Option<u64>,
    ) -> SDKResult<TransactionHash> {
        let wallet = self.wallet_manager.get_current_wallet().await?
            .ok_or_else(|| SDKError::Wallet("No wallet loaded".to_string()))?;
        
        let transaction = TransactionBuilder::new()
            .from_wallet(&wallet)
            .to(to)
            .amount(amount)
            .fee(fee.unwrap_or(1000))
            .build()?;
        
        self.client.send_transaction(&transaction).await
    }

    /// Get transaction status
    pub async fn get_transaction_status(&self, hash: &str) -> SDKResult<TransactionStatus> {
        self.client.get_transaction_status(hash).await
    }

    /// Get blockchain status
    pub async fn get_blockchain_status(&self) -> SDKResult<BlockchainStatus> {
        self.client.get_blockchain_status().await
    }

    /// Get network info
    pub async fn get_network_info(&self) -> SDKResult<NetworkInfo> {
        self.client.get_network_info().await
    }

    /// Check node health
    pub async fn check_node_health(&self) -> SDKResult<NodeHealth> {
        self.client.check_node_health().await
    }

    /// Get connected peers
    pub async fn get_connected_peers(&self) -> SDKResult<Vec<Peer>> {
        self.client.get_connected_peers().await
    }

    /// Backup wallet
    pub async fn backup_wallet(&self, backup_path: &str) -> SDKResult<()> {
        self.wallet_manager.backup_wallet(backup_path).await
    }

    /// Restore wallet from backup
    pub async fn restore_wallet(&self, backup_path: &str, passphrase: &str) -> SDKResult<Wallet> {
        self.wallet_manager.restore_wallet(backup_path, passphrase).await
    }

    /// Clear all data
    pub async fn clear_all_data(&self) -> SDKResult<()> {
        self.wallet_manager.clear_all_wallets().await?;
        self.storage.clear_all().await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_sdk_creation() {
        let config = SDKConfig::default();
        let sdk = QuantumDAGSDK::new(config);
        assert!(sdk.is_ok());
    }

    #[tokio::test]
    async fn test_sdk_builder() {
        let sdk = SDKBuilder::new()
            .network(NetworkConfig::default())
            .security(SecurityConfig::default())
            .storage(StorageConfig::default())
            .logging(LoggingConfig::default())
            .build();
        
        assert!(sdk.is_ok());
    }

    #[test]
    fn test_sdk_config_defaults() {
        let config = SDKConfig::default();
        assert_eq!(config.network.network_type, NetworkType::Mainnet);
        assert_eq!(config.security.enable_encryption, true);
        assert_eq!(config.storage.enable_cache, true);
        assert_eq!(config.logging.log_level, LogLevel::Info);
    }
}