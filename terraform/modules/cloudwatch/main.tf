# KALDRIX Blockchain - CloudWatch Module

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Create CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "this" {
  count = length(var.log_groups) > 0 ? 1 : 0
  
  name              = var.log_groups[0].name
  retention_in_days = var.log_groups[0].retention_in_days
  kms_key_id        = var.log_groups[0].kms_key_id
  
  tags = merge(
    {
      Name = var.log_groups[0].name
    },
    var.tags
  )
}

# Create CloudWatch Metric Streams
resource "aws_cloudwatch_metric_stream" "this" {
  count = length(var.metric_streams) > 0 ? 1 : 0
  
  name          = var.metric_streams[0].name
  role_arn      = var.metric_streams[0].role_arn
  firehose_arn  = var.metric_streams[0].firehose_arn
  output_format = var.metric_streams[0].output_format
  
  dynamic "include_filter" {
    for_each = var.metric_streams[0].include_filters
    content {
      namespace = include_filter.value.namespace
    }
  }
  
  dynamic "exclude_filter" {
    for_each = var.metric_streams[0].exclude_filters
    content {
      namespace = exclude_filter.value.namespace
    }
  }
  
  tags = merge(
    {
      Name = var.metric_streams[0].name
    },
    var.tags
  )
}

# Create CloudWatch Dashboards
resource "aws_cloudwatch_dashboard" "this" {
  count = length(var.dashboards) > 0 ? 1 : 0
  
  dashboard_name = var.dashboards[0].name
  dashboard_body = var.dashboards[0].dashboard_body
}

# Create CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "this" {
  for_each = var.alarms
  
  alarm_name          = "${var.alarm_prefix}-${each.key}"
  alarm_description   = each.value.description
  comparison_operator = each.value.comparison
  evaluation_periods  = each.value.evaluation_periods
  metric_name         = each.value.metric_name
  namespace           = each.value.namespace
  period              = each.value.period
  statistic           = each.value.statistic
  threshold           = each.value.threshold
  
  dynamic "dimensions" {
    for_each = each.value.dimensions != null ? [each.value.dimensions] : []
    content {
      for pair in dimensions.value {
        name  = pair.name
        value = pair.value
      }
    }
  }
  
  alarm_actions         = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  ok_actions           = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  insufficient_data_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  
  treat_missing_data    = each.value.treat_missing_data
  
  tags = merge(
    {
      Name = "${var.alarm_prefix}-${each.key}"
    },
    var.tags
  )
}

# Create CloudWatch Composite Alarms
resource "aws_cloudwatch_composite_alarm" "this" {
  count = length(var.composite_alarms) > 0 ? 1 : 0
  
  alarm_name          = var.composite_alarms[0].name
  alarm_description   = var.composite_alarms[0].description
  alarm_rule         = var.composite_alarms[0].alarm_rule
  
  alarm_actions         = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  ok_actions           = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  insufficient_data_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  
  tags = merge(
    {
      Name = var.composite_alarms[0].name
    },
    var.tags
  )
}

# Create CloudWatch Anomaly Detectors
resource "aws_cloudwatch_anomaly_detector" "this" {
  count = length(var.anomaly_detectors) > 0 ? 1 : 0
  
  metric_name = var.anomaly_detectors[0].metric_name
  namespace   = var.anomaly_detectors[0].namespace
  stat       = var.anomaly_detectors[0].stat
  
  dynamic "dimensions" {
    for_each = var.anomaly_detectors[0].dimensions != null ? [var.anomaly_detectors[0].dimensions] : []
    content {
      for pair in dimensions.value {
        name  = pair.name
        value = pair.value
      }
    }
  }
  
  configuration {
    excluded_time_ranges = var.anomaly_detectors[0].configuration.excluded_time_ranges
    metric_timezone       = var.anomaly_detectors[0].configuration.metric_timezone
  }
  
  tags = merge(
    {
      Name = var.anomaly_detectors[0].name
    },
    var.tags
  )
}

# Create CloudWatch Metric Math Alarms
resource "aws_cloudwatch_metric_alarm" "metric_math" {
  for_each = var.metric_math_alarms
  
  alarm_name          = "${var.alarm_prefix}-${each.key}-math"
  alarm_description   = each.value.description
  comparison_operator = each.value.comparison
  evaluation_periods  = each.value.evaluation_periods
  period              = each.value.period
  threshold           = each.value.threshold
  
  metric_query {
    id          = "m1"
    expression  = each.value.expression
    label       = each.value.label
    return_data = true
  }
  
  alarm_actions         = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  ok_actions           = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  insufficient_data_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  
  treat_missing_data    = each.value.treat_missing_data
  
  tags = merge(
    {
      Name = "${var.alarm_prefix}-${each.key}-math"
    },
    var.tags
  )
}

# Create CloudWatch Logs Metric Filters
resource "aws_cloudwatch_log_metric_filter" "this" {
  count = length(var.log_metric_filters) > 0 ? 1 : 0
  
  name           = var.log_metric_filters[0].name
  pattern        = var.log_metric_filters[0].pattern
  log_group_name = var.log_metric_filters[0].log_group_name
  
  metric_transformation {
    name      = var.log_metric_filters[0].metric_transformation.name
    namespace = var.log_metric_filters[0].metric_transformation.namespace
    value     = var.log_metric_filters[0].metric_transformation.value
    default_value = var.log_metric_filters[0].metric_transformation.default_value
  }
}

# Create CloudWatch Logs Subscription Filters
resource "aws_cloudwatch_log_subscription_filter" "this" {
  count = length(var.log_subscription_filters) > 0 ? 1 : 0
  
  name            = var.log_subscription_filters[0].name
  log_group_name  = var.log_subscription_filters[0].log_group_name
  filter_pattern  = var.log_subscription_filters[0].filter_pattern
  destination_arn = var.log_subscription_filters[0].destination_arn
  
  distribution    = var.log_subscription_filters[0].distribution
}

# Create CloudWatch Contributor Insights Rules
resource "aws_cloudwatch_contributor_insight_rule" "this" {
  count = length(var.contributor_insight_rules) > 0 ? 1 : 0
  
  name        = var.contributor_insight_rules[0].name
  rule_definition = jsonencode(var.contributor_insight_rules[0].rule_definition)
  
  tags = merge(
    {
      Name = var.contributor_insight_rules[0].name
    },
    var.tags
  )
}

# Create CloudWatch Event Rules
resource "aws_cloudwatch_event_rule" "this" {
  count = length(var.event_rules) > 0 ? 1 : 0
  
  name        = var.event_rules[0].name
  description = var.event_rules[0].description
  
  schedule_expression = var.event_rules[0].schedule_expression
  event_pattern      = var.event_rules[0].event_pattern
  
  state       = var.event_rules[0].state
  
  tags = merge(
    {
      Name = var.event_rules[0].name
    },
    var.tags
  )
}

# Create CloudWatch Event Targets
resource "aws_cloudwatch_event_target" "this" {
  count = length(var.event_targets) > 0 ? 1 : 0
  
  rule      = var.event_targets[0].rule
  target_id = var.event_targets[0].target_id
  arn       = var.event_targets[0].arn
  
  dynamic "input" {
    for_each = var.event_targets[0].input != null ? [var.event_targets[0].input] : []
    content {
      input = input.value
    }
  }
  
  dynamic "input_transformer" {
    for_each = var.event_targets[0].input_transformer != null ? [var.event_targets[0].input_transformer] : []
    content {
      input_template = input_transformer.value.input_template
      
      dynamic "input_paths" {
        for_each = input_transformer.value.input_paths != null ? input_transformer.value.input_paths : []
        content {
          path      = input_paths.value.path
          value     = input_paths.value.value
        }
      }
    }
  }
  
  dynamic "run_command_targets" {
    for_each = var.event_targets[0].run_command_targets != null ? var.event_targets[0].run_command_targets : []
    content {
      key    = run_command_targets.value.key
      values = run_command_targets.value.values
    }
  }
}

# Create CloudWatch Synthetics Canaries
resource "aws_synthetics_canary" "this" {
  count = length(var.synthetics_canaries) > 0 ? 1 : 0
  
  name                 = var.synthetics_canaries[0].name
  artifact_s3_location = var.synthetics_canaries[0].artifact_s3_location
  execution_role_arn   = var.synthetics_canaries[0].execution_role_arn
  handler             = var.synthetics_canaries[0].handler
  zip_file            = var.synthetics_canaries[0].zip_file
  runtime_version     = var.synthetics_canaries[0].runtime_version
  
  schedule {
    expression = var.synthetics_canaries[0].schedule.expression
  }
  
  dynamic "run_config" {
    for_each = var.synthetics_canaries[0].run_config != null ? [var.synthetics_canaries[0].run_config] : []
    content {
      timeout_in_seconds   = run_config.value.timeout_in_seconds
      memory_in_mb         = run_config.value.memory_in_mb
      active_tracing       = run_config.value.active_tracing
    }
  }
  
  dynamic "artifact_config" {
    for_each = var.synthetics_canaries[0].artifact_config != null ? [var.synthetics_canaries[0].artifact_config] : []
    content {
      s3_encryption_enabled = artifact_config.value.s3_encryption_enabled
    }
  }
  
  dynamic "vpc_config" {
    for_each = var.synthetics_canaries[0].vpc_config != null ? [var.synthetics_canaries[0].vpc_config] : []
    content {
      subnet_ids         = vpc_config.value.subnet_ids
      security_group_ids = vpc_config.value.security_group_ids
    }
  }
  
  start_canary = var.synthetics_canaries[0].start_canary
  
  tags = merge(
    {
      Name = var.synthetics_canaries[0].name
    },
    var.tags
  )
}