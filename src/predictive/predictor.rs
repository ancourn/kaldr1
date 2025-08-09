use super::types::{ForecastReq, ForecastResult, Forecast, PredictorConfig, ForecastHorizon};
use super::features::FeatureExtractor;
use crate::ai_models::ModelHandle;
use crate::performance_metrics::store::get_recent;
use crate::anomaly::store::get_recent_anomalies;
use crate::metrics::prometheus;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{Instant, Duration};

/// Rate limiter for prediction requests
pub struct RateLimiter {
    requests: std::collections::HashMap<String, Vec<Instant>>,
    max_requests_per_minute: u32,
}

impl RateLimiter {
    pub fn new(max_requests_per_minute: u32) -> Self {
        Self {
            requests: std::collections::HashMap::new(),
            max_requests_per_minute,
        }
    }
    
    pub fn check_rate_limit(&mut self, target: &str) -> bool {
        let now = Instant::now();
        let minute_ago = now - Duration::from_secs(60);
        
        let requests = self.requests.entry(target.to_string()).or_insert_with(Vec::new);
        
        // Remove old requests
        requests.retain(|&time| time > minute_ago);
        
        // Check if we're under the limit
        if requests.len() < self.max_requests_per_minute as usize {
            requests.push(now);
            true
        } else {
            false
        }
    }
}

/// Main predictor for generating forecasts
pub struct Predictor {
    config: PredictorConfig,
    feature_extractor: FeatureExtractor,
    model: Arc<RwLock<ModelHandle>>,
    rate_limiter: Arc<RwLock<RateLimiter>>,
    cache: Arc<RwLock<std::collections::HashMap<String, (Forecast, Instant)>>>,
    cache_ttl: Duration,
}

impl Predictor {
    pub fn new(config: PredictorConfig, model: ModelHandle) -> Self {
        let rate_limiter = Arc::new(RwLock::new(RateLimiter::new(config.max_predictions_per_minute)));
        let cache = Arc::new(RwLock::new(std::collections::HashMap::new()));
        
        Self {
            config,
            feature_extractor: FeatureExtractor::new(),
            model: Arc::new(RwLock::new(model)),
            rate_limiter,
            cache,
            cache_ttl: Duration::from_secs(300), // 5 minutes cache TTL
        }
    }
    
    /// Generate a forecast for the given request
    pub async fn forecast(&self, req: ForecastReq) -> Result<Forecast> {
        // Check rate limiting
        {
            let mut rate_limiter = self.rate_limiter.write().await;
            if !rate_limiter.check_rate_limit(&req.target) {
                return Err(anyhow::anyhow!("Rate limit exceeded for target: {}", req.target));
            }
        }
        
        // Check cache first
        let cache_key = self.cache_key(&req);
        {
            let cache = self.cache.read().await;
            if let Some((cached_forecast, timestamp)) = cache.get(&cache_key) {
                if timestamp.elapsed() < self.cache_ttl {
                    // Return cached forecast
                    prometheus::inc_counter("predictive_cache_hits_total", &[("target", req.target.clone())]);
                    return Ok(cached_forecast.clone());
                }
            }
        }
        
        // Check if online inference is enabled
        if !self.config.enable_online_inference {
            return Err(anyhow::anyhow!("Online inference is disabled"));
        }
        
        let start_time = Instant::now();
        
        // 1) Fetch recent metrics & anomalies
        let recent_metrics = get_recent(&req.target, self.config.sliding_window_secs).await?;
        let recent_anomalies = get_recent_anomalies(&req.target, self.config.sliding_window_secs).await?;
        
        // 2) Build features
        let fv = self.feature_extractor.build_features(&req, &recent_metrics, &recent_anomalies);
        
        // 3) Prepare model input and run inference
        let model = self.model.read().await;
        let (predicted_value, confidence) = model.predict(&fv.features).await?;
        
        // 4) Validate confidence threshold
        if confidence < self.config.confidence_threshold {
            return Err(anyhow::anyhow!("Prediction confidence {} below threshold {}", 
                                      confidence, self.config.confidence_threshold));
        }
        
        // 5) Build result
        let horizon_seconds = req.horizon.seconds();
        let res = ForecastResult {
            target: req.target.clone(),
            horizon_seconds,
            timestamp: fv.ts,
            predicted_value,
            confidence,
            meta: serde_json::json!({
                "model": self.config.model_name,
                "features_count": fv.features.len(),
                "metrics_count": recent_metrics.len(),
                "anomalies_count": recent_anomalies.len(),
                "sliding_window_secs": self.config.sliding_window_secs,
            }),
        };
        
        let forecast = Forecast::single(res);
        
        // 6) Cache the result
        {
            let mut cache = self.cache.write().await;
            cache.insert(cache_key, (forecast.clone(), Instant::now()));
            
            // Clean up old cache entries
            cache.retain(|_, (_, timestamp)| timestamp.elapsed() < self.cache_ttl * 2);
        }
        
        // 7) Record metrics
        let latency = start_time.elapsed().as_secs_f64();
        self.record_metrics(&req, latency, &forecast);
        
        Ok(forecast)
    }
    
    /// Generate multiple forecasts for different horizons
    pub async fn forecast_multiple(&self, req: ForecastReq, horizons: &[ForecastHorizon]) -> Result<Forecast> {
        let mut results = Vec::new();
        
        for horizon in horizons {
            let mut multi_req = req.clone();
            multi_req.horizon = horizon.clone();
            
            match self.forecast(multi_req).await {
                Ok(forecast) => results.extend(forecast.results),
                Err(e) => {
                    tracing::warn!("Failed to generate forecast for horizon {:?}: {}", horizon, e);
                    // Continue with other horizons
                }
            }
        }
        
        Ok(Forecast::new(results))
    }
    
    /// Batch forecast for multiple targets
    pub async fn batch_forecast(&self, requests: Vec<ForecastReq>) -> Result<Vec<Forecast>> {
        let mut forecasts = Vec::new();
        
        for req in requests {
            match self.forecast(req).await {
                Ok(forecast) => forecasts.push(forecast),
                Err(e) => {
                    tracing::warn!("Failed to generate batch forecast: {}", e);
                    // Continue with other requests
                }
            }
        }
        
        Ok(forecasts)
    }
    
    /// Hot-swap model (used by trainer)
    pub async fn update_model(&self, new_model: ModelHandle) -> Result<()> {
        let mut w = self.model.write().await;
        *w = new_model;
        
        // Clear cache when model is updated
        let mut cache = self.cache.write().await;
        cache.clear();
        
        tracing::info!("Model updated successfully");
        Ok(())
    }
    
    /// Get current model information
    pub async fn get_model_info(&self) -> Result<serde_json::Value> {
        let model = self.model.read().await;
        Ok(serde_json::json!({
            "name": model.name(),
            "version": model.version(),
            "config": self.config,
            "cache_size": self.cache.read().await.len(),
            "rate_limit_max": self.config.max_predictions_per_minute,
        }))
    }
    
    /// Clear the prediction cache
    pub async fn clear_cache(&self) -> Result<()> {
        let mut cache = self.cache.write().await;
        cache.clear();
        Ok(())
    }
    
    /// Get cache statistics
    pub async fn get_cache_stats(&self) -> Result<serde_json::Value> {
        let cache = self.cache.read().await;
        let now = Instant::now();
        
        let valid_entries = cache.values()
            .filter(|(_, timestamp)| now.duration_since(*timestamp) < self.cache_ttl)
            .count();
        
        let expired_entries = cache.len() - valid_entries;
        
        Ok(serde_json::json!({
            "total_entries": cache.len(),
            "valid_entries": valid_entries,
            "expired_entries": expired_entries,
            "cache_ttl_seconds": self.cache_ttl.as_secs(),
        }))
    }
    
    /// Generate cache key for a request
    fn cache_key(&self, req: &ForecastReq) -> String {
        format!("{}:{:?}:{}", req.target, req.horizon, req.as_of.unwrap_or(0))
    }
    
    /// Record metrics for monitoring
    fn record_metrics(&self, req: &ForecastReq, latency: f64, forecast: &Forecast) {
        // Counter for total requests
        prometheus::inc_counter("predictive_requests_total", &[("target", req.target.clone())]);
        
        // Histogram for inference latency
        prometheus::histogram_observe("predictive_inference_latency_seconds", latency, 
                                     &[("target", req.target.clone())]);
        
        // Gauge for last predicted value
        if let Some(result) = forecast.results.first() {
            prometheus::gauge_set("predictive_last_value", result.predicted_value, 
                                 &[("target", req.target.clone()), 
                                   ("horizon", req.horizon.as_str())]);
            
            // Gauge for confidence
            prometheus::gauge_set("predictive_confidence", result.confidence as f64, 
                                 &[("target", req.target.clone())]);
        }
        
        // Counter for cache misses (we only get here on cache miss)
        prometheus::inc_counter("predictive_cache_misses_total", &[("target", req.target.clone())]);
    }
    
    /// Validate a forecast request
    pub fn validate_request(&self, req: &ForecastReq) -> Result<()> {
        if req.target.is_empty() {
            return Err(anyhow::anyhow!("Target cannot be empty"));
        }
        
        match req.horizon {
            ForecastHorizon::Short(s) => {
                if s == 0 {
                    return Err(anyhow::anyhow!("Short horizon must be > 0"));
                }
                if s > 3600 {
                    return Err(anyhow::anyhow!("Short horizon must be <= 3600 seconds (1 hour)"));
                }
            },
            ForecastHorizon::Medium(s) => {
                if s < 3600 {
                    return Err(anyhow::anyhow!("Medium horizon must be >= 3600 seconds (1 hour)"));
                }
                if s > 86400 {
                    return Err(anyhow::anyhow!("Medium horizon must be <= 86400 seconds (24 hours)"));
                }
            },
            ForecastHorizon::Long(s) => {
                if s < 86400 {
                    return Err(anyhow::anyhow!("Long horizon must be >= 86400 seconds (24 hours)"));
                }
                if s > 604800 {
                    return Err(anyhow::anyhow!("Long horizon must be <= 604800 seconds (7 days)"));
                }
            },
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai_models::ModelHandle;
    
    #[tokio::test]
    async fn test_predictor_creation() {
        let config = PredictorConfig::new("test_model".to_string());
        let model = ModelHandle::new("test".to_string(), "v1.0.0").unwrap();
        
        let predictor = Predictor::new(config, model);
        
        assert!(!predictor.config.model_name.is_empty());
    }
    
    #[tokio::test]
    async fn test_request_validation() {
        let config = PredictorConfig::new("test_model".to_string());
        let model = ModelHandle::new("test".to_string(), "v1.0.0").unwrap();
        
        let predictor = Predictor::new(config, model);
        
        // Valid request
        let valid_req = ForecastReq::new("test".to_string(), ForecastHorizon::Short(300));
        assert!(predictor.validate_request(&valid_req).is_ok());
        
        // Empty target
        let empty_req = ForecastReq::new("".to_string(), ForecastHorizon::Short(300));
        assert!(predictor.validate_request(&empty_req).is_err());
        
        // Invalid horizon
        let invalid_req = ForecastReq::new("test".to_string(), ForecastHorizon::Short(0));
        assert!(predictor.validate_request(&invalid_req).is_err());
    }
    
    #[test]
    fn test_cache_key_generation() {
        let config = PredictorConfig::new("test_model".to_string());
        let model = ModelHandle::new("test".to_string(), "v1.0.0").unwrap();
        
        let predictor = Predictor::new(config, model);
        
        let req = ForecastReq::new("target".to_string(), ForecastHorizon::Short(300))
            .with_timestamp(1234567890);
        
        let key = predictor.cache_key(&req);
        assert!(key.contains("target"));
        assert!(key.contains("Short"));
        assert!(key.contains("1234567890"));
    }
}