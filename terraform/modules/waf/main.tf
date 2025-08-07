# KALDRIX Blockchain - WAF Module

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Create WAFv2 Web ACL
resource "aws_wafv2_web_acl" "this" {
  name        = var.name
  description = var.description
  scope       = var.scope
  
  default_action {
    allow {}
  }
  
  dynamic "rule" {
    for_each = var.rules
    content {
      name     = rule.value.name
      priority = rule.value.priority
      
      dynamic "override_action" {
        for_each = rule.value.override_action != null ? [1] : []
        content {
          count = rule.value.override_action.count
        }
      }
      
      dynamic "statement" {
        for_each = [1]
        content {
          dynamic "managed_rule_group_statement" {
            for_each = rule.value.statement.managed_rule_group_statement != null ? [1] : []
            content {
              name        = rule.value.statement.managed_rule_group_statement.name
              vendor_name = rule.value.statement.managed_rule_group_statement.vendor_name
              
              dynamic "excluded_rule" {
                for_each = rule.value.statement.managed_rule_group_statement.excluded_rules != null ? rule.value.statement.managed_rule_group_statement.excluded_rules : []
                content {
                  name = excluded_rule.value.name
                }
              }
              
              dynamic "scope_down_statement" {
                for_each = rule.value.statement.managed_rule_group_statement.scope_down_statement != null ? [1] : []
                content {
                  dynamic "byte_match_statement" {
                    for_each = rule.value.statement.managed_rule_group_statement.scope_down_statement.byte_match_statement != null ? [1] : []
                    content {
                      field_to_match {
                        dynamic "single_header" {
                          for_each = rule.value.statement.managed_rule_group_statement.scope_down_statement.byte_match_statement.field_to_match.single_header != null ? [1] : []
                          content {
                            name = rule.value.statement.managed_rule_group_statement.scope_down_statement.byte_match_statement.field_to_match.single_header.name
                          }
                        }
                      }
                      
                      positional_constraint = rule.value.statement.managed_rule_group_statement.scope_down_statement.byte_match_statement.positional_constraint
                      text_transformation   = rule.value.statement.managed_rule_group_statement.scope_down_statement.byte_match_statement.text_transformation
                      search_string         = rule.value.statement.managed_rule_group_statement.scope_down_statement.byte_match_statement.search_string
                    }
                  }
                }
              }
            }
          }
          
          dynamic "rate_based_statement" {
            for_each = rule.value.statement.rate_based_statement != null ? [1] : []
            content {
              limit              = rule.value.statement.rate_based_statement.limit
              aggregate_key_type = rule.value.statement.rate_based_statement.aggregate_key_type
              
              dynamic "scope_down_statement" {
                for_each = rule.value.statement.rate_based_statement.scope_down_statement != null ? [1] : []
                content {
                  dynamic "byte_match_statement" {
                    for_each = rule.value.statement.rate_based_statement.scope_down_statement.byte_match_statement != null ? [1] : []
                    content {
                      field_to_match {
                        dynamic "single_header" {
                          for_each = rule.value.statement.rate_based_statement.scope_down_statement.byte_match_statement.field_to_match.single_header != null ? [1] : []
                          content {
                            name = rule.value.statement.rate_based_statement.scope_down_statement.byte_match_statement.field_to_match.single_header.name
                          }
                        }
                      }
                      
                      positional_constraint = rule.value.statement.rate_based_statement.scope_down_statement.byte_match_statement.positional_constraint
                      text_transformation   = rule.value.statement.rate_based_statement.scope_down_statement.byte_match_statement.text_transformation
                      search_string         = rule.value.statement.rate_based_statement.scope_down_statement.byte_match_statement.search_string
                    }
                  }
                }
              }
            }
          }
          
          dynamic "ip_set_reference_statement" {
            for_each = rule.value.statement.ip_set_reference_statement != null ? [1] : []
            content {
              arn = rule.value.statement.ip_set_reference_statement.arn
              
              dynamic "ip_set_forwarded_ip_config" {
                for_each = rule.value.statement.ip_set_reference_statement.ip_set_forwarded_ip_config != null ? [1] : []
                content {
                  header_name = rule.value.statement.ip_set_reference_statement.ip_set_forwarded_ip_config.header_name
                  position    = rule.value.statement.ip_set_reference_statement.ip_set_forwarded_ip_config.position
                }
              }
            }
          }
          
          dynamic "regex_pattern_set_reference_statement" {
            for_each = rule.value.statement.regex_pattern_set_reference_statement != null ? [1] : []
            content {
              arn = rule.value.statement.regex_pattern_set_reference_statement.arn
              
              field_to_match {
                dynamic "single_header" {
                  for_each = rule.value.statement.regex_pattern_set_reference_statement.field_to_match.single_header != null ? [1] : []
                  content {
                    name = rule.value.statement.regex_pattern_set_reference_statement.field_to_match.single_header.name
                  }
                }
              }
              
              text_transformation = rule.value.statement.regex_pattern_set_reference_statement.text_transformation
            }
          }
          
          dynamic "byte_match_statement" {
            for_each = rule.value.statement.byte_match_statement != null ? [1] : []
            content {
              field_to_match {
                dynamic "single_header" {
                  for_each = rule.value.statement.byte_match_statement.field_to_match.single_header != null ? [1] : []
                  content {
                    name = rule.value.statement.byte_match_statement.field_to_match.single_header.name
                  }
                }
              }
              
              positional_constraint = rule.value.statement.byte_match_statement.positional_constraint
              text_transformation   = rule.value.statement.byte_match_statement.text_transformation
              search_string         = rule.value.statement.byte_match_statement.search_string
            }
          }
          
          dynamic "sql_injection_match_statement" {
            for_each = rule.value.statement.sql_injection_match_statement != null ? [1] : []
            content {
              field_to_match {
                dynamic "single_header" {
                  for_each = rule.value.statement.sql_injection_match_statement.field_to_match.single_header != null ? [1] : []
                  content {
                    name = rule.value.statement.sql_injection_match_statement.field_to_match.single_header.name
                  }
                }
              }
              
              text_transformation = rule.value.statement.sql_injection_match_statement.text_transformation
            }
          }
          
          dynamic "xss_match_statement" {
            for_each = rule.value.statement.xss_match_statement != null ? [1] : []
            content {
              field_to_match {
                dynamic "single_header" {
                  for_each = rule.value.statement.xss_match_statement.field_to_match.single_header != null ? [1] : []
                  content {
                    name = rule.value.statement.xss_match_statement.field_to_match.single_header.name
                  }
                }
              }
              
              text_transformation = rule.value.statement.xss_match_statement.text_transformation
            }
          }
          
          dynamic "size_constraint_statement" {
            for_each = rule.value.statement.size_constraint_statement != null ? [1] : []
            content {
              field_to_match {
                dynamic "single_header" {
                  for_each = rule.value.statement.size_constraint_statement.field_to_match.single_header != null ? [1] : []
                  content {
                    name = rule.value.statement.size_constraint_statement.field_to_match.single_header.name
                  }
                }
              }
              
              comparison_operator = rule.value.statement.size_constraint_statement.comparison_operator
              size                = rule.value.statement.size_constraint_statement.size
              text_transformation = rule.value.statement.size_constraint_statement.text_transformation
            }
          }
          
          dynamic "geo_match_statement" {
            for_each = rule.value.statement.geo_match_statement != null ? [1] : []
            content {
              country_codes = rule.value.statement.geo_match_statement.country_codes
            }
          }
          
          dynamic "and_statement" {
            for_each = rule.value.statement.and_statement != null ? [1] : []
            content {
              dynamic "statement" {
                for_each = rule.value.statement.and_statement.statements
                content {
                  dynamic "byte_match_statement" {
                    for_each = statement.value.byte_match_statement != null ? [1] : []
                    content {
                      field_to_match {
                        dynamic "single_header" {
                          for_each = statement.value.byte_match_statement.field_to_match.single_header != null ? [1] : []
                          content {
                            name = statement.value.byte_match_statement.field_to_match.single_header.name
                          }
                        }
                      }
                      
                      positional_constraint = statement.value.byte_match_statement.positional_constraint
                      text_transformation   = statement.value.byte_match_statement.text_transformation
                      search_string         = statement.value.byte_match_statement.search_string
                    }
                  }
                }
              }
            }
          }
          
          dynamic "or_statement" {
            for_each = rule.value.statement.or_statement != null ? [1] : []
            content {
              dynamic "statement" {
                for_each = rule.value.statement.or_statement.statements
                content {
                  dynamic "byte_match_statement" {
                    for_each = statement.value.byte_match_statement != null ? [1] : []
                    content {
                      field_to_match {
                        dynamic "single_header" {
                          for_each = statement.value.byte_match_statement.field_to_match.single_header != null ? [1] : []
                          content {
                            name = statement.value.byte_match_statement.field_to_match.single_header.name
                          }
                        }
                      }
                      
                      positional_constraint = statement.value.byte_match_statement.positional_constraint
                      text_transformation   = statement.value.byte_match_statement.text_transformation
                      search_string         = statement.value.byte_match_statement.search_string
                    }
                  }
                }
              }
            }
          }
          
          dynamic "not_statement" {
            for_each = rule.value.statement.not_statement != null ? [1] : []
            content {
              dynamic "statement" {
                for_each = [1]
                content {
                  dynamic "byte_match_statement" {
                    for_each = rule.value.statement.not_statement.statement.byte_match_statement != null ? [1] : []
                    content {
                      field_to_match {
                        dynamic "single_header" {
                          for_each = rule.value.statement.not_statement.statement.byte_match_statement.field_to_match.single_header != null ? [1] : []
                          content {
                            name = rule.value.statement.not_statement.statement.byte_match_statement.field_to_match.single_header.name
                          }
                        }
                      }
                      
                      positional_constraint = rule.value.statement.not_statement.statement.byte_match_statement.positional_constraint
                      text_transformation   = rule.value.statement.not_statement.statement.byte_match_statement.text_transformation
                      search_string         = rule.value.statement.not_statement.statement.byte_match_statement.search_string
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      visibility_config {
        cloudwatch_metrics_enabled = rule.value.visibility_config.cloudwatch_metrics_enabled
        metric_name                = rule.value.visibility_config.metric_name
        sampled_requests_enabled   = rule.value.visibility_config.sampled_requests_enabled
      }
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = var.visibility_config.cloudwatch_metrics_enabled
    metric_name                = var.visibility_config.metric_name
    sampled_requests_enabled   = var.visibility_config.sampled_requests_enabled
  }
  
  tags = merge(
    {
      Name = var.name
    },
    var.tags
  )
}

# Create WAFv2 IP Set
resource "aws_wafv2_ip_set" "this" {
  count = length(var.ip_sets) > 0 ? 1 : 0
  
  name        = var.ip_sets[0].name
  description = var.ip_sets[0].description
  scope       = var.scope
  ip_address_version = var.ip_sets[0].ip_address_version
  
  addresses = var.ip_sets[0].addresses
  
  tags = merge(
    {
      Name = var.ip_sets[0].name
    },
    var.tags
  )
}

# Create WAFv2 Regex Pattern Set
resource "aws_wafv2_regex_pattern_set" "this" {
  count = length(var.regex_pattern_sets) > 0 ? 1 : 0
  
  name        = var.regex_pattern_sets[0].name
  description = var.regex_pattern_sets[0].description
  scope       = var.scope
  
  dynamic "regular_expression" {
    for_each = var.regex_pattern_sets[0].regular_expressions
    content {
      regex_string = regular_expression.value.regex_string
    }
  }
  
  tags = merge(
    {
      Name = var.regex_pattern_sets[0].name
    },
    var.tags
  )
}

# Create WAFv2 Web ACL Association
resource "aws_wafv2_web_acl_association" "this" {
  count = length(var.alb_arn) > 0 ? 1 : 0
  
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}

# Create CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "this" {
  count = var.enable_logging ? 1 : 0
  
  name              = "/aws/wafv2/${var.name}"
  retention_in_days = var.log_retention_days
  
  tags = merge(
    {
      Name = "${var.name}-logs"
    },
    var.tags
  )
}

# Create WAFv2 Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "this" {
  count = var.enable_logging ? 1 : 0
  
  log_destination_configs = [aws_cloudwatch_log_group.this[0].arn]
  resource_arn            = aws_wafv2_web_acl.this.arn
  
  dynamic "logging_filter" {
    for_each = var.logging_filter != null ? [1] : []
    content {
      default_behavior = var.logging_filter.default_behavior
      
      dynamic "filter" {
        for_each = var.logging_filter.filters
        content {
          behavior    = filter.value.behavior
          requirement = filter.value.requirement
          conditions  = filter.value.conditions
        }
      }
    }
  }
}