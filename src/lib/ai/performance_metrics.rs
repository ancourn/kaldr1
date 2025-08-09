//! Performance Metrics Module for KALDRIX AI Runtime
//! 
//! Tracks and analyzes performance metrics for AI operations,
//! system resources, and inference statistics
//! 
//! © 2025 KALDRIX Blockchain. All rights reserved.

use std::collections::{HashMap, VecDeque};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};

/// Metric Types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
pub enum MetricType {
    InferenceTime,
    InferenceError,
    MemoryUsage,
    CPUUsage,
    GPUUsage,
    NetworkLatency,
    Throughput,
    QueueLength,
    CacheHitRate,
    ModelLoadTime,
    WASMExecutionTime,
    SecurityValidationTime,
    AnalysisAccuracy,
    ResourceUtilization,
    Custom(String),
}

/// Performance Metrics
pub struct PerformanceMetrics {
    metrics: HashMap<MetricType, VecDeque<MetricDataPoint>>,
    system_metrics: SystemMetrics,
    start_time: SystemTime,
    max_history_size: usize,
    aggregation_window: Duration,
}

/// Metric Data Point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricDataPoint {
    pub timestamp: u64,
    pub value: f64,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// System Metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub total_memory_mb: f64,
    pub available_memory_mb: f64,
    pub cpu_usage_percent: f64,
    pub gpu_usage_percent: Option<f64>,
    pub network_io_bytes_per_sec: f64,
    pub disk_io_bytes_per_sec: f64,
    pub process_count: u32,
    pub thread_count: u32,
    pub load_average: f64,
    pub temperature_celsius: Option<f64>,
}

/// Performance Statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceStats {
    pub metric_type: MetricType,
    pub count: usize,
    pub min_value: f64,
    pub max_value: f64,
    pub mean_value: f64,
    pub median_value: f64,
    pub std_deviation: f64,
    pub percentile_95: f64,
    pub percentile_99: f64,
    pub time_window_start: u64,
    pub time_window_end: u64,
}

/// Resource Usage Report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUsageReport {
    pub timestamp: u64,
    pub memory_usage_mb: f64,
    pub cpu_usage_percent: f64,
    pub gpu_usage_percent: Option<f64>,
    pub network_throughput_mbps: f64,
    pub disk_throughput_mbps: f64,
    pub active_connections: u32,
    pub queue_depth: u32,
    pub health_score: f64,
}

/// Performance Alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAlert {
    pub alert_id: String,
    pub alert_type: AlertType,
    pub severity: AlertSeverity,
    pub metric_type: MetricType,
    pub current_value: f64,
    pub threshold_value: f64,
    pub description: String,
    pub timestamp: u64,
    pub recommended_action: String,
}

/// Alert Types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertType {
    ThresholdExceeded,
    TrendAnomaly,
    ResourceExhaustion,
    PerformanceDegradation,
    SecurityBreach,
    Custom(String),
}

/// Alert Severity
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

impl PerformanceMetrics {
    /// Create new performance metrics tracker
    pub fn new() -> Self {
        Self {
            metrics: HashMap::new(),
            system_metrics: SystemMetrics {
                total_memory_mb: 0.0,
                available_memory_mb: 0.0,
                cpu_usage_percent: 0.0,
                gpu_usage_percent: None,
                network_io_bytes_per_sec: 0.0,
                disk_io_bytes_per_sec: 0.0,
                process_count: 0,
                thread_count: 0,
                load_average: 0.0,
                temperature_celsius: None,
            },
            start_time: SystemTime::now(),
            max_history_size: 1000,
            aggregation_window: Duration::from_secs(300), // 5 minutes
        }
    }

    /// Record a metric
    pub fn record_metric(&mut self, metric_type: MetricType, value: f64) {
        let data_point = MetricDataPoint {
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            value,
            metadata: HashMap::new(),
        };

        let metric_history = self.metrics.entry(metric_type.clone()).or_insert_with(VecDeque::new);
        metric_history.push_back(data_point);

        // Enforce history size limit
        if metric_history.len() > self.max_history_size {
            metric_history.pop_front();
        }
    }

    /// Record metric with metadata
    pub fn record_metric_with_metadata(
        &mut self,
        metric_type: MetricType,
        value: f64,
        metadata: HashMap<String, serde_json::Value>,
    ) {
        let data_point = MetricDataPoint {
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            value,
            metadata,
        };

        let metric_history = self.metrics.entry(metric_type.clone()).or_insert_with(VecDeque::new);
        metric_history.push_back(data_point);

        // Enforce history size limit
        if metric_history.len() > self.max_history_size {
            metric_history.pop_front();
        }
    }

    /// Get metric history
    pub fn get_metric_history(&self, metric_type: &MetricType) -> Option<&VecDeque<MetricDataPoint>> {
        self.metrics.get(metric_type)
    }

    /// Get latest metric value
    pub fn get_latest_metric(&self, metric_type: &MetricType) -> Option<f64> {
        self.metrics
            .get(metric_type)
            .and_then(|history| history.back())
            .map(|point| point.value)
    }

    /// Calculate performance statistics
    pub fn calculate_stats(&self, metric_type: &MetricType) -> Option<PerformanceStats> {
        let history = self.metrics.get(metric_type)?;
        if history.is_empty() {
            return None;
        }

        let values: Vec<f64> = history.iter().map(|p| p.value).collect();
        let count = values.len();
        let min_value = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_value = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let mean_value = values.iter().sum::<f64>() / count as f64;

        // Calculate median
        let mut sorted_values = values.clone();
        sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let median_value = if count % 2 == 0 {
            (sorted_values[count / 2 - 1] + sorted_values[count / 2]) / 2.0
        } else {
            sorted_values[count / 2]
        };

        // Calculate standard deviation
        let variance = values.iter()
            .map(|&x| (x - mean_value).powi(2))
            .sum::<f64>() / count as f64;
        let std_deviation = variance.sqrt();

        // Calculate percentiles
        let percentile_95 = self.calculate_percentile(&sorted_values, 95.0);
        let percentile_99 = self.calculate_percentile(&sorted_values, 99.0);

        let time_window_start = history.front().unwrap().timestamp;
        let time_window_end = history.back().unwrap().timestamp;

        Some(PerformanceStats {
            metric_type: metric_type.clone(),
            count,
            min_value,
            max_value,
            mean_value,
            median_value,
            std_deviation,
            percentile_95,
            percentile_99,
            time_window_start,
            time_window_end,
        })
    }

    /// Calculate percentile
    fn calculate_percentile(&self, sorted_values: &[f64], percentile: f64) -> f64 {
        if sorted_values.is_empty() {
            return 0.0;
        }

        let index = (percentile / 100.0 * (sorted_values.len() - 1) as f64) as usize;
        sorted_values[index.min(sorted_values.len() - 1)]
    }

    /// Get aggregated metrics over time window
    pub fn get_aggregated_metrics(&self, time_window: Duration) -> HashMap<MetricType, PerformanceStats> {
        let cutoff_time = SystemTime::now() - time_window;
        let cutoff_timestamp = cutoff_time.duration_since(UNIX_EPOCH).unwrap().as_secs();

        let mut aggregated = HashMap::new();

        for (metric_type, history) in &self.metrics {
            let filtered_history: VecDeque<_> = history.iter()
                .filter(|point| point.timestamp >= cutoff_timestamp)
                .cloned()
                .collect();

            if !filtered_history.is_empty() {
                let values: Vec<f64> = filtered_history.iter().map(|p| p.value).collect();
                let count = values.len();
                let min_value = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
                let max_value = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
                let mean_value = values.iter().sum::<f64>() / count as f64;

                let mut sorted_values = values.clone();
                sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
                let median_value = if count % 2 == 0 {
                    (sorted_values[count / 2 - 1] + sorted_values[count / 2]) / 2.0
                } else {
                    sorted_values[count / 2]
                };

                let variance = values.iter()
                    .map(|&x| (x - mean_value).powi(2))
                    .sum::<f64>() / count as f64;
                let std_deviation = variance.sqrt();

                let percentile_95 = self.calculate_percentile(&sorted_values, 95.0);
                let percentile_99 = self.calculate_percentile(&sorted_values, 99.0);

                let time_window_start = filtered_history.front().unwrap().timestamp;
                let time_window_end = filtered_history.back().unwrap().timestamp;

                aggregated.insert(metric_type.clone(), PerformanceStats {
                    metric_type: metric_type.clone(),
                    count,
                    min_value,
                    max_value,
                    mean_value,
                    median_value,
                    std_deviation,
                    percentile_95,
                    percentile_99,
                    time_window_start,
                    time_window_end,
                });
            }
        }

        aggregated
    }

    /// Update system metrics
    pub fn update_system_metrics(&mut self) {
        // Mock implementation - in reality, this would query system APIs
        self.system_metrics = SystemMetrics {
            total_memory_mb: 8192.0,
            available_memory_mb: 4096.0,
            cpu_usage_percent: 25.0,
            gpu_usage_percent: Some(15.0),
            network_io_bytes_per_sec: 1024.0 * 1024.0, // 1 MB/s
            disk_io_bytes_per_sec: 512.0 * 1024.0,   // 512 KB/s
            process_count: 150,
            thread_count: 500,
            load_average: 0.5,
            temperature_celsius: Some(65.0),
        };

        // Record system metrics
        self.record_metric(MetricType::MemoryUsage, 
            (self.system_metrics.total_memory_mb - self.system_metrics.available_memory_mb) / self.system_metrics.total_memory_mb * 100.0);
        self.record_metric(MetricType::CPUUsage, self.system_metrics.cpu_usage_percent);
        if let Some(gpu_usage) = self.system_metrics.gpu_usage_percent {
            self.record_metric(MetricType::GPUUsage, gpu_usage);
        }
    }

    /// Get system metrics
    pub fn get_system_metrics(&self) -> &SystemMetrics {
        &self.system_metrics
    }

    /// Generate resource usage report
    pub fn generate_resource_report(&self) -> ResourceUsageReport {
        let memory_usage_mb = self.system_metrics.total_memory_mb - self.system_metrics.available_memory_mb;
        let memory_usage_percent = memory_usage_mb / self.system_metrics.total_memory_mb * 100.0;
        
        let health_score = self.calculate_health_score();

        ResourceUsageReport {
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            memory_usage_mb,
            cpu_usage_percent: self.system_metrics.cpu_usage_percent,
            gpu_usage_percent: self.system_metrics.gpu_usage_percent,
            network_throughput_mbps: self.system_metrics.network_io_bytes_per_sec / (1024.0 * 1024.0),
            disk_throughput_mbps: self.system_metrics.disk_io_bytes_per_sec / (1024.0 * 1024.0),
            active_connections: 100, // Mock value
            queue_depth: self.get_latest_metric(&MetricType::QueueLength).unwrap_or(0.0) as u32,
            health_score,
        }
    }

    /// Calculate health score
    fn calculate_health_score(&self) -> f64 {
        let mut score = 100.0;
        
        // Deduct for high memory usage
        let memory_usage_percent = (self.system_metrics.total_memory_mb - self.system_metrics.available_memory_mb) / self.system_metrics.total_memory_mb * 100.0;
        if memory_usage_percent > 80.0 {
            score -= (memory_usage_percent - 80.0) * 2.0;
        }
        
        // Deduct for high CPU usage
        if self.system_metrics.cpu_usage_percent > 70.0 {
            score -= (self.system_metrics.cpu_usage_percent - 70.0) * 1.5;
        }
        
        // Deduct for high GPU usage
        if let Some(gpu_usage) = self.system_metrics.gpu_usage_percent {
            if gpu_usage > 80.0 {
                score -= (gpu_usage - 80.0) * 1.0;
            }
        }
        
        // Deduct for high error rate
        if let Some(error_rate) = self.get_latest_metric(&MetricType::InferenceError) {
            if error_rate > 0.05 {
                score -= error_rate * 100.0;
            }
        }
        
        score.max(0.0).min(100.0)
    }

    /// Check for performance alerts
    pub fn check_alerts(&self) -> Vec<PerformanceAlert> {
        let mut alerts = Vec::new();
        
        // Check memory usage
        let memory_usage_percent = (self.system_metrics.total_memory_mb - self.system_metrics.available_memory_mb) / self.system_metrics.total_memory_mb * 100.0;
        if memory_usage_percent > 90.0 {
            alerts.push(PerformanceAlert {
                alert_id: uuid::Uuid::new_v4().to_string(),
                alert_type: AlertType::ResourceExhaustion,
                severity: AlertSeverity::Critical,
                metric_type: MetricType::MemoryUsage,
                current_value: memory_usage_percent,
                threshold_value: 90.0,
                description: "Memory usage critically high".to_string(),
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                recommended_action: "Restart services or add more memory".to_string(),
            });
        }
        
        // Check CPU usage
        if self.system_metrics.cpu_usage_percent > 85.0 {
            alerts.push(PerformanceAlert {
                alert_id: uuid::Uuid::new_v4().to_string(),
                alert_type: AlertType::ResourceExhaustion,
                severity: AlertSeverity::Error,
                metric_type: MetricType::CPUUsage,
                current_value: self.system_metrics.cpu_usage_percent,
                threshold_value: 85.0,
                description: "CPU usage too high".to_string(),
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                recommended_action: "Scale horizontally or optimize processes".to_string(),
            });
        }
        
        // Check inference time
        if let Some(avg_inference_time) = self.get_latest_metric(&MetricType::InferenceTime) {
            if avg_inference_time > 1000.0 { // More than 1 second
                alerts.push(PerformanceAlert {
                    alert_id: uuid::Uuid::new_v4().to_string(),
                    alert_type: AlertType::PerformanceDegradation,
                    severity: AlertSeverity::Warning,
                    metric_type: MetricType::InferenceTime,
                    current_value: avg_inference_time,
                    threshold_value: 1000.0,
                    description: "Inference time degraded".to_string(),
                    timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                    recommended_action: "Optimize models or increase resources".to_string(),
                });
            }
        }
        
        alerts
    }

    /// Get total inferences
    pub fn get_total_inferences(&self) -> u64 {
        self.metrics.get(&MetricType::InferenceTime)
            .map(|history| history.len() as u64)
            .unwrap_or(0)
    }

    /// Get successful inferences
    pub fn get_successful_inferences(&self) -> u64 {
        self.get_total_inferences() - self.get_failed_inferences()
    }

    /// Get failed inferences
    pub fn get_failed_inferences(&self) -> u64 {
        self.metrics.get(&MetricType::InferenceError)
            .map(|history| history.iter().map(|p| p.value as u64).sum())
            .unwrap_or(0)
    }

    /// Get average inference time
    pub fn get_average_inference_time(&self) -> f64 {
        self.calculate_stats(&MetricType::InferenceTime)
            .map(|stats| stats.mean_value)
            .unwrap_or(0.0)
    }

    /// Get memory usage in MB
    pub fn get_memory_usage_mb(&self) -> f64 {
        self.system_metrics.total_memory_mb - self.system_metrics.available_memory_mb
    }

    /// Get CPU usage percentage
    pub fn get_cpu_usage_percent(&self) -> f64 {
        self.system_metrics.cpu_usage_percent
    }

    /// Get GPU usage percentage
    pub fn get_gpu_usage_percent(&self) -> Option<f64> {
        self.system_metrics.gpu_usage_percent
    }

    /// Get uptime in seconds
    pub fn get_uptime_seconds(&self) -> u64 {
        self.start_time.elapsed().unwrap().as_secs()
    }

    /// Clear all metrics
    pub fn clear_metrics(&mut self) {
        self.metrics.clear();
    }

    /// Export metrics to JSON
    pub fn export_to_json(&self) -> Result<String> {
        let export_data = serde_json::json!({
            "timestamp": SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs(),
            "uptime_seconds": self.get_uptime_seconds(),
            "system_metrics": self.system_metrics,
            "metrics": self.metrics,
            "resource_report": self.generate_resource_report(),
            "alerts": self.check_alerts(),
        });

        Ok(serde_json::to_string_pretty(&export_data)?)
    }

    /// Get metrics summary
    pub fn get_summary(&self) -> HashMap<String, serde_json::Value> {
        let mut summary = HashMap::new();
        
        summary.insert("total_inferences".to_string(), serde_json::Value::Number(serde_json::Number::from(self.get_total_inferences())));
        summary.insert("successful_inferences".to_string(), serde_json::Value::Number(serde_json::Number::from(self.get_successful_inferences())));
        summary.insert("failed_inferences".to_string(), serde_json::Value::Number(serde_json::Number::from(self.get_failed_inferences())));
        summary.insert("average_inference_time_ms".to_string(), serde_json::Value::Number(serde_json::Number::from(self.get_average_inference_time())));
        summary.insert("memory_usage_mb".to_string(), serde_json::Value::Number(serde_json::Number::from(self.get_memory_usage_mb())));
        summary.insert("cpu_usage_percent".to_string(), serde_json::Value::Number(serde_json::Number::from(self.get_cpu_usage_percent())));
        summary.insert("uptime_seconds".to_string(), serde_json::Value::Number(serde_json::Number::from(self.get_uptime_seconds())));
        
        if let Some(gpu_usage) = self.get_gpu_usage_percent() {
            summary.insert("gpu_usage_percent".to_string(), serde_json::Value::Number(serde_json::Number::from(gpu_usage)));
        }
        
        summary
    }
}

impl Default for PerformanceMetrics {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_metrics_creation() {
        let metrics = PerformanceMetrics::new();
        assert_eq!(metrics.metrics.len(), 0);
        assert_eq!(metrics.max_history_size, 1000);
    }

    #[test]
    fn test_record_metric() {
        let mut metrics = PerformanceMetrics::new();
        metrics.record_metric(MetricType::InferenceTime, 100.0);
        
        assert_eq!(metrics.metrics.len(), 1);
        assert!(metrics.metrics.contains_key(&MetricType::InferenceTime));
        
        let history = metrics.get_metric_history(&MetricType::InferenceTime).unwrap();
        assert_eq!(history.len(), 1);
        assert_eq!(history.back().unwrap().value, 100.0);
    }

    #[test]
    fn test_get_latest_metric() {
        let mut metrics = PerformanceMetrics::new();
        metrics.record_metric(MetricType::InferenceTime, 100.0);
        metrics.record_metric(MetricType::InferenceTime, 200.0);
        
        let latest = metrics.get_latest_metric(&MetricType::InferenceTime).unwrap();
        assert_eq!(latest, 200.0);
    }

    #[test]
    fn test_calculate_stats() {
        let mut metrics = PerformanceMetrics::new();
        metrics.record_metric(MetricType::InferenceTime, 100.0);
        metrics.record_metric(MetricType::InferenceTime, 200.0);
        metrics.record_metric(MetricType::InferenceTime, 300.0);
        
        let stats = metrics.calculate_stats(&MetricType::InferenceTime).unwrap();
        assert_eq!(stats.count, 3);
        assert_eq!(stats.min_value, 100.0);
        assert_eq!(stats.max_value, 300.0);
        assert_eq!(stats.mean_value, 200.0);
        assert_eq!(stats.median_value, 200.0);
    }

    #[test]
    fn test_calculate_percentile() {
        let metrics = PerformanceMetrics::new();
        let values = vec![10.0, 20.0, 30.0, 40.0, 50.0];
        
        let p50 = metrics.calculate_percentile(&values, 50.0);
        assert_eq!(p50, 30.0);
        
        let p95 = metrics.calculate_percentile(&values, 95.0);
        assert_eq!(p95, 50.0);
    }

    #[test]
    fn test_health_score_calculation() {
        let mut metrics = PerformanceMetrics::new();
        metrics.system_metrics.cpu_usage_percent = 90.0;
        metrics.system_metrics.total_memory_mb = 1000.0;
        metrics.system_metrics.available_memory_mb = 100.0; // 90% usage
        
        let health_score = metrics.calculate_health_score();
        assert!(health_score < 100.0);
        assert!(health_score >= 0.0);
    }

    #[test]
    fn test_alert_generation() {
        let mut metrics = PerformanceMetrics::new();
        metrics.system_metrics.cpu_usage_percent = 90.0;
        metrics.system_metrics.total_memory_mb = 1000.0;
        metrics.system_metrics.available_memory_mb = 50.0; // 95% usage
        
        let alerts = metrics.check_alerts();
        assert!(!alerts.is_empty());
        
        let memory_alert = alerts.iter().find(|a| a.metric_type == MetricType::MemoryUsage);
        assert!(memory_alert.is_some());
        assert_eq!(memory_alert.unwrap().severity, AlertSeverity::Critical);
    }
}