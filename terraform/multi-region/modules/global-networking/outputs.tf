# KALDRIX Global Networking Module Outputs

output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_name" {
  description = "Route53 hosted zone name"
  value       = aws_route53_zone.main.name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = var.enable_cdn ? aws_cloudfront_distribution.cdn[0].id : null
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = var.enable_cdn ? aws_cloudfront_distribution.cdn[0].domain_name : null
}

output "global_accelerator_arn" {
  description = "Global Accelerator ARN"
  value       = var.enable_accelerator ? aws_globalaccelerator_accelerator.main[0].id : null
}

output "global_accelerator_dns" {
  description = "Global Accelerator DNS name"
  value       = var.enable_accelerator ? aws_globalaccelerator_accelerator.main[0].dns_name : null
}

output "regional_records" {
  description = "Regional DNS records"
  value = {
    for region, record in aws_route53_record.regional : region => {
      name = record.name
      fqdn = record.fqdn
    }
  }
}

output "health_check_ids" {
  description = "Route53 health check IDs"
  value = {
    for region, health_check in aws_route53_health_check.regional : region => health_check.id
  }
}

output "waf_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = var.enable_cdn ? aws_wafv2_web_acl.cloudfront[0].arn : null
}

output "cdn_url" {
  description = "CloudFront CDN URL"
  value       = var.enable_cdn ? "cdn.${var.domain_name}" : null
}

output "accelerator_url" {
  description = "Global Accelerator URL"
  value       = var.enable_accelerator ? "global.${var.domain_name}" : null
}