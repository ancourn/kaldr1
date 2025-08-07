terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# Lambda function for alert processing
data "archive_file" "alert_processor" {
  type        = "zip"
  output_path = "${path.module}/alert_processor.zip"
  
  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const sns = new AWS.SNS();
const https = require('https');

exports.handler = async (event) => {
    console.log('Processing alert event:', JSON.stringify(event, null, 2));
    
    const alarm = event.Records[0].Sns.Message;
    const alarmData = JSON.parse(alarm);
    
    // Process alert based on severity
    const severity = determineSeverity(alarmData);
    
    // Send to appropriate channels
    await sendAlerts(alarmData, severity);
    
    return {
        statusCode: 200,
        body: JSON.stringify('Alert processed successfully')
    };
};

function determineSeverity(alarmData) {
    const alarmName = alarmData.AlarmName;
    
    if (alarmName.includes('critical') || alarmName.includes('security')) {
        return 'critical';
    } else if (alarmName.includes('high') || alarmName.includes('error')) {
        return 'high';
    } else if (alarmName.includes('warning') || alarmName.includes('medium')) {
        return 'medium';
    } else {
        return 'low';
    }
}

async function sendAlerts(alarmData, severity) {
    const message = formatAlertMessage(alarmData, severity);
    
    // Send to PagerDuty for critical alerts
    if (severity === 'critical' && process.env.PAGERDUTY_KEY) {
        await sendToPagerDuty(message, alarmData);
    }
    
    // Send to Slack for all alerts
    if (process.env.SLACK_WEBHOOK) {
        await sendToSlack(message, severity);
    }
    
    // Send email for high and critical alerts
    if (severity === 'critical' || severity === 'high') {
        await sendEmail(message, alarmData);
    }
}

function formatAlertMessage(alarmData, severity) {
    const timestamp = new Date(alarmData.StateChangeTime).toISOString();
    
    return {
        title: \`\${severity.toUpperCase()}: \${alarmData.AlarmName}\`,
        message: alarmData.AlarmDescription,
        severity: severity,
        timestamp: timestamp,
        region: alarmData.Region,
        metric: alarmData.Trigger.MetricName,
        threshold: alarmData.Trigger.Threshold,
        value: alarmData.Trigger.EvaluationPeriods
    };
}

async function sendToPagerDuty(message, alarmData) {
    const payload = {
        routing_key: process.env.PAGERDUTY_KEY,
        event_action: 'trigger',
        payload: {
            summary: message.title,
            source: 'KALDRIX Monitoring',
            severity: message.severity === 'critical' ? 'critical' : 'error',
            timestamp: message.timestamp,
            custom_details: alarmData
        }
    };
    
    await sendHttpRequest('https://events.pagerduty.com/v2/enqueue', payload);
}

async function sendToSlack(message, severity) {
    const color = severity === 'critical' ? 'danger' : 
                  severity === 'high' ? 'warning' : 
                  severity === 'medium' ? '#ff9500' : 'good';
    
    const payload = {
        attachments: [{
            color: color,
            title: message.title,
            text: message.message,
            fields: [
                { title: 'Severity', value: message.severity, short: true },
                { title: 'Region', value: message.region, short: true },
                { title: 'Metric', value: message.metric, short: true },
                { title: 'Threshold', value: message.threshold, short: true },
                { title: 'Timestamp', value: message.timestamp, short: false }
            ]
        }]
    };
    
    await sendHttpRequest(process.env.SLACK_WEBHOOK, payload);
}

async function sendEmail(message, alarmData) {
    const params = {
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: message.title,
        Message: JSON.stringify({
            default: JSON.stringify(message, null, 2),
            email: \`\${message.title}\\n\\n\${message.message}\\n\\nRegion: \${message.region}\\nMetric: \${message.metric}\\nThreshold: \${message.threshold}\\nTimestamp: \${message.timestamp}\`
        }),
        MessageStructure: 'json'
    };
    
    await sns.publish(params).promise();
}

function sendHttpRequest(url, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = https.request(url, options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(responseBody);
                } else {
                    reject(new Error(\`HTTP \${res.statusCode}: \${responseBody}\`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(data);
        req.end();
    });
}
EOF
    filename = "alert_processor.js"
  }
}

# Lambda function for alert processing
resource "aws_lambda_function" "alert_processor" {
  filename         = data.archive_file.alert_processor.output_path
  function_name    = "${var.environment}-kaldrix-alert-processor"
  role            = aws_iam_role.alert_processor_role.arn
  handler         = "alert_processor.handler"
  runtime         = "nodejs18.x"
  source_code_hash = data.archive_file.alert_processor.output_base64sha256
  
  environment {
    variables = {
      SNS_TOPIC_ARN    = var.sns_topic_arn
      PAGERDUTY_KEY    = var.pagerduty_integration_key
      SLACK_WEBHOOK    = var.slack_webhook_url
    }
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-alert-processor"
    Environment = var.environment
    Component   = "alerting"
  })
}

# IAM role for alert processor
resource "aws_iam_role" "alert_processor_role" {
  name = "${var.environment}-kaldrix-alert-processor-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-alert-processor-role"
    Environment = var.environment
    Component   = "alerting"
  })
}

resource "aws_iam_role_policy" "alert_processor_policy" {
  name = "${var.environment}-kaldrix-alert-processor-policy"
  role = aws_iam_role.alert_processor_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn
      }
    ]
  })
}

# SNS subscription for alert processing
resource "aws_sns_topic_subscription" "alert_processor" {
  topic_arn = var.sns_topic_arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.alert_processor.arn
}

# Lambda permission for SNS
resource "aws_lambda_permission" "allow_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_processor.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = var.sns_topic_arn
}

# CloudWatch Events for scheduled alert processing
resource "aws_cloudwatch_event_rule" "alert_health_check" {
  name                = "${var.environment}-kaldrix-alert-health-check"
  description         = "Periodic health check for alerting system"
  schedule_expression = "rate(1 hour)"
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-alert-health-check"
    Environment = var.environment
    Component   = "alerting"
  })
}

resource "aws_cloudwatch_event_target" "alert_health_check" {
  rule      = aws_cloudwatch_event_rule.alert_health_check.name
  target_id = "AlertHealthCheck"
  arn       = aws_lambda_function.alert_processor.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.alert_health_check.arn
}

# Alert suppression rules
resource "aws_cloudwatch_event_rule" "maintenance_window" {
  name                = "${var.environment}-kaldrix-maintenance-window"
  description         = "Suppress alerts during maintenance windows"
  schedule_expression = "cron(0 2 * * ? *)" # Daily at 2 AM
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-maintenance-window"
    Environment = var.environment
    Component   = "alerting"
  })
}

# CloudWatch Log Group for alert processor
resource "aws_cloudwatch_log_group" "alert_processor_logs" {
  name              = "/aws/lambda/${aws_lambda_function.alert_processor.function_name}"
  retention_in_days = 30
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-alert-processor-logs"
    Environment = var.environment
    Component   = "alerting"
  })
}