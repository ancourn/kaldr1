<<<<<<< HEAD
# 🚀 Welcome to Z.ai Code Scaffold

A modern, production-ready web application scaffold powered by cutting-edge technologies, designed to accelerate your development with [Z.ai](https://chat.z.ai)'s AI-powered coding assistance.

## ✨ Technology Stack

This scaffold provides a robust foundation built with:

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Why This Scaffold?

- **🏎️ Fast Development** - Pre-configured tooling and best practices
- **🎨 Beautiful UI** - Complete shadcn/ui component library with advanced interactions
- **🔒 Type Safety** - Full TypeScript configuration with Zod validation
- **📱 Responsive** - Mobile-first design principles with smooth animations
- **🗄️ Database Ready** - Prisma ORM configured for rapid backend development
- **🔐 Auth Included** - NextAuth.js for secure authentication flows
- **📊 Data Visualization** - Charts, tables, and drag-and-drop functionality
- **🌍 i18n Ready** - Multi-language support with Next Intl
- **🚀 Production Ready** - Optimized build and deployment settings
- **🤖 AI-Friendly** - Structured codebase perfect for AI assistance

## 🚀 Quick Start

<<<<<<< HEAD
=======
# KALDRIX Quantum DAG Blockchain - Mini-Testnet Kit

🚀 A complete mini-testnet implementation of the KALDRIX quantum-resistant DAG blockchain system with real-time monitoring, stress testing, and reliability features.

## 🌟 Features

### Core Blockchain Features
- **Quantum-Resistant Cryptography**: ML-DSA, SPHINCS+, Falcon, and Bulletproofs
- **DAG Architecture**: Directed Acyclic Graph for high throughput and scalability
- **Multi-Shard Processing**: Parallel transaction validation across multiple shards
- **GPU Acceleration**: Hardware acceleration for cryptographic operations
- **Transaction Batching**: Efficient batch processing with signature aggregation

### Reliability & Availability
- **Automatic Failover**: Node failure detection and automatic recovery
- **Consensus Catch-up**: Blockchain state synchronization and recovery
- **Failure Simulation**: Chaos engineering with predefined failure scenarios
- **99.99% SLA**: Comprehensive availability monitoring and alerting
- **Stress Testing**: Load testing with configurable intensity levels

### Monitoring & Dashboard
- **Real-time Dashboard**: Live metrics and system health visualization
- **WebSocket API**: Real-time updates for all metrics
- **REST API**: Comprehensive HTTP API for all operations
- **Performance Metrics**: TPS, latency, availability, and resource usage
- **Alert System**: Configurable alerts and notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Python 3 (for configuration scripts)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ancourn/blocktest.git
cd blocktest
```

2. **Install dependencies**
```bash
npm install
```

3. **Deploy the mini-testnet**
```bash
./scripts/deploy-testnet.sh
```

4. **Access the dashboard**
Open your browser and navigate to `http://localhost:3000`

### Manual Setup

If you prefer manual setup:

1. **Start individual nodes**
```bash
# Terminal 1 - Validator Node
npm run start -- --port 3000 --node-id kaldrix-validator-1 --role validator

# Terminal 2 - Miner Node  
npm run start -- --port 3001 --node-id kaldrix-miner-1 --role miner

# Terminal 3 - Observer Node
npm run start -- --port 3002 --node-id kaldrix-observer-1 --role observer
```

2. **Start the dashboard**
```bash
npm run dashboard
```

## 📊 Dashboard Features

The real-time dashboard provides:

### Key Metrics
- **Network Availability**: Real-time uptime and SLA compliance
- **Active Nodes**: Node health and connectivity status
- **Transactions Per Second**: Current TPS vs target TPS
- **Consensus Health**: Blockchain consensus status and sync progress

### Real-time Charts
- **Network Performance**: TPS and availability over time
- **Resource Usage**: CPU, memory, network, and storage utilization
- **Node Status**: Individual node health metrics

### Control Panel
- **Start/Stop Nodes**: Dynamic node management
- **Testnet Control**: Start and stop the entire testnet
- **Failure Simulation**: Inject failures for testing
- **Stress Testing**: Run load tests with configurable parameters

### Alerts & Notifications
- **Real-time Alerts**: Instant notifications for system events
- **Incident Tracking**: Complete incident lifecycle management
- **Severity Levels**: Critical, warning, and info alerts

## 🔧 Configuration

### Network Configuration
Edit `config/network.json` to customize:
- Network parameters and genesis settings
- Consensus algorithm configuration
- Sharding and quantum cryptography settings
- GPU acceleration and batching options

### Node Configuration
Individual node configurations are in `config/node-*.json`:
- Node roles (validator, miner, observer)
- API and WebSocket ports
- Data directories and logging
- Feature flags and monitoring settings

### Environment Variables
Key environment variables:
```bash
KALDRIX_NETWORK_NAME=kaldrix-mini-testnet
KALDRIX_NODE_ID=kaldrix-node-1
KALDRIX_ROLE=validator
KALDRIX_PORT=3000
KALDRIX_DATA_DIR=./data
KALDRIX_LOG_LEVEL=info
```

## 🧪 Testing

### Health Check
```bash
./scripts/health-check.sh
```

### Stress Testing
```bash
# Basic stress test
./scripts/stress-test.sh

# Custom stress test
./scripts/stress-test.sh --duration 10 --intensity HIGH --target-tps 5000
```

### Failure Simulation
```bash
# Simulate node failure
curl -X POST http://localhost:8080/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"action": "start_scenario", "scenarioId": "node-cascade", "targetNodes": ["node-1"]}'

# Simulate network partition
curl -X POST http://localhost:8080/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"action": "start_scenario", "scenarioId": "network-split"}'
```

## 📡 API Reference

### REST API Endpoints

#### Health & Status
- `GET /health` - Basic health check
- `GET /node/info` - Node information
- `GET /metrics` - All metrics
- `GET /metrics?endpoint=health` - Health metrics
- `GET /metrics?endpoint=cluster` - Cluster status
- `GET /metrics?endpoint=availability` - Availability metrics
- `GET /metrics?endpoint=consensus` - Consensus status
- `GET /metrics?endpoint=tps` - TPS metrics

#### Control Operations
- `POST /api/metrics` - Control operations
  ```json
  {
    "action": "register_node",
    "nodeId": "kaldrix-node-4"
  }
  ```

#### Transaction Submission
- `POST /transactions` - Submit transactions
  ```json
  {
    "transactions": [
      {
        "id": "tx_001",
        "from": "0x...",
        "to": "0x...",
        "amount": "1000",
        "gas": "21000"
      }
    ]
  }
  ```

### WebSocket API

Connect to `ws://localhost:3000` for real-time updates:

#### Subscribe to Channels
```javascript
const socket = io('http://localhost:3000');
socket.emit('subscribe', {
  channels: ['cluster', 'availability', 'consensus', 'tps', 'alerts']
});
```

#### Real-time Events
- `cluster_update` - Node status changes
- `availability_update` - Availability metrics
- `consensus_update` - Consensus progress
- `tps_update` - TPS metrics
- `alert_triggered` - System alerts

## 🏗️ Architecture

### Node Types

#### Validator Nodes
- Participate in consensus
- Validate transactions and blocks
- Earn staking rewards
- Required: 10,000 tokens stake

#### Miner Nodes
- Create new blocks
- Participate in mining
- Earn block rewards
- Configurable hash power

#### Observer Nodes
- Read-only access
- API endpoints for data
- No consensus participation
- Full data retention

### Components

#### Core Components
- **Failover Manager**: Node health monitoring and automatic failover
- **Consensus Catch-up**: Blockchain state synchronization
- **Multi-Shard Processor**: Parallel transaction validation
- **GPU Accelerator**: Hardware-accelerated cryptography
- **Transaction Batcher**: Efficient batch processing

#### Reliability Components
- **Failure Simulator**: Chaos engineering and testing
- **Availability Monitor**: SLA monitoring and alerting
- **Stress Test Environment**: Load testing framework
- **TPS Target Manager**: Performance scaling management

## 🔒 Security Features

### Quantum Resistance
- **ML-DSA**: Module-Lattice-Based Digital Signature Algorithm
- **SPHINCS+**: Stateless Hash-Based Digital Signature Scheme
- **Falcon**: Fast Fourier lattice-based compact signatures
- **Bulletproofs**: Non-interactive zero-knowledge proofs

### Network Security
- **TLS Encryption**: Secure communication between nodes
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting and DDoS protection

### Data Security
- **Encryption-at-Rest**: Encrypted storage
- **Backup & Recovery**: Automated backup system
- **Audit Logging**: Comprehensive audit trails
- **Key Management**: Secure key rotation and backup

## 📈 Performance

### Benchmarks
- **Target TPS**: 75,000 transactions per second
- **Latency**: <100ms average confirmation time
- **Availability**: 99.99% uptime SLA
- **Scalability**: Linear scaling with node count

### Optimization Features
- **GPU Acceleration**: 10-50x speedup for cryptographic operations
- **Transaction Batching**: 90% reduction in cryptographic overhead
- **Multi-Shard Processing**: Parallel validation across 4+ shards
- **Signature Aggregation**: Efficient batch signature verification

## 🛠️ Development

### Building from Source
>>>>>>> f46aed39bb4f6e27a70aca0d026937b7c67c8ce6
=======
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
```bash
# Install dependencies
npm install

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

## 🤖 Powered by Z.ai

This scaffold is optimized for use with [Z.ai](https://chat.z.ai) - your AI assistant for:

- **💻 Code Generation** - Generate components, pages, and features instantly
- **🎨 UI Development** - Create beautiful interfaces with AI assistance  
- **🔧 Bug Fixing** - Identify and resolve issues with intelligent suggestions
- **📝 Documentation** - Auto-generate comprehensive documentation
- **🚀 Optimization** - Performance improvements and best practices

Ready to build something amazing? Start chatting with Z.ai at [chat.z.ai](https://chat.z.ai) and experience the future of AI-powered development!

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🎨 Available Features & Components

This scaffold includes a comprehensive set of modern web development tools:

### 🧩 UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar

### 📊 Advanced Data Features
- **Tables**: Powerful data tables with sorting, filtering, pagination (TanStack Table)
- **Charts**: Beautiful visualizations with Recharts
- **Forms**: Type-safe forms with React Hook Form + Zod validation

### 🎨 Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Drag & Drop**: Modern drag-and-drop functionality with DND Kit
- **Theme Switching**: Built-in dark/light mode support

### 🔐 Backend Integration
- **Authentication**: Ready-to-use auth flows with NextAuth.js
- **Database**: Type-safe database operations with Prisma
- **API Client**: HTTP requests with Axios + TanStack Query
- **State Management**: Simple and scalable with Zustand

### 🌍 Production Features
- **Internationalization**: Multi-language support with Next Intl
- **Image Optimization**: Automatic image processing with Sharp
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Essential Hooks**: 100+ useful React hooks with ReactUse for common patterns

## 🤝 Get Started with Z.ai

1. **Clone this scaffold** to jumpstart your project
2. **Visit [chat.z.ai](https://chat.z.ai)** to access your AI coding assistant
3. **Start building** with intelligent code generation and assistance
4. **Deploy with confidence** using the production-ready setup

---

Built with ❤️ for the developer community. Supercharged by [Z.ai](https://chat.z.ai) 🚀
=======
<<<<<<< HEAD
# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Code Structure
```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── reliability/      # Reliability dashboard
│   ├── performance/      # Performance dashboard
│   └── ui/               # UI components
├── lib/                  # Core libraries
│   ├── reliability/      # Reliability components
│   ├── sharding/         # Multi-shard processing
│   ├── gpu/              # GPU acceleration
│   ├── batching/         # Transaction batching
│   └── tps/              # TPS management
├── config/               # Configuration files
├── scripts/              # Deployment and utility scripts
└── public/               # Static assets
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Node Won't Start
```bash
# Check logs
tail -f logs/node-1/node.log

# Check configuration
node start-node.js --validate-config config/node-1.json
```

#### Dashboard Not Loading
```bash
# Check if dashboard is running
curl http://localhost:3000

# Restart dashboard
npm run dashboard
```

#### Low TPS
```bash
# Check system resources
htop

# Run performance diagnostics
npm run diagnostics

# Optimize configuration
./scripts/optimize-config.sh
```

### Log Files
- Node logs: `logs/node-*/node.log`
- Dashboard logs: `logs/dashboard.log`
- API logs: `logs/api.log`
- System logs: `logs/system.log`
=======
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
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<<<<<<< HEAD
### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commits
- Ensure code passes linting
=======
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
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

<<<<<<< HEAD
- **Quantum Resistance**: Based on NIST post-quantum cryptography standards
- **DAG Architecture**: Inspired by modern DAG-based blockchain implementations
- **GPU Computing**: CUDA and OpenCL acceleration frameworks
- **Monitoring**: Prometheus and Grafana-inspired metrics collection

## 📞 Support

- **Documentation**: [Wiki](https://github.com/ancourn/blocktest/wiki)
- **Issues**: [GitHub Issues](https://github.com/ancourn/blocktest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ancourn/blocktest/discussions)
- **Discord**: [Community Server](https://discord.gg/kaldrix)

---

🚀 **Happy testing with KALDRIX Mini-Testnet!** 🚀
>>>>>>> f46aed39bb4f6e27a70aca0d026937b7c67c8ce6
=======
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
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
