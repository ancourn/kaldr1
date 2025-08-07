# KALDRIX Blockchain - Terraform Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "kaldr1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_regions" {
  description = "Secondary AWS regions"
  type        = list(string)
  default     = ["us-west-2", "eu-west-1"]
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "kaldr1.com"
}

variable "vault_address" {
  description = "Vault server address"
  type        = string
  default     = "https://vault.kaldr1.com"
}

variable "vault_token" {
  description = "Vault authentication token"
  type        = string
  sensitive   = true
  default     = ""
}

# VPC Configuration
variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary_west" {
  description = "CIDR block for secondary west VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "vpc_cidr_secondary_eu" {
  description = "CIDR block for secondary EU VPC"
  type        = string
  default     = "10.2.0.0/16"
}

variable "availability_zones_primary" {
  description = "Availability zones for primary region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "availability_zones_secondary_west" {
  description = "Availability zones for secondary west region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "availability_zones_secondary_eu" {
  description = "Availability zones for secondary EU region"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
}

variable "private_subnets_primary" {
  description = "Private subnets for primary region"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets_primary" {
  description = "Public subnets for primary region"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnets_primary" {
  description = "Database subnets for primary region"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "private_subnets_secondary_west" {
  description = "Private subnets for secondary west region"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
}

variable "public_subnets_secondary_west" {
  description = "Public subnets for secondary west region"
  type        = list(string)
  default     = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
}

variable "database_subnets_secondary_west" {
  description = "Database subnets for secondary west region"
  type        = list(string)
  default     = ["10.1.201.0/24", "10.1.202.0/24", "10.1.203.0/24"]
}

variable "private_subnets_secondary_eu" {
  description = "Private subnets for secondary EU region"
  type        = list(string)
  default     = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
}

variable "public_subnets_secondary_eu" {
  description = "Public subnets for secondary EU region"
  type        = list(string)
  default     = ["10.2.101.0/24", "10.2.102.0/24", "10.2.103.0/24"]
}

variable "database_subnets_secondary_eu" {
  description = "Database subnets for secondary EU region"
  type        = list(string)
  default     = ["10.2.201.0/24", "10.2.202.0/24", "10.2.203.0/24"]
}

# Kubernetes Configuration
variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_group_desired_size" {
  description = "Desired size of node group"
  type        = number
  default     = 3
}

variable "node_group_max_size" {
  description = "Maximum size of node group"
  type        = number
  default     = 10
}

variable "node_group_min_size" {
  description = "Minimum size of node group"
  type        = number
  default     = 1
}

variable "node_instance_types" {
  description = "Instance types for worker nodes"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "node_disk_size" {
  description = "Disk size for worker nodes in GB"
  type        = number
  default     = 100
}

# Database Configuration
variable "database_engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "database_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "database_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.m6g.large"
}

variable "database_allocated_storage" {
  description = "Database allocated storage in GB"
  type        = number
  default     = 100
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "kaldr1"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "kaldr1_admin"
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "database_backup_retention" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

# Redis Configuration
variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "7.0"
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.m6g.large"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 2
}

variable "redis_auth_token" {
  description = "Redis authentication token"
  type        = string
  sensitive   = true
  default     = ""
}

# SNS Configuration
variable "sns_subscriptions" {
  description = "SNS subscriptions for notifications"
  type        = list(map(string))
  default     = [
    {
      protocol = "email"
      endpoint = "alerts@kaldr1.com"
    }
  ]
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable logging"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable backup"
  type        = bool
  default     = true
}

# Cost Management
variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "cost_budget_threshold" {
  description = "Cost budget threshold in USD"
  type        = number
  default     = 1000
}

# Security Configuration
variable "enable_security_monitoring" {
  description = "Enable security monitoring"
  type        = bool
  default     = true
}

variable "enable_encryption" {
  description = "Enable encryption"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable WAF"
  type        = bool
  default     = true
}

# Disaster Recovery Configuration
variable "enable_disaster_recovery" {
  description = "Enable disaster recovery"
  type        = bool
  default     = true
}

variable "rto_minutes" {
  description = "Recovery Time Objective in minutes"
  type        = number
  default     = 15
}

variable "rpo_hours" {
  description = "Recovery Point Objective in hours"
  type        = number
  default     = 1
}

# Auto Scaling Configuration
variable "enable_auto_scaling" {
  description = "Enable auto scaling"
  type        = bool
  default     = true
}

variable "scaling_cooldown" {
  description = "Auto scaling cooldown period in seconds"
  type        = number
  default     = 300
}

variable "scaling_threshold" {
  description = "Auto scaling threshold percentage"
  type        = number
  default     = 70
}