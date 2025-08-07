output "s3_bucket_name" {
  description = "Main S3 bucket name"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "Main S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "s3_bucket_domain_name" {
  description = "Main S3 bucket domain name"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Main S3 bucket regional domain name"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "s3_logs_bucket_name" {
  description = "Logs S3 bucket name"
  value       = aws_s3_bucket.logs.id
}

output "s3_logs_bucket_arn" {
  description = "Logs S3 bucket ARN"
  value       = aws_s3_bucket.logs.arn
}

output "s3_backups_bucket_name" {
  description = "Backups S3 bucket name"
  value       = var.enable_backup ? aws_s3_bucket.backups[0].id : null
}

output "s3_backups_bucket_arn" {
  description = "Backups S3 bucket ARN"
  value       = var.enable_backup ? aws_s3_bucket.backups[0].arn : null
}

output "s3_replication_role_arn" {
  description = "S3 replication role ARN"
  value       = var.enable_backup ? aws_iam_role.s3_replication[0].arn : null
}

output "s3_replication_policy_arn" {
  description = "S3 replication policy ARN"
  value       = var.enable_backup ? aws_iam_policy.s3_replication[0].arn : null
}

output "s3_bucket_ids" {
  description = "All S3 bucket IDs"
  value = {
    main    = aws_s3_bucket.main.id
    logs    = aws_s3_bucket.logs.id
    backups = var.enable_backup ? aws_s3_bucket.backups[0].id : null
  }
}

output "s3_bucket_arns" {
  description = "All S3 bucket ARNs"
  value = {
    main    = aws_s3_bucket.main.arn
    logs    = aws_s3_bucket.logs.arn
    backups = var.enable_backup ? aws_s3_bucket.backups[0].arn : null
  }
}

output "s3_bucket_names" {
  description = "All S3 bucket names"
  value = {
    main    = aws_s3_bucket.main.id
    logs    = aws_s3_bucket.logs.id
    backups = var.enable_backup ? aws_s3_bucket.backups[0].id : null
  }
}