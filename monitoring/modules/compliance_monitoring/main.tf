terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
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

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

data "aws_eks_cluster" "cluster" {
  name = var.kubernetes_cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.kubernetes_cluster_name
}

data "aws_vpc" "selected" {
  id = var.vpc_id
}

# AWS Security Hub
resource "aws_securityhub_account" "main" {
  count = var.enable_security_hub ? 1 : 0
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-security-hub"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

resource "aws_securityhub_standards_subscription" "cis_aws" {
  count      = var.enable_security_hub ? 1 : 0
  standards_arn = "arn:aws:securityhub:${var.region}::standards/cis-aws-foundations-benchmark/v/1.2.0"
  
  depends_on = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  count      = var.enable_security_hub ? 1 : 0
  standards_arn = "arn:aws:securityhub:${var.region}::standards/pci-dss/v/3.2.1"
  
  depends_on = [aws_securityhub_account.main]
}

# AWS GuardDuty
resource "aws_guardduty_detector" "main" {
  count = var.enable_guardduty ? 1 : 0
  enable = true
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-guardduty"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

resource "aws_guardduty_publishing_destination" "s3" {
  count = var.enable_guardduty ? 1 : 0
  detector_id = aws_guardduty_detector.main[0].id
  destination_type = "S3"
  
  destination_properties {
    destination_arn = "arn:aws:s3:::${var.audit_bucket_name}/guardduty"
    kms_key_arn     = aws_kms_key.audit_key[0].arn
  }
}

# Amazon Macie
resource "aws_macie2_account" "main" {
  count = var.enable_macie ? 1 : 0
  finding_publishing_frequency = "FIFTEEN_MINUTES"
  status                       = "ENABLED"
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-macie"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

resource "aws_macie2_classification_job" "s3_audit" {
  count = var.enable_macie ? 1 : 0
  job_type = "ONE_TIME"
  name     = "${var.environment}-kaldrix-s3-audit"
  
  s3_job_definition {
    bucket_definitions {
      account_id = data.aws_caller_identity.current.account_id
      buckets    = [var.audit_bucket_name]
    }
    
    scoping {
      includes {
        and {
          simple_scope_term {
            comparator = "CONTAINS"
            key        = "object.last_modified.date"
            values     = [timestamp()]
          }
        }
      }
    }
  }
  
  schedule_frequency {
    daily_schedule = true
  }
}

# AWS CloudTrail
resource "aws_cloudtrail" "kaldrix_audit" {
  count = var.enable_cloudtrail ? 1 : 0
  name                          = "${var.environment}-kaldrix-audit"
  s3_bucket_name                = var.audit_bucket_name
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::${var.audit_bucket_name}/"]
    }
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-cloudtrail"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

# AWS Config
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.environment}-kaldrix-config"
  role_arn = aws_iam_role.config_role[0].arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.environment}-kaldrix-config"
  s3_bucket_name = var.audit_bucket_name
  s3_key_prefix  = "config"
  
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules for Compliance
resource "aws_config_config_rule" "encrypted_volumes" {
  name = "${var.environment}-kaldrix-encrypted-volumes"
  
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  
  scope {
    compliance_resource_types = ["AWS::EC2::Volume"]
  }
  
  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "iam_password_policy" {
  name = "${var.environment}-kaldrix-iam-password-policy"
  
  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }
  
  input_parameters = jsonencode({
    PasswordPolicy = {
      MinimumPasswordLength        = 14
      RequireSymbols              = true
      RequireNumbers              = true
      RequireUppercaseCharacters  = true
      RequireLowercaseCharacters  = true
      MaxPasswordAge              = 90
      PasswordReusePrevention     = 5
    }
  })
  
  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "root_account_mfa" {
  name = "${var.environment}-kaldrix-root-account-mfa"
  
  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }
  
  depends_on = [aws_config_configuration_recorder_status.main]
}

# KMS Key for Audit Data Encryption
resource "aws_kms_key" "audit_key" {
  count = var.enable_cloudtrail || var.enable_guardduty || var.enable_macie ? 1 : 0
  description = "KMS key for KALDRIX audit data encryption"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow GuardDuty"
        Effect = "Allow"
        Principal = {
          Service = "guardduty.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Macie"
        Effect = "Allow"
        Principal = {
          Service = "macie.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-audit-key"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

resource "aws_kms_alias" "audit_key" {
  count = var.enable_cloudtrail || var.enable_guardduty || var.enable_macie ? 1 : 0
  name          = "alias/${var.environment}-kaldrix-audit-key"
  target_key_id = aws_kms_key.audit_key[0].key_id
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  count = var.enable_cloudtrail ? 1 : 0
  name = "${var.environment}-kaldrix-config-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-config-role"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  count      = var.enable_cloudtrail ? 1 : 0
  role       = aws_iam_role.config_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSConfigRole"
}

# Lambda function for compliance reporting
data "archive_file" "compliance_reporter" {
  count    = var.enable_cloudtrail ? 1 : 0
  type     = "zip"
  output_path = "${path.module}/compliance_reporter.zip"
  
  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const securityhub = new AWS.SecurityHub();
const cloudtrail = new AWS.CloudTrail();
const config = new AWS.ConfigService();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    console.log('Processing compliance event:', JSON.stringify(event, null, 2));
    
    try {
        // Generate compliance report
        const complianceReport = await generateComplianceReport();
        
        // Send to Security Hub
        await sendToSecurityHub(complianceReport);
        
        // Send notification if critical issues found
        if (complianceReport.criticalIssues.length > 0) {
            await sendComplianceAlert(complianceReport);
        }
        
        // Store compliance metrics
        await storeComplianceMetrics(complianceReport);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Compliance report generated successfully',
                reportId: complianceReport.reportId,
                criticalIssues: complianceReport.criticalIssues.length
            })
        };
        
    } catch (error) {
        console.error('Error generating compliance report:', error);
        throw error;
    }
};

async function generateComplianceReport() {
    const reportId = \`compliance-report-\${Date.now()}\`;
    const report = {
        reportId: reportId,
        timestamp: new Date().toISOString(),
        environment: '${var.environment}',
        region: '${var.region}',
        standards: var.compliance_standards,
        criticalIssues: [],
        highIssues: [],
        mediumIssues: [],
        lowIssues: [],
        complianceScore: 0
    };
    
    // Get Security Hub findings
    const securityHubFindings = await getSecurityHubFindings();
    
    // Get Config rule compliance
    const configCompliance = await getConfigCompliance();
    
    // Get CloudTrail events
    const cloudTrailEvents = await getCloudTrailEvents();
    
    // Analyze findings
    analyzeFindings(report, securityHubFindings, configCompliance, cloudTrailEvents);
    
    // Calculate compliance score
    report.complianceScore = calculateComplianceScore(report);
    
    return report;
}

async function getSecurityHubFindings() {
    const params = {
        Filters: {
          RecordState: [{ Value: 'ACTIVE', Comparison: 'EQUALS' }],
          SeverityLabel: [
            { Value: 'CRITICAL', Comparison: 'EQUALS' },
            { Value: 'HIGH', Comparison: 'EQUALS' },
            { Value: 'MEDIUM', Comparison: 'EQUALS' },
            { Value: 'LOW', Comparison: 'EQUALS' }
          ]
        }
    };
    
    const response = await securityhub.getFindings(params).promise();
    return response.Findings || [];
}

async function getConfigCompliance() {
    const params = {
        ConfigRuleNames: [
          '${var.environment}-kaldrix-encrypted-volumes',
          '${var.environment}-kaldrix-iam-password-policy',
          '${var.environment}-kaldrix-root-account-mfa'
        ]
    };
    
    const response = await config.describeComplianceByConfigRules(params).promise();
    return response.ComplianceByConfigRules || [];
}

async function getCloudTrailEvents() {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const params = {
        EndTime: endTime,
        StartTime: startTime,
        LookupAttributes: [
          {
            AttributeKey: 'EventName',
            AttributeValue: 'Delete*'
          }
        ]
    };
    
    const response = await cloudtrail.lookupEvents(params).promise();
    return response.Events || [];
}

function analyzeFindings(report, securityHubFindings, configCompliance, cloudTrailEvents) {
    // Analyze Security Hub findings
    securityHubFindings.forEach(finding => {
        const issue = {
            id: finding.Id,
            title: finding.Title,
            description: finding.Description,
            severity: finding.Severity.Label,
            type: finding.Types[0],
            firstObserved: finding.FirstObservedAt,
            lastObserved: finding.LastObservedAt,
            resources: finding.Resources
        };
        
        switch (finding.Severity.Label) {
            case 'CRITICAL':
                report.criticalIssues.push(issue);
                break;
            case 'HIGH':
                report.highIssues.push(issue);
                break;
            case 'MEDIUM':
                report.mediumIssues.push(issue);
                break;
            case 'LOW':
                report.lowIssues.push(issue);
                break;
        }
    });
    
    // Analyze Config compliance
    configCompliance.forEach(compliance => {
        if (compliance.Compliance.Type === 'NON_COMPLIANT') {
            const issue = {
                id: compliance.ConfigRuleName,
                title: \`Config Rule Non-Compliant: \${compliance.ConfigRuleName}\`,
                description: compliance.Compliance.ContributingCapabilities?.[0] || 'Configuration drift detected',
                severity: 'MEDIUM',
                type: 'CONFIG_DRIFT',
                firstObserved: new Date().toISOString(),
                lastObserved: new Date().toISOString(),
                resources: []
            };
            report.mediumIssues.push(issue);
        }
    });
    
    // Analyze CloudTrail events
    cloudTrailEvents.forEach(event => {
        if (event.EventName.includes('Delete') || event.EventName.includes('Remove')) {
            const issue = {
                id: event.EventId,
                title: \`Suspicious Activity: \${event.EventName}\`,
                description: \`Suspicious delete activity detected: \${event.EventName}\`,
                severity: 'HIGH',
                type: 'SECURITY_EVENT',
                firstObserved: event.EventTime,
                lastObserved: event.EventTime,
                resources: [{
                    Type: 'AWS::CloudTrail::Event',
                    Id: event.EventId
                }]
            };
            report.highIssues.push(issue);
        }
    });
}

function calculateComplianceScore(report) {
    const totalIssues = report.criticalIssues.length + 
                      report.highIssues.length + 
                      report.mediumIssues.length + 
                      report.lowIssues.length;
    
    if (totalIssues === 0) return 100;
    
    const weightedScore = (
        (report.criticalIssues.length * 10) +
        (report.highIssues.length * 5) +
        (report.mediumIssues.length * 2) +
        (report.lowIssues.length * 1)
    );
    
    return Math.max(0, 100 - weightedScore);
}

async function sendToSecurityHub(report) {
    const finding = {
        SchemaVersion: '2018-10-08',
        Id: report.reportId,
        ProductArn: \`arn:aws:securityhub:${var.region}:${data.aws_caller_identity.current.account_id}:product/${data.aws_caller_identity.current.account_id}/default\`,
        GeneratorId: \`arn:aws:securityhub:${var.region}:${data.aws_caller_identity.current.account_id}:kaldrix-compliance-reporter\`,
        AwsAccountId: data.aws_caller_identity.current.account_id,
        Types: ['Software and Configuration Checks/Industry and Regulatory Standards/KALDRIX Compliance'],
        FirstObservedAt: report.timestamp,
        LastObservedAt: report.timestamp,
        CreatedAt: report.timestamp,
        UpdatedAt: report.timestamp,
        Severity: {
          Label: report.complianceScore < 70 ? 'HIGH' : report.complianceScore < 90 ? 'MEDIUM' : 'LOW'
        },
        Title: \`KALDRIX Compliance Report - Score: \${report.complianceScore}\`,
        Description: \`Compliance report generated with \${report.criticalIssues.length} critical, \${report.highIssues.length} high, \${report.mediumIssues.length} medium, and \${report.lowIssues.length} low issues.\`,
        Resources: [{
          Type: 'AwsAccount',
          Id: data.aws_caller_identity.current.account_id,
          Region: '${var.region}'
        }],
        Compliance: {
          Status: report.complianceScore >= 90 ? 'PASSED' : report.complianceScore >= 70 ? 'WARNING' : 'FAILED'
        }
    };
    
    const params = {
        Findings: [finding]
    };
    
    await securityhub.batchImportFindings(params).promise();
}

async function sendComplianceAlert(report) {
    if (!process.env.SNS_TOPIC_ARN) {
        console.log('SNS topic ARN not configured, skipping alert');
        return;
    }
    
    const message = {
        title: 'COMPLIANCE ALERT: Critical Issues Detected',
        severity: 'critical',
        description: \`Compliance report generated with \${report.criticalIssues.length} critical issues. Overall compliance score: \${report.complianceScore}\`,
        details: {
            reportId: report.reportId,
            complianceScore: report.complianceScore,
            criticalIssues: report.criticalIssues.length,
            highIssues: report.highIssues.length,
            mediumIssues: report.mediumIssues.length,
            lowIssues: report.lowIssues.length,
            standards: report.standards
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

async function storeComplianceMetrics(report) {
    const cloudwatch = new AWS.CloudWatch();
    
    const params = {
        Namespace: 'KALDRIX/Compliance',
        MetricData: [
            {
                MetricName: 'ComplianceScore',
                Value: report.complianceScore,
                Unit: 'Percent',
                Timestamp: new Date(),
                Dimensions: [
                    {
                        Name: 'Environment',
                        Value: '${var.environment}'
                    },
                    {
                        Name: 'Region',
                        Value: '${var.region}'
                    }
                ]
            },
            {
                MetricName: 'CriticalIssues',
                Value: report.criticalIssues.length,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                    {
                        Name: 'Environment',
                        Value: '${var.environment}'
                    },
                    {
                        Name: 'Region',
                        Value: '${var.region}'
                    }
                ]
            },
            {
                MetricName: 'HighIssues',
                Value: report.highIssues.length,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                    {
                        Name: 'Environment',
                        Value: '${var.environment}'
                    },
                    {
                        Name: 'Region',
                        Value: '${var.region}'
                    }
                ]
            },
            {
                MetricName: 'MediumIssues',
                Value: report.mediumIssues.length,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                    {
                        Name: 'Environment',
                        Value: '${var.environment}'
                    },
                    {
                        Name: 'Region',
                        Value: '${var.region}'
                    }
                ]
            },
            {
                MetricName: 'LowIssues',
                Value: report.lowIssues.length,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                    {
                        Name: 'Environment',
                        Value: '${var.environment}'
                    },
                    {
                        Name: 'Region',
                        Value: '${var.region}'
                    }
                ]
            }
        ]
    };
    
    await cloudwatch.putMetricData(params).promise();
}
EOF
    filename = "compliance_reporter.js"
  }
}

# Lambda function resources
resource "aws_lambda_function" "compliance_reporter" {
  count    = var.enable_cloudtrail ? 1 : 0
  filename = data.archive_file.compliance_reporter[0].output_path
  function_name = "${var.environment}-kaldrix-compliance-reporter"
  role          = aws_iam_role.compliance_reporter_role[0].arn
  handler       = "compliance_reporter.handler"
  runtime       = "nodejs18.x"
  source_code_hash = data.archive_file.compliance_reporter[0].output_base64sha256
  
  environment {
    variables = {
      SNS_TOPIC_ARN = var.sns_topic_arn
      ENVIRONMENT   = var.environment
      REGION        = var.region
    }
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-compliance-reporter"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

resource "aws_iam_role" "compliance_reporter_role" {
  count    = var.enable_cloudtrail ? 1 : 0
  name     = "${var.environment}-kaldrix-compliance-reporter-role"
  
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
    Name        = "${var.environment}-kaldrix-compliance-reporter-role"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

resource "aws_iam_role_policy" "compliance_reporter_policy" {
  count    = var.enable_cloudtrail ? 1 : 0
  name     = "${var.environment}-kaldrix-compliance-reporter-policy"
  role     = aws_iam_role.compliance_reporter_role[0].id
  
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
          "securityhub:GetFindings",
          "securityhub:BatchImportFindings"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:DescribeComplianceByConfigRules"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:LookupEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn != "" ? var.sns_topic_arn : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Events for scheduled compliance reporting
resource "aws_cloudwatch_event_rule" "compliance_report" {
  count    = var.enable_cloudtrail ? 1 : 0
  name                = "${var.environment}-kaldrix-compliance-report"
  description         = "Daily compliance report generation"
  schedule_expression = "cron(0 6 * * ? *)" # Daily at 6 AM
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-compliance-report"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

resource "aws_cloudwatch_event_target" "compliance_report" {
  count    = var.enable_cloudtrail ? 1 : 0
  rule      = aws_cloudwatch_event_rule.compliance_report[0].name
  target_id = "ComplianceReport"
  arn       = aws_lambda_function.compliance_reporter[0].arn
}

resource "aws_lambda_permission" "allow_compliance_cloudwatch" {
  count    = var.enable_cloudtrail ? 1 : 0
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_reporter[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_report[0].arn
}

# CloudWatch Log Group for compliance reporter
resource "aws_cloudwatch_log_group" "compliance_reporter_logs" {
  count    = var.enable_cloudtrail ? 1 : 0
  name     = "/aws/lambda/${aws_lambda_function.compliance_reporter[0].function_name}"
  retention_in_days = 365 # Retain compliance logs longer
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-compliance-reporter-logs"
    Environment = var.environment
    Component   = "compliance_monitoring"
  })
}

data "aws_caller_identity" "current" {}