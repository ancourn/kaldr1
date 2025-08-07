output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of database subnet IDs"
  value       = module.vpc.database_subnets
}

output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "EKS cluster certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
}

output "eks_node_group_arns" {
  description = "EKS node group ARNs"
  value       = module.eks.node_group_arns
}

output "eks_node_group_role_arns" {
  description = "EKS node group role ARNs"
  value       = module.eks.node_group_role_arns
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = module.rds.db_instance_port
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.rds.db_instance_id
}

output "redis_cluster_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.redis_cluster_endpoint
}

output "redis_cluster_port" {
  description = "Redis cluster port"
  value       = module.redis.redis_cluster_port
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.s3_bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.s3_bucket_arn
}

output "iam_role_arn" {
  description = "IAM role ARN for EKS"
  value       = module.iam.eks_role_arn
}

output "kubernetes_config_map_aws_auth" {
  description = "Kubernetes config map for AWS authentication"
  value       = module.iam.kubernetes_config_map_aws_auth
}

output "vault_address" {
  description = "Vault server address"
  value       = var.vault_address
}

output "monitoring_workspace_id" {
  description = "CloudWatch workspace ID"
  value       = module.monitoring.cloudwatch_workspace_id
}

output "prometheus_workspace_id" {
  description = "Prometheus workspace ID"
  value       = module.monitoring.prometheus_workspace_id
}

output "grafana_workspace_id" {
  description = "Grafana workspace ID"
  value       = module.monitoring.grafana_workspace_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.networking.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = module.networking.alb_zone_id
}

output "security_group_id" {
  description = "Main security group ID"
  value       = module.security.main_security_group_id
}

output "nat_gateway_ids" {
  description = "NAT gateway IDs"
  value       = module.vpc.nat_gateway_ids
}

output "internet_gateway_id" {
  description = "Internet gateway ID"
  value       = module.vpc.internet_gateway_id
}

output "route_table_ids" {
  description = "Route table IDs"
  value       = module.vpc.route_table_ids
}

output "eip_allocation_ids" {
  description = "EIP allocation IDs"
  value       = module.vpc.eip_allocation_ids
}

output "cost_explorer_arn" {
  description = "Cost Explorer ARN"
  value       = module.cost_optimization.cost_explorer_arn
}

output "backup_vault_arn" {
  description = "Backup vault ARN"
  value       = module.storage.backup_vault_arn
}

output "backup_plan_arn" {
  description = "Backup plan ARN"
  value       = module.storage.backup_plan_arn
}

output "compliance_standards_arn" {
  description = "Compliance standards ARN"
  value       = module.security.compliance_standards_arn
}

output "security_hub_arn" {
  description = "Security Hub ARN"
  value       = module.security.security_hub_arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = module.security.guardduty_detector_id
}

output "config_rule_arns" {
  description = "Config rule ARNs"
  value       = module.security.config_rule_arns
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = module.security.cloudtrail_arn
}

output "cloudwatch_log_group_arn" {
  description = "CloudWatch log group ARN"
  value       = module.monitoring.cloudwatch_log_group_arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = module.monitoring.sns_topic_arn
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value       = module.storage.lambda_function_arns
}

output "ecr_repository_arns" {
  description = "ECR repository ARNs"
  value       = module.storage.ecr_repository_arns
}

output "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  value       = module.eks.eks_oidc_provider_arn
}

output "eks_service_account_arns" {
  description = "EKS service account ARNs"
  value       = module.iam.eks_service_account_arns
}

output "eks_addon_arns" {
  description = "EKS add-on ARNs"
  value       = module.eks.eks_addon_arns
}

output "kms_key_arns" {
  description = "KMS key ARNs"
  value       = module.security.kms_key_arns
}

output "secrets_manager_arns" {
  description = "Secrets Manager ARNs"
  value       = module.security.secrets_manager_arns
}

output "parameter_store_arns" {
  description = "Parameter Store ARNs"
  value       = module.security.parameter_store_arns
}