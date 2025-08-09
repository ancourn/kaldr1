use axum::{Router, routing::{post, get}, extract::Extension, Json, response::IntoResponse, extract::ws::WebSocketUpgrade, extract::Query, extract::Path};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::predictive::{PredictiveAnalytics, types::ForecastReq, types::Forecast};
use crate::ai_runtime_core::AIRuntimeCore;
use crate::ai_auto_auditor::AIAutoAuditor;
use crate::anomaly_detection_engine::AnomalyDetectionEngine;
use crate::dev_assistant::types::*;
use crate::dev_assistant::auth::AuthenticatedUser;
use crate::dev_assistant::cache::DevAssistantCache;
use crate::dev_assistant::metrics::DevAssistantMetrics;
use anyhow::Result;

pub fn routes() -> Router {
    Router::new()
        // Main API endpoints
        .route("/v1/dev-assistant/query", post(handle_query))
        .route("/v1/dev-assistant/analyze", post(handle_analyze))
        .route("/v1/dev-assistant/predict", post(handle_predict))
        .route("/v1/dev-assistant/anomaly", get(handle_anomaly_query))
        .route("/v1/dev-assistant/explain", post(handle_explain))
        
        // Analysis status endpoints
        .route("/v1/dev-assistant/analysis/:id", get(get_analysis_status))
        .route("/v1/dev-assistant/analysis/:id/results", get(get_analysis_results))
        
        // WebSocket streaming
        .route("/v1/dev-assistant/stream", get(ws_handler))
        
        // Health check
        .route("/health", get(health_check))
}

/// Handle natural language queries
async fn handle_query(
    Extension(predictive): Extension<Arc<PredictiveAnalytics>>,
    Extension(ai_runtime): Extension<Arc<AIRuntimeCore>>,
    Extension(ai_auditor): Extension<Arc<AIAutoAuditor>>,
    Extension(metrics): Extension<Arc<DevAssistantMetrics>>,
    Extension(cache): Extension<Arc<DevAssistantCache>>,
    user: AuthenticatedUser,
    Json(payload): Json<QueryRequest>,
) -> Result<impl IntoResponse, (axum::http::StatusCode, String)> {
    let start_time = std::time::Instant::now();
    
    // Check permissions
    if !crate::dev_assistant::auth::ensure_scope(&user.0, "query:read") {
        return Err((axum::http::StatusCode::FORBIDDEN, "Insufficient permissions".to_string()));
    }
    
    // Generate query ID for tracking
    let query_id = uuid::Uuid::new_v4().to_string();
    
    // Check cache first
    let cache_key = format!("query:{}:{}", query_id, serde_json::to_string(&payload).unwrap_or_default());
    if let Some(cached_response) = cache.get(&cache_key).await {
        metrics.record_cache_hit("query".to_string());
        return Ok(cached_response);
    }
    
    metrics.record_cache_miss("query".to_string());
    
    // Process the query using AI runtime
    let response = process_query(&payload, &ai_runtime, &ai_auditor, &predictive).await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let processing_time = start_time.elapsed().as_millis() as u64;
    let response = response.with_processing_time(processing_time);
    
    // Cache the response
    let response_json = serde_json::to_value(&response).unwrap();
    let http_response = axum::response::Response::new(axum::body::Body::from(
        serde_json::to_string(&response_json).unwrap()
    ));
    
    if let Err(e) = cache.set(&cache_key, &http_response, 300).await {
        tracing::warn!("Failed to cache query response: {}", e);
    }
    
    metrics.record_query_success(&payload.target.clone().unwrap_or_default(), processing_time);
    
    Ok(Json(response))
}

/// Handle analysis requests
async fn handle_analyze(
    Extension(ai_runtime): Extension<Arc<AIRuntimeCore>>,
    Extension(ai_auditor): Extension<Arc<AIAutoAuditor>>,
    Extension(metrics): Extension<Arc<DevAssistantMetrics>>,
    user: AuthenticatedUser,
    Json(payload): Json<AnalysisRequest>,
) -> Result<impl IntoResponse, (axum::http::StatusCode, String)> {
    // Check permissions
    if !crate::dev_assistant::auth::ensure_scope(&user.0, "analysis:write") {
        return Err((axum::http::StatusCode::FORBIDDEN, "Insufficient permissions".to_string()));
    }
    
    let analysis_id = uuid::Uuid::new_v4().to_string();
    
    // Queue the analysis
    let response = AnalysisResponse::new(payload.target.clone())
        .with_status(AnalysisStatus::Queued);
    
    // Start background analysis task
    let ai_runtime_clone = ai_runtime.clone();
    let ai_auditor_clone = ai_auditor.clone();
    let analysis_request = payload.clone();
    let analysis_id_clone = analysis_id.clone();
    
    tokio::spawn(async move {
        if let Err(e) = run_analysis(
            analysis_id_clone,
            analysis_request,
            ai_runtime_clone,
            ai_auditor_clone,
        ).await {
            tracing::error!("Analysis failed: {}", e);
        }
    });
    
    metrics.record_analysis_queued(&payload.target);
    
    Ok((axum::http::StatusCode::ACCEPTED, Json(response)))
}

/// Handle prediction requests
async fn handle_predict(
    Extension(predictive): Extension<Arc<PredictiveAnalytics>>,
    Extension(metrics): Extension<Arc<DevAssistantMetrics>>,
    Extension(cache): Extension<Arc<DevAssistantCache>>,
    user: AuthenticatedUser,
    Json(payload): Json<PredictPayload>,
) -> Result<impl IntoResponse, (axum::http::StatusCode, String)> {
    let start_time = std::time::Instant::now();
    
    // Check permissions
    if !crate::dev_assistant::auth::ensure_scope(&user.0, "predict:invoke") {
        return Err((axum::http::StatusCode::FORBIDDEN, "Insufficient permissions".to_string()));
    }
    
    // Check cache first
    let cache_key = format!("predict:{}:{}", payload.req.target, serde_json::to_string(&payload.req.horizon).unwrap_or_default());
    if let Some(cached_response) = cache.get(&cache_key).await {
        metrics.record_cache_hit("predict".to_string());
        return Ok(cached_response);
    }
    
    metrics.record_cache_miss("predict".to_string());
    
    // Generate forecast
    let forecast = predictive.forecast(payload.req).await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let processing_time = start_time.elapsed().as_millis() as u64;
    
    let response = PredictResp {
        forecast_id: uuid::Uuid::new_v4().to_string(),
        result: serde_json::to_value(&forecast).unwrap(),
    };
    
    // Cache the response
    let response_json = serde_json::to_value(&response).unwrap();
    let http_response = axum::response::Response::new(axum::body::Body::from(
        serde_json::to_string(&response_json).unwrap()
    ));
    
    if let Err(e) = cache.set(&cache_key, &http_response, 60).await {
        tracing::warn!("Failed to cache prediction response: {}", e);
    }
    
    metrics.record_prediction_success(&payload.req.target, processing_time);
    
    Ok(Json(response))
}

/// Handle anomaly queries
async fn handle_anomaly_query(
    Extension(anomaly_engine): Extension<Arc<AnomalyDetectionEngine>>,
    Extension(metrics): Extension<Arc<DevAssistantMetrics>>,
    user: AuthenticatedUser,
    Query(params): Query<AnomalyQueryParams>,
) -> Result<impl IntoResponse, (axum::http::StatusCode, String)> {
    // Check permissions
    if !crate::dev_assistant::auth::ensure_scope(&user.0, "anomaly:read") {
        return Err((axum::http::StatusCode::FORBIDDEN, "Insufficient permissions".to_string()));
    }
    
    let request = AnomalyQueryRequest {
        target: params.target,
        since: params.since,
        until: params.until,
        anomaly_types: params.anomaly_types,
        severity_levels: params.severity_levels,
        limit: params.limit,
        include_resolved: params.include_resolved.unwrap_or(false),
    };
    
    let anomalies = anomaly_engine.query_anomalies(&request).await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let response = AnomalyQueryResponse::new()
        .with_counts(anomalies.total_count, anomalies.filtered_count);
    
    metrics.record_anomaly_query_success(&request.target);
    
    Ok(Json(response))
}

/// Handle explanation requests
async fn handle_explain(
    Extension(ai_runtime): Extension<Arc<AIRuntimeCore>>,
    Extension(predictive): Extension<Arc<PredictiveAnalytics>>,
    Extension(metrics): Extension<Arc<DevAssistantMetrics>>,
    user: AuthenticatedUser,
    Json(payload): Json<ExplainRequest>,
) -> Result<impl IntoResponse, (axum::http::StatusCode, String)> {
    // Check permissions
    if !crate::dev_assistant::auth::ensure_scope(&user.0, "explain:read") {
        return Err((axum::http::StatusCode::FORBIDDEN, "Insufficient permissions".to_string()));
    }
    
    let explanation = generate_explanation(&payload, &ai_runtime, &predictive).await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    metrics.record_explanation_success(&payload.target);
    
    Ok(Json(explanation))
}

/// Get analysis status
async fn get_analysis_status(
    Path(id): Path<String>,
    Extension(metrics): Extension<Arc<DevAssistantMetrics>>,
    user: AuthenticatedUser,
) -> Result<impl IntoResponse, (axum::http::StatusCode, String)> {
    // Check permissions
    if !crate::dev_assistant::auth::ensure_scope(&user.0, "analysis:read") {
        return Err((axum::http::StatusCode::FORBIDDEN, "Insufficient permissions".to_string()));
    }
    
    // This would typically check the status from a database or task queue
    let response = AnalysisResponse::new("unknown".to_string())
        .with_status(AnalysisStatus::InProgress)
        .with_progress(0.5);
    
    Ok(Json(response))
}

/// Get analysis results
async fn get_analysis_results(
    Path(id): Path<String>,
    Extension(metrics): Extension<Arc<DevAssistantMetrics>>,
    user: AuthenticatedUser,
) -> Result<impl IntoResponse, (axum::http::StatusCode, String)> {
    // Check permissions
    if !crate::dev_assistant::auth::ensure_scope(&user.0, "analysis:read") {
        return Err((axum::http::StatusCode::FORBIDDEN, "Insufficient permissions".to_string()));
    }
    
    // This would typically fetch results from a database
    let results = AnalysisResults {
        summary: "Analysis completed successfully".to_string(),
        findings: Vec::new(),
        metrics: AnalysisMetrics {
            execution_time_ms: 1500,
            gas_used: Some(50000),
            complexity_score: 0.7,
            code_coverage_percent: 85.0,
            test_coverage_percent: 75.0,
        },
        recommendations: Vec::new(),
        raw_data: None,
    };
    
    let response = AnalysisResponse::new("unknown".to_string())
        .with_status(AnalysisStatus::Completed)
        .with_results(results);
    
    Ok(Json(response))
}

/// WebSocket handler for streaming
async fn ws_handler(
    ws: WebSocketUpgrade,
    Extension(user): Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    // Check permissions
    if !crate::dev_assistant::auth::ensure_scope(&user.0, "stream:read") {
        return axum::response::Response::builder()
            .status(axum::http::StatusCode::FORBIDDEN)
            .body(axum::body::Body::from("Insufficient permissions"))
            .unwrap();
    }
    
    ws.on_upgrade(|socket| async move {
        crate::dev_assistant::service::stream_handler(socket).await;
    })
}

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": crate::utils::now_secs(),
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

// Helper functions

#[derive(Deserialize)]
pub struct PredictPayload {
    pub req: ForecastReq,
}

#[derive(Deserialize)]
pub struct AnomalyQueryParams {
    pub target: String,
    pub since: Option<u64>,
    pub until: Option<u64>,
    pub anomaly_types: Option<Vec<String>>,
    pub severity_levels: Option<Vec<String>>,
    pub limit: Option<u32>,
    pub include_resolved: Option<bool>,
}

#[derive(Serialize)]
pub struct PredictResp {
    pub forecast_id: String,
    pub result: serde_json::Value,
}

/// Process natural language query
async fn process_query(
    query: &QueryRequest,
    ai_runtime: &Arc<AIRuntimeCore>,
    ai_auditor: &Arc<AIAutoAuditor>,
    predictive: &Arc<PredictiveAnalytics>,
) -> Result<QueryResponse> {
    // Use AI runtime to process the natural language query
    let ai_response = ai_runtime.process_query(&query.question, &query.target).await?;
    
    let mut response = QueryResponse::new(ai_response.answer)
        .with_confidence(ai_response.confidence);
    
    // Add citations if available
    for citation in ai_response.citations {
        response = response.with_citation(citation);
    }
    
    // Add follow-up questions
    for question in ai_response.follow_up_questions {
        response = response.with_follow_up_question(question);
    }
    
    Ok(response)
}

/// Run analysis in background
async fn run_analysis(
    analysis_id: String,
    request: AnalysisRequest,
    ai_runtime: Arc<AIRuntimeCore>,
    ai_auditor: Arc<AIAutoAuditor>,
) -> Result<()> {
    // Update status to in progress
    tracing::info!("Starting analysis {} for target {}", analysis_id, request.target);
    
    // Perform the analysis based on type
    let results = match request.analysis_type {
        crate::dev_assistant::types::AnalysisType::Static => {
            ai_auditor.analyze_contract(&request.target).await?
        },
        crate::dev_assistant::types::AnalysisType::Dynamic => {
            ai_runtime.analyze_dynamically(&request.target).await?
        },
        crate::dev_assistant::types::AnalysisType::Hybrid => {
            // Combine static and dynamic analysis
            let static_results = ai_auditor.analyze_contract(&request.target).await?;
            let dynamic_results = ai_runtime.analyze_dynamically(&request.target).await?;
            combine_analysis_results(static_results, dynamic_results)
        },
        _ => {
            return Err(anyhow::anyhow!("Analysis type not implemented"));
        }
    };
    
    tracing::info!("Analysis {} completed successfully", analysis_id);
    
    // Store results (in a real implementation, this would go to a database)
    
    // Call callback if provided
    if let Some(callback_url) = request.callback_url {
        // Send callback notification
        if let Err(e) = send_callback(&callback_url, &analysis_id, &results).await {
            tracing::warn!("Failed to send callback: {}", e);
        }
    }
    
    Ok(())
}

/// Combine static and dynamic analysis results
fn combine_analysis_results(
    static_results: serde_json::Value,
    dynamic_results: serde_json::Value,
) -> serde_json::Value {
    serde_json::json!({
        "static_analysis": static_results,
        "dynamic_analysis": dynamic_results,
        "combined": true
    })
}

/// Send callback notification
async fn send_callback(
    callback_url: &str,
    analysis_id: &str,
    results: &serde_json::Value,
) -> Result<()> {
    let client = reqwest::Client::new();
    let payload = serde_json::json!({
        "analysis_id": analysis_id,
        "status": "completed",
        "results": results,
        "timestamp": crate::utils::now_secs(),
    });
    
    let response = client.post(callback_url)
        .json(&payload)
        .send()
        .await?;
    
    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Callback failed with status: {}", response.status()));
    }
    
    Ok(())
}

/// Generate explanation
async fn generate_explanation(
    request: &ExplainRequest,
    ai_runtime: &Arc<AIRuntimeCore>,
    predictive: &Arc<PredictiveAnalytics>,
) -> Result<ExplainResponse> {
    let mut response = ExplainResponse::new(request.item_type.clone(), request.item_id.clone());
    
    match request.item_type {
        crate::dev_assistant::types::ExplainItemType::Prediction => {
            let explanation = predictive.explain_prediction(&request.item_id).await?;
            response = response.with_explanation(explanation);
        },
        crate::dev_assistant::types::ExplainItemType::Model => {
            let explanation = ai_runtime.explain_model(&request.item_id).await?;
            response = response.with_explanation(explanation);
        },
        _ => {
            return Err(anyhow::anyhow!("Explanation type not implemented"));
        }
    }
    
    Ok(response)
}