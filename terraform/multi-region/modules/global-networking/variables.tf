# KALDRIX Global Networking Module Variables

variable "project_name" {
  description = "Name of the KALDRIX project"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the KALDRIX application"
  type        = string
}

variable "regions" {
  description = "List of AWS regions"
  type        = list(string)
}

variable "alb_arns" {
  description = "Map of region to ALB ARN"
  type        = map(string)
}

variable "alb_dns_names" {
  description = "Map of region to ALB DNS name"
  type        = map(string)
}

variable "alb_zone_ids" {
  description = "Map of region to ALB zone ID"
  type        = map(string)
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}