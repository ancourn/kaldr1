# KALDRIX Deployment Runbook

## 📖 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environments](#environments)
4. [Deployment Process](#deployment-process)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Emergency Procedures](#emergency-procedures)
9. [Post-Deployment Tasks](#post-deployment-tasks)
10. [Checklists](#checklists)

## 🎯 Overview

This runbook provides step-by-step instructions for deploying the KALDRIX blockchain development platform across different environments. It covers the entire deployment lifecycle from preparation to post-deployment monitoring.

### Key Information
- **Application**: KALDRIX Blockchain Development Platform
- **Architecture**: Next.js 15 + TypeScript + Prisma + Docker
- **Repository**: https://github.com/ancourn/kaldr1
- **Current Version**: v6.0.0-release-candidate

## 🛠️ Prerequisites

### System Requirements
- **Docker**: 20.10 or higher
- **Docker Compose**: 1.29 or higher
- **Node.js**: 18.x (for local development)
- **Git**: 2.30 or higher
- **Minimum RAM**: 4GB (8GB recommended)
- **Minimum Storage**: 10GB free space

### Required Access
- **GitHub Access**: Read/Write access to repository
- **Docker Hub Access**: For pushing/pulling images (optional)
- **Server Access**: SSH access to deployment servers
- **Database Access**: For database operations
- **Monitoring Access**: For dashboard access

### Environment Variables
```bash
# Required for all environments
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@host:port/database

# Staging specific
NODE_ENV=staging
LOG_LEVEL=debug

# Production specific
NODE_ENV=production
LOG_LEVEL=info
```

## 🌍 Environments

### 1. Development Environment
- **Purpose**: Local development and testing
- **URL**: http://localhost:3000
- **Database**: SQLite (local file)
- **Features**: Hot reload, debug logging, test data

### 2. Staging Environment
- **Purpose**: Pre-production testing and validation
- **URL**: http://staging.example.com:3000
- **Database**: PostgreSQL (containerized)
- **Features**: Production-like setup, monitoring, testing

### 3. Production Environment
- **Purpose**: Live production deployment
- **URL**: https://kaldr1.example.com
- **Database**: PostgreSQL (managed service)
- **Features**: Full monitoring, backups, security

## 🚀 Deployment Process

### Phase 1: Preparation

#### 1.1 Environment Setup
```bash
# Clone repository
git clone https://github.com/ancourn/kaldr1.git
cd kaldr1

# Switch to correct branch
git checkout phase6-validation-fixes

# Install dependencies
npm ci

# Copy environment files
cp .env.example .env
cp .env.staging.example .env.staging
```

#### 1.2 Configuration
```bash
# Edit environment variables
nano .env.staging

# Set required variables
export NEXTAUTH_SECRET="your-staging-secret"
export NEXTAUTH_URL="http://staging.example.com:3000"
export DATABASE_URL="postgresql://postgres:staging-password@db:5432/kaldr1_staging"
```

#### 1.3 Pre-deployment Checks
```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run unit tests
npm run test:unit

# Run security audit
npm run security:audit
```

### Phase 2: Building & Testing

#### 2.1 Build Application
```bash
# Build Docker image
docker build -t kaldr1:staging .

# Alternatively, use docker-compose
docker-compose -f docker-compose.staging.yml build
```

#### 2.2 Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run database migrations (if using)
npx prisma migrate deploy

# Seed database with test data
npm run db:seed
```

#### 2.3 Pre-deployment Testing
```bash
# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

### Phase 3: Deployment

#### 3.1 Automated Deployment (Recommended)
```bash
# Use deployment script
./scripts/deploy-staging.sh

# Or use docker-compose directly
docker-compose -f docker-compose.staging.yml up -d
```

#### 3.2 Manual Deployment Steps
```bash
# Stop existing containers
docker-compose -f docker-compose.staging.yml down

# Remove old images (optional)
docker rmi kaldr1:staging

# Pull latest changes
git pull origin phase6-validation-fixes

# Build new image
docker-compose -f docker-compose.staging.yml build

# Start new containers
docker-compose -f docker-compose.staging.yml up -d
```

#### 3.3 Verify Deployment
```bash
# Check container status
docker-compose -f docker-compose.staging.yml ps

# View application logs
docker-compose -f docker-compose.staging.yml logs -f app

# Check health endpoint
curl http://localhost:3000/api/health
```

### Phase 4: Post-Deployment

#### 4.1 Health Checks
```bash
# Application health
curl -f http://localhost:3000/api/health

# Database health
docker-compose -f docker-compose.staging.yml exec db pg_isready -U postgres

# API endpoints
curl -f http://localhost:3000/api/blockchain/status
curl -f http://localhost:3000/api/blockchain/contracts
curl -f http://localhost:3000/api/blockchain/transactions
```

#### 4.2 Smoke Tests
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'

# Test blockchain APIs
curl http://localhost:3000/api/blockchain/networks
curl http://localhost:3000/api/blockchain/metrics

# Test WebSocket connection
curl -I http://localhost:3000/api/socketio
```

#### 4.3 Monitoring Setup
```bash
# Access Grafana dashboard
open http://localhost:3001

# Access Prometheus metrics
open http://localhost:9090

# View application logs
docker-compose -f docker-compose.staging.yml logs -f app
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

#### Application Health
```bash
# General health check
GET /api/health

# Detailed health check
GET /api/health/detailed

# Database health check
GET /api/health/database

# Blockchain health check
GET /api/health/blockchain
```

#### Expected Responses
```json
// Healthy response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "v6.0.0",
  "checks": {
    "database": "healthy",
    "blockchain": "healthy",
    "authentication": "healthy"
  }
}

// Unhealthy response
{
  "status": "unhealthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "v6.0.0",
  "checks": {
    "database": "unhealthy",
    "blockchain": "healthy",
    "authentication": "healthy"
  },
  "errors": ["Database connection failed"]
}
```

### Monitoring Dashboard

#### Grafana Dashboards
1. **Application Overview**
   - Response times
   - Error rates
   - Active users
   - Memory usage

2. **Database Performance**
   - Query performance
   - Connection count
   - Storage usage
   - Cache hit ratio

3. **Blockchain Metrics**
   - Network status
   - Transaction count
   - Block time
   - Gas usage

4. **System Resources**
   - CPU usage
   - Memory usage
   - Disk usage
   - Network traffic

### Alerting Rules

#### Critical Alerts
- Application down for more than 5 minutes
- Database connection failure
- Authentication system failure
- High error rate (> 10%)

#### Warning Alerts
- High memory usage (> 80%)
- High CPU usage (> 80%)
- Slow database queries (> 1s)
- Failed login attempts (> 10/min)

## 🔄 Rollback Procedures

### When to Rollback
- Critical bugs affecting core functionality
- Security vulnerabilities discovered
- Performance degradation (> 50% slower)
- Data corruption or loss
- Compatibility issues

### Automated Rollback
```bash
# Use rollback script
./scripts/rollback.sh v6.0.0-release-candidate

# Or manually rollback to specific commit
git checkout v6.0.0-release-candidate
docker-compose -f docker-compose.staging.yml build
docker-compose -f docker-compose.staging.yml up -d
```

### Manual Rollback Steps
```bash
# 1. Stop current deployment
docker-compose -f docker-compose.staging.yml down

# 2. Backup current database
docker exec kaldr1_staging_db pg_dump -U postgres kaldr1_staging > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Checkout previous version
git checkout v6.0.0-release-candidate

# 4. Rebuild and deploy
docker-compose -f docker-compose.staging.yml build
docker-compose -f docker-compose.staging.yml up -d

# 5. Verify rollback
curl http://localhost:3000/api/health
```

### Rollback Verification
```bash
# Check application version
curl http://localhost:3000/api/version

# Verify database integrity
docker-compose -f docker-compose.staging.yml exec db psql -U postgres -d kaldr1_staging -c "SELECT COUNT(*) FROM users;"

# Test core functionality
curl http://localhost:3000/api/blockchain/status
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Application Won't Start
**Symptoms**: Container exits immediately, logs show errors

**Solutions**:
```bash
# Check container logs
docker-compose -f docker-compose.staging.yml logs app

# Check environment variables
docker-compose -f docker-compose.staging.yml exec app env

# Check port conflicts
netstat -tulpn | grep :3000

# Check disk space
df -h
```

#### 2. Database Connection Issues
**Symptoms**: Application can't connect to database

**Solutions**:
```bash
# Check database container status
docker-compose -f docker-compose.staging.yml ps db

# Check database logs
docker-compose -f docker-compose.staging.yml logs db

# Test database connection
docker-compose -f docker-compose.staging.yml exec db pg_isready -U postgres

# Check database URL
echo $DATABASE_URL
```

#### 3. Authentication Issues
**Symptoms**: Users can't login, auth errors

**Solutions**:
```bash
# Check NextAuth configuration
docker-compose -f docker-compose.staging.yml exec app cat .env

# Check database user table
docker-compose -f docker-compose.staging.yml exec db psql -U postgres -d kaldr1_staging -c "SELECT * FROM users;"

# Check auth logs
docker-compose -f docker-compose.staging.yml logs app | grep -i auth
```

#### 4. Performance Issues
**Symptoms**: Slow response times, high CPU usage

**Solutions**:
```bash
# Check resource usage
docker stats

# Check application logs
docker-compose -f docker-compose.staging.yml logs app | grep -i error

# Check database queries
docker-compose -f docker-compose.staging.yml exec db psql -U postgres -d kaldr1_staging -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check network latency
ping localhost
```

### Debug Commands
```bash
# General system info
docker-compose -f docker-compose.staging.yml exec app uname -a
docker-compose -f docker-compose.staging.yml exec app free -h
docker-compose -f docker-compose.staging.yml exec app df -h

# Application info
docker-compose -f docker-compose.staging.yml exec app node --version
docker-compose -f docker-compose.staging.yml exec app npm list --depth=0

# Database info
docker-compose -f docker-compose.staging.yml exec db psql -U postgres -d kaldr1_staging -c "SELECT version();"
docker-compose -f docker-compose.staging.yml exec db psql -U postgres -d kaldr1_staging -c "\l+"
```

## 🚨 Emergency Procedures

### Critical Failure Response

#### 1. Immediate Actions
```bash
# Stop all services
docker-compose -f docker-compose.staging.yml down

# Create emergency backup
docker exec kaldr1_staging_db pg_dump -U postgres kaldr1_staging > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# Notify team
echo "CRITICAL: KALDRIX staging environment down at $(date)" | mail -s "Critical Outage" team@example.com
```

#### 2. Assessment
```bash
# Check system status
docker system info
docker ps -a

# Check resource usage
top
df -h
free -h

# Check logs
docker-compose -f docker-compose.staging.yml logs --tail=100
```

#### 3. Recovery
```bash
# Start minimal services
docker-compose -f docker-compose.staging.yml up -d db redis

# Restore database if needed
docker exec -i kaldr1_staging_db psql -U postgres kaldr1_staging < emergency_backup_YYYYMMDD_HHMMSS.sql

# Start application
docker-compose -f docker-compose.staging.yml up -d app

# Verify recovery
curl http://localhost:3000/api/health
```

### Security Incident Response

#### 1. Containment
```bash
# Isolate affected systems
docker-compose -f docker-compose.staging.yml down

# Preserve evidence
docker logs kaldr1_staging_app > security_incident_$(date +%Y%m%d_%H%M%S).log
docker exec kaldr1_staging_db pg_dump -U postgres kaldr1_staging > security_incident_db_$(date +%Y%m%d_%H%M%S).sql

# Change credentials
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export DATABASE_URL="postgresql://postgres:$(openssl rand -base64 16)@db:5432/kaldr1_staging"
```

#### 2. Investigation
```bash
# Review access logs
docker-compose -f docker-compose.staging.yml logs app | grep -E "(ERROR|WARN|Unauthorized)"

# Check database changes
docker-compose -f docker-compose.staging.yml exec db psql -U postgres -d kaldr1_staging -c "SELECT * FROM audit_log WHERE timestamp > now() - interval '24 hours' ORDER BY timestamp DESC;"

# Analyze network traffic
tcpdump -i any -w security_incident_traffic.pcap
```

#### 3. Recovery
```bash
# Restore from clean backup
docker exec -i kaldr1_staging_db psql -U postgres kaldr1_staging < clean_backup.sql

# Restart services with new credentials
docker-compose -f docker-compose.staging.yml up -d

# Verify security
curl http://localhost:3000/api/health
```

## 📝 Post-Deployment Tasks

### 1. Documentation Update
- [ ] Update deployment runbook with any changes
- [ ] Update monitoring dashboards
- [ ] Update API documentation
- [ ] Update architecture diagrams
- [ ] Update security documentation

### 2. Performance Monitoring
```bash
# Monitor performance for 24 hours
docker stats --interval 60 > performance_stats_$(date +%Y%m%d).log

# Check error rates
docker-compose -f docker-compose.staging.yml logs app | grep -c "ERROR" > error_count_$(date +%Y%m%d).log

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/health >> response_times_$(date +%Y%m%d).log
```

### 3. User Acceptance Testing (UAT)
- [ ] Core functionality testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Integration testing
- [ ] User interface testing

### 4. Stakeholder Communication
```bash
# Send deployment notification
echo "Deployment completed successfully at $(date)" | mail -s "Deployment Complete" stakeholders@example.com

# Share monitoring dashboards
echo "Monitoring dashboards available at: http://localhost:3001" | mail -s "Monitoring Dashboards" team@example.com
```

### 5. Continuous Improvement
- [ ] Document lessons learned
- [ ] Update deployment scripts
- [ ] Improve monitoring
- [ ] Update security measures
- [ ] Plan next deployment

## ✅ Checklists

### Pre-Deployment Checklist
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance tests completed
- [ ] Database backed up
- [ ] Environment variables configured
- [ ] Deployment scripts tested
- [ ] Rollback plan prepared
- [ ] Team notified
- [ ] Maintenance window scheduled

### Deployment Checklist
- [ ] Current deployment backed up
- [ ] Database backed up
- [ ] New version built successfully
- [ ] Containers stopped gracefully
- [ ] New version deployed
- [ ] Services started successfully
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Documentation updated

### Post-Deployment Checklist
- [ ] All services running
- [ ] Health checks passing
- [ ] Performance metrics normal
- [ ] Error rates within limits
- [ ] Security scans passed
- [ ] User acceptance testing complete
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Lessons learned documented
- [ ] Next deployment planned

### Emergency Checklist
- [ ] Incident identified and assessed
- [ ] Team notified
- [ ] Users notified
- [ ] Containment measures implemented
- [ ] Evidence preserved
- [ ] Root cause analysis started
- [ ] Recovery plan executed
- [ ] Services restored
- [ ] Verification completed
- [ ] Documentation updated
- [ ] Post-incident review scheduled

---

**Last Updated**: 2025-08-09
**Version**: v6.0.0
**Maintainers**: Development Team
**Next Review**: 2025-09-09