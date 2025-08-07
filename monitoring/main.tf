# S3 Bucket for Monitoring Data
resource "aws_s3_bucket" "monitoring_data" {
  bucket = "${var.environment}-kaldrix-monitoring-data-${var.region}"
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-monitoring-data"
    Environment = var.environment
    Component   = "monitoring"
  })
}

resource "aws_s3_bucket_versioning" "monitoring_data" {
  bucket = aws_s3_bucket.monitoring_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "monitoring_data" {
  bucket = aws_s3_bucket.monitoring_data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "monitoring_data" {
  bucket = aws_s3_bucket.monitoring_data.id
  
  rule {
    id     = "delete_old_data"
    status = "Enabled"
    expiration {
      days = var.monitoring_retention_days
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/kaldrix/application"
  retention_in_days = var.monitoring_retention_days
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-application-logs"
    Environment = var.environment
    Component   = "monitoring"
  })
}

resource "aws_cloudwatch_log_group" "infrastructure_logs" {
  name              = "/aws/kaldrix/infrastructure"
  retention_in_days = var.monitoring_retention_days
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-infrastructure-logs"
    Environment = var.environment
    Component   = "monitoring"
  })
}

resource "aws_cloudwatch_log_group" "security_logs" {
  name              = "/aws/kaldrix/security"
  retention_in_days = 365 # Retain security logs longer
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-security-logs"
    Environment = var.environment
    Component   = "monitoring"
  })
}

# CloudWatch Dashboards
resource "aws_cloudwatch_dashboard" "kaldrix_overview" {
  dashboard_name = "${var.environment}-kaldrix-overview"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", "i-1234567890abcdef0"],
            ["AWS/EC2", "MemoryUtilization", "InstanceId", "i-1234567890abcdef0"],
            [".", "DiskSpaceUtilization", ".", "."],
            [".", "NetworkIn", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Infrastructure Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["KALDRIX", "TransactionRate", ".", "."],
            ["KALDRIX", "BlockHeight", ".", "."],
            [".", "PeerCount", ".", "."],
            [".", "ConsensusHealth", ".", "."]
          ]
          period = 60
          stat   = "Sum"
          region = var.region
          title  = "Application Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.environment}-kaldrix-high-cpu"
  alarm_description   = "High CPU utilization detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    InstanceId = "i-1234567890abcdef0"
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-high-cpu-alarm"
    Environment = var.environment
    Component   = "monitoring"
  })
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${var.environment}-kaldrix-high-memory"
  alarm_description   = "High memory utilization detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "System/Linux"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    InstanceId = "i-1234567890abcdef0"
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-high-memory-alarm"
    Environment = var.environment
    Component   = "monitoring"
  })
}

resource "aws_cloudwatch_metric_alarm" "transaction_rate_low" {
  alarm_name          = "${var.environment}-kaldrix-transaction-rate-low"
  alarm_description   = "Transaction rate below expected threshold"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "5"
  metric_name         = "TransactionRate"
  namespace           = "KALDRIX"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-transaction-rate-alarm"
    Environment = var.environment
    Component   = "monitoring"
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-kaldrix-alerts"
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-alerts"
    Environment = var.environment
    Component   = "monitoring"
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Synthetics for Monitoring
resource "aws_synthetics_canary" "kaldrix_health_check" {
  name                 = "${var.environment}-kaldrix-health-check"
  artifact_s3_location = "${aws_s3_bucket.monitoring_data.id}/canary"
  execution_role_arn   = aws_iam_role.synthetics_role.arn
  handler              = "health_check.handler"
  runtime_version      = "syn-nodejs-puppeteer-6.2"
  schedule {
    expression = "rate(5 minutes)"
  }
  
  run_config {
    timeout_in_seconds = 60
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-health-check"
    Environment = var.environment
    Component   = "monitoring"
  })
}

# IAM Role for Synthetics
resource "aws_iam_role" "synthetics_role" {
  name = "${var.environment}-kaldrix-synthetics-role"
  
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
    Name        = "${var.environment}-kaldrix-synthetics-role"
    Environment = var.environment
    Component   = "monitoring"
  })
}

resource "aws_iam_role_policy_attachment" "synthetics_policy" {
  role       = aws_iam_role.synthetics_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/CloudWatchSyntheticsRole"
}

# Alerting Module
module "alerting" {
  source             = "./modules/alerting"
  region             = var.region
  environment        = var.environment
  sns_topic_arn      = aws_sns_topic.alerts.arn
  pagerduty_integration_key = var.pagerduty_integration_key
  slack_webhook_url  = var.slack_webhook_url
  alert_email        = var.alert_email
  enable_pagerduty   = var.pagerduty_integration_key != ""
  enable_slack       = var.slack_webhook_url != ""
  tags               = var.tags
}

# Anomaly Detection Module
module "anomaly_detection" {
  source                    = "./modules/anomaly_detection"
  region                    = var.region
  environment               = var.environment
  cloudwatch_log_groups     = [
    aws_cloudwatch_log_group.application_logs.name,
    aws_cloudwatch_log_group.infrastructure_logs.name,
    aws_cloudwatch_log_group.security_logs.name
  ]
  metrics_namespace         = "KALDRIX"
  anomaly_detection_threshold = 2.0
  enable_lookout_metrics    = true
  enable_cloudwatch_anomaly = true
  sns_topic_arn             = aws_sns_topic.alerts.arn
  tags                      = var.tags
}

# Business Metrics Module
module "business_metrics" {
  source                  = "./modules/business_metrics"
  region                  = var.region
  environment             = var.environment
  kubernetes_cluster_name = var.kubernetes_cluster_name
  vpc_id                  = var.vpc_id
  private_subnets         = var.private_subnets
  grafana_admin_password  = "KaldrixMonitoring2024!"
  enable_prometheus       = true
  enable_grafana          = true
  metrics_retention_days  = var.monitoring_retention_days
  tags                    = var.tags
}

# Compliance Monitoring Module
module "compliance_monitoring" {
  source                  = "./modules/compliance_monitoring"
  region                  = var.region
  environment             = var.environment
  vpc_id                  = var.vpc_id
  kubernetes_cluster_name = var.kubernetes_cluster_name
  audit_bucket_name       = aws_s3_bucket.monitoring_data.id
  sns_topic_arn           = aws_sns_topic.alerts.arn
  compliance_standards    = ["SOC2", "ISO27001", "GDPR", "HIPAA"]
  enable_security_hub     = true
  enable_guardduty        = true
  enable_macie            = true
  enable_cloudtrail       = true
  tags                    = var.tags
}