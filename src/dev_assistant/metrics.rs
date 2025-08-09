use crate::metrics::prometheus;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::{Duration, Instant};
use anyhow::Result;

/// Metrics collection for the Dev Assistant API
#[derive(Debug, Clone)]
pub struct DevAssistantMetrics {
    request_counts: Arc<RwLock<HashMap<String, u64>>>,
    response_times: Arc<RwLock<HashMap<String, Vec<Duration>>>>,
    error_counts: Arc<RwLock<HashMap<String, u64>>>,
    cache_stats: Arc<RwLock<HashMap<String, CacheStats>>>,
    active_connections: Arc<RwLock<u32>>,
    start_time: Instant,
}

#[derive(Debug, Clone, Default)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub size: usize,
}

impl DevAssistantMetrics {
    pub fn new() -> Self {
        Self {
            request_counts: Arc::new(RwLock::new(HashMap::new())),
            response_times: Arc::new(RwLock::new(HashMap::new())),
            error_counts: Arc::new(RwLock::new(HashMap::new())),
            cache_stats: Arc::new(RwLock::new(HashMap::new())),
            active_connections: Arc::new(RwLock::new(0)),
            start_time: Instant::now(),
        }
    }

    /// Record a successful request
    pub fn record_request(&self, method: &axum::http::Method, path: &str, status: u16, latency_seconds: f64) {
        let key = format!("{}:{}:{}", method.as_str(), path, status);
        
        // Increment request count
        {
            let mut counts = self.request_counts.blocking_write();
            *counts.entry(key.clone()).or_insert(0) += 1;
        }
        
        // Record response time
        {
            let mut times = self.response_times.blocking_write();
            times.entry(key).or_insert_with(Vec::new).push(Duration::from_secs_f64(latency_seconds));
            
            // Keep only last 1000 measurements per endpoint
            if let Some(measurements) = times.get_mut(&key) {
                if measurements.len() > 1000 {
                    measurements.drain(0..measurements.len() - 1000);
                }
            }
        }
        
        // Prometheus metrics
        prometheus::inc_counter("dev_assistant_requests_total", &[
            ("method", method.to_string()),
            ("path", path.to_string()),
            ("status", status.to_string()),
        ]);
        
        prometheus::histogram_observe("dev_assistant_request_duration_seconds", latency_seconds, &[
            ("method", method.to_string()),
            ("path", path.to_string()),
        ]);
    }

    /// Record a successful query
    pub fn record_query_success(&self, target: &str, processing_time_ms: u64) {
        let key = format!("query:{}", target);
        
        {
            let mut counts = self.request_counts.blocking_write();
            *counts.entry(key).or_insert(0) += 1;
        }
        
        prometheus::inc_counter("dev_assistant_queries_total", &[
            ("target", target.to_string()),
            ("status", "success".to_string()),
        ]);
        
        prometheus::histogram_observe("dev_assistant_query_duration_ms", processing_time_ms as f64, &[
            ("target", target.to_string()),
        ]);
    }

    /// Record a queued analysis
    pub fn record_analysis_queued(&self, target: &str) {
        prometheus::inc_counter("dev_assistant_analyses_total", &[
            ("target", target.to_string()),
            ("status", "queued".to_string()),
        ]);
    }

    /// Record a successful prediction
    pub fn record_prediction_success(&self, target: &str, processing_time_ms: u64) {
        prometheus::inc_counter("dev_assistant_predictions_total", &[
            ("target", target.to_string()),
            ("status", "success".to_string()),
        ]);
        
        prometheus::histogram_observe("dev_assistant_prediction_duration_ms", processing_time_ms as f64, &[
            ("target", target.to_string()),
        ]);
    }

    /// Record a successful anomaly query
    pub fn record_anomaly_query_success(&self, target: &str) {
        prometheus::inc_counter("dev_assistant_anomaly_queries_total", &[
            ("target", target.to_string()),
            ("status", "success".to_string()),
        ]);
    }

    /// Record a successful explanation
    pub fn record_explanation_success(&self, target: &str) {
        prometheus::inc_counter("dev_assistant_explanations_total", &[
            ("target", target.to_string()),
            ("status", "success".to_string()),
        ]);
    }

    /// Record an error
    pub fn record_error(&self, error_type: &str, endpoint: &str, details: &str) {
        let key = format!("error:{}:{}", error_type, endpoint);
        
        {
            let mut errors = self.error_counts.blocking_write();
            *errors.entry(key).or_insert(0) += 1;
        }
        
        prometheus::inc_counter("dev_assistant_errors_total", &[
            ("error_type", error_type.to_string()),
            ("endpoint", endpoint.to_string()),
        ]);
        
        // Log the error
        tracing::error!("Dev Assistant Error - Type: {}, Endpoint: {}, Details: {}", error_type, endpoint, details);
    }

    /// Record authentication failure
    pub fn record_auth_failure(&self, reason: &str) {
        prometheus::inc_counter("dev_assistant_auth_failures_total", &[
            ("reason", reason.to_string()),
        ]);
    }

    /// Record rate limit hit
    pub fn record_rate_limit_hit(&self, client: &str) {
        prometheus::inc_counter("dev_assistant_rate_limited_total", &[
            ("client", client.to_string()),
        ]);
    }

    /// Record cache hit
    pub fn record_cache_hit(&self, cache_type: String) {
        {
            let mut stats = self.cache_stats.blocking_write();
            let entry = stats.entry(cache_type.clone()).or_insert_with(CacheStats::default);
            entry.hits += 1;
        }
        
        prometheus::inc_counter("dev_assistant_cache_hits_total", &[
            ("cache_type", cache_type),
        ]);
    }

    /// Record cache miss
    pub fn record_cache_miss(&self, cache_type: String) {
        {
            let mut stats = self.cache_stats.blocking_write();
            let entry = stats.entry(cache_type.clone()).or_insert_with(CacheStats::default);
            entry.misses += 1;
        }
        
        prometheus::inc_counter("dev_assistant_cache_misses_total", &[
            ("cache_type", cache_type),
        ]);
    }

    /// Update cache size
    pub fn update_cache_size(&self, cache_type: String, size: usize) {
        {
            let mut stats = self.cache_stats.blocking_write();
            let entry = stats.entry(cache_type).or_insert_with(CacheStats::default);
            entry.size = size;
        }
    }

    /// Increment active connections
    pub async fn increment_connections(&self) {
        let mut connections = self.active_connections.write().await;
        *connections += 1;
        
        prometheus::gauge_set("dev_assistant_active_connections", *connections as f64, &[]);
    }

    /// Decrement active connections
    pub async fn decrement_connections(&self) {
        let mut connections = self.active_connections.write().await;
        *connections = connections.saturating_sub(1);
        
        prometheus::gauge_set("dev_assistant_active_connections", *connections as f64, &[]);
    }

    /// Get request statistics
    pub async fn get_request_stats(&self) -> RequestStats {
        let counts = self.request_counts.read().await;
        let times = self.response_times.read().await;
        
        let mut stats = HashMap::new();
        
        for (key, count) in counts.iter() {
            let response_times = times.get(key).map(|times| {
                if times.is_empty() {
                    ResponseTimeStats::default()
                } else {
                    let sum: Duration = times.iter().sum();
                    let mean = sum / times.len() as u32;
                    
                    let mut sorted_times = times.clone();
                    sorted_times.sort();
                    
                    let p50 = sorted_times[sorted_times.len() / 2];
                    let p95 = sorted_times[(sorted_times.len() as f64 * 0.95) as usize];
                    let p99 = sorted_times[(sorted_times.len() as f64 * 0.99) as usize];
                    
                    ResponseTimeStats {
                        count: times.len(),
                        mean,
                        min: *sorted_times.first().unwrap(),
                        max: *sorted_times.last().unwrap(),
                        p50,
                        p95,
                        p99,
                    }
                }
            }).unwrap_or_default();
            
            stats.insert(key.clone(), EndpointStats {
                request_count: *count,
                response_times,
            });
        }
        
        RequestStats { endpoints: stats }
    }

    /// Get error statistics
    pub async fn get_error_stats(&self) -> HashMap<String, u64> {
        let errors = self.error_counts.read().await;
        errors.clone()
    }

    /// Get cache statistics
    pub async fn get_cache_stats(&self) -> HashMap<String, CacheStats> {
        let stats = self.cache_stats.read().await;
        stats.clone()
    }

    /// Get system statistics
    pub async fn get_system_stats(&self) -> SystemStats {
        let uptime = self.start_time.elapsed();
        let active_connections = *self.active_connections.read().await;
        
        SystemStats {
            uptime_seconds: uptime.as_secs(),
            active_connections,
            start_time: self.start_time,
        }
    }

    /// Get cache hit rate for a specific cache type
    pub async fn get_cache_hit_rate(&self, cache_type: &str) -> f64 {
        let stats = self.cache_stats.read().await;
        
        if let Some(cache_stats) = stats.get(cache_type) {
            let total = cache_stats.hits + cache_stats.misses;
            if total == 0 {
                0.0
            } else {
                cache_stats.hits as f64 / total as f64
            }
        } else {
            0.0
        }
    }

    /// Export metrics as JSON
    pub async fn export_json(&self) -> Result<String> {
        let request_stats = self.get_request_stats().await;
        let error_stats = self.get_error_stats().await;
        let cache_stats = self.get_cache_stats().await;
        let system_stats = self.get_system_stats().await;
        
        let metrics = serde_json::json!({
            "request_stats": request_stats,
            "error_stats": error_stats,
            "cache_stats": cache_stats,
            "system_stats": system_stats,
            "timestamp": crate::utils::now_secs(),
        });
        
        Ok(serde_json::to_string_pretty(&metrics)?)
    }

    /// Export metrics to Prometheus
    pub async fn export_prometheus(&self) -> String {
        let mut output = String::new();
        
        // System metrics
        let system_stats = self.get_system_stats().await;
        output.push_str(&format!(
            "# HELP dev_assistant_uptime_seconds Uptime of the Dev Assistant API\n\
             # TYPE dev_assistant_uptime_seconds counter\n\
             dev_assistant_uptime_seconds {}\n\n",
            system_stats.uptime_seconds
        ));
        
        output.push_str(&format!(
            "# HELP dev_assistant_active_connections Current number of active WebSocket connections\n\
             # TYPE dev_assistant_active_connections gauge\n\
             dev_assistant_active_connections {}\n\n",
            system_stats.active_connections
        ));
        
        // Cache metrics
        let cache_stats = self.get_cache_stats().await;
        for (cache_type, stats) in cache_stats.iter() {
            output.push_str(&format!(
                "# HELP dev_assistant_cache_hits_total Number of cache hits\n\
                 # TYPE dev_assistant_cache_hits_total counter\n\
                 dev_assistant_cache_hits_total{{cache_type=\"{}\"}} {}\n\n",
                cache_type, stats.hits
            ));
            
            output.push_str(&format!(
                "# HELP dev_assistant_cache_misses_total Number of cache misses\n\
                 # TYPE dev_assistant_cache_misses_total counter\n\
                 dev_assistant_cache_misses_total{{cache_type=\"{}\"}} {}\n\n",
                cache_type, stats.misses
            ));
            
            output.push_str(&format!(
                "# HELP dev_assistant_cache_size Current cache size\n\
                 # TYPE dev_assistant_cache_size gauge\n\
                 dev_assistant_cache_size{{cache_type=\"{}\"}} {}\n\n",
                cache_type, stats.size
            ));
        }
        
        output
    }

    /// Reset all metrics (for testing)
    pub async fn reset(&self) {
        let mut counts = self.request_counts.write().await;
        counts.clear();
        
        let mut times = self.response_times.write().await;
        times.clear();
        
        let mut errors = self.error_counts.write().await;
        errors.clear();
        
        let mut cache_stats = self.cache_stats.write().await;
        cache_stats.clear();
    }
}

/// Request statistics
#[derive(Debug, Clone)]
pub struct RequestStats {
    pub endpoints: HashMap<String, EndpointStats>,
}

#[derive(Debug, Clone)]
pub struct EndpointStats {
    pub request_count: u64,
    pub response_times: ResponseTimeStats,
}

#[derive(Debug, Clone, Default)]
pub struct ResponseTimeStats {
    pub count: usize,
    pub mean: Duration,
    pub min: Duration,
    pub max: Duration,
    pub p50: Duration,
    pub p95: Duration,
    pub p99: Duration,
}

/// System statistics
#[derive(Debug, Clone)]
pub struct SystemStats {
    pub uptime_seconds: u64,
    pub active_connections: u32,
    pub start_time: Instant,
}

/// Metrics collector for Prometheus
pub struct PrometheusMetrics {
    dev_assistant_metrics: Arc<DevAssistantMetrics>,
}

impl PrometheusMetrics {
    pub fn new(dev_assistant_metrics: Arc<DevAssistantMetrics>) -> Self {
        Self { dev_assistant_metrics }
    }

    /// Collect and export Prometheus metrics
    pub async fn collect(&self) -> String {
        self.dev_assistant_metrics.export_prometheus().await
    }

    /// Get metrics for a specific endpoint
    pub async fn get_endpoint_metrics(&self, method: &str, path: &str) -> Result<serde_json::Value> {
        let request_stats = self.dev_assistant_metrics.get_request_stats().await;
        let key = format!("{}:*:*", method); // Simplified for demo
        
        let endpoint_stats = request_stats.endpoints.get(&key);
        
        Ok(serde_json::json!({
            "method": method,
            "path": path,
            "stats": endpoint_stats,
            "timestamp": crate::utils::now_secs(),
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_metrics_creation() {
        let metrics = DevAssistantMetrics::new();
        
        let system_stats = metrics.get_system_stats().await;
        assert_eq!(system_stats.active_connections, 0);
        assert!(system_stats.uptime_seconds > 0);
    }

    #[tokio::test]
    async fn test_request_recording() {
        let metrics = DevAssistantMetrics::new();
        
        metrics.record_request(
            &axum::http::Method::GET,
            "/test",
            200,
            0.1,
        );
        
        let request_stats = metrics.get_request_stats().await;
        assert!(!request_stats.endpoints.is_empty());
    }

    #[tokio::test]
    async fn test_error_recording() {
        let metrics = DevAssistantMetrics::new();
        
        metrics.record_error("validation", "/test", "Invalid input");
        
        let error_stats = metrics.get_error_stats().await;
        assert!(!error_stats.is_empty());
    }

    #[tokio::test]
    async fn test_cache_metrics() {
        let metrics = DevAssistantMetrics::new();
        
        metrics.record_cache_hit("query".to_string());
        metrics.record_cache_miss("query".to_string());
        metrics.record_cache_hit("predict".to_string());
        
        let cache_stats = metrics.get_cache_stats().await;
        assert_eq!(cache_stats.get("query").unwrap().hits, 1);
        assert_eq!(cache_stats.get("query").unwrap().misses, 1);
        assert_eq!(cache_stats.get("predict").unwrap().hits, 1);
        
        let hit_rate = metrics.get_cache_hit_rate("query").await;
        assert!((hit_rate - 0.5).abs() < 0.001); // 1 hit / 2 total = 0.5
    }

    #[tokio::test]
    async fn test_connection_tracking() {
        let metrics = DevAssistantMetrics::new();
        
        let initial_connections = metrics.get_system_stats().await.active_connections;
        
        metrics.increment_connections().await;
        assert_eq!(metrics.get_system_stats().await.active_connections, initial_connections + 1);
        
        metrics.decrement_connections().await;
        assert_eq!(metrics.get_system_stats().await.active_connections, initial_connections);
    }

    #[tokio::test]
    async fn test_metrics_export() {
        let metrics = DevAssistantMetrics::new();
        
        metrics.record_request(&axum::http::Method::GET, "/test", 200, 0.1);
        metrics.record_error("test_error", "/test", "test details");
        
        let json_export = metrics.export_json().await.unwrap();
        assert!(json_export.contains("request_stats"));
        assert!(json_export.contains("error_stats"));
        
        let prometheus_export = metrics.export_prometheus().await;
        assert!(prometheus_export.contains("dev_assistant_uptime_seconds"));
    }

    #[tokio::test]
    async fn test_metrics_reset() {
        let metrics = DevAssistantMetrics::new();
        
        metrics.record_request(&axum::http::Method::GET, "/test", 200, 0.1);
        metrics.record_error("test_error", "/test", "test details");
        
        assert!(!metrics.get_request_stats().await.endpoints.is_empty());
        assert!(!metrics.get_error_stats().await.is_empty());
        
        metrics.reset().await;
        
        assert!(metrics.get_request_stats().await.endpoints.is_empty());
        assert!(metrics.get_error_stats().await.is_empty());
    }
}