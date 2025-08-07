variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_id" {
  description = "ElastiCache cluster ID"
  type        = string
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

variable "engine" {
  description = "Cache engine"
  type        = string
  default     = "redis"
}

variable "engine_version" {
  description = "Cache engine version"
  type        = string
  default     = "7.0"
}

variable "port" {
  description = "Cache port"
  type        = number
  default     = 6379
}

variable "parameter_group_name" {
  description = "Parameter group name"
  type        = string
  default     = "default.redis7"
}

variable "subnet_group_name" {
  description = "Subnet group name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
  default     = []
}

variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "Auth token for Redis"
  type        = string
  default     = null
  sensitive   = true
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable multi-AZ"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 7
}

variable "snapshot_window" {
  description = "Daily time range for snapshots"
  type        = string
  default     = "07:00-08:00"
}

variable "maintenance_window" {
  description = "Weekly maintenance window"
  type        = string
  default     = "sun:08:00-sun:09:00"
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = false
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = null
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}

resource "aws_elasticache_subnet_group" "this" {
  name        = var.subnet_group_name
  description = "ElastiCache subnet group for ${var.environment}"
  subnet_ids  = var.private_subnets

  tags = merge(var.tags, {
    Name        = var.subnet_group_name
    Environment = var.environment
  })
}

resource "aws_security_group" "this" {
  count       = length(var.security_group_ids) > 0 ? 0 : 1
  name        = "${var.environment}-redis-sg"
  description = "Security group for Redis cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port = var.port
    to_port   = var.port
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-redis-sg"
    Environment = var.environment
  })
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id          = var.cluster_id
  replication_group_description = "ElastiCache replication group for ${var.environment}"
  node_type                     = var.node_type
  number_cache_clusters         = var.num_cache_nodes
  engine                        = var.engine
  engine_version                = var.engine_version
  port                          = var.port
  parameter_group_name          = var.parameter_group_name
  subnet_group_name             = aws_elasticache_subnet_group.this.name
  security_group_ids            = length(var.security_group_ids) > 0 ? var.security_group_ids : [aws_security_group.this[0].id]
  at_rest_encryption_enabled    = var.at_rest_encryption_enabled
  transit_encryption_enabled    = var.transit_encryption_enabled
  auth_token                    = var.auth_token
  automatic_failover_enabled    = var.automatic_failover_enabled
  multi_az_enabled              = var.multi_az_enabled
  snapshot_retention_limit      = var.snapshot_retention_limit
  snapshot_window               = var.snapshot_window
  maintenance_window            = var.maintenance_window
  apply_immediately             = var.apply_immediately
  notification_topic_arn        = var.notification_topic_arn

  tags = merge(var.tags, {
    Name        = var.cluster_id
    Environment = var.environment
  })

  lifecycle {
    ignore_changes = [auth_token]
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.environment}-redis-cpu-utilization"
  alarm_description   = "Redis CPU utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_actions       = []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.this.id
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-redis-cpu-utilization"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_metric_alarm" "memory_usage" {
  alarm_name          = "${var.environment}-redis-memory-usage"
  alarm_description   = "Redis memory usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_actions       = []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.this.id
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-redis-memory-usage"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_metric_alarm" "curr_connections" {
  alarm_name          = "${var.environment}-redis-curr-connections"
  alarm_description   = "Redis current connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_actions       = []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.this.id
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-redis-curr-connections"
    Environment = var.environment
  })
}