output "redis_cluster_id" {
  description = "Redis cluster ID"
  value       = aws_elasticache_replication_group.this.id
}

output "redis_cluster_arn" {
  description = "Redis cluster ARN"
  value       = aws_elasticache_replication_group.this.arn
}

output "redis_cluster_endpoint" {
  description = "Redis cluster primary endpoint"
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "redis_cluster_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_replication_group.this.port
}

output "redis_reader_endpoint" {
  description = "Redis cluster reader endpoint"
  value       = aws_elasticache_replication_group.this.reader_endpoint_address
}

output "redis_configuration_endpoint" {
  description = "Redis cluster configuration endpoint"
  value       = aws_elasticache_replication_group.this.configuration_endpoint_address
}

output "redis_password" {
  description = "Redis password"
  value       = var.redis_password
  sensitive   = true
}

output "redis_user_id" {
  description = "Redis user ID"
  value       = aws_elasticache_user.this.user_id
}

output "redis_user_name" {
  description = "Redis user name"
  value       = aws_elasticache_user.this.user_name
}

output "redis_user_group_id" {
  description = "Redis user group ID"
  value       = aws_elasticache_user_group.this.user_group_id
}

output "redis_subnet_group_name" {
  description = "Redis subnet group name"
  value       = aws_elasticache_subnet_group.this.name
}

output "redis_parameter_group_name" {
  description = "Redis parameter group name"
  value       = aws_elasticache_parameter_group.this.name
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.redis.arn
}

output "secrets_manager_secret_name" {
  description = "Secrets Manager secret name"
  value       = aws_secretsmanager_secret.redis.name
}

output "ssm_parameter_arns" {
  description = "SSM parameter ARNs"
  value = {
    endpoint       = aws_ssm_parameter.redis_endpoint.arn
    port           = aws_ssm_parameter.redis_port.arn
    reader_endpoint = aws_ssm_parameter.redis_reader_endpoint.arn
  }
}

output "cache_nodes" {
  description = "Redis cache nodes"
  value       = aws_elasticache_replication_group.this.member_clusters
}

output "num_cache_clusters" {
  description = "Number of cache clusters"
  value       = aws_elasticache_replication_group.this.num_cache_clusters
}

output "cluster_mode" {
  description = "Redis cluster mode"
  value = aws_elasticache_replication_group.this.cluster_mode
}