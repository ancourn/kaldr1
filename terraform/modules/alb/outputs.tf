output "lb_arn" {
  description = "The ARN of the load balancer"
  value       = aws_lb.this.arn
}

output "lb_arn_suffix" {
  description = "The ARN suffix of the load balancer"
  value       = aws_lb.this.arn_suffix
}

output "lb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.this.dns_name
}

output "lb_zone_id" {
  description = "The zone ID of the load balancer"
  value       = aws_lb.this.zone_id
}

output "lb_id" {
  description = "The ID of the load balancer"
  value       = aws_lb.this.id
}

output "lb_vpc_id" {
  description = "The VPC ID of the load balancer"
  value       = aws_lb.this.vpc_id
}

output "target_group_arns" {
  description = "Map of target group ARNs"
  value = {
    for key, tg in aws_lb_target_group.this : key => tg.arn
  }
}

output "target_group_names" {
  description = "Map of target group names"
  value = {
    for key, tg in aws_lb_target_group.this : key => tg.name
  }
}

output "http_listener_arn" {
  description = "The ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "The ARN of the HTTPS listener"
  value       = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : ""
}

output "security_group_id" {
  description = "The ID of the security group"
  value       = length(var.security_groups) > 0 ? var.security_groups[0] : aws_security_group.this[0].id
}

output "waf_acl_arn" {
  description = "The ARN of the WAF ACL"
  value       = aws_wafv2_web_acl.this.arn
}