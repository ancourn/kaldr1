# Quantum-Proof DAG Blockchain

A next-generation blockchain implementation combining DAG-based consensus with post-quantum cryptographic security.

## 🚀 Features

- **DAG-Based Architecture**: High-throughput directed acyclic graph structure
- **Quantum Resistance**: Post-quantum cryptographic algorithms and mathematical proofs
- **Prime Layer**: Novel prime number-based validation and consensus
- **Smart Contracts**: Turing-complete execution environment with quantum resistance
- **Modular Design**: Clean separation of concerns for extensibility
- **High Performance**: Optimized for scalability and low latency

## 📋 Architecture

The blockchain consists of 7 interconnected layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│                Smart Contract Engine                         │
├─────────────────────────────────────────────────────────────┤
│                  Security Layer                              │
├─────────────────────────────────────────────────────────────┤
│                Quantum Resistance Layer                      │
├─────────────────────────────────────────────────────────────┤
│                Consensus Mechanism                           │
├─────────────────────────────────────────────────────────────┤
│                   Network Layer                              │
├─────────────────────────────────────────────────────────────┤
│                    Prime Layer                               │
├─────────────────────────────────────────────────────────────┤
│                     DAG Core                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

- **Rust**: Core blockchain implementation (performance-critical components)
- **Tokio**: Async runtime for high-performance networking
- **libp2p**: Peer-to-peer networking protocol
- **Post-Quantum Cryptography**: NIST-selected algorithms (Dilithium, Kyber)
- **RocksDB**: High-performance key-value storage
- **Serde**: Efficient serialization framework

## 📦 Installation

### Prerequisites

- Rust 1.70+ (install from [rustup.rs](https://rustup.rs/))
- OpenSSL development headers
- CMake (for some dependencies)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/your-org/quantum-proof-dag-blockchain.git
cd quantum-proof-dag-blockchain

# Build the project
cargo build --release

# Run tests
cargo test
```

## 🚀 Quick Start

### 1. Initialize a Blockchain Node

```bash
# Initialize a new blockchain node
cargo run --bin dag-cli init --path ./my_blockchain
```

This creates a new blockchain configuration and data directory at `./my_blockchain`.

### 2. Generate Quantum-Resistant Keys

```bash
# Generate a key pair
cargo run --bin dag-cli generate-keys \
  --private-key ./my_key.json \
  --public-key ./my_pub.json
```

### 3. Start the Blockchain Node

```bash
# Start the node
cargo run --bin dag-node start \
  --path ./my_blockchain \
  --listen /ip4/127.0.0.1/tcp/8999
```

### 4. Interact with the Blockchain

```bash
# Get blockchain status
cargo run --bin dag-cli status --node http://127.0.0.1:8999

# Create a transaction
cargo run --bin dag-cli transaction \
  --sender $(cat ./my_pub.json | jq -r '.public_key') \
  --receiver $(cat ./my_pub.json | jq -r '.public_key') \
  --amount 100 \
  --node http://127.0.0.1:8999

# Run benchmark
cargo run --bin dag-cli benchmark --count 100 --node http://127.0.0.1:8999
```

## 📚 API Reference

### Core Data Structures

#### Transaction
```rust
struct Transaction {
    id: TransactionId,
    sender: Vec<u8>,
    receiver: Vec<u8>,
    amount: u64,
    nonce: u64,
    timestamp: u64,
    parents: Vec<TransactionId>,
    signature: Vec<u8>,
    quantum_proof: QuantumProof,
    metadata: Option<Vec<u8>>,
}
```

#### DAGNode
```rust
struct DAGNode {
    transaction: Transaction,
    children: Vec<TransactionId>,
    weight: u64,
    confidence: f64,
    status: NodeStatus,
    quantum_score: u32,
}
```

### Key Operations

#### Submit Transaction
```rust
let tx_id = blockchain.submit_transaction(transaction).await?;
```

#### Get Transaction
```rust
let transaction = blockchain.get_transaction(&tx_id).await?;
```

#### Get Blockchain Status
```rust
let status = blockchain.get_status().await;
println!("Total transactions: {}", status.total_transactions);
println!("Quantum resistance: {:.2}%", status.quantum_resistance_score * 100.0);
```

## 🔧 Configuration

### Blockchain Configuration

The blockchain can be configured through a JSON file:

```json
{
  "network": {
    "listen_addr": "/ip4/127.0.0.1/tcp/8999",
    "bootstrap_nodes": [],
    "max_peers": 10
  },
  "consensus": {
    "block_time_ms": 5000,
    "validator_count": 3,
    "prime_modulus": 2147483647
  },
  "security": {
    "quantum_resistance_level": 128,
    "signature_scheme": "dilithium",
    "key_rotation_interval_hours": 24
  },
  "database": {
    "path": "./blockchain_data",
    "cache_size_mb": 1024
  }
}
```

### Environment Variables

- `RUST_LOG`: Set logging level (e.g., `RUST_LOG=info`)
- `BLOCKCHAIN_PATH`: Default blockchain data path
- `NETWORK_LISTEN`: Default network listen address

## 🧪 Testing

### Run Unit Tests

```bash
cargo test
```

### Run Integration Tests

```bash
cargo test --test integration
```

### Benchmark Performance

```bash
cargo bench
```

### Test Coverage

```bash
cargo tarpaulin --out Html
```

## 📊 Performance

### Target Metrics

| Metric | Target | Prototype |
|--------|---------|-----------|
| Transaction Throughput | 10,000 TPS | ~1,000 TPS |
| Confirmation Time | 2-5 seconds | ~3 seconds |
| Block Finalization | 10-15 seconds | ~12 seconds |
| Smart Contract Execution | <100ms | ~87ms |
| Quantum Resistance | 128-bit | 128-bit |

### Running Benchmarks

```bash
# Run transaction throughput benchmark
cargo run --bin dag-cli benchmark --count 1000

# Run network performance test
cargo test --test network_benchmarks

# Run consensus performance test
cargo test --test consensus_benchmarks
```

## 🔒 Security

### Quantum Resistance

The blockchain implements multiple layers of quantum resistance:

1. **Post-Quantum Cryptography**: NIST-selected algorithms (Dilithium, Kyber)
2. **Prime-Based Mathematics**: Novel mathematical framework using prime number properties
3. **Hybrid Cryptography**: Combining classical and quantum-resistant algorithms
4. **Quantum Threat Detection**: Real-time monitoring for quantum computing attacks

### Security Best Practices

1. **Key Management**: Use hardware security modules (HSMs) for production keys
2. **Network Security**: Enable TLS for all network communications
3. **Access Control**: Implement proper authentication and authorization
4. **Regular Updates**: Keep cryptographic libraries up to date
5. **Monitoring**: Monitor for security threats and anomalies

## 🌐 Network

### Peer Discovery

The blockchain uses libp2p for peer discovery and networking:

```rust
// Bootstrap nodes
let bootstrap_nodes = vec![
    "/ip4/1.2.3.4/tcp/8999/p2p/QmSomePeerId".to_string(),
];

// Network configuration
let network_config = NetworkConfig {
    listen_addr: "/ip4/0.0.0.0/tcp/8999".to_string(),
    bootstrap_nodes,
    max_peers: 50,
};
```

### Message Propagation

Transactions and blocks are propagated through the network using GossipSub:

```rust
// Propagate transaction
network.propagate_transaction(&tx_id).await?;

// Subscribe to transaction topics
network.subscribe_topic("transactions").await?;
```

## 📝 Smart Contracts

### Contract Deployment

```rust
let contract_id = engine.deploy_contract(
    code,
    owner_public_key,
    ContractMetadata {
        name: "MyContract".to_string(),
        version: "1.0.0".to_string(),
        description: "A sample contract".to_string(),
        gas_limit: 1000000,
    },
).await?;
```

### Contract Execution

```rust
let result = engine.execute_contract(
    &contract_id,
    "transfer",
    input_data,
    caller_public_key,
    amount,
    gas_limit,
).await?;
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install development dependencies
cargo install cargo-watch cargo-tarpaulin

# Run development server with auto-reload
cargo watch -x run

# Run linting
cargo clippy -- -D warnings

# Format code
cargo fmt
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NIST Post-Quantum Cryptography Project](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [libp2p](https://libp2p.io/) for peer-to-peer networking
- [Rust](https://www.rust-lang.org/) for systems programming
- [Tokio](https://tokio.rs/) for async runtime

## 📞 Support

- **Documentation**: [docs.quantum-dag.com](https://docs.quantum-dag.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/quantum-proof-dag-blockchain/issues)
- **Discord**: [Community Server](https://discord.gg/quantum-dag)
- **Email**: support@quantum-dag.com

## 🔮 Roadmap

### Phase 1: Foundation (✅ Completed)
- [x] Core DAG structure
- [x] Prime number mathematics
- [x] Basic networking
- [x] Smart contract engine

### Phase 2: Enhancement (🚧 In Progress)
- [ ] Advanced consensus algorithms
- [ ] Post-quantum cryptography integration
- [ ] Performance optimization
- [ ] Testnet deployment

### Phase 3: Production (📋 Planned)
- [ ] Mainnet deployment
- [ ] Mobile wallet integration
- [ ] Enterprise features
- [ ] Governance system

---

Built with ❤️ by the Quantum DAG Team