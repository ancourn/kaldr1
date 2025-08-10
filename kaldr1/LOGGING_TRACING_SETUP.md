# Logging and Tracing Setup Guide

## Overview

This document provides a comprehensive guide for setting up centralized logging and distributed tracing for the KALDRIX blockchain development platform.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Logging Setup](#logging-setup)
3. [Tracing Setup](#tracing-setup)
4. [Configuration Files](#configuration-files)
5. [Deployment Instructions](#deployment-instructions)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │    │    Loki Stack   │    │   Grafana       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ KALDRIX API │ │───▶│ │   Loki      │ │───▶│ │  Dashboards │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Blockchain   │ │───▶│ │ Promtail    │ │    │ │  Alerts     │ │
│ │   Node      │ │    │ └─────────────┘ │    │ └─────────────┘ │
│ └─────────────┘ │    │ ┌─────────────┐ │    └─────────────────┘
│ ┌─────────────┐ │    │ │   Jaeger    │ │
│ │ PostgreSQL  │ │───▶│ └─────────────┘ │
│ └─────────────┘ │    └─────────────────┘
└─────────────────┘
```

## Logging Setup

### 1. Loki Configuration

Create `loki-config.yaml`:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

# By default, Loki will send anonymous usage information to Grafana Labs.
# To disable this, set analytics.reporting_enabled to false
analytics:
  reporting_enabled: false
```

### 2. Promtail Configuration

Create `promtail-config.yaml`:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
- job_name: system
  static_configs:
  - targets:
      - localhost
    labels:
      job: varlogs
      __path__: /var/log/*log

- job_name: kaldr1-api
  static_configs:
  - targets:
      - localhost
    labels:
      job: kaldr1-api
      __path__: /app/logs/*.log

- job_name: blockchain-node
  static_configs:
  - targets:
      - localhost
    labels:
      job: blockchain-node
      __path__: /blockchain/logs/*.log

- job_name: postgresql
  static_configs:
  - targets:
      - localhost
    labels:
      job: postgresql
      __path__: /var/log/postgresql/*.log

# Parse JSON logs
pipeline_stages:
- json:
    expressions:
      timestamp: time
      level: level
      message: message
      service: service
- timestamp:
    source: timestamp
    format: RFC3339
- labels:
    level:
    service:
```

### 3. Docker Compose for Logging Stack

Add to your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  loki:
    image: grafana/loki:2.8.0
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:2.8.0
    volumes:
      - ./promtail-config.yaml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - ./app/logs:/app/logs:ro
      - ./blockchain/logs:/blockchain/logs:ro
    command: -config.file=/etc/promtail/config.yml
    networks:
      - monitoring
    depends_on:
      - loki

volumes:
  loki-data:

networks:
  monitoring:
    driver: bridge
```

## Tracing Setup

### 1. Jaeger Configuration

Create `jaeger-config.yaml`:

```yaml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # HTTP collector
      - "14250:14250"  # gRPC collector
      - "6831:6831/udp"  # UDP agent
      - "6832:6832/udp"  # UDP agent
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge
```

### 2. Application Tracing Integration

#### For KALDRIX API (Node.js/Express)

Install required packages:
```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-jaeger
```

Create `tracing.js`:
```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  serviceName: 'kaldr1-api',
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter: new JaegerExporter({
    endpoint: 'http://jaeger:14268/api/traces',
  }),
});

sdk.start();
```

Add to your main application file:
```javascript
require('./tracing');

const express = require('express');
const app = express();

// Your existing Express setup
```

#### For Blockchain Node (Go)

Add to your `go.mod`:
```go
require (
    go.opentelemetry.io/otel v1.19.0
    go.opentelemetry.io/otel/exporters/jaeger v1.17.0
    go.opentelemetry.io/otel/sdk v1.19.0
    go.opentelemetry.io/otel/trace v1.19.0
)
```

Create `tracing.go`:
```go
package main

import (
    "context"
    "log"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/resource"
    "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
)

func initTracer() {
    exporter, err := jaeger.New(jaeger.WithCollectorEndpoint(jaeger.WithEndpoint("http://jaeger:14268/api/traces")))
    if err != nil {
        log.Fatal(err)
    }

    tp := trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceNameKey.String("blockchain-node"),
        )),
    )
    otel.SetTracerProvider(tp)
}
```

## Configuration Files

### 1. Log Structuring Examples

#### JSON Log Format for Applications

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "service": "kaldr1-api",
  "message": "User authentication successful",
  "trace_id": "abc123def456",
  "span_id": "ghi789",
  "user_id": "user123",
  "request_id": "req456",
  "method": "POST",
  "path": "/api/auth/login",
  "status_code": 200,
  "duration_ms": 45
}
```

#### Structured Logging Configuration

For your application logging setup:

```javascript
// logging.js
const winston = require('winston');
const { format } = winston;

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'kaldr1-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

module.exports = logger;
```

## Deployment Instructions

### 1. Deploy Logging Stack

```bash
# Create necessary directories
mkdir -p ./app/logs ./blockchain/logs

# Start the logging stack
docker-compose up -d loki promtail

# Start Jaeger for tracing
docker-compose -f jaeger-config.yaml up -d jaeger
```

### 2. Configure Grafana

1. Add Loki as a data source in Grafana:
   - URL: `http://loki:3100`
   - Type: Loki

2. Add Jaeger as a data source in Grafana:
   - URL: `http://jaeger:16686`
   - Type: Jaeger

3. Import the provided dashboards:
   - API Dashboard: `monitoring/dashboards/api-dashboard.json`
   - Blockchain Dashboard: `monitoring/dashboards/blockchain-dashboard.json`
   - System Dashboard: `monitoring/dashboards/system-dashboard.json`

### 3. Verify Setup

#### Check Loki
```bash
curl http://localhost:3100/ready
```

#### Check Jaeger UI
Visit `http://localhost:16686` in your browser

#### Check Grafana
Visit `http://localhost:3000` and verify data sources are connected

## Monitoring and Alerting

### 1. Log-based Alerts

Create alert rules in Loki:

```yaml
groups:
  - name: kaldr1-log-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({job="kaldr1-api", level="error"}[5m])) by (service) 
          / sum(rate({job="kaldr1-api"}[5m])) by (service) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate in {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: ServiceDown
        expr: |
          absent({job="kaldr1-api"}) or absent({job="blockchain-node"})
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service logs missing"
          description: "No logs received from service for 1 minute"
```

### 2. Tracing Alerts

Create tracing-based alerts in Prometheus:

```yaml
groups:
  - name: tracing-alerts
    rules:
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, rate(traces_span_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}s"
```

## Troubleshooting

### 1. Common Issues

#### Loki Not Receiving Logs
- Check Promtail configuration
- Verify file permissions for log directories
- Check network connectivity between Promtail and Loki

#### Jaeger Not Showing Traces
- Verify application tracing initialization
- Check Jaeger exporter configuration
- Ensure proper service naming

#### Grafana Dashboard Issues
- Verify data source connections
- Check dashboard JSON syntax
- Ensure proper time range selection

### 2. Debug Commands

#### Check Loki Status
```bash
# Check Loki health
curl http://localhost:3100/ready

# Query Loki logs
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="kaldr1-api"}' \
  --data-urlencode 'start=2024-01-15T00:00:00Z' \
  --data-urlencode 'end=2024-01-15T23:59:59Z'
```

#### Check Jaeger Status
```bash
# Check Jaeger services
curl http://localhost:16686/api/services

# Check Jaeger traces
curl "http://localhost:16686/api/traces?service=kaldr1-api"
```

#### Check Application Logs
```bash
# View application logs
tail -f ./app/logs/combined.log

# View error logs
tail -f ./app/logs/error.log
```

### 3. Performance Tuning

#### Loki Performance
- Increase memory allocation for Loki
- Adjust retention periods
- Optimize index configuration

#### Jaeger Performance
- Adjust sampling rates
- Configure appropriate storage backend
- Monitor memory usage

#### Application Performance
- Optimize log levels
- Use appropriate sampling for traces
- Monitor resource usage

## Next Steps

1. Set up automated log rotation
2. Implement log aggregation for multiple environments
3. Add custom metrics and alerts
4. Set up long-term log storage
5. Implement log-based anomaly detection

For additional support or questions, refer to the official documentation:
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)