# KALDRIX Blockchain - CloudFront Module Variables

variable "name" {
  description = "Name of the CloudFront distribution"
  type        = string
}

variable "enabled" {
  description = "Enable the CloudFront distribution"
  type        = bool
  default     = true
}

variable "is_ipv6_enabled" {
  description = "Enable IPv6"
  type        = bool
  default     = true
}

variable "comment" {
  description = "Comment for the CloudFront distribution"
  type        = string
  default     = "KALDRIX Blockchain CloudFront Distribution"
}

variable "default_root_object" {
  description = "Default root object"
  type        = string
  default     = "index.html"
}

variable "price_class" {
  description = "Price class"
  type        = string
  default     = "PriceClass_100"
}

variable "origin_domain_name" {
  description = "Origin domain name"
  type        = string
}

variable "origin_protocol_policy" {
  description = "Origin protocol policy"
  type        = string
  default     = "https-only"
}

variable "origin_ssl_protocols" {
  description = "Origin SSL protocols"
  type        = list(string)
  default     = ["TLSv1.2"]
}

variable "origin_read_timeout" {
  description = "Origin read timeout"
  type        = number
  default     = 30
}

variable "origin_keepalive_timeout" {
  description = "Origin keepalive timeout"
  type        = number
  default     = 5
}

variable "custom_headers" {
  description = "Custom headers"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "enable_origin_shield" {
  description = "Enable Origin Shield"
  type        = bool
  default     = false
}

variable "origin_shield_region" {
  description = "Origin Shield region"
  type        = string
  default     = "us-east-1"
}

variable "default_cache_behavior" {
  description = "Default cache behavior"
  type = object({
    allowed_methods  = list(string)
    cached_methods   = list(string)
    forwarded_values = object({
      query_string = bool
      cookies = object({
        forward           = string
        whitelisted_names = list(string)
      })
      headers               = list(string)
      query_string_cache_keys = list(string)
    })
    viewer_protocol_policy = string
    min_ttl                = number
    default_ttl            = number
    max_ttl                = number
    compress               = bool
    smooth_streaming       = bool
    lambda_function_associations = list(object({
      event_type   = string
      lambda_arn   = string
      include_body = bool
    }))
    function_associations = list(object({
      event_type   = string
      function_arn = string
    }))
    field_level_encryption_id = string
  })
  default = {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    forwarded_values = {
      query_string = false
      cookies = {
        forward           = "none"
        whitelisted_names = []
      }
      headers               = []
      query_string_cache_keys = []
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    smooth_streaming       = false
    lambda_function_associations = []
    function_associations = []
    field_level_encryption_id = ""
  }
}

variable "ordered_cache_behaviors" {
  description = "Ordered cache behaviors"
  type = list(object({
    path_pattern     = string
    allowed_methods  = list(string)
    cached_methods   = list(string)
    forwarded_values = object({
      query_string = bool
      cookies = object({
        forward           = string
        whitelisted_names = list(string)
      })
      headers               = list(string)
      query_string_cache_keys = list(string)
    })
    viewer_protocol_policy = string
    min_ttl                = number
    default_ttl            = number
    max_ttl                = number
    compress               = bool
    smooth_streaming       = bool
    lambda_function_associations = list(object({
      event_type   = string
      lambda_arn   = string
      include_body = bool
    }))
    function_associations = list(object({
      event_type   = string
      function_arn = string
    }))
    field_level_encryption_id = string
  }))
  default = []
}

variable "aliases" {
  description = "Aliases for the CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "viewer_certificate" {
  description = "Viewer certificate configuration"
  type = object({
    acm_certificate_arn            = string
    ssl_support_method             = string
    minimum_protocol_version       = string
    cloudfront_default_certificate = bool
  })
  default = {
    acm_certificate_arn            = ""
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = true
  }
}

variable "restrictions" {
  description = "Restrictions configuration"
  type = object({
    geo_restriction = object({
      restriction_type = string
      locations        = list(string)
    })
  })
  default = {
    geo_restriction = {
      restriction_type = "none"
      locations        = []
    }
  }
}

variable "web_acl_id" {
  description = "Web ACL ID"
  type        = string
  default     = ""
}

variable "enable_logging" {
  description = "Enable logging"
  type        = bool
  default     = true
}

variable "logging_config" {
  description = "Logging configuration"
  type = object({
    include_cookies = bool
    bucket          = string
    prefix          = string
  })
  default = {
    include_cookies = false
    bucket          = ""
    prefix          = "cloudfront-logs"
  }
}

variable "custom_error_responses" {
  description = "Custom error responses"
  type = list(object({
    error_caching_min_ttl = number
    error_code            = number
    response_code         = string
    response_page_path    = string
  }))
  default = []
}

variable "wait_for_deployment" {
  description = "Wait for deployment"
  type        = bool
  default     = true
}

variable "retain_on_delete" {
  description = "Retain on deletion"
  type        = bool
  default     = false
}

variable "create_origin_access_identity" {
  description = "Create origin access identity"
  type        = bool
  default     = false
}

variable "origin_access_identity_comment" {
  description = "Origin access identity comment"
  type        = string
  default     = "KALDRIX Blockchain Origin Access Identity"
}

variable "public_keys" {
  description = "Public keys"
  type = list(object({
    name        = string
    encoded_key = string
    comment     = string
  }))
  default = []
}

variable "key_groups" {
  description = "Key groups"
  type = list(object({
    name    = string
    comment = string
    items   = list(string)
  }))
  default = []
}

variable "field_level_encryption_configs" {
  description = "Field level encryption configs"
  type = list(object({
    comment = string
    content_type_profile_config = object({
      content_type_profiles = list(object({
        content_type = string
        format       = string
        profile_id   = string
      }))
      forward_when_content_type_is_unknown = bool
    })
    query_arg_profile_config = object({
      query_arg_profiles = list(object({
        query_arg = string
        profile_id = string
      }))
      forward_when_query_arg_profile_is_unknown = bool
    })
  }))
  default = []
}

variable "field_level_encryption_profiles" {
  description = "Field level encryption profiles"
  type = list(object({
    name    = string
    comment = string
    encryption_entities = list(object({
      public_key_id = string
      provider_id   = string
      field_patterns = list(object({
        items = list(string)
      }))
    }))
  }))
  default = []
}

variable "realtime_log_configs" {
  description = "Realtime log configs"
  type = list(object({
    name          = string
    sampling_rate = number
    endpoint = object({
      stream_type = string
      kinesis_stream_config = object({
        role_arn   = string
        stream_arn = string
      })
    })
    fields = list(string)
  }))
  default = []
}

variable "cache_policies" {
  description = "Cache policies"
  type = list(object({
    name        = string
    comment     = string
    default_ttl = number
    max_ttl     = number
    min_ttl     = number
    parameters_in_cache_key_and_forwarded_to_origin = object({
      cookies_config = object({
        cookie_behavior = string
        cookies = list(string)
      })
      headers_config = object({
        header_behavior = string
        headers = list(string)
      })
      query_strings_config = object({
        query_string_behavior = string
        query_strings = list(string)
      })
      enable_accept_encoding_gzip   = bool
      enable_accept_encoding_brotli = bool
    })
  }))
  default = []
}

variable "origin_request_policies" {
  description = "Origin request policies"
  type = list(object({
    name    = string
    comment = string
    cookies_config = object({
      cookie_behavior = string
      cookies = list(string)
    })
    headers_config = object({
      header_behavior = string
      headers = list(string)
    })
    query_strings_config = object({
      query_string_behavior = string
      query_strings = list(string)
    })
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}