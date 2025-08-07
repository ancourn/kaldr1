variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "cloudwatch_log_groups" {
  description = "CloudWatch log groups to monitor"
  type        = list(string)
  default     = []
}

variable "metrics_namespace" {
  description = "CloudWatch metrics namespace"
  type        = string
  default     = "KALDRIX"
}

variable "anomaly_detection_threshold" {
  description = "Anomaly detection threshold"
  type        = number
  default     = 2.0
}

variable "enable_lookout_metrics" {
  description = "Enable Lookout for Metrics"
  type        = bool
  default     = true
}

variable "enable_cloudwatch_anomaly" {
  description = "Enable CloudWatch anomaly detection"
  type        = bool
  default     = true
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for anomaly alerts"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}