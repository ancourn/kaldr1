#!/bin/bash
# scripts/auto-recover-blockchain.sh
set -e

NODE_NAME="blockchain-node"
MAX_RETRIES=3
RETRY_DELAY=60

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_sync_status() {
    local sync_progress=$(curl -s https://blockchain.kaldr1.com/api/status | jq '.sync_progress // 0')
    echo "$sync_progress"
}

check_peer_count() {
    local peer_count=$(curl -s https://blockchain.kaldr1.com/api/net_info | jq '.result.n_peers // 0')
    echo "$peer_count"
}

restart_node() {
    log "Restarting $NODE_NAME..."
    docker-compose -f docker-compose.prod.yml restart "$NODE_NAME"
    sleep "$RETRY_DELAY"
}

reset_peer_connections() {
    log "Resetting peer connections..."
    docker-compose -f docker-compose.prod.yml exec "$NODE_NAME" pkill -f blockchain
    sleep 10
    docker-compose -f docker-compose.prod.yml restart "$NODE_NAME"
    sleep "$RETRY_DELAY"
}

# Main recovery logic
log "Starting auto-recovery for $NODE_NAME..."

for ((i=1; i<=MAX_RETRIES; i++)); do
    log "Attempt $i/$MAX_RETRIES"
    
    # Check current status
    sync_progress=$(check_sync_status)
    peer_count=$(check_peer_count)
    log "Sync progress: $sync_progress%, Peer count: $peer_count"
    
    # Check if node is healthy (sync progress > 95% and peer count > 3)
    if (( $(echo "$sync_progress > 95" | bc -l) )) && [ "$peer_count" -gt 3 ]; then
        log "Node is healthy. No recovery needed."
        exit 0
    fi
    
    # Attempt recovery
    if [ $i -eq 1 ]; then
        log "Attempting node restart..."
        restart_node
    elif [ $i -eq 2 ]; then
        log "Resetting peer connections..."
        reset_peer_connections
    else
        log "Attempting full reset..."
        docker-compose -f docker-compose.prod.yml down "$NODE_NAME"
        sleep 30
        docker-compose -f docker-compose.prod.yml up -d "$NODE_NAME"
        sleep "$RETRY_DELAY"
    fi
    
    # Check if recovery worked
    sync_progress=$(check_sync_status)
    peer_count=$(check_peer_count)
    if (( $(echo "$sync_progress > 95" | bc -l) )) && [ "$peer_count" -gt 3 ]; then
        log "Recovery successful!"
        exit 0
    fi
    
    log "Recovery attempt failed. Retrying..."
done

log "Auto-recovery failed after $MAX_RETRIES attempts. Manual intervention required."
exit 1