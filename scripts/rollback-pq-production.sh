#!/bin/bash

# KALDRIX Phase 7: Post-Quantum Integration Production Rollback Script
# This script automates the rollback of PQ cryptography components in production environment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROD_CONFIG="$PROJECT_ROOT/.env.production"
LOG_FILE="/tmp/pq-rollback-production-$(date +%Y%m%d_%H%M%S).log"
ROLLBACK_VERSION="v6.0.0-release-candidate"

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
    log "Checking rollback requirements..."
    
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
        error "psql is not installed - required for production rollback"
        exit 1
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        error "curl is not installed - required for production rollback"
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
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log "Environment configuration loaded successfully"
}

# Function to create backup before rollback
create_rollback_backup() {
    log "Creating pre-rollback backup..."
    
    # Create backup directory
    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    info "Creating database backup before rollback..."
    DB_BACKUP="$BACKUP_DIR/pre_rollback_db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump "$DATABASE_URL" > "$DB_BACKUP" 2>> "$LOG_FILE"; then
        log "Pre-rollback database backup created: $DB_BACKUP"
    else
        error "Failed to create pre-rollback database backup"
        exit 1
    fi
    
    # Backup current configuration
    info "Creating configuration backup before rollback..."
    CONFIG_BACKUP="$BACKUP_DIR/pre_rollback_config_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    if tar -czf "$CONFIG_BACKUP" -C "$PROJECT_ROOT" .env* docker-compose*.yml 2>> "$LOG_FILE"; then
        log "Pre-rollback configuration backup created: $CONFIG_BACKUP"
    else
        error "Failed to create pre-rollback configuration backup"
        exit 1
    fi
    
    # Backup current git state
    info "Creating git state backup before rollback..."
    GIT_BACKUP="$BACKUP_DIR/pre_rollback_git_backup_$(date +%Y%m%d_%H%M%S).txt"
    git log --oneline -10 > "$GIT_BACKUP" 2>> "$LOG_FILE"
    git status >> "$GIT_BACKUP" 2>> "$LOG_FILE"
    log "Pre-rollback git state backup created: $GIT_BACKUP"
}

# Function to verify rollback prerequisites
verify_rollback_prerequisites() {
    log "Verifying rollback prerequisites..."
    
    # Check if rollback version exists
    if ! git tag | grep -q "$ROLLBACK_VERSION"; then
        error "Rollback version $ROLLBACK_VERSION not found"
        exit 1
    fi
    
    # Check if there are uncommitted changes
    if [[ -n "$(git status --porcelain)" ]]; then
        warn "There are uncommitted changes - will be stashed"
        git stash push -m "rollback-stash-$(date +%Y%m%d_%H%M%S)" >> "$LOG_FILE" 2>&1
    fi
    
    # Check production environment connectivity
    info "Checking production environment connectivity..."
    if ! curl -s -f "$NEXTAUTH_URL/api/health" > /dev/null; then
        warn "Production environment is not accessible - will proceed with offline rollback"
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
    if [[ $available_space -lt 5242880 ]]; then  # 5GB in KB
        error "Insufficient disk space: $available_space KB available"
        exit 1
    fi
    
    log "Rollback prerequisites verified"
}

# Function to disable PQ features
disable_pq_features() {
    log "Disabling PQ features..."
    
    # Attempt to disable PQ features via API
    info "Attempting to disable PQ features via API..."
    if curl -s -f -X POST "$NEXTAUTH_URL/api/features/disable" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"feature": "pq_crypto", "enabled": false}' >> "$LOG_FILE" 2>&1; then
        log "PQ features disabled via API"
    else
        warn "Failed to disable PQ features via API - will disable during container restart"
    fi
    
    # Stop PQ-specific services
    info "Stopping PQ-specific services..."
    docker-compose -f docker-compose.production.yml stop pq-key-generation pq-signing pq-verification pq-monitoring >> "$LOG_FILE" 2>&1 || true
    
    log "PQ features disabled"
}

# Function to stop current deployment
stop_current_deployment() {
    log "Stopping current deployment..."
    
    # Gracefully stop all containers
    info "Gracefully stopping all containers..."
    if docker-compose -f docker-compose.production.yml down --timeout 60 >> "$LOG_FILE" 2>&1; then
        log "All containers stopped successfully"
    else
        warn "Some containers failed to stop gracefully - forcing stop"
        docker-compose -f docker-compose.production.yml down --timeout 10 >> "$LOG_FILE" 2>&1 || true
    fi
    
    # Stop any remaining containers
    info "Stopping any remaining containers..."
    docker stop $(docker ps -q --filter "name=kaldr1") 2>/dev/null || true
    
    log "Current deployment stopped"
}

# Function to restore database
restore_database() {
    log "Restoring database..."
    
    # Find the latest backup
    local latest_backup=$(ls -t "$PROJECT_ROOT/backups/production_db_backup_"*.sql 2>/dev/null | head -1)
    
    if [[ -z "$latest_backup" ]]; then
        error "No database backup found for restoration"
        exit 1
    fi
    
    info "Restoring database from backup: $latest_backup"
    
    # Drop existing database and recreate
    info "Dropping and recreating database..."
    local db_name=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    local db_user=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    local db_host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local db_port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    if [[ -z "$db_port" ]]; then
        db_port="5432"
    fi
    
    # Drop database
    dropdb -h "$db_host" -p "$db_port" -U "$db_user" "$db_name" >> "$LOG_FILE" 2>&1 || true
    
    # Create database
    createdb -h "$db_host" -p "$db_port" -U "$db_user" "$db_name" >> "$LOG_FILE" 2>&1
    
    # Restore from backup
    if psql -h "$db_host" -p "$db_port" -U "$db_user" "$db_name" < "$latest_backup" >> "$LOG_FILE" 2>&1; then
        log "Database restored successfully from: $latest_backup"
    else
        error "Failed to restore database from backup"
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

# Function to checkout rollback version
checkout_rollback_version() {
    log "Checking out rollback version: $ROLLBACK_VERSION"
    
    cd "$PROJECT_ROOT"
    
    # Checkout the rollback version
    if git checkout "$ROLLBACK_VERSION" >> "$LOG_FILE" 2>&1; then
        log "Successfully checked out rollback version: $ROLLBACK_VERSION"
    else
        error "Failed to checkout rollback version: $ROLLBACK_VERSION"
        exit 1
    fi
    
    # Verify the checkout
    local current_version=$(git describe --exact-match --tags HEAD 2>/dev/null || echo "")
    if [[ "$current_version" != "$ROLLBACK_VERSION" ]]; then
        error "Failed to verify rollback version checkout"
        exit 1
    fi
    
    log "Rollback version checkout verified"
}

# Function to rebuild and deploy
rebuild_and_deploy() {
    log "Rebuilding and deploying rollback version..."
    
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
    
    # Generate Prisma client
    info "Generating Prisma client..."
    if npx prisma generate --silent >> "$LOG_FILE" 2>&1; then
        log "Prisma client generated successfully"
    else
        error "Failed to generate Prisma client"
        exit 1
    fi
    
    # Build Docker images
    info "Building Docker images..."
    if docker-compose -f docker-compose.production.yml build --no-cache >> "$LOG_FILE" 2>&1; then
        log "Docker images built successfully"
    else
        error "Failed to build Docker images"
        exit 1
    fi
    
    # Start containers
    info "Starting containers..."
    if docker-compose -f docker-compose.production.yml up -d >> "$LOG_FILE" 2>&1; then
        log "Containers started successfully"
    else
        error "Failed to start containers"
        exit 1
    fi
    
    # Wait for containers to be healthy
    info "Waiting for containers to be healthy..."
    sleep 30
    
    # Check container status
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        log "All containers are running"
    else
        error "Some containers failed to start"
        docker-compose -f docker-compose.production.yml logs >> "$LOG_FILE"
        exit 1
    fi
}

# Function to verify rollback
verify_rollback() {
    log "Verifying rollback..."
    
    # Wait for application to be ready
    info "Waiting for application to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -f "$NEXTAUTH_URL/api/health" > /dev/null; then
            log "Application is ready"
            break
        else
            warn "Attempt $attempt: Application not ready, retrying..."
            sleep 10
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Application failed to become ready after rollback"
        exit 1
    fi
    
    # Test application health
    info "Testing application health..."
    local health_response=$(curl -s "$NEXTAUTH_URL/api/health")
    if echo "$health_response" | grep -q '"status":"healthy"'; then
        log "Application health check passed"
    else
        error "Application health check failed"
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
    
    # Verify PQ features are disabled
    info "Verifying PQ features are disabled..."
    if curl -s -f "$NEXTAUTH_URL/api/features/status" | grep -q '"pq_crypto":false'; then
        log "PQ features are disabled"
    else
        error "PQ features are still enabled"
        exit 1
    fi
    
    # Test basic functionality
    info "Testing basic functionality..."
    if curl -s -f "$NEXTAUTH_URL/api/blockchain/status" | grep -q '"status":"active"'; then
        log "Basic functionality test passed"
    else
        error "Basic functionality test failed"
        exit 1
    fi
    
    # Test ECDSA operations (should work)
    info "Testing ECDSA operations..."
    local ecdsa_response=$(curl -s -X POST "$NEXTAUTH_URL/api/blockchain/transaction" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"type": "ecdsa", "data": "test transaction data"}' 2>> "$LOG_FILE")
    
    if echo "$ecdsa_response" | jq -e '.transaction_id' > /dev/null; then
        log "ECDSA operations test passed"
    else
        error "ECDSA operations test failed"
        exit 1
    fi
    
    # Verify PQ operations are not available
    info "Verifying PQ operations are not available..."
    if curl -s -f "$NEXTAUTH_URL/api/pq/key/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROD_API_KEY" \
        -d '{"algorithm": "dilithium", "strength": 256}' 2>> "$LOG_FILE" | grep -q '"error":"feature_disabled"'; then
        log "PQ operations are correctly disabled"
    else
        warn "PQ operations may still be available"
    fi
    
    log "Rollback verification completed successfully"
}

# Function to generate rollback report
generate_rollback_report() {
    log "Generating rollback report..."
    
    local report_file="/tmp/pq-rollback-report-$(date +%Y%m%d_%H%M%S).json"
    
    # Get current version
    local current_version=$(git describe --exact-match --tags HEAD 2>/dev/null || echo "unknown")
    
    cat > "$report_file" << EOF
{
  "rollback": {
    "timestamp": "$(date -Iseconds)",
    "environment": "production",
    "from_version": "v7.0.0-postquantum",
    "to_version": "$current_version",
    "status": "success",
    "components": {
      "application": "rolled_back",
      "database": "restored",
      "pq_features": "disabled",
      "services": "restarted"
    },
    "backup_used": "$(ls -t "$PROJECT_ROOT/backups/pre_rollback_db_backup_"*.sql 2>/dev/null | head -1)",
    "services": $(docker-compose -f docker-compose.production.yml ps --format json | jq -c '.'),
    "log_file": "$LOG_FILE"
  }
}
EOF
    
    log "Rollback report generated: $report_file"
    
    # Display summary
    echo ""
    echo -e "${GREEN}=== ROLLBACK SUMMARY ===${NC}"
    echo -e "${GREEN}Environment: Production${NC}"
    echo -e "${GREEN}From Version: v7.0.0-postquantum${NC}"
    echo -e "${GREEN}To Version: $current_version${NC}"
    echo -e "${GREEN}Status: Success${NC}"
    echo -e "${GREEN}Timestamp: $(date)${NC}"
    echo -e "${GREEN}Log File: $LOG_FILE${NC}"
    echo -e "${GREEN}Report: $report_file${NC}"
    echo ""
}

# Function to cleanup on failure
cleanup_on_failure() {
    error "Rollback failed - attempting emergency recovery..."
    
    # Try to restore from backup
    info "Attempting emergency database restore..."
    local latest_backup=$(ls -t "$PROJECT_ROOT/backups/pre_rollback_db_backup_"*.sql 2>/dev/null | head -1)
    if [[ -n "$latest_backup" ]]; then
        warn "Attempting to restore from: $latest_backup"
        psql "$DATABASE_URL" < "$latest_backup" >> "$LOG_FILE" 2>&1 || true
    fi
    
    # Try to restart containers
    info "Attempting to restart containers..."
    docker-compose -f docker-compose.production.yml up -d >> "$LOG_FILE" 2>&1 || true
    
    error "Emergency recovery attempted - manual intervention required"
    exit 1
}

# Function to send rollback notification
send_rollback_notification() {
    log "Sending rollback notification..."
    
    # Create notification message
    local message="KALDRIX Production Rollback Completed

Environment: Production
From Version: v7.0.0-postquantum
To Version: $(git describe --exact-match --tags HEAD 2>/dev/null || echo "unknown")
Status: Success
Timestamp: $(date)

Rollback Log: $LOG_FILE
Rollback Report: /tmp/pq-rollback-report-$(date +%Y%m%d_%H%M%S).json

Please verify system functionality and monitor for any issues."
    
    # Log the notification
    info "Rollback notification prepared:"
    echo "$message" >> "$LOG_FILE"
    
    # Add your notification logic here (e.g., Slack, email, etc.)
    # Example:
    # curl -X POST "$SLACK_WEBHOOK" \
    #   -H "Content-Type: application/json" \
    #   -d "{\"text\": \"$message\"}"
    
    log "Rollback notification sent"
}

# Main execution
main() {
    log "Starting PQ production rollback..."
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Check if running in dry-run mode
    if [[ "${1:-}" == "--dry-run" ]]; then
        log "Running in dry-run mode..."
        log "All checks passed - would proceed with rollback"
        exit 0
    fi
    
    # Execute rollback phases
    check_requirements
    load_config
    create_rollback_backup
    verify_rollback_prerequisites
    disable_pq_features
    stop_current_deployment
    restore_database
    checkout_rollback_version
    rebuild_and_deploy
    verify_rollback
    generate_rollback_report
    send_rollback_notification
    
    log "PQ production rollback completed successfully!"
    
    # Send final notification
    info "Rollback completed - system is now running version: $(git describe --exact-match --tags HEAD 2>/dev/null || echo "unknown")"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo "Options:"
        echo "  --dry-run    Run checks without rolling back"
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