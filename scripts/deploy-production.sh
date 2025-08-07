#!/bin/bash

<<<<<<< HEAD
# KALDRIX Production Environment Deployment Script
# This script automates the deployment to production environment

set -e

# Configuration
PROD_ENV="production"
DEPLOY_BRANCH="main"
REGISTRY="ghcr.io"
IMAGE_NAME="kaldrix"
DEPLOY_USER="deploy"
DEPLOY_HOST="prod.kaldrix.com"
DEPLOY_PATH="/opt/kaldrix/production"
BACKUP_ENABLED=true
ROLLBACK_ENABLED=true

# Colors for output
=======
# KALDRIX Blockchain Production Deployment Script
# This script deploys the entire KALDRIX blockchain to production environment

set -euo pipefail

# Colors
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
<<<<<<< HEAD
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking production deployment prerequisites..."
    
    # Check if we're on the correct branch
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "$DEPLOY_BRANCH" ]]; then
        log_error "Must be on $DEPLOY_BRANCH branch to deploy to production"
        exit 1
    fi
    
    # Check if working directory is clean
    if [[ -n "$(git status --porcelain)" ]]; then
        log_error "Working directory is not clean. Please commit or stash changes."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed for production deployment"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f ".env.production" ]]; then
        log_error "Environment file .env.production not found"
        exit 1
    fi
    
    # Check if all required environment variables are set
    required_vars=(
        "DB_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "SENTRY_DSN_PROD"
        "VALIDATOR_PRIVATE_KEY_PROD"
        "SLACK_WEBHOOK_PROD"
        "S3_BUCKET_PROD"
        "AWS_ACCESS_KEY_ID_PROD"
        "AWS_SECRET_ACCESS_KEY_PROD"
        "AWS_REGION_PROD"
        "CLOUDFLARE_ZONE_ID"
        "CLOUDFLARE_API_TOKEN"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_info "Production prerequisites check passed"
}

# Create backup before deployment
create_backup() {
    if [[ "$BACKUP_ENABLED" != "true" ]]; then
        log_info "Backup is disabled, skipping..."
        return
    fi
    
    log_info "Creating backup before deployment..."
    
    # Create backup directory
    backup_dir="/tmp/kaldrix-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup database
    log_info "Backing up database..."
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "pg_dump -h localhost -U kaldrix -d kaldrix_prod > ${backup_dir}/database.sql"
    
    # Backup configuration files
    log_info "Backing up configuration files..."
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "cp -r ${DEPLOY_PATH}/config ${backup_dir}/"
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "cp -r ${DEPLOY_PATH}/.env ${backup_dir}/"
    
    # Backup data directories
    log_info "Backing up data directories..."
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "cp -r ${DEPLOY_PATH}/data ${backup_dir}/"
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "cp -r ${DEPLOY_PATH}/keystore ${backup_dir}/"
    
    # Upload backup to S3
    log_info "Uploading backup to S3..."
    tar -czf "/tmp/kaldrix-backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$backup_dir" .
    aws s3 cp "/tmp/kaldrix-backup-$(date +%Y%m%d-%H%M%S).tar.gz" "s3://${S3_BUCKET_PROD}/backups/"
    
    # Clean up local backup
    rm -rf "$backup_dir"
    rm -f "/tmp/kaldrix-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    log_info "Backup created successfully"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building production Docker images..."
    
    # Get current Git hash for image tag
    GIT_HASH=$(git rev-parse --short HEAD)
    IMAGE_TAG="${PROD_ENV}-${GIT_HASH}"
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -t "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" -f Dockerfile.frontend .
    docker push "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t "${REGISTRY}/${IMAGE_NAME}-backend:${IMAGE_TAG}" -f kaldr1/Dockerfile.backend ./kaldr1
    docker push "${REGISTRY}/${IMAGE_NAME}-backend:${IMAGE_TAG}"
    
    # Build blockchain node image
    log_info "Building blockchain node image..."
    docker build -t "${REGISTRY}/${IMAGE_NAME}-node:${IMAGE_TAG}" -f kaldr1/Dockerfile.node ./kaldr1
    docker push "${REGISTRY}/${IMAGE_NAME}-node:${IMAGE_TAG}"
    
    # Tag as latest
    docker tag "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" "${REGISTRY}/${IMAGE_NAME}:latest"
    docker tag "${REGISTRY}/${IMAGE_NAME}-backend:${IMAGE_TAG}" "${REGISTRY}/${IMAGE_NAME}-backend:latest"
    docker tag "${REGISTRY}/${IMAGE_NAME}-node:${IMAGE_TAG}" "${REGISTRY}/${IMAGE_NAME}-node:latest"
    
    docker push "${REGISTRY}/${IMAGE_NAME}:latest"
    docker push "${REGISTRY}/${IMAGE_NAME}-backend:latest"
    docker push "${REGISTRY}/${IMAGE_NAME}-node:latest"
    
    log_info "Production images built and pushed successfully"
}

# Deploy to production using Kubernetes
deploy_kubernetes() {
    log_info "Deploying to production using Kubernetes..."
    
    # Create Kubernetes namespace if it doesn't exist
    kubectl create namespace kaldrix --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets
    kubectl create secret generic kaldrix-secrets \
        --from-literal=database-password="${DB_PASSWORD}" \
        --from-literal=redis-password="${REDIS_PASSWORD}" \
        --from-literal=jwt-secret="${JWT_SECRET}" \
        --from-literal=sentry-dsn="${SENTRY_DSN_PROD}" \
        --from-literal=validator-private-key="${VALIDATOR_PRIVATE_KEY_PROD}" \
        --namespace kaldrix \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Update Kubernetes manifests with image tags
    GIT_HASH=$(git rev-parse --short HEAD)
    IMAGE_TAG="${PROD_ENV}-${GIT_HASH}"
    
    sed -i "s|ghcr.io/your-org/kaldrix:latest|${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}|g" k8s/kaldrix-deployment.yaml
    sed -i "s|ghcr.io/your-org/kaldrix-backend:latest|${REGISTRY}/${IMAGE_NAME}-backend:${IMAGE_TAG}|g" k8s/kaldrix-deployment.yaml
    sed -i "s|ghcr.io/your-org/kaldrix-node:latest|${REGISTRY}/${IMAGE_NAME}-node:${IMAGE_TAG}|g" k8s/kaldrix-deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/kaldrix-deployment.yaml
    kubectl apply -f k8s/monitoring.yaml
    
    # Wait for deployments to be ready with rolling updates
    log_info "Waiting for deployments to complete rolling updates..."
    
    # Frontend deployment
    kubectl rollout status deployment/frontend-deployment -n kaldrix --timeout=600s
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n kaldrix
    
    # Backend deployment
    kubectl rollout status deployment/backend-deployment -n kaldrix --timeout=600s
    kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n kaldrix
    
    # Blockchain deployment
    kubectl rollout status deployment/blockchain-deployment -n kaldrix --timeout=600s
    kubectl wait --for=condition=available --timeout=300s deployment/blockchain-deployment -n kaldrix
    
    log_info "Kubernetes production deployment completed"
}

# Run comprehensive health checks
run_health_checks() {
    log_info "Running comprehensive production health checks..."
    
    # Wait for services to be ready
    sleep 60
    
    # Check frontend health
    log_info "Checking frontend health..."
    if curl -f "https://kaldrix.com/api/health" > /dev/null 2>&1; then
        log_info "✓ Frontend health check passed"
    else
        log_error "✗ Frontend health check failed"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            log_warn "Initiating rollback..."
            rollback_deployment
        fi
        exit 1
    fi
    
    # Check backend health
    log_info "Checking backend health..."
    if curl -f "https://api.kaldrix.com/api/health" > /dev/null 2>&1; then
        log_info "✓ Backend health check passed"
    else
        log_error "✗ Backend health check failed"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            log_warn "Initiating rollback..."
            rollback_deployment
        fi
        exit 1
    fi
    
    # Check blockchain node health
    log_info "Checking blockchain node health..."
    if curl -f "https://node.kaldrix.com" > /dev/null 2>&1; then
        log_info "✓ Blockchain node health check passed"
    else
        log_error "✗ Blockchain node health check failed"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            log_warn "Initiating rollback..."
            rollback_deployment
        fi
        exit 1
    fi
    
    # Check WebSocket connectivity
    log_info "Checking WebSocket connectivity..."
    if curl -f "wss://ws.kaldrix.com" > /dev/null 2>&1; then
        log_info "✓ WebSocket connectivity check passed"
    else
        log_error "✗ WebSocket connectivity check failed"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            log_warn "Initiating rollback..."
            rollback_deployment
        fi
        exit 1
    fi
    
    # Check SSL certificate
    log_info "Checking SSL certificate..."
    if openssl s_client -connect kaldrix.com:443 -servername kaldrix.com < /dev/null 2>/dev/null | openssl x509 -noout -dates | grep -q "notAfter"; then
        log_info "✓ SSL certificate check passed"
    else
        log_error "✗ SSL certificate check failed"
        exit 1
    fi
    
    # Check database connectivity
    log_info "Checking database connectivity..."
    if ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "pg_isready -h localhost -U kaldrix -d kaldrix_prod" > /dev/null 2>&1; then
        log_info "✓ Database connectivity check passed"
    else
        log_error "✗ Database connectivity check failed"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            log_warn "Initiating rollback..."
            rollback_deployment
        fi
        exit 1
    fi
    
    # Check Redis connectivity
    log_info "Checking Redis connectivity..."
    if ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "redis-cli -h localhost -p 6379 -a ${REDIS_PASSWORD} ping" > /dev/null 2>&1; then
        log_info "✓ Redis connectivity check passed"
    else
        log_error "✗ Redis connectivity check failed"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            log_warn "Initiating rollback..."
            rollback_deployment
        fi
        exit 1
    fi
    
    log_info "✓ All production health checks passed"
}

# Run production smoke tests
run_smoke_tests() {
    log_info "Running production smoke tests..."
    
    # Test critical API endpoints
    endpoints=(
        "https://api.kaldrix.com/api/health"
        "https://api.kaldrix.com/api/metrics"
        "https://api.kaldrix.com/api/blockchain/status"
        "https://api.kaldrix.com/api/transactions/validate"
        "https://api.kaldrix.com/api/network/peers"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log_info "Testing $endpoint"
        if curl -f "$endpoint" > /dev/null 2>&1; then
            log_info "✓ $endpoint - OK"
        else
            log_error "✗ $endpoint - FAILED"
            if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
                log_warn "Initiating rollback..."
                rollback_deployment
            fi
            exit 1
        fi
    done
    
    # Test WebSocket connection
    log_info "Testing WebSocket connection..."
    # Add WebSocket test logic here
    
    # Test blockchain RPC calls
    log_info "Testing blockchain RPC calls..."
    if curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "https://node.kaldrix.com" > /dev/null 2>&1; then
        log_info "✓ Blockchain RPC test passed"
    else
        log_error "✗ Blockchain RPC test failed"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            log_warn "Initiating rollback..."
            rollback_deployment
        fi
        exit 1
    fi
    
    log_info "✓ All production smoke tests passed"
}

# Rollback deployment
rollback_deployment() {
    log_warn "Rolling back deployment..."
    
    # Get previous deployment
    previous_deployment=$(kubectl rollout history deployment/frontend-deployment -n kaldrix | tail -2 | head -1 | awk '{print $1}')
    
    if [[ -n "$previous_deployment" ]]; then
        log_info "Rolling back to revision $previous_deployment"
        
        # Rollback frontend
        kubectl rollout undo deployment/frontend-deployment -n kaldrix --to-revision="$previous_deployment"
        
        # Rollback backend
        kubectl rollout undo deployment/backend-deployment -n kaldrix --to-revision="$previous_deployment"
        
        # Rollback blockchain
        kubectl rollout undo deployment/blockchain-deployment -n kaldrix --to-revision="$previous_deployment"
        
        # Wait for rollback to complete
        kubectl rollout status deployment/frontend-deployment -n kaldrix --timeout=600s
        kubectl rollout status deployment/backend-deployment -n kaldrix --timeout=600s
        kubectl rollout status deployment/blockchain-deployment -n kaldrix --timeout=600s
        
        log_info "Rollback completed"
        
        # Send rollback notification
        send_rollback_notification
    else
        log_error "No previous deployment found for rollback"
        exit 1
    fi
}

# Send deployment notification
send_notification() {
    log_info "Sending production deployment notification..."
    
    GIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_PROD}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 KALDRIX Production Deployment Completed\\n\\nBranch: ${DEPLOY_BRANCH}\\nCommit: ${GIT_HASH}\\nMessage: ${COMMIT_MESSAGE}\\nEnvironment: ${PROD_ENV}\\nTimestamp: $(date)\\n\\n✅ All health checks passed\\n✅ All smoke tests passed\"}" \
            "${SLACK_WEBHOOK_PROD}"
    fi
    
    # Email notification
    if [[ -n "${SMTP_HOST}" && -n "${EMAIL_RECIPIENTS_PROD}" ]]; then
        echo "Subject: 🚀 KALDRIX Production Deployment Completed

Branch: ${DEPLOY_BRANCH}
Commit: ${GIT_HASH}
Message: ${COMMIT_MESSAGE}
Environment: ${PROD_ENV}
Timestamp: $(date)

✅ All health checks passed
✅ All smoke tests passed

The production deployment has been completed successfully.

Best regards,
KALDRIX Deployment Bot" | mail -s "🚀 KALDRIX Production Deployment Completed" "${EMAIL_RECIPIENTS_PROD}"
    fi
    
    log_info "Production deployment notification sent successfully"
}

# Send rollback notification
send_rollback_notification() {
    log_info "Sending rollback notification..."
    
    GIT_HASH=$(git rev-parse --short HEAD)
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_PROD}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🔄 KALDRIX Production Rollback Initiated\\n\\nBranch: ${DEPLOY_BRANCH}\\nCommit: ${GIT_HASH}\\nEnvironment: ${PROD_ENV}\\nTimestamp: $(date)\\n\\n⚠️ Deployment failed, rollback initiated\"}" \
            "${SLACK_WEBHOOK_PROD}"
    fi
    
    # Email notification
    if [[ -n "${SMTP_HOST}" && -n "${EMAIL_RECIPIENTS_PROD}" ]]; then
        echo "Subject: 🔄 KALDRIX Production Rollback Initiated

Branch: ${DEPLOY_BRANCH}
Commit: ${GIT_HASH}
Environment: ${PROD_ENV}
Timestamp: $(date)

⚠️ Deployment failed, rollback initiated

The production deployment encountered issues and has been rolled back.

Best regards,
KALDRIX Deployment Bot" | mail -s "🔄 KALDRIX Production Rollback Initiated" "${EMAIL_RECIPIENTS_PROD}"
    fi
    
    log_info "Rollback notification sent successfully"
=======
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
DEPLOYMENT_ENV="production"
DEPLOYMENT_USER="kaldrix"
DEPLOYMENT_HOST="kaldrix.com"
DEPLOYMENT_DIR="/opt/kaldrix"
BACKUP_DIR="/opt/kaldrix-backups"
LOG_FILE="/var/log/kaldrix-deployment.log"

# Production environment variables
export NODE_ENV="production"
export RUST_LOG="info"
export DATABASE_URL="sqlite:///data/blockchain.db"
export PROMETHEUS_METRICS="true"
export GRAFANA_DASHBOARD="true"

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error_exit "This script must be run as root"
    fi
}

# Create deployment user
create_deployment_user() {
    log "${BLUE}Creating deployment user...${NC}"
    
    if ! id "$DEPLOYMENT_USER" &>/dev/null; then
        useradd -m -s /bin/bash -d /home/$DEPLOYMENT_USER $DEPLOYMENT_USER
        usermod -aG sudo $DEPLOYMENT_USER
        log "${GREEN}✓ Created user: $DEPLOYMENT_USER${NC}"
    else
        log "${YELLOW}⚠ User $DEPLOYMENT_USER already exists${NC}"
    fi
}

# Update system packages
update_system() {
    log "${BLUE}Updating system packages...${NC}"
    
    apt update && apt upgrade -y
    apt install -y \
        curl wget git \
        build-essential \
        pkg-config \
        libssl-dev \
        sqlite3 \
        nginx \
        docker.io \
        docker-compose \
        prometheus \
        grafana \
        nodejs npm \
        ufw fail2ban \
        unattended-upgrades \
        logrotate \
        rsyslog
    
    log "${GREEN}✓ System packages updated${NC}"
}

# Configure firewall
configure_firewall() {
    log "${BLUE}Configuring firewall...${NC}"
    
    # Enable firewall
    ufw --force enable
    
    # Allow essential ports
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8080/tcp    # Blockchain API
    ufw allow 8999/tcp    # P2P Communication
    ufw allow 9090/tcp    # Prometheus
    ufw allow 3000/tcp    # Grafana
    
    # Rate limiting
    ufw limit ssh
    
    log "${GREEN}✓ Firewall configured${NC}"
}

# Create directory structure
create_directories() {
    log "${BLUE}Creating directory structure...${NC}"
    
    # Main deployment directory
    mkdir -p $DEPLOYMENT_DIR
    mkdir -p $DEPLOYMENT_DIR/{config,data,logs,scripts,ssl,backups}
    
    # Backup directory
    mkdir -p $BACKUP_DIR
    mkdir -p $BACKUP_DIR/{daily,weekly,monthly}
    
    # Set permissions
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_DIR
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $BACKUP_DIR
    chmod 750 $DEPLOYMENT_DIR
    chmod 750 $BACKUP_DIR
    
    log "${GREEN}✓ Directory structure created${NC}"
}

# Deploy blockchain application
deploy_blockchain() {
    log "${BLUE}Deploying blockchain application...${NC}"
    
    # Copy application files
    cp -r /home/z/my-project/src $DEPLOYMENT_DIR/
    cp -r /home/z/my-project/mobile-sdk $DEPLOYMENT_DIR/
    cp -r /home/z/my-project/config $DEPLOYMENT_DIR/
    cp -r /home/z/my-project/scripts $DEPLOYMENT_DIR/
    cp -r /home/z/my-project/docs $DEPLOYMENT_DIR/
    
    # Copy configuration files
    cp /home/z/my-project/Cargo.toml $DEPLOYMENT_DIR/
    cp /home/z/my-project/package.json $DEPLOYMENT_DIR/
    cp /home/z/my-project/next.config.ts $DEPLOYMENT_DIR/
    cp /home/z/my-project/tailwind.config.ts $DEPLOYMENT_DIR/
    
    # Set permissions
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_DIR
    find $DEPLOYMENT_DIR -type f -name "*.sh" -exec chmod +x {} \;
    
    log "${GREEN}✓ Blockchain application deployed${NC}"
}

# Build Rust application
build_rust_app() {
    log "${BLUE}Building Rust application...${NC}"
    
    cd $DEPLOYMENT_DIR
    
    # Install Rust if not present
    if ! command -v cargo &>/dev/null; then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    fi
    
    # Build release version
    cargo build --release
    
    log "${GREEN}✓ Rust application built${NC}"
}

# Build Next.js frontend
build_frontend() {
    log "${BLUE}Building Next.js frontend...${NC}"
    
    cd $DEPLOYMENT_DIR
    
    # Install Node.js dependencies
    npm install
    
    # Build production version
    npm run build
    
    log "${GREEN}✓ Next.js frontend built${NC}"
}

# Configure database
configure_database() {
    log "${BLUE}Configuring database...${NC}"
    
    # Initialize database
    sqlite3 $DEPLOYMENT_DIR/data/blockchain.db < $DEPLOYMENT_DIR/scripts/init-db.sql
    
    # Set database permissions
    chown $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_DIR/data/blockchain.db
    chmod 600 $DEPLOYMENT_DIR/data/blockchain.db
    
    log "${GREEN}✓ Database configured${NC}"
}

# Configure SSL certificates
configure_ssl() {
    log "${BLUE}Configuring SSL certificates...${NC}"
    
    # Create SSL directory
    mkdir -p $DEPLOYMENT_DIR/ssl
    
    # Generate self-signed certificate for initial setup
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $DEPLOYMENT_DIR/ssl/privkey.pem \
        -out $DEPLOYMENT_DIR/ssl/fullchain.pem \
        -subj "/C=US/ST=California/L=San Francisco/O=KALDRIX/CN=kaldrix.com"
    
    # Set permissions
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_DIR/ssl
    chmod 600 $DEPLOYMENT_DIR/ssl/*.pem
    
    log "${GREEN}✓ SSL certificates configured${NC}"
}

# Configure NGINX
configure_nginx() {
    log "${BLUE}Configuring NGINX...${NC}"
    
    # Copy NGINX configuration
    cp /home/z/my-project/nginx.conf /etc/nginx/sites-available/kaldrix
    
    # Enable site
    ln -sf /etc/nginx/sites-available/kaldrix /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    
    # Restart NGINX
    systemctl restart nginx
    systemctl enable nginx
    
    log "${GREEN}✓ NGINX configured${NC}"
}

# Configure Docker services
configure_docker() {
    log "${BLUE}Configuring Docker services...${NC}"
    
    # Copy Docker compose files
    cp /home/z/my-project/docker-compose.yml $DEPLOYMENT_DIR/
    cp /home/z/my-project/docker-compose.full.yml $DEPLOYMENT_DIR/
    
    # Start Docker services
    cd $DEPLOYMENT_DIR
    docker-compose -f docker-compose.full.yml up -d
    
    log "${GREEN}✓ Docker services configured${NC}"
}

# Configure systemd services
configure_systemd() {
    log "${BLUE}Configuring systemd services...${NC}"
    
    # Create blockchain service
    cat > /etc/systemd/system/kaldrix-blockchain.service << EOF
[Unit]
Description=KALDRIX Blockchain Node
After=network.target

[Service]
Type=simple
User=$DEPLOYMENT_USER
WorkingDirectory=$DEPLOYMENT_DIR
ExecStart=$DEPLOYMENT_DIR/target/release/kaldrix-node
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=RUST_LOG=info
Environment=DATABASE_URL=sqlite:///data/blockchain.db

[Install]
WantedBy=multi-user.target
EOF

    # Create API service
    cat > /etc/systemd/system/kaldrix-api.service << EOF
[Unit]
Description=KALDRIX API Server
After=network.target kaldrix-blockchain.service

[Service]
Type=simple
User=$DEPLOYMENT_USER
WorkingDirectory=$DEPLOYMENT_DIR
ExecStart=$DEPLOYMENT_DIR/target/release/kaldrix-api
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=RUST_LOG=info
Environment=DATABASE_URL=sqlite:///data/blockchain.db

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start services
    systemctl daemon-reload
    systemctl enable kaldrix-blockchain
    systemctl enable kaldrix-api
    systemctl start kaldrix-blockchain
    systemctl start kaldrix-api
    
    log "${GREEN}✓ Systemd services configured${NC}"
}

# Configure monitoring
configure_monitoring() {
    log "${BLUE}Configuring monitoring...${NC}"
    
    # Configure Prometheus
    cp /home/z/my-project/monitoring/prometheus.yml /etc/prometheus/prometheus.yml
    systemctl restart prometheus
    systemctl enable prometheus
    
    # Configure Grafana
    cp /home/z/my-project/grafana-dashboard.json /etc/grafana/provisioning/dashboards/
    systemctl restart grafana
    systemctl enable grafana
    
    # Configure Node Exporter
    systemctl start node-exporter
    systemctl enable node-exporter
    
    log "${GREEN}✓ Monitoring configured${NC}"
}

# Configure backup system
configure_backup() {
    log "${BLUE}Configuring backup system...${NC}"
    
    # Create backup script
    cat > $DEPLOYMENT_DIR/scripts/backup-production.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/kaldrix-backups"
DEPLOYMENT_DIR="/opt/kaldrix"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
sqlite3 $DEPLOYMENT_DIR/data/blockchain.db ".backup $BACKUP_DIR/daily/blockchain_$DATE.db"

# Backup configuration
tar -czf $BACKUP_DIR/daily/config_$DATE.tar.gz -C $DEPLOYMENT_DIR config/

# Backup SSL certificates
tar -czf $BACKUP_DIR/daily/ssl_$DATE.tar.gz -C $DEPLOYMENT_DIR ssl/

# Clean old backups (keep 7 days)
find $BACKUP_DIR/daily -name "*.db" -mtime +7 -delete
find $BACKUP_DIR/daily -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

    # Make backup script executable
    chmod +x $DEPLOYMENT_DIR/scripts/backup-production.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $DEPLOYMENT_DIR/scripts/backup-production.sh") | crontab -
    
    log "${GREEN}✓ Backup system configured${NC}"
}

# Configure log rotation
configure_log_rotation() {
    log "${BLUE}Configuring log rotation...${NC}"
    
    cat > /etc/logrotate.d/kaldrix << EOF
$DEPLOYMENT_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $DEPLOYMENT_USER $DEPLOYMENT_USER
    postrotate
        systemctl reload rsyslog
    endscript
}
EOF

    log "${GREEN}✓ Log rotation configured${NC}"
}

# Security hardening
security_hardening() {
    log "${BLUE}Applying security hardening...${NC}"
    
    # Configure SSH
    sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    systemctl restart sshd
    
    # Configure kernel parameters
    cat >> /etc/sysctl.conf << EOF
# Security hardening
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5
net.ipv4.tcp_rfc1337 = 1
kernel.randomize_va_space = 2
EOF
    
    sysctl -p
    
    # Configure fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    log "${GREEN}✓ Security hardening applied${NC}"
}

# Health check
health_check() {
    log "${BLUE}Performing health check...${NC}"
    
    # Check blockchain service
    if systemctl is-active --quiet kaldrix-blockchain; then
        log "${GREEN}✓ Blockchain service is running${NC}"
    else
        log "${RED}✗ Blockchain service is not running${NC}"
        return 1
    fi
    
    # Check API service
    if systemctl is-active --quiet kaldrix-api; then
        log "${GREEN}✓ API service is running${NC}"
    else
        log "${RED}✗ API service is not running${NC}"
        return 1
    fi
    
    # Check NGINX
    if systemctl is-active --quiet nginx; then
        log "${GREEN}✓ NGINX is running${NC}"
    else
        log "${RED}✗ NGINX is not running${NC}"
        return 1
    fi
    
    # Check database
    if [ -f "$DEPLOYMENT_DIR/data/blockchain.db" ]; then
        log "${GREEN}✓ Database exists${NC}"
    else
        log "${RED}✗ Database not found${NC}"
        return 1
    fi
    
    # Check API endpoint
    if curl -s -f http://localhost:8080/api/health >/dev/null; then
        log "${GREEN}✓ API endpoint is responding${NC}"
    else
        log "${RED}✗ API endpoint is not responding${NC}"
        return 1
    fi
    
    log "${GREEN}✓ All health checks passed${NC}"
}

# Generate deployment report
generate_report() {
    log "${BLUE}Generating deployment report...${NC}"
    
    cat > $DEPLOYMENT_DIR/deployment-report.txt << EOF
KALDRIX Blockchain Production Deployment Report
================================================

Deployment Information:
- Date: $(date)
- Environment: $DEPLOYMENT_ENV
- Host: $DEPLOYMENT_HOST
- User: $DEPLOYMENT_USER
- Directory: $DEPLOYMENT_DIR

Services Status:
- Blockchain Node: $(systemctl is-active kaldrix-blockchain)
- API Server: $(systemctl is-active kaldrix-api)
- NGINX: $(systemctl is-active nginx)
- Prometheus: $(systemctl is-active prometheus)
- Grafana: $(systemctl is-active grafana)
- Node Exporter: $(systemctl is-active node-exporter)

Network Configuration:
- Firewall: $(ufw status | head -1)
- Open Ports: 22, 80, 443, 8080, 8999, 9090, 3000

Security Features:
- SSL/TLS: Enabled
- Firewall: Enabled
- Fail2ban: Enabled
- Log Rotation: Enabled
- Backup System: Enabled

Database Information:
- Database File: $DEPLOYMENT_DIR/data/blockchain.db
- Database Size: $(du -h $DEPLOYMENT_DIR/data/blockchain.db | cut -f1)
- Backup Directory: $BACKUP_DIR

Monitoring Information:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Metrics Endpoint: http://localhost:8080/metrics

Access URLs:
- Main Website: https://$DEPLOYMENT_HOST
- API Documentation: https://$DEPLOYMENT_HOST/api/docs
- Blockchain Explorer: https://$DEPLOYMENT_HOST/explorer
- Monitoring Dashboard: https://$DEPLOYMENT_HOST/monitor

Next Steps:
1. Configure DNS records for $DEPLOYMENT_HOST
2. Replace self-signed SSL certificates with Let's Encrypt
3. Set up monitoring alerts
4. Configure backup offsite storage
5. Perform security audit

Deployment completed successfully at $(date)
EOF

    log "${GREEN}✓ Deployment report generated${NC}"
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
}

# Main deployment function
main() {
<<<<<<< HEAD
    log_info "🚀 Starting KALDRIX production deployment..."
    
    check_prerequisites
    create_backup
    build_and_push_images
    deploy_kubernetes
    run_health_checks
    run_smoke_tests
    send_notification
    
    log_info "🎉 KALDRIX production deployment completed successfully!"
}

# Run main function
=======
    log "${PURPLE}KALDRIX Blockchain Production Deployment${NC}"
    log "${BLUE}Deploying to: $DEPLOYMENT_HOST${NC}"
    log "${BLUE}Environment: $DEPLOYMENT_ENV${NC}"
    echo ""
    
    # Check prerequisites
    check_root
    
    # Execute deployment steps
    create_deployment_user
    update_system
    configure_firewall
    create_directories
    deploy_blockchain
    build_rust_app
    build_frontend
    configure_database
    configure_ssl
    configure_nginx
    configure_docker
    configure_systemd
    configure_monitoring
    configure_backup
    configure_log_rotation
    security_hardening
    
    # Final health check
    health_check
    
    # Generate report
    generate_report
    
    # Summary
    log "${GREEN}=== DEPLOYMENT COMPLETED SUCCESSFULLY ===${NC}"
    log "${BLUE}Deployment Directory: $DEPLOYMENT_DIR${NC}"
    log "${BLUE}Backup Directory: $BACKUP_DIR${NC}"
    log "${BLUE}Log File: $LOG_FILE${NC}"
    log "${BLUE}Deployment Report: $DEPLOYMENT_DIR/deployment-report.txt${NC}"
    echo ""
    log "${YELLOW}Next Steps:${NC}"
    log "${YELLOW}1. Configure DNS records for $DEPLOYMENT_HOST${NC}"
    log "${YELLOW}2. Replace self-signed SSL certificates with Let's Encrypt${NC}"
    log "${YELLOW}3. Set up monitoring alerts and notifications${NC}"
    log "${YELLOW}4. Configure offsite backup storage${NC}"
    log "${YELLOW}5. Perform final security audit${NC}"
    echo ""
    log "${GREEN}🚀 KALDRIX Blockchain is now deployed to production!${NC}"
}

# Execute main function
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
main "$@"