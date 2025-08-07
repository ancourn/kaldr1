# KALDRIX Global Monitoring Module Outputs

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.global.dashboard_name}"
}

output "log_group_name" {
  description = "Global CloudWatch log group name"
  value       = aws_cloudwatch_log_group.global.name
}

output "sns_topic_arn" {
  description = "Global SNS topic ARN for alerts"
  value       = aws_sns_topic.global_alerts.arn
}

output "cloudwatch_alarms" {
  description = "CloudWatch alarms"
  value = {
    high_error_rate      = aws_cloudwatch_metric_alarm.global_high_error_rate.arn
    high_response_time   = aws_cloudwatch_metric_alarm.global_high_response_time.arn
    high_cpu_utilization = aws_cloudwatch_metric_alarm.global_high_cpu_utilization.arn
    high_memory_utilization = aws_cloudwatch_metric_alarm.global_high_memory_utilization.arn
    synthetics_failure   = aws_cloudwatch_metric_alarm.synthetics_failure.arn
  }
}

output "synthetics_canary_arn" {
  description = "CloudWatch Synthetics canary ARN"
  value       = aws_synthetics_canary.global_health_check.arn
}

output "synthetics_role_arn" {
  description = "Synthetics IAM role ARN"
  value       = aws_iam_role.synthetics_role.arn
}

output "xray_group_arn" {
  description = "X-Ray group ARN"
  value       = aws_xray_group.global.arn
}

output "log_aggregation_bucket" {
  description = "Log aggregation S3 bucket"
  value       = aws_s3_bucket.log_aggregation.id
}

output "firehose_stream_arn" {
  description = "Kinesis Firehose stream ARN"
  value       = aws_kinesis_firehose_delivery_stream.global_logs.arn
}

output "log_processor_lambda_arn" {
  description = "Log processor Lambda function ARN"
  value       = aws_lambda_function.log_processor.arn
}

output "log_query_definitions" {
  description = "CloudWatch log query definitions"
  value = {
    global_errors = aws_cloudwatch_log_query_definition.global_errors.name
  }
}

output "monitoring_endpoints" {
  description = "Monitoring service endpoints"
  value = {
    dashboard    = "https://console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.global.dashboard_name}"
    logs         = "https://console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#logsV2:log-groups/log-group/${aws_cloudwatch_log_group.global.name}"
    xray         = "https://console.aws.amazon.com/xray/home?region=${var.primary_region}#/service-map"
    synthetics   = "https://console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#synthetics:canary/list"
  }
}

output "alerting_configuration" {
  description = "Alerting configuration summary"
  value = {
    email_enabled = var.alerting_config.enable_email_alerts
    sms_enabled   = var.alerting_config.enable_sms_alerts
    slack_enabled = var.alerting_config.enable_slack_alerts
    thresholds   = var.alerting_config.alert_thresholds
  }
}

output "monitoring_status" {
  description = "Monitoring configuration status"
  value = {
    cloudwatch_enabled = var.monitoring_config.enable_cloudwatch
    prometheus_enabled = var.monitoring_config.enable_prometheus
    grafana_enabled    = var.monitoring_config.enable_grafana
    retention_days    = var.monitoring_config.retention_days
    log_level         = var.monitoring_config.log_level
  }
}