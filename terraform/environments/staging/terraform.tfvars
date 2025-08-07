# KALDRIX Staging Environment Configuration

# Environment settings
environment        = "staging"
project_name      = "kaldrix"
aws_region        = "us-east-1"

# VPC Configuration
vpc_cidr          = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
private_subnets   = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
public_subnets    = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
database_subnets  = ["10.1.201.0/24", "10.1.202.0/24", "10.1.203.0/24"]

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  main = {
    instance_type = "m6i.large"
    min_size      = 2
    max_size      = 6
    desired_size  = 3
    capacity_type = "ON_DEMAND"
    disk_size     = 50
  }
  blockchain = {
    instance_type = "c6i.xlarge"
    min_size      = 2
    max_size      = 5
    desired_size  = 3
    capacity_type = "ON_DEMAND"
    disk_size     = 100
  }
  monitoring = {
    instance_type = "r6i.large"
    min_size      = 1
    max_size      = 3
    desired_size  = 2
    capacity_type = "ON_DEMAND"
    disk_size     = 50
  }
}

# Feature Flags
enable_monitoring          = true
enable_vault              = true
enable_backup             = true
enable_cost_optimization  = true
enable_security_compliance = true

# Domain Configuration
domain_name = "staging.kaldrix.com"

# Backup Configuration
backup_retention_days = 30

# Vault Configuration
vault_address = "https://vault.staging.kaldrix.com:8200"
# vault_token = ""  # Set via environment variable or secure storage

# Additional Tags
tags = {
  Environment = "staging"
  CostCenter  = "engineering"
  Owner       = "kaldrix-ops"
  Project     = "kaldrix-blockchain"
  ManagedBy   = "terraform"
}