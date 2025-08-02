# KALDRIX Production Deployment Guide

This guide provides comprehensive instructions for deploying the KALDRIX blockchain to a production environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Environment Setup](#environment-setup)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 500GB SSD
- **Network**: 1Gbps
- **OS**: Ubuntu 22.04 LTS or Debian 12

#### Recommended Requirements
- **CPU**: 16 cores
- **RAM**: 32GB
- **Storage**: 1TB NVMe SSD
- **Network**: 10Gbps
- **OS**: Ubuntu 22.04 LTS or Debian 12

### Software Dependencies

#### Required Software
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    docker \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    curl \
    wget \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    sqlite3 \
    logrotate

# Install Rust (if building from source)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Node.js (for frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Docker Configuration
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Configure Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker

# Verify Docker installation
docker --version
docker-compose --version
```

## Infrastructure Requirements

### Network Architecture

```
Internet → Cloudflare (DDoS Protection) → Load Balancer → KALDRIX Nodes
                                                    ↓
                                              Monitoring Stack
                                                    ↓
                                              Backup Storage
```

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential ports
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8080/tcp  # Blockchain API
sudo ufw allow 8999/tcp  # P2P Communication
sudo ufw allow 6379/tcp  # Redis
sudo ufw allow 9090/tcp  # Prometheus
sudo ufw allow 3000/tcp  # Grafana

# Enable firewall
sudo ufw enable
```

### SSL/TLS Configuration

#### Generate SSL Certificates
```bash
# Generate SSL certificate using Let's Encrypt
sudo certbot --nginx -d kaldrix.com -d api.kaldrix.com -d monitor.kaldrix.com

# Test certificate renewal
sudo certbot renew --dry-run
```

#### Configure Automatic Renewal
```bash
# Add certbot renewal to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Environment Setup

### Create Deployment User

```bash
# Create dedicated user for deployment
sudo useradd -m -s /bin/bash kaldrix
sudo usermod -aG docker kaldrix
sudo usermod -aG sudo kaldrix

# Set password for kaldrix user
sudo passwd kaldrix

# Switch to kaldrix user
sudo su - kaldrix
```

### Create Directory Structure

```bash
# Create necessary directories
mkdir -p /opt/kaldrix/{data,logs,secure,config,ssl,backups}
mkdir -p /opt/kaldrix/monitoring/{prometheus,grafana,alertmanager}

# Set permissions
chmod 700 /opt/kaldrix/secure
chmod 755 /opt/kaldrix/{data,logs,config,ssl,backups}
```

### Environment Configuration

Create `.env.production` file:

```bash
# Database Configuration
DATABASE_URL=sqlite:///data/blockchain.db
DATABASE_MAX_CONNECTIONS=20

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=your-encryption-key-here-32-bytes

# Blockchain Configuration
NETWORK_ID=1
CHAIN_ID=kaldrix-mainnet-1
GENESIS_TIME=2024-01-01T00:00:00Z

# API Configuration
API_PORT=8080
API_RATE_LIMIT=100
API_TIMEOUT=30

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
ALERTMANAGER_PORT=9093
GRAFANA_PASSWORD=your-grafana-password

# SSL Configuration
SSL_EMAIL=admin@kaldrix.com
SSL_STAGING=false

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/kaldrix/app.log

# Performance Configuration
MAX_CONCURRENT_USERS=10000
MAX_TPS=10000
CACHE_TTL=300

# Security Configuration
CORS_ORIGIN=https://kaldrix.com
ALLOWED_HOSTS=kaldrix.com,api.kaldrix.com,monitor.kaldrix.com
```

## Deployment Process

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/ancourn/KALDRIX.git /opt/kaldrix/app
cd /opt/kaldrix/app

# Switch to production branch
git checkout main
```

### 2. Build Application

```bash
# Build Rust backend
cargo build --release

# Build Next.js frontend (if applicable)
npm ci
npm run build
```

### 3. Create Docker Images

```bash
# Build backend Docker image
docker build -f Dockerfile.production -t kaldrix/backend:latest .

# Build frontend Docker image (if applicable)
docker build -f Dockerfile.frontend -t kaldrix/frontend:latest .
```

### 4. Configure Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: kaldrix/backend:latest
    container_name: kaldrix-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "8999:8999"
    environment:
      - DEPLOY_ENV=production
      - DATABASE_URL=sqlite:///data/blockchain.db
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./data:/data
      - ./logs:/logs
      - ./secure:/secure
      - ./config:/config
    networks:
      - kaldrix-network
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: kaldrix/frontend:latest
    container_name: kaldrix-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    networks:
      - kaldrix-network
    depends_on:
      - backend

  redis:
    image: redis:7-alpine
    container_name: kaldrix-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - kaldrix-network
    command: redis-server --appendonly yes --maxmemory 512mb

  prometheus:
    image: prom/prometheus:latest
    container_name: kaldrix-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - kaldrix-network

  grafana:
    image: grafana/grafana:latest
    container_name: kaldrix-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - kaldrix-network
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

  alertmanager:
    image: prom/alertmanager:latest
    container_name: kaldrix-alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    networks:
      - kaldrix-network

volumes:
  redis-data:
  prometheus-data:
  grafana-data:
  alertmanager-data:

networks:
  kaldrix-network:
    driver: bridge
```

### 5. Start Services

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f backend
```

### 6. Verify Deployment

```bash
# Check backend health
curl http://localhost:8080/health

# Check API endpoints
curl http://localhost:8080/api/blockchain/status

# Check frontend
curl http://localhost

# Check monitoring services
curl http://localhost:3000  # Grafana
curl http://localhost:9090  # Prometheus
```

## Post-Deployment Configuration

### 1. Configure NGINX Reverse Proxy

Create `/etc/nginx/sites-available/kaldrix`:

```nginx
server {
    listen 80;
    server_name kaldrix.com www.kaldrix.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kaldrix.com www.kaldrix.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/kaldrix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kaldrix.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Proxy to frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy to API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~* \.(log|sql)$ {
        deny all;
    }
}
```

### 2. Configure API Subdomain

Create `/etc/nginx/sites-available/api.kaldrix.com`:

```nginx
server {
    listen 80;
    server_name api.kaldrix.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.kaldrix.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.kaldrix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kaldrix.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    # CORS Configuration
    add_header Access-Control-Allow-Origin https://kaldrix.com;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    limit_req zone=api burst=200 nodelay;
    
    # Proxy to backend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

### 3. Enable Sites

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/kaldrix /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.kaldrix.com /etc/nginx/sites-enabled/

# Test NGINX configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### 4. Configure Log Rotation

Create `/etc/logrotate.d/kaldrix`:

```bash
/opt/kaldrix/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 kaldrix kaldrix
    postrotate
        docker-compose -f /opt/kaldrix/docker-compose.production.yml exec backend pkill -USR1 main
    endscript
}
```

## Monitoring and Maintenance

### 1. Set Up Monitoring

#### Prometheus Configuration

Create `/opt/kaldrix/monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kaldrix-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'kaldrix-redis'
    static_configs:
      - targets: ['localhost:6379']

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
```

#### Grafana Configuration

Create `/opt/kaldrix/monitoring/grafana/provisioning/datasources/prometheus.yml`:

```yaml
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
```

### 2. Set Up Backups

#### Automated Backup Script

Create `/opt/kaldrix/scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/kaldrix/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup
tar -czf "$BACKUP_DIR/kaldrix-backup-$TIMESTAMP.tar.gz" \
    -C /opt/kaldrix \
    data \
    config \
    secure \
    --exclude=secure/keys

# Upload to cloud storage (optional)
# aws s3 cp "$BACKUP_DIR/kaldrix-backup-$TIMESTAMP.tar.gz" s3://kaldrix-backups/

# Clean old backups
find "$BACKUP_DIR" -name "kaldrix-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: kaldrix-backup-$TIMESTAMP.tar.gz"
```

#### Schedule Backups

```bash
# Add to crontab
echo "0 2 * * * /opt/kaldrix/scripts/backup.sh" | crontab -
```

### 3. Set Up Health Checks

#### Health Check Script

Create `/opt/kaldrix/scripts/health-check.sh`:

```bash
#!/bin/bash

# Check backend health
if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "Backend is not healthy"
    exit 1
fi

# Check API endpoints
if ! curl -f http://localhost:8080/api/blockchain/status > /dev/null 2>&1; then
    echo "API endpoints are not accessible"
    exit 1
fi

# Check database
if [ ! -f "/opt/kaldrix/data/blockchain.db" ]; then
    echo "Database file not found"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df /opt/kaldrix | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "Disk usage is critical: $DISK_USAGE%"
    exit 1
fi

echo "All health checks passed"
```

#### Schedule Health Checks

```bash
# Add to crontab
echo "*/5 * * * * /opt/kaldrix/scripts/health-check.sh" | crontab -
```

## Troubleshooting

### Common Issues

#### 1. Docker Container Not Starting

```bash
# Check container logs
docker-compose -f docker-compose.production.yml logs backend

# Check container status
docker-compose -f docker-compose.production.yml ps

# Restart container
docker-compose -f docker-compose.production.yml restart backend
```

#### 2. Database Connection Issues

```bash
# Check database file
ls -la /opt/kaldrix/data/blockchain.db

# Check database permissions
chmod 644 /opt/kaldrix/data/blockchain.db
chown kaldrix:kaldrix /opt/kaldrix/data/blockchain.db

# Test database connection
sqlite3 /opt/kaldrix/data/blockchain.db ".tables"
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test SSL configuration
openssl s_client -connect kaldrix.com:443 -servername kaldrix.com
```

#### 4. Performance Issues

```bash
# Check system resources
htop
df -h
free -h

# Check Docker resource usage
docker stats

# Check application logs
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Debug Commands

```bash
# Check all services status
docker-compose -f docker-compose.production.yml ps

# View real-time logs
docker-compose -f docker-compose.production.yml logs -f backend

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend

# Check network connectivity
docker network ls
docker network inspect kaldrix_kaldrix-network

# Check disk usage
du -sh /opt/kaldrix/*
```

## Security Considerations

### 1. System Hardening

```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Configure automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Configure fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Application Security

```bash
# Set proper file permissions
chmod 600 /opt/kaldrix/.env
chmod 700 /opt/kaldrix/secure
chmod 755 /opt/kaldrix/scripts/*.sh

# Configure firewall
sudo ufw enable
sudo ufw status

# Monitor logs
sudo tail -f /var/log/auth.log
sudo tail -f /opt/kaldrix/logs/app.log
```

### 3. Backup Security

```bash
# Encrypt backups
gpg --symmetric --cipher-algo AES256 /opt/kaldrix/backups/kaldrix-backup-latest.tar.gz

# Store backups securely
# Use cloud storage with encryption
# Implement off-site backup strategy
```

## Conclusion

This production deployment guide provides a comprehensive framework for deploying the KALDRIX blockchain in a production environment. Following these guidelines will ensure a secure, stable, and performant deployment.

### Key Points to Remember

1. **Security First**: Always prioritize security in all deployment decisions
2. **Monitoring**: Implement comprehensive monitoring and alerting
3. **Backups**: Maintain regular, encrypted backups
4. **Documentation**: Keep deployment documentation up to date
5. **Testing**: Thoroughly test all deployment procedures

### Next Steps

1. **Deploy**: Follow the deployment process step by step
2. **Monitor**: Set up monitoring and alerting
3. **Test**: Perform load testing and security testing
4. **Document**: Document your specific deployment configuration
5. **Maintain**: Establish regular maintenance procedures

For additional support or questions, refer to the project documentation or contact the development team.

---

*This guide is part of the KALDRIX blockchain documentation suite.*