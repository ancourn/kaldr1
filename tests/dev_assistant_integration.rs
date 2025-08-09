use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt; // for `.oneshot()`
use std::sync::Arc;
use crate::dev_assistant::{DevAssistantAPI, AuthConfig};
use crate::predictive::{PredictiveAnalytics, types::PredictorConfig};
use crate::ai_runtime_core::AIRuntimeCore;
use crate::ai_auto_auditor::AIAutoAuditor;
use crate::anomaly_detection_engine::AnomalyDetectionEngine;
use crate::ai_models::ModelHandle;

// Mock implementations for testing
struct MockModel;
#[async_trait::async_trait]
impl crate::ai_models::ModelHandleTrait for MockModel {
    async fn predict(&self, _features: &std::collections::HashMap<String,f64>) -> anyhow::Result<(f64,f32)> {
        Ok((0.42, 0.99))
    }
}

#[tokio::test]
async fn test_health_check() {
    let app = create_test_app().await;
    
    let req = Request::builder()
        .uri("/health")
        .method("GET")
        .body(Body::empty())
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_predict_endpoint() {
    let app = create_test_app().await;
    
    let payload = serde_json::json!({
        "req": {
            "target": "network:mainnet",
            "horizon": { "Short": 60 }
        }
    });
    
    let req = Request::builder()
        .uri("/v1/dev-assistant/predict")
        .method("POST")
        .header("content-type", "application/json")
        .header("authorization", "Bearer valid_token")
        .body(Body::from(payload.to_string()))
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_query_endpoint() {
    let app = create_test_app().await;
    
    let payload = serde_json::json!({
        "question": "Is this contract vulnerable?",
        "target": "contract:0x123"
    });
    
    let req = Request::builder()
        .uri("/v1/dev-assistant/query")
        .method("POST")
        .header("content-type", "application/json")
        .header("authorization", "Bearer valid_token")
        .body(Body::from(payload.to_string()))
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_analyze_endpoint() {
    let app = create_test_app().await;
    
    let payload = serde_json::json!({
        "target": "contract:0x123",
        "depth": "standard",
        "analysis_type": "hybrid"
    });
    
    let req = Request::builder()
        .uri("/v1/dev-assistant/analyze")
        .method("POST")
        .header("content-type", "application/json")
        .header("authorization", "Bearer valid_token")
        .body(Body::from(payload.to_string()))
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::ACCEPTED); // 202 Accepted
}

#[tokio::test]
async fn test_anomaly_query_endpoint() {
    let app = create_test_app().await;
    
    let req = Request::builder()
        .uri("/v1/dev-assistant/anomaly?target=network:mainnet")
        .method("GET")
        .header("authorization", "Bearer valid_token")
        .body(Body::empty())
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_unauthorized_request() {
    let app = create_test_app().await;
    
    let req = Request::builder()
        .uri("/v1/dev-assistant/predict")
        .method("POST")
        .body(Body::empty())
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_forbidden_request() {
    let app = create_test_app().await;
    
    let payload = serde_json::json!({
        "req": {
            "target": "network:mainnet",
            "horizon": { "Short": 60 }
        }
    });
    
    // Use a token without the required scope
    let req = Request::builder()
        .uri("/v1/dev-assistant/predict")
        .method("POST")
        .header("content-type", "application/json")
        .header("authorization", "Bearer invalid_scope_token")
        .body(Body::from(payload.to_string()))
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn test_rate_limiting() {
    let app = create_test_app().await;
    
    let payload = serde_json::json!({
        "req": {
            "target": "network:mainnet",
            "horizon": { "Short": 60 }
        }
    });
    
    // Make many requests to trigger rate limiting
    for i in 0..150 {
        let req = Request::builder()
            .uri("/v1/dev-assistant/predict")
            .method("POST")
            .header("content-type", "application/json")
            .header("authorization", "Bearer valid_token")
            .body(Body::from(payload.to_string()))
            .unwrap();
        
        let resp = app.oneshot(req).await.unwrap();
        
        // After a certain number of requests, we should get rate limited
        if i > 100 {
            if resp.status() == StatusCode::TOO_MANY_REQUESTS {
                return; // Test passed
            }
        }
    }
    
    panic!("Rate limiting was not triggered");
}

#[tokio::test]
async fn test_invalid_content_type() {
    let app = create_test_app().await;
    
    let req = Request::builder()
        .uri("/v1/dev-assistant/predict")
        .method("POST")
        .header("content-type", "text/plain")
        .header("authorization", "Bearer valid_token")
        .body(Body::from("invalid content"))
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::UNSUPPORTED_MEDIA_TYPE);
}

#[tokio::test]
async fn test_payload_too_large() {
    let app = create_test_app().await;
    
    let large_payload = "a".repeat(11 * 1024 * 1024); // 11MB
    
    let req = Request::builder()
        .uri("/v1/dev-assistant/predict")
        .method("POST")
        .header("content-type", "application/json")
        .header("content-length", large_payload.len())
        .header("authorization", "Bearer valid_token")
        .body(Body::from(large_payload))
        .unwrap();
    
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::PAYLOAD_TOO_LARGE);
}

// Helper function to create test app
async fn create_test_app() -> axum::Router {
    // Create mock dependencies
    let predictor_config = PredictorConfig::new("test_model".to_string());
    let mock_model = ModelHandle::from_trait_obj(Box::new(MockModel));
    let predictive_analytics = Arc::new(PredictiveAnalytics::new(predictor_config).await.unwrap());
    
    let ai_runtime_core = Arc::new(AIRuntimeCore::new().await.unwrap());
    let ai_auto_auditor = Arc::new(AIAutoAuditor::new().await.unwrap());
    let anomaly_engine = Arc::new(AnomalyDetectionEngine::new().await.unwrap());
    
    // Create auth config with test secret
    let secret = b"test_secret_key_for_dev_assistant_testing_purposes_only";
    let auth_config = AuthConfig::new(
        secret,
        secret,
        "test_issuer".to_string(),
        "test_audience".to_string(),
        24,
    ).unwrap();
    
    // Create Dev Assistant API
    let dev_assistant = DevAssistantAPI::new(
        predictive_analytics,
        ai_runtime_core,
        ai_auto_auditor,
        anomaly_engine,
        auth_config,
    ).await.unwrap();
    
    // Create router
    dev_assistant.router()
}

#[tokio::test]
async fn test_cache_functionality() {
    let cache = crate::dev_assistant::cache::DevAssistantCache::new();
    
    let response = axum::response::Response::builder()
        .status(StatusCode::OK)
        .header("content-type", "application/json")
        .body(axum::body::Body::from(r#"{"test": "value"}"#))
        .unwrap();
    
    // Test cache set
    cache.set("test_key", &response, 300).await.unwrap();
    
    // Test cache hit
    let cached_response = cache.get("test_key").await;
    assert!(cached_response.is_some());
    
    // Test cache miss
    let cached_response = cache.get("nonexistent_key").await;
    assert!(cached_response.is_none());
}

#[tokio::test]
async fn test_authentication() {
    let secret = b"test_secret_key_for_dev_assistant_testing_purposes_only";
    let auth_config = AuthConfig::new(
        secret,
        secret,
        "test_issuer".to_string(),
        "test_audience".to_string(),
        24,
    ).unwrap();
    
    // Test token generation
    let token = auth_config.generate_test_token("test_user", &["query:read", "predict:invoke"]).unwrap();
    assert!(!token.is_empty());
    
    // Test token validation
    let claims = crate::dev_assistant::auth::validate_jwt_token(&token, &auth_config).unwrap();
    assert_eq!(claims.sub, "test_user");
    assert!(claims.has_scope("query:read"));
    assert!(claims.has_scope("predict:invoke"));
    assert!(!claims.has_scope("admin:system"));
}

#[tokio::test]
async fn test_websocket_connection() {
    // This test would require a more complex setup with actual WebSocket connections
    // For now, we'll just test the connection manager
    let manager = crate::dev_assistant::service::ConnectionManager::new();
    
    assert_eq!(manager.get_connection_count().await, 0);
    assert_eq!(manager.get_subscription_count().await, 0);
}

#[tokio::test]
async fn test_metrics_collection() {
    let metrics = crate::dev_assistant::metrics::DevAssistantMetrics::new();
    
    // Record some metrics
    metrics.record_request(
        &axum::http::Method::GET,
        "/test",
        200,
        0.1,
    );
    
    metrics.record_error("test_error", "/test", "Test error details");
    metrics.record_cache_hit("query".to_string());
    metrics.record_cache_miss("query".to_string());
    
    // Check stats
    let request_stats = metrics.get_request_stats().await;
    assert!(!request_stats.endpoints.is_empty());
    
    let error_stats = metrics.get_error_stats().await;
    assert!(!error_stats.is_empty());
    
    let cache_stats = metrics.get_cache_stats().await;
    assert!(cache_stats.contains_key("query"));
    
    let cache_hit_rate = metrics.get_cache_hit_rate("query").await;
    assert!((cache_hit_rate - 0.5).abs() < 0.001); // 1 hit / 2 total = 0.5
}