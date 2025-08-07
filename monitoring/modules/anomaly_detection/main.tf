terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# CloudWatch Anomaly Detection for Metrics
resource "aws_cloudwatch_anomaly_detector" "kaldrix_metrics" {
  count     = var.enable_cloudwatch_anomaly ? 1 : 0
  metric_name = "TransactionRate"
  namespace   = var.metrics_namespace
  stat        = "Sum"
  
  configuration {
    excluded_time_ranges {
      start_time = "2023-01-01T00:00:00Z"
      end_time   = "2023-01-01T06:00:00Z"
    }
    
    metric_timezone = "UTC"
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-transaction-rate-anomaly"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

resource "aws_cloudwatch_anomaly_detector" "cpu_utilization" {
  count     = var.enable_cloudwatch_anomaly ? 1 : 0
  metric_name = "CPUUtilization"
  namespace   = "AWS/EC2"
  stat        = "Average"
  
  configuration {
    metric_timezone = "UTC"
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-cpu-anomaly"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

resource "aws_cloudwatch_anomaly_detector" "memory_utilization" {
  count     = var.enable_cloudwatch_anomaly ? 1 : 0
  metric_name = "MemoryUtilization"
  namespace   = "System/Linux"
  stat        = "Average"
  
  configuration {
    metric_timezone = "UTC"
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-memory-anomaly"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

# CloudWatch Alarms for Anomaly Detection
resource "aws_cloudwatch_metric_alarm" "transaction_anomaly" {
  count             = var.enable_cloudwatch_anomaly ? 1 : 0
  alarm_name        = "${var.environment}-kaldrix-transaction-anomaly"
  alarm_description = "Anomaly detected in transaction rate"
  
  anomaly_detector_metric {
    metric_name = aws_cloudwatch_anomaly_detector.kaldrix_metrics[0].metric_name
    namespace   = aws_cloudwatch_anomaly_detector.kaldrix_metrics[0].namespace
    stat        = aws_cloudwatch_anomaly_detector.kaldrix_metrics[0].stat
  }
  
  evaluation_periods  = "2"
  datapoints_to_alarm = "2"
  threshold_metric_id = "e1"
  
  threshold_metric_id = "e1"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  
  metrics_query = <<EOF
  SELECT ANOMALY_DETECTION_BAND(m1, ${var.anomaly_detection_threshold})
  FROM SCHEMA('${aws_cloudwatch_anomaly_detector.kaldrix_metrics[0].namespace}', Name='${aws_cloudwatch_anomaly_detector.kaldrix_metrics[0].metric_name}', '${aws_cloudwatch_anomaly_detector.kaldrix_metrics[0].stat}') m1
  EOF
  
  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-transaction-anomaly-alarm"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

# Lookout for Metrics
resource "aws_lookoutmetrics_alert" "kaldrix_anomaly_alert" {
  count            = var.enable_lookout_metrics ? 1 : 0
  alert_name       = "${var.environment}-kaldrix-anomaly-alert"
  alert_sensitivity_threshold = 50
  action {
    lambda_configuration {
      lambda_arn = aws_lambda_function.anomaly_processor[0].arn
      role_arn   = aws_iam_role.lookoutmetrics_role[0].arn
    }
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-anomaly-alert"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

resource "aws_lookoutmetrics_metric_set" "kaldrix_metrics" {
  count            = var.enable_lookout_metrics ? 1 : 0
  metric_set_name  = "${var.environment}-kaldrix-metrics"
  metric_list {
    metric_name   = "TransactionRate"
    aggregation_function = "SUM"
    namespace     = var.metrics_namespace
  }
  
  metric_list {
    metric_name   = "CPUUtilization"
    aggregation_function = "AVERAGE"
    namespace     = "AWS/EC2"
  }
  
  metric_list {
    metric_name   = "MemoryUtilization"
    aggregation_function = "AVERAGE"
    namespace     = "System/Linux"
  }
  
  timestamp_column {
    column_format   = "yyyy-MM-dd'T'HH:mm:ss"
    column_name     = "timestamp"
  }
  
  dimension_list = ["region", "instance_id"]
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-metrics-set"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

# Lambda function for anomaly processing
data "archive_file" "anomaly_processor" {
  count    = var.enable_lookout_metrics ? 1 : 0
  type     = "zip"
  output_path = "${path.module}/anomaly_processor.zip"
  
  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    console.log('Processing anomaly event:', JSON.stringify(event, null, 2));
    
    try {
        const anomalyData = event.detail;
        
        // Analyze anomaly severity
        const severity = analyzeAnomalySeverity(anomalyData);
        
        // Create custom metric for anomaly tracking
        await createAnomalyMetric(anomalyData, severity);
        
        // Send alert if severity is high
        if (severity === 'high' || severity === 'critical') {
            await sendAnomalyAlert(anomalyData, severity);
        }
        
        // Log anomaly for further analysis
        await logAnomaly(anomalyData, severity);
        
        return {
            statusCode: 200,
            body: JSON.stringify('Anomaly processed successfully')
        };
        
    } catch (error) {
        console.error('Error processing anomaly:', error);
        throw error;
    }
};

function analyzeAnomalySeverity(anomalyData) {
    const anomalyScore = anomalyData.anomalyScore || 0;
    const metricValue = anomalyData.metricValue || 0;
    const expectedValue = anomalyData.expectedValue || 0;
    
    const deviation = Math.abs(metricValue - expectedValue) / expectedValue;
    
    if (anomalyScore > 80 || deviation > 0.5) {
        return 'critical';
    } else if (anomalyScore > 60 || deviation > 0.3) {
        return 'high';
    } else if (anomalyScore > 40 || deviation > 0.2) {
        return 'medium';
    } else {
        return 'low';
    }
}

async function createAnomalyMetric(anomalyData, severity) {
    const params = {
        Namespace: '${var.metrics_namespace}',
        MetricData: [
            {
                MetricName: 'AnomalyDetected',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                    {
                        Name: 'Severity',
                        Value: severity
                    },
                    {
                        Name: 'MetricName',
                        Value: anomalyData.metricName || 'unknown'
                    },
                    {
                        Name: 'Region',
                        Value: anomalyData.region || '${var.region}'
                    }
                ]
            },
            {
                MetricName: 'AnomalyScore',
                Value: anomalyData.anomalyScore || 0,
                Unit: 'None',
                Timestamp: new Date(),
                Dimensions: [
                    {
                        Name: 'MetricName',
                        Value: anomalyData.metricName || 'unknown'
                    }
                ]
            }
        ]
    };
    
    await cloudwatch.putMetricData(params).promise();
}

async function sendAnomalyAlert(anomalyData, severity) {
    if (!process.env.SNS_TOPIC_ARN) {
        console.log('SNS topic ARN not configured, skipping alert');
        return;
    }
    
    const message = {
        title: \`ANOMALY DETECTED: \${anomalyData.metricName || 'Unknown Metric'}\`,
        severity: severity,
        description: \`Anomaly detected in \${anomalyData.metricName || 'unknown metric'} with severity \${severity}\`,
        details: {
            metricName: anomalyData.metricName,
            metricValue: anomalyData.metricValue,
            expectedValue: anomalyData.expectedValue,
            anomalyScore: anomalyData.anomalyScore,
            timestamp: anomalyData.timestamp,
            region: anomalyData.region || '${var.region}'
        }
    };
    
    const params = {
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: message.title,
        Message: JSON.stringify(message),
        MessageStructure: 'json'
    };
    
    await sns.publish(params).promise();
}

async function logAnomaly(anomalyData, severity) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event_type: 'anomaly_detected',
        severity: severity,
        metric_name: anomalyData.metricName,
        metric_value: anomalyData.metricValue,
        expected_value: anomalyData.expectedValue,
        anomaly_score: anomalyData.anomalyScore,
        region: anomalyData.region || '${var.region}',
        environment: '${var.environment}'
    };
    
    console.log('Anomaly logged:', JSON.stringify(logEntry, null, 2));
}
EOF
    filename = "anomaly_processor.js"
  }
}

# Lambda function resources
resource "aws_lambda_function" "anomaly_processor" {
  count    = var.enable_lookout_metrics ? 1 : 0
  filename = data.archive_file.anomaly_processor[0].output_path
  function_name = "${var.environment}-kaldrix-anomaly-processor"
  role          = aws_iam_role.anomaly_processor_role[0].arn
  handler       = "anomaly_processor.handler"
  runtime       = "nodejs18.x"
  source_code_hash = data.archive_file.anomaly_processor[0].output_base64sha256
  
  environment {
    variables = {
      SNS_TOPIC_ARN = var.sns_topic_arn
      ENVIRONMENT   = var.environment
      REGION        = var.region
    }
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-anomaly-processor"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

resource "aws_iam_role" "anomaly_processor_role" {
  count    = var.enable_lookout_metrics ? 1 : 0
  name     = "${var.environment}-kaldrix-anomaly-processor-role"
  
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
    Name        = "${var.environment}-kaldrix-anomaly-processor-role"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

resource "aws_iam_role_policy" "anomaly_processor_policy" {
  count    = var.enable_lookout_metrics ? 1 : 0
  name     = "${var.environment}-kaldrix-anomaly-processor-policy"
  role     = aws_iam_role.anomaly_processor_role[0].id
  
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
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = var.metrics_namespace
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn != "" ? var.sns_topic_arn : "*"
      }
    ]
  })
}

resource "aws_iam_role" "lookoutmetrics_role" {
  count    = var.enable_lookout_metrics ? 1 : 0
  name     = "${var.environment}-kaldrix-lookoutmetrics-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lookoutmetrics.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-lookoutmetrics-role"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}

resource "aws_iam_role_policy" "lookoutmetrics_policy" {
  count    = var.enable_lookout_metrics ? 1 : 0
  name     = "${var.environment}-kaldrix-lookoutmetrics-policy"
  role     = aws_iam_role.lookoutmetrics_role[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.anomaly_processor[0].arn
      }
    ]
  })
}

# CloudWatch Log Group for anomaly processor
resource "aws_cloudwatch_log_group" "anomaly_processor_logs" {
  count    = var.enable_lookout_metrics ? 1 : 0
  name     = "/aws/lambda/${aws_lambda_function.anomaly_processor[0].function_name}"
  retention_in_days = 30
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-anomaly-processor-logs"
    Environment = var.environment
    Component   = "anomaly_detection"
  })
}