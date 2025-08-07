# KALDRIX Blockchain - CloudWatch Module Outputs

output "cloudwatch_log_group_arn" {
  description = "CloudWatch log group ARN"
  value       = length(var.log_groups) > 0 ? aws_cloudwatch_log_group.this[0].arn : ""
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  value       = length(var.log_groups) > 0 ? aws_cloudwatch_log_group.this[0].name : ""
}

output "cloudwatch_metric_stream_arn" {
  description = "CloudWatch metric stream ARN"
  value       = length(var.metric_streams) > 0 ? aws_cloudwatch_metric_stream.this[0].arn : ""
}

output "cloudwatch_metric_stream_name" {
  description = "CloudWatch metric stream name"
  value       = length(var.metric_streams) > 0 ? aws_cloudwatch_metric_stream.this[0].name : ""
}

output "cloudwatch_dashboard_arn" {
  description = "CloudWatch dashboard ARN"
  value       = length(var.dashboards) > 0 ? aws_cloudwatch_dashboard.this[0].dashboard_arn : ""
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = length(var.dashboards) > 0 ? aws_cloudwatch_dashboard.this[0].dashboard_name : ""
}

output "cloudwatch_alarms" {
  description = "CloudWatch alarms"
  value = {
    for key, alarm in aws_cloudwatch_metric_alarm.this : key => {
      arn              = alarm.arn
      alarm_name       = alarm.alarm_name
      alarm_description = alarm.alarm_description
      comparison_operator = alarm.comparison_operator
      evaluation_periods = alarm.evaluation_periods
      metric_name      = alarm.metric_name
      namespace        = alarm.namespace
      period           = alarm.period
      statistic        = alarm.statistic
      threshold        = alarm.threshold
      dimensions       = alarm.dimensions
      alarm_actions    = alarm.alarm_actions
      ok_actions       = alarm.ok_actions
      insufficient_data_actions = alarm.insufficient_data_actions
      treat_missing_data = alarm.treat_missing_data
    }
  }
}

output "cloudwatch_composite_alarms" {
  description = "CloudWatch composite alarms"
  value = length(var.composite_alarms) > 0 ? {
    arn              = aws_cloudwatch_composite_alarm.this[0].arn
    alarm_name       = aws_cloudwatch_composite_alarm.this[0].alarm_name
    alarm_description = aws_cloudwatch_composite_alarm.this[0].alarm_description
    alarm_rule       = aws_cloudwatch_composite_alarm.this[0].alarm_rule
    alarm_actions    = aws_cloudwatch_composite_alarm.this[0].alarm_actions
    ok_actions       = aws_cloudwatch_composite_alarm.this[0].ok_actions
    insufficient_data_actions = aws_cloudwatch_composite_alarm.this[0].insufficient_data_actions
  } : {}
}

output "cloudwatch_anomaly_detectors" {
  description = "CloudWatch anomaly detectors"
  value = length(var.anomaly_detectors) > 0 ? {
    arn          = aws_cloudwatch_anomaly_detector.this[0].arn
    name         = aws_cloudwatch_anomaly_detector.this[0].name
    metric_name  = aws_cloudwatch_anomaly_detector.this[0].metric_name
    namespace    = aws_cloudwatch_anomaly_detector.this[0].namespace
    stat         = aws_cloudwatch_anomaly_detector.this[0].stat
    dimensions   = aws_cloudwatch_anomaly_detector.this[0].dimensions
    configuration = aws_cloudwatch_anomaly_detector.this[0].configuration
  } : {}
}

output "cloudwatch_metric_math_alarms" {
  description = "CloudWatch metric math alarms"
  value = {
    for key, alarm in aws_cloudwatch_metric_alarm.metric_math : key => {
      arn              = alarm.arn
      alarm_name       = alarm.alarm_name
      alarm_description = alarm.alarm_description
      comparison_operator = alarm.comparison_operator
      evaluation_periods = alarm.evaluation_periods
      period           = alarm.period
      threshold        = alarm.threshold
      metric_query     = alarm.metric_query
      alarm_actions    = alarm.alarm_actions
      ok_actions       = alarm.ok_actions
      insufficient_data_actions = alarm.insufficient_data_actions
      treat_missing_data = alarm.treat_missing_data
    }
  }
}

output "cloudwatch_log_metric_filters" {
  description = "CloudWatch log metric filters"
  value = length(var.log_metric_filters) > 0 ? {
    name           = aws_cloudwatch_log_metric_filter.this[0].name
    pattern        = aws_cloudwatch_log_metric_filter.this[0].pattern
    log_group_name = aws_cloudwatch_log_metric_filter.this[0].log_group_name
    metric_transformation = aws_cloudwatch_log_metric_filter.this[0].metric_transformation
  } : {}
}

output "cloudwatch_log_subscription_filters" {
  description = "CloudWatch log subscription filters"
  value = length(var.log_subscription_filters) > 0 ? {
    name            = aws_cloudwatch_log_subscription_filter.this[0].name
    log_group_name  = aws_cloudwatch_log_subscription_filter.this[0].log_group_name
    filter_pattern  = aws_cloudwatch_log_subscription_filter.this[0].filter_pattern
    destination_arn = aws_cloudwatch_log_subscription_filter.this[0].destination_arn
    distribution    = aws_cloudwatch_log_subscription_filter.this[0].distribution
  } : {}
}

output "cloudwatch_contributor_insight_rules" {
  description = "CloudWatch contributor insight rules"
  value = length(var.contributor_insight_rules) > 0 ? {
    arn            = aws_cloudwatch_contributor_insight_rule.this[0].arn
    name           = aws_cloudwatch_contributor_insight_rule.this[0].name
    rule_definition = aws_cloudwatch_contributor_insight_rule.this[0].rule_definition
  } : {}
}

output "cloudwatch_event_rules" {
  description = "CloudWatch event rules"
  value = length(var.event_rules) > 0 ? {
    arn               = aws_cloudwatch_event_rule.this[0].arn
    name              = aws_cloudwatch_event_rule.this[0].name
    description       = aws_cloudwatch_event_rule.this[0].description
    schedule_expression = aws_cloudwatch_event_rule.this[0].schedule_expression
    event_pattern     = aws_cloudwatch_event_rule.this[0].event_pattern
    state             = aws_cloudwatch_event_rule.this[0].state
  } : {}
}

output "cloudwatch_event_targets" {
  description = "CloudWatch event targets"
  value = length(var.event_targets) > 0 ? {
    arn             = aws_cloudwatch_event_target.this[0].arn
    rule            = aws_cloudwatch_event_target.this[0].rule
    target_id       = aws_cloudwatch_event_target.this[0].target_id
    input           = aws_cloudwatch_event_target.this[0].input
    input_transformer = aws_cloudwatch_event_target.this[0].input_transformer
    run_command_targets = aws_cloudwatch_event_target.this[0].run_command_targets
  } : {}
}

output "cloudwatch_synthetics_canaries" {
  description = "CloudWatch synthetics canaries"
  value = length(var.synthetics_canaries) > 0 ? {
    arn                 = aws_synthetics_canary.this[0].arn
    name                = aws_synthetics_canary.this[0].name
    artifact_s3_location = aws_synthetics_canary.this[0].artifact_s3_location
    execution_role_arn   = aws_synthetics_canary.this[0].execution_role_arn
    handler             = aws_synthetics_canary.this[0].handler
    runtime_version     = aws_synthetics_canary.this[0].runtime_version
    schedule            = aws_synthetics_canary.this[0].schedule
    run_config          = aws_synthetics_canary.this[0].run_config
    artifact_config     = aws_synthetics_canary.this[0].artifact_config
    vpc_config          = aws_synthetics_canary.this[0].vpc_config
    start_canary        = aws_synthetics_canary.this[0].start_canary
  } : {}
}

output "cloudwatch_summary" {
  description = "CloudWatch summary"
  value = {
    log_group = length(var.log_groups) > 0 ? {
      arn          = aws_cloudwatch_log_group.this[0].arn
      name         = aws_cloudwatch_log_group.this[0].name
      retention    = aws_cloudwatch_log_group.this[0].retention_in_days
      kms_key_id   = aws_cloudwatch_log_group.this[0].kms_key_id
    } : null
    metric_stream = length(var.metric_streams) > 0 ? {
      arn           = aws_cloudwatch_metric_stream.this[0].arn
      name          = aws_cloudwatch_metric_stream.this[0].name
      role_arn      = aws_cloudwatch_metric_stream.this[0].role_arn
      firehose_arn  = aws_cloudwatch_metric_stream.this[0].firehose_arn
      output_format = aws_cloudwatch_metric_stream.this[0].output_format
    } : null
    dashboard = length(var.dashboards) > 0 ? {
      arn            = aws_cloudwatch_dashboard.this[0].dashboard_arn
      name           = aws_cloudwatch_dashboard.this[0].dashboard_name
      dashboard_body = aws_cloudwatch_dashboard.this[0].dashboard_body
    } : null
    alarms = aws_cloudwatch_metric_alarm.this
    composite_alarms = length(var.composite_alarms) > 0 ? {
      arn              = aws_cloudwatch_composite_alarm.this[0].arn
      name             = aws_cloudwatch_composite_alarm.this[0].alarm_name
      description      = aws_cloudwatch_composite_alarm.this[0].alarm_description
      alarm_rule       = aws_cloudwatch_composite_alarm.this[0].alarm_rule
    } : null
    anomaly_detector = length(var.anomaly_detectors) > 0 ? {
      arn          = aws_cloudwatch_anomaly_detector.this[0].arn
      name         = aws_cloudwatch_anomaly_detector.this[0].name
      metric_name  = aws_cloudwatch_anomaly_detector.this[0].metric_name
      namespace    = aws_cloudwatch_anomaly_detector.this[0].namespace
      stat         = aws_cloudwatch_anomaly_detector.this[0].stat
    } : null
    metric_math_alarms = aws_cloudwatch_metric_alarm.metric_math
    log_metric_filter = length(var.log_metric_filters) > 0 ? {
      name           = aws_cloudwatch_log_metric_filter.this[0].name
      pattern        = aws_cloudwatch_log_metric_filter.this[0].pattern
      log_group_name = aws_cloudwatch_log_metric_filter.this[0].log_group_name
    } : null
    log_subscription_filter = length(var.log_subscription_filters) > 0 ? {
      name            = aws_cloudwatch_log_subscription_filter.this[0].name
      log_group_name  = aws_cloudwatch_log_subscription_filter.this[0].log_group_name
      filter_pattern  = aws_cloudwatch_log_subscription_filter.this[0].filter_pattern
      destination_arn = aws_cloudwatch_log_subscription_filter.this[0].destination_arn
    } : null
    contributor_insight_rule = length(var.contributor_insight_rules) > 0 ? {
      arn             = aws_cloudwatch_contributor_insight_rule.this[0].arn
      name            = aws_cloudwatch_contributor_insight_rule.this[0].name
      rule_definition = aws_cloudwatch_contributor_insight_rule.this[0].rule_definition
    } : null
    event_rule = length(var.event_rules) > 0 ? {
      arn               = aws_cloudwatch_event_rule.this[0].arn
      name              = aws_cloudwatch_event_rule.this[0].name
      description       = aws_cloudwatch_event_rule.this[0].description
      schedule_expression = aws_cloudwatch_event_rule.this[0].schedule_expression
      event_pattern     = aws_cloudwatch_event_rule.this[0].event_pattern
      state             = aws_cloudwatch_event_rule.this[0].state
    } : null
    event_target = length(var.event_targets) > 0 ? {
      arn             = aws_cloudwatch_event_target.this[0].arn
      rule            = aws_cloudwatch_event_target.this[0].rule
      target_id       = aws_cloudwatch_event_target.this[0].target_id
      input           = aws_cloudwatch_event_target.this[0].input
    } : null
    synthetics_canary = length(var.synthetics_canaries) > 0 ? {
      arn                 = aws_synthetics_canary.this[0].arn
      name                = aws_synthetics_canary.this[0].name
      artifact_s3_location = aws_synthetics_canary.this[0].artifact_s3_location
      execution_role_arn   = aws_synthetics_canary.this[0].execution_role_arn
      handler             = aws_synthetics_canary.this[0].handler
      runtime_version     = aws_synthetics_canary.this[0].runtime_version
      schedule            = aws_synthetics_canary.this[0].schedule
      start_canary        = aws_synthetics_canary.this[0].start_canary
    } : null
  }
}