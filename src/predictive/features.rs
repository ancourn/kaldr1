use crate::predictive::types::{ForecastReq, FeatureVector};
use crate::performance_metrics::PerformanceSnapshot;
use crate::anomaly::Anomaly;
use std::collections::HashMap;
use anyhow::Result;

/// Feature extractor for predictive analytics
pub struct FeatureExtractor {
    feature_config: FeatureConfig,
}

#[derive(Debug, Clone)]
pub struct FeatureConfig {
    pub include_tps_features: bool,
    pub include_latency_features: bool,
    pub include_anomaly_features: bool,
    pub include_time_features: bool,
    pub include_network_features: bool,
    pub include_contract_features: bool,
    pub custom_features: Vec<String>,
}

impl Default for FeatureConfig {
    fn default() -> Self {
        Self {
            include_tps_features: true,
            include_latency_features: true,
            include_anomaly_features: true,
            include_time_features: true,
            include_network_features: true,
            include_contract_features: true,
            custom_features: Vec::new(),
        }
    }
}

impl FeatureExtractor {
    pub fn new() -> Self {
        Self {
            feature_config: FeatureConfig::default(),
        }
    }
    
    pub fn with_config(mut self, config: FeatureConfig) -> Self {
        self.feature_config = config;
        self
    }
    
    /// Build a feature vector for a ForecastReq by consuming recent PerformanceSnapshots
    /// and recent anomalies. Keep deterministic, unit-testable logic here.
    pub fn build_features(
        &self,
        req: &ForecastReq,
        recent_metrics: &[PerformanceSnapshot],
        recent_anomalies: &[Anomaly],
    ) -> FeatureVector {
        let mut features = HashMap::new();
        let timestamp = req.as_of.unwrap_or_else(|| crate::utils::now_secs());
        
        // TPS features
        if self.feature_config.include_tps_features {
            self.add_tps_features(&mut features, recent_metrics);
        }
        
        // Latency features
        if self.feature_config.include_latency_features {
            self.add_latency_features(&mut features, recent_metrics);
        }
        
        // Anomaly features
        if self.feature_config.include_anomaly_features {
            self.add_anomaly_features(&mut features, recent_anomalies, timestamp);
        }
        
        // Time features
        if self.feature_config.include_time_features {
            self.add_time_features(&mut features, timestamp);
        }
        
        // Network features
        if self.feature_config.include_network_features {
            self.add_network_features(&mut features, &req.target);
        }
        
        // Contract features
        if self.feature_config.include_contract_features {
            self.add_contract_features(&mut features, &req.target);
        }
        
        // Custom features
        for feature_name in &self.feature_config.custom_features {
            self.add_custom_feature(&mut features, feature_name, req, recent_metrics, recent_anomalies);
        }
        
        FeatureVector { features, ts: timestamp }
    }
    
    fn add_tps_features(&self, features: &mut HashMap<String, f64>, metrics: &[PerformanceSnapshot]) {
        if metrics.is_empty() {
            features.insert("mean_tps".to_string(), 0.0);
            features.insert("tps_std".to_string(), 0.0);
            features.insert("tps_trend".to_string(), 0.0);
            features.insert("max_tps".to_string(), 0.0);
            features.insert("min_tps".to_string(), 0.0);
            return;
        }
        
        let tps_values: Vec<f64> = metrics.iter().map(|m| m.tps as f64).collect();
        
        // Mean TPS
        let mean_tps = tps_values.iter().sum::<f64>() / tps_values.len() as f64;
        features.insert("mean_tps".to_string(), mean_tps);
        
        // TPS standard deviation
        let variance = tps_values.iter()
            .map(|&x| (x - mean_tps).powi(2))
            .sum::<f64>() / tps_values.len() as f64;
        let std_tps = variance.sqrt();
        features.insert("tps_std".to_string(), std_tps);
        
        // TPS trend (simple linear regression slope)
        let tps_trend = self.calculate_trend(&tps_values);
        features.insert("tps_trend".to_string(), tps_trend);
        
        // Min/Max TPS
        let max_tps = tps_values.iter().fold(0./0., f64::max);
        let min_tps = tps_values.iter().fold(0./0., f64::min);
        features.insert("max_tps".to_string(), max_tps);
        features.insert("min_tps".to_string(), min_tps);
        
        // TPS volatility (coefficient of variation)
        let cv_tps = if mean_tps > 0.0 { std_tps / mean_tps } else { 0.0 };
        features.insert("tps_volatility".to_string(), cv_tps);
    }
    
    fn add_latency_features(&self, features: &mut HashMap<String, f64>, metrics: &[PerformanceSnapshot]) {
        if metrics.is_empty() {
            features.insert("mean_latency_ms".to_string(), 0.0);
            features.insert("latency_p95_ms".to_string(), 0.0);
            features.insert("latency_p99_ms".to_string(), 0.0);
            features.insert("max_latency_ms".to_string(), 0.0);
            features.insert("latency_trend".to_string(), 0.0);
            return;
        }
        
        let latency_values: Vec<f64> = metrics.iter().map(|m| m.latency_ms as f64).collect();
        
        // Mean latency
        let mean_latency = latency_values.iter().sum::<f64>() / latency_values.len() as f64;
        features.insert("mean_latency_ms".to_string(), mean_latency);
        
        // Percentiles
        let mut sorted_latency = latency_values.clone();
        sorted_latency.sort_by(|a, b| a.partial_cmp(b).unwrap());
        
        let p95_idx = (sorted_latency.len() as f64 * 0.95) as usize;
        let p99_idx = (sorted_latency.len() as f64 * 0.99) as usize;
        
        let p95_latency = sorted_latency.get(p95_idx).copied().unwrap_or(0.0);
        let p99_latency = sorted_latency.get(p99_idx).copied().unwrap_or(0.0);
        
        features.insert("latency_p95_ms".to_string(), p95_latency);
        features.insert("latency_p99_ms".to_string(), p99_latency);
        
        // Max latency
        let max_latency = latency_values.iter().fold(0./0., f64::max);
        features.insert("max_latency_ms".to_string(), max_latency);
        
        // Latency trend
        let latency_trend = self.calculate_trend(&latency_values);
        features.insert("latency_trend".to_string(), latency_trend);
    }
    
    fn add_anomaly_features(&self, features: &mut HashMap<String, f64>, anomalies: &[Anomaly], current_time: u64) {
        // Count recent anomalies
        features.insert("recent_anomaly_count".to_string(), anomalies.len() as f64);
        
        // Anomaly rate per hour
        let time_window = 3600; // 1 hour
        let recent_anomalies = anomalies.iter()
            .filter(|a| current_time.saturating_sub(a.timestamp) <= time_window)
            .count();
        features.insert("anomaly_rate_per_hour".to_string(), recent_anomalies as f64);
        
        // Anomaly severity score
        let severity_score = anomalies.iter()
            .map(|a| match a.severity {
                crate::anomaly::Severity::Low => 1.0,
                crate::anomaly::Severity::Medium => 2.0,
                crate::anomaly::Severity::High => 3.0,
                crate::anomaly::Severity::Critical => 4.0,
            })
            .sum::<f64>();
        features.insert("anomaly_severity_score".to_string(), severity_score);
        
        // Time since last anomaly
        if let Some(last_anomaly) = anomalies.iter().max_by_key(|a| a.timestamp) {
            let time_since = current_time.saturating_sub(last_anomaly.timestamp);
            features.insert("time_since_last_anomaly".to_string(), time_since as f64);
        } else {
            features.insert("time_since_last_anomaly".to_string(), f64::MAX);
        }
        
        // Anomaly type distribution
        let mut type_counts = HashMap::new();
        for anomaly in anomalies {
            *type_counts.entry(anomaly.anomaly_type.clone()).or_insert(0) += 1;
        }
        
        for (anomaly_type, count) in type_counts {
            features.insert(format!("anomaly_count_{}", anomaly_type), count as f64);
        }
    }
    
    fn add_time_features(&self, features: &mut HashMap<String, f64>, timestamp: u64) {
        // Convert to datetime
        let datetime = chrono::DateTime::from_timestamp(timestamp as i64, 0)
            .unwrap_or_else(|| chrono::Utc::now());
        
        // Hour of day (0-23)
        features.insert("hour_of_day".to_string(), datetime.hour() as f64);
        
        // Day of week (0-6)
        features.insert("day_of_week".to_string(), datetime.weekday().num_days_from_monday() as f64);
        
        // Is weekend
        let is_weekend = (datetime.weekday().num_days_from_monday() >= 5) as u8 as f64;
        features.insert("is_weekend".to_string(), is_weekend);
        
        // Is business hours (9 AM - 5 PM UTC)
        let is_business_hours = (datetime.hour() >= 9 && datetime.hour() < 17) as u8 as f64;
        features.insert("is_business_hours".to_string(), is_business_hours);
    }
    
    fn add_network_features(&self, features: &mut HashMap<String, f64>, target: &str) {
        if target.starts_with("network:") {
            // Network-specific features
            features.insert("is_network_target".to_string(), 1.0);
            features.insert("is_contract_target".to_string(), 0.0);
            
            // Extract network name
            if let Some(network) = target.strip_prefix("network:") {
                features.insert(format!("network_{}", network.to_lowercase()), 1.0);
            }
        } else if target.starts_with("contract:") {
            // Contract-specific features
            features.insert("is_network_target".to_string(), 0.0);
            features.insert("is_contract_target".to_string(), 1.0);
        } else {
            // Unknown target type
            features.insert("is_network_target".to_string(), 0.0);
            features.insert("is_contract_target".to_string(), 0.0);
        }
    }
    
    fn add_contract_features(&self, features: &mut HashMap<String, f64>, target: &str) {
        if target.starts_with("contract:") {
            // Contract address length (as a proxy for contract type)
            let address_len = target.len() as f64;
            features.insert("contract_address_length".to_string(), address_len);
            
            // Check if it's a verified contract (placeholder - would need integration with contract registry)
            features.insert("is_verified_contract".to_string(), 0.0); // Default to false
        }
    }
    
    fn add_custom_feature(&self, features: &mut HashMap<String, f64>, feature_name: &str, 
                         req: &ForecastReq, metrics: &[PerformanceSnapshot], anomalies: &[Anomaly]) {
        match feature_name {
            "tps_growth_rate" => {
                if metrics.len() >= 2 {
                    let first_tps = metrics.first().unwrap().tps as f64;
                    let last_tps = metrics.last().unwrap().tps as f64;
                    let growth_rate = if first_tps > 0.0 {
                        (last_tps - first_tps) / first_tps
                    } else {
                        0.0
                    };
                    features.insert("tps_growth_rate".to_string(), growth_rate);
                } else {
                    features.insert("tps_growth_rate".to_string(), 0.0);
                }
            },
            "anomaly_frequency" => {
                if !metrics.is_empty() {
                    let time_span = metrics.last().unwrap().timestamp.saturating_sub(metrics.first().unwrap().timestamp);
                    let frequency = if time_span > 0 {
                        anomalies.len() as f64 / (time_span as f64 / 3600.0) // anomalies per hour
                    } else {
                        0.0
                    };
                    features.insert("anomaly_frequency".to_string(), frequency);
                } else {
                    features.insert("anomaly_frequency".to_string(), 0.0);
                }
            },
            _ => {
                // Unknown custom feature, set to 0
                features.insert(feature_name.to_string(), 0.0);
            }
        }
    }
    
    /// Calculate linear trend (slope) for a series of values
    fn calculate_trend(&self, values: &[f64]) -> f64 {
        if values.len() < 2 {
            return 0.0;
        }
        
        let n = values.len() as f64;
        let sum_x = (0..values.len()).sum::<usize>() as f64;
        let sum_y = values.iter().sum::<f64>();
        let sum_xy = values.iter().enumerate()
            .map(|(i, &y)| i as f64 * y)
            .sum::<f64>();
        let sum_x2 = (0..values.len()).map(|i| (i as f64).powi(2)).sum::<f64>();
        
        let slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x.powi(2));
        slope
    }
    
    /// Get the list of all feature names that will be generated
    pub fn get_feature_names(&self) -> Vec<String> {
        let mut names = Vec::new();
        
        if self.feature_config.include_tps_features {
            names.extend(vec![
                "mean_tps".to_string(),
                "tps_std".to_string(),
                "tps_trend".to_string(),
                "max_tps".to_string(),
                "min_tps".to_string(),
                "tps_volatility".to_string(),
            ]);
        }
        
        if self.feature_config.include_latency_features {
            names.extend(vec![
                "mean_latency_ms".to_string(),
                "latency_p95_ms".to_string(),
                "latency_p99_ms".to_string(),
                "max_latency_ms".to_string(),
                "latency_trend".to_string(),
            ]);
        }
        
        if self.feature_config.include_anomaly_features {
            names.extend(vec![
                "recent_anomaly_count".to_string(),
                "anomaly_rate_per_hour".to_string(),
                "anomaly_severity_score".to_string(),
                "time_since_last_anomaly".to_string(),
            ]);
        }
        
        if self.feature_config.include_time_features {
            names.extend(vec![
                "hour_of_day".to_string(),
                "day_of_week".to_string(),
                "is_weekend".to_string(),
                "is_business_hours".to_string(),
            ]);
        }
        
        if self.feature_config.include_network_features {
            names.extend(vec![
                "is_network_target".to_string(),
                "is_contract_target".to_string(),
            ]);
        }
        
        if self.feature_config.include_contract_features {
            names.extend(vec![
                "contract_address_length".to_string(),
                "is_verified_contract".to_string(),
            ]);
        }
        
        names.extend(self.feature_config.custom_features.clone());
        names
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::performance_metrics::PerformanceSnapshot;
    use crate::anomaly::{Anomaly, Severity, AnomalyType};
    
    #[test]
    fn test_feature_extraction_empty_data() {
        let extractor = FeatureExtractor::new();
        let req = ForecastReq::new("test".to_string(), ForecastHorizon::Short(300));
        
        let features = extractor.build_features(&req, &[], &[]);
        
        assert_eq!(features.features.get("mean_tps"), Some(&0.0));
        assert_eq!(features.features.get("mean_latency_ms"), Some(&0.0));
        assert_eq!(features.features.get("recent_anomaly_count"), Some(&0.0));
    }
    
    #[test]
    fn test_tps_features() {
        let extractor = FeatureExtractor::new();
        let req = ForecastReq::new("test".to_string(), ForecastHorizon::Short(300));
        
        let metrics = vec![
            PerformanceSnapshot::new("test".to_string(), 100, 50, 1000),
            PerformanceSnapshot::new("test".to_string(), 200, 60, 1100),
            PerformanceSnapshot::new("test".to_string(), 150, 55, 1050),
        ];
        
        let features = extractor.build_features(&req, &metrics, &[]);
        
        assert_eq!(features.features.get("mean_tps"), Some(&150.0));
        assert_eq!(features.features.get("max_tps"), Some(&200.0));
        assert_eq!(features.features.get("min_tps"), Some(&100.0));
    }
    
    #[test]
    fn test_anomaly_features() {
        let extractor = FeatureExtractor::new();
        let req = ForecastReq::new("test".to_string(), ForecastHorizon::Short(300));
        
        let anomalies = vec![
            Anomaly::new(
                AnomalyType::TransactionFlood,
                Severity::High,
                "Test anomaly".to_string(),
                "test".to_string(),
            ),
        ];
        
        let features = extractor.build_features(&req, &[], &anomalies);
        
        assert_eq!(features.features.get("recent_anomaly_count"), Some(&1.0));
        assert_eq!(features.features.get("anomaly_severity_score"), Some(&3.0));
    }
}