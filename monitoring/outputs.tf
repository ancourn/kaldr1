output "monitoring_data_bucket" {
  description = "S3 bucket for monitoring data"
  value       = aws_s3_bucket.monitoring_data.id
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log groups"
  value = {
    application    = aws_cloudwatch_log_group.application_logs.name
    infrastructure = aws_cloudwatch_log_group.infrastructure_logs.name
    security       = aws_cloudwatch_log_group.security_logs.name
  }
}

output "cloudwatch_dashboards" {
  description = "CloudWatch dashboards"
  value = {
    overview = aws_cloudwatch_dashboard.kaldrix_overview.dashboard_name
  }
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "synthetics_canary_arn" {
  description = "CloudWatch Synthetics canary ARN"
  value       = aws_synthetics_canary.kaldrix_health_check.arn
}

output "monitoring_role_arn" {
  description = "IAM role ARN for monitoring"
  value       = aws_iam_role.synthetics_role.arn
}

# Alerting Module Outputs
output "alerting" {
  description = "Alerting module outputs"
  value = {
    processor_function_arn = module.alerting.alert_processor_function_arn
    processor_role_arn     = module.alerting.alert_processor_role_arn
    processor_log_group    = module.alerting.alert_processor_log_group
    health_check_rule      = module.alerting.health_check_event_rule
    maintenance_window_rule = module.alerting.maintenance_window_event_rule
  }
}

# Anomaly Detection Module Outputs
output "anomaly_detection" {
  description = "Anomaly detection module outputs"
  value = {
    detectors = module.anomaly_detection.anomaly_detectors
    alarms    = module.anomaly_detection.anomaly_alarms
    lookoutmetrics = module.anomaly_detection.lookoutmetrics_resources
    processor = module.anomaly_detection.anomaly_processor
  }
}

# Business Metrics Module Outputs
output "business_metrics" {
  description = "Business metrics module outputs"
  value = {
    efs_file_system_id = module.business_metrics.efs_file_system_id
    prometheus = module.business_metrics.prometheus_service
    grafana = module.business_metrics.grafana_service
    security_groups = module.business_metrics.security_groups
    kpi_alarms = module.business_metrics.business_kpi_alarms
    kubernetes_namespace = module.business_metrics.kubernetes_namespace
  }
}

# Compliance Monitoring Module Outputs
output "compliance_monitoring" {
  description = "Compliance monitoring module outputs"
  value = {
    security_hub = module.compliance_monitoring.security_hub
    guardduty = module.compliance_monitoring.guardduty
    macie = module.compliance_monitoring.macie
    cloudtrail = module.compliance_monitoring.cloudtrail
    config = module.compliance_monitoring.config
    kms_key = module.compliance_monitoring.kms_key
    compliance_reporter = module.compliance_monitoring.compliance_reporter
  }
}