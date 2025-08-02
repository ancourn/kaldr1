#!/bin/bash

# KALDRIX Transaction Broadcasting & Validator Heartbeat Script
# This script manages transaction broadcasting and validator heartbeat for mainnet

set -e

# Configuration
NETWORK="mainnet"
API_ENDPOINT="https://api.mainnet.kaldrix.com"
VALIDATOR_IDS=("validator1" "validator2" "validator3" "validator4")
HEARTBEAT_INTERVAL=30
TRANSACTION_INTERVAL=10
MAX_TRANSACTIONS_PER_BATCH=100

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

# Function to generate test transaction
generate_test_transaction() {
    local from_address=$1
    local to_address=$2
    local amount=$3
    
    # Generate random transaction data
    local nonce=$((RANDOM % 1000000))
    local gas_limit=21000
    local gas_price=$((1000 + RANDOM % 5000))
    local timestamp=$(date +%s)
    
    cat << EOF
{
  "from": "$from_address",
  "to": "$to_address",
  "amount": "$amount",
  "nonce": $nonce,
  "gas_limit": $gas_limit,
  "gas_price": $gas_price,
  "timestamp": $timestamp,
  "type": "transfer"
}
EOF
}

# Function to broadcast transaction
broadcast_transaction() {
    local transaction_data=$1
    
    log "Broadcasting transaction..."
    
    # Send transaction to API
    local response=$(curl -s -X POST "$API_ENDPOINT/api/v1/transactions" \
        -H "Content-Type: application/json" \
        -d "$transaction_data")
    
    # Parse response
    local tx_hash=$(echo "$response" | jq -r '.hash // empty')
    
    if [[ -n "$tx_hash" && "$tx_hash" != "null" ]]; then
        log_success "Transaction broadcasted: $tx_hash"
        echo "$tx_hash"
    else
        log_error "Failed to broadcast transaction: $response"
        echo ""
    fi
}

# Function to send validator heartbeat
send_validator_heartbeat() {
    local validator_id=$1
    
    log "Sending heartbeat for $validator_id..."
    
    # Generate heartbeat data
    local timestamp=$(date +%s)
    local block_height=$(get_block_height)
    local peers_count=$(get_peers_count)
    local memory_usage=$(get_memory_usage)
    local cpu_usage=$(get_cpu_usage)
    
    local heartbeat_data=$(cat << EOF
{
  "validator_id": "$validator_id",
  "timestamp": $timestamp,
  "block_height": $block_height,
  "peers_count": $peers_count,
  "memory_usage": $memory_usage,
  "cpu_usage": $cpu_usage,
  "status": "active",
  "version": "1.0.0"
}
EOF
)
    
    # Send heartbeat
    local response=$(curl -s -X POST "$API_ENDPOINT/api/v1/validators/heartbeat" \
        -H "Content-Type: application/json" \
        -d "$heartbeat_data")
    
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [[ "$success" == "true" ]]; then
        log_success "Heartbeat sent for $validator_id"
    else
        log_error "Failed to send heartbeat for $validator_id: $response"
    fi
}

# Function to get block height
get_block_height() {
    local response=$(curl -s "$API_ENDPOINT/api/v1/blockchain/status")
    echo "$response" | jq -r '.block_height // 0'
}

# Function to get peers count
get_peers_count() {
    local response=$(curl -s "$API_ENDPOINT/api/v1/network/peers")
    echo "$response" | jq -r '.peers_count // 0'
}

# Function to get memory usage
get_memory_usage() {
    # Get memory usage from system
    local memory_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    echo "$memory_usage"
}

# Function to get CPU usage
get_cpu_usage() {
    # Get CPU usage from system
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "$cpu_usage"
}

# Function to broadcast batch of transactions
broadcast_transaction_batch() {
    local batch_size=$1
    
    log "Broadcasting batch of $batch_size transactions..."
    
    local transactions=()
    local success_count=0
    local failure_count=0
    
    # Generate and broadcast transactions
    for ((i=0; i<batch_size; i++)); do
        # Generate random addresses
        local from_address="0x$(printf '%040x' $RANDOM)"
        local to_address="0x$(printf '%040x' $RANDOM)"
        local amount=$((100 + RANDOM % 10000))
        
        # Generate transaction
        local transaction=$(generate_test_transaction "$from_address" "$to_address" "$amount")
        
        # Broadcast transaction
        local tx_hash=$(broadcast_transaction "$transaction")
        
        if [[ -n "$tx_hash" ]]; then
            ((success_count++))
            transactions+=("$tx_hash")
        else
            ((failure_count++))
        fi
        
        # Small delay between transactions
        sleep 0.1
    done
    
    log_success "Batch completed: $success_count successful, $failure_count failed"
    
    # Return transaction hashes
    printf '%s\n' "${transactions[@]}"
}

# Function to monitor transaction status
monitor_transaction_status() {
    local tx_hash=$1
    
    log "Monitoring transaction status: $tx_hash"
    
    # Monitor for up to 5 minutes
    local timeout=300
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            log_warning "Transaction monitoring timeout: $tx_hash"
            break
        fi
        
        # Check transaction status
        local response=$(curl -s "$API_ENDPOINT/api/v1/transactions/$tx_hash")
        local status=$(echo "$response" | jq -r '.status // "unknown"')
        
        case $status in
            "confirmed")
                log_success "Transaction confirmed: $tx_hash"
                return 0
                ;;
            "pending")
                log "Transaction pending: $tx_hash"
                ;;
            "failed")
                log_error "Transaction failed: $tx_hash"
                return 1
                ;;
            *)
                log "Transaction status unknown: $tx_hash"
                ;;
        esac
        
        sleep 10
    done
}

# Function to run validator heartbeat loop
run_heartbeat_loop() {
    log "Starting validator heartbeat loop..."
    
    while true; do
        for validator_id in "${VALIDATOR_IDS[@]}"; do
            send_validator_heartbeat "$validator_id"
        done
        
        sleep $HEARTBEAT_INTERVAL
    done
}

# Function to run transaction broadcasting loop
run_transaction_loop() {
    log "Starting transaction broadcasting loop..."
    
    while true; do
        # Broadcast batch of transactions
        local transactions=()
        readarray -t transactions < <(broadcast_transaction_batch $MAX_TRANSACTIONS_PER_BATCH)
        
        # Monitor transaction status
        for tx_hash in "${transactions[@]}"; do
            if [[ -n "$tx_hash" ]]; then
                monitor_transaction_status "$tx_hash" &
            fi
        done
        
        sleep $TRANSACTION_INTERVAL
    done
}

# Function to run stress test
run_stress_test() {
    local duration=$1
    local transaction_rate=$2
    
    log "Starting stress test for $duration seconds at $transaction_rate tx/s..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local total_transactions=0
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # Calculate number of transactions for this interval
        local tx_count=$((transaction_rate / 10))  # Run every 100ms
        
        if [[ $tx_count -gt 0 ]]; then
            broadcast_transaction_batch $tx_count
            ((total_transactions += tx_count))
        fi
        
        sleep 0.1
    done
    
    local actual_duration=$(($(date +%s) - start_time))
    local actual_rate=$((total_transactions / actual_duration))
    
    log_success "Stress test completed:"
    echo "  Duration: $actual_duration seconds"
    echo "  Total transactions: $total_transactions"
    echo "  Actual rate: $actual_rate tx/s"
}

# Function to display network statistics
display_network_stats() {
    log "Fetching network statistics..."
    
    # Get blockchain status
    local blockchain_status=$(curl -s "$API_ENDPOINT/api/v1/blockchain/status")
    local block_height=$(echo "$blockchain_status" | jq -r '.block_height // 0')
    local total_transactions=$(echo "$blockchain_status" | jq -r '.total_transactions // 0')
    local network_hashrate=$(echo "$blockchain_status" | jq -r '.network_hashrate // 0')
    
    # Get network status
    local network_status=$(curl -s "$API_ENDPOINT/api/v1/network/status")
    local active_peers=$(echo "$network_status" | jq -r '.active_peers // 0')
    local total_peers=$(echo "$network_status" | jq -r '.total_peers // 0')
    
    # Get validator status
    local validator_status=$(curl -s "$API_ENDPOINT/api/v1/validators/status")
    local active_validators=$(echo "$validator_status" | jq -r '.active_validators // 0')
    local total_validators=$(echo "$validator_status" | jq -r '.total_validators // 0')
    
    echo ""
    echo "=== KALDRIX NETWORK STATISTICS ==="
    echo "Blockchain:"
    echo "  Block Height: $block_height"
    echo "  Total Transactions: $total_transactions"
    echo "  Network Hashrate: $network_hashrate H/s"
    echo ""
    echo "Network:"
    echo "  Active Peers: $active_peers / $total_peers"
    echo "  Peer Participation: $((active_peers * 100 / total_peers))%"
    echo ""
    echo "Validators:"
    echo "  Active Validators: $active_validators / $total_validators"
    echo "  Validator Participation: $((active_validators * 100 / total_validators))%"
    echo ""
}

# Function to cleanup background processes
cleanup() {
    log "Cleaning up background processes..."
    
    # Kill all background jobs
    jobs -p | xargs -r kill
    
    log_success "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    local command=${1:-help}
    
    case $command in
        "heartbeat")
            log "Starting validator heartbeat service..."
            run_heartbeat_loop
            ;;
        "transactions")
            log "Starting transaction broadcasting service..."
            run_transaction_loop
            ;;
        "stress")
            local duration=${2:-300}
            local rate=${3:-100}
            run_stress_test $duration $rate
            ;;
        "stats")
            display_network_stats
            ;;
        "monitor")
            log "Starting full monitoring service..."
            
            # Start heartbeat in background
            run_heartbeat_loop &
            
            # Start transaction broadcasting in background
            run_transaction_loop &
            
            # Display stats periodically
            while true; do
                display_network_stats
                sleep 60
            done
            ;;
        "help"|*)
            echo "KALDRIX Transaction Broadcasting & Validator Heartbeat Script"
            echo ""
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  heartbeat              Run validator heartbeat service"
            echo "  transactions          Run transaction broadcasting service"
            echo "  stress [duration] [rate]  Run stress test"
            echo "  stats                 Display network statistics"
            echo "  monitor               Run full monitoring service"
            echo "  help                  Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 heartbeat"
            echo "  $0 transactions"
            echo "  $0 stress 300 100"
            echo "  $0 stats"
            echo "  $0 monitor"
            echo ""
            ;;
    esac
}

# Execute main function
main "$@"