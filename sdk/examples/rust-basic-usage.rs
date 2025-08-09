//! Basic usage example for the Rust Dev Assistant Client SDK
//! 
//! This example demonstrates how to use the SDK for:
//! - Contract analysis
//! - Contract optimization
//! - Health checks
//! - Error handling

use dev_assistant_client::{DevAssistantClient, OptimizeRequest};
use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the client
    let client = DevAssistantClient::new("https://api.kaldrix.com", "your-api-key");
    
    println!("🚀 KALDRIX Dev Assistant Rust SDK - Basic Usage Example");
    println!("=====================================================");
    
    // Example 1: Health Check
    println!("\n📊 Example 1: Health Check");
    match client.health_check().await {
        Ok(health) => {
            println!("✅ API Status: {}", health.status);
            println!("📋 Version: {}", health.version);
            println!("🔧 Services:");
            println!("   - Server: {}", health.services.server);
            println!("   - Database: {}", health.services.database);
            println!("   - AI Services: {}", health.services.ai_services);
        }
        Err(e) => {
            println!("❌ Health check failed: {}", e);
        }
    }
    
    // Example 2: Contract Analysis
    println!("\n🔍 Example 2: Contract Analysis");
    let contract_id = "0x1234567890abcdef1234567890abcdef12345678";
    
    match client.analyze_contract(contract_id).await {
        Ok(analysis) => {
            println!("✅ Contract Analysis Results:");
            println!("   Contract ID: {}", analysis.contract_id);
            println!("   Security Score: {}/100", analysis.security_score);
            println!("   Performance Score: {}/100", analysis.performance_score);
            println!("   Issues Found: {}", analysis.issues_found.len());
            println!("   Total Gas: {}", analysis.gas_analysis.total_gas);
            println!("   Optimization Potential: {}%", analysis.gas_analysis.optimization_potential);
            
            // Display issues
            if !analysis.issues_found.is_empty() {
                println!("\n🚨 Issues Found:");
                for (i, issue) in analysis.issues_found.iter().enumerate() {
                    println!("   {}. [{}] {}: {}", i + 1, issue.severity, issue.r#type, issue.description);
                    if let Some(line) = issue.line_number {
                        println!("      Line: {}", line);
                    }
                    println!("      Suggestion: {}", issue.suggestion);
                }
            }
        }
        Err(e) => {
            println!("❌ Contract analysis failed: {}", e);
        }
    }
    
    // Example 3: Contract Optimization
    println!("\n⚡ Example 3: Contract Optimization");
    let contract_code = r#"
// Simple storage contract
contract SimpleStorage {
    uint256 private storedData;
    
    function set(uint256 x) public {
        storedData = x;
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}
"#;
    
    let optimize_request = OptimizeRequest {
        contract_code: contract_code.to_string(),
        optimization_level: Some("basic".to_string()),
        target_gas_reduction: Some(20.0),
    };
    
    match client.optimize_contract(optimize_request).await {
        Ok(optimization) => {
            println!("✅ Contract Optimization Results:");
            println!("   Gas Reduction: {}%", optimization.optimization_summary.gas_reduction_percent);
            println!("   Original Gas: {}", optimization.optimization_summary.original_gas_estimate);
            println!("   Optimized Gas: {}", optimization.optimization_summary.optimized_gas_estimate);
            println!("   Optimizations Applied: {}", optimization.optimization_summary.optimizations_applied.len());
            
            // Display optimizations
            if !optimization.optimization_summary.optimizations_applied.is_empty() {
                println!("\n🔧 Optimizations Applied:");
                for (i, opt) in optimization.optimization_summary.optimizations_applied.iter().enumerate() {
                    println!("   {}. [{}] {}", i + 1, opt.r#type, opt.description);
                    println!("      Impact: {}", opt.impact);
                }
            }
            
            // Display warnings
            if !optimization.warnings.is_empty() {
                println!("\n⚠️  Warnings:");
                for warning in &optimization.warnings {
                    println!("   - {}", warning);
                }
            }
            
            println!("\n📝 Optimized Code:");
            println!("```solidity");
            println!("{}", optimization.optimized_code);
            println!("```");
        }
        Err(e) => {
            println!("❌ Contract optimization failed: {}", e);
        }
    }
    
    // Example 4: Error Handling
    println!("\n🛡️  Example 4: Error Handling");
    
    // Try to analyze a non-existent contract
    match client.analyze_contract("invalid-contract-id").await {
        Ok(_) => {
            println!("⚠️  Expected error but got success");
        }
        Err(e) => {
            println!("✅ Error handled correctly:");
            println!("   Error: {}", e);
        }
    }
    
    // Example 5: Client Configuration
    println!("\n⚙️  Example 5: Client Configuration");
    
    // Create a client with custom timeout
    let custom_client = DevAssistantClient::new("https://api.kaldrix.com", "your-api-key");
    
    // Update configuration
    custom_client.update_base_url("https://staging-api.kaldrix.com");
    custom_client.update_api_key("staging-api-key");
    
    println!("✅ Client configuration updated:");
    println!("   Base URL: {}", custom_client.getConfig().base_url);
    println!("   API Key: {}...", &custom_client.getConfig().api_key[..10]);
    
    // Create a new client with modified config
    let production_client = custom_client.with_config(dev_assistant_client::DevAssistantClientConfig {
        base_url: "https://api.kaldrix.com".to_string(),
        api_key: "production-api-key".to_string(),
        timeout: Some(Duration::from_secs(60)),
    });
    
    println!("✅ New client created with modified config");
    println!("   Timeout: {:?} seconds", production_client.getConfig().timeout);
    
    println!("\n🎉 All examples completed successfully!");
    Ok(())
}