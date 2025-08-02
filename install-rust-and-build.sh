#!/bin/bash

# Script to install Rust toolchain and build blockchain backend

set -e

echo "🔧 Installing Rust toolchain for Quantum-Proof DAG Blockchain..."

# Check if Rust is already installed
if command -v cargo &> /dev/null; then
    echo "✅ Rust is already installed:"
    cargo --version
    rustc --version
    echo ""
    echo "🔧 Updating Rust installation..."
    rustup update
else
    echo "📥 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    
    # Source cargo environment
    source ~/.cargo/env
    
    echo "✅ Rust installed successfully:"
    cargo --version
    rustc --version
fi

echo ""
echo "📦 Installing system dependencies..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux (Ubuntu/Debian)"
    
    # Update package list
    sudo apt-get update
    
    # Install required dependencies
    sudo apt-get install -y \
        pkg-config \
        libssl-dev \
        cmake \
        build-essential \
        clang \
        libclang-dev \
        protobuf-compiler
        
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "📥 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install dependencies with Homebrew
    brew install openssl cmake protobuf
    
else
    echo "⚠️  Unsupported OS: $OSTYPE"
    echo "Please install the following dependencies manually:"
    echo "  - pkg-config"
    echo "  - OpenSSL development headers"
    echo "  - CMake"
    echo "  - Build tools (GCC/Clang)"
    echo "  - Protocol Buffers compiler"
    exit 1
fi

echo "✅ System dependencies installed successfully!"

echo ""
echo "🔍 Verifying installation..."

# Verify Rust installation
if command -v cargo &> /dev/null; then
    echo "✅ Cargo: $(cargo --version)"
else
    echo "❌ Cargo not found in PATH"
    echo "Please run: source ~/.cargo/env"
    exit 1
fi

# Verify OpenSSL
if pkg-config --exists openssl; then
    echo "✅ OpenSSL: $(pkg-config --modversion openssl)"
else
    echo "❌ OpenSSL not found"
    exit 1
fi

# Verify CMake
if command -v cmake &> /dev/null; then
    echo "✅ CMake: $(cmake --version | head -n1)"
else
    echo "❌ CMake not found"
    exit 1
fi

echo ""
echo "🚀 Building blockchain backend..."

# Navigate to backend directory if it exists
if [ -d "blockchain-backend" ]; then
    cd blockchain-backend
    echo "📁 Changed to blockchain-backend directory"
elif [ -f "Cargo.toml" ]; then
    echo "📁 Building in current directory"
else
    echo "❌ Neither blockchain-backend directory nor Cargo.toml found"
    echo "Please run this script from the project root or blockchain-backend directory"
    exit 1
fi

# Check if Cargo.toml exists
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Cargo.toml not found"
    exit 1
fi

echo ""
echo "📥 Fetching dependencies..."
cargo fetch

echo ""
echo "🔨 Building project..."
cargo build --release

echo ""
echo "🧪 Running tests..."
cargo test

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📦 Build artifacts:"
echo "   - Release binary: target/release/dag-node"
echo "   - CLI tool: target/release/dag-cli"
echo "   - Library: target/release/libquantum_dag.so (or .dylib on macOS)"
echo ""
echo "🚀 Quick start commands:"
echo "   - Run node: cargo run --bin dag-node"
echo "   - Run CLI: cargo run --bin dag-cli -- --help"
echo "   - Run tests: cargo test"
echo "   - Build docs: cargo doc --no-deps"
echo ""
echo "📚 Documentation:"
echo "   - Generate docs: cargo doc --open"
echo "   - Check clippy: cargo clippy -- -D warnings"
echo "   - Format code: cargo fmt"
echo ""
echo "🎯 Next steps:"
echo "   1. Initialize blockchain: cargo run --bin dag-cli init --path ./my_blockchain"
echo "   2. Start node: cargo run --bin dag-node start --path ./my_blockchain"
echo "   3. Test with CLI: cargo run --bin dag-cli status"

# Show disk usage
echo ""
echo "💾 Disk usage:"
du -sh target/ 2>/dev/null || echo "Target directory not found"

echo ""
echo "🎉 Rust toolchain installation and blockchain build completed!"