#!/bin/bash

# KALDRIX Advanced Monitoring & Alerting Deployment Script
# This script deploys the complete monitoring infrastructure across all regions

set -e

# Configuration
REGIONS=("us-east-1" "us-west-2" "eu-west-1")
ENVIRONMENT="prod"
PROJECT_NAME="kaldrix"
MONITORING_DIR="/home/z/my-project/monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        error "Terraform is not installed"
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        error "helm is not installed"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
    fi
    
    log "Prerequisites check completed"
}

# Initialize Terraform
init_terraform() {
    log "Initializing Terraform..."
    
    cd "$MONITORING_DIR"
    
    for region in "${REGIONS[@]}"; do
        log "Initializing Terraform for region: $region"
        
        # Create backend config for each region
        cat > "backend-${region}.tf" << EOF
terraform {
  backend "s3" {
    bucket = "${PROJECT_NAME}-terraform-state-${region}"
    key    = "monitoring/terraform.tfstate"
    region = "$region"
    dynamodb_table = "${PROJECT_NAME}-terraform-locks"
  }
}
EOF
        
        # Initialize Terraform
        terraform init -reconfigure
        
        log "Terraform initialized for region: $region"
    done
}

# Deploy monitoring infrastructure
deploy_monitoring() {
    log "Deploying monitoring infrastructure..."
    
    cd "$MONITORING_DIR"
    
    for region in "${REGIONS[@]}"; do
        log "Deploying monitoring in region: $region"
        
        # Set AWS region
        export AWS_DEFAULT_REGION="$region"
        
        # Create Terraform variables file
        cat > "terraform.tfvars" << EOF
region                   = "$region"
environment              = "$ENVIRONMENT"
kubernetes_cluster_name  = "${PROJECT_NAME}-eks-${region}"
vpc_id                   = "vpc-xxxxxxxxxxxx"  # Replace with actual VPC ID
private_subnets          = ["subnet-xxxxxxxx", "subnet-yyyyyyyy", "subnet-zzzzzzzz"]  # Replace with actual subnet IDs
public_subnets           = ["subnet-xxxxxxxx", "subnet-yyyyyyyy", "subnet-zzzzzzzz"]  # Replace with actual subnet IDs
alert_email              = "alerts@kaldrix.com"  # Replace with actual email
pagerduty_integration_key = ""  # Replace with actual PagerDuty key if available
slack_webhook_url        = ""  # Replace with actual Slack webhook if available
enable_anomaly_detection = true
enable_compliance_monitoring = true
monitoring_retention_days = 30
tags = {
    Project     = "$PROJECT_NAME"
    Environment = "$ENVIRONMENT"
    ManagedBy   = "Terraform"
}
EOF
        
        # Plan and apply
        log "Planning Terraform changes for region: $region"
        terraform plan -out="monitoring-plan-${region}"
        
        log "Applying Terraform changes for region: $region"
        terraform apply "monitoring-plan-${region}"
        
        # Clean up plan file
        rm -f "monitoring-plan-${region}"
        
        log "Monitoring infrastructure deployed in region: $region"
    done
}

# Configure Kubernetes monitoring
configure_kubernetes_monitoring() {
    log "Configuring Kubernetes monitoring..."
    
    for region in "${REGIONS[@]}"; do
        log "Configuring Kubernetes monitoring in region: $region"
        
        # Update kubeconfig
        aws eks update-kubeconfig --name "${PROJECT_NAME}-eks-${region}" --region "$region"
        
        # Wait for pods to be ready
        log "Waiting for monitoring pods to be ready..."
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=prometheus -n monitoring --timeout=300s
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=grafana -n monitoring --timeout=300s
        
        # Port forward Grafana for testing
        log "Setting up port forwarding for Grafana in region: $region"
        kubectl port-forward svc/grafana 3000:3000 -n monitoring &
        GRAFANA_PID=$!
        
        # Wait a moment for port forward to establish
        sleep 5
        
        # Test Grafana accessibility
        if curl -s http://localhost:3000/api/health > /dev/null; then
            log "Grafana is accessible in region: $region"
        else
            warn "Grafana is not accessible in region: $region"
        fi
        
        # Kill port forward
        kill $GRAFANA_PID 2>/dev/null || true
        
        log "Kubernetes monitoring configured in region: $region"
    done
}

# Test monitoring infrastructure
test_monitoring() {
    log "Testing monitoring infrastructure..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing monitoring in region: $region"
        
        # Test CloudWatch metrics
        log "Testing CloudWatch metrics..."
        aws cloudwatch list-metrics --namespace "KALDRIX" --region "$region" > /dev/null
        
        # Test S3 bucket
        log "Testing S3 bucket..."
        BUCKET_NAME="${ENVIRONMENT}-${PROJECT_NAME}-monitoring-data-${region}"
        aws s3 ls "s3://${BUCKET_NAME}" --region "$region" > /dev/null
        
        # Test CloudWatch Alarms
        log "Testing CloudWatch alarms..."
        aws cloudwatch describe-alarms --alarm-name-prefix "${ENVIRONMENT}-${PROJECT_NAME}" --region "$region" > /dev/null
        
        # Test CloudWatch Synthetics
        log "Testing CloudWatch Synthetics..."
        aws synthetics describe-canaries --region "$region" > /dev/null
        
        log "Monitoring tests passed for region: $region"
    done
}

# Generate monitoring report
generate_report() {
    log "Generating monitoring deployment report..."
    
    REPORT_FILE="${MONITORING_DIR}/monitoring-deployment-report.md"
    
    cat > "$REPORT_FILE" << EOF
# KALDRIX Monitoring Infrastructure Deployment Report

## Deployment Summary
- **Date**: $(date)
- **Environment**: $ENVIRONMENT
- **Regions**: ${REGIONS[*]}
- **Project**: $PROJECT_NAME

## Deployed Components

### Core Infrastructure
- **S3 Buckets**: Monitoring data storage
- **CloudWatch Log Groups**: Application, infrastructure, and security logs
- **CloudWatch Dashboards**: Overview and performance dashboards
- **SNS Topics**: Alert notifications
- **CloudWatch Synthetics**: Health checks

### Alerting System
- **Lambda Functions**: Alert processing and routing
- **CloudWatch Events**: Scheduled health checks and maintenance windows
- **Integration Points**: Email, PagerDuty, Slack

### Anomaly Detection
- **CloudWatch Anomaly Detectors**: Transaction rate, CPU, memory
- **Lookout for Metrics**: ML-based anomaly detection
- **Lambda Functions**: Anomaly processing and alerting

### Business Metrics
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **EFS**: Persistent storage for metrics
- **Business KPI Alarms**: Transaction rate, validator participation

### Compliance Monitoring
- **Security Hub**: Security findings aggregation
- **GuardDuty**: Threat detection
- **Macie**: Data classification and protection
- **CloudTrail**: Audit logging
- **AWS Config**: Configuration compliance

## Access Information

### Grafana Dashboards
EOF
    
    for region in "${REGIONS[@]}"; do
        cat >> "$REPORT_FILE" << EOF
#### Region: $region
- **URL**: http://grafana.${PROJECT_NAME}-${region}.kaldrix.com
- **Username**: admin
- **Password**: KaldrixMonitoring2024!

EOF
    done
    
    cat >> "$REPORT_FILE" << EOF
### CloudWatch Dashboards
EOF
    
    for region in "${REGIONS[@]}"; do
        cat >> "$REPORT_FILE" << EOF
#### Region: $region
- **Overview**: https://console.aws.amazon.com/cloudwatch/home?region=$region#dashboards:name=${ENVIRONMENT}-${PROJECT_NAME}-overview

EOF
    done
    
    cat >> "$REPORT_FILE" << EOF
## Monitoring Endpoints

### Health Checks
EOF
    
    for region in "${REGIONS[@]}"; do
        cat >> "$REPORT_FILE" << EOF
#### Region: $region
- **Health Check**: https://${region}.console.aws.amazon.com/cloudwatch/home?region=$region#synthetics:

EOF
    done
    
    cat >> "$REPORT_FILE" << EOF
## Alert Configuration

### Alert Channels
- **Email**: alerts@kaldrix.com
- **PagerDuty**: Configured if integration key provided
- **Slack**: Configured if webhook URL provided

### Alert Severity Levels
- **Critical (P0)**: System-wide outages, security breaches
- **High (P1)**: Regional service degradation, performance bottlenecks
- **Medium (P2)**: Minor performance issues, configuration drift
- **Low (P3)**: Informational alerts, capacity planning

## Compliance Standards
- **SOC2**: Service Organization Control 2
- **ISO27001**: Information Security Management
- **GDPR**: General Data Protection Regulation
- **HIPAA**: Health Insurance Portability and Accountability Act

## Next Steps
1. Verify all monitoring dashboards are accessible
2. Configure alert channels (PagerDuty, Slack)
3. Set up alert escalation policies
4. Test alert notifications
5. Configure automated compliance reporting
6. Set up monitoring retention policies

## Troubleshooting

### Common Issues
1. **Grafana not accessible**: Check kubectl port-forward and service configuration
2. **Alerts not firing**: Verify SNS topic configuration and Lambda function permissions
3. **Metrics not appearing**: Check Prometheus configuration and pod status
4. **Compliance reports failing**: Verify AWS Config and Security Hub configuration

### Support
- **Documentation**: Refer to the monitoring module documentation
- **AWS Console**: Check CloudWatch Logs for error messages
- **Terraform**: Use \`terraform show\` to inspect deployed resources

---
*Report generated on $(date)*
EOF
    
    log "Monitoring deployment report generated: $REPORT_FILE"
}

# Main deployment function
main() {
    log "Starting KALDRIX monitoring infrastructure deployment..."
    
    check_prerequisites
    init_terraform
    deploy_monitoring
    configure_kubernetes_monitoring
    test_monitoring
    generate_report
    
    log "KALDRIX monitoring infrastructure deployment completed successfully!"
    log "Access the monitoring deployment report at: ${MONITORING_DIR}/monitoring-deployment-report.md"
}

# Run main function
main "$@"