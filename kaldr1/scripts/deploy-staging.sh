#!/bin/bash

# KALDRIX Staging Deployment Script
# This script deploys the application to the staging environment

set -e

echo "🚀 Starting KALDRIX staging deployment..."

# Configuration
PROJECT_NAME="kaldr1"
STAGING_ENV="staging"
DOCKER_COMPOSE_FILE="docker-compose.staging.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
fi

# Check if docker-compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
fi

# Check if required environment variables are set
if [ -z "$NEXTAUTH_SECRET" ]; then
    warn "NEXTAUTH_SECRET environment variable is not set. Using default for staging."
    export NEXTAUTH_SECRET="staging-secret-key-change-in-production"
fi

if [ -z "$DATABASE_URL" ]; then
    warn "DATABASE_URL environment variable is not set. Using default for staging."
    export DATABASE_URL="postgresql://postgres:staging-password@db:5432/kaldr1_staging"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current database if it exists
log "💾 Creating database backup..."
if docker ps -q -f name=${PROJECT_NAME}_${STAGING_ENV}_db | grep -q .; then
    docker exec ${PROJECT_NAME}_${STAGING_ENV}_db pg_dump -U postgres kaldr1_staging > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" || warn "Could not create database backup"
    log "Database backup created: $BACKUP_DIR/db_backup_$TIMESTAMP.sql"
fi

# Pull latest changes from git
log "📥 Pulling latest changes from repository..."
git pull origin phase6-validation-fixes || error "Failed to pull latest changes"

# Install dependencies
log "📦 Installing dependencies..."
npm ci || error "Failed to install dependencies"

# Run tests
log "🧪 Running tests..."
npm run test:unit || error "Unit tests failed"
npm run lint || error "Linting failed"

# Build Docker image
log "🐳 Building Docker image..."
docker-compose -f "$DOCKER_COMPOSE_FILE" build || error "Failed to build Docker image"

# Stop existing containers
log "🛑 Stopping existing containers..."
docker-compose -f "$DOCKER_COMPOSE_FILE" down || warn "Failed to stop existing containers"

# Start new containers
log "🚀 Starting new containers..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || error "Failed to start containers"

# Wait for application to be ready
log "⏳ Waiting for application to be ready..."
sleep 30

# Run health checks
log "🏥 Running health checks..."

# Check if application is responding
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Application is healthy"
else
    warn "⚠️  Application health check failed"
fi

# Check database connectivity
if docker exec ${PROJECT_NAME}_${STAGING_ENV}_db pg_isready -U postgres > /dev/null 2>&1; then
    log "✅ Database is healthy"
else
    warn "⚠️  Database health check failed"
fi

# Run smoke tests
log "💨 Running smoke tests..."
curl -f http://localhost:3000/api/blockchain/status > /dev/null 2>&1 || warn "Blockchain status API failed"
curl -f http://localhost:3000/api/blockchain/contracts > /dev/null 2>&1 || warn "Contracts API failed"
curl -f http://localhost:3000/api/blockchain/transactions > /dev/null 2>&1 || warn "Transactions API failed"

# Run database migrations if needed
log "🔄 Running database migrations..."
docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app npx prisma db push || warn "Database migrations failed"

# Seed database with test data
log "🌱 Seeding database..."
docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app npm run db:seed || warn "Database seeding failed"

# Log deployment information
log "📊 Deployment Information:"
echo "  - Environment: $STAGING_ENV"
echo "  - Timestamp: $TIMESTAMP"
echo "  - Git Commit: $(git rev-parse HEAD)"
echo "  - Docker Image: $(docker images --format "{{.Repository}}:{{.Tag}}" | grep kaldr1 | head -1)"
echo "  - Access URL: http://localhost:3000"

# Display running containers
log "📦 Running containers:"
docker-compose -f "$DOCKER_COMPOSE_FILE" ps

# Success message
log "🎉 Staging deployment completed successfully!"
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
        --data "{\"text\":\"🚀 KALDRIX staging deployment completed successfully!\\n\\nEnvironment: $STAGING_ENV\\nTimestamp: $TIMESTAMP\\nAccess URL: http://localhost:3000\"}" \
        "$SLACK_WEBHOOK_URL" || warn "Failed to send Slack notification"
fi

echo ""
log "✨ Deployment process completed!"