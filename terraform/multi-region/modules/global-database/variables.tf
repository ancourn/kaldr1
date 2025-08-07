# KALDRIX Global Database Module Variables

variable "project_name" {
  description = "Name of the KALDRIX project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "regions" {
  description = "List of AWS regions"
  type        = list(string)
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "secondary_regions" {
  description = "Secondary AWS regions"
  type        = list(string)
}

variable "database_config" {
  description = "Database configuration"
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
}

variable "redis_config" {
  description = "Redis configuration"
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
}

variable "enable_replication" {
  description = "Enable cross-region database replication"
  type        = bool
  default     = true
}

variable "enable_global_datastore" {
  description = "Enable Redis Global Datastore"
  type        = bool
  default     = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_auth_token" {
  description = "Redis auth token"
  type        = string
  sensitive   = true
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Primary region network configuration
variable "primary_vpc_id" {
  description = "Primary VPC ID"
  type        = string
}

variable "primary_db_subnets" {
  description = "Primary database subnets"
  type        = list(string)
}

variable "primary_redis_subnets" {
  description = "Primary Redis subnets"
  type        = list(string)
}

variable "primary_app_security_group_id" {
  description = "Primary application security group ID"
  type        = string
}

variable "primary_security_group_id" {
  description = "Primary security group ID"
  type        = string
}

variable "primary_db_subnet_group_name" {
  description = "Primary database subnet group name"
  type        = string
}

variable "primary_redis_subnet_group_name" {
  description = "Primary Redis subnet group name"
  type        = string
}

variable "primary_redis_security_group_id" {
  description = "Primary Redis security group ID"
  type        = string
}

# Secondary regions network configuration
variable "secondary_security_group_ids" {
  description = "Secondary security group IDs"
  type        = map(string)
}

variable "secondary_db_subnet_group_names" {
  description = "Secondary database subnet group names"
  type        = map(string)
}

variable "secondary_redis_subnet_group_names" {
  description = "Secondary Redis subnet group names"
  type        = map(string)
}

variable "secondary_redis_security_group_ids" {
  description = "Secondary Redis security group IDs"
  type        = map(string)
}