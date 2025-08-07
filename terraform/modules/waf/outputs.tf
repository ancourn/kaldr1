# KALDRIX Blockchain - WAF Module Outputs

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.this.arn
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.this.id
}

output "waf_web_acl_name" {
  description = "WAF Web ACL name"
  value       = aws_wafv2_web_acl.this.name
}

output "waf_web_acl_capacity" {
  description = "WAF Web ACL capacity"
  value       = aws_wafv2_web_acl.this.capacity
}

output "waf_web_acl_description" {
  description = "WAF Web ACL description"
  value       = aws_wafv2_web_acl.this.description
}

output "waf_web_acl_scope" {
  description = "WAF Web ACL scope"
  value       = aws_wafv2_web_acl.this.scope
}

output "waf_web_acl_default_action" {
  description = "WAF Web ACL default action"
  value       = aws_wafv2_web_acl.this.default_action
}

output "waf_web_acl_rules" {
  description = "WAF Web ACL rules"
  value       = aws_wafv2_web_acl.this.rules
}

output "waf_web_acl_visibility_config" {
  description = "WAF Web ACL visibility configuration"
  value       = aws_wafv2_web_acl.this.visibility_config
}

output "waf_web_acl_tags" {
  description = "WAF Web ACL tags"
  value       = aws_wafv2_web_acl.this.tags
}

output "waf_web_acl_lock_token" {
  description = "WAF Web ACL lock token"
  value       = aws_wafv2_web_acl.this.lock_token
}

output "ip_set_arn" {
  description = "WAF IP set ARN"
  value       = length(var.ip_sets) > 0 ? aws_wafv2_ip_set.this[0].arn : ""
}

output "ip_set_id" {
  description = "WAF IP set ID"
  value       = length(var.ip_sets) > 0 ? aws_wafv2_ip_set.this[0].id : ""
}

output "ip_set_name" {
  description = "WAF IP set name"
  value       = length(var.ip_sets) > 0 ? aws_wafv2_ip_set.this[0].name : ""
}

output "ip_set_description" {
  description = "WAF IP set description"
  value       = length(var.ip_sets) > 0 ? aws_wafv2_ip_set.this[0].description : ""
}

output "ip_set_scope" {
  description = "WAF IP set scope"
  value       = length(var.ip_sets) > 0 ? aws_wafv2_ip_set.this[0].scope : ""
}

output "ip_set_ip_address_version" {
  description = "WAF IP set IP address version"
  value       = length(var.ip_sets) > 0 ? aws_wafv2_ip_set.this[0].ip_address_version : ""
}

output "ip_set_addresses" {
  description = "WAF IP set addresses"
  value       = length(var.ip_sets) > 0 ? aws_wafv2_ip_set.this[0].addresses : ""
}

output "regex_pattern_set_arn" {
  description = "WAF regex pattern set ARN"
  value       = length(var.regex_pattern_sets) > 0 ? aws_wafv2_regex_pattern_set.this[0].arn : ""
}

output "regex_pattern_set_id" {
  description = "WAF regex pattern set ID"
  value       = length(var.regex_pattern_sets) > 0 ? aws_wafv2_regex_pattern_set.this[0].id : ""
}

output "regex_pattern_set_name" {
  description = "WAF regex pattern set name"
  value       = length(var.regex_pattern_sets) > 0 ? aws_wafv2_regex_pattern_set.this[0].name : ""
}

output "regex_pattern_set_description" {
  description = "WAF regex pattern set description"
  value       = length(var.regex_pattern_sets) > 0 ? aws_wafv2_regex_pattern_set.this[0].description : ""
}

output "regex_pattern_set_scope" {
  description = "WAF regex pattern set scope"
  value       = length(var.regex_pattern_sets) > 0 ? aws_wafv2_regex_pattern_set.this[0].scope : ""
}

output "regex_pattern_set_regular_expressions" {
  description = "WAF regex pattern set regular expressions"
  value       = length(var.regex_pattern_sets) > 0 ? aws_wafv2_regex_pattern_set.this[0].regular_expressions : ""
}

output "web_acl_association_resource_arn" {
  description = "WAF Web ACL association resource ARN"
  value       = length(var.alb_arn) > 0 ? aws_wafv2_web_acl_association.this[0].resource_arn : ""
}

output "web_acl_association_web_acl_arn" {
  description = "WAF Web ACL association Web ACL ARN"
  value       = length(var.alb_arn) > 0 ? aws_wafv2_web_acl_association.this[0].web_acl_arn : ""
}

output "cloudwatch_log_group_arn" {
  description = "CloudWatch log group ARN"
  value       = var.enable_logging ? aws_cloudwatch_log_group.this[0].arn : ""
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  value       = var.enable_logging ? aws_cloudwatch_log_group.this[0].name : ""
}

output "logging_configuration_resource_arn" {
  description = "WAF logging configuration resource ARN"
  value       = var.enable_logging ? aws_wafv2_web_acl_logging_configuration.this[0].resource_arn : ""
}

output "logging_configuration_log_destination_configs" {
  description = "WAF logging configuration log destination configs"
  value       = var.enable_logging ? aws_wafv2_web_acl_logging_configuration.this[0].log_destination_configs : ""
}

output "logging_configuration_logging_filter" {
  description = "WAF logging configuration logging filter"
  value       = var.enable_logging ? aws_wafv2_web_acl_logging_configuration.this[0].logging_filter : ""
}

output "waf_summary" {
  description = "WAF summary"
  value = {
    web_acl = {
      arn          = aws_wafv2_web_acl.this.arn
      id           = aws_wafv2_web_acl.this.id
      name         = aws_wafv2_web_acl.this.name
      description  = aws_wafv2_web_acl.this.description
      scope        = aws_wafv2_web_acl.this.scope
      capacity     = aws_wafv2_web_acl.this.capacity
      default_action = aws_wafv2_web_acl.this.default_action
      rules        = aws_wafv2_web_acl.this.rules
      visibility_config = aws_wafv2_web_acl.this.visibility_config
      tags         = aws_wafv2_web_acl.this.tags
    }
    ip_set = length(var.ip_sets) > 0 ? {
      arn               = aws_wafv2_ip_set.this[0].arn
      id                = aws_wafv2_ip_set.this[0].id
      name              = aws_wafv2_ip_set.this[0].name
      description       = aws_wafv2_ip_set.this[0].description
      scope             = aws_wafv2_ip_set.this[0].scope
      ip_address_version = aws_wafv2_ip_set.this[0].ip_address_version
      addresses         = aws_wafv2_ip_set.this[0].addresses
    } : null
    regex_pattern_set = length(var.regex_pattern_sets) > 0 ? {
      arn                = aws_wafv2_regex_pattern_set.this[0].arn
      id                 = aws_wafv2_regex_pattern_set.this[0].id
      name               = aws_wafv2_regex_pattern_set.this[0].name
      description        = aws_wafv2_regex_pattern_set.this[0].description
      scope              = aws_wafv2_regex_pattern_set.this[0].scope
      regular_expressions = aws_wafv2_regex_pattern_set.this[0].regular_expressions
    } : null
    association = length(var.alb_arn) > 0 ? {
      resource_arn = aws_wafv2_web_acl_association.this[0].resource_arn
      web_acl_arn  = aws_wafv2_web_acl_association.this[0].web_acl_arn
    } : null
    logging = var.enable_logging ? {
      log_group_arn = aws_cloudwatch_log_group.this[0].arn
      log_group_name = aws_cloudwatch_log_group.this[0].name
      logging_configuration = {
        resource_arn            = aws_wafv2_web_acl_logging_configuration.this[0].resource_arn
        log_destination_configs = aws_wafv2_web_acl_logging_configuration.this[0].log_destination_configs
        logging_filter          = aws_wafv2_web_acl_logging_configuration.this[0].logging_filter
      }
    } : null
  }
}