# KALDRIX Admin Policy
# Full administrative access to KALDRIX secrets and configuration

# Path to manage KALDRIX secrets
path "secret/data/kaldrix/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX metadata
path "secret/metadata/kaldrix/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX configuration
path "kaldrix/config/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX PKI
path "kaldrix/pki/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX database credentials
path "kaldrix/database/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX AWS credentials
path "kaldrix/aws/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX Kubernetes authentication
path "auth/kubernetes/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX JWT/OIDC authentication
path "auth/jwt/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX transit secrets engine
path "kaldrix/transit/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX identity entities and groups
path "identity/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX system configuration
path "sys/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX audit logs
path "sys/audit/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX health checks
path "sys/health" {
  capabilities = ["read", "update"]
}

# Path to manage KALDRIX metrics
path "sys/metrics" {
  capabilities = ["read"]
}

# Path to manage KALDRIX leases
path "sys/leases/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX policies
path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX auth methods
path "sys/auth/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX secrets engines
path "sys/mounts/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX tools
path "sys/tools/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX control groups
path "sys/control-group/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX enterprise features (if applicable)
path "sys/replication/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX namespaces (if using Vault Enterprise)
path "sys/namespaces/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX license (if using Vault Enterprise)
path "sys/license" {
  capabilities = ["read", "update"]
}

# Path to manage KALDRIX storage configuration
path "sys/storage/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX plugins
path "sys/plugins/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX capabilities
path "sys/capabilities" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX internal
path "sys/internal/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX host information
path "sys/host-info" {
  capabilities = ["read"]
}

# Path to manage KALDRIX init information
path "sys/init" {
  capabilities = ["read"]
}

# Path to manage KALDRIX leader information
path "sys/leader" {
  capabilities = ["read"]
}

# Path to manage KALDRIX step-down
path "sys/step-down" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX seal status
path "sys/seal-status" {
  capabilities = ["read"]
}

# Path to manage KALDRIX unseal
path "sys/unseal" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX rekey
path "sys/rekey/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX generate root
path "sys/generate-root/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX rotate
path "sys/rotate" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX config
path "sys/config/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX key status
path "sys/key-status" {
  capabilities = ["read"]
}

# Path to manage KALDRIX ha status
path "sys/ha-status" {
  capabilities = ["read"]
}

# Path to KALDRIX raw storage access (for debugging)
path "sys/raw/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX quotas
path "sys/quotas/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX tokens
path "auth/token/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX token accessors
path "auth/token/accessors" {
  capabilities = ["list"]
}

# Path to manage KALDRIX token roles
path "auth/token/roles/*" {
  capabilities = ["create", "read", "update", "delete", "list", "patch"]
}

# Path to manage KALDRIX token lookup
path "auth/token/lookup" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token lookup-accessor
path "auth/token/lookup-accessor" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token lookup-self
path "auth/token/lookup-self" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token renew
path "auth/token/renew" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token renew-self
path "auth/token/renew-self" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token revoke
path "auth/token/revoke" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token revoke-accessor
path "auth/token/revoke-accessor" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token revoke-self
path "auth/token/revoke-self" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token create
path "auth/token/create" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token create-orphan
path "auth/token/create-orphan" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token create-role
path "auth/token/create-role/*" {
  capabilities = ["create", "update"]
}

# Path to manage KALDRIX token roles (alternative path)
path "auth/token/roles" {
  capabilities = ["list"]
}

# Path to manage KALDRIX token tidy
path "auth/token/tidy" {
  capabilities = ["create", "update"]
}