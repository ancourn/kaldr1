# KALDRIX Staging Environment Policy
# Access to staging secrets and configuration with limited permissions

# Path to read staging secrets
path "secret/data/kaldrix/staging/*" {
  capabilities = ["read", "list"]
}

# Path to read staging metadata
path "secret/metadata/kaldrix/staging/*" {
  capabilities = ["read", "list"]
}

# Path to update specific staging secrets (limited)
path "secret/data/kaldrix/staging/database" {
  capabilities = ["read", "update"]
}

path "secret/data/kaldrix/staging/redis" {
  capabilities = ["read", "update"]
}

path "secret/data/kaldrix/staging/jwt" {
  capabilities = ["read", "update"]
}

# Path to read staging configuration
path "kaldrix/config/staging/*" {
  capabilities = ["read", "list"]
}

# Path to manage staging database credentials
path "kaldrix/database/staging/*" {
  capabilities = ["read", "update"]
}

# Path to read staging PKI certificates
path "kaldrix/pki/staging/*" {
  capabilities = ["read", "list"]
}

# Path to sign certificates in staging
path "kaldrix/pki/staging/sign/*" {
  capabilities = ["create", "update"]
}

# Path to manage staging AWS credentials (limited)
path "kaldrix/aws/staging/*" {
  capabilities = ["read", "update"]
}

# Path to manage staging transit encryption
path "kaldrix/transit/staging/*" {
  capabilities = ["read", "update", "create"]
}

# Path to encrypt data in staging
path "kaldrix/transit/staging/encrypt/*" {
  capabilities = ["create", "update"]
}

# Path to decrypt data in staging
path "kaldrix/transit/staging/decrypt/*" {
  capabilities = ["create", "update"]
}

# Path to manage staging Kubernetes authentication
path "auth/kubernetes/role/kaldrix-staging" {
  capabilities = ["read"]
}

# Path to manage staging JWT authentication
path "auth/jwt/role/kaldrix-staging" {
  capabilities = ["read"]
}

# Path to manage staging identity entities
path "identity/entity/name/kaldrix-staging" {
  capabilities = ["read", "update"]
}

# Path to manage staging identity groups
path "identity/group/name/kaldrix-staging" {
  capabilities = ["read", "update"]
}

# Path to manage staging leases
path "sys/leases/lookup/kaldrix-staging/*" {
  capabilities = ["create", "update"]
}

# Path to renew staging leases
path "sys/leases/renew/kaldrix-staging/*" {
  capabilities = ["create", "update"]
}

# Path to revoke staging leases
path "sys/leases/revoke/kaldrix-staging/*" {
  capabilities = ["create", "update"]
}

# Path to manage staging token roles
path "auth/token/roles/kaldrix-staging" {
  capabilities = ["read"]
}

# Path to create staging tokens
path "auth/token/create/kaldrix-staging" {
  capabilities = ["create", "update"]
}

# Path to manage staging health checks
path "sys/health" {
  capabilities = ["read"]
}

# Path to manage staging metrics
path "sys/metrics" {
  capabilities = ["read"]
}

# Path to manage staging capabilities
path "sys/capabilities-self" {
  capabilities = ["create", "update"]
}

# Path to manage staging token lookup-self
path "auth/token/lookup-self" {
  capabilities = ["create", "update"]
}

# Path to manage staging token renew-self
path "auth/token/renew-self" {
  capabilities = ["create", "update"]
}

# Path to manage staging token revoke-self
path "auth/token/revoke-self" {
  capabilities = ["create", "update"]
}

# Path to manage staging configuration (read-only)
path "sys/config/cors" {
  capabilities = ["read"]
}

path "sys/config/ui" {
  capabilities = ["read"]
}

path "sys/config/audit" {
  capabilities = ["read"]
}

# Path to manage staging audit logs (read-only)
path "sys/audit-hash" {
  capabilities = ["create", "update"]
}

# Path to manage staging tools (limited)
path "sys/tools/hash/*" {
  capabilities = ["create", "update"]
}

path "sys/tools/random/*" {
  capabilities = ["create", "update"]
}

# Path to manage staging raw storage (limited)
path "sys/raw/*" {
  capabilities = ["read"]
}

# Path to manage staging quotas (read-only)
path "sys/quotas" {
  capabilities = ["read"]
}

# Path to manage staging host information
path "sys/host-info" {
  capabilities = ["read"]
}

# Path to manage staging seal status
path "sys/seal-status" {
  capabilities = ["read"]
}

# Path to manage staging key status
path "sys/key-status" {
  capabilities = ["read"]
}

# Path to manage staging ha status
path "sys/ha-status" {
  capabilities = ["read"]
}

# Path to manage staging leader information
path "sys/leader" {
  capabilities = ["read"]
}

# Path to manage staging init information
path "sys/init" {
  capabilities = ["read"]
}

# Path to manage staging replication status (if using Vault Enterprise)
path "sys/replication/status" {
  capabilities = ["read"]
}

# Path to manage staging storage configuration (read-only)
path "sys/storage/raft/*" {
  capabilities = ["read"]
}

# Path to manage staging plugins (read-only)
path "sys/plugins/catalog/*" {
  capabilities = ["read"]
}

# Path to manage staging internal (read-only)
path "sys/internal/ui/mounts" {
  capabilities = ["read"]
}

path "sys/internal/ui/feature-flags" {
  capabilities = ["read"]
}

# Path to manage staging namespaces (if using Vault Enterprise)
path "sys/namespaces" {
  capabilities = ["read"]
}

# Path to manage staging license (if using Vault Enterprise)
path "sys/license" {
  capabilities = ["read"]
}

# Path to manage staging control groups (read-only)
path "sys/control-group/*" {
  capabilities = ["read"]
}

# Path to manage staging step-down (emergency access)
path "sys/step-down" {
  capabilities = ["create", "update"]
}

# Path to manage staging rekey (emergency access)
path "sys/rekey/*" {
  capabilities = ["read"]
}

# Path to manage staging generate root (emergency access)
path "sys/generate-root/*" {
  capabilities = ["read"]
}

# Path to manage staging rotate (emergency access)
path "sys/rotate" {
  capabilities = ["create", "update"]
}

# Path to manage staging config (read-only)
path "sys/config/*" {
  capabilities = ["read"]
}

# Path to manage staging policies (read-only)
path "sys/policies" {
  capabilities = ["read"]
}

path "sys/policies/acl" {
  capabilities = ["read"]
}

path "sys/policies/acl/kaldrix-staging" {
  capabilities = ["read"]
}

# Path to manage staging auth methods (read-only)
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

# Path to manage staging secrets engines (read-only)
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

# Path to manage staging identity (read-only)
path "identity/entity" {
  capabilities = ["read"]
}

path "identity/group" {
  capabilities = ["read"]
}

path "identity/alias" {
  capabilities = ["read"]
}

# Path to manage staging audit devices (read-only)
path "sys/audit" {
  capabilities = ["read"]
}

# Path to manage staging leases (read-only)
path "sys/leases" {
  capabilities = ["read"]
}

# Path to manage staging tools (read-only)
path "sys/tools" {
  capabilities = ["read"]
}

# Path to manage staging control groups (read-only)
path "sys/control-group" {
  capabilities = ["read"]
}

# Path to manage staging replication (read-only)
path "sys/replication" {
  capabilities = ["read"]
}

# Path to manage staging namespaces (read-only)
path "sys/namespaces" {
  capabilities = ["read"]
}

# Path to manage staging quotas (read-only)
path "sys/quotas" {
  capabilities = ["read"]
}

# Path to manage staging plugins (read-only)
path "sys/plugins" {
  capabilities = ["read"]
}

# Path to manage staging capabilities (read-only)
path "sys/capabilities" {
  capabilities = ["read"]
}

# Path to manage staging internal (read-only)
path "sys/internal" {
  capabilities = ["read"]
}

# Path to manage staging raw storage (read-only)
path "sys/raw" {
  capabilities = ["read"]
}

# Path to manage staging token (read-only)
path "auth/token" {
  capabilities = ["read"]
}

path "auth/token/accessors" {
  capabilities = ["list"]
}

path "auth/token/roles" {
  capabilities = ["read"]
}

# Path to manage staging token roles (read-only)
path "auth/token/roles/kaldrix-staging" {
  capabilities = ["read"]
}

# Path to manage staging token tidy (read-only)
path "auth/token/tidy" {
  capabilities = ["read"]
}