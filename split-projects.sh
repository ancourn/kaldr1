#!/bin/bash

# Script to split the monorepo into separate frontend and backend projects

echo "🔄 Splitting monorepo into separate projects..."

# Create backup first
echo "📦 Creating backup..."
cp -r . ../monorepo-backup-$(date +%Y%m%d-%H%M%S)

# Create separate directories
echo "📁 Creating project directories..."
mkdir -p blockchain-frontend blockchain-backend

# Move frontend files
echo "🌐 Moving frontend files to blockchain-frontend..."
mv src blockchain-frontend/
mv app blockchain-frontend/
mv public blockchain-frontend/
mv components.json blockchain-frontend/
mv tailwind.config.ts blockchain-frontend/
mv tailwind.config.mjs blockchain-frontend/ 2>/dev/null || true
mv postcss.config.mjs blockchain-frontend/ 2>/dev/null || true
mv next.config.ts blockchain-frontend/
mv tsconfig.json blockchain-frontend/
mv eslint.config.mjs blockchain-frontend/ 2>/dev/null || true

# Copy package.json and modify for frontend
echo "📋 Configuring frontend package.json..."
cp package.json blockchain-frontend/
cd blockchain-frontend

# Remove backend-specific dependencies from frontend package.json
npm pkg delete dependencies.pqcrypto-kyber
npm pkg delete dependencies.pqcrypto-dilithium
npm pkg delete dependencies.libp2p
npm pkg delete dependencies.tokio
npm pkg delete dependencies.rocksdb
npm pkg delete dependencies.bincode
npm pkg delete dependencies.sha3
npm pkg delete dependencies.hex
npm pkg delete dependencies.ed25519-dalek
npm pkg delete dependencies.x25519-dalek
npm pkg delete dependencies.curve25519-dalek
npm pkg delete dependencies.rand
npm pkg delete dependencies.uuid
npm pkg delete dependencies.chrono
npm pkg delete dependencies.serde
npm pkg delete dependencies.serde_json
npm pkg delete dependencies.async-trait
npm pkg delete dependencies.log
npm pkg delete dependencies.env_logger
npm pkg delete dependencies.thiserror
npm pkg delete dependencies.anyhow
npm pkg delete dependencies.cargo
npm pkg delete dependencies.criterion
npm pkg delete dependencies.clap

# Update scripts for frontend only
npm pkg set scripts.dev="next dev"
npm pkg set scripts.build="next build"
npm pkg set scripts.start="next start"
npm pkg set scripts.lint="next lint"

cd ..

# Move backend files
echo "⚙️  Moving backend files to blockchain-backend..."
mv Cargo.toml blockchain-backend/
mv build.sh blockchain-backend/
mv src blockchain-backend/
mv quantum-proof-dag-blockchain-specification.md blockchain-backend/

# Create README for each project
echo "📝 Creating project README files..."

# Frontend README
cat > blockchain-frontend/README.md << 'EOF'
# Blockchain Frontend

Next.js-based frontend for the Quantum-Proof DAG Blockchain dashboard.

## Features
- Real-time blockchain monitoring dashboard
- Transaction visualization
- Network health monitoring
- Quantum resistance metrics
- Responsive design with Tailwind CSS

## Development
\`\`\`bash
npm install
npm run dev
\`\`\`

## Build
\`\`\`bash
npm run build
npm run start
\`\`\`
EOF

# Backend README
cat > blockchain-backend/README.md << 'EOF'
# Blockchain Backend

Rust-based implementation of the Quantum-Proof DAG Blockchain.

## Features
- DAG-based consensus mechanism
- Post-quantum cryptographic security
- Prime number mathematics
- P2P networking
- Smart contract engine

## Development
\`\`\`bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install dependencies
sudo apt-get install pkg-config libssl-dev cmake build-essential

# Build
cargo build

# Test
cargo test

# Run
cargo run --bin dag-node
\`\`\`
EOF

# Create shared documentation directory
echo "📚 Creating shared documentation..."
mkdir -p shared-docs
cp quantum-proof-dag-blockchain-specification.md shared-docs/ 2>/dev/null || true
cp README.md shared-docs/ 2>/dev/null || true

# Create root README with project overview
cat > README.md << 'EOF'
# Quantum-Proof DAG Blockchain

A next-generation blockchain implementation combining DAG-based consensus with post-quantum cryptographic security.

## Project Structure

\`\`\`
├── blockchain-frontend/    # Next.js dashboard frontend
├── blockchain-backend/     # Rust blockchain implementation
├── shared-docs/           # Shared documentation
└── README.md             # This file
\`\`\`

## Quick Start

### Frontend
\`\`\`bash
cd blockchain-frontend
npm install
npm run dev
\`\`\`

### Backend
\`\`\`bash
cd blockchain-backend
# Install Rust and dependencies first
cargo build
cargo run --bin dag-node
\`\`\`

## Features

- **DAG-Based Architecture**: High-throughput directed acyclic graph structure
- **Quantum Resistance**: Post-quantum cryptographic algorithms
- **Smart Contracts**: Turing-complete execution environment
- **P2P Networking**: Decentralized communication protocol
- **Real-time Monitoring**: Live dashboard and analytics

## Documentation

See \`shared-docs/\` for detailed documentation and specifications.
EOF

echo "✅ Project split completed successfully!"
echo ""
echo "📁 Project structure:"
echo "   ├── blockchain-frontend/    # Next.js frontend"
echo "   ├── blockchain-backend/     # Rust backend"
echo "   ├── shared-docs/           # Shared documentation"
echo "   └── README.md             # Project overview"
echo ""
echo "🚀 Next steps:"
echo "   1. cd blockchain-frontend && npm install && npm run dev"
echo "   2. cd blockchain-backend && cargo build"
echo "   3. Check shared-docs/ for documentation"
echo ""
echo "⚠️  Backup created at: ../monorepo-backup-$(date +%Y%m%d-%H%M%S)"