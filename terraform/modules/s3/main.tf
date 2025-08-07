# S3 Module - Object storage for KALDRIX

resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${var.environment}-data"
  
  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-data-bucket"
    },
    var.tags
  )
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "main" {
  bucket = aws_s3_bucket.main.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }

    transition {
      days          = 90
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.enable_backup ? var.backup_retention_days : 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_notification" "main" {
  bucket = aws_s3_bucket.main.id

  topic {
    topic_arn     = var.notification_topic_arn
    events        = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
    filter_prefix = "uploads/"
    filter_suffix = ".json"
  }
}

resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action   = "s3:GetBucketLocation"
        Resource = aws_s3_bucket.main.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.main.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "OPTIONS"]
    allowed_origins = ["https://${var.domain_name}", "https://*.${var.domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_logging" "main" {
  bucket        = aws_s3_bucket.main.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "log/"
}

resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-${var.environment}-logs"
  
  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-logs-bucket"
    },
    var.tags
  )
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = var.enable_backup ? var.backup_retention_days : 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket" "backups" {
  count = var.enable_backup ? 1 : 0

  bucket = "${var.project_name}-${var.environment}-backups"
  
  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-backups-bucket"
    },
    var.tags
  )
}

resource "aws_s3_bucket_versioning" "backups" {
  count = var.enable_backup ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  count = var.enable_backup ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  count = var.enable_backup ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "backups" {
  count = var.enable_backup ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  count = var.enable_backup ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  rule {
    id     = "backup-retention"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_replication_configuration" "main" {
  count = var.enable_backup ? 1 : 0

  role = aws_iam_role.s3_replication[0].arn
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "backup-replication"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.backups[0].arn
      storage_class = "STANDARD"
      account       = data.aws_caller_identity.current.account_id
    }

    source_selection_criteria {
      sse_kms_encrypted_objects {
        enabled = true
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}

resource "aws_iam_role" "s3_replication" {
  count = var.enable_backup ? 1 : 0

  name = "${var.project_name}-${var.environment}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceArn" = aws_s3_bucket.main.arn
          }
        }
      }
    ]
  })

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-s3-replication-role"
    },
    var.tags
  )
}

resource "aws_iam_policy" "s3_replication" {
  count = var.enable_backup ? 1 : 0

  name        = "${var.project_name}-${var.environment}-s3-replication-policy"
  description = "Policy for S3 replication"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket",
          "s3:ListBucketVersions",
          "s3:ListBucketMultipartUploads",
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:DeleteObjectVersion",
          "s3:AbortMultipartUpload",
          "s3:ListMultipartUploadParts"
        ]
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*",
          aws_s3_bucket.backups[0].arn,
          "${aws_s3_bucket.backups[0].arn}/*"
        ]
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
      Name = "${var.project_name}-${var.environment}-s3-replication-policy"
    },
    var.tags
  )
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  count = var.enable_backup ? 1 : 0

  policy_arn = aws_iam_policy.s3_replication[0].arn
  role       = aws_iam_role.s3_replication[0].name
}

resource "aws_s3_object" "readme" {
  bucket = aws_s3_bucket.main.id
  key    = "README.md"
  content = <<-EOT
# KALDRIX S3 Bucket

This bucket is used by the KALDRIX blockchain platform for storing various data including:
- Application data
- User uploads
- Temporary files
- Logs and metrics
- Backup data

## Access Control

Access to this bucket is restricted to authorized KALDRIX services and personnel only.

## Lifecycle Policy

Objects in this bucket follow a lifecycle policy:
- After 30 days: Transition to STANDARD_IA
- After 60 days: Transition to GLACIER
- After 90 days: Transition to DEEP_ARCHIVE
- After ${var.enable_backup ? var.backup_retention_days : 365} days: Expire

## Encryption

All objects in this bucket are encrypted using AWS KMS.

## Replication

${var.enable_backup ? "Objects are replicated to the backup bucket for disaster recovery." : "Backup replication is disabled."}

## Contact

For questions or issues related to this bucket, please contact the KALDRIX operations team.
EOT

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-readme"
    },
    var.tags
  )
}

data "aws_caller_identity" "current" {}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = null
}

variable "enable_backup" {
  description = "Enable backup and replication"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "domain_name" {
  description = "Domain name for CORS configuration"
  type        = string
  default     = "kaldrix.com"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}