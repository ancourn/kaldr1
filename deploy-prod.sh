#!/bin/bash

# KALDRIX Production Deployment Script
# This script handles the complete production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="kaldrix"
DOMAIN="kaldrix.io"
BACKUP_DIR="/opt/backups/kaldrix"
DEPLOY_USER="deploy"
DEPLOY_SERVER="prod.kaldrix.io"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if required files exist
check_requirements() {
    log "Checking deployment requirements..."
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        error "docker-compose.prod.yml not found"
    fi
    
    if [ ! -f ".env.prod" ]; then
        error ".env.prod not found"
    fi
    
    if [ ! -f "Dockerfile" ]; then
        error "Dockerfile not found"
    fi
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    log "All requirements satisfied"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    ssh $DEPLOY_USER@$DEPLOY_SERVER "
        mkdir -p $BACKUP_DIR
        docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb /tmp/redis_backup.rdb
        docker cp kaldrix-redis-prod:/tmp/redis_backup.rdb $BACKUP_DIR/redis_$(date +%Y%m%d_%H%M%S).rdb
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres kaldrix > $BACKUP_DIR/postgres_$(date +%Y%m%d_%H%M%S).sql
        tar -czf $BACKUP_DIR/kaldrix_$(date +%Y%m%d_%H%M%S).tar.gz \
            -C /opt/kaldrix/data . \
            -C /var/lib/letsencrypt . \
            2>/dev/null || true
    "
    
    log "Backup completed successfully"
}

# Deploy application
deploy_application() {
    log "Starting deployment..."
    
    # Copy files to server
    log "Copying files to production server..."
    rsync -avz --exclude='node_modules' --exclude='.git' --exclude='*.log' \
        ./ $DEPLOY_USER@$DEPLOY_SERVER:/opt/kaldrix/
    
    # Execute deployment on server
    ssh $DEPLOY_USER@$DEPLOY_SERVER "
        cd /opt/kaldrix
        
        # Load environment variables
        set -a
        source .env.prod
        set +a
        
        # Stop existing services
        log 'Stopping existing services...'
        docker-compose -f docker-compose.prod.yml down
        
        # Pull latest images
        log 'Pulling latest images...'
        docker-compose -f docker-compose.prod.yml pull
        
        # Build application
        log 'Building application...'
        docker-compose -f docker-compose.prod.yml build --no-cache
        
        # Start services
        log 'Starting services...'
        docker-compose -f docker-compose.prod.yml up -d
        
        # Wait for services to be ready
        log 'Waiting for services to be ready...'
        sleep 30
        
        # Run health checks
        log 'Running health checks...'
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            log 'Application health check passed'
        else
            error 'Application health check failed'
        fi
        
        if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
            log 'Prometheus health check passed'
        else
            warn 'Prometheus health check failed'
        fi
        
        # Clean up old images
        log 'Cleaning up old images...'
        docker image prune -f
        
        log 'Deployment completed successfully'
    "
}

# SSL Certificate Management
setup_ssl() {
    log "Setting up SSL certificates..."
    
    ssh $DEPLOY_USER@$DEPLOY_SERVER "
        cd /opt/kaldrix
        
        # Generate SSL certificates using Let's Encrypt
        if [ ! -d '/etc/letsencrypt/live/$DOMAIN' ]; then
            docker run --rm \
                -v /etc/letsencrypt:/etc/letsencrypt \
                -v /var/lib/letsencrypt:/var/lib/letsencrypt \
                certbot/certbot certonly --standalone \
                -d $DOMAIN -d www.$DOMAIN \
                -d api.$DOMAIN -d monitoring.$DOMAIN \
                --email $LETSENCRYPT_EMAIL \
                --agree-tos --non-interactive
        else
            # Renew existing certificates
            docker run --rm \
                -v /etc/letsencrypt:/etc/letsencrypt \
                -v /var/lib/letsencrypt:/var/lib/letsencrypt \
                certbot/certbot renew --dry-run
        fi
    "
    
    log "SSL certificates setup completed"
}

# Monitoring Setup
setup_monitoring() {
    log "Setting up monitoring..."
    
    ssh $DEPLOY_USER@$DEPLOY_SERVER "
        cd /opt/kaldrix
        
        # Create monitoring configuration
        mkdir -p monitoring/grafana/provisioning/dashboards
        mkdir -p monitoring/grafana/provisioning/datasources
        
        # Wait for Grafana to be ready
        until curl -f http://localhost:3001/api/health > /dev/null 2>&1; do
            log 'Waiting for Grafana to be ready...'
            sleep 5
        done
        
        # Import dashboards
        log 'Importing Grafana dashboards...'
        curl -X POST -H 'Content-Type: application/json' \
            -d '{"dashboard": "'$(cat monitoring/grafana/dashboards/kaldrix-overview.json | base64 -w 0)'"}' \
            http://admin:$GRAFANA_PASSWORD@localhost:3001/api/dashboards/db
        
        # Setup alerts
        log 'Setting up alerts...'
        curl -X POST -H 'Content-Type: application/json' \
            -d '{"name": "KALDRIX High Load", "query": "rate(node_cpu_seconds_total{mode=\"idle\"}[5m]) < 0.2", "duration": "5m", "severity": "warning"}' \
            http://admin:$GRAFANA_PASSWORD@localhost:3001/api/alerts
    "
    
    log "Monitoring setup completed"
}

# Security Hardening
security_hardening() {
    log "Applying security hardening..."
    
    ssh $DEPLOY_USER@$DEPLOY_SERVER "
        cd /opt/kaldrix
        
        # Set proper permissions
        chmod 600 .env.prod
        chmod 600 docker-compose.prod.yml
        
        # Configure firewall
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw deny from any to any port 3000
        sudo ufw deny from any to any port 3001
        sudo ufw deny from any to any port 9090
        
        # Setup fail2ban
        sudo systemctl enable fail2ban
        sudo systemctl start fail2ban
        
        # Configure log rotation
        sudo tee /etc/logrotate.d/kaldrix > /dev/null <<EOF
/opt/kaldrix/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/kaldrix/docker-compose.prod.yml exec traefik kill -USR1 1
    endscript
}
EOF
        
        # Setup automatic security updates
        sudo apt-get install -y unattended-upgrades
        sudo dpkg-reconfigure -f noninteractive unattended-upgrades
    "
    
    log "Security hardening completed"
}

# Main deployment process
main() {
    log "Starting KALDRIX production deployment..."
    
    check_requirements
    create_backup
    setup_ssl
    deploy_application
    setup_monitoring
    security_hardening
    
    log "Deployment completed successfully!"
    log "Application is now available at: https://$DOMAIN"
    log "Monitoring dashboard: https://monitoring.$DOMAIN"
    log "API endpoint: https://api.$DOMAIN"
}

# Run deployment
main "$@"