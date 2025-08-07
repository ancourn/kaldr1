# KALDRIX Vault Configuration
# This configuration sets up HashiCorp Vault for the KALDRIX blockchain platform

# Main Vault server configuration
storage "file" {
  path = "/vault/file"
}

# HTTP listener configuration
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/vault/config/tls.crt"
  tls_key_file  = "/vault/config/tls.key"
  tls_client_ca_file = "/vault/config/ca.crt"
  tls_disable = false
  tls_prefer_server_cipher_suites = true
}

# API address configuration
api_addr = "https://vault.kaldrix.com:8200"
cluster_addr = "https://vault.kaldrix.com:8201"

# Default lease TTL
default_lease_ttl = "168h"
max_lease_ttl = "720h"

# UI configuration
ui = true

# Cluster configuration
cluster_name = "kaldrix-vault"
disable_mlock = true

# Plugin directory
plugin_directory = "/vault/plugins"

# Raft configuration for HA
storage "raft" {
  path    = "/vault/raft"
  node_id = "vault-1"
}

# Service registration
service_registration "kubernetes" {}

# Telemetry configuration
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
  disable_service_metrics = false
  enable_agent_metrics = true
  use_agent_metrics = true
  statsd_address = "localhost:8125"
}

# Seal configuration for auto-unseal
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-unseal"
}

# Enterprise features (if using Vault Enterprise)
# enterprise_license_path = "/vault/license/vault.hclic"

# Logging configuration
log_level = "info"
log_format = "json"

# Audit device configuration
audit "file" {
  path = "/vault/audit/audit.log"
  mode = "0640"
  format = "json"
  hmac_key = "hmac-key"
}

# Auto-unseal configuration
# unseal {
#   type = "awskms"
#   kms_key_id = "alias/vault-unseal"
#   region = "us-east-1"
# }

# Replication configuration (for HA)
replication {
  primary_suffix = "primary"
}

# Performance configuration
performance {
  request_max_duration = "90s"
  request_max_size = 33554432
  response_max_size = 33554432
}

# Rate limiting configuration
rate_limit {
  rate = 1000
  burst = 2000
}

# CORS configuration (for UI access)
cors {
  enabled = true
  allowed_origins = ["https://vault.kaldrix.com", "https://kaldrix.com", "https://*.kaldrix.com"]
  allowed_headers = ["X-Requested-With", "X-Vault-Token", "X-Vault-Namespace", "Content-Type"]
  allowed_methods = ["GET", "POST", "PUT", "DELETE"]
}

# Enterprise namespace configuration (if using Vault Enterprise)
# namespaces {
#   name = "kaldrix"
# }

# License configuration (if using Vault Enterprise)
# license {
#   path = "/vault/license/vault.hclic"
# }