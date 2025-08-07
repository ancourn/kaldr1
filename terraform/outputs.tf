# KALDRIX Blockchain - Terraform Outputs

# EKS Cluster Outputs
output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_certificate_authority_data" {
  description = "EKS cluster certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
}

output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

# VPC Outputs
output "vpc_primary_id" {
  description = "Primary VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "vpc_secondary_west_id" {
  description = "Secondary west VPC ID"
  value       = module.vpc_secondary_west.vpc_id
}

output "vpc_secondary_eu_id" {
  description = "Secondary EU VPC ID"
  value       = module.vpc_secondary_eu.vpc_id
}

output "vpc_primary_cidr" {
  description = "Primary VPC CIDR"
  value       = module.vpc_primary.vpc_cidr
}

output "vpc_secondary_west_cidr" {
  description = "Secondary west VPC CIDR"
  value       = module.vpc_secondary_west.vpc_cidr
}

output "vpc_secondary_eu_cidr" {
  description = "Secondary EU VPC CIDR"
  value       = module.vpc_secondary_eu.vpc_cidr
}

# Subnet Outputs
output "private_subnets_primary" {
  description = "Primary private subnets"
  value       = module.vpc_primary.private_subnets
}

output "public_subnets_primary" {
  description = "Primary public subnets"
  value       = module.vpc_primary.public_subnets
}

output "database_subnets_primary" {
  description = "Primary database subnets"
  value       = module.vpc_primary.database_subnets
}

output "private_subnets_secondary_west" {
  description = "Secondary west private subnets"
  value       = module.vpc_secondary_west.private_subnets
}

output "public_subnets_secondary_west" {
  description = "Secondary west public subnets"
  value       = module.vpc_secondary_west.public_subnets
}

output "database_subnets_secondary_west" {
  description = "Secondary west database subnets"
  value       = module.vpc_secondary_west.database_subnets
}

output "private_subnets_secondary_eu" {
  description = "Secondary EU private subnets"
  value       = module.vpc_secondary_eu.private_subnets
}

output "public_subnets_secondary_eu" {
  description = "Secondary EU public subnets"
  value       = module.vpc_secondary_eu.public_subnets
}

output "database_subnets_secondary_eu" {
  description = "Secondary EU database subnets"
  value       = module.vpc_secondary_eu.database_subnets
}

# Load Balancer Outputs
output "primary_alb_dns_name" {
  description = "Primary ALB DNS name"
  value       = module.alb_primary.alb_dns_name
}

output "primary_alb_zone_id" {
  description = "Primary ALB zone ID"
  value       = module.alb_primary.alb_zone_id
}

output "primary_alb_arn" {
  description = "Primary ALB ARN"
  value       = module.alb_primary.alb_arn
}

output "secondary_west_alb_dns_name" {
  description = "Secondary west ALB DNS name"
  value       = module.alb_secondary_west.alb_dns_name
}

output "secondary_west_alb_zone_id" {
  description = "Secondary west ALB zone ID"
  value       = module.alb_secondary_west.alb_zone_id
}

output "secondary_west_alb_arn" {
  description = "Secondary west ALB ARN"
  value       = module.alb_secondary_west.alb_arn
}

output "secondary_eu_alb_dns_name" {
  description = "Secondary EU ALB DNS name"
  value       = module.alb_secondary_eu.alb_dns_name
}

output "secondary_eu_alb_zone_id" {
  description = "Secondary EU ALB zone ID"
  value       = module.alb_secondary_eu.alb_zone_id
}

output "secondary_eu_alb_arn" {
  description = "Secondary EU ALB ARN"
  value       = module.alb_secondary_eu.alb_arn
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = module.route53.route53_zone_id
}

output "route53_primary_record" {
  description = "Route53 primary record"
  value       = module.route53.primary_record_fqdn
}

output "route53_secondary_west_record" {
  description = "Route53 secondary west record"
  value       = module.route53.secondary_west_record_fqdn
}

output "route53_secondary_eu_record" {
  description = "Route53 secondary EU record"
  value       = module.route53.secondary_eu_record_fqdn
}

# CloudFront Outputs
output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.cloudfront.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.cloudfront_distribution_id
}

output "cloudfront_arn" {
  description = "CloudFront ARN"
  value       = module.cloudfront.cloudfront_arn
}

# Database Outputs
output "database_endpoint" {
  description = "Primary database endpoint"
  value       = module.rds_primary.db_instance_endpoint
}

output "database_port" {
  description = "Primary database port"
  value       = module.rds_primary.db_instance_port
}

output "database_arn" {
  description = "Primary database ARN"
  value       = module.rds_primary.db_instance_arn
}

output "database_read_replica_west_endpoint" {
  description = "West read replica endpoint"
  value       = module.rds_read_replica_west.db_instance_endpoint
}

output "database_read_replica_eu_endpoint" {
  description = "EU read replica endpoint"
  value       = module.rds_read_replica_eu.db_instance_endpoint
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis_primary.redis_endpoint
}

output "redis_port" {
  description = "Redis port"
  value       = module.redis_primary.redis_port
}

output "redis_arn" {
  description = "Redis ARN"
  value       = module.redis_primary.redis_arn
}

# Security Outputs
output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = module.waf.waf_web_acl_arn
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = module.waf.waf_web_acl_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}

# Storage Outputs
output "s3_terraform_state_bucket" {
  description = "S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "s3_logs_bucket" {
  description = "S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

output "dynamodb_terraform_lock_table" {
  description = "DynamoDB table for Terraform lock"
  value       = aws_dynamodb_table.terraform_lock.name
}

# Monitoring Outputs
output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = module.sns_notifications.sns_topic_arn
}

output "cloudwatch_log_group_arn" {
  description = "CloudWatch log group ARN"
  value       = module.cloudwatch_alarms.cloudwatch_log_group_arn
}

# Security Group Outputs
output "primary_vpc_security_group_id" {
  description = "Primary VPC security group ID"
  value       = module.vpc_primary.vpc_security_group_id
}

output "secondary_west_vpc_security_group_id" {
  description = "Secondary west VPC security group ID"
  value       = module.vpc_secondary_west.vpc_security_group_id
}

output "secondary_eu_vpc_security_group_id" {
  description = "Secondary EU VPC security group ID"
  value       = module.vpc_secondary_eu.vpc_security_group_id
}

output "primary_alb_security_group_id" {
  description = "Primary ALB security group ID"
  value       = module.vpc_primary.alb_security_group_id
}

output "secondary_west_alb_security_group_id" {
  description = "Secondary west ALB security group ID"
  value       = module.vpc_secondary_west.alb_security_group_id
}

output "secondary_eu_alb_security_group_id" {
  description = "Secondary EU ALB security group ID"
  value       = module.vpc_secondary_eu.alb_security_group_id
}

output "primary_database_security_group_id" {
  description = "Primary database security group ID"
  value       = module.vpc_primary.database_security_group_id
}

output "secondary_west_database_security_group_id" {
  description = "Secondary west database security group ID"
  value       = module.vpc_secondary_west.database_security_group_id
}

output "secondary_eu_database_security_group_id" {
  description = "Secondary EU database security group ID"
  value       = module.vpc_secondary_eu.database_security_group_id
}

output "primary_redis_security_group_id" {
  description = "Primary Redis security group ID"
  value       = module.vpc_primary.redis_security_group_id
}

output "secondary_west_redis_security_group_id" {
  description = "Secondary west Redis security group ID"
  value       = module.vpc_secondary_west.redis_security_group_id
}

output "secondary_eu_redis_security_group_id" {
  description = "Secondary EU Redis security group ID"
  value       = module.vpc_secondary_eu.redis_security_group_id
}

# Network Outputs
output "primary_nat_gateway_ids" {
  description = "Primary NAT gateway IDs"
  value       = module.vpc_primary.nat_gateway_ids
}

output "secondary_west_nat_gateway_ids" {
  description = "Secondary west NAT gateway IDs"
  value       = module.vpc_secondary_west.nat_gateway_ids
}

output "secondary_eu_nat_gateway_ids" {
  description = "Secondary EU NAT gateway IDs"
  value       = module.vpc_secondary_eu.nat_gateway_ids
}

output "primary_internet_gateway_id" {
  description = "Primary internet gateway ID"
  value       = module.vpc_primary.internet_gateway_id
}

output "secondary_west_internet_gateway_id" {
  description = "Secondary west internet gateway ID"
  value       = module.vpc_secondary_west.internet_gateway_id
}

output "secondary_eu_internet_gateway_id" {
  description = "Secondary EU internet gateway ID"
  value       = module.vpc_secondary_eu.internet_gateway_id
}

# IAM Outputs
output "eks_cluster_iam_role_arn" {
  description = "EKS cluster IAM role ARN"
  value       = module.eks.eks_cluster_iam_role_arn
}

output "eks_node_group_iam_role_arn" {
  description = "EKS node group IAM role ARN"
  value       = module.eks.eks_node_group_iam_role_arn
}

# Cost Outputs
output "estimated_monthly_cost" {
  description = "Estimated monthly cost"
  value       = "$${var.cost_budget_threshold}"
}

# Summary Outputs
output "project_summary" {
  description = "Project summary"
  value = {
    project_name     = var.project_name
    environment      = var.environment
    primary_region   = var.primary_region
    secondary_regions = var.secondary_regions
    domain_name      = var.domain_name
    kubernetes_version = var.kubernetes_version
    database_engine  = var.database_engine
    redis_version    = var.redis_version
    enable_monitoring = var.enable_monitoring
    enable_security_monitoring = var.enable_security_monitoring
    enable_disaster_recovery = var.enable_disaster_recovery
    estimated_monthly_cost = "$${var.cost_budget_threshold}"
  }
}