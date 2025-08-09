use super::types::{Forecast, ForecastResult};
use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Storage interface for forecasts
#[derive(Debug, Clone)]
pub struct ForecastStore {
    forecasts: Arc<RwLock<HashMap<String, StoredForecast>>>,
    config: StoreConfig,
}

#[derive(Debug, Clone)]
pub struct StoreConfig {
    pub max_forecasts_per_target: usize,
    pub retention_period_hours: u64,
    pub enable_persistence: bool,
    pub storage_path: Option<String>,
}

impl Default for StoreConfig {
    fn default() -> Self {
        Self {
            max_forecasts_per_target: 1000,
            retention_period_hours: 24 * 7, // 1 week
            enable_persistence: false,
            storage_path: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredForecast {
    pub forecast: Forecast,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

impl StoredForecast {
    pub fn new(forecast: Forecast, retention_hours: u64) -> Self {
        let created_at = Utc::now();
        let expires_at = created_at + chrono::Duration::hours(retention_hours as i64);
        
        Self {
            forecast,
            created_at,
            expires_at,
        }
    }
    
    pub fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }
    
    pub fn is_valid(&self) -> bool {
        !self.is_expired() && !self.forecast.results.is_empty()
    }
}

impl ForecastStore {
    pub fn new() -> Self {
        Self::with_config(StoreConfig::default())
    }
    
    pub fn with_config(config: StoreConfig) -> Self {
        let store = Self {
            forecasts: Arc::new(RwLock::new(HashMap::new())),
            config,
        };
        
        // Load from persistence if enabled
        if config.enable_persistence {
            if let Err(e) = store.load_from_disk() {
                tracing::warn!("Failed to load forecasts from disk: {}", e);
            }
        }
        
        store
    }
    
    /// Store a forecast
    pub async fn store_forecast(&self, forecast: &Forecast) -> Result<()> {
        let mut forecasts = self.forecasts.write().await;
        
        for result in &forecast.results {
            let key = self.forecast_key(&result.target, result.horizon_seconds);
            
            let stored_forecast = StoredForecast::new(
                Forecast::single(result.clone()),
                self.config.retention_period_hours,
            );
            
            forecasts.insert(key, stored_forecast);
        }
        
        // Clean up old forecasts
        self.cleanup_forecasts(&mut forecasts).await;
        
        // Persist to disk if enabled
        if self.config.enable_persistence {
            if let Err(e) = self.save_to_disk().await {
                tracing::warn!("Failed to persist forecasts to disk: {}", e);
            }
        }
        
        Ok(())
    }
    
    /// Get recent forecasts for a target
    pub async fn get_recent_forecasts(&self, target: &str, limit: usize) -> Result<Vec<Forecast>> {
        let forecasts = self.forecasts.read().await;
        
        let mut target_forecasts: Vec<StoredForecast> = forecasts
            .values()
            .filter(|sf| sf.forecast.results.iter().any(|r| r.target == target))
            .filter(|sf| sf.is_valid())
            .cloned()
            .collect();
        
        // Sort by creation time (newest first)
        target_forecasts.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        
        // Apply limit
        target_forecasts.truncate(limit);
        
        Ok(target_forecasts.into_iter().map(|sf| sf.forecast).collect())
    }
    
    /// Get forecasts for a specific target and horizon
    pub async fn get_forecasts_by_horizon(&self, target: &str, horizon_seconds: u64) -> Result<Vec<Forecast>> {
        let forecasts = self.forecasts.read().await;
        
        let key = self.forecast_key(target, horizon_seconds);
        
        if let Some(stored_forecast) = forecasts.get(&key) {
            if stored_forecast.is_valid() {
                return Ok(vec![stored_forecast.forecast.clone()]);
            }
        }
        
        Ok(Vec::new())
    }
    
    /// Get the latest forecast for a target
    pub async fn get_latest_forecast(&self, target: &str) -> Result<Option<Forecast>> {
        let forecasts = self.forecasts.read().await;
        
        let mut target_forecasts: Vec<&StoredForecast> = forecasts
            .values()
            .filter(|sf| sf.forecast.results.iter().any(|r| r.target == target))
            .filter(|sf| sf.is_valid())
            .collect();
        
        if target_forecasts.is_empty() {
            return Ok(None);
        }
        
        // Get the most recent forecast
        target_forecasts.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(Some(target_forecasts[0].forecast.clone()))
    }
    
    /// Get forecasts within a time range
    pub async fn get_forecasts_in_range(&self, target: &str, start_time: DateTime<Utc>, end_time: DateTime<Utc>) -> Result<Vec<Forecast>> {
        let forecasts = self.forecasts.read().await;
        
        let target_forecasts: Vec<Forecast> = forecasts
            .values()
            .filter(|sf| {
                sf.forecast.results.iter().any(|r| r.target == target) &&
                sf.created_at >= start_time &&
                sf.created_at <= end_time &&
                sf.is_valid()
            })
            .map(|sf| sf.forecast.clone())
            .collect();
        
        Ok(target_forecasts)
    }
    
    /// Delete forecasts for a target
    pub async fn delete_forecasts(&self, target: &str) -> Result<usize> {
        let mut forecasts = self.forecasts.write().await;
        
        let initial_count = forecasts.len();
        forecasts.retain(|key, sf| {
            !sf.forecast.results.iter().any(|r| r.target == target)
        });
        
        let deleted_count = initial_count - forecasts.len();
        
        // Persist changes if enabled
        if self.config.enable_persistence && deleted_count > 0 {
            if let Err(e) = self.save_to_disk().await {
                tracing::warn!("Failed to persist forecast deletion to disk: {}", e);
            }
        }
        
        Ok(deleted_count)
    }
    
    /// Get storage statistics
    pub async fn get_stats(&self) -> Result<StoreStats> {
        let forecasts = self.forecasts.read().await;
        
        let total_forecasts = forecasts.len();
        let expired_forecasts = forecasts.values().filter(|sf| sf.is_expired()).count();
        let valid_forecasts = total_forecasts - expired_forecasts;
        
        let target_counts: HashMap<String, usize> = forecasts
            .values()
            .flat_map(|sf| sf.forecast.results.iter().map(|r| r.target.clone()))
            .fold(HashMap::new(), |mut counts, target| {
                *counts.entry(target).or_insert(0) += 1;
                counts
            });
        
        let oldest_forecast = forecasts
            .values()
            .filter(|sf| sf.is_valid())
            .min_by_key(|sf| sf.created_at)
            .map(|sf| sf.created_at);
        
        let newest_forecast = forecasts
            .values()
            .filter(|sf| sf.is_valid())
            .max_by_key(|sf| sf.created_at)
            .map(|sf| sf.created_at);
        
        Ok(StoreStats {
            total_forecasts,
            valid_forecasts,
            expired_forecasts,
            target_counts,
            oldest_forecast,
            newest_forecast,
            retention_period_hours: self.config.retention_period_hours,
        })
    }
    
    /// Clean up expired forecasts
    async fn cleanup_forecasts(&self, forecasts: &mut HashMap<String, StoredForecast>) {
        let initial_count = forecasts.len();
        
        // Remove expired forecasts
        forecasts.retain(|_, sf| !sf.is_expired());
        
        // Limit forecasts per target
        let mut target_counts: HashMap<String, usize> = HashMap::new();
        let mut to_remove = Vec::new();
        
        for (key, sf) in forecasts.iter() {
            for result in &sf.forecast.results {
                let count = target_counts.entry(result.target.clone()).or_insert(0);
                *count += 1;
                
                if *count > self.config.max_forecasts_per_target {
                    to_remove.push(key.clone());
                    break;
                }
            }
        }
        
        for key in to_remove {
            forecasts.remove(&key);
        }
        
        let cleaned_count = initial_count - forecasts.len();
        if cleaned_count > 0 {
            tracing::info!("Cleaned up {} expired/old forecasts", cleaned_count);
        }
    }
    
    /// Generate forecast key
    fn forecast_key(&self, target: &str, horizon_seconds: u64) -> String {
        format!("{}:{}", target, horizon_seconds)
    }
    
    /// Save forecasts to disk
    async fn save_to_disk(&self) -> Result<()> {
        if !self.config.enable_persistence || self.config.storage_path.is_none() {
            return Ok(());
        }
        
        let storage_path = self.config.storage_path.as_ref().unwrap();
        let forecasts = self.forecasts.read().await;
        
        let data = serde_json::to_string(&*forecasts)?;
        tokio::fs::write(storage_path, data).await?;
        
        Ok(())
    }
    
    /// Load forecasts from disk
    fn load_from_disk(&self) -> Result<()> {
        if !self.config.enable_persistence || self.config.storage_path.is_none() {
            return Ok(());
        }
        
        let storage_path = self.config.storage_path.as_ref().unwrap();
        
        if !std::path::Path::new(storage_path).exists() {
            return Ok(());
        }
        
        let data = std::fs::read_to_string(storage_path)?;
        let loaded_forecasts: HashMap<String, StoredForecast> = serde_json::from_str(&data)?;
        
        let mut forecasts = self.forecasts.blocking_write();
        *forecasts = loaded_forecasts;
        
        // Clean up expired forecasts after loading
        self.cleanup_forecasts(&mut forecasts).await;
        
        Ok(())
    }
    
    /// Force cleanup of expired forecasts
    pub async fn force_cleanup(&self) -> Result<usize> {
        let mut forecasts = self.forecasts.write().await;
        let initial_count = forecasts.len();
        
        self.cleanup_forecasts(&mut forecasts).await;
        
        let cleaned_count = initial_count - forecasts.len();
        
        if cleaned_count > 0 && self.config.enable_persistence {
            if let Err(e) = self.save_to_disk().await {
                tracing::warn!("Failed to persist cleanup to disk: {}", e);
            }
        }
        
        Ok(cleaned_count)
    }
    
    /// Export forecasts as JSON
    pub async fn export_json(&self) -> Result<String> {
        let forecasts = self.forecasts.read().await;
        let data: Vec<&StoredForecast> = forecasts.values().filter(|sf| sf.is_valid()).collect();
        
        Ok(serde_json::to_string_pretty(&data)?)
    }
    
    /// Import forecasts from JSON
    pub async fn import_json(&self, json_data: &str) -> Result<usize> {
        let imported_forecasts: Vec<StoredForecast> = serde_json::from_str(json_data)?;
        let mut count = 0;
        
        let mut forecasts = self.forecasts.write().await;
        
        for sf in imported_forecasts {
            if sf.is_valid() {
                for result in &sf.forecast.results {
                    let key = self.forecast_key(&result.target, result.horizon_seconds);
                    forecasts.insert(key, sf.clone());
                    count += 1;
                }
            }
        }
        
        // Clean up after import
        self.cleanup_forecasts(&mut forecasts).await;
        
        // Persist if enabled
        if self.config.enable_persistence && count > 0 {
            if let Err(e) = self.save_to_disk().await {
                tracing::warn!("Failed to persist import to disk: {}", e);
            }
        }
        
        Ok(count)
    }
}

/// Storage statistics
#[derive(Debug, Clone)]
pub struct StoreStats {
    pub total_forecasts: usize,
    pub valid_forecasts: usize,
    pub expired_forecasts: usize,
    pub target_counts: HashMap<String, usize>,
    pub oldest_forecast: Option<DateTime<Utc>>,
    pub newest_forecast: Option<DateTime<Utc>>,
    pub retention_period_hours: u64,
}

impl StoreStats {
    pub fn summary(&self) -> String {
        format!(
            "Store: total={}, valid={}, expired={}, targets={}, retention={}h",
            self.total_forecasts,
            self.valid_forecasts,
            self.expired_forecasts,
            self.target_counts.len(),
            self.retention_period_hours
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::predictive::types::{ForecastHorizon, ForecastResult};
    
    #[tokio::test]
    async fn test_store_creation() {
        let store = ForecastStore::new();
        
        let stats = store.get_stats().await.unwrap();
        assert_eq!(stats.total_forecasts, 0);
        assert_eq!(stats.valid_forecasts, 0);
    }
    
    #[tokio::test]
    async fn test_store_forecast() {
        let store = ForecastStore::new();
        
        let result = ForecastResult::new("test".to_string(), 300, 0.5, 0.8);
        let forecast = Forecast::single(result);
        
        store.store_forecast(&forecast).await.unwrap();
        
        let stats = store.get_stats().await.unwrap();
        assert_eq!(stats.total_forecasts, 1);
        assert_eq!(stats.valid_forecasts, 1);
    }
    
    #[tokio::test]
    async fn test_get_recent_forecasts() {
        let store = ForecastStore::new();
        
        let result1 = ForecastResult::new("test".to_string(), 300, 0.5, 0.8);
        let result2 = ForecastResult::new("test".to_string(), 600, 0.6, 0.9);
        
        store.store_forecast(&Forecast::single(result1)).await.unwrap();
        store.store_forecast(&Forecast::single(result2)).await.unwrap();
        
        let recent = store.get_recent_forecasts("test", 10).await.unwrap();
        assert_eq!(recent.len(), 2);
    }
    
    #[tokio::test]
    async fn test_get_latest_forecast() {
        let store = ForecastStore::new();
        
        let result = ForecastResult::new("test".to_string(), 300, 0.5, 0.8);
        let forecast = Forecast::single(result);
        
        store.store_forecast(&forecast).await.unwrap();
        
        let latest = store.get_latest_forecast("test").await.unwrap();
        assert!(latest.is_some());
        
        let latest_forecast = latest.unwrap();
        assert_eq!(latest_forecast.results.len(), 1);
        assert_eq!(latest_forecast.results[0].target, "test");
    }
    
    #[tokio::test]
    async fn test_delete_forecasts() {
        let store = ForecastStore::new();
        
        let result = ForecastResult::new("test".to_string(), 300, 0.5, 0.8);
        let forecast = Forecast::single(result);
        
        store.store_forecast(&forecast).await.unwrap();
        
        let deleted = store.delete_forecasts("test").await.unwrap();
        assert_eq!(deleted, 1);
        
        let stats = store.get_stats().await.unwrap();
        assert_eq!(stats.total_forecasts, 0);
    }
    
    #[tokio::test]
    async fn test_forecast_key_generation() {
        let store = ForecastStore::new();
        
        let key1 = store.forecast_key("target1", 300);
        let key2 = store.forecast_key("target2", 600);
        
        assert_eq!(key1, "target1:300");
        assert_eq!(key2, "target2:600");
        assert_ne!(key1, key2);
    }
}