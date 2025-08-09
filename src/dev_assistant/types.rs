use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use anyhow::Result;
use uuid::Uuid;

/// API request/response types

/// Query request for natural language queries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryRequest {
    pub target: Option<String>,
    pub question: String,
    pub context: Option<HashMap<String, serde_json::Value>>,
    pub session_id: Option<String>,
}

impl QueryRequest {
    pub fn new(question: String) -> Self {
        Self {
            target: None,
            question,
            context: None,
            session_id: None,
        }
    }

    pub fn with_target(mut self, target: String) -> Self {
        self.target = Some(target);
        self
    }

    pub fn with_context(mut self, context: HashMap<String, serde_json::Value>) -> Self {
        self.context = Some(context);
        self
    }

    pub fn with_session_id(mut self, session_id: String) -> Self {
        self.session_id = Some(session_id);
        self
    }
}

/// Query response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResponse {
    pub query_id: String,
    pub answer: String,
    pub confidence: f32,
    pub citations: Vec<Citation>,
    pub follow_up_questions: Vec<String>,
    pub session_id: String,
    pub processing_time_ms: u64,
}

impl QueryResponse {
    pub fn new(answer: String) -> Self {
        Self {
            query_id: Uuid::new_v4().to_string(),
            answer,
            confidence: 0.0,
            citations: Vec::new(),
            follow_up_questions: Vec::new(),
            session_id: Uuid::new_v4().to_string(),
            processing_time_ms: 0,
        }
    }

    pub fn with_confidence(mut self, confidence: f32) -> Self {
        self.confidence = confidence;
        self
    }

    pub fn with_citation(mut self, citation: Citation) -> Self {
        self.citations.push(citation);
        self
    }

    pub fn with_follow_up_question(mut self, question: String) -> Self {
        self.follow_up_questions.push(question);
        self
    }

    pub fn with_processing_time(mut self, time_ms: u64) -> Self {
        self.processing_time_ms = time_ms;
        self
    }
}

/// Citation for query responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Citation {
    pub id: String,
    pub source: String,
    pub title: String,
    pub snippet: String,
    pub relevance_score: f32,
}

impl Citation {
    pub fn new(source: String, title: String, snippet: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            source,
            title,
            snippet,
            relevance_score: 0.0,
        }
    }

    pub fn with_relevance_score(mut self, score: f32) -> Self {
        self.relevance_score = score;
        self
    }
}

/// Analysis request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisRequest {
    pub target: String,
    pub depth: AnalysisDepth,
    pub analysis_type: AnalysisType,
    pub options: Option<AnalysisOptions>,
    pub callback_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AnalysisDepth {
    Quick,
    Standard,
    Deep,
    Comprehensive,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AnalysisType {
    Static,
    Dynamic,
    Hybrid,
    Security,
    Performance,
    GasOptimization,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisOptions {
    pub include_gas_analysis: bool,
    pub include_security_analysis: bool,
    pub include_performance_analysis: bool,
    pub timeout_seconds: u32,
    pub max_complexity: u32,
}

impl Default for AnalysisOptions {
    fn default() -> Self {
        Self {
            include_gas_analysis: true,
            include_security_analysis: true,
            include_performance_analysis: true,
            timeout_seconds: 300,
            max_complexity: 10,
        }
    }
}

impl AnalysisRequest {
    pub fn new(target: String) -> Self {
        Self {
            target,
            depth: AnalysisDepth::Standard,
            analysis_type: AnalysisType::Hybrid,
            options: None,
            callback_url: None,
        }
    }

    pub fn with_depth(mut self, depth: AnalysisDepth) -> Self {
        self.depth = depth;
        self
    }

    pub fn with_analysis_type(mut self, analysis_type: AnalysisType) -> Self {
        self.analysis_type = analysis_type;
        self
    }

    pub fn with_options(mut self, options: AnalysisOptions) -> Self {
        self.options = Some(options);
        self
    }

    pub fn with_callback_url(mut self, url: String) -> Self {
        self.callback_url = Some(url);
        self
    }
}

/// Analysis response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResponse {
    pub analysis_id: String,
    pub status: AnalysisStatus,
    pub target: String,
    pub results: Option<AnalysisResults>,
    pub progress: f32,
    pub estimated_time_remaining_ms: Option<u64>,
    pub callback_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AnalysisStatus {
    Queued,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResults {
    pub summary: String,
    pub findings: Vec<Finding>,
    pub metrics: AnalysisMetrics,
    pub recommendations: Vec<Recommendation>,
    pub raw_data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Finding {
    pub id: String,
    pub severity: FindingSeverity,
    pub category: String,
    pub title: String,
    pub description: String,
    pub location: Option<String>,
    pub impact: String,
    pub recommendation: String,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FindingSeverity {
    Info,
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisMetrics {
    pub execution_time_ms: u64,
    pub gas_used: Option<u64>,
    pub complexity_score: f32,
    pub code_coverage_percent: f32,
    pub test_coverage_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    pub id: String,
    pub priority: u8,
    pub title: String,
    pub description: String,
    pub estimated_effort: String,
    pub impact: String,
}

impl AnalysisResponse {
    pub fn new(target: String) -> Self {
        Self {
            analysis_id: Uuid::new_v4().to_string(),
            status: AnalysisStatus::Queued,
            target,
            results: None,
            progress: 0.0,
            estimated_time_remaining_ms: None,
            callback_url: None,
        }
    }

    pub fn with_status(mut self, status: AnalysisStatus) -> Self {
        self.status = status;
        self
    }

    pub fn with_results(mut self, results: AnalysisResults) -> Self {
        self.results = Some(results);
        self
    }

    pub fn with_progress(mut self, progress: f32) -> Self {
        self.progress = progress;
        self
    }
}

/// Anomaly query request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyQueryRequest {
    pub target: String,
    pub since: Option<u64>, // timestamp
    pub until: Option<u64>, // timestamp
    pub anomaly_types: Option<Vec<String>>,
    pub severity_levels: Option<Vec<String>>,
    pub limit: Option<u32>,
    pub include_resolved: bool,
}

impl AnomalyQueryRequest {
    pub fn new(target: String) -> Self {
        Self {
            target,
            since: None,
            until: None,
            anomaly_types: None,
            severity_levels: None,
            limit: None,
            include_resolved: false,
        }
    }

    pub fn with_time_range(mut self, since: u64, until: u64) -> Self {
        self.since = Some(since);
        self.until = Some(until);
        self
    }

    pub fn with_anomaly_types(mut self, types: Vec<String>) -> Self {
        self.anomaly_types = Some(types);
        self
    }

    pub fn with_limit(mut self, limit: u32) -> Self {
        self.limit = Some(limit);
        self
    }
}

/// Anomaly query response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyQueryResponse {
    pub query_id: String,
    pub anomalies: Vec<AnomalySummary>,
    pub total_count: u32,
    pub filtered_count: u32,
    pub time_range_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalySummary {
    pub id: String,
    pub anomaly_type: String,
    pub severity: String,
    pub target: String,
    pub timestamp: u64,
    pub description: String,
    pub status: String,
    pub metadata: Option<serde_json::Value>,
}

impl AnomalyQueryResponse {
    pub fn new() -> Self {
        Self {
            query_id: Uuid::new_v4().to_string(),
            anomalies: Vec::new(),
            total_count: 0,
            filtered_count: 0,
            time_range_ms: None,
        }
    }

    pub fn with_anomaly(mut self, anomaly: AnomalySummary) -> Self {
        self.anomalies.push(anomaly);
        self
    }

    pub fn with_counts(mut self, total: u32, filtered: u32) -> Self {
        self.total_count = total;
        self.filtered_count = filtered;
        self
    }
}

/// Explanation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplainRequest {
    pub target: String,
    pub item_type: ExplainItemType,
    pub item_id: String,
    pub detail_level: ExplainDetailLevel,
    pub context: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExplainItemType {
    Prediction,
    Anomaly,
    Analysis,
    Model,
    Feature,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExplainDetailLevel {
    Basic,
    Detailed,
    Technical,
    Full,
}

impl ExplainRequest {
    pub fn new(target: String, item_type: ExplainItemType, item_id: String) -> Self {
        Self {
            target,
            item_type,
            item_id,
            detail_level: ExplainDetailLevel::Detailed,
            context: None,
        }
    }

    pub fn with_detail_level(mut self, level: ExplainDetailLevel) -> Self {
        self.detail_level = level;
        self
    }
}

/// Explanation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplainResponse {
    pub explanation_id: String,
    pub item_type: ExplainItemType,
    pub item_id: String,
    pub explanation: Explanation,
    pub confidence: f32,
    pub related_items: Vec<RelatedItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Explanation {
    pub summary: String,
    pub details: String,
    pub technical_details: Option<String>,
    pub feature_contributions: Option<Vec<FeatureContribution>>,
    pub model_info: Option<ModelInfo>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureContribution {
    pub feature_name: String,
    pub contribution: f64,
    pub importance: f32,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub version: String,
    pub type_: String,
    pub accuracy: f32,
    pub training_data_info: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelatedItem {
    pub id: String,
    pub type_: String,
    pub title: String,
    pub relevance_score: f32,
}

impl ExplainResponse {
    pub fn new(item_type: ExplainItemType, item_id: String) -> Self {
        Self {
            explanation_id: Uuid::new_v4().to_string(),
            item_type,
            item_id,
            explanation: Explanation {
                summary: String::new(),
                details: String::new(),
                technical_details: None,
                feature_contributions: None,
                model_info: None,
                recommendations: Vec::new(),
            },
            confidence: 0.0,
            related_items: Vec::new(),
        }
    }

    pub fn with_explanation(mut self, explanation: Explanation) -> Self {
        self.explanation = explanation;
        self
    }

    pub fn with_confidence(mut self, confidence: f32) -> Self {
        self.confidence = confidence;
        self
    }
}

/// Streaming message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum StreamMessage {
    Ping,
    Pong,
    Subscribe { channels: Vec<String> },
    Unsubscribe { channels: Vec<String> },
    Prediction { prediction: serde_json::Value },
    Anomaly { anomaly: serde_json::Value },
    AnalysisUpdate { analysis_id: String, progress: f32 },
    AnalysisComplete { analysis_id: String, results: serde_json::Value },
    Error { error: String },
    Heartbeat { timestamp: u64 },
}

impl StreamMessage {
    pub fn to_json(&self) -> Result<String> {
        Ok(serde_json::to_string(self)?)
    }

    pub fn from_json(json: &str) -> Result<Self> {
        Ok(serde_json::from_str(json)?)
    }
}

/// API error response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error_id: String,
    pub error_type: String,
    pub message: String,
    pub details: Option<String>,
    pub timestamp: u64,
    pub request_id: Option<String>,
}

impl ErrorResponse {
    pub fn new(error_type: String, message: String) -> Self {
        Self {
            error_id: Uuid::new_v4().to_string(),
            error_type,
            message,
            details: None,
            timestamp: crate::utils::now_secs(),
            request_id: None,
        }
    }

    pub fn with_details(mut self, details: String) -> Self {
        self.details = Some(details);
        self
    }

    pub fn with_request_id(mut self, request_id: String) -> Self {
        self.request_id = Some(request_id);
        self
    }
}

/// Rate limit info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitInfo {
    pub limit: u32,
    pub remaining: u32,
    pub reset_seconds: u64,
}

impl RateLimitInfo {
    pub fn new(limit: u32, remaining: u32, reset_seconds: u64) -> Self {
        Self {
            limit,
            remaining,
            reset_seconds,
        }
    }
}