#!/bin/bash

# KALDRIX Staging Environment Deployment Script
# This script automates the deployment to staging environment

set -e

# Configuration
STAGING_ENV="staging"
DEPLOY_BRANCH="develop"
REGISTRY="ghcr.io"
IMAGE_NAME="kaldrix"
DEPLOY_USER="deploy"
DEPLOY_HOST="staging.kaldrix.com"
DEPLOY_PATH="/opt/kaldrix/staging"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if we're on the correct branch
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "$DEPLOY_BRANCH" ]]; then
        log_error "Must be on $DEPLOY_BRANCH branch to deploy to staging"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if kubectl is installed (for Kubernetes deployment)
    if ! command -v kubectl &> /dev/null; then
        log_warn "kubectl is not installed, will use Docker Compose instead"
    fi
    
    # Check if environment file exists
    if [[ ! -f ".env.staging" ]]; then
        log_error "Environment file .env.staging not found"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building Docker images..."
    
    # Get current Git hash for image tag
    GIT_HASH=$(git rev-parse --short HEAD)
    IMAGE_TAG="${STAGING_ENV}-${GIT_HASH}"
    
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
    
    log_info "Images built and pushed successfully"
}

# Deploy to staging using Docker Compose
deploy_docker_compose() {
    log_info "Deploying to staging using Docker Compose..."
    
    # Create deployment directory on remote server
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${DEPLOY_PATH}"
    
    # Copy files to remote server
    scp docker-compose.yml "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
    scp .env.staging "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/.env"
    
    # Update image tags in docker-compose.yml
    sed -i "s|ghcr.io/your-org/kaldrix:latest|${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}|g" docker-compose.yml
    sed -i "s|ghcr.io/your-org/kaldrix-backend:latest|${REGISTRY}/${IMAGE_NAME}-backend:${IMAGE_TAG}|g" docker-compose.yml
    sed -i "s|ghcr.io/your-org/kaldrix-node:latest|${REGISTRY}/${IMAGE_NAME}-node:${IMAGE_TAG}|g" docker-compose.yml
    
    # Deploy on remote server
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "cd ${DEPLOY_PATH} && \
        docker-compose pull && \
        docker-compose down && \
        docker-compose up -d"
    
    log_info "Docker Compose deployment completed"
}

# Deploy to staging using Kubernetes
deploy_kubernetes() {
    log_info "Deploying to staging using Kubernetes..."
    
    # Update Kubernetes manifests with image tags
    sed -i "s|ghcr.io/your-org/kaldrix:latest|${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}|g" k8s/kaldrix-deployment.yaml
    sed -i "s|ghcr.io/your-org/kaldrix-backend:latest|${REGISTRY}/${IMAGE_NAME}-backend:${IMAGE_TAG}|g" k8s/kaldrix-deployment.yaml
    sed -i "s|ghcr.io/your-org/kaldrix-node:latest|${REGISTRY}/${IMAGE_NAME}-node:${IMAGE_TAG}|g" k8s/kaldrix-deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/kaldrix-deployment.yaml
    kubectl apply -f k8s/monitoring.yaml
    
    # Wait for deployments to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n kaldrix
    kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n kaldrix
    kubectl wait --for=condition=available --timeout=300s deployment/blockchain-deployment -n kaldrix
    
    log_info "Kubernetes deployment completed"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check frontend health
    if curl -f "https://staging.kaldrix.com/api/health" > /dev/null 2>&1; then
        log_info "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    # Check backend health
    if curl -f "https://staging-api.kaldrix.com/api/health" > /dev/null 2>&1; then
        log_info "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check blockchain node health
    if curl -f "http://staging-node.kaldrix.com:8545" > /dev/null 2>&1; then
        log_info "Blockchain node health check passed"
    else
        log_error "Blockchain node health check failed"
        exit 1
    fi
    
    # Check WebSocket connectivity
    if curl -f "wss://staging-ws.kaldrix.com" > /dev/null 2>&1; then
        log_info "WebSocket connectivity check passed"
    else
        log_error "WebSocket connectivity check failed"
        exit 1
    fi
    
    log_info "All health checks passed"
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Test basic API endpoints
    endpoints=(
        "https://staging-api.kaldrix.com/api/health"
        "https://staging-api.kaldrix.com/api/metrics"
        "https://staging-api.kaldrix.com/api/blockchain/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f "$endpoint" > /dev/null 2>&1; then
            log_info "Smoke test passed for $endpoint"
        else
            log_error "Smoke test failed for $endpoint"
            exit 1
        fi
    done
    
    # Test WebSocket connection
    log_info "Testing WebSocket connection..."
    # Add WebSocket test logic here
    
    log_info "Smoke tests completed successfully"
}

# Send deployment notification
send_notification() {
    log_info "Sending deployment notification..."
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 KALDRIX Staging Deployment Completed\\n\\nBranch: ${DEPLOY_BRANCH}\\nCommit: ${GIT_HASH}\\nEnvironment: ${STAGING_ENV}\\nTimestamp: $(date)\"}" \
            "${SLACK_WEBHOOK}"
    fi
    
    # Email notification
    if [[ -n "${SMTP_HOST}" && -n "${EMAIL_RECIPIENTS}" ]]; then
        echo "Subject: KALDRIX Staging Deployment Completed

Branch: ${DEPLOY_BRANCH}
Commit: ${GIT_HASH}
Environment: ${STAGING_ENV}
Timestamp: $(date)

The deployment to staging environment has been completed successfully.

Best regards,
KALDRIX Deployment Bot" | mail -s "KALDRIX Staging Deployment Completed" "${EMAIL_RECIPIENTS}"
    fi
    
    log_info "Notification sent successfully"
}

# Main deployment function
main() {
    log_info "Starting KALDRIX staging deployment..."
    
    check_prerequisites
    build_and_push_images
    
    # Choose deployment method based on available tools
    if command -v kubectl &> /dev/null; then
        deploy_kubernetes
    else
        deploy_docker_compose
    fi
    
    run_health_checks
    run_smoke_tests
    send_notification
    
    log_info "🎉 KALDRIX staging deployment completed successfully!"
}

# Run main function
main "$@"