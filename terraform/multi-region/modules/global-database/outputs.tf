# KALDRIX Global Database Module Outputs

output "primary_endpoint" {
  description = "Primary database endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "primary_port" {
  description = "Primary database port"
  value       = aws_db_instance.primary.port
}

output "primary_arn" {
  description = "Primary database ARN"
  value       = aws_db_instance.primary.arn
}

output "secondary_endpoints" {
  description = "Secondary database endpoints"
  value = {
    for region, instance in aws_db_instance.secondary : region => {
      endpoint = instance.endpoint
      port     = instance.port
      arn      = instance.arn
    }
  }
}

output "redis_cluster_endpoint" {
  description = "Primary Redis cluster endpoint"
  value       = aws_elasticache_replication_group.primary.primary_endpoint_address
}

output "redis_cluster_port" {
  description = "Primary Redis cluster port"
  value       = aws_elasticache_replication_group.primary.port
}

output "redis_cluster_arn" {
  description = "Primary Redis cluster ARN"
  value       = aws_elasticache_replication_group.primary.arn
}

output "secondary_redis_endpoints" {
  description = "Secondary Redis cluster endpoints"
  value = {
    for region, cluster in aws_elasticache_replication_group.secondary : region => {
      endpoint = cluster.primary_endpoint_address
      port     = cluster.port
      arn      = cluster.arn
    }
  }
}

output "global_datastore_arn" {
  description = "Global Redis datastore ARN"
  value       = var.enable_global_datastore ? aws_elasticache_global_replication_group.main[0].arn : null
}

output "global_datastore_id" {
  description = "Global Redis datastore ID"
  value       = var.enable_global_datastore ? aws_elasticache_global_replication_group.main[0].global_replication_group_id : null
}

output "db_backup_bucket" {
  description = "Database backup S3 bucket"
  value       = aws_s3_bucket.db_backups.id
}

output "db_backup_role_arn" {
  description = "Database backup IAM role ARN"
  value       = aws_iam_role.db_backup_role.arn
}

output "primary_parameter_group" {
  description = "Primary database parameter group"
  value       = aws_db_parameter_group.primary.name
}

output "primary_redis_parameter_group" {
  description = "Primary Redis parameter group"
  value       = aws_elasticache_parameter_group.primary.name
}

output "primary_db_security_group" {
  description = "Primary database security group"
  value       = aws_security_group.primary_db.id
}

output "primary_redis_security_group" {
  description = "Primary Redis security group"
  value       = aws_security_group.primary_redis.id
}

output "database_alarms" {
  description = "Database CloudWatch alarms"
  value = {
    primary_cpu = aws_cloudwatch_metric_alarm.primary_db_cpu.arn
  }
}

output "redis_alarms" {
  description = "Redis CloudWatch alarms"
  value = {
    primary_cpu = aws_cloudwatch_metric_alarm.primary_redis_cpu.arn
  }
}