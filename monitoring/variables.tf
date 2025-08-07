variable "region" {
  description = "AWS region for monitoring resources"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
  default     = "prod"
}

variable "vpc_id" {
  description = "VPC ID for monitoring resources"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnets" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "kubernetes_cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
}

variable "alert_email" {
  description = "Email address for critical alerts"
  type        = string
}

variable "pagerduty_integration_key" {
  description = "PagerDuty integration key for critical alerts"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for team notifications"
  type        = string
  default     = ""
}

variable "enable_anomaly_detection" {
  description = "Enable ML-based anomaly detection"
  type        = bool
  default     = true
}

variable "enable_compliance_monitoring" {
  description = "Enable compliance monitoring features"
  type        = bool
  default     = true
}

variable "monitoring_retention_days" {
  description = "Number of days to retain monitoring data"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}