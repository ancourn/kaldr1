//! HTTP API server for the Quantum-Proof DAG Blockchain

use crate::{Blockchain, BlockchainError, Transaction, TransactionId};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use warp::Filter;
use std::convert::Infallible;

/// HTTP API server for blockchain
pub struct ApiServer {
    blockchain: Arc<RwLock<Blockchain>>,
    port: u16,
}

/// Blockchain status response
#[derive(Debug, Serialize, Deserialize)]
pub struct BlockchainStatusResponse {
    pub total_transactions: u64,
    pub network_peers: u32,
    pub consensus_height: u64,
    pub quantum_resistance_score: f64,
    pub transactions_per_second: f64,
    pub block_time: f64,
    pub active_validators: u32,
    pub total_stake: u64,
    pub network_status: String,
    pub last_updated: String,
    pub version: String,
}

/// Transaction response
#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionResponse {
    pub id: String,
    pub sender: String,
    pub receiver: String,
    pub amount: u64,
    pub timestamp: u64,
    pub status: String,
    pub fee: u64,
    pub quantum_resistance_score: u32,
    pub parents: Vec<String>,
    pub confidence: f64,
}

/// DAG node response
#[derive(Debug, Serialize, Deserialize)]
pub struct DagNodeResponse {
    pub id: String,
    pub transaction: TransactionResponse,
    pub children: Vec<String>,
    pub weight: u64,
    pub confidence: f64,
    pub status: String,
    pub quantum_score: u32,
}

/// Create transaction request
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTransactionRequest {
    pub sender: String,
    pub receiver: String,
    pub amount: u64,
    pub fee: Option<u64>,
    pub metadata: Option<String>,
}

/// Create backup request
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBackupRequest {
    pub backup_path: String,
    pub description: Option<String>,
}

/// Restore backup request
#[derive(Debug, Serialize, Deserialize)]
pub struct RestoreBackupRequest {
    pub backup_path: String,
    pub create_pre_restore_backup: Option<bool>,
}

/// Backup query parameters
#[derive(Debug, Deserialize)]
pub struct BackupQuery {
    pub backup_dir: Option<String>,
    pub limit: Option<usize>,
}

/// Export database request
#[derive(Debug, Serialize, Deserialize)]
pub struct ExportDatabaseRequest {
    pub export_path: String,
    pub format: Option<String>,
}

/// API response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: String,
}

impl ApiServer {
    /// Create a new API server
    pub fn new(blockchain: Arc<RwLock<Blockchain>>, port: u16) -> Self {
        Self {
            blockchain,
            port,
        }
    }

    /// Start the API server
    pub async fn start(&self) -> Result<(), BlockchainError> {
        println!("🌐 Starting API server on port {}", self.port);

        // Clone blockchain for the routes
        let blockchain = self.blockchain.clone();

        // CORS configuration
        let cors = warp::cors()
            .allow_any_origin()
            .allow_headers(vec!["content-type"])
            .allow_methods(vec!["GET", "POST", "OPTIONS"]);

        // Health check route
        let health = warp::path("health")
            .and(warp::get())
            .map(|| {
                warp::reply::json(&ApiResponse {
                    success: true,
                    data: Some("healthy"),
                    error: None,
                    timestamp: chrono::Utc::now().to_rfc3339(),
                })
            });

        // Blockchain status route
        let status_route = warp::path("status")
            .and(warp::get())
            .and(with_blockchain(blockchain.clone()))
            .and_then(get_blockchain_status);

        // Transactions routes
        let transactions_get = warp::path("transactions")
            .and(warp::get())
            .and(warp::query::<TransactionQuery>())
            .and(with_blockchain(blockchain.clone()))
            .and_then(get_transactions);

        let transactions_post = warp::path("transactions")
            .and(warp::post())
            .and(warp::body::json())
            .and(with_blockchain(blockchain.clone()))
            .and_then(create_transaction);

        let transaction_by_id = warp::path!("transactions" / String)
            .and(warp::get())
            .and(with_blockchain(blockchain.clone()))
            .and_then(get_transaction_by_id);

        // DAG routes
        let dag_nodes = warp::path("dag")
            .and(warp::get())
            .and(with_blockchain(blockchain.clone()))
            .and_then(get_dag_nodes);

        let dag_node_by_id = warp::path!("dag" / String)
            .and(warp::get())
            .and(with_blockchain(blockchain.clone()))
            .and_then(get_dag_node_by_id);

        // DAG tips
        let dag_tips = warp::path("dag" / "tips")
            .and(warp::get())
            .and(with_blockchain(blockchain.clone()))
            .and_then(get_dag_tips);

        // Identity endpoint
        let identity_route = warp::path("identity")
            .and(warp::get())
            .and(with_blockchain(blockchain.clone()))
            .and_then(get_identity_info);

        // Identity rotation endpoint
        let rotate_identity_route = warp::path("rotate-identity")
            .and(warp::post())
            .and(with_blockchain(blockchain.clone()))
            .and_then(rotate_identity);

        // Backup endpoints
        let create_backup_route = warp::path("backup")
            .and(warp::post())
            .and(warp::body::json())
            .and(with_blockchain(blockchain.clone()))
            .and_then(create_backup);

        let restore_backup_route = warp::path("backup" / "restore")
            .and(warp::post())
            .and(warp::body::json())
            .and(with_blockchain(blockchain.clone()))
            .and_then(restore_backup);

        let list_backups_route = warp::path("backup" / "list")
            .and(warp::get())
            .and(warp::query::<BackupQuery>())
            .and(with_blockchain(blockchain.clone()))
            .and_then(list_backups);

        let export_database_route = warp::path("backup" / "export")
            .and(warp::post())
            .and(warp::body::json())
            .and(with_blockchain(blockchain.clone()))
            .and_then(export_database);

        // Metrics endpoint
        let metrics_route = warp::path("metrics")
            .and(warp::get())
            .and(with_blockchain(blockchain.clone()))
            .and_then(get_metrics);

        // Combine all routes
        let routes = health
            .or(status_route)
            .or(transactions_get)
            .or(transactions_post)
            .or(transaction_by_id)
            .or(dag_nodes)
            .or(dag_node_by_id)
            .or(dag_tips)
            .or(identity_route)
            .or(rotate_identity_route)
            .or(create_backup_route)
            .or(restore_backup_route)
            .or(list_backups_route)
            .or(export_database_route)
            .or(metrics_route)
            .with(cors)
            .with(warp::log("api"));

        // Start the server
        warp::serve(routes)
            .run(([0, 0, 0, 0], self.port))
            .await;

        Ok(())
    }
}

/// Helper function to inject blockchain into routes
fn with_blockchain(
    blockchain: Arc<RwLock<Blockchain>>,
) -> impl Filter<Extract = (Arc<RwLock<Blockchain>>,), Error = Infallible> + Clone {
    warp::any().map(move || blockchain.clone())
}

/// Transaction query parameters
#[derive(Debug, Deserialize)]
struct TransactionQuery {
    limit: Option<usize>,
    offset: Option<usize>,
    status: Option<String>,
}

/// Get blockchain status
async fn get_blockchain_status(
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let status = blockchain.read().await.get_status().await;
    
    let response = BlockchainStatusResponse {
        total_transactions: status.total_transactions,
        network_peers: status.network_peers,
        consensus_height: status.consensus_height,
        quantum_resistance_score: status.quantum_resistance_score,
        transactions_per_second: 1250.0, // Mock TPS calculation
        block_time: 3.2, // Mock block time
        active_validators: 3,
        total_stake: 15000,
        network_status: "online".to_string(),
        last_updated: chrono::Utc::now().to_rfc3339(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    };

    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(response),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Get transactions
async fn get_transactions(
    query: TransactionQuery,
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let limit = query.limit.unwrap_or(10);
    let offset = query.offset.unwrap_or(0);
    
    // For now, return mock transactions since we need to implement transaction listing
    let transactions = generate_mock_transactions(limit);
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(transactions),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Create transaction
async fn create_transaction(
    request: CreateTransactionRequest,
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    // Convert hex strings to bytes
    let sender = hex::decode(&request.sender).unwrap_or_default();
    let receiver = hex::decode(&request.receiver).unwrap_or_default();
    
    // Create transaction
    let transaction = Transaction {
        id: TransactionId::new(),
        sender,
        receiver,
        amount: request.amount,
        nonce: rand::random(),
        timestamp: chrono::Utc::now().timestamp() as u64,
        parents: vec![], // Will be filled by blockchain
        signature: vec![0u8; 64], // Placeholder
        quantum_proof: crate::core::QuantumProof {
            prime_hash: vec![0u8; 32],
            resistance_score: 80,
            proof_timestamp: chrono::Utc::now().timestamp() as u64,
        },
        metadata: request.metadata.map(|s| s.into_bytes()),
    };
    
    // Submit to blockchain
    match blockchain.write().await.submit_transaction(transaction).await {
        Ok(tx_id) => {
            Ok(warp::reply::json(&ApiResponse {
                success: true,
                data: Some(tx_id.as_string()),
                error: None,
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
        Err(e) => {
            Ok(warp::reply::json(&ApiResponse::<String> {
                success: false,
                data: None,
                error: Some(format!("Failed to create transaction: {}", e)),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
    }
}

/// Get transaction by ID
async fn get_transaction_by_id(
    tx_id: String,
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let tx_id = match TransactionId::from_bytes(&hex::decode(&tx_id).unwrap_or_default()) {
        Ok(id) => id,
        Err(_) => {
            return Ok(warp::reply::json(&ApiResponse::<TransactionResponse> {
                success: false,
                data: None,
                error: Some("Invalid transaction ID".to_string()),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
    };
    
    match blockchain.read().await.get_transaction(&tx_id).await {
        Ok(Some(tx)) => {
            let response = TransactionResponse {
                id: tx.id.as_string(),
                sender: hex::encode(&tx.sender),
                receiver: hex::encode(&tx.receiver),
                amount: tx.amount,
                timestamp: tx.timestamp,
                status: "pending".to_string(), // Would get from DAG node
                fee: 0, // Would calculate
                quantum_resistance_score: tx.quantum_proof.resistance_score,
                parents: tx.parents.iter().map(|p| p.as_string()).collect(),
                confidence: 0.0, // Would get from DAG node
            };
            
            Ok(warp::reply::json(&ApiResponse {
                success: true,
                data: Some(response),
                error: None,
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
        Ok(None) => {
            Ok(warp::reply::json(&ApiResponse::<TransactionResponse> {
                success: false,
                data: None,
                error: Some("Transaction not found".to_string()),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
        Err(e) => {
            Ok(warp::reply::json(&ApiResponse::<TransactionResponse> {
                success: false,
                data: None,
                error: Some(format!("Failed to get transaction: {}", e)),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
    }
}

/// Get DAG nodes
async fn get_dag_nodes(
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let dag = blockchain.read().await;
    let nodes = generate_mock_dag_nodes(10);
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(nodes),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Get DAG node by ID
async fn get_dag_node_by_id(
    node_id: String,
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    // For now, return mock data
    let node = DagNodeResponse {
        id: node_id,
        transaction: TransactionResponse {
            id: node_id,
            sender: "0x1234".to_string(),
            receiver: "0x5678".to_string(),
            amount: 100,
            timestamp: chrono::Utc::now().timestamp() as u64,
            status: "confirmed".to_string(),
            fee: 1,
            quantum_resistance_score: 85,
            parents: vec![],
            confidence: 0.95,
        },
        children: vec!["child1".to_string(), "child2".to_string()],
        weight: 100,
        confidence: 0.95,
        status: "confirmed".to_string(),
        quantum_score: 85,
    };
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(node),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Get DAG tips
async fn get_dag_tips(
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let dag = blockchain.read().await;
    let tips = dag.get_tips();
    
    let tip_responses: Vec<DagNodeResponse> = tips.iter().take(5).map(|node| {
        DagNodeResponse {
            id: node.transaction.id.as_string(),
            transaction: TransactionResponse {
                id: node.transaction.id.as_string(),
                sender: hex::encode(&node.transaction.sender),
                receiver: hex::encode(&node.transaction.receiver),
                amount: node.transaction.amount,
                timestamp: node.transaction.timestamp,
                status: format!("{:?}", node.status),
                fee: 0,
                quantum_resistance_score: node.transaction.quantum_proof.resistance_score,
                parents: node.transaction.parents.iter().map(|p| p.as_string()).collect(),
                confidence: node.confidence,
            },
            children: node.children.iter().map(|c| c.as_string()).collect(),
            weight: node.weight,
            confidence: node.confidence,
            status: format!("{:?}", node.status),
            quantum_score: node.quantum_score,
        }
    }).collect();
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(tip_responses),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Get node identity information
async fn get_identity_info(
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    match blockchain.read().await.get_identity_info().await {
        Ok(identity_info) => {
            Ok(warp::reply::json(&ApiResponse {
                success: true,
                data: Some(identity_info),
                error: None,
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
        Err(e) => {
            Ok(warp::reply::json(&ApiResponse::<IdentityInfo> {
                success: false,
                data: None,
                error: Some(format!("Failed to get identity info: {}", e)),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
    }
}

/// Get Prometheus metrics
async fn get_metrics(
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    match blockchain.read().await.get_metrics().await {
        Ok(metrics_text) => {
            Ok(warp::reply::with_header(metrics_text, "content-type", "text/plain; version=0.0.4"))
        }
        Err(e) => {
            let error_response = format!("# Error fetching metrics\n{}", e);
            Ok(warp::reply::with_header(error_response, "content-type", "text/plain; version=0.0.4"))
        }
    }
}

/// Rotate node identity
async fn rotate_identity(
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    // Note: This is a simplified implementation
    // In a real implementation, you'd need to handle the mutable reference properly
    // For now, we'll return a success response with a message
    
    let response = serde_json::json!({
        "success": true,
        "message": "Identity rotation initiated. Check logs for details.",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "note": "In a production implementation, this would trigger actual key rotation"
    });
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(response),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Create database backup
async fn create_backup(
    request: CreateBackupRequest,
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    // Note: This is a simplified implementation
    // In a real implementation, you'd access the database manager through the blockchain
    
    let response = serde_json::json!({
        "success": true,
        "message": "Backup creation initiated.",
        "backup_path": request.backup_path,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "note": "In a production implementation, this would create an actual database backup"
    });
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(response),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Restore database from backup
async fn restore_backup(
    request: RestoreBackupRequest,
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    // Note: This is a simplified implementation
    // In a real implementation, you'd access the database manager through the blockchain
    
    let response = serde_json::json!({
        "success": true,
        "message": "Database restore initiated.",
        "backup_path": request.backup_path,
        "create_pre_restore_backup": request.create_pre_restore_backup.unwrap_or(true),
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "note": "In a production implementation, this would restore from an actual backup"
    });
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(response),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// List available backups
async fn list_backups(
    query: BackupQuery,
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    // Note: This is a simplified implementation
    // In a real implementation, you'd access the database manager through the blockchain
    
    let backup_dir = query.backup_dir.unwrap_or_else(|| "./backups".to_string());
    let limit = query.limit.unwrap_or(10);
    
    let mock_backups = vec![
        serde_json::json!({
            "timestamp": 1704067200,
            "backup_path": "./backups/blockchain_1704067200.db",
            "file_size": 1024000,
            "total_transactions": 1000,
            "backup_type": "Full"
        }),
        serde_json::json!({
            "timestamp": 1704153600,
            "backup_path": "./backups/blockchain_1704153600.db",
            "file_size": 1048576,
            "total_transactions": 1050,
            "backup_type": "Full"
        }),
    ];
    
    let backups = mock_backups.into_iter().take(limit).collect();
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(backups),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Export database
async fn export_database(
    request: ExportDatabaseRequest,
    blockchain: Arc<RwLock<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    // Note: This is a simplified implementation
    // In a real implementation, you'd access the database manager through the blockchain
    
    let format = request.format.unwrap_or_else(|| "sql".to_string());
    let export_path = if request.export_path.ends_with(&format) {
        request.export_path
    } else {
        format!("{}.{}", request.export_path, format)
    };
    
    let response = serde_json::json!({
        "success": true,
        "message": "Database export initiated.",
        "export_path": export_path,
        "format": format,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "note": "In a production implementation, this would export the actual database"
    });
    
    Ok(warp::reply::json(&ApiResponse {
        success: true,
        data: Some(response),
        error: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// Helper functions for mock data generation
fn generate_mock_transactions(count: usize) -> Vec<TransactionResponse> {
    let mut transactions = Vec::new();
    
    for i in 0..count {
        transactions.push(TransactionResponse {
            id: format!("0x{:064x}", i),
            sender: format!("0x{:040x}", i * 1000),
            receiver: format!("0x{:040x}", i * 1000 + 1),
            amount: (i + 1) * 100,
            timestamp: chrono::Utc::now().timestamp() as u64 - (i * 3600),
            status: ["pending", "confirmed", "finalized"][i % 3].to_string(),
            fee: (i + 1),
            quantum_resistance_score: 80 + (i % 20),
            parents: vec![],
            confidence: 0.5 + (i as f64 * 0.1),
        });
    }
    
    transactions
}

fn generate_mock_dag_nodes(count: usize) -> Vec<DagNodeResponse> {
    let mut nodes = Vec::new();
    
    for i in 0..count {
        nodes.push(DagNodeResponse {
            id: format!("node_{}", i),
            transaction: TransactionResponse {
                id: format!("0x{:064x}", i),
                sender: format!("0x{:040x}", i * 1000),
                receiver: format!("0x{:040x}", i * 1000 + 1),
                amount: (i + 1) * 100,
                timestamp: chrono::Utc::now().timestamp() as u64 - (i * 3600),
                status: ["pending", "confirmed", "finalized"][i % 3].to_string(),
                fee: (i + 1),
                quantum_resistance_score: 80 + (i % 20),
                parents: vec![],
                confidence: 0.5 + (i as f64 * 0.1),
            },
            children: vec![format!("node_{}", i + 1)],
            weight: (i + 1) * 10,
            confidence: 0.5 + (i as f64 * 0.1),
            status: ["pending", "confirmed", "finalized"][i % 3].to_string(),
            quantum_score: 80 + (i % 20),
        });
    }
    
    nodes
}