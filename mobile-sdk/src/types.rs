//! Common types for the Quantum DAG Blockchain Mobile SDK

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// Transaction hash
pub type TransactionHash = String;

/// Block hash
pub type BlockHash = String;

/// Address
pub type Address = String;

/// Public key
pub type PublicKey = String;

/// Transaction status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
    Rejected,
    Expired,
}

/// Transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub hash: TransactionHash,
    pub sender: Address,
    pub receiver: Address,
    pub amount: u64,
    pub fee: u64,
    pub nonce: u64,
    pub timestamp: u64,
    pub signature: String,
    pub quantum_proof: QuantumProof,
    pub status: TransactionStatus,
    pub block_hash: Option<BlockHash>,
    pub confirmations: u32,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Quantum proof
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumProof {
    pub prime_hash: Vec<u8>,
    pub resistance_score: u8,
    pub proof_timestamp: u64,
}

/// Block
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub hash: BlockHash,
    pub previous_hash: Option<BlockHash>,
    pub height: u64,
    pub timestamp: u64,
    pub nonce: u64,
    pub difficulty: u32,
    pub transactions: Vec<Transaction>,
    pub transaction_count: u32,
    pub size_bytes: u64,
    pub validator: String,
    pub signature: String,
    pub quantum_resistance_score: f64,
}

/// Wallet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub id: String,
    pub name: String,
    pub address: Address,
    pub public_key: PublicKey,
    pub mnemonic: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Blockchain status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockchainStatus {
    pub total_transactions: u64,
    pub network_peers: u32,
    pub consensus_height: u64,
    pub quantum_resistance_score: f64,
    pub last_block_time: u64,
    pub network_hashrate: f64,
    pub difficulty: u64,
}

/// Network info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub network_id: String,
    pub version: String,
    pub protocol_version: String,
    pub total_nodes: u32,
    pub active_nodes: u32,
    pub total_supply: u64,
    pub circulating_supply: u64,
    pub block_time: u64,
    pub current_height: u64,
}

/// Node health
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeHealth {
    pub is_healthy: bool,
    pub uptime_seconds: u64,
    pub last_block_height: u64,
    pub connected_peers: u32,
    pub memory_usage_mb: u64,
    pub cpu_usage_percent: f64,
    pub disk_usage_gb: f64,
    pub network_latency_ms: u64,
}

/// Peer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Peer {
    pub id: String,
    pub address: String,
    pub port: u16,
    pub version: String,
    pub is_connected: bool,
    pub last_seen: DateTime<Utc>,
    pub reputation: f64,
    pub country: Option<String>,
    pub latency_ms: u64,
}

/// Unsigned transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnsignedTransaction {
    pub sender: Address,
    pub receiver: Address,
    pub amount: u64,
    pub fee: u64,
    pub nonce: u64,
    pub timestamp: u64,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Transaction builder
#[derive(Debug, Clone)]
pub struct TransactionBuilder {
    sender: Option<Address>,
    receiver: Option<Address>,
    amount: Option<u64>,
    fee: u64,
    nonce: Option<u64>,
    timestamp: Option<u64>,
    metadata: Option<HashMap<String, serde_json::Value>>,
}

impl TransactionBuilder {
    /// Create new transaction builder
    pub fn new() -> Self {
        Self {
            sender: None,
            receiver: None,
            amount: None,
            fee: 1000,
            nonce: None,
            timestamp: None,
            metadata: None,
        }
    }

    /// Set sender address
    pub fn from(mut self, address: &str) -> Self {
        self.sender = Some(address.to_string());
        self
    }

    /// Set sender from wallet
    pub fn from_wallet(mut self, wallet: &Wallet) -> Self {
        self.sender = Some(wallet.address.clone());
        self
    }

    /// Set receiver address
    pub fn to(mut self, address: &str) -> Self {
        self.receiver = Some(address.to_string());
        self
    }

    /// Set amount
    pub fn amount(mut self, amount: u64) -> Self {
        self.amount = Some(amount);
        self
    }

    /// Set fee
    pub fn fee(mut self, fee: u64) -> Self {
        self.fee = fee;
        self
    }

    /// Set nonce
    pub fn nonce(mut self, nonce: u64) -> Self {
        self.nonce = Some(nonce);
        self
    }

    /// Set timestamp
    pub fn timestamp(mut self, timestamp: u64) -> Self {
        self.timestamp = Some(timestamp);
        self
    }

    /// Set metadata
    pub fn metadata(mut self, metadata: HashMap<String, serde_json::Value>) -> Self {
        self.metadata = Some(metadata);
        self
    }

    /// Build unsigned transaction
    pub fn build(self) -> Result<UnsignedTransaction, String> {
        let sender = self.sender.ok_or("Sender address is required")?;
        let receiver = self.receiver.ok_or("Receiver address is required")?;
        let amount = self.amount.ok_or("Amount is required")?;
        
        Ok(UnsignedTransaction {
            sender,
            receiver,
            amount,
            fee: self.fee,
            nonce: self.nonce.unwrap_or(0),
            timestamp: self.timestamp.unwrap_or(Utc::now().timestamp() as u64),
            metadata: self.metadata,
        })
    }
}

impl Default for TransactionBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Transaction receipt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionReceipt {
    pub transaction_hash: TransactionHash,
    pub block_hash: Option<BlockHash>,
    pub block_number: Option<u64>,
    pub gas_used: u64,
    pub status: TransactionStatus,
    pub confirmations: u32,
    pub timestamp: DateTime<Utc>,
}

/// Account info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountInfo {
    pub address: Address,
    pub balance: u64,
    pub nonce: u64,
    pub transaction_count: u64,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
}

/// Network statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub total_nodes: u32,
    pub active_nodes: u32,
    pub total_transactions: u64,
    pub transactions_per_second: f64,
    pub average_block_time: f64,
    pub network_hashrate: f64,
    pub difficulty: u64,
    pub mem_pool_size: u32,
}

/// Gas price info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GasPriceInfo {
    pub slow: u64,
    pub average: u64,
    pub fast: u64,
    pub estimated_wait_time_slow: u64,
    pub estimated_wait_time_average: u64,
    pub estimated_wait_time_fast: u64,
}

/// Estimate gas response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EstimateGasResponse {
    pub gas_limit: u64,
    pub gas_price: u64,
    pub total_cost: u64,
    pub estimated_time: u64,
}

/// Blockchain event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockchainEvent {
    pub id: String,
    pub event_type: String,
    pub data: serde_json::Value,
    pub timestamp: DateTime<Utc>,
    pub block_number: Option<u64>,
    pub transaction_hash: Option<TransactionHash>,
}

/// Subscription info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionInfo {
    pub id: String,
    pub event_type: String,
    pub filter: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub is_active: bool,
    pub last_event: Option<DateTime<Utc>>,
}

/// API response wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
}

/// Paginated response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total: u64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

/// Filter options for transactions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionFilter {
    pub sender: Option<Address>,
    pub receiver: Option<Address>,
    pub status: Option<TransactionStatus>,
    pub min_amount: Option<u64>,
    pub max_amount: Option<u64>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub block_hash: Option<BlockHash>,
}

impl Default for TransactionFilter {
    fn default() -> Self {
        Self {
            sender: None,
            receiver: None,
            status: None,
            min_amount: None,
            max_amount: None,
            start_time: None,
            end_time: None,
            block_hash: None,
        }
    }
}

/// Sort options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SortOptions {
    pub field: String,
    pub direction: SortDirection,
}

impl SortOptions {
    pub fn new(field: &str, direction: SortDirection) -> Self {
        Self {
            field: field.to_string(),
            direction,
        }
    }
}

/// Sort direction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SortDirection {
    Asc,
    Desc,
}

/// Pagination options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationOptions {
    pub page: u32,
    pub per_page: u32,
}

impl PaginationOptions {
    pub fn new(page: u32, per_page: u32) -> Self {
        Self { page, per_page }
    }
}

impl Default for PaginationOptions {
    fn default() -> Self {
        Self::new(1, 20)
    }
}

/// Query options combining filter, sort, and pagination
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryOptions {
    pub filter: Option<TransactionFilter>,
    pub sort: Option<SortOptions>,
    pub pagination: Option<PaginationOptions>,
}

impl QueryOptions {
    pub fn new() -> Self {
        Self {
            filter: None,
            sort: None,
            pagination: None,
        }
    }

    pub fn with_filter(mut self, filter: TransactionFilter) -> Self {
        self.filter = Some(filter);
        self
    }

    pub fn with_sort(mut self, sort: SortOptions) -> Self {
        self.sort = Some(sort);
        self
    }

    pub fn with_pagination(mut self, pagination: PaginationOptions) -> Self {
        self.pagination = Some(pagination);
        self
    }
}

impl Default for QueryOptions {
    fn default() -> Self {
        Self::new()
    }
}

/// Error response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
    pub details: Option<HashMap<String, serde_json::Value>>,
    pub timestamp: DateTime<Utc>,
}

/// Version info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionInfo {
    pub sdk_version: String,
    pub protocol_version: String,
    pub minimum_required_version: String,
    pub release_date: DateTime<Utc>,
    pub changelog: Vec<String>,
}

/// Feature flags
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureFlags {
    pub enable_quantum_resistance: bool,
    pub enable_light_client: bool,
    pub enable_offline_mode: bool,
    pub enable_biometric: bool,
    pub enable_backup: bool,
    pub enable_testnet: bool,
}

/// SDK info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SDKInfo {
    pub version: String,
    pub name: String,
    pub description: String,
    pub author: String,
    pub license: String,
    pub repository: String,
    pub homepage: String,
}

impl Default for SDKInfo {
    fn default() -> Self {
        Self {
            version: env!("CARGO_PKG_VERSION").to_string(),
            name: env!("CARGO_PKG_NAME").to_string(),
            description: env!("CARGO_PKG_DESCRIPTION").to_string(),
            author: env!("CARGO_PKG_AUTHORS").to_string(),
            license: env!("CARGO_PKG_LICENSE").to_string(),
            repository: env!("CARGO_PKG_REPOSITORY").to_string(),
            homepage: env!("CARGO_PKG_HOMEPAGE").to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transaction_builder() {
        let tx = TransactionBuilder::new()
            .from("sender_address")
            .to("receiver_address")
            .amount(1000)
            .fee(100)
            .build();
        
        assert!(tx.is_ok());
        let tx = tx.unwrap();
        assert_eq!(tx.sender, "sender_address");
        assert_eq!(tx.receiver, "receiver_address");
        assert_eq!(tx.amount, 1000);
        assert_eq!(tx.fee, 100);
    }

    #[test]
    fn test_transaction_builder_missing_fields() {
        let tx = TransactionBuilder::new()
            .from("sender_address")
            .amount(1000)
            .build();
        
        assert!(tx.is_err());
        assert_eq!(tx.unwrap_err(), "Receiver address is required");
    }

    #[test]
    fn test_query_options() {
        let options = QueryOptions::new()
            .with_filter(TransactionFilter::default())
            .with_sort(SortOptions::new("timestamp", SortDirection::Desc))
            .with_pagination(PaginationOptions::new(1, 10));
        
        assert!(options.filter.is_some());
        assert!(options.sort.is_some());
        assert!(options.pagination.is_some());
    }

    #[test]
    fn test_sdk_info() {
        let info = SDKInfo::default();
        assert!(!info.version.is_empty());
        assert!(!info.name.is_empty());
    }
}