# KALDRIX Disaster Recovery Module Variables

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

variable "domain_name" {
  description = "Domain name for the KALDRIX application"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
}

variable "hosted_zone_arn" {
  description = "Route53 hosted zone ARN"
  type        = string
}

variable "eks_cluster_arns" {
  description = "List of EKS cluster ARNs"
  type        = list(string)
}

variable "rds_instance_arns" {
  description = "List of RDS instance ARNs"
  type        = list(string)
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

variable "primary_target_group_arn_suffix" {
  description = "Primary target group ARN suffix"
  type        = string
}

variable "secondary_alb_dns_names" {
  description = "Map of secondary region to ALB DNS name"
  type        = map(string)
}

variable "secondary_alb_zone_ids" {
  description = "Map of secondary region to ALB zone ID"
  type        = map(string)
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for general alerts"
  type        = string
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}