#!/bin/bash

<<<<<<< HEAD
# KALDRIX Health Check System
# This script provides comprehensive health checks for zero-downtime deployments

set -e

# Configuration
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=10
MAX_RETRIES=3
SERVICES=("frontend" "backend" "blockchain" "websocket" "database" "redis")

=======
# KALDRIX Health Check Script
# This script checks the health of all nodes in the testnet

set -e

>>>>>>> f46aed39bb4f6e27a70aca0d026937b7c67c8ce6
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

<<<<<<< HEAD
# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Health check functions
check_frontend_health() {
    local url="$1"
    local max_retries="$2"
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f -s "$url/api/health" > /dev/null 2>&1; then
            log_info "✓ Frontend health check passed"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $max_retries ]]; then
                log_warn "Frontend health check failed, retrying... ($retry_count/$max_retries)"
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "✗ Frontend health check failed after $max_retries attempts"
    return 1
}

check_backend_health() {
    local url="$1"
    local max_retries="$2"
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f -s "$url/api/health" > /dev/null 2>&1; then
            log_info "✓ Backend health check passed"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $max_retries ]]; then
                log_warn "Backend health check failed, retrying... ($retry_count/$max_retries)"
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "✗ Backend health check failed after $max_retries attempts"
    return 1
}

check_blockchain_health() {
    local url="$1"
    local max_retries="$2"
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            # Additional blockchain-specific checks
            local block_height=$(curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "$url" | jq -r '.result')
            if [[ "$block_height" != "null" && "$block_height" != "" ]]; then
                log_info "✓ Blockchain health check passed (Block height: $block_height)"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -lt $max_retries ]]; then
            log_warn "Blockchain health check failed, retrying... ($retry_count/$max_retries)"
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log_error "✗ Blockchain health check failed after $max_retries attempts"
    return 1
}

check_websocket_health() {
    local url="$1"
    local max_retries="$2"
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        # Test WebSocket connectivity
        if timeout $HEALTH_CHECK_TIMEOUT websocat "$url" > /dev/null 2>&1; then
            log_info "✓ WebSocket health check passed"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $max_retries ]]; then
                log_warn "WebSocket health check failed, retrying... ($retry_count/$max_retries)"
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "✗ WebSocket health check failed after $max_retries attempts"
    return 1
}

check_database_health() {
    local host="$1"
    local max_retries="$2"
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if pg_isready -h "$host" -U kaldrix -d kaldrix_prod > /dev/null 2>&1; then
            # Additional database-specific checks
            if psql -h "$host" -U kaldrix -d kaldrix_prod -c "SELECT 1;" > /dev/null 2>&1; then
                log_info "✓ Database health check passed"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -lt $max_retries ]]; then
            log_warn "Database health check failed, retrying... ($retry_count/$max_retries)"
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log_error "✗ Database health check failed after $max_retries attempts"
    return 1
}

check_redis_health() {
    local host="$1"
    local max_retries="$2"
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if redis-cli -h "$host" ping > /dev/null 2>&1; then
            log_info "✓ Redis health check passed"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $max_retries ]]; then
                log_warn "Redis health check failed, retrying... ($retry_count/$max_retries)"
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "✗ Redis health check failed after $max_retries attempts"
    return 1
}

check_load_balancer_health() {
    local url="$1"
    local max_retries="$2"
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f -s "$url/health" > /dev/null 2>&1; then
            log_info "✓ Load balancer health check passed"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $max_retries ]]; then
                log_warn "Load balancer health check failed, retrying... ($retry_count/$max_retries)"
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log_error "✗ Load balancer health check failed after $max_retries attempts"
    return 1
}

check_ssl_certificate() {
    local domain="$1"
    local max_retries="$2"
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if openssl s_client -connect "$domain:443" -servername "$domain" < /dev/null 2>/dev/null | openssl x509 -noout -dates | grep -q "notAfter"; then
            local expiry_date=$(openssl s_client -connect "$domain:443" -servername "$domain" < /dev/null 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
            local expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [[ $days_until_expiry -gt 7 ]]; then
                log_info "✓ SSL certificate check passed (Expires in $days_until_expiry days)"
                return 0
            else
                log_warn "SSL certificate expires in $days_until_expiry days"
                return 1
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -lt $max_retries ]]; then
            log_warn "SSL certificate check failed, retrying... ($retry_count/$max_retries)"
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log_error "✗ SSL certificate check failed after $max_retries attempts"
    return 1
}

comprehensive_health_check() {
    local environment="$1"
    log_info "Starting comprehensive health check for $environment environment..."
    
    local failed_checks=0
    
    # Define service URLs based on environment
    if [[ "$environment" == "production" ]]; then
        local frontend_url="https://kaldrix.com"
        local backend_url="https://api.kaldrix.com"
        local blockchain_url="https://node.kaldrix.com"
        local websocket_url="wss://ws.kaldrix.com"
        local database_host="prod-db.kaldrix.com"
        local redis_host="prod-redis.kaldrix.com"
        local load_balancer_url="https://kaldrix.com"
        local ssl_domain="kaldrix.com"
    elif [[ "$environment" == "staging" ]]; then
        local frontend_url="https://staging.kaldrix.com"
        local backend_url="https://staging-api.kaldrix.com"
        local blockchain_url="https://staging-node.kaldrix.com"
        local websocket_url="wss://staging-ws.kaldrix.com"
        local database_host="staging-db.kaldrix.com"
        local redis_host="staging-redis.kaldrix.com"
        local load_balancer_url="https://staging.kaldrix.com"
        local ssl_domain="staging.kaldrix.com"
    else
        log_error "Unknown environment: $environment"
        return 1
    fi
    
    # Run all health checks
    check_frontend_health "$frontend_url" $MAX_RETRIES || ((failed_checks++))
    check_backend_health "$backend_url" $MAX_RETRIES || ((failed_checks++))
    check_blockchain_health "$blockchain_url" $MAX_RETRIES || ((failed_checks++))
    check_websocket_health "$websocket_url" $MAX_RETRIES || ((failed_checks++))
    check_database_health "$database_host" $MAX_RETRIES || ((failed_checks++))
    check_redis_health "$redis_host" $MAX_RETRIES || ((failed_checks++))
    check_load_balancer_health "$load_balancer_url" $MAX_RETRIES || ((failed_checks++))
    check_ssl_certificate "$ssl_domain" $MAX_RETRIES || ((failed_checks++))
    
    # Summary
    if [[ $failed_checks -eq 0 ]]; then
        log_info "🎉 All health checks passed for $environment environment"
        return 0
    else
        log_error "❌ $failed_checks health checks failed for $environment environment"
        return 1
    fi
}

deployment_health_check() {
    local environment="$1"
    local deployment_type="$2"
    
    log_info "Running deployment health check for $environment environment ($deployment_type deployment)..."
    
    # Wait for deployment to start
    sleep 30
    
    # Run comprehensive health check
    if comprehensive_health_check "$environment"; then
        log_info "✓ Deployment health check passed"
        return 0
    else
        log_error "✗ Deployment health check failed"
        return 1
    fi
}

rolling_update_health_check() {
    local namespace="$1"
    local deployment_name="$2"
    
    log_info "Monitoring rolling update for $deployment_name in $namespace namespace..."
    
    # Watch deployment status
    local timeout=600  # 10 minutes
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed_time=$((current_time - start_time))
        
        if [[ $elapsed_time -gt $timeout ]]; then
            log_error "Rolling update timeout for $deployment_name"
            return 1
        fi
        
        # Check deployment status
        local status=$(kubectl rollout status deployment/$deployment_name -n $namespace --timeout=10s 2>&1)
        
        if [[ $? -eq 0 ]]; then
            log_info "✓ Rolling update completed for $deployment_name"
            return 0
        else
            log_debug "Rolling update in progress for $deployment_name..."
            sleep 10
        fi
    done
}

main() {
    local action="$1"
    local environment="$2"
    
    case "$action" in
        "comprehensive")
            comprehensive_health_check "$environment"
            ;;
        "deployment")
            deployment_health_check "$environment" "$3"
            ;;
        "rolling-update")
            rolling_update_health_check "$environment" "$3"
            ;;
        *)
            echo "Usage: $0 {comprehensive|deployment|rolling-update} <environment> [deployment_type|deployment_name]"
            echo "  comprehensive: Run comprehensive health check"
            echo "  deployment: Run deployment health check"
            echo "  rolling-update: Monitor rolling update progress"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
=======
echo -e "${BLUE}🏥 KALDRIX Mini-Testnet Health Check${NC}"
echo -e "${BLUE}====================================${NC}"

# Configuration
BASE_PORT=3000
NODE_COUNT=3

# Check if testnet config exists
if [ ! -f "testnet-config.json" ]; then
    echo -e "${RED}❌ Testnet configuration not found. Please deploy first.${NC}"
    exit 1
fi

# Load testnet configuration
echo -e "${YELLOW}📋 Loading testnet configuration...${NC}"
NODES=$(python3 -c "
import json
with open('testnet-config.json', 'r') as f:
    config = json.load(f)
for node in config['nodes']:
    print(f'{node[\"id\"]}:{node[\"port\"]}:{node[\"apiPort\"]}')
")

HEALTHY_NODES=0
TOTAL_NODES=0

# Check each node
echo -e "${YELLOW}🔍 Checking node health...${NC}"
for NODE_INFO in $NODES; do
    TOTAL_NODES=$((TOTAL_NODES + 1))
    NODE_ID=$(echo $NODE_INFO | cut -d: -f1)
    NODE_PORT=$(echo $NODE_INFO | cut -d: -f2)
    API_PORT=$(echo $NODE_INFO | cut -d: -f3)
    
    echo -e "${BLUE}📡 Checking $NODE_ID (port $NODE_PORT)...${NC}"
    
    # Check HTTP health endpoint
    if curl -s "http://localhost:$NODE_PORT/health" > /dev/null; then
        echo -e "${GREEN}✅ HTTP health check passed${NC}"
        
        # Get detailed health info
        HEALTH_INFO=$(curl -s "http://localhost:$NODE_PORT/health" 2>/dev/null || echo "{}")
        
        # Check API endpoint
        if curl -s "http://localhost:$API_PORT/api/metrics?endpoint=health" > /dev/null; then
            echo -e "${GREEN}✅ API health check passed${NC}"
            HEALTHY_NODES=$((HEALTHY_NODES + 1))
        else
            echo -e "${RED}❌ API health check failed${NC}"
        fi
    else
        echo -e "${RED}❌ HTTP health check failed${NC}"
    fi
    
    # Check WebSocket connection
    echo -e "${BLUE}🔌 Checking WebSocket connection...${NC}"
    if timeout 5 bash -c "</dev/tcp/localhost/$((NODE_PORT + 1000))" 2>/dev/null; then
        echo -e "${GREEN}✅ WebSocket connection available${NC}"
    else
        echo -e "${YELLOW}⚠️  WebSocket connection not available${NC}"
    fi
    
    echo -e "${BLUE}---${NC}"
done

# Check dashboard
echo -e "${YELLOW}📊 Checking dashboard...${NC}"
if curl -s "http://localhost:3000/" > /dev/null; then
    echo -e "${GREEN}✅ Dashboard is accessible${NC}"
else
    echo -e "${RED}❌ Dashboard is not accessible${NC}"
fi

# Display summary
echo -e "${BLUE}📊 Health Check Summary${NC}"
echo -e "${BLUE}========================${NC}"
echo -e "${GREEN}✅ Healthy nodes: $HEALTHY_NODES/$TOTAL_NODES${NC}"
echo -e "${GREEN}✅ Overall health: $((HEALTHY_NODES * 100 / TOTAL_NODES))%${NC}"

if [ $HEALTHY_NODES -eq $TOTAL_NODES ]; then
    echo -e "${GREEN}🎉 All nodes are healthy!${NC}"
    exit 0
elif [ $HEALTHY_NODES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some nodes are degraded${NC}"
    exit 1
else
    echo -e "${RED}❌ No healthy nodes found${NC}"
    exit 2
fi
>>>>>>> f46aed39bb4f6e27a70aca0d026937b7c67c8ce6
