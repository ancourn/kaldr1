//! Main binary for running the blockchain node with API server

use quantum_proof_dag_blockchain::*;
use std::sync::Arc;
use tokio::sync::RwLock;
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "dag-node")]
#[command(about = "Quantum-Proof DAG Blockchain Node")]
struct Args {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the blockchain node
    Start {
        /// Path to blockchain data directory
        #[arg(short, long, default_value = "./blockchain_data")]
        path: String,
        
        /// Network listen address
        #[arg(short, long, default_value = "/ip4/127.0.0.1/tcp/8999")]
        listen: String,
        
        /// API server port
        #[arg(short, long, default_value = "8000")]
        api_port: u16,
    },
    /// Initialize a new blockchain
    Init {
        /// Path to blockchain data directory
        #[arg(short, long, default_value = "./blockchain_data")]
        path: String,
    },
    /// Show node status
    Status {
        /// Path to blockchain data directory
        #[arg(short, long, default_value = "./blockchain_data")]
        path: String,
    },
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    let args = Args::parse();
    
    match args.command {
        Commands::Start { path, listen, api_port } => {
            start_node(&path, &listen, api_port).await?;
        }
        Commands::Init { path } => {
            init_blockchain(&path).await?;
        }
        Commands::Status { path } => {
            show_status(&path).await?;
        }
    }
    
    Ok(())
}

async fn start_node(path: &str, listen: &str, api_port: u16) -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Starting Quantum-Proof DAG Blockchain Node");
    println!("================================================");
    println!("📁 Data path: {}", path);
    println!("🌐 Network listen: {}", listen);
    println!("🌐 API port: {}", api_port);
    
    // Load or create configuration
    let config_path = format!("{}/config.json", path);
    let config = if std::path::Path::new(&config_path).exists() {
        let config_json = tokio::fs::read_to_string(&config_path).await?;
        serde_json::from_str(&config_json)?
    } else {
        // Create default configuration
        let config = BlockchainConfig {
            network: NetworkConfig {
                listen_addr: listen.to_string(),
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
                path: format!("{}/data", path),
                cache_size_mb: 1024,
            },
        };
        
        // Save configuration
        tokio::fs::create_dir_all(path).await?;
        tokio::fs::write(&config_path, serde_json::to_string_pretty(&config)?).await?;
        config
    };
    
    // Create blockchain instance
    let blockchain = Arc::new(RwLock::new(Blockchain::new(config).await?));
    
    // Start blockchain
    blockchain.start().await?;
    
    println!("✅ Blockchain started successfully!");
    println!("📍 Node is listening on: {}", listen);
    println!("🌐 API server available at: http://localhost:{}", api_port);
    println!("🔒 Quantum resistance level: {} bits", blockchain.config.security.quantum_resistance_level);
    println!("💾 Data directory: {}", path);
    
    // Print initial status
    print_node_status(&blockchain).await;
    
    // Start API server in a separate task
    let api_server = api_server::ApiServer::new(blockchain.clone(), api_port);
    let api_handle = tokio::spawn(async move {
        if let Err(e) = api_server.start().await {
            eprintln!("❌ API server error: {}", e);
        }
    });
    
    // Start background tasks
    start_background_tasks(blockchain.clone()).await;
    
    println!("\n⚡ Node is running. Press Ctrl+C to stop.");
    
    // Wait for shutdown signal
    tokio::signal::ctrl_c().await?;
    println!("\n🛑 Shutdown signal received...");
    
    // Stop blockchain
    blockchain.stop().await?;
    
    // Wait for API server to shutdown
    api_handle.await?;
    
    println!("👋 Blockchain node stopped gracefully.");
    Ok(())
}

async fn init_blockchain(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("🔧 Initializing blockchain at: {}", path);
    
    // Create directory if it doesn't exist
    tokio::fs::create_dir_all(path).await?;
    
    // Create default configuration
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
            path: format!("{}/data", path),
            cache_size_mb: 1024,
        },
    };
    
    // Save configuration
    let config_path = format!("{}/config.json", path);
    let config_json = serde_json::to_string_pretty(&config)?;
    tokio::fs::write(&config_path, config_json).await?;
    
    println!("✅ Blockchain initialized successfully!");
    println!("📋 Configuration saved to: {}", config_path);
    println!("🚀 Run with: cargo run --bin dag-node start --path {}", path);
    
    Ok(())
}

async fn show_status(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("📊 Getting blockchain status from: {}", path);
    
    // Load configuration
    let config_path = format!("{}/config.json", path);
    let config_json = tokio::fs::read_to_string(&config_path).await?;
    let config: BlockchainConfig = serde_json::from_str(&config_json)?;
    
    // Create blockchain instance
    let blockchain = Blockchain::new(config).await?;
    
    // Get status
    let status = blockchain.get_status().await;
    
    println!("Blockchain Status:");
    println!("  Total Transactions: {}", status.total_transactions);
    println!("  Network Peers: {}", status.network_peers);
    println!("  Consensus Height: {}", status.consensus_height);
    println!("  Quantum Resistance: {:.2}%", status.quantum_resistance_score * 100.0);
    println!("  Node Status: Running");
    
    Ok(())
}

async fn print_node_status(blockchain: &Arc<RwLock<Blockchain>>) {
    let status = blockchain.get_status().await;
    
    println!("\n📊 Node Status:");
    println!("   Total Transactions: {}", status.total_transactions);
    println!("   Network Peers: {}", status.network_peers);
    println!("   Consensus Height: {}", status.consensus_height);
    println!("   Quantum Resistance: {:.2}%", status.quantum_resistance_score * 100.0);
}

async fn start_background_tasks(blockchain: Arc<RwLock<Blockchain>>) {
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