# KALDRIX Global Monitoring Module
# Handles cross-region monitoring and alerting

# CloudWatch Dashboard for Global Monitoring
resource "aws_cloudwatch_dashboard" "global" {
  dashboard_name = "${var.project_name}-global-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.primary_alb_arn_suffix, { region = var.primary_region }],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.secondary_alb_arn_suffixes["us-west-2"], { region = "us-west-2" }],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.secondary_alb_arn_suffixes["eu-west-1"], { region = "eu-west-1" }]
          ]
          period = 300
          stat = "Sum"
          region = var.primary_region
          title = "Global Request Count by Region"
          view = "timeSeries"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.primary_alb_arn_suffix, { region = var.primary_region }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.secondary_alb_arn_suffixes["us-west-2"], { region = "us-west-2" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.secondary_alb_arn_suffixes["eu-west-1"], { region = "eu-west-1" }]
          ]
          period = 300
          stat = "Average"
          region = var.primary_region
          title = "Global Response Time by Region"
          view = "timeSeries"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.primary_alb_arn_suffix, { region = var.primary_region }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.secondary_alb_arn_suffixes["us-west-2"], { region = "us-west-2" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.secondary_alb_arn_suffixes["eu-west-1"], { region = "eu-west-1" }]
          ]
          period = 300
          stat = "Sum"
          region = var.primary_region
          title = "Global 5XX Errors by Region"
          view = "timeSeries"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.primary_db_instance_id, { region = var.primary_region }],
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.secondary_db_instance_ids["us-west-2"], { region = "us-west-2" }],
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.secondary_db_instance_ids["eu-west-1"], { region = "eu-west-1" }]
          ]
          period = 300
          stat = "Average"
          region = var.primary_region
          title = "Global Database CPU by Region"
          view = "timeSeries"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "ReplicationGroupId", var.primary_redis_cluster_id, { region = var.primary_region }],
            ["AWS/ElastiCache", "CPUUtilization", "ReplicationGroupId", var.secondary_redis_cluster_ids["us-west-2"], { region = "us-west-2" }],
            ["AWS/ElastiCache", "CPUUtilization", "ReplicationGroupId", var.secondary_redis_cluster_ids["eu-west-1"], { region = "eu-west-1" }]
          ]
          period = 300
          stat = "Average"
          region = var.primary_region
          title = "Global Redis CPU by Region"
          view = "timeSeries"
        }
      },
      {
        type = "log"
        properties = {
          query = "SOURCE '/aws/eks/kaldrix-cluster' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc"
          region = var.primary_region
          title = "Global EKS Error Logs"
          view = "table"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-dashboard"
  })
}

# CloudWatch Log Group for Global Logs
resource "aws_cloudwatch_log_group" "global" {
  name              = "/kaldrix/global/${var.environment}"
  retention_in_days = var.monitoring_config.retention_days

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-logs"
  })
}

# CloudWatch Log Insights Query for Global Analysis
resource "aws_cloudwatch_log_query_definition" "global_errors" {
  name = "${var.project_name}-global-errors-${var.environment}"

  log_group_names = [
    "/aws/eks/kaldrix-cluster",
    "/aws/eks/kaldrix-cluster-us-west-2",
    "/aws/eks/kaldrix-cluster-eu-west-1",
    "/aws/application-load-balancer/kaldrix-alb",
    "/aws/rds/instance/kaldrix-primary",
    "/aws/elasticache/replication-group/kaldrix-primary"
  ]

  query_string = <<EOF
fields @timestamp, @logStream, @message
| filter @message like /ERROR/ or @message like /FATAL/ or @message like /CRITICAL/
| sort @timestamp desc
| limit 100
EOF

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-error-query"
  })
}

# SNS Topic for Global Alerts
resource "aws_sns_topic" "global_alerts" {
  name = "${var.project_name}-global-alerts-${var.environment}"
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-alerts"
  })
}

resource "aws_sns_topic_policy" "global_alerts" {
  arn = aws_sns_topic.global_alerts.arn

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
        Resource = aws_sns_topic.global_alerts.arn
      },
      {
        Sid    = "AllowLambdaFunctions"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.global_alerts.arn
      }
    ]
  })
}

# Global CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "global_high_error_rate" {
  alarm_name          = "${var.project_name}-global-high-error-rate-${var.environment}"
  alarm_description   = "Global high error rate detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alerting_config.alert_thresholds.error_rate
  
  dimensions = {
    LoadBalancer = var.primary_alb_arn_suffix
  }
  
  alarm_actions = [aws_sns_topic.global_alerts.arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-error-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "global_high_response_time" {
  alarm_name          = "${var.project_name}-global-high-response-time-${var.environment}"
  alarm_description   = "Global high response time detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = var.alerting_config.alert_thresholds.response_time
  
  dimensions = {
    LoadBalancer = var.primary_alb_arn_suffix
  }
  
  alarm_actions = [aws_sns_topic.global_alerts.arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-response-time-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "global_high_cpu_utilization" {
  alarm_name          = "${var.project_name}-global-high-cpu-${var.environment}"
  alarm_description   = "Global high CPU utilization detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EKS"
  period              = 300
  statistic           = "Average"
  threshold           = var.alerting_config.alert_thresholds.cpu_utilization
  
  dimensions = {
    ClusterName = var.primary_eks_cluster_name
  }
  
  alarm_actions = [aws_sns_topic.global_alerts.arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "global_high_memory_utilization" {
  alarm_name          = "${var.project_name}-global-high-memory-${var.environment}"
  alarm_description   = "Global high memory utilization detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/EKS"
  period              = 300
  statistic           = "Average"
  threshold           = var.alerting_config.alert_thresholds.memory_utilization
  
  dimensions = {
    ClusterName = var.primary_eks_cluster_name
  }
  
  alarm_actions = [aws_sns_topic.global_alerts.arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-memory-alarm"
  })
}

# CloudWatch Synthetics for Global Health Checks
resource "aws_synthetics_canary" "global_health_check" {
  name                 = "${var.project_name}-global-health-${var.environment}"
  artifact_s3_location = "s3://${var.artifact_bucket}/synthetics/${var.environment}/"
  execution_role_arn   = aws_iam_role.synthetics_role.arn
  handler              = "globalHealthCheck.handler"
  runtime_version      = "syn-nodejs-puppeteer-6.2"
  script               = file("${path.module}/synthetics/global_health_check.js")

  run_config {
    timeout_in_seconds = 60
    memory_in_mb        = 960
  }

  schedule {
    expression = "rate(5 minutes)"
  }

  failure_retention_period = 7
  success_retention_period = 7

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-synthetics"
  })
}

# Synthetics IAM Role
resource "aws_iam_role" "synthetics_role" {
  name = "${var.project_name}-synthetics-role-${var.environment}"

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
    "kaldrix.io/purpose" = "synthetics-role"
  })
}

resource "aws_iam_role_policy" "synthetics_policy" {
  name = "${var.project_name}-synthetics-policy-${var.environment}"
  role = aws_iam_role.synthetics_role.id

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
        Resource = [
          "arn:aws:logs:*:*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketLocation",
          "s3:ListAllMyBuckets"
        ]
        Resource = [
          "arn:aws:s3:::${var.artifact_bucket}/*",
          "arn:aws:s3:::${var.artifact_bucket}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "CloudWatchSynthetics"
          }
        }
      }
    ]
  })
}

# CloudWatch Synthetics Alarms
resource "aws_cloudwatch_metric_alarm" "synthetics_failure" {
  alarm_name          = "${var.project_name}-synthetics-failure-${var.environment}"
  alarm_description   = "Global health check synthetics failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SuccessPercent"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = "95"
  
  dimensions = {
    CanaryName = aws_synthetics_canary.global_health_check.name
  }
  
  alarm_actions = [aws_sns_topic.global_alerts.arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "synthetics-alarm"
  })
}

# X-Ray for Distributed Tracing
resource "aws_xray_group" "global" {
  group_name = "${var.project_name}-global-${var.environment}"
  filter_expression = "service('kaldrix')"

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "xray-group"
  })
}

resource "aws_xray_sampling_rule" "global" {
  rule_name      = "${var.project_name}-global-${var.environment}"
  priority       = 100
  version        = 1
  reservoir_size = 100
  fixed_rate     = 0.1

  service_type  = "*"
  host          = "*"
  http_method   = "*"
  url_path      = "*"
  service_name  = "kaldrix"

  attributes = {}
}

# CloudWatch Logs Subscription Filter for Centralized Logging
resource "aws_cloudwatch_log_subscription_filter" "primary_logs" {
  name            = "${var.project_name}-primary-logs-${var.environment}"
  log_group_name  = "/aws/eks/kaldrix-cluster"
  filter_pattern  ""
  destination_arn = aws_kinesis_firehose_delivery_stream.global_logs.arn
  distribution    = "Random"
}

resource "aws_cloudwatch_log_subscription_filter" "secondary_logs_us_west_2" {
  name            = "${var.project_name}-secondary-logs-us-west-2-${var.environment}"
  log_group_name  = "/aws/eks/kaldrix-cluster-us-west-2"
  filter_pattern  ""
  destination_arn = aws_kinesis_firehose_delivery_stream.global_logs.arn
  distribution    = "Random"
}

resource "aws_cloudwatch_log_subscription_filter" "secondary_logs_eu_west_1" {
  name            = "${var.project_name}-secondary-logs-eu-west-1-${var.environment}"
  log_group_name  = "/aws/eks/kaldrix-cluster-eu-west-1"
  filter_pattern  ""
  destination_arn = aws_kinesis_firehose_delivery_stream.global_logs.arn
  distribution    = "Random"
}

# Kinesis Firehose for Log Aggregation
resource "aws_kinesis_firehose_delivery_stream" "global_logs" {
  name        = "${var.project_name}-global-logs-${var.environment}"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose_role.arn
    bucket_arn = aws_s3_bucket.log_aggregation.arn

    buffering_size     = 64
    buffering_interval = 60

    compression_format = "GZIP"

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = "/aws/kinesisfirehose/global-logs"
      log_stream_name = "DestinationDelivery"
    }

    processing_configuration {
      enabled = "true"

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = "${aws_lambda_function.log_processor.arn}:$LATEST"
        }
      }
    }
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "log-aggregation"
  })
}

# S3 Bucket for Log Aggregation
resource "aws_s3_bucket" "log_aggregation" {
  bucket = "${var.project_name}-log-aggregation-${var.environment}"
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "log-aggregation"
  })
}

resource "aws_s3_bucket_versioning" "log_aggregation" {
  bucket   = aws_s3_bucket.log_aggregation.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_aggregation" {
  bucket   = aws_s3_bucket.log_aggregation.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "log_aggregation" {
  bucket = aws_s3_bucket.log_aggregation.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = var.monitoring_config.retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.monitoring_config.retention_days
    }
  }
}

# IAM Role for Firehose
resource "aws_iam_role" "firehose_role" {
  name = "${var.project_name}-firehose-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "firehose-role"
  })
}

resource "aws_iam_role_policy" "firehose_policy" {
  name = "${var.project_name}-firehose-policy-${var.environment}"
  role = aws_iam_role.firehose_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:AbortMultipartUpload"
        ]
        Resource = [
          aws_s3_bucket.log_aggregation.arn,
          "${aws_s3_bucket.log_aggregation.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:*:*:log-group:/aws/kinesisfirehose/global-logs:log-stream:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction",
          "lambda:GetFunctionConfiguration"
        ]
        Resource = aws_lambda_function.log_processor.arn
      }
    ]
  })
}

# Lambda Function for Log Processing
resource "aws_lambda_function" "log_processor" {
  filename         = "${path.module}/log_processor.zip"
  function_name    = "${var.project_name}-log-processor-${var.environment}"
  role            = aws_iam_role.log_processor_role.arn
  handler         = "log_processor.handler"
  runtime         = "python3.9"
  timeout         = 60

  environment {
    variables = {
      LOG_LEVEL = var.monitoring_config.log_level
    }
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "log-processor"
  })
}

resource "aws_iam_role" "log_processor_role" {
  name = "${var.project_name}-log-processor-role-${var.environment}"

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
    "kaldrix.io/purpose" = "log-processor-role"
  })
}

resource "aws_iam_role_policy" "log_processor_policy" {
  name = "${var.project_name}-log-processor-policy-${var.environment}"
  role = aws_iam_role.log_processor_role.id

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
          "kms:Decrypt"
        ]
        Resource = var.kms_key_arn
      }
    ]
  })
}