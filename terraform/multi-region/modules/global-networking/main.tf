# KALDRIX Global Networking Module
# Handles Route53, CloudFront, and Global Accelerator for multi-region deployment

# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-dns"
  })
}

# CloudFront Distribution for CDN
resource "aws_cloudfront_distribution" "cdn" {
  count = var.enable_cdn ? 1 : 0

  origin {
    domain_name = var.alb_dns_name
    origin_id   = "alb-origin"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} CDN distribution"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb-origin"

    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "cdn"
  })
}

# AWS Global Accelerator
resource "aws_globalaccelerator_accelerator" "main" {
  count = var.enable_accelerator ? 1 : 0

  name            = "${var.project_name}-global-accelerator"
  ip_address_type = "IPV4"
  enabled         = true

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-accelerator"
  })
}

resource "aws_globalaccelerator_listener" "main" {
  count = var.enable_accelerator ? 1 : 0

  accelerator_arn = aws_globalaccelerator_accelerator.main[0].id
  client_affinity = "NONE"
  protocol        = "TCP"

  port_range {
    from_port = 80
    to_port   = 80
  }

  port_range {
    from_port = 443
    to_port   = 443
  }
}

# Regional endpoint groups for Global Accelerator
resource "aws_globalaccelerator_endpoint_group" "regions" {
  for_each = { for region in var.regions : region => region }

  listener_arn = aws_globalaccelerator_listener.main[0].id
  endpoint_group_region = each.value

  endpoint_configuration {
    endpoint_id = var.alb_arns[each.value]
    weight      = 100
  }

  health_check_path            = "/health"
  health_check_port            = 8080
  health_check_protocol        = "HTTP"
  health_check_interval_seconds = 30
  health_check_timeout_seconds = 5
  health_check_threshold_count = 3

  traffic_dial_percentage = 100
}

# Route53 Records for each region
resource "aws_route53_record" "regional" {
  for_each = { for region in var.regions : region => region }

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value == "us-east-1" ? var.domain_name : "${each.value}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_names[each.value]
    zone_id                = var.alb_zone_ids[each.value]
    evaluate_target_health = true
  }
}

# Route53 Records for CloudFront
resource "aws_route53_record" "cdn" {
  count = var.enable_cdn ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = "cdn.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn[0].domain_name
    zone_id                = aws_cloudfront_distribution.cdn[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 Records for Global Accelerator
resource "aws_route53_record" "accelerator" {
  count = var.enable_accelerator ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = "global.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_globalaccelerator_accelerator.main[0].dns_name
    zone_id                = aws_globalaccelerator_accelerator.main[0].hosted_zone_id
    evaluate_target_health = true
  }
}

# Health checks for each region
resource "aws_route53_health_check" "regional" {
  for_each = { for region in var.regions : region => region }

  fqdn              = "${each.value == "us-east-1" ? "" : each.value "."}${var.domain_name}"
  port              = 8080
  type              = "HTTP"
  resource_path     = "/health"
  request_interval  = 30
  failure_threshold = 3

  tags = merge(var.tags, {
    "kaldrix.io/region" = each.value
    "kaldrix.io/purpose" = "health-check"
  })
}

# DNS Failover records
resource "aws_route53_record" "failover" {
  for_each = { for region in var.regions : region => region }

  zone_id = aws_route53_zone.main.zone_id
  name    = "failover-${each.value}.${var.domain_name}"
  type    = "A"
  ttl     = 60

  alias {
    name                   = var.alb_dns_names[each.value]
    zone_id                = var.alb_zone_ids[each.value]
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = each.value == var.primary_region ? "PRIMARY" : "SECONDARY"
  }

  set_identifier = each.value

  health_check_id = aws_route53_health_check.regional[each.value].id
}

# Geo-location routing records
resource "aws_route53_record" "geo" {
  for_each = { for region in var.regions : region => region }

  zone_id = aws_route53_zone.main.zone_id
  name    = "geo.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_names[each.value]
    zone_id                = var.alb_zone_ids[each.value]
    evaluate_target_health = true
  }

  geolocation_routing_policy {
    continent = each.value == "us-east-1" ? "NA" : 
                each.value == "us-west-2" ? "NA" : 
                each.value == "eu-west-1" ? "EU" : 
                "default"
  }

  set_identifier = each.value
}

# Latency-based routing records
resource "aws_route53_record" "latency" {
  for_each = { for region in var.regions : region => region }

  zone_id = aws_route53_zone.main.zone_id
  name    = "latency.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_names[each.value]
    zone_id                = var.alb_zone_ids[each.value]
    evaluate_target_health = true
  }

  latency_routing_policy {
    region = each.value
  }

  set_identifier = each.value
}

# Weighted routing records
resource "aws_route53_record" "weighted" {
  for_each = { for region in var.regions : region => region }

  zone_id = aws_route53_zone.main.zone_id
  name    = "weighted.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_names[each.value]
    zone_id                = var.alb_zone_ids[each.value]
    evaluate_target_health = true
  }

  weighted_routing_policy {
    weight = each.value == var.primary_region ? 70 : 15
  }

  set_identifier = each.value
}

# WAF Web ACL for CloudFront
resource "aws_wafv2_web_acl" "cloudfront" {
  count = var.enable_cdn ? 1 : 0

  name  = "${var.project_name}-cloudfront-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "CloudFrontWebACL"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "waf"
  })
}

# CloudFront WAF Association
resource "aws_wafv2_web_acl_association" "cloudfront" {
  count = var.enable_cdn ? 1 : 0

  resource_arn = aws_cloudfront_distribution.cdn[0].arn
  web_acl_arn  = aws_wafv2_web_acl.cloudfront[0].arn
}