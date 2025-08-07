#!/bin/bash

# KALDRIX Zero-Downtime Deployment Script
# This script implements zero-downtime deployment with rolling updates and health checks

set -e

# Configuration
ENVIRONMENT="$1"
DEPLOYMENT_TYPE="$2"
NAMESPACE="kaldrix"
HEALTH_CHECK_SCRIPT="./scripts/health-check.sh"
ROLLING_UPDATE_TIMEOUT=600  # 10 minutes
HEALTH_CHECK_TIMEOUT=300     # 5 minutes
BACKUP_ENABLED=true
ROLLBACK_ENABLED=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    log_info "Checking zero-downtime deployment prerequisites..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if health check script exists
    if [[ ! -f "$HEALTH_CHECK_SCRIPT" ]]; then
        log_error "Health check script not found: $HEALTH_CHECK_SCRIPT"
        exit 1
    fi
    
    # Check if we're connected to the cluster
    if ! kubectl cluster-info > /dev/null 2>&1; then
        log_error "Not connected to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
        log_error "Namespace $NAMESPACE does not exist"
        exit 1
    fi
    
    log_info "Zero-downtime deployment prerequisites check passed"
}

# Get current deployment status
get_deployment_status() {
    local deployment_name="$1"
    kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="Available")].status}'
}

# Get current replica count
get_replica_count() {
    local deployment_name="$1"
    kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}'
}

# Get available replica count
get_available_replicas() {
    local deployment_name="$1"
    kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}'
}

# Wait for deployment to be ready
wait_for_deployment_ready() {
    local deployment_name="$1"
    local timeout="$2"
    
    log_info "Waiting for deployment $deployment_name to be ready..."
    
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed_time=$((current_time - start_time))
        
        if [[ $elapsed_time -gt $timeout ]]; then
            log_error "Timeout waiting for deployment $deployment_name to be ready"
            return 1
        fi
        
        local status=$(get_deployment_status "$deployment_name")
        local replicas=$(get_replica_count "$deployment_name")
        local available=$(get_available_replicas "$deployment_name")
        
        if [[ "$status" == "True" && "$replicas" == "$available" ]]; then
            log_info "✓ Deployment $deployment_name is ready ($available/$replicas replicas available)"
            return 0
        else
            log_debug "Deployment $deployment_name status: $status ($available/$replicas replicas available)"
            sleep 10
        fi
    done
}

# Perform rolling update
perform_rolling_update() {
    local deployment_name="$1"
    local new_image="$2"
    
    log_info "Starting rolling update for deployment $deployment_name..."
    
    # Get current replica count
    local replicas=$(get_replica_count "$deployment_name")
    log_debug "Current replica count for $deployment_name: $replicas"
    
    # Update deployment with new image
    kubectl set image deployment/$deployment_name -n "$NAMESPACE" "*=$new_image"
    
    # Watch rolling update progress
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed_time=$((current_time - start_time))
        
        if [[ $elapsed_time -gt $ROLLING_UPDATE_TIMEOUT ]]; then
            log_error "Rolling update timeout for deployment $deployment_name"
            return 1
        fi
        
        # Check rollout status
        if kubectl rollout status deployment/$deployment_name -n "$NAMESPACE" --timeout=10s > /dev/null 2>&1; then
            log_info "✓ Rolling update completed for deployment $deployment_name"
            return 0
        else
            log_debug "Rolling update in progress for deployment $deployment_name..."
            
            # Check if we have minimum available replicas
            local available=$(get_available_replicas "$deployment_name")
            local min_available=$((replicas / 2))
            
            if [[ $available -lt $min_available ]]; then
                log_warn "Low available replicas for $deployment_name: $available/$replicas"
            fi
            
            sleep 10
        fi
    done
}

# Health check after deployment
health_check_after_deployment() {
    local deployment_name="$1"
    
    log_info "Running health checks after deployment of $deployment_name..."
    
    # Wait a bit for services to stabilize
    sleep 30
    
    # Run comprehensive health check
    if "$HEALTH_CHECK_SCRIPT" comprehensive "$ENVIRONMENT"; then
        log_info "✓ Health checks passed for deployment $deployment_name"
        return 0
    else
        log_error "✗ Health checks failed for deployment $deployment_name"
        return 1
    fi
}

# Rollback deployment
rollback_deployment() {
    local deployment_name="$1"
    
    log_warn "Rolling back deployment $deployment_name..."
    
    # Get previous revision
    local revision=$(kubectl rollout history deployment/$deployment_name -n "$NAMESPACE" | tail -2 | head -1 | awk '{print $1}')
    
    if [[ -n "$revision" ]]; then
        log_info "Rolling back to revision $revision"
        
        # Perform rollback
        kubectl rollout undo deployment/$deployment_name -n "$NAMESPACE" --to-revision="$revision"
        
        # Wait for rollback to complete
        if wait_for_deployment_ready "$deployment_name" 300; then
            log_info "✓ Rollback completed for deployment $deployment_name"
            return 0
        else
            log_error "✗ Rollback failed for deployment $deployment_name"
            return 1
        fi
    else
        log_error "No previous revision found for rollback"
        return 1
    fi
}

# Deploy frontend
deploy_frontend() {
    local new_image="$1"
    
    log_info "Deploying frontend with image: $new_image"
    
    # Perform rolling update
    if perform_rolling_update "frontend-deployment" "$new_image"; then
        # Health check
        if health_check_after_deployment "frontend-deployment"; then
            log_info "✓ Frontend deployment completed successfully"
            return 0
        else
            if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
                log_warn "Health checks failed, rolling back frontend..."
                rollback_deployment "frontend-deployment"
            fi
            return 1
        fi
    else
        log_error "✗ Frontend rolling update failed"
        return 1
    fi
}

# Deploy backend
deploy_backend() {
    local new_image="$1"
    
    log_info "Deploying backend with image: $new_image"
    
    # Perform rolling update
    if perform_rolling_update "backend-deployment" "$new_image"; then
        # Health check
        if health_check_after_deployment "backend-deployment"; then
            log_info "✓ Backend deployment completed successfully"
            return 0
        else
            if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
                log_warn "Health checks failed, rolling back backend..."
                rollback_deployment "backend-deployment"
            fi
            return 1
        fi
    else
        log_error "✗ Backend rolling update failed"
        return 1
    fi
}

# Deploy blockchain node
deploy_blockchain() {
    local new_image="$1"
    
    log_info "Deploying blockchain node with image: $new_image"
    
    # For blockchain node, we need to be more careful due to statefulness
    log_info "Blockchain node deployment requires special handling due to statefulness"
    
    # Perform rolling update
    if perform_rolling_update "blockchain-deployment" "$new_image"; then
        # Health check
        if health_check_after_deployment "blockchain-deployment"; then
            log_info "✓ Blockchain node deployment completed successfully"
            return 0
        else
            if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
                log_warn "Health checks failed, rolling back blockchain node..."
                rollback_deployment "blockchain-deployment"
            fi
            return 1
        fi
    else
        log_error "✗ Blockchain node rolling update failed"
        return 1
    fi
}

# Create backup before deployment
create_backup() {
    if [[ "$BACKUP_ENABLED" != "true" ]]; then
        log_info "Backup is disabled, skipping..."
        return 0
    fi
    
    log_info "Creating backup before deployment..."
    
    # Create backup timestamp
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_name="kaldrix-backup-$timestamp"
    
    # Create backup of all deployments
    kubectl get deployment,service,configmap,secret -n "$NAMESPACE" -o yaml > "backup-$backup_name.yaml"
    
    log_info "✓ Backup created: backup-$backup_name.yaml"
    
    # Upload to cloud storage if configured
    if [[ -n "$BACKUP_BUCKET" ]]; then
        log_info "Uploading backup to cloud storage..."
        aws s3 cp "backup-$backup_name.yaml" "s3://$BACKUP_BUCKET/backups/"
        log_info "✓ Backup uploaded to cloud storage"
    fi
}

# Main deployment function
main() {
    local environment="$1"
    local deployment_type="$2"
    local frontend_image="$3"
    local backend_image="$4"
    local blockchain_image="$5"
    
    log_info "🚀 Starting zero-downtime deployment for $environment environment..."
    
    # Set environment-specific configurations
    if [[ "$environment" == "production" ]]; then
        NAMESPACE="kaldrix"
        HEALTH_CHECK_TIMEOUT=300
    elif [[ "$environment" == "staging" ]]; then
        NAMESPACE="kaldrix-staging"
        HEALTH_CHECK_TIMEOUT=180
    else
        log_error "Unknown environment: $environment"
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Deploy based on deployment type
    case "$deployment_type" in
        "full")
            log_info "Performing full deployment..."
            
            # Deploy in order: blockchain -> backend -> frontend
            deploy_blockchain "$blockchain_image"
            deploy_backend "$backend_image"
            deploy_frontend "$frontend_image"
            ;;
        "frontend")
            log_info "Performing frontend-only deployment..."
            deploy_frontend "$frontend_image"
            ;;
        "backend")
            log_info "Performing backend-only deployment..."
            deploy_backend "$backend_image"
            ;;
        "blockchain")
            log_info "Performing blockchain-only deployment..."
            deploy_blockchain "$blockchain_image"
            ;;
        *)
            log_error "Unknown deployment type: $deployment_type"
            exit 1
            ;;
    esac
    
    # Final comprehensive health check
    log_info "Running final comprehensive health check..."
    if "$HEALTH_CHECK_SCRIPT" comprehensive "$environment"; then
        log_info "🎉 Zero-downtime deployment completed successfully!"
        return 0
    else
        log_error "❌ Final health check failed"
        return 1
    fi
}

# Usage information
usage() {
    echo "Usage: $0 <environment> <deployment_type> [frontend_image] [backend_image] [blockchain_image]"
    echo ""
    echo "Environment: production|staging"
    echo "Deployment Type: full|frontend|backend|blockchain"
    echo ""
    echo "Examples:"
    echo "  $0 production full ghcr.io/your-org/kaldrix:latest ghcr.io/your-org/kaldrix-backend:latest ghcr.io/your-org/kaldrix-node:latest"
    echo "  $0 staging frontend ghcr.io/your-org/kaldrix:staging-latest"
    echo "  $0 production backend ghcr.io/your-org/kaldrix-backend:latest"
    exit 1
}

# Check arguments
if [[ $# -lt 2 ]]; then
    usage
fi

# Run main function
main "$@"