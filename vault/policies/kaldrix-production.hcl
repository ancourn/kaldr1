# KALDRIX Production Environment Policy
# Access to production secrets and configuration with limited permissions

# Path to read production secrets
path "secret/data/kaldrix/production/*" {
  capabilities = ["read", "list"]
}

# Path to read production metadata
path "secret/metadata/kaldrix/production/*" {
  capabilities = ["read", "list"]
}

# Path to update specific production secrets (limited)
path "secret/data/kaldrix/production/database" {
  capabilities = ["read", "update"]
}

path "secret/data/kaldrix/production/redis" {
  capabilities = ["read", "update"]
}

path "secret/data/kaldrix/production/jwt" {
  capabilities = ["read", "update"]
}

# Path to read production configuration
path "kaldrix/config/production/*" {
  capabilities = ["read", "list"]
}

# Path to manage production database credentials
path "kaldrix/database/production/*" {
  capabilities = ["read", "update"]
}

# Path to read production PKI certificates
path "kaldrix/pki/production/*" {
  capabilities = ["read", "list"]
}

# Path to sign certificates in production
path "kaldrix/pki/production/sign/*" {
  capabilities = ["create", "update"]
}

# Path to manage production AWS credentials (limited)
path "kaldrix/aws/production/*" {
  capabilities = ["read", "update"]
}

# Path to manage production transit encryption
path "kaldrix/transit/production/*" {
  capabilities = ["read", "update", "create"]
}

# Path to encrypt data in production
path "kaldrix/transit/production/encrypt/*" {
  capabilities = ["create", "update"]
}

# Path to decrypt data in production
path "kaldrix/transit/production/decrypt/*" {
  capabilities = ["create", "update"]
}

# Path to manage production Kubernetes authentication
path "auth/kubernetes/role/kaldrix-production" {
  capabilities = ["read"]
}

# Path to manage production JWT authentication
path "auth/jwt/role/kaldrix-production" {
  capabilities = ["read"]
}

# Path to manage production identity entities
path "identity/entity/name/kaldrix-production" {
  capabilities = ["read", "update"]
}

# Path to manage production identity groups
path "identity/group/name/kaldrix-production" {
  capabilities = ["read", "update"]
}

# Path to manage production leases
path "sys/leases/lookup/kaldrix-production/*" {
  capabilities = ["create", "update"]
}

# Path to renew production leases
path "sys/leases/renew/kaldrix-production/*" {
  capabilities = ["create", "update"]
}

# Path to revoke production leases
path "sys/leases/revoke/kaldrix-production/*" {
  capabilities = ["create", "update"]
}

# Path to manage production token roles
path "auth/token/roles/kaldrix-production" {
  capabilities = ["read"]
}

# Path to create production tokens
path "auth/token/create/kaldrix-production" {
  capabilities = ["create", "update"]
}

# Path to manage production health checks
path "sys/health" {
  capabilities = ["read"]
}

# Path to manage production metrics
path "sys/metrics" {
  capabilities = ["read"]
}

# Path to manage production capabilities
path "sys/capabilities-self" {
  capabilities = ["create", "update"]
}

# Path to manage production token lookup-self
path "auth/token/lookup-self" {
  capabilities = ["create", "update"]
}

# Path to manage production token renew-self
path "auth/token/renew-self" {
  capabilities = ["create", "update"]
}

# Path to manage production token revoke-self
path "auth/token/revoke-self" {
  capabilities = ["create", "update"]
}

# Path to manage production configuration (read-only)
path "sys/config/cors" {
  capabilities = ["read"]
}

path "sys/config/ui" {
  capabilities = ["read"]
}

path "sys/config/audit" {
  capabilities = ["read"]
}

# Path to manage production audit logs (read-only)
path "sys/audit-hash" {
  capabilities = ["create", "update"]
}

# Path to manage production tools (limited)
path "sys/tools/hash/*" {
  capabilities = ["create", "update"]
}

path "sys/tools/random/*" {
  capabilities = ["create", "update"]
}

# Path to manage production raw storage (limited)
path "sys/raw/*" {
  capabilities = ["read"]
}

# Path to manage production quotas (read-only)
path "sys/quotas" {
  capabilities = ["read"]
}

# Path to manage production host information
path "sys/host-info" {
  capabilities = ["read"]
}

# Path to manage production seal status
path "sys/seal-status" {
  capabilities = ["read"]
}

# Path to manage production key status
path "sys/key-status" {
  capabilities = ["read"]
}

# Path to manage production ha status
path "sys/ha-status" {
  capabilities = ["read"]
}

# Path to manage production leader information
path "sys/leader" {
  capabilities = ["read"]
}

# Path to manage production init information
path "sys/init" {
  capabilities = ["read"]
}

# Path to manage production replication status (if using Vault Enterprise)
path "sys/replication/status" {
  capabilities = ["read"]
}

# Path to manage production storage configuration (read-only)
path "sys/storage/raft/*" {
  capabilities = ["read"]
}

# Path to manage production plugins (read-only)
path "sys/plugins/catalog/*" {
  capabilities = ["read"]
}

# Path to manage production internal (read-only)
path "sys/internal/ui/mounts" {
  capabilities = ["read"]
}

path "sys/internal/ui/feature-flags" {
  capabilities = ["read"]
}

# Path to manage production namespaces (if using Vault Enterprise)
path "sys/namespaces" {
  capabilities = ["read"]
}

# Path to manage production license (if using Vault Enterprise)
path "sys/license" {
  capabilities = ["read"]
}

# Path to manage production control groups (read-only)
path "sys/control-group/*" {
  capabilities = ["read"]
}

# Path to manage production step-down (emergency access)
path "sys/step-down" {
  capabilities = ["create", "update"]
}

# Path to manage production rekey (emergency access)
path "sys/rekey/*" {
  capabilities = ["read"]
}

# Path to manage production generate root (emergency access)
path "sys/generate-root/*" {
  capabilities = ["read"]
}

# Path to manage production rotate (emergency access)
path "sys/rotate" {
  capabilities = ["create", "update"]
}

# Path to manage production config (read-only)
path "sys/config/*" {
  capabilities = ["read"]
}

# Path to manage production policies (read-only)
path "sys/policies" {
  capabilities = ["read"]
}

path "sys/policies/acl" {
  capabilities = ["read"]
}

path "sys/policies/acl/kaldrix-production" {
  capabilities = ["read"]
}

# Path to manage production auth methods (read-only)
path "sys/auth" {
  capabilities = ["read"]
}

path "sys/auth/kubernetes" {
  capabilities = ["read"]
}

path "sys/auth/jwt" {
  capabilities = ["read"]
}

path "sys/auth/token" {
  capabilities = ["read"]
}

# Path to manage production secrets engines (read-only)
path "sys/mounts" {
  capabilities = ["read"]
}

path "sys/mounts/secret/" {
  capabilities = ["read"]
}

path "sys/mounts/kaldrix/" {
  capabilities = ["read"]
}

path "sys/mounts/kaldrix/database/" {
  capabilities = ["read"]
}

path "sys/mounts/kaldrix/pki/" {
  capabilities = ["read"]
}

path "sys/mounts/kaldrix/aws/" {
  capabilities = ["read"]
}

path "sys/mounts/kaldrix/transit/" {
  capabilities = ["read"]
}

# Path to manage production identity (read-only)
path "identity/entity" {
  capabilities = ["read"]
}

path "identity/group" {
  capabilities = ["read"]
}

path "identity/alias" {
  capabilities = ["read"]
}

# Path to manage production audit devices (read-only)
path "sys/audit" {
  capabilities = ["read"]
}

# Path to manage production leases (read-only)
path "sys/leases" {
  capabilities = ["read"]
}

# Path to manage production tools (read-only)
path "sys/tools" {
  capabilities = ["read"]
}

# Path to manage production control groups (read-only)
path "sys/control-group" {
  capabilities = ["read"]
}

# Path to manage production replication (read-only)
path "sys/replication" {
  capabilities = ["read"]
}

# Path to manage production namespaces (read-only)
path "sys/namespaces" {
  capabilities = ["read"]
}

# Path to manage production quotas (read-only)
path "sys/quotas" {
  capabilities = ["read"]
}

# Path to manage production plugins (read-only)
path "sys/plugins" {
  capabilities = ["read"]
}

# Path to manage production capabilities (read-only)
path "sys/capabilities" {
  capabilities = ["read"]
}

# Path to manage production internal (read-only)
path "sys/internal" {
  capabilities = ["read"]
}

# Path to manage production raw storage (read-only)
path "sys/raw" {
  capabilities = ["read"]
}

# Path to manage production token (read-only)
path "auth/token" {
  capabilities = ["read"]
}

path "auth/token/accessors" {
  capabilities = ["list"]
}

path "auth/token/roles" {
  capabilities = ["read"]
}

# Path to manage production token roles (read-only)
path "auth/token/roles/kaldrix-production" {
  capabilities = ["read"]
}

# Path to manage production token tidy (read-only)
path "auth/token/tidy" {
  capabilities = ["read"]
}