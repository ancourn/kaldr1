output "replication_group_id" {
  description = "The ID of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.this.id
}

output "replication_group_arn" {
  description = "The ARN of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.this.arn
}

output "primary_endpoint_address" {
  description = "The primary endpoint address of the replication group"
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "The reader endpoint address of the replication group"
  value       = aws_elasticache_replication_group.this.reader_endpoint_address
}

output "configuration_endpoint_address" {
  description = "The configuration endpoint address of the replication group"
  value       = aws_elasticache_replication_group.this.configuration_endpoint_address
}

output "port" {
  description = "The port number of the replication group"
  value       = aws_elasticache_replication_group.this.port
}

output "node_type" {
  description = "The node type of the replication group"
  value       = aws_elasticache_replication_group.this.node_type
}

output "engine" {
  description = "The engine of the replication group"
  value       = aws_elasticache_replication_group.this.engine
}

output "engine_version" {
  description = "The engine version of the replication group"
  value       = aws_elasticache_replication_group.this.engine_version
}

output "number_cache_clusters" {
  description = "The number of cache clusters in the replication group"
  value       = aws_elasticache_replication_group.this.number_cache_clusters
}

output "subnet_group_name" {
  description = "The name of the subnet group"
  value       = aws_elasticache_subnet_group.this.name
}

output "security_group_id" {
  description = "The ID of the security group"
  value       = length(var.security_group_ids) > 0 ? var.security_group_ids[0] : aws_security_group.this[0].id
}

output "at_rest_encryption_enabled" {
  description = "Whether encryption at rest is enabled"
  value       = aws_elasticache_replication_group.this.at_rest_encryption_enabled
}

output "transit_encryption_enabled" {
  description = "Whether encryption in transit is enabled"
  value       = aws_elasticache_replication_group.this.transit_encryption_enabled
}

output "automatic_failover_enabled" {
  description = "Whether automatic failover is enabled"
  value       = aws_elasticache_replication_group.this.automatic_failover_enabled
}

output "multi_az_enabled" {
  description = "Whether multi-AZ is enabled"
  value       = aws_elasticache_replication_group.this.multi_az_enabled
}