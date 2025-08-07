variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnets" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "internal" {
  description = "Whether the load balancer is internal"
  type        = bool
  default     = false
}

variable "load_balancer_type" {
  description = "Type of load balancer"
  type        = string
  default     = "application"
}

variable "security_groups" {
  description = "List of security group IDs"
  type        = list(string)
  default     = []
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "idle_timeout" {
  description = "Idle timeout in seconds"
  type        = number
  default     = 60
}

variable "access_logs_enabled" {
  description = "Enable access logs"
  type        = bool
  default     = true
}

variable "access_logs_bucket" {
  description = "S3 bucket for access logs"
  type        = string
  default     = ""
}

variable "access_logs_prefix" {
  description = "Prefix for access logs"
  type        = string
  default     = ""
}

variable "http_port" {
  description = "HTTP port"
  type        = number
  default     = 80
}

variable "https_port" {
  description = "HTTPS port"
  type        = number
  default     = 443
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = ""
}

variable "target_groups" {
  description = "Map of target group configurations"
  type        = map(any)
  default     = {}
}

variable "listeners" {
  description = "Map of listener configurations"
  type        = map(any)
  default     = {}
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}

resource "aws_lb" "this" {
  name               = "${var.environment}-alb"
  internal           = var.internal
  load_balancer_type = var.load_balancer_type
  security_groups    = length(var.security_groups) > 0 ? var.security_groups : [aws_security_group.this[0].id]
  subnets            = var.subnets

  enable_deletion_protection = var.enable_deletion_protection
  idle_timeout               = var.idle_timeout

  dynamic "access_logs" {
    for_each = var.access_logs_enabled ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.access_logs_prefix
      enabled = true
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-alb"
    Environment = var.environment
  })
}

resource "aws_security_group" "this" {
  count       = length(var.security_groups) > 0 ? 0 : 1
  name        = "${var.environment}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = var.http_port
    to_port     = var.http_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = var.https_port
    to_port     = var.https_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-alb-sg"
    Environment = var.environment
  })
}

resource "aws_lb_target_group" "this" {
  for_each = var.target_groups

  name        = "${var.environment}-${each.key}-tg"
  port        = each.value.port
  protocol    = each.value.protocol
  vpc_id      = var.vpc_id
  target_type = each.value.target_type

  health_check {
    enabled             = each.value.health_check.enabled
    healthy_threshold   = each.value.health_check.healthy_threshold
    unhealthy_threshold = each.value.health_check.unhealthy_threshold
    timeout             = each.value.health_check.timeout
    interval            = each.value.health_check.interval
    path                = each.value.health_check.path
    port                = each.value.health_check.port
    matcher             = each.value.health_check.matcher
  }

  stickiness {
    enabled         = each.value.stickiness.enabled
    type           = each.value.stickiness.type
    cookie_duration = each.value.stickiness.cookie_duration
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-${each.key}-tg"
    Environment = var.environment
  })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = var.http_port
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "404 Not Found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener" "https" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.this.arn
  port              = var.https_port
  protocol          = "HTTPS"
  certificate_arn   = var.certificate_arn

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "404 Not Found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "this" {
  for_each = var.listeners

  listener_arn = each.value.protocol == "HTTP" ? aws_lb_listener.http.arn : aws_lb_listener.https[0].arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this[each.value.target_group_key].arn
  }

  condition {
    path_pattern {
      values = each.value.conditions.path_patterns
    }
  }

  dynamic "condition" {
    for_each = each.value.conditions.host_headers != null ? [1] : []
    content {
      host_header {
        values = each.value.conditions.host_headers
      }
    }
  }
}

resource "aws_wafv2_web_acl" "this" {
  name        = "${var.environment}-alb-waf"
  description = "WAF for ALB"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.environment}-alb-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-alb-waf"
    Environment = var.environment
  })
}

resource "aws_wafv2_web_acl_association" "this" {
  resource_arn = aws_lb.this.arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}

resource "aws_cloudwatch_metric_alarm" "target_response_time" {
  alarm_name          = "${var.environment}-alb-target-response-time"
  alarm_description   = "ALB target response time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_actions       = []

  dimensions = {
    LoadBalancer = aws_lb.this.arn_suffix
    TargetGroup  = aws_lb_target_group.this[keys(var.target_groups)[0]].arn_suffix
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-alb-target-response-time"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_metric_alarm" "http_code_target_5xx" {
  alarm_name          = "${var.environment}-alb-http-code-target-5xx"
  alarm_description   = "ALB HTTP 5XX errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_actions       = []

  dimensions = {
    LoadBalancer = aws_lb.this.arn_suffix
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-alb-http-code-target-5xx"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_metric_alarm" "request_count" {
  alarm_name          = "${var.environment}-alb-request-count"
  alarm_description   = "ALB request count"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_actions       = []

  dimensions = {
    LoadBalancer = aws_lb.this.arn_suffix
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-alb-request-count"
    Environment = var.environment
  })
}