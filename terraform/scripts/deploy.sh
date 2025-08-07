#!/bin/bash

# KALDRIX Terraform Deployment Script
# This script deploys KALDRIX infrastructure using Terraform

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"
ENVIRONMENT="${1:-development}"
AWS_REGION="${2:-us-east-1}"
ACTION="${3:-apply}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Validate environment
validate_environment() {
    log "Validating environment: $ENVIRONMENT"
    
    case "$ENVIRONMENT" in
        production|staging|development)
            log "Environment $ENVIRONMENT is valid"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Must be one of: production, staging, development"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check Terraform version
    TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
    REQUIRED_VERSION="1.5.0"
    if ! printf '%s\n' "$REQUIRED_VERSION" "$TERRAFORM_VERSION" | sort -V -C; then
        warn "Terraform version $TERRAFORM_VERSION is older than required $REQUIRED_VERSION"
    fi
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials are not configured. Please configure them first."
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed. Please install it first."
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        error "helm is not installed. Please install it first."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install it first."
        exit 1
    fi
    
    log "Prerequisites check completed"
}

# Initialize Terraform
initialize_terraform() {
    log "Initializing Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    terraform init \
        -reconfigure \
        -backend-config="bucket=kaldrix-${ENVIRONMENT}-terraform-state" \
        -backend-config="key=kaldrix-${ENVIRONMENT}/terraform.tfstate" \
        -backend-config="region=$AWS_REGION" \
        -backend-config="dynamodb_table=kaldrix-${ENVIRONMENT}-terraform-lock"
    
    log "Terraform initialized successfully"
}

# Select workspace
select_workspace() {
    log "Selecting Terraform workspace: $ENVIRONMENT"
    
    cd "$TERRAFORM_DIR"
    
    # Create workspace if it doesn't exist
    if ! terraform workspace list | grep -q "$ENVIRONMENT"; then
        terraform workspace new "$ENVIRONMENT"
    fi
    
    # Select workspace
    terraform workspace select "$ENVIRONMENT"
    
    log "Workspace $ENVIRONMENT selected"
}

# Plan infrastructure
plan_infrastructure() {
    log "Planning infrastructure for environment: $ENVIRONMENT"
    
    cd "$TERRAFORM_DIR"
    
    # Create plan
    terraform plan \
        -var-file="environments/$ENVIRONMENT/terraform.tfvars" \
        -var="aws_region=$AWS_REGION" \
        -var="vault_token=$VAULT_TOKEN" \
        -out="kaldrix-$ENVIRONMENT.plan"
    
    log "Infrastructure plan created: kaldrix-$ENVIRONMENT.plan"
}

# Apply infrastructure
apply_infrastructure() {
    log "Applying infrastructure for environment: $ENVIRONMENT"
    
    cd "$TERRAFORM_DIR"
    
    # Apply plan
    terraform apply \
        -var-file="environments/$ENVIRONMENT/terraform.tfvars" \
        -var="aws_region=$AWS_REGION" \
        -var="vault_token=$VAULT_TOKEN" \
        "kaldrix-$ENVIRONMENT.plan"
    
    log "Infrastructure applied successfully"
}

# Destroy infrastructure
destroy_infrastructure() {
    warn "WARNING: This will destroy all infrastructure for environment: $ENVIRONMENT"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Destruction cancelled"
        exit 0
    fi
    
    log "Destroying infrastructure for environment: $ENVIRONMENT"
    
    cd "$TERRAFORM_DIR"
    
    # Destroy infrastructure
    terraform destroy \
        -var-file="environments/$ENVIRONMENT/terraform.tfvars" \
        -var="aws_region=$AWS_REGION" \
        -var="vault_token=$VAULT_TOKEN" \
        -auto-approve
    
    log "Infrastructure destroyed successfully"
}

# Generate outputs
generate_outputs() {
    log "Generating infrastructure outputs..."
    
    cd "$TERRAFORM_DIR"
    
    # Generate outputs
    terraform output -json > "$TERRAFORM_DIR/outputs-$ENVIRONMENT.json"
    
    # Create human-readable outputs
    terraform output > "$TERRAFORM_DIR/outputs-$ENVIRONMENT.txt"
    
    log "Outputs generated:"
    cat "$TERRAFORM_DIR/outputs-$ENVIRONMENT.txt"
}

# Configure kubectl
configure_kubectl() {
    log "Configuring kubectl..."
    
    cd "$TERRAFORM_DIR"
    
    # Get kubeconfig
    aws eks update-kubeconfig \
        --region "$AWS_REGION" \
        --name "$(terraform output -raw eks_cluster_id)"
    
    # Test connectivity
    kubectl cluster-info
    
    log "kubectl configured successfully"
}

# Deploy application
deploy_application() {
    log "Deploying KALDRIX application..."
    
    cd "$TERRAFORM_DIR"
    
    # Wait for cluster to be ready
    kubectl wait --for=condition=ready nodes --all --timeout=300s
    
    # Deploy application using Helm
    helm upgrade --install kaldrix ./helm/kaldrix \
        --namespace kaldrix \
        --create-namespace \
        -f "./helm/kaldrix/values-$ENVIRONMENT.yaml" \
        --wait \
        --timeout=600s
    
    log "Application deployed successfully"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    cd "$TERRAFORM_DIR"
    
    # Check pod status
    kubectl get pods -n kaldrix
    
    # Check deployment status
    kubectl get deployments -n kaldrix
    
    # Check service status
    kubectl get services -n kaldrix
    
    # Check ingress status
    kubectl get ingress -n kaldrix
    
    # Run health checks
    kubectl exec -it deployment/kaldrix-backend -n kaldrix -- curl -f http://localhost:8000/health || exit 1
    kubectl exec -it deployment/kaldrix-frontend -n kaldrix -- curl -f http://localhost:3000/health || exit 1
    
    log "Deployment verification completed successfully"
}

# Generate documentation
generate_documentation() {
    log "Generating deployment documentation..."
    
    cd "$TERRAFORM_DIR"
    
    # Create deployment report
    cat > "deployment-report-$ENVIRONMENT.md" << EOF
# KALDRIX Deployment Report - $ENVIRONMENT

## Deployment Information
- **Environment**: $ENVIRONMENT
- **AWS Region**: $AWS_REGION
- **Deployment Date**: $(date)
- **Deployed By**: $(whoami)

## Infrastructure Components

### VPC
- **VPC ID**: $(terraform output -raw vpc_id)
- **VPC CIDR**: $(terraform output -raw vpc_cidr_block)
- **Private Subnets**: $(terraform output -json private_subnets | jq -r '.[]')
- **Public Subnets**: $(terraform output -json public_subnets | jq -r '.[]')
- **Database Subnets**: $(terraform output -json database_subnets | jq -r '.[]')

### EKS Cluster
- **Cluster ID**: $(terraform output -raw eks_cluster_id)
- **Cluster Endpoint**: $(terraform output -raw eks_cluster_endpoint)
- **Cluster Version**: $(terraform output -json eks_cluster_version | jq -r '.')
- **Node Groups**: $(terraform output -json node_group_arns | jq -r 'keys[]')

### Database
- **Database ID**: $(terraform output -raw db_instance_id)
- **Database Endpoint**: $(terraform output -raw db_instance_endpoint)
- **Database Port**: $(terraform output -raw db_instance_port)
- **Database Name**: $(terraform output -raw db_instance_name)

### Redis
- **Redis Cluster ID**: $(terraform output -raw redis_cluster_id)
- **Redis Endpoint**: $(terraform output -raw redis_cluster_endpoint)
- **Redis Port**: $(terraform output -raw redis_cluster_port)

### Storage
- **S3 Bucket**: $(terraform output -raw s3_bucket_name)
- **S3 Bucket ARN**: $(terraform output -raw s3_bucket_arn)

### Monitoring
- **CloudWatch Workspace**: $(terraform output -raw monitoring_workspace_id)
- **Prometheus Workspace**: $(terraform output -raw prometheus_workspace_id)
- **Grafana Workspace**: $(terraform output -raw grafana_workspace_id)

### Networking
- **ALB DNS Name**: $(terraform output -raw alb_dns_name)
- **ALB Zone ID**: $(terraform output -raw alb_zone_id)

## Access Information

### Kubernetes
- **Kubeconfig**: ~/.kube/config
- **Namespace**: kaldrix
- **Context**: $(kubectl config current-context)

### Application URLs
- **Frontend**: https://$(terraform output -raw alb_dns_name)
- **Backend API**: https://api.$(terraform output -raw alb_dns_name)
- **Grafana**: https://grafana.$(terraform output -raw alb_dns_name)

### Monitoring
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **Prometheus**: https://prometheus.$(terraform output -raw alb_dns_name)
- **Grafana**: https://grafana.$(terraform output -raw alb_dns_name)

## Security Information

### Vault
- **Vault Address**: $(terraform output -raw vault_address)
- **Vault Secrets Path**: kaldrix/$ENVIRONMENT/

### IAM Roles
- **EKS Cluster Role**: $(terraform output -raw eks_role_arn)
- **Node Group Roles**: $(terraform output -json node_group_role_arns | jq -r '.[]')

## Cost Information

### Estimated Monthly Costs
- **EKS Cluster**: ~$300-500
- **Database**: ~$200-400
- **Redis**: ~$100-200
- **Storage**: ~$50-100
- **Monitoring**: ~$50-100
- **Total Estimated**: ~$700-1300

## Next Steps

1. **Verify Application Health**: Check application endpoints and services
2. **Configure Monitoring**: Set up alerts and dashboards
3. **Test Backup and Recovery**: Verify backup processes
4. **Update DNS**: Update DNS records for custom domains
5. **Configure SSL**: Install SSL certificates
6. **Set Up CI/CD**: Configure deployment pipelines

## Troubleshooting

### Common Issues
1. **Pods not starting**: Check resource limits and node capacity
2. **Database connection issues**: Verify security groups and network policies
3. **Load balancer issues**: Check target groups and health checks
4. **DNS resolution issues**: Verify Route53 configuration

### Support
- **AWS Console**: https://console.aws.amazon.com/
- **Kubernetes Dashboard**: kubectl proxy
- **Grafana Dashboard**: https://grafana.$(terraform output -raw alb_dns_name)
- **Logs**: CloudWatch Logs

## Backup and Recovery

### Automated Backups
- **Database**: Daily snapshots with 30-day retention
- **Redis**: Daily snapshots with 7-day retention
- **S3**: Versioning and lifecycle policies

### Recovery Procedures
1. **Database**: Restore from RDS snapshot
2. **Redis**: Restore from ElastiCache snapshot
3. **Kubernetes**: Restore from etcd backup
4. **S3**: Restore from versioned objects

---
*Generated on $(date)*
EOF

    log "Documentation generated: deployment-report-$ENVIRONMENT.md"
}

# Main deployment function
deploy() {
    log "Starting KALDRIX deployment for environment: $ENVIRONMENT"
    
    validate_environment
    check_prerequisites
    initialize_terraform
    select_workspace
    
    case "$ACTION" in
        "plan")
            plan_infrastructure
            ;;
        "apply")
            plan_infrastructure
            apply_infrastructure
            generate_outputs
            configure_kubectl
            deploy_application
            verify_deployment
            generate_documentation
            ;;
        "destroy")
            destroy_infrastructure
            ;;
        "outputs")
            generate_outputs
            ;;
        "docs")
            generate_documentation
            ;;
        *)
            error "Invalid action: $ACTION. Must be one of: plan, apply, destroy, outputs, docs"
            exit 1
            ;;
    esac
    
    log "KALDRIX deployment completed successfully for environment: $ENVIRONMENT"
}

# Show help
show_help() {
    cat << EOF
KALDRIX Terraform Deployment Script

Usage: $0 <environment> [region] [action]

Arguments:
  environment    Environment to deploy (production, staging, development)
  region         AWS region (default: us-east-1)
  action         Action to perform (default: apply)
                 - plan: Generate execution plan
                 - apply: Apply infrastructure changes
                 - destroy: Destroy infrastructure
                 - outputs: Generate outputs
                 - docs: Generate documentation

Environment Variables:
  VAULT_TOKEN    Vault authentication token
  AWS_ACCESS_KEY_ID     AWS access key ID
  AWS_SECRET_ACCESS_KEY AWS secret access key
  AWS_SESSION_TOKEN     AWS session token (optional)

Examples:
  $0 production us-east-1 apply
  $0 staging us-east-1 plan
  $0 development us-east-1 destroy
  $0 production us-east-1 outputs
  $0 staging us-east-1 docs

Prerequisites:
  - Terraform >= 1.5.0
  - AWS CLI
  - kubectl
  - helm
  - jq
  - AWS credentials configured

For more information, see the documentation in docs/ directory.
EOF
}

# Parse command line arguments
if [[ $# -lt 1 ]]; then
    show_help
    exit 1
fi

# Main execution
deploy "$@"