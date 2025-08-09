use serde::{Deserialize, Serialize};
use std::time::SystemTime;
use anyhow::Result;

/// Forecast horizon types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ForecastHorizon {
    Short(u64),  // seconds
    Medium(u64),
    Long(u64),
}

impl ForecastHorizon {
    pub fn seconds(&self) -> u64 {
        match self {
            ForecastHorizon::Short(s) => *s,
            ForecastHorizon::Medium(s) => *s,
            ForecastHorizon::Long(s) => *s,
        }
    }
    
    pub fn as_str(&self) -> &'static str {
        match self {
            ForecastHorizon::Short(_) => "short",
            ForecastHorizon::Medium(_) => "medium",
            ForecastHorizon::Long(_) => "long",
        }
    }
}

/// Forecast request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForecastReq {
    pub target: String, // e.g., "contract:0xabc..." or "network:mainnet"
    pub horizon: ForecastHorizon,
    pub features: Option<Vec<String>>, // optional override
    pub as_of: Option<u64>, // timestamp
}

impl ForecastReq {
    pub fn new(target: String, horizon: ForecastHorizon) -> Self {
        Self {
            target,
            horizon,
            features: None,
            as_of: None,
        }
    }
    
    pub fn with_features(mut self, features: Vec<String>) -> Self {
        self.features = Some(features);
        self
    }
    
    pub fn with_timestamp(mut self, timestamp: u64) -> Self {
        self.as_of = Some(timestamp);
        self
    }
}

/// Individual forecast result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForecastResult {
    pub target: String,
    pub horizon_seconds: u64,
    pub timestamp: u64,
    pub predicted_value: f64, // e.g., predicted anomaly probability or TPS
    pub confidence: f32,      // 0.0-1.0
    pub meta: serde_json::Value,
}

impl ForecastResult {
    pub fn new(
        target: String,
        horizon_seconds: u64,
        predicted_value: f64,
        confidence: f32,
    ) -> Self {
        Self {
            target,
            horizon_seconds,
            timestamp: crate::utils::now_secs(),
            predicted_value,
            confidence,
            meta: serde_json::json!({}),
        }
    }
    
    pub fn with_meta(mut self, meta: serde_json::Value) -> Self {
        self.meta = meta;
        self
    }
}

/// Complete forecast response
#[derive(Debug, Clone)]
pub struct Forecast {
    pub results: Vec<ForecastResult>,
}

impl Forecast {
    pub fn new(results: Vec<ForecastResult>) -> Self {
        Self { results }
    }
    
    pub fn single(result: ForecastResult) -> Self {
        Self::new(vec![result])
    }
    
    pub fn is_empty(&self) -> bool {
        self.results.is_empty()
    }
    
    pub fn len(&self) -> usize {
        self.results.len()
    }
}

/// Predictor configuration
#[derive(Debug, Clone)]
pub struct PredictorConfig {
    pub sliding_window_secs: u64,
    pub retrain_interval_secs: u64,
    pub model_name: String,
    pub enable_online_inference: bool,
    pub max_predictions_per_minute: u32,
    pub confidence_threshold: f32,
}

impl PredictorConfig {
    pub fn new(model_name: String) -> Self {
        Self {
            sliding_window_secs: 3600, // 1 hour
            retrain_interval_secs: 86400, // 24 hours
            model_name,
            enable_online_inference: true,
            max_predictions_per_minute: 1000,
            confidence_threshold: 0.7,
        }
    }
    
    pub fn with_sliding_window(mut self, seconds: u64) -> Self {
        self.sliding_window_secs = seconds;
        self
    }
    
    pub fn with_retrain_interval(mut self, seconds: u64) -> Self {
        self.retrain_interval_secs = seconds;
        self
    }
    
    pub fn with_max_predictions(mut self, max: u32) -> Self {
        self.max_predictions_per_minute = max;
        self
    }
    
    pub fn with_confidence_threshold(mut self, threshold: f32) -> Self {
        self.confidence_threshold = threshold;
        self
    }
}

/// Feature vector for model input
#[derive(Debug, Clone)]
pub struct FeatureVector {
    pub features: std::collections::HashMap<String, f64>,
    pub ts: u64,
}

impl FeatureVector {
    pub fn new() -> Self {
        Self {
            features: std::collections::HashMap::new(),
            ts: crate::utils::now_secs(),
        }
    }
    
    pub fn with_timestamp(mut self, ts: u64) -> Self {
        self.ts = ts;
        self
    }
    
    pub fn insert(&mut self, key: String, value: f64) {
        self.features.insert(key, value);
    }
    
    pub fn get(&self, key: &str) -> Option<&f64> {
        self.features.get(key)
    }
    
    pub fn to_array(&self, keys: &[String]) -> Vec<f64> {
        keys.iter()
            .map(|key| self.features.get(key).copied().unwrap_or(0.0))
            .collect()
    }
}

/// Training dataset
#[derive(Debug, Clone)]
pub struct TrainingDataset {
    pub samples: Vec<TrainingSample>,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone)]
pub struct TrainingSample {
    pub features: FeatureVector,
    pub target_value: f64,
    pub timestamp: u64,
}

impl TrainingDataset {
    pub fn new() -> Self {
        Self {
            samples: Vec::new(),
            metadata: serde_json::json!({}),
        }
    }
    
    pub fn add_sample(&mut self, sample: TrainingSample) {
        self.samples.push(sample);
    }
    
    pub fn len(&self) -> usize {
        self.samples.len()
    }
    
    pub fn is_empty(&self) -> bool {
        self.samples.is_empty()
    }
    
    pub fn split(&self, ratio: f64) -> (TrainingDataset, TrainingDataset) {
        let split_idx = (self.samples.len() as f64 * ratio) as usize;
        let train_samples = self.samples[..split_idx].to_vec();
        let test_samples = self.samples[split_idx..].to_vec();
        
        (
            TrainingDataset {
                samples: train_samples,
                metadata: self.metadata.clone(),
            },
            TrainingDataset {
                samples: test_samples,
                metadata: self.metadata.clone(),
            },
        )
    }
}

/// Model evaluation metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelEvaluation {
    pub model_name: String,
    pub model_version: String,
    pub accuracy: f64,
    pub precision: f64,
    pub recall: f64,
    pub f1_score: f64,
    pub rmse: f64,
    pub mae: f64,
    pub test_samples: usize,
    pub timestamp: u64,
}

impl ModelEvaluation {
    pub fn new(model_name: String, model_version: String) -> Self {
        Self {
            model_name,
            model_version,
            accuracy: 0.0,
            precision: 0.0,
            recall: 0.0,
            f1_score: 0.0,
            rmse: 0.0,
            mae: 0.0,
            test_samples: 0,
            timestamp: crate::utils::now_secs(),
        }
    }
}