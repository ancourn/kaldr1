# KALDRIX Global Load Balancing Module Outputs

output "global_alb_arn" {
  description = "Global ALB ARN"
  value       = aws_lb.global_nlb.arn
}

output "global_alb_dns" {
  description = "Global ALB DNS name"
  value       = aws_lb.global_nlb.dns_name
}

output "global_alb_zone_id" {
  description = "Global ALB zone ID"
  value       = aws_lb.global_nlb.zone_id
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_stage.global_api.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.global_api.id
}

output "api_gateway_arn" {
  description = "API Gateway ARN"
  value       = aws_api_gateway_rest_api.global_api.arn
}

output "api_domain_name" {
  description = "API Gateway custom domain name"
  value       = aws_api_gateway_domain_name.global_api.domain_name
}

output "api_cdn_url" {
  description = "API CDN URL"
  value       = aws_cloudfront_distribution.api_cdn.domain_name
}

output "api_cdn_id" {
  description = "API CDN distribution ID"
  value       = aws_cloudfront_distribution.api_cdn.id
}

output "nlb_target_group_arn" {
  description = "NLB target group ARN"
  value       = aws_lb_target_group.global_nlb.arn
}

output "vpc_link_id" {
  description = "VPC Link ID"
  value       = aws_api_gateway_vpc_link.primary.id
}

output "waf_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.api_gateway.arn
}

output "regional_records" {
  description = "Regional ALB records"
  value = {
    for region, record in aws_route53_record.regional_failover : region => {
      name = record.name
      fqdn = record.fqdn
    }
  }
}

output "monitoring_alarms" {
  description = "CloudWatch alarms for monitoring"
  value = {
    alb_5xx = aws_cloudwatch_metric_alarm.alb_5xx.arn
    api_gateway_5xx = aws_cloudwatch_metric_alarm.api_gateway_5xx.arn
  }
}

output "api_logs_group" {
  description = "API Gateway CloudWatch log group"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "global_endpoints" {
  description = "Global endpoint URLs"
  value = {
    application = "https://${var.domain_name}"
    api         = "https://api.${var.domain_name}"
    api_cdn     = "https://cdn-api.${var.domain_name}"
    nlb         = "https://${aws_lb.global_nlb.dns_name}"
  }
}