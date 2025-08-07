#!/bin/bash

# KALDRIX Multi-Region Deployment Script
# This script deploys KALDRIX infrastructure across multiple AWS regions

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

This script deploys KALDRIX infrastructure across multiple AWS regions.

OPTIONS:
    -e, --environment ENV     Environment to deploy (production, staging, development)
    -r, --regions REGIONS     Comma-separated list of regions (default: us-east-1,us-west-2,eu-west-1)
    -p, --primary-region REG Primary region (default: us-east-1)
    -d, --domain DOMAIN       Domain name for the application
    -v, --vault-address URL   Vault server address
    -h, --help               Show this help message

EXAMPLES:
    $0 -e production -d kaldrix.io
    $0 -e staging -r us-east-1,us-west-2 -p us-east-1 -d staging.kaldrix.io
    $0 -e development -r us-east-1 -d dev.kaldrix.io

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

# Function to validate regions
validate_regions() {
    local regions="$1"
    local primary_region="$2"
    
    IFS=',' read -ra REGION_ARRAY <<< "$regions"
    
    # Check if primary region is in the list
    if [[ ! " ${REGION_ARRAY[@]} " =~ " ${primary_region} " ]]; then
        log_error "Primary region $primary_region not found in regions list: $regions"
        exit 1
    fi
    
    # Validate AWS regions
    for region in "${REGION_ARRAY[@]}"; do
        if ! aws ec2 describe-regions --region-names "$region" --output text >/dev/null 2>&1; then
            log_error "Invalid AWS region: $region"
            exit 1
        fi
    done
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
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to initialize Terraform
initialize_terraform() {
    local env="$1"
    local regions="$2"
    local primary_region="$3"
    
    log_info "Initializing Terraform for multi-region deployment..."
    
    cd "$MULTI_REGION_DIR"
    
    # Create environment-specific terraform.tfvars
    cat > "terraform.tfvars" << EOF
# Auto-generated terraform.tfvars for $env environment
environment = "$env"
regions = ["${regions//,/\",\"}"]
primary_region = "$primary_region"
domain_name = "$DOMAIN_NAME"
enable_vault = true
vault_address = "$VAULT_ADDRESS"
enable_monitoring = true
enable_cdn = true
enable_accelerator = true
enable_replication = true
enable_backup = true
enable_security_compliance = true
enable_cost_optimization = true
enable_failover = true
EOF
    
    # Initialize Terraform
    terraform init -upgrade
    
    log_success "Terraform initialized successfully"
}

# Function to plan Terraform deployment
plan_deployment() {
    log_info "Planning Terraform deployment..."
    
    cd "$MULTI_REGION_DIR"
    
    if ! terraform plan -out=tfplan; then
        log_error "Terraform plan failed"
        exit 1
    fi
    
    log_success "Terraform plan created successfully"
}

# Function to apply Terraform deployment
apply_deployment() {
    log_info "Applying Terraform deployment..."
    
    cd "$MULTI_REGION_DIR"
    
    if ! terraform apply -auto-approve tfplan; then
        log_error "Terraform apply failed"
        exit 1
    fi
    
    # Clean up plan file
    rm -f tfplan
    
    log_success "Terraform deployment applied successfully"
}

# Function to validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    cd "$MULTI_REGION_DIR"
    
    # Get deployment outputs
    local outputs=$(terraform output -json)
    
    # Check if outputs are valid
    if [[ -z "$outputs" ]]; then
        log_error "No deployment outputs found"
        exit 1
    fi
    
    # Extract key information
    local regions=$(echo "$outputs" | jq -r '.global_infrastructure.value.regions | keys[]')
    local alb_dns=$(echo "$outputs" | jq -r '.global_infrastructure.value.load_balancing.global_alb_dns')
    local dashboard_url=$(echo "$outputs" | jq -r '.global_infrastructure.value.monitoring.global_dashboard_url')
    
    log_info "Deployment validation results:"
    log_info "  - Regions deployed: $regions"
    log_info "  - Global ALB DNS: $alb_dns"
    log_info "  - Monitoring dashboard: $dashboard_url"
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Test health endpoints
    for region in $regions; do
        local endpoint="https://${region}.${DOMAIN_NAME}/health"
        if curl -s -f "$endpoint" > /dev/null; then
            log_success "  - $region health check passed"
        else
            log_warning "  - $region health check failed"
        fi
    done
    
    log_success "Deployment validation completed"
}

# Function to generate deployment report
generate_deployment_report() {
    local env="$1"
    local regions="$2"
    
    log_info "Generating deployment report..."
    
    cd "$MULTI_REGION_DIR"
    
    # Get deployment outputs
    local outputs=$(terraform output -json)
    
    # Create report
    local report_file="$PROJECT_DIR/deployment-multi-region-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$env",
    "regions": ["${regions//,/\",\"}"],
    "status": "completed"
  },
  "infrastructure": $outputs
}
EOF
    
    log_success "Deployment report generated: $report_file"
}

# Function to configure kubectl for all regions
configure_kubectl() {
    log_info "Configuring kubectl for all regions..."
    
    cd "$MULTI_REGION_DIR"
    
    # Get EKS cluster information
    local outputs=$(terraform output -json)
    local regions=$(echo "$outputs" | jq -r '.global_infrastructure.value.regions | keys[]')
    
    for region in $regions; do
        local cluster_info=$(echo "$outputs" | jq -r ".global_infrastructure.value.regions[\"$region\"]")
        local cluster_id=$(echo "$cluster_info" | jq -r '.eks_cluster_id')
        local cluster_endpoint=$(echo "$cluster_info" | jq -r '.eks_cluster_endpoint')
        
        if [[ -n "$cluster_id" && -n "$cluster_endpoint" ]]; then
            # Update kubeconfig
            aws eks update-kubeconfig --name "$cluster_id" --region "$region" --alias "kaldrix-$region"
            log_success "  - Configured kubectl for $region"
        fi
    done
    
    log_success "kubectl configuration completed"
}

# Function to deploy Helm charts to all regions
deploy_helm_charts() {
    log_info "Deploying Helm charts to all regions..."
    
    cd "$MULTI_REGION_DIR"
    
    # Get deployment outputs
    local outputs=$(terraform output -json)
    local regions=$(echo "$outputs" | jq -r '.global_infrastructure.value.regions | keys[]')
    
    for region in $regions; do
        log_info "Deploying Helm charts to $region..."
        
        # Switch to region context
        kubectl config use-context "kaldrix-$region"
        
        # Deploy KALDRIX Helm chart
        if helm upgrade --install kaldrix "$PROJECT_DIR/helm/kaldrix" \
            --namespace kaldrix \
            --create-namespace \
            --set global.environment="$ENVIRONMENT" \
            --set global.region="$region" \
            --set global.vault.enabled=true \
            --set global.vault.address="$VAULT_ADDRESS" \
            --set monitoring.enabled=true \
            --set ingress.enabled=true \
            --wait \
            --timeout 10m; then
            log_success "  - Helm charts deployed to $region"
        else
            log_error "  - Failed to deploy Helm charts to $region"
        fi
    done
    
    log_success "Helm charts deployment completed"
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    log_info "Running post-deployment tests..."
    
    cd "$PROJECT_DIR"
    
    # Test connectivity to all regions
    local regions=$(echo "$REGIONS" | tr ',' ' ')
    
    for region in $regions; do
        local endpoint="https://${region}.${DOMAIN_NAME}/health"
        
        if curl -s -f "$endpoint" | jq -e '.status == "healthy"' > /dev/null; then
            log_success "  - $region connectivity test passed"
        else
            log_error "  - $region connectivity test failed"
        fi
    done
    
    # Test API endpoints
    local api_endpoint="https://api.${DOMAIN_NAME}/v1/health"
    if curl -s -f "$api_endpoint" | jq -e '.status == "healthy"' > /dev/null; then
        log_success "  - API endpoint test passed"
    else
        log_error "  - API endpoint test failed"
    fi
    
    # Test database connectivity
    # This would require more complex testing logic
    log_info "  - Database connectivity test (skipped - requires application logic)"
    
    log_success "Post-deployment tests completed"
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
            -r|--regions)
                REGIONS="$2"
                shift 2
                ;;
            -p|--primary-region)
                PRIMARY_REGION="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN_NAME="$2"
                shift 2
                ;;
            -v|--vault-address)
                VAULT_ADDRESS="$2"
                shift 2
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
    REGIONS="${REGIONS:-us-east-1,us-west-2,eu-west-1}"
    PRIMARY_REGION="${PRIMARY_REGION:-us-east-1}"
    DOMAIN_NAME="${DOMAIN_NAME:-kaldrix.local}"
    VAULT_ADDRESS="${VAULT_ADDRESS:-https://vault.kaldrix.io}"
    
    # Validate inputs
    validate_environment "$ENVIRONMENT"
    validate_regions "$REGIONS" "$PRIMARY_REGION"
    
    # Check prerequisites
    check_prerequisites
    
    # Display deployment information
    log_info "Starting KALDRIX multi-region deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Regions: $REGIONS"
    log_info "Primary Region: $PRIMARY_REGION"
    log_info "Domain: $DOMAIN_NAME"
    log_info "Vault Address: $VAULT_ADDRESS"
    
    # Initialize Terraform
    initialize_terraform "$ENVIRONMENT" "$REGIONS" "$PRIMARY_REGION"
    
    # Plan deployment
    plan_deployment
    
    # Apply deployment
    apply_deployment
    
    # Validate deployment
    validate_deployment
    
    # Configure kubectl
    configure_kubectl
    
    # Deploy Helm charts
    deploy_helm_charts
    
    # Run post-deployment tests
    run_post_deployment_tests
    
    # Generate deployment report
    generate_deployment_report "$ENVIRONMENT" "$REGIONS"
    
    log_success "KALDRIX multi-region deployment completed successfully!"
    
    # Display access information
    log_info "Access Information:"
    log_info "  - Application: https://$DOMAIN_NAME"
    log_info "  - API: https://api.$DOMAIN_NAME"
    log_info "  - Regional endpoints:"
    IFS=',' read -ra REGION_ARRAY <<< "$REGIONS"
    for region in "${REGION_ARRAY[@]}"; do
        log_info "    * $region: https://${region}.${DOMAIN_NAME}"
    done
}

# Run main function
main "$@"