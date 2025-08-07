//! Utility functions for the Mobile SDK

use std::time::Duration;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::{SDKResult, SDKError};

/// Retry utility with exponential backoff
pub async fn retry<T, F, Fut>(
    max_attempts: u32,
    initial_delay: Duration,
    mut operation: F,
) -> SDKResult<T>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = SDKResult<T>>,
{
    let mut delay = initial_delay;
    let mut last_error = None;

    for attempt in 1..=max_attempts {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                last_error = Some(e);
                
                if attempt < max_attempts {
                    tokio::time::sleep(delay).await;
                    delay = Duration::from_millis((delay.as_millis() * 2).min(30000) as u64);
                }
            }
        }
    }

    Err(last_error.unwrap_or_else(|| SDKError::Unknown("Retry failed".to_string())))
}

/// Rate limiter
pub struct RateLimiter {
    max_requests: u32,
    window_duration: Duration,
    requests: Vec<DateTime<Utc>>,
}

impl RateLimiter {
    /// Create new rate limiter
    pub fn new(max_requests: u32, window_duration: Duration) -> Self {
        Self {
            max_requests,
            window_duration,
            requests: Vec::new(),
        }
    }

    /// Check if request is allowed
    pub fn is_allowed(&mut self) -> bool {
        let now = Utc::now();
        
        // Remove old requests
        self.requests.retain(|&req| req + self.window_duration > now);
        
        // Check if we can make a new request
        if self.requests.len() < self.max_requests as usize {
            self.requests.push(now);
            true
        } else {
            false
        }
    }

    /// Get time until next allowed request
    pub fn time_until_next_allowed(&self) -> Option<Duration> {
        if self.requests.len() < self.max_requests as usize {
            return None;
        }
        
        let oldest_request = self.requests.first()?;
        let next_allowed = oldest_request + self.window_duration;
        let now = Utc::now();
        
        if next_allowed > now {
            Some(next_allowed - now)
        } else {
            None
        }
    }

    /// Reset rate limiter
    pub fn reset(&mut self) {
        self.requests.clear();
    }
}

/// Cache with TTL
pub struct Cache<K, V> {
    entries: std::collections::HashMap<K, CacheEntry<V>>,
    max_size: usize,
}

impl<K, V> Cache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    /// Create new cache
    pub fn new(max_size: usize) -> Self {
        Self {
            entries: std::collections::HashMap::new(),
            max_size,
        }
    }

    /// Insert value into cache
    pub fn insert(&mut self, key: K, value: V, ttl: Duration) {
        // Remove expired entries
        self.remove_expired();
        
        // Remove oldest entry if cache is full
        if self.entries.len() >= self.max_size {
            if let Some(oldest_key) = self.find_oldest_key() {
                self.entries.remove(&oldest_key);
            }
        }
        
        let expires_at = Utc::now() + chrono::Duration::from_std(ttl).unwrap();
        self.entries.insert(key, CacheEntry {
            value,
            expires_at,
        });
    }

    /// Get value from cache
    pub fn get(&mut self, key: &K) -> Option<V> {
        // Remove expired entries
        self.remove_expired();
        
        self.entries.get(key).map(|entry| entry.value.clone())
    }

    /// Check if key exists in cache
    pub fn contains_key(&mut self, key: &K) -> bool {
        // Remove expired entries
        self.remove_expired();
        
        self.entries.contains_key(key)
    }

    /// Remove key from cache
    pub fn remove(&mut self, key: &K) {
        self.entries.remove(key);
    }

    /// Clear cache
    pub fn clear(&mut self) {
        self.entries.clear();
    }

    /// Get cache size
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Check if cache is empty
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Remove expired entries
    fn remove_expired(&mut self) {
        let now = Utc::now();
        self.entries.retain(|_, entry| entry.expires_at > now);
    }

    /// Find oldest key
    fn find_oldest_key(&self) -> Option<K> {
        self.entries
            .iter()
            .min_by_key(|(_, entry)| entry.expires_at)
            .map(|(key, _)| key.clone())
    }
}

/// Cache entry
#[derive(Debug, Clone)]
struct CacheEntry<V> {
    value: V,
    expires_at: DateTime<Utc>,
}

/// Event bus for pub/sub communication
pub struct EventBus<T> {
    subscribers: Vec<Box<dyn Fn(&T) + Send + Sync>>,
}

impl<T> EventBus<T> {
    /// Create new event bus
    pub fn new() -> Self {
        Self {
            subscribers: Vec::new(),
        }
    }

    /// Subscribe to events
    pub fn subscribe<F>(&mut self, callback: F)
    where
        F: Fn(&T) + Send + Sync + 'static,
    {
        self.subscribers.push(Box::new(callback));
    }

    /// Publish event
    pub fn publish(&self, event: T) {
        for subscriber in &self.subscribers {
            subscriber(&event);
        }
    }

    /// Get subscriber count
    pub fn subscriber_count(&self) -> usize {
        self.subscribers.len()
    }
}

impl<T> Default for EventBus<T> {
    fn default() -> Self {
        Self::new()
    }
}

/// Logger utility
pub struct Logger {
    level: LogLevel,
    enable_console: bool,
    enable_file: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LogLevel {
    Error,
    Warn,
    Info,
    Debug,
    Trace,
}

impl Logger {
    /// Create new logger
    pub fn new(level: LogLevel, enable_console: bool, enable_file: Option<String>) -> Self {
        Self {
            level,
            enable_console,
            enable_file,
        }
    }

    /// Log error message
    pub fn error(&self, message: &str) {
        self.log(LogLevel::Error, message);
    }

    /// Log warning message
    pub fn warn(&self, message: &str) {
        self.log(LogLevel::Warn, message);
    }

    /// Log info message
    pub fn info(&self, message: &str) {
        self.log(LogLevel::Info, message);
    }

    /// Log debug message
    pub fn debug(&self, message: &str) {
        self.log(LogLevel::Debug, message);
    }

    /// Log trace message
    pub fn trace(&self, message: &str) {
        self.log(LogLevel::Trace, message);
    }

    /// Log message with level
    fn log(&self, level: LogLevel, message: &str) {
        if level <= self.level {
            let timestamp = Utc::now().to_rfc3339();
            let level_str = format!("{:?}", level);
            let formatted_message = format!("[{}] {}: {}", timestamp, level_str, message);

            // Log to console
            if self.enable_console {
                match level {
                    LogLevel::Error => eprintln!("{}", formatted_message),
                    LogLevel::Warn => eprintln!("{}", formatted_message),
                    LogLevel::Info => println!("{}", formatted_message),
                    LogLevel::Debug => println!("{}", formatted_message),
                    LogLevel::Trace => println!("{}", formatted_message),
                }
            }

            // Log to file
            if let Some(ref file_path) = self.enable_file {
                if let Err(e) = self.log_to_file(file_path, &formatted_message) {
                    eprintln!("Failed to log to file: {}", e);
                }
            }
        }
    }

    /// Log to file
    fn log_to_file(&self, file_path: &str, message: &str) -> std::io::Result<()> {
        use std::fs::OpenOptions;
        use std::io::Write;

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(file_path)?;

        writeln!(file, "{}", message)?;
        file.flush()
    }
}

/// Configuration loader
pub struct ConfigLoader;

impl ConfigLoader {
    /// Load configuration from file
    pub fn load_from_file<T>(path: &str) -> SDKResult<T>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let content = std::fs::read_to_string(path)
            .map_err(|e| SDKError::Config(e.to_string()))?;
        
        let config: T = serde_json::from_str(&content)
            .map_err(|e| SDKError::Config(e.to_string()))?;
        
        Ok(config)
    }

    /// Save configuration to file
    pub fn save_to_file<T>(path: &str, config: &T) -> SDKResult<()>
    where
        T: serde::Serialize,
    {
        let content = serde_json::to_string_pretty(config)
            .map_err(|e| SDKError::Config(e.to_string()))?;
        
        std::fs::write(path, content)
            .map_err(|e| SDKError::Config(e.to_string()))?;
        
        Ok(())
    }

    /// Load configuration from environment variables
    pub fn load_from_env<T>() -> SDKResult<T>
    where
        T: serde::Deserialize<'de>,
    {
        use config::Config;
        use config::Environment;

        let config = Config::builder()
            .add_source(Environment::default())
            .build()
            .map_err(|e| SDKError::Config(e.to_string()))?;

        config.try_deserialize()
            .map_err(|e| SDKError::Config(e.to_string()))
    }
}

/// Validator utility
pub struct Validator;

impl Validator {
    /// Validate email address
    pub fn validate_email(email: &str) -> bool {
        use regex::Regex;
        
        let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
            .unwrap();
        
        email_regex.is_match(email)
    }

    /// Validate URL
    pub fn validate_url(url: &str) -> bool {
        use regex::Regex;
        
        let url_regex = Regex::new(r"^https?://[^\s/$.?#].[^\s]*$")
            .unwrap();
        
        url_regex.is_match(url)
    }

    /// Validate phone number
    pub fn validate_phone(phone: &str) -> bool {
        use regex::Regex;
        
        let phone_regex = Regex::new(r"^\+?1?\d{9,15}$")
            .unwrap();
        
        phone_regex.is_match(phone)
    }

    /// Validate blockchain address
    pub fn validate_address(address: &str) -> bool {
        // Basic validation for blockchain addresses
        address.len() >= 26 && address.len() <= 35 && 
        address.chars().all(|c| c.is_ascii_alphanumeric())
    }

    /// Validate transaction hash
    pub fn validate_transaction_hash(hash: &str) -> bool {
        // Basic validation for transaction hash
        hash.len() == 64 && hash.chars().all(|c| c.is_ascii_hexdigit())
    }

    /// Validate amount
    pub fn validate_amount(amount: u64) -> bool {
        amount > 0 && amount <= u64::MAX
    }

    /// Validate mnemonic phrase
    pub fn validate_mnemonic(mnemonic: &str) -> bool {
        let words: Vec<&str> = mnemonic.split_whitespace().collect();
        words.len() >= 12 && words.len() <= 24 && words.len() % 3 == 0
    }
}

/// Utility functions
pub struct Utils;

impl Utils {
    /// Generate UUID
    pub fn generate_uuid() -> String {
        Uuid::new_v4().to_string()
    }

    /// Generate timestamp
    pub fn timestamp() -> u64 {
        Utc::now().timestamp() as u64
    }

    /// Format duration
    pub fn format_duration(duration: Duration) -> String {
        let seconds = duration.as_secs();
        let minutes = seconds / 60;
        let hours = minutes / 60;
        let days = hours / 24;

        if days > 0 {
            format!("{}d {}h {}m {}s", days, hours % 24, minutes % 60, seconds % 60)
        } else if hours > 0 {
            format!("{}h {}m {}s", hours, minutes % 60, seconds % 60)
        } else if minutes > 0 {
            format!("{}m {}s", minutes, seconds % 60)
        } else {
            format!("{}s", seconds)
        }
    }

    /// Format bytes
    pub fn format_bytes(bytes: u64) -> String {
        const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
        
        if bytes == 0 {
            return "0 B".to_string();
        }
        
        let bytes = bytes as f64;
        let base = 1024_f64;
        let i = (bytes.ln() / base.ln()).floor() as i32;
        let unit = UNITS[i as usize];
        let value = bytes / base.powi(i);
        
        if value >= 100.0 {
            format!("{:.0} {}", value, unit)
        } else if value >= 10.0 {
            format!("{:.1} {}", value, unit)
        } else {
            format!("{:.2} {}", value, unit)
        }
    }

    /// Parse duration from string
    pub fn parse_duration(duration_str: &str) -> SDKResult<Duration> {
        let parts: Vec<&str> = duration_str.split_whitespace().collect();
        let mut duration = Duration::from_secs(0);

        for i in (0..parts.len()).step_by(2) {
            if i + 1 >= parts.len() {
                return Err(SDKError::Validation("Invalid duration format".to_string()));
            }

            let value = parts[i].parse::<u64>()
                .map_err(|_| SDKError::Validation("Invalid duration value".to_string()))?;
            let unit = parts[i + 1];

            match unit {
                "s" | "sec" | "second" | "seconds" => {
                    duration += Duration::from_secs(value);
                },
                "m" | "min" | "minute" | "minutes" => {
                    duration += Duration::from_secs(value * 60);
                },
                "h" | "hour" | "hours" => {
                    duration += Duration::from_secs(value * 3600);
                },
                "d" | "day" | "days" => {
                    duration += Duration::from_secs(value * 86400);
                },
                _ => {
                    return Err(SDKError::Validation("Invalid duration unit".to_string()));
                },
            }
        }

        Ok(duration)
    }

    /// Sanitize string
    pub fn sanitize_string(input: &str) -> String {
        input
            .chars()
            .map(|c| match c {
                '<' => "&lt;",
                '>' => "&gt;",
                '&' => "&amp;",
                '"' => "&quot;",
                '\'' => "&#x27;",
                _ => c,
            })
            .collect()
    }

    /// Truncate string
    pub fn truncate_string(input: &str, max_length: usize) -> String {
        if input.len() <= max_length {
            input.to_string()
        } else {
            format!("{}...", &input[..max_length.saturating_sub(3)])
        }
    }

    /// Calculate percentage
    pub fn calculate_percentage(value: u64, total: u64) -> f64 {
        if total == 0 {
            0.0
        } else {
            (value as f64 / total as f64) * 100.0
        }
    }

    /// Calculate average
    pub fn calculate_average(values: &[u64]) -> f64 {
        if values.is_empty() {
            0.0
        } else {
            values.iter().sum::<u64>() as f64 / values.len() as f64
        }
    }

    /// Calculate median
    pub fn calculate_median(values: &mut [u64]) -> f64 {
        if values.is_empty() {
            0.0
        } else {
            values.sort();
            let mid = values.len() / 2;
            if values.len() % 2 == 0 {
                (values[mid - 1] + values[mid]) as f64 / 2.0
            } else {
                values[mid] as f64
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_retry_success() {
        let mut attempts = 0;
        let result = retry(3, Duration::from_millis(10), || async {
            attempts += 1;
            if attempts < 3 {
                Err(SDKError::Network("Temporary error".to_string()))
            } else {
                Ok("success".to_string())
            }
        }).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "success");
        assert_eq!(attempts, 3);
    }

    #[tokio::test]
    async fn test_retry_failure() {
        let result = retry(3, Duration::from_millis(10), || async {
            Err(SDKError::Network("Persistent error".to_string()))
        }).await;

        assert!(result.is_err());
    }

    #[test]
    fn test_rate_limiter() {
        let mut limiter = RateLimiter::new(2, Duration::from_secs(1));
        
        assert!(limiter.is_allowed());
        assert!(limiter.is_allowed());
        assert!(!limiter.is_allowed());
        
        // Wait for window to pass
        std::thread::sleep(Duration::from_secs(1));
        assert!(limiter.is_allowed());
    }

    #[test]
    fn test_cache() {
        let mut cache = Cache::new(2);
        
        cache.insert("key1".to_string(), "value1".to_string(), Duration::from_secs(1));
        cache.insert("key2".to_string(), "value2".to_string(), Duration::from_secs(1));
        
        assert_eq!(cache.get(&"key1"), Some("value1".to_string()));
        assert_eq!(cache.get(&"key2"), Some("value2".to_string()));
        
        // This should remove the oldest entry
        cache.insert("key3".to_string(), "value3".to_string(), Duration::from_secs(1));
        assert_eq!(cache.get(&"key1"), None);
        assert_eq!(cache.get(&"key3"), Some("value3".to_string()));
    }

    #[test]
    fn test_event_bus() {
        let mut event_bus = EventBus::<String>::new();
        let mut received = false;
        
        event_bus.subscribe(|event| {
            if event == "test" {
                received = true;
            }
        });
        
        event_bus.publish("test".to_string());
        assert!(received);
    }

    #[test]
    fn test_logger() {
        let logger = Logger::new(LogLevel::Info, false, None);
        
        logger.error("Error message");
        logger.warn("Warning message");
        logger.info("Info message");
        logger.debug("Debug message"); // Won't be logged due to level
    }

    #[test]
    fn test_validator() {
        assert!(Validator::validate_email("test@example.com"));
        assert!(!Validator::validate_email("invalid-email"));
        
        assert!(Validator::validate_url("https://example.com"));
        assert!(!Validator::validate_url("invalid-url"));
        
        assert!(Validator::validate_address("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"));
        assert!(!Validator::validate_address("invalid"));
    }

    #[test]
    fn test_utils() {
        assert!(!Utils::generate_uuid().is_empty());
        assert!(Utils::timestamp() > 0);
        
        let duration = Duration::from_secs(3661);
        assert_eq!(Utils::format_duration(duration), "1h 1m 1s");
        
        assert_eq!(Utils::format_bytes(1024), "1 KB");
        assert_eq!(Utils::format_bytes(1024 * 1024), "1 MB");
        
        let values = vec![1, 2, 3, 4, 5];
        assert_eq!(Utils::calculate_average(&values), 3.0);
        
        let mut values = vec![1, 2, 3, 4, 5];
        assert_eq!(Utils::calculate_median(&mut values), 3.0);
    }
}