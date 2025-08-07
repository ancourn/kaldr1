#!/bin/bash

# KALDRIX Vault Initialization Script
# This script initializes and configures HashiCorp Vault for the KALDRIX blockchain platform

set -e

# Configuration
VAULT_ADDR="https://vault.kaldrix.com:8200"
VAULT_NAMESPACE="kaldrix"
K8S_NAMESPACE="vault"
VAULT_POD="vault-0"

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

# Check if Vault is running
check_vault_status() {
    log "Checking Vault status..."
    
    # Wait for Vault pod to be ready
    kubectl wait --for=condition=ready pod -l app=vault -n $K8S_NAMESPACE --timeout=300s
    
    # Check Vault health
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- vault status
    
    if [ $? -eq 0 ]; then
        log "Vault is running and accessible"
    else
        error "Vault is not accessible"
        exit 1
    fi
}

# Initialize Vault
initialize_vault() {
    log "Initializing Vault..."
    
    # Check if Vault is already initialized
    INIT_STATUS=$(kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- vault status -format=json | jq -r '.initialized')
    
    if [ "$INIT_STATUS" = "true" ]; then
        warn "Vault is already initialized"
        return 0
    fi
    
    # Initialize Vault
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- vault operator init -format=json > vault-init.json
    
    if [ $? -eq 0 ]; then
        log "Vault initialized successfully"
        log "Initialization keys and root token saved to vault-init.json"
        
        # Extract and display unseal keys and root token
        UNSEAL_KEYS=$(cat vault-init.json | jq -r '.unseal_keys_b64[]')
        ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
        
        log "Unseal Keys:"
        echo "$UNSEAL_KEYS"
        log "Root Token: $ROOT_TOKEN"
        
        # Store in secure location (in production, use proper secret management)
        chmod 600 vault-init.json
    else
        error "Failed to initialize Vault"
        exit 1
    fi
}

# Unseal Vault
unseal_vault() {
    log "Unsealing Vault..."
    
    # Check if Vault is sealed
    SEALED_STATUS=$(kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- vault status -format=json | jq -r '.sealed')
    
    if [ "$SEALED_STATUS" = "false" ]; then
        warn "Vault is already unsealed"
        return 0
    fi
    
    # Get unseal keys
    if [ ! -f "vault-init.json" ]; then
        error "Vault initialization file not found. Please run initialize_vault first."
        exit 1
    fi
    
    UNSEAL_KEYS=$(cat vault-init.json | jq -r '.unseal_keys_b64[]')
    
    # Unseal Vault with 3 keys (threshold is 3)
    echo "$UNSEAL_KEYS" | head -3 | while read key; do
        kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- vault operator unseal "$key"
    done
    
    # Verify unseal status
    SEALED_STATUS=$(kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- vault status -format=json | jq -r '.sealed')
    if [ "$SEALED_STATUS" = "false" ]; then
        log "Vault unsealed successfully"
    else
        error "Failed to unseal Vault"
        exit 1
    fi
}

# Configure Vault authentication methods
configure_auth_methods() {
    log "Configuring authentication methods..."
    
    # Get root token
    ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
    
    # Set environment variables for Vault CLI
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && export VAULT_ADDR=https://127.0.0.1:8200"
    
    # Enable Kubernetes auth method
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault auth enable kubernetes"
    
    # Configure Kubernetes auth method
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault write auth/kubernetes/config \
        kubernetes_host=https://kubernetes.default.svc \
        kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
        token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token"
    
    # Enable JWT auth method
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault auth enable jwt"
    
    # Enable Token auth method
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault auth enable token"
    
    log "Authentication methods configured successfully"
}

# Configure secrets engines
configure_secrets_engines() {
    log "Configuring secrets engines..."
    
    # Get root token
    ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
    
    # Enable KV secrets engine v2
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault secrets enable -version=2 kv"
    
    # Enable PKI secrets engine
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault secrets enable pki"
    
    # Configure PKI
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault secrets tune -max-lease-ttl=8760h pki"
    
    # Enable Database secrets engine
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault secrets enable database"
    
    # Enable AWS secrets engine
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault secrets enable aws"
    
    # Enable Transit secrets engine
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault secrets enable transit"
    
    log "Secrets engines configured successfully"
}

# Create KALDRIX specific paths and policies
create_kaldrix_configuration() {
    log "Creating KALDRIX specific configuration..."
    
    # Get root token
    ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
    
    # Create KALDRIX paths
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/production/database \
        username='kaldrix_prod' \
        password='$(openssl rand -base64 32)' \
        host='postgres-production.kaldrix.svc.cluster.local' \
        port='5432' \
        database='kaldrix_production'"
    
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/production/redis \
        password='$(openssl rand -base64 32)' \
        host='redis-production.kaldrix.svc.cluster.local' \
        port='6379'"
    
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/production/jwt \
        secret='$(openssl rand -base64 64)' \
        algorithm='HS256' \
        expiration='24h'"
    
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/staging/database \
        username='kaldrix_staging' \
        password='$(openssl rand -base64 32)' \
        host='postgres-staging.kaldrix.svc.cluster.local' \
        port='5432' \
        database='kaldrix_staging'"
    
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/staging/redis \
        password='$(openssl rand -base64 32)' \
        host='redis-staging.kaldrix.svc.cluster.local' \
        port='6379'"
    
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/staging/jwt \
        secret='$(openssl rand -base64 64)' \
        algorithm='HS256' \
        expiration='24h'"
    
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/development/database \
        username='kaldrix_dev' \
        password='$(openssl rand -base64 32)' \
        host='postgres-development.kaldrix.svc.cluster.local' \
        port='5432' \
        database='kaldrix_development'"
    
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/development/redis \
        password='$(openssl rand -base64 32)' \
        host='redis-development.kaldrix.svc.cluster.local' \
        port='6379'"
    
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault kv put kv/kaldrix/development/jwt \
        secret='$(openssl rand -base64 64)' \
        algorithm='HS256' \
        expiration='24h'"
    
    log "KALDRIX configuration created successfully"
}

# Load policies
load_policies() {
    log "Loading Vault policies..."
    
    # Get root token
    ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
    
    # Load policies from files
    for policy_file in ../policies/*.hcl; do
        policy_name=$(basename "$policy_file" .hcl)
        log "Loading policy: $policy_name"
        
        # Copy policy file to pod
        kubectl cp "$policy_file" "$K8S_NAMESPACE/$VAULT_POD:/tmp/$policy_name.hcl"
        
        # Load policy
        kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault policy write $policy_name /tmp/$policy_name.hcl"
    done
    
    log "Policies loaded successfully"
}

# Create Kubernetes auth roles
create_kubernetes_roles() {
    log "Creating Kubernetes authentication roles..."
    
    # Get root token
    ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
    
    # Create production role
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault write auth/kubernetes/role/kaldrix-production \
        bound_service_account_names=kaldrix-production \
        bound_service_account_namespaces=default \
        policies=kaldrix-production \
        ttl=24h"
    
    # Create staging role
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault write auth/kubernetes/role/kaldrix-staging \
        bound_service_account_names=kaldrix-staging \
        bound_service_account_namespaces=default \
        policies=kaldrix-staging \
        ttl=24h"
    
    # Create development role
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault write auth/kubernetes/role/kaldrix-development \
        bound_service_account_names=kaldrix-development \
        bound_service_account_namespaces=default \
        policies=kaldrix-developer \
        ttl=24h"
    
    # Create admin role
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault write auth/kubernetes/role/kaldrix-admin \
        bound_service_account_names=kaldrix-admin \
        bound_service_account_namespaces=default \
        policies=kaldrix-admin \
        ttl=24h"
    
    log "Kubernetes authentication roles created successfully"
}

# Create transit encryption keys
create_transit_keys() {
    log "Creating transit encryption keys..."
    
    # Get root token
    ROOT_TOKEN=$(cat vault-init.json | jq -r '.root_token')
    
    # Create production encryption key
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault write -f transit/keys/kaldrix-production \
        type=aes-256-gcm \
        deletion_allowed=false"
    
    # Create staging encryption key
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault write -f transit/keys/kaldrix-staging \
        type=aes-256-gcm \
        deletion_allowed=false"
    
    # Create development encryption key
    kubectl exec -n $K8S_NAMESPACE $VAULT_POD -- sh -c "export VAULT_TOKEN=$ROOT_TOKEN && vault write -f transit/keys/kaldrix-development \
        type=aes-256-gcm \
        deletion_allowed=true"
    
    log "Transit encryption keys created successfully"
}

# Main execution
main() {
    log "Starting KALDRIX Vault initialization and configuration..."
    
    check_vault_status
    initialize_vault
    unseal_vault
    configure_auth_methods
    configure_secrets_engines
    create_kaldrix_configuration
    load_policies
    create_kubernetes_roles
    create_transit_keys
    
    log "KALDRIX Vault configuration completed successfully!"
    log "Vault initialization details are stored in vault-init.json"
    log "IMPORTANT: Store vault-init.json securely and never commit it to version control!"
}

# Run main function
main "$@"