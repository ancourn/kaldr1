//! Combined blockchain node and API server

use quantum_proof_dag_blockchain::*;
use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    println!("🚀 Starting Quantum-Proof DAG Blockchain with API Server");
    println!("=========================================================");
    
    // Parse command line arguments
    let matches = clap::App::new("quantum-dag-server")
        .version("0.1.0")
        .about("Quantum-Proof DAG Blockchain with HTTP API")
        .arg(clap::Arg::with_name("path")
            .long("path")
            .value_name("PATH")
            .help("Blockchain data directory")
            .default_value("./blockchain_data"))
        .arg(clap::Arg::with_name("api-port")
            .long("api-port")
            .value_name("PORT")
            .help("HTTP API server port")
            .default_value("8999"))
        .arg(clap::Arg::with_name("network-port")
            .long("network-port")
            .value_name("PORT")
            .help("Network listen port")
            .default_value("9000"))
        .get_matches();

    let data_path = matches.value_of("path").unwrap();
    let api_port = matches.value_of("api-port").unwrap().parse::<u16>()?;
    let network_port = matches.value_of("network-port").unwrap().parse::<u16>()?;

    println!("📋 Configuration:");
    println!("   Data Path: {}", data_path);
    println!("   API Port: {}", api_port);
    println!("   Network Port: {}", network_port);

    // Create data directory if it doesn't exist
    tokio::fs::create_dir_all(data_path).await?;

    // Create blockchain configuration
    let config = BlockchainConfig {
        network: NetworkConfig {
            listen_addr: format!("/ip4/127.0.0.1/tcp/{}", network_port),
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
            path: format!("{}/data", data_path),
            cache_size_mb: 1024,
        },
    };

    // Create blockchain instance
    println!("🔧 Initializing blockchain...");
    let blockchain = Arc::new(RwLock::new(Blockchain::new(config).await?));

    // Start blockchain
    println!("🌐 Starting blockchain services...");
    blockchain.write().await.start().await?;

    println!("✅ Blockchain started successfully!");

    // Create and start API server
    println!("🌐 Starting API server on port {}", api_port);
    let api_server = crate::api_server::ApiServer::new(blockchain.clone(), api_port);

    // Start background tasks for blockchain
    start_background_tasks(blockchain.clone()).await;

    println!("🚀 All services started successfully!");
    println!("📍 API Server: http://localhost:{}", api_port);
    println!("📍 Network: {}", blockchain.read().await.config.network.listen_addr);
    println!("💾 Data directory: {}", data_path);
    println!("\n⚡ System is running. Press Ctrl+C to stop.");

    // Start API server (this will block)
    api_server.start().await?;

    Ok(())
}

async fn start_background_tasks(blockchain: Arc<RwLock<Blockchain>>) {
    let blockchain_clone = blockchain.clone();
    
    // Task 1: Periodic status updates
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            println!("\n📈 [{}] Status Update:", chrono::Utc::now().format("%H:%M:%S"));
            let status = blockchain_clone.read().await.get_status().await;
            println!("   Total Transactions: {}", status.total_transactions);
            println!("   Network Peers: {}", status.network_peers);
            println!("   Consensus Height: {}", status.consensus_height);
            println!("   Quantum Resistance: {:.2}%", status.quantum_resistance_score * 100.0);
            
            // Update DAG confidence scores
            blockchain_clone.write().await.dag.write().await.update_confidence_scores();
            
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
            
            let status = blockchain.read().await.get_status().await;
            let qr_score = status.quantum_resistance_score;
            
            if qr_score < 0.8 {
                println!("⚠️  Warning: Quantum resistance score below 80% ({:.1}%)", qr_score * 100.0);
            } else {
                println!("🔒 Quantum resistance maintained at {:.1}%", qr_score * 100.0);
            }
        }
    });
    
    // Task 4: Generate sample transactions for demo
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(15));
        
        loop {
            interval.tick().await;
            
            // Generate a sample transaction
            let mut sender = vec![0u8; 32];
            let mut receiver = vec![0u8; 32];
            rand::thread_rng().fill_bytes(&mut sender);
            rand::thread_rng().fill_bytes(&mut receiver);
            
            let transaction = Transaction {
                id: TransactionId::new(),
                sender: sender.clone(),
                receiver: receiver.clone(),
                amount: rand::random::<u64>() % 1000 + 1,
                nonce: rand::random(),
                timestamp: chrono::Utc::now().timestamp() as u64,
                parents: blockchain.read().await.dag.read().await.select_parents(2),
                signature: vec![0u8; 64], // Placeholder
                quantum_proof: crate::core::QuantumProof {
                    prime_hash: vec![0u8; 32],
                    resistance_score: 80 + (rand::random::<u32>() % 20),
                    proof_timestamp: chrono::Utc::now().timestamp() as u64,
                },
                metadata: None,
            };
            
            if let Ok(_) = blockchain.write().await.submit_transaction(transaction).await {
                println!("💰 Sample transaction generated");
            }
        }
    });
}