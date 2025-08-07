variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnets" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "internal" {
  description = "Whether the load balancer is internal"
  type        = bool
  default     = false
}

variable "load_balancer_type" {
  description = "Type of load balancer"
  type        = string
  default     = "application"
}

variable "security_groups" {
  description = "List of security group IDs"
  type        = list(string)
  default     = []
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "idle_timeout" {
  description = "Idle timeout in seconds"
  type        = number
  default     = 60
}

variable "access_logs_enabled" {
  description = "Enable access logs"
  type        = bool
  default     = true
}

variable "access_logs_bucket" {
  description = "S3 bucket for access logs"
  type        = string
  default     = ""
}

variable "access_logs_prefix" {
  description = "Prefix for access logs"
  type        = string
  default     = ""
}

variable "http_port" {
  description = "HTTP port"
  type        = number
  default     = 80
}

variable "https_port" {
  description = "HTTPS port"
  type        = number
  default     = 443
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = ""
}

variable "target_groups" {
  description = "Map of target group configurations"
  type        = map(any)
  default     = {}
}

variable "listeners" {
  description = "Map of listener configurations"
  type        = map(any)
  default     = {}
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}