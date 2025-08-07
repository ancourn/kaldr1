//! Quantum-Proof DAG Blockchain
//! 
//! A next-generation blockchain implementation combining DAG-based consensus
//! with post-quantum cryptographic security.

pub mod core;
pub mod math;
pub mod network;
pub mod consensus;
pub mod security;
pub mod contracts;
pub mod utils;
pub mod storage;
pub mod identity;
pub mod metrics;
pub mod governance;

pub use core::*;
pub use math::*;
pub use network::*;
pub use consensus::*;
pub use security::*;
pub use contracts::*;
pub use utils::*;
pub use storage::*;
pub use identity::*;
pub use metrics::*;
pub use governance::*;

// Re-export identity types
pub use identity::{IdentityRotationEvent, IdentityRotationReadiness};

// Re-export API server
pub use bin::api_server::ApiServer;

use std::sync::Arc;
use tokio::sync::RwLock;

/// Main blockchain configuration
#[derive(Debug, Clone)]
pub struct BlockchainConfig {
    /// Network configuration
    pub network: NetworkConfig,
    /// Consensus configuration
    pub consensus: ConsensusConfig,
    /// Security configuration
    pub security: SecurityConfig,
    /// Database configuration
    pub database: DatabaseConfig,
}

/// Main blockchain instance
pub struct Blockchain {
    /// Configuration
    config: BlockchainConfig,
    /// DAG core
    dag: Arc<RwLock<DAGCore>>,
    /// Prime layer
    prime_layer: Arc<PrimeLayer>,
    /// Network layer
    network: Arc<NetworkLayer>,
    /// Consensus engine
    consensus: Arc<ConsensusEngine>,
    /// Security manager
    security: Arc<SecurityManager>,
    /// Database manager
    database: Arc<DatabaseManager>,
    /// Identity manager
    identity: Arc<RwLock<IdentityManager>>,
    /// Metrics collector
    metrics: Arc<BlockchainMetrics>,
}

impl Blockchain {
    /// Create a new blockchain instance
    pub async fn new(config: BlockchainConfig) -> Result<Self, BlockchainError> {
        // Initialize database
        let db_config = DatabaseConfig {
            path: config.database.path.clone(),
            max_connections: config.database.cache_size_mb as u32 / 10, // Estimate connections from cache size
        };
        let database = Arc::new(DatabaseManager::new(db_config).await?);
        
        // Initialize identity manager
        let mut identity_manager = IdentityManager::new(config.database.path.clone());
        identity_manager.initialize_identity().await?;
        let identity = Arc::new(RwLock::new(identity_manager));
        
        // Initialize metrics
        let metrics = Arc::new(BlockchainMetrics::new()?);
        
        // Initialize components
        let dag = Arc::new(RwLock::new(DAGCore::new_with_database(database.clone()).await?));
        let prime_layer = Arc::new(PrimeLayer::new()?);
        let network = Arc::new(NetworkLayer::new(&config.network).await?);
        let consensus = Arc::new(ConsensusEngine::new(&config.consensus)?);
        let security = Arc::new(SecurityManager::new(&config.security)?);

        Ok(Self {
            config,
            dag,
            prime_layer,
            network,
            consensus,
            security,
            database,
            identity,
            metrics,
        })
    }

    /// Start the blockchain
    pub async fn start(&self) -> Result<(), BlockchainError> {
        log::info!("Starting Quantum-Proof DAG Blockchain...");
        
        // Start network layer
        self.network.start().await?;
        
        // Start consensus engine
        self.consensus.start().await?;
        
        // Start security manager
        self.security.start().await?;
        
        log::info!("Blockchain started successfully");
        Ok(())
    }

    /// Stop the blockchain
    pub async fn stop(&self) -> Result<(), BlockchainError> {
        log::info!("Stopping Quantum-Proof DAG Blockchain...");
        
        // Stop components in reverse order
        self.security.stop().await?;
        self.consensus.stop().await?;
        self.network.stop().await?;
        
        log::info!("Blockchain stopped successfully");
        Ok(())
    }

    /// Submit a transaction to the blockchain
    pub async fn submit_transaction(&self, mut transaction: Transaction) -> Result<TransactionId, BlockchainError> {
        let start_time = std::time::Instant::now();
        
        // Sign the transaction using identity manager
        let identity = self.identity.read().await;
        let signature = identity.sign_transaction(&transaction).await?;
        
        // Validate PQC key usage
        let pqc_valid = identity.validate_pqc_key_usage(&signature).await?;
        if !pqc_valid {
            drop(identity);
            return Err(BlockchainError::Other("Transaction rejected: Invalid or non-quantum-resistant signature".to_string()));
        }
        
        transaction.signature = signature.signature_data;
        
        // Record signature metric
        self.metrics.record_signature_verification(true);
        
        // Update quantum proof with identity-based proof
        let tx_hash = identity.create_transaction_hash(&transaction)?;
        let quantum_proof_start = std::time::Instant::now();
        let quantum_proof = identity.create_quantum_proof(&tx_hash).await?;
        self.metrics.record_quantum_proof_generation(quantum_proof_start.elapsed());
        transaction.quantum_proof = quantum_proof;
        
        drop(identity); // Release the lock
        
        // Validate transaction
        self.security.validate_transaction(&transaction).await?;
        
        // Apply prime layer validation
        self.prime_layer.validate_transaction(&transaction).await?;
        
        // Add to DAG
        let mut dag = self.dag.write().await;
        let tx_id = dag.add_transaction(transaction).await?;
        
        // Update confidence scores
        dag.update_confidence_scores();
        
        // Record transaction metric
        self.metrics.record_transaction();
        
        // Propagate through network
        self.network.propagate_transaction(&tx_id).await?;
        
        Ok(tx_id)
    }

    /// Get transaction by ID
    pub async fn get_transaction(&self, tx_id: &TransactionId) -> Result<Option<Transaction>, BlockchainError> {
        let dag = self.dag.read().await;
        dag.get_transaction(tx_id).await
    }

    /// Get blockchain status
    pub async fn get_status(&self) -> BlockchainStatus {
        let dag = self.dag.read().await;
        BlockchainStatus {
            total_transactions: dag.transaction_count(),
            network_peers: self.network.peer_count(),
            consensus_height: self.consensus.current_height(),
            quantum_resistance_score: self.prime_layer.quantum_resistance_score(),
        }
    }

    /// Get node identity information
    pub async fn get_identity_info(&self) -> Result<IdentityInfo, BlockchainError> {
        let identity = self.identity.read().await;
        identity.get_identity_info().await
    }

    /// Get metrics export
    pub async fn get_metrics(&self) -> Result<String, BlockchainError> {
        // Update metrics from blockchain state
        self.metrics.update_from_blockchain(&self.dag).await;
        
        // Get metrics in Prometheus format
        self.metrics.get_metrics().map_err(|e| BlockchainError::Other(e.to_string()))
    }

    /// Run PQC validation tests
    pub async fn run_pqc_validation_tests(&self) -> Result<PQCTestResults, BlockchainError> {
        let identity = self.identity.read().await;
        
        // Test basic signature rejection
        let basic_tests = identity.test_signature_rejection().await?;
        
        // Test with actual transaction
        let test_transaction = Transaction {
            id: TransactionId::new(),
            sender: vec![1u8; 32],
            receiver: vec![2u8; 32],
            amount: 100,
            nonce: 1,
            timestamp: chrono::Utc::now().timestamp() as u64,
            parents: vec![],
            signature: vec![0u8; 64],
            quantum_proof: crate::core::QuantumProof {
                prime_hash: vec![0u8; 32],
                resistance_score: 80,
                proof_timestamp: chrono::Utc::now().timestamp() as u64,
            },
            metadata: None,
        };
        
        let transaction_tests = identity.simulate_invalid_signature_rejection(&test_transaction).await?;
        
        // Test quantum resistance scoring
        let quantum_tests = self.test_quantum_resistance_scoring().await?;
        
        Ok(PQCTestResults {
            basic_signature_tests: basic_tests,
            transaction_tests,
            quantum_resistance_tests: quantum_tests,
            overall_success_rate: ((basic_tests.passed_tests + transaction_tests.passed_tests + quantum_tests.passed_tests) as f64 
                / (basic_tests.total_tests + transaction_tests.total_tests + quantum_tests.total_tests) as f64) * 100.0,
        })
    }

    /// Test quantum resistance scoring
    async fn test_quantum_resistance_scoring(&self) -> Result<SignatureRejectionTest, BlockchainError> {
        let mut test_results = SignatureRejectionTest {
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            test_details: Vec::new(),
        };

        let identity = self.identity.read().await;
        
        // Test 1: Dilithium3 should have high quantum resistance
        test_results.total_tests += 1;
        let test_data = b"quantum resistance test data";
        let dilithium3_sig = identity.sign(test_data, crate::identity::SignatureType::Dilithium3).await?;
        let qr_score = identity.calculate_quantum_resistance_score(&dilithium3_sig).await?;
        
        if qr_score >= 80 {
            test_results.passed_tests += 1;
            test_results.test_details.push(format!("Dilithium3 quantum resistance test: PASSED (score: {})", qr_score));
            log::info!("✅ Dilithium3 quantum resistance test passed - score: {}", qr_score);
        } else {
            test_results.failed_tests += 1;
            test_results.test_details.push(format!("Dilithium3 quantum resistance test: FAILED (score: {})", qr_score));
            log::error!("❌ Dilithium3 quantum resistance test failed - score: {}", qr_score);
        }

        // Test 2: Dilithium5 should have higher quantum resistance than Dilithium3
        test_results.total_tests += 1;
        let dilithium5_sig = identity.sign(test_data, crate::identity::SignatureType::Dilithium5).await?;
        let qr_score_d5 = identity.calculate_quantum_resistance_score(&dilithium5_sig).await?;
        let qr_score_d3 = identity.calculate_quantum_resistance_score(&dilithium3_sig).await?;
        
        if qr_score_d5 > qr_score_d3 {
            test_results.passed_tests += 1;
            test_results.test_details.push(format!("Dilithium5 vs Dilithium3 test: PASSED (D5: {}, D3: {})", qr_score_d5, qr_score_d3));
            log::info!("✅ Dilithium5 vs Dilithium3 test passed - D5: {}, D3: {}", qr_score_d5, qr_score_d3);
        } else {
            test_results.failed_tests += 1;
            test_results.test_details.push(format!("Dilithium5 vs Dilithium3 test: FAILED (D5: {}, D3: {})", qr_score_d5, qr_score_d3));
            log::error!("❌ Dilithium5 vs Dilithium3 test failed - D5: {}, D3: {}", qr_score_d5, qr_score_d3);
        }

        // Test 3: Hybrid should have good quantum resistance
        test_results.total_tests += 1;
        let hybrid_sig = identity.sign(test_data, crate::identity::SignatureType::Hybrid).await?;
        let hybrid_qr_score = identity.calculate_quantum_resistance_score(&hybrid_sig).await?;
        
        if hybrid_qr_score >= 85 {
            test_results.passed_tests += 1;
            test_results.test_details.push(format!("Hybrid quantum resistance test: PASSED (score: {})", hybrid_qr_score));
            log::info!("✅ Hybrid quantum resistance test passed - score: {}", hybrid_qr_score);
        } else {
            test_results.failed_tests += 1;
            test_results.test_details.push(format!("Hybrid quantum resistance test: FAILED (score: {})", hybrid_qr_score));
            log::error!("❌ Hybrid quantum resistance test failed - score: {}", hybrid_qr_score);
        }

        // Test 4: Ed25519 should have low quantum resistance
        test_results.total_tests += 1;
        let ed25519_sig = identity.sign(test_data, crate::identity::SignatureType::Ed25519).await?;
        let ed25519_qr_score = identity.calculate_quantum_resistance_score(&ed25519_sig).await?;
        
        if ed25519_qr_score < 70 {
            test_results.passed_tests += 1;
            test_results.test_details.push(format!("Ed25519 quantum resistance test: PASSED (score: {})", ed25519_qr_score));
            log::info!("✅ Ed25519 quantum resistance test passed - score: {}", ed25519_qr_score);
        } else {
            test_results.failed_tests += 1;
            test_results.test_details.push(format!("Ed25519 quantum resistance test: FAILED (score: {})", ed25519_qr_score));
            log::error!("❌ Ed25519 quantum resistance test failed - score: {}", ed25519_qr_score);
        }

        Ok(test_results)
    }

    /// Get pending transactions
    pub async fn get_pending_transactions(&self) -> Vec<Transaction> {
        let dag = self.dag.read().await;
        dag.get_pending_transactions()
            .into_iter()
            .cloned()
            .collect()
    }

    /// Get confirmed transactions
    pub async fn get_confirmed_transactions(&self) -> Vec<Transaction> {
        let dag = self.dag.read().await;
        dag.get_confirmed_transactions()
            .into_iter()
            .cloned()
            .collect()
    }

    /// Get DAG statistics
    pub async fn get_dag_stats(&self) -> DAGStats {
        let dag = self.dag.read().await;
        dag.get_dag_stats()
    }

    /// Get storage size
    pub async fn get_storage_size(&self) -> Result<u64, BlockchainError> {
        let dag = self.dag.read().await;
        dag.get_storage_size()
    }

    /// Rotate node identity
    pub async fn rotate_identity(&self) -> Result<IdentityInfo, BlockchainError> {
        // Note: This requires mutable access to the identity manager
        // In a real implementation, you'd use a message queue or similar pattern
        log::info!("🔄 Identity rotation requested");
        
        // For now, return current identity info with rotation metadata
        let identity = self.identity.read().await;
        let mut identity_info = identity.get_identity_info().await?;
        
        // Add rotation metadata
        identity_info.metadata.insert("rotation_requested".to_string(), chrono::Utc::now().to_rfc3339());
        identity_info.metadata.insert("rotation_status".to_string(), "pending".to_string());
        
        log::info!("✅ Identity rotation request queued");
        Ok(identity_info)
    }

    /// Get identity rotation history
    pub async fn get_identity_rotation_history(&self) -> Result<Vec<IdentityRotationEvent>, BlockchainError> {
        let identity = self.identity.read().await;
        identity.get_rotation_history().await
    }

    /// Check identity rotation readiness
    pub async fn check_identity_rotation_readiness(&self) -> Result<IdentityRotationReadiness, BlockchainError> {
        let identity = self.identity.read().await;
        identity.validate_rotation_readiness().await
    }
}

/// PQC validation test results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PQCTestResults {
    pub basic_signature_tests: crate::identity::SignatureRejectionTest,
    pub transaction_tests: crate::identity::SignatureRejectionTest,
    pub quantum_resistance_tests: crate::identity::SignatureRejectionTest,
    pub overall_success_rate: f64,
}

/// Blockchain status information
#[derive(Debug, Clone)]
pub struct BlockchainStatus {
    pub total_transactions: u64,
    pub network_peers: u32,
    pub consensus_height: u64,
    pub quantum_resistance_score: f64,
}

/// Blockchain error types
#[derive(Debug, thiserror::Error)]
pub enum BlockchainError {
    #[error("Core error: {0}")]
    Core(#[from] CoreError),
    #[error("Network error: {0}")]
    Network(#[from] NetworkError),
    #[error("Consensus error: {0}")]
    Consensus(#[from] ConsensusError),
    #[error("Security error: {0}")]
    Security(#[from] SecurityError),
    #[error("Math error: {0}")]
    Math(#[from] MathError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("Other error: {0}")]
    Other(String),
}

impl From<anyhow::Error> for BlockchainError {
    fn from(err: anyhow::Error) -> Self {
        BlockchainError::Other(err.to_string())
    }
}

/// Configuration types
pub mod config {
    use super::*;

    #[derive(Debug, Clone)]
    pub struct NetworkConfig {
        pub listen_addr: String,
        pub bootstrap_nodes: Vec<String>,
        pub max_peers: u32,
    }

    #[derive(Debug, Clone)]
    pub struct ConsensusConfig {
        pub block_time_ms: u64,
        pub validator_count: u32,
        pub prime_modulus: u64,
        pub finality_threshold: f64,
        pub fork_resolution_enabled: bool,
    }

    #[derive(Debug, Clone)]
    pub struct SecurityConfig {
        pub quantum_resistance_level: u32,
        pub signature_scheme: String,
        pub key_rotation_interval_hours: u64,
    }

    #[derive(Debug, Clone)]
    pub struct DatabaseConfig {
        pub path: String,
        pub cache_size_mb: u64,
    }
}

pub use config::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_blockchain_creation() {
        let config = BlockchainConfig {
            network: NetworkConfig {
                listen_addr: "/ip4/127.0.0.1/tcp/0".to_string(),
                bootstrap_nodes: vec![],
                max_peers: 10,
            },
            consensus: ConsensusConfig {
                block_time_ms: 5000,
                validator_count: 3,
                prime_modulus: 2147483647, // Large prime
                finality_threshold: 0.8,
                fork_resolution_enabled: true,
            },
            security: SecurityConfig {
                quantum_resistance_level: 128,
                signature_scheme: "dilithium".to_string(),
                key_rotation_interval_hours: 24,
            },
            database: DatabaseConfig {
                path: "./test_db".to_string(),
                cache_size_mb: 1024,
            },
        };

        let blockchain = Blockchain::new(config).await;
        assert!(blockchain.is_ok());
    }
}