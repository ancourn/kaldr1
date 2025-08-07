# KALDRIX Global Monitoring Module Variables

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

variable "primary_alb_arn_suffix" {
  description = "Primary ALB ARN suffix"
  type        = string
}

variable "secondary_alb_arn_suffixes" {
  description = "Map of secondary region to ALB ARN suffix"
  type        = map(string)
}

variable "primary_db_instance_id" {
  description = "Primary database instance ID"
  type        = string
}

variable "secondary_db_instance_ids" {
  description = "Map of secondary region to database instance ID"
  type        = map(string)
}

variable "primary_redis_cluster_id" {
  description = "Primary Redis cluster ID"
  type        = string
}

variable "secondary_redis_cluster_ids" {
  description = "Map of secondary region to Redis cluster ID"
  type        = map(string)
}

variable "primary_eks_cluster_name" {
  description = "Primary EKS cluster name"
  type        = string
}

variable "artifact_bucket" {
  description = "S3 bucket for artifacts"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}