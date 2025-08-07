# KALDRIX Blockchain - SNS Module Outputs

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.this.arn
}

output "sns_topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.this.name
}

output "sns_topic_id" {
  description = "SNS topic ID"
  value       = aws_sns_topic.this.id
}

output "sns_topic_owner" {
  description = "SNS topic owner"
  value       = aws_sns_topic.this.owner
}

output "sns_topic_display_name" {
  description = "SNS topic display name"
  value       = aws_sns_topic.this.display_name
}

output "sns_topic_policy" {
  description = "SNS topic policy"
  value       = aws_sns_topic.this.policy
}

output "sns_topic_subscriptions" {
  description = "SNS topic subscriptions"
  value = [
    for subscription in aws_sns_topic_subscription.this : {
      arn                         = subscription.arn
      topic_arn                   = subscription.topic_arn
      protocol                    = subscription.protocol
      endpoint                    = subscription.endpoint
      confirmation_timeout_in_minutes = subscription.confirmation_timeout_in_minutes
      delivery_policy             = subscription.delivery_policy
      filter_policy               = subscription.filter_policy
      filter_policy_scope         = subscription.filter_policy_scope
      raw_message_delivery        = subscription.raw_message_delivery
      redrive_policy              = subscription.redrive_policy
      subscription_role_arn       = subscription.subscription_role_arn
    }
  ]
}

output "sns_topic_policy_arn" {
  description = "SNS topic policy ARN"
  value       = var.create_topic_policy ? aws_sns_topic_policy.this[0].arn : ""
}

output "sns_platform_application_arn" {
  description = "SNS platform application ARN"
  value       = length(var.platform_applications) > 0 ? aws_sns_platform_application.this[0].arn : ""
}

output "sns_platform_application_name" {
  description = "SNS platform application name"
  value       = length(var.platform_applications) > 0 ? aws_sns_platform_application.this[0].name : ""
}

output "sns_platform_endpoint_arn" {
  description = "SNS platform endpoint ARN"
  value       = length(var.platform_endpoints) > 0 ? aws_sns_platform_endpoint.this[0].arn : ""
}

output "sns_platform_endpoint_id" {
  description = "SNS platform endpoint ID"
  value       = length(var.platform_endpoints) > 0 ? aws_sns_platform_endpoint.this[0].id : ""
}

output "sns_summary" {
  description = "SNS summary"
  value = {
    topic = {
      arn          = aws_sns_topic.this.arn
      name         = aws_sns_topic.this.name
      id           = aws_sns_topic.this.id
      owner        = aws_sns_topic.this.owner
      display_name = aws_sns_topic.this.display_name
      policy       = aws_sns_topic.this.policy
    }
    subscriptions = [
      for subscription in aws_sns_topic_subscription.this : {
        arn                         = subscription.arn
        topic_arn                   = subscription.topic_arn
        protocol                    = subscription.protocol
        endpoint                    = subscription.endpoint
        confirmation_timeout_in_minutes = subscription.confirmation_timeout_in_minutes
        delivery_policy             = subscription.delivery_policy
        filter_policy               = subscription.filter_policy
        filter_policy_scope         = subscription.filter_policy_scope
        raw_message_delivery        = subscription.raw_message_delivery
        redrive_policy              = subscription.redrive_policy
        subscription_role_arn       = subscription.subscription_role_arn
      }
    ]
    topic_policy = var.create_topic_policy ? {
      arn    = aws_sns_topic_policy.this[0].arn
      policy = aws_sns_topic_policy.this[0].policy
    } : null
    platform_application = length(var.platform_applications) > 0 ? {
      arn                      = aws_sns_platform_application.this[0].arn
      name                     = aws_sns_platform_application.this[0].name
      platform                 = aws_sns_platform_application.this[0].platform
      platform_credential      = aws_sns_platform_application.this[0].platform_credential
      platform_principal       = aws_sns_platform_application.this[0].platform_principal
      event_endpoint_created    = aws_sns_platform_application.this[0].event_endpoint_created
      event_endpoint_deleted    = aws_sns_platform_application.this[0].event_endpoint_deleted
      event_endpoint_updated    = aws_sns_platform_application.this[0].event_endpoint_updated
      event_delivery_failure    = aws_sns_platform_application.this[0].event_delivery_failure
      success_feedback_role_arn = aws_sns_platform_application.this[0].success_feedback_role_arn
      success_feedback_sample_rate = aws_sns_platform_application.this[0].success_feedback_sample_rate
      failure_feedback_role_arn = aws_sns_platform_application.this[0].failure_feedback_role_arn
    } : null
    platform_endpoint = length(var.platform_endpoints) > 0 ? {
      arn                      = aws_sns_platform_endpoint.this[0].arn
      id                       = aws_sns_platform_endpoint.this[0].id
      platform_application_arn = aws_sns_platform_endpoint.this[0].platform_application_arn
      token                    = aws_sns_platform_endpoint.this[0].token
      custom_user_data         = aws_sns_platform_endpoint.this[0].custom_user_data
      enabled                  = aws_sns_platform_endpoint.this[0].enabled
    } : null
  }
}