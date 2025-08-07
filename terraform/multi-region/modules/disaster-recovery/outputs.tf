# KALDRIX Disaster Recovery Module Outputs

output "backup_vault_arn" {
  description = "Backup vault ARN"
  value       = aws_backup_vault.main.arn
}

output "backup_vault_name" {
  description = "Backup vault name"
  value       = aws_backup_vault.main.name
}

output "backup_plans" {
  description = "Backup plans"
  value = {
    eks = {
      id   = aws_backup_plan.eks.id
      arn  = aws_backup_plan.eks.arn
      name = aws_backup_plan.eks.name
    }
    rds = {
      id   = aws_backup_plan.rds.id
      arn  = aws_backup_plan.rds.arn
      name = aws_backup_plan.rds.name
    }
  }
}

output "backup_role_arn" {
  description = "Backup IAM role ARN"
  value       = aws_iam_role.backup_role.arn
}

output "failover_health_check_ids" {
  description = "Failover health check IDs"
  value = {
    for region, health_check in aws_route53_health_check.failover : region => health_check.id
  }
}

output "failover_records" {
  description = "Failover DNS records"
  value = {
    primary = {
      name = aws_route53_record.failover_primary.name
      fqdn = aws_route53_record.failover_primary.fqdn
    }
    secondary = {
      for region, record in aws_route53_record.failover_secondary : region => {
        name = record.name
        fqdn = record.fqdn
      }
    }
  }
}

output "failover_alarms" {
  description = "Failover CloudWatch alarms"
  value = {
    primary_region_failure = aws_cloudwatch_metric_alarm.primary_region_failure.arn
    backup_rpo             = aws_cloudwatch_metric_alarm.backup_rpo.arn
    recovery_rto           = aws_cloudwatch_metric_alarm.recovery_rto.arn
  }
}

output "failover_lambda_arn" {
  description = "Failover Lambda function ARN"
  value       = aws_lambda_function.failover_handler.arn
}

output "failover_lambda_name" {
  description = "Failover Lambda function name"
  value       = aws_lambda_function.failover_handler.function_name
}

output "failover_sns_topic_arn" {
  description = "Failover SNS topic ARN"
  value       = aws_sns_topic.failover_alerts.arn
}

output "failover_trigger_rule_arn" {
  description = "Failover trigger EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.failover_trigger.arn
}

output "recovery_metrics" {
  description = "Recovery metrics and objectives"
  value = {
    rpo_target = var.backup_config.backup_retention
    rto_target = var.failover_config.failover_timeout
    health_check_interval = var.failover_config.health_check_interval
    failover_threshold = var.failover_config.unhealthy_threshold
  }
}

output "disaster_recovery_status" {
  description = "Disaster recovery configuration status"
  value = {
    backup_enabled = true
    failover_enabled = var.enable_failover
    cross_region_backup = var.backup_config.cross_region_backup
    automated_recovery = var.enable_failover
    monitoring_enabled = true
  }
}