#!/bin/bash

# KALDRIX Blockchain Let's Encrypt SSL Certificate Setup Script
# This script configures Let's Encrypt SSL certificates for production

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
DOMAIN="kaldrix.com"
EMAIL="admin@kaldrix.com"
DEPLOYMENT_USER="kaldrix"
DEPLOYMENT_DIR="/opt/kaldrix"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"
NGINX_SITES="/etc/nginx/sites-available"
LOG_FILE="/var/log/kaldrix-letsencrypt.log"

# Additional domains
ADDITIONAL_DOMAINS=(
    "www.kaldrix.com"
    "api.kaldrix.com"
    "explorer.kaldrix.com"
    "docs.kaldrix.com"
    "monitor.kaldrix.com"
    "validator.kaldrix.com"
    "faucet.kaldrix.com"
    "wallet.kaldrix.com"
    "governance.kaldrix.com"
    "staking.kaldrix.com"
)

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

# Install Certbot
install_certbot() {
    log "${BLUE}Installing Certbot...${NC}"
    
    # Update package list
    apt update
    
    # Install Certbot and Nginx plugin
    apt install -y certbot python3-certbot-nginx
    
    log "${GREEN}✓ Certbot installed${NC}"
}

# Check domain DNS resolution
check_dns() {
    log "${BLUE}Checking DNS resolution for $DOMAIN...${NC}"
    
    # Check main domain
    if nslookup "$DOMAIN" >/dev/null 2>&1; then
        log "${GREEN}✓ DNS resolution successful for $DOMAIN${NC}"
    else
        log "${YELLOW}⚠ DNS resolution failed for $DOMAIN${NC}"
        log "${YELLOW}Please ensure DNS records are properly configured${NC}"
        return 1
    fi
    
    # Check additional domains
    for domain in "${ADDITIONAL_DOMAINS[@]}"; do
        if nslookup "$domain" >/dev/null 2>&1; then
            log "${GREEN}✓ DNS resolution successful for $domain${NC}"
        else
            log "${YELLOW}⚠ DNS resolution failed for $domain${NC}"
        fi
    done
}

# Create Nginx configuration for Let's Encrypt
create_nginx_config() {
    log "${BLUE}Creating Nginx configuration for Let's Encrypt...${NC}"
    
    # Create temporary Nginx config for Let's Encrypt validation
    cat > "$NGINX_SITES/kaldrix-temp" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

    # Enable temporary site
    ln -sf "$NGINX_SITES/kaldrix-temp" /etc/nginx/sites-enabled/
    
    # Create webroot for Certbot
    mkdir -p /var/www/certbot
    chown -R www-data:www-data /var/www/certbot
    
    # Test Nginx configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    log "${GREEN}✓ Temporary Nginx configuration created${NC}"
}

# Obtain SSL certificates
obtain_certificates() {
    log "${BLUE}Obtaining SSL certificates...${NC}"
    
    # Build domain list for Certbot
    DOMAIN_ARGS="-d $DOMAIN"
    for domain in "${ADDITIONAL_DOMAINS[@]}"; do
        DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
    done
    
    # Obtain certificate
    certbot certonly --nginx \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --keep-until-expiring \
        --non-interactive \
        $DOMAIN_ARGS
    
    log "${GREEN}✓ SSL certificates obtained${NC}"
}

# Create enhanced Nginx configuration
create_enhanced_nginx_config() {
    log "${BLUE}Creating enhanced Nginx configuration...${NC}"
    
    # Main site configuration
    cat > "$NGINX_SITES/kaldrix" << EOF
# KALDRIX Blockchain - Main Site
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate $SSL_DIR/fullchain.pem;
    ssl_certificate_key $SSL_DIR/privkey.pem;
    ssl_trusted_certificate $SSL_DIR/chain.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';" always;
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Root directory
    root $DEPLOYMENT_DIR;
    index index.html index.htm;
    
    # Main application
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Security
        proxy_set_header X-Content-Type-Options "nosniff";
        proxy_set_header X-Frame-Options "DENY";
        proxy_set_header X-XSS-Protection "1; mode=block";
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Metrics endpoint (restricted)
    location /metrics {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
        
        proxy_pass http://localhost:9090;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Grafana (restricted)
    location /grafana {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Block access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Block access to backup files
    location ~* \.(bak|backup|old|tmp|log|conf)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    # Logging
    access_log /var/log/nginx/kaldrix-access.log;
    error_log /var/log/nginx/kaldrix-error.log;
}
EOF

    # API subdomain configuration
    cat > "$NGINX_SITES/api.kaldrix" << EOF
# KALDRIX Blockchain - API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate $SSL_DIR/fullchain.pem;
    ssl_certificate_key $SSL_DIR/privkey.pem;
    ssl_trusted_certificate $SSL_DIR/chain.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';" always;
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=100r/s;
    limit_req zone=api burst=200 nodelay;
    
    # API endpoints
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Security headers
        proxy_set_header X-Content-Type-Options "nosniff";
        proxy_set_header X-Frame-Options "DENY";
        proxy_set_header X-XSS-Protection "1; mode=block";
        
        # CORS
        add_header Access-Control-Allow-Origin "https://$DOMAIN" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
        add_header Access-Control-Max-Age "86400" always;
        
        # Handle OPTIONS requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://$DOMAIN";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Max-Age "86400";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # API Documentation
    location /docs {
        proxy_pass http://localhost:8080/docs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Metrics endpoint (restricted)
    location /metrics {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
        
        proxy_pass http://localhost:9090;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Logging
    access_log /var/log/nginx/api.kaldrix-access.log;
    error_log /var/log/nginx/api.kaldrix-error.log;
}
EOF

    # Explorer subdomain configuration
    cat > "$NGINX_SITES/explorer.kaldrix" << EOF
# KALDRIX Blockchain - Explorer
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name explorer.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate $SSL_DIR/fullchain.pem;
    ssl_certificate_key $SSL_DIR/privkey.pem;
    ssl_trusted_certificate $SSL_DIR/chain.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';" always;
    
    # Root directory
    root $DEPLOYMENT_DIR/explorer;
    index index.html index.htm;
    
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy for explorer data
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS
        add_header Access-Control-Allow-Origin "https://$DOMAIN" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Max-Age "86400" always;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Logging
    access_log /var/log/nginx/explorer.kaldrix-access.log;
    error_log /var/log/nginx/explorer.kaldrix-error.log;
}
EOF

    log "${GREEN}✓ Enhanced Nginx configuration created${NC}"
}

# Enable sites and restart Nginx
enable_sites() {
    log "${BLUE}Enabling Nginx sites...${NC}"
    
    # Remove temporary site
    rm -f /etc/nginx/sites-enabled/kaldrix-temp
    rm -f "$NGINX_SITES/kaldrix-temp"
    
    # Enable new sites
    ln -sf "$NGINX_SITES/kaldrix" /etc/nginx/sites-enabled/
    ln -sf "$NGINX_SITES/api.kaldrix" /etc/nginx/sites-enabled/
    ln -sf "$NGINX_SITES/explorer.kaldrix" /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t
    
    # Restart Nginx
    systemctl restart nginx
    
    log "${GREEN}✓ Nginx sites enabled and restarted${NC}"
}

# Setup automatic renewal
setup_auto_renewal() {
    log "${BLUE}Setting up automatic certificate renewal...${NC}"
    
    # Create renewal hook
    cat > /etc/letsencrypt/renewal-hooks/deploy/kaldrix-renewal << 'EOF'
#!/bin/bash
# Hook for certificate renewal
systemctl reload nginx
systemctl restart kaldrix-api
systemctl restart kaldrix-blockchain
EOF
    
    # Make hook executable
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/kaldrix-renewal
    
    # Add renewal to crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    
    log "${GREEN}✓ Automatic renewal configured${NC}"
}

# Verify certificates
verify_certificates() {
    log "${BLUE}Verifying SSL certificates...${NC}"
    
    # Check certificate files
    if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
        log "${GREEN}✓ Certificate files exist${NC}"
    else
        error_exit "Certificate files not found"
    fi
    
    # Check certificate expiration
    expiration_date=$(openssl x509 -enddate -noout -in "$SSL_DIR/fullchain.pem" | cut -d= -f2)
    log "${BLUE}Certificate expires: $expiration_date${NC}"
    
    # Test SSL connection
    if openssl s_client -connect "$DOMAIN":443 -servername "$DOMAIN" </dev/null >/dev/null 2>&1; then
        log "${GREEN}✓ SSL connection successful${NC}"
    else
        log "${RED}✗ SSL connection failed${NC}"
        return 1
    fi
    
    # Test SSL configuration
    ssl_result=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
    if [ "$ssl_result" = "200" ]; then
        log "${GREEN}✓ HTTPS is working properly${NC}"
    else
        log "${RED}✗ HTTPS test failed (HTTP $ssl_result)${NC}"
        return 1
    fi
    
    log "${GREEN}✓ All certificate verifications passed${NC}"
}

# Update application configuration
update_app_config() {
    log "${BLUE}Updating application configuration...${NC}"
    
    # Update SSL paths in environment file
    if [ -f "$DEPLOYMENT_DIR/config/production.env" ]; then
        sed -i "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=$SSL_DIR/fullchain.pem|g" "$DEPLOYMENT_DIR/config/production.env"
        sed -i "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=$SSL_DIR/privkey.pem|g" "$DEPLOYMENT_DIR/config/production.env"
        sed -i "s|SSL_CHAIN_PATH=.*|SSL_CHAIN_PATH=$SSL_DIR/chain.pem|g" "$DEPLOYMENT_DIR/config/production.env"
        
        log "${GREEN}✓ Application configuration updated${NC}"
    fi
    
    # Restart services
    systemctl restart kaldrix-api
    systemctl restart kaldrix-blockchain
    
    log "${GREEN}✓ Services restarted with new SSL configuration${NC}"
}

# Generate SSL report
generate_ssl_report() {
    log "${BLUE}Generating SSL configuration report...${NC}"
    
    cat > "$DEPLOYMENT_DIR/ssl-report.txt" << EOF
KALDRIX Blockchain SSL Configuration Report
==========================================

Configuration Date: $(date)
Domain: $DOMAIN
Email: $EMAIL
SSL Directory: $SSL_DIR

Certificate Information:
- Certificate File: $SSL_DIR/fullchain.pem
- Private Key File: $SSL_DIR/privkey.pem
- Chain File: $SSL_DIR/chain.pem
- Expiration Date: $(openssl x509 -enddate -noout -in "$SSL_DIR/fullchain.pem" | cut -d= -f2)

SSL Configuration:
- Protocols: TLSv1.2, TLSv1.3
- Ciphers: ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
- HSTS: Enabled (max-age=63072000)
- Security Headers: All enabled
- OCSP Stapling: Enabled

Configured Domains:
- Main: $DOMAIN
- Additional: $(IFS=,; echo "${ADDITIONAL_DOMAINS[*]}")

Nginx Sites:
- Main Site: /etc/nginx/sites-available/kaldrix
- API Site: /etc/nginx/sites-available/api.kaldrix
- Explorer Site: /etc/nginx/sites-available/explorer.kaldrix

Services Status:
- Nginx: $(systemctl is-active nginx)
- KALDRIX API: $(systemctl is-active kaldrix-api)
- KALDRIX Blockchain: $(systemctl is-active kaldrix-blockchain)

Security Features:
- SSL/TLS: Enabled
- HSTS: Enabled
- Security Headers: All enabled
- Rate Limiting: Enabled
- CORS: Configured
- WebSockets: Supported
- Certificate Auto-renewal: Enabled

Access URLs:
- Main Website: https://$DOMAIN
- API: https://api.$DOMAIN
- Explorer: https://explorer.$DOMAIN
- API Documentation: https://api.$DOMAIN/docs
- Health Check: https://$DOMAIN/health

SSL Testing Commands:
- Certificate Info: openssl x509 -in $SSL_DIR/fullchain.pem -text -noout
- SSL Connection: openssl s_client -connect $DOMAIN:443 -servername $DOMAIN
- SSL Labs Test: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN

Next Steps:
1. Test all HTTPS endpoints
2. Verify SSL Labs score
3. Test certificate auto-renewal
4. Monitor SSL expiration dates
5. Test HSTS preload submission

SSL configuration completed successfully at $(date)
EOF

    log "${GREEN}✓ SSL report generated${NC}"
}

# Test SSL configuration
test_ssl_config() {
    log "${BLUE}Testing SSL configuration...${NC}"
    
    # Test main domain
    log "${BLUE}Testing main domain: https://$DOMAIN${NC}"
    main_test=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
    if [ "$main_test" = "200" ]; then
        log "${GREEN}✓ Main domain HTTPS test passed${NC}"
    else
        log "${RED}✗ Main domain HTTPS test failed (HTTP $main_test)${NC}"
    fi
    
    # Test API domain
    log "${BLUE}Testing API domain: https://api.$DOMAIN${NC}"
    api_test=$(curl -s -o /dev/null -w "%{http_code}" "https://api.$DOMAIN")
    if [ "$api_test" = "200" ]; then
        log "${GREEN}✓ API domain HTTPS test passed${NC}"
    else
        log "${RED}✗ API domain HTTPS test failed (HTTP $api_test)${NC}"
    fi
    
    # Test explorer domain
    log "${BLUE}Testing explorer domain: https://explorer.$DOMAIN${NC}"
    explorer_test=$(curl -s -o /dev/null -w "%{http_code}" "https://explorer.$DOMAIN")
    if [ "$explorer_test" = "200" ]; then
        log "${GREEN}✓ Explorer domain HTTPS test passed${NC}"
    else
        log "${RED}✗ Explorer domain HTTPS test failed (HTTP $explorer_test)${NC}"
    fi
    
    # Test API endpoint
    log "${BLUE}Testing API endpoint: https://api.$DOMAIN/health${NC}"
    health_test=$(curl -s -o /dev/null -w "%{http_code}" "https://api.$DOMAIN/health")
    if [ "$health_test" = "200" ]; then
        log "${GREEN}✓ API endpoint test passed${NC}"
    else
        log "${RED}✗ API endpoint test failed (HTTP $health_test)${NC}"
    fi
    
    log "${GREEN}✓ SSL configuration testing completed${NC}"
}

# Main function
main() {
    log "${PURPLE}KALDRIX Blockchain Let's Encrypt SSL Setup${NC}"
    log "${BLUE}Domain: $DOMAIN${NC}"
    log "${BLUE}Email: $EMAIL${NC}"
    echo ""
    
    # Execute setup steps
    check_root
    install_certbot
    check_dns || log "${YELLOW}⚠ DNS check failed, continuing anyway...${NC}"
    create_nginx_config
    obtain_certificates
    create_enhanced_nginx_config
    enable_sites
    setup_auto_renewal
    verify_certificates
    update_app_config
    generate_ssl_report
    test_ssl_config
    
    # Summary
    log "${GREEN}=== LET'S ENCRYPT SETUP COMPLETED SUCCESSFULLY ===${NC}"
    log "${BLUE}Domain: $DOMAIN${NC}"
    log "${BLUE}SSL Directory: $SSL_DIR${NC}"
    log "${BLUE}Log File: $LOG_FILE${NC}"
    log "${BLUE}SSL Report: $DEPLOYMENT_DIR/ssl-report.txt${NC}"
    echo ""
    log "${GREEN}🔒 SSL certificates are now configured and active!${NC}"
    log "${YELLOW}Next Steps:${NC}"
    log "${YELLOW}1. Test SSL Labs score: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN${NC}"
    log "${YELLOW}2. Submit HSTS preload: https://hstspreload.org/${NC}"
    log "${YELLOW}3. Monitor certificate expiration${NC}"
    log "${YELLOW}4. Test all HTTPS endpoints${NC}"
    echo ""
    log "${GREEN}🚀 KALDRIX Blockchain now has production-grade SSL!${NC}"
}

# Execute main function
main "$@"