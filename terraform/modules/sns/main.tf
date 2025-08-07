# KALDRIX Blockchain - SNS Module

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Create SNS Topic
resource "aws_sns_topic" "this" {
  name         = var.name
  display_name = var.display_name
  policy       = var.policy
  
  dynamic "fifo_topic" {
    for_each = var.fifo_topic != null ? [var.fifo_topic] : []
    content {
      content_based_deduplication = fifo_topic.value.content_based_deduplication
    }
  }
  
  dynamic "application_success_feedback_role_arn" {
    for_each = var.application_success_feedback_role_arn != null ? [var.application_success_feedback_role_arn] : []
    content {
      success_feedback_role_arn = application_success_feedback_role_arn.value
      success_feedback_sample_rate = var.application_success_feedback_sample_rate
    }
  }
  
  dynamic "application_success_feedback_sample_rate" {
    for_each = var.application_success_feedback_sample_rate != null ? [var.application_success_feedback_sample_rate] : []
    content {
      success_feedback_sample_rate = application_success_feedback_sample_rate.value
    }
  }
  
  dynamic "application_failure_feedback_role_arn" {
    for_each = var.application_failure_feedback_role_arn != null ? [var.application_failure_feedback_role_arn] : []
    content {
      failure_feedback_role_arn = application_failure_feedback_role_arn.value
    }
  }
  
  dynamic "http_success_feedback_role_arn" {
    for_each = var.http_success_feedback_role_arn != null ? [var.http_success_feedback_role_arn] : []
    content {
      success_feedback_role_arn = http_success_feedback_role_arn.value
      success_feedback_sample_rate = var.http_success_feedback_sample_rate
    }
  }
  
  dynamic "http_success_feedback_sample_rate" {
    for_each = var.http_success_feedback_sample_rate != null ? [var.http_success_feedback_sample_rate] : []
    content {
      success_feedback_sample_rate = http_success_feedback_sample_rate.value
    }
  }
  
  dynamic "http_failure_feedback_role_arn" {
    for_each = var.http_failure_feedback_role_arn != null ? [var.http_failure_feedback_role_arn] : []
    content {
      failure_feedback_role_arn = http_failure_feedback_role_arn.value
    }
  }
  
  dynamic "lambda_success_feedback_role_arn" {
    for_each = var.lambda_success_feedback_role_arn != null ? [var.lambda_success_feedback_role_arn] : []
    content {
      success_feedback_role_arn = lambda_success_feedback_role_arn.value
      success_feedback_sample_rate = var.lambda_success_feedback_sample_rate
    }
  }
  
  dynamic "lambda_success_feedback_sample_rate" {
    for_each = var.lambda_success_feedback_sample_rate != null ? [var.lambda_success_feedback_sample_rate] : []
    content {
      success_feedback_sample_rate = lambda_success_feedback_sample_rate.value
    }
  }
  
  dynamic "lambda_failure_feedback_role_arn" {
    for_each = var.lambda_failure_feedback_role_arn != null ? [var.lambda_failure_feedback_role_arn] : []
    content {
      failure_feedback_role_arn = lambda_failure_feedback_role_arn.value
    }
  }
  
  dynamic "sqs_success_feedback_role_arn" {
    for_each = var.sqs_success_feedback_role_arn != null ? [var.sqs_success_feedback_role_arn] : []
    content {
      success_feedback_role_arn = sqs_success_feedback_role_arn.value
      success_feedback_sample_rate = var.sqs_success_feedback_sample_rate
    }
  }
  
  dynamic "sqs_success_feedback_sample_rate" {
    for_each = var.sqs_success_feedback_sample_rate != null ? [var.sqs_success_feedback_sample_rate] : []
    content {
      success_feedback_sample_rate = sqs_success_feedback_sample_rate.value
    }
  }
  
  dynamic "sqs_failure_feedback_role_arn" {
    for_each = var.sqs_failure_feedback_role_arn != null ? [var.sqs_failure_feedback_role_arn] : []
    content {
      failure_feedback_role_arn = sqs_failure_feedback_role_arn.value
    }
  }
  
  kms_master_key_id = var.kms_master_key_id
  
  tags = merge(
    {
      Name = var.name
    },
    var.tags
  )
}

# Create SNS Topic Subscriptions
resource "aws_sns_topic_subscription" "this" {
  count = length(var.subscriptions)
  
  topic_arn = aws_sns_topic.this.arn
  protocol  = var.subscriptions[count.index].protocol
  endpoint  = var.subscriptions[count.index].endpoint
  
  dynamic "confirmation_timeout_in_minutes" {
    for_each = var.subscriptions[count.index].confirmation_timeout_in_minutes != null ? [var.subscriptions[count.index].confirmation_timeout_in_minutes] : []
    content {
      confirmation_timeout_in_minutes = confirmation_timeout_in_minutes.value
    }
  }
  
  dynamic "delivery_policy" {
    for_each = var.subscriptions[count.index].delivery_policy != null ? [var.subscriptions[count.index].delivery_policy] : []
    content {
      delivery_policy = delivery_policy.value
    }
  }
  
  dynamic "filter_policy" {
    for_each = var.subscriptions[count.index].filter_policy != null ? [var.subscriptions[count.index].filter_policy] : []
    content {
      filter_policy = filter_policy.value
    }
  }
  
  dynamic "filter_policy_scope" {
    for_each = var.subscriptions[count.index].filter_policy_scope != null ? [var.subscriptions[count.index].filter_policy_scope] : []
    content {
      filter_policy_scope = filter_policy_scope.value
    }
  }
  
  dynamic "raw_message_delivery" {
    for_each = var.subscriptions[count.index].raw_message_delivery != null ? [var.subscriptions[count.index].raw_message_delivery] : []
    content {
      raw_message_delivery = raw_message_delivery.value
    }
  }
  
  dynamic "redrive_policy" {
    for_each = var.subscriptions[count.index].redrive_policy != null ? [var.subscriptions[count.index].redrive_policy] : []
    content {
      dead_letter_target_arn = redrive_policy.value.dead_letter_target_arn
    }
  }
  
  dynamic "subscription_role_arn" {
    for_each = var.subscriptions[count.index].subscription_role_arn != null ? [var.subscriptions[count.index].subscription_role_arn] : []
    content {
      subscription_role_arn = subscription_role_arn.value
    }
  }
}

# Create SNS Topic Policy
resource "aws_sns_topic_policy" "this" {
  count = var.create_topic_policy ? 1 : 0
  
  arn    = aws_sns_topic.this.arn
  policy = var.topic_policy != null ? var.topic_policy : data.aws_iam_policy_document.default[0].json
}

# Create default IAM policy document
data "aws_iam_policy_document" "default" {
  count = var.create_topic_policy && var.topic_policy == null ? 1 : 0
  
  statement {
    actions = [
      "SNS:Subscribe",
      "SNS:SetTopicAttributes",
      "SNS:RemovePermission",
      "SNS:Receive",
      "SNS:Publish",
      "SNS:ListSubscriptionsByTopic",
      "SNS:GetTopicAttributes",
      "SNS:DeleteTopic",
      "SNS:AddPermission"
    ]
    
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    
    resources = [
      aws_sns_topic.this.arn
    ]
    
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceOwner"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Create SNS Platform Applications
resource "aws_sns_platform_application" "this" {
  count = length(var.platform_applications) > 0 ? 1 : 0
  
  name          = var.platform_applications[0].name
  platform      = var.platform_applications[0].platform
  platform_credential = var.platform_applications[0].platform_credential
  
  dynamic "platform_principal" {
    for_each = var.platform_applications[0].platform_principal != null ? [var.platform_applications[0].platform_principal] : []
    content {
      platform_principal = platform_principal.value
    }
  }
  
  dynamic "event_endpoint_created" {
    for_each = var.platform_applications[0].event_endpoint_created != null ? [var.platform_applications[0].event_endpoint_created] : []
    content {
      event_endpoint_created = event_endpoint_created.value
    }
  }
  
  dynamic "event_endpoint_deleted" {
    for_each = var.platform_applications[0].event_endpoint_deleted != null ? [var.platform_applications[0].event_endpoint_deleted] : []
    content {
      event_endpoint_deleted = event_endpoint_deleted.value
    }
  }
  
  dynamic "event_endpoint_updated" {
    for_each = var.platform_applications[0].event_endpoint_updated != null ? [var.platform_applications[0].event_endpoint_updated] : []
    content {
      event_endpoint_updated = event_endpoint_updated.value
    }
  }
  
  dynamic "event_delivery_failure" {
    for_each = var.platform_applications[0].event_delivery_failure != null ? [var.platform_applications[0].event_delivery_failure] : []
    content {
      event_delivery_failure = event_delivery_failure.value
    }
  }
  
  success_feedback_role_arn = var.platform_applications[0].success_feedback_role_arn
  success_feedback_sample_rate = var.platform_applications[0].success_feedback_sample_rate
  failure_feedback_role_arn = var.platform_applications[0].failure_feedback_role_arn
  
  tags = merge(
    {
      Name = var.platform_applications[0].name
    },
    var.tags
  )
}

# Create SNS Platform Endpoints
resource "aws_sns_platform_endpoint" "this" {
  count = length(var.platform_endpoints) > 0 ? 1 : 0
  
  platform_application_arn = var.platform_endpoints[0].platform_application_arn
  token                    = var.platform_endpoints[0].token
  
  dynamic "custom_user_data" {
    for_each = var.platform_endpoints[0].custom_user_data != null ? [var.platform_endpoints[0].custom_user_data] : []
    content {
      custom_user_data = custom_user_data.value
    }
  }
  
  dynamic "enabled" {
    for_each = var.platform_endpoints[0].enabled != null ? [var.platform_endpoints[0].enabled] : []
    content {
      enabled = enabled.value
    }
  }
}