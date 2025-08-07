output "anomaly_detectors" {
  description = "CloudWatch anomaly detectors"
  value = {
    transaction_rate = var.enable_cloudwatch_anomaly ? aws_cloudwatch_anomaly_detector.kaldrix_metrics[0].id : null
    cpu_utilization = var.enable_cloudwatch_anomaly ? aws_cloudwatch_anomaly_detector.cpu_utilization[0].id : null
    memory_utilization = var.enable_cloudwatch_anomaly ? aws_cloudwatch_anomaly_detector.memory_utilization[0].id : null
  }
}

output "anomaly_alarms" {
  description = "CloudWatch anomaly detection alarms"
  value = {
    transaction_anomaly = var.enable_cloudwatch_anomaly ? aws_cloudwatch_metric_alarm.transaction_anomaly[0].arn : null
  }
}

output "lookoutmetrics_resources" {
  description = "Lookout for Metrics resources"
  value = var.enable_lookout_metrics ? {
    alert        = aws_lookoutmetrics_alert.kaldrix_anomaly_alert[0].id
    metric_set   = aws_lookoutmetrics_metric_set.kaldrix_metrics[0].id
  } : null
}

output "anomaly_processor" {
  description = "Anomaly processor Lambda function"
  value = var.enable_lookout_metrics ? {
    function_arn = aws_lambda_function.anomaly_processor[0].arn
    role_arn     = aws_iam_role.anomaly_processor_role[0].arn
    log_group    = aws_cloudwatch_log_group.anomaly_processor_logs[0].name
  } : null
}