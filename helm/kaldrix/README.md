# KALDRIX Blockchain Platform Helm Chart

A comprehensive Helm chart for deploying the KALDRIX blockchain platform on Kubernetes with built-in monitoring, scaling, and high availability features.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Environments](#environments)
- [Monitoring](#monitoring)
- [Security](#security)
- [Scaling](#scaling)
- [Backup and Recovery](#backup-and-recovery)
- [Upgrading](#upgrading)
- [Uninstalling](#uninstalling)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Prerequisites

- Kubernetes cluster (v1.19+)
- Helm 3.0+
- kubectl configured with cluster access
- Sufficient cluster resources (CPU, memory, storage)
- Ingress controller (nginx recommended)
- Certificate manager (cert-manager recommended)

### Required Resources

The following resources are recommended for production deployment:

- **CPU**: 16+ cores
- **Memory**: 32+ GB
- **Storage**: 200+ GB SSD
- **Network**: Load balancer with SSL termination

## Installation

### Add Helm Repository

```bash
helm repo add kaldrix https://charts.kaldrix.com
helm repo update
```

### Install the Chart

```bash
# Install with default values (production)
helm install kaldrix kaldrix/kaldrix

# Install with custom values file
helm install kaldrix kaldrix/kaldrix -f custom-values.yaml

# Install for staging environment
helm install kaldrix-staging kaldrix/kaldrix -f values-staging.yaml

# Install for production environment
helm install kaldrix-prod kaldrix/kaldrix -f values-production.yaml
```

### Verify Installation

```bash
# Check deployment status
kubectl get pods -n kaldrix

# Check services
kubectl get services -n kaldrix

# Check ingress
kubectl get ingress -n kaldrix

# Check persistent volumes
kubectl get pvc -n kaldrix
```

## Configuration

The chart can be configured using the following methods:

### 1. Values Files

The chart includes three pre-configured values files:

- `values.yaml` - Default configuration
- `values-staging.yaml` - Staging environment configuration
- `values-production.yaml` - Production environment configuration

### 2. Command Line Overrides

```bash
helm install kaldrix kaldrix/kaldrix \
  --set frontend.replicaCount=5 \
  --set backend.replicaCount=3 \
  --set global.environment=production
```

### 3. Custom Values File

Create a `custom-values.yaml` file with your specific configuration:

```yaml
global:
  environment: "production"
  namespace: "kaldrix"

frontend:
  replicaCount: 5
  resources:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "4Gi"
      cpu: "2000m"

backend:
  replicaCount: 3
  resources:
    requests:
      memory: "4Gi"
      cpu: "2000m"
    limits:
      memory: "8Gi"
      cpu: "4000m"

secrets:
  secrets:
    databasePassword: "your-secure-password"
    jwtSecret: "your-jwt-secret"
    redisPassword: "your-redis-password"
    validatorPrivateKey: "your-validator-key"
```

### Key Configuration Options

#### Global Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.environment` | Environment name | `production` |
| `global.namespace` | Kubernetes namespace | `kaldrix` |
| `global.imageRegistry` | Container registry | `ghcr.io/your-org` |

#### Frontend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Enable frontend deployment | `true` |
| `frontend.replicaCount` | Number of replicas | `3` |
| `frontend.image.tag` | Frontend image tag | `latest` |
| `frontend.resources` | Resource limits and requests | See values.yaml |

#### Backend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.enabled` | Enable backend deployment | `true` |
| `backend.replicaCount` | Number of replicas | `2` |
| `backend.image.tag` | Backend image tag | `latest` |
| `backend.resources` | Resource limits and requests | See values.yaml |

#### Blockchain Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `blockchain.enabled` | Enable blockchain node | `true` |
| `blockchain.replicaCount` | Number of replicas | `1` |
| `blockchain.image.tag` | Blockchain image tag | `latest` |
| `blockchain.resources` | Resource limits and requests | See values.yaml |

#### Database Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable PostgreSQL | `true` |
| `postgresql.global.postgresql.auth.database` | Database name | `kaldrix_prod` |
| `postgresql.primary.persistence.size` | Storage size | `50Gi` |

#### Redis Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `redis.enabled` | Enable Redis | `true` |
| `redis.master.persistence.size` | Storage size | `10Gi` |

## Environments

### Staging Environment

The staging environment is configured with reduced resources and separate domains:

```bash
helm install kaldrix-staging kaldrix/kaldrix -f values-staging.yaml
```

**Staging Features:**
- Reduced resource allocation
- Separate domains (staging.kaldrix.com)
- Debug logging enabled
- Smaller storage requirements
- Limited autoscaling

### Production Environment

The production environment is optimized for high availability and performance:

```bash
helm install kaldrix-prod kaldrix/kaldrix -f values-production.yaml
```

**Production Features:**
- High resource allocation
- Production domains (kaldrix.com)
- Optimized logging
- Large storage requirements
- Advanced autoscaling
- Read replicas for databases
- Multi-zone deployment

## Monitoring

The chart includes comprehensive monitoring with Prometheus and Grafana:

### Prometheus Configuration

```yaml
prometheus:
  enabled: true
  server:
    retention: "30d"
    resources:
      requests:
        memory: "4Gi"
        cpu: "2000m"
      limits:
        memory: "8Gi"
        cpu: "4000m"
```

### Grafana Configuration

```yaml
grafana:
  enabled: true
  adminPassword: "your-secure-password"
  persistence:
    enabled: true
    size: "20Gi"
```

### Accessing Monitoring

```bash
# Port forward to Grafana
kubectl port-forward -n kaldrix svc/kaldrix-grafana 3000:80

# Access Grafana at http://localhost:3000
# Username: admin
# Password: (as configured in values)
```

### Pre-configured Dashboards

The chart includes pre-configured dashboards:

- **KALDRIX Overview**: System-wide metrics
- **Blockchain Metrics**: Node performance and transactions
- **Application Metrics**: Frontend and backend performance
- **Database Metrics**: PostgreSQL and Redis performance
- **Infrastructure Metrics**: Cluster resource utilization

## Security

### Network Security

The chart includes network policies for enhanced security:

```yaml
security:
  networkPolicy:
    enabled: true
  containerSecurityContext:
    runAsUser: 1000
    runAsGroup: 3000
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
        - ALL
```

### Secrets Management

The chart supports multiple secrets management approaches:

#### 1. Kubernetes Secrets

```yaml
secrets:
  enabled: true
  secrets:
    databasePassword: "your-password"
    jwtSecret: "your-jwt-secret"
```

#### 2. External Secrets (Vault)

```yaml
secrets:
  externalSecrets:
    enabled: true
    vault:
      enabled: true
      address: "https://vault.kaldrix.com"
      role: "kaldrix-production"
      path: "secret/data/kaldrix/production"
```

### RBAC Configuration

The chart includes Role-Based Access Control for monitoring:

```yaml
monitoring:
  rbac:
    create: true
    rules:
      - apiGroups: [""]
        resources: ["nodes", "pods", "services"]
        verbs: ["get", "list", "watch"]
```

## Scaling

### Horizontal Pod Autoscaling

The chart includes HPA for all components:

```yaml
frontend:
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80
```

### Pod Disruption Budgets

High availability is ensured with PDBs:

```yaml
frontend:
  podDisruptionBudget:
    enabled: true
    minAvailable: 2
```

### Manual Scaling

```bash
# Scale frontend to 5 replicas
kubectl scale deployment frontend-deployment -n kaldrix --replicas=5

# Scale backend to 3 replicas
kubectl scale deployment backend-deployment -n kaldrix --replicas=3
```

## Backup and Recovery

### Enable Backup

```yaml
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: "30d"
  storage:
    className: "premium-ssd"
    size: "200Gi"
```

### Manual Backup

```bash
# Create backup
kubectl create job --from=cronjob/kaldrix-backup manual-backup -n kaldrix

# Check backup status
kubectl get jobs -n kaldrix
```

### Recovery

```bash
# Restore from backup
kubectl apply -f backup-restore.yaml

# Monitor restore progress
kubectl logs -f job/restore-job -n kaldrix
```

## Upgrading

### Upgrade Procedure

```bash
# Update Helm repository
helm repo update

# Upgrade release
helm upgrade kaldrix kaldrix/kaldrix

# Upgrade with custom values
helm upgrade kaldrix kaldrix/kaldrix -f custom-values.yaml

# Upgrade specific version
helm upgrade kaldrix kaldrix/kaldrix --version 1.0.0
```

### Rolling Updates

The chart is configured for zero-downtime deployments:

```yaml
zeroDowntime:
  enabled: true
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  terminationGracePeriodSeconds: 60
```

### Upgrade Strategy

1. **Pre-upgrade checks**: Verify cluster health
2. **Database migrations**: Apply schema changes
3. **Rolling update**: Update pods incrementally
4. **Health checks**: Verify new deployments
5. **Rollback if needed**: Automatic rollback on failure

## Uninstalling

### Uninstall Procedure

```bash
# Uninstall release
helm uninstall kaldrix -n kaldrix

# Remove persistent volumes (optional)
kubectl delete pvc -n kaldrix --all

# Remove namespace (optional)
kubectl delete namespace kaldrix
```

### Data Backup Before Uninstall

```bash
# Create final backup
kubectl create job --from=cronjob/kaldrix-backup final-backup -n kaldrix

# Wait for backup completion
kubectl wait --for=condition=complete job/final-backup -n kaldrix
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n kaldrix

# Describe pod for details
kubectl describe pod <pod-name> -n kaldrix

# Check pod logs
kubectl logs <pod-name> -n kaldrix
```

#### 2. Service Not Accessible

```bash
# Check service status
kubectl get services -n kaldrix

# Check service endpoints
kubectl get endpoints -n kaldrix

# Check ingress status
kubectl get ingress -n kaldrix
```

#### 3. Database Connection Issues

```bash
# Check database pod
kubectl get pods -l app=postgresql -n kaldrix

# Check database logs
kubectl logs <postgres-pod> -n kaldrix

# Test database connection
kubectl exec -it <backend-pod> -n kaldrix -- psql $DATABASE_URL -c "SELECT 1"
```

#### 4. High Resource Usage

```bash
# Check resource usage
kubectl top pods -n kaldrix

# Check HPA status
kubectl get hpa -n kaldrix

# Check node resources
kubectl top nodes
```

### Debug Commands

```bash
# Port forward to service
kubectl port-forward -n kaldrix svc/frontend-service 3000:3000

# Exec into container
kubectl exec -it <pod-name> -n kaldrix -- /bin/bash

# Check events
kubectl get events -n kaldrix --sort-by='.lastTimestamp'
```

### Health Checks

The chart includes comprehensive health checks:

```bash
# Check liveness probes
kubectl get pods -n kaldrix -o jsonpath='{.items[*].status.containerStatuses[*].restartCount}'

# Check readiness probes
kubectl get pods -n kaldrix -o jsonpath='{.items[*].status.containerStatuses[*].ready}'
```

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/ancourn/kaldr1.git
cd kaldrix-project/helm/kaldrix

# Install Helm dependencies
helm dependency update

# Test chart locally
helm install test-kaldrix . --debug --dry-run
```

### Testing

```bash
# Lint chart
helm lint .

# Test with different values
helm template test-kaldrix . -f values-staging.yaml

# Validate templates
kubeval --strict templates/
```

### Submitting Changes

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## Support

For support and questions:

- **Documentation**: https://docs.kaldrix.com
- **GitHub Issues**: https://github.com/ancourn/kaldr1/issues
- **Community**: https://community.kaldrix.com
- **Email**: support@kaldrix.com

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Complete deployment automation
- Multi-environment support
- Comprehensive monitoring
- Security best practices
- High availability features