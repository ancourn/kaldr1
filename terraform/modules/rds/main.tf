# RDS Module - PostgreSQL database for KALDRIX

resource "aws_db_subnet_group" "this" {
  name        = "${var.project_name}-${var.environment}-db-subnet-group"
  description = "Database subnet group for KALDRIX"
  subnet_ids  = var.database_subnets

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-db-subnet-group"
    },
    var.tags
  )
}

resource "aws_db_parameter_group" "this" {
  name        = "${var.project_name}-${var.environment}-db-parameter-group"
  family      = "postgres15"
  description = "Database parameter group for KALDRIX"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
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
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "log_temp_files"
    value = "0"
  }

  parameter {
    name  = "log_line_prefix"
    value = "%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h "
  }

  parameter {
    name  = "track_activity_query_size"
    value = "2048"
  }

  parameter {
    name  = "track_counts"
    value = "on"
  }

  parameter {
    name  = "track_io_timing"
    value = "on"
  }

  parameter {
    name  = "track_functions"
    value = "all"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/3}"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "{DBInstanceClassMemory/64}"
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "{DBInstanceClassMemory/32}"
  }

  parameter {
    name  = "default_statistics_target"
    value = "100"
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }

  parameter {
    name  = "effective_io_concurrency"
    value = "200"
  }

  parameter {
    name  = "work_mem"
    value = "{DBInstanceClassMemory/2048}"
  }

  parameter {
    name  = "min_wal_size"
    value = "1GB"
  }

  parameter {
    name  = "max_wal_size"
    value = "4GB"
  }

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-db-parameter-group"
    },
    var.tags
  )
}

resource "aws_db_instance" "this" {
  identifier             = "${var.project_name}-${var.environment}-db"
  engine                 = "postgres"
  engine_version         = "15.7"
  instance_class         = var.environment == "production" ? "db.m6g.2xlarge" : "db.m6g.xlarge"
  allocated_storage      = var.environment == "production" ? 1000 : 500
  max_allocated_storage  = var.environment == "production" ? 2000 : 1000
  storage_type           = "gp3"
  storage_encrypted      = true
  kms_key_id             = var.kms_key_arn
  db_name                = "kaldrix_${var.environment}"
  username               = "kaldrix_${var.environment}"
  password               = var.db_password
  port                   = 5432
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [var.security_group_id]
  parameter_group_name   = aws_db_parameter_group.this.name
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "04:00-05:00"
  maintenance_window    = "sun:05:00-sun:06:00"
  multi_az               = var.environment == "production"
  availability_zone      = data.aws_availability_zones.available.names[0]
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-db-final-snapshot"
  deletion_protection   = var.environment == "production"
  performance_insights_enabled = var.environment == "production"
  performance_insights_kms_key_id = var.kms_key_arn
  monitoring_interval   = var.environment == "production" ? 60 : 0
  monitoring_role_arn   = var.environment == "production" ? aws_iam_role.rds_monitoring.arn : null
  enabled_cloudwatch_logs_exports = var.environment == "production" ? ["postgresql", "upgrade"] : []

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-db"
    },
    var.tags
  )
}

resource "aws_db_instance_role_association" "this" {
  db_instance_identifier = aws_db_instance.this.identifier
  feature_name         = "s3Import"
  role_arn            = aws_iam_role.rds_s3_import.arn
}

resource "aws_db_instance_role_association" "s3_export" {
  db_instance_identifier = aws_db_instance.this.identifier
  feature_name         = "s3Export"
  role_arn            = aws_iam_role.rds_s3_import.arn
}

resource "aws_iam_role" "rds_monitoring" {
  count = var.environment == "production" ? 1 : 0

  name = "${var.project_name}-${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-rds-monitoring-role"
    },
    var.tags
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.environment == "production" ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  role       = aws_iam_role.rds_monitoring[0].name
}

resource "aws_iam_role" "rds_s3_import" {
  name = "${var.project_name}-${var.environment}-rds-s3-import-role"

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

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-rds-s3-import-role"
    },
    var.tags
  )
}

resource "aws_iam_policy" "rds_s3_import" {
  name        = "${var.project_name}-${var.environment}-rds-s3-import-policy"
  description = "Policy for RDS S3 import/export"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject",
          "s3:GetBucketLocation",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = var.kms_key_arn
      }
    ]
  })

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-rds-s3-import-policy"
    },
    var.tags
  )
}

resource "aws_iam_role_policy_attachment" "rds_s3_import" {
  policy_arn = aws_iam_policy.rds_s3_import.arn
  role       = aws_iam_role.rds_s3_import.name
}

resource "aws_db_proxy" "this" {
  count = var.environment == "production" ? 1 : 0

  name                   = "${var.project_name}-${var.environment}-db-proxy"
  engine_family          = "POSTGRESQL"
  vpc_subnet_ids         = var.database_subnets
  auth                  = [
    {
      auth_scheme = "SECRETS"
      description = "RDS Proxy authentication using Secrets Manager"
      iam_auth    = "DISABLED"
      secret_arn  = aws_secretsmanager_secret.db.arn
    }
  ]
  role_arn              = aws_iam_role.rds_proxy[0].arn

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-db-proxy"
    },
    var.tags
  )
}

resource "aws_iam_role" "rds_proxy" {
  count = var.environment == "production" ? 1 : 0

  name = "${var.project_name}-${var.environment}-rds-proxy-role"

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

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-rds-proxy-role"
    },
    var.tags
  )
}

resource "aws_iam_policy" "rds_proxy" {
  count = var.environment == "production" ? 1 : 0

  name        = "${var.project_name}-${var.environment}-rds-proxy-policy"
  description = "Policy for RDS Proxy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_arn
      }
    ]
  })

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-rds-proxy-policy"
    },
    var.tags
  )
}

resource "aws_iam_role_policy_attachment" "rds_proxy" {
  count = var.environment == "production" ? 1 : 0

  policy_arn = aws_iam_policy.rds_proxy[0].arn
  role       = aws_iam_role.rds_proxy[0].name
}

resource "aws_db_proxy_default_target_group" "this" {
  count = var.environment == "production" ? 1 : 0

  db_proxy_name = aws_db_proxy.this[0].name
  connection_pool_config {
    connection_borrow_timeout    = 120
    max_connections_percent     = 100
    max_idle_connections_percent = 50
    session_pinning_filters     = ["EXCLUDE_VARIABLE_SETS"]
  }
}

resource "aws_db_proxy_target" "this" {
  count = var.environment == "production" ? 1 : 0

  db_proxy_name          = aws_db_proxy.this[0].name
  target_group_name     = aws_db_proxy_default_target_group.this[0].name
  db_instance_identifier = aws_db_instance.this.identifier
}

resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project_name}/${var.environment}/rds"
  description             = "Database credentials for KALDRIX"
  recovery_window_in_days = 0
  kms_key_id              = var.kms_key_arn

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-rds-secret"
    },
    var.tags
  )
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = aws_db_instance.this.username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.this.address
    port     = aws_db_instance.this.port
    dbInstanceIdentifier = aws_db_instance.this.identifier
  })
}

resource "aws_ssm_parameter" "db_endpoint" {
  name  = "/${var.project_name}/${var.environment}/db/endpoint"
  type  = "String"
  value = aws_db_instance.this.endpoint

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-db-endpoint-param"
    },
    var.tags
  )
}

resource "aws_ssm_parameter" "db_port" {
  name  = "/${var.project_name}/${var.environment}/db/port"
  type  = "String"
  value = aws_db_instance.this.port

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-db-port-param"
    },
    var.tags
  )
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/${var.project_name}/${var.environment}/db/name"
  type  = "String"
  value = aws_db_instance.this.db_name

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-db-name-param"
    },
    var.tags
  )
}

resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

data "aws_availability_zones" "available" {}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = random_password.db.result
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for import/export"
  type        = string
}