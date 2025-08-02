# TLS & Reverse Proxy Setup for Quantum-Proof DAG Blockchain

This document describes the comprehensive TLS and reverse proxy setup for the Quantum-Proof DAG Blockchain, providing secure HTTPS access and load balancing capabilities.

## Overview

The TLS and reverse proxy setup provides:
- Automatic SSL certificate management with Let's Encrypt
- Reverse proxy capabilities with NGINX or Caddy
- Load balancing for multiple blockchain nodes
- Security headers and hardening
- Monitoring and metrics collection
- High availability and failover support

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Internet      │    │   Reverse Proxy │    │   Blockchain    │
│                 │───▶│   (NGINX/Caddy) │───▶│    Nodes       │
│  https://domain │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Monitoring    │
                       │   (Prometheus/   │
                       │    Grafana)      │
                       └─────────────────┘
```

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
sudo ./scripts/setup-tls.sh

# Follow the prompts to select your reverse proxy
# The script will handle:
# - Package installation
# - SSL certificate setup
# - Reverse proxy configuration
# - Firewall setup
# - Monitoring setup
```

### Option 2: Manual Setup

#### 1. Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx docker docker-compose
```

**CentOS/RHEL:**
```bash
sudo yum update -y
sudo yum install -y nginx certbot python3-certbot-nginx docker docker-compose
```

**Arch Linux:**
```bash
sudo pacman -Syu
sudo pacman -S nginx certbot docker docker-compose
```

#### 2. Configure Reverse Proxy

**NGINX Configuration:**
```bash
# Copy NGINX configuration
sudo cp nginx.conf /etc/nginx/nginx.conf

# Generate htpasswd for metrics endpoint
sudo htpasswd -b -c /etc/nginx/.htpasswd_metrics prometheus secure_metrics_password

# Test configuration
sudo nginx -t

# Start NGINX
sudo systemctl enable nginx
sudo systemctl start nginx
```

**Caddy Configuration:**
```bash
# Copy Caddy configuration
sudo cp Caddyfile /etc/caddy/Caddyfile

# Create Caddy user and directories
sudo useradd -r -d /etc/caddy -s /bin/false caddy
sudo chown -R caddy:caddy /etc/caddy

# Create systemd service
sudo systemctl enable caddy
sudo systemctl start caddy
```

#### 3. Setup SSL Certificates

```bash
# Stop web servers temporarily
sudo systemctl stop nginx || true
sudo systemctl stop caddy || true

# Get SSL certificates
sudo certbot certonly --standalone \
    --email admin@yourdomain.com \
    --agree-tos \
    --no-eff-email \
    -d yourdomain.com \
    -d api.yourdomain.com \
    -d monitor.yourdomain.com

# Setup auto-renewal
echo '#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx || systemctl reload caddy"' | sudo tee /etc/cron.daily/certbot-renew
sudo chmod +x /etc/cron.daily/certbot-renew
```

#### 4. Start Blockchain Services

```bash
# Create directories
sudo mkdir -p /data/{blockchain,identity,backups,exports}
sudo mkdir -p /logs/{nginx,caddy,blockchain}
sudo chmod 750 /data /logs

# Start blockchain node
sudo systemctl start quantum-dag-blockchain

# Start monitoring services
docker-compose -f docker-compose.tls.yml up -d
```

## Configuration Files

### NGINX Configuration (`nginx.conf`)

The NGINX configuration provides:
- TLS termination with modern cipher suites
- HTTP/2 support
- Security headers
- Rate limiting
- Load balancing
- WebSocket support
- Metrics endpoint protection

**Key Features:**
- Automatic HTTP to HTTPS redirect
- HSTS (HTTP Strict Transport Security)
- OCSP stapling
- Content Security Policy
- Rate limiting zones
- Upstream load balancing

### Caddy Configuration (`Caddyfile`)

The Caddy configuration provides:
- Automatic SSL certificate management
- Simple configuration syntax
- Built-in Let's Encrypt integration
- HTTP/3 support
- Automatic HTTPS redirects

**Key Features:**
- Zero-configuration SSL
- Automatic certificate renewal
- Built-in security headers
- Rate limiting
- Load balancing
- WebSocket support

### Docker Compose Configuration (`docker-compose.tls.yml`)

The Docker Compose configuration includes:
- Blockchain node service
- Reverse proxy options (NGINX or Caddy)
- Prometheus monitoring
- Grafana visualization
- Node exporter for system metrics
- Certbot for SSL certificates

**Service Profiles:**
- `nginx`: Use NGINX as reverse proxy
- `caddy`: Use Caddy as reverse proxy
- `monitoring`: Start monitoring services
- `certbot`: SSL certificate management

## Security Features

### 1. **TLS Configuration**
- Modern cipher suites (TLS 1.2 and 1.3)
- Perfect Forward Secrecy (PFS)
- OCSP stapling
- HSTS preloading
- Certificate transparency

### 2. **Security Headers**
```nginx
# NGINX security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; ...";
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

### 3. **Rate Limiting**
```nginx
# API rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Apply rate limiting
location / {
    limit_req zone=api burst=20 nodelay;
}
```

### 4. **Access Control**
- IP-based restrictions for sensitive endpoints
- Basic authentication for metrics
- Blocked access to sensitive files
- CORS configuration for API endpoints

### 5. **Firewall Configuration**
```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 9090/tcp  # Prometheus
sudo ufw allow 3000/tcp  # Grafana
sudo ufw --force enable
```

## Monitoring Setup

### 1. **Prometheus Configuration**

The Prometheus configuration (`monitoring/prometheus.yml`) includes:
- Blockchain metrics scraping
- System metrics collection
- Reverse proxy metrics
- Alert management

**Key Metrics:**
- Transaction processing metrics
- DAG structure metrics
- System resource metrics
- Network metrics

### 2. **Grafana Dashboard**

The pre-configured Grafana dashboard provides:
- Real-time blockchain metrics
- System resource monitoring
- Transaction throughput visualization
- Alert status display

### 3. **Alert Rules**

The alert rules (`monitoring/alert_rules.yml`) include:
- High transaction latency alerts
- System resource alerts
- Node health alerts
- Network connectivity alerts

## High Availability Setup

### 1. **Load Balancing**

**NGINX Upstream Configuration:**
```nginx
upstream blockchain_backend {
    least_conn;
    server 127.0.0.1:8080 weight=10 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8081 weight=10 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8082 weight=10 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### 2. **Health Checks**

```nginx
# Health check endpoint
location /health {
    proxy_pass http://blockchain_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Health check specific settings
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

### 3. **Failover Configuration**

- Maximum failures: 3
- Fail timeout: 30 seconds
- Health check interval: 30 seconds
- Health check timeout: 5 seconds

## Performance Optimization

### 1. **Connection Settings**
```nginx
# Keepalive settings
keepalive_timeout 65;
keepalive_requests 100;
keepalive_disable msie6;

# Buffer settings
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

### 2. **SSL Optimization**
```nginx
# SSL session cache
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# SSL buffer size
ssl_buffer_size 4k;
```

### 3. **Caching**
```nginx
# Static file caching
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Management Commands

### 1. **Service Management**
```bash
# Start services
sudo systemctl start quantum-dag-blockchain
sudo systemctl start nginx
sudo systemctl start caddy

# Stop services
sudo systemctl stop quantum-dag-blockchain
sudo systemctl stop nginx
sudo systemctl stop caddy

# Restart services
sudo systemctl restart quantum-dag-blockchain
sudo systemctl restart nginx
sudo systemctl restart caddy

# Check status
sudo systemctl status quantum-dag-blockchain
sudo systemctl status nginx
sudo systemctl status caddy
```

### 2. **SSL Certificate Management**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal process
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

### 3. **Monitoring Commands**
```bash
# Start monitoring services
docker-compose -f docker-compose.tls.yml up -d prometheus grafana node-exporter

# Stop monitoring services
docker-compose -f docker-compose.tls.yml down

# Check service status
docker-compose -f docker-compose.tls.yml ps

# View logs
docker-compose -f docker-compose.tls.yml logs -f prometheus
```

### 4. **Configuration Testing**
```bash
# Test NGINX configuration
sudo nginx -t

# Reload NGINX configuration
sudo systemctl reload nginx

# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy configuration
sudo systemctl reload caddy
```

## Troubleshooting

### Common Issues

#### 1. **SSL Certificate Issues**
```
Problem: SSL certificate not working
Solution: 
1. Check DNS A records point to server
2. Verify port 443 is open
3. Check certbot logs: sudo journalctl -u certbot
4. Test certificate: sudo certbot certificates
```

#### 2. **Reverse Proxy Not Working**
```
Problem: 502 Bad Gateway errors
Solution:
1. Check blockchain node is running
2. Verify upstream server configuration
3. Check firewall rules
4. Test backend connectivity: curl http://localhost:8080/health
```

#### 3. **High CPU/Memory Usage**
```
Problem: High resource usage
Solution:
1. Check number of connections: netstat -an | grep :443
2. Monitor process: top -p $(pgrep nginx)
3. Adjust worker processes: worker_processes auto;
4. Check for DDoS attacks
```

#### 4. **WebSocket Issues**
```
Problem: WebSocket connections failing
Solution:
1. Verify upgrade headers are passed
2. Check timeout settings
3. Test WebSocket: wscat -c wss://yourdomain.com/api/socketio/
4. Check browser console for errors
```

### Debug Commands

```bash
# Check service status
sudo systemctl status quantum-dag-blockchain nginx caddy

# View logs
sudo journalctl -u quantum-dag-blockchain -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/caddy/caddy.log

# Test connectivity
curl -I https://yourdomain.com
curl -I https://yourdomain.com/health
curl -I https://yourdomain.com/metrics

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
sudo certbot certificates

# Check network connections
netstat -tuln | grep ':443'
netstat -tuln | grep ':80'
ss -tuln | grep ':443'

# Monitor resources
htop
df -h
free -h

# Test DNS resolution
nslookup yourdomain.com
dig yourdomain.com
```

### Log Analysis

**NGINX Access Log Format:**
```
'$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" "$http_x_forwarded_for"'
```

**Common Log Patterns:**
```bash
# View 502 errors
grep " 502 " /var/log/nginx/access.log

# View slow requests
awk '($NF > 5.0) {print}' /var/log/nginx/access.log

# View top IP addresses
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# View HTTP methods distribution
awk '{print $6}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
```

## Production Deployment

### 1. **Production Checklist**
- [ ] Domain DNS configured
- [ ] SSL certificates obtained
- [ ] Firewall rules configured
- [ ] Services started and enabled
- [ ] Monitoring services running
- [ ] Alert rules configured
- [ ] Backup system configured
- [ ] Log rotation configured
- [ ] Security audit completed
- [ ] Performance testing completed

### 2. **Security Hardening**
```bash
# Remove unnecessary services
sudo systemctl disable apache2 apache2-utils
sudo systemctl disable exim4
sudo systemctl disable postfix

# Update system
sudo apt update && sudo apt upgrade -y

# Configure automatic updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Secure SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no, PasswordAuthentication no, PubkeyAuthentication yes
sudo systemctl restart sshd

# Configure fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. **Performance Tuning**
```bash
# Optimize system limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_tw_reuse = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Optimize NGINX worker processes
sudo nano /etc/nginx/nginx.conf
# Set: worker_processes auto; worker_connections 1024;
```

### 4. **Backup Strategy**
```bash
# Backup configuration files
sudo tar -czf /backup/nginx-config-$(date +%Y%m%d).tar.gz /etc/nginx/
sudo tar -czf /backup/caddy-config-$(date +%Y%m%d).tar.gz /etc/caddy/
sudo tar -czf /backup/ssl-certs-$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Backup blockchain data
sudo tar -czf /backup/blockchain-data-$(date +%Y%m%d).tar.gz /data/

# Setup automated backups
echo "0 2 * * * tar -czf /backup/blockchain-daily-$(date +\%Y\%m\%d).tar.gz /data/" | sudo crontab -
echo "0 3 * * 0 tar -czf /backup/blockchain-weekly-$(date +\%Y\%m\%d).tar.gz /data/" | sudo crontab -
```

## Conclusion

The TLS and reverse proxy setup provides a secure, scalable, and monitored environment for the Quantum-Proof DAG Blockchain. With support for both NGINX and Caddy, automatic SSL certificate management, comprehensive monitoring, and high availability features, this setup is suitable for production deployment.

The configuration emphasizes security, performance, and reliability while maintaining ease of management through automation and comprehensive monitoring capabilities.