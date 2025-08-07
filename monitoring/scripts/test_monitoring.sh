#!/bin/bash

# KALDRIX Monitoring Infrastructure Test Script
# This script tests the monitoring infrastructure across all regions

set -e

# Configuration
REGIONS=("us-east-1" "us-west-2" "eu-west-1")
ENVIRONMENT="prod"
PROJECT_NAME="kaldrix"

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

# Test CloudWatch metrics
test_cloudwatch_metrics() {
    log "Testing CloudWatch metrics..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing CloudWatch metrics in region: $region"
        
        # Test listing metrics
        if aws cloudwatch list-metrics --namespace "KALDRIX" --region "$region" > /dev/null 2>&1; then
            log "✓ CloudWatch metrics accessible in $region"
        else
            warn "✗ CloudWatch metrics not accessible in $region"
        fi
        
        # Test custom metrics
        if aws cloudwatch get-metric-statistics \
            --namespace "KALDRIX" \
            --metric-name "TransactionRate" \
            --start-time "$(date -d '5 minutes ago' -u +%Y-%m-%dT%H:%M:%SZ)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --period 60 \
            --statistics Sum \
            --region "$region" > /dev/null 2>&1; then
            log "✓ Custom metrics accessible in $region"
        else
            warn "✗ Custom metrics not accessible in $region"
        fi
    done
}

# Test CloudWatch alarms
test_cloudwatch_alarms() {
    log "Testing CloudWatch alarms..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing CloudWatch alarms in region: $region"
        
        # Test listing alarms
        if aws cloudwatch describe-alarms --alarm-name-prefix "${ENVIRONMENT}-${PROJECT_NAME}" --region "$region" > /dev/null 2>&1; then
            log "✓ CloudWatch alarms accessible in $region"
        else
            warn "✗ CloudWatch alarms not accessible in $region"
        fi
        
        # Test specific alarms
        ALARM_NAMES=(
            "${ENVIRONMENT}-${PROJECT_NAME}-high-cpu"
            "${ENVIRONMENT}-${PROJECT_NAME}-high-memory"
            "${ENVIRONMENT}-${PROJECT_NAME}-transaction-rate-low"
        )
        
        for alarm_name in "${ALARM_NAMES[@]}"; do
            if aws cloudwatch describe-alarms --alarm-names "$alarm_name" --region "$region" > /dev/null 2>&1; then
                log "✓ Alarm '$alarm_name' exists in $region"
            else
                warn "✗ Alarm '$alarm_name' not found in $region"
            fi
        done
    done
}

# Test S3 buckets
test_s3_buckets() {
    log "Testing S3 buckets..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing S3 buckets in region: $region"
        
        BUCKET_NAME="${ENVIRONMENT}-${PROJECT_NAME}-monitoring-data-${region}"
        
        # Test bucket existence
        if aws s3 ls "s3://${BUCKET_NAME}" --region "$region" > /dev/null 2>&1; then
            log "✓ S3 bucket '$BUCKET_NAME' accessible in $region"
        else
            warn "✗ S3 bucket '$BUCKET_NAME' not accessible in $region"
        fi
        
        # Test bucket versioning
        if aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" --region "$region" > /dev/null 2>&1; then
            log "✓ S3 bucket versioning configured in $region"
        else
            warn "✗ S3 bucket versioning not configured in $region"
        fi
        
        # Test bucket encryption
        if aws s3api get-bucket-encryption --bucket "$BUCKET_NAME" --region "$region" > /dev/null 2>&1; then
            log "✓ S3 bucket encryption configured in $region"
        else
            warn "✗ S3 bucket encryption not configured in $region"
        fi
    done
}

# Test CloudWatch Synthetics
test_synthetics() {
    log "Testing CloudWatch Synthetics..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing CloudWatch Synthetics in region: $region"
        
        # Test listing canaries
        if aws synthetics describe-canaries --region "$region" > /dev/null 2>&1; then
            log "✓ CloudWatch Synthetics accessible in $region"
        else
            warn "✗ CloudWatch Synthetics not accessible in $region"
        fi
        
        # Test specific canary
        CANARY_NAME="${ENVIRONMENT}-${PROJECT_NAME}-health-check"
        if aws synthetics describe-canaries --name "$CANARY_NAME" --region "$region" > /dev/null 2>&1; then
            log "✓ Canary '$CANARY_NAME' exists in $region"
        else
            warn "✗ Canary '$CANARY_NAME' not found in $region"
        fi
    done
}

# Test Kubernetes monitoring
test_kubernetes_monitoring() {
    log "Testing Kubernetes monitoring..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing Kubernetes monitoring in region: $region"
        
        # Update kubeconfig
        aws eks update-kubeconfig --name "${PROJECT_NAME}-eks-${region}" --region "$region" > /dev/null 2>&1 || {
            warn "✗ Failed to update kubeconfig for $region"
            continue
        }
        
        # Test monitoring namespace
        if kubectl get namespace monitoring > /dev/null 2>&1; then
            log "✓ Monitoring namespace exists in $region"
        else
            warn "✗ Monitoring namespace not found in $region"
            continue
        fi
        
        # Test Prometheus
        if kubectl get deployment prometheus-server -n monitoring > /dev/null 2>&1; then
            log "✓ Prometheus deployment exists in $region"
            
            # Check Prometheus pods
            PROMETHEUS_PODS=$(kubectl get pods -l app.kubernetes.io/name=prometheus -n monitoring --no-headers | wc -l)
            if [ "$PROMETHEUS_PODS" -gt 0 ]; then
                log "✓ Prometheus pods running in $region ($PROMETHEUS_PODS pods)"
            else
                warn "✗ No Prometheus pods running in $region"
            fi
        else
            warn "✗ Prometheus deployment not found in $region"
        fi
        
        # Test Grafana
        if kubectl get deployment grafana -n monitoring > /dev/null 2>&1; then
            log "✓ Grafana deployment exists in $region"
            
            # Check Grafana pods
            GRAFANA_PODS=$(kubectl get pods -l app.kubernetes.io/name=grafana -n monitoring --no-headers | wc -l)
            if [ "$GRAFANA_PODS" -gt 0 ]; then
                log "✓ Grafana pods running in $region ($GRAFANA_PODS pods)"
            else
                warn "✗ No Grafana pods running in $region"
            fi
        else
            warn "✗ Grafana deployment not found in $region"
        fi
        
        # Test services
        if kubectl get svc prometheus-server -n monitoring > /dev/null 2>&1; then
            log "✓ Prometheus service exists in $region"
        else
            warn "✗ Prometheus service not found in $region"
        fi
        
        if kubectl get svc grafana -n monitoring > /dev/null 2>&1; then
            log "✓ Grafana service exists in $region"
        else
            warn "✗ Grafana service not found in $region"
        fi
    done
}

# Test alerting system
test_alerting_system() {
    log "Testing alerting system..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing alerting system in region: $region"
        
        # Test SNS topic
        SNS_TOPIC_NAME="${ENVIRONMENT}-${PROJECT_NAME}-alerts"
        if aws sns get-topic-attributes --topic-arn "arn:aws:sns:${region}:$(aws sts get-caller-identity --query Account --output text):${SNS_TOPIC_NAME}" --region "$region" > /dev/null 2>&1; then
            log "✓ SNS topic '$SNS_TOPIC_NAME' exists in $region"
        else
            warn "✗ SNS topic '$SNS_TOPIC_NAME' not found in $region"
        fi
        
        # Test Lambda functions
        LAMBDA_FUNCTIONS=(
            "${ENVIRONMENT}-${PROJECT_NAME}-alert-processor"
            "${ENVIRONMENT}-${PROJECT_NAME}-anomaly-processor"
            "${ENVIRONMENT}-${PROJECT_NAME}-compliance-reporter"
        )
        
        for function_name in "${LAMBDA_FUNCTIONS[@]}"; do
            if aws lambda get-function --function-name "$function_name" --region "$region" > /dev/null 2>&1; then
                log "✓ Lambda function '$function_name' exists in $region"
            else
                warn "✗ Lambda function '$function_name' not found in $region"
            fi
        done
        
        # Test CloudWatch Events
        EVENT_RULES=(
            "${ENVIRONMENT}-${PROJECT_NAME}-alert-health-check"
            "${ENVIRONMENT}-${PROJECT_NAME}-compliance-report"
        )
        
        for rule_name in "${EVENT_RULES[@]}"; do
            if aws events describe-rule --name "$rule_name" --region "$region" > /dev/null 2>&1; then
                log "✓ Event rule '$rule_name' exists in $region"
            else
                warn "✗ Event rule '$rule_name' not found in $region"
            fi
        done
    done
}

# Test compliance monitoring
test_compliance_monitoring() {
    log "Testing compliance monitoring..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing compliance monitoring in region: $region"
        
        # Test Security Hub
        if aws securityhub get-enabled-standards --region "$region" > /dev/null 2>&1; then
            log "✓ Security Hub accessible in $region"
        else
            warn "✗ Security Hub not accessible in $region"
        fi
        
        # Test GuardDuty
        if aws guardduty list-detectors --region "$region" > /dev/null 2>&1; then
            log "✓ GuardDuty accessible in $region"
        else
            warn "✗ GuardDuty not accessible in $region"
        fi
        
        # Test Macie
        if aws macie2 get-macie-session --region "$region" > /dev/null 2>&1; then
            log "✓ Macie accessible in $region"
        else
            warn "✗ Macie not accessible in $region"
        fi
        
        # Test CloudTrail
        if aws cloudtrail describe-trails --trail-name-list "${ENVIRONMENT}-${PROJECT_NAME}-audit" --region "$region" > /dev/null 2>&1; then
            log "✓ CloudTrail accessible in $region"
        else
            warn "✗ CloudTrail not accessible in $region"
        fi
        
        # Test AWS Config
        if aws config describe-configuration-recorders --region "$region" > /dev/null 2>&1; then
            log "✓ AWS Config accessible in $region"
        else
            warn "✗ AWS Config not accessible in $region"
        fi
    done
}

# Test anomaly detection
test_anomaly_detection() {
    log "Testing anomaly detection..."
    
    for region in "${REGIONS[@]}"; do
        log "Testing anomaly detection in region: $region"
        
        # Test CloudWatch anomaly detectors
        if aws cloudwatch describe-anomaly-detectors --namespace "KALDRIX" --region "$region" > /dev/null 2>&1; then
            log "✓ CloudWatch anomaly detectors accessible in $region"
        else
            warn "✗ CloudWatch anomaly detectors not accessible in $region"
        fi
        
        # Test Lookout for Metrics
        if aws lookoutmetrics list-metric-sets --region "$region" > /dev/null 2>&1; then
            log "✓ Lookout for Metrics accessible in $region"
        else
            warn "✗ Lookout for Metrics not accessible in $region"
        fi
        
        # Test anomaly alarms
        if aws cloudwatch describe-alarms --alarm-name-prefix "${ENVIRONMENT}-${PROJECT_NAME}" --region "$region" | grep -q "anomaly"; then
            log "✓ Anomaly detection alarms exist in $region"
        else
            warn "✗ Anomaly detection alarms not found in $region"
        fi
    done
}

# Generate test report
generate_test_report() {
    log "Generating test report..."
    
    REPORT_FILE="/tmp/kaldrix-monitoring-test-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# KALDRIX Monitoring Infrastructure Test Report

## Test Summary
- **Date**: $(date)
- **Environment**: $ENVIRONMENT
- **Regions**: ${REGIONS[*]}
- **Project**: $PROJECT_NAME

## Test Results

### CloudWatch Metrics
$(for region in "${REGIONS[@]}"; do
    if aws cloudwatch list-metrics --namespace "KALDRIX" --region "$region" > /dev/null 2>&1; then
        echo "- $region: ✅ PASS"
    else
        echo "- $region: ❌ FAIL"
    fi
done)

### CloudWatch Alarms
$(for region in "${REGIONS[@]}"; do
    if aws cloudwatch describe-alarms --alarm-name-prefix "${ENVIRONMENT}-${PROJECT_NAME}" --region "$region" > /dev/null 2>&1; then
        echo "- $region: ✅ PASS"
    else
        echo "- $region: ❌ FAIL"
    fi
done)

### S3 Buckets
$(for region in "${REGIONS[@]}"; do
    BUCKET_NAME="${ENVIRONMENT}-${PROJECT_NAME}-monitoring-data-${region}"
    if aws s3 ls "s3://${BUCKET_NAME}" --region "$region" > /dev/null 2>&1; then
        echo "- $region: ✅ PASS"
    else
        echo "- $region: ❌ FAIL"
    fi
done)

### CloudWatch Synthetics
$(for region in "${REGIONS[@]}"; do
    if aws synthetics describe-canaries --region "$region" > /dev/null 2>&1; then
        echo "- $region: ✅ PASS"
    else
        echo "- $region: ❌ FAIL"
    fi
done)

### Kubernetes Monitoring
$(for region in "${REGIONS[@]}"; do
    if aws eks update-kubeconfig --name "${PROJECT_NAME}-eks-${region}" --region "$region" > /dev/null 2>&1 && kubectl get namespace monitoring > /dev/null 2>&1; then
        echo "- $region: ✅ PASS"
    else
        echo "- $region: ❌ FAIL"
    fi
done)

### Alerting System
$(for region in "${REGIONS[@]}"; do
    SNS_TOPIC_NAME="${ENVIRONMENT}-${PROJECT_NAME}-alerts"
    if aws sns get-topic-attributes --topic-arn "arn:aws:sns:${region}:$(aws sts get-caller-identity --query Account --output text):${SNS_TOPIC_NAME}" --region "$region" > /dev/null 2>&1; then
        echo "- $region: ✅ PASS"
    else
        echo "- $region: ❌ FAIL"
    fi
done)

### Compliance Monitoring
$(for region in "${REGIONS[@]}"; do
    if aws securityhub get-enabled-standards --region "$region" > /dev/null 2>&1; then
        echo "- $region: ✅ PASS"
    else
        echo "- $region: ❌ FAIL"
    fi
done)

### Anomaly Detection
$(for region in "${REGIONS[@]}"; do
    if aws cloudwatch describe-anomaly-detectors --namespace "KALDRIX" --region "$region" > /dev/null 2>&1; then
        echo "- $region: ✅ PASS"
    else
        echo "- $region: ❌ FAIL"
    fi
done)

## Recommendations
1. Review any failed tests and take corrective action
2. Verify all monitoring components are properly configured
3. Test alert notifications and escalation flows
4. Validate compliance monitoring and reporting
5. Ensure all regions have consistent monitoring setup

## Next Steps
1. Address any failed test cases
2. Configure alert channels and notification preferences
3. Set up automated monitoring and alerting
4. Implement compliance reporting and audit trails
5. Regular monitoring health checks and maintenance

---
*Test report generated on $(date)*
EOF
    
    log "Test report generated: $REPORT_FILE"
}

# Main test function
main() {
    log "Starting KALDRIX monitoring infrastructure tests..."
    
    test_cloudwatch_metrics
    test_cloudwatch_alarms
    test_s3_buckets
    test_synthetics
    test_kubernetes_monitoring
    test_alerting_system
    test_compliance_monitoring
    test_anomaly_detection
    generate_test_report
    
    log "KALDRIX monitoring infrastructure tests completed!"
    log "Review the test report for detailed results and recommendations."
}

# Run main function
main "$@"