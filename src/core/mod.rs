//! Core DAG blockchain components

use crate::{BlockchainError, TransactionId, storage::DatabaseManager};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Transaction structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    /// Unique transaction ID
    pub id: TransactionId,
    /// Sender's public key
    pub sender: Vec<u8>,
    /// Receiver's public key
    pub receiver: Vec<u8>,
    /// Transaction amount
    pub amount: u64,
    /// Nonce for replay protection
    pub nonce: u64,
    /// Timestamp
    pub timestamp: u64,
    /// Parent transaction IDs
    pub parents: Vec<TransactionId>,
    /// Digital signature
    pub signature: Vec<u8>,
    /// Quantum resistance proof
    pub quantum_proof: QuantumProof,
    /// Optional metadata
    pub metadata: Option<Vec<u8>>,
}

/// Quantum resistance proof
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumProof {
    /// Prime-based hash
    pub prime_hash: Vec<u8>,
    /// Quantum resistance score
    pub resistance_score: u32,
    /// Proof timestamp
    pub proof_timestamp: u64,
}

/// DAG node structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DAGNode {
    /// Transaction data
    pub transaction: Transaction,
    /// Child transaction IDs
    pub children: Vec<TransactionId>,
    /// Node weight for consensus
    pub weight: u64,
    /// Confidence score (0.0-1.0)
    pub confidence: f64,
    /// Node status
    pub status: NodeStatus,
    /// Quantum resistance score
    pub quantum_score: u32,
}

/// Node status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NodeStatus {
    /// Transaction is pending confirmation
    Pending,
    /// Transaction is confirmed
    Confirmed,
    /// Transaction is finalized
    Finalized,
    /// Transaction is rejected
    Rejected,
}

/// DAG core implementation
pub struct DAGCore {
    /// All transactions in the DAG (in-memory cache)
    transactions: HashMap<TransactionId, DAGNode>,
    /// Tips (unconfirmed transactions)
    tips: HashSet<TransactionId>,
    /// Genesis transaction
    genesis: Option<TransactionId>,
    /// Transaction count
    transaction_count: u64,
    /// Database manager for persistence
    database: Arc<DatabaseManager>,
    /// Whether to use database persistence
    use_persistence: bool,
}

impl DAGCore {
    /// Create a new DAG core
    pub fn new() -> Result<Self, BlockchainError> {
        // Create a dummy database manager for in-memory operation
        let db_config = crate::storage::DatabaseConfig::default();
        let database = Arc::new(DatabaseManager::new(db_config).await?);
        Self::new_with_database(database).await
    }

    /// Create a new DAG core with database persistence
    pub async fn new_with_database(database: Arc<DatabaseManager>) -> Result<Self, BlockchainError> {
        let use_persistence = true;
        let mut dag = Self {
            transactions: HashMap::new(),
            tips: HashSet::new(),
            genesis: None,
            transaction_count: 0,
            database: database.clone(),
            use_persistence,
        };

        // Try to load existing data from database
        if use_persistence {
            if let Ok(existing_count) = database.get_transaction_count().await {
                if existing_count > 0 {
                    // Load existing transactions from database
                    dag.load_from_database().await?;
                    log::info!("Loaded {} transactions from database", existing_count);
                    return Ok(dag);
                }
            }
        }

        // Create genesis transaction if no existing data
        let genesis_tx = dag.create_genesis_transaction()?;
        let genesis_id = genesis_tx.id.clone();
        
        let genesis_node = DAGNode {
            transaction: genesis_tx,
            children: Vec::new(),
            weight: 1,
            confidence: 1.0,
            status: NodeStatus::Finalized,
            quantum_score: 100,
        };

        dag.genesis = Some(genesis_id.clone());
        dag.transactions.insert(genesis_id.clone(), genesis_node);

        // Store genesis transaction if using persistence
        if use_persistence {
            if let Some(genesis_node) = dag.transactions.get(&genesis_id) {
                database.store_transaction(&genesis_node.transaction).await?;
                database.store_dag_node(genesis_node).await?;
            }
        }

        Ok(dag)
    }

    /// Load existing data from database
    async fn load_from_database(&mut self) -> Result<(), BlockchainError> {
        if !self.use_persistence {
            return Ok(());
        }

        // Load all transactions from database
        let transactions = self.database.get_transactions(None, None, None).await?;
        
        for transaction in transactions {
            let tx_id = transaction.id.clone();
            
            // Try to load corresponding DAG node
            let dag_node = if let Some(node) = self.database.get_dag_node(&tx_id).await? {
                node
            } else {
                // Create DAG node if it doesn't exist
                DAGNode {
                    transaction: transaction.clone(),
                    children: Vec::new(),
                    weight: self.calculate_initial_weight(&transaction),
                    confidence: 0.0,
                    status: NodeStatus::Pending,
                    quantum_score: transaction.quantum_proof.resistance_score,
                }
            };

            self.transactions.insert(tx_id, dag_node);
        }

        // Update transaction count
        self.transaction_count = self.transactions.len() as u64;

        // Rebuild tips set
        self.tips.clear();
        for (tx_id, node) in &self.transactions {
            if node.status == NodeStatus::Pending {
                self.tips.insert(tx_id.clone());
            }
        }

        // Find genesis transaction
        for (tx_id, node) in &self.transactions {
            if node.transaction.parents.is_empty() {
                self.genesis = Some(tx_id.clone());
                break;
            }
        }

        Ok(())
    }

    /// Create genesis transaction
    fn create_genesis_transaction(&self) -> Result<Transaction, BlockchainError> {
        let id = TransactionId::new();
        let timestamp = chrono::Utc::now().timestamp() as u64;

        Ok(Transaction {
            id: id.clone(),
            sender: vec![0u8; 32], // Genesis sender
            receiver: vec![0u8; 32], // Genesis receiver
            amount: 0,
            nonce: 0,
            timestamp,
            parents: Vec::new(), // Genesis has no parents
            signature: vec![0u8; 64], // Empty signature
            quantum_proof: QuantumProof {
                prime_hash: vec![0u8; 32],
                resistance_score: 100,
                proof_timestamp: timestamp,
            },
            metadata: Some(b"genesis".to_vec()),
        })
    }

    /// Add a transaction to the DAG
    pub async fn add_transaction(&mut self, transaction: Transaction) -> Result<TransactionId, BlockchainError> {
        // Validate transaction
        self.validate_transaction(&transaction)?;

        // Create DAG node
        let node = DAGNode {
            transaction: transaction.clone(),
            children: Vec::new(),
            weight: self.calculate_initial_weight(&transaction),
            confidence: 0.0,
            status: NodeStatus::Pending,
            quantum_score: transaction.quantum_proof.resistance_score,
        };

        // Add to DAG
        let tx_id = transaction.id.clone();
        self.transactions.insert(tx_id.clone(), node.clone());

        // Update parent-child relationships
        for parent_id in &transaction.parents {
            if let Some(parent_node) = self.transactions.get_mut(parent_id) {
                parent_node.children.push(tx_id.clone());
            }
        }

        // Update tips
        self.tips.remove(&tx_id);
        for parent_id in &transaction.parents {
            self.tips.remove(parent_id);
        }
        self.tips.insert(tx_id.clone());

        self.transaction_count += 1;

        // Store in database if persistence is enabled
        if self.use_persistence {
            self.database.store_transaction(&transaction).await?;
            self.database.store_dag_node(&node).await?;
        }

        log::info!("Added transaction {} to DAG", tx_id);
        Ok(tx_id)
    }

    /// Get transaction by ID
    pub async fn get_transaction(&self, tx_id: &TransactionId) -> Result<Option<Transaction>, BlockchainError> {
        // First check in-memory cache
        if let Some(node) = self.transactions.get(tx_id) {
            return Ok(Some(node.transaction.clone()));
        }

        // If not in memory and persistence is enabled, check database
        if self.use_persistence {
            return self.database.get_transaction(tx_id).await;
        }

        Ok(None)
    }

    /// Get DAG node by ID
    pub fn get_node(&self, tx_id: &TransactionId) -> Option<&DAGNode> {
        self.transactions.get(tx_id)
    }

    /// Get all tips (unconfirmed transactions)
    pub fn get_tips(&self) -> Vec<&DAGNode> {
        // If persistence is enabled, try to get fresh tips from database
        if self.use_persistence {
            // For now, return in-memory tips (in production, this would query database)
            return self.tips.iter()
                .filter_map(|tip_id| self.transactions.get(tip_id))
                .collect();
        }

        // In-memory only mode
        self.tips.iter()
            .filter_map(|tip_id| self.transactions.get(tip_id))
            .collect()
    }

    /// Select parent transactions for a new transaction
    pub fn select_parents(&self, count: usize) -> Vec<TransactionId> {
        let tips = self.get_tips();
        
        if tips.is_empty() {
            return vec![self.genesis.clone().unwrap()];
        }

        // Simple weighted random selection based on node weight
        let mut rng = rand::thread_rng();
        let mut selected = Vec::new();
        
        for _ in 0..count.min(tips.len()) {
            let total_weight: u64 = tips.iter().map(|node| node.weight).sum();
            let target: u64 = rng.gen_range(0..total_weight);
            
            let mut current_weight = 0;
            for node in &tips {
                current_weight += node.weight;
                if current_weight >= target {
                    selected.push(node.transaction.id.clone());
                    break;
                }
            }
        }

        selected
    }

    /// Calculate cumulative weight for a node
    pub fn calculate_cumulative_weight(&self, node_id: &TransactionId) -> u64 {
        if let Some(node) = self.transactions.get(node_id) {
            let mut weight = node.weight;
            
            // Add weights of all approvers (children)
            for child_id in &node.children {
                weight += self.calculate_cumulative_weight(child_id);
            }
            
            weight
        } else {
            0
        }
    }

    /// Get transaction count
    pub fn transaction_count(&self) -> u64 {
        self.transaction_count
    }

    /// Validate transaction structure
    fn validate_transaction(&self, transaction: &Transaction) -> Result<(), BlockchainError> {
        // Check if transaction already exists
        if self.transactions.contains_key(&transaction.id) {
            return Err(BlockchainError::Core(CoreError::TransactionExists(
                transaction.id.clone()
            )));
        }

        // Validate parents exist
        for parent_id in &transaction.parents {
            if !self.transactions.contains_key(parent_id) {
                return Err(BlockchainError::Core(CoreError::ParentNotFound(
                    parent_id.clone()
                )));
            }
        }

        // Validate timestamp
        let current_time = chrono::Utc::now().timestamp() as u64;
        if transaction.timestamp > current_time + 300 { // 5 minutes in the future
            return Err(BlockchainError::Core(CoreError::InvalidTimestamp));
        }

        // Validate quantum proof
        if transaction.quantum_proof.resistance_score < 50 {
            return Err(BlockchainError::Core(CoreError::InsufficientQuantumResistance));
        }

        Ok(())
    }

    /// Calculate initial weight for a transaction
    fn calculate_initial_weight(&self, transaction: &Transaction) -> u64 {
        // Base weight from quantum resistance score
        let base_weight = transaction.quantum_proof.resistance_score as u64;
        
        // Weight from number of parents (more parents = higher weight)
        let parent_weight = transaction.parents.len() as u64 * 10;
        
        // Weight from timestamp (newer transactions get slightly higher weight)
        let age_weight = (chrono::Utc::now().timestamp() as u64 - transaction.timestamp) / 1000;
        
        base_weight + parent_weight + age_weight
    }

    /// Update node confidence scores
    pub fn update_confidence_scores(&mut self) {
        let mut updates = HashMap::new();
        
        for (tx_id, node) in &self.transactions {
            if node.status == NodeStatus::Pending {
                let confidence = self.calculate_confidence(tx_id);
                updates.insert(tx_id.clone(), confidence);
            }
        }
        
        for (tx_id, confidence) in updates {
            if let Some(node) = self.transactions.get_mut(&tx_id) {
                let old_status = node.status.clone();
                node.confidence = confidence;
                
                // Auto-confirm transactions with high confidence
                if confidence > 0.8 {
                    node.status = NodeStatus::Confirmed;
                    self.tips.remove(&tx_id);
                }

                // Update database if persistence is enabled
                if self.use_persistence && old_status != node.status {
                    let db = self.database.clone();
                    let tx_id_clone = tx_id.clone();
                    let status_clone = node.status.clone();
                    let confidence_clone = confidence;
                    
                    // Spawn async task to update database
                    tokio::spawn(async move {
                        if let Err(e) = db.update_node_status(&tx_id_clone, status_clone, confidence_clone).await {
                            log::error!("Failed to update node status in database: {}", e);
                        }
                    });
                }
            }
        }
    }

    /// Calculate confidence score for a transaction
    fn calculate_confidence(&self, tx_id: &TransactionId) -> f64 {
        let Some(node) = self.transactions.get(tx_id) else {
            return 0.0;
        };

        // Base confidence from cumulative weight
        let cumulative_weight = self.calculate_cumulative_weight(tx_id);
        let weight_confidence = (cumulative_weight as f64 / 1000.0).min(1.0);

        // Confidence from quantum resistance
        let quantum_confidence = node.quantum_score as f64 / 100.0;

        // Confidence from number of approvers
        let approver_confidence = (node.children.len() as f64 / 10.0).min(1.0);

        // Combined confidence
        (weight_confidence * 0.4 + quantum_confidence * 0.4 + approver_confidence * 0.2)
    }

    /// Get pending transactions
    pub fn get_pending_transactions(&self) -> Vec<&Transaction> {
        self.transactions.values()
            .filter(|node| node.status == NodeStatus::Pending)
            .map(|node| &node.transaction)
            .collect()
    }

    /// Get confirmed transactions
    pub fn get_confirmed_transactions(&self) -> Vec<&Transaction> {
        self.transactions.values()
            .filter(|node| node.status == NodeStatus::Confirmed || node.status == NodeStatus::Finalized)
            .map(|node| &node.transaction)
            .collect()
    }

    /// Get DAG statistics
    pub fn get_dag_stats(&self) -> crate::metrics::DAGStats {
        let mut max_depth = 0;
        let mut tip_count = 0;
        let mut total_children = 0;

        // Calculate maximum depth (longest path from genesis)
        if let Some(genesis_id) = &self.genesis {
            max_depth = self.calculate_depth(genesis_id);
        }

        // Count tips (pending transactions)
        tip_count = self.tips.len();

        // Calculate average branching factor
        for node in self.transactions.values() {
            total_children += node.children.len();
        }
        let avg_branching = if self.transactions.len() > 1 {
            total_children as f64 / (self.transactions.len() - 1) as f64
        } else {
            0.0
        };

        crate::metrics::DAGStats {
            node_count: self.transactions.len(),
            depth: max_depth,
            width: tip_count,
            average_branching_factor: avg_branching,
        }
    }

    /// Calculate depth of a node (distance from genesis)
    fn calculate_depth(&self, node_id: &TransactionId) -> usize {
        let Some(node) = self.transactions.get(node_id) else {
            return 0;
        };

        if node.transaction.parents.is_empty() {
            return 1; // Genesis node
        }

        let mut max_parent_depth = 0;
        for parent_id in &node.transaction.parents {
            let parent_depth = self.calculate_depth(parent_id);
            if parent_depth > max_parent_depth {
                max_parent_depth = parent_depth;
            }
        }

        max_parent_depth + 1
    }

    /// Get storage size estimate
    pub fn get_storage_size(&self) -> Result<u64, BlockchainError> {
        if !self.use_persistence {
            // Estimate in-memory size
            let mut size = 0;
            for node in self.transactions.values() {
                // Rough estimate of transaction size
                size += std::mem::size_of_val(node) as u64;
                size += node.transaction.sender.len() as u64;
                size += node.transaction.receiver.len() as u64;
                size += node.transaction.signature.len() as u64;
                size += node.transaction.quantum_proof.prime_hash.len() as u64;
                if let Some(ref metadata) = node.transaction.metadata {
                    size += metadata.len() as u64;
                }
            }
            return Ok(size);
        }

        // Get actual database size
        self.database.get_storage_size().await
    }
}

/// Core error types
#[derive(Debug, thiserror::Error)]
pub enum CoreError {
    #[error("Transaction already exists: {0}")]
    TransactionExists(TransactionId),
    #[error("Parent transaction not found: {0}")]
    ParentNotFound(TransactionId),
    #[error("Invalid timestamp")]
    InvalidTimestamp,
    #[error("Insufficient quantum resistance")]
    InsufficientQuantumResistance,
    #[error("Invalid transaction structure")]
    InvalidTransactionStructure,
    #[error("Serialization error: {0}")]
    Serialization(String),
}

/// Transaction ID type
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq)]
pub struct TransactionId(Uuid);

impl TransactionId {
    /// Generate a new transaction ID
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }

    /// Create from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, BlockchainError> {
        let uuid = Uuid::from_slice(bytes)
            .map_err(|e| BlockchainError::Core(CoreError::Serialization(e.to_string())))?;
        Ok(Self(uuid))
    }

    /// Get as bytes
    pub fn as_bytes(&self) -> &[u8] {
        self.0.as_bytes()
    }

    /// Get as string
    pub fn as_string(&self) -> String {
        self.0.to_string()
    }
}

impl std::fmt::Display for TransactionId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Default for TransactionId {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transaction_id_creation() {
        let tx_id = TransactionId::new();
        assert!(!tx_id.as_bytes().is_empty());
    }

    #[test]
    fn test_dag_core_creation() {
        let dag = DAGCore::new();
        assert!(dag.is_ok());
        let dag = dag.unwrap();
        assert_eq!(dag.transaction_count(), 1); // Genesis transaction
        assert!(dag.genesis.is_some());
    }

    #[tokio::test]
    async fn test_add_transaction() {
        let mut dag = DAGCore::new().unwrap();
        
        let tx = Transaction {
            id: TransactionId::new(),
            sender: vec![1u8; 32],
            receiver: vec![2u8; 32],
            amount: 100,
            nonce: 1,
            timestamp: chrono::Utc::now().timestamp() as u64,
            parents: vec![dag.genesis.clone().unwrap()],
            signature: vec![0u8; 64],
            quantum_proof: QuantumProof {
                prime_hash: vec![1u8; 32],
                resistance_score: 80,
                proof_timestamp: chrono::Utc::now().timestamp() as u64,
            },
            metadata: None,
        };

        let result = dag.add_transaction(tx).await;
        assert!(result.is_ok());
        assert_eq!(dag.transaction_count(), 2);
    }
}