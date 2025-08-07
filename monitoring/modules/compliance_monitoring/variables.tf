variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "kubernetes_cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
}

variable "audit_bucket_name" {
  description = "S3 bucket name for audit logs"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for compliance alerts"
  type        = string
}

variable "compliance_standards" {
  description = "List of compliance standards to monitor"
  type        = list(string)
  default     = ["SOC2", "ISO27001", "GDPR", "HIPAA"]
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub integration"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable Amazon GuardDuty integration"
  type        = bool
  default     = true
}

variable "enable_macie" {
  description = "Enable Amazon Macie integration"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable AWS CloudTrail integration"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}