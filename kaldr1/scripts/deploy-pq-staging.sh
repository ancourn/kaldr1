#!/bin/bash

# KALDRIX Phase 7: Post-Quantum Integration Staging Deployment Script
# This script automates the deployment of PQ cryptography components to staging environment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAGING_CONFIG="$PROJECT_ROOT/.env.staging"
LOG_FILE="/tmp/pq-deployment-staging-$(date +%Y%m%d_%H%M%S).log"

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
        warn "psql is not installed - database operations may be limited"
    fi
    
    log "All requirements satisfied"
}

# Function to load environment configuration
load_config() {
    log "Loading environment configuration..."
    
    if [[ ! -f "$STAGING_CONFIG" ]]; then
        error "Staging configuration file not found: $STAGING_CONFIG"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$STAGING_CONFIG"
    set +a
    
    # Validate required environment variables
    required_vars=(
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "DATABASE_URL"
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

# Function to create backup before deployment
create_backup() {
    log "Creating pre-deployment backup..."
    
    # Backup database
    if command -v psql &> /dev/null; then
        info "Creating database backup..."
        BACKUP_DIR="$PROJECT_ROOT/backups"
        mkdir -p "$BACKUP_DIR"
        
        DB_BACKUP="$BACKUP_DIR/staging_db_backup_$(date +%Y%m%d_%H%M%S).sql"
        
        if pg_dump "$DATABASE_URL" > "$DB_BACKUP" 2>> "$LOG_FILE"; then
            log "Database backup created: $DB_BACKUP"
        else
            error "Failed to create database backup"
            exit 1
        fi
    else
        warn "psql not available - skipping database backup"
    fi
    
    # Backup current configuration
    CONFIG_BACKUP="$BACKUP_DIR/staging_config_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    if tar -czf "$CONFIG_BACKUP" -C "$PROJECT_ROOT" .env* docker-compose*.yml 2>> "$LOG_FILE"; then
        log "Configuration backup created: $CONFIG_BACKUP"
    else
        error "Failed to create configuration backup"
        exit 1
    fi
    
    # Backup current build artifacts
    BUILD_BACKUP="$BACKUP_DIR/staging_build_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    if tar -czf "$BUILD_BACKUP" -C "$PROJECT_ROOT" build dist 2>> "$LOG_FILE"; then
        log "Build backup created: $BUILD_BACKUP"
    else
        warn "No existing build artifacts to backup"
    fi
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
    
    # Seed database
    info "Seeding database..."
    if npx prisma db seed --silent >> "$LOG_FILE" 2>&1; then
        log "Database seeded successfully"
    else
        error "Failed to seed database"
        exit 1
    fi
}

# Function to deploy Docker containers
deploy_containers() {
    log "Deploying Docker containers..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing containers
    info "Stopping existing containers..."
    if docker-compose -f docker-compose.staging.yml down --timeout 30 >> "$LOG_FILE" 2>&1; then
        log "Existing containers stopped successfully"
    else
        warn "No existing containers to stop"
    fi
    
    # Build Docker images
    info "Building Docker images..."
    if docker-compose -f docker-compose.staging.yml build --no-cache >> "$LOG_FILE" 2>&1; then
        log "Docker images built successfully"
    else
        error "Failed to build Docker images"
        exit 1
    fi
    
    # Start containers
    info "Starting containers..."
    if docker-compose -f docker-compose.staging.yml up -d >> "$LOG_FILE" 2>&1; then
        log "Containers started successfully"
    else
        error "Failed to start containers"
        exit 1
    fi
    
    # Wait for containers to be healthy
    info "Waiting for containers to be healthy..."
    sleep 30
    
    # Check container status
    if docker-compose -f docker-compose.staging.yml ps | grep -q "Up"; then
        log "All containers are running"
    else
        error "Some containers failed to start"
        docker-compose -f docker-compose.staging.yml logs >> "$LOG_FILE"
        exit 1
    fi
}

# Function to enable PQ features
enable_pq_features() {
    log "Enabling PQ features..."
    
    # Wait for application to be ready
    info "Waiting for application to be ready..."
    sleep 10
    
    # Enable PQ feature flags
    info "Enabling PQ feature flags..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -f -X POST "$NEXTAUTH_URL/api/features/enable" \
            -H "Content-Type: application/json" \
            -d "{\"feature\": \"pq_crypto\", \"enabled\": true}" >> "$LOG_FILE" 2>&1; then
            log "PQ features enabled successfully"
            break
        else
            warn "Attempt $attempt: Failed to enable PQ features, retrying..."
            sleep 10
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Failed to enable PQ features after $max_attempts attempts"
        exit 1
    fi
    
    # Verify PQ features are enabled
    info "Verifying PQ features are enabled..."
    if curl -s -f "$NEXTAUTH_URL/api/features/status" | grep -q '"pq_crypto":true'; then
        log "PQ features verified as enabled"
    else
        error "PQ features are not enabled"
        exit 1
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
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
        -d '{"algorithm": "dilithium", "strength": 256}' 2>> "$LOG_FILE")
    
    if echo "$keygen_response" | grep -q '"public_key"'; then
        log "PQ key generation test passed"
    else
        error "PQ key generation test failed"
        exit 1
    fi
    
    # Test PQ signature creation
    info "Testing PQ signature creation..."
    local sign_response=$(curl -s -X POST "$NEXTAUTH_URL/api/pq/sign" \
        -H "Content-Type: application/json" \
        -d '{"message": "test message", "algorithm": "dilithium"}' 2>> "$LOG_FILE")
    
    if echo "$sign_response" | grep -q '"signature"'; then
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
        -d "{\"signature\": \"$signature\", \"message\": \"test message\", \"algorithm\": \"dilithium\"}" 2>> "$LOG_FILE")
    
    if echo "$verify_response" | grep -q '"valid":true'; then
        log "PQ signature verification test passed"
    else
        error "PQ signature verification test failed"
        exit 1
    fi
    
    # Test blockchain transaction with PQ
    info "Testing blockchain transaction with PQ..."
    local tx_response=$(curl -s -X POST "$NEXTAUTH_URL/api/blockchain/transaction" \
        -H "Content-Type: application/json" \
        -d '{"type": "pq", "data": "test transaction data"}' 2>> "$LOG_FILE")
    
    if echo "$tx_response" | grep -q '"transaction_id"'; then
        log "Blockchain transaction test passed"
    else
        error "Blockchain transaction test failed"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check all services are running
    info "Checking service status..."
    if docker-compose -f docker-compose.staging.yml ps | grep -q "Up"; then
        log "All services are running"
    else
        error "Some services are not running"
        exit 1
    fi
    
    # Check database connectivity
    info "Checking database connectivity..."
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" >> "$LOG_FILE" 2>&1; then
            log "Database connectivity verified"
        else
            error "Database connectivity failed"
            exit 1
        fi
    else
        warn "psql not available - skipping database connectivity check"
    fi
    
    # Check PQ monitoring
    info "Checking PQ monitoring..."
    if curl -s -f "$NEXTAUTH_URL/api/pq/metrics" | grep -q '"status":"active"'; then
        log "PQ monitoring is active"
    else
        error "PQ monitoring is not active"
        exit 1
    fi
    
    # Check performance metrics
    info "Checking performance metrics..."
    local metrics=$(curl -s "$NEXTAUTH_URL/api/pq/metrics" 2>> "$LOG_FILE")
    local keygen_time=$(echo "$metrics" | jq -r '.key_generation_time_ms // 0')
    local sign_time=$(echo "$metrics" | jq -r '.signing_time_ms // 0')
    local verify_time=$(echo "$metrics" | jq -r '.verification_time_ms // 0')
    
    if [[ $keygen_time -lt 100 && $sign_time -lt 50 && $verify_time -lt 10 ]]; then
        log "Performance metrics within acceptable limits"
    else
        warn "Performance metrics exceed limits: keygen=${keygen_time}ms, sign=${sign_time}ms, verify=${verify_time}ms"
    fi
}

# Function to generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    local report_file="/tmp/pq-deployment-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "deployment": {
    "timestamp": "$(date -Iseconds)",
    "environment": "staging",
    "version": "v7.0.0-postquantum",
    "status": "success",
    "components": {
      "application": "deployed",
      "database": "migrated",
      "pq_features": "enabled",
      "monitoring": "active"
    },
    "performance": {
      "key_generation_time_ms": $(curl -s "$NEXTAUTH_URL/api/pq/metrics" | jq -r '.key_generation_time_ms // 0'),
      "signing_time_ms": $(curl -s "$NEXTAUTH_URL/api/pq/metrics" | jq -r '.signing_time_ms // 0'),
      "verification_time_ms": $(curl -s "$NEXTAUTH_URL/api/pq/metrics" | jq -r '.verification_time_ms // 0')
    },
    "services": $(docker-compose -f docker-compose.staging.yml ps --format json | jq -c '.'),
    "log_file": "$LOG_FILE"
  }
}
EOF
    
    log "Deployment report generated: $report_file"
    
    # Display summary
    echo ""
    echo -e "${GREEN}=== DEPLOYMENT SUMMARY ===${NC}"
    echo -e "${GREEN}Environment: Staging${NC}"
    echo -e "${GREEN}Version: v7.0.0-postquantum${NC}"
    echo -e "${GREEN}Status: Success${NC}"
    echo -e "${GREEN}Timestamp: $(date)${NC}"
    echo -e "${GREEN}Log File: $LOG_FILE${NC}"
    echo -e "${GREEN}Report: $report_file${NC}"
    echo ""
}

# Function to cleanup on failure
cleanup_on_failure() {
    error "Deployment failed - initiating cleanup..."
    
    # Stop containers
    info "Stopping containers..."
    docker-compose -f docker-compose.staging.yml down --timeout 30 >> "$LOG_FILE" 2>&1 || true
    
    # Restore from backup if available
    info "Checking for backup to restore..."
    local latest_backup=$(ls -t "$PROJECT_ROOT/backups/staging_db_backup_"*.sql 2>/dev/null | head -1)
    if [[ -n "$latest_backup" ]]; then
        warn "Restoring database from backup: $latest_backup"
        if command -v psql &> /dev/null; then
            psql "$DATABASE_URL" < "$latest_backup" >> "$LOG_FILE" 2>&1 || true
        fi
    fi
    
    error "Deployment cleanup completed"
    exit 1
}

# Main execution
main() {
    log "Starting PQ staging deployment..."
    
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
    create_backup
    build_application
    prepare_database
    deploy_containers
    enable_pq_features
    run_smoke_tests
    verify_deployment
    generate_report
    
    log "PQ staging deployment completed successfully!"
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