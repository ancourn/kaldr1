# Quantum DAG Blockchain Mobile SDK

A comprehensive, secure, and easy-to-use mobile SDK for interacting with the Quantum DAG Blockchain network.

## Features

- **🔒 Security First**: End-to-end encryption, secure key management, and quantum-resistant cryptography
- **📱 Cross-Platform**: Support for iOS, Android, React Native, and Flutter
- **🚀 High Performance**: Efficient caching, batch operations, and optimized network communication
- **🔧 Developer Friendly**: Simple API, comprehensive documentation, and type-safe interfaces
- **🌐 Network Resilience**: Automatic retry, failover, and connection management
- **💾 Secure Storage**: Encrypted wallet storage, backup, and recovery
- **📊 Real-time Updates**: WebSocket support for live blockchain events
- **🎯 Light Client**: SPV verification and efficient blockchain synchronization

## Installation

### Rust

Add this to your `Cargo.toml`:

```toml
[dependencies]
quantum-dag-mobile-sdk = "0.1.0"
```

### React Native

```bash
npm install quantum-dag-mobile-sdk
# or
yarn add quantum-dag-mobile-sdk
```

### Flutter

```yaml
dependencies:
  quantum_dag_mobile_sdk: ^0.1.0
```

## Quick Start

### Basic Usage

```rust
use quantum_dag_mobile_sdk::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize SDK
    let config = SDKConfig::default();
    let sdk = QuantumDAGSDK::new(config)?;

    // Create a new wallet
    let wallet = sdk.create_wallet("secure-passphrase").await?;
    println!("Wallet created: {}", wallet.address);

    // Get wallet balance
    let balance = sdk.get_balance(&wallet.address).await?;
    println!("Balance: {}", balance);

    // Send a transaction
    let tx_hash = sdk.send_transaction("recipient_address", 1000, None).await?;
    println!("Transaction sent: {}", tx_hash);

    // Get transaction status
    let status = sdk.get_transaction_status(&tx_hash).await?;
    println!("Transaction status: {:?}", status);

    Ok(())
}
```

### Configuration

```rust
use quantum_dag_mobile_sdk::*;

let config = SDKConfig {
    network: NetworkConfig {
        node_urls: vec![
            "https://mainnet.quantum-dag.com".to_string(),
            "https://backup.quantum-dag.com".to_string(),
        ],
        ws_urls: vec![
            "wss://mainnet.quantum-dag.com/ws".to_string(),
        ],
        network_type: NetworkType::Mainnet,
        timeout_secs: 30,
        max_retries: 3,
        retry_delay_ms: 1000,
    },
    security: SecurityConfig {
        enable_encryption: true,
        key_derivation_iterations: 100000,
        enable_biometric: true,
        enable_pin: true,
        pin_length: 6,
        session_timeout_mins: 30,
        ..Default::default()
    },
    storage: StorageConfig {
        enable_cache: true,
        cache_size_mb: 50,
        enable_backup: true,
        backup_interval_hours: 24,
        max_backup_files: 10,
        ..Default::default()
    },
    logging: LoggingConfig {
        enable_logging: true,
        log_level: LogLevel::Info,
        enable_console: true,
        ..Default::default()
    },
};

let sdk = QuantumDAGSDK::new(config)?;
```

## Core Components

### 1. Wallet Management

```rust
// Create new wallet
let wallet = sdk.create_wallet("my-secure-passphrase").await?;

// Import existing wallet
let wallet = sdk.import_wallet(
    "word1 word2 word3 ...", 
    "my-secure-passphrase"
).await?;

// List all wallets
let wallets = sdk.wallet_manager().list_wallets().await?;

// Switch between wallets
sdk.wallet_manager().set_current_wallet("wallet-id").await?;

// Backup wallet
sdk.backup_wallet("/path/to/backup.wallet").await?;

// Restore from backup
let wallet = sdk.restore_wallet("/path/to/backup.wallet", "passphrase").await?;
```

### 2. Transaction Operations

```rust
// Build and send transaction
let transaction = TransactionBuilder::new()
    .from_wallet(&wallet)
    .to("recipient-address")
    .amount(1000)
    .fee(100)
    .build()?;

let tx_hash = sdk.send_transaction(&transaction).await?;

// Get transaction details
let transaction = sdk.client().get_transaction(&tx_hash).await?;

// Get transaction status
let status = sdk.get_transaction_status(&tx_hash).await?;

// Get transaction history
let filter = TransactionFilter {
    sender: Some(wallet.address.clone()),
    status: Some(TransactionStatus::Confirmed),
    ..Default::default()
};

let options = QueryOptions::new()
    .with_filter(filter)
    .with_pagination(PaginationOptions::new(1, 20));

let transactions = sdk.client().get_transactions(&options).await?;
```

### 3. Network Communication

```rust
// Get blockchain status
let status = sdk.get_blockchain_status().await?;
println!("Network height: {}", status.consensus_height);

// Get network info
let network_info = sdk.get_network_info().await?;
println!("Total nodes: {}", network_info.total_nodes);

// Check node health
let health = sdk.check_node_health().await?;
println!("Node healthy: {}", health.is_healthy);

// Get connected peers
let peers = sdk.get_connected_peers().await?;
println!("Connected peers: {}", peers.len());

// Subscribe to real-time events
sdk.connect_websocket().await?;
sdk.subscribe_to_transactions(&wallet.address).await?;
sdk.subscribe_to_blocks().await?;
```

### 4. Security Features

```rust
// Generate secure keys
let mnemonic = sdk.crypto().generate_mnemonic()?;
let seed = sdk.crypto().mnemonic_to_seed(&mnemonic, "")?;
let keypair = sdk.crypto().generate_key_pair(&seed)?;

// Sign and verify
let data = b"important data";
let signature = sdk.crypto().sign(data, &keypair.private_key)?;
let verified = sdk.crypto().verify_signature(data, &signature, &keypair.public_key)?;

// Encrypt and decrypt data
let encrypted = sdk.crypto().encrypt(data, &encryption_key)?;
let decrypted = sdk.crypto().decrypt(&encrypted, &encryption_key)?;

// Generate quantum-resistant signature
let quantum_sig = sdk.crypto().generate_quantum_signature(data, &keypair.private_key)?;
let quantum_verified = sdk.crypto().verify_quantum_signature(data, &quantum_sig, &keypair.public_key)?;
```

## Advanced Features

### 1. Caching and Performance

```rust
// Enable caching for better performance
let config = SDKConfig {
    storage: StorageConfig {
        enable_cache: true,
        cache_size_mb: 100,
        ..Default::default()
    },
    ..Default::default()
};

let sdk = QuantumDAGSDK::new(config)?;

// Cache will automatically store frequently accessed data
let balance = sdk.get_balance(&address).await?; // First call - network request
let balance = sdk.get_balance(&address).await?; // Second call - from cache
```

### 2. Event Handling

```rust
use std::sync::Arc;

// Create event bus for custom events
let mut event_bus = EventBus::<BlockchainEvent>::new();

// Subscribe to events
event_bus.subscribe(|event| {
    match event.event_type.as_str() {
        "new_transaction" => println!("New transaction: {}", event.data),
        "new_block" => println!("New block: {}", event.data),
        _ => {}
    }
});

// Publish events
event_bus.publish(BlockchainEvent {
    id: Utils::generate_uuid(),
    event_type: "custom_event".to_string(),
    data: serde_json::json!({"message": "Hello World"}),
    timestamp: Utc::now(),
    block_number: None,
    transaction_hash: None,
});
```

### 3. Network Utilities

```rust
use quantum_dag_mobile_sdk::network::NetworkUtils;

let network_utils = NetworkUtils::new(10);

// Check network connectivity
let is_connected = network_utils.check_internet_connectivity().await?;

// Get network latency
let latency = network_utils.get_network_latency("mainnet.quantum-dag.com", 443).await?;

// Scan ports
let ports = vec![80, 443, 8080, 8443];
let scan_results = network_utils.scan_ports("mainnet.quantum-dag.com", &ports).await?;

// Get network quality score
let quality_score = network_utils.get_network_quality_score().await?;
println!("Network quality: {}%", quality_score.score);
```

### 4. Error Handling

```rust
match sdk.send_transaction("recipient", 1000, None).await {
    Ok(tx_hash) => {
        println!("Transaction sent successfully: {}", tx_hash);
    },
    Err(SDKError::Network(msg)) => {
        eprintln!("Network error: {}", msg);
        // Retry with different node
    },
    Err(SDKError::Wallet(msg)) => {
        eprintln!("Wallet error: {}", msg);
        // Check wallet status
    },
    Err(SDKError::Crypto(msg)) => {
        eprintln!("Crypto error: {}", msg);
        // Check cryptographic operations
    },
    Err(e) => {
        eprintln!("Unexpected error: {}", e);
    }
}
```

## Platform-Specific Integration

### iOS Integration

```swift
import QuantumDagMobileSDK

// Initialize SDK
let config = SDKConfig(
    network: NetworkConfig(
        nodeUrls: ["https://mainnet.quantum-dag.com"],
        networkType: .mainnet
    ),
    security: SecurityConfig(
        enableBiometric: true,
        enableFaceID: true
    )
)

let sdk = try QuantumDAGSDK(config: config)

// Create wallet
let wallet = try await sdk.createWallet(passphrase: "secure123")

// Send transaction
let txHash = try await sdk.sendTransaction(
    to: "recipient-address",
    amount: 1000
)
```

### Android Integration

```kotlin
import com.quantum.dag.sdk.QuantumDAGSDK
import com.quantum.dag.sdk.SDKConfig

// Initialize SDK
val config = SDKConfig(
    network = NetworkConfig(
        nodeUrls = listOf("https://mainnet.quantum-dag.com"),
        networkType = NetworkType.MAINNET
    ),
    security = SecurityConfig(
        enableBiometric = true,
        enablePin = true
    )
)

val sdk = QuantumDAGSDK(config)

// Create wallet
val wallet = sdk.createWallet("secure123").await()

// Send transaction
val txHash = sdk.sendTransaction(
    to = "recipient-address",
    amount = 1000L
).await()
```

### React Native Integration

```javascript
import { QuantumDAGSDK } from 'quantum-dag-mobile-sdk';

// Initialize SDK
const config = {
  network: {
    nodeUrls: ['https://mainnet.quantum-dag.com'],
    networkType: 'mainnet'
  },
  security: {
    enableBiometric: true,
    enablePin: true
  }
};

const sdk = new QuantumDAGSDK(config);

// Create wallet
const wallet = await sdk.createWallet('secure123');

// Send transaction
const txHash = await sdk.sendTransaction({
  to: 'recipient-address',
  amount: 1000
});
```

## Security Best Practices

### 1. Secure Key Management

```rust
// Always use strong passphrases
let passphrase = "this-is-a-very-strong-passphrase-123!";

// Never store passphrases in plain text
let encrypted_passphrase = sdk.crypto().encrypt(
    passphrase.as_bytes(),
    &encryption_key
)?;

// Use secure storage for sensitive data
sdk.storage().store_secure_data("wallet_key", &encrypted_key).await?;
```

### 2. Network Security

```rust
// Always use HTTPS/WSS
let config = SDKConfig {
    network: NetworkConfig {
        node_urls: vec!["https://mainnet.quantum-dag.com".to_string()],
        ws_urls: vec!["wss://mainnet.quantum-dag.com/ws".to_string()],
        ..Default::default()
    },
    ..Default::default()
};

// Validate SSL certificates
let cert_info = sdk.network().get_ssl_cert_info("mainnet.quantum-dag.com", 443).await?;
if !cert_info.is_valid {
    return Err(SDKError::Network("Invalid SSL certificate".to_string()));
}
```

### 3. Input Validation

```rust
// Always validate user input
if !Validator::validate_address(&user_input_address) {
    return Err(SDKError::Validation("Invalid address".to_string()));
}

if !Validator::validate_amount(amount) {
    return Err(SDKError::Validation("Invalid amount".to_string()));
}
```

## Performance Optimization

### 1. Caching Strategy

```rust
// Use caching for frequently accessed data
let balance = sdk.get_balance(&address).await?; // Cached

// Clear cache when needed
sdk.storage().clear_cache().await?;

// Set appropriate TTL for cache entries
sdk.storage().store_cache("balance", &balance_data, 300).await?; // 5 minutes
```

### 2. Batch Operations

```rust
// Send multiple transactions efficiently
let transactions = vec![
    ("address1", 100),
    ("address2", 200),
    ("address3", 300),
];

let results = futures::future::join_all(
    transactions.into_iter().map(|(address, amount)| {
        sdk.send_transaction(address, amount, None)
    })
).await;
```

### 3. Connection Pooling

```rust
// Configure connection pooling
let config = SDKConfig {
    network: NetworkConfig {
        node_urls: vec![
            "https://node1.quantum-dag.com".to_string(),
            "https://node2.quantum-dag.com".to_string(),
            "https://node3.quantum-dag.com".to_string(),
        ],
        max_retries: 3,
        retry_delay_ms: 1000,
        ..Default::default()
    },
    ..Default::default()
};
```

## Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_wallet_creation() {
        let config = SDKConfig::default();
        let sdk = QuantumDAGSDK::new(config).unwrap();
        
        let wallet = sdk.create_wallet("test-passphrase").await.unwrap();
        assert!(!wallet.address.is_empty());
        assert!(wallet.is_active);
    }

    #[tokio::test]
    async fn test_transaction_flow() {
        let config = SDKConfig::default();
        let sdk = QuantumDAGSDK::new(config).unwrap();
        
        let wallet = sdk.create_wallet("test-passphrase").await.unwrap();
        let tx_hash = sdk.send_transaction("test-address", 1000, None).await.unwrap();
        
        let status = sdk.get_transaction_status(&tx_hash).await.unwrap();
        assert!(matches!(status, TransactionStatus::Pending | TransactionStatus::Confirmed));
    }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.quantum-dag.com](https://docs.quantum-dag.com)
- **API Reference**: [https://api.quantum-dag.com](https://api.quantum-dag.com)
- **Issues**: [GitHub Issues](https://github.com/quantum-dag/mobile-sdk/issues)
- **Discord**: [https://discord.gg/quantum-dag](https://discord.gg/quantum-dag)

## Changelog

### v0.1.0
- Initial release
- Core wallet management
- Transaction operations
- Network communication
- Security features
- Cross-platform support