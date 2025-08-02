#!/bin/bash

# KALDRIX Production Deployment Script
# This script deploys the KALDRIX blockchain and website to production

set -e

echo "🚀 KALDRIX Production Deployment"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
DEPLOY_ENV="production"
DEPLOY_USER="kaldrix"
DEPLOY_HOST="production.kaldrix.com"
DEPLOY_DIR="/opt/kaldrix"
BACKUP_DIR="/opt/kaldrix-backups"
DOMAIN="kaldrix.com"
API_DOMAIN="api.kaldrix.com"
MONITORING_DOMAIN="monitor.kaldrix.com"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] && [ ! -f "Cargo.toml" ]; then
        print_error "Neither package.json nor Cargo.toml found. Please run from project root."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if we have production environment variables
    if [ ! -f ".env.production" ]; then
        print_warning "Production environment file not found. Creating template..."
        create_env_template
    fi
    
    print_success "Prerequisites check passed"
}

# Function to create environment template
create_env_template() {
    cat > .env.production << EOF
# KALDRIX Production Environment Variables
DEPLOY_ENV=production
DOMAIN=$DOMAIN
API_DOMAIN=$API_DOMAIN
MONITORING_DOMAIN=$MONITORING_DOMAIN

# Database Configuration
DATABASE_URL=sqlite:///data/blockchain.db
DATABASE_MAX_CONNECTIONS=20

# Security Configuration
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Blockchain Configuration
NETWORK_ID=1
CHAIN_ID=kaldrix-mainnet-1
GENESIS_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# API Configuration
API_PORT=8080
API_RATE_LIMIT=100
API_TIMEOUT=30

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
ALERTMANAGER_PORT=9093

# SSL Configuration
SSL_EMAIL=admin@$DOMAIN
SSL_STAGING=false

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/kaldrix/app.log

# Performance Configuration
MAX_CONCURRENT_USERS=10000
MAX_TPS=10000
CACHE_TTL=300

# Security Configuration
CORS_ORIGIN=https://$DOMAIN
ALLOWED_HOSTS=$DOMAIN,$API_DOMAIN,$MONITORING_DOMAIN
EOF
    
    print_success "Created .env.production template. Please review and update values."
}

# Function to build the application
build_application() {
    print_status "Building application for production..."
    
    # Build Rust backend
    print_status "Building Rust backend..."
    cargo build --release
    
    if [ $? -eq 0 ]; then
        print_success "Rust backend built successfully"
    else
        print_error "Failed to build Rust backend"
        exit 1
    fi
    
    # Build Next.js frontend
    if [ -f "package.json" ]; then
        print_status "Building Next.js frontend..."
        npm ci
        npm run build
        
        if [ $? -eq 0 ]; then
            print_success "Next.js frontend built successfully"
        else
            print_error "Failed to build Next.js frontend"
            exit 1
        fi
    fi
    
    print_success "Application built successfully"
}

# Function to create production Docker images
create_docker_images() {
    print_status "Creating production Docker images..."
    
    # Create production Dockerfile for backend
    cat > Dockerfile.production << EOF
FROM rust:1.75-slim AS builder

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src
COPY mobile-sdk ./mobile-sdk

# Build the application
RUN cargo build --release

# Runtime image
FROM debian:12-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/api-server /usr/local/bin/
COPY --from=builder /app/target/release/dag-node /usr/local/bin/

# Copy configuration files
COPY config ./config
COPY scripts ./scripts

# Create data directory
RUN mkdir -p /data /logs /secure/keys

# Set permissions
RUN chmod +x /usr/local/bin/api-server /usr/local/bin/dag-node

# Expose ports
EXPOSE 8080 8999

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["/usr/local/bin/api-server"]
EOF
    
    # Create production Dockerfile for frontend
    if [ -d "src/app" ]; then
        cat > Dockerfile.frontend << EOF
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runtime image
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
    fi
    
    # Build Docker images
    print_status "Building backend Docker image..."
    docker build -f Dockerfile.production -t kaldrix/backend:latest .
    
    if [ -f "Dockerfile.frontend" ]; then
        print_status "Building frontend Docker image..."
        docker build -f Dockerfile.frontend -t kaldrix/frontend:latest .
    fi
    
    print_success "Docker images created successfully"
}

# Function to create production Docker Compose
create_docker_compose() {
    print_status "Creating production Docker Compose configuration..."
    
    cat > docker-compose.production.yml << EOF
version: '3.8'

services:
  # Backend API Server
  backend:
    image: kaldrix/backend:latest
    container_name: kaldrix-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "8999:8999"
    environment:
      - DEPLOY_ENV=production
      - DATABASE_URL=sqlite:///data/blockchain.db
      - JWT_SECRET=\${JWT_SECRET}
      - ENCRYPTION_KEY=\${ENCRYPTION_KEY}
      - NETWORK_ID=1
      - CHAIN_ID=kaldrix-mainnet-1
    volumes:
      - ./data:/data
      - ./logs:/logs
      - ./secure:/secure
      - ./config:/config
    networks:
      - kaldrix-network
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
        reservations:
          cpus: '2.0'
          memory: 4G

  # Frontend Web Server
  frontend:
    image: kaldrix/frontend:latest
    container_name: kaldrix-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    networks:
      - kaldrix-network
    depends_on:
      - backend
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: kaldrix-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - kaldrix-network
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: kaldrix-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - kaldrix-network
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Grafana Dashboard
  grafana:
    image: grafana/grafana:latest
    container_name: kaldrix-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - kaldrix-network
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD}
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    container_name: kaldrix-alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    networks:
      - kaldrix-network
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.2'
          memory: 256M

volumes:
  redis-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  alertmanager-data:
    driver: local

networks:
  kaldrix-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF
    
    print_success "Production Docker Compose configuration created"
}

# Function to deploy to production
deploy_to_production() {
    print_status "Deploying to production environment..."
    
    # Create necessary directories
    print_status "Creating deployment directories..."
    mkdir -p $DEPLOY_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $DEPLOY_DIR/data
    mkdir -p $DEPLOY_DIR/logs
    mkdir -p $DEPLOY_DIR/secure
    mkdir -p $DEPLOY_DIR/config
    mkdir -p $DEPLOY_DIR/ssl
    
    # Copy configuration files
    print_status "Copying configuration files..."
    cp -r config/* $DEPLOY_DIR/config/
    cp -r monitoring $DEPLOY_DIR/
    
    # Copy environment file
    cp .env.production $DEPLOY_DIR/.env
    
    # Copy Docker Compose file
    cp docker-compose.production.yml $DEPLOY_DIR/docker-compose.yml
    
    # Set permissions
    print_status "Setting permissions..."
    chmod 600 $DEPLOY_DIR/.env
    chmod 700 $DEPLOY_DIR/secure
    chmod 755 $DEPLOY_DIR/scripts/*.sh
    
    # Deploy to production server
    if [ "$DEPLOY_HOST" != "localhost" ]; then
        print_status "Deploying to remote server: $DEPLOY_HOST"
        
        # Copy files to remote server
        rsync -avz --exclude='node_modules' --exclude='target' \
            ./ $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR/
        
        # SSH into remote server and deploy
        ssh $DEPLOY_USER@$DEPLOY_HOST << EOF
            cd $DEPLOY_DIR
            
            # Stop existing services
            docker-compose down
            
            # Pull latest images
            docker-compose pull
            
            # Start services
            docker-compose up -d
            
            # Wait for services to be healthy
            sleep 30
            
            # Check service status
            docker-compose ps
            
            # Check logs
            docker-compose logs --tail=50 backend
EOF
    else
        print_status "Deploying to local environment..."
        
        # Stop existing services
        cd $DEPLOY_DIR
        docker-compose down
        
        # Start services
        docker-compose up -d
        
        # Wait for services to be healthy
        sleep 30
        
        # Check service status
        docker-compose ps
        
        # Check logs
        docker-compose logs --tail=50 backend
    fi
    
    print_success "Deployment completed successfully"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Checking deployment health (attempt $attempt/$max_attempts)..."
        
        # Check backend health
        if curl -s -f "http://localhost:8080/health" > /dev/null 2>&1; then
            print_success "Backend is healthy"
        else
            print_warning "Backend is not responding"
        fi
        
        # Check frontend
        if curl -s -f "http://localhost" > /dev/null 2>&1; then
            print_success "Frontend is accessible"
        else
            print_warning "Frontend is not accessible"
        fi
        
        # Check API endpoints
        if curl -s -f "http://localhost:8080/api/blockchain/status" > /dev/null 2>&1; then
            print_success "API endpoints are accessible"
        else
            print_warning "API endpoints are not accessible"
        fi
        
        # Check monitoring
        if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
            print_success "Grafana is accessible"
        else
            print_warning "Grafana is not accessible"
        fi
        
        if curl -s -f "http://localhost:9090" > /dev/null 2>&1; then
            print_success "Prometheus is accessible"
        else
            print_warning "Prometheus is not accessible"
        fi
        
        attempt=$((attempt + 1))
        sleep 10
    done
    
    print_success "Deployment verification completed"
}

# Function to create backup
create_backup() {
    print_status "Creating pre-deployment backup..."
    
    local backup_time=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/pre-deploy-$backup_time"
    
    mkdir -p $backup_path
    
    # Backup database
    if [ -d "$DEPLOY_DIR/data" ]; then
        cp -r $DEPLOY_DIR/data $backup_path/
    fi
    
    # Backup configuration
    if [ -d "$DEPLOY_DIR/config" ]; then
        cp -r $DEPLOY_DIR/config $backup_path/
    fi
    
    # Backup secure files
    if [ -d "$DEPLOY_DIR/secure" ]; then
        cp -r $DEPLOY_DIR/secure $backup_path/
    fi
    
    # Backup Docker Compose file
    if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
        cp $DEPLOY_DIR/docker-compose.yml $backup_path/
    fi
    
    # Create backup archive
    tar -czf "$backup_path.tar.gz" -C $BACKUP_DIR "pre-deploy-$backup_time"
    rm -rf "$backup_path"
    
    print_success "Backup created: $backup_path.tar.gz"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups..."
    
    # Keep only the last 10 backups
    cd $BACKUP_DIR
    ls -t *.tar.gz | tail -n +11 | xargs rm -f
    
    print_success "Old backups cleaned up"
}

# Main deployment function
main() {
    print_status "Starting KALDRIX production deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Build application
    build_application
    
    # Create Docker images
    create_docker_images
    
    # Create Docker Compose configuration
    create_docker_compose
    
    # Deploy to production
    deploy_to_production
    
    # Verify deployment
    verify_deployment
    
    # Cleanup old backups
    cleanup_old_backups
    
    print_status "================================"
    print_status "Deployment Summary"
    print_status "================================"
    print_success "KALDRIX blockchain deployed successfully!"
    print_status "Services running:"
    print_status "  - Frontend: http://localhost"
    print_status "  - Backend API: http://localhost:8080"
    print_status "  - Grafana: http://localhost:3000"
    print_status "  - Prometheus: http://localhost:9090"
    print_status "  - Alertmanager: http://localhost:9093"
    print_status "================================"
    
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            DEPLOY_ENV="$2"
            shift 2
            ;;
        --host)
            DEPLOY_HOST="$2"
            shift 2
            ;;
        --user)
            DEPLOY_USER="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            API_DOMAIN="api.$2"
            MONITORING_DOMAIN="monitor.$2"
            shift 2
            ;;
        --backup-only)
            create_backup
            cleanup_old_backups
            exit 0
            ;;
        --verify-only)
            verify_deployment
            exit 0
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --env ENV         Deployment environment (default: production)"
            echo "  --host HOST       Deployment host (default: production.kaldrix.com)"
            echo "  --user USER       Deployment user (default: kaldrix)"
            echo "  --domain DOMAIN   Domain name (default: kaldrix.com)"
            echo "  --backup-only     Only create backup"
            echo "  --verify-only     Only verify deployment"
            echo "  --help, -h        Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"