# KALDRIX Multi-Region Infrastructure Variables

variable "project_name" {
  description = "Name of the KALDRIX project"
  type        = string
  default     = "kaldrix"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development"
  }
}

variable "regions" {
  description = "List of AWS regions to deploy KALDRIX"
  type        = list(string)
  default     = ["us-east-1", "us-west-2", "eu-west-1"]
}

variable "primary_region" {
  description = "Primary AWS region for the deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_regions" {
  description = "Secondary AWS regions for high availability"
  type        = list(string)
  default     = ["us-west-2", "eu-west-1"]
}

variable "domain_name" {
  description = "Domain name for the KALDRIX application"
  type        = string
}

variable "regional_configs" {
  description = "Regional configuration overrides"
  type = map(object({
    vpc_cidr          = string
    availability_zones = list(string)
    private_subnets   = list(string)
    public_subnets    = list(string)
    database_subnets  = list(string)
  }))
  default = {}
}

variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.29"
}

variable "eks_node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_type = string
    min_size      = number
    max_size      = number
    desired_size  = number
    capacity_type = string
  }))
  default = {
    main = {
      instance_type = "m6i.xlarge"
      min_size      = 3
      max_size      = 10
      desired_size  = 5
      capacity_type = "ON_DEMAND"
    },
    blockchain = {
      instance_type = "c6i.xlarge"
      min_size      = 2
      max_size      = 5
      desired_size  = 3
      capacity_type = "ON_DEMAND"
    },
    monitoring = {
      instance_type = "r6i.xlarge"
      min_size      = 1
      max_size      = 3
      desired_size  = 2
      capacity_type = "ON_DEMAND"
    }
  }
}

variable "database_config" {
  description = "Database configuration for multi-region deployment"
  type = object({
    engine               = string
    engine_version       = string
    primary_instance_class = string
    secondary_instance_class = string
    allocated_storage    = number
    storage_type         = string
    multi_az             = bool
    backup_retention_period = number
    maintenance_window   = string
    backup_window        = string
  })
  default = {
    engine               = "postgres"
    engine_version       = "15.4"
    primary_instance_class = "db.m6g.xlarge"
    secondary_instance_class = "db.m6g.large"
    allocated_storage    = 100
    storage_type         = "gp3"
    multi_az             = true
    backup_retention_period = 7
    maintenance_window   = "sun:04:00-sun:05:00"
    backup_window        = "03:00-04:00"
  }
}

variable "redis_config" {
  description = "Redis configuration for multi-region deployment"
  type = object({
    engine_version       = string
    node_type            = string
    primary_node_type    = string
    secondary_node_type  = string
    num_cache_nodes      = number
    parameter_group_name = string
    automatic_failover_enabled = bool
    multi_az_enabled     = bool
    snapshot_retention_limit = number
  })
  default = {
    engine_version       = "7.0"
    node_type            = "cache.m6g.xlarge"
    primary_node_type    = "cache.m6g.xlarge"
    secondary_node_type  = "cache.m6g.large"
    num_cache_nodes      = 3
    parameter_group_name = "default.redis7"
    automatic_failover_enabled = true
    multi_az_enabled     = true
    snapshot_retention_limit = 7
  }
}

variable "enable_vault" {
  description = "Enable HashiCorp Vault integration"
  type        = bool
  default     = true
}

variable "vault_address" {
  description = "Vault server address"
  type        = string
  default     = "https://vault.kaldrix.io"
}

variable "enable_monitoring" {
  description = "Enable monitoring and observability"
  type        = bool
  default     = true
}

variable "monitoring_config" {
  description = "Monitoring configuration"
  type = object({
    enable_cloudwatch   = bool
    enable_prometheus   = bool
    enable_grafana      = bool
    retention_days     = number
    log_level          = string
  })
  default = {
    enable_cloudwatch   = true
    enable_prometheus   = true
    enable_grafana      = true
    retention_days     = 30
    log_level          = "INFO"
  }
}

variable "alerting_config" {
  description = "Alerting configuration"
  type = object({
    enable_email_alerts = bool
    enable_sms_alerts   = bool
    enable_slack_alerts = bool
    alert_thresholds    = map(number)
  })
  default = {
    enable_email_alerts = true
    enable_sms_alerts   = false
    enable_slack_alerts = true
    alert_thresholds = {
      cpu_utilization    = 80
      memory_utilization = 85
      disk_utilization  = 90
      error_rate        = 5
      response_time     = 2000
    }
  }
}

variable "enable_cdn" {
  description = "Enable CloudFront CDN"
  type        = bool
  default     = true
}

variable "enable_accelerator" {
  description = "Enable AWS Global Accelerator"
  type        = bool
  default     = true
}

variable "enable_replication" {
  description = "Enable cross-region database replication"
  type        = bool
  default     = true
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

variable "enable_security_compliance" {
  description = "Enable security and compliance features"
  type        = bool
  default     = true
}

variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "enable_failover" {
  description = "Enable automated failover"
  type        = bool
  default     = true
}

variable "failover_config" {
  description = "Failover configuration"
  type = object({
    health_check_interval = number
    health_check_timeout  = number
    unhealthy_threshold   = number
    healthy_threshold     = number
    failover_timeout      = number
  })
  default = {
    health_check_interval = 30
    health_check_timeout  = 5
    unhealthy_threshold   = 3
    healthy_threshold     = 2
    failover_timeout      = 300
  }
}

variable "backup_config" {
  description = "Backup configuration"
  type = object({
    backup_frequency     = string
    backup_retention     = number
    cross_region_backup = bool
    backup_regions       = list(string)
  })
  default = {
    backup_frequency     = "0 2 * * *"
    backup_retention     = 30
    cross_region_backup = true
    backup_regions       = ["us-west-2", "eu-west-1"]
  }
}

variable "health_check_config" {
  description = "Health check configuration"
  type = object({
    path                = string
    port               = number
    protocol           = string
    interval           = number
    timeout            = number
    healthy_threshold  = number
    unhealthy_threshold = number
    matcher            = string
  })
  default = {
    path                = "/health"
    port               = 8080
    protocol           = "HTTP"
    interval           = 30
    timeout            = 5
    healthy_threshold  = 2
    unhealthy_threshold = 3
    matcher            = "200"
  }
}

variable "routing_config" {
  description = "Traffic routing configuration"
  type = object({
    routing_policy      = string
    latency_routing     = bool
    weighted_routing    = bool
    failover_routing    = bool
    weights             = map(number)
    latency_regions     = map(string)
  })
  default = {
    routing_policy      = "latency"
    latency_routing     = true
    weighted_routing    = false
    failover_routing    = true
    weights             = {}
    latency_regions     = {}
  }
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    "Project"     = "KALDRIX"
    "ManagedBy"   = "Terraform"
    "Environment" = "multi-region"
  }
}