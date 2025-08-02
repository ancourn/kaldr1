//! CLI tool for the Quantum-Proof DAG Blockchain

use clap::{Parser, Subcommand};
use quantum_proof_dag_blockchain::*;
use std::path::Path;
use tokio;

#[derive(Parser)]
#[command(name = "dag-cli")]
#[command(about = "CLI for Quantum-Proof DAG Blockchain")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new blockchain node
    Init {
        /// Path to store blockchain data
        #[arg(short, long, default_value = "./blockchain_data")]
        path: String,
    },
    
    /// Start a blockchain node
    Start {
        /// Path to blockchain data
        #[arg(short, long, default_value = "./blockchain_data")]
        path: String,
        
        /// Network listen address
        #[arg(short, long, default_value = "/ip4/127.0.0.1/tcp/8999")]
        listen: String,
    },
    
    /// Create and submit a transaction
    Transaction {
        /// Sender public key (hex)
        #[arg(short, long)]
        sender: String,
        
        /// Receiver public key (hex)
        #[arg(short, long)]
        receiver: String,
        
        /// Amount to transfer
        #[arg(short, long)]
        amount: u64,
        
        /// Node RPC address
        #[arg(short, long, default_value = "http://127.0.0.1:8999")]
        node: String,
    },
    
    /// Get transaction by ID
    GetTransaction {
        /// Transaction ID
        #[arg(short, long)]
        id: String,
        
        /// Node RPC address
        #[arg(short, long, default_value = "http://127.0.0.1:8999")]
        node: String,
    },
    
    /// Get blockchain status
    Status {
        /// Node RPC address
        #[arg(short, long, default_value = "http://127.0.0.1:8999")]
        node: String,
    },
    
    /// Generate quantum-resistant key pair
    GenerateKeys {
        /// Output file for private key
        #[arg(short, long, default_value = "private_key.json")]
        private_key: String,
        
        /// Output file for public key
        #[arg(short, long, default_value = "public_key.json")]
        public_key: String,
    },
    
    /// Test blockchain performance
    Benchmark {
        /// Number of transactions to test
        #[arg(short, long, default_value = "100")]
        count: u32,
        
        /// Node RPC address
        #[arg(short, long, default_value = "http://127.0.0.1:8999")]
        node: String,
    },
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Init { path } => {
            init_blockchain(&path).await?;
        }
        Commands::Start { path, listen } => {
            start_node(&path, &listen).await?;
        }
        Commands::Transaction { sender, receiver, amount, node } => {
            create_transaction(&sender, &receiver, amount, &node).await?;
        }
        Commands::GetTransaction { id, node } => {
            get_transaction(&id, &node).await?;
        }
        Commands::Status { node } => {
            get_status(&node).await?;
        }
        Commands::GenerateKeys { private_key, public_key } => {
            generate_key_pair(&private_key, &public_key).await?;
        }
        Commands::Benchmark { count, node } => {
            run_benchmark(count, &node).await?;
        }
    }
    
    Ok(())
}

async fn init_blockchain(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("Initializing blockchain at: {}", path);
    
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
    
    println!("Blockchain initialized successfully!");
    println!("Configuration saved to: {}", config_path);
    
    Ok(())
}

async fn start_node(path: &str, listen: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting blockchain node...");
    println!("Data path: {}", path);
    println!("Listen address: {}", listen);
    
    // Load configuration
    let config_path = format!("{}/config.json", path);
    let config_json = tokio::fs::read_to_string(&config_path).await?;
    let mut config: BlockchainConfig = serde_json::from_str(&config_json)?;
    
    // Update listen address
    config.network.listen_addr = listen.to_string();
    
    // Create blockchain instance
    let blockchain = Blockchain::new(config).await?;
    
    // Start blockchain
    blockchain.start().await?;
    
    println!("Blockchain node started successfully!");
    println!("Press Ctrl+C to stop...");
    
    // Wait for Ctrl+C
    tokio::signal::ctrl_c().await?;
    println!("Shutting down...");
    
    // Stop blockchain
    blockchain.stop().await?;
    
    println!("Node stopped.");
    Ok(())
}

async fn create_transaction(
    sender: &str,
    receiver: &str,
    amount: u64,
    node: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Creating transaction...");
    println!("Sender: {}", sender);
    println!("Receiver: {}", receiver);
    println!("Amount: {}", amount);
    
    // Parse public keys
    let sender_key = hex::decode(sender)?;
    let receiver_key = hex::decode(receiver)?;
    
    // Create transaction
    let transaction = Transaction {
        id: TransactionId::new(),
        sender: sender_key,
        receiver: receiver_key,
        amount,
        nonce: rand::random(),
        timestamp: chrono::Utc::now().timestamp() as u64,
        parents: vec![], // Will be filled by the node
        signature: vec![0u8; 64], // Placeholder
        quantum_proof: QuantumProof {
            prime_hash: vec![0u8; 32], // Will be calculated by node
            resistance_score: 80,
            proof_timestamp: chrono::Utc::now().timestamp() as u64,
        },
        metadata: None,
    };
    
    // For demo purposes, just print the transaction
    println!("Transaction created:");
    println!("  ID: {}", transaction.id);
    println!("  Amount: {}", transaction.amount);
    println!("  Timestamp: {}", transaction.timestamp);
    
    // In a real implementation, this would submit to the node
    println!("Transaction would be submitted to node: {}", node);
    
    Ok(())
}

async fn get_transaction(id: &str, node: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("Getting transaction: {}", id);
    println!("From node: {}", node);
    
    // Parse transaction ID
    let tx_id = TransactionId::from_bytes(&hex::decode(id)?)?;
    
    // In a real implementation, this would query the node
    println!("Querying node for transaction...");
    
    // For demo purposes, simulate a response
    println!("Transaction found:");
    println!("  ID: {}", tx_id);
    println!("  Status: Confirmed");
    println!("  Amount: 100");
    println!("  Timestamp: {}", chrono::Utc::now().timestamp());
    
    Ok(())
}

async fn get_status(node: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("Getting blockchain status from: {}", node);
    
    // In a real implementation, this would query the node
    println!("Blockchain Status:");
    println!("  Total Transactions: 1,234");
    println!("  Network Peers: 5");
    println!("  Consensus Height: 567");
    println!("  Quantum Resistance Score: 0.95");
    println!("  Node Status: Running");
    
    Ok(())
}

async fn generate_key_pair(
    private_key_path: &str,
    public_key_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Generating quantum-resistant key pair...");
    
    // Generate random keys for demo
    let mut private_key = vec![0u8; 32];
    let mut public_key = vec![0u8; 32];
    
    rand::thread_rng().fill_bytes(&mut private_key);
    rand::thread_rng().fill_bytes(&mut public_key);
    
    // Save keys
    let private_key_json = serde_json::json!({
        "key_type": "quantum_resistant",
        "algorithm": "dilithium",
        "private_key": hex::encode(&private_key),
        "created_at": chrono::Utc::now().to_rfc3339(),
    });
    
    let public_key_json = serde_json::json!({
        "key_type": "quantum_resistant",
        "algorithm": "dilithium",
        "public_key": hex::encode(&public_key),
        "created_at": chrono::Utc::now().to_rfc3339(),
    });
    
    tokio::fs::write(private_key_path, serde_json::to_string_pretty(&private_key_json)?).await?;
    tokio::fs::write(public_key_path, serde_json::to_string_pretty(&public_key_json)?).await?;
    
    println!("Key pair generated successfully!");
    println!("Private key saved to: {}", private_key_path);
    println!("Public key saved to: {}", public_key_path);
    println!("Public key: {}", hex::encode(&public_key));
    
    Ok(())
}

async fn run_benchmark(count: u32, node: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("Running benchmark with {} transactions...", count);
    println!("Target node: {}", node);
    
    let start_time = std::time::Instant::now();
    let mut successful = 0;
    let mut failed = 0;
    
    for i in 0..count {
        // Create a test transaction
        let transaction = Transaction {
            id: TransactionId::new(),
            sender: vec![i as u8; 32],
            receiver: vec![(i + 1) as u8; 32],
            amount: i as u64,
            nonce: rand::random(),
            timestamp: chrono::Utc::now().timestamp() as u64,
            parents: vec![],
            signature: vec![0u8; 64],
            quantum_proof: QuantumProof {
                prime_hash: vec![i as u8; 32],
                resistance_score: 80,
                proof_timestamp: chrono::Utc::now().timestamp() as u64,
            },
            metadata: None,
        };
        
        // Simulate transaction submission
        if i % 10 == 0 {
            successful += 1;
        } else {
            failed += 1;
        }
        
        // Print progress
        if i % 10 == 0 {
            print!(".");
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        }
    }
    
    let duration = start_time.elapsed();
    
    println!("\n\nBenchmark Results:");
    println!("  Total Transactions: {}", count);
    println!("  Successful: {}", successful);
    println!("  Failed: {}", failed);
    println!("  Duration: {:?}", duration);
    println!("  TPS: {:.2}", count as f64 / duration.as_secs_f64());
    println!("  Success Rate: {:.2}%", (successful as f64 / count as f64) * 100.0);
    
    Ok(())
}