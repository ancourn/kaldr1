output "zone_id" {
  description = "The ID of the Route53 zone"
  value       = local.zone_id
}

output "zone_name" {
  description = "The name of the Route53 zone"
  value       = var.domain_name
}

output "name_servers" {
  description = "The name servers of the Route53 zone"
  value       = var.create_zone ? aws_route53_zone.this[0].name_servers : []
}

output "record_arns" {
  description = "Map of record ARNs"
  value = {
    for key, record in aws_route53_record.this : key => record.arn
  }
}

output "record_names" {
  description = "Map of record names"
  value = {
    for key, record in aws_route53_record.this : key => record.name
  }
}

output "health_check_ids" {
  description = "Map of health check IDs"
  value = {
    for key, hc in aws_route53_health_check.this : key => hc.id
  }
}

output "mx_record_fqdn" {
  description = "FQDN of the MX record"
  value       = var.create_zone ? aws_route53_record.mx[0].fqdn : ""
}

output "txt_record_fqdn" {
  description = "FQDN of the TXT record"
  value       = var.create_zone ? aws_route53_record.txt[0].fqdn : ""
}

output "dmarc_record_fqdn" {
  description = "FQDN of the DMARC record"
  value       = var.create_zone ? aws_route53_record.dmarc[0].fqdn : ""
}