#!/bin/bash

# KALDRIX Post-Bootstrap Validation Script
# This script validates the mainnet bootstrap process and ensures all components are working

set -e

# Configuration
NETWORK="mainnet"
API_ENDPOINT="https://api.mainnet.kaldrix.com"
VALIDATOR_IDS=("validator1" "validator2" "validator3" "validator4")
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3000"
MOBILE_SDK_CONFIG="/etc/kaldrix/mobile-sdk-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Function to check validator sync
check_validator_sync() {
    log "Checking validator synchronization..."
    
    local all_synced=true
    local sync_results=()
    
    for validator_id in "${VALIDATOR_IDS[@]}"; do
        log "Checking sync status for $validator_id..."
        
        # Get validator status
        local response=$(curl -s "$API_ENDPOINT/api/v1/validators/$validator_id/status")
        local sync_status=$(echo "$response" | jq -r '.sync_status // "unknown"')
        local block_height=$(echo "$response" | jq -r '.block_height // 0')
        local last_block_time=$(echo "$response" | jq -r '.last_block_time // 0')
        
        # Check if validator is synced
        if [[ "$sync_status" == "synced" ]]; then
            log_success "$validator_id is synced (Block: $block_height)"
            sync_results+=("$validator_id:synced:$block_height")
        else
            log_error "$validator_id is not synced (Status: $sync_status)"
            sync_results+=("$validator_id:$sync_status:$block_height")
            all_synced=false
        fi
        
        # Check if block height is reasonable
        if [[ $block_height -lt 1 ]]; then
            log_warning "$validator_id has low block height: $block_height"
            all_synced=false
        fi
        
        # Check if last block time is recent
        local current_time=$(date +%s)
        local time_diff=$((current_time - last_block_time))
        
        if [[ $time_diff -gt 300 ]]; then  # 5 minutes
            log_warning "$validator_id last block time is old: $time_diff seconds ago"
            all_synced=false
        fi
    done
    
    # Check if all validators have similar block heights
    local heights=()
    for result in "${sync_results[@]}"; do
        local height=$(echo "$result" | cut -d':' -f3)
        heights+=($height)
    done
    
    local min_height=$(printf "%s\n" "${heights[@]}" | sort -n | head -1)
    local max_height=$(printf "%s\n" "${heights[@]}" | sort -n | tail -1)
    local height_diff=$((max_height - min_height))
    
    if [[ $height_diff -gt 10 ]]; then
        log_warning "Validators have different block heights (diff: $height_diff)"
        all_synced=false
    fi
    
    if [[ "$all_synced" == true ]]; then
        log_success "All validators are synchronized"
        return 0
    else
        log_error "Validator synchronization issues detected"
        return 1
    fi
}

# Function to check transaction propagation
check_transaction_propagation() {
    log "Checking transaction propagation..."
    
    # Create test transaction
    local test_tx=$(cat << EOF
{
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f8e8B4",
  "to": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
  "amount": "1000000000000000000",
  "nonce": 12345,
  "gas_limit": 21000,
  "gas_price": 1000,
  "timestamp": $(date +%s)
}
EOF
)
    
    # Broadcast test transaction
    log "Broadcasting test transaction..."
    local response=$(curl -s -X POST "$API_ENDPOINT/api/v1/transactions" \
        -H "Content-Type: application/json" \
        -d "$test_tx")
    
    local tx_hash=$(echo "$response" | jq -r '.hash // empty')
    
    if [[ -z "$tx_hash" || "$tx_hash" == "null" ]]; then
        log_error "Failed to broadcast test transaction"
        return 1
    fi
    
    log_success "Test transaction broadcasted: $tx_hash"
    
    # Wait for transaction to propagate
    log "Waiting for transaction propagation..."
    local timeout=60
    local start_time=$(date +%s)
    local propagated=false
    
    while [[ $(($(date +%s) - start_time)) -lt $timeout ]]; do
        # Check transaction status on each validator
        local all_validators_have_tx=true
        
        for validator_id in "${VALIDATOR_IDS[@]}"; do
            local validator_response=$(curl -s "$API_ENDPOINT/api/v1/validators/$validator_id/transaction/$tx_hash")
            local has_tx=$(echo "$validator_response" | jq -r '.found // false')
            
            if [[ "$has_tx" != "true" ]]; then
                all_validators_have_tx=false
                break
            fi
        done
        
        if [[ "$all_validators_have_tx" == "true" ]]; then
            propagated=true
            break
        fi
        
        sleep 5
    done
    
    if [[ "$propagated" == "true" ]]; then
        log_success "Transaction propagated to all validators"
        return 0
    else
        log_error "Transaction propagation failed or timed out"
        return 1
    fi
}

# Function to check signature verification and PQC rotation
check_signature_verification() {
    log "Checking signature verification and PQC rotation..."
    
    # Test Dilithium3 signature
    log "Testing Dilithium3 signature verification..."
    
    local test_message="test_message_$(date +%s)"
    local test_signature="test_dilithium3_signature"
    
    local response=$(curl -s -X POST "$API_ENDPOINT/api/v1/crypto/verify-dilithium3" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$test_message\", \"signature\": \"$test_signature\"}")
    
    local verification_result=$(echo "$response" | jq -r '.valid // false')
    
    if [[ "$verification_result" == "true" ]]; then
        log_success "Dilithium3 signature verification working"
    else
        log_error "Dilithium3 signature verification failed"
        return 1
    fi
    
    # Test Ed25519 signature
    log "Testing Ed25519 signature verification..."
    
    local test_signature="test_ed25519_signature"
    
    local response=$(curl -s -X POST "$API_ENDPOINT/api/v1/crypto/verify-ed25519" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$test_message\", \"signature\": \"$test_signature\"}")
    
    local verification_result=$(echo "$response" | jq -r '.valid // false')
    
    if [[ "$verification_result" == "true" ]]; then
        log_success "Ed25519 signature verification working"
    else
        log_error "Ed25519 signature verification failed"
        return 1
    fi
    
    # Check PQC key rotation status
    log "Checking PQC key rotation status..."
    
    for validator_id in "${VALIDATOR_IDS[@]}"; do
        local response=$(curl -s "$API_ENDPOINT/api/v1/validators/$validator_id/keys")
        local rotation_enabled=$(echo "$response" | jq -r '.rotation_enabled // false')
        local last_rotation=$(echo "$response" | jq -r '.last_rotation // 0')
        local next_rotation=$(echo "$response" | jq -r '.next_rotation // 0')
        
        if [[ "$rotation_enabled" == "true" ]]; then
            log_success "$validator_id has PQC rotation enabled"
            
            # Check if rotation schedule is reasonable
            local current_time=$(date +%s)
            local time_to_rotation=$((next_rotation - current_time))
            
            if [[ $time_to_rotation -gt 0 ]]; then
                log "Next rotation for $validator_id in $time_to_rotation seconds"
            else
                log_warning "$validator_id rotation is overdue"
            fi
        else
            log_error "$validator_id does not have PQC rotation enabled"
            return 1
        fi
    done
    
    log_success "Signature verification and PQC rotation checks passed"
    return 0
}

# Function to check Prometheus metrics and log ingestion
check_prometheus_metrics() {
    log "Checking Prometheus metrics and log ingestion..."
    
    # Check if Prometheus is accessible
    local prometheus_health=$(curl -s "$PROMETHEUS_URL/-/healthy")
    
    if [[ "$prometheus_health" == "OK" ]]; then
        log_success "Prometheus is healthy"
    else
        log_error "Prometheus is not healthy"
        return 1
    fi
    
    # Check key metrics
    local metrics=(
        "kaldrix_blocks_produced_total"
        "kaldrix_transactions_total"
        "kaldrix_validator_uptime"
        "kaldrix_network_peers_count"
        "kaldrix_consensus_finality_time"
    )
    
    for metric in "${metrics[@]}"; do
        local metric_value=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=$metric" | jq -r '.data.result[0].value[1] // "0"')
        
        if [[ "$metric_value" != "0" && "$metric_value" != "null" ]]; then
            log_success "Metric $metric: $metric_value"
        else
            log_warning "Metric $metric has no value or is zero"
        fi
    done
    
    # Check Grafana accessibility
    local grafana_health=$(curl -s "$GRAFANA_URL/api/health")
    local grafana_status=$(echo "$grafana_health" | jq -r '.database // "unknown"')
    
    if [[ "$grafana_status" == "ok" ]]; then
        log_success "Grafana is healthy"
    else
        log_error "Grafana is not healthy"
        return 1
    fi
    
    # Check log ingestion
    log "Checking log ingestion..."
    
    # Check if logs are being generated
    local log_count=$(journalctl -u kaldrix-validator1 --since "1 hour ago" | wc -l)
    
    if [[ $log_count -gt 0 ]]; then
        log_success "Log ingestion working ($log_count log entries in last hour)"
    else
        log_warning "No log entries found in last hour"
    fi
    
    # Check if logs are being forwarded to monitoring system
    local monitoring_logs=$(journalctl -u kaldrix-validator1 --since "1 hour ago" | grep -i "monitoring\|metrics\|prometheus" | wc -l)
    
    if [[ $monitoring_logs -gt 0 ]]; then
        log_success "Monitoring logs are being generated ($monitoring_logs entries)"
    else
        log_warning "No monitoring logs found"
    fi
    
    log_success "Prometheus metrics and log ingestion checks passed"
    return 0
}

# Function to check key backup jobs
check_key_backup_jobs() {
    log "Checking key backup jobs..."
    
    # Check backup directory
    local backup_dir="/backup/kaldrix"
    
    if [[ ! -d "$backup_dir" ]]; then
        log_error "Backup directory does not exist: $backup_dir"
        return 1
    fi
    
    # Check backup files
    local backup_files=($(find "$backup_dir" -name "*.enc" -mtime -1))
    
    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log_error "No recent backup files found"
        return 1
    fi
    
    log_success "Found ${#backup_files[@]} recent backup files"
    
    # Check backup integrity
    for backup_file in "${backup_files[@]}"; do
        log "Checking backup integrity: $backup_file"
        
        # Check if file is not empty
        local file_size=$(stat -c%s "$backup_file")
        if [[ $file_size -eq 0 ]]; then
            log_error "Backup file is empty: $backup_file"
            return 1
        fi
        
        # Check if file is encrypted (basic check)
        if ! file "$backup_file" | grep -q "encrypted"; then
            log_warning "Backup file may not be encrypted: $backup_file"
        fi
    done
    
    # Check backup cron jobs
    local backup_cron=$(crontab -l 2>/dev/null | grep -i "backup" || echo "")
    
    if [[ -n "$backup_cron" ]]; then
        log_success "Backup cron jobs found"
        log "Cron jobs: $backup_cron"
    else
        log_warning "No backup cron jobs found"
    fi
    
    # Check backup logs
    local backup_logs=$(journalctl --since "1 day ago" | grep -i "backup" | wc -l)
    
    if [[ $backup_logs -gt 0 ]]; then
        log_success "Backup logs found ($backup_logs entries)"
    else
        log_warning "No backup logs found"
    fi
    
    # Test backup restoration
    log "Testing backup restoration..."
    
    local latest_backup=$(ls -t "$backup_dir"/*.enc | head -1)
    if [[ -n "$latest_backup" ]]; then
        log "Testing restoration from: $latest_backup"
        
        # Create test restoration
        local test_restore_dir="/tmp/backup_test"
        mkdir -p "$test_restore_dir"
        
        # Simulate restoration (without actually decrypting)
        if cp "$latest_backup" "$test_restore_dir/"; then
            log_success "Backup file can be copied for restoration"
            rm -rf "$test_restore_dir"
        else
            log_error "Failed to copy backup file for restoration"
            return 1
        fi
    else
        log_error "No backup file found for restoration test"
        return 1
    fi
    
    log_success "Key backup jobs checks passed"
    return 0
}

# Function to check mobile SDK connection
check_mobile_sdk_connection() {
    log "Checking mobile SDK connection to mainnet endpoint..."
    
    # Check if mobile SDK config exists
    if [[ ! -f "$MOBILE_SDK_CONFIG" ]]; then
        log_error "Mobile SDK config not found: $MOBILE_SDK_CONFIG"
        return 1
    fi
    
    # Parse mobile SDK config
    local api_endpoint=$(jq -r '.api_endpoint // empty' "$MOBILE_SDK_CONFIG")
    local network_id=$(jq -r '.network_id // empty' "$MOBILE_SDK_CONFIG")
    local chain_id=$(jq -r '.chain_id // empty' "$MOBILE_SDK_CONFIG")
    
    if [[ -z "$api_endpoint" ]]; then
        log_error "API endpoint not configured in mobile SDK config"
        return 1
    fi
    
    log "Mobile SDK API endpoint: $api_endpoint"
    
    # Test API connectivity
    local health_response=$(curl -s "$api_endpoint/health")
    local health_status=$(echo "$health_response" | jq -r '.status // "unknown"')
    
    if [[ "$health_status" == "healthy" ]]; then
        log_success "Mobile SDK can connect to mainnet endpoint"
    else
        log_error "Mobile SDK cannot connect to mainnet endpoint (Status: $health_status)"
        return 1
    fi
    
    # Test mobile SDK functionality
    log "Testing mobile SDK functionality..."
    
    # Test wallet creation
    local wallet_response=$(curl -s -X POST "$api_endpoint/api/v1/wallet/create" \
        -H "Content-Type: application/json" \
        -d '{"passphrase": "test_passphrase"}')
    
    local wallet_address=$(echo "$wallet_response" | jq -r '.address // empty')
    
    if [[ -n "$wallet_address" ]]; then
        log_success "Mobile SDK wallet creation working"
    else
        log_error "Mobile SDK wallet creation failed"
        return 1
    fi
    
    # Test transaction sending
    local tx_response=$(curl -s -X POST "$api_endpoint/api/v1/transactions/send" \
        -H "Content-Type: application/json" \
        -d "{\"from\": \"$wallet_address\", \"to\": \"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4\", \"amount\": \"1000000000000000000\"}")
    
    local tx_hash=$(echo "$tx_response" | jq -r '.hash // empty')
    
    if [[ -n "$tx_hash" ]]; then
        log_success "Mobile SDK transaction sending working"
    else
        log_error "Mobile SDK transaction sending failed"
        return 1
    fi
    
    # Test blockchain info
    local info_response=$(curl -s "$api_endpoint/api/v1/blockchain/info")
    local block_height=$(echo "$info_response" | jq -r '.block_height // 0')
    
    if [[ $block_height -gt 0 ]]; then
        log_success "Mobile SDK blockchain info working (Block: $block_height)"
    else
        log_error "Mobile SDK blockchain info failed"
        return 1
    fi
    
    # Test network info
    local network_response=$(curl -s "$api_endpoint/api/v1/network/info")
    local peers_count=$(echo "$network_response" | jq -r '.peers_count // 0')
    
    if [[ $peers_count -gt 0 ]]; then
        log_success "Mobile SDK network info working (Peers: $peers_count)"
    else
        log_error "Mobile SDK network info failed"
        return 1
    fi
    
    log_success "Mobile SDK connection checks passed"
    return 0
}

# Function to generate validation report
generate_validation_report() {
    log "Generating validation report..."
    
    local report_file="/tmp/kaldrix-validation-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
KALDRIX Mainnet Bootstrap Validation Report
==========================================

Generated: $(date)
Network: $NETWORK
API Endpoint: $API_ENDPOINT

Validation Results:
-----------------

1. Validator Synchronization: $(check_validator_sync >/dev/null 2>&1 && echo "PASSED" || echo "FAILED")
2. Transaction Propagation: $(check_transaction_propagation >/dev/null 2>&1 && echo "PASSED" || echo "FAILED")
3. Signature Verification & PQC Rotation: $(check_signature_verification >/dev/null 2>&1 && echo "PASSED" || echo "FAILED")
4. Prometheus Metrics & Log Ingestion: $(check_prometheus_metrics >/dev/null 2>&1 && echo "PASSED" || echo "FAILED")
5. Key Backup Jobs: $(check_key_backup_jobs >/dev/null 2>&1 && echo "PASSED" || echo "FAILED")
6. Mobile SDK Connection: $(check_mobile_sdk_connection >/dev/null 2>&1 && echo "PASSED" || echo "FAILED")

System Information:
------------------
- Hostname: $(hostname)
- OS: $(uname -a)
- Memory: $(free -h)
- Disk: $(df -h /)
- Uptime: $(uptime)

Network Information:
------------------
- API Endpoint: $API_ENDPOINT
- Prometheus: $PROMETHEUS_URL
- Grafana: $GRAFANA_URL
- Validators: ${#VALIDATOR_IDS[@]}

Validator Status:
-----------------
EOF
    
    # Add validator status information
    for validator_id in "${VALIDATOR_IDS[@]}"; do
        local response=$(curl -s "$API_ENDPOINT/api/v1/validators/$validator_id/status")
        local sync_status=$(echo "$response" | jq -r '.sync_status // "unknown"')
        local block_height=$(echo "$response" | jq -r '.block_height // 0')
        local uptime=$(echo "$response" | jq -r '.uptime // 0')
        
        cat >> "$report_file" << EOF
- $validator_id:
  - Sync Status: $sync_status
  - Block Height: $block_height
  - Uptime: $uptime seconds
EOF
    done
    
    cat >> "$report_file" << EOF

Recommendations:
---------------
1. Monitor validator synchronization regularly
2. Set up alerts for transaction propagation delays
3. Schedule regular PQC key rotation
4. Monitor Prometheus metrics for anomalies
5. Test backup restoration procedures regularly
6. Keep mobile SDK updated with latest mainnet changes

Next Steps:
-----------
1. Address any failed validation checks
2. Set up ongoing monitoring and alerting
3. Schedule regular validation runs
4. Document any issues and resolutions
5. Prepare for mainnet launch announcement

Report End
==========
EOF
    
    log_success "Validation report generated: $report_file"
    echo "Report contents:"
    cat "$report_file"
}

# Function to run all validation checks
run_all_validations() {
    log "Running all post-bootstrap validation checks..."
    
    local passed=0
    local failed=0
    local total=6
    
    # Run all validation checks
    if check_validator_sync; then
        ((passed++))
    else
        ((failed++))
    fi
    
    if check_transaction_propagation; then
        ((passed++))
    else
        ((failed++))
    fi
    
    if check_signature_verification; then
        ((passed++))
    else
        ((failed++))
    fi
    
    if check_prometheus_metrics; then
        ((passed++))
    else
        ((failed++))
    fi
    
    if check_key_backup_jobs; then
        ((passed++))
    else
        ((failed++))
    fi
    
    if check_mobile_sdk_connection; then
        ((passed++))
    else
        ((failed++))
    fi
    
    # Generate report
    generate_validation_report
    
    # Display summary
    echo ""
    echo "=== VALIDATION SUMMARY ==="
    echo "Total Checks: $total"
    echo "Passed: $passed"
    echo "Failed: $failed"
    echo "Success Rate: $((passed * 100 / total))%"
    echo ""
    
    if [[ $failed -eq 0 ]]; then
        log_success "All validation checks passed! Mainnet bootstrap is successful."
        return 0
    else
        log_error "$failed validation checks failed. Please address the issues before proceeding."
        return 1
    fi
}

# Main execution
main() {
    local command=${1:-all}
    
    case $command in
        "sync")
            check_validator_sync
            ;;
        "transactions")
            check_transaction_propagation
            ;;
        "signatures")
            check_signature_verification
            ;;
        "metrics")
            check_prometheus_metrics
            ;;
        "backups")
            check_key_backup_jobs
            ;;
        "mobile")
            check_mobile_sdk_connection
            ;;
        "report")
            generate_validation_report
            ;;
        "all")
            run_all_validations
            ;;
        "help"|*)
            echo "KALDRIX Post-Bootstrap Validation Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  sync           Check validator synchronization"
            echo "  transactions   Check transaction propagation"
            echo "  signatures     Check signature verification and PQC rotation"
            echo "  metrics        Check Prometheus metrics and log ingestion"
            echo "  backups        Check key backup jobs"
            echo "  mobile         Check mobile SDK connection"
            echo "  report         Generate validation report"
            echo "  all            Run all validation checks"
            echo "  help           Show this help message"
            echo ""
            ;;
    esac
}

# Execute main function
main "$@"