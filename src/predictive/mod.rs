pub mod types;
pub mod features;
pub mod predictor;
pub mod trainer;
pub mod metrics;
pub mod store;

pub use types::{Forecast, ForecastReq, ForecastResult, ForecastHorizon, PredictorConfig};
pub use predictor::Predictor;
pub use trainer::Trainer;
pub use metrics::PredictiveMetrics;
pub use store::ForecastStore;

use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Main predictive analytics module coordinator
pub struct PredictiveAnalytics {
    predictor: Arc<RwLock<Predictor>>,
    trainer: Arc<Trainer>,
    store: Arc<ForecastStore>,
    metrics: PredictiveMetrics,
}

impl PredictiveAnalytics {
    pub async fn new(config: PredictorConfig) -> Result<Self> {
        let store = Arc::new(ForecastStore::new().await?);
        let metrics = PredictiveMetrics::new();
        
        // Initialize with a default model (will be replaced by trainer)
        let initial_model = crate::ai_models::ModelHandle::new("default_predictor", "v1.0.0")?;
        let predictor = Arc::new(RwLock::new(Predictor::new(config.clone(), initial_model)));
        
        let trainer_handle = crate::ai_models::TrainerHandle::new("predictive_trainer")?;
        let trainer = Arc::new(Trainer::new(config, trainer_handle));
        
        Ok(Self {
            predictor,
            trainer,
            store,
            metrics,
        })
    }
    
    /// Generate a forecast for the given request
    pub async fn forecast(&self, req: ForecastReq) -> Result<Forecast> {
        let start_time = std::time::Instant::now();
        
        let predictor = self.predictor.read().await;
        let forecast = predictor.forecast(req.clone()).await?;
        
        // Store the forecast
        self.store.store_forecast(&forecast).await?;
        
        // Record metrics
        let latency = start_time.elapsed().as_secs_f64();
        self.metrics.record_request(&req.target, latency);
        
        if let Some(result) = forecast.results.first() {
            self.metrics.record_prediction(&req.target, result.predicted_value, result.confidence);
        }
        
        Ok(forecast)
    }
    
    /// Start the background training loop
    pub async fn start_training(&self) -> Result<()> {
        let trainer = Arc::clone(&self.trainer);
        let predictor = Arc::clone(&self.predictor);
        
        tokio::spawn(async move {
            trainer.start_retrain_loop(predictor).await;
        });
        
        Ok(())
    }
    
    /// Get recent forecasts for a target
    pub async fn get_recent_forecasts(&self, target: &str, limit: usize) -> Result<Vec<Forecast>> {
        self.store.get_recent_forecasts(target, limit).await
    }
    
    /// Get the metrics collector
    pub fn metrics(&self) -> &PredictiveMetrics {
        &self.metrics
    }
}