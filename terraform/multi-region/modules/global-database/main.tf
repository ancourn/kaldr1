# KALDRIX Global Database Module
# Handles cross-region database replication and Redis clustering

# Primary RDS instance
resource "aws_db_instance" "primary" {
  provider = aws.primary

  identifier             = "${var.project_name}-primary-${var.environment}"
  engine                 = var.database_config.engine
  engine_version         = var.database_config.engine_version
  instance_class         = var.database_config.primary_instance_class
  allocated_storage      = var.database_config.allocated_storage
  storage_type           = var.database_config.storage_type
  storage_encrypted      = true
  kms_key_id             = var.kms_key_arn
  
  db_name                = "kaldrix_${var.environment}"
  username               = "kaldrix_${var.environment}"
  password               = var.database_password
  port                   = 5432
  
  vpc_security_group_ids = [var.primary_security_group_id]
  db_subnet_group_name   = var.primary_db_subnet_group_name
  
  multi_az               = var.database_config.multi_az
  backup_retention_period = var.database_config.backup_retention_period
  maintenance_window     = var.database_config.maintenance_window
  backup_window          = var.database_config.backup_window
  
  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-primary-final-${var.environment}"
  
  performance_insights_enabled = true
  performance_insights_kms_key_id = var.kms_key_arn
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  tags = merge(var.tags, {
    "kaldrix.io/role" = "primary-database"
    "kaldrix.io/replication" = "primary"
  })
}

# Secondary RDS instances for read replicas
resource "aws_db_instance" "secondary" {
  for_each = { for region in var.secondary_regions : region => region }
  provider = aws.region[each.value]

  identifier             = "${var.project_name}-secondary-${each.value}-${var.environment}"
  engine                 = var.database_config.engine
  engine_version         = var.database_config.engine_version
  instance_class         = var.database_config.secondary_instance_class
  allocated_storage      = var.database_config.allocated_storage
  storage_type           = var.database_config.storage_type
  storage_encrypted      = true
  kms_key_id             = var.kms_key_arn
  
  replicate_source_db    = aws_db_instance.primary.arn
  
  vpc_security_group_ids = [var.secondary_security_group_ids[each.value]]
  db_subnet_group_name   = var.secondary_db_subnet_group_names[each.value]
  
  backup_retention_period = var.database_config.backup_retention_period
  maintenance_window     = var.database_config.maintenance_window
  backup_window          = var.database_config.backup_window
  
  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-secondary-${each.value}-final-${var.environment}"
  
  performance_insights_enabled = true
  performance_insights_kms_key_id = var.kms_key_arn
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  tags = merge(var.tags, {
    "kaldrix.io/role" = "secondary-database"
    "kaldrix.io/replication" = "secondary"
    "kaldrix.io/region" = each.value
  })

  depends_on = [aws_db_instance.primary]
}

# Primary Redis cluster
resource "aws_elasticache_replication_group" "primary" {
  provider = aws.primary

  description          = "${var.project_name} primary Redis cluster"
  replication_group_id = "${var.project_name}-primary-${var.environment}"
  node_type           = var.redis_config.primary_node_type
  port                = 6379
  parameter_group_name = var.redis_config.parameter_group_name
  
  automatic_failover_enabled = var.redis_config.automatic_failover_enabled
  multi_az_enabled          = var.redis_config.multi_az_enabled
  
  num_cache_clusters      = var.redis_config.num_cache_nodes
  snapshot_retention_limit = var.redis_config.snapshot_retention_limit
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  kms_key_id                = var.kms_key_arn
  
  auth_token          = var.redis_auth_token
  
  subnet_group_name   = var.primary_redis_subnet_group_name
  security_group_ids  = [var.primary_redis_security_group_id]
  
  maintenance_window  = "sun:03:00-sun:04:00"
  snapshot_window    = "02:00-03:00"
  
  tags = merge(var.tags, {
    "kaldrix.io/role" = "primary-redis"
    "kaldrix.io/replication" = "primary"
  })
}

# Secondary Redis clusters for global data store
resource "aws_elasticache_replication_group" "secondary" {
  for_each = { for region in var.secondary_regions : region => region }
  provider = aws.region[each.value]

  description          = "${var.project_name} secondary Redis cluster in ${each.value}"
  replication_group_id = "${var.project_name}-secondary-${each.value}-${var.environment}"
  node_type           = var.redis_config.secondary_node_type
  port                = 6379
  parameter_group_name = var.redis_config.parameter_group_name
  
  automatic_failover_enabled = var.redis_config.automatic_failover_enabled
  multi_az_enabled          = var.redis_config.multi_az_enabled
  
  num_cache_clusters      = var.redis_config.num_cache_nodes
  snapshot_retention_limit = var.redis_config.snapshot_retention_limit
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  kms_key_id                = var.kms_key_arn
  
  auth_token          = var.redis_auth_token
  
  subnet_group_name   = var.secondary_redis_subnet_group_names[each.value]
  security_group_ids  = [var.secondary_redis_security_group_ids[each.value]]
  
  maintenance_window  = "sun:03:00-sun:04:00"
  snapshot_window    = "02:00-03:00"
  
  tags = merge(var.tags, {
    "kaldrix.io/role" = "secondary-redis"
    "kaldrix.io/replication" = "secondary"
    "kaldrix.io/region" = each.value
  })

  depends_on = [aws_elasticache_replication_group.primary]
}

# Global Datastore for Redis (Redis Global Datastore)
resource "aws_elasticache_global_replication_group" "main" {
  count = var.enable_global_datastore ? 1 : 0
  provider = aws.primary

  global_replication_group_description = "${var.project_name} global Redis datastore"
  global_replication_group_id_suffix   = "${var.project_name}-global-${var.environment}"
  
  primary_replication_group_id = aws_elasticache_replication_group.primary.id
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-redis"
  })
}

# Add secondary clusters to global datastore
resource "aws_elasticache_global_replication_group_member" "secondary" {
  for_each = { for region in var.secondary_regions : region => region }
  provider = aws.primary

  global_replication_group_id = aws_elasticache_global_replication_group.main[0].id
  replication_group_id        = aws_elasticache_replication_group.secondary[each.value].id
  replication_group_region    = each.value
  
  role = "SECONDARY"
}

# Database parameter groups
resource "aws_db_parameter_group" "primary" {
  provider = aws.primary

  name   = "${var.project_name}-primary-${var.environment}"
  family = "postgres15"
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
  
  parameter {
    name  = "log_statement"
    value = "all"
  }
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  parameter {
    name  = "log_disconnections"
    value = "1"
  }
  
  parameter {
    name  = "log_lock_waits"
    value = "1"
  }
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "db-parameters"
  })
}

# Redis parameter groups
resource "aws_elasticache_parameter_group" "primary" {
  provider = aws.primary

  name   = "${var.project_name}-redis-primary-${var.environment}"
  family = "redis7"
  
  parameter {
    name  = "notify-keyspace-events"
    value = "KEA"
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
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "redis-parameters"
  })
}

# Database subnet groups
resource "aws_db_subnet_group" "primary" {
  provider = aws.primary

  name       = "${var.project_name}-primary-${var.environment}"
  subnet_ids = var.primary_db_subnets
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "db-subnet-group"
  })
}

# Redis subnet groups
resource "aws_elasticache_subnet_group" "primary" {
  provider = aws.primary

  name       = "${var.project_name}-redis-primary-${var.environment}"
  subnet_ids = var.primary_redis_subnets
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "redis-subnet-group"
  })
}

# Security groups for database
resource "aws_security_group" "primary_db" {
  provider = aws.primary

  name        = "${var.project_name}-primary-db-${var.environment}"
  description = "Security group for primary database"
  vpc_id      = var.primary_vpc_id
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [var.primary_app_security_group_id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "db-security-group"
  })
}

# Security groups for Redis
resource "aws_security_group" "primary_redis" {
  provider = aws.primary

  name        = "${var.project_name}-primary-redis-${var.environment}"
  description = "Security group for primary Redis"
  vpc_id      = var.primary_vpc_id
  
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = [var.primary_app_security_group_id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "redis-security-group"
  })
}

# Database monitoring
resource "aws_cloudwatch_metric_alarm" "primary_db_cpu" {
  provider = aws.primary

  alarm_name          = "${var.project_name}-primary-db-cpu-${var.environment}"
  alarm_description   = "Primary database CPU utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
  
  alarm_actions = [var.sns_topic_arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "db-monitoring"
  })
}

# Redis monitoring
resource "aws_cloudwatch_metric_alarm" "primary_redis_cpu" {
  provider = aws.primary

  alarm_name          = "${var.project_name}-primary-redis-cpu-${var.environment}"
  alarm_description   = "Primary Redis CPU utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  
  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.primary.id
  }
  
  alarm_actions = [var.sns_topic_arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "redis-monitoring"
  })
}

# Database backup to S3
resource "aws_s3_bucket" "db_backups" {
  provider = aws.primary

  bucket = "${var.project_name}-db-backups-${var.environment}"
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "db-backups"
  })
}

resource "aws_s3_bucket_versioning" "db_backups" {
  provider = aws.primary
  bucket   = aws_s3_bucket.db_backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "db_backups" {
  provider = aws.primary
  bucket   = aws_s3_bucket.db_backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "db_backups" {
  provider = aws.primary
  bucket   = aws_s3_bucket.db_backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Database backup automation
resource "aws_iam_role" "db_backup_role" {
  provider = aws.primary

  name = "${var.project_name}-db-backup-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "db-backup-role"
  })
}

resource "aws_iam_role_policy" "db_backup_policy" {
  provider = aws.primary

  name = "${var.project_name}-db-backup-policy-${var.environment}"
  role = aws_iam_role.db_backup_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.db_backups.arn,
          "${aws_s3_bucket.db_backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = var.kms_key_arn
      }
    ]
  })
}