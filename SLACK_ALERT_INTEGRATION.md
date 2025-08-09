# Slack Alert Integration Guide

## Overview

This guide provides step-by-step instructions for integrating Slack notifications with the KALDRIX monitoring and alerting system. This integration enables real-time alerts to be sent to designated Slack channels when critical issues are detected.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Slack App Setup](#slack-app-setup)
3. [Alertmanager Configuration](#alertmanager-configuration)
4. [Alert Templates](#alert-templates)
5. [Channel Configuration](#channel-configuration)
6. [Testing and Validation](#testing-and-validation)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Prerequisites

Before setting up Slack integration, ensure you have:

- ✅ Administrator access to your Slack workspace
- ✅ Alertmanager already configured and running
- ✅ Grafana and Prometheus monitoring stack operational
- ✅ Slack channel(s) designated for alerts

## Slack App Setup

### 1. Create Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Enter app details:
   - **App Name**: `KALDRIX Alerts`
   - **Development Workspace**: Select your workspace
5. Click "Create App"

### 2. Configure OAuth & Permissions

1. Navigate to "OAuth & Permissions" in the left sidebar
2. Under "Scopes", add the following Bot Token Scopes:
   ```
   chat:write
   chat:write.customize
   incoming-webhook
   ```

3. Scroll to "App-Level Tokens" and create a token:
   - **Token Name**: `Alertmanager Integration`
   - **Scopes**: `incoming-webhook`

4. Click "Save Changes"

### 3. Install App to Workspace

1. Go to "Install App" in the left sidebar
2. Click "Install to Workspace"
3. Click "Allow" to grant permissions
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 4. Create Incoming Webhook

1. Go to "Incoming Webhooks" in the left sidebar
2. Toggle "Activate Incoming Webhooks" to On
3. Click "Add New Webhook to Workspace"
4. Select the channel where alerts should be posted
5. Click "Allow"
6. Copy the **Webhook URL** (starts with `https://hooks.slack.com/services/`)

## Alertmanager Configuration

### 1. Create Alertmanager Configuration

Create `alertmanager.yml`:

```yaml
global:
  # The smarthost and SMTP sender used for mail notifications.
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@kaldr1.com'
  smtp_auth_username: 'alerts@kaldr1.com'
  smtp_auth_password: 'your-smtp-password'

# The root route on which each incoming alert enters.
route:
  group_by: ['alertname', 'severity', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    # Critical alerts go to critical channel
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: true
    
    # Warning alerts go to warnings channel
    - match:
        severity: warning
      receiver: 'warning-alerts'
      continue: true
    
    # All alerts go to general alerts channel
    - receiver: 'all-alerts'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://127.0.0.1:5001/'

# Critical alerts receiver
- name: 'critical-alerts'
  slack_configs:
  - api_url: 'YOUR_CRITICAL_CHANNEL_WEBHOOK_URL'
    channel: '#critical-alerts'
    title: '🚨 Critical Alert: {{ .GroupLabels.alertname }}'
    text: |-
      {{ range .Alerts }}
      *Alert:* {{ .Annotations.summary }}
      *Description:* {{ .Annotations.description }}
      *Severity:* {{ .Labels.severity }}
      *Service:* {{ .Labels.service }}
      *Environment:* {{ .Labels.environment }}
      *Starts:* {{ .StartsAt }}
      {{ end }}
    color: 'danger'
    fallback: 'Critical alert from KALDRIX monitoring'
    send_resolved: true

# Warning alerts receiver
- name: 'warning-alerts'
  slack_configs:
  - api_url: 'YOUR_WARNING_CHANNEL_WEBHOOK_URL'
    channel: '#warning-alerts'
    title: '⚠️ Warning Alert: {{ .GroupLabels.alertname }}'
    text: |-
      {{ range .Alerts }}
      *Alert:* {{ .Annotations.summary }}
      *Description:* {{ .Annotations.description }}
      *Severity:* {{ .Labels.severity }}
      *Service:* {{ .Labels.service }}
      *Environment:* {{ .Labels.environment }}
      *Starts:* {{ .StartsAt }}
      {{ end }}
    color: 'warning'
    fallback: 'Warning alert from KALDRIX monitoring'
    send_resolved: true

# All alerts receiver
- name: 'all-alerts'
  slack_configs:
  - api_url: 'YOUR_ALL_ALERTS_WEBHOOK_URL'
    channel: '#all-alerts'
    title: '📊 Alert: {{ .GroupLabels.alertname }}'
    text: |-
      {{ range .Alerts }}
      *Alert:* {{ .Annotations.summary }}
      *Description:* {{ .Annotations.description }}
      *Severity:* {{ .Labels.severity }}
      *Service:* {{ .Labels.service }}
      *Environment:* {{ .Labels.environment }}
      *Starts:* {{ .StartsAt }}
      {{ end }}
    color: '{{ if eq .Labels.severity "critical" }}danger{{ else if eq .Labels.severity "warning" }}warning{{ else }}good{{ end }}'
    fallback: 'Alert from KALDRIX monitoring'
    send_resolved: true

# Email notifications (optional)
- name: 'email-notifications'
  email_configs:
  - to: 'team@kaldr1.com'
    subject: 'KALDRIX Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      Severity: {{ .Labels.severity }}
      Service: {{ .Labels.service }}
      Environment: {{ .Labels.environment }}
      Starts: {{ .StartsAt }}
      {{ end }}
    headers:
      Subject: 'KALDRIX Alert: {{ .GroupLabels.alertname }}'
      From: 'alerts@kaldr1.com'
    send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
```

### 2. Create Docker Compose for Alertmanager

Add to your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  alertmanager:
    image: prom/alertmanager:v0.26.0
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    networks:
      - monitoring

  # Slack webhook proxy (optional, for enhanced features)
  slack-proxy:
    image: alpine/socat
    command: TCP-LISTEN:5001,fork,reuseaddr EXEC:'curl -X POST -H "Content-Type: application/json" -d @- YOUR_SLACK_WEBHOOK_URL'
    networks:
      - monitoring
    depends_on:
      - alertmanager

volumes:
  alertmanager-data:

networks:
  monitoring:
    driver: bridge
```

## Alert Templates

### 1. Critical Alert Template

```yaml
# Critical alert configuration
- name: 'critical-alerts'
  slack_configs:
  - api_url: '${SLACK_CRITICAL_WEBHOOK}'
    channel: '#critical-alerts'
    title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
    text: |-
      *🚨 CRITICAL ALERT DETECTED 🚨*
      
      *Alert:* {{ .Annotations.summary }}
      *Description:* {{ .Annotations.description }}
      
      *Details:*
      • *Severity:* {{ .Labels.severity | upper }}
      • *Service:* {{ .Labels.service }}
      • *Environment:* {{ .Labels.environment }}
      • *Instance:* {{ .Labels.instance }}
      • *Started:* {{ .StartsAt }}
      
      *Actions Required:*
      • Immediate investigation required
      • Check service logs: `/logs {{ .Labels.service }}`
      • Verify system health: `/health {{ .Labels.service }}`
      • Escalate to on-call if unresolved in 5 minutes
      
      *Links:*
      • Grafana Dashboard: {{ .GeneratorURL }}
      • Runbook: https://docs.kaldr1.com/runbooks/{{ .Labels.alertname }}
    color: '#FF0000'
    fallback: 'Critical alert from KALDRIX'
    send_resolved: true
    resolved_text: |-
      *✅ RESOLVED: {{ .GroupLabels.alertname }}*
      
      The critical alert has been resolved.
      
      *Duration:* {{ .Annotations.resolved_duration }}
      *Resolved At:* {{ .EndsAt }}
    resolved_color: '#36A64F'
```

### 2. Warning Alert Template

```yaml
# Warning alert configuration
- name: 'warning-alerts'
  slack_configs:
  - api_url: '${SLACK_WARNING_WEBHOOK}'
    channel: '#warning-alerts'
    title: '⚠️ WARNING: {{ .GroupLabels.alertname }}'
    text: |-
      *⚠️ WARNING ALERT ⚠️*
      
      *Alert:* {{ .Annotations.summary }}
      *Description:* {{ .Annotations.description }}
      
      *Details:*
      • *Severity:* {{ .Labels.severity | upper }}
      • *Service:* {{ .Labels.service }}
      • *Environment:* {{ .Labels.environment }}
      • *Instance:* {{ .Labels.instance }}
      • *Started:* {{ .StartsAt }}
      
      *Recommended Actions:*
      • Monitor the situation
      • Check service metrics
      • Investigate if trend continues
      • Escalate if condition worsens
      
      *Links:*
      • Grafana Dashboard: {{ .GeneratorURL }}
      • Documentation: https://docs.kaldr1.com/alerts/{{ .Labels.alertname }}
    color: '#FFA500'
    fallback: 'Warning alert from KALDRIX'
    send_resolved: true
    resolved_text: |-
      *✅ RESOLVED: {{ .GroupLabels.alertname }}*
      
      The warning alert has been resolved.
      
      *Duration:* {{ .Annotations.resolved_duration }}
      *Resolved At:* {{ .EndsAt }}
    resolved_color: '#36A64F'
```

### 3. Info Alert Template

```yaml
# Info alert configuration
- name: 'info-alerts'
  slack_configs:
  - api_url: '${SLACK_INFO_WEBHOOK}'
    channel: '#info-alerts'
    title: 'ℹ️ INFO: {{ .GroupLabels.alertname }}'
    text: |-
      *ℹ️ INFORMATIONAL ALERT ℹ️*
      
      *Alert:* {{ .Annotations.summary }}
      *Description:* {{ .Annotations.description }}
      
      *Details:*
      • *Severity:* {{ .Labels.severity | upper }}
      • *Service:* {{ .Labels.service }}
      • *Environment:* {{ .Labels.environment }}
      • *Started:* {{ .StartsAt }}
      
      *For Reference:*
      • This is an informational alert
      • No immediate action required
      • Monitor for related events
      
      *Links:*
      • Grafana Dashboard: {{ .GeneratorURL }}
    color: '#439FE0'
    fallback: 'Info alert from KALDRIX'
    send_resolved: true
```

## Channel Configuration

### 1. Recommended Slack Channels

| Channel | Purpose | Alert Types | Audience |
|---------|---------|-------------|----------|
| `#critical-alerts` | Immediate attention required | Critical only | On-call team, DevOps |
| `#warning-alerts` | Monitoring warnings | Warning, Info | Development team |
| `#all-alerts` | Comprehensive alert logging | All alerts | Entire team |
| `#deployment-alerts` | Deployment-related alerts | Deployment events | DevOps, QA |
| `#security-alerts` | Security-related alerts | Security events | Security team |

### 2. Channel Setup Instructions

For each channel:

1. Create the channel in Slack
2. Invite the `@KALDRIX Alerts` bot
3. Set channel purpose and description
4. Configure channel notifications:
   ```bash
   /channel purpose Critical alerts requiring immediate attention
   /channel description All critical system alerts from KALDRIX monitoring
   ```

### 3. Channel Permissions

Configure channel permissions:

```
#critical-alerts
- Posting: Only @KALDRIX Alerts bot
- Members: On-call team, DevOps leads
- Notifications: All notifications

#warning-alerts
- Posting: @KALDRIX Alerts bot, team members
- Members: Development team
- Notifications: Mentions and direct messages

#all-alerts
- Posting: @KALDRIX Alerts bot
- Members: All team members
- Notifications: Mentions and direct messages
```

## Testing and Validation

### 1. Test Alertmanager Configuration

```bash
# Validate Alertmanager configuration
docker run --rm -v $(pwd)/alertmanager.yml:/etc/alertmanager/alertmanager.yml \
  prom/alertmanager:v0.26.0 check-config /etc/alertmanager/alertmanager.yml

# Test Alertmanager web interface
curl http://localhost:9093/api/v1/status
```

### 2. Test Slack Integration

#### Test Webhook Connection

```bash
# Test webhook with sample alert
curl -X POST -H 'Content-type: application/json' \
  --data '{
    "text": "Test alert from KALDRIX",
    "attachments": [
      {
        "color": "danger",
        "title": "Test Alert",
        "text": "This is a test alert to verify Slack integration",
        "fields": [
          {
            "title": "Severity",
            "value": "critical",
            "short": true
          },
          {
            "title": "Service",
            "value": "test-service",
            "short": true
          }
        ]
      }
    ]
  }' \
  YOUR_SLACK_WEBHOOK_URL
```

#### Test Alertmanager to Slack

1. Create a test alert rule in Prometheus:
   ```yaml
   groups:
     - name: test-alerts
       rules:
         - alert: TestAlert
           expr: up == 0
           for: 1m
           labels:
             severity: critical
             service: test-service
           annotations:
             summary: "Test alert"
             description: "This is a test alert"
   ```

2. Wait for the alert to fire and check Slack channel

### 3. Validation Checklist

- [ ] Alertmanager configuration validates successfully
- [ ] Alertmanager web interface is accessible
- [ ] Slack app is installed and configured
- [ ] Webhook URLs are working
- [ ] Test alerts are received in Slack channels
- [ ] Alert resolution notifications are working
- [ ] Channel permissions are correctly set
- [ ] Alert grouping and routing is working as expected

## Troubleshooting

### 1. Common Issues

#### Alerts Not Sending to Slack

**Symptoms**: No alerts appearing in Slack channels

**Possible Causes**:
- Incorrect webhook URL
- Slack app permissions not granted
- Alertmanager not running
- Network connectivity issues

**Solutions**:
1. Verify webhook URL with curl test
2. Check Slack app permissions
3. Verify Alertmanager is running: `docker ps | grep alertmanager`
4. Check network connectivity: `curl -v YOUR_WEBHOOK_URL`

#### Alerts Not Grouping Correctly

**Symptoms**: Too many individual alerts instead of grouped alerts

**Possible Causes**:
- Incorrect `group_by` configuration
- Missing labels on alerts
- Alertmanager configuration syntax errors

**Solutions**:
1. Review `group_by` configuration in `alertmanager.yml`
2. Ensure alerts have consistent labels
3. Validate configuration syntax
4. Check Alertmanager logs for errors

#### Duplicate Alerts

**Symptoms**: Same alert appearing multiple times

**Possible Causes**:
- Multiple Alertmanager instances
- Incorrect `repeat_interval` configuration
- Alert rules firing multiple times

**Solutions**:
1. Check for multiple Alertmanager instances
2. Adjust `repeat_interval` in configuration
3. Review alert rule definitions
4. Check Prometheus configuration

### 2. Debug Commands

#### Check Alertmanager Status

```bash
# Check Alertmanager health
curl http://localhost:9093/-/healthy

# Check Alertmanager configuration
curl http://localhost:9093/api/v1/status

# Check active alerts
curl http://localhost:9093/api/v1/alerts
```

#### Check Slack App Status

```bash
# Test Slack app authentication
curl -X POST -H "Authorization: Bearer YOUR_BOT_TOKEN" \
  -H "Content-type: application/json" \
  --data '{"channel":"#test","text":"Test message"}' \
  https://slack.com/api/chat.postMessage
```

#### Check Logs

```bash
# View Alertmanager logs
docker logs alertmanager

# View Slack proxy logs (if using)
docker logs slack-proxy

# View Prometheus logs
docker logs prometheus
```

### 3. Performance Optimization

#### Alertmanager Performance

- Adjust `group_wait` and `group_interval` for better grouping
- Use appropriate `repeat_interval` to avoid spam
- Consider using silence for planned maintenance

#### Slack Performance

- Use appropriate channels for different alert types
- Implement alert suppression during maintenance windows
- Use threading for related alerts

## Best Practices

### 1. Alert Management

#### Alert Severity Levels

Define clear severity levels:

```
Critical: System down, data loss, security breach
Warning: High latency, resource exhaustion, degraded performance
Info: Scheduled maintenance, informational events
```

#### Alert Naming Conventions

Use consistent naming:
```
HighErrorRate
ServiceDown
DatabaseConnectionFailure
DiskSpaceLow
MemoryUsageHigh
```

### 2. Slack Etiquette

#### Message Formatting

- Use clear, concise language
- Include actionable information
- Use appropriate emojis for severity
- Provide links to dashboards and runbooks

#### Channel Management

- Keep channels focused on specific alert types
- Use threads for related discussions
- Archive old alerts regularly
- Maintain channel membership

### 3. Maintenance and Updates

#### Regular Maintenance

- Review alert rules monthly
- Update contact information
- Test alert delivery regularly
- Archive outdated alert configurations

#### Documentation

- Maintain runbooks for common alerts
- Document escalation procedures
- Keep contact lists updated
- Record alert tuning decisions

## Next Steps

1. Set up additional notification channels (email, SMS, PagerDuty)
2. Implement alert suppression for maintenance windows
3. Create custom alert templates for specific services
4. Set up alert analytics and reporting
5. Implement machine learning for alert prediction

For additional support or questions, refer to:
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Slack API Documentation](https://api.slack.com/)
- [KALDRIX Runbook](https://docs.kaldr1.com/runbooks/)