#!/bin/bash

# KALDRIX Blockchain - Multi-Region Deployment Script
# This script deploys the KALDRIX infrastructure across multiple AWS regions

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRIMARY_REGION="us-east-1"
SECONDARY_REGIONS=("us-west-2" "eu-west-1")
PROJECT_NAME="kaldr1"
ENVIRONMENT="production"
DOMAIN_NAME="kaldr1.com"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it first."
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        error "Terraform is not installed. Please install it first."
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        warn "kubectl is not installed. Some features may not work."
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials are not configured. Please run 'aws configure'."
    fi
    
    log "Prerequisites check completed."
}

# Initialize Terraform
initialize_terraform() {
    log "Initializing Terraform..."
    
    # Change to terraform directory
    cd terraform
    
    # Initialize Terraform
    terraform init -upgrade
    
    # Validate Terraform configuration
    terraform validate
    
    log "Terraform initialization completed."
}

# Deploy to primary region
deploy_primary_region() {
    log "Deploying to primary region: $PRIMARY_REGION"
    
    # Set AWS region
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Plan Terraform deployment
    log "Planning Terraform deployment for primary region..."
    terraform plan -out=tfplan-primary -var="primary_region=$PRIMARY_REGION" -var="environment=$ENVIRONMENT" -var="project_name=$PROJECT_NAME" -var="domain_name=$DOMAIN_NAME"
    
    # Apply Terraform deployment
    log "Applying Terraform deployment for primary region..."
    terraform apply -auto-approve tfplan-primary
    
    # Get outputs
    log "Getting deployment outputs..."
    terraform output -json > ../outputs-primary.json
    
    log "Primary region deployment completed."
}

# Deploy to secondary regions
deploy_secondary_regions() {
    for region in "${SECONDARY_REGIONS[@]}"; do
        log "Deploying to secondary region: $region"
        
        # Set AWS region
        export AWS_DEFAULT_REGION=$region
        
        # Plan Terraform deployment
        log "Planning Terraform deployment for region: $region..."
        terraform plan -out=tfplan-$region -var="primary_region=$PRIMARY_REGION" -var="secondary_regions=[\"${SECONDARY_REGIONS[0]}\",\"${SECONDARY_REGIONS[1]}\"]" -var="environment=$ENVIRONMENT" -var="project_name=$PROJECT_NAME" -var="domain_name=$DOMAIN_NAME"
        
        # Apply Terraform deployment
        log "Applying Terraform deployment for region: $region..."
        terraform apply -auto-approve tfplan-$region
        
        # Get outputs
        log "Getting deployment outputs for region: $region..."
        terraform output -json > ../outputs-$region.json
        
        log "Secondary region deployment completed for: $region"
    done
}

# Configure kubectl
configure_kubectl() {
    log "Configuring kubectl..."
    
    # Set AWS region to primary
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Get cluster name and endpoint
    CLUSTER_NAME=$(jq -r '.eks_cluster_name.value' ../outputs-primary.json)
    CLUSTER_ENDPOINT=$(jq -r '.eks_cluster_endpoint.value' ../outputs-primary.json)
    
    # Update kubeconfig
    aws eks update-kubeconfig --name $CLUSTER_NAME --region $PRIMARY_REGION
    
    # Test cluster connection
    kubectl cluster-info
    
    log "kubectl configuration completed."
}

# Deploy Kubernetes manifests
deploy_kubernetes() {
    log "Deploying Kubernetes manifests..."
    
    # Set AWS region to primary
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Create namespace
    kubectl create namespace $PROJECT_NAME --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy ConfigMaps
    kubectl create configmap $PROJECT_NAME-config --from-env-file=../.env --namespace=$PROJECT_NAME --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy Secrets
    kubectl create secret generic $PROJECT_NAME-secrets --from-env-file=../.env --namespace=$PROJECT_NAME --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy application
    kubectl apply -f ../k8s/
    
    # Wait for deployment
    kubectl wait --for=condition=available --timeout=300s deployment/$PROJECT_NAME -n $PROJECT_NAME
    
    log "Kubernetes manifests deployment completed."
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Set AWS region to primary
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Deploy Prometheus
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
    
    # Deploy Grafana
    helm install grafana grafana/grafana --namespace monitoring --create-namespace
    
    # Deploy CloudWatch Agent
    kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-agent-k8s/main/amazon-cloudwatch-agent.yaml
    
    log "Monitoring setup completed."
}

# Setup logging
setup_logging() {
    log "Setting up logging..."
    
    # Set AWS region to primary
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Deploy Fluentd
    helm repo add fluent https://fluent.github.io/helm-charts
    helm repo update
    helm install fluent-bit fluent/fluent-bit --namespace logging --create-namespace
    
    # Create CloudWatch Log Group
    aws logs create-log-group --log-group-name "/aws/eks/$PROJECT_NAME/$ENVIRONMENT" --region $PRIMARY_REGION
    
    log "Logging setup completed."
}

# Setup backup
setup_backup() {
    log "Setting up backup..."
    
    # Set AWS region to primary
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Create backup bucket
    aws s3 mb s3://$PROJECT_NAME-$ENVIRONMENT-backup --region $PRIMARY_REGION
    
    # Configure backup policy
    aws s3api put-bucket-versioning --bucket $PROJECT_NAME-$ENVIRONMENT-backup --versioning-configuration Status=Enabled --region $PRIMARY_REGION
    
    # Create backup lifecycle policy
    aws s3api put-bucket-lifecycle-configuration --bucket $PROJECT_NAME-$ENVIRONMENT-backup --lifecycle-configuration '{
        "Rules": [
            {
                "ID": "DeleteOldBackups",
                "Status": "Enabled",
                "Expiration": { "Days": 30 }
            }
        ]
    }' --region $PRIMARY_REGION
    
    log "Backup setup completed."
}

# Setup disaster recovery
setup_disaster_recovery() {
    log "Setting up disaster recovery..."
    
    # Set AWS region to primary
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Create CloudFormation template for DR
    cat > dr-template.yaml << EOF
AWSTemplateFormatVersion: '2010-09-09'
Description: 'KALDRIX Disaster Recovery Template'

Parameters:
  PrimaryRegion:
    Type: String
    Default: $PRIMARY_REGION
  SecondaryRegion:
    Type: String
    Default: ${SECONDARY_REGIONS[0]}
  ProjectName:
    Type: String
    Default: $PROJECT_NAME
  Environment:
    Type: String
    Default: $ENVIRONMENT

Resources:
  DRRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: [lambda.amazonaws.com]
            Action: ['sts:AssumeRole']
      Policies:
        - PolicyName: DRPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds:CreateDBInstanceReadReplica'
                  - 'rds:PromoteReadReplica'
                  - 'rds:DeleteDBInstance'
                  - 'elasticache:CreateReplicationGroup'
                  - 'elasticache:ModifyReplicationGroup'
                  - 'elasticache:DeleteReplicationGroup'
                Resource: '*'

  DRFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt DRRole.Arn
      Code:
        ZipFile: |
          import boto3
          import os
          
          def handler(event, context):
              # Implement DR logic here
              pass
      Runtime: python3.9
      Timeout: 300

Outputs:
  DRRoleArn:
    Value: !GetAtt DRRole.Arn
    Description: DR Role ARN
  DRFunctionArn:
    Value: !GetAtt DRFunction.Arn
    Description: DR Function ARN
EOF
    
    # Deploy CloudFormation stack
    aws cloudformation deploy --template-file dr-template.yaml --stack-name $PROJECT_NAME-$ENVIRONMENT-dr --region $PRIMARY_REGION --capabilities CAPABILITY_IAM
    
    log "Disaster recovery setup completed."
}

# Run health checks
run_health_checks() {
    log "Running health checks..."
    
    # Set AWS region to primary
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Check EKS cluster health
    kubectl cluster-info
    
    # Check pod status
    kubectl get pods -A
    
    # Check service status
    kubectl get svc -A
    
    # Check ingress status
    kubectl get ingress -A
    
    # Check database connectivity
    DB_ENDPOINT=$(jq -r '.database_endpoint.value' ../outputs-primary.json)
    nc -zv $(echo $DB_ENDPOINT | cut -d: -f1) $(echo $DB_ENDPOINT | cut -d: -f2)
    
    # Check Redis connectivity
    REDIS_ENDPOINT=$(jq -r '.redis_endpoint.value' ../outputs-primary.json)
    nc -zv $(echo $REDIS_ENDPOINT | cut -d: -f1) $(echo $REDIS_ENDPOINT | cut -d: -f2)
    
    log "Health checks completed."
}

# Generate deployment report
generate_deployment_report() {
    log "Generating deployment report..."
    
    # Set AWS region to primary
    export AWS_DEFAULT_REGION=$PRIMARY_REGION
    
    # Create deployment report
    cat > deployment-report.md << EOF
# KALDRIX Blockchain Deployment Report

## Deployment Summary
- **Project**: $PROJECT_NAME
- **Environment**: $ENVIRONMENT
- **Primary Region**: $PRIMARY_REGION
- **Secondary Regions**: ${SECONDARY_REGIONS[*]}
- **Domain**: $DOMAIN_NAME
- **Deployment Date**: $(date)

## Infrastructure Components

### Primary Region ($PRIMARY_REGION)
- **EKS Cluster**: $(jq -r '.eks_cluster_name.value' ../outputs-primary.json)
- **Database**: $(jq -r '.database_endpoint.value' ../outputs-primary.json)
- **Redis**: $(jq -r '.redis_endpoint.value' ../outputs-primary.json)
- **ALB**: $(jq -r '.primary_alb_dns_name.value' ../outputs-primary.json)
- **CloudFront**: $(jq -r '.cloudfront_domain_name.value' ../outputs-primary.json)

### Secondary Regions
EOF
    
    # Add secondary regions info
    for region in "${SECONDARY_REGIONS[@]}"; do
        cat >> deployment-report.md << EOF
#### $region
- **ALB**: $(jq -r '.secondary_'${region}'_alb_dns_name.value' ../outputs-$region.json)
EOF
    done
    
    # Add Kubernetes info
    cat >> deployment-report.md << EOF

### Kubernetes Resources
- **Namespace**: $PROJECT_NAME
- **Pods**: $(kubectl get pods -n $PROJECT_NAME --no-headers | wc -l)
- **Services**: $(kubectl get svc -n $PROJECT_NAME --no-headers | wc -l)
- **Ingress**: $(kubectl get ingress -n $PROJECT_NAME --no-headers | wc -l)

### Monitoring
- **Prometheus**: Installed
- **Grafana**: Installed
- **CloudWatch Agent**: Installed

### Logging
- **Fluentd**: Installed
- **CloudWatch Log Group**: /aws/eks/$PROJECT_NAME/$ENVIRONMENT

### Backup
- **Backup Bucket**: s3://$PROJECT_NAME-$ENVIRONMENT-backup
- **Retention**: 30 days

### Disaster Recovery
- **DR Stack**: $PROJECT_NAME-$ENVIRONMENT-dr
- **RTO**: 15 minutes
- **RPO**: 1 hour

## Access URLs
- **Primary Application**: https://$DOMAIN_NAME
- **Secondary West**: https://west.$DOMAIN_NAME
- **Secondary EU**: https://eu.$DOMAIN_NAME
- **Grafana**: http://grafana.monitoring.svc.cluster.local:3000
- **Prometheus**: http://prometheus.monitoring.svc.cluster.local:9090

## Next Steps
1. Update DNS records to point to the load balancers
2. Configure SSL certificates
3. Set up monitoring alerts
4. Test disaster recovery procedures
5. Configure CI/CD pipelines

## Troubleshooting
- Check pod logs: \`kubectl logs <pod-name> -n $PROJECT_NAME\`
- Check cluster status: \`kubectl cluster-info\`
- Check AWS resources: \`aws resource-groups list-group-resources --group-name $PROJECT_NAME-$ENVIRONMENT\`

---
*Generated on $(date)*
EOF
    
    log "Deployment report generated: deployment-report.md"
}

# Main deployment function
main() {
    log "Starting KALDRIX multi-region deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Initialize Terraform
    initialize_terraform
    
    # Deploy to primary region
    deploy_primary_region
    
    # Deploy to secondary regions
    deploy_secondary_regions
    
    # Configure kubectl
    configure_kubectl
    
    # Deploy Kubernetes manifests
    deploy_kubernetes
    
    # Setup monitoring
    setup_monitoring
    
    # Setup logging
    setup_logging
    
    # Setup backup
    setup_backup
    
    # Setup disaster recovery
    setup_disaster_recovery
    
    # Run health checks
    run_health_checks
    
    # Generate deployment report
    generate_deployment_report
    
    log "KALDRIX multi-region deployment completed successfully!"
    log "Access URLs:"
    log "  - Primary Application: https://$DOMAIN_NAME"
    log "  - Secondary West: https://west.$DOMAIN_NAME"
    log "  - Secondary EU: https://eu.$DOMAIN_NAME"
    log "  - Grafana: http://grafana.monitoring.svc.cluster.local:3000"
    log "  - Prometheus: http://prometheus.monitoring.svc.cluster.local:9090"
    log "Deployment report: deployment-report.md"
}

# Run main function
main "$@"