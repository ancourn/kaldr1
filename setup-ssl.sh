#!/bin/bash

# KALDRIX SSL Certificate Setup Script
# This script handles SSL certificate generation and management

set -e

# Configuration
DOMAIN="kaldrix.io"
EMAIL="admin@kaldrix.io"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
NGINX_CONF_DIR="/etc/nginx/sites-available"
BACKUP_DIR="/opt/backups/ssl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root"
    fi
}

# Install required packages
install_dependencies() {
    log "Installing required packages..."
    
    apt-get update
    apt-get install -y \
        certbot \
        python3-certbot-nginx \
        certbot-dns-cloudflare \
        openssl \
        nginx \
        curl \
        cron
    
    log "Dependencies installed successfully"
}

# Create backup directory
create_backup_dir() {
    log "Creating backup directory..."
    mkdir -p $BACKUP_DIR
    chmod 700 $BACKUP_DIR
}

# Generate SSL certificates
generate_certificates() {
    log "Generating SSL certificates..."
    
    # Backup existing certificates if they exist
    if [ -d "$CERT_DIR" ]; then
        log "Backing up existing certificates..."
        cp -r $CERT_DIR $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)/
    fi
    
    # Generate certificates for all subdomains
    certbot certonly --nginx \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d api.$DOMAIN \
        -d monitoring.$DOMAIN \
        -d staging.$DOMAIN \
        -d dev.$DOMAIN \
        -d docs.$DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --non-interactive \
        --rsa-key-size 4096 \
        --must-staple \
        --staple-ocsp \
        --hsts \
        --uir \
        --redirect
    
    log "SSL certificates generated successfully"
}

# Create strong Diffie-Hellman parameters
create_dh_params() {
    log "Creating Diffie-Hellman parameters..."
    
    DH_PARAMS="/etc/letsencrypt/ssl-dhparams.pem"
    
    if [ ! -f "$DH_PARAMS" ]; then
        openssl dhparam -out $DH_PARAMS 4096
        chmod 600 $DH_PARAMS
        log "Diffie-Hellman parameters created successfully"
    else
        log "Diffie-Hellman parameters already exist"
    fi
}

# Setup automatic renewal
setup_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Test renewal
    certbot renew --dry-run
    
    # Add renewal cron job
    cat > /etc/cron.d/certbot <<EOF
# Renew SSL certificates
0 3 * * * root /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
EOF
    
    chmod 644 /etc/cron.d/certbot
    
    log "Automatic renewal setup completed"
}

# Configure NGINX for SSL
configure_nginx() {
    log "Configuring NGINX for SSL..."
    
    # Create SSL configuration snippet
    cat > /etc/nginx/snippets/ssl.conf <<EOF
# SSL Configuration
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# Modern configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# HSTS
add_header Strict-Transport-Security "max-age=63072000" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Certificate paths
ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;

# Diffie-Hellman parameters
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
EOF
    
    # Create security headers configuration
    cat > /etc/nginx/snippets/security-headers.conf <<EOF
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' wss: https://api.$DOMAIN; frame-ancestors 'none';" always;
EOF
    
    # Test NGINX configuration
    nginx -t
    
    # Reload NGINX
    systemctl reload nginx
    
    log "NGINX SSL configuration completed"
}

# Setup SSL monitoring
setup_monitoring() {
    log "Setting up SSL monitoring..."
    
    # Create SSL check script
    cat > /usr/local/bin/ssl-check.sh <<EOF
#!/bin/bash
# SSL Certificate Monitoring Script

DOMAIN="$DOMAIN"
WARN_DAYS=30
CRIT_DAYS=7

# Get certificate expiration date
EXP_DATE=\$(openssl s_client -connect \$DOMAIN:443 -servername \$DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
EXP_TIMESTAMP=\$(date -d "\$EXP_DATE" +%s)
NOW_TIMESTAMP=\$(date +%s)
DAYS_LEFT=\$(( (EXP_TIMESTAMP - NOW_TIMESTAMP) / 86400 ))

if [ \$DAYS_LEFT -lt \$CRIT_DAYS ]; then
    echo "CRITICAL: SSL certificate expires in \$DAYS_LEFT days"
    exit 2
elif [ \$DAYS_LEFT -lt \$WARN_DAYS ]; then
    echo "WARNING: SSL certificate expires in \$DAYS_LEFT days"
    exit 1
else
    echo "OK: SSL certificate expires in \$DAYS_LEFT days"
    exit 0
fi
EOF
    
    chmod +x /usr/local/bin/ssl-check.sh
    
    # Add monitoring cron job
    cat > /etc/cron.d/ssl-monitor <<EOF
# SSL certificate monitoring
0 6 * * * root /usr/local/bin/ssl-check.sh
EOF
    
    chmod 644 /etc/cron.d/ssl-monitor
    
    log "SSL monitoring setup completed"
}

# Create SSL health check endpoint
create_health_check() {
    log "Creating SSL health check endpoint..."
    
    cat > /var/www/html/ssl-health.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>SSL Health Check</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .status { font-size: 24px; font-weight: bold; }
        .ok { color: green; }
        .warning { color: orange; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>KALDRIX SSL Health Check</h1>
    <div id="status" class="status">Checking...</div>
    <div id="details"></div>
    
    <script>
        fetch('/api/ssl-health')
            .then(response => response.json())
            .then(data => {
                const statusEl = document.getElementById('status');
                const detailsEl = document.getElementById('details');
                
                if (data.status === 'ok') {
                    statusEl.textContent = '✓ SSL Certificate Valid';
                    statusEl.className = 'status ok';
                } else if (data.status === 'warning') {
                    statusEl.textContent = '⚠ SSL Certificate Expiring Soon';
                    statusEl.className = 'status warning';
                } else {
                    statusEl.textContent = '✗ SSL Certificate Expired';
                    statusEl.className = 'status error';
                }
                
                detailsEl.innerHTML = \`
                    <p><strong>Domain:</strong> \${data.domain}</p>
                    <p><strong>Issuer:</strong> \${data.issuer}</p>
                    <p><strong>Valid Until:</strong> \${data.valid_until}</p>
                    <p><strong>Days Remaining:</strong> \${data.days_remaining}</p>
                \`;
            })
            .catch(error => {
                document.getElementById('status').textContent = '✗ Unable to check SSL status';
                document.getElementById('status').className = 'status error';
            });
    </script>
</body>
</html>
EOF
    
    log "SSL health check endpoint created"
}

# Main setup process
main() {
    log "Starting SSL certificate setup for KALDRIX..."
    
    check_root
    install_dependencies
    create_backup_dir
    generate_certificates
    create_dh_params
    configure_nginx
    setup_renewal
    setup_monitoring
    create_health_check
    
    log "SSL certificate setup completed successfully!"
    log "Certificates are valid for the following domains:"
    log "  - $DOMAIN"
    log "  - www.$DOMAIN"
    log "  - api.$DOMAIN"
    log "  - monitoring.$DOMAIN"
    log "  - staging.$DOMAIN"
    log "  - dev.$DOMAIN"
    log "  - docs.$DOMAIN"
}

# Run setup
main "$@"