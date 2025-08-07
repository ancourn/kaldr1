//! Smart contract engine for the blockchain

use crate::{BlockchainError, TransactionId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// Smart contract engine implementation
pub struct ContractEngine {
    contracts: HashMap<ContractId, SmartContract>,
    is_running: bool,
}

/// Contract ID type
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq)]
pub struct ContractId(String);

impl ContractId {
    pub fn new(id: String) -> Self {
        Self(id)
    }
    
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Smart contract structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartContract {
    pub id: ContractId,
    pub code: Vec<u8>,
    pub state: ContractState,
    pub owner: Vec<u8>,
    pub creation_time: u64,
    pub quantum_proof: QuantumProof,
    pub metadata: ContractMetadata,
}

/// Contract state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractState {
    pub storage: HashMap<Vec<u8>, Vec<u8>>,
    pub balance: u64,
    pub nonce: u64,
    pub permissions: Permissions,
}

/// Contract permissions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permissions {
    pub owner_only: bool,
    pub public_functions: Vec<String>,
    pub allowed_callers: Vec<Vec<u8>>,
}

/// Contract metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractMetadata {
    pub name: String,
    pub version: String,
    pub description: String,
    pub gas_limit: u64,
}

/// Quantum proof for contracts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumProof {
    pub prime_hash: Vec<u8>,
    pub resistance_score: u32,
    pub proof_timestamp: u64,
}

/// Execution context
#[derive(Debug, Clone)]
pub struct ExecutionContext {
    pub contract: Arc<SmartContract>,
    pub caller: Vec<u8>,
    pub value: u64,
    pub gas_limit: u64,
    pub block_number: u64,
}

/// Execution result
#[derive(Debug, Clone)]
pub struct ExecutionResult {
    pub success: bool,
    pub output: Vec<u8>,
    pub gas_used: u64,
    pub error: Option<String>,
}

impl ContractEngine {
    /// Create a new contract engine
    pub fn new() -> Result<Self, BlockchainError> {
        Ok(Self {
            contracts: HashMap::new(),
            is_running: false,
        })
    }

    /// Start the contract engine
    pub async fn start(&mut self) -> Result<(), BlockchainError> {
        println!("📜 Starting smart contract engine");
        self.is_running = true;
        Ok(())
    }

    /// Stop the contract engine
    pub async fn stop(&mut self) -> Result<(), BlockchainError> {
        println!("📜 Stopping smart contract engine");
        self.is_running = false;
        Ok(())
    }

    /// Deploy a new smart contract
    pub async fn deploy_contract(
        &mut self,
        code: Vec<u8>,
        owner: Vec<u8>,
        metadata: ContractMetadata,
    ) -> Result<ContractId, BlockchainError> {
        if !self.is_running {
            return Err(BlockchainError::Security(SecurityError::EngineNotRunning));
        }

        // Validate contract code
        self.validate_contract_code(&code)?;

        // Generate contract ID
        let contract_id = ContractId::new(format!("contract_{}", uuid::Uuid::new_v4()));

        // Create quantum proof
        let quantum_proof = self.generate_quantum_proof(&code)?;

        // Create contract
        let contract = SmartContract {
            id: contract_id.clone(),
            code,
            state: ContractState {
                storage: HashMap::new(),
                balance: 0,
                nonce: 0,
                permissions: Permissions {
                    owner_only: true,
                    public_functions: vec!["constructor".to_string()],
                    allowed_callers: vec![owner.clone()],
                },
            },
            owner: owner.clone(),
            creation_time: chrono::Utc::now().timestamp() as u64,
            quantum_proof,
            metadata,
        };

        // Store contract
        self.contracts.insert(contract_id.clone(), contract);

        println!("📝 Contract deployed: {}", contract_id.as_str());
        Ok(contract_id)
    }

    /// Execute a smart contract function
    pub async fn execute_contract(
        &mut self,
        contract_id: &ContractId,
        function_name: &str,
        input: Vec<u8>,
        caller: Vec<u8>,
        value: u64,
        gas_limit: u64,
    ) -> Result<ExecutionResult, BlockchainError> {
        if !self.is_running {
            return Err(BlockchainError::Security(SecurityError::EngineNotRunning));
        }

        // Get contract
        let contract = self.contracts.get(contract_id)
            .ok_or_else(|| BlockchainError::Security(SecurityError::ContractNotFound(contract_id.clone())))?;

        // Create execution context
        let context = ExecutionContext {
            contract: Arc::new(contract.clone()),
            caller: caller.clone(),
            value,
            gas_limit,
            block_number: 0, // Would get from blockchain
        };

        // Execute contract
        let result = self.execute_function(&context, function_name, input).await?;

        // Update contract state if successful
        if result.success {
            self.update_contract_state(contract_id, &context, &result)?;
        }

        Ok(result)
    }

    /// Get contract by ID
    pub fn get_contract(&self, contract_id: &ContractId) -> Option<&SmartContract> {
        self.contracts.get(contract_id)
    }

    /// Get contract state
    pub fn get_contract_state(&self, contract_id: &ContractId) -> Option<&ContractState> {
        self.contracts.get(contract_id).map(|c| &c.state)
    }

    /// Validate contract code
    fn validate_contract_code(&self, code: &[u8]) -> Result<(), BlockchainError> {
        if code.is_empty() {
            return Err(BlockchainError::Security(SecurityError::InvalidContractCode("Empty code".to_string())));
        }

        if code.len() > 1024 * 1024 { // 1MB limit
            return Err(BlockchainError::Security(SecurityError::InvalidContractCode("Code too large".to_string())));
        }

        // In a real implementation, this would validate bytecode
        // For prototype, we'll just check basic constraints
        
        Ok(())
    }

    /// Generate quantum proof for contract
    fn generate_quantum_proof(&self, code: &[u8]) -> Result<QuantumProof, BlockchainError> {
        // Simple hash-based quantum proof for prototype
        use sha3::{Digest, Sha3_256};
        
        let mut hasher = Sha3_256::new();
        hasher.update(code);
        let prime_hash = hasher.finalize().to_vec();

        Ok(QuantumProof {
            prime_hash,
            resistance_score: 85, // Fixed for prototype
            proof_timestamp: chrono::Utc::now().timestamp() as u64,
        })
    }

    /// Execute contract function
    async fn execute_function(
        &self,
        context: &ExecutionContext,
        function_name: &str,
        input: Vec<u8>,
    ) -> Result<ExecutionResult, BlockchainError> {
        // Check permissions
        self.check_permissions(context, function_name)?;

        // Calculate gas cost
        let gas_cost = self.calculate_gas_cost(context, function_name, &input);
        
        if gas_cost > context.gas_limit {
            return Ok(ExecutionResult {
                success: false,
                output: Vec::new(),
                gas_used: gas_cost,
                error: Some("Out of gas".to_string()),
            });
        }

        // Execute function (simplified for prototype)
        match function_name {
            "constructor" => self.execute_constructor(context, input).await,
            "get" => self.execute_get(context, input).await,
            "set" => self.execute_set(context, input).await,
            "transfer" => self.execute_transfer(context, input).await,
            _ => Ok(ExecutionResult {
                success: false,
                output: Vec::new(),
                gas_used: gas_cost,
                error: Some(format!("Unknown function: {}", function_name)),
            }),
        }
    }

    /// Check execution permissions
    fn check_permissions(&self, context: &ExecutionContext, function_name: &str) -> Result<(), BlockchainError> {
        let contract = &context.contract;

        // Check if function is public
        if !contract.state.permissions.public_functions.contains(&function_name.to_string()) {
            return Err(BlockchainError::Security(SecurityError::PermissionDenied));
        }

        // Check if caller is allowed
        if !contract.state.permissions.allowed_callers.contains(&context.caller) {
            return Err(BlockchainError::Security(SecurityError::PermissionDenied));
        }

        Ok(())
    }

    /// Calculate gas cost
    fn calculate_gas_cost(&self, context: &ExecutionContext, function_name: &str, input: &[u8]) -> u64 {
        // Simple gas calculation for prototype
        let base_cost = match function_name {
            "constructor" => 1000,
            "get" => 100,
            "set" => 500,
            "transfer" => 800,
            _ => 200,
        };

        let input_cost = input.len() as u64 * 10;
        let storage_cost = context.contract.state.storage.len() as u64 * 5;

        base_cost + input_cost + storage_cost
    }

    /// Execute constructor
    async fn execute_constructor(&self, context: &ExecutionContext, input: Vec<u8>) -> Result<ExecutionResult, BlockchainError> {
        // For prototype, constructor just initializes basic state
        Ok(ExecutionResult {
            success: true,
            output: context.contract.id.as_str().as_bytes().to_vec(),
            gas_used: 1000,
            error: None,
        })
    }

    /// Execute get function
    async fn execute_get(&self, context: &ExecutionContext, input: Vec<u8>) -> Result<ExecutionResult, BlockchainError> {
        // Get value from storage
        let value = context.contract.state.storage.get(&input)
            .cloned()
            .unwrap_or_else(|| b"value_not_found".to_vec());

        Ok(ExecutionResult {
            success: true,
            output: value,
            gas_used: 100,
            error: None,
        })
    }

    /// Execute set function
    async fn execute_set(&self, context: &ExecutionContext, input: Vec<u8>) -> Result<ExecutionResult, BlockchainError> {
        // For prototype, we can't modify state during execution
        // This would be handled in update_contract_state
        Ok(ExecutionResult {
            success: true,
            output: b"ok".to_vec(),
            gas_used: 500,
            error: None,
        })
    }

    /// Execute transfer function
    async fn execute_transfer(&self, context: &ExecutionContext, input: Vec<u8>) -> Result<ExecutionResult, BlockchainError> {
        // Simple transfer logic for prototype
        if input.len() < 8 {
            return Ok(ExecutionResult {
                success: false,
                output: Vec::new(),
                gas_used: 800,
                error: Some("Invalid input".to_string()),
            });
        }

        let amount = u64::from_be_bytes(
            input[..8].try_into().unwrap_or([0u8; 8])
        );

        if context.contract.state.balance < amount {
            return Ok(ExecutionResult {
                success: false,
                output: Vec::new(),
                gas_used: 800,
                error: Some("Insufficient balance".to_string()),
            });
        }

        Ok(ExecutionResult {
            success: true,
            output: b"transfer_successful".to_vec(),
            gas_used: 800,
            error: None,
        })
    }

    /// Update contract state after execution
    fn update_contract_state(
        &mut self,
        contract_id: &ContractId,
        context: &ExecutionContext,
        result: &ExecutionResult,
    ) -> Result<(), BlockchainError> {
        if let Some(contract) = self.contracts.get_mut(contract_id) {
            // Update nonce
            contract.state.nonce += 1;
            
            // For set function, update storage (simplified)
            if result.success && result.output == b"ok" {
                // In real implementation, this would parse the input and update storage
                // For prototype, we'll just add a sample entry
                contract.state.storage.insert(b"last_update".to_vec(), chrono::Utc::now().timestamp().to_be_bytes().to_vec());
            }
        }

        Ok(())
    }
}

/// Security error types for contracts
#[derive(Debug, thiserror::Error)]
pub enum SecurityError {
    #[error("Contract engine not running")]
    EngineNotRunning,
    #[error("Contract not found: {0}")]
    ContractNotFound(ContractId),
    #[error("Invalid contract code: {0}")]
    InvalidContractCode(String),
    #[error("Permission denied")]
    PermissionDenied,
    #[error("Execution failed: {0}")]
    ExecutionFailed(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_contract_engine_creation() {
        let engine = ContractEngine::new();
        assert!(engine.is_ok());
        
        let engine = engine.unwrap();
        assert!(!engine.is_running);
        assert_eq!(engine.contracts.len(), 0);
    }

    #[tokio::test]
    async fn test_engine_start_stop() {
        let mut engine = ContractEngine::new().unwrap();
        
        assert!(engine.start().await.is_ok());
        assert!(engine.is_running);
        
        assert!(engine.stop().await.is_ok());
        assert!(!engine.is_running);
    }

    #[tokio::test]
    async fn test_contract_deployment() {
        let mut engine = ContractEngine::new().unwrap();
        engine.start().await.unwrap();

        let code = b"simple contract code".to_vec();
        let owner = vec![1u8; 32];
        let metadata = ContractMetadata {
            name: "TestContract".to_string(),
            version: "1.0.0".to_string(),
            description: "A test contract".to_string(),
            gas_limit: 1000000,
        };

        let result = engine.deploy_contract(code, owner, metadata).await;
        assert!(result.is_ok());
        
        let contract_id = result.unwrap();
        assert!(engine.contracts.contains_key(&contract_id));
    }

    #[tokio::test]
    async fn test_contract_execution() {
        let mut engine = ContractEngine::new().unwrap();
        engine.start().await.unwrap();

        // Deploy a contract first
        let code = b"simple contract code".to_vec();
        let owner = vec![1u8; 32];
        let metadata = ContractMetadata {
            name: "TestContract".to_string(),
            version: "1.0.0".to_string(),
            description: "A test contract".to_string(),
            gas_limit: 1000000,
        };

        let contract_id = engine.deploy_contract(code, owner, metadata).await.unwrap();

        // Execute get function
        let result = engine.execute_contract(
            &contract_id,
            "get",
            b"test_key".to_vec(),
            vec![1u8; 32],
            0,
            1000,
        ).await;

        assert!(result.is_ok());
        let execution_result = result.unwrap();
        assert!(execution_result.success);
        assert_eq!(execution_result.output, b"value_not_found");
    }

    #[test]
    fn test_gas_calculation() {
        let engine = ContractEngine::new().unwrap();
        
        let context = ExecutionContext {
            contract: Arc::new(SmartContract {
                id: ContractId::new("test".to_string()),
                code: vec![1, 2, 3],
                state: ContractState {
                    storage: HashMap::new(),
                    balance: 1000,
                    nonce: 0,
                    permissions: Permissions {
                        owner_only: true,
                        public_functions: vec!["test".to_string()],
                        allowed_callers: vec![vec![1u8; 32]],
                    },
                },
                owner: vec![1u8; 32],
                creation_time: 0,
                quantum_proof: QuantumProof {
                    prime_hash: vec![1u8; 32],
                    resistance_score: 80,
                    proof_timestamp: 0,
                },
                metadata: ContractMetadata {
                    name: "Test".to_string(),
                    version: "1.0".to_string(),
                    description: "Test".to_string(),
                    gas_limit: 1000000,
                },
            }),
            caller: vec![1u8; 32],
            value: 0,
            gas_limit: 1000,
            block_number: 0,
        };

        let gas_cost = engine.calculate_gas_cost(&context, "get", b"test");
        assert_eq!(gas_cost, 100); // Base cost for get function
    }
}