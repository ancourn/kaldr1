#!/bin/bash

# KALDRIX Multi-Region Destruction Script
# This script destroys KALDRIX infrastructure across multiple AWS regions

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$PROJECT_DIR/terraform"
MULTI_REGION_DIR="$TERRAFORM_DIR/multi-region"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

This script destroys KALDRIX infrastructure across multiple AWS regions.

OPTIONS:
    -e, --environment ENV     Environment to destroy (production, staging, development)
    -f, --force              Force destruction without confirmation
    -h, --help               Show this help message

EXAMPLES:
    $0 -e production
    $0 -e staging -f
    $0 -e development

EOF
}

# Function to validate environment
validate_environment() {
    local env="$1"
    case "$env" in
        production|staging|development)
            return 0
            ;;
        *)
            log_error "Invalid environment: $env. Must be one of: production, staging, development"
            exit 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to confirm destruction
confirm_destruction() {
    local env="$1"
    
    if [[ "$FORCE" == "true" ]]; then
        return 0
    fi
    
    echo "WARNING: This will destroy all KALDRIX infrastructure for the '$env' environment."
    echo "This action cannot be undone!"
    echo ""
    echo "Resources to be destroyed:"
    echo "  - EKS clusters in all regions"
    echo "  - RDS databases and Redis clusters"
    echo "  - Load balancers and networking"
    echo "  - S3 buckets and ECR repositories"
    echo "  - CloudWatch dashboards and alarms"
    echo "  - Route53 DNS records"
    echo "  - All other infrastructure"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        log_info "Destruction cancelled"
        exit 0
    fi
}

# Function to destroy Helm releases
destroy_helm_releases() {
    local env="$1"
    
    log_info "Destroying Helm releases..."
    
    # Check if we have Terraform state
    if [[ ! -f "$MULTI_REGION_DIR/terraform.tfstate" ]]; then
        log_warning "No Terraform state found, skipping Helm destruction"
        return 0
    fi
    
    cd "$MULTI_REGION_DIR"
    
    # Get deployment outputs
    local outputs=$(terraform output -json 2>/dev/null || echo "")
    
    if [[ -z "$outputs" ]]; then
        log_warning "No deployment outputs found, skipping Helm destruction"
        return 0
    fi
    
    # Get regions
    local regions=$(echo "$outputs" | jq -r '.global_infrastructure.value.regions | keys[]' 2>/dev/null || echo "")
    
    if [[ -z "$regions" ]]; then
        log_warning "No regions found in deployment, skipping Helm destruction"
        return 0
    fi
    
    for region in $regions; do
        log_info "Destroying Helm releases in $region..."
        
        # Check if kubectl context exists
        if kubectl config get-contexts "kaldrix-$region" >/dev/null 2>&1; then
            # Switch to region context
            kubectl config use-context "kaldrix-$region"
            
            # Uninstall KALDRIX Helm chart
            if helm uninstall kaldrix --namespace kaldrix 2>/dev/null; then
                log_success "  - Helm releases destroyed in $region"
            else
                log_warning "  - No Helm releases found in $region"
            fi
            
            # Delete namespace
            if kubectl delete namespace kaldrix --ignore-not-found=true; then
                log_success "  - Namespace deleted in $region"
            fi
        else
            log_warning "  - kubectl context not found for $region"
        fi
    done
    
    log_success "Helm releases destruction completed"
}

# Function to destroy Terraform infrastructure
destroy_terraform() {
    log_info "Destroying Terraform infrastructure..."
    
    cd "$MULTI_REGION_DIR"
    
    # Initialize Terraform if needed
    if [[ ! -d ".terraform" ]]; then
        log_info "Initializing Terraform..."
        terraform init -upgrade
    fi
    
    # Destroy infrastructure
    if terraform destroy -auto-approve; then
        log_success "Terraform infrastructure destroyed successfully"
    else
        log_error "Terraform destroy failed"
        exit 1
    fi
    
    # Clean up files
    rm -f terraform.tfvars tfplan
    rm -rf .terraform
    
    log_success "Terraform cleanup completed"
}

# Function to clean up local resources
cleanup_local_resources() {
    log_info "Cleaning up local resources..."
    
    # Remove kubeconfig contexts
    local contexts=$(kubectl config get-contexts -o name | grep kaldrix || echo "")
    if [[ -n "$contexts" ]]; then
        for context in $contexts; do
            kubectl config delete-context "$context" 2>/dev/null || true
        done
        log_success "  - kubectl contexts removed"
    fi
    
    # Remove deployment reports
    local reports=$(find "$PROJECT_DIR" -name "deployment-multi-region-*.json" -type f)
    if [[ -n "$reports" ]]; then
        for report in $reports; do
            rm -f "$report"
        done
        log_success "  - Deployment reports removed"
    fi
    
    log_success "Local resources cleanup completed"
}

# Function to generate destruction report
generate_destruction_report() {
    local env="$1"
    
    log_info "Generating destruction report..."
    
    local report_file="$PROJECT_DIR/destruction-multi-region-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "destruction": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$env",
    "status": "completed"
  },
  "cleanup": {
    "helm_releases": "destroyed",
    "terraform_infrastructure": "destroyed",
    "local_resources": "cleaned"
  }
}
EOF
    
    log_success "Destruction report generated: $report_file"
}

# Main function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -f|--force)
                FORCE="true"
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Set default values
    ENVIRONMENT="${ENVIRONMENT:-development}"
    FORCE="${FORCE:-false}"
    
    # Validate inputs
    validate_environment "$ENVIRONMENT"
    
    # Check prerequisites
    check_prerequisites
    
    # Display destruction information
    log_info "Starting KALDRIX multi-region destruction..."
    log_info "Environment: $ENVIRONMENT"
    
    # Confirm destruction
    confirm_destruction "$ENVIRONMENT"
    
    # Destroy Helm releases
    destroy_helm_releases "$ENVIRONMENT"
    
    # Destroy Terraform infrastructure
    destroy_terraform
    
    # Clean up local resources
    cleanup_local_resources
    
    # Generate destruction report
    generate_destruction_report "$ENVIRONMENT"
    
    log_success "KALDRIX multi-region destruction completed successfully!"
}

# Run main function
main "$@"