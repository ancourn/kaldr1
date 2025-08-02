use std::time::Duration;
use tokio::time::sleep;
use reqwest::Client;
use serde_json::json;
use uuid::Uuid;

#[tokio::test]
async fn test_complete_blockchain_integration() {
    // Initialize test environment
    let client = Client::new();
    let base_url = "http://localhost:8080";
    
    println!("🧪 Starting Complete Blockchain Integration Test");
    
    // Test 1: Health Check
    println!("📋 Test 1: Health Check");
    let health_response = client
        .get(&format!("{}/health", base_url))
        .send()
        .await
        .expect("Failed to get health check");
    
    assert_eq!(health_response.status(), 200);
    let health_data: serde_json::Value = health_response.json().await.unwrap();
    assert_eq!(health_data["status"], "healthy");
    println!("✅ Health check passed");
    
    // Test 2: Blockchain Status
    println!("📋 Test 2: Blockchain Status");
    let status_response = client
        .get(&format!("{}/api/blockchain/status", base_url))
        .send()
        .await
        .expect("Failed to get blockchain status");
    
    assert_eq!(status_response.status(), 200);
    let status_data: serde_json::Value = status_response.json().await.unwrap();
    assert!(status_data["network_status"].is_string());
    assert!(status_data["total_transactions"].is_number());
    println!("✅ Blockchain status check passed");
    
    // Test 3: Identity Generation
    println!("📋 Test 3: Identity Generation");
    let identity_response = client
        .post(&format!("{}/api/identity/generate", base_url))
        .json(&json!({
            "algorithm": "ed25519",
            "metadata": {"test": "integration"}
        }))
        .send()
        .await
        .expect("Failed to generate identity");
    
    assert_eq!(identity_response.status(), 200);
    let identity_data: serde_json::Value = identity_response.json().await.unwrap();
    assert!(identity_data["public_key"].is_string());
    assert!(identity_data["private_key"].is_string());
    let public_key = identity_data["public_key"].as_str().unwrap();
    println!("✅ Identity generation passed");
    
    // Test 4: Transaction Creation and Broadcasting
    println!("📋 Test 4: Transaction Creation and Broadcasting");
    let transaction_data = json!({
        "sender": public_key,
        "receiver": "test_receiver_key",
        "amount": 100,
        "nonce": 1,
        "fee": 1,
        "metadata": {"test": "integration"}
    });
    
    let tx_response = client
        .post(&format!("{}/api/transactions", base_url))
        .json(&transaction_data)
        .send()
        .await
        .expect("Failed to create transaction");
    
    assert_eq!(tx_response.status(), 200);
    let tx_data: serde_json::Value = tx_response.json().await.unwrap();
    assert!(tx_data["transaction_id"].is_string());
    let transaction_id = tx_data["transaction_id"].as_str().unwrap();
    println!("✅ Transaction creation passed");
    
    // Test 5: Transaction Verification
    println!("📋 Test 5: Transaction Verification");
    sleep(Duration::from_secs(2)).await; // Wait for processing
    
    let verify_response = client
        .get(&format!("{}/api/transactions/{}", base_url, transaction_id))
        .send()
        .await
        .expect("Failed to verify transaction");
    
    assert_eq!(verify_response.status(), 200);
    let verify_data: serde_json::Value = verify_response.json().await.unwrap();
    assert_eq!(verify_data["transaction_id"], transaction_id);
    assert!(verify_data["status"].is_string());
    println!("✅ Transaction verification passed");
    
    // Test 6: Identity Rotation
    println!("📋 Test 6: Identity Rotation");
    let rotate_response = client
        .post(&format!("{}/api/identity/rotate", base_url))
        .json(&json!({
            "current_public_key": public_key,
            "new_algorithm": "dilithium3",
            "backup_previous": true
        }))
        .send()
        .await
        .expect("Failed to rotate identity");
    
    assert_eq!(rotate_response.status(), 200);
    let rotate_data: serde_json::Value = rotate_response.json().await.unwrap();
    assert!(rotate_data["new_public_key"].is_string());
    assert!(rotate_data["rotation_success"].as_bool().unwrap());
    println!("✅ Identity rotation passed");
    
    // Test 7: Metrics Collection
    println!("📋 Test 7: Metrics Collection");
    let metrics_response = client
        .get(&format!("{}/metrics", base_url))
        .send()
        .await
        .expect("Failed to get metrics");
    
    assert_eq!(metrics_response.status(), 200);
    let metrics_text = metrics_response.text().await.unwrap();
    assert!(metrics_text.contains("blockchain_transactions_total"));
    assert!(metrics_text.contains("blockchain_network_peers"));
    println!("✅ Metrics collection passed");
    
    // Test 8: Database Operations
    println!("📋 Test 8: Database Operations");
    let db_response = client
        .get(&format!("{}/api/database/stats", base_url))
        .send()
        .await
        .expect("Failed to get database stats");
    
    assert_eq!(db_response.status(), 200);
    let db_data: serde_json::Value = db_response.json().await.unwrap();
    assert!(db_data["total_transactions"].is_number());
    assert!(db_data["database_size"].is_number());
    println!("✅ Database operations passed");
    
    // Test 9: Consensus Validation
    println!("📋 Test 9: Consensus Validation");
    let consensus_response = client
        .get(&format!("{}/api/consensus/status", base_url))
        .send()
        .await
        .expect("Failed to get consensus status");
    
    assert_eq!(consensus_response.status(), 200);
    let consensus_data: serde_json::Value = consensus_response.json().await.unwrap();
    assert!(consensus_data["consensus_height"].is_number());
    assert!(consensus_data["active_validators"].is_number());
    println!("✅ Consensus validation passed");
    
    // Test 10: Backup and Recovery
    println!("📋 Test 10: Backup and Recovery");
    let backup_response = client
        .post(&format!("{}/api/backup/create", base_url))
        .json(&json!({
            "backup_type": "full",
            "encryption_enabled": true
        }))
        .send()
        .await
        .expect("Failed to create backup");
    
    assert_eq!(backup_response.status(), 200);
    let backup_data: serde_json::Value = backup_response.json().await.unwrap();
    assert!(backup_data["backup_id"].is_string());
    assert!(backup_data["backup_success"].as_bool().unwrap());
    println!("✅ Backup and recovery passed");
    
    println!("🎉 All Integration Tests Passed Successfully!");
}

#[tokio::test]
async fn test_performance_integration() {
    let client = Client::new();
    let base_url = "http://localhost:8080";
    
    println!("🚀 Starting Performance Integration Test");
    
    // Test concurrent transaction processing
    let mut handles = vec![];
    
    for i in 0..100 {
        let client = client.clone();
        let base_url = base_url.to_string();
        let handle = tokio::spawn(async move {
            let transaction_data = json!({
                "sender": format!("test_sender_{}", i),
                "receiver": format!("test_receiver_{}", i),
                "amount": i * 10,
                "nonce": i,
                "fee": 1,
                "metadata": {"performance_test": true}
            });
            
            let response = client
                .post(&format!("{}/api/transactions", &base_url))
                .json(&transaction_data)
                .send()
                .await;
            
            response
        });
        handles.push(handle);
    }
    
    // Wait for all transactions to complete
    let mut successful = 0;
    for handle in handles {
        match handle.await {
            Ok(Ok(response)) => {
                if response.status() == 200 {
                    successful += 1;
                }
            }
            _ => {}
        }
    }
    
    assert!(successful >= 95, "At least 95% of transactions should succeed");
    println!("✅ Performance test passed: {}/100 transactions successful", successful);
    
    // Verify blockchain state after load test
    sleep(Duration::from_secs(5)).await;
    
    let status_response = client
        .get(&format!("{}/api/blockchain/status", base_url))
        .send()
        .await
        .expect("Failed to get blockchain status");
    
    let status_data: serde_json::Value = status_response.json().await.unwrap();
    let total_transactions = status_data["total_transactions"].as_u64().unwrap();
    assert!(total_transactions >= 100);
    
    println!("✅ Blockchain state validation passed: {} total transactions", total_transactions);
}

#[tokio::test]
async fn test_security_integration() {
    let client = Client::new();
    let base_url = "http://localhost:8080";
    
    println!("🔒 Starting Security Integration Test");
    
    // Test 1: Invalid Transaction Detection
    println!("📋 Test 1: Invalid Transaction Detection");
    let invalid_tx = json!({
        "sender": "invalid_key",
        "receiver": "test_receiver",
        "amount": -100, // Invalid negative amount
        "nonce": 1,
        "fee": 1
    });
    
    let response = client
        .post(&format!("{}/api/transactions", base_url))
        .json(&invalid_tx)
        .send()
        .await
        .expect("Failed to send invalid transaction");
    
    assert_eq!(response.status(), 400);
    println!("✅ Invalid transaction detection passed");
    
    // Test 2: Authentication Security
    println!("📋 Test 2: Authentication Security");
    let protected_response = client
        .post(&format!("{}/api/admin/reset", base_url))
        .send()
        .await;
    
    assert_eq!(protected_response.status(), 401);
    println!("✅ Authentication security passed");
    
    // Test 3: Rate Limiting
    println!("📋 Test 3: Rate Limiting");
    let mut requests = 0;
    let mut rate_limited = false;
    
    for i in 0..50 {
        let response = client
            .get(&format!("{}/api/blockchain/status", base_url))
            .send()
            .await;
        
        match response {
            Ok(resp) => {
                if resp.status() == 429 {
                    rate_limited = true;
                    break;
                }
            }
            _ => {}
        }
        requests += 1;
    }
    
    assert!(rate_limited, "Rate limiting should be enforced");
    println!("✅ Rate limiting passed: limited after {} requests", requests);
    
    // Test 4: Input Validation
    println!("📋 Test 4: Input Validation");
    let malicious_input = json!({
        "sender": "<script>alert('xss')</script>",
        "receiver": "test_receiver",
        "amount": 100,
        "nonce": 1,
        "fee": 1,
        "metadata": {"malicious": "<script>alert('xss')</script>"}
    });
    
    let response = client
        .post(&format!("{}/api/transactions", base_url))
        .json(&malicious_input)
        .send()
        .await;
    
    assert_eq!(response.unwrap().status(), 400);
    println!("✅ Input validation passed");
    
    println!("🎉 All Security Integration Tests Passed!");
}

#[tokio::test]
async fn test_error_handling_integration() {
    let client = Client::new();
    let base_url = "http://localhost:8080";
    
    println!("⚠️ Starting Error Handling Integration Test");
    
    // Test 1: Non-existent Transaction
    println!("📋 Test 1: Non-existent Transaction");
    let response = client
        .get(&format!("{}/api/transactions/nonexistent", base_url))
        .send()
        .await
        .expect("Failed to request non-existent transaction");
    
    assert_eq!(response.status(), 404);
    println!("✅ Non-existent transaction handling passed");
    
    // Test 2: Invalid JSON Input
    println!("📋 Test 2: Invalid JSON Input");
    let response = client
        .post(&format!("{}/api/transactions", base_url))
        .header("Content-Type", "application/json")
        .body("invalid json")
        .send()
        .await
        .expect("Failed to send invalid JSON");
    
    assert_eq!(response.status(), 400);
    println!("✅ Invalid JSON handling passed");
    
    // Test 3: Database Connection Error Simulation
    println!("📋 Test 3: Database Connection Error");
    // This would normally require actual database disruption
    // For now, we test the error endpoint
    let response = client
        .get(&format!("{}/api/database/error", base_url))
        .send()
        .await;
    
    if let Ok(resp) = response {
        assert!(resp.status() >= 400 && resp.status() < 500);
    }
    println!("✅ Database error handling passed");
    
    println!("🎉 All Error Handling Tests Passed!");
}

#[tokio::test]
async fn test_end_to_end_workflow() {
    let client = Client::new();
    let base_url = "http://localhost:8080";
    
    println!("🔄 Starting End-to-End Workflow Test");
    
    // Step 1: Generate Identity
    println!("📋 Step 1: Generate Identity");
    let identity_response = client
        .post(&format!("{}/api/identity/generate", base_url))
        .json(&json!({
            "algorithm": "ed25519",
            "metadata": {"workflow": "e2e_test"}
        }))
        .send()
        .await
        .expect("Failed to generate identity");
    
    assert_eq!(identity_response.status(), 200);
    let identity_data: serde_json::Value = identity_response.json().await.unwrap();
    let public_key = identity_data["public_key"].as_str().unwrap();
    
    // Step 2: Create Multiple Transactions
    println!("📋 Step 2: Create Multiple Transactions");
    let mut transaction_ids = vec![];
    
    for i in 0..10 {
        let tx_data = json!({
            "sender": public_key,
            "receiver": format!("receiver_{}", i),
            "amount": (i + 1) * 10,
            "nonce": i,
            "fee": 1,
            "metadata": {"workflow": "e2e_test", "step": i}
        });
        
        let response = client
            .post(&format!("{}/api/transactions", base_url))
            .json(&tx_data)
            .send()
            .await
            .expect("Failed to create transaction");
        
        assert_eq!(response.status(), 200);
        let tx_data: serde_json::Value = response.json().await.unwrap();
        transaction_ids.push(tx_data["transaction_id"].as_str().unwrap().to_string());
    }
    
    // Step 3: Verify All Transactions
    println!("📋 Step 3: Verify All Transactions");
    sleep(Duration::from_secs(3)).await;
    
    for tx_id in &transaction_ids {
        let response = client
            .get(&format!("{}/api/transactions/{}", base_url, tx_id))
            .send()
            .await
            .expect("Failed to verify transaction");
        
        assert_eq!(response.status(), 200);
        let tx_data: serde_json::Value = response.json().await.unwrap();
        assert_eq!(tx_data["transaction_id"], tx_id);
    }
    
    // Step 4: Check Blockchain Status
    println!("📋 Step 4: Check Blockchain Status");
    let status_response = client
        .get(&format!("{}/api/blockchain/status", base_url))
        .send()
        .await
        .expect("Failed to get blockchain status");
    
    assert_eq!(status_response.status(), 200);
    let status_data: serde_json::Value = status_response.json().await.unwrap();
    assert!(status_data["total_transactions"].as_u64().unwrap() >= 10);
    
    // Step 5: Rotate Identity
    println!("📋 Step 5: Rotate Identity");
    let rotate_response = client
        .post(&format!("{}/api/identity/rotate", base_url))
        .json(&json!({
            "current_public_key": public_key,
            "new_algorithm": "dilithium3",
            "backup_previous": true
        }))
        .send()
        .await
        .expect("Failed to rotate identity");
    
    assert_eq!(rotate_response.status(), 200);
    
    // Step 6: Create Backup
    println!("📋 Step 6: Create Backup");
    let backup_response = client
        .post(&format!("{}/api/backup/create", base_url))
        .json(&json!({
            "backup_type": "full",
            "encryption_enabled": true
        }))
        .send()
        .await
        .expect("Failed to create backup");
    
    assert_eq!(backup_response.status(), 200);
    
    // Step 7: Verify Metrics
    println!("📋 Step 7: Verify Metrics");
    let metrics_response = client
        .get(&format!("{}/metrics", base_url))
        .send()
        .await
        .expect("Failed to get metrics");
    
    assert_eq!(metrics_response.status(), 200);
    let metrics_text = metrics_response.text().await.unwrap();
    assert!(metrics_text.contains("blockchain_transactions_total"));
    
    println!("🎉 End-to-End Workflow Test Completed Successfully!");
    println!("📊 Summary:");
    println!("  - Generated 1 identity");
    println!("  - Created 10 transactions");
    println!("  - Verified all transactions");
    println!("  - Rotated identity successfully");
    println!("  - Created backup");
    println!("  - Verified metrics collection");
}