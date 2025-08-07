# KALDRIX Disaster Recovery Module
# Handles automated failover and recovery mechanisms

# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name = "${var.project_name}-backup-vault-${var.environment}"
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "backup-vault"
  })
}

# Backup Plan for EKS clusters
resource "aws_backup_plan" "eks" {
  name = "${var.project_name}-eks-backup-plan-${var.environment}"

  rule {
    name              = "eks-daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = var.backup_config.backup_frequency

    lifecycle {
      delete_after = var.backup_config.backup_retention
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.main.arn
      lifecycle {
        delete_after = var.backup_config.backup_retention
      }
    }
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "backup-plan"
  })
}

# Backup Selection for EKS
resource "aws_backup_selection" "eks" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${var.project_name}-eks-backup-selection-${var.environment}"
  plan_id      = aws_backup_plan.eks.id

  resources = [
    for cluster_arn in var.eks_cluster_arns : cluster_arn
  ]

  condition {
    string_equals {
      "aws:ResourceTag/kaldrix.io/component" = ["eks-cluster"]
    }
  }
}

# Backup Plan for RDS
resource "aws_backup_plan" "rds" {
  name = "${var.project_name}-rds-backup-plan-${var.environment}"

  rule {
    name              = "rds-hourly-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 * * * ? *)"

    lifecycle {
      delete_after = var.backup_config.backup_retention
    }
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "backup-plan"
  })
}

# Backup Selection for RDS
resource "aws_backup_selection" "rds" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${var.project_name}-rds-backup-selection-${var.environment}"
  plan_id      = aws_backup_plan.rds.id

  resources = [
    for db_arn in var.rds_instance_arns : db_arn
  ]

  condition {
    string_equals {
      "aws:ResourceTag/kaldrix.io/component" = ["database"]
    }
  }
}

# Backup Role
resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-backup-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "backup-role"
  })
}

resource "aws_iam_role_policy" "backup_policy" {
  name = "${var.project_name}-backup-policy-${var.environment}"
  role = aws_iam_role.backup_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeVolumes",
          "ec2:DescribeSnapshots",
          "ec2:CreateTags",
          "ec2:CreateVolume",
          "ec2:CreateSnapshot",
          "ec2:DeleteSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "backup:CopyFromBackupVault",
          "backup:CreateBackupVault",
          "backup:CreateBackupPlan",
          "backup:CreateRecoveryPoint",
          "backup:DeleteBackupPlan",
          "backup:DeleteBackupVault",
          "backup:DeleteRecoveryPoint",
          "backup:DescribeBackupJob",
          "backup:DescribeBackupVault",
          "backup:DescribeRecoveryPoint",
          "backup:ExportBackupPlanTemplate",
          "backup:GetBackupPlan",
          "backup:GetBackupVaultAccessPolicy",
          "backup:GetBackupVaultNotifications",
          "backup:GetRecoveryPointRestoreMetadata",
          "backup:ListBackupJobs",
          "backup:ListBackupPlanTemplates",
          "backup:ListBackupPlanVersions",
          "backup:ListBackupPlans",
          "backup:ListBackupVaults",
          "backup:ListCopyJobs",
          "backup:ListProtectedResources",
          "backup:ListRecoveryPointsByBackupVault",
          "backup:ListRestoreJobs",
          "backup:StartBackupJob",
          "backup:StartCopyJob",
          "backup:StartRestoreJob",
          "backup:StopBackupJob",
          "backup:UpdateBackupPlan",
          "backup:UpdateRecoveryPointLifecycle"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots",
          "rds:CreateDBSnapshot",
          "rds:CopyDBSnapshot",
          "rds:DeleteDBSnapshot",
          "rds:RestoreDBInstanceFromDBSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters",
          "eks:DescribeNodegroup",
          "eks:ListNodegroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload",
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectTagging",
          "s3:GetObjectTagging",
          "s3:DeleteObjectTagging"
        ]
        Resource = [
          "${aws_backup_vault.main.arn}/*",
          aws_backup_vault.main.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_arn
      }
    ]
  })
}

# Route53 DNS Failover Configuration
resource "aws_route53_health_check" "failover" {
  for_each = { for region in var.regions : region => region }

  fqdn              = "${each.value == var.primary_region ? "" : each.value "."}${var.domain_name}"
  port              = var.health_check_config.port
  type              = var.health_check_config.protocol
  resource_path     = var.health_check_config.path
  request_interval  = var.health_check_config.interval
  failure_threshold = var.health_check_config.unhealthy_threshold

  tags = merge(var.tags, {
    "kaldrix.io/region" = each.value
    "kaldrix.io/purpose" = "failover-health-check"
  })
}

# Failover DNS Records
resource "aws_route53_record" "failover_primary" {
  zone_id = var.hosted_zone_id
  name    = "failover.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.primary_alb_dns_name
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier = "primary"

  health_check_id = aws_route53_health_check.failover[var.primary_region].id
}

resource "aws_route53_record" "failover_secondary" {
  for_each = { for region in var.secondary_regions : region => region }

  zone_id = var.hosted_zone_id
  name    = "failover.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.secondary_alb_dns_names[each.value]
    zone_id                = var.secondary_alb_zone_ids[each.value]
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = each.value

  health_check_id = aws_route53_health_check.failover[each.value].id
}

# CloudWatch Alarms for Failover
resource "aws_cloudwatch_metric_alarm" "primary_region_failure" {
  alarm_name          = "${var.project_name}-primary-region-failure-${var.environment}"
  alarm_description   = "Primary region failure detected"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.failover_config.unhealthy_threshold
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = var.failover_config.health_check_interval
  statistic           = "Average"
  threshold           = "1"
  
  dimensions = {
    LoadBalancer = var.primary_alb_arn_suffix
    TargetGroup  = var.primary_target_group_arn_suffix
  }
  
  alarm_actions = [
    var.sns_topic_arn,
    aws_sns_topic.failover_alerts.arn
  ]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "failover-alarm"
  })
}

# SNS Topic for Failover Alerts
resource "aws_sns_topic" "failover_alerts" {
  name = "${var.project_name}-failover-alerts-${var.environment}"
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "failover-alerts"
  })
}

resource "aws_sns_topic_policy" "failover_alerts" {
  arn = aws_sns_topic.failover_alerts.arn

  policy = jsonencode({
    Version = "2008-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.failover_alerts.arn
      },
      {
        Sid    = "AllowLambdaFunction"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.failover_alerts.arn
      }
    ]
  })
}

# Lambda Function for Automated Failover
resource "aws_iam_role" "failover_lambda_role" {
  name = "${var.project_name}-failover-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "failover-lambda-role"
  })
}

resource "aws_iam_role_policy" "failover_lambda_policy" {
  name = "${var.project_name}-failover-lambda-policy-${var.environment}"
  role = aws_iam_role.failover_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:ListResourceRecordSets",
          "route53:GetHostedZone"
        ]
        Resource = [
          var.hosted_zone_arn,
          "${var.hosted_zone_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:DescribeAlarms",
          "cloudwatch:GetMetricData",
          "cloudwatch:SetAlarmState"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.failover_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetHealth"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "failover_handler" {
  filename         = "${path.module}/failover_handler.zip"
  function_name    = "${var.project_name}-failover-handler-${var.environment}"
  role            = aws_iam_role.failover_lambda_role.arn
  handler         = "failover_handler.handler"
  runtime         = "python3.9"
  timeout         = var.failover_config.failover_timeout

  environment {
    variables = {
      HOSTED_ZONE_ID    = var.hosted_zone_id
      DOMAIN_NAME       = var.domain_name
      PRIMARY_REGION    = var.primary_region
      SECONDARY_REGIONS = jsonencode(var.secondary_regions)
      PRIMARY_ALB_DNS   = var.primary_alb_dns_name
      PRIMARY_ALB_ZONE  = var.primary_alb_zone_id
      SECONDARY_ALB_DNS = jsonencode(var.secondary_alb_dns_names)
      SECONDARY_ALB_ZONE = jsonencode(var.secondary_alb_zone_ids)
      SNS_TOPIC_ARN     = aws_sns_topic.failover_alerts.arn
    }
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "failover-lambda"
  })
}

# Lambda permission for SNS
resource "aws_lambda_permission" "sns_failover" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_handler.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.failover_alerts.arn
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "failover_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.failover_handler.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "failover-lambda-logs"
  })
}

# EventBridge Rule for Failover Automation
resource "aws_cloudwatch_event_rule" "failover_trigger" {
  name          = "${var.project_name}-failover-trigger-${var.environment}"
  description   = "Trigger failover when primary region fails"
  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"],
    detail-type = ["CloudWatch Alarm State Change"],
    detail = {
      alarmName = [aws_cloudwatch_metric_alarm.primary_region_failure.alarm_name],
      state = {
        value = ["ALARM"]
      }
    }
  })

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "failover-trigger"
  })
}

resource "aws_cloudwatch_event_target" "failover_lambda" {
  rule      = aws_cloudwatch_event_rule.failover_trigger.name
  target_id = "FailoverLambda"
  arn       = aws_lambda_function.failover_handler.arn
}

resource "aws_lambda_permission" "eventbridge_failover" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_handler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.failover_trigger.arn
}

# Recovery Point Objective (RPO) Monitoring
resource "aws_cloudwatch_metric_alarm" "backup_rpo" {
  alarm_name          = "${var.project_name}-backup-rpo-${var.environment}"
  alarm_description   = "Backup RPO exceeded"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BackupJobStartAfterExpected"
  namespace           = "AWS/Backup"
  period              = 3600
  statistic           = "Maximum"
  threshold           = "0"
  
  dimensions = {
    BackupVaultName = aws_backup_vault.main.name
  }
  
  alarm_actions = [var.sns_topic_arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "backup-rpo-alarm"
  })
}

# Recovery Time Objective (RTO) Monitoring
resource "aws_cloudwatch_metric_alarm" "recovery_rto" {
  alarm_name          = "${var.project_name}-recovery-rto-${var.environment}"
  alarm_description   = "Recovery RTO exceeded"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RestoreJobDurationExceeded"
  namespace           = "AWS/Backup"
  period              = 3600
  statistic           = "Maximum"
  threshold           = "0"
  
  dimensions = {
    BackupVaultName = aws_backup_vault.main.name
  }
  
  alarm_actions = [var.sns_topic_arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "recovery-rto-alarm"
  })
}

# Cross-region backup replication
resource "aws_backup_vault_policy" "cross_region" {
  count = var.backup_config.cross_region_backup ? 1 : 0

  backup_vault_name = aws_backup_vault.main.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CrossRegionBackup"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "backup:CopyIntoBackupVault",
          "backup:DescribeBackupVault",
          "backup:PutBackupVaultAccessPolicy"
        ]
        Resource = aws_backup_vault.main.arn
        Condition = {
          StringEquals = {
            "aws:SourceArn" = aws_backup_vault.main.arn
          }
        }
      }
    ]
  })
}