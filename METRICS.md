# Quantum-Proof DAG Blockchain Metrics & Monitoring

This document describes the metrics and monitoring setup for the Quantum-Proof DAG Blockchain.

## Overview

The blockchain exposes a Prometheus-compatible `/metrics` endpoint that provides comprehensive monitoring data for:
- Transaction processing
- DAG structure and health
- Consensus performance
- Node health and system resources
- Post-Quantum Cryptography (PQC) operations
- Storage performance

## Metrics Endpoint

The metrics are available at `http://localhost:8080/metrics` (default port).

### Key Metrics

#### Transaction Metrics
- `dag_transactions_total` - Total number of transactions processed
- `dag_transactions_pending` - Number of pending transactions
- `dag_transactions_confirmed` - Number of confirmed transactions
- `dag_transaction_latency_seconds` - Histogram of transaction confirmation times
- `dag_transaction_latency_seconds_bucket` - Bucketed transaction latency data
- `dag_transaction_latency_seconds_count` - Count of transaction latency measurements
- `dag_transaction_latency_seconds_sum` - Sum of transaction latency measurements

#### DAG Structure Metrics
- `dag_nodes_total` - Total number of nodes in the DAG
- `dag_depth` - Current depth of the DAG (longest chain)
- `dag_width` - Current width of the DAG (nodes at tip)
- `dag_forks_detected_total` - Total number of forks detected

#### Consensus Metrics
- `dag_consensus_rounds_total` - Total number of consensus rounds completed
- `dag_consensus_success_rate` - Success rate of consensus rounds (0-1)
- `dag_validator_score` - Current score of each validator (labeled by validator_id)
- `dag_finality_time_seconds` - Histogram of time to achieve finality
- `dag_finality_time_seconds_bucket` - Bucketed finality time data
- `dag_finality_time_seconds_count` - Count of finality time measurements
- `dag_finality_time_seconds_sum` - Sum of finality time measurements

#### Node Health Metrics
- `dag_node_uptime_seconds` - Node uptime in seconds
- `dag_memory_usage_bytes` - Current memory usage in bytes
- `dag_cpu_usage_percent` - Current CPU usage percentage
- `dag_network_connections` - Number of active network connections

#### PQC & Identity Metrics
- `dag_identity_rotations_total` - Total number of identity rotations
- `dag_signature_verifications_total` - Total number of signature verifications
- `dag_signature_failures_total` - Total number of signature verification failures

#### Storage Metrics
- `dag_storage_size_bytes` - Total storage size in bytes
- `dag_storage_operations_total` - Total number of storage operations
- `dag_storage_errors_total` - Total number of storage errors

## Grafana Dashboard

A pre-configured Grafana dashboard is available at `grafana-dashboard.json`.

### Dashboard Features

1. **Overview Section**
   - Total transactions counter
   - Pending transactions gauge
   - Confirmed transactions gauge
   - Consensus success rate gauge

2. **DAG Structure & Performance**
   - DAG structure metrics over time (nodes, depth, width)
   - Transaction latency percentiles (50th, 90th, 99th)
   - Fork detection counter
   - Finality time distribution

3. **Node Health & System Metrics**
   - Node uptime
   - Memory usage
   - CPU usage
   - Storage size
   - Resource usage trends over time

### Importing the Dashboard

1. Open Grafana
2. Navigate to Dashboards → Import
3. Upload the `grafana-dashboard.json` file
4. Configure the Prometheus data source
5. Save and view the dashboard

## Prometheus Configuration

Add the following to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'quantum-dag-blockchain'
    static_configs:
      - targets: ['localhost:8080']
    scrape_interval: 15s
    metrics_path: '/metrics'
```

## Alerting Recommendations

### Critical Alerts
- High transaction latency (> 30s)
- Low consensus success rate (< 95%)
- High memory usage (> 90%)
- Storage errors detected

### Warning Alerts
- Many pending transactions (> 100)
- Forks detected
- High CPU usage (> 80%)
- Signature verification failures

## Monitoring Best Practices

1. **Set Up Alerting**: Configure alerts for critical metrics to ensure rapid response to issues.

2. **Monitor Trends**: Use the time series graphs to identify trends and potential issues before they become critical.

3. **Track PQC Performance**: Monitor signature verification performance and failure rates to ensure quantum resistance is working correctly.

4. **Watch Storage Growth**: Monitor storage size growth to plan for capacity scaling.

5. **Consensus Health**: Keep an eye on consensus success rates and finality times to ensure network health.

## Performance Benchmarks

### Expected Performance
- Transaction latency: < 5 seconds (median)
- Finality time: < 30 seconds (median)
- Consensus success rate: > 99%
- Memory usage: < 1GB for 10,000 transactions
- Storage growth: ~1KB per transaction

### Scaling Considerations
- Monitor transaction throughput as the network grows
- Track DAG depth and width to ensure optimal performance
- Watch validator scores to maintain consensus quality

## Troubleshooting

### Common Issues

1. **High Transaction Latency**
   - Check network connectivity
   - Monitor validator performance
   - Review DAG structure for bottlenecks

2. **Low Consensus Success Rate**
   - Check validator availability
   - Review network connectivity between nodes
   - Monitor for forks or network partitions

3. **High Memory Usage**
   - Check for memory leaks
   - Review transaction cache settings
   - Monitor DAG node cleanup

4. **Storage Errors**
   - Check disk space
   - Verify database permissions
   - Review storage configuration

### Debug Commands

```bash
# Check metrics endpoint
curl http://localhost:8080/metrics

# Check specific metric
curl -s http://localhost:8080/metrics | grep dag_transactions_total

# Monitor transaction rate
watch -n 5 'curl -s http://localhost:8080/metrics | grep dag_transactions_total'
```

## Integration with External Tools

### Prometheus Operator
For Kubernetes deployments, use the Prometheus Operator for automated monitoring:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: quantum-dag-blockchain
spec:
  selector:
    matchLabels:
      app: quantum-dag-blockchain
  endpoints:
  - port: metrics
    path: /metrics
    interval: 15s
```

### Log Aggregation
Integrate with ELK stack or similar for comprehensive log analysis:

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "message": "Transaction processed",
  "metrics": {
    "transaction_count": 1000,
    "latency_ms": 2500,
    "quantum_score": 85
  }
}
```

## Security Considerations

1. **Metrics Access**: Restrict access to the `/metrics` endpoint in production environments.
2. **Sensitive Data**: Ensure no sensitive data is exposed in metrics.
3. **Rate Limiting**: Implement rate limiting for the metrics endpoint.
4. **Authentication**: Consider adding authentication for metrics access.

## Future Enhancements

1. **Custom Metrics**: Add application-specific metrics for business logic.
2. **Distributed Tracing**: Integrate with Jaeger or Zipkin for request tracing.
3. **Advanced Alerting**: Implement machine learning-based anomaly detection.
4. **Multi-node Metrics**: Aggregate metrics across multiple nodes in the network.
5. **Real-time Dashboards**: Create real-time dashboards for operational monitoring.