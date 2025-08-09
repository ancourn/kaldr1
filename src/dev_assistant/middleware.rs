//! Middleware implementations for the Dev Assistant API

use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use std::time::Instant;
use tracing::{info, warn, error};
use crate::dev_assistant::auth::AuthenticatedUser;

/// Request logging middleware
pub async fn logging_middleware(
    request: Request,
    next: Next,
) -> Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    let start_time = Instant::now();
    
    // Extract user info if available
    let user_info = request.extensions().get::<AuthenticatedUser>()
        .map(|user| format!("user:{}", user.0.sub))
        .unwrap_or_else(|| "anonymous".to_string());
    
    info!("Request started: {} {} by {}", method, uri, user_info);
    
    let response = next.run(request).await;
    
    let latency = start_time.elapsed();
    let status = response.status();
    
    info!("Request completed: {} {} -> {} ({:.2?})", method, uri, status, latency);
    
    response
}

/// Request correlation ID middleware
pub async fn correlation_id_middleware(
    mut request: Request,
    next: Next,
) -> Response {
    use uuid::Uuid;
    
    // Generate or extract correlation ID
    let correlation_id = request.headers()
        .get("x-correlation-id")
        .and_then(|h| h.to_str().ok())
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    
    // Add to request headers for downstream services
    request.headers_mut().insert(
        "x-correlation-id",
        correlation_id.parse().unwrap(),
    );
    
    // Add to extensions for handlers
    request.extensions_mut().insert(correlation_id.clone());
    
    let response = next.run(request).await;
    
    // Add correlation ID to response headers
    response.headers_mut().insert(
        "x-correlation-id",
        correlation_id.parse().unwrap(),
    );
    
    response
}

/// User context middleware
pub async fn user_context_middleware(
    mut request: Request,
    next: Next,
) -> Response {
    if let Some(user) = request.extensions().get::<AuthenticatedUser>() {
        // Add user context to request for logging and auditing
        request.extensions_mut().insert(UserContext {
            user_id: user.0.sub.clone(),
            scopes: user.0.get_scopes(),
            timestamp: chrono::Utc::now(),
        });
    }
    
    next.run(request).await
}

/// Request validation middleware
pub async fn validation_middleware(
    request: Request,
    next: Next,
) -> Result<Response, Response> {
    // Validate request size
    if let Some(size) = request.headers().get("content-length") {
        if let Ok(size_str) = size.to_str() {
            if let Ok(size_num) = size_str.parse::<u64>() {
                if size_num > 10 * 1024 * 1024 { // 10MB limit
                    warn!("Request too large: {} bytes", size_num);
                    return Err(create_error_response(
                        axum::http::StatusCode::PAYLOAD_TOO_LARGE,
                        "Request payload too large",
                        "Maximum request size is 10MB",
                    ));
                }
            }
        }
    }
    
    // Validate content type for POST/PUT requests
    if request.method() == axum::http::Method::POST || request.method() == axum::http::Method::PUT {
        if let Some(content_type) = request.headers().get("content-type") {
            let content_type_str = content_type.to_str().unwrap_or("");
            
            if !content_type_str.contains("application/json") && 
               !content_type_str.contains("application/x-www-form-urlencoded") {
                warn!("Invalid content type: {}", content_type_str);
                return Err(create_error_response(
                    axum::http::StatusCode::UNSUPPORTED_MEDIA_TYPE,
                    "Unsupported media type",
                    "Content-Type must be application/json or application/x-www-form-urlencoded",
                ));
            }
        }
    }
    
    Ok(next.run(request).await)
}

/// Security headers middleware
pub async fn security_headers_middleware(
    request: Request,
    next: Next,
) -> Response {
    let response = next.run(request).await;
    
    let mut response = response;
    
    // Add security headers
    response.headers_mut().insert(
        "X-Content-Type-Options",
        "nosniff".parse().unwrap(),
    );
    
    response.headers_mut().insert(
        "X-Frame-Options",
        "DENY".parse().unwrap(),
    );
    
    response.headers_mut().insert(
        "X-XSS-Protection",
        "1; mode=block".parse().unwrap(),
    );
    
    response.headers_mut().insert(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains".parse().unwrap(),
    );
    
    response.headers_mut().insert(
        "Content-Security-Policy",
        "default-src 'self'".parse().unwrap(),
    );
    
    // Remove potentially sensitive headers
    response.headers_mut().remove("server");
    response.headers_mut().remove("x-powered-by");
    
    response
}

/// CORS middleware
pub async fn cors_middleware(
    request: Request,
    next: Next,
) -> Response {
    let response = next.run(request).await;
    
    let mut response = response;
    
    // Add CORS headers
    response.headers_mut().insert(
        "Access-Control-Allow-Origin",
        "*".parse().unwrap(),
    );
    
    response.headers_mut().insert(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS".parse().unwrap(),
    );
    
    response.headers_mut().insert(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With".parse().unwrap(),
    );
    
    response.headers_mut().insert(
        "Access-Control-Max-Age",
        "86400".parse().unwrap(),
    );
    
    // Handle preflight requests
    if request.method() == axum::http::Method::OPTIONS {
        *response.status_mut() = axum::http::StatusCode::NO_CONTENT;
    }
    
    response
}

/// Rate limiting middleware state
#[derive(Clone)]
pub struct RateLimitState {
    pub limiter: Arc<std::sync::RwLock<std::collections::HashMap<String, RateLimitInfo>>>,
}

#[derive(Debug, Clone)]
pub struct RateLimitInfo {
    pub count: u32,
    pub reset_time: std::time::Instant,
    pub window_size: std::time::Duration,
}

impl RateLimitState {
    pub fn new() -> Self {
        Self {
            limiter: Arc::new(std::sync::RwLock::new(std::collections::HashMap::new())),
        }
    }
}

/// Rate limiting middleware
pub async fn rate_limit_middleware(
    State(state): State<RateLimitState>,
    request: Request,
    next: Next,
) -> Result<Response, Response> {
    // Extract client identifier (IP address or user ID)
    let client_id = extract_client_id(&request);
    
    // Check rate limit
    if let Err(response) = check_rate_limit(&state, &client_id, 100, 60) {
        return Err(response);
    }
    
    Ok(next.run(request).await)
}

/// Extract client identifier for rate limiting
fn extract_client_id(request: &Request) -> String {
    // Try to get user ID first
    if let Some(user) = request.extensions().get::<AuthenticatedUser>() {
        return format!("user:{}", user.0.sub);
    }
    
    // Fall back to IP address
    request.headers()
        .get("x-forwarded-for")
        .or(request.headers().get("x-real-ip"))
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown")
        .to_string()
}

/// Check rate limit for a client
fn check_rate_limit(
    state: &RateLimitState,
    client_id: &str,
    max_requests: u32,
    window_seconds: u64,
) -> Result<(), Response> {
    let now = std::time::Instant::now();
    let window_size = std::time::Duration::from_secs(window_seconds);
    
    let mut limiter = state.limiter.write().unwrap();
    
    let info = limiter.entry(client_id.to_string()).or_insert(RateLimitInfo {
        count: 0,
        reset_time: now + window_size,
        window_size,
    });
    
    // Reset window if expired
    if now > info.reset_time {
        info.count = 0;
        info.reset_time = now + window_size;
    }
    
    // Check limit
    if info.count >= max_requests {
        let remaining_time = info.reset_time.duration_since(now).as_secs();
        warn!("Rate limit exceeded for client: {}", client_id);
        
        return Err(create_error_response(
            axum::http::StatusCode::TOO_MANY_REQUESTS,
            "Rate limit exceeded",
            &format!("Try again in {} seconds", remaining_time),
        ));
    }
    
    // Increment counter
    info.count += 1;
    
    Ok(())
}

/// User context for logging and auditing
#[derive(Debug, Clone)]
pub struct UserContext {
    pub user_id: String,
    pub scopes: Vec<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Create an error response
fn create_error_response(
    status: axum::http::StatusCode,
    error_type: &str,
    message: &str,
) -> Response {
    use crate::dev_assistant::types::ErrorResponse;
    
    let error_response = ErrorResponse::new(error_type.to_string(), message.to_string());
    
    Response::builder()
        .status(status)
        .header("content-type", "application/json")
        .body(axum::body::Body::from(
            serde_json::to_string(&error_response).unwrap()
        ))
        .unwrap()
}

/// Middleware stack builder
pub struct MiddlewareStack {
    stack: Vec<Box<dyn MiddlewareFn>>,
}

type MiddlewareFn = dyn Fn(Request) -> BoxFuture<'static, Result<Response, Response>> + Send + Sync;
type BoxFuture<'a, T> = std::future::Future<Output = T> + Send + 'a;

impl MiddlewareStack {
    pub fn new() -> Self {
        Self {
            stack: Vec::new(),
        }
    }
    
    pub fn add<F>(mut self, middleware: F) -> Self
    where
        F: Fn(Request) -> BoxFuture<'static, Result<Response, Response>> + Send + Sync + 'static,
    {
        self.stack.push(Box::new(middleware));
        self
    }
    
    pub async fn apply(&self, request: Request) -> Result<Response, Response> {
        let mut current_request = request;
        
        for middleware in &self.stack {
            match middleware(current_request).await {
                Ok(response) => return Ok(response),
                Err(response) => return Err(response),
            }
        }
        
        // If no middleware returned a response, continue to the handler
        Ok(current_request)
    }
}

impl Default for MiddlewareStack {
    fn default() -> Self {
        Self::new()
    }
}

/// Create default middleware stack
pub fn create_default_middleware_stack() -> MiddlewareStack {
    MiddlewareStack::new()
        .add(|request| Box::pin(async move { Ok(correlation_id_middleware(request, Next::new()).await) }))
        .add(|request| Box::pin(async move { validation_middleware(request, Next::new()).await }))
        .add(|request| Box::pin(async move { Ok(logging_middleware(request, Next::new()).await) }))
        .add(|request| Box::pin(async move { Ok(user_context_middleware(request, Next::new()).await) }))
        .add(|request| Box::pin(async move { Ok(security_headers_middleware(request, Next::new()).await) }))
        .add(|request| Box::pin(async move { Ok(cors_middleware(request, Next::new()).await) }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    
    #[tokio::test]
    async fn test_correlation_id_middleware() {
        let request = Request::builder()
            .uri("/test")
            .body(axum::body::Body::empty())
            .unwrap();
        
        let response = correlation_id_middleware(request, Next::new()).await;
        
        assert!(response.headers().contains_key("x-correlation-id"));
    }

    #[tokio::test]
    async fn test_validation_middleware() {
        // Test valid request
        let request = Request::builder()
            .method(axum::http::Method::POST)
            .uri("/test")
            .header("content-type", "application/json")
            .header("content-length", "100")
            .body(axum::body::Body::empty())
            .unwrap();
        
        let result = validation_middleware(request, Next::new()).await;
        assert!(result.is_ok());
        
        // Test request too large
        let request = Request::builder()
            .method(axum::http::Method::POST)
            .uri("/test")
            .header("content-length", "20000000") // 20MB
            .body(axum::body::Body::empty())
            .unwrap();
        
        let result = validation_middleware(request, Next::new()).await;
        assert!(result.is_err());
        
        if let Err(response) = result {
            assert_eq!(response.status(), StatusCode::PAYLOAD_TOO_LARGE);
        }
    }

    #[tokio::test]
    async fn test_security_headers_middleware() {
        let request = Request::builder()
            .uri("/test")
            .body(axum::body::Body::empty())
            .unwrap();
        
        let response = security_headers_middleware(request, Next::new()).await;
        
        assert!(response.headers().contains_key("x-content-type-options"));
        assert!(response.headers().contains_key("x-frame-options"));
        assert!(response.headers().contains_key("x-xss-protection"));
        assert!(response.headers().contains_key("strict-transport-security"));
    }

    #[tokio::test]
    async fn test_cors_middleware() {
        let request = Request::builder()
            .method(axum::http::Method::GET)
            .uri("/test")
            .body(axum::body::Body::empty())
            .unwrap();
        
        let response = cors_middleware(request, Next::new()).await;
        
        assert!(response.headers().contains_key("access-control-allow-origin"));
        assert!(response.headers().contains_key("access-control-allow-methods"));
        assert!(response.headers().contains_key("access-control-allow-headers"));
    }

    #[tokio::test]
    async fn test_rate_limiting() {
        let state = RateLimitState::new();
        
        // Test within limit
        let request = Request::builder()
            .uri("/test")
            .body(axum::body::Body::empty())
            .unwrap();
        
        for _ in 0..10 {
            let result = check_rate_limit(&state, "test_client", 10, 60);
            assert!(result.is_ok());
        }
        
        // Test exceeding limit
        let result = check_rate_limit(&state, "test_client", 10, 60);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_middleware_stack() {
        let stack = create_default_middleware_stack();
        
        let request = Request::builder()
            .method(axum::http::Method::GET)
            .uri("/test")
            .body(axum::body::Body::empty())
            .unwrap();
        
        let result = stack.apply(request).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_error_response_creation() {
        let response = create_error_response(
            StatusCode::BAD_REQUEST,
            "validation_error",
            "Invalid request data",
        );
        
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(response.headers().get("content-type").unwrap(), "application/json");
    }
}