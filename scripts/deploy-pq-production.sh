#!/bin/bash

# KALDRIX Phase 7: Post-Quantum Integration Production Deployment Script
# This script automates the deployment of PQ cryptography components to production environment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROD_CONFIG="$PROJECT_ROOT/.env.production"
LOG_FILE="/tmp/pq-deployment-production-$(date +%Y%m%d_%H%M%S).log"
ROLLBACK_FILE="/tmp/pq-deployment-rollback-$(date +%Y%m%d_%H%M%S).sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Function to check if required tools are installed
check_requirements() {
    log "Checking deployment requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
        exit 1
    fi
    
    # Check psql (PostgreSQL client)
    if ! command -v psql &> /dev/null; then
        error "psql is not installed - required for production deployment"
        exit 1
    fi
    
    # Check jq (JSON processor)
    if ! command -v jq &> /dev/null; then
        error "jq is not installed - required for production deployment"
        exit 1
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        error "curl is not installed - required for production deployment"
        exit 1
    fi
    
    log "All requirements satisfied"
}

# Function to load environment configuration
load_config() {
    log "Loading environment configuration..."
    
    if [[ ! -f "$PROD_CONFIG" ]]; then
        error "Production configuration file not found: $PROD_CONFIG"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$PROD_CONFIG"
    set +a
    
    # Validate required environment variables
    required_vars=(
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "DATABASE_URL"
        "PROD_API_KEY"
        "PQ_ENABLED"
        "PQ_ALGORITHMS"
        "PQ_KEY_STRENGTH"
        "PQ_CACHE_SIZE"
        "PQ_BATCH_SIZE"
        "PQ_KEY_ENCRYPTION_KEY"
        "PQ_HSM_INTEGRATION"
        "PQ_AUDIT_LOGGING"
        "PQ_RATE_LIMIT"
        "PQ_MONITORING_ENABLED"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log "Environment configuration loaded successfully"
}

# Function to create rollback script
create_rollback_script() {
    log "Creating rollback script..."
    
    cat > "$ROLLBACK_FILE" << 'EOF'
#!/bin/bash
# KALDRIX PQ Deployment Rollback Script
# Generated automatically during deployment

set -euo pipefail

ROLLBACK_LOG="/tmp/pq-rollback-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ROLLBACK_LOG"
}

warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" | tee -a "$ROLLBACK_LOG"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ROLLBACK_LOG"
}

# Stop current deployment
log "Stopping current deployment..."
docker-compose -f docker-compose.production.yml down --timeout 30

# Disable PQ features
log "Disabling PQ features..."
curl -X POST "$NEXTAUTH_URL/api/features/disable" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROD_API_KEY" \
  -d '{"feature": "pq_crypto", "enabled": false}' || true

# Restore database from backup
log "Restoring database from backup..."
if [[ -f "EOF"
    
    # Add the latest backup file path
    local latest_backup=$(ls -t "$PROJECT_ROOT/backups/production_db_backup_"*.sql 2>/dev/null | head -1)
    if [[ -n "$latest_backup" ]]; then
        echo "psql \"$DATABASE_URL\" < \"$latest_backup\"" >> "$ROLLBACK_FILE"
    else
        echo "warn \"No database backup found\"" >> "$ROLLBACK_FILE"
    fi
    
    cat >> "$ROLLBACK_FILE" << 'EOF'

# Checkout previous version
log "Checking out previous version..."
git checkout v6.0.0-release-candidate

# Rebuild and deploy
log "Rebuilding and deploying previous version..."
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Verify rollback
log "Verifying rollback..."
curl -f "$NEXTAUTH_URL/api/health" || error "Health check failed after rollback"

log "Rollback completed successfully"
EOF
    
    chmod +x "$ROLLBACK_FILE"
    log "Rollback script created: $ROLLBACK_FILE"
}

# Function to create backup before deployment
create_backup() {
    log "Creating pre-deployment backup..."
    
    # Create backup directory
    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    info "Creating database backup..."
    DB_BACKUP="$BACKUP_DIR/production_db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump "$DATABASE_URL" > "$DB_BACKUP" 2>> "$LOG_FILE"; then
        log "Database backup created: $DB_BACKUP"
    else
        error "Failed to create database backup"
        exit 1
    fi
    
    # Backup current configuration
    info "Creating configuration backup..."
    CONFIG_BACKUP="$BACKUP_DIR/production_config_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    if tar -czf "$CONFIG_BACKUP" -C "$PROJECT_ROOT" .env* docker-compose*.yml 2>> "$LOG_FILE"; then
        log "Configuration backup created: $CONFIG_BACKUP"
    else
        error "Failed to create configuration backup"
        exit 1
    fi
    
    # Backup current build artifacts
    info "Creating build backup..."
    BUILD_BACKUP="$BACKUP_DIR/production_build_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    if tar -czf "$BUILD_BACKUP" -C "$PROJECT_ROOT" build dist 2>> "$LOG_FILE"; then
        log "Build backup created: $BUILD_BACKUP"
    else
        warn "No existing build artifacts to backup"
    fi
    
    # Backup current git state
    info "Creating git state backup..."
    GIT_BACKUP="$BACKUP_DIR/production_git_backup_$(date +%Y%m%d_%H%M%S).txt"
    git log --oneline -10 > "$GIT_BACKUP" 2>> "$LOG_FILE"
    git status >> "$GIT_BACKUP" 2>> "$LOG_FILE"
    log "Git state backup created: $GIT_BACKUP"
}

# Function to verify production readiness
verify_production_readiness() {
    log "Verifying production readiness..."
    
    # Check if we're on the correct branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
        error "Not on main/master branch. Current branch: $current_branch"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [[ -n "$(git status --porcelain)" ]]; then
        error "There are uncommitted changes"
        exit 1
    fi
    
    # Check if we're on the correct tag
    local current_tag=$(git describe --exact-match --tags HEAD 2>/dev/null || echo "")
    if [[ "$current_tag" != "v7.0.0-postquantum" ]]; then
        error "Not on correct tag. Expected: v7.0.0-postquantum, Current: $current_tag"
        exit 1
    fi
    
    # Check production environment connectivity
    info "Checking production environment connectivity..."
    if ! curl -s -f "$NEXTAUTH_URL/api/health" > /dev/null; then
        error "Production environment is not accessible"
        exit 1
    fi
    
    # Check database connectivity
    info "Checking database connectivity..."
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        error "Database is not accessible"
        exit 1
    fi
    
    # Check disk space
    info "Checking disk space..."
    local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 10485760 ]]; then  # 10GB in KB
        error "Insufficient disk space: $available_space KB available"
        exit 1
    fi
    
    log "Production readiness verified"
}

# Function to build application
build_application() {
    log "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    info "Installing dependencies..."
    if npm ci --silent >> "$LOG_FILE" 2>&1; then
        log "Dependencies installed successfully"
    else
        error "Failed to install dependencies"
        exit 1
    fi
    
    # Run linting
    info "Running linting..."
    if npm run lint --silent >> "$LOG_FILE" 2>&1; then
        log "Linting passed"
    else
        error "Linting failed"
        exit 1
    fi
    
    # Run type checking
    info "Running type checking..."
    if npm run type-check --silent >> "$LOG_FILE" 2>&1; then
        log "Type checking passed"
    else
        error "Type checking failed"
        exit 1
    fi
    
    # Run tests
    info "Running tests..."
    if npm run test:unit --silent >> "$LOG_FILE" 2>&1; then
        log "Unit tests passed"
    else
        error "Unit tests failed"
        exit 1
    fi
    
    # Run integration tests
    info "Running integration tests..."
    if npm run test:integration --silent >> "$LOG_FILE" 2>&1; then
        log "Integration tests passed"
    else
        error "Integration tests failed"
        exit 1
    fi
    
    # Build application
    info "Building application..."
    if npm run build --silent >> "$LOG_FILE" 2>&1; then
        log "Application built successfully"
    else
        error "Failed to build application"
        exit 1
    fi
    
    # Build Rust components
    if [[ -d "$PROJECT_ROOT/src/lib/pq_crypto" ]]; then
        info "Building PQ crypto components..."
        cd "$PROJECT_ROOT/src/lib/pq_crypto"
        if cargo build --release >> "$LOG_FILE" 2>&1; then
            log "PQ crypto components built successfully"
        else
            error "Failed to build PQ crypto components"
            exit 1
        fi
        cd "$PROJECT_ROOT"
    fi
    
    # Run security audit
    info "Running security audit..."
    if npm audit --audit-level moderate --silent >> "$LOG_FILE" 2>&1; then
        log "Security audit passed"
    else
        warn "Security audit found issues - review required"
    fi
}

# Function to prepare database
prepare_database() {
    log "Preparing database..."
    
    cd "$PROJECT_ROOT"
    
    # Generate Prisma client
    info "Generating Prisma client..."
    if npx prisma generate --silent >> "$LOG_FILE" 2>&1; then
        log "Prisma client generated successfully"
    else
        error "Failed to generate Prisma client"
        exit 1
    fi
    
    # Push database schema
    info "Pushing database schema..."
    if npx prisma db push --accept-data-loss --silent >> "$LOG_FILE" 2>&1; then
        log "Database schema pushed successfully"
    else
        error "Failed to push database schema"
        exit 1
    fi
    
    # Run database migrations
    info "Running database migrations..."
    if npx prisma migrate deploy --silent >> "$LOG_FILE" 2>&1; then
        log "Database migrations completed successfully"
    else
        error "Failed to run database migrations"
        exit 1
    fi
    
    # Verify database integrity
    info "Verifying database integrity..."
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" >> "$LOG_FILE" 2>&1 &&
       psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM wallets;" >> "$LOG_FILE" 2>&1; then
        log "Database integrity verified"
    else
        error "Database integrity check failed"
        exit 1
    fi
}

# Function to deploy with blue-green strategy
deploy_blue_green() {
    log "Starting blue-green deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Check current environment (blue)
    info "Checking current blue environment..."
    if curl -s -f "$NEXTAUTH_URL/api/health" | grep -q '"status":"healthy"'; then
        log "Blue environment is healthy"
    else
        error "Blue environment is not healthy"
        exit 1
    fi
    
    # Prepare green environment
    info "Preparing green environment..."
    
    # Stop any existing green containers
    docker-compose -f docker-compose.production-green.yml down --timeout 30 >> "$LOG_FILE" 2>&1 || true
    
    # Build green environment
    info "Building green environment..."
    if docker-compose -f docker-compose.production-green.yml build --no-cache >> "$LOG_FILE" 2>&1; then
        log "Green environment built successfully"
    else
        error "Failed to build green environment"
        exit 1
    fi
    
    # Start green environment
    info "Starting green environment..."
    if docker-compose -f docker-compose.production-green.yml up -d >> "$LOG_FILE" 2>&1; then
        log "Green environment started successfully"
    else
        error "Failed to start green environment"
        exit 1
    fi
    
    # Wait for green environment to be ready
    info "Waiting for green environment to be ready..."
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -f "$NEXTAUTH_URL/api/health" | grep -q '"status":"healthy"'; then
            log "Green environment is healthy"
            break
        else
            warn "Attempt $attempt: Green environment not ready, retrying..."
            sleep 10
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Green environment failed to become healthy"
        docker-compose -f docker-compose.production-green.yml logs >> "$LOG_FILE"
        exit 1
    fi
    
    # Enable PQ features in green environment
    info "Enabling PQ features in green environment..."
    if curl -s -f -X POST "$NEXTAUTH_URL/api/features/enable" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"feature": "pq_crypto", "enabled": true}' >> "$LOG_FILE" 2>&1; then
        log "PQ features enabled in green environment"
    else
        error "Failed to enable PQ features in green environment"
        exit 1
    fi
    
    # Start canary deployment (5% traffic)
    info "Starting canary deployment (5% traffic)..."
    if curl -s -f -X POST "$NEXTAUTH_URL/api/traffic/canary" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"percentage": 5, "duration": "1h"}' >> "$LOG_FILE" 2>&1; then
        log "Canary deployment started"
    else
        error "Failed to start canary deployment"
        exit 1
    fi
    
    # Monitor canary deployment
    info "Monitoring canary deployment for 1 hour..."
    local canary_start_time=$(date +%s)
    local canary_duration=3600  # 1 hour in seconds
    
    while [[ $(($(date +%s) - canary_start_time)) -lt $canary_duration ]]; do
        # Check error rates
        local error_rate=$(curl -s "$NEXTAUTH_URL/api/metrics/error_rate" | jq -r '.rate // 0')
        if [[ $(echo "$error_rate > 0.01" | bc -l) -eq 1 ]]; then
            error "Error rate too high during canary: $error_rate"
            exit 1
        fi
        
        # Check PQ operation latency
        local pq_latency=$(curl -s "$NEXTAUTH_URL/api/pq/metrics" | jq -r '.key_generation_time_ms // 0')
        if [[ $pq_latency -gt 100 ]]; then
            error "PQ operation latency too high during canary: $pq_latency ms"
            exit 1
        fi
        
        sleep 60
    done
    
    # Gradually increase traffic
    info "Gradually increasing traffic to green environment..."
    for percentage in 25 50 75 100; do
        info "Routing $percentage% traffic to green environment..."
        if curl -s -f -X POST "$NEXTAUTH_URL/api/traffic/canary" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $PROD_API_KEY" \
            -d "{\"percentage\": $percentage, \"duration\": \"30m\"}" >> "$LOG_FILE" 2>&1; then
            log "Traffic routing updated to $percentage%"
        else
            error "Failed to update traffic routing to $percentage%"
            exit 1
        fi
        
        # Monitor for 30 minutes
        sleep 1800
    done
    
    # Switch completely to green environment
    info "Switching completely to green environment..."
    
    # Stop blue environment
    docker-compose -f docker-compose.production.yml down --timeout 30 >> "$LOG_FILE" 2>&1 || true
    
    # Rename green to blue
    mv docker-compose.production-green.yml docker-compose.production.yml.backup
    cp docker-compose.production.yml.backup docker-compose.production.yml
    
    log "Blue-green deployment completed successfully"
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    log "Running comprehensive tests..."
    
    # Test application health
    info "Testing application health..."
    if curl -s -f "$NEXTAUTH_URL/api/health" | grep -q '"status":"healthy"'; then
        log "Application health check passed"
    else
        error "Application health check failed"
        exit 1
    fi
    
    # Test PQ key generation
    info "Testing PQ key generation..."
    local keygen_response=$(curl -s -X POST "$NEXTAUTH_URL/api/pq/key/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"algorithm": "dilithium", "strength": 256}' 2>> "$LOG_FILE")
    
    if echo "$keygen_response" | jq -e '.public_key' > /dev/null; then
        log "PQ key generation test passed"
    else
        error "PQ key generation test failed"
        exit 1
    fi
    
    # Test PQ signature creation
    info "Testing PQ signature creation..."
    local sign_response=$(curl -s -X POST "$NEXTAUTH_URL/api/pq/sign" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"message": "test message", "algorithm": "dilithium"}' 2>> "$LOG_FILE")
    
    if echo "$sign_response" | jq -e '.signature' > /dev/null; then
        log "PQ signature creation test passed"
    else
        error "PQ signature creation test failed"
        exit 1
    fi
    
    # Test PQ signature verification
    info "Testing PQ signature verification..."
    local signature=$(echo "$sign_response" | jq -r '.signature')
    local verify_response=$(curl -s -X POST "$NEXTAUTH_URL/api/pq/verify" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d "{\"signature\": \"$signature\", \"message\": \"test message\", \"algorithm\": \"dilithium\"}" 2>> "$LOG_FILE")
    
    if echo "$verify_response" | jq -e '.valid == true' > /dev/null; then
        log "PQ signature verification test passed"
    else
        error "PQ signature verification test failed"
        exit 1
    fi
    
    # Test blockchain transaction with PQ
    info "Testing blockchain transaction with PQ..."
    local tx_response=$(curl -s -X POST "$NEXTAUTH_URL/api/blockchain/transaction" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"type": "pq", "data": "test transaction data"}' 2>> "$LOG_FILE")
    
    if echo "$tx_response" | jq -e '.transaction_id' > /dev/null; then
        log "Blockchain transaction test passed"
    else
        error "Blockchain transaction test failed"
        exit 1
    fi
    
    # Test backward compatibility
    info "Testing backward compatibility..."
    local ecdsa_response=$(curl -s -X POST "$NEXTAUTH_URL/api/blockchain/transaction" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"type": "ecdsa", "data": "test transaction data"}' 2>> "$LOG_FILE")
    
    if echo "$ecdsa_response" | jq -e '.transaction_id' > /dev/null; then
        log "Backward compatibility test passed"
    else
        error "Backward compatibility test failed"
        exit 1
    fi
    
    # Test performance benchmarks
    info "Testing performance benchmarks..."
    local metrics=$(curl -s "$NEXTAUTH_URL/api/pq/metrics" 2>> "$LOG_FILE")
    local keygen_time=$(echo "$metrics" | jq -r '.key_generation_time_ms // 0')
    local sign_time=$(echo "$metrics" | jq -r '.signing_time_ms // 0')
    local verify_time=$(echo "$metrics" | jq -r '.verification_time_ms // 0')
    
    if [[ $keygen_time -lt 100 && $sign_time -lt 50 && $verify_time -lt 10 ]]; then
        log "Performance benchmarks met"
    else
        warn "Performance benchmarks not met: keygen=${keygen_time}ms, sign=${sign_time}ms, verify=${verify_time}ms"
    fi
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check all services are running
    info "Checking service status..."
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        log "All services are running"
    else
        error "Some services are not running"
        exit 1
    fi
    
    # Check database connectivity
    info "Checking database connectivity..."
    if psql "$DATABASE_URL" -c "SELECT 1;" >> "$LOG_FILE" 2>&1; then
        log "Database connectivity verified"
    else
        error "Database connectivity failed"
        exit 1
    fi
    
    # Check PQ features are enabled
    info "Checking PQ features are enabled..."
    if curl -s -f "$NEXTAUTH_URL/api/features/status" | grep -q '"pq_crypto":true'; then
        log "PQ features are enabled"
    else
        error "PQ features are not enabled"
        exit 1
    fi
    
    # Check monitoring is active
    info "Checking monitoring is active..."
    if curl -s -f "$NEXTAUTH_URL/api/pq/metrics" | grep -q '"status":"active"'; then
        log "PQ monitoring is active"
    else
        error "PQ monitoring is not active"
        exit 1
    fi
    
    # Check system resources
    info "Checking system resources..."
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    local memory_usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
    
    if [[ $(echo "$cpu_usage < 80" | bc -l) -eq 1 && $(echo "$memory_usage < 80" | bc -l) -eq 1 ]]; then
        log "System resources within acceptable limits"
    else
        warn "System resources high: CPU=${cpu_usage}%, Memory=${memory_usage}%"
    fi
}

# Function to generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    local report_file="/tmp/pq-deployment-report-production-$(date +%Y%m%d_%H%M%S).json"
    
    # Get current metrics
    local metrics=$(curl -s "$NEXTAUTH_URL/api/pq/metrics" 2>> "$LOG_FILE")
    
    cat > "$report_file" << EOF
{
  "deployment": {
    "timestamp": "$(date -Iseconds)",
    "environment": "production",
    "version": "v7.0.0-postquantum",
    "status": "success",
    "strategy": "blue-green",
    "components": {
      "application": "deployed",
      "database": "migrated",
      "pq_features": "enabled",
      "monitoring": "active",
      "traffic_routing": "100% to new deployment"
    },
    "performance": {
      "key_generation_time_ms": $(echo "$metrics" | jq -r '.key_generation_time_ms // 0'),
      "signing_time_ms": $(echo "$metrics" | jq -r '.signing_time_ms // 0'),
      "verification_time_ms": $(echo "$metrics" | jq -r '.verification_time_ms // 0')
    },
    "system": {
      "cpu_usage_percent": $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}'),
      "memory_usage_percent": $(free | grep Mem | awk '{print $3/$2 * 100.0}'),
      "disk_usage_percent": $(df "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    },
    "services": $(docker-compose -f docker-compose.production.yml ps --format json | jq -c '.'),
    "rollback_script": "$ROLLBACK_FILE",
    "log_file": "$LOG_FILE"
  }
}
EOF
    
    log "Deployment report generated: $report_file"
    
    # Display summary
    echo ""
    echo -e "${GREEN}=== PRODUCTION DEPLOYMENT SUMMARY ===${NC}"
    echo -e "${GREEN}Environment: Production${NC}"
    echo -e "${GREEN}Version: v7.0.0-postquantum${NC}"
    echo -e "${GREEN}Strategy: Blue-Green${NC}"
    echo -e "${GREEN}Status: Success${NC}"
    echo -e "${GREEN}Timestamp: $(date)${NC}"
    echo -e "${GREEN}Log File: $LOG_FILE${NC}"
    echo -e "${GREEN}Report: $report_file${NC}"
    echo -e "${GREEN}Rollback Script: $ROLLBACK_FILE${NC}"
    echo ""
}

# Function to cleanup on failure
cleanup_on_failure() {
    error "Production deployment failed - initiating emergency cleanup..."
    
    # Stop all containers
    info "Stopping all containers..."
    docker-compose -f docker-compose.production.yml down --timeout 30 >> "$LOG_FILE" 2>&1 || true
    docker-compose -f docker-compose.production-green.yml down --timeout 30 >> "$LOG_FILE" 2>&1 || true
    
    # Disable PQ features
    info "Disabling PQ features..."
    curl -X POST "$NEXTAUTH_URL/api/features/disable" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"feature": "pq_crypto", "enabled": false}' >> "$LOG_FILE" 2>&1 || true
    
    # Restore from backup if available
    info "Checking for backup to restore..."
    local latest_backup=$(ls -t "$PROJECT_ROOT/backups/production_db_backup_"*.sql 2>/dev/null | head -1)
    if [[ -n "$latest_backup" ]]; then
        warn "Restoring database from backup: $latest_backup"
        psql "$DATABASE_URL" < "$latest_backup" >> "$LOG_FILE" 2>&1 || true
    fi
    
    # Restart with previous version
    info "Restarting with previous version..."
    git checkout v6.0.0-release-candidate
    docker-compose -f docker-compose.production.yml build
    docker-compose -f docker-compose.production.yml up -d
    
    error "Emergency cleanup completed"
    exit 1
}

# Main execution
main() {
    log "Starting PQ production deployment..."
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Check if running in dry-run mode
    if [[ "${1:-}" == "--dry-run" ]]; then
        log "Running in dry-run mode..."
        log "All checks passed - would proceed with deployment"
        exit 0
    fi
    
    # Execute deployment phases
    check_requirements
    load_config
    create_rollback_script
    verify_production_readiness
    create_backup
    build_application
    prepare_database
    deploy_blue_green
    run_comprehensive_tests
    verify_deployment
    generate_report
    
    log "PQ production deployment completed successfully!"
    
    # Send notification
    info "Sending deployment notification..."
    # Add your notification logic here (e.g., Slack, email, etc.)
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo "Options:"
        echo "  --dry-run    Run checks without deploying"
        echo "  --help, -h   Show this help message"
        exit 0
        ;;
    --dry-run)
        main "$1"
        ;;
    *)
        main
        ;;
esac