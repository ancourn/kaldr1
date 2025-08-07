# KALDRIX Blockchain - Terraform Variables Configuration

# Project Configuration
project_name    = "kaldr1"
environment     = "production"
domain_name     = "kaldr1.com"

# AWS Regions
primary_region  = "us-east-1"
secondary_regions = ["us-west-2", "eu-west-1"]

# VPC Configuration
vpc_cidr_primary           = "10.0.0.0/16"
vpc_cidr_secondary_west    = "10.1.0.0/16"
vpc_cidr_secondary_eu      = "10.2.0.0/16"

# Availability Zones
availability_zones_primary       = ["us-east-1a", "us-east-1b", "us-east-1c"]
availability_zones_secondary_west = ["us-west-2a", "us-west-2b", "us-west-2c"]
availability_zones_secondary_eu   = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

# Subnet Configuration
private_subnets_primary       = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnets_primary        = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
database_subnets_primary     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

private_subnets_secondary_west = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
public_subnets_secondary_west  = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
database_subnets_secondary_west = ["10.1.201.0/24", "10.1.202.0/24", "10.1.203.0/24"]

private_subnets_secondary_eu   = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
public_subnets_secondary_eu    = ["10.2.101.0/24", "10.2.102.0/24", "10.2.103.0/24"]
database_subnets_secondary_eu  = ["10.2.201.0/24", "10.2.202.0/24", "10.2.203.0/24"]

# Kubernetes Configuration
kubernetes_version      = "1.28"
node_group_desired_size = 3
node_group_max_size     = 10
node_group_min_size     = 1
node_instance_types     = ["t3.medium", "t3.large"]
node_disk_size          = 100

# Database Configuration
database_engine          = "postgres"
database_engine_version  = "15.4"
database_instance_class  = "db.m6g.large"
database_allocated_storage = 100
database_name            = "kaldr1"
database_username        = "kaldr1_admin"
database_password        = "SecurePassword123!" # Change this in production
database_backup_retention = 7

# Redis Configuration
redis_version    = "7.0"
redis_node_type  = "cache.m6g.large"
redis_num_nodes  = 2
redis_auth_token = "SecureRedisToken123!" # Change this in production

# SNS Configuration
sns_subscriptions = [
  {
    protocol = "email"
    endpoint = "alerts@kaldr1.com"
  },
  {
    protocol = "sms"
    endpoint = "+1234567890"
  }
]

# Feature Flags
enable_monitoring         = true
enable_logging            = true
enable_backup             = true
enable_cost_optimization  = true
enable_security_monitoring = true
enable_encryption         = true
enable_waf                = true
enable_disaster_recovery  = true
enable_auto_scaling       = true

# Cost Management
cost_budget_threshold = 1000

# Disaster Recovery
rto_minutes = 15
rpo_hours   = 1

# Auto Scaling
scaling_cooldown   = 300
scaling_threshold  = 70

# Vault Configuration (to be configured during deployment)
vault_address = "https://vault.kaldr1.com"
vault_token   = "" # Will be provided during deployment