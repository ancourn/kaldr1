# Dev Assistant Rust Client SDK

A Rust client SDK for the Dev Assistant API, providing easy-to-use methods for smart contract analysis and optimization.

## Features

- **Contract Analysis**: Comprehensive analysis of smart contracts for security vulnerabilities and performance issues
- **Contract Optimization**: AI-powered optimization of smart contract code for better gas efficiency
- **Health Checks**: Monitor API service status and availability
- **Async/Await**: Built on tokio for efficient async operations
- **Error Handling**: Comprehensive error handling with proper context
- **Type Safety**: Full TypeScript-like type safety with Rust's strong typing

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
dev-assistant-client = "1.0.0"
```

## Quick Start

```rust
use dev_assistant_client::DevAssistantClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the client
    let client = DevAssistantClient::new("https://api.kaldrix.com", "your-api-key");
    
    // Analyze a contract
    let analysis = client.analyze_contract("0x1234567890abcdef1234567890abcdef12345678").await?;
    println!("Security score: {}", analysis.security_score);
    println!("Issues found: {}", analysis.issues_found.len());
    
    // Optimize a contract
    let optimize_request = dev_assistant_client::OptimizeRequest {
        contract_code: r#"
            contract SimpleStorage {
                uint256 private storedData;
                
                function set(uint256 x) public {
                    storedData = x;
                }
                
                function get() public view returns (uint256) {
                    return storedData;
                }
            }
        "#.to_string(),
        optimization_level: Some("basic".to_string()),
        target_gas_reduction: Some(20.0),
    };
    
    let optimization = client.optimize_contract(optimize_request).await?;
    println!("Gas reduction: {}%", optimization.optimization_summary.gas_reduction_percent);
    println!("Optimized code:\n{}", optimization.optimized_code);
    
    Ok(())
}
```

## API Reference

### DevAssistantClient

The main client struct for interacting with the Dev Assistant API.

#### Methods

##### `new(base_url: &str, api_key: &str) -> Self`

Creates a new client instance.

**Parameters:**
- `base_url`: The base URL of the API (e.g., "https://api.kaldrix.com")
- `api_key`: Your API key for authentication

**Example:**
```rust
let client = DevAssistantClient::new("https://api.kaldrix.com", "your-api-key");
```

##### `analyze_contract(contract_id: &str) -> Result<AnalysisResponse>`

Analyzes a smart contract for issues and optimization opportunities.

**Parameters:**
- `contract_id`: The ID of the contract to analyze

**Returns:**
- `Result<AnalysisResponse>`: Analysis results including issues, gas analysis, and scores

**Example:**
```rust
let analysis = client.analyze_contract("0x1234...").await?;
```

##### `optimize_contract(request: OptimizeRequest) -> Result<OptimizeResponse>`

Optimizes smart contract code for better performance and gas efficiency.

**Parameters:**
- `request`: Optimization request containing contract code and options

**Returns:**
- `Result<OptimizeResponse>`: Optimized code and summary of changes

**Example:**
```rust
let request = OptimizeRequest {
    contract_code: "contract Test { }".to_string(),
    optimization_level: Some("basic".to_string()),
    target_gas_reduction: Some(20.0),
};
let result = client.optimize_contract(request).await?;
```

##### `health_check() -> Result<HealthResponse>`

Checks the health status of the API service.

**Returns:**
- `Result<HealthResponse>`: Health status information

**Example:**
```rust
let health = client.health_check().await?;
println!("API status: {}", health.status);
```

### Data Models

#### OptimizeRequest

Request structure for contract optimization.

```rust
pub struct OptimizeRequest {
    pub contract_code: String,
    pub optimization_level: Option<String>, // "basic", "aggressive", "maximum"
    pub target_gas_reduction: Option<f64>, // 0-100
}
```

#### AnalysisResponse

Response from contract analysis.

```rust
pub struct AnalysisResponse {
    pub contract_id: String,
    pub analysis_timestamp: String,
    pub issues_found: Vec<Issue>,
    pub gas_analysis: GasAnalysis,
    pub security_score: f64,
    pub performance_score: f64,
}
```

#### OptimizeResponse

Response from contract optimization.

```rust
pub struct OptimizeResponse {
    pub optimized_code: String,
    pub optimization_summary: OptimizationSummary,
    pub warnings: Vec<String>,
    pub optimization_timestamp: String,
}
```

## Error Handling

The SDK uses `anyhow::Result<T>` for error handling, which provides rich error context:

```rust
match client.analyze_contract("invalid-contract").await {
    Ok(analysis) => println!("Analysis successful"),
    Err(e) => {
        eprintln!("Failed to analyze contract: {}", e);
        // The error includes context about what went wrong
    }
}
```

## Testing

Run tests with:

```bash
cargo test
```

The test suite uses mockito for mocking HTTP responses and covers all major API operations.

## Auto-Generation

This SDK can be automatically generated from the OpenAPI specification. To regenerate:

1. Install openapi-generator-cli:
   ```bash
   npm install -g @openapitools/openapi-generator-cli
   ```

2. Run the build script:
   ```bash
   cargo build
   ```

The build script will automatically detect if openapi-generator-cli is available and regenerate the client code from the OpenAPI specification.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on the GitHub repository or contact the development team at dev@kaldrix.com.