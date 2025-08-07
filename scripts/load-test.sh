#!/bin/bash

# KALDRIX Load Testing Script
# This script performs comprehensive load testing of the blockchain

set -e

echo "🚀 KALDRIX Load Testing"
echo "======================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost:8080"
TEST_DURATION=60
CONCURRENT_USERS=100
TRANSACTIONS_PER_USER=10
RESULTS_FILE="load-test-results-$(date +%Y%m%d_%H%M%S).json"
REPORT_FILE="load-test-report-$(date +%Y%m%d_%H%M%S).md"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[LOAD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if blockchain is running
check_blockchain_status() {
    print_status "Checking blockchain status..."
    
    if curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
        print_success "Blockchain is accessible"
        return 0
    else
        print_error "Blockchain is not accessible at $BASE_URL"
        return 1
    fi
}

# Function to generate test identity
generate_test_identity() {
    local user_id=$1
    curl -s -X POST "$BASE_URL/api/identity/generate" \
        -H "Content-Type: application/json" \
        -d "{\"algorithm\":\"ed25519\",\"metadata\":{\"test_user\":\"$user_id\"}}" | \
        jq -r '.public_key'
}

# Function to create transaction
create_transaction() {
    local sender_key=$1
    local receiver_key=$2
    local amount=$3
    local nonce=$4
    
    local response=$(curl -s -X POST "$BASE_URL/api/transactions" \
        -H "Content-Type: application/json" \
        -d "{\"sender\":\"$sender_key\",\"receiver\":\"$receiver_key\",\"amount\":$amount,\"nonce\":$nonce,\"fee\":1,\"metadata\":{\"load_test\":true}}")
    
    echo "$response"
}

# Function to run transaction load test
run_transaction_load_test() {
    print_status "Running transaction load test..."
    
    local start_time=$(date +%s)
    local total_transactions=0
    local successful_transactions=0
    local failed_transactions=0
    local response_times=()
    
    # Generate test identities
    print_status "Generating test identities..."
    declare -a identities
    
    for i in $(seq 1 $CONCURRENT_USERS); do
        local identity=$(generate_test_identity "user_$i")
        if [ -n "$identity" ] && [ "$identity" != "null" ]; then
            identities[i]="$identity"
        else
            print_error "Failed to generate identity for user_$i"
            exit 1
        fi
    done
    
    print_success "Generated $CONCURRENT_USERS test identities"
    
    # Run concurrent transaction test
    print_status "Running concurrent transaction test..."
    
    # Create temporary file for results
    local temp_file="/tmp/load_test_$$.txt"
    
    # Run transactions in parallel
    for user in $(seq 1 $CONCURRENT_USERS); do
        (
            local user_successful=0
            local user_failed=0
            local user_response_times=()
            
            for tx in $(seq 1 $TRANSACTIONS_PER_USER); do
                local start_time=$(date +%s%N)
                local receiver_idx=$(( (user + tx) % CONCURRENT_USERS + 1 ))
                local receiver_key=${identities[$receiver_idx]}
                
                if [ -n "$receiver_key" ]; then
                    local response=$(create_transaction "${identities[$user]}" "$receiver_key" $((tx * 10)) $tx)
                    local end_time=$(date +%s%N)
                    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
                    
                    if echo "$response" | grep -q "transaction_id"; then
                        user_successful=$((user_successful + 1))
                    else
                        user_failed=$((user_failed + 1))
                    fi
                    
                    user_response_times+=($response_time)
                fi
            done
            
            # Calculate user statistics
            local total_time=0
            for rt in "${user_response_times[@]}"; do
                total_time=$((total_time + rt))
            done
            local avg_time=$((total_time / ${#user_response_times[@]}))
            
            echo "user_$user: $user_successful successful, $user_failed failed, avg ${avg_time}ms" >> "$temp_file"
        ) &
    done
    
    # Wait for all background processes to complete
    wait
    
    # Parse results
    while IFS= read -r line; do
        if [[ $line =~ successful:\ ([0-9]+) ]]; then
            successful_transactions=$((successful_transactions + ${BASH_REMATCH[1]}))
        fi
        if [[ $line =~ failed:\ ([0-9]+) ]]; then
            failed_transactions=$((failed_transactions + ${BASH_REMATCH[1]}))
        fi
        if [[ $line =~ avg\ ([0-9]+)ms ]]; then
            response_times+=(${BASH_REMATCH[1]})
        fi
    done < "$temp_file"
    
    total_transactions=$((successful_transactions + failed_transactions))
    
    # Calculate statistics
    local total_response_time=0
    for rt in "${response_times[@]}"; do
        total_response_time=$((total_response_time + rt))
    done
    local avg_response_time=$((total_response_time / ${#response_times[@]}))
    
    # Sort response times for percentiles
    IFS=$'\n' sorted_times=($(sort -n <<<"${response_times[*]}"))
    unset IFS
    
    local p50_index=$((${#sorted_times[@]} * 50 / 100))
    local p95_index=$((${#sorted_times[@]} * 95 / 100))
    local p99_index=$((${#sorted_times[@]} * 99 / 100))
    
    local p50_response_time=${sorted_times[$p50_index]}
    local p95_response_time=${sorted_times[$p95_index]}
    local p99_response_time=${sorted_times[$p99_index]}
    
    # Calculate transactions per second
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local tps=$((total_transactions / duration))
    
    # Store results
    cat > "$RESULTS_FILE" << EOF
{
  "test_type": "transaction_load_test",
  "start_time": $start_time,
  "end_time": $end_time,
  "duration_seconds": $duration,
  "concurrent_users": $CONCURRENT_USERS,
  "transactions_per_user": $TRANSACTIONS_PER_USER,
  "total_transactions": $total_transactions,
  "successful_transactions": $successful_transactions,
  "failed_transactions": $failed_transactions,
  "success_rate": $((successful_transactions * 100 / total_transactions)),
  "transactions_per_second": $tps,
  "response_times": {
    "average_ms": $avg_response_time,
    "p50_ms": $p50_response_time,
    "p95_ms": $p95_response_time,
    "p99_ms": $p99_response_time
  }
}
EOF
    
    print_success "Transaction load test completed"
    print_status "Results saved to: $RESULTS_FILE"
    
    # Return results
    echo "$successful_transactions,$failed_transactions,$tps,$avg_response_time,$p95_response_time,$p99_response_time"
}

# Function to run API load test
run_api_load_test() {
    print_status "Running API load test..."
    
    local start_time=$(date +%s)
    local total_requests=0
    local successful_requests=0
    local failed_requests=0
    local response_times=()
    
    # Test different API endpoints
    local endpoints=("/api/blockchain/status" "/api/health" "/metrics")
    
    # Create temporary file for results
    local temp_file="/tmp/api_load_test_$$.txt"
    
    # Run API requests in parallel
    for user in $(seq 1 $CONCURRENT_USERS); do
        (
            local user_successful=0
            local user_failed=0
            local user_response_times=()
            
            for req in $(seq 1 $TRANSACTIONS_PER_USER); do
                local endpoint=${endpoints[$((req % ${#endpoints[@]}))]}
                local start_time=$(date +%s%N)
                
                if curl -s -f "$BASE_URL$endpoint" > /dev/null; then
                    local end_time=$(date +%s%N)
                    local response_time=$(( (end_time - start_time) / 1000000 ))
                    user_successful=$((user_successful + 1))
                    user_response_times+=($response_time)
                else
                    user_failed=$((user_failed + 1))
                fi
            done
            
            # Calculate user statistics
            local total_time=0
            for rt in "${user_response_times[@]}"; do
                total_time=$((total_time + rt))
            done
            local avg_time=$((total_time / ${#user_response_times[@]}))
            
            echo "api_user_$user: $user_successful successful, $user_failed failed, avg ${avg_time}ms" >> "$temp_file"
        ) &
    done
    
    # Wait for all background processes to complete
    wait
    
    # Parse results
    while IFS= read -r line; do
        if [[ $line =~ successful:\ ([0-9]+) ]]; then
            successful_requests=$((successful_requests + ${BASH_REMATCH[1]}))
        fi
        if [[ $line =~ failed:\ ([0-9]+) ]]; then
            failed_requests=$((failed_requests + ${BASH_REMATCH[1]}))
        fi
        if [[ $line =~ avg\ ([0-9]+)ms ]]; then
            response_times+=(${BASH_REMATCH[1]})
        fi
    done < "$temp_file"
    
    total_requests=$((successful_requests + failed_requests))
    
    # Calculate statistics
    local total_response_time=0
    for rt in "${response_times[@]}"; do
        total_response_time=$((total_response_time + rt))
    done
    local avg_response_time=$((total_response_time / ${#response_times[@]}))
    
    # Sort response times for percentiles
    IFS=$'\n' sorted_times=($(sort -n <<<"${response_times[*]}"))
    unset IFS
    
    local p50_index=$((${#sorted_times[@]} * 50 / 100))
    local p95_index=$((${#sorted_times[@]} * 95 / 100))
    local p99_index=$((${#sorted_times[@]} * 99 / 100))
    
    local p50_response_time=${sorted_times[$p50_index]}
    local p95_response_time=${sorted_times[$p95_index]}
    local p99_response_time=${sorted_times[$p99_index]}
    
    # Calculate requests per second
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local rps=$((total_requests / duration))
    
    print_success "API load test completed"
    
    # Return results
    echo "$successful_requests,$failed_requests,$rps,$avg_response_time,$p95_response_time,$p99_response_time"
}

# Function to run stress test
run_stress_test() {
    print_status "Running stress test..."
    
    local start_time=$(date +%s)
    local max_users=500
    local step_size=50
    local current_users=$step_size
    
    print_status "Starting stress test with incremental user load..."
    
    while [ $current_users -le $max_users ]; do
        print_status "Testing with $current_users concurrent users..."
        
        local start_time_step=$(date +%s)
        local successful=0
        local failed=0
        
        # Run test with current user count
        for user in $(seq 1 $current_users); do
            (
                if curl -s -f "$BASE_URL/api/health" > /dev/null; then
                    echo "success" >> "/tmp/stress_test_$$.txt"
                else
                    echo "failed" >> "/tmp/stress_test_$$.txt"
                fi
            ) &
        done
        
        wait
        
        # Count results
        successful=$(grep -c "success" "/tmp/stress_test_$$.txt" || echo "0")
        failed=$(grep -c "failed" "/tmp/stress_test_$$.txt" || echo "0")
        
        local success_rate=$((successful * 100 / (successful + failed)))
        local end_time_step=$(date +%s)
        local duration_step=$((end_time_step - start_time_step))
        
        print_status "Users: $current_users, Success: $successful, Failed: $failed, Success Rate: ${success_rate}%, Duration: ${duration_step}s"
        
        # Check if system is under stress (success rate < 95%)
        if [ $success_rate -lt 95 ]; then
            print_warning "System under stress detected at $current_users users"
            break
        fi
        
        current_users=$((current_users + step_size))
        
        # Clean up
        rm -f "/tmp/stress_test_$$.txt"
    done
    
    local max_successful_users=$((current_users - step_size))
    
    print_success "Stress test completed"
    print_status "Maximum successful concurrent users: $max_successful_users"
    
    echo "$max_successful_users"
}

# Function to generate load test report
generate_load_test_report() {
    print_status "Generating load test report..."
    
    # Read results from files
    local tx_results=$(cat "$RESULTS_FILE" | jq '.response_times')
    local api_results=$api_results
    local stress_results=$stress_results
    
    cat > "$REPORT_FILE" << EOF
# KALDRIX Load Test Report

**Generated:** $(date)
**Test Duration:** $TEST_DURATION seconds
**Concurrent Users:** $CONCURRENT_USERS
**Transactions Per User:** $TRANSACTIONS_PER_USER

## Executive Summary

This load test report provides a comprehensive analysis of the KALDRIX blockchain's performance under various load conditions. The test covers transaction processing, API responsiveness, and system stress testing.

## Test Results

### Transaction Load Test
$(cat "$RESULTS_FILE" | jq -r '"- Total Transactions: \(.total_transactions)
- Successful Transactions: \(.successful_transactions)
- Failed Transactions: \(.failed_transactions)
- Success Rate: \(.success_rate)%
- Transactions Per Second: \(.transactions_per_second)
- Average Response Time: \(.response_times.average_ms)ms
- 95th Percentile: \(.response_times.p95_ms)ms
- 99th Percentile: \(.response_times.p99_ms)ms"')

### API Load Test
- Successful API Requests: $api_successful_requests
- Failed API Requests: $api_failed_requests
- Requests Per Second: $api_rps
- Average Response Time: ${api_avg_response_time}ms
- 95th Percentile: ${api_p95_response_time}ms
- 99th Percentile: ${api_p99_response_time}ms

### Stress Test
- Maximum Successful Concurrent Users: $max_successful_users
- Stress Threshold: $((max_successful_users + step_size)) users

## Performance Analysis

### Transaction Processing
- **Throughput:** $(cat "$RESULTS_FILE" | jq '.transactions_per_second') TPS
- **Success Rate:** $(cat "$RESULTS_FILE" | jq '.success_rate')%
- **Latency:** P95: $(cat "$RESULTS_FILE" | jq '.response_times.p95_ms')ms, P99: $(cat "$RESULTS_FILE" | jq '.response_times.p99_ms')ms

### API Performance
- **Throughput:** $api_rps RPS
- **Success Rate:** $((api_successful_requests * 100 / (api_successful_requests + api_failed_requests)))%
- **Latency:** P95: ${api_p95_response_time}ms, P99: ${api_p99_response_time}ms

### System Scalability
- **Maximum Concurrent Users:** $max_successful_users
- **Stress Point:** $((max_successful_users + step_size)) users

## Benchmark Comparison

### Industry Standards
- **Blockchain TPS:** Bitcoin (7 TPS), Ethereum (15-30 TPS), High-performance blockchains (1000+ TPS)
- **API Response Time:** < 100ms (excellent), < 200ms (good), < 500ms (acceptable)
- **Success Rate:** > 99% (excellent), > 95% (good), > 90% (acceptable)

### KALDRIX Performance
- **Transaction Throughput:** $(cat "$RESULTS_FILE" | jq '.transactions_per_second') TPS
- **API Response Time:** P95: ${api_p95_response_time}ms
- **Success Rate:** $(cat "$RESULTS_FILE" | jq '.success_rate')%

## Recommendations

### Performance Optimizations
1. **Database Optimization:** Consider database indexing and query optimization
2. **Caching:** Implement response caching for frequently accessed data
3. **Connection Pooling:** Optimize database and network connection pooling
4. **Load Balancing:** Implement load balancing for better distribution

### Scaling Strategies
1. **Horizontal Scaling:** Add more nodes to handle increased load
2. **Vertical Scaling:** Upgrade server resources (CPU, RAM, Network)
3. **Sharding:** Implement data sharding for better performance
4. **CDN:** Use CDN for static content delivery

### Monitoring
1. **Real-time Monitoring:** Implement real-time performance monitoring
2. **Alerting:** Set up alerts for performance degradation
3. **Logging:** Enhance logging for performance analysis
4. **Metrics:** Collect detailed performance metrics

## System Information

### Test Environment
- **OS:** $(uname -a)
- **Rust Version:** $(rustc --version)
- **Test Date:** $(date)
- **Test Duration:** $TEST_DURATION seconds

### Configuration
- **Base URL:** $BASE_URL
- **Concurrent Users:** $CONCURRENT_USERS
- **Transactions Per User:** $TRANSACTIONS_PER_USER

## Raw Data

### Transaction Load Test Results
\`\`\`json
$(cat "$RESULTS_FILE")
\`\`\`

---

*This report was automatically generated by the KALDRIX load testing script.*
EOF

    print_success "Load test report generated: $REPORT_FILE"
}

# Main execution
main() {
    print_status "Starting KALDRIX load testing..."
    
    # Check if blockchain is running
    if ! check_blockchain_status; then
        print_error "Blockchain is not running. Please start the blockchain first."
        exit 1
    fi
    
    # Initialize variables
    local tx_results=""
    local api_results=""
    local stress_results=""
    local api_successful_requests=0
    local api_failed_requests=0
    local api_rps=0
    local api_avg_response_time=0
    local api_p95_response_time=0
    local api_p99_response_time=0
    local max_successful_users=0
    
    # Run load tests
    print_status "================================"
    print_status "Transaction Load Test"
    print_status "================================"
    tx_results=$(run_transaction_load_test)
    IFS=',' read -r tx_successful tx_failed tx_tps tx_avg tx_p95 tx_p99 <<< "$tx_results"
    
    print_status "================================"
    print_status "API Load Test"
    print_status "================================"
    api_results=$(run_api_load_test)
    IFS=',' read -r api_successful_requests api_failed_requests api_rps api_avg_response_time api_p95_response_time api_p99_response_time <<< "$api_results"
    
    print_status "================================"
    print_status "Stress Test"
    print_status "================================"
    stress_results=$(run_stress_test)
    max_successful_users=$stress_results
    
    # Generate final report
    print_status "================================"
    print_status "Load Test Summary"
    print_status "================================"
    print_status "Transaction Throughput: $tx_tps TPS"
    print_status "Transaction Success Rate: $((tx_successful * 100 / (tx_successful + tx_failed)))%"
    print_status "API Requests Per Second: $api_rps RPS"
    print_status "API Success Rate: $((api_successful_requests * 100 / (api_successful_requests + api_failed_requests)))%"
    print_status "Max Concurrent Users: $max_successful_users"
    
    # Performance assessment
    if [ $tx_tps -gt 1000 ]; then
        print_success "Excellent transaction throughput"
    elif [ $tx_tps -gt 100 ]; then
        print_success "Good transaction throughput"
    elif [ $tx_tps -gt 10 ]; then
        print_warning "Moderate transaction throughput"
    else
        print_error "Poor transaction throughput"
    fi
    
    if [ $api_avg_response_time -lt 100 ]; then
        print_success "Excellent API response time"
    elif [ $api_avg_response_time -lt 200 ]; then
        print_success "Good API response time"
    elif [ $api_avg_response_time -lt 500 ]; then
        print_warning "Moderate API response time"
    else
        print_error "Poor API response time"
    fi
    
    # Generate detailed report
    generate_load_test_report
    
    print_status "Load testing completed. Detailed report saved to: $REPORT_FILE"
    print_status "Raw results saved to: $RESULTS_FILE"
    
    # Clean up temporary files
    rm -f /tmp/load_test_*.txt /tmp/api_load_test_*.txt /tmp/stress_test_*.txt
    
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --duration)
            TEST_DURATION="$2"
            shift 2
            ;;
        --users)
            CONCURRENT_USERS="$2"
            shift 2
            ;;
        --transactions)
            TRANSACTIONS_PER_USER="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --url URL             Blockchain base URL (default: http://localhost:8080)"
            echo "  --duration SECONDS    Test duration in seconds (default: 60)"
            echo "  --users NUMBER        Concurrent users (default: 100)"
            echo "  --transactions NUMBER Transactions per user (default: 10)"
            echo "  --help, -h            Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"