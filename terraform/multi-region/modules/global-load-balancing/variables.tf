# KALDRIX Global Load Balancing Module Variables

variable "project_name" {
  description = "Name of the KALDRIX project"
  type        = string
}

variable "environment" {
  description = "Environment name"
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

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
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

variable "alb_arn_suffixes" {
  description = "Map of region to ALB ARN suffix"
  type        = map(string)
}

variable "health_check_ids" {
  description = "Map of region to health check ID"
  type        = map(string)
}

variable "primary_alb_arn" {
  description = "Primary ALB ARN"
  type        = string
}

variable "primary_alb_dns_name" {
  description = "Primary ALB DNS name"
  type        = string
}

variable "primary_alb_zone_id" {
  description = "Primary ALB zone ID"
  type        = string
}

variable "primary_alb_arn_suffix" {
  description = "Primary ALB ARN suffix"
  type        = string
}

variable "primary_vpc_id" {
  description = "Primary VPC ID"
  type        = string
}

variable "primary_public_subnets" {
  description = "Primary public subnets"
  type        = list(string)
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  type        = string
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
  default     = {}
}