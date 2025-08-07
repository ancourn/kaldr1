# KALDRIX Blockchain - WAF Module Variables

variable "name" {
  description = "Name of the WAF Web ACL"
  type        = string
}

variable "description" {
  description = "Description of the WAF Web ACL"
  type        = string
  default     = "WAF Web ACL for KALDRIX Blockchain"
}

variable "scope" {
  description = "Scope of the WAF Web ACL"
  type        = string
  default     = "CLOUDFRONT"
}

variable "rules" {
  description = "List of WAF rules"
  type = list(object({
    name     = string
    priority = number
    override_action = object({
      count = string
    })
    statement = object({
      managed_rule_group_statement = object({
        name        = string
        vendor_name = string
        excluded_rules = list(object({
          name = string
        }))
        scope_down_statement = object({
          byte_match_statement = object({
            field_to_match = object({
              single_header = object({
                name = string
              })
            })
            positional_constraint = string
            text_transformation   = string
            search_string         = string
          })
        })
      })
      rate_based_statement = object({
        limit              = number
        aggregate_key_type = string
        scope_down_statement = object({
          byte_match_statement = object({
            field_to_match = object({
              single_header = object({
                name = string
              })
            })
            positional_constraint = string
            text_transformation   = string
            search_string         = string
          })
        })
      })
      ip_set_reference_statement = object({
        arn = string
        ip_set_forwarded_ip_config = object({
          header_name = string
          position    = string
        })
      })
      regex_pattern_set_reference_statement = object({
        arn = string
        field_to_match = object({
          single_header = object({
            name = string
          })
        })
        text_transformation = string
      })
      byte_match_statement = object({
        field_to_match = object({
          single_header = object({
            name = string
          })
        })
        positional_constraint = string
        text_transformation   = string
        search_string         = string
      })
      sql_injection_match_statement = object({
        field_to_match = object({
          single_header = object({
            name = string
          })
        })
        text_transformation = string
      })
      xss_match_statement = object({
        field_to_match = object({
          single_header = object({
            name = string
          })
        })
        text_transformation = string
      })
      size_constraint_statement = object({
        field_to_match = object({
          single_header = object({
            name = string
          })
        })
        comparison_operator = string
        size                = number
        text_transformation = string
      })
      geo_match_statement = object({
        country_codes = list(string)
      })
      and_statement = object({
        statements = list(object({
          byte_match_statement = object({
            field_to_match = object({
              single_header = object({
                name = string
              })
            })
            positional_constraint = string
            text_transformation   = string
            search_string         = string
          })
        }))
      })
      or_statement = object({
        statements = list(object({
          byte_match_statement = object({
            field_to_match = object({
              single_header = object({
                name = string
              })
            })
            positional_constraint = string
            text_transformation   = string
            search_string         = string
          })
        }))
      })
      not_statement = object({
        statement = object({
          byte_match_statement = object({
            field_to_match = object({
              single_header = object({
                name = string
              })
            })
            positional_constraint = string
            text_transformation   = string
            search_string         = string
          })
        })
      })
    })
    visibility_config = object({
      cloudwatch_metrics_enabled = bool
      metric_name                = string
      sampled_requests_enabled   = bool
    })
  }))
  default = []
}

variable "visibility_config" {
  description = "Visibility configuration"
  type = object({
    cloudwatch_metrics_enabled = bool
    metric_name                = string
    sampled_requests_enabled   = bool
  })
  default = {
    cloudwatch_metrics_enabled = true
    metric_name                = "waf-metrics"
    sampled_requests_enabled   = true
  }
}

variable "ip_sets" {
  description = "List of IP sets"
  type = list(object({
    name               = string
    description        = string
    ip_address_version = string
    addresses          = list(string)
  }))
  default = []
}

variable "regex_pattern_sets" {
  description = "List of regex pattern sets"
  type = list(object({
    name              = string
    description       = string
    regular_expressions = list(object({
      regex_string = string
    }))
  }))
  default = []
}

variable "alb_arn" {
  description = "ALB ARN for association"
  type        = string
  default     = ""
}

variable "enable_logging" {
  description = "Enable WAF logging"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 7
}

variable "logging_filter" {
  description = "Logging filter configuration"
  type = object({
    default_behavior = string
    filters = list(object({
      behavior    = string
      requirement = string
      conditions  = list(object({
        action_condition = object({
          action = string
        })
        label_name_condition = object({
          label_name = string
        })
      }))
    }))
  })
  default = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}