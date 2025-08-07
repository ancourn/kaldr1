output "alert_processor_function_arn" {
  description = "ARN of the alert processor Lambda function"
  value       = aws_lambda_function.alert_processor.arn
}

output "alert_processor_role_arn" {
  description = "ARN of the alert processor IAM role"
  value       = aws_iam_role.alert_processor_role.arn
}

output "alert_processor_log_group" {
  description = "CloudWatch log group for alert processor"
  value       = aws_cloudwatch_log_group.alert_processor_logs.name
}

output "health_check_event_rule" {
  description = "CloudWatch event rule for health checks"
  value       = aws_cloudwatch_event_rule.alert_health_check.name
}

output "maintenance_window_event_rule" {
  description = "CloudWatch event rule for maintenance windows"
  value       = aws_cloudwatch_event_rule.maintenance_window.name
}