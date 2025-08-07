# Redis Module - Redis cluster for KALDRIX

resource "aws_elasticache_subnet_group" "this" {
  name        = "${var.project_name}-${var.environment}-redis-subnet-group"
  description = "Redis subnet group for KALDRIX"
  subnet_ids  = var.private_subnets

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-redis-subnet-group"
    },
    var.tags
  )
}

resource "aws_elasticache_parameter_group" "this" {
  name        = "${var.project_name}-${var.environment}-redis-parameter-group"
  family      = "redis7"
  description = "Redis parameter group for KALDRIX"

  parameter {
    name  = "cluster-enabled"
    value = "yes"
  }

  parameter {
    name  = "cluster-node-timeout"
    value = "300"
  }

  parameter {
    name  = "cluster-announce-ip"
    value = "10.0.0.1"
  }

  parameter {
    name  = "cluster-announce-port"
    value = "6379"
  }

  parameter {
    name  = "cluster-announce-bus-port"
    value = "16379"
  }

  parameter {
    name  = "cluster-config-file"
    value = "nodes-6379.conf"
  }

  parameter {
    name  = "cluster-node-timeout"
    value = "300"
  }

  parameter {
    name  = "cluster-migration-barrier"
    value = "1"
  }

  parameter {
    name  = "cluster-require-full-coverage"
    value = "yes"
  }

  parameter {
    name  = "cluster-slave-no-failover"
    value = "no"
  }

  parameter {
    name  = "cluster-slave-validity-factor"
    value = "10"
  }

  parameter {
    name  = "cluster-slave-lazy-flush"
    value = "no"
  }

  parameter {
    name  = "cluster-diskless-sync"
    value = "no"
  }

  parameter {
    name  = "cluster-ping-interval"
    value = "150"
  }

  parameter {
    name  = "cluster-ping-timeout"
    value = "150"
  }

  parameter {
    name  = "cluster-link-send-buffer-limit"
    value = "0"
  }

  parameter {
    name  = "cluster-link-receive-buffer-limit"
    value = "0"
  }

  parameter {
    name  = "cluster-link-retransmit-interval"
    value = "1"
  }

  parameter {
    name  = "cluster-link-timeout"
    value = "15"
  }

  parameter {
    name  = "cluster-slave-lazy-flush"
    value = "no"
  }

  parameter {
    name  = "cluster-diskless-sync"
    value = "no"
  }

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "maxmemory-samples"
    value = "5"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  parameter {
    name  = "tcp-backlog"
    value = "511"
  }

  parameter {
    name  = "save"
    value = ""
  }

  parameter {
    name  = "appendonly"
    value = "yes"
  }

  parameter {
    name  = "appendfsync"
    value = "everysec"
  }

  parameter {
    name  = "no-appendfsync-on-rewrite"
    value = "no"
  }

  parameter {
    name  = "auto-aof-rewrite-percentage"
    value = "100"
  }

  parameter {
    name  = "auto-aof-rewrite-min-size"
    value = "64mb"
  }

  parameter {
    name  = "aof-load-truncated"
    value = "yes"
  }

  parameter {
    name  = "lua-time-limit"
    value = "5000"
  }

  parameter {
    name  = "slowlog-log-slower-than"
    value = "10000"
  }

  parameter {
    name  = "slowlog-max-len"
    value = "128"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  parameter {
    name  "hash-max-ziplist-entries"
    value = "512"
  }

  parameter {
    name  = "hash-max-ziplist-value"
    value = "64"
  }

  parameter {
    name  = "list-max-ziplist-size"
    value = "-2"
  }

  parameter {
    name  = "list-compress-depth"
    value = "0"
  }

  parameter {
    name  = "set-max-intset-entries"
    value = "512"
  }

  parameter {
    name  = "zset-max-ziplist-entries"
    value = "128"
  }

  parameter {
    name  = "zset-max-ziplist-value"
    value = "64"
  }

  parameter {
    name  = "hll-sparse-max-bytes"
    value = "3000"
  }

  parameter {
    name  = "activerehashing"
    value = "yes"
  }

  parameter {
    name  = "client-output-buffer-limit"
    value = "normal 0 0 0 slave 268435456 67108864 604800000 pubsub 33554432 8388608 604800000"
  }

  parameter {
    name  = "hz"
    value = "10"
  }

  parameter {
    name  = "aof-rewrite-incremental-fsync"
    value = "yes"
  }

  parameter {
    name  = "rdb-save-incremental-fsync"
    value = "no"
  }

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-redis-parameter-group"
    },
    var.tags
  )
}

resource "aws_elasticache_replication_group" "this" {
  description          = "Redis cluster for KALDRIX"
  replication_group_id = "${var.project_name}-${var.environment}-redis"
  node_type            = var.environment == "production" ? "cache.m6g.2xlarge" : "cache.m6g.xlarge"
  port                = 6379
  parameter_group_name = aws_elasticache_parameter_group.this.name
  subnet_group_name   = aws_elasticache_subnet_group.this.name
  security_group_ids  = [var.security_group_id]
  automatic_failover_enabled = true
  multi_az_enabled   = var.environment == "production"
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token          = var.redis_password
  engine             = "redis"
  engine_version     = "7.1"
  num_cache_clusters = var.environment == "production" ? 3 : 2
  snapshot_window    = "00:00-01:00"
  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  maintenance_window = "sun:06:00-sun:07:00"
  notification_topic_arn = var.notification_topic_arn
  apply_immediately = false

  cluster_mode {
    replicas_per_node_group = var.environment == "production" ? 2 : 1
    num_node_groups         = var.environment == "production" ? 2 : 1
  }

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-redis"
    },
    var.tags
  )
}

resource "aws_elasticache_user" "this" {
  user_id       = "${var.project_name}-${var.environment}-redis-user"
  user_name    = "${var.project_name}-${var.environment}-redis-user"
  access_string = "on ~* +@all -@dangerous"
  engine        = "REDIS"
  passwords     = [var.redis_password]
  no_password_required = false

  authentication_mode {
    type = "password"
  }
}

resource "aws_elasticache_user_group" "this" {
  user_group_id  = "${var.project_name}-${var.environment}-redis-user-group"
  engine         = "REDIS"
  user_ids       = [aws_elasticache_user.this.user_id]

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-redis-user-group"
    },
    var.tags
  )
}

resource "aws_elasticache_user_group_association" "this" {
  user_group_id = aws_elasticache_user_group.this.user_group_id
  user_id       = aws_elasticache_user.this.user_id
}

resource "aws_secretsmanager_secret" "redis" {
  name                    = "${var.project_name}/${var.environment}/redis"
  description             = "Redis credentials for KALDRIX"
  recovery_window_in_days = 0
  kms_key_id              = var.kms_key_arn

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-redis-secret"
    },
    var.tags
  )
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    host     = aws_elasticache_replication_group.this.primary_endpoint_address
    port     = aws_elasticache_replication_group.this.port
    password = var.redis_password
    engine   = "redis"
    replication_group_id = aws_elasticache_replication_group.this.id
    user_id  = aws_elasticache_user.this.user_id
  })
}

resource "aws_ssm_parameter" "redis_endpoint" {
  name  = "/${var.project_name}/${var.environment}/redis/endpoint"
  type  = "String"
  value = aws_elasticache_replication_group.this.primary_endpoint_address

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-redis-endpoint-param"
    },
    var.tags
  )
}

resource "aws_ssm_parameter" "redis_port" {
  name  = "/${var.project_name}/${var.environment}/redis/port"
  type  = "String"
  value = aws_elasticache_replication_group.this.port

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-redis-port-param"
    },
    var.tags
  )
}

resource "aws_ssm_parameter" "redis_reader_endpoint" {
  name  = "/${var.project_name}/${var.environment}/redis/reader-endpoint"
  type  = "String"
  value = aws_elasticache_replication_group.this.reader_endpoint_address

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-redis-reader-endpoint-param"
    },
    var.tags
  )
}

resource "random_password" "redis" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
  default     = random_password.redis.result
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = null
}