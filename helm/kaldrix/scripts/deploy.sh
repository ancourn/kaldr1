#!/bin/bash

# KALDRIX Helm Chart Deployment Script
# This script helps deploy and manage the KALDRIX blockchain platform using Helm

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$(dirname "$SCRIPT_DIR")"
RELEASE_NAME=""
NAMESPACE=""
ENVIRONMENT=""
VALUES_FILE=""
DRY_RUN=false
UPGRADE=false
UNINSTALL=false
STATUS=false
DEBUG=false

# Default values
DEFAULT_RELEASE_NAME="kaldrix"
DEFAULT_NAMESPACE="kaldrix"
DEFAULT_ENVIRONMENT="production"

# Help function
show_help() {
    cat << EOF
KALDRIX Helm Chart Deployment Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -r, --release NAME      Release name (default: kaldrix)
    -n, --namespace NAME     Kubernetes namespace (default: kaldrix)
    -e, --env ENV           Environment (staging|production, default: production)
    -f, --values FILE       Custom values file
    -u, --upgrade           Upgrade existing release
    -d, --dry-run           Dry run (show what would be done)
    -s, --status            Show release status
    -x, --uninstall         Uninstall release
    --debug                 Enable debug mode
    -h, --help              Show this help message

EXAMPLES:
    # Install for production
    $0 -e production

    # Install for staging
    $0 -e staging

    # Install with custom values
    $0 -f custom-values.yaml

    # Upgrade existing release
    $0 -u

    # Show status
    $0 -s

    # Uninstall release
    $0 -x

    # Dry run
    $0 -d

ENVIRONMENTS:
    staging     - Staging environment with reduced resources
    production  - Production environment with full resources and HA

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [[ "$DEBUG" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -f|--values)
                VALUES_FILE="$2"
                shift 2
                ;;
            -u|--upgrade)
                UPGRADE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -s|--status)
                STATUS=true
                shift
                ;;
            -x|--uninstall)
                UNINSTALL=true
                shift
                ;;
            --debug)
                DEBUG=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Set default values
    if [[ -z "$RELEASE_NAME" ]]; then
        RELEASE_NAME="$DEFAULT_RELEASE_NAME"
    fi

    if [[ -z "$NAMESPACE" ]]; then
        NAMESPACE="$DEFAULT_NAMESPACE"
    fi

    if [[ -z "$ENVIRONMENT" ]]; then
        ENVIRONMENT="$DEFAULT_ENVIRONMENT"
    fi

    # Set values file based on environment
    if [[ -z "$VALUES_FILE" ]]; then
        case "$ENVIRONMENT" in
            staging)
                VALUES_FILE="$CHART_DIR/values-staging.yaml"
                ;;
            production)
                VALUES_FILE="$CHART_DIR/values-production.yaml"
                ;;
            *)
                log_error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'"
                exit 1
                ;;
        esac
    fi

    log_debug "Release name: $RELEASE_NAME"
    log_debug "Namespace: $NAMESPACE"
    log_debug "Environment: $ENVIRONMENT"
    log_debug "Values file: $VALUES_FILE"
    log_debug "Dry run: $DRY_RUN"
    log_debug "Upgrade: $UPGRADE"
    log_debug "Uninstall: $UNINSTALL"
    log_debug "Status: $STATUS"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm 3.0+"
        exit 1
    fi

    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl"
        exit 1
    fi

    # Check if values file exists
    if [[ ! -f "$VALUES_FILE" ]]; then
        log_error "Values file not found: $VALUES_FILE"
        exit 1
    fi

    # Check if chart directory exists
    if [[ ! -d "$CHART_DIR" ]]; then
        log_error "Chart directory not found: $CHART_DIR"
        exit 1
    fi

    # Check if connected to Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Not connected to Kubernetes cluster"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Create namespace if it doesn't exist
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"

    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Namespace $NAMESPACE already exists"
    else
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "DRY RUN: Would create namespace $NAMESPACE"
        else
            kubectl create namespace "$NAMESPACE"
            log_success "Namespace $NAMESPACE created"
        fi
    fi
}

# Install or upgrade Helm release
deploy_helm_release() {
    local helm_cmd=""
    local action=""

    if [[ "$UPGRADE" == "true" ]]; then
        helm_cmd="helm upgrade"
        action="Upgrading"
    else
        helm_cmd="helm install"
        action="Installing"
    fi

    log_info "$action Helm release: $RELEASE_NAME"

    local cmd_array=(
        "$helm_cmd"
        "$RELEASE_NAME"
        "$CHART_DIR"
        "--namespace"
        "$NAMESPACE"
        "--values"
        "$VALUES_FILE"
        "--wait"
        "--timeout"
        "600s"
    )

    if [[ "$DRY_RUN" == "true" ]]; then
        cmd_array+=("--dry-run" "--debug")
    fi

    if [[ "$DEBUG" == "true" ]]; then
        cmd_array+=("--debug")
    fi

    log_debug "Running command: ${cmd_array[*]}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would run: ${cmd_array[*]}"
    else
        if "${cmd_array[@]}"; then
            log_success "Helm release $action completed successfully"
        else
            log_error "Failed to $action Helm release"
            exit 1
        fi
    fi
}

# Show release status
show_status() {
    log_info "Showing release status for: $RELEASE_NAME"

    if ! helm status "$RELEASE_NAME" --namespace "$NAMESPACE"; then
        log_error "Release $RELEASE_NAME not found in namespace $NAMESPACE"
        exit 1
    fi

    echo ""
    log_info "Pods in namespace $NAMESPACE:"
    kubectl get pods -n "$NAMESPACE"

    echo ""
    log_info "Services in namespace $NAMESPACE:"
    kubectl get services -n "$NAMESPACE"

    echo ""
    log_info "Ingress in namespace $NAMESPACE:"
    kubectl get ingress -n "$NAMESPACE"
}

# Uninstall release
uninstall_release() {
    log_info "Uninstalling Helm release: $RELEASE_NAME"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would uninstall release $RELEASE_NAME"
        return
    fi

    if helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE"; then
        log_success "Helm release $RELEASE_NAME uninstalled successfully"
    else
        log_error "Failed to uninstall Helm release $RELEASE_NAME"
        exit 1
    fi

    # Ask if user wants to remove namespace
    echo ""
    read -p "Do you want to remove namespace $NAMESPACE? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete namespace "$NAMESPACE"
        log_success "Namespace $NAMESPACE removed"
    fi
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would validate deployment"
        return
    fi

    # Wait for pods to be ready
    log_info "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l "app.kubernetes.io/instance=$RELEASE_NAME" -n "$NAMESPACE" --timeout=300s

    # Check pod status
    local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" --field-selector=status.phase=Running --no-headers | wc -l)
    local total_pods=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" --no-headers | wc -l)

    if [[ "$ready_pods" -eq "$total_pods" ]]; then
        log_success "All pods are running ($ready_pods/$total_pods)"
    else
        log_warning "Some pods are not ready ($ready_pods/$total_pods)"
        kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME"
    fi

    # Check services
    log_info "Checking services..."
    kubectl get services -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME"

    # Check ingress
    log_info "Checking ingress..."
    kubectl get ingress -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME"

    log_success "Deployment validation completed"
}

# Show access information
show_access_info() {
    log_info "Access Information:"

    # Get ingress URLs
    local ingress_urls=$(kubectl get ingress -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o jsonpath='{.items[*].spec.rules[*].host}')
    
    if [[ -n "$ingress_urls" ]]; then
        echo ""
        log_info "Ingress URLs:"
        for url in $ingress_urls; do
            echo "  - https://$url"
        done
    fi

    # Show Grafana access
    local grafana_url=$(kubectl get ingress -n "$NAMESPACE" -l "app=grafana" -o jsonpath='{.items[*].spec.rules[*].host}' 2>/dev/null || echo "")
    if [[ -n "$grafana_url" ]]; then
        echo ""
        log_info "Grafana Dashboard:"
        echo "  - https://$grafana_url"
        echo "  - Username: admin"
        echo "  - Password: Check your values file or secrets"
    fi

    # Show port forwarding commands
    echo ""
    log_info "Port Forwarding Commands:"
    echo "  - Frontend: kubectl port-forward -n $NAMESPACE svc/frontend-service 3000:3000"
    echo "  - Backend: kubectl port-forward -n $NAMESPACE svc/backend-service 3001:3001"
    echo "  - Blockchain: kubectl port-forward -n $NAMESPACE svc/blockchain-service 8545:8545"
    echo "  - Grafana: kubectl port-forward -n $NAMESPACE svc/kaldrix-grafana 3000:80"

    echo ""
    log_info "Useful Commands:"
    echo "  - View pods: kubectl get pods -n $NAMESPACE"
    echo "  - View logs: kubectl logs -f <pod-name> -n $NAMESPACE"
    echo "  - Describe pod: kubectl describe pod <pod-name> -n $NAMESPACE"
    echo "  - Exec into pod: kubectl exec -it <pod-name> -n $NAMESPACE -- /bin/bash"
}

# Main function
main() {
    # Parse command line arguments
    parse_args "$@"

    # Show banner
    echo ""
    echo "=========================================="
    echo "  KALDRIX Helm Chart Deployment Script    "
    echo "=========================================="
    echo ""
    echo "Release: $RELEASE_NAME"
    echo "Namespace: $NAMESPACE"
    echo "Environment: $ENVIRONMENT"
    echo "Values: $VALUES_FILE"
    echo ""

    # Check prerequisites
    check_prerequisites

    # Execute requested action
    if [[ "$STATUS" == "true" ]]; then
        show_status
    elif [[ "$UNINSTALL" == "true" ]]; then
        uninstall_release
    else
        create_namespace
        deploy_helm_release
        
        if [[ "$DRY_RUN" != "true" ]]; then
            validate_deployment
            show_access_info
        fi
    fi

    log_success "Script completed successfully"
}

# Run main function
main "$@"