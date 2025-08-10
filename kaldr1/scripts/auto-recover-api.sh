#!/bin/bash
# scripts/auto-recover-api.sh
set -e

SERVICE_NAME="api-service"
MAX_RETRIES=3
RETRY_DELAY=30

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_health() {
    local url="https://api.kaldr1.com/health"
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    echo "$status_code"
}

restart_service() {
    log "Restarting $SERVICE_NAME..."
    docker-compose -f docker-compose.prod.yml restart "$SERVICE_NAME"
    sleep "$RETRY_DELAY"
}

scale_service() {
    local scale_count=$1
    log "Scaling $SERVICE_NAME to $scale_count instances..."
    docker-compose -f docker-compose.prod.yml up -d --scale "$SERVICE_NAME=$scale_count"
    sleep "$RETRY_DELAY"
}

# Main recovery logic
log "Starting auto-recovery for $SERVICE_NAME..."

for ((i=1; i<=MAX_RETRIES; i++)); do
    log "Attempt $i/$MAX_RETRIES"
    
    # Check current health
    health_status=$(check_health)
    log "Health check status: $health_status"
    
    if [ "$health_status" == "200" ]; then
        log "Service is healthy. No recovery needed."
        exit 0
    fi
    
    # Attempt recovery
    if [ $i -eq 1 ]; then
        log "Attempting service restart..."
        restart_service
    elif [ $i -eq 2 ]; then
        log "Scaling service to 2 instances..."
        scale_service 2
    else
        log "Scaling service to 3 instances..."
        scale_service 3
    fi
    
    # Check if recovery worked
    health_status=$(check_health)
    if [ "$health_status" == "200" ]; then
        log "Recovery successful!"
        exit 0
    fi
    
    log "Recovery attempt failed. Retrying..."
done

log "Auto-recovery failed after $MAX_RETRIES attempts. Manual intervention required."
exit 1