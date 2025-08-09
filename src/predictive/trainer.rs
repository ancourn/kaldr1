use super::types::{PredictorConfig, TrainingDataset, ModelEvaluation, TrainingSample};
use crate::ai_models::TrainerHandle;
use crate::predictive::features::FeatureExtractor;
use crate::performance_metrics::store::get_recent;
use crate::anomaly::store::get_recent_anomalies;
use anyhow::Result;
use std::sync::Arc;
use tokio::time::{interval, Duration, Instant};
use tokio::sync::RwLock;
use tracing::{info, warn, error};

/// Training configuration
#[derive(Debug, Clone)]
pub struct TrainingConfig {
    pub train_test_split_ratio: f64,
    pub min_training_samples: usize,
    pub max_training_samples: usize,
    pub validation_split_ratio: f64,
    pub early_stopping_patience: u32,
    pub max_epochs: u32,
    pub learning_rate: f64,
    pub batch_size: usize,
}

impl Default for TrainingConfig {
    fn default() -> Self {
        Self {
            train_test_split_ratio: 0.8,
            min_training_samples: 100,
            max_training_samples: 10000,
            validation_split_ratio: 0.2,
            early_stopping_patience: 10,
            max_epochs: 100,
            learning_rate: 0.001,
            batch_size: 32,
        }
    }
}

/// Training progress
#[derive(Debug, Clone)]
pub struct TrainingProgress {
    pub epoch: u32,
    pub total_epochs: u32,
    pub train_loss: f64,
    pub val_loss: f64,
    pub accuracy: f64,
    pub samples_processed: usize,
    pub total_samples: usize,
    pub estimated_time_remaining: Duration,
}

/// Training statistics
#[derive(Debug, Clone)]
pub struct TrainingStats {
    pub total_training_runs: u64,
    pub successful_training_runs: u64,
    pub failed_training_runs: u64,
    pub last_training_duration: Duration,
    pub average_training_duration: Duration,
    pub best_model_accuracy: f64,
    pub last_model_accuracy: f64,
}

impl Default for TrainingStats {
    fn default() -> Self {
        Self {
            total_training_runs: 0,
            successful_training_runs: 0,
            failed_training_runs: 0,
            last_training_duration: Duration::from_secs(0),
            average_training_duration: Duration::from_secs(0),
            best_model_accuracy: 0.0,
            last_model_accuracy: 0.0,
        }
    }
}

/// Model trainer for predictive analytics
pub struct Trainer {
    config: PredictorConfig,
    training_config: TrainingConfig,
    trainer: TrainerHandle,
    feature_extractor: FeatureExtractor,
    stats: Arc<RwLock<TrainingStats>>,
    is_training: Arc<RwLock<bool>>,
}

impl Trainer {
    pub fn new(config: PredictorConfig, trainer: TrainerHandle) -> Self {
        Self {
            config,
            training_config: TrainingConfig::default(),
            trainer,
            feature_extractor: FeatureExtractor::new(),
            stats: Arc::new(RwLock::new(TrainingStats::default())),
            is_training: Arc::new(RwLock::new(false)),
        }
    }
    
    pub fn with_training_config(mut self, training_config: TrainingConfig) -> Self {
        self.training_config = training_config;
        self
    }
    
    /// Start background retrain loop
    pub async fn start_retrain_loop(self: Arc<Self>, predictor: Arc<tokio::sync::RwLock<super::predictor::Predictor>>) {
        let mut intv = interval(Duration::from_secs(self.config.retrain_interval_secs));
        
        loop {
            intv.tick().await;
            
            // Check if already training
            {
                let is_training = self.is_training.read().await;
                if *is_training {
                    info!("Training already in progress, skipping this cycle");
                    continue;
                }
            }
            
            // Start training
            let trainer = Arc::clone(&self);
            let predictor_clone = Arc::clone(&predictor);
            
            tokio::spawn(async move {
                if let Err(e) = trainer.train_and_update(predictor_clone).await {
                    error!("Training failed: {}", e);
                }
            });
        }
    }
    
    /// Train model and update predictor
    pub async fn train_and_update(&self, predictor: Arc<tokio::sync::RwLock<super::predictor::Predictor>>) -> Result<()> {
        let start_time = Instant::now();
        
        // Set training flag
        {
            let mut is_training = self.is_training.write().await;
            *is_training = true;
        }
        
        // Clear training flag when done
        defer! {
            let mut is_training = self.is_training.write().await;
            *is_training = false;
        }
        
        info!("Starting model training cycle");
        
        // 1) Load historical dataset
        let dataset = self.load_training_data().await?;
        
        if dataset.len() < self.training_config.min_training_samples {
            warn!("Insufficient training data: {} samples (minimum: {})", 
                  dataset.len(), self.training_config.min_training_samples);
            return Ok(());
        }
        
        info!("Loaded {} training samples", dataset.len());
        
        // 2) Split dataset
        let (train_dataset, test_dataset) = dataset.split(self.training_config.train_test_split_ratio);
        
        // 3) Run training
        let training_result = self.run_training(&train_dataset, &test_dataset).await?;
        
        // 4) Evaluate model
        let evaluation = self.evaluate_model(&test_dataset, &training_result).await?;
        
        info!("Training completed. Accuracy: {:.2}%, Loss: {:.4}", 
              evaluation.accuracy * 100.0, evaluation.rmse);
        
        // 5) Update statistics
        self.update_stats(&evaluation, start_time.elapsed()).await;
        
        // 6) Publish model to registry
        if evaluation.accuracy > 0.5 { // Only publish if accuracy is reasonable
            self.publish_model(&training_result, &evaluation).await?;
            
            // 7) Update predictor with new model
            let new_model = self.trainer.create_model_handle(&training_result)?;
            {
                let mut predictor_guard = predictor.write().await;
                predictor_guard.update_model(new_model).await?;
            }
            
            info!("Model updated successfully");
        } else {
            warn!("Model accuracy too low ({}), not publishing", evaluation.accuracy);
        }
        
        Ok(())
    }
    
    /// Load training data from various sources
    async fn load_training_data(&self) -> Result<TrainingDataset> {
        let mut dataset = TrainingDataset::new();
        
        // Load from performance metrics
        if let Ok(metrics) = self.load_metrics_data().await {
            for sample in metrics {
                dataset.add_sample(sample);
            }
        }
        
        // Load from anomaly data
        if let Ok(anomalies) = self.load_anomaly_data().await {
            for sample in anomalies {
                dataset.add_sample(sample);
            }
        }
        
        // Load from historical forecasts
        if let Ok(forecasts) = self.load_forecast_data().await {
            for sample in forecasts {
                dataset.add_sample(sample);
            }
        }
        
        // Limit dataset size
        if dataset.len() > self.training_config.max_training_samples {
            dataset.samples.truncate(self.training_config.max_training_samples);
        }
        
        Ok(dataset)
    }
    
    /// Load training data from performance metrics
    async fn load_metrics_data(&self) -> Result<Vec<TrainingSample>> {
        let mut samples = Vec::new();
        
        // Get metrics for different time windows
        let targets = vec!["network:mainnet", "network:testnet"];
        
        for target in targets {
            if let Ok(metrics) = get_recent(target, self.config.sliding_window_secs * 24).await {
                for (i, metric) in metrics.iter().enumerate() {
                    if i == 0 {
                        continue; // Skip first for trend calculation
                    }
                    
                    // Create feature vector
                    let req = super::types::ForecastReq::new(target.to_string(), 
                                                           super::types::ForecastHorizon::Short(300))
                        .with_timestamp(metric.timestamp);
                    
                    let recent_metrics = &metrics[..i.min(metrics.len())];
                    let recent_anomalies = get_recent_anomalies(target, self.config.sliding_window_secs).await?;
                    
                    let fv = self.feature_extractor.build_features(&req, recent_metrics, &recent_anomalies);
                    
                    // Target value: next TPS value (for prediction)
                    let target_value = if i < metrics.len() {
                        metrics[i].tps as f64
                    } else {
                        metric.tps as f64
                    };
                    
                    samples.push(TrainingSample {
                        features: fv,
                        target_value,
                        timestamp: metric.timestamp,
                    });
                }
            }
        }
        
        Ok(samples)
    }
    
    /// Load training data from anomalies
    async fn load_anomaly_data(&self) -> Result<Vec<TrainingSample>> {
        let mut samples = Vec::new();
        
        // Get recent anomalies
        let targets = vec!["network:mainnet", "network:testnet"];
        
        for target in targets {
            if let Ok(anomalies) = get_recent_anomalies(target, self.config.sliding_window_secs * 24).await {
                for anomaly in &anomalies {
                    // Create feature vector for time before anomaly
                    let req = super::types::ForecastReq::new(target.to_string(), 
                                                           super::types::ForecastHorizon::Short(300))
                        .with_timestamp(anomaly.timestamp.saturating_sub(300));
                    
                    let recent_metrics = get_recent(target, self.config.sliding_window_secs).await?;
                    let recent_anomalies = get_recent_anomalies(target, self.config.sliding_window_secs).await?;
                    
                    let fv = self.feature_extractor.build_features(&req, &recent_metrics, &recent_anomalies);
                    
                    // Target value: anomaly severity (1-4)
                    let target_value = match anomaly.severity {
                        crate::anomaly::Severity::Low => 1.0,
                        crate::anomaly::Severity::Medium => 2.0,
                        crate::anomaly::Severity::High => 3.0,
                        crate::anomaly::Severity::Critical => 4.0,
                    };
                    
                    samples.push(TrainingSample {
                        features: fv,
                        target_value,
                        timestamp: anomaly.timestamp,
                    });
                }
            }
        }
        
        Ok(samples)
    }
    
    /// Load training data from historical forecasts
    async fn load_forecast_data(&self) -> Result<Vec<TrainingSample>> {
        // This would typically load from a database of historical forecasts
        // For now, return empty data
        Ok(Vec::new())
    }
    
    /// Run the actual training process
    async fn run_training(&self, train_dataset: &TrainingDataset, test_dataset: &TrainingDataset) -> Result<serde_json::Value> {
        let mut progress_callback = |progress: TrainingProgress| {
            info!("Training progress: Epoch {}/{}, Loss: {:.4}, Accuracy: {:.2}%, ETA: {:.2}s",
                  progress.epoch, progress.total_epochs, progress.train_loss,
                  progress.accuracy * 100.0, progress.estimated_time_remaining.as_secs_f64());
        };
        
        let training_result = self.trainer.train_with_progress(
            train_dataset,
            test_dataset,
            &self.training_config,
            Some(&mut progress_callback),
        ).await?;
        
        Ok(training_result)
    }
    
    /// Evaluate the trained model
    async fn evaluate_model(&self, test_dataset: &TrainingDataset, training_result: &serde_json::Value) -> Result<ModelEvaluation> {
        let evaluation = self.trainer.evaluate(test_dataset, training_result).await?;
        
        Ok(ModelEvaluation {
            model_name: self.config.model_name.clone(),
            model_version: training_result.get("version").and_then(|v| v.as_str()).unwrap_or("unknown").to_string(),
            accuracy: evaluation.get("accuracy").and_then(|v| v.as_f64()).unwrap_or(0.0),
            precision: evaluation.get("precision").and_then(|v| v.as_f64()).unwrap_or(0.0),
            recall: evaluation.get("recall").and_then(|v| v.as_f64()).unwrap_or(0.0),
            f1_score: evaluation.get("f1_score").and_then(|v| v.as_f64()).unwrap_or(0.0),
            rmse: evaluation.get("rmse").and_then(|v| v.as_f64()).unwrap_or(0.0),
            mae: evaluation.get("mae").and_then(|v| v.as_f64()).unwrap_or(0.0),
            test_samples: test_dataset.len(),
            timestamp: crate::utils::now_secs(),
        })
    }
    
    /// Update training statistics
    async fn update_stats(&self, evaluation: &ModelEvaluation, duration: Duration) {
        let mut stats = self.stats.write().await;
        
        stats.total_training_runs += 1;
        stats.successful_training_runs += 1;
        stats.last_training_duration = duration;
        
        // Update average duration
        let total_duration = stats.average_training_duration * (stats.total_training_runs - 1) as u32 + duration;
        stats.average_training_duration = total_duration / stats.total_training_runs as u32;
        
        // Update accuracy
        stats.last_model_accuracy = evaluation.accuracy;
        if evaluation.accuracy > stats.best_model_accuracy {
            stats.best_model_accuracy = evaluation.accuracy;
        }
    }
    
    /// Publish model to registry
    async fn publish_model(&self, training_result: &serde_json::Value, evaluation: &ModelEvaluation) -> Result<()> {
        let model_info = serde_json::json!({
            "name": self.config.model_name,
            "version": evaluation.model_version.clone(),
            "training_result": training_result,
            "evaluation": evaluation,
            "training_config": self.training_config,
            "created_at": crate::utils::now_secs(),
        });
        
        // Publish to model registry
        crate::model_registry::publish_model(&model_info).await?;
        
        // Emit event
        crate::event_bus::emit("predictive:model:updated", &model_info).await?;
        
        Ok(())
    }
    
    /// Get training statistics
    pub async fn get_stats(&self) -> Result<TrainingStats> {
        let stats = self.stats.read().await;
        Ok(stats.clone())
    }
    
    /// Check if training is in progress
    pub async fn is_training(&self) -> bool {
        let is_training = self.is_training.read().await;
        *is_training
    }
    
    /// Manually trigger training
    pub async fn trigger_training(&self, predictor: Arc<tokio::sync::RwLock<super::predictor::Predictor>>) -> Result<()> {
        if self.is_training().await {
            return Err(anyhow::anyhow!("Training already in progress"));
        }
        
        self.train_and_update(predictor).await
    }
}

// Helper macro for deferred cleanup
macro_rules! defer {
    ($($body:tt)*) => {
        let _guard = scopeguard::guard((), |_| $($body)*);
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai_models::TrainerHandle;
    
    #[tokio::test]
    async fn test_trainer_creation() {
        let config = PredictorConfig::new("test_model".to_string());
        let trainer = TrainerHandle::new("test_trainer").unwrap();
        
        let trainer_instance = Trainer::new(config, trainer);
        
        assert!(!trainer_instance.config.model_name.is_empty());
    }
    
    #[tokio::test]
    async fn test_training_stats() {
        let config = PredictorConfig::new("test_model".to_string());
        let trainer = TrainerHandle::new("test_trainer").unwrap();
        
        let trainer_instance = Trainer::new(config, trainer);
        let stats = trainer_instance.get_stats().await.unwrap();
        
        assert_eq!(stats.total_training_runs, 0);
        assert_eq!(stats.successful_training_runs, 0);
        assert_eq!(stats.failed_training_runs, 0);
    }
    
    #[tokio::test]
    async fn test_is_training() {
        let config = PredictorConfig::new("test_model".to_string());
        let trainer = TrainerHandle::new("test_trainer").unwrap();
        
        let trainer_instance = Trainer::new(config, trainer);
        
        assert!(!trainer_instance.is_training().await);
    }
}