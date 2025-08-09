use crate::metrics::prometheus;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;

/// Metrics for predictive analytics
#[derive(Debug, Clone)]
pub struct PredictiveMetrics {
    request_counts: Arc<RwLock<HashMap<String, u64>>>,
    prediction_values: Arc<RwLock<HashMap<String, f64>>>,
    confidence_scores: Arc<RwLock<HashMap<String, f32>>>,
    latencies: Arc<RwLock<Vec<f64>>>,
    error_counts: Arc<RwLock<HashMap<String, u64>>>,
    cache_stats: Arc<RwLock<CacheStats>>,
}

#[derive(Debug, Clone, Default)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub size: usize,
}

impl PredictiveMetrics {
    pub fn new() -> Self {
        Self {
            request_counts: Arc::new(RwLock::new(HashMap::new())),
            prediction_values: Arc::new(RwLock::new(HashMap::new())),
            confidence_scores: Arc::new(RwLock::new(HashMap::new())),
            latencies: Arc::new(RwLock::new(Vec::new())),
            error_counts: Arc::new(RwLock::new(HashMap::new())),
            cache_stats: Arc::new(RwLock::new(CacheStats::default())),
        }
    }
    
    /// Record a prediction request
    pub fn record_request(&self, target: &str, latency: f64) {
        // Increment request count
        {
            let mut counts = self.request_counts.blocking_write();
            *counts.entry(target.to_string()).or_insert(0) += 1;
        }
        
        // Record latency
        {
            let mut latencies = self.latencies.blocking_write();
            latencies.push(latency);
            
            // Keep only last 1000 latency measurements
            if latencies.len() > 1000 {
                latencies.remove(0);
            }
        }
        
        // Prometheus metrics
        prometheus::inc_counter("predictive_requests_total", &[("target", target.to_string())]);
        prometheus::histogram_observe("predictive_request_latency_seconds", latency, 
                                     &[("target", target.to_string())]);
    }
    
    /// Record a prediction result
    pub fn record_prediction(&self, target: &str, predicted_value: f64, confidence: f32) {
        // Store prediction value
        {
            let mut values = self.prediction_values.blocking_write();
            values.insert(target.to_string(), predicted_value);
        }
        
        // Store confidence score
        {
            let mut scores = self.confidence_scores.blocking_write();
            scores.insert(target.to_string(), confidence);
        }
        
        // Prometheus metrics
        prometheus::gauge_set("predictive_last_value", predicted_value, 
                             &[("target", target.to_string())]);
        prometheus::gauge_set("predictive_confidence", confidence as f64, 
                             &[("target", target.to_string())]);
    }
    
    /// Record an error
    pub fn record_error(&self, target: &str, error_type: &str) {
        let key = format!("{}:{}", target, error_type);
        
        {
            let mut errors = self.error_counts.blocking_write();
            *errors.entry(key).or_insert(0) += 1;
        }
        
        // Prometheus metrics
        prometheus::inc_counter("predictive_errors_total", 
                               &[("target", target.to_string()), ("error_type", error_type.to_string())]);
    }
    
    /// Record cache hit
    pub fn record_cache_hit(&self) {
        {
            let mut stats = self.cache_stats.blocking_write();
            stats.hits += 1;
        }
        
        prometheus::inc_counter("predictive_cache_hits_total", &[]);
    }
    
    /// Record cache miss
    pub fn record_cache_miss(&self) {
        {
            let mut stats = self.cache_stats.blocking_write();
            stats.misses += 1;
        }
        
        prometheus::inc_counter("predictive_cache_misses_total", &[]);
    }
    
    /// Update cache size
    pub fn update_cache_size(&self, size: usize) {
        {
            let mut stats = self.cache_stats.blocking_write();
            stats.size = size;
        }
        
        prometheus::gauge_set("predictive_cache_size", size as f64, &[]);
    }
    
    /// Get request count for a target
    pub async fn get_request_count(&self, target: &str) -> u64 {
        let counts = self.request_counts.read().await;
        counts.get(target).copied().unwrap_or(0)
    }
    
    /// Get all request counts
    pub async fn get_all_request_counts(&self) -> HashMap<String, u64> {
        let counts = self.request_counts.read().await;
        counts.clone()
    }
    
    /// Get last prediction value for a target
    pub async fn get_last_prediction(&self, target: &str) -> Option<f64> {
        let values = self.prediction_values.read().await;
        values.get(target).copied()
    }
    
    /// Get last confidence score for a target
    pub async fn get_last_confidence(&self, target: &str) -> Option<f32> {
        let scores = self.confidence_scores.read().await;
        scores.get(target).copied()
    }
    
    /// Get latency statistics
    pub async fn get_latency_stats(&self) -> LatencyStats {
        let latencies = self.latencies.read().await;
        
        if latencies.is_empty() {
            return LatencyStats::default();
        }
        
        let count = latencies.len();
        let sum = latencies.iter().sum::<f64>();
        let mean = sum / count as f64;
        
        let variance = latencies.iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>() / count as f64;
        let std_dev = variance.sqrt();
        
        let mut sorted_latencies = latencies.clone();
        sorted_latencies.sort_by(|a, b| a.partial_cmp(b).unwrap());
        
        let p50 = sorted_latencies[count / 2];
        let p95 = sorted_latencies[(count as f64 * 0.95) as usize];
        let p99 = sorted_latencies[(count as f64 * 0.99) as usize];
        
        LatencyStats {
            count,
            mean,
            std_dev,
            min: *sorted_latencies.first().unwrap(),
            max: *sorted_latencies.last().unwrap(),
            p50,
            p95,
            p99,
        }
    }
    
    /// Get error counts
    pub async fn get_error_counts(&self) -> HashMap<String, u64> {
        let errors = self.error_counts.read().await;
        errors.clone()
    }
    
    /// Get cache statistics
    pub async fn get_cache_stats(&self) -> CacheStats {
        let stats = self.cache_stats.read().await;
        stats.clone()
    }
    
    /// Get cache hit rate
    pub async fn get_cache_hit_rate(&self) -> f64 {
        let stats = self.cache_stats.read().await;
        let total = stats.hits + stats.misses;
        
        if total == 0 {
            0.0
        } else {
            stats.hits as f64 / total as f64
        }
    }
    
    /// Reset all metrics
    pub async fn reset(&self) {
        {
            let mut counts = self.request_counts.write().await;
            counts.clear();
        }
        
        {
            let mut values = self.prediction_values.write().await;
            values.clear();
        }
        
        {
            let mut scores = self.confidence_scores.write().await;
            scores.clear();
        }
        
        {
            let mut latencies = self.latencies.write().await;
            latencies.clear();
        }
        
        {
            let mut errors = self.error_counts.write().await;
            errors.clear();
        }
        
        {
            let mut stats = self.cache_stats.write().await;
            *stats = CacheStats::default();
        }
    }
    
    /// Export metrics as JSON
    pub async fn export_json(&self) -> Result<serde_json::Value> {
        let latency_stats = self.get_latency_stats().await;
        let cache_stats = self.get_cache_stats().await;
        let cache_hit_rate = self.get_cache_hit_rate().await;
        
        Ok(serde_json::json!({
            "request_counts": self.get_all_request_counts().await,
            "error_counts": self.get_error_counts().await,
            "latency_stats": latency_stats,
            "cache_stats": cache_stats,
            "cache_hit_rate": cache_hit_rate,
            "timestamp": crate::utils::now_secs(),
        }))
    }
}

/// Latency statistics
#[derive(Debug, Clone, Default)]
pub struct LatencyStats {
    pub count: usize,
    pub mean: f64,
    pub std_dev: f64,
    pub min: f64,
    pub max: f64,
    pub p50: f64,
    pub p95: f64,
    pub p99: f64,
}

impl LatencyStats {
    pub fn summary(&self) -> String {
        format!(
            "Latency: count={}, mean={:.2}ms, std_dev={:.2}ms, p50={:.2}ms, p95={:.2}ms, p99={:.2}ms",
            self.count,
            self.mean * 1000.0,
            self.std_dev * 1000.0,
            self.p50 * 1000.0,
            self.p95 * 1000.0,
            self.p99 * 1000.0
        )
    }
}

/// Metrics collector for Prometheus
pub struct PrometheusMetrics {
    predictive_metrics: Arc<PredictiveMetrics>,
}

impl PrometheusMetrics {
    pub fn new(predictive_metrics: Arc<PredictiveMetrics>) -> Self {
        Self { predictive_metrics }
    }
    
    /// Collect and export Prometheus metrics
    pub async fn collect(&self) -> String {
        let metrics = self.predictive_metrics.export_json().await.unwrap_or_default();
        
        // This would typically format the metrics in Prometheus exposition format
        // For now, return JSON representation
        serde_json::to_string_pretty(&metrics).unwrap_or_else(|_| "{}".to_string())
    }
    
    /// Get metrics for a specific target
    pub async fn get_target_metrics(&self, target: &str) -> Result<serde_json::Value> {
        let request_count = self.predictive_metrics.get_request_count(target).await;
        let last_prediction = self.predictive_metrics.get_last_prediction(target).await;
        let last_confidence = self.predictive_metrics.get_last_confidence(target).await;
        
        Ok(serde_json::json!({
            "target": target,
            "request_count": request_count,
            "last_prediction": last_prediction,
            "last_confidence": last_confidence,
            "timestamp": crate::utils::now_secs(),
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_metrics_creation() {
        let metrics = PredictiveMetrics::new();
        
        assert_eq!(metrics.get_request_count("test").await, 0);
        assert!(metrics.get_last_prediction("test").await.is_none());
    }
    
    #[tokio::test]
    async fn test_record_request() {
        let metrics = PredictiveMetrics::new();
        
        metrics.record_request("test", 0.1);
        
        assert_eq!(metrics.get_request_count("test").await, 1);
        
        let latency_stats = metrics.get_latency_stats().await;
        assert_eq!(latency_stats.count, 1);
        assert_eq!(latency_stats.mean, 0.1);
    }
    
    #[tokio::test]
    async fn test_record_prediction() {
        let metrics = PredictiveMetrics::new();
        
        metrics.record_prediction("test", 0.5, 0.8);
        
        assert_eq!(metrics.get_last_prediction("test").await, Some(0.5));
        assert_eq!(metrics.get_last_confidence("test").await, Some(0.8));
    }
    
    #[tokio::test]
    async fn test_cache_metrics() {
        let metrics = PredictiveMetrics::new();
        
        metrics.record_cache_hit();
        metrics.record_cache_miss();
        metrics.record_cache_hit();
        
        let cache_stats = metrics.get_cache_stats().await;
        assert_eq!(cache_stats.hits, 2);
        assert_eq!(cache_stats.misses, 1);
        
        let hit_rate = metrics.get_cache_hit_rate().await;
        assert!((hit_rate - 0.666).abs() < 0.001); // 2/3 ≈ 0.666
    }
    
    #[tokio::test]
    async fn test_error_recording() {
        let metrics = PredictiveMetrics::new();
        
        metrics.record_error("test", "rate_limit");
        metrics.record_error("test", "invalid_input");
        metrics.record_error("test", "rate_limit");
        
        let error_counts = metrics.get_error_counts().await;
        assert_eq!(error_counts.get("test:rate_limit"), Some(&2));
        assert_eq!(error_counts.get("test:invalid_input"), Some(&1));
    }
    
    #[tokio::test]
    async fn test_metrics_reset() {
        let metrics = PredictiveMetrics::new();
        
        metrics.record_request("test", 0.1);
        metrics.record_prediction("test", 0.5, 0.8);
        metrics.record_cache_hit();
        
        metrics.reset().await;
        
        assert_eq!(metrics.get_request_count("test").await, 0);
        assert!(metrics.get_last_prediction("test").await.is_none());
        
        let cache_stats = metrics.get_cache_stats().await;
        assert_eq!(cache_stats.hits, 0);
        assert_eq!(cache_stats.misses, 0);
    }
}