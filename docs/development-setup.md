# Development Setup Guide

This guide provides comprehensive instructions for setting up the Quantum DAG Blockchain development environment using Docker Compose.

## Quick Start

### Prerequisites

- Docker (>= 20.10)
- Docker Compose (>= 2.0)
- At least 4GB RAM
- 10GB free disk space

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd quantum-dag-blockchain
   ```

2. **Start all services:**
   ```bash
   ./scripts/dev-compose.sh up full
   ```

3. **Check service status:**
   ```bash
   ./scripts/dev-compose.sh status full
   ```

## Service Overview

### Core Services

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| blockchain-backend | 8080 | Rust blockchain backend | `GET /health` |
| blockchain-frontend | 3000 | Next.js frontend | `GET /api/health` |
| sqlite | - | SQLite database | - |

### Monitoring Stack

| Service | Port | Description | Access |
|---------|------|-------------|--------|
| prometheus | 9090 | Metrics collection | http://localhost:9090 |
| grafana | 3001 | Visualization dashboard | http://localhost:3001 |
| node-exporter | 9100 | System metrics | - |
| alertmanager | 9093 | Alert management | http://localhost:9093 |

### Reverse Proxy Options

| Service | Port | Description |
|---------|------|-------------|
| nginx | 80/443 | NGINX reverse proxy |
| caddy | 80/443/2019 | Caddy reverse proxy |

### Additional Services

| Service | Port | Description |
|---------|------|-------------|
| redis | 6379 | Redis cache |
| postgres | 5432 | PostgreSQL database |
| jaeger | 16686 | Jaeger tracing UI |

## Profiles

The development setup supports different profiles to start only the services you need:

### Available Profiles

- **full**: All services (default)
- **backend**: Blockchain backend only
- **frontend**: Frontend only
- **database**: Database services only
- **monitoring**: Monitoring stack only
- **nginx**: NGINX reverse proxy
- **caddy**: Caddy reverse proxy
- **cache**: Redis cache only
- **tracing**: Jaeger tracing only
- **tools**: Development tools only

### Usage Examples

```bash
# Start all services
./scripts/dev-compose.sh up full

# Start only backend
./scripts/dev-compose.sh up backend

# Start monitoring stack
./scripts/dev-compose.sh up monitoring

# Start frontend and backend
./scripts/dev-compose.sh up frontend
./scripts/dev-compose.sh up backend
```

## Development Workflow

### 1. Development Setup

```bash
# Start development environment
./scripts/dev-compose.sh up full

# View logs
./scripts/dev-compose.sh logs full

# Check service status
./scripts/dev-compose.sh status full
```

### 2. Testing

```bash
# Run health checks
./scripts/dev-compose.sh test full

# View specific service logs
./scripts/dev-compose.sh logs backend
./scripts/dev-compose.sh logs frontend
```

### 3. Backup and Restore

```bash
# Create backup
./scripts/dev-compose.sh backup full

# Restore from backup
./scripts/dev-compose.sh restore full
```

### 4. Cleanup

```bash
# Stop services
./scripts/dev-compose.sh down full

# Clean up everything (containers, networks, volumes)
./scripts/dev-compose.sh clean full
```

## Service URLs

### Application Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Backend Health**: http://localhost:8080/health
- **Metrics**: http://localhost:8080/metrics

### Monitoring Access

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Node Exporter**: http://localhost:9100/metrics

### Tracing Access

- **Jaeger UI**: http://localhost:16686

### Database Access

- **SQLite**: `sqlite3 ./db/custom.db`
- **PostgreSQL**: `localhost:5432` (quantum_user/quantum_pass)

## Configuration

### Environment Variables

Key environment variables that can be customized:

```bash
# Backend
RUST_LOG=info,debug
DATABASE_URL=sqlite:///data/blockchain.db
IDENTITY_STORAGE_PATH=/data/identity
BACKUP_DIR=/data/backups

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://blockchain-backend:8080
NEXT_PUBLIC_WS_URL=ws://blockchain-backend:8080/ws
NODE_ENV=development

# Grafana
GF_SECURITY_ADMIN_PASSWORD=admin123
GF_SECURITY_ADMIN_USER=admin
```

### Volume Mounts

The following directories are mounted for development:

- `./blockchain-data`: Blockchain data storage
- `./logs`: Application logs
- `./db`: SQLite database files
- `./monitoring`: Prometheus/Grafana configuration
- `./ssl`: SSL certificates

## Development Tools

### Built-in Tools

The `dev-tools` container includes:
- `curl` for API testing
- `wget` for file downloads
- `jq` for JSON processing
- `sqlite3` for database operations

### Accessing Development Tools

```bash
# Access the dev-tools container
docker exec -it quantum-dag-dev-tools sh

# Test API endpoints
curl http://localhost:8080/health
curl http://localhost:3000/api/health

# Query database
sqlite3 ./db/custom.db "SELECT * FROM blocks;"
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check which ports are in use
   netstat -tulpn | grep :8080
   netstat -tulpn | grep :3000
   ```

2. **Docker Issues**
   ```bash
   # Check Docker status
   docker info
   
   # Restart Docker service
   sudo systemctl restart docker
   ```

3. **Service Health Issues**
   ```bash
   # Check service logs
   ./scripts/dev-compose.sh logs backend
   ./scripts/dev-compose.sh logs frontend
   
   # Restart specific service
   docker restart quantum-dag-backend-dev
   ```

4. **Memory Issues**
   ```bash
   # Check Docker memory usage
   docker stats
   
   # Increase Docker memory limit (Docker Desktop settings)
   ```

### Debug Commands

```bash
# Check container status
docker ps -a

# Inspect container
docker inspect quantum-dag-backend-dev

# Access container shell
docker exec -it quantum-dag-backend-dev sh

# View Docker Compose configuration
docker-compose -f docker-compose.full.yml config
```

## Performance Optimization

### Development Performance

1. **Reduce Logging**
   ```bash
   # Set minimal logging
   export RUST_LOG=error
   ```

2. **Disable Unused Services**
   ```bash
   # Start only essential services
   ./scripts/dev-compose.sh up backend
   ./scripts/dev-compose.sh up frontend
   ```

3. **Use Lighter Images**
   ```bash
   # Use alpine variants
   docker-compose -f docker-compose.full.yml up --build
   ```

### Resource Limits

The docker-compose file includes resource limits for development:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

## Security Considerations

### Development Security

1. **Default Passwords**
   - Change default Grafana password
   - Use environment variables for secrets

2. **Network Isolation**
   - Services are isolated in custom network
   - Only necessary ports are exposed

3. **File Permissions**
   - Proper volume permissions are set
   - Sensitive files are not exposed

### Production Considerations

This setup is for development only. For production deployment:

1. Use separate docker-compose files
2. Implement proper security measures
3. Use external databases and storage
4. Set up proper monitoring and alerting

## Next Steps

After setting up the development environment:

1. **Explore the API**: Test the blockchain endpoints
2. **Configure Monitoring**: Set up Grafana dashboards
3. **Run Tests**: Execute the test suite
4. **Develop Features**: Start building new functionality
5. **Deploy**: Prepare for production deployment

For more information, see the project documentation and API reference.