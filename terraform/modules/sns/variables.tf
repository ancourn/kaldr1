# KALDRIX Blockchain - SNS Module Variables

variable "name" {
  description = "Name of the SNS topic"
  type        = string
}

variable "display_name" {
  description = "Display name for the SNS topic"
  type        = string
  default     = ""
}

variable "policy" {
  description = "Policy for the SNS topic"
  type        = string
  default     = ""
}

variable "fifo_topic" {
  description = "FIFO topic configuration"
  type = object({
    content_based_deduplication = bool
  })
  default = null
}

variable "application_success_feedback_role_arn" {
  description = "Application success feedback role ARN"
  type        = string
  default     = null
}

variable "application_success_feedback_sample_rate" {
  description = "Application success feedback sample rate"
  type        = number
  default     = null
}

variable "application_failure_feedback_role_arn" {
  description = "Application failure feedback role ARN"
  type        = string
  default     = null
}

variable "http_success_feedback_role_arn" {
  description = "HTTP success feedback role ARN"
  type        = string
  default     = null
}

variable "http_success_feedback_sample_rate" {
  description = "HTTP success feedback sample rate"
  type        = number
  default     = null
}

variable "http_failure_feedback_role_arn" {
  description = "HTTP failure feedback role ARN"
  type        = string
  default     = null
}

variable "lambda_success_feedback_role_arn" {
  description = "Lambda success feedback role ARN"
  type        = string
  default     = null
}

variable "lambda_success_feedback_sample_rate" {
  description = "Lambda success feedback sample rate"
  type        = number
  default     = null
}

variable "lambda_failure_feedback_role_arn" {
  description = "Lambda failure feedback role ARN"
  type        = string
  default     = null
}

variable "sqs_success_feedback_role_arn" {
  description = "SQS success feedback role ARN"
  type        = string
  default     = null
}

variable "sqs_success_feedback_sample_rate" {
  description = "SQS success feedback sample rate"
  type        = number
  default     = null
}

variable "sqs_failure_feedback_role_arn" {
  description = "SQS failure feedback role ARN"
  type        = string
  default     = null
}

variable "kms_master_key_id" {
  description = "KMS master key ID"
  type        = string
  default     = ""
}

variable "subscriptions" {
  description = "List of SNS subscriptions"
  type = list(object({
    protocol                          = string
    endpoint                          = string
    confirmation_timeout_in_minutes   = number
    delivery_policy                   = string
    filter_policy                     = string
    filter_policy_scope               = string
    raw_message_delivery              = bool
    redrive_policy                    = object({
      dead_letter_target_arn = string
    })
    subscription_role_arn             = string
  }))
  default = []
}

variable "create_topic_policy" {
  description = "Create SNS topic policy"
  type        = bool
  default     = true
}

variable "topic_policy" {
  description = "Custom topic policy"
  type        = string
  default     = null
}

variable "platform_applications" {
  description = "List of SNS platform applications"
  type = list(object({
    name                      = string
    platform                  = string
    platform_credential       = string
    platform_principal        = string
    event_endpoint_created    = string
    event_endpoint_deleted    = string
    event_endpoint_updated    = string
    event_delivery_failure    = string
    success_feedback_role_arn  = string
    success_feedback_sample_rate = number
    failure_feedback_role_arn  = string
  }))
  default = []
}

variable "platform_endpoints" {
  description = "List of SNS platform endpoints"
  type = list(object({
    platform_application_arn = string
    token                    = string
    custom_user_data         = string
    enabled                  = bool
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}