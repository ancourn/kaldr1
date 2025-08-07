# KALDRIX Blockchain - CloudWatch Module Variables

variable "alarm_prefix" {
  description = "Prefix for alarm names"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = ""
}

variable "log_groups" {
  description = "List of CloudWatch log groups"
  type = list(object({
    name              = string
    retention_in_days = number
    kms_key_id        = string
  }))
  default = []
}

variable "metric_streams" {
  description = "List of CloudWatch metric streams"
  type = list(object({
    name          = string
    role_arn      = string
    firehose_arn  = string
    output_format = string
    include_filters = list(object({
      namespace = string
    }))
    exclude_filters = list(object({
      namespace = string
    }))
  }))
  default = []
}

variable "dashboards" {
  description = "List of CloudWatch dashboards"
  type = list(object({
    name           = string
    dashboard_body = string
  }))
  default = []
}

variable "alarms" {
  description = "Map of CloudWatch alarms"
  type = map(object({
    description        = string
    comparison        = string
    evaluation_periods = number
    metric_name       = string
    namespace         = string
    period            = number
    statistic         = string
    threshold         = number
    dimensions        = list(object({
      name  = string
      value = string
    }))
    treat_missing_data = string
  }))
  default = {}
}

variable "composite_alarms" {
  description = "List of CloudWatch composite alarms"
  type = list(object({
    name          = string
    description   = string
    alarm_rule    = string
  }))
  default = []
}

variable "anomaly_detectors" {
  description = "List of CloudWatch anomaly detectors"
  type = list(object({
    name        = string
    metric_name = string
    namespace   = string
    stat        = string
    dimensions  = list(object({
      name  = string
      value = string
    }))
    configuration = object({
      excluded_time_ranges = list(object({
        start_time = string
        end_time   = string
      }))
      metric_timezone = string
    })
  }))
  default = []
}

variable "metric_math_alarms" {
  description = "Map of CloudWatch metric math alarms"
  type = map(object({
    description        = string
    comparison        = string
    evaluation_periods = number
    period            = number
    threshold         = number
    expression        = string
    label             = string
    treat_missing_data = string
  }))
  default = {}
}

variable "log_metric_filters" {
  description = "List of CloudWatch log metric filters"
  type = list(object({
    name           = string
    pattern        = string
    log_group_name = string
    metric_transformation = object({
      name         = string
      namespace    = string
      value        = string
      default_value = string
    })
  }))
  default = []
}

variable "log_subscription_filters" {
  description = "List of CloudWatch log subscription filters"
  type = list(object({
    name            = string
    log_group_name  = string
    filter_pattern  = string
    destination_arn = string
    distribution    = string
  }))
  default = []
}

variable "contributor_insight_rules" {
  description = "List of CloudWatch contributor insight rules"
  type = list(object({
    name           = string
    rule_definition = map(any)
  }))
  default = []
}

variable "event_rules" {
  description = "List of CloudWatch event rules"
  type = list(object({
    name               = string
    description        = string
    schedule_expression = string
    event_pattern      = string
    state              = string
  }))
  default = []
}

variable "event_targets" {
  description = "List of CloudWatch event targets"
  type = list(object({
    rule      = string
    target_id = string
    arn       = string
    input     = string
    input_transformer = object({
      input_template = string
      input_paths = list(object({
        path  = string
        value = string
      }))
    })
    run_command_targets = list(object({
      key    = string
      values = list(string)
    }))
  }))
  default = []
}

variable "synthetics_canaries" {
  description = "List of CloudWatch synthetics canaries"
  type = list(object({
    name                 = string
    artifact_s3_location = string
    execution_role_arn   = string
    handler             = string
    zip_file            = string
    runtime_version     = string
    schedule = object({
      expression = string
    })
    run_config = object({
      timeout_in_seconds = number
      memory_in_mb       = number
      active_tracing     = bool
    })
    artifact_config = object({
      s3_encryption_enabled = bool
    })
    vpc_config = object({
      subnet_ids         = list(string)
      security_group_ids = list(string)
    })
    start_canary = bool
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}