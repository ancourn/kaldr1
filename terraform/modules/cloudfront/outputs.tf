# KALDRIX Blockchain - CloudFront Module Outputs

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.this.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.this.domain_name
}

output "cloudfront_status" {
  description = "CloudFront distribution status"
  value       = aws_cloudfront_distribution.this.status
}

output "cloudfront_last_modified_time" {
  description = "CloudFront distribution last modified time"
  value       = aws_cloudfront_distribution.this.last_modified_time
}

output "cloudfront_in_progress_invalidation_batches" {
  description = "CloudFront distribution in progress invalidation batches"
  value       = aws_cloudfront_distribution.this.in_progress_invalidation_batches
}

output "cloudfront_active_trusted_signers" {
  description = "CloudFront distribution active trusted signers"
  value       = aws_cloudfront_distribution.this.active_trusted_signers
}

output "cloudfront_active_trusted_key_groups" {
  description = "CloudFront distribution active trusted key groups"
  value       = aws_cloudfront_distribution.this.active_trusted_key_groups
}

output "cloudfront_distribution_config" {
  description = "CloudFront distribution configuration"
  value       = aws_cloudfront_distribution.this.distribution_config
}

output "cloudfront_etag" {
  description = "CloudFront distribution ETag"
  value       = aws_cloudfront_distribution.this.etag
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}

output "origin_access_identity_id" {
  description = "CloudFront origin access identity ID"
  value       = var.create_origin_access_identity ? aws_cloudfront_origin_access_identity.this[0].id : ""
}

output "origin_access_identity_iam_arn" {
  description = "CloudFront origin access identity IAM ARN"
  value       = var.create_origin_access_identity ? aws_cloudfront_origin_access_identity.this[0].iam_arn : ""
}

output "origin_access_identity_path" {
  description = "CloudFront origin access identity path"
  value       = var.create_origin_access_identity ? aws_cloudfront_origin_access_identity.this[0].path : ""
}

output "origin_access_identity_s3_canonical_user_id" {
  description = "CloudFront origin access identity S3 canonical user ID"
  value       = var.create_origin_access_identity ? aws_cloudfront_origin_access_identity.this[0].s3_canonical_user_id : ""
}

output "public_key_id" {
  description = "CloudFront public key ID"
  value       = length(var.public_keys) > 0 ? aws_cloudfront_public_key.this[0].id : ""
}

output "public_key_name" {
  description = "CloudFront public key name"
  value       = length(var.public_keys) > 0 ? aws_cloudfront_public_key.this[0].name : ""
}

output "public_key_created_time" {
  description = "CloudFront public key created time"
  value       = length(var.public_keys) > 0 ? aws_cloudfront_public_key.this[0].created_time : ""
}

output "public_key_encoded_key" {
  description = "CloudFront public key encoded key"
  value       = length(var.public_keys) > 0 ? aws_cloudfront_public_key.this[0].encoded_key : ""
}

output "key_group_id" {
  description = "CloudFront key group ID"
  value       = length(var.key_groups) > 0 ? aws_cloudfront_key_group.this[0].id : ""
}

output "key_group_name" {
  description = "CloudFront key group name"
  value       = length(var.key_groups) > 0 ? aws_cloudfront_key_group.this[0].name : ""
}

output "key_group_items" {
  description = "CloudFront key group items"
  value       = length(var.key_groups) > 0 ? aws_cloudfront_key_group.this[0].items : ""
}

output "field_level_encryption_config_id" {
  description = "CloudFront field level encryption config ID"
  value       = length(var.field_level_encryption_configs) > 0 ? aws_cloudfront_field_level_encryption_config.this[0].id : ""
}

output "field_level_encryption_profile_id" {
  description = "CloudFront field level encryption profile ID"
  value       = length(var.field_level_encryption_profiles) > 0 ? aws_cloudfront_field_level_encryption_profile.this[0].id : ""
}

output "realtime_log_config_id" {
  description = "CloudFront realtime log config ID"
  value       = length(var.realtime_log_configs) > 0 ? aws_cloudfront_realtime_log_config.this[0].id : ""
}

output "realtime_log_config_arn" {
  description = "CloudFront realtime log config ARN"
  value       = length(var.realtime_log_configs) > 0 ? aws_cloudfront_realtime_log_config.this[0].arn : ""
}

output "cache_policy_id" {
  description = "CloudFront cache policy ID"
  value       = length(var.cache_policies) > 0 ? aws_cloudfront_cache_policy.this[0].id : ""
}

output "cache_policy_name" {
  description = "CloudFront cache policy name"
  value       = length(var.cache_policies) > 0 ? aws_cloudfront_cache_policy.this[0].name : ""
}

output "origin_request_policy_id" {
  description = "CloudFront origin request policy ID"
  value       = length(var.origin_request_policies) > 0 ? aws_cloudfront_origin_request_policy.this[0].id : ""
}

output "origin_request_policy_name" {
  description = "CloudFront origin request policy name"
  value       = length(var.origin_request_policies) > 0 ? aws_cloudfront_origin_request_policy.this[0].name : ""
}

output "cloudfront_summary" {
  description = "CloudFront distribution summary"
  value = {
    id                   = aws_cloudfront_distribution.this.id
    arn                  = aws_cloudfront_distribution.this.arn
    domain_name          = aws_cloudfront_distribution.this.domain_name
    status               = aws_cloudfront_distribution.this.status
    enabled              = aws_cloudfront_distribution.this.enabled
    is_ipv6_enabled      = aws_cloudfront_distribution.this.is_ipv6_enabled
    comment              = aws_cloudfront_distribution.this.comment
    price_class          = aws_cloudfront_distribution.this.price_class
    web_acl_id           = aws_cloudfront_distribution.this.web_acl_id
    last_modified_time   = aws_cloudfront_distribution.this.last_modified_time
    aliases              = aws_cloudfront_distribution.this.aliases
    default_root_object  = aws_cloudfront_distribution.this.default_root_object
    origin_access_identity = var.create_origin_access_identity ? aws_cloudfront_origin_access_identity.this[0].id : ""
    hosted_zone_id      = aws_cloudfront_distribution.this.hosted_zone_id
    tags                 = aws_cloudfront_distribution.this.tags
  }
}