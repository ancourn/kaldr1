//! Blockchain node implementation with API server

use quantum_proof_dag_blockchain::*;
use std::sync::Arc;
use tokio::signal;
use tokio::sync::RwLock;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    println!("🚀 Starting Quantum-Proof DAG Blockchain Node");
    println!("================================================");
    
    // Default configuration
    let config = BlockchainConfig {
        network: NetworkConfig {
            listen_addr: "/ip4/127.0.0.1/tcp/8999".to_string(),
            bootstrap_nodes: vec![],
            max_peers: 10,
        },
        consensus: ConsensusConfig {
            block_time_ms: 5000,
            validator_count: 3,
            prime_modulus: 2147483647,
        },
        security: SecurityConfig {
            quantum_resistance_level: 128,
            signature_scheme: "dilithium".to_string(),
            key_rotation_interval_hours: 24,
        },
        database: DatabaseConfig {
            path: "./blockchain_data".to_string(),
            cache_size_mb: 1024,
        },
    };
    
    println!("📋 Configuration loaded:");
    println!("   Network: {}", config.network.listen_addr);
    println!("   Validators: {}", config.consensus.validator_count);
    println!("   Security Level: {} bits", config.security.quantum_resistance_level);
    println!("   Data Path: {}", config.database.path);
    
    // Create blockchain instance
    println!("🔧 Initializing blockchain...");
    let blockchain = Arc::new(Blockchain::new(config).await?);
    
    // Start blockchain
    println!("🌐 Starting blockchain services...");
    blockchain.start().await?;
    
    // Start API server
    println!("🌐 Starting API server...");
    let api_server = ApiServer::new(blockchain.clone(), 8080);
    
    // Start API server in background
    let api_handle = tokio::spawn(async move {
        if let Err(e) = api_server.start().await {
            eprintln!("❌ API server error: {}", e);
        }
    });
    
    println!("✅ Blockchain node started successfully!");
    println!("📍 Node is listening on: {}", blockchain.config.network.listen_addr);
    println!("🌐 API server running on: http://localhost:8080");
    println!("🔒 Quantum resistance level: {} bits", blockchain.config.security.quantum_resistance_level);
    println!("💾 Data directory: {}", blockchain.config.database.path);
    println!("\n📊 Node Status:");
    print_node_status(&blockchain).await;
    
    // Start background tasks
    start_background_tasks(blockchain.clone()).await;
    
    println!("\n⚡ Node is running. Press Ctrl+C to stop.");
    println!("🌐 API endpoints available at:");
    println!("   - GET  http://localhost:8080/health");
    println!("   - GET  http://localhost:8080/status");
    println!("   - GET  http://localhost:8080/transactions");
    println!("   - POST http://localhost:8080/transactions");
    println!("   - GET  http://localhost:8080/dag");
    println!("   - GET  http://localhost:8080/dag/tips");
    
    // Wait for shutdown signal
    signal::ctrl_c().await?;
    println!("\n🛑 Shutdown signal received...");
    
    // Stop blockchain
    blockchain.stop().await?;
    
    // Wait for API server to shutdown
    api_handle.await?;
    
    println!("👋 Blockchain node stopped gracefully.");
    Ok(())
}

async fn print_node_status(blockchain: &Arc<Blockchain>) {
    let status = blockchain.get_status().await;
    
    println!("   Total Transactions: {}", status.total_transactions);
    println!("   Network Peers: {}", status.network_peers);
    println!("   Consensus Height: {}", status.consensus_height);
    println!("   Quantum Resistance: {:.2}%", status.quantum_resistance_score * 100.0);
}

async fn start_background_tasks(blockchain: Arc<Blockchain>) {
    let blockchain_clone = blockchain.clone();
    
    // Task 1: Periodic status updates
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            println!("\n📈 [{}] Status Update:", chrono::Utc::now().format("%H:%M:%S"));
            print_node_status(&blockchain_clone).await;
            
            // Simulate some activity
            if rand::random::<f64>() < 0.3 {
                println!("🔄 Processing new transactions...");
            }
            
            if rand::random::<f64>() < 0.2 {
                println!("🤝 Consensus round in progress...");
            }
        }
    });
    
    // Task 2: Simulate network activity
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(10));
        
        loop {
            interval.tick().await;
            
            // Simulate peer connections
            if rand::random::<f64>() < 0.1 {
                println!("🌐 New peer connected");
            }
            
            // Simulate transaction propagation
            if rand::random::<f64>() < 0.2 {
                println!("📦 Transaction propagated to network");
            }
        }
    });
    
    // Task 3: Quantum resistance monitoring
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
        
        loop {
            interval.tick().await;
            
            let status = blockchain.get_status().await;
            let qr_score = status.quantum_resistance_score;
            
            if qr_score < 0.8 {
                println!("⚠️  Warning: Quantum resistance score below 80% ({:.1}%)", qr_score * 100.0);
            } else {
                println!("🔒 Quantum resistance maintained at {:.1}%", qr_score * 100.0);
            }
        }
    });
}

/// Simple RPC server for node communication
struct RpcServer {
    blockchain: Arc<Blockchain>,
}

impl RpcServer {
    fn new(blockchain: Arc<Blockchain>) -> Self {
        Self { blockchain }
    }
    
    async fn handle_request(&self, request: &str) -> String {
        match request {
            "status" => {
                let status = self.blockchain.get_status().await;
                format!("{{\"total_transactions\": {}, \"network_peers\": {}, \"consensus_height\": {}, \"quantum_resistance_score\": {}}}", 
                        status.total_transactions, status.network_peers, status.consensus_height, status.quantum_resistance_score)
            },
            req if req.starts_with("transaction:") => {
                let parts: Vec<&str> = req.split(':').collect();
                if parts.len() > 1 {
                    match TransactionId::from_bytes(&hex::decode(parts[1]).unwrap_or_default()) {
                        Ok(tx_id) => {
                            match self.blockchain.get_transaction(&tx_id).await {
                                Ok(Some(tx)) => {
                                    format!("{{\"id\": \"{}\", \"amount\": {}, \"timestamp\": {}, \"status\": \"found\"}}",
                                            tx.id, tx.amount, tx.timestamp)
                                },
                                _ => "{\"error\": \"Transaction not found\"}".to_string(),
                            }
                        },
                        _ => "{\"error\": \"Invalid transaction ID\"}".to_string(),
                    }
                } else {
                    "{\"error\": \"Invalid request\"}".to_string()
                }
            },
            _ => "{\"error\": \"Unknown request\"}".to_string(),
        }
    }
}