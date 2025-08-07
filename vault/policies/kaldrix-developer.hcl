# KALDRIX Developer Policy
# Limited access for development and testing purposes

# Path to read development secrets
path "secret/data/kaldrix/development/*" {
  capabilities = ["read", "list"]
}

# Path to read development metadata
path "secret/metadata/kaldrix/development/*" {
  capabilities = ["read", "list"]
}

# Path to update development secrets (limited)
path "secret/data/kaldrix/development/*" {
  capabilities = ["read", "update", "create"]
}

# Path to read development configuration
path "kaldrix/config/development/*" {
  capabilities = ["read", "list"]
}

# Path to manage development database credentials
path "kaldrix/database/development/*" {
  capabilities = ["read", "update"]
}

# Path to read development PKI certificates
path "kaldrix/pki/development/*" {
  capabilities = ["read", "list"]
}

# Path to sign certificates in development
path "kaldrix/pki/development/sign/*" {
  capabilities = ["create", "update"]
}

# Path to manage development AWS credentials (limited)
path "kaldrix/aws/development/*" {
  capabilities = ["read", "update"]
}

# Path to manage development transit encryption
path "kaldrix/transit/development/*" {
  capabilities = ["read", "update", "create"]
}

# Path to encrypt data in development
path "kaldrix/transit/development/encrypt/*" {
  capabilities = ["create", "update"]
}

# Path to decrypt data in development
path "kaldrix/transit/development/decrypt/*" {
  capabilities = ["create", "update"]
}

# Path to manage development Kubernetes authentication
path "auth/kubernetes/role/kaldrix-development" {
  capabilities = ["read"]
}

# Path to manage development JWT authentication
path "auth/jwt/role/kaldrix-development" {
  capabilities = ["read"]
}

# Path to manage development identity entities
path "identity/entity/name/kaldrix-development" {
  capabilities = ["read", "update"]
}

# Path to manage development identity groups
path "identity/group/name/kaldrix-development" {
  capabilities = ["read", "update"]
}

# Path to manage development leases
path "sys/leases/lookup/kaldrix-development/*" {
  capabilities = ["create", "update"]
}

# Path to renew development leases
path "sys/leases/renew/kaldrix-development/*" {
  capabilities = ["create", "update"]
}

# Path to revoke development leases
path "sys/leases/revoke/kaldrix-development/*" {
  capabilities = ["create", "update"]
}

# Path to manage development token roles
path "auth/token/roles/kaldrix-development" {
  capabilities = ["read"]
}

# Path to create development tokens
path "auth/token/create/kaldrix-development" {
  capabilities = ["create", "update"]
}

# Path to manage development health checks
path "sys/health" {
  capabilities = ["read"]
}

# Path to manage development metrics
path "sys/metrics" {
  capabilities = ["read"]
}

# Path to manage development capabilities
path "sys/capabilities-self" {
  capabilities = ["create", "update"]
}

# Path to manage development token lookup-self
path "auth/token/lookup-self" {
  capabilities = ["create", "update"]
}

# Path to manage development token renew-self
path "auth/token/renew-self" {
  capabilities = ["create", "update"]
}

# Path to manage development token revoke-self
path "auth/token/revoke-self" {
  capabilities = ["create", "update"]
}

# Path to manage development configuration (read-only)
path "sys/config/cors" {
  capabilities = ["read"]
}

path "sys/config/ui" {
  capabilities = ["read"]
}

path "sys/config/audit" {
  capabilities = ["read"]
}

# Path to manage development audit logs (read-only)
path "sys/audit-hash" {
  capabilities = ["create", "update"]
}

# Path to manage development tools (limited)
path "sys/tools/hash/*" {
  capabilities = ["create", "update"]
}

path "sys/tools/random/*" {
  capabilities = ["create", "update"]
}

# Path to manage development raw storage (limited)
path "sys/raw/*" {
  capabilities = ["read"]
}

# Path to manage development quotas (read-only)
path "sys/quotas" {
  capabilities = ["read"]
}

# Path to manage development host information
path "sys/host-info" {
  capabilities = ["read"]
}

# Path to manage development seal status
path "sys/seal-status" {
  capabilities = ["read"]
}

# Path to manage development key status
path "sys/key-status" {
  capabilities = ["read"]
}

# Path to manage development ha status
path "sys/ha-status" {
  capabilities = ["read"]
}

# Path to manage development leader information
path "sys/leader" {
  capabilities = ["read"]
}

# Path to manage development init information
path "sys/init" {
  capabilities = ["read"]
}

# Path to manage development replication status (if using Vault Enterprise)
path "sys/replication/status" {
  capabilities = ["read"]
}

# Path to manage development storage configuration (read-only)
path "sys/storage/raft/*" {
  capabilities = ["read"]
}

# Path to manage development plugins (read-only)
path "sys/plugins/catalog/*" {
  capabilities = ["read"]
}

# Path to manage development internal (read-only)
path "sys/internal/ui/mounts" {
  capabilities = ["read"]
}

path "sys/internal/ui/feature-flags" {
  capabilities = ["read"]
}

# Path to manage development namespaces (if using Vault Enterprise)
path "sys/namespaces" {
  capabilities = ["read"]
}

# Path to manage development license (if using Vault Enterprise)
path "sys/license" {
  capabilities = ["read"]
}

# Path to manage development control groups (read-only)
path "sys/control-group/*" {
  capabilities = ["read"]
}

# Path to manage development step-down (emergency access)
path "sys/step-down" {
  capabilities = ["create", "update"]
}

# Path to manage development rekey (emergency access)
path "sys/rekey/*" {
  capabilities = ["read"]
}

# Path to manage development generate root (emergency access)
path "sys/generate-root/*" {
  capabilities = ["read"]
}

# Path to manage development rotate (emergency access)
path "sys/rotate" {
  capabilities = ["create", "update"]
}

# Path to manage development config (read-only)
path "sys/config/*" {
  capabilities = ["read"]
}

# Path to manage development policies (read-only)
path "sys/policies" {
  capabilities = ["read"]
}

path "sys/policies/acl" {
  capabilities = ["read"]
}

path "sys/policies/acl/kaldrix-development" {
  capabilities = ["read"]
}

# Path to manage development auth methods (read-only)
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

# Path to manage development secrets engines (read-only)
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

# Path to manage development identity (read-only)
path "identity/entity" {
  capabilities = ["read"]
}

path "identity/group" {
  capabilities = ["read"]
}

path "identity/alias" {
  capabilities = ["read"]
}

# Path to manage development audit devices (read-only)
path "sys/audit" {
  capabilities = ["read"]
}

# Path to manage development leases (read-only)
path "sys/leases" {
  capabilities = ["read"]
}

# Path to manage development tools (read-only)
path "sys/tools" {
  capabilities = ["read"]
}

# Path to manage development control groups (read-only)
path "sys/control-group" {
  capabilities = ["read"]
}

# Path to manage development replication (read-only)
path "sys/replication" {
  capabilities = ["read"]
}

# Path to manage development namespaces (read-only)
path "sys/namespaces" {
  capabilities = ["read"]
}

# Path to manage development quotas (read-only)
path "sys/quotas" {
  capabilities = ["read"]
}

# Path to manage development plugins (read-only)
path "sys/plugins" {
  capabilities = ["read"]
}

# Path to manage development capabilities (read-only)
path "sys/capabilities" {
  capabilities = ["read"]
}

# Path to manage development internal (read-only)
path "sys/internal" {
  capabilities = ["read"]
}

# Path to manage development raw storage (read-only)
path "sys/raw" {
  capabilities = ["read"]
}

# Path to manage development token (read-only)
path "auth/token" {
  capabilities = ["read"]
}

path "auth/token/accessors" {
  capabilities = ["list"]
}

path "auth/token/roles" {
  capabilities = ["read"]
}

# Path to manage development token roles (read-only)
path "auth/token/roles/kaldrix-development" {
  capabilities = ["read"]
}

# Path to manage development token tidy (read-only)
path "auth/token/tidy" {
  capabilities = ["read"]
}