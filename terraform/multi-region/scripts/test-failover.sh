#!/bin/bash

# KALDRIX Multi-Region Failover Testing Script
# This script tests the failover capabilities of the multi-region deployment

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

This script tests the failover capabilities of the KALDRIX multi-region deployment.

OPTIONS:
    -e, --environment ENV     Environment to test (production, staging, development)
    -d, --domain DOMAIN       Domain name for the application
    -t, --test-type TYPE      Test type: simulation, real, rollback
    -r, --region REGION       Specific region to test (optional)
    -h, --help               Show this help message

TEST TYPES:
    simulation               Simulate failover without actual disruption
    real                     Perform real failover test (causes disruption)
    rollback                 Rollback to primary region

EXAMPLES:
    $0 -e staging -t simulation
    $0 -e production -t real -r us-west-2
    $0 -e staging -t rollback

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

# Function to validate test type
validate_test_type() {
    local test_type="$1"
    case "$test_type" in
        simulation|real|rollback)
            return 0
            ;;
        *)
            log_error "Invalid test type: $test_type. Must be one of: simulation, real, rollback"
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
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to get deployment information
get_deployment_info() {
    local env="$1"
    
    log_info "Getting deployment information..."
    
    cd "$MULTI_REGION_DIR"
    
    # Check if Terraform state exists
    if [[ ! -f "terraform.tfstate" ]]; then
        log_error "No Terraform state found. Please run deployment first."
        exit 1
    fi
    
    # Get deployment outputs
    local outputs=$(terraform output -json)
    
    # Extract key information
    local regions=$(echo "$outputs" | jq -r '.global_infrastructure.value.regions | keys[]')
    local primary_region=$(echo "$outputs" | jq -r '.global_infrastructure.value.regions | to_entries | map(select(.value.is_primary)) | .[0].key')
    local secondary_regions=$(echo "$outputs" | jq -r '.global_infrastructure.value.regions | to_entries | map(select(.value.is_primary | not)) | .[].key')
    local alb_dns=$(echo "$outputs" | jq -r '.global_infrastructure.value.load_balancing.global_alb_dns')
    local failover_url="failover.$DOMAIN_NAME"
    
    # Store in global variables
    REGIONS_LIST="$regions"
    PRIMARY_REGION="$primary_region"
    SECONDARY_REGIONS="$secondary_regions"
    ALB_DNS="$alb_dns"
    FAILOVER_URL="$failover_url"
    
    log_info "Deployment information:"
    log_info "  - Primary region: $primary_region"
    log_info "  - Secondary regions: $secondary_regions"
    log_info "  - Global ALB DNS: $alb_dns"
    log_info "  - Failover URL: $failover_url"
}

# Function to test current health
test_current_health() {
    log_info "Testing current health status..."
    
    local healthy_regions=()
    local unhealthy_regions=()
    
    # Test all regions
    for region in $REGIONS_LIST; do
        local endpoint="https://${region}.${DOMAIN_NAME}/health"
        
        if curl -s -f "$endpoint" | jq -e '.status == "healthy"' > /dev/null; then
            healthy_regions+=("$region")
            log_success "  - $region: Healthy"
        else
            unhealthy_regions+=("$region")
            log_error "  - $region: Unhealthy"
        fi
    done
    
    # Test failover URL
    if curl -s -f "https://${FAILOVER_URL}" | jq -e '.status == "healthy"' > /dev/null; then
        log_success "  - Failover URL: Healthy"
    else
        log_error "  - Failover URL: Unhealthy"
    fi
    
    # Test global ALB
    if curl -s -f "https://${ALB_DNS}/health" | jq -e '.status == "healthy"' > /dev/null; then
        log_success "  - Global ALB: Healthy"
    else
        log_error "  - Global ALB: Unhealthy"
    fi
    
    # Store results
    HEALTHY_REGIONS="${healthy_regions[@]}"
    UNHEALTHY_REGIONS="${unhealthy_regions[@]}"
    
    if [[ ${#unhealthy_regions[@]} -gt 0 ]]; then
        log_warning "Some regions are unhealthy"
    else
        log_success "All regions are healthy"
    fi
}

# Function to simulate failover
simulate_failover() {
    local target_region="$1"
    
    log_info "Simulating failover to $target_region..."
    
    # Get current DNS records
    local current_dns=$(dig +short "$FAILOVER_URL" | head -1)
    log_info "  - Current DNS: $current_dns"
    
    # Simulate by scaling down primary region
    if [[ "$target_region" != "$PRIMARY_REGION" ]]; then
        log_info "  - Simulating primary region failure..."
        
        # Scale down primary region deployments (simulation only)
        kubectl config use-context "kaldrix-$PRIMARY_REGION"
        
        # Get current replica counts
        local current_replicas=$(kubectl get deployment -n kaldrix -o jsonpath='{.items[*].spec.replicas}' | tr ' ' '\n' | sort -u | head -1)
        
        if [[ -n "$current_replicas" && "$current_replicas" != "0" ]]; then
            log_info "  - Current replicas in primary: $current_replicas"
            log_info "  - (Simulation: Would scale down to 0)"
        fi
        
        # Test failover URL response
        log_info "  - Testing failover response..."
        local failover_response=$(curl -s -w "HTTP Status: %{http_code}\n" "https://${FAILOVER_URL}" -o /dev/null)
        log_info "  - Failover response: $failover_response"
        
        # Check if DNS updated
        sleep 30
        local new_dns=$(dig +short "$FAILOVER_URL" | head -1)
        if [[ "$new_dns" != "$current_dns" ]]; then
            log_success "  - DNS updated: $new_dns"
        else
            log_warning "  - DNS not updated (still: $current_dns)"
        fi
    else
        log_info "  - Simulating rollback to primary region..."
        
        # Test primary region health
        local primary_endpoint="https://${PRIMARY_REGION}.${DOMAIN_NAME}/health"
        if curl -s -f "$primary_endpoint" | jq -e '.status == "healthy"' > /dev/null; then
            log_success "  - Primary region is healthy"
        else
            log_error "  - Primary region is not healthy"
        fi
    fi
    
    log_success "Failover simulation completed"
}

# Function to perform real failover
perform_real_failover() {
    local target_region="$1"
    
    log_warning "PERFORMING REAL FAILOVER - THIS WILL CAUSE DISRUPTION"
    log_info "Target region: $target_region"
    
    # Confirm action
    read -p "Are you sure you want to proceed? (type 'yes' to confirm): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Real failover cancelled"
        return 0
    fi
    
    # Get current health status
    test_current_health
    
    # Scale down primary region if failing over to secondary
    if [[ "$target_region" != "$PRIMARY_REGION" ]]; then
        log_info "Scaling down primary region..."
        
        kubectl config use-context "kaldrix-$PRIMARY_REGION"
        
        # Scale down deployments
        kubectl scale deployment --all -n kaldrix --replicas=0
        
        # Wait for scale down
        log_info "Waiting for scale down to complete..."
        sleep 60
        
        # Verify scale down
        local remaining_pods=$(kubectl get pods -n kaldrix --no-headers | wc -l)
        if [[ "$remaining_pods" -eq 0 ]]; then
            log_success "Primary region scaled down successfully"
        else
            log_error "Primary region scale down failed: $remaining_pods pods remaining"
        fi
    fi
    
    # Scale up target region
    log_info "Scaling up target region: $target_region"
    
    kubectl config use-context "kaldrix-$target_region"
    
    # Scale up deployments
    kubectl scale deployment --all -n kaldrix --replicas=3
    
    # Wait for scale up
    log_info "Waiting for scale up to complete..."
    sleep 120
    
    # Verify scale up
    local ready_pods=$(kubectl get pods -n kaldrix --field-selector=status.phase=Running --no-headers | wc -l)
    if [[ "$ready_pods" -ge 3 ]]; then
        log_success "Target region scaled up successfully"
    else
        log_error "Target region scale up failed: $ready_pods pods ready"
    fi
    
    # Test failover URL
    log_info "Testing failover URL..."
    local failover_test_result=$(curl -s -f "https://${FAILOVER_URL}" | jq -e '.status == "healthy"' > /dev/null && echo "success" || echo "failed")
    
    if [[ "$failover_test_result" == "success" ]]; then
        log_success "Failover URL is responding correctly"
    else
        log_error "Failover URL is not responding correctly"
    fi
    
    log_success "Real failover completed"
}

# Function to rollback to primary region
rollback_to_primary() {
    log_info "Rolling back to primary region: $PRIMARY_REGION"
    
    # Confirm action
    read -p "Are you sure you want to rollback? (type 'yes' to confirm): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Rollback cancelled"
        return 0
    fi
    
    # Scale up primary region
    log_info "Scaling up primary region..."
    
    kubectl config use-context "kaldrix-$PRIMARY_REGION"
    
    # Scale up deployments
    kubectl scale deployment --all -n kaldrix --replicas=3
    
    # Wait for scale up
    log_info "Waiting for scale up to complete..."
    sleep 120
    
    # Verify scale up
    local ready_pods=$(kubectl get pods -n kaldrix --field-selector=status.phase=Running --no-headers | wc -l)
    if [[ "$ready_pods" -ge 3 ]]; then
        log_success "Primary region scaled up successfully"
    else
        log_error "Primary region scale up failed: $ready_pods pods ready"
    fi
    
    # Scale down secondary regions
    for region in $SECONDARY_REGIONS; do
        log_info "Scaling down secondary region: $region"
        
        kubectl config use-context "kaldrix-$region"
        
        # Scale down deployments
        kubectl scale deployment --all -n kaldrix --replicas=0
        
        # Wait for scale down
        sleep 60
        
        # Verify scale down
        local remaining_pods=$(kubectl get pods -n kaldrix --no-headers | wc -l)
        if [[ "$remaining_pods" -eq 0 ]]; then
            log_success "Secondary region $region scaled down successfully"
        else
            log_error "Secondary region $region scale down failed: $remaining_pods pods remaining"
        fi
    done
    
    # Test primary region
    log_info "Testing primary region..."
    local primary_test_result=$(curl -s -f "https://${PRIMARY_REGION}.${DOMAIN_NAME}/health" | jq -e '.status == "healthy"' > /dev/null && echo "success" || echo "failed")
    
    if [[ "$primary_test_result" == "success" ]]; then
        log_success "Primary region is responding correctly"
    else
        log_error "Primary region is not responding correctly"
    fi
    
    log_success "Rollback to primary completed"
}

# Function to generate test report
generate_test_report() {
    local test_type="$1"
    local target_region="$2"
    
    log_info "Generating test report..."
    
    local report_file="$PROJECT_DIR/failover-test-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "test": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "type": "$test_type",
    "target_region": "$target_region",
    "environment": "$ENVIRONMENT"
  },
  "deployment": {
    "primary_region": "$PRIMARY_REGION",
    "secondary_regions": ["${SECONDARY_REGIONS// /\",\"}"],
    "all_regions": ["${REGIONS_LIST// /\",\"}"]
  },
  "health_status": {
    "healthy_regions": ["${HEALTHY_REGIONS// /\",\"}"],
    "unhealthy_regions": ["${UNHEALTHY_REGIONS// /\",\"}"]
  },
  "results": {
    "status": "completed",
    "failover_url": "$FAILOVER_URL",
    "global_alb": "$ALB_DNS"
  }
}
EOF
    
    log_success "Test report generated: $report_file"
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
            -d|--domain)
                DOMAIN_NAME="$2"
                shift 2
                ;;
            -t|--test-type)
                TEST_TYPE="$2"
                shift 2
                ;;
            -r|--region)
                TARGET_REGION="$2"
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
    ENVIRONMENT="${ENVIRONMENT:-staging}"
    DOMAIN_NAME="${DOMAIN_NAME:-kaldrix.local}"
    TEST_TYPE="${TEST_TYPE:-simulation}"
    TARGET_REGION="${TARGET_REGION:-}"
    
    # Validate inputs
    validate_environment "$ENVIRONMENT"
    validate_test_type "$TEST_TYPE"
    
    # Check prerequisites
    check_prerequisites
    
    # Get deployment information
    get_deployment_info "$ENVIRONMENT"
    
    # Set target region if not specified
    if [[ -z "$TARGET_REGION" ]]; then
        if [[ "$TEST_TYPE" == "rollback" ]]; then
            TARGET_REGION="$PRIMARY_REGION"
        else
            # Pick first secondary region
            TARGET_REGION=$(echo "$SECONDARY_REGIONS" | head -1)
        fi
    fi
    
    # Validate target region
    if [[ ! " $REGIONS_LIST " =~ " $TARGET_REGION " ]]; then
        log_error "Invalid target region: $TARGET_REGION"
        exit 1
    fi
    
    # Display test information
    log_info "Starting KALDRIX failover test..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Test type: $TEST_TYPE"
    log_info "Target region: $TARGET_REGION"
    log_info "Domain: $DOMAIN_NAME"
    
    # Test current health
    test_current_health
    
    # Perform test based on type
    case "$TEST_TYPE" in
        simulation)
            simulate_failover "$TARGET_REGION"
            ;;
        real)
            perform_real_failover "$TARGET_REGION"
            ;;
        rollback)
            rollback_to_primary
            ;;
    esac
    
    # Test final health status
    test_current_health
    
    # Generate test report
    generate_test_report "$TEST_TYPE" "$TARGET_REGION"
    
    log_success "KALDRIX failover test completed successfully!"
}

# Run main function
main "$@"