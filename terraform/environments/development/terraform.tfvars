# KALDRIX Development Environment Configuration

# Environment settings
environment        = "development"
project_name      = "kaldrix"
aws_region        = "us-east-1"

# VPC Configuration
vpc_cidr          = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
private_subnets   = ["10.2.1.0/24", "10.2.2.0/24"]
public_subnets    = ["10.2.101.0/24", "10.2.102.0/24"]
database_subnets  = ["10.2.201.0/24", "10.2.202.0/24"]

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  main = {
    instance_type = "t3.medium"
    min_size      = 1
    max_size      = 3
    desired_size  = 2
    capacity_type = "ON_DEMAND"
    disk_size     = 20
  }
  blockchain = {
    instance_type = "t3.large"
    min_size      = 1
    max_size      = 2
    desired_size  = 1
    capacity_type = "ON_DEMAND"
    disk_size     = 50
  }
  monitoring = {
    instance_type = "t3.medium"
    min_size      = 1
    max_size      = 2
    desired_size  = 1
    capacity_type = "ON_DEMAND"
    disk_size     = 20
  }
}

# Feature Flags
enable_monitoring          = true
enable_vault              = true
enable_backup             = false
enable_cost_optimization  = false
enable_security_compliance = false

# Domain Configuration
domain_name = "dev.kaldrix.com"

# Backup Configuration
backup_retention_days = 7

# Vault Configuration
vault_address = "https://vault.dev.kaldrix.com:8200"
# vault_token = ""  # Set via environment variable or secure storage

# Additional Tags
tags = {
  Environment = "development"
  CostCenter  = "engineering"
  Owner       = "kaldrix-dev"
  Project     = "kaldrix-blockchain"
  ManagedBy   = "terraform"
}