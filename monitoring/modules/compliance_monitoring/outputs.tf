output "security_hub" {
  description = "AWS Security Hub resources"
  value = var.enable_security_hub ? {
    account_id = aws_securityhub_account.main[0].id
    standards = {
      cis_aws = aws_securityhub_standards_subscription.cis_aws[0].standards_arn
      pci_dss = aws_securityhub_standards_subscription.pci_dss[0].standards_arn
    }
  } : null
}

output "guardduty" {
  description = "Amazon GuardDuty resources"
  value = var.enable_guardduty ? {
    detector_id = aws_guardduty_detector.main[0].id
    publishing_destination = aws_guardduty_publishing_destination.s3[0].destination_id
  } : null
}

output "macie" {
  description = "Amazon Macie resources"
  value = var.enable_macie ? {
    account_id = aws_macie2_account.main[0].id
    classification_job = aws_macie2_classification_job.s3_audit[0].job_id
  } : null
}

output "cloudtrail" {
  description = "AWS CloudTrail resources"
  value = var.enable_cloudtrail ? {
    trail_arn = aws_cloudtrail.kaldrix_audit[0].arn
    trail_name = aws_cloudtrail.kaldrix_audit[0].name
    home_region = aws_cloudtrail.kaldrix_audit[0].home_region
  } : null
}

output "config" {
  description = "AWS Config resources"
  value = var.enable_cloudtrail ? {
    recorder_name = aws_config_configuration_recorder.main.name
    delivery_channel = aws_config_delivery_channel.main.name
    rules = {
      encrypted_volumes = aws_config_config_rule.encrypted_volumes.id
      iam_password_policy = aws_config_config_rule.iam_password_policy.id
      root_account_mfa = aws_config_config_rule.root_account_mfa.id
    }
  } : null
}

output "kms_key" {
  description = "KMS key for audit data encryption"
  value = var.enable_cloudtrail || var.enable_guardduty || var.enable_macie ? {
    key_id = aws_kms_key.audit_key[0].key_id
    key_arn = aws_kms_key.audit_key[0].arn
    alias = aws_kms_alias.audit_key[0].name
  } : null
}

output "compliance_reporter" {
  description = "Compliance reporter Lambda function"
  value = var.enable_cloudtrail ? {
    function_arn = aws_lambda_function.compliance_reporter[0].arn
    role_arn = aws_iam_role.compliance_reporter_role[0].arn
    log_group = aws_cloudwatch_log_group.compliance_reporter_logs[0].name
    schedule = aws_cloudwatch_event_rule.compliance_report[0].schedule_expression
  } : null
}