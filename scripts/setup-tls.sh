#!/bin/bash

# TLS Setup Script for Quantum-Proof DAG Blockchain
# Sets up NGINX or Caddy with Let's Encrypt SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="quantum-dag.example.com"
API_DOMAIN="api.quantum-dag.example.com"
MONITOR_DOMAIN="monitor.quantum-dag.example.com"
EMAIL="admin@quantum-dag.example.com"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Detect operating system
if [[ -f /etc/debian_version ]]; then
    OS="debian"
    PACKAGE_MANAGER="apt-get"
elif [[ -f /etc/redhat-release ]]; then
    OS="redhat"
    PACKAGE_MANAGER="yum"
elif [[ -f /etc/arch-release ]]; then
    OS="arch"
    PACKAGE_MANAGER="pacman"
else
    print_error "Unsupported operating system"
    exit 1
fi

print_status "Detected operating system: $OS"

# Install dependencies
print_status "Installing dependencies..."
case $OS in
    debian)
        $PACKAGE_MANAGER update
        $PACKAGE_MANAGER install -y curl wget nginx certbot python3-certbot-nginx docker docker-compose
        ;;
    redhat)
        $PACKAGE_MANAGER update -y
        $PACKAGE_MANAGER install -y curl wget nginx certbot python3-certbot-nginx docker docker-compose
        ;;
    arch)
        $PACKAGE_MANAGER -Syu
        $PACKAGE_MANAGER -S curl wget nginx certbot docker docker-compose
        ;;
esac

# Create necessary directories
print_status "Creating directories..."
mkdir -p /etc/nginx/ssl
mkdir -p /var/www/certbot
mkdir -p /var/www/blockchain/static
mkdir -p /etc/caddy
mkdir -p /data/{blockchain,identity,backups,exports}
mkdir -p /logs/{nginx,caddy,blockchain}

# Set permissions
chmod 750 /data
chmod 750 /logs

# Create Docker network if it doesn't exist
print_status "Setting up Docker network..."
if ! docker network inspect blockchain-network >/dev/null 2>&1; then
    docker network create blockchain-network
fi

# Function to setup NGINX
setup_nginx() {
    print_status "Setting up NGINX..."
    
    # Copy NGINX configuration
    cp nginx.conf /etc/nginx/nginx.conf
    
    # Generate htpasswd for metrics endpoint
    if ! command -v htpasswd &> /dev/null; then
        $PACKAGE_MANAGER install -y apache2-utils
    fi
    
    htpasswd -b -c /etc/nginx/.htpasswd_metrics prometheus secure_metrics_password
    
    # Test NGINX configuration
    nginx -t
    
    if [[ $? -eq 0 ]]; then
        print_status "NGINX configuration is valid"
        systemctl enable nginx
        systemctl start nginx
        print_status "NGINX started successfully"
    else
        print_error "NGINX configuration test failed"
        return 1
    fi
}

# Function to setup Caddy
setup_caddy() {
    print_status "Setting up Caddy..."
    
    # Copy Caddy configuration
    cp Caddyfile /etc/caddy/Caddyfile
    
    # Create Caddy user and directories
    useradd -r -d /etc/caddy -s /bin/false caddy || true
    chown -R caddy:caddy /etc/caddy
    
    # Create systemd service for Caddy
    cat > /etc/systemd/system/caddy.service << 'EOF'
[Unit]
Description=Caddy
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=512
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/etc/caddy
ReadWritePaths=/var/log/caddy
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable caddy
    systemctl start caddy
    print_status "Caddy started successfully"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Stop web servers temporarily
    systemctl stop nginx || true
    systemctl stop caddy || true
    
    # Get SSL certificate using Let's Encrypt
    certbot certonly --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d $API_DOMAIN \
        -d $MONITOR_DOMAIN \
        --force-renewal
    
    if [[ $? -eq 0 ]]; then
        print_status "SSL certificates obtained successfully"
    else
        print_error "Failed to obtain SSL certificates"
        return 1
    fi
    
    # Setup auto-renewal
    cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx || systemctl reload caddy"
EOF
    chmod +x /etc/cron.daily/certbot-renew
    
    print_status "SSL auto-renewal setup complete"
}

# Function to setup Docker services
setup_docker() {
    print_status "Setting up Docker services..."
    
    # Create necessary directories for Docker
    mkdir -p monitoring/{prometheus_data,grafana_data,grafana/provisioning/{dashboards,datasources}}
    
    # Copy monitoring configurations
    cp monitoring/prometheus.yml monitoring/
    cp monitoring/alert_rules.yml monitoring/
    cp grafana-dashboard.json monitoring/grafana/provisioning/dashboards/
    
    # Create Grafana datasource configuration
    cat > monitoring/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    orgId: 1
    url: http://prometheus:9090
    basicAuth: false
    isDefault: true
    version: 1
    editable: false
EOF
    
    print_status "Docker services configuration complete"
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    if command -v ufw &> /dev/null; then
        # UFW firewall
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 9090/tcp  # Prometheus
        ufw allow 3000/tcp  # Grafana
        ufw --force enable
        print_status "UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        # FirewallD
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-port=9090/tcp
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --reload
        print_status "FirewallD configured"
    else
        print_warning "No firewall manager found. Please configure firewall manually."
    fi
}

# Function to create systemd service for blockchain node
create_blockchain_service() {
    print_status "Creating systemd service for blockchain node..."
    
    cat > /etc/systemd/system/quantum-dag-blockchain.service << 'EOF'
[Unit]
Description=Quantum-Proof DAG Blockchain Node
After=network.target

[Service]
Type=simple
User=quantum-dag
Group=quantum-dag
WorkingDirectory=/opt/quantum-dag-blockchain
ExecStart=/opt/quantum-dag-blockchain/target/release/api-server
Restart=always
RestartSec=10
Environment=RUST_LOG=info
Environment=DATABASE_URL=sqlite:///data/blockchain.db
Environment=IDENTITY_STORAGE_PATH=/data/identity
Environment=BACKUP_DIR=/data/backups

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/data
ReadWritePaths=/logs
ProtectHome=true
RemoveIPC=true

[Install]
WantedBy=multi-user.target
EOF
    
    # Create user
    useradd -r -s /bin/false -d /opt/quantum-dag-blockchain quantum-dag || true
    
    systemctl daemon-reload
    systemctl enable quantum-dag-blockchain
    print_status "Systemd service created"
}

# Main menu
echo "Quantum-Proof DAG Blockchain TLS Setup"
echo "======================================"
echo ""
echo "Select reverse proxy:"
echo "1) NGINX"
echo "2) Caddy"
echo "3) Both (for testing)"
echo ""
read -p "Enter your choice [1-3]: " choice

case $choice in
    1)
        print_status "Setting up NGINX..."
        setup_nginx
        PROXY="nginx"
        ;;
    2)
        print_status "Setting up Caddy..."
        setup_caddy
        PROXY="caddy"
        ;;
    3)
        print_status "Setting up both NGINX and Caddy..."
        setup_nginx
        setup_caddy
        PROXY="both"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Setup SSL certificates
setup_ssl

# Setup Docker services
setup_docker

# Setup firewall
setup_firewall

# Create systemd service
create_blockchain_service

# Create startup script
cat > /usr/local/bin/start-blockchain << 'EOF'
#!/bin/bash
# Startup script for Quantum-Proof DAG Blockchain

echo "Starting Quantum-Proof DAG Blockchain services..."

# Start blockchain node
systemctl start quantum-dag-blockchain

# Start monitoring services
cd /path/to/quantum-dag-blockchain
docker-compose -f docker-compose.tls.yml up -d prometheus grafana node-exporter

echo "Services started successfully"
echo "Access points:"
echo "- Blockchain API: https://$DOMAIN"
echo "- API endpoints: https://$API_DOMAIN"
echo "- Monitoring: https://$MONITOR_DOMAIN"
echo "- Grafana: http://localhost:3000"
echo "- Prometheus: http://localhost:9090"
EOF

chmod +x /usr/local/bin/start-blockchain

# Create status check script
cat > /usr/local/bin/check-blockchain << 'EOF'
#!/bin/bash
# Status check script for Quantum-Proof DAG Blockchain

echo "Quantum-Proof DAG Blockchain Status"
echo "================================="

# Check blockchain node
if systemctl is-active --quiet quantum-dag-blockchain; then
    echo "✅ Blockchain node: Running"
else
    echo "❌ Blockchain node: Stopped"
fi

# Check reverse proxy
if [[ "$PROXY" == "nginx" ]] || [[ "$PROXY" == "both" ]]; then
    if systemctl is-active --quiet nginx; then
        echo "✅ NGINX: Running"
    else
        echo "❌ NGINX: Stopped"
    fi
fi

if [[ "$PROXY" == "caddy" ]] || [[ "$PROXY" == "both" ]]; then
    if systemctl is-active --quiet caddy; then
        echo "✅ Caddy: Running"
    else
        echo "❌ Caddy: Stopped"
    fi
fi

# Check Docker services
cd /path/to/quantum-dag-blockchain
if docker-compose -f docker-compose.tls.yml ps | grep -q "Up"; then
    echo "✅ Docker services: Running"
else
    echo "❌ Docker services: Stopped"
fi

# Check SSL certificates
if [[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]]; then
    echo "✅ SSL certificates: Valid"
else
    echo "❌ SSL certificates: Missing"
fi

echo ""
echo "Access URLs:"
echo "- Main site: https://$DOMAIN"
echo "- API: https://$API_DOMAIN"
echo "- Health check: https://$DOMAIN/health"
echo "- Metrics: https://$DOMAIN/metrics"
echo "- Monitoring: https://$MONITOR_DOMAIN"
EOF

chmod +x /usr/local/bin/check-blockchain

# Print completion message
print_status "TLS setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update DOMAIN variable in setup scripts with your actual domain"
echo "2. Configure DNS records for your domain"
echo "3. Update blockchain node binary location"
echo "4. Run '/usr/local/bin/start-blockchain' to start services"
echo "5. Run '/usr/local/bin/check-blockchain' to check status"
echo ""
echo "Configuration files created:"
echo "- NGINX: /etc/nginx/nginx.conf"
echo "- Caddy: /etc/caddy/Caddyfile"
echo "- Docker: docker-compose.tls.yml"
echo "- Systemd: /etc/systemd/system/quantum-dag-blockchain.service"
echo ""
echo "Useful commands:"
echo "- Start services: /usr/local/bin/start-blockchain"
echo "- Check status: /usr/local/bin/check-blockchain"
echo "- View logs: journalctl -u quantum-dag-blockchain -f"
echo "- Renew SSL: certbot renew --dry-run"
echo ""
print_warning "Remember to:"
echo "1. Replace $DOMAIN with your actual domain name"
echo "2. Configure DNS A records to point to your server"
echo "3. Update firewall rules if needed"
echo "4. Test SSL certificate renewal"