use std::fs;
use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=../../openapi.yaml");
    
    // Generate Rust client from OpenAPI spec
    let openapi_path = "../../openapi.yaml";
    let output_dir = "src/generated";
    
    // Create output directory if it doesn't exist
    fs::create_dir_all(output_dir).unwrap();
    
    // Check if openapi-generator is available
    let output = Command::new("which")
        .arg("openapi-generator-cli")
        .output()
        .expect("Failed to execute which command");
    
    if output.status.success() {
        println!("Found openapi-generator-cli, generating Rust client...");
        
        let status = Command::new("openapi-generator-cli")
            .args(&[
                "generate",
                "-i",
                openapi_path,
                "-g",
                "rust",
                "-o",
                output_dir,
                "--additional-properties=packageName=dev_assistant_client,crateName=dev_assistant_client",
            ])
            .status()
            .expect("Failed to execute openapi-generator-cli");
        
        if !status.success() {
            panic!("Failed to generate Rust client");
        }
        
        // Copy the generated files to the src directory
        copy_generated_files(output_dir);
        
        println!("Rust client generated successfully!");
    } else {
        println!("openapi-generator-cli not found. Using manual client implementation.");
        // Fallback to manual implementation
        create_manual_client();
    }
}

fn copy_generated_files(generated_dir: &str) {
    let generated_path = Path::new(generated_dir);
    let src_path = Path::new("src");
    
    // Copy the main lib.rs file
    let generated_lib = generated_path.join("src").join("lib.rs");
    let target_lib = src_path.join("generated.rs");
    
    if generated_lib.exists() {
        fs::copy(generated_lib, target_lib).unwrap();
        println!("Copied generated lib.rs to src/generated.rs");
    }
    
    // Copy models
    let models_dir = generated_path.join("src").join("models");
    if models_dir.exists() {
        let target_models = src_path.join("models");
        fs::create_dir_all(&target_models).unwrap();
        
        for entry in fs::read_dir(models_dir).unwrap() {
            let entry = entry.unwrap();
            let target_file = target_models.join(entry.file_name());
            fs::copy(entry.path(), target_file).unwrap();
        }
        println!("Copied generated models");
    }
}

fn create_manual_client() {
    let generated_code = r#"
// This is a manually implemented client since openapi-generator-cli is not available
// In production, you should install openapi-generator-cli for auto-generation

use serde::{Serialize, Deserialize};

#[derive(Clone)]
pub struct DevAssistantClient {
    base_url: String,
    api_key: String,
    http: reqwest::Client,
}

impl DevAssistantClient {
    pub fn new(base_url: &str, api_key: &str) -> Self {
        Self {
            base_url: base_url.to_string(),
            api_key: api_key.to_string(),
            http: reqwest::Client::new(),
        }
    }

    async fn request<T: for<'de> Deserialize<'de>, B: Serialize>(
        &self,
        method: reqwest::Method,
        path: &str,
        body: Option<B>,
    ) -> Result<T, reqwest::Error> {
        let url = format!("{}/{}", self.base_url, path);
        let req = self
            .http
            .request(method, &url)
            .bearer_auth(&self.api_key);
        
        let req = if let Some(body) = body {
            req.json(&body)
        } else {
            req
        };
        
        let resp = req.send().await?.error_for_status()?;
        resp.json::<T>().await
    }

    pub async fn analyze_contract(&self, contract_id: &str) -> Result<AnalysisResponse, reqwest::Error> {
        self.request(
            reqwest::Method::GET,
            &format!("contracts/{}/analyze", contract_id),
            Option::<()>::None,
        ).await
    }

    pub async fn optimize_contract(&self, req_body: OptimizeRequest) -> Result<OptimizeResponse, reqwest::Error> {
        self.request(
            reqwest::Method::POST,
            "contracts/optimize",
            Some(req_body),
        ).await
    }

    pub async fn health_check(&self) -> Result<HealthResponse, reqwest::Error> {
        self.request(
            reqwest::Method::GET,
            "health",
            Option::<()>::None,
        ).await
    }
}

#[derive(Serialize)]
pub struct OptimizeRequest {
    pub contract_code: String,
    pub optimization_level: Option<String>,
    pub target_gas_reduction: Option<f64>,
}

#[derive(Deserialize)]
pub struct OptimizeResponse {
    pub optimized_code: String,
    pub optimization_summary: OptimizationSummary,
    pub warnings: Vec<String>,
    pub optimization_timestamp: String,
}

#[derive(Deserialize)]
pub struct OptimizationSummary {
    pub gas_reduction_percent: f64,
    pub optimizations_applied: Vec<OptimizationApplied>,
    pub original_gas_estimate: u64,
    pub optimized_gas_estimate: u64,
}

#[derive(Deserialize)]
pub struct OptimizationApplied {
    pub r#type: String,
    pub description: String,
    pub impact: String,
}

#[derive(Deserialize)]
pub struct AnalysisResponse {
    pub contract_id: String,
    pub analysis_timestamp: String,
    pub issues_found: Vec<Issue>,
    pub gas_analysis: GasAnalysis,
    pub security_score: f64,
    pub performance_score: f64,
}

#[derive(Deserialize)]
pub struct Issue {
    pub severity: String,
    pub r#type: String,
    pub description: String,
    pub line_number: Option<u32>,
    pub suggestion: String,
}

#[derive(Deserialize)]
pub struct GasAnalysis {
    pub total_gas: u64,
    pub optimization_potential: f64,
    pub high_cost_functions: Vec<HighCostFunction>,
}

#[derive(Deserialize)]
pub struct HighCostFunction {
    pub function_name: String,
    pub gas_cost: u64,
    pub optimization_suggestion: String,
}

#[derive(Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: String,
    pub version: String,
    pub services: HealthServices,
}

#[derive(Deserialize)]
pub struct HealthServices {
    pub server: String,
    pub database: String,
    pub ai_services: String,
}
"#;

    let src_path = Path::new("src");
    fs::create_dir_all(src_path).unwrap();
    
    fs::write(src_path.join("generated.rs"), generated_code).unwrap();
    println!("Created manual client implementation");
}