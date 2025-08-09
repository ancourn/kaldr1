//! Data models for the Dev Assistant API

use serde::{Serialize, Deserialize};

/// Request for contract optimization
#[derive(Serialize, Debug, Clone)]
pub struct OptimizeRequest {
    /// The smart contract code to optimize
    pub contract_code: String,
    /// Level of optimization to apply
    #[serde(skip_serializing_if = "Option::is_none")]
    pub optimization_level: Option<String>,
    /// Target percentage of gas reduction (0-100)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_gas_reduction: Option<f64>,
}

/// Response from contract optimization
#[derive(Deserialize, Debug, Clone)]
pub struct OptimizeResponse {
    /// The optimized smart contract code
    pub optimized_code: String,
    /// Summary of optimizations applied
    pub optimization_summary: OptimizationSummary,
    /// Any warnings generated during optimization
    pub warnings: Vec<String>,
    /// When the optimization was performed
    pub optimization_timestamp: String,
}

/// Summary of optimization results
#[derive(Deserialize, Debug, Clone)]
pub struct OptimizationSummary {
    /// Percentage of gas reduction achieved
    pub gas_reduction_percent: f64,
    /// List of optimizations applied
    pub optimizations_applied: Vec<OptimizationApplied>,
    /// Estimated gas cost of original code
    pub original_gas_estimate: u64,
    /// Estimated gas cost of optimized code
    pub optimized_gas_estimate: u64,
}

/// Individual optimization that was applied
#[derive(Deserialize, Debug, Clone)]
pub struct OptimizationApplied {
    /// Type of optimization applied
    pub r#type: String,
    /// Description of what was optimized
    pub description: String,
    /// Impact of the optimization
    pub impact: String,
}

/// Response from contract analysis
#[derive(Deserialize, Debug, Clone)]
pub struct AnalysisResponse {
    /// ID of the analyzed contract
    pub contract_id: String,
    /// When the analysis was performed
    pub analysis_timestamp: String,
    /// List of issues found in the contract
    pub issues_found: Vec<Issue>,
    /// Gas usage analysis
    pub gas_analysis: GasAnalysis,
    /// Overall security score (0-100)
    pub security_score: f64,
    /// Overall performance score (0-100)
    pub performance_score: f64,
}

/// Issue found during contract analysis
#[derive(Deserialize, Debug, Clone)]
pub struct Issue {
    /// Severity level of the issue
    pub severity: String,
    /// Type of issue (e.g., security, performance, gas)
    pub r#type: String,
    /// Detailed description of the issue
    pub description: String,
    /// Line number where the issue occurs
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_number: Option<u32>,
    /// Suggested fix for the issue
    pub suggestion: String,
}

/// Gas usage analysis
#[derive(Deserialize, Debug, Clone)]
pub struct GasAnalysis {
    /// Total gas cost
    pub total_gas: u64,
    /// Percentage of gas that could be optimized
    pub optimization_potential: f64,
    /// List of high-cost functions
    pub high_cost_functions: Vec<HighCostFunction>,
}

/// High-cost function identified during analysis
#[derive(Deserialize, Debug, Clone)]
pub struct HighCostFunction {
    /// Name of the function
    pub function_name: String,
    /// Gas cost of the function
    pub gas_cost: u64,
    /// Suggestion for optimization
    pub optimization_suggestion: String,
}

/// Response from health check
#[derive(Deserialize, Debug, Clone)]
pub struct HealthResponse {
    /// Health status
    pub status: String,
    /// When the check was performed
    pub timestamp: String,
    /// API version
    pub version: String,
    /// Status of individual services
    pub services: HealthServices,
}

/// Status of individual services
#[derive(Deserialize, Debug, Clone)]
pub struct HealthServices {
    /// Server status
    pub server: String,
    /// Database status
    pub database: String,
    /// AI services status
    pub ai_services: String,
}

/// Error response from the API
#[derive(Deserialize, Debug, Clone)]
pub struct ErrorResponse {
    /// Error message
    pub error: String,
    /// Error code
    pub code: String,
    /// Additional error details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
    /// When the error occurred
    pub timestamp: String,
}