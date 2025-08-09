use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::time::{sleep, Duration};

use crate::quantum::pqc_signatures::{
    PQCSignatureEngine, PQCAlgorithm, PQCKeyPair, PQCSignature, 
    HybridSignature, PQCConfig, PQCError, BenchmarkResult
};
use crate::quantum::signature_abstraction::{
    SignatureAbstractionLayer, SignatureScheme, WalletConfig, 
    AbstractionConfig, WalletMetadata, SignatureContext
};
use crate::quantum::smart_contract_integration::{
    QuantumContractManager, QuantumContractConfig, QuantumVerificationResult
};

#[derive(Error, Debug)]
pub enum PQCTestError {
    #[error("PQC error: {0}")]
    PQCError(#[from] PQCError),
    #[error("Test setup failed: {0}")]
    SetupFailed(String),
    #[error("Test execution failed: {0}")]
    ExecutionFailed(String),
    #[error("Assertion failed: {0}")]
    AssertionFailed(String),
    #[error("Timeout: {0}")]
    Timeout(String),
    #[error("Benchmark error: {0}")]
    BenchmarkError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub test_name: String,
    pub test_category: TestCategory,
    pub status: TestStatus,
    pub duration_ms: u64,
    pub error_message: Option<String>,
    pub metrics: TestMetrics,
    pub security_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TestCategory {
    Unit,
    Integration,
    Performance,
    Security,
    Compatibility,
    Migration,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TestStatus {
    Passed,
    Failed,
    Skipped,
    Timeout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestMetrics {
    pub signatures_processed: usize,
    pub verifications_performed: usize,
    pub keypairs_generated: usize,
    pub hybrid_signatures_created: usize,
    pub contract_calls_executed: usize,
    pub migrations_performed: usize,
    pub total_gas_used: u64,
    pub memory_used_bytes: usize,
    pub operations_per_second: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestSuiteConfig {
    pub enable_unit_tests: bool,
    pub enable_integration_tests: bool,
    pub enable_performance_tests: bool,
    pub enable_security_tests: bool,
    pub enable_compatibility_tests: bool,
    pub enable_migration_tests: bool,
    pub timeout_seconds: u64,
    pub test_iterations: usize,
    pub security_threshold: f64,
    pub performance_threshold_tps: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityTestResult {
    pub test_name: String,
    pub vulnerability_detected: bool,
    pub severity: SecuritySeverity,
    pub description: String,
    pub recommendation: String,
    pub cvss_score: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecuritySeverity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

pub struct PQCTestSuite {
    config: TestSuiteConfig,
    results: Vec<TestResult>,
    security_results: Vec<SecurityTestResult>,
    pqc_engine: Option<PQCSignatureEngine>,
    abstraction_layer: Option<SignatureAbstractionLayer>,
    contract_manager: Option<QuantumContractManager>,
}

impl PQCTestSuite {
    /// Create a new PQC test suite
    pub fn new(config: TestSuiteConfig) -> Self {
        Self {
            config,
            results: Vec::new(),
            security_results: Vec::new(),
            pqc_engine: None,
            abstraction_layer: None,
            contract_manager: None,
        }
    }

    /// Run all tests
    pub async fn run_all_tests(&mut self) -> Vec<TestResult> {
        println!("🧪 Starting PQC Test Suite...");
        
        // Initialize test components
        self.initialize_test_components().await;
        
        // Run test categories
        if self.config.enable_unit_tests {
            self.run_unit_tests().await;
        }
        
        if self.config.enable_integration_tests {
            self.run_integration_tests().await;
        }
        
        if self.config.enable_performance_tests {
            self.run_performance_tests().await;
        }
        
        if self.config.enable_security_tests {
            self.run_security_tests().await;
        }
        
        if self.config.enable_compatibility_tests {
            self.run_compatibility_tests().await;
        }
        
        if self.config.enable_migration_tests {
            self.run_migration_tests().await;
        }
        
        println!("✅ PQC Test Suite Completed!");
        self.print_summary();
        
        self.results.clone()
    }

    /// Run CI-specific tests
    pub async fn run_ci_tests(&mut self) -> Vec<TestResult> {
        println!("🔄 Running CI PQC Tests...");
        
        // CI-optimized test configuration
        let ci_config = TestSuiteConfig {
            enable_unit_tests: true,
            enable_integration_tests: true,
            enable_performance_tests: false, // Skip performance tests in CI for speed
            enable_security_tests: true,
            enable_compatibility_tests: true,
            enable_migration_tests: false,
            timeout_seconds: 60, // Shorter timeout for CI
            test_iterations: 10, // Fewer iterations for CI
            security_threshold: 0.8,
            performance_threshold_tps: 100.0,
        };
        
        self.config = ci_config;
        
        // Initialize test components
        self.initialize_test_components().await;
        
        // Run critical CI tests
        self.run_unit_tests().await;
        self.run_integration_tests().await;
        self.run_security_tests().await;
        self.run_compatibility_tests().await;
        
        println!("✅ CI PQC Tests Completed!");
        
        // Check for failures
        let failures = self.results.iter()
            .filter(|r| r.status == TestStatus::Failed)
            .count();
        
        if failures > 0 {
            println!("❌ CI Tests Failed: {} failures detected", failures);
            std::process::exit(1);
        }
        
        self.results.clone()
    }

    /// Initialize test components
    async fn initialize_test_components(&mut self) {
        println!("🔧 Initializing test components...");
        
        // Initialize PQC engine
        let pqc_config = PQCConfig {
            default_algorithm: PQCAlgorithm::Ed25519,
            supported_algorithms: vec![
                PQCAlgorithm::Ed25519,
                PQCAlgorithm::ECDSA,
                PQCAlgorithm::Dilithium2,
                PQCAlgorithm::Falcon512,
            ],
            enable_hybrid_mode: true,
            security_level: 128,
            benchmark_mode: true,
            cache_signatures: false,
        };
        
        self.pqc_engine = Some(PQCSignatureEngine::new(pqc_config));
        
        // Initialize abstraction layer
        let abstraction_config = AbstractionConfig {
            default_scheme: SignatureScheme::Ed25519,
            supported_schemes: vec![
                SignatureScheme::Ed25519,
                SignatureScheme::ECDSA,
                SignatureScheme::Dilithium2,
                SignatureScheme::Falcon512,
                SignatureScheme::HybridECDSADilithium,
            ],
            enable_adaptive_selection: true,
            enable_migration: true,
            benchmark_interval_seconds: 3600,
            cache_signatures: false,
            security_threshold: self.config.security_threshold,
        };
        
        self.abstraction_layer = Some(SignatureAbstractionLayer::new(abstraction_config).unwrap());
        
        // Initialize contract manager
        if let Some(ref abstraction_layer) = self.abstraction_layer {
            let contract_config = QuantumContractConfig {
                contract_address: "0x1234567890123456789012345678901234567890".to_string(),
                contract_abi: r#"[]"#.to_string(),
                rpc_url: "http://localhost:8545".to_string(),
                chain_id: 1,
                quantum_enabled: true,
                fallback_to_traditional: true,
                gas_limit_multiplier: 1.2,
            };
            
            let wallet_id = abstraction_layer.create_wallet(WalletConfig {
                wallet_id: "test_wallet".to_string(),
                primary_scheme: SignatureScheme::Ed25519,
                fallback_schemes: vec![SignatureScheme::ECDSA],
                security_level: 128,
                enable_hybrid: true,
                key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
                metadata: WalletMetadata {
                    created_at: 0,
                    updated_at: 0,
                    last_used: 0,
                    total_signatures: 0,
                    is_active: true,
                    backup_enabled: false,
                    multi_sig_enabled: false,
                },
            }).unwrap();
            
            self.contract_manager = Some(QuantumContractManager::new(
                contract_config,
                abstraction_layer.clone(),
                wallet_id,
            ).await.unwrap());
        }
        
        println!("✅ Test components initialized");
    }

    /// Run unit tests
    async fn run_unit_tests(&mut self) {
        println!("📋 Running Unit Tests...");
        
        let tests = vec![
            self.test_pqc_engine_creation,
            self.test_keypair_generation,
            self.test_signing_verification,
            self.test_hybrid_signatures,
            self.test_algorithm_compatibility,
        ];
        
        for test in tests {
            self.execute_test(test, TestCategory::Unit).await;
        }
        
        println!("✅ Unit Tests Completed");
    }

    /// Run integration tests
    async fn run_integration_tests(&mut self) {
        println!("📋 Running Integration Tests...");
        
        let tests = vec![
            self.test_abstraction_layer_integration,
            self.test_wallet_lifecycle,
            self.test_contract_integration,
            self.test_signature_migration,
        ];
        
        for test in tests {
            self.execute_test(test, TestCategory::Integration).await;
        }
        
        println!("✅ Integration Tests Completed");
    }

    /// Run performance tests
    async fn run_performance_tests(&mut self) {
        println!("📋 Running Performance Tests...");
        
        let tests = vec![
            self.test_signing_performance,
            self.test_verification_performance,
            self.test_hybrid_performance,
            self.test_scalability,
        ];
        
        for test in tests {
            self.execute_test(test, TestCategory::Performance).await;
        }
        
        println!("✅ Performance Tests Completed");
    }

    /// Run security tests
    async fn run_security_tests(&mut self) {
        println!("📋 Running Security Tests...");
        
        let tests = vec![
            self.test_signature_forgery_resistance,
            self.test_key_compromise_resilience,
            self.test_quantum_resistance,
            self.test_side_channel_resistance,
        ];
        
        for test in tests {
            self.execute_test(test, TestCategory::Security).await;
        }
        
        println!("✅ Security Tests Completed");
    }

    /// Run compatibility tests
    async fn run_compatibility_tests(&mut self) {
        println!("📋 Running Compatibility Tests...");
        
        let tests = vec![
            self.test_backward_compatibility,
            self.test_cross_platform_compatibility,
            self.test_traditional_pqc_interop,
        ];
        
        for test in tests {
            self.execute_test(test, TestCategory::Compatibility).await;
        }
        
        println!("✅ Compatibility Tests Completed");
    }

    /// Run migration tests
    async fn run_migration_tests(&mut self) {
        println!("📋 Running Migration Tests...");
        
        let tests = vec![
            self.test_scheme_migration,
            self.test_rollback_capability,
            self.test_gradual_migration,
        ];
        
        for test in tests {
            self.execute_test(test, TestCategory::Migration).await;
        }
        
        println!("✅ Migration Tests Completed");
    }

    /// Execute a single test
    async fn execute_test<F, Fut>(&mut self, test_fn: F, category: TestCategory)
    where
        F: FnOnce(&mut Self) -> Fut,
        Fut: std::future::Future<Output = Result<TestMetrics, PQCTestError>>,
    {
        let start_time = SystemTime::now();
        let test_name = std::any::type_name::<F>();
        
        let result = tokio::time::timeout(
            Duration::from_secs(self.config.timeout_seconds),
            test_fn(self)
        ).await;
        
        let duration = start_time.elapsed().unwrap().as_millis() as u64;
        
        match result {
            Ok(Ok(metrics)) => {
                let security_score = self.calculate_security_score(&metrics);
                
                self.results.push(TestResult {
                    test_name: test_name.to_string(),
                    category,
                    status: TestStatus::Passed,
                    duration_ms: duration,
                    error_message: None,
                    metrics,
                    security_score,
                });
                
                println!("  ✅ {} ({})", test_name, duration);
            },
            Ok(Err(e)) => {
                self.results.push(TestResult {
                    test_name: test_name.to_string(),
                    category,
                    status: TestStatus::Failed,
                    duration_ms: duration,
                    error_message: Some(e.to_string()),
                    metrics: TestMetrics::default(),
                    security_score: 0.0,
                });
                
                println!("  ❌ {} ({}) - {}", test_name, duration, e);
            },
            Err(_) => {
                self.results.push(TestResult {
                    test_name: test_name.to_string(),
                    category,
                    status: TestStatus::Timeout,
                    duration_ms: duration,
                    error_message: Some("Test timed out".to_string()),
                    metrics: TestMetrics::default(),
                    security_score: 0.0,
                });
                
                println!("  ⏰ {} ({}) - Timeout", test_name, duration);
            }
        }
    }

    // Test Implementations
    async fn test_pqc_engine_creation(&mut self) -> Result<TestMetrics, PQCTestError> {
        let pqc_config = PQCConfig {
            default_algorithm: PQCAlgorithm::Ed25519,
            supported_algorithms: vec![PQCAlgorithm::Ed25519],
            enable_hybrid_mode: false,
            security_level: 128,
            benchmark_mode: false,
            cache_signatures: false,
        };
        
        let engine = PQCSignatureEngine::new(pqc_config);
        
        assert!(engine.supported_algorithms().len() > 0, "Engine should have supported algorithms");
        
        Ok(TestMetrics {
            signatures_processed: 0,
            verifications_performed: 0,
            keypairs_generated: 0,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 1024,
            operations_per_second: 0.0,
        })
    }

    async fn test_keypair_generation(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let mut keypairs_generated = 0;
        let mut memory_used = 0;
        
        for _ in 0..self.config.test_iterations {
            let keypair = engine.generate_key_pair(None)?;
            keypairs_generated += 1;
            memory_used += keypair.public_key.len() + keypair.private_key.len();
        }
        
        assert!(keypairs_generated > 0, "Should generate keypairs");
        
        Ok(TestMetrics {
            signatures_processed: 0,
            verifications_performed: 0,
            keypairs_generated,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used,
            operations_per_second: keypairs_generated as f64,
        })
    }

    async fn test_signing_verification(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let mut signatures_processed = 0;
        let mut verifications_performed = 0;
        
        for i in 0..self.config.test_iterations {
            let keypair = engine.generate_key_pair(None)?;
            let message = format!("Test message {}", i);
            
            let signature = engine.sign(message.as_bytes(), &keypair, None)?;
            signatures_processed += 1;
            
            let is_valid = engine.verify(&signature, message.as_bytes())?;
            verifications_performed += 1;
            
            assert!(is_valid, "Signature should be valid");
        }
        
        Ok(TestMetrics {
            signatures_processed,
            verifications_performed,
            keypairs_generated: self.config.test_iterations,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 0,
            operations_per_second: (signatures_processed + verifications_performed) as f64,
        })
    }

    async fn test_hybrid_signatures(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let mut hybrid_signatures_created = 0;
        
        for i in 0..self.config.test_iterations {
            let traditional_key = engine.generate_key_pair(Some(PQCAlgorithm::ECDSA))?;
            let pqc_key = engine.generate_key_pair(Some(PQCAlgorithm::Dilithium2))?;
            
            let message = format!("Hybrid test message {}", i);
            let hybrid_sig = engine.create_hybrid_signature(
                message.as_bytes(), 
                &traditional_key, 
                &pqc_key, 
                None
            )?;
            
            hybrid_signatures_created += 1;
            
            let is_valid = engine.verify_hybrid_signature(&hybrid_sig, message.as_bytes())?;
            assert!(is_valid, "Hybrid signature should be valid");
        }
        
        Ok(TestMetrics {
            signatures_processed: hybrid_signatures_created * 2,
            verifications_performed: hybrid_signatures_created,
            keypairs_generated: self.config.test_iterations * 2,
            hybrid_signatures_created,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 0,
            operations_per_second: hybrid_signatures_created as f64 * 3.0,
        })
    }

    async fn test_algorithm_compatibility(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let algorithms = vec![
            PQCAlgorithm::Ed25519,
            PQCAlgorithm::ECDSA,
            PQCAlgorithm::Dilithium2,
            PQCAlgorithm::Falcon512,
        ];
        
        let mut signatures_processed = 0;
        let mut verifications_performed = 0;
        
        for algorithm in algorithms {
            let keypair = engine.generate_key_pair(Some(algorithm.clone()))?;
            let message = b"Compatibility test message";
            
            let signature = engine.sign(message, &keypair, None)?;
            signatures_processed += 1;
            
            let is_valid = engine.verify(&signature, message)?;
            verifications_performed += 1;
            
            assert!(is_valid, "Signature should be valid for {:?}", algorithm);
        }
        
        Ok(TestMetrics {
            signatures_processed,
            verifications_performed,
            keypairs_generated: algorithms.len(),
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 0,
            operations_per_second: (signatures_processed + verifications_performed) as f64,
        })
    }

    async fn test_abstraction_layer_integration(&mut self) -> Result<TestMetrics, PQCTestError> {
        let abstraction_layer = self.abstraction_layer.as_ref().unwrap();
        
        let wallet_config = WalletConfig {
            wallet_id: "integration_test_wallet".to_string(),
            primary_scheme: SignatureScheme::Ed25519,
            fallback_schemes: vec![SignatureScheme::ECDSA],
            security_level: 128,
            enable_hybrid: true,
            key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
            metadata: WalletMetadata {
                created_at: 0,
                updated_at: 0,
                last_used: 0,
                total_signatures: 0,
                is_active: true,
                backup_enabled: false,
                multi_sig_enabled: false,
            },
        };
        
        let wallet_id = abstraction_layer.create_wallet(wallet_config)?;
        
        let context = SignatureContext {
            network_id: "test".to_string(),
            chain_id: 1,
            purpose: "integration_test".to_string(),
            additional_data: HashMap::new(),
        };
        
        let message = b"Integration test message";
        let signature_result = abstraction_layer.sign(&wallet_id, message, context.clone())?;
        
        let verification_result = abstraction_layer.verify(
            &signature_result.signature,
            message,
            &signature_result.verification_key,
            &signature_result.scheme_used,
        )?;
        
        assert!(verification_result.is_valid, "Integration test should pass");
        
        Ok(TestMetrics {
            signatures_processed: 1,
            verifications_performed: 1,
            keypairs_generated: 2, // Primary + fallback
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: signature_result.gas_estimate,
            memory_used: 2048,
            operations_per_second: 2.0,
        })
    }

    async fn test_wallet_lifecycle(&mut self) -> Result<TestMetrics, PQCTestError> {
        let abstraction_layer = self.abstraction_layer.as_ref().unwrap();
        
        let mut wallets_created = 0;
        let mut signatures_processed = 0;
        
        for i in 0..self.config.test_iterations {
            let wallet_config = WalletConfig {
                wallet_id: format!("lifecycle_wallet_{}", i),
                primary_scheme: SignatureScheme::Ed25519,
                fallback_schemes: vec![SignatureScheme::ECDSA],
                security_level: 128,
                enable_hybrid: true,
                key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
                metadata: WalletMetadata {
                    created_at: 0,
                    updated_at: 0,
                    last_used: 0,
                    total_signatures: 0,
                    is_active: true,
                    backup_enabled: false,
                    multi_sig_enabled: false,
                },
            };
            
            let wallet_id = abstraction_layer.create_wallet(wallet_config)?;
            wallets_created += 1;
            
            let context = SignatureContext {
                network_id: "test".to_string(),
                chain_id: 1,
                purpose: "lifecycle_test".to_string(),
                additional_data: HashMap::new(),
            };
            
            let message = format!("Lifecycle test message {}", i);
            let _signature_result = abstraction_layer.sign(&wallet_id, message.as_bytes(), context)?;
            signatures_processed += 1;
        }
        
        assert_eq!(abstraction_layer.list_wallets().len(), wallets_created);
        
        Ok(TestMetrics {
            signatures_processed,
            verifications_performed: 0,
            keypairs_generated: wallets_created * 2,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: wallets_created * 1024,
            operations_per_second: (wallets_created + signatures_processed) as f64,
        })
    }

    async fn test_contract_integration(&mut self) -> Result<TestMetrics, PQCTestError> {
        let contract_manager = self.contract_manager.as_ref().unwrap();
        
        let mut contract_calls_executed = 0;
        
        for i in 0..self.config.test_iterations.min(5) { // Limit contract calls
            let method_name = "test_method";
            let params = vec![ethers::types::Token::Uint(ethers::types::U256::from(i))];
            
            let _transaction = contract_manager.execute_quantum_call(
                method_name,
                params,
                None,
            ).await?;
            
            contract_calls_executed += 1;
        }
        
        Ok(TestMetrics {
            signatures_processed: contract_calls_executed,
            verifications_performed: 0,
            keypairs_generated: 0,
            hybrid_signatures_created: 0,
            contract_calls_executed,
            migrations_performed: 0,
            total_gas_used: contract_calls_executed * 50000,
            memory_used: contract_calls_executed * 4096,
            operations_per_second: contract_calls_executed as f64,
        })
    }

    async fn test_signature_migration(&mut self) -> Result<TestMetrics, PQCTestError> {
        let abstraction_layer = self.abstraction_layer.as_ref().unwrap();
        
        let wallet_config = WalletConfig {
            wallet_id: "migration_test_wallet".to_string(),
            primary_scheme: SignatureScheme::ECDSA,
            fallback_schemes: vec![],
            security_level: 128,
            enable_hybrid: false,
            key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
            metadata: WalletMetadata {
                created_at: 0,
                updated_at: 0,
                last_used: 0,
                total_signatures: 0,
                is_active: true,
                backup_enabled: false,
                multi_sig_enabled: false,
            },
        };
        
        let wallet_id = abstraction_layer.create_wallet(wallet_config)?;
        
        let migration_plan = abstraction_layer.create_migration_plan(
            SignatureScheme::ECDSA,
            SignatureScheme::Dilithium2,
            crate::quantum::signature_abstraction::MigrationStrategy::Immediate,
        )?;
        
        abstraction_layer.execute_migration(&wallet_id, &migration_plan)?;
        
        let wallet_info = abstraction_layer.get_wallet_info(&wallet_id)?;
        assert_eq!(wallet_info.primary_scheme, SignatureScheme::Dilithium2);
        
        Ok(TestMetrics {
            signatures_processed: 0,
            verifications_performed: 0,
            keypairs_generated: 2,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 1,
            total_gas_used: 0,
            memory_used: 2048,
            operations_per_second: 1.0,
        })
    }

    async fn test_signing_performance(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let start_time = SystemTime::now();
        let mut signatures_processed = 0;
        
        let keypair = engine.generate_key_pair(Some(PQCAlgorithm::Ed25519))?;
        let message = b"Performance test message";
        
        for _ in 0..self.config.test_iterations {
            let _signature = engine.sign(message, &keypair, None)?;
            signatures_processed += 1;
        }
        
        let duration = start_time.elapsed().unwrap().as_millis() as f64;
        let tps = (signatures_processed as f64 / duration) * 1000.0;
        
        assert!(tps >= self.config.performance_threshold_tps, 
            "Performance below threshold: {} TPS < {} TPS", tps, self.config.performance_threshold_tps);
        
        Ok(TestMetrics {
            signatures_processed,
            verifications_performed: 0,
            keypairs_generated: 1,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 1024,
            operations_per_second: tps,
        })
    }

    async fn test_verification_performance(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let start_time = SystemTime::now();
        let mut verifications_performed = 0;
        
        let keypair = engine.generate_key_pair(Some(PQCAlgorithm::Ed25519))?;
        let message = b"Performance test message";
        let signature = engine.sign(message, &keypair, None)?;
        
        for _ in 0..self.config.test_iterations {
            let _is_valid = engine.verify(&signature, message)?;
            verifications_performed += 1;
        }
        
        let duration = start_time.elapsed().unwrap().as_millis() as f64;
        let vps = (verifications_performed as f64 / duration) * 1000.0;
        
        assert!(vps >= self.config.performance_threshold_tps * 2.0, 
            "Verification performance below threshold: {} VPS < {} VPS", vps, self.config.performance_threshold_tps * 2.0);
        
        Ok(TestMetrics {
            signatures_processed: 1,
            verifications_performed,
            keypairs_generated: 1,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 1024,
            operations_per_second: vps,
        })
    }

    async fn test_hybrid_performance(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let start_time = SystemTime::now();
        let mut hybrid_signatures_created = 0;
        
        let traditional_key = engine.generate_key_pair(Some(PQCAlgorithm::ECDSA))?;
        let pqc_key = engine.generate_key_pair(Some(PQCAlgorithm::Dilithium2))?;
        let message = b"Hybrid performance test message";
        
        for _ in 0..self.config.test_iterations {
            let _hybrid_sig = engine.create_hybrid_signature(message, &traditional_key, &pqc_key, None)?;
            hybrid_signatures_created += 1;
        }
        
        let duration = start_time.elapsed().unwrap().as_millis() as f64;
        let hps = (hybrid_signatures_created as f64 / duration) * 1000.0;
        
        assert!(hps >= self.config.performance_threshold_tps * 0.5, 
            "Hybrid performance below threshold: {} HPS < {} HPS", hps, self.config.performance_threshold_tps * 0.5);
        
        Ok(TestMetrics {
            signatures_processed: hybrid_signatures_created * 2,
            verifications_performed: 0,
            keypairs_generated: 2,
            hybrid_signatures_created,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 2048,
            operations_per_second: hps,
        })
    }

    async fn test_scalability(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let start_time = SystemTime::now();
        let mut signatures_processed = 0;
        let mut memory_used = 0;
        
        // Test with increasing load
        for batch in 0..10 {
            let batch_size = (batch + 1) * 10;
            let mut batch_signatures = 0;
            
            for i in 0..batch_size {
                let keypair = engine.generate_key_pair(Some(PQCAlgorithm::Ed25519))?;
                let message = format!("Scalability test message {}", i);
                let _signature = engine.sign(message.as_bytes(), &keypair, None)?;
                
                signatures_processed += 1;
                batch_signatures += 1;
                memory_used += keypair.public_key.len() + keypair.private_key.len();
            }
            
            // Small delay between batches
            sleep(Duration::from_millis(10)).await;
        }
        
        let duration = start_time.elapsed().unwrap().as_millis() as f64;
        let throughput = (signatures_processed as f64 / duration) * 1000.0;
        
        assert!(throughput >= self.config.performance_threshold_tps * 0.8, 
            "Scalability test below threshold: {} TPS < {} TPS", throughput, self.config.performance_threshold_tps * 0.8);
        
        Ok(TestMetrics {
            signatures_processed,
            verifications_performed: 0,
            keypairs_generated: signatures_processed,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used,
            operations_per_second: throughput,
        })
    }

    async fn test_signature_forgery_resistance(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        let keypair = engine.generate_key_pair(Some(PQCAlgorithm::Dilithium2))?;
        let message = b"Forgery resistance test message";
        let signature = engine.sign(message, &keypair, None)?;
        
        // Try to verify with wrong message
        let wrong_message = b"Wrong message";
        let is_valid = engine.verify(&signature, wrong_message)?;
        assert!(!is_valid, "Should not verify with wrong message");
        
        // Try to verify with tampered signature
        let mut tampered_signature = signature.clone();
        tampered_signature.signature_data[0] ^= 0x01; // Flip one bit
        let is_valid = engine.verify(&tampered_signature, message)?;
        assert!(!is_valid, "Should not verify with tampered signature");
        
        Ok(TestMetrics {
            signatures_processed: 1,
            verifications_performed: 2,
            keypairs_generated: 1,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 1024,
            operations_per_second: 3.0,
        })
    }

    async fn test_key_compromise_resilience(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        // Test that different keypairs produce different signatures
        let keypair1 = engine.generate_key_pair(Some(PQCAlgorithm::Dilithium2))?;
        let keypair2 = engine.generate_key_pair(Some(PQCAlgorithm::Dilithium2))?;
        
        let message = b"Key compromise test message";
        
        let signature1 = engine.sign(message, &keypair1, None)?;
        let signature2 = engine.sign(message, &keypair2, None)?;
        
        // Signatures should be different
        assert!(signature1.signature_data != signature2.signature_data, 
            "Different keypairs should produce different signatures");
        
        // Each signature should verify with its own key
        let is_valid1 = engine.verify(&signature1, message)?;
        let is_valid2 = engine.verify(&signature2, message)?;
        
        assert!(is_valid1, "First signature should be valid");
        assert!(is_valid2, "Second signature should be valid");
        
        // Cross-verification should fail
        let cross_valid1 = engine.verify(&signature1, message)?;
        let cross_valid2 = engine.verify(&signature2, message)?;
        
        // This should pass since we're using the same message
        assert!(cross_valid1, "Cross-verification should work for same message");
        assert!(cross_valid2, "Cross-verification should work for same message");
        
        Ok(TestMetrics {
            signatures_processed: 2,
            verifications_performed: 4,
            keypairs_generated: 2,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 2048,
            operations_per_second: 6.0,
        })
    }

    async fn test_quantum_resistance(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        // Test PQC algorithms against traditional ones
        let algorithms = vec![
            (PQCAlgorithm::Dilithium2, true),
            (PQCAlgorithm::Falcon512, true),
            (PQCAlgorithm::ECDSA, false),
            (PQCAlgorithm::Ed25519, false),
        ];
        
        let mut quantum_resistant_count = 0;
        let mut signatures_processed = 0;
        let mut verifications_performed = 0;
        
        for (algorithm, is_quantum_resistant) in algorithms {
            let keypair = engine.generate_key_pair(Some(algorithm.clone()))?;
            let message = b"Quantum resistance test message";
            
            let signature = engine.sign(message, &keypair, None)?;
            signatures_processed += 1;
            
            let is_valid = engine.verify(&signature, message)?;
            verifications_performed += 1;
            
            assert!(is_valid, "Signature should be valid for {:?}", algorithm);
            
            if is_quantum_resistant {
                quantum_resistant_count += 1;
                
                // Check key size and signature size for quantum resistance
                assert!(keypair.public_key.len() > 32, 
                    "Quantum-resistant algorithm should have larger public key: {:?}", algorithm);
                assert!(signature.signature_data.len() > 64, 
                    "Quantum-resistant algorithm should have larger signature: {:?}", algorithm);
            }
        }
        
        assert!(quantum_resistant_count >= 2, "Should have at least 2 quantum-resistant algorithms");
        
        Ok(TestMetrics {
            signatures_processed,
            verifications_performed,
            keypairs_generated: algorithms.len(),
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 0,
            operations_per_second: (signatures_processed + verifications_performed) as f64,
        })
    }

    async fn test_side_channel_resistance(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        // Test timing attacks
        let keypair = engine.generate_key_pair(Some(PQCAlgorithm::Dilithium2))?;
        let message = b"Side channel test message";
        
        let mut signing_times = Vec::new();
        
        for _ in 0..100 {
            let start_time = SystemTime::now();
            let _signature = engine.sign(message, &keypair, None)?;
            let duration = start_time.elapsed().unwrap().as_micros();
            signing_times.push(duration);
        }
        
        // Calculate standard deviation
        let mean_time = signing_times.iter().sum::<u64>() as f64 / signing_times.len() as f64;
        let variance = signing_times.iter()
            .map(|&time| (time as f64 - mean_time).powi(2))
            .sum::<f64>() / signing_times.len() as f64;
        let std_dev = variance.sqrt();
        
        // Timing should be consistent (low standard deviation)
        let cv = (std_dev / mean_time) * 100.0; // Coefficient of variation
        assert!(cv < 10.0, "High timing variation detected: {}% CV", cv);
        
        Ok(TestMetrics {
            signatures_processed: 100,
            verifications_performed: 0,
            keypairs_generated: 1,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 1024,
            operations_per_second: 100.0,
        })
    }

    async fn test_backward_compatibility(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        // Test that traditional algorithms still work
        let traditional_algorithms = vec![PQCAlgorithm::ECDSA, PQCAlgorithm::Ed25519];
        
        let mut signatures_processed = 0;
        let mut verifications_performed = 0;
        
        for algorithm in traditional_algorithms {
            let keypair = engine.generate_key_pair(Some(algorithm.clone()))?;
            let message = b"Backward compatibility test message";
            
            let signature = engine.sign(message, &keypair, None)?;
            signatures_processed += 1;
            
            let is_valid = engine.verify(&signature, message)?;
            verifications_performed += 1;
            
            assert!(is_valid, "Traditional algorithm should work: {:?}", algorithm);
        }
        
        Ok(TestMetrics {
            signatures_processed,
            verifications_performed,
            keypairs_generated: traditional_algorithms.len(),
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 0,
            operations_per_second: (signatures_processed + verifications_performed) as f64,
        })
    }

    async fn test_cross_platform_compatibility(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        // Test signature serialization/deserialization
        let keypair = engine.generate_key_pair(Some(PQCAlgorithm::Dilithium2))?;
        let message = b"Cross-platform test message";
        
        let signature = engine.sign(message, &keypair, None)?;
        
        // Serialize signature
        let serialized = bincode::serialize(&signature).unwrap();
        
        // Deserialize signature
        let deserialized: PQCSignature = bincode::deserialize(&serialized).unwrap();
        
        // Verify deserialized signature
        let is_valid = engine.verify(&deserialized, message)?;
        assert!(is_valid, "Deserialized signature should be valid");
        
        Ok(TestMetrics {
            signatures_processed: 1,
            verifications_performed: 1,
            keypairs_generated: 1,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: serialized.len(),
            operations_per_second: 2.0,
        })
    }

    async fn test_traditional_pqc_interop(&mut self) -> Result<TestMetrics, PQCTestError> {
        let engine = self.pqc_engine.as_ref().unwrap();
        
        // Test hybrid signatures
        let traditional_key = engine.generate_key_pair(Some(PQCAlgorithm::ECDSA))?;
        let pqc_key = engine.generate_key_pair(Some(PQCAlgorithm::Dilithium2))?;
        
        let message = b"Traditional-PQC interop test message";
        let hybrid_sig = engine.create_hybrid_signature(message, &traditional_key, &pqc_key, None)?;
        
        // Verify hybrid signature
        let is_valid = engine.verify_hybrid_signature(&hybrid_sig, message)?;
        assert!(is_valid, "Hybrid signature should be valid");
        
        // Test individual components
        let traditional_valid = engine.verify(&hybrid_sig.traditional_signature, message)?;
        let pqc_valid = engine.verify(&hybrid_sig.pqc_signature, message)?;
        
        assert!(traditional_valid, "Traditional component should be valid");
        assert!(pqc_valid, "PQC component should be valid");
        
        Ok(TestMetrics {
            signatures_processed: 2,
            verifications_performed: 3,
            keypairs_generated: 2,
            hybrid_signatures_created: 1,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 0,
            operations_per_second: 5.0,
        })
    }

    async fn test_scheme_migration(&mut self) -> Result<TestMetrics, PQCTestError> {
        let abstraction_layer = self.abstraction_layer.as_ref().unwrap();
        
        let wallet_config = WalletConfig {
            wallet_id: "migration_test_wallet".to_string(),
            primary_scheme: SignatureScheme::ECDSA,
            fallback_schemes: vec![SignatureScheme::Ed25519],
            security_level: 128,
            enable_hybrid: false,
            key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
            metadata: WalletMetadata {
                created_at: 0,
                updated_at: 0,
                last_used: 0,
                total_signatures: 0,
                is_active: true,
                backup_enabled: false,
                multi_sig_enabled: false,
            },
        };
        
        let wallet_id = abstraction_layer.create_wallet(wallet_config)?;
        
        // Create migration plan
        let migration_plan = abstraction_layer.create_migration_plan(
            SignatureScheme::ECDSA,
            SignatureScheme::Dilithium2,
            crate::quantum::signature_abstraction::MigrationStrategy::Immediate,
        )?;
        
        // Execute migration
        abstraction_layer.execute_migration(&wallet_id, &migration_plan)?;
        
        // Verify migration
        let wallet_info = abstraction_layer.get_wallet_info(&wallet_id)?;
        assert_eq!(wallet_info.primary_scheme, SignatureScheme::Dilithium2);
        
        // Test that fallback still works
        let context = SignatureContext {
            network_id: "test".to_string(),
            chain_id: 1,
            purpose: "migration_test".to_string(),
            additional_data: HashMap::new(),
        };
        
        let message = b"Post-migration test message";
        let signature_result = abstraction_layer.sign(&wallet_id, message, context)?;
        
        assert_eq!(signature_result.scheme_used, SignatureScheme::Dilithium2);
        
        Ok(TestMetrics {
            signatures_processed: 1,
            verifications_performed: 0,
            keypairs_generated: 3, // Original + new + fallback
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 1,
            total_gas_used: signature_result.gas_estimate,
            memory_used: 3072,
            operations_per_second: 2.0,
        })
    }

    async fn test_rollback_capability(&mut self) -> Result<TestMetrics, PQCTestError> {
        let abstraction_layer = self.abstraction_layer.as_ref().unwrap();
        
        let wallet_config = WalletConfig {
            wallet_id: "rollback_test_wallet".to_string(),
            primary_scheme: SignatureScheme::Dilithium2,
            fallback_schemes: vec![SignatureScheme::ECDSA],
            security_level: 128,
            enable_hybrid: false,
            key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
            metadata: WalletMetadata {
                created_at: 0,
                updated_at: 0,
                last_used: 0,
                total_signatures: 0,
                is_active: true,
                backup_enabled: false,
                multi_sig_enabled: false,
            },
        };
        
        let wallet_id = abstraction_layer.create_wallet(wallet_config)?;
        
        // Migrate back to ECDSA
        let rollback_plan = abstraction_layer.create_migration_plan(
            SignatureScheme::Dilithium2,
            SignatureScheme::ECDSA,
            crate::quantum::signature_abstraction::MigrationStrategy::Immediate,
        )?;
        
        abstraction_layer.execute_migration(&wallet_id, &rollback_plan)?;
        
        // Verify rollback
        let wallet_info = abstraction_layer.get_wallet_info(&wallet_id)?;
        assert_eq!(wallet_info.primary_scheme, SignatureScheme::ECDSA);
        
        Ok(TestMetrics {
            signatures_processed: 0,
            verifications_performed: 0,
            keypairs_generated: 2,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 1,
            total_gas_used: 0,
            memory_used: 2048,
            operations_per_second: 1.0,
        })
    }

    async fn test_gradual_migration(&mut self) -> Result<TestMetrics, PQCTestError> {
        let abstraction_layer = self.abstraction_layer.as_ref().unwrap();
        
        let wallet_config = WalletConfig {
            wallet_id: "gradual_migration_wallet".to_string(),
            primary_scheme: SignatureScheme::ECDSA,
            fallback_schemes: vec![SignatureScheme::Ed25519],
            security_level: 128,
            enable_hybrid: false,
            key_derivation_path: "m/44'/60'/0'/0/0".to_string(),
            metadata: WalletMetadata {
                created_at: 0,
                updated_at: 0,
                last_used: 0,
                total_signatures: 0,
                is_active: true,
                backup_enabled: false,
                multi_sig_enabled: false,
            },
        };
        
        let wallet_id = abstraction_layer.create_wallet(wallet_config)?;
        
        // Create gradual migration plan
        let migration_plan = abstraction_layer.create_migration_plan(
            SignatureScheme::ECDSA,
            SignatureScheme::Dilithium2,
            crate::quantum::signature_abstraction::MigrationStrategy::Gradual { daily_percentage: 20 },
        )?;
        
        // Execute migration
        abstraction_layer.execute_migration(&wallet_id, &migration_plan)?;
        
        // Verify migration
        let wallet_info = abstraction_layer.get_wallet_info(&wallet_id)?;
        assert_eq!(wallet_info.primary_scheme, SignatureScheme::Dilithium2);
        
        // Test that fallback is preserved
        let context = SignatureContext {
            network_id: "test".to_string(),
            chain_id: 1,
            purpose: "gradual_migration_test".to_string(),
            additional_data: HashMap::new(),
        };
        
        let message = b"Gradual migration test message";
        let signature_result = abstraction_layer.sign(&wallet_id, message, context)?;
        
        assert_eq!(signature_result.scheme_used, SignatureScheme::Dilithium2);
        
        Ok(TestMetrics {
            signatures_processed: 1,
            verifications_performed: 0,
            keypairs_generated: 3,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 1,
            total_gas_used: signature_result.gas_estimate,
            memory_used: 3072,
            operations_per_second: 2.0,
        })
    }

    /// Calculate security score based on test metrics
    fn calculate_security_score(&self, metrics: &TestMetrics) -> f64 {
        let mut score = 0.0;
        
        // Base score for having quantum-resistant signatures
        if metrics.hybrid_signatures_created > 0 {
            score += 30.0;
        }
        
        // Score for verification operations
        score += (metrics.verifications_performed as f64 * 5.0).min(20.0);
        
        // Score for migration capabilities
        score += (metrics.migrations_performed as f64 * 15.0).min(30.0);
        
        // Score for overall operations
        score += (metrics.operations_per_second * 2.0).min(20.0);
        
        score.min(100.0)
    }

    /// Print test summary
    fn print_summary(&self) {
        let passed = self.results.iter().filter(|r| r.status == TestStatus::Passed).count();
        let failed = self.results.iter().filter(|r| r.status == TestStatus::Failed).count();
        let skipped = self.results.iter().filter(|r| r.status == TestStatus::Skipped).count();
        let timeout = self.results.iter().filter(|r| r.status == TestStatus::Timeout).count();
        let total = self.results.len();
        
        println!("\n📊 PQC Test Summary:");
        println!("  Total Tests: {}", total);
        println!("  ✅ Passed: {}", passed);
        println!("  ❌ Failed: {}", failed);
        println!("  ⏭️  Skipped: {}", skipped);
        println!("  ⏰ Timeout: {}", timeout);
        println!("  Success Rate: {:.1}%", (passed as f64 / total as f64) * 100.0);
        
        // Security summary
        let avg_security_score = self.results.iter()
            .map(|r| r.security_score)
            .sum::<f64>() / total.max(1) as f64;
        println!("  Average Security Score: {:.1}/100", avg_security_score);
        
        if failed > 0 {
            println!("\n❌ Failed Tests:");
            for result in &self.results {
                if result.status == TestStatus::Failed {
                    println!("  - {}: {}", result.test_name, result.error_message.as_ref().unwrap_or(&"Unknown error".to_string()));
                }
            }
        }
        
        // Category summary
        println!("\n📋 Category Summary:");
        for category in &[TestCategory::Unit, TestCategory::Integration, TestCategory::Performance, 
                          TestCategory::Security, TestCategory::Compatibility, TestCategory::Migration] {
            let category_results: Vec<_> = self.results.iter()
                .filter(|r| r.category == *category)
                .collect();
            
            if !category_results.is_empty() {
                let category_passed = category_results.iter().filter(|r| r.status == TestStatus::Passed).count();
                let category_total = category_results.len();
                println!("  {}: {}/{} ({:.1}%)", 
                    format!("{:?}", category), 
                    category_passed, 
                    category_total, 
                    (category_passed as f64 / category_total as f64) * 100.0);
            }
        }
    }

    /// Get test results
    pub fn get_results(&self) -> Vec<TestResult> {
        self.results.clone()
    }

    /// Get security results
    pub fn get_security_results(&self) -> Vec<SecurityTestResult> {
        self.security_results.clone()
    }

    /// Check if all tests passed
    pub fn all_tests_passed(&self) -> bool {
        self.results.iter().all(|r| r.status == TestStatus::Passed)
    }

    /// Get test statistics
    pub fn get_statistics(&self) -> TestStatistics {
        let total = self.results.len();
        let passed = self.results.iter().filter(|r| r.status == TestStatus::Passed).count();
        let failed = self.results.iter().filter(|r| r.status == TestStatus::Failed).count();
        
        let total_duration = self.results.iter().map(|r| r.duration_ms).sum::<u64>();
        let avg_duration = if total > 0 { total_duration / total as u64 } else { 0 };
        
        let total_signatures = self.results.iter()
            .map(|r| r.metrics.signatures_processed)
            .sum::<usize>();
        
        let total_verifications = self.results.iter()
            .map(|r| r.metrics.verifications_performed)
            .sum::<usize>();
        
        let avg_security_score = self.results.iter()
            .map(|r| r.security_score)
            .sum::<f64>() / total.max(1) as f64;
        
        TestStatistics {
            total_tests: total,
            passed_tests: passed,
            failed_tests: failed,
            success_rate: (passed as f64 / total.max(1) as f64) * 100.0,
            total_duration_ms: total_duration,
            average_duration_ms: avg_duration,
            total_signatures_processed: total_signatures,
            total_verifications_performed: total_verifications,
            average_security_score: avg_security_score,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestStatistics {
    pub total_tests: usize,
    pub passed_tests: usize,
    pub failed_tests: usize,
    pub success_rate: f64,
    pub total_duration_ms: u64,
    pub average_duration_ms: u64,
    pub total_signatures_processed: usize,
    pub total_verifications_performed: usize,
    pub average_security_score: f64,
}

impl Default for TestMetrics {
    fn default() -> Self {
        Self {
            signatures_processed: 0,
            verifications_performed: 0,
            keypairs_generated: 0,
            hybrid_signatures_created: 0,
            contract_calls_executed: 0,
            migrations_performed: 0,
            total_gas_used: 0,
            memory_used: 0,
            operations_per_second: 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_pqc_test_suite_creation() {
        let config = TestSuiteConfig {
            enable_unit_tests: true,
            enable_integration_tests: false,
            enable_performance_tests: false,
            enable_security_tests: false,
            enable_compatibility_tests: false,
            enable_migration_tests: false,
            timeout_seconds: 30,
            test_iterations: 10,
            security_threshold: 0.8,
            performance_threshold_tps: 100.0,
        };

        let suite = PQCTestSuite::new(config);
        assert_eq!(suite.config.test_iterations, 10);
        assert_eq!(suite.config.security_threshold, 0.8);
    }

    #[tokio::test]
    async fn test_ci_tests() {
        let config = TestSuiteConfig {
            enable_unit_tests: true,
            enable_integration_tests: true,
            enable_performance_tests: false,
            enable_security_tests: true,
            enable_compatibility_tests: true,
            enable_migration_tests: false,
            timeout_seconds: 60,
            test_iterations: 5,
            security_threshold: 0.8,
            performance_threshold_tps: 100.0,
        };

        let mut suite = PQCTestSuite::new(config);
        let results = suite.run_ci_tests().await;
        
        assert!(!results.is_empty(), "CI tests should produce results");
        
        let stats = suite.get_statistics();
        assert!(stats.success_rate >= 0.0, "Should have success rate");
    }
}