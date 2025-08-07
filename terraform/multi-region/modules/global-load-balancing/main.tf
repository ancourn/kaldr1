# KALDRIX Global Load Balancing Module
# Handles global load balancing and traffic routing across regions

# Global Application Load Balancer using Route53
resource "aws_route53_record" "global_alb" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.primary_alb_dns_name
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }

  # Latency-based routing for global distribution
  latency_routing_policy {
    region = var.primary_region
  }

  set_identifier = "primary"
}

# Regional ALB records with failover
resource "aws_route53_record" "regional_failover" {
  for_each = { for region in var.regions : region => region }

  zone_id = var.hosted_zone_id
  name    = "alb-${each.value}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_names[each.value]
    zone_id                = var.alb_zone_ids[each.value]
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = each.value == var.primary_region ? "PRIMARY" : "SECONDARY"
  }

  set_identifier = each.value

  health_check_id = var.health_check_ids[each.value]
}

# API Gateway for global API routing
resource "aws_api_gateway_rest_api" "global_api" {
  name        = "${var.project_name}-global-api-${var.environment}"
  description = "Global API Gateway for KALDRIX"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-api"
  })
}

# API Gateway resources and methods
resource "aws_api_gateway_resource" "api_root" {
  rest_api_id = aws_api_gateway_rest_api.global_api.id
  parent_id   = aws_api_gateway_rest_api.global_api.root_resource_id
  path_part   = "v1"
}

resource "aws_api_gateway_resource" "api_health" {
  rest_api_id = aws_api_gateway_rest_api.global_api.id
  parent_id   = aws_api_gateway_resource.api_root.id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.global_api.id
  resource_id   = aws_api_gateway_resource.api_health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_integration" {
  rest_api_id = aws_api_gateway_rest_api.global_api.id
  resource_id = aws_api_gateway_resource.api_health.id
  http_method = aws_api_gateway_method.health_get.http_method

  type = "HTTP_PROXY"
  integration_http_method = "GET"
  uri = "https://${var.primary_alb_dns_name}/health"

  connection_type = "VPC_LINK"
  connection_id   = aws_api_gateway_vpc_link.primary.id
}

# VPC Link for private ALB integration
resource "aws_api_gateway_vpc_link" "primary" {
  name        = "${var.project_name}-primary-vpc-link-${var.environment}"
  description = "VPC Link for primary region ALB"
  target_arns = [var.primary_alb_arn]

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "vpc-link"
  })
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "global_api" {
  rest_api_id = aws_api_gateway_rest_api.global_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api_root.id,
      aws_api_gateway_resource.api_health.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_integration.health_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "global_api" {
  deployment_id = aws_api_gateway_deployment.global_api.id
  rest_api_id   = aws_api_gateway_rest_api.global_api.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId = "$context.requestId"
      ip = "$context.identity.sourceIp"
      caller = "$context.identity.caller"
      user = "$context.identity.user"
      requestTime = "$context.requestTime"
      httpMethod = "$context.httpMethod"
      resourcePath = "$context.resourcePath"
      status = "$context.status"
      protocol = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "api-stage"
  })
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.global_api.name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "api-logs"
  })
}

# API Gateway custom domain
resource "aws_api_gateway_domain_name" "global_api" {
  domain_name = "api.${var.domain_name}"

  regional_certificate_arn = var.acm_certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "api-domain"
  })
}

resource "aws_api_gateway_base_path_mapping" "global_api" {
  api_id      = aws_api_gateway_rest_api.global_api.id
  stage_name  = aws_api_gateway_stage.global_api.stage_name
  domain_name = aws_api_gateway_domain_name.global_api.domain_name
}

# Route53 record for API Gateway
resource "aws_route53_record" "api_gateway" {
  zone_id = var.hosted_zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.global_api.regional_domain_name
    zone_id                = aws_api_gateway_domain_name.global_api.regional_zone_id
    evaluate_target_health = true
  }
}

# Global Network Load Balancer for TCP traffic
resource "aws_lb" "global_nlb" {
  name               = "${var.project_name}-global-nlb-${var.environment}"
  internal           = false
  load_balancer_type = "network"
  subnets            = var.primary_public_subnets

  enable_cross_zone_load_balancing = true

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-nlb"
  })
}

resource "aws_lb_listener" "global_nlb_tcp" {
  load_balancer_arn = aws_lb.global_nlb.arn
  port              = 443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.global_nlb.arn
  }
}

resource "aws_lb_target_group" "global_nlb" {
  name     = "${var.project_name}-global-nlb-tg-${var.environment}"
  port     = 443
  protocol = "TCP"
  vpc_id   = var.primary_vpc_id

  health_check {
    enabled = true
    port    = 8080
    protocol = "HTTP"
    path    = "/health"
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "nlb-target-group"
  })
}

# Regional target groups for global NLB
resource "aws_lb_target_group_attachment" "regional_nlb" {
  for_each = { for region in var.regions : region => region }

  target_group_arn = aws_lb_target_group.global_nlb.arn
  target_id        = var.alb_arns[each.value]
  port             = 443
}

# WAF for API Gateway
resource "aws_wafv2_web_acl" "api_gateway" {
  name  = "${var.project_name}-api-gateway-waf-${var.environment}"
  scope = "REGIONAL"

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

  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "APIGatewayWebACL"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "api-waf"
  })
}

resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = aws_api_gateway_rest_api.global_api.arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway.arn
}

# CloudFront distribution for API
resource "aws_cloudfront_distribution" "api_cdn" {
  origin {
    domain_name = aws_api_gateway_domain_name.global_api.regional_domain_name
    origin_id   = "api-gateway-origin"
    
    custom_origin_config {
      http_port              = 443
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} API CDN distribution"
  price_class         = "PriceClass_100"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-gateway-origin"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.acm_certificate_arn
    ssl_support_method = "sni-only"
  }

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "api-cdn"
  })
}

# Route53 record for API CDN
resource "aws_route53_record" "api_cdn" {
  zone_id = var.hosted_zone_id
  name    = "cdn-api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.api_cdn.domain_name
    zone_id                = aws_cloudfront_distribution.api_cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# Global monitoring for load balancers
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-global-alb-5xx-${var.environment}"
  alarm_description   = "Global ALB 5XX errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  
  dimensions = {
    LoadBalancer = var.primary_alb_arn_suffix
  }
  
  alarm_actions = [var.sns_topic_arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "alb-monitoring"
  })
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "${var.project_name}-global-api-5xx-${var.environment}"
  alarm_description   = "Global API Gateway 5XX errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.global_api.name
  }
  
  alarm_actions = [var.sns_topic_arn]
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "api-monitoring"
  })
}