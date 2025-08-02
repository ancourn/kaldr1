#!/bin/bash

# Build script for Quantum-Proof DAG Blockchain

set -e

echo "🚀 Building Quantum-Proof DAG Blockchain..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust from https://rustup.rs/"
    exit 1
fi

# Check if required dependencies are installed
echo "📋 Checking dependencies..."

# Install OpenSSL development headers if needed
if ! pkg-config --exists openssl; then
    echo "⚠️  OpenSSL development headers not found. Installing..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y pkg-config libssl-dev
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install openssl
    fi
fi

# Install CMake if needed
if ! command -v cmake &> /dev/null; then
    echo "⚠️  CMake not found. Installing..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y cmake
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cmake
    fi
fi

# Build the project
echo "🔨 Building project..."
cargo build --release

# Run tests
echo "🧪 Running tests..."
cargo test

# Create release directory
echo "📦 Creating release..."
mkdir -p release
cp target/release/dag-node release/
cp target/release/dag-cli release/
cp target/release/libquantum_dag.so release/ 2>/dev/null || true
cp target/release/libquantum_dag.dylib release/ 2>/dev/null || true

# Create example configuration
echo "📝 Creating example configuration..."
mkdir -p release/config
cat > release/config/default.json << EOF
{
  "network": {
    "listen_addr": "/ip4/0.0.0.0/tcp/8999",
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
EOF

# Create startup script
cat > release/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Quantum-Proof DAG Blockchain..."

# Set default values
CONFIG_PATH=${1:-"./config/default.json"}
LISTEN_ADDR=${2:-"/ip4/0.0.0.0/tcp/8999"}

# Check if config exists
if [ ! -f "$CONFIG_PATH" ]; then
    echo "❌ Configuration file not found: $CONFIG_PATH"
    exit 1
fi

# Start the node
echo "📋 Using configuration: $CONFIG_PATH"
echo "🌐 Listening on: $LISTEN_ADDR"
echo "🔧 Starting node..."

./dag-node start \
    --path "$(dirname "$CONFIG_PATH")" \
    --listen "$LISTEN_ADDR"
EOF

chmod +x release/start.sh

# Create example usage script
cat > release/example.sh << 'EOF'
#!/bin/bash
echo "📚 Quantum-Proof DAG Blockchain - Example Usage"
echo "================================================"

# Initialize blockchain
echo "1. Initializing blockchain..."
./dag-cli init --path ./example_blockchain

# Generate keys
echo "2. Generating quantum-resistant keys..."
./dag-cli generate-keys \
    --private-key ./example_blockchain/private_key.json \
    --public-key ./example_blockchain/public_key.json

# Start node in background
echo "3. Starting node..."
./start.sh ./example_blockchain/config.json /ip4/127.0.0.1/tcp/8999 &
NODE_PID=$!

# Wait for node to start
echo "4. Waiting for node to start..."
sleep 5

# Get status
echo "5. Getting blockchain status..."
./dag-cli status --node http://127.0.0.1:8999

# Create transaction
echo "6. Creating transaction..."
./dag-cli transaction \
    --sender $(cat ./example_blockchain/public_key.json | jq -r '.public_key') \
    --receiver $(cat ./example_blockchain/public_key.json | jq -r '.public_key') \
    --amount 100 \
    --node http://127.0.0.1:8999

# Run benchmark
echo "7. Running benchmark..."
./dag-cli benchmark --count 10 --node http://127.0.0.1:8999

# Stop node
echo "8. Stopping node..."
kill $NODE_PID

echo "✅ Example completed!"
EOF

chmod +x release/example.sh

echo "✅ Build completed successfully!"
echo "📦 Release files created in ./release/"
echo "🚀 To start the blockchain: ./release/start.sh"
echo "📚 To run example: ./release/example.sh"
echo "📖 For more information, see README.md"