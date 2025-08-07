# KALDRIX Production Environment Configuration

# Environment settings
environment        = "production"
project_name      = "kaldrix"
aws_region        = "us-east-1"

# VPC Configuration
vpc_cidr          = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
private_subnets   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnets    = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
database_subnets  = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  main = {
    instance_type = "m6i.xlarge"
    min_size      = 5
    max_size      = 15
    desired_size  = 8
    capacity_type = "ON_DEMAND"
    disk_size     = 100
  }
  blockchain = {
    instance_type = "c6i.2xlarge"
    min_size      = 5
    max_size      = 12
    desired_size  = 7
    capacity_type = "ON_DEMAND"
    disk_size     = 200
  }
  monitoring = {
    instance_type = "r6i.xlarge"
    min_size      = 3
    max_size      = 8
    desired_size  = 4
    capacity_type = "ON_DEMAND"
    disk_size     = 100
  }
}

# Feature Flags
enable_monitoring          = true
enable_vault              = true
enable_backup             = true
enable_cost_optimization  = true
enable_security_compliance = true

# Domain Configuration
domain_name = "kaldrix.com"

# Backup Configuration
backup_retention_days = 90

# Vault Configuration
vault_address = "https://vault.kaldrix.com:8200"
# vault_token = ""  # Set via environment variable or secure storage

# Additional Tags
tags = {
  Environment = "production"
  CostCenter  = "engineering"
  Owner       = "kaldrix-ops"
  Project     = "kaldrix-blockchain"
  ManagedBy   = "terraform"
}