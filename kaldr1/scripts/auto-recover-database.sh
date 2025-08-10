#!/bin/bash
# scripts/auto-recover-database.sh
set -e

DB_NAME="postgres"
MAX_RETRIES=3
RETRY_DELAY=30

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_database_health() {
    local health_check=$(docker-compose -f docker-compose.prod.yml exec "$DB_NAME" psql -U postgres -d kaldr1 -c "SELECT 1;" 2>/dev/null | grep -c "1" || echo "0")
    echo "$health_check"
}

restart_database() {
    log "Restarting $DB_NAME..."
    docker-compose -f docker-compose.prod.yml restart "$DB_NAME"
    sleep "$RETRY_DELAY"
}

check_connections() {
    local connection_count=$(docker-compose -f docker-compose.prod.yml exec "$DB_NAME" psql -U postgres -d kaldr1 -c "SELECT count(*) FROM pg_stat_activity;" -t | head -n 1 | tr -d ' ')
    echo "$connection_count"
}

kill_long_running_queries() {
    log "Killing long-running queries..."
    docker-compose -f docker-compose.prod.yml exec "$DB_NAME" psql -U postgres -d kaldr1 -c "
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE (now() - pg_stat_activity.query_start) > interval '30 minutes'
    AND pid <> pg_backend_pid();"
}

increase_max_connections() {
    log "Increasing max connections..."
    docker-compose -f docker-compose.prod.yml exec "$DB_NAME" psql -U postgres -d kaldr1 -c "ALTER SYSTEM SET max_connections = 500;"
    docker-compose -f docker-compose.prod.yml restart "$DB_NAME"
    sleep "$RETRY_DELAY"
}

# Main recovery logic
log "Starting auto-recovery for $DB_NAME..."

for ((i=1; i<=MAX_RETRIES; i++)); do
    log "Attempt $i/$MAX_RETRIES"
    
    # Check current health
    db_health=$(check_database_health)
    log "Database health check: $db_health"
    
    if [ "$db_health" == "1" ]; then
        log "Database is healthy. No recovery needed."
        exit 0
    fi
    
    # Attempt recovery
    if [ $i -eq 1 ]; then
        log "Attempting database restart..."
        restart_database
    elif [ $i -eq 2 ]; then
        log "Checking and managing connections..."
        connection_count=$(check_connections)
        log "Current connection count: $connection_count"
        
        if [ "$connection_count" -gt 100 ]; then
            log "High connection count detected. Killing long-running queries..."
            kill_long_running_queries
            sleep 10
        fi
        
        restart_database
    else
        log "Attempting to increase max connections and restart..."
        increase_max_connections
    fi
    
    # Check if recovery worked
    db_health=$(check_database_health)
    if [ "$db_health" == "1" ]; then
        log "Recovery successful!"
        exit 0
    fi
    
    log "Recovery attempt failed. Retrying..."
done

log "Auto-recovery failed after $MAX_RETRIES attempts. Manual intervention required."
exit 1