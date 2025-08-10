#!/bin/bash

# KALDRIX Rollback Script
# This script rolls back the application to a previous version

set -e

echo "🔄 Starting KALDRIX rollback process..."

# Configuration
PROJECT_NAME="kaldr1"
STAGING_ENV="staging"
DOCKER_COMPOSE_FILE="docker-compose.staging.yml"
BACKUP_DIR="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if rollback target is provided
if [ -z "$1" ]; then
    error "Please provide a rollback target (git commit hash or tag)"
fi

ROLLBACK_TARGET=$1

log "🎯 Rolling back to: $ROLLBACK_TARGET"

# Pre-rollback checks
log "🔍 Running pre-rollback checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
fi

# Check if docker-compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current database
log "💾 Creating database backup before rollback..."
if docker ps -q -f name=${PROJECT_NAME}_${STAGING_ENV}_db | grep -q .; then
    docker exec ${PROJECT_NAME}_${STAGING_ENV}_db pg_dump -U postgres kaldr1_staging > "$BACKUP_DIR/pre_rollback_db_backup_$(date +%Y%m%d_%H%M%S).sql" || warn "Could not create database backup"
    log "Pre-rollback database backup created"
fi

# Stop current containers
log "🛑 Stopping current containers..."
docker-compose -f "$DOCKER_COMPOSE_FILE" down || warn "Failed to stop existing containers"

# Rollback git repository
log "📥 Rolling back git repository to $ROLLBACK_TARGET..."
git checkout "$ROLLBACK_TARGET" || error "Failed to checkout rollback target"

# Install dependencies for rollback version
log "📦 Installing dependencies for rollback version..."
npm ci || error "Failed to install dependencies"

# Build Docker image for rollback version
log "🐳 Building Docker image for rollback version..."
docker-compose -f "$DOCKER_COMPOSE_FILE" build || error "Failed to build Docker image"

# Start containers with rollback version
log "🚀 Starting containers with rollback version..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || error "Failed to start containers"

# Wait for application to be ready
log "⏳ Waiting for application to be ready..."
sleep 30

# Run health checks
log "🏥 Running health checks..."

# Check if application is responding
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Application is healthy after rollback"
else
    warn "⚠️  Application health check failed after rollback"
fi

# Check database connectivity
if docker exec ${PROJECT_NAME}_${STAGING_ENV}_db pg_isready -U postgres > /dev/null 2>&1; then
    log "✅ Database is healthy after rollback"
else
    warn "⚠️  Database health check failed after rollback"
fi

# Run smoke tests
log "💨 Running smoke tests after rollback..."
curl -f http://localhost:3000/api/blockchain/status > /dev/null 2>&1 || warn "Blockchain status API failed"
curl -f http://localhost:3000/api/blockchain/contracts > /dev/null 2>&1 || warn "Contracts API failed"
curl -f http://localhost:3000/api/blockchain/transactions > /dev/null 2>&1 || warn "Transactions API failed"

# Log rollback information
log "📊 Rollback Information:"
echo "  - Environment: $STAGING_ENV"
echo "  - Rollback Target: $ROLLBACK_TARGET"
echo "  - Timestamp: $(date +%Y%m%d_%H%M%S)"
echo "  - Previous Commit: $(git rev-parse HEAD^)"
echo "  - Current Commit: $(git rev-parse HEAD)"
echo "  - Access URL: http://localhost:3000"

# Display running containers
log "📦 Running containers:"
docker-compose -f "$DOCKER_COMPOSE_FILE" ps

# Success message
log "🎉 Rollback completed successfully!"
echo ""
echo "🌐 Application is available at: http://localhost:3000"
echo "📊 Monitoring dashboard: http://localhost:3001 (Grafana)"
echo "📈 Metrics: http://localhost:9090 (Prometheus)"
echo ""
echo "📝 To view logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "🛑 To stop: docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "🔄 To restart: docker-compose -f $DOCKER_COMPOSE_FILE restart"

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    log "📢 Sending Slack notification..."
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🔄 KALDRIX rollback completed successfully!\\n\\nEnvironment: $STAGING_ENV\\nRollback Target: $ROLLBACK_TARGET\\nTimestamp: $(date +%Y%m%d_%H%M%S)\\nAccess URL: http://localhost:3000\"}" \
        "$SLACK_WEBHOOK_URL" || warn "Failed to send Slack notification"
fi

echo ""
log "✨ Rollback process completed!"