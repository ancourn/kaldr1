variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "subdomains" {
  description = "Map of subdomain configurations"
  type        = map(any)
  default     = {}
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
}

variable "alb_zone_id" {
  description = "ALB zone ID"
  type        = string
}

variable "create_zone" {
  description = "Create Route53 zone"
  type        = bool
  default     = true
}

variable "zone_id" {
  description = "Existing Route53 zone ID"
  type        = string
  default     = ""
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}