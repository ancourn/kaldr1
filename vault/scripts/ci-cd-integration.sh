#!/bin/bash

# KALDRIX Vault CI/CD Integration Script
# This script integrates Vault with the CI/CD pipeline for secure secrets management

set -e

# Configuration
VAULT_ADDR="https://vault.kaldrix.com:8200"
VAULT_NAMESPACE="kaldrix"
GITHUB_REPO="ancourn/kaldr1"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Vault CLI is installed
    if ! command -v vault &> /dev/null; then
        error "Vault CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install it first."
        exit 1
    fi
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        error "curl is not installed. Please install it first."
        exit 1
    fi
    
    # Check GitHub token
    if [ -z "$GITHUB_TOKEN" ]; then
        warn "GITHUB_TOKEN environment variable is not set. GitHub integration will be limited."
    fi
    
    # Check Vault connectivity
    if ! vault status &> /dev/null; then
        warn "Vault is not accessible. Please check VAULT_ADDR and authentication."
    fi
    
    log "Prerequisites check completed"
}

# Configure GitHub authentication for Vault
configure_github_auth() {
    log "Configuring GitHub authentication for Vault..."
    
    # Enable GitHub auth method
    vault auth enable github
    
    # Configure GitHub auth method
    vault write auth/github/config \
        organization="${GITHUB_REPO%%/*}" \
        base_url="https://api.github.com/"
    
    # Create GitHub roles for different environments
    vault write auth/github/role/kaldrix-ci-production \
        bound_repository="$GITHUB_REPO" \
        policies="kaldrix-production,kaldrix-ci" \
        ttl="1h" \
        max_ttl="2h"
    
    vault write auth/github/role/kaldrix-ci-staging \
        bound_repository="$GITHUB_REPO" \
        policies="kaldrix-staging,kaldrix-ci" \
        ttl="1h" \
        max_ttl="2h"
    
    vault write auth/github/role/kaldrix-ci-development \
        bound_repository="$GITHUB_REPO" \
        policies="kaldrix-developer,kaldrix-ci" \
        ttl="1h" \
        max_ttl="2h"
    
    log "GitHub authentication configured successfully"
}

# Create CI/CD specific policies
create_ci_cd_policies() {
    log "Creating CI/CD specific policies..."
    
    # Create CI/CD policy
    cat > kaldrix-ci.hcl << 'EOF'
# KALDRIX CI/CD Policy
# Limited access for CI/CD pipelines

# Path to read CI/CD secrets
path "secret/data/kaldrix/ci-cd/*" {
  capabilities = ["read", "list"]
}

# Path to read CI/CD metadata
path "secret/metadata/kaldrix/ci-cd/*" {
  capabilities = ["read", "list"]
}

# Path to update CI/CD secrets (limited)
path "secret/data/kaldrix/ci-cd/build" {
  capabilities = ["read", "update", "create"]
}

# Path to manage CI/CD configuration
path "kaldrix/config/ci-cd/*" {
  capabilities = ["read", "list"]
}

# Path to generate dynamic credentials for CI/CD
path "kaldrix/database/ci-cd/*" {
  capabilities = ["read", "update"]
}

# Path to manage CI/CD PKI certificates
path "kaldrix/pki/ci-cd/*" {
  capabilities = ["read", "list"]
}

# Path to sign certificates in CI/CD
path "kaldrix/pki/ci-cd/sign/*" {
  capabilities = ["create", "update"]
}

# Path to manage CI/CD AWS credentials (limited)
path "kaldrix/aws/ci-cd/*" {
  capabilities = ["read", "update"]
}

# Path to manage CI/CD transit encryption
path "kaldrix/transit/ci-cd/*" {
  capabilities = ["read", "update", "create"]
}

# Path to encrypt data in CI/CD
path "kaldrix/transit/ci-cd/encrypt/*" {
  capabilities = ["create", "update"]
}

# Path to decrypt data in CI/CD
path "kaldrix/transit/ci-cd/decrypt/*" {
  capabilities = ["create", "update"]
}

# Path to manage CI/CD token roles
path "auth/token/roles/kaldrix-ci" {
  capabilities = ["read"]
}

# Path to create CI/CD tokens
path "auth/token/create/kaldrix-ci" {
  capabilities = ["create", "update"]
}

# Path to manage CI/CD health checks
path "sys/health" {
  capabilities = ["read"]
}

# Path to manage CI/CD metrics
path "sys/metrics" {
  capabilities = ["read"]
}

# Path to manage CI/CD capabilities
path "sys/capabilities-self" {
  capabilities = ["create", "update"]
}

# Path to manage CI/CD token lookup-self
path "auth/token/lookup-self" {
  capabilities = ["create", "update"]
}

# Path to manage CI/CD token renew-self
path "auth/token/renew-self" {
  capabilities = ["create", "update"]
}

# Path to manage CI/CD token revoke-self
path "auth/token/revoke-self" {
  capabilities = ["create", "update"]
}

# Path to manage CI/CD tools (limited)
path "sys/tools/hash/*" {
  capabilities = ["create", "update"]
}

path "sys/tools/random/*" {
  capabilities = ["create", "update"]
}

# Path to manage CI/CD host information
path "sys/host-info" {
  capabilities = ["read"]
}

# Path to manage CI/CD seal status
path "sys/seal-status" {
  capabilities = ["read"]
}

# Path to manage CI/CD key status
path "sys/key-status" {
  capabilities = ["read"]
}

# Path to manage CI/CD ha status
path "sys/ha-status" {
  capabilities = ["read"]
}

# Path to manage CI/CD leader information
path "sys/leader" {
  capabilities = ["read"]
}

# Path to manage CI/CD init information
path "sys/init" {
  capabilities = ["read"]
}
EOF

    # Write policy to Vault
    vault policy write kaldrix-ci kaldrix-ci.hcl
    
    # Clean up
    rm kaldrix-ci.hcl
    
    log "CI/CD policies created successfully"
}

# Create CI/CD specific secrets
create_ci_cd_secrets() {
    log "Creating CI/CD specific secrets..."
    
    # Create CI/CD build secrets
    vault kv put kv/kaldrix/ci-cd/build \
        docker_registry="docker.io" \
        docker_username="kaldrixci" \
        docker_password="$(openssl rand -base64 32)" \
        build_cache_enabled="true" \
        build_timeout="3600"
    
    # Create CI/CD deployment secrets
    vault kv put kv/kaldrix/ci-cd/deployment \
        kubernetes_config_path="/home/runner/.kube/config" \
        helm_repo_url="https://kaldrix.github.io/helm-charts" \
        helm_repo_username="kaldrixci" \
        helm_repo_password="$(openssl rand -base64 32)" \
        rollout_timeout="600"
    
    # Create CI/CD monitoring secrets
    vault kv put kv/kaldrix/ci-cd/monitoring \
        prometheus_url="https://prometheus.kaldrix.com" \
        grafana_url="https://grafana.kaldrix.com" \
        alertmanager_url="https://alertmanager.kaldrix.com" \
        webhook_url="https://hooks.slack.com/services/$(openssl rand -hex 16)"
    
    # Create CI/CD notification secrets
    vault kv put kv/kaldrix/ci-cd/notifications \
        slack_webhook="https://hooks.slack.com/services/$(openssl rand -hex 16)" \
        email_smtp_server="smtp.gmail.com" \
        email_smtp_port="587" \
        email_username="notifications@kaldrix.com" \
        email_password="$(openssl rand -base64 32)" \
        pagerduty_api_key="$(openssl rand -hex 32)"
    
    log "CI/CD secrets created successfully"
}

# Create GitHub Actions workflow templates
create_github_actions_templates() {
    log "Creating GitHub Actions workflow templates..."
    
    # Create workflow directory
    mkdir -p .github/workflows
    
    # Create deployment workflow
    cat > .github/workflows/deploy-with-vault.yml << 'EOF'
name: Deploy with Vault

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  VAULT_ADDR: https://vault.kaldrix.com:8200
  VAULT_NAMESPACE: kaldrix

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Vault
      uses: hashicorp/vault-action@v2
      with:
        url: ${{ env.VAULT_ADDR }}
        namespace: ${{ env.VAULT_NAMESPACE }}
        method: github
        githubToken: ${{ secrets.GITHUB_TOKEN }}
        role: kaldrix-ci-${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
        secrets: |
          kv/data/kaldrix/ci-cd/build docker_registry | DOCKER_REGISTRY;
          kv/data/kaldrix/ci-cd/build docker_username | DOCKER_USERNAME;
          kv/data/kaldrix/ci-cd/build docker_password | DOCKER_PASSWORD;
          kv/data/kaldrix/ci-cd/deployment kubernetes_config | KUBECONFIG;
          kv/data/kaldrix/ci-cd/deployment helm_repo_username | HELM_REPO_USERNAME;
          kv/data/kaldrix/ci-cd/deployment helm_repo_password | HELM_REPO_PASSWORD;
          kv/data/kaldrix/${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}/jwt jwt_secret | JWT_SECRET;
          kv/data/kaldrix/${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}/database db_password | DB_PASSWORD;
          kv/data/kaldrix/${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}/redis redis_password | REDIS_PASSWORD
    
    - name: Setup Docker
      uses: docker/setup-buildx-action@v3
      
    - name: Login to Docker Registry
      run: |
        echo "${{ env.DOCKER_PASSWORD }}" | docker login -u "${{ env.DOCKER_USERNAME }}" --password-stdin "${{ env.DOCKER_REGISTRY }}"
    
    - name: Build and push Docker images
      run: |
        # Build blockchain image
        docker build -t kaldrix/blockchain:${{ github.sha }} -f Dockerfile.blockchain .
        docker push kaldrix/blockchain:${{ github.sha }}
        
        # Build backend image
        docker build -t kaldrix/backend:${{ github.sha }} -f Dockerfile.backend .
        docker push kaldrix/backend:${{ github.sha }}
        
        # Build frontend image
        docker build -t kaldrix/frontend:${{ github.sha }} -f Dockerfile.frontend .
        docker push kaldrix/frontend:${{ github.sha }}
    
    - name: Setup Helm
      uses: azure/setup-helm@v3
      with:
        version: '3.12.0'
    
    - name: Add Helm repository
      run: |
        helm repo add kaldrix https://kaldrix.github.io/helm-charts
        helm repo update
    
    - name: Deploy to Kubernetes
      run: |
        # Set kubeconfig
        mkdir -p $HOME/.kube
        echo "${{ env.KUBECONFIG }}" > $HOME/.kube/config
        
        # Deploy with Helm
        helm upgrade --install kaldrix ./helm/kaldrix \
          --namespace kaldrix \
          --create-namespace \
          -f ./helm/kaldrix/values-${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}.yaml \
          --set blockchain.image.tag=${{ github.sha }} \
          --set backend.image.tag=${{ github.sha }} \
          --set frontend.image.tag=${{ github.sha }} \
          --wait \
          --timeout=600s
    
    - name: Verify deployment
      run: |
        # Check pod status
        kubectl get pods -n kaldrix
        
        # Check deployment status
        kubectl get deployments -n kaldrix
        
        # Run health checks
        kubectl exec -it deployment/kaldrix-backend -n kaldrix -- curl -f http://localhost:8000/health || exit 1
        kubectl exec -it deployment/kaldrix-frontend -n kaldrix -- curl -f http://localhost:3000/health || exit 1
    
    - name: Notify deployment
      if: always()
      run: |
        # Send notification to Slack
        curl -X POST -H 'Content-type: application/json' \
          --data '{"text":"Deployment to ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }} completed with status: ${{ job.status }}"}' \
          "${{ env.SLACK_WEBHOOK }}"
EOF

    # Create secret rotation workflow
    cat > .github/workflows/rotate-secrets.yml << 'EOF'
name: Rotate Secrets

on:
  schedule:
    - cron: '0 2 * * 0'  # Run every Sunday at 2 AM
  workflow_dispatch:

env:
  VAULT_ADDR: https://vault.kaldrix.com:8200
  VAULT_NAMESPACE: kaldrix

jobs:
  rotate-secrets:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Vault
      uses: hashicorp/vault-action@v2
      with:
        url: ${{ env.VAULT_ADDR }}
        namespace: ${{ env.VAULT_NAMESPACE }}
        method: github
        githubToken: ${{ secrets.GITHUB_TOKEN }}
        role: kaldrix-ci-production
        secrets: |
          kv/data/kaldrix/ci-cd/build docker_registry | DOCKER_REGISTRY;
          kv/data/kaldrix/ci-cd/build docker_username | DOCKER_USERNAME;
          kv/data/kaldrix/ci-cd/build docker_password | DOCKER_PASSWORD;
          kv/data/kaldrix/ci-cd/notifications slack_webhook | SLACK_WEBHOOK
    
    - name: Rotate database passwords
      run: |
        # Generate new passwords
        NEW_PROD_PASSWORD=$(openssl rand -base64 32)
        NEW_STAGING_PASSWORD=$(openssl rand -base64 32)
        NEW_DEV_PASSWORD=$(openssl rand -base64 32)
        
        # Update Vault secrets
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"password\":\"$NEW_PROD_PASSWORD\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/production/database"
        
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"password\":\"$NEW_STAGING_PASSWORD\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/staging/database"
        
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"password\":\"$NEW_DEV_PASSWORD\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/development/database"
    
    - name: Rotate Redis passwords
      run: |
        # Generate new passwords
        NEW_PROD_PASSWORD=$(openssl rand -base64 32)
        NEW_STAGING_PASSWORD=$(openssl rand -base64 32)
        NEW_DEV_PASSWORD=$(openssl rand -base64 32)
        
        # Update Vault secrets
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"password\":\"$NEW_PROD_PASSWORD\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/production/redis"
        
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"password\":\"$NEW_STAGING_PASSWORD\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/staging/redis"
        
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"password\":\"$NEW_DEV_PASSWORD\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/development/redis"
    
    - name: Rotate JWT secrets
      run: |
        # Generate new secrets
        NEW_PROD_SECRET=$(openssl rand -base64 64)
        NEW_STAGING_SECRET=$(openssl rand -base64 64)
        NEW_DEV_SECRET=$(openssl rand -base64 64)
        
        # Update Vault secrets
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"secret\":\"$NEW_PROD_SECRET\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/production/jwt"
        
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"secret\":\"$NEW_STAGING_SECRET\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/staging/jwt"
        
        curl -X POST -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
          -d "{\"data\":{\"secret\":\"$NEW_DEV_SECRET\"}}" \
          "${{ env.VAULT_ADDR }}/v1/kv/data/kaldrix/development/jwt"
    
    - name: Restart affected services
      run: |
        # Restart deployments to pick up new secrets
        kubectl rollout restart deployment/kaldrix-backend -n kaldrix
        kubectl rollout restart deployment/kaldrix-blockchain -n kaldrix
        kubectl rollout restart deployment/kaldrix-frontend -n kaldrix
        
        # Wait for rollout to complete
        kubectl rollout status deployment/kaldrix-backend -n kaldrix --timeout=300s
        kubectl rollout status deployment/kaldrix-blockchain -n kaldrix --timeout=300s
        kubectl rollout status deployment/kaldrix-frontend -n kaldrix --timeout=300s
    
    - name: Verify services
      run: |
        # Run health checks
        kubectl exec -it deployment/kaldrix-backend -n kaldrix -- curl -f http://localhost:8000/health || exit 1
        kubectl exec -it deployment/kaldrix-frontend -n kaldrix -- curl -f http://localhost:3000/health || exit 1
    
    - name: Notify rotation
      run: |
        # Send notification to Slack
        curl -X POST -H 'Content-type: application/json' \
          --data '{"text":"Secret rotation completed successfully"}' \
          "${{ env.SLACK_WEBHOOK }}"
EOF

    log "GitHub Actions workflow templates created successfully"
}

# Create monitoring and alerting for Vault
create_vault_monitoring() {
    log "Creating Vault monitoring and alerting..."
    
    # Create Prometheus configuration for Vault monitoring
    cat > vault-prometheus.yml << 'EOF'
# KALDRIX Vault Monitoring Configuration

global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "vault_alerts.yml"

scrape_configs:
  - job_name: 'vault'
    static_configs:
      - targets: ['vault.vault.svc.cluster.local:8200']
    metrics_path: '/v1/sys/metrics'
    params:
      format: ['prometheus']
    scheme: 'https'
    tls_config:
      insecure_skip_verify: true
    bearer_token_file: '/var/run/secrets/kubernetes.io/serviceaccount/token'

  - job_name: 'vault-agent'
    static_configs:
      - targets: ['localhost:8100']
    metrics_path: '/metrics'
    scheme: 'http'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager.monitoring.svc.cluster.local:9093
EOF

    # Create Vault alerting rules
    cat > vault_alerts.yml << 'EOF'
# KALDRIX Vault Alerting Rules

groups:
  - name: vault
    rules:
      - alert: VaultDown
        expr: up{job="vault"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Vault instance is down"
          description: "Vault instance {{ $labels.instance }} has been down for more than 1 minute"

      - alert: VaultHighRequestRate
        expr: rate(vault_core_handle_request[5m]) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Vault request rate is high"
          description: "Vault request rate is {{ $value }} requests per second"

      - alert: VaultHighLatency
        expr: histogram_quantile(0.95, rate(vault_core_handle_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Vault request latency is high"
          description: "Vault 95th percentile latency is {{ $value }} seconds"

      - alert: VaultStorageHighUsage
        expr: vault_storage_raft_storage_active_size_bytes / vault_storage_raft_storage_capacity_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Vault storage usage is high"
          description: "Vault storage usage is {{ $value }}%"

      - alert: VaultSealed
        expr: vault_core_sealed == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Vault is sealed"
          description: "Vault instance {{ $labels.instance }} is sealed"

      - alert: VaultTokenExpiring
        expr: vault_token_count_by_ttl{ttl="1h"} > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Vault tokens expiring soon"
          description: "{{ $value }} Vault tokens will expire within 1 hour"

      - alert: VaultLeaseExpiring
        expr: vault_lease_count_by_ttl{ttl="1h"} > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Vault leases expiring soon"
          description: "{{ $value }} Vault leases will expire within 1 hour"

      - alert: VaultAuditLogFailure
        expr: rate(vault_audit_log_request_failure[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Vault audit log failures"
          description: "Vault audit log failures detected: {{ $value }} failures per second"
EOF

    log "Vault monitoring configuration created successfully"
}

# Main execution
main() {
    log "Starting KALDRIX Vault CI/CD integration..."
    
    check_prerequisites
    configure_github_auth
    create_ci_cd_policies
    create_ci_cd_secrets
    create_github_actions_templates
    create_vault_monitoring
    
    log "KALDRIX Vault CI/CD integration completed successfully!"
    log "GitHub Actions workflows have been created"
    log "Vault monitoring and alerting has been configured"
    log "CI/CD secrets have been stored in Vault"
}

# Run main function
main "$@"