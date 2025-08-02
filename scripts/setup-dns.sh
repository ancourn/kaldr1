#!/bin/bash

# KALDRIX DNS Configuration Script
# This script sets up DNS records for the KALDRIX mainnet

set -e

# Configuration
DOMAIN="kaldrix.com"
DNS_PROVIDER="cloudflare"  # Can be cloudflare, aws, google, etc.
TTL=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create DNS record
create_dns_record() {
    local record_type=$1
    local record_name=$2
    local record_value=$3
    local record_ttl=$4
    
    log "Creating DNS record: $record_type $record_name.$DOMAIN -> $record_value"
    
    case $DNS_PROVIDER in
        "cloudflare")
            # Cloudflare API call
            curl -X POST "https://api.cloudflare.com/client/v4/zones/$(get_zone_id)/dns_records" \
                -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
                -H "Content-Type: application/json" \
                --data '{
                    "type": "'$record_type'",
                    "name": "'$record_name.$DOMAIN'",
                    "content": "'$record_value'",
                    "ttl": '$record_ttl',
                    "proxied": false
                }'
            ;;
        "aws")
            # AWS Route 53
            aws route53 change-resource-record-sets \
                --hosted-zone-id $(get_hosted_zone_id) \
                --change-batch '{
                    "Changes": [{
                        "Action": "CREATE",
                        "ResourceRecordSet": {
                            "Name": "'$record_name.$DOMAIN'",
                            "Type": "'$record_type'",
                            "TTL": '$record_ttl',
                            "ResourceRecords": [{"Value": "'$record_value'"}]
                        }
                    }]
                }'
            ;;
        "google")
            # Google Cloud DNS
            gcloud dns record-sets transaction start --zone=kaldrix-zone
            gcloud dns record-sets transaction add "$record_value" \
                --name="$record_name.$DOMAIN." \
                --type="$record_type" \
                --ttl="$record_ttl" \
                --zone=kaldrix-zone
            gcloud dns record-sets transaction execute --zone=kaldrix-zone
            ;;
        *)
            log_warning "DNS provider $DNS_PROVIDER not supported. Please configure manually."
            log "Manual DNS record: $record_type $record_name.$DOMAIN -> $record_value"
            ;;
    esac
    
    log_success "DNS record created: $record_type $record_name.$DOMAIN"
}

# Function to get zone ID (placeholder)
get_zone_id() {
    echo "your-zone-id"
}

# Function to get hosted zone ID (placeholder)
get_hosted_zone_id() {
    echo "your-hosted-zone-id"
}

# Function to setup all DNS records
setup_dns_records() {
    log "Setting up DNS records for KALDRIX mainnet..."
    
    # Bootstrap nodes
    create_dns_record "A" "bootstrap1" "192.168.1.10" $TTL
    create_dns_record "A" "bootstrap2" "192.168.1.11" $TTL
    create_dns_record "A" "bootstrap3" "192.168.1.12" $TTL
    
    # Validator nodes
    create_dns_record "A" "validator1" "192.168.1.20" $TTL
    create_dns_record "A" "validator2" "192.168.1.21" $TTL
    create_dns_record "A" "validator3" "192.168.1.22" $TTL
    create_dns_record "A" "validator4" "192.168.1.23" $TTL
    
    # API endpoints
    create_dns_record "A" "api" "192.168.1.30" $TTL
    create_dns_record "A" "api2" "192.168.1.31" $TTL
    create_dns_record "A" "api3" "192.168.1.32" $TTL
    
    # Web services
    create_dns_record "A" "explorer" "192.168.1.40" $TTL
    create_dns_record "A" "faucet" "192.168.1.41" $TTL
    create_dns_record "A" "docs" "192.168.1.42" $TTL
    create_dns_record "A" "support" "192.168.1.43" $TTL
    
    # Monitoring
    create_dns_record "A" "monitor" "192.168.1.50" $TTL
    create_dns_record "A" "grafana" "192.168.1.51" $TTL
    create_dns_record "A" "prometheus" "192.168.1.52" $TTL
    
    # Main domain
    create_dns_record "A" "@" "192.168.1.30" $TTL
    create_dns_record "AAAA" "@" "2001:db8::1" $TTL
    
    # Wildcard for subdomains
    create_dns_record "A" "*" "192.168.1.30" $TTL
    
    # MX records for email
    create_dns_record "MX" "@" "10 mail.$DOMAIN" $TTL
    
    # TXT records
    create_dns_record "TXT" "@" "\"v=spf1 include:_spf.google.com ~all\"" $TTL
    create_dns_record "TXT" "_dmarc" "\"v=DMARC1; p=quarantine; rua=mailto:dmarc@$DOMAIN\"" $TTL
    
    # CAA records
    create_dns_record "CAA" "@" "\"0 issue letsencrypt.org\"" $TTL
    
    log_success "All DNS records configured"
}

# Function to verify DNS records
verify_dns_records() {
    log "Verifying DNS records..."
    
    # List of records to verify
    local records=(
        "bootstrap1.$DOMAIN"
        "validator1.$DOMAIN"
        "api.$DOMAIN"
        "explorer.$DOMAIN"
        "$DOMAIN"
    )
    
    for record in "${records[@]}"; do
        log "Checking $record..."
        nslookup $record
        dig +short $record
        echo ""
    done
    
    log_success "DNS verification completed"
}

# Function to generate DNS configuration file
generate_dns_config() {
    log "Generating DNS configuration file..."
    
    cat > /tmp/kaldrix-dns-config.txt << EOF
# KALDRIX Mainnet DNS Configuration
# Domain: $DOMAIN
# Generated: $(date)

# Bootstrap Nodes
bootstrap1.$DOMAIN.    IN    A    192.168.1.10
bootstrap2.$DOMAIN.    IN    A    192.168.1.11
bootstrap3.$DOMAIN.    IN    A    192.168.1.12

# Validator Nodes
validator1.$DOMAIN.    IN    A    192.168.1.20
validator2.$DOMAIN.    IN    A    192.168.1.21
validator3.$DOMAIN.    IN    A    192.168.1.22
validator4.$DOMAIN.    IN    A    192.168.1.23

# API Endpoints
api.$DOMAIN.          IN    A    192.168.1.30
api2.$DOMAIN.         IN    A    192.168.1.31
api3.$DOMAIN.         IN    A    192.168.1.32

# Web Services
explorer.$DOMAIN.     IN    A    192.168.1.40
faucet.$DOMAIN.       IN    A    192.168.1.41
docs.$DOMAIN.         IN    A    192.168.1.42
support.$DOMAIN.      IN    A    192.168.1.43

# Monitoring
monitor.$DOMAIN.      IN    A    192.168.1.50
grafana.$DOMAIN.      IN    A    192.168.1.51
prometheus.$DOMAIN.  IN    A    192.168.1.52

# Main Domain
$DOMAIN.             IN    A    192.168.1.30
$DOMAIN.             IN    AAAA 2001:db8::1

# Wildcard
*.$DOMAIN.           IN    A    192.168.1.30

# Email
$DOMAIN.             IN    MX    10 mail.$DOMAIN

# SPF
$DOMAIN.             IN    TXT   "v=spf1 include:_spf.google.com ~all"

# DMARC
_dmarc.$DOMAIN.      IN    TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@$DOMAIN"

# CAA
$DOMAIN.             IN    CAA   0 issue letsencrypt.org

# TTL
$TTL                 IN    SOA   ns1.$DOMAIN. admin.$DOMAIN. (
                            $(date +%Y%m%d01) ; serial
                            3600       ; refresh
                            1800       ; retry
                            604800     ; expire
                            86400      ; minimum TTL
                        )
EOF

    log_success "DNS configuration file generated: /tmp/kaldrix-dns-config.txt"
}

# Function to setup SSL certificates
setup_ssl_certificates() {
    log "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p /etc/ssl/kaldrix
    
    # Generate self-signed certificates for initial setup
    for subdomain in api explorer faucet docs support monitor grafana prometheus; do
        openssl req -x509 -newkey rsa:4096 -keyout /etc/ssl/kaldrix/${subdomain}.key \
            -out /etc/ssl/kaldrix/${subdomain}.crt -days 365 -nodes \
            -subj "/C=US/ST=California/L=San Francisco/O=KALDRIX/CN=${subdomain}.${DOMAIN}"
        
        chmod 600 /etc/ssl/kaldrix/${subdomain}.key
        chmod 644 /etc/ssl/kaldrix/${subdomain}.crt
    done
    
    # Generate wildcard certificate
    openssl req -x509 -newkey rsa:4096 -keyout /etc/ssl/kaldrix/wildcard.key \
        -out /etc/ssl/kaldrix/wildcard.crt -days 365 -nodes \
        -subj "/C=US/ST=California/L=San Francisco/O=KALDRIX/CN=*.${DOMAIN}"
    
    chmod 600 /etc/ssl/kaldrix/wildcard.key
    chmod 644 /etc/ssl/kaldrix/wildcard.crt
    
    log_success "SSL certificates setup completed"
}

# Function to create nginx configuration
create_nginx_config() {
    log "Creating nginx configuration..."
    
    # Create nginx directory
    mkdir -p /etc/nginx/sites-available
    mkdir -p /etc/nginx/sites-enabled
    
    # Create main nginx config
    cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    gzip on;
    
    include /etc/nginx/sites-enabled/*;
}
EOF

    # Create site configurations
    for site in api explorer faucet docs support; do
        cat > /etc/nginx/sites-available/${site}.${DOMAIN} << EOF
server {
    listen 80;
    server_name ${site}.${DOMAIN} www.${site}.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${site}.${DOMAIN} www.${site}.${DOMAIN};
    
    ssl_certificate /etc/ssl/kaldrix/${site}.crt;
    ssl_certificate_key /etc/ssl/kaldrix/${site}.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to backend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
        
        # Enable site
        ln -sf /etc/nginx/sites-available/${site}.${DOMAIN} /etc/nginx/sites-enabled/
    done
    
    # Create monitoring config
    cat > /etc/nginx/sites-available/monitor.${DOMAIN} << EOF
server {
    listen 80;
    server_name monitor.${DOMAIN} grafana.${DOMAIN} prometheus.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name monitor.${DOMAIN};
    
    ssl_certificate /etc/ssl/kaldrix/monitor.crt;
    ssl_certificate_key /etc/ssl/kaldrix/monitor.key;
    
    location /grafana/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/monitor.${DOMAIN} /etc/nginx/sites-enabled/
    
    log_success "Nginx configuration created"
}

# Main execution
main() {
    log "Starting KALDRIX DNS Configuration..."
    log "Domain: $DOMAIN"
    log "DNS Provider: $DNS_PROVIDER"
    
    # Step 1: Generate DNS configuration
    generate_dns_config
    
    # Step 2: Setup DNS records
    setup_dns_records
    
    # Step 3: Setup SSL certificates
    setup_ssl_certificates
    
    # Step 4: Create nginx configuration
    create_nginx_config
    
    # Step 5: Verify DNS records
    verify_dns_records
    
    log_success "KALDRIX DNS Configuration completed successfully!"
    
    # Display important information
    echo ""
    echo "=== KALDRIX DNS CONFIGURATION SUMMARY ==="
    echo "Domain: $DOMAIN"
    echo "DNS Provider: $DNS_PROVIDER"
    echo ""
    echo "DNS Records Created:"
    echo "  - Bootstrap Nodes: bootstrap1-3.$DOMAIN"
    echo "  - Validator Nodes: validator1-4.$DOMAIN"
    echo "  - API Endpoints: api1-3.$DOMAIN"
    echo "  - Web Services: explorer, faucet, docs, support.$DOMAIN"
    echo "  - Monitoring: monitor, grafana, prometheus.$DOMAIN"
    echo ""
    echo "SSL Certificates:"
    echo "  - Location: /etc/ssl/kaldrix/"
    echo "  - Self-signed certificates generated for all services"
    echo ""
    echo "Nginx Configuration:"
    echo "  - Config files: /etc/nginx/sites-available/"
    echo "  - Enabled sites: /etc/nginx/sites-enabled/"
    echo ""
    echo "Next Steps:"
    echo "1. Update DNS records with actual IP addresses"
    echo "2. Replace self-signed certificates with Let's Encrypt"
    echo "3. Test all domain resolutions"
    echo "4. Configure load balancers"
    echo ""
}

# Execute main function
main "$@"