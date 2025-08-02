#!/bin/bash

# Development script for Quantum-Proof DAG Blockchain

set -e

echo "🚀 Quantum-Proof DAG Blockchain Development Environment"
echo "========================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Check for Node.js
    if ! command_exists node; then
        echo "❌ Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check for Rust
    if ! command_exists cargo; then
        echo "🔧 Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    fi
    
    # Install Node.js dependencies
    echo "📥 Installing Node.js dependencies..."
    npm install
    
    # Install system dependencies for Rust
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🔧 Installing system dependencies..."
        sudo apt-get update
        sudo apt-get install -y \
            pkg-config \
            libssl-dev \
            cmake \
            build-essential \
            clang \
            libclang-dev \
            protobuf-compiler
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🔧 Installing system dependencies..."
        brew install openssl cmake protobuf
    fi
    
    echo "✅ Dependencies installed successfully!"
}

# Function to build backend
build_backend() {
    echo "🔨 Building Rust backend..."
    cargo build --release
    echo "✅ Backend built successfully!"
}

# Function to build frontend
build_frontend() {
    echo "🔨 Building Next.js frontend..."
    npm run build
    echo "✅ Frontend built successfully!"
}

# Function to start development servers
start_dev() {
    echo "🚀 Starting development environment..."
    
    # Start backend in background
    echo "🔧 Starting backend..."
    cargo run --bin dag-node &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend
    echo "🌐 Starting frontend..."
    npm run dev &
    FRONTEND_PID=$!
    
    echo "✅ Development environment started!"
    echo "📍 Frontend: http://localhost:3000"
    echo "📍 Backend API: http://localhost:8080"
    echo "📍 Backend P2P: localhost:8999"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; exit 0' INT
    
    # Keep script running
    wait
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    
    echo "🔧 Testing Rust backend..."
    cargo test
    
    echo "🌐 Testing frontend..."
    npm test
    
    echo "✅ All tests passed!"
}

# Function to lint code
lint_code() {
    echo "🔍 Linting code..."
    
    echo "🔧 Linting Rust backend..."
    cargo clippy -- -D warnings
    
    echo "🌐 Linting frontend..."
    npm run lint
    
    echo "✅ Code linted successfully!"
}

# Function to format code
format_code() {
    echo "✨ Formatting code..."
    
    echo "🔧 Formatting Rust backend..."
    cargo fmt
    
    echo "🌐 Formatting frontend..."
    npm run format 2>/dev/null || echo "Format script not found in package.json"
    
    echo "✅ Code formatted successfully!"
}

# Function to show help
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  install     Install all dependencies"
    echo "  build       Build both frontend and backend"
    echo "  build-fe    Build frontend only"
    echo "  build-be    Build backend only"
    echo "  dev         Start development environment"
    echo "  test        Run all tests"
    echo "  lint        Lint all code"
    echo "  format      Format all code"
    echo "  clean       Clean build artifacts"
    echo "  docker      Start Docker environment"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install    # Install dependencies"
    echo "  $0 dev        # Start development servers"
    echo "  $0 test       # Run tests"
}

# Function to clean build artifacts
clean_artifacts() {
    echo "🧹 Cleaning build artifacts..."
    
    # Clean Rust artifacts
    cargo clean
    
    # Clean Node.js artifacts
    rm -rf .next node_modules/.cache
    
    # Clean Docker artifacts
    docker system prune -f 2>/dev/null || true
    
    echo "✅ Build artifacts cleaned!"
}

# Function to start Docker environment
start_docker() {
    echo "🐳 Starting Docker environment..."
    
    # Build and start services
    docker-compose up --build -d
    
    echo "✅ Docker environment started!"
    echo "📍 Frontend: http://localhost:3000"
    echo "📍 Backend API: http://localhost:8080"
    echo "📍 Backend P2P: localhost:8999"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
}

# Main script logic
case "${1:-}" in
    "install")
        install_dependencies
        ;;
    "build")
        build_backend
        build_frontend
        ;;
    "build-fe")
        build_frontend
        ;;
    "build-be")
        build_backend
        ;;
    "dev")
        start_dev
        ;;
    "test")
        run_tests
        ;;
    "lint")
        lint_code
        ;;
    "format")
        format_code
        ;;
    "clean")
        clean_artifacts
        ;;
    "docker")
        start_docker
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        echo "❌ No command specified. Use 'help' to see available commands."
        exit 1
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        exit 1
        ;;
esac