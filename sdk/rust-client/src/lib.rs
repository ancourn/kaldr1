//! Dev Assistant API Client SDK for Rust
//! 
//! This SDK provides a convenient way to interact with the Dev Assistant API
//! for smart contract analysis and optimization.
//! 
//! # Example
//! 
//! ```rust
//! use dev_assistant_client::DevAssistantClient;
//! 
//! #[tokio::main]
//! async fn main() {
//!     let client = DevAssistantClient::new("https://api.kaldrix.com", "your-api-key");
//!     
//!     // Analyze a contract
//!     let analysis = client.analyze_contract("0x1234567890abcdef1234567890abcdef12345678").await.unwrap();
//!     println!("Found {} issues", analysis.issues_found.len());
//!     
//!     // Optimize a contract
//!     let optimize_request = dev_assistant_client::OptimizeRequest {
//!         contract_code: "contract SimpleStorage { uint256 private data; }".to_string(),
//!         optimization_level: Some("basic".to_string()),
//!         target_gas_reduction: Some(20.0),
//!     };
//!     let optimization = client.optimize_contract(optimize_request).await.unwrap();
//!     println!("Optimized code: {}", optimization.optimized_code);
//! }
//! ```

pub mod models;

// Include generated code
#[allow(dead_code)]
#[allow(unused_imports)]
mod generated;

pub use generated::*;
pub use models::*;

use anyhow::{Result, Context};
use std::sync::Arc;

/// Dev Assistant API client
#[derive(Clone)]
pub struct DevAssistantClient {
    inner: Arc<InnerClient>,
}

struct InnerClient {
    base_url: String,
    api_key: String,
    http: reqwest::Client,
}

impl DevAssistantClient {
    /// Create a new Dev Assistant API client
    /// 
    /// # Arguments
    /// 
    /// * `base_url` - The base URL of the API (e.g., "https://api.kaldrix.com")
    /// * `api_key` - Your API key for authentication
    pub fn new(base_url: &str, api_key: &str) -> Self {
        Self {
            inner: Arc::new(InnerClient {
                base_url: base_url.to_string(),
                api_key: api_key.to_string(),
                http: reqwest::Client::new(),
            }),
        }
    }

    /// Create a new client with custom HTTP client configuration
    pub fn with_http_client(base_url: &str, api_key: &str, http: reqwest::Client) -> Self {
        Self {
            inner: Arc::new(InnerClient {
                base_url: base_url.to_string(),
                api_key: api_key.to_string(),
                http,
            }),
        }
    }

    /// Analyze a smart contract
    /// 
    /// # Arguments
    /// 
    /// * `contract_id` - The ID of the contract to analyze
    pub async fn analyze_contract(&self, contract_id: &str) -> Result<AnalysisResponse> {
        self.inner
            .request(
                reqwest::Method::GET,
                &format!("contracts/{}/analyze", contract_id),
                None::<()>,
            )
            .await
            .context("Failed to analyze contract")
    }

    /// Optimize a smart contract
    /// 
    /// # Arguments
    /// 
    /// * `request` - The optimization request containing contract code and options
    pub async fn optimize_contract(&self, request: OptimizeRequest) -> Result<OptimizeResponse> {
        self.inner
            .request(
                reqwest::Method::POST,
                "contracts/optimize",
                Some(request),
            )
            .await
            .context("Failed to optimize contract")
    }

    /// Check API health status
    pub async fn health_check(&self) -> Result<HealthResponse> {
        self.inner
            .request(reqwest::Method::GET, "health", None::<()>)
            .await
            .context("Failed to check health")
    }
}

impl InnerClient {
    async fn request<T: for<'de> serde::Deserialize<'de>, B: serde::Serialize>(
        &self,
        method: reqwest::Method,
        path: &str,
        body: Option<B>,
    ) -> Result<T> {
        let url = format!("{}/{}", self.base_url, path);
        
        let mut request = self
            .http
            .request(method, &url)
            .bearer_auth(&self.api_key)
            .header("Content-Type", "application/json")
            .header("User-Agent", "dev-assistant-rust-client/1.0.0");

        if let Some(body) = body {
            request = request.json(&body);
        }

        let response = request.send().await?;
        
        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(anyhow::anyhow!("API request failed: {} - {}", status, text));
        }

        let result = response.json::<T>().await?;
        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::{mock, Server};

    #[tokio::test]
    async fn test_analyze_contract() {
        let mut server = Server::new();
        let mock = mock("GET", "/contracts/test-contract/analyze")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"
            {
                "contract_id": "test-contract",
                "analysis_timestamp": "2024-01-01T00:00:00Z",
                "issues_found": [],
                "gas_analysis": {
                    "total_gas": 100000,
                    "optimization_potential": 10.0,
                    "high_cost_functions": []
                },
                "security_score": 95.0,
                "performance_score": 90.0
            }
            "#)
            .create();

        let client = DevAssistantClient::new(&server.url(), "test-key");
        let result = client.analyze_contract("test-contract").await;
        
        assert!(result.is_ok());
        mock.assert();
    }

    #[tokio::test]
    async fn test_optimize_contract() {
        let mut server = Server::new();
        let mock = mock("POST", "/contracts/optimize")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"
            {
                "optimized_code": "contract Optimized { }",
                "optimization_summary": {
                    "gas_reduction_percent": 15.0,
                    "optimizations_applied": [],
                    "original_gas_estimate": 100000,
                    "optimized_gas_estimate": 85000
                },
                "warnings": [],
                "optimization_timestamp": "2024-01-01T00:00:00Z"
            }
            "#)
            .create();

        let request = OptimizeRequest {
            contract_code: "contract Test { }".to_string(),
            optimization_level: None,
            target_gas_reduction: None,
        };

        let client = DevAssistantClient::new(&server.url(), "test-key");
        let result = client.optimize_contract(request).await;
        
        assert!(result.is_ok());
        mock.assert();
    }

    #[tokio::test]
    async fn test_health_check() {
        let mut server = Server::new();
        let mock = mock("GET", "/health")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"
            {
                "status": "healthy",
                "timestamp": "2024-01-01T00:00:00Z",
                "version": "1.0.0",
                "services": {
                    "server": "online",
                    "database": "connected",
                    "ai_services": "active"
                }
            }
            "#)
            .create();

        let client = DevAssistantClient::new(&server.url(), "test-key");
        let result = client.health_check().await;
        
        assert!(result.is_ok());
        mock.assert();
    }
}