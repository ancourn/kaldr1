pub mod api;
pub mod auth;
pub mod service;
pub mod middleware;
pub mod metrics;
pub mod cache;
pub mod types;

pub use api::routes;
pub use auth::{AuthConfig, Claims, AuthenticatedUser, ensure_scope};
pub use metrics::DevAssistantMetrics;
pub use cache::DevAssistantCache;
pub use types::*;

use std::sync::Arc;
use crate::predictive::PredictiveAnalytics;
use crate::ai_runtime_core::AIRuntimeCore;
use crate::ai_auto_auditor::AIAutoAuditor;
use crate::anomaly_detection_engine::AnomalyDetectionEngine;

/// Main Dev Assistant API coordinator
pub struct DevAssistantAPI {
    predictive_analytics: Arc<PredictiveAnalytics>,
    ai_runtime_core: Arc<AIRuntimeCore>,
    ai_auto_auditor: Arc<AIAutoAuditor>,
    anomaly_engine: Arc<AnomalyDetectionEngine>,
    auth_config: Arc<AuthConfig>,
    metrics: Arc<DevAssistantMetrics>,
    cache: Arc<DevAssistantCache>,
}

impl DevAssistantAPI {
    pub async fn new(
        predictive_analytics: Arc<PredictiveAnalytics>,
        ai_runtime_core: Arc<AIRuntimeCore>,
        ai_auto_auditor: Arc<AIAutoAuditor>,
        anomaly_engine: Arc<AnomalyDetectionEngine>,
        auth_config: AuthConfig,
    ) -> Result<Self> {
        let metrics = Arc::new(DevAssistantMetrics::new());
        let cache = Arc::new(DevAssistantCache::new().await?);

        Ok(Self {
            predictive_analytics,
            ai_runtime_core,
            ai_auto_auditor,
            anomaly_engine,
            auth_config: Arc::new(auth_config),
            metrics,
            cache,
        })
    }

    /// Get the API router with all middleware
    pub fn router(&self) -> axum::Router {
        use axum::middleware;
        use axum::extract::Extension;

        let api_routes = routes()
            .layer(Extension(self.predictive_analytics.clone()))
            .layer(Extension(self.ai_runtime_core.clone()))
            .layer(Extension(self.ai_auto_auditor.clone()))
            .layer(Extension(self.anomaly_engine.clone()))
            .layer(Extension(self.auth_config.clone()))
            .layer(Extension(self.metrics.clone()))
            .layer(Extension(self.cache.clone()));

        // Apply middleware stack
        api_routes
            .layer(middleware::from_fn_with_state(
                self.auth_config.clone(),
                auth_middleware,
            ))
            .layer(middleware::from_fn_with_state(
                self.metrics.clone(),
                metrics_middleware,
            ))
            .layer(middleware::from_fn_with_state(
                self.cache.clone(),
                cache_middleware,
            ))
            .layer(middleware::from_fn(rate_limit_middleware))
    }

    /// Get metrics collector
    pub fn metrics(&self) -> &DevAssistantMetrics {
        &self.metrics
    }

    /// Get cache instance
    pub fn cache(&self) -> &DevAssistantCache {
        &self.cache
    }

    /// Start background services
    pub async fn start_background_services(&self) -> Result<()> {
        // Start cache cleanup task
        let cache = self.cache.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(300)); // 5 minutes
            loop {
                interval.tick().await;
                if let Err(e) = cache.cleanup().await {
                    tracing::warn!("Cache cleanup failed: {}", e);
                }
            }
        });

        // Start metrics export task
        let metrics = self.metrics.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60)); // 1 minute
            loop {
                interval.tick().await;
                if let Err(e) = metrics.export().await {
                    tracing::warn!("Metrics export failed: {}", e);
                }
            }
        });

        Ok(())
    }
}

/// Authentication middleware
async fn auth_middleware(
    auth_config: Arc<AuthConfig>,
    req: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, axum::http::StatusCode> {
    use axum::http::HeaderValue;
    use headers::Authorization;
    use headers::authorization::Bearer;

    // Skip auth for health checks and docs
    let path = req.uri().path();
    if path == "/health" || path.starts_with("/docs") || path.starts_with("/openapi") {
        return Ok(next.run(req).await);
    }

    // Extract Authorization header
    let auth_header = req.headers().get(axum::http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or(axum::http::StatusCode::UNAUTHORIZED)?;

    // Parse Bearer token
    let token = auth_header.strip_prefix("Bearer ")
        .ok_or(axum::http::StatusCode::UNAUTHORIZED)?;

    // Validate JWT token
    let claims = validate_jwt_token(token, &auth_config)
        .map_err(|_| axum::http::StatusCode::UNAUTHORIZED)?;

    // Add claims to request extensions for handlers
    let mut req = req;
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}

/// Metrics collection middleware
async fn metrics_middleware(
    metrics: Arc<DevAssistantMetrics>,
    req: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    let start_time = std::time::Instant::now();
    let method = req.method().clone();
    let path = req.uri().path().to_string();

    let response = next.run(req).await;

    let latency = start_time.elapsed().as_secs_f64();
    let status = response.status().as_u16();

    metrics.record_request(&method, &path, status, latency);

    response
}

/// Cache middleware
async fn cache_middleware(
    cache: Arc<DevAssistantCache>,
    mut req: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    let method = req.method().clone();
    let path = req.uri().path().to_string();

    // Only cache GET requests for now
    if method != axum::http::Method::GET {
        return next.run(req).await;
    }

    // Generate cache key
    let cache_key = generate_cache_key(&req);
    
    // Try to get from cache
    if let Some(cached_response) = cache.get(&cache_key).await {
        return cached_response;
    }

    // Process request
    let response = next.run(req).await;

    // Cache successful responses
    if response.status().is_success() {
        if let Ok(body) = axum::body::to_bytes(response.into_body(), 1024 * 1024).await {
            let cached_response = axum::response::Response::new(axum::body::Body::from(body.clone()));
            if let Err(e) = cache.set(&cache_key, &cached_response, 300).await {
                tracing::warn!("Failed to cache response: {}", e);
            }
            return axum::response::Response::new(axum::body::Body::from(body));
        }
    }

    response
}

/// Rate limiting middleware
async fn rate_limit_middleware(
    req: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, axum::http::StatusCode> {
    // Simple rate limiting by IP address
    let ip = req.headers()
        .get("x-forwarded-for")
        .or(req.headers().get("x-real-ip"))
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown");

    // Check rate limit (simplified - in production use a proper rate limiter)
    let key = format!("rate_limit:{}", ip);
    
    // This is a simplified version - in production, use a proper rate limiter like governor
    if check_rate_limit(&key).await {
        Ok(next.run(req).await)
    } else {
        Err(axum::http::StatusCode::TOO_MANY_REQUESTS)
    }
}

/// Validate JWT token
fn validate_jwt_token(token: &str, auth_config: &AuthConfig) -> Result<Claims, jsonwebtoken::errors::Error> {
    use jsonwebtoken::{decode, Algorithm, Validation};

    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_issuer(&auth_config.issuer.clone().into_iter().collect::<Vec<_>>());

    let token_data = decode::<Claims>(token, &auth_config.jwt_decoding_key, &validation)?;
    Ok(token_data.claims)
}

/// Generate cache key from request
fn generate_cache_key(req: &axum::extract::Request) -> String {
    format!("{}:{}", req.method(), req.uri())
}

/// Simple rate limit check (placeholder - use proper rate limiter in production)
async fn check_rate_limit(key: &str) -> bool {
    // This is a very basic implementation
    // In production, use something like governor or redis-based rate limiting
    static RATE_LIMITER: std::sync::OnceLock<std::collections::HashMap<String, (u64, std::time::Instant)>> = 
        std::sync::OnceLock::new();

    let mut limiter = RATE_LIMITER.get_or_init(std::collections::HashMap::new);
    
    let now = std::time::Instant::now();
    let window = std::time::Duration::from_secs(60); // 1 minute window
    let max_requests = 100; // max requests per window

    if let Some((count, timestamp)) = limiter.get(key) {
        if now.duration_since(*timestamp) < window {
            if *count < max_requests {
                *limiter.get_mut(key).unwrap() = (*count + 1, *timestamp);
                true
            } else {
                false
            }
        } else {
            limiter.insert(key.to_string(), (1, now));
            true
        }
    } else {
        limiter.insert(key.to_string(), (1, now));
        true
    }
}