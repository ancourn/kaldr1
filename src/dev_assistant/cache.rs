use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{Duration, Instant};
use anyhow::Result;
use serde::{Deserialize, Serialize};

/// Cache configuration
#[derive(Debug, Clone)]
pub struct CacheConfig {
    pub default_ttl_seconds: u64,
    pub max_entries: usize,
    pub cleanup_interval_seconds: u64,
    pub enable_compression: bool,
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            default_ttl_seconds: 300, // 5 minutes
            max_entries: 10000,
            cleanup_interval_seconds: 60, // 1 minute
            enable_compression: false,
        }
    }
}

/// Cache entry with metadata
#[derive(Debug, Clone)]
pub struct CacheEntry {
    pub data: Vec<u8>,
    pub created_at: Instant,
    pub ttl: Duration,
    pub access_count: u64,
    pub last_accessed: Instant,
    pub content_type: String,
    pub size_bytes: usize,
}

impl CacheEntry {
    pub fn new(data: Vec<u8>, ttl_seconds: u64, content_type: String) -> Self {
        let now = Instant::now();
        Self {
            data,
            created_at: now,
            ttl: Duration::from_secs(ttl_seconds),
            access_count: 0,
            last_accessed: now,
            content_type,
            size_bytes: 0, // Will be set below
        }
    }

    pub fn is_expired(&self) -> bool {
        self.created_at.elapsed() > self.ttl
    }

    pub fn time_to_live(&self) -> Duration {
        self.ttl.saturating_sub(self.created_at.elapsed())
    }

    pub fn record_access(&mut self) {
        self.access_count += 1;
        self.last_accessed = Instant::now();
    }

    pub fn hit_rate(&self) -> f64 {
        if self.access_count == 0 {
            0.0
        } else {
            1.0 // Simple hit rate for now
        }
    }
}

/// Cache statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_entries: usize,
    pub expired_entries: usize,
    pub hits: u64,
    pub misses: u64,
    pub evictions: u64,
    pub total_size_bytes: usize,
    pub compression_ratio: f64,
}

/// In-memory cache for Dev Assistant API
pub struct DevAssistantCache {
    entries: Arc<RwLock<HashMap<String, CacheEntry>>>,
    config: CacheConfig,
    stats: Arc<RwLock<CacheStats>>,
    cleanup_task: Option<tokio::task::JoinHandle<()>>,
}

impl DevAssistantCache {
    pub fn new() -> Self {
        Self::with_config(CacheConfig::default())
    }

    pub fn with_config(config: CacheConfig) -> Self {
        let cache = Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            config,
            stats: Arc::new(RwLock::new(CacheStats::default())),
            cleanup_task: None,
        };

        // Start cleanup task
        cache.start_cleanup_task();

        cache
    }

    /// Get a value from the cache
    pub async fn get(&self, key: &str) -> Option<axum::response::Response> {
        let mut entries = self.entries.write().await;
        
        if let Some(entry) = entries.get_mut(key) {
            if entry.is_expired() {
                entries.remove(key);
                let mut stats = self.stats.write().await;
                stats.expired_entries += 1;
                return None;
            }
            
            entry.record_access();
            
            // Update stats
            let mut stats = self.stats.write().await;
            stats.hits += 1;
            
            // Convert back to HTTP response
            match self.deserialize_response(&entry.data) {
                Ok(response) => Some(response),
                Err(e) => {
                    tracing::warn!("Failed to deserialize cached response: {}", e);
                    entries.remove(key);
                    None
                }
            }
        } else {
            let mut stats = self.stats.write().await;
            stats.misses += 1;
            None
        }
    }

    /// Set a value in the cache
    pub async fn set(&self, key: &str, response: &axum::response::Response, ttl_seconds: u64) -> Result<()> {
        let data = self.serialize_response(response)?;
        let content_type = self.extract_content_type(response);
        
        let entry = CacheEntry::new(
            data,
            ttl_seconds,
            content_type,
        );

        let mut entries = self.entries.write().await;
        
        // Check if we need to evict entries
        if entries.len() >= self.config.max_entries {
            self.evict_entries(&mut entries).await;
        }
        
        entries.insert(key.to_string(), entry);
        
        // Update stats
        let mut stats = self.stats.write().await;
        stats.total_entries = entries.len();
        stats.total_size_bytes = entries.values()
            .map(|e| e.data.len())
            .sum();
        
        Ok(())
    }

    /// Remove a value from the cache
    pub async fn remove(&self, key: &str) -> bool {
        let mut entries = self.entries.write().await;
        let removed = entries.remove(key).is_some();
        
        if removed {
            let mut stats = self.stats.write().await;
            stats.total_entries = entries.len();
            stats.total_size_bytes = entries.values()
                .map(|e| e.data.len())
                .sum();
        }
        
        removed
    }

    /// Check if a key exists in the cache
    pub async fn contains(&self, key: &str) -> bool {
        let entries = self.entries.read().await;
        entries.get(key).map_or(false, |entry| !entry.is_expired())
    }

    /// Get cache statistics
    pub async fn get_stats(&self) -> CacheStats {
        let stats = self.stats.read().await;
        stats.clone()
    }

    /// Get all keys in the cache
    pub async fn keys(&self) -> Vec<String> {
        let entries = self.entries.read().await;
        entries.keys().cloned().collect()
    }

    /// Clear the entire cache
    pub async fn clear(&self) -> Result<()> {
        let mut entries = self.entries.write().await;
        let count = entries.len();
        entries.clear();
        
        let mut stats = self.stats.write().await;
        stats.total_entries = 0;
        stats.total_size_bytes = 0;
        stats.evictions += count as u64;
        
        Ok(())
    }

    /// Clean up expired entries
    pub async fn cleanup(&self) -> Result<usize> {
        let mut entries = self.entries.write().await;
        let initial_count = entries.len();
        
        entries.retain(|_, entry| !entry.is_expired());
        
        let cleaned_count = initial_count - entries.len();
        
        if cleaned_count > 0 {
            let mut stats = self.stats.write().await;
            stats.expired_entries += cleaned_count as u64;
            stats.total_entries = entries.len();
            stats.total_size_bytes = entries.values()
                .map(|e| e.data.len())
                .sum();
        }
        
        Ok(cleaned_count)
    }

    /// Evict entries based on LRU policy
    async fn evict_entries(&self, entries: &mut HashMap<String, CacheEntry>) {
        let to_evict = (entries.len() as f64 * 0.1) as usize; // Evict 10% of entries
        
        let mut entries_vec: Vec<_> = entries.iter_mut().collect();
        entries_vec.sort_by_key(|(_, entry)| entry.last_accessed);
        
        for (key, _) in entries_vec.iter().take(to_evict) {
            entries.remove(key.as_str());
        }
        
        let mut stats = self.stats.write().await;
        stats.evictions += to_evict as u64;
    }

    /// Start the background cleanup task
    fn start_cleanup_task(&self) {
        let entries = self.entries.clone();
        let stats = self.stats.clone();
        let cleanup_interval = Duration::from_secs(self.config.cleanup_interval_seconds);
        
        let task = tokio::spawn(async move {
            let mut interval = tokio::time::interval(cleanup_interval);
            
            loop {
                interval.tick().await;
                
                let mut entries = entries.write().await;
                let initial_count = entries.len();
                
                entries.retain(|_, entry| !entry.is_expired());
                
                let cleaned_count = initial_count - entries.len();
                
                if cleaned_count > 0 {
                    let mut stats = stats.write().await;
                    stats.expired_entries += cleaned_count as u64;
                    stats.total_entries = entries.len();
                    stats.total_size_bytes = entries.values()
                        .map(|e| e.data.len())
                        .sum();
                }
            }
        });
        
        // Note: In a real implementation, we'd store this handle for cleanup
        // For now, we'll let it run in the background
    }

    /// Serialize HTTP response to bytes
    fn serialize_response(&self, response: &axum::response::Response) -> Result<Vec<u8>> {
        // This is a simplified implementation
        // In a real application, you'd want to properly serialize the response
        let response_info = ResponseInfo {
            status: response.status().as_u16(),
            headers: self.extract_headers(response),
            body: self.extract_body(response).await?,
        };
        
        Ok(bincode::serialize(&response_info)?)
    }

    /// Deserialize bytes back to HTTP response
    fn deserialize_response(&self, data: &[u8]) -> Result<axum::response::Response> {
        let response_info: ResponseInfo = bincode::deserialize(data)?;
        
        let mut builder = axum::http::Response::builder()
            .status(response_info.status);
        
        // Add headers
        for (name, value) in response_info.headers {
            builder = builder.header(name, value);
        }
        
        let response = builder.body(axum::body::Body::from(response_info.body))?;
        Ok(response)
    }

    /// Extract headers from HTTP response
    fn extract_headers(&self, response: &axum::response::Response) -> Vec<(String, String)> {
        response.headers()
            .iter()
            .map(|(name, value)| {
                (
                    name.as_str().to_string(),
                    value.to_str().unwrap_or("").to_string(),
                )
            })
            .collect()
    }

    /// Extract content type from HTTP response
    fn extract_content_type(&self, response: &axum::response::Response) -> String {
        response
            .headers()
            .get(axum::http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("application/octet-stream")
            .to_string()
    }

    /// Extract body from HTTP response
    async fn extract_body(&self, response: &axum::response::Response) -> Result<Vec<u8>> {
        use axum::body::Body;
        use http_body_util::BodyExt;
        
        let body = response.body();
        let bytes = body.collect().await?.to_bytes();
        Ok(bytes.to_vec())
    }
}

impl Drop for DevAssistantCache {
    fn drop(&mut self) {
        // Abort the cleanup task if it exists
        if let Some(task) = self.cleanup_task.take() {
            task.abort();
        }
    }
}

/// Response information for serialization
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ResponseInfo {
    status: u16,
    headers: Vec<(String, String)>,
    body: Vec<u8>,
}

/// Cache key generator
pub struct CacheKeyGenerator;

impl CacheKeyGenerator {
    /// Generate a cache key for HTTP requests
    pub fn for_request(method: &axum::http::Method, uri: &axum::http::Uri, body: &[u8]) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        method.as_str().hash(&mut hasher);
        uri.to_string().hash(&mut hasher);
        body.hash(&mut hasher);
        
        format!("req:{:016x}", hasher.finish())
    }

    /// Generate a cache key for query requests
    pub fn for_query(target: &str, question: &str, context: &Option<HashMap<String, serde_json::Value>>) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        target.hash(&mut hasher);
        question.hash(&mut hasher);
        
        if let Some(ctx) = context {
            for (key, value) in ctx {
                key.hash(&mut hasher);
                value.to_string().hash(&mut hasher);
            }
        }
        
        format!("query:{:016x}", hasher.finish())
    }

    /// Generate a cache key for prediction requests
    pub fn for_prediction(target: &str, horizon: &serde_json::Value) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        target.hash(&mut hasher);
        horizon.to_string().hash(&mut hasher);
        
        format!("predict:{:016x}", hasher.finish())
    }

    /// Generate a cache key for analysis requests
    pub fn for_analysis(target: &str, analysis_type: &str, depth: &str) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        target.hash(&mut hasher);
        analysis_type.hash(&mut hasher);
        depth.hash(&mut hasher);
        
        format!("analysis:{:016x}", hasher.finish())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use axum::response::Response;

    #[tokio::test]
    async fn test_cache_basic_operations() {
        let cache = DevAssistantCache::new();
        
        // Test cache miss
        assert!(cache.get("test_key").await.is_none());
        
        // Create a test response
        let response = Response::builder()
            .status(StatusCode::OK)
            .header("content-type", "application/json")
            .body(axum::body::Body::from(r#"{"test": "value"}"#))
            .unwrap();
        
        // Test cache set
        cache.set("test_key", &response, 300).await.unwrap();
        
        // Test cache hit
        let cached_response = cache.get("test_key").await;
        assert!(cached_response.is_some());
        
        // Verify response
        let cached_response = cached_response.unwrap();
        assert_eq!(cached_response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_cache_expiry() {
        let cache = DevAssistantCache::with_config(CacheConfig {
            default_ttl_seconds: 1, // 1 second TTL
            ..Default::default()
        });
        
        let response = Response::builder()
            .status(StatusCode::OK)
            .body(axum::body::Body::from("test"))
            .unwrap();
        
        cache.set("test_key", &response, 1).await.unwrap();
        
        // Should be available immediately
        assert!(cache.get("test_key").await.is_some());
        
        // Wait for expiry
        tokio::time::sleep(Duration::from_secs(2)).await;
        
        // Should be expired now
        assert!(cache.get("test_key").await.is_none());
    }

    #[tokio::test]
    async fn test_cache_stats() {
        let cache = DevAssistantCache::new();
        
        let response = Response::builder()
            .status(StatusCode::OK)
            .body(axum::body::Body::from("test"))
            .unwrap();
        
        // Initial stats
        let stats = cache.get_stats().await;
        assert_eq!(stats.hits, 0);
        assert_eq!(stats.misses, 0);
        
        // Cache miss
        cache.get("nonexistent").await;
        let stats = cache.get_stats().await;
        assert_eq!(stats.hits, 0);
        assert_eq!(stats.misses, 1);
        
        // Cache set and hit
        cache.set("test_key", &response, 300).await.unwrap();
        cache.get("test_key").await;
        let stats = cache.get_stats().await;
        assert_eq!(stats.hits, 1);
        assert_eq!(stats.misses, 1);
    }

    #[tokio::test]
    async fn test_cache_cleanup() {
        let cache = DevAssistantCache::with_config(CacheConfig {
            default_ttl_seconds: 1,
            cleanup_interval_seconds: 1,
            ..Default::default()
        });
        
        let response = Response::builder()
            .status(StatusCode::OK)
            .body(axum::body::Body::from("test"))
            .unwrap();
        
        // Add multiple entries
        for i in 0..10 {
            cache.set(&format!("key_{}", i), &response, 1).await.unwrap();
        }
        
        // Verify entries exist
        let keys = cache.keys().await;
        assert_eq!(keys.len(), 10);
        
        // Wait for cleanup
        tokio::time::sleep(Duration::from_secs(2)).await;
        
        // Manually trigger cleanup
        let cleaned = cache.cleanup().await.unwrap();
        assert!(cleaned > 0);
        
        // Verify entries are cleaned up
        let keys = cache.keys().await;
        assert_eq!(keys.len(), 0);
    }

    #[tokio::test]
    async fn test_cache_key_generator() {
        // Test request key generation
        let key1 = CacheKeyGenerator::for_request(
            &axum::http::Method::GET,
            &"/api/test".parse().unwrap(),
            b"body",
        );
        
        let key2 = CacheKeyGenerator::for_request(
            &axum::http::Method::POST,
            &"/api/test".parse().unwrap(),
            b"body",
        );
        
        assert_ne!(key1, key2);
        
        // Test query key generation
        let query_key = CacheKeyGenerator::for_query(
            "contract:0x123",
            "Is this vulnerable?",
            &None,
        );
        
        assert!(query_key.starts_with("query:"));
        
        // Test prediction key generation
        let pred_key = CacheKeyGenerator::for_prediction(
            "network:mainnet",
            &serde_json::json!({"Short": 300}),
        );
        
        assert!(pred_key.starts_with("predict:"));
    }

    #[tokio::test]
    async fn test_cache_remove() {
        let cache = DevAssistantCache::new();
        
        let response = Response::builder()
            .status(StatusCode::OK)
            .body(axum::body::Body::from("test"))
            .unwrap();
        
        cache.set("test_key", &response, 300).await.unwrap();
        assert!(cache.contains("test_key").await);
        
        let removed = cache.remove("test_key").await;
        assert!(removed);
        assert!(!cache.contains("test_key").await);
        
        // Remove non-existent key
        let removed = cache.remove("nonexistent").await;
        assert!(!removed);
    }

    #[tokio::test]
    async fn test_cache_clear() {
        let cache = DevAssistantCache::new();
        
        let response = Response::builder()
            .status(StatusCode::OK)
            .body(axum::body::Body::from("test"))
            .unwrap();
        
        // Add multiple entries
        for i in 0..5 {
            cache.set(&format!("key_{}", i), &response, 300).await.unwrap();
        }
        
        assert_eq!(cache.keys().await.len(), 5);
        
        cache.clear().await.unwrap();
        
        assert_eq!(cache.keys().await.len(), 0);
    }
}