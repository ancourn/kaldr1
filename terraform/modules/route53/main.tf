variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "subdomains" {
  description = "Map of subdomain configurations"
  type        = map(any)
  default     = {}
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
}

variable "alb_zone_id" {
  description = "ALB zone ID"
  type        = string
}

variable "create_zone" {
  description = "Create Route53 zone"
  type        = bool
  default     = true
}

variable "zone_id" {
  description = "Existing Route53 zone ID"
  type        = string
  default     = ""
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}

resource "aws_route53_zone" "this" {
  count = var.create_zone ? 1 : 0
  name  = var.domain_name

  tags = merge(var.tags, {
    Name        = "${var.environment}-route53-zone"
    Environment = var.environment
  })
}

data "aws_route53_zone" "this" {
  count       = !var.create_zone && var.zone_id != "" ? 1 : 0
  zone_id     = var.zone_id
}

locals {
  zone_id = var.create_zone ? aws_route53_zone.this[0].zone_id : data.aws_route53_zone.this[0].zone_id
}

resource "aws_route53_record" "this" {
  for_each = var.subdomains

  zone_id = local.zone_id
  name    = each.value.name != "" ? "${each.value.name}.${var.domain_name}" : var.domain_name
  type    = each.value.type

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }

  ttl = each.value.ttl

  tags = merge(var.tags, {
    Name        = "${var.environment}-${each.key}-route53"
    Environment = var.environment
  })
}

resource "aws_route53_record" "mx" {
  count = var.create_zone ? 1 : 0
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 300

  records = [
    "10 ASPMX.L.GOOGLE.COM",
    "20 ALT1.ASPMX.L.GOOGLE.COM",
    "30 ALT2.ASPMX.L.GOOGLE.COM",
    "40 ASPMX2.GOOGLEMAIL.COM",
    "50 ASPMX3.GOOGLEMAIL.COM"
  ]
}

resource "aws_route53_record" "txt" {
  count = var.create_zone ? 1 : 0
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 300

  records = [
    "v=spf1 include:_spf.google.com ~all"
  ]
}

resource "aws_route53_record" "dmarc" {
  count = var.create_zone ? 1 : 0
  zone_id = local.zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 300

  records = [
    "v=DMARC1; p=quarantine; rua=mailto:dmarc@${var.domain_name}"
  ]
}

resource "aws_route53_health_check" "this" {
  for_each = var.subdomains

  fqdn              = each.value.name != "" ? "${each.value.name}.${var.domain_name}" : var.domain_name
  port              = 443
  type              = "HTTPS"
  resource_path     = each.value.health_check_path
  failure_threshold = 3
  request_interval  = 30

  tags = merge(var.tags, {
    Name        = "${var.environment}-${each.key}-health-check"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_metric_alarm" "health_check" {
  for_each = var.subdomains

  alarm_name          = "${var.environment}-route53-health-check-${each.key}"
  alarm_description   = "Route53 health check for ${each.value.name != "" ? "${each.value.name}.${var.domain_name}" : var.domain_name}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_actions       = []

  dimensions = {
    HealthCheckId = aws_route53_health_check.this[each.key].id
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-route53-health-check-${each.key}"
    Environment = var.environment
  })
}