# KALDRIX Blockchain - CloudFront Module

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Create CloudFront Distribution
resource "aws_cloudfront_distribution" "this" {
  enabled             = var.enabled
  is_ipv6_enabled     = var.is_ipv6_enabled
  comment             = var.comment
  default_root_object = var.default_root_object
  price_class         = var.price_class
  
  # Origin Configuration
  origin {
    domain_name = var.origin_domain_name
    origin_id   = "origin"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = var.origin_protocol_policy
      origin_ssl_protocols   = var.origin_ssl_protocols
      origin_read_timeout    = var.origin_read_timeout
      origin_keepalive_timeout = var.origin_keepalive_timeout
    }
    
    custom_headers = var.custom_headers
    
    dynamic "origin_shield" {
      for_each = var.enable_origin_shield ? [1] : []
      content {
        enabled              = true
        origin_shield_region = var.origin_shield_region
      }
    }
  }
  
  # Default Cache Behavior
  default_cache_behavior {
    allowed_methods  = var.default_cache_behavior.allowed_methods
    cached_methods   = var.default_cache_behavior.cached_methods
    target_origin_id = "origin"
    
    forwarded_values {
      query_string = var.default_cache_behavior.forwarded_values.query_string
      
      cookies {
        forward = var.default_cache_behavior.forwarded_values.cookies.forward
        whitelisted_names = var.default_cache_behavior.forwarded_values.cookies.whitelisted_names
      }
      
      headers = var.default_cache_behavior.forwarded_values.headers
      
      query_string_cache_keys = var.default_cache_behavior.forwarded_values.query_string_cache_keys
    }
    
    viewer_protocol_policy = var.default_cache_behavior.viewer_protocol_policy
    min_ttl                = var.default_cache_behavior.min_ttl
    default_ttl            = var.default_cache_behavior.default_ttl
    max_ttl                = var.default_cache_behavior.max_ttl
    
    compress               = var.default_cache_behavior.compress
    smooth_streaming       = var.default_cache_behavior.smooth_streaming
    
    dynamic "lambda_function_association" {
      for_each = var.default_cache_behavior.lambda_function_associations
      content {
        event_type   = lambda_function_association.value.event_type
        lambda_arn   = lambda_function_association.value.lambda_arn
        include_body = lambda_function_association.value.include_body
      }
    }
    
    dynamic "function_association" {
      for_each = var.default_cache_behavior.function_associations
      content {
        event_type   = function_association.value.event_type
        function_arn = function_association.value.function_arn
      }
    }
    
    field_level_encryption_id = var.default_cache_behavior.field_level_encryption_id
  }
  
  # Ordered Cache Behaviors
  dynamic "ordered_cache_behavior" {
    for_each = var.ordered_cache_behaviors
    content {
      path_pattern     = ordered_cache_behavior.value.path_pattern
      allowed_methods  = ordered_cache_behavior.value.allowed_methods
      cached_methods   = ordered_cache_behavior.value.cached_methods
      target_origin_id = "origin"
      
      forwarded_values {
        query_string = ordered_cache_behavior.value.forwarded_values.query_string
        
        cookies {
          forward = ordered_cache_behavior.value.forwarded_values.cookies.forward
          whitelisted_names = ordered_cache_behavior.value.forwarded_values.cookies.whitelisted_names
        }
        
        headers = ordered_cache_behavior.value.forwarded_values.headers
        
        query_string_cache_keys = ordered_cache_behavior.value.forwarded_values.query_string_cache_keys
      }
      
      viewer_protocol_policy = ordered_cache_behavior.value.viewer_protocol_policy
      min_ttl                = ordered_cache_behavior.value.min_ttl
      default_ttl            = ordered_cache_behavior.value.default_ttl
      max_ttl                = ordered_cache_behavior.value.max_ttl
      
      compress               = ordered_cache_behavior.value.compress
      smooth_streaming       = ordered_cache_behavior.value.smooth_streaming
      
      dynamic "lambda_function_association" {
        for_each = ordered_cache_behavior.value.lambda_function_associations
        content {
          event_type   = lambda_function_association.value.event_type
          lambda_arn   = lambda_function_association.value.lambda_arn
          include_body = lambda_function_association.value.include_body
        }
      }
      
      dynamic "function_association" {
        for_each = ordered_cache_behavior.value.function_associations
        content {
          event_type   = function_association.value.event_type
          function_arn = function_association.value.function_arn
        }
      }
      
      field_level_encryption_id = ordered_cache_behavior.value.field_level_encryption_id
    }
  }
  
  # Aliases
  aliases = var.aliases
  
  # Viewer Certificate
  viewer_certificate {
    acm_certificate_arn            = var.viewer_certificate.acm_certificate_arn
    ssl_support_method             = var.viewer_certificate.ssl_support_method
    minimum_protocol_version       = var.viewer_certificate.minimum_protocol_version
    cloudfront_default_certificate = var.viewer_certificate.cloudfront_default_certificate
  }
  
  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = var.restrictions.geo_restriction.restriction_type
      locations        = var.restrictions.geo_restriction.locations
    }
  }
  
  # Web Application Firewall
  web_acl_id = var.web_acl_id
  
  # Logging
  dynamic "logging_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      include_cookies = var.logging_config.include_cookies
      bucket          = var.logging_config.bucket
      prefix          = var.logging_config.prefix
    }
  }
  
  # Custom Error Responses
  dynamic "custom_error_response" {
    for_each = var.custom_error_responses
    content {
      error_caching_min_ttl = custom_error_response.value.error_caching_min_ttl
      error_code            = custom_error_response.value.error_code
      response_code         = custom_error_response.value.response_code
      response_page_path    = custom_error_response.value.response_page_path
    }
  }
  
  tags = merge(
    {
      Name = var.name
    },
    var.tags
  )
  
  # Wait for distribution to deploy
  wait_for_deployment = var.wait_for_deployment
  
  # Retain on deletion
  retain_on_delete = var.retain_on_delete
}

# Create CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "this" {
  count = var.create_origin_access_identity ? 1 : 0
  
  comment = var.origin_access_identity_comment
}

# Create CloudFront Public Key
resource "aws_cloudfront_public_key" "this" {
  count = length(var.public_keys) > 0 ? 1 : 0
  
  name     = var.public_keys[0].name
  encoded_key = var.public_keys[0].encoded_key
  comment  = var.public_keys[0].comment
}

# Create CloudFront Key Group
resource "aws_cloudfront_key_group" "this" {
  count = length(var.key_groups) > 0 ? 1 : 0
  
  name    = var.key_groups[0].name
  comment = var.key_groups[0].comment
  items   = var.key_groups[0].items
}

# Create CloudFront Field Level Encryption Config
resource "aws_cloudfront_field_level_encryption_config" "this" {
  count = length(var.field_level_encryption_configs) > 0 ? 1 : 0
  
  comment = var.field_level_encryption_configs[0].comment
  
  content_type_profile_config {
    content_type_profiles {
      items {
        content_type = var.field_level_encryption_configs[0].content_type_profile_config.content_type_profiles[0].content_type
        format       = var.field_level_encryption_configs[0].content_type_profile_config.content_type_profiles[0].format
        profile_id   = var.field_level_encryption_configs[0].content_type_profile_config.content_type_profiles[0].profile_id
      }
      forward_when_content_type_is_unknown = var.field_level_encryption_configs[0].content_type_profile_config.forward_when_content_type_is_unknown
    }
  }
  
  query_arg_profile_config {
    query_arg_profiles {
      items {
        query_arg = var.field_level_encryption_configs[0].query_arg_profile_config.query_arg_profiles[0].query_arg
        profile_id = var.field_level_encryption_configs[0].query_arg_profile_config.query_arg_profiles[0].profile_id
      }
      forward_when_query_arg_profile_is_unknown = var.field_level_encryption_configs[0].query_arg_profile_config.forward_when_query_arg_profile_is_unknown
    }
  }
}

# Create CloudFront Field Level Encryption Profile
resource "aws_cloudfront_field_level_encryption_profile" "this" {
  count = length(var.field_level_encryption_profiles) > 0 ? 1 : 0
  
  name    = var.field_level_encryption_profiles[0].name
  comment = var.field_level_encryption_profiles[0].comment
  encryption_entities {
    items {
      public_key_id = var.field_level_encryption_profiles[0].encryption_entities[0].public_key_id
      provider_id   = var.field_level_encryption_profiles[0].encryption_entities[0].provider_id
      field_patterns {
        items = var.field_level_encryption_profiles[0].encryption_entities[0].field_patterns[0].items
      }
    }
  }
}

# Create CloudFront Realtime Log Config
resource "aws_cloudfront_realtime_log_config" "this" {
  count = length(var.realtime_log_configs) > 0 ? 1 : 0
  
  name          = var.realtime_log_configs[0].name
  sampling_rate = var.realtime_log_configs[0].sampling_rate
  
  endpoint {
    stream_type = var.realtime_log_configs[0].endpoint.stream_type
    kinesis_stream_config {
      role_arn   = var.realtime_log_configs[0].endpoint.kinesis_stream_config.role_arn
      stream_arn = var.realtime_log_configs[0].endpoint.kinesis_stream_config.stream_arn
    }
  }
  
  fields = var.realtime_log_configs[0].fields
}

# Create CloudFront Cache Policy
resource "aws_cloudfront_cache_policy" "this" {
  count = length(var.cache_policies) > 0 ? 1 : 0
  
  name        = var.cache_policies[0].name
  comment     = var.cache_policies[0].comment
  default_ttl = var.cache_policies[0].default_ttl
  max_ttl     = var.cache_policies[0].max_ttl
  min_ttl     = var.cache_policies[0].min_ttl
  
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.cookies_config.cookie_behavior
      
      dynamic "cookies" {
        for_each = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.cookies_config.cookies != null ? [1] : []
        content {
          items = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.cookies_config.cookies
        }
      }
    }
    
    headers_config {
      header_behavior = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.headers_config.header_behavior
      
      dynamic "headers" {
        for_each = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.headers_config.headers != null ? [1] : []
        content {
          items = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.headers_config.headers
        }
      }
    }
    
    query_strings_config {
      query_string_behavior = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.query_strings_config.query_string_behavior
      
      dynamic "query_strings" {
        for_each = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.query_strings_config.query_strings != null ? [1] : []
        content {
          items = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.query_strings_config.query_strings
        }
      }
    }
    
    enable_accept_encoding_gzip   = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.enable_accept_encoding_gzip
    enable_accept_encoding_brotli = var.cache_policies[0].parameters_in_cache_key_and_forwarded_to_origin.enable_accept_encoding_brotli
  }
}

# Create CloudFront Origin Request Policy
resource "aws_cloudfront_origin_request_policy" "this" {
  count = length(var.origin_request_policies) > 0 ? 1 : 0
  
  name    = var.origin_request_policies[0].name
  comment = var.origin_request_policies[0].comment
  
  cookies_config {
    cookie_behavior = var.origin_request_policies[0].cookies_config.cookie_behavior
    
    dynamic "cookies" {
      for_each = var.origin_request_policies[0].cookies_config.cookies != null ? [1] : []
      content {
        items = var.origin_request_policies[0].cookies_config.cookies
      }
    }
  }
  
  headers_config {
    header_behavior = var.origin_request_policies[0].headers_config.header_behavior
    
    dynamic "headers" {
      for_each = var.origin_request_policies[0].headers_config.headers != null ? [1] : []
      content {
        items = var.origin_request_policies[0].headers_config.headers
      }
    }
  }
  
  query_strings_config {
    query_string_behavior = var.origin_request_policies[0].query_strings_config.query_string_behavior
    
    dynamic "query_strings" {
      for_each = var.origin_request_policies[0].query_strings_config.query_strings != null ? [1] : []
      content {
        items = var.origin_request_policies[0].query_strings_config.query_strings
      }
    }
  }
}