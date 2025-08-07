variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development"
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "kaldrix"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnets" {
  description = "List of database subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

variable "eks_node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_type = string
    min_size      = number
    max_size      = number
    desired_size  = number
    capacity_type = string
    disk_size     = number
  }))
  default = {
    main = {
      instance_type = "m6i.xlarge"
      min_size      = 3
      max_size      = 10
      desired_size  = 5
      capacity_type = "ON_DEMAND"
      disk_size     = 100
    }
    blockchain = {
      instance_type = "c6i.2xlarge"
      min_size      = 3
      max_size      = 8
      desired_size  = 5
      capacity_type = "ON_DEMAND"
      disk_size     = 200
    }
    monitoring = {
      instance_type = "r6i.xlarge"
      min_size      = 2
      max_size      = 5
      desired_size  = 3
      capacity_type = "ON_DEMAND"
      disk_size     = 100
    }
  }
}

variable "enable_monitoring" {
  description = "Enable monitoring and logging"
  type        = bool
  default     = true
}

variable "enable_vault" {
  description = "Enable Vault integration"
  type        = bool
  default     = true
}

variable "vault_address" {
  description = "Vault server address"
  type        = string
  default     = "https://vault.kaldrix.com:8200"
}

variable "vault_token" {
  description = "Vault authentication token"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Main domain name for the application"
  type        = string
  default     = "kaldrix.com"
}

variable "enable_backup" {
  description = "Enable backup and disaster recovery"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "enable_security_compliance" {
  description = "Enable security and compliance features"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}