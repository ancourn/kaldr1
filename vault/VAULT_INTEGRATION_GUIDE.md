# KALDRIX Vault Integration Guide

## Overview

This guide provides comprehensive documentation for integrating HashiCorp Vault with the KALDRIX blockchain platform. Vault serves as the centralized secrets management solution, providing secure storage, dynamic secrets, automatic injection, and robust access control.

## Architecture

### Components

1. **Vault Server**: Centralized secrets management server with high availability
2. **Vault Agent**: Sidecar container for automatic secret injection
3. **Vault Injector**: Kubernetes mutating webhook for automatic agent injection
4. **Kubernetes Auth Method**: Service account-based authentication
5. **GitHub Auth Method**: CI/CD pipeline authentication
6. **Secrets Engines**: KV, PKI, Database, AWS, Transit
7. **Monitoring**: Prometheus metrics and alerting

### Security Model

- **Zero Trust**: No implicit trust, all access must be authenticated and authorized
- **Principle of Least Privilege**: Minimal permissions required for each role
- **Environment Separation**: Strict isolation between production, staging, and development
- **Audit Logging**: Complete audit trail of all secret access
- **Automatic Rotation**: Dynamic secrets with automatic rotation capabilities

## Deployment

### Prerequisites

- Kubernetes cluster (v1.25+)
- kubectl configured
- Helm 3.12+
- Vault CLI
- Valid TLS certificates

### Step 1: Deploy Vault Infrastructure

```bash
# Deploy Vault
kubectl apply -f vault/deploy/vault-deployment.yaml

# Wait for Vault to be ready
kubectl wait --for=condition=ready pod -l app=vault -n vault --timeout=300s
```

### Step 2: Initialize and Configure Vault

```bash
# Initialize Vault
./vault/scripts/vault-init.sh

# This will:
# - Initialize Vault cluster
# - Unseal Vault
# - Configure authentication methods
# - Enable secrets engines
# - Create policies and roles
# - Set up initial secrets
```

### Step 3: Deploy Vault Agent Injector

```bash
# Deploy Vault Agent Injector
kubectl apply -f vault/deploy/vault-agent.yaml

# Verify injector is running
kubectl get pods -n vault | grep injector
```

### Step 4: Integrate with Helm Charts

```bash
# Update Helm charts to use Vault
./vault/scripts/integrate-with-helm.sh

# Deploy KALDRIX with Vault integration
helm install kaldrix ./helm/kaldrix -f ./helm/kaldrix/values-production.yaml
```

### Step 5: Configure CI/CD Integration

```bash
# Set up CI/CD integration
./vault/scripts/ci-cd-integration.sh

# This will:
# - Configure GitHub authentication
# - Create CI/CD policies
# - Set up CI/CD secrets
# - Create GitHub Actions workflows
# - Configure monitoring
```

## Configuration

### Environment Configuration

#### Production Environment
- **Vault Role**: `kaldrix-production`
- **Kubernetes Service Account**: `kaldrix-production`
- **Policy**: `kaldrix-production.hcl`
- **Secret Path**: `kv/data/kaldrix/production/*`
- **Access Level**: Production secrets and configuration

#### Staging Environment
- **Vault Role**: `kaldrix-staging`
- **Kubernetes Service Account**: `kaldrix-staging`
- **Policy**: `kaldrix-staging.hcl`
- **Secret Path**: `kv/data/kaldrix/staging/*`
- **Access Level**: Staging secrets and configuration

#### Development Environment
- **Vault Role**: `kaldrix-development`
- **Kubernetes Service Account**: `kaldrix-development`
- **Policy**: `kaldrix-developer.hcl`
- **Secret Path**: `kv/data/kaldrix/development/*`
- **Access Level**: Development secrets and configuration

### Authentication Methods

#### Kubernetes Authentication
```yaml
# Service Account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kaldrix-production
  namespace: default

# Role Configuration
vault write auth/kubernetes/role/kaldrix-production \
    bound_service_account_names=kaldrix-production \
    bound_service_account_namespaces=default \
    policies=kaldrix-production \
    ttl=24h
```

#### GitHub Authentication
```yaml
# GitHub Auth Configuration
vault write auth/github/config \
    organization="ancourn" \
    base_url="https://api.github.com/"

# Role Configuration
vault write auth/github/role/kaldrix-ci-production \
    bound_repository="ancourn/kaldr1" \
    policies="kaldrix-production,kaldrix-ci" \
    ttl="1h"
```

### Secrets Engines

#### KV Secrets Engine (v2)
```bash
# Enable KV v2
vault secrets enable -version=2 kv

# Store secrets
vault kv put kv/kaldrix/production/database \
    username=kaldrix_prod \
    password=secure_password \
    host=postgres-production.kaldrix.svc.cluster.local \
    port=5432 \
    database=kaldrix_production

# Read secrets
vault kv get kv/kaldrix/production/database
```

#### Database Secrets Engine
```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/kaldrix-production \
    plugin_name=postgresql-database-plugin \
    allowed_roles="kaldrix-production-app" \
    connection_url="postgresql://{{username}}:{{password}}@postgres-production:5432/kaldrix_production"

# Create role for dynamic credentials
vault write database/roles/kaldrix-production-app \
    db_name=kaldrix-production \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';" \
    default_ttl="1h" \
    max_ttl="24h"
```

#### PKI Secrets Engine
```bash
# Enable PKI
vault secrets enable pki

# Configure CA
vault secrets tune -max-lease-ttl=8760h pki

# Generate root CA
vault write -field=certificate pki/root/generate/internal \
    common_name="KALDRIX Root CA" \
    ttl=8760h > root_ca.crt

# Configure intermediate CA
vault secrets enable -path=pki_int pki
vault secrets tune -max-lease-ttl=43800h pki_int

# Generate intermediate CA
vault write -format=json pki_int/intermediate/generate/internal \
    common_name="KALDRIX Intermediate CA" | jq -r '.data.csr' > pki_intermediate.csr

# Sign intermediate CA
vault write -format=json pki/root/sign-intermediate csr=@pki_intermediate.csr \
    format=pem_bundle ttl=43800h | jq -r '.data.certificate' > intermediate.cert.pem

# Configure intermediate CA
vault write pki_int/intermediate/set-signed certificate=@intermediate.cert.pem

# Create roles
vault write pki_int/roles/kaldrix-production \
    allowed_domains="kaldrix.com,*.kaldrix.com" \
    allow_subdomains=true \
    max_ttl="720h"
```

#### Transit Secrets Engine
```bash
# Enable transit
vault secrets enable transit

# Create encryption keys
vault write -f transit/keys/kaldrix-production \
    type=aes-256-gcm \
    deletion_allowed=false

# Encrypt data
vault write transit/encrypt/kaldrix-production \
    plaintext=$(base64 <<< "secret data")

# Decrypt data
vault write transit/decrypt/kaldrix-production \
    ciphertext=<encrypted_data>
```

### Vault Agent Configuration

#### Agent Configuration
```hcl
auto_auth {
    method "kubernetes" {
        mount_path = "auth/kubernetes"
        config = {
            role = "kaldrix-production"
        }
    }
    
    sink "file" {
        config = {
            path = "/home/vault/.vault-token"
        }
    }
}

template {
    contents = <<EOT
{{- with secret "kv/data/kaldrix/production/database" }}
export DB_USERNAME="{{ .Data.data.username }}"
export DB_PASSWORD="{{ .Data.data.password }}"
export DB_HOST="{{ .Data.data.host }}"
export DB_PORT="{{ .Data.data.port }}"
export DB_DATABASE="{{ .Data.data.database }}"
{{- end }}
EOT
    destination = "/vault/secrets/database.env"
    perms = "0640"
}

exit_after_auth = false
```

#### Kubernetes Annotations
```yaml
annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/agent-inject-status: "update"
    vault.hashicorp.com/role: "kaldrix-production"
    vault.hashicorp.com/agent-inject-secret-database-config: "kv/data/kaldrix/production/database"
    vault.hashicorp.com/agent-inject-template-database-config: |
        {{- with secret "kv/data/kaldrix/production/database" }}
        {
            "username": "{{ .Data.data.username }}",
            "password": "{{ .Data.data.password }}",
            "host": "{{ .Data.data.host }}",
            "port": "{{ .Data.data.port }}",
            "database": "{{ .Data.data.database }}"
        }
        {{- end }}
```

## Security Best Practices

### Access Control

1. **Role-Based Access Control (RBAC)**
   - Define specific roles for each environment
   - Grant minimal required permissions
   - Regularly review and audit access

2. **Token Management**
   - Use short-lived tokens (TTL < 24h)
   - Implement token rotation
   - Revoke unused tokens

3. **Secret Rotation**
   - Rotate secrets regularly
   - Use dynamic secrets where possible
   - Automate rotation workflows

### Network Security

1. **Network Policies**
   - Restrict Vault access to authorized namespaces
   - Implement firewall rules
   - Use internal load balancers

2. **TLS Configuration**
   - Use valid TLS certificates
   - Implement certificate rotation
   - Disable insecure protocols

3. **API Security**
   - Rate limit API requests
   - Implement request validation
   - Monitor for suspicious activity

### Monitoring and Alerting

1. **Metrics Collection**
   - Monitor Vault performance metrics
   - Track secret access patterns
   - Set up alerting for anomalies

2. **Audit Logging**
   - Enable comprehensive audit logging
   - Centralize log collection
   - Regular log analysis

3. **Health Checks**
   - Implement regular health checks
   - Monitor cluster status
   - Set up automated failover

## Troubleshooting

### Common Issues

#### Vault Agent Not Injecting
```bash
# Check injector status
kubectl get pods -n vault | grep injector

# Check webhook configuration
kubectl get mutatingwebhookconfiguration vault-agent-injector

# Check pod annotations
kubectl describe pod <pod-name> | grep vault
```

#### Authentication Failures
```bash
# Check auth method status
vault auth list

# Verify role configuration
vault read auth/kubernetes/role/kaldrix-production

# Test authentication
vault write auth/kubernetes/login role=kaldrix-production jwt=<service-account-token>
```

#### Secret Access Issues
```bash
# Check policy permissions
vault policy read kaldrix-production

# Test secret access
vault kv get kv/kaldrix/production/database

# Check token capabilities
vault token capabilities <token> kv/data/kaldrix/production/database
```

#### Performance Issues
```bash
# Check Vault metrics
vault read sys/metrics

# Monitor request rate
vault read sys/health

# Check storage usage
vault read sys/storage/raft/configuration
```

### Debug Commands

```bash
# Vault status
vault status

# List auth methods
vault auth list

# List secrets engines
vault secrets list

# List policies
vault policy list

# Check audit devices
vault audit list

# Monitor logs
kubectl logs -n vault vault-0
```

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor Vault health and performance
   - Review audit logs
   - Check for security alerts

2. **Weekly**
   - Rotate secrets
   - Review access policies
   - Update TLS certificates if needed

3. **Monthly**
   - Backup Vault data
   - Test disaster recovery
   - Review and update documentation

4. **Quarterly**
   - Security audit
   - Performance review
   - Capacity planning

### Backup and Recovery

#### Backup Configuration
```bash
# Create backup
vault operator raft snapshot save backup-$(date +%Y%m%d).snap

# List snapshots
vault operator raft snapshot list

# Restore from snapshot
vault operator raft snapshot restore backup-20231201.snap
```

#### Disaster Recovery
```bash
# Initialize new cluster
vault operator init

# Unseal new cluster
vault operator unseal

# Restore backup
vault operator raft snapshot restore backup.snap

# Verify recovery
vault status
```

## Integration Examples

### Application Integration

#### Node.js Application
```javascript
const vault = require('node-vault');

const client = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

async function getSecret(path) {
  try {
    const result = await client.read(path);
    return result.data.data;
  } catch (error) {
    console.error('Error fetching secret:', error);
    throw error;
  }
}

// Usage
getSecret('kv/data/kaldrix/production/database')
  .then(secrets => {
    console.log('Database credentials:', secrets);
  });
```

#### Python Application
```python
import hvac

client = hvac.Client(
    url=os.environ['VAULT_ADDR'],
    token=os.environ['VAULT_TOKEN']
)

def get_secret(path):
    try:
        response = client.secrets.kv.v2.read_secret_version(path=path)
        return response['data']['data']
    except Exception as e:
        print(f"Error fetching secret: {e}")
        raise

# Usage
secrets = get_secret('kv/data/kaldrix/production/database')
print(f"Database credentials: {secrets}")
```

### CI/CD Integration

#### GitHub Actions
```yaml
- name: Setup Vault
  uses: hashicorp/vault-action@v2
  with:
    url: ${{ env.VAULT_ADDR }}
    method: github
    githubToken: ${{ secrets.GITHUB_TOKEN }}
    role: kaldrix-ci-production
    secrets: |
      kv/data/kaldrix/production/database db_password | DB_PASSWORD;
      kv/data/kaldrix/production/redis redis_password | REDIS_PASSWORD;
      kv/data/kaldrix/production/jwt jwt_secret | JWT_SECRET
```

#### Jenkins Pipeline
```groovy
pipeline {
    agent any
    
    environment {
        VAULT_ADDR = 'https://vault.kaldrix.com:8200'
        VAULT_TOKEN = credentials('vault-token')
    }
    
    stages {
        stage('Get Secrets') {
            steps {
                script {
                    def secrets = sh(
                        script: 'vault kv get -format=json kv/data/kaldrix/production/database',
                        returnStdout: true
                    )
                    def secretsJson = readJSON text: secrets
                    env.DB_PASSWORD = secretsJson.data.data.password
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'kubectl set env deployment/kaldrix-backend DB_PASSWORD=${DB_PASSWORD}'
            }
        }
    }
}
```

## Support and Resources

### Documentation
- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [Vault Agent Documentation](https://developer.hashicorp.com/vault/docs/agent)
- [Kubernetes Auth Method](https://developer.hashicorp.com/vault/docs/auth/kubernetes)

### Community
- [Vault Community Forum](https://discuss.hashicorp.com/c/vault)
- [KALDRIX GitHub Repository](https://github.com/ancourn/kaldr1)
- [Slack Channel](https://kaldrix.slack.com/)

### Support
- Create GitHub issues for bugs and feature requests
- Contact the KALDRIX development team for urgent issues
- Review troubleshooting section for common problems

### Training
- HashiCorp Vault training courses
- KALDRIX internal training materials
- Security best practices workshops

---

This guide provides a comprehensive overview of Vault integration with the KALDRIX blockchain platform. For specific questions or issues, please refer to the troubleshooting section or contact the development team.