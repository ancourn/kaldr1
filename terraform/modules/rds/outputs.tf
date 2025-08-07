output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.this.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.this.arn
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.this.endpoint
}

output "db_instance_address" {
  description = "RDS instance address"
  value       = aws_db_instance.this.address
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.this.port
}

output "db_instance_name" {
  description = "RDS instance name"
  value       = aws_db_instance.this.db_name
}

output "db_instance_username" {
  description = "RDS instance username"
  value       = aws_db_instance.this.username
}

output "db_password" {
  description = "RDS instance password"
  value       = var.db_password
  sensitive   = true
}

output "db_subnet_group_name" {
  description = "RDS subnet group name"
  value       = aws_db_subnet_group.this.name
}

output "db_parameter_group_name" {
  description = "RDS parameter group name"
  value       = aws_db_parameter_group.this.name
}

output "db_proxy_id" {
  description = "RDS proxy ID"
  value       = var.environment == "production" ? aws_db_proxy.this[0].id : null
}

output "db_proxy_endpoint" {
  description = "RDS proxy endpoint"
  value       = var.environment == "production" ? aws_db_proxy.this[0].endpoint : null
}

output "db_proxy_arn" {
  description = "RDS proxy ARN"
  value       = var.environment == "production" ? aws_db_proxy.this[0].arn : null
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db.arn
}

output "secrets_manager_secret_name" {
  description = "Secrets Manager secret name"
  value       = aws_secretsmanager_secret.db.name
}

output "ssm_parameter_arns" {
  description = "SSM parameter ARNs"
  value = {
    endpoint = aws_ssm_parameter.db_endpoint.arn
    port     = aws_ssm_parameter.db_port.arn
    name     = aws_ssm_parameter.db_name.arn
  }
}

output "iam_role_arns" {
  description = "IAM role ARNs"
  value = {
    monitoring = var.environment == "production" ? aws_iam_role.rds_monitoring[0].arn : null
    s3_import  = aws_iam_role.rds_s3_import.arn
    proxy      = var.environment == "production" ? aws_iam_role.rds_proxy[0].arn : null
  }
}

output "iam_policy_arns" {
  description = "IAM policy ARNs"
  value = {
    s3_import = var.environment == "production" ? aws_iam_policy.rds_s3_import[0].arn : null
    proxy     = var.environment == "production" ? aws_iam_policy.rds_proxy[0].arn : null
  }
}