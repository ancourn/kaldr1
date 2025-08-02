#!/bin/bash

# KALDRIX Blockchain Production Deployment Script
# This script deploys the entire KALDRIX blockchain to production environment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
DEPLOYMENT_ENV="production"
DEPLOYMENT_USER="kaldrix"
DEPLOYMENT_HOST="kaldrix.com"
DEPLOYMENT_DIR="/opt/kaldrix"
BACKUP_DIR="/opt/kaldrix-backups"
LOG_FILE="/var/log/kaldrix-deployment.log"

# Production environment variables
export NODE_ENV="production"
export RUST_LOG="info"
export DATABASE_URL="sqlite:///data/blockchain.db"
export PROMETHEUS_METRICS="true"
export GRAFANA_DASHBOARD="true"

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error_exit "This script must be run as root"
    fi
}

# Create deployment user
create_deployment_user() {
    log "${BLUE}Creating deployment user...${NC}"
    
    if ! id "$DEPLOYMENT_USER" &>/dev/null; then
        useradd -m -s /bin/bash -d /home/$DEPLOYMENT_USER $DEPLOYMENT_USER
        usermod -aG sudo $DEPLOYMENT_USER
        log "${GREEN}✓ Created user: $DEPLOYMENT_USER${NC}"
    else
        log "${YELLOW}⚠ User $DEPLOYMENT_USER already exists${NC}"
    fi
}

# Update system packages
update_system() {
    log "${BLUE}Updating system packages...${NC}"
    
    apt update && apt upgrade -y
    apt install -y \
        curl wget git \
        build-essential \
        pkg-config \
        libssl-dev \
        sqlite3 \
        nginx \
        docker.io \
        docker-compose \
        prometheus \
        grafana \
        nodejs npm \
        ufw fail2ban \
        unattended-upgrades \
        logrotate \
        rsyslog
    
    log "${GREEN}✓ System packages updated${NC}"
}

# Configure firewall
configure_firewall() {
    log "${BLUE}Configuring firewall...${NC}"
    
    # Enable firewall
    ufw --force enable
    
    # Allow essential ports
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8080/tcp    # Blockchain API
    ufw allow 8999/tcp    # P2P Communication
    ufw allow 9090/tcp    # Prometheus
    ufw allow 3000/tcp    # Grafana
    
    # Rate limiting
    ufw limit ssh
    
    log "${GREEN}✓ Firewall configured${NC}"
}

# Create directory structure
create_directories() {
    log "${BLUE}Creating directory structure...${NC}"
    
    # Main deployment directory
    mkdir -p $DEPLOYMENT_DIR
    mkdir -p $DEPLOYMENT_DIR/{config,data,logs,scripts,ssl,backups}
    
    # Backup directory
    mkdir -p $BACKUP_DIR
    mkdir -p $BACKUP_DIR/{daily,weekly,monthly}
    
    # Set permissions
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_DIR
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $BACKUP_DIR
    chmod 750 $DEPLOYMENT_DIR
    chmod 750 $BACKUP_DIR
    
    log "${GREEN}✓ Directory structure created${NC}"
}

# Deploy blockchain application
deploy_blockchain() {
    log "${BLUE}Deploying blockchain application...${NC}"
    
    # Copy application files
    cp -r /home/z/my-project/src $DEPLOYMENT_DIR/
    cp -r /home/z/my-project/mobile-sdk $DEPLOYMENT_DIR/
    cp -r /home/z/my-project/config $DEPLOYMENT_DIR/
    cp -r /home/z/my-project/scripts $DEPLOYMENT_DIR/
    cp -r /home/z/my-project/docs $DEPLOYMENT_DIR/
    
    # Copy configuration files
    cp /home/z/my-project/Cargo.toml $DEPLOYMENT_DIR/
    cp /home/z/my-project/package.json $DEPLOYMENT_DIR/
    cp /home/z/my-project/next.config.ts $DEPLOYMENT_DIR/
    cp /home/z/my-project/tailwind.config.ts $DEPLOYMENT_DIR/
    
    # Set permissions
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_DIR
    find $DEPLOYMENT_DIR -type f -name "*.sh" -exec chmod +x {} \;
    
    log "${GREEN}✓ Blockchain application deployed${NC}"
}

# Build Rust application
build_rust_app() {
    log "${BLUE}Building Rust application...${NC}"
    
    cd $DEPLOYMENT_DIR
    
    # Install Rust if not present
    if ! command -v cargo &>/dev/null; then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    fi
    
    # Build release version
    cargo build --release
    
    log "${GREEN}✓ Rust application built${NC}"
}

# Build Next.js frontend
build_frontend() {
    log "${BLUE}Building Next.js frontend...${NC}"
    
    cd $DEPLOYMENT_DIR
    
    # Install Node.js dependencies
    npm install
    
    # Build production version
    npm run build
    
    log "${GREEN}✓ Next.js frontend built${NC}"
}

# Configure database
configure_database() {
    log "${BLUE}Configuring database...${NC}"
    
    # Initialize database
    sqlite3 $DEPLOYMENT_DIR/data/blockchain.db < $DEPLOYMENT_DIR/scripts/init-db.sql
    
    # Set database permissions
    chown $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_DIR/data/blockchain.db
    chmod 600 $DEPLOYMENT_DIR/data/blockchain.db
    
    log "${GREEN}✓ Database configured${NC}"
}

# Configure SSL certificates
configure_ssl() {
    log "${BLUE}Configuring SSL certificates...${NC}"
    
    # Create SSL directory
    mkdir -p $DEPLOYMENT_DIR/ssl
    
    # Generate self-signed certificate for initial setup
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $DEPLOYMENT_DIR/ssl/privkey.pem \
        -out $DEPLOYMENT_DIR/ssl/fullchain.pem \
        -subj "/C=US/ST=California/L=San Francisco/O=KALDRIX/CN=kaldrix.com"
    
    # Set permissions
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_DIR/ssl
    chmod 600 $DEPLOYMENT_DIR/ssl/*.pem
    
    log "${GREEN}✓ SSL certificates configured${NC}"
}

# Configure NGINX
configure_nginx() {
    log "${BLUE}Configuring NGINX...${NC}"
    
    # Copy NGINX configuration
    cp /home/z/my-project/nginx.conf /etc/nginx/sites-available/kaldrix
    
    # Enable site
    ln -sf /etc/nginx/sites-available/kaldrix /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    
    # Restart NGINX
    systemctl restart nginx
    systemctl enable nginx
    
    log "${GREEN}✓ NGINX configured${NC}"
}

# Configure Docker services
configure_docker() {
    log "${BLUE}Configuring Docker services...${NC}"
    
    # Copy Docker compose files
    cp /home/z/my-project/docker-compose.yml $DEPLOYMENT_DIR/
    cp /home/z/my-project/docker-compose.full.yml $DEPLOYMENT_DIR/
    
    # Start Docker services
    cd $DEPLOYMENT_DIR
    docker-compose -f docker-compose.full.yml up -d
    
    log "${GREEN}✓ Docker services configured${NC}"
}

# Configure systemd services
configure_systemd() {
    log "${BLUE}Configuring systemd services...${NC}"
    
    # Create blockchain service
    cat > /etc/systemd/system/kaldrix-blockchain.service << EOF
[Unit]
Description=KALDRIX Blockchain Node
After=network.target

[Service]
Type=simple
User=$DEPLOYMENT_USER
WorkingDirectory=$DEPLOYMENT_DIR
ExecStart=$DEPLOYMENT_DIR/target/release/kaldrix-node
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=RUST_LOG=info
Environment=DATABASE_URL=sqlite:///data/blockchain.db

[Install]
WantedBy=multi-user.target
EOF

    # Create API service
    cat > /etc/systemd/system/kaldrix-api.service << EOF
[Unit]
Description=KALDRIX API Server
After=network.target kaldrix-blockchain.service

[Service]
Type=simple
User=$DEPLOYMENT_USER
WorkingDirectory=$DEPLOYMENT_DIR
ExecStart=$DEPLOYMENT_DIR/target/release/kaldrix-api
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=RUST_LOG=info
Environment=DATABASE_URL=sqlite:///data/blockchain.db

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start services
    systemctl daemon-reload
    systemctl enable kaldrix-blockchain
    systemctl enable kaldrix-api
    systemctl start kaldrix-blockchain
    systemctl start kaldrix-api
    
    log "${GREEN}✓ Systemd services configured${NC}"
}

# Configure monitoring
configure_monitoring() {
    log "${BLUE}Configuring monitoring...${NC}"
    
    # Configure Prometheus
    cp /home/z/my-project/monitoring/prometheus.yml /etc/prometheus/prometheus.yml
    systemctl restart prometheus
    systemctl enable prometheus
    
    # Configure Grafana
    cp /home/z/my-project/grafana-dashboard.json /etc/grafana/provisioning/dashboards/
    systemctl restart grafana
    systemctl enable grafana
    
    # Configure Node Exporter
    systemctl start node-exporter
    systemctl enable node-exporter
    
    log "${GREEN}✓ Monitoring configured${NC}"
}

# Configure backup system
configure_backup() {
    log "${BLUE}Configuring backup system...${NC}"
    
    # Create backup script
    cat > $DEPLOYMENT_DIR/scripts/backup-production.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/kaldrix-backups"
DEPLOYMENT_DIR="/opt/kaldrix"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
sqlite3 $DEPLOYMENT_DIR/data/blockchain.db ".backup $BACKUP_DIR/daily/blockchain_$DATE.db"

# Backup configuration
tar -czf $BACKUP_DIR/daily/config_$DATE.tar.gz -C $DEPLOYMENT_DIR config/

# Backup SSL certificates
tar -czf $BACKUP_DIR/daily/ssl_$DATE.tar.gz -C $DEPLOYMENT_DIR ssl/

# Clean old backups (keep 7 days)
find $BACKUP_DIR/daily -name "*.db" -mtime +7 -delete
find $BACKUP_DIR/daily -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

    # Make backup script executable
    chmod +x $DEPLOYMENT_DIR/scripts/backup-production.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $DEPLOYMENT_DIR/scripts/backup-production.sh") | crontab -
    
    log "${GREEN}✓ Backup system configured${NC}"
}

# Configure log rotation
configure_log_rotation() {
    log "${BLUE}Configuring log rotation...${NC}"
    
    cat > /etc/logrotate.d/kaldrix << EOF
$DEPLOYMENT_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $DEPLOYMENT_USER $DEPLOYMENT_USER
    postrotate
        systemctl reload rsyslog
    endscript
}
EOF

    log "${GREEN}✓ Log rotation configured${NC}"
}

# Security hardening
security_hardening() {
    log "${BLUE}Applying security hardening...${NC}"
    
    # Configure SSH
    sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    systemctl restart sshd
    
    # Configure kernel parameters
    cat >> /etc/sysctl.conf << EOF
# Security hardening
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5
net.ipv4.tcp_rfc1337 = 1
kernel.randomize_va_space = 2
EOF
    
    sysctl -p
    
    # Configure fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    log "${GREEN}✓ Security hardening applied${NC}"
}

# Health check
health_check() {
    log "${BLUE}Performing health check...${NC}"
    
    # Check blockchain service
    if systemctl is-active --quiet kaldrix-blockchain; then
        log "${GREEN}✓ Blockchain service is running${NC}"
    else
        log "${RED}✗ Blockchain service is not running${NC}"
        return 1
    fi
    
    # Check API service
    if systemctl is-active --quiet kaldrix-api; then
        log "${GREEN}✓ API service is running${NC}"
    else
        log "${RED}✗ API service is not running${NC}"
        return 1
    fi
    
    # Check NGINX
    if systemctl is-active --quiet nginx; then
        log "${GREEN}✓ NGINX is running${NC}"
    else
        log "${RED}✗ NGINX is not running${NC}"
        return 1
    fi
    
    # Check database
    if [ -f "$DEPLOYMENT_DIR/data/blockchain.db" ]; then
        log "${GREEN}✓ Database exists${NC}"
    else
        log "${RED}✗ Database not found${NC}"
        return 1
    fi
    
    # Check API endpoint
    if curl -s -f http://localhost:8080/api/health >/dev/null; then
        log "${GREEN}✓ API endpoint is responding${NC}"
    else
        log "${RED}✗ API endpoint is not responding${NC}"
        return 1
    fi
    
    log "${GREEN}✓ All health checks passed${NC}"
}

# Generate deployment report
generate_report() {
    log "${BLUE}Generating deployment report...${NC}"
    
    cat > $DEPLOYMENT_DIR/deployment-report.txt << EOF
KALDRIX Blockchain Production Deployment Report
================================================

Deployment Information:
- Date: $(date)
- Environment: $DEPLOYMENT_ENV
- Host: $DEPLOYMENT_HOST
- User: $DEPLOYMENT_USER
- Directory: $DEPLOYMENT_DIR

Services Status:
- Blockchain Node: $(systemctl is-active kaldrix-blockchain)
- API Server: $(systemctl is-active kaldrix-api)
- NGINX: $(systemctl is-active nginx)
- Prometheus: $(systemctl is-active prometheus)
- Grafana: $(systemctl is-active grafana)
- Node Exporter: $(systemctl is-active node-exporter)

Network Configuration:
- Firewall: $(ufw status | head -1)
- Open Ports: 22, 80, 443, 8080, 8999, 9090, 3000

Security Features:
- SSL/TLS: Enabled
- Firewall: Enabled
- Fail2ban: Enabled
- Log Rotation: Enabled
- Backup System: Enabled

Database Information:
- Database File: $DEPLOYMENT_DIR/data/blockchain.db
- Database Size: $(du -h $DEPLOYMENT_DIR/data/blockchain.db | cut -f1)
- Backup Directory: $BACKUP_DIR

Monitoring Information:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Metrics Endpoint: http://localhost:8080/metrics

Access URLs:
- Main Website: https://$DEPLOYMENT_HOST
- API Documentation: https://$DEPLOYMENT_HOST/api/docs
- Blockchain Explorer: https://$DEPLOYMENT_HOST/explorer
- Monitoring Dashboard: https://$DEPLOYMENT_HOST/monitor

Next Steps:
1. Configure DNS records for $DEPLOYMENT_HOST
2. Replace self-signed SSL certificates with Let's Encrypt
3. Set up monitoring alerts
4. Configure backup offsite storage
5. Perform security audit

Deployment completed successfully at $(date)
EOF

    log "${GREEN}✓ Deployment report generated${NC}"
}

# Main deployment function
main() {
    log "${PURPLE}KALDRIX Blockchain Production Deployment${NC}"
    log "${BLUE}Deploying to: $DEPLOYMENT_HOST${NC}"
    log "${BLUE}Environment: $DEPLOYMENT_ENV${NC}"
    echo ""
    
    # Check prerequisites
    check_root
    
    # Execute deployment steps
    create_deployment_user
    update_system
    configure_firewall
    create_directories
    deploy_blockchain
    build_rust_app
    build_frontend
    configure_database
    configure_ssl
    configure_nginx
    configure_docker
    configure_systemd
    configure_monitoring
    configure_backup
    configure_log_rotation
    security_hardening
    
    # Final health check
    health_check
    
    # Generate report
    generate_report
    
    # Summary
    log "${GREEN}=== DEPLOYMENT COMPLETED SUCCESSFULLY ===${NC}"
    log "${BLUE}Deployment Directory: $DEPLOYMENT_DIR${NC}"
    log "${BLUE}Backup Directory: $BACKUP_DIR${NC}"
    log "${BLUE}Log File: $LOG_FILE${NC}"
    log "${BLUE}Deployment Report: $DEPLOYMENT_DIR/deployment-report.txt${NC}"
    echo ""
    log "${YELLOW}Next Steps:${NC}"
    log "${YELLOW}1. Configure DNS records for $DEPLOYMENT_HOST${NC}"
    log "${YELLOW}2. Replace self-signed SSL certificates with Let's Encrypt${NC}"
    log "${YELLOW}3. Set up monitoring alerts and notifications${NC}"
    log "${YELLOW}4. Configure offsite backup storage${NC}"
    log "${YELLOW}5. Perform final security audit${NC}"
    echo ""
    log "${GREEN}🚀 KALDRIX Blockchain is now deployed to production!${NC}"
}

# Execute main function
main "$@"