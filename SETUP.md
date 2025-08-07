# 🚀 Complete Integration Guide

This guide shows how to set up and run the complete Quantum-Proof DAG Blockchain with both frontend and backend.

## 📋 Prerequisites

- **Node.js** 18+ (for frontend)
- **Rust** 1.70+ (for backend)
- **Docker** & **Docker Compose** (optional, for containerized deployment)

## 🛠️ Quick Start

### Option 1: Development Environment (Recommended)

#### 1. Install Dependencies
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y pkg-config libssl-dev cmake build-essential clang libclang-dev protobuf-compiler

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Setup Project
```bash
# Clone or navigate to project directory
cd quantum-proof-dag-blockchain

# Install Node.js dependencies
npm install

# Build Rust backend
cargo build --release
```

#### 3. Start Development Servers
```bash
# Start backend (in terminal 1)
cargo run --bin dag-node

# Start frontend (in terminal 2)
npm run dev
```

#### 4. Access the Application
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/health

### Option 2: Docker Environment

#### 1. Start with Docker Compose
```bash
# Start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Nginx Proxy**: http://localhost (if enabled)

## 🔧 Manual Setup

### Backend Setup

#### 1. Build the Backend
```bash
# Navigate to backend directory
cd blockchain-backend

# Build release version
cargo build --release

# Run tests
cargo test

# Check code formatting
cargo fmt --check

# Run linter
cargo clippy -- -D warnings
```

#### 2. Start Backend Server
```bash
# Run with default configuration
cargo run --bin dag-node

# Run with custom configuration
cargo run --bin dag-node -- --path ./my_blockchain --listen /ip4/0.0.0.0/tcp/8999

# Run API server only
cargo run --bin api-server
```

#### 3. Backend API Endpoints
```
GET  /health              # Health check
GET  /status              # Blockchain status
GET  /transactions        # List transactions
POST /transactions        # Create transaction
GET  /transactions/{id}   # Get transaction by ID
GET  /dag                 # List DAG nodes
GET  /dag/{id}           # Get DAG node by ID
GET  /dag/tips            # Get DAG tips
```

### Frontend Setup

#### 1. Install Dependencies
```bash
# Navigate to frontend directory
cd blockchain-frontend

# Install Node.js dependencies
npm install
```

#### 2. Environment Configuration
Create `.env.local` file:
```env
# Blockchain Backend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Development
NODE_ENV=development
```

#### 3. Start Development Server
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm test

# Run linter
npm run lint
```

## 🧪 Testing the Integration

### 1. Test Backend API
```bash
# Test health endpoint
curl http://localhost:8080/health

# Test blockchain status
curl http://localhost:8080/status

# Test transactions
curl http://localhost:8080/transactions

# Create transaction
curl -X POST http://localhost:8080/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "0x1234567890123456789012345678901234567890",
    "receiver": "0x0987654321098765432109876543210987654321",
    "amount": 100,
    "fee": 1
  }'
```

### 2. Test Frontend Integration
```bash
# Start both backend and frontend
# Open http://localhost:3000 in browser

# Check browser console for API calls
# Verify real-time updates are working
# Test transaction creation from UI
```

### 3. Test End-to-End
```bash
# Create transaction via frontend
# Verify it appears in transaction list
# Check backend logs for transaction processing
# Verify blockchain status updates in real-time
```

## 🔌 Configuration

### Backend Configuration

#### Environment Variables
```bash
# Rust logging
RUST_LOG=info

# Blockchain configuration
BLOCKCHAIN_PATH=./blockchain_data
NETWORK_LISTEN=/ip4/0.0.0.0/tcp/8999
API_PORT=8080

# Security
QUANTUM_RESISTANCE_LEVEL=128
SIGNATURE_SCHEME=dilithium
```

#### Configuration File
Create `config.json`:
```json
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
```

### Frontend Configuration

#### Next.js Configuration
Update `next.config.ts`:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

## 🐳 Docker Deployment

### Build and Run
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f blockchain-backend
docker-compose logs -f blockchain-frontend

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v
```

### Production Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  blockchain-backend:
    build:
      context: .
      dockerfile: blockchain-backend/Dockerfile
    environment:
      - RUST_LOG=info
      - BLOCKCHAIN_PATH=/app/data
    volumes:
      - blockchain-data:/app/data
    restart: unless-stopped
    
  blockchain-frontend:
    build:
      context: .
      dockerfile: blockchain-frontend/Dockerfile
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://blockchain-backend:8080
      - NODE_ENV=production
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Backend Won't Start
```bash
# Check Rust installation
cargo --version
rustc --version

# Check system dependencies
pkg-config --exists openssl

# Build with verbose output
cargo build --release --verbose
```

#### 2. Frontend Can't Connect to Backend
```bash
# Check if backend is running
curl http://localhost:8080/health

# Check environment variables
echo $NEXT_PUBLIC_BACKEND_URL

# Check CORS configuration
curl -v http://localhost:8080/status
```

#### 3. Docker Issues
```bash
# Check Docker status
docker --version
docker-compose --version

# Rebuild images
docker-compose build --no-cache

# Clean Docker system
docker system prune -a
```

#### 4. Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :8080
lsof -i :8999

# Kill processes using ports
sudo kill -9 $(lsof -t -i:3000)
```

### Debug Commands

#### Backend Debugging
```bash
# Enable debug logging
RUST_LOG=debug cargo run --bin dag-node

# Run with backtrace
RUST_BACKTRACE=1 cargo run --bin dag-node

# Check memory usage
valgrind --tool=memcheck cargo run --bin dag-node
```

#### Frontend Debugging
```bash
# Start with debug mode
NODE_OPTIONS='--inspect' npm run dev

# Check build output
npm run build 2>&1 | tee build.log

# Test API routes
curl http://localhost:3000/api/blockchain/status
```

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:8080/health

# Frontend health
curl http://localhost:3000/api/health

# Docker health
docker-compose ps
```

### Log Management
```bash
# Backend logs
cargo run --bin dag-node 2>&1 | tee backend.log

# Frontend logs
npm run dev 2>&1 | tee frontend.log

# Docker logs
docker-compose logs -f blockchain-backend
```

### Performance Monitoring
```bash
# Backend performance
cargo bench

# Frontend performance
npm run build -- --profile
```

## 🚀 Deployment

### Production Checklist
- [ ] Set up environment variables
- [ ] Configure database/storage
- [ ] Set up SSL certificates
- [ ] Configure monitoring
- [ ] Set up logging
- [ ] Test backup/restore
- [ ] Security audit
- [ ] Performance testing

### Production Commands
```bash
# Build production versions
cargo build --release
npm run build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🎯 Next Steps

1. **Customize Configuration**: Adjust settings for your use case
2. **Add Features**: Implement additional blockchain features
3. **Security Audit**: Review security implementation
4. **Performance Testing**: Test under load
5. **Deploy to Production**: Set up production environment

## 📞 Support

- **Documentation**: Check `/docs` directory
- **Issues**: Create GitHub issue with error details
- **Discord**: Join community server for support
- **Email**: support@quantum-dag.com

---

🎉 **Congratulations! Your Quantum-Proof DAG Blockchain is now fully integrated and ready to use!**