#!/bin/bash

# KALDRIX Vault Integration with Helm Charts
# This script integrates Vault secrets management with the KALDRIX Helm charts

set -e

# Configuration
HELM_CHART_DIR="../../helm/kaldrix"
VAULT_NAMESPACE="vault"
KALDRIX_NAMESPACE="default"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Update Helm values to use Vault Agent
update_helm_values() {
    log "Updating Helm values to use Vault Agent..."
    
    # Backup original values files
    cp "$HELM_CHART_DIR/values.yaml" "$HELM_CHART_DIR/values.yaml.backup"
    cp "$HELM_CHART_DIR/values-staging.yaml" "$HELM_CHART_DIR/values-staging.yaml.backup"
    cp "$HELM_CHART_DIR/values-production.yaml" "$HELM_CHART_DIR/values-production.yaml.backup"
    
    # Update production values
    cat > "$HELM_CHART_DIR/values-production.yaml" << 'EOF'
# KALDRIX Production Values with Vault Integration

# Global configuration
global:
  environment: production
  vault:
    enabled: true
    address: "https://vault.vault.svc.cluster.local:8200"
    role: "kaldrix-production"
    agent:
      enabled: true
      inject: true

# PostgreSQL configuration
postgresql:
  enabled: true
  fullnameOverride: "postgres-production"
  auth:
    postgresPassword: ""  # Will be injected by Vault
    database: "kaldrix_production"
    username: "kaldrix_prod"
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "gp2"
    resources:
      requests:
        memory: "2Gi"
        cpu: "1000m"
      limits:
        memory: "4Gi"
        cpu: "2000m"
  readReplicas:
    replicaCount: 2
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "gp2"

# Redis configuration
redis:
  enabled: true
  fullnameOverride: "redis-production"
  auth:
    enabled: true
    password: ""  # Will be injected by Vault
  master:
    persistence:
      enabled: true
      size: 50Gi
      storageClass: "gp2"
    resources:
      requests:
        memory: "1Gi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1000m"
  replica:
    replicaCount: 2
    persistence:
      enabled: true
      size: 50Gi
      storageClass: "gp2"

# Blockchain node configuration
blockchain:
  enabled: true
  replicaCount: 5
  image:
    repository: kaldrix/blockchain
    tag: "latest"
    pullPolicy: Always
  resources:
    requests:
      memory: "4Gi"
      cpu: "2000m"
    limits:
      memory: "8Gi"
      cpu: "4000m"
  persistence:
    enabled: true
    size: 200Gi
    storageClass: "gp2"
  vault:
    annotations:
      vault.hashicorp.com/agent-inject: "true"
      vault.hashicorp.com/agent-inject-status: "update"
      vault.hashicorp.com/role: "kaldrix-production"
      vault.hashicorp.com/agent-inject-secret-database-config: "kv/data/kaldrix/production/database"
      vault.hashicorp.com/agent-inject-secret-redis-config: "kv/data/kaldrix/production/redis"
      vault.hashicorp.com/agent-inject-secret-jwt-config: "kv/data/kaldrix/production/jwt"
      vault.hashicorp.com/agent-inject-template-database-config: |
        {{- with secret "kv/data/kaldrix/production/database" }}
        export DB_USERNAME="{{ .Data.data.username }}"
        export DB_PASSWORD="{{ .Data.data.password }}"
        export DB_HOST="{{ .Data.data.host }}"
        export DB_PORT="{{ .Data.data.port }}"
        export DB_DATABASE="{{ .Data.data.database }}"
        {{- end }}
      vault.hashicorp.com/agent-inject-template-redis-config: |
        {{- with secret "kv/data/kaldrix/production/redis" }}
        export REDIS_PASSWORD="{{ .Data.data.password }}"
        export REDIS_HOST="{{ .Data.data.host }}"
        export REDIS_PORT="{{ .Data.data.port }}"
        {{- end }}
      vault.hashicorp.com/agent-inject-template-jwt-config: |
        {{- with secret "kv/data/kaldrix/production/jwt" }}
        export JWT_SECRET="{{ .Data.data.secret }}"
        export JWT_ALGORITHM="{{ .Data.data.algorithm }}"
        export JWT_EXPIRATION="{{ .Data.data.expiration }}"
        {{- end }}

# Backend configuration
backend:
  enabled: true
  replicaCount: 5
  image:
    repository: kaldrix/backend
    tag: "latest"
    pullPolicy: Always
  resources:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "4Gi"
      cpu: "2000m"
  vault:
    annotations:
      vault.hashicorp.com/agent-inject: "true"
      vault.hashicorp.com/agent-inject-status: "update"
      vault.hashicorp.com/role: "kaldrix-production"
      vault.hashicorp.com/agent-inject-secret-database-config: "kv/data/kaldrix/production/database"
      vault.hashicorp.com/agent-inject-secret-redis-config: "kv/data/kaldrix/production/redis"
      vault.hashicorp.com/agent-inject-secret-jwt-config: "kv/data/kaldrix/production/jwt"

# Frontend configuration
frontend:
  enabled: true
  replicaCount: 5
  image:
    repository: kaldrix/frontend
    tag: "latest"
    pullPolicy: Always
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "500m"
  vault:
    annotations:
      vault.hashicorp.com/agent-inject: "true"
      vault.hashicorp.com/agent-inject-status: "update"
      vault.hashicorp.com/role: "kaldrix-production"
      vault.hashicorp.com/agent-inject-secret-jwt-config: "kv/data/kaldrix/production/jwt"

# Monitoring configuration
monitoring:
  enabled: true
  prometheus:
    enabled: true
    retention: "30d"
    storage: "100Gi"
  grafana:
    enabled: true
    adminPassword: ""  # Will be injected by Vault
  loki:
    enabled: true
    retention: "30d"
    storage: "50Gi"

# Ingress configuration
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: "kaldrix.com"
      paths:
        - path: "/"
          pathType: Prefix
          service: frontend
          port: 3000
    - host: "api.kaldrix.com"
      paths:
        - path: "/"
          pathType: Prefix
          service: backend
          port: 8000
  tls:
    - secretName: kaldrix-tls
      hosts:
        - kaldrix.com
        - api.kaldrix.com
EOF

    # Update staging values
    cat > "$HELM_CHART_DIR/values-staging.yaml" << 'EOF'
# KALDRIX Staging Values with Vault Integration

# Global configuration
global:
  environment: staging
  vault:
    enabled: true
    address: "https://vault.vault.svc.cluster.local:8200"
    role: "kaldrix-staging"
    agent:
      enabled: true
      inject: true

# PostgreSQL configuration
postgresql:
  enabled: true
  fullnameOverride: "postgres-staging"
  auth:
    postgresPassword: ""  # Will be injected by Vault
    database: "kaldrix_staging"
    username: "kaldrix_staging"
  primary:
    persistence:
      enabled: true
      size: 50Gi
      storageClass: "gp2"
    resources:
      requests:
        memory: "1Gi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1000m"
  readReplicas:
    replicaCount: 1
    persistence:
      enabled: true
      size: 50Gi
      storageClass: "gp2"

# Redis configuration
redis:
  enabled: true
  fullnameOverride: "redis-staging"
  auth:
    enabled: true
    password: ""  # Will be injected by Vault
  master:
    persistence:
      enabled: true
      size: 25Gi
      storageClass: "gp2"
    resources:
      requests:
        memory: "512Mi"
        cpu: "250m"
      limits:
        memory: "1Gi"
        cpu: "500m"
  replica:
    replicaCount: 1
    persistence:
      enabled: true
      size: 25Gi
      storageClass: "gp2"

# Blockchain node configuration
blockchain:
  enabled: true
  replicaCount: 3
  image:
    repository: kaldrix/blockchain
    tag: "staging"
    pullPolicy: Always
  resources:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "4Gi"
      cpu: "2000m"
  persistence:
    enabled: true
    size: 100Gi
    storageClass: "gp2"
  vault:
    annotations:
      vault.hashicorp.com/agent-inject: "true"
      vault.hashicorp.com/agent-inject-status: "update"
      vault.hashicorp.com/role: "kaldrix-staging"
      vault.hashicorp.com/agent-inject-secret-database-config: "kv/data/kaldrix/staging/database"
      vault.hashicorp.com/agent-inject-secret-redis-config: "kv/data/kaldrix/staging/redis"
      vault.hashicorp.com/agent-inject-secret-jwt-config: "kv/data/kaldrix/staging/jwt"

# Backend configuration
backend:
  enabled: true
  replicaCount: 3
  image:
    repository: kaldrix/backend
    tag: "staging"
    pullPolicy: Always
  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "2Gi"
      cpu: "1000m"
  vault:
    annotations:
      vault.hashicorp.com/agent-inject: "true"
      vault.hashicorp.com/agent-inject-status: "update"
      vault.hashicorp.com/role: "kaldrix-staging"
      vault.hashicorp.com/agent-inject-secret-database-config: "kv/data/kaldrix/staging/database"
      vault.hashicorp.com/agent-inject-secret-redis-config: "kv/data/kaldrix/staging/redis"
      vault.hashicorp.com/agent-inject-secret-jwt-config: "kv/data/kaldrix/staging/jwt"

# Frontend configuration
frontend:
  enabled: true
  replicaCount: 3
  image:
    repository: kaldrix/frontend
    tag: "staging"
    pullPolicy: Always
  resources:
    requests:
      memory: "256Mi"
      cpu: "125m"
    limits:
      memory: "512Mi"
      cpu: "250m"
  vault:
    annotations:
      vault.hashicorp.com/agent-inject: "true"
      vault.hashicorp.com/agent-inject-status: "update"
      vault.hashicorp.com/role: "kaldrix-staging"
      vault.hashicorp.com/agent-inject-secret-jwt-config: "kv/data/kaldrix/staging/jwt"

# Monitoring configuration
monitoring:
  enabled: true
  prometheus:
    enabled: true
    retention: "7d"
    storage: "50Gi"
  grafana:
    enabled: true
    adminPassword: ""  # Will be injected by Vault
  loki:
    enabled: true
    retention: "7d"
    storage: "25Gi"

# Ingress configuration
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: "staging.kaldrix.com"
      paths:
        - path: "/"
          pathType: Prefix
          service: frontend
          port: 3000
    - host: "api-staging.kaldrix.com"
      paths:
        - path: "/"
          pathType: Prefix
          service: backend
          port: 8000
  tls:
    - secretName: kaldrix-staging-tls
      hosts:
        - staging.kaldrix.com
        - api-staging.kaldrix.com
EOF

    log "Helm values updated successfully"
}

# Update Helm templates to support Vault annotations
update_helm_templates() {
    log "Updating Helm templates to support Vault annotations..."
    
    # Update deployment templates
    cat > "$HELM_CHART_DIR/templates/deployments.yaml" << 'EOF'
{{- range $component, $config := .Values }}
{{- if and $config.enabled (or (eq $component "blockchain") (eq $component "backend") (eq $component "frontend")) }}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "kaldrix.fullname" $ }}-{{ $component }}
  labels:
    app: {{ include "kaldrix.name" $ }}
    component: {{ $component }}
    chart: {{ include "kaldrix.chart" $ }}
    release: {{ $.Release.Name }}
    heritage: {{ $.Release.Service }}
    {{- if $.Values.global.vault.enabled }}
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/agent-inject-status: "update"
    vault.hashicorp.com/role: "{{ $.Values.global.vault.role }}"
    {{- end }}
spec:
  replicas: {{ $config.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "kaldrix.name" $ }}
      component: {{ $component }}
  template:
    metadata:
      labels:
        app: {{ include "kaldrix.name" $ }}
        component: {{ $component }}
      annotations:
        {{- if $.Values.global.vault.enabled }}
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/agent-inject-status: "update"
        vault.hashicorp.com/role: "{{ $.Values.global.vault.role }}"
        {{- if $config.vault.annotations }}
        {{- range $key, $value := $config.vault.annotations }}
        {{ $key }}: {{ $value | quote }}
        {{- end }}
        {{- end }}
        {{- end }}
    spec:
      serviceAccountName: {{ include "kaldrix.fullname" $ }}-{{ $component }}
      containers:
      - name: {{ $component }}
        image: "{{ $config.image.repository }}:{{ $config.image.tag }}"
        imagePullPolicy: {{ $config.image.pullPolicy }}
        ports:
        - containerPort: {{ $config.port | default 80 }}
          name: http
        env:
        - name: ENVIRONMENT
          value: {{ $.Values.global.environment }}
        - name: VAULT_ADDR
          value: {{ $.Values.global.vault.address | quote }}
        - name: VAULT_ROLE
          value: {{ $.Values.global.vault.role | quote }}
        {{- if $.Values.global.vault.enabled }}
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-database-config
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-database-config
              key: password
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-database-config
              key: host
        - name: DB_PORT
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-database-config
              key: port
        - name: DB_DATABASE
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-database-config
              key: database
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-redis-config
              key: password
        - name: REDIS_HOST
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-redis-config
              key: host
        - name: REDIS_PORT
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-redis-config
              key: port
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-jwt-config
              key: secret
        - name: JWT_ALGORITHM
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-jwt-config
              key: algorithm
        - name: JWT_EXPIRATION
          valueFrom:
            secretKeyRef:
              name: {{ include "kaldrix.fullname" $ }}-{{ $component }}-jwt-config
              key: expiration
        {{- end }}
        resources:
          requests:
            memory: {{ $config.resources.requests.memory }}
            cpu: {{ $config.resources.requests.cpu }}
          limits:
            memory: {{ $config.resources.limits.memory }}
            cpu: {{ $config.resources.limits.cpu }}
        {{- if $config.persistence.enabled }}
        volumeMounts:
        - name: data
          mountPath: /data
        {{- end }}
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
      {{- if $config.persistence.enabled }}
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: {{ include "kaldrix.fullname" $ }}-{{ $component }}
      {{- end }}
{{- end }}
{{- end }}
EOF

    log "Helm templates updated successfully"
}

# Create Vault integration documentation
create_documentation() {
    log "Creating Vault integration documentation..."
    
    cat > "$HELM_CHART_DIR/VAULT_INTEGRATION.md" << 'EOF'
# KALDRIX Vault Integration

This document describes how the KALDRIX blockchain platform integrates with HashiCorp Vault for secure secrets management.

## Overview

The KALDRIX platform uses Vault to:
- Securely store and manage secrets (database credentials, API keys, JWT secrets)
- Automatically inject secrets into Kubernetes pods using Vault Agent
- Provide role-based access control for different environments
- Enable automatic secret rotation and management

## Architecture

### Components

1. **Vault Server**: Centralized secrets management server
2. **Vault Agent**: Sidecar container that authenticates with Vault and injects secrets
3. **Vault Injector**: Kubernetes mutating webhook that injects Vault Agent into pods
4. **Kubernetes Auth Method**: Allows Kubernetes service accounts to authenticate with Vault

### Flow

1. Pod is created with Vault annotations
2. Vault Injector webhook detects annotations and injects Vault Agent sidecar
3. Vault Agent authenticates with Vault using Kubernetes auth method
4. Vault Agent retrieves secrets from Vault based on configured templates
5. Secrets are injected into the pod as files or environment variables

## Configuration

### Environment-Specific Configuration

#### Production
- Vault Role: `kaldrix-production`
- Secret Path: `kv/data/kaldrix/production/*`
- Access Level: Production secrets and configuration

#### Staging
- Vault Role: `kaldrix-staging`
- Secret Path: `kv/data/kaldrix/staging/*`
- Access Level: Staging secrets and configuration

#### Development
- Vault Role: `kaldrix-development`
- Secret Path: `kv/data/kaldrix/development/*`
- Access Level: Development secrets and configuration

### Vault Annotations

The following annotations are used to configure Vault Agent injection:

```yaml
vault.hashicorp.com/agent-inject: "true"
vault.hashicorp.com/agent-inject-status: "update"
vault.hashicorp.com/role: "kaldrix-production"
vault.hashicorp.com/agent-inject-secret-database-config: "kv/data/kaldrix/production/database"
vault.hashicorp.com/agent-inject-secret-redis-config: "kv/data/kaldrix/production/redis"
vault.hashicorp.com/agent-inject-secret-jwt-config: "kv/data/kaldrix/production/jwt"
```

### Secret Templates

Secrets are injected using templates that define how secrets should be formatted:

```yaml
vault.hashicorp.com/agent-inject-template-database-config: |
  {{- with secret "kv/data/kaldrix/production/database" }}
  export DB_USERNAME="{{ .Data.data.username }}"
  export DB_PASSWORD="{{ .Data.data.password }}"
  export DB_HOST="{{ .Data.data.host }}"
  export DB_PORT="{{ .Data.data.port }}"
  export DB_DATABASE="{{ .Data.data.database }}"
  {{- end }}
```

## Deployment

### Prerequisites

1. Vault server deployed and initialized
2. Vault Agent Injector webhook deployed
3. Kubernetes auth method configured
4. Roles and policies created
5. Secrets stored in Vault

### Deploying with Helm

1. Deploy Vault infrastructure:
```bash
kubectl apply -f vault/deploy/vault-deployment.yaml
```

2. Initialize and configure Vault:
```bash
./vault/scripts/vault-init.sh
```

3. Deploy KALDRIX with Vault integration:
```bash
helm install kaldrix ./helm/kaldrix -f ./helm/kaldrix/values-production.yaml
```

### Verifying Deployment

1. Check Vault Agent injection:
```bash
kubectl get pods -n default
kubectl describe pod <pod-name> | grep -A 10 -B 10 vault
```

2. Check secret injection:
```bash
kubectl exec -it <pod-name> -- cat /vault/secrets/database.env
kubectl exec -it <pod-name> -- cat /vault/secrets/redis.env
kubectl exec -it <pod-name> -- cat /vault/secrets/jwt.env
```

3. Verify application connectivity:
```bash
kubectl logs <pod-name> | grep -i database
kubectl logs <pod-name> | grep -i redis
kubectl logs <pod-name> | grep -i jwt
```

## Security Considerations

### Access Control

- **Principle of Least Privilege**: Each role has minimal required permissions
- **Environment Separation**: Strict separation between production, staging, and development
- **Token TTL**: Limited token lifetime reduces exposure window
- **Audit Logging**: All access is logged for compliance and monitoring

### Secret Management

- **Automatic Rotation**: Secrets can be rotated without application restart
- **Dynamic Secrets**: Database credentials are dynamically generated
- **Encryption**: All secrets are encrypted at rest and in transit
- **Versioning**: KV v2 provides secret versioning and rollback

### Network Security

- **Network Policies**: Restrict Vault access to authorized namespaces
- **TLS**: All communication encrypted with TLS
- **Internal Access**: Vault accessible only within cluster
- **Rate Limiting**: Prevent abuse and DoS attacks

## Troubleshooting

### Common Issues

1. **Vault Agent not injecting**
   - Check Vault Agent Injector webhook status
   - Verify annotations are correctly applied
   - Check webhook configuration

2. **Authentication failures**
   - Verify Kubernetes auth method configuration
   - Check service account permissions
   - Verify role configuration

3. **Secret not found**
   - Check secret path in Vault
   - Verify role has access to secret
   - Check secret data format

4. **Template rendering errors**
   - Verify template syntax
   - Check secret data structure
   - Review template configuration

### Debug Commands

```bash
# Check Vault status
kubectl exec -n vault vault-0 -- vault status

# Check auth methods
kubectl exec -n vault vault-0 -- vault auth list

# Check policies
kubectl exec -n vault vault-0 -- vault policy list

# Check secrets
kubectl exec -n vault vault-0 -- vault kv list kv/

# Check role configuration
kubectl exec -n vault vault-0 -- vault read auth/kubernetes/role/kaldrix-production
```

## Best Practices

1. **Regular Rotation**: Rotate secrets regularly using Vault's rotation features
2. **Monitoring**: Monitor Vault access and usage patterns
3. **Backup**: Regular backup of Vault data and configuration
4. **Testing**: Test Vault integration in non-production environments
5. **Documentation**: Keep documentation up to date with current configuration
6. **Training**: Train team members on Vault best practices and security

## Support

For issues or questions regarding Vault integration:
- Check the HashiCorp Vault documentation
- Review the KALDRIX project documentation
- Contact the KALDRIX development team
EOF

    log "Documentation created successfully"
}

# Main execution
main() {
    log "Starting KALDRIX Vault integration with Helm charts..."
    
    update_helm_values
    update_helm_templates
    create_documentation
    
    log "KALDRIX Vault integration completed successfully!"
    log "Helm charts have been updated to use Vault for secrets management"
    log "Documentation has been created at: $HELM_CHART_DIR/VAULT_INTEGRATION.md"
}

# Run main function
main "$@"