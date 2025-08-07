output "efs_file_system_id" {
  description = "EFS file system ID for Prometheus data"
  value       = aws_efs_file_system.prometheus_data.id
}

output "prometheus_service" {
  description = "Prometheus service details"
  value = var.enable_prometheus ? {
    name      = helm_release.prometheus[0].name
    namespace = helm_release.prometheus[0].namespace
    status    = helm_release.prometheus[0].status
  } : null
}

output "grafana_service" {
  description = "Grafana service details"
  value = var.enable_grafana ? {
    name      = helm_release.grafana[0].name
    namespace = helm_release.grafana[0].namespace
    status    = helm_release.grafana[0].status
    url       = "http://${helm_release.grafana[0].name}.${helm_release.grafana[0].namespace}.svc.cluster.local:3000"
    admin_password = var.grafana_admin_password != "" ? var.grafana_admin_password : random_password.grafana_password.result
  } : null
}

output "security_groups" {
  description = "Security groups for monitoring components"
  value = {
    prometheus = aws_security_group.prometheus_sg.id
    grafana    = aws_security_group.grafana_sg.id
    efs        = aws_security_group.efs_sg.id
  }
}

output "business_kpi_alarms" {
  description = "Business KPI CloudWatch alarms"
  value = {
    for alarm_name, alarm in aws_cloudwatch_metric_alarm.business_kpi_alerts : alarm_name => alarm.arn
  }
}

output "kubernetes_namespace" {
  description = "Kubernetes namespace for monitoring"
  value       = kubernetes_namespace.monitoring.metadata[0].name
}