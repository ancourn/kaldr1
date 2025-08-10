//! KALDRIX EVM Implementation - Phase 8
//! 
//! This module provides a complete EVM-compatible environment for the KALDRIX blockchain,
//! including bytecode interpretation, Solidity integration, and post-quantum security enhancements.

pub mod bytecode_interpreter;
pub mod gas_calculation;
pub mod memory;
pub mod stack;
pub mod security;
pub mod solidity_integration;
pub mod state_management;
pub mod precompiles;

// Re-export key components
pub use bytecode_interpreter::{
    BytecodeInterpreter, ExecutionContext, ExecutionResult, ExecutionError,
    BlockContext, TransactionContext, U256, OpcodeHandler,
};
pub use gas_calculation::GasCalculator;
pub use memory::MemoryManager;
pub use stack::StackManager;
pub use security::SecurityValidator;
pub use solidity_integration::SolidityCompiler;
pub use state_management::StateManager;

/// EVM Configuration
#[derive(Debug, Clone)]
pub struct EVMConfig {
    /// Gas limit for contract execution
    pub gas_limit: u64,
    /// Maximum memory size
    pub max_memory_size: usize,
    /// Maximum stack size
    pub max_stack_size: usize,
    /// Enable security validation
    pub enable_security: bool,
    /// Enable performance monitoring
    pub enable_monitoring: bool,
}

impl Default for EVMConfig {
    fn default() -> Self {
        Self {
            gas_limit: 10_000_000,
            max_memory_size: 1024 * 1024, // 1MB
            max_stack_size: 1024,
            enable_security: true,
            enable_monitoring: true,
        }
    }
}

/// EVM Factory for creating configured EVM instances
pub struct EVMFactory {
    config: EVMConfig,
}

impl EVMFactory {
    /// Create a new EVM factory with default configuration
    pub fn new() -> Self {
        Self {
            config: EVMConfig::default(),
        }
    }
    
    /// Create a new EVM factory with custom configuration
    pub fn with_config(config: EVMConfig) -> Self {
        Self { config }
    }
    
    /// Create a new bytecode interpreter
    pub fn create_interpreter(&self) -> BytecodeInterpreter {
        let mut interpreter = BytecodeInterpreter::new();
        // Apply configuration to interpreter
        interpreter
    }
    
    /// Create a new gas calculator
    pub fn create_gas_calculator(&self) -> GasCalculator {
        GasCalculator::new(self.config.gas_limit)
    }
    
    /// Create a new memory manager
    pub fn create_memory_manager(&self) -> MemoryManager {
        MemoryManager::new(self.config.max_memory_size)
    }
    
    /// Create a new stack manager
    pub fn create_stack_manager(&self) -> StackManager {
        StackManager::new(self.config.max_stack_size)
    }
    
    /// Create a new security validator
    pub fn create_security_validator(&self) -> SecurityValidator {
        SecurityValidator::new(self.config.enable_security)
    }
}

/// EVM Statistics for performance monitoring
#[derive(Debug, Clone)]
pub struct EVMStats {
    /// Total operations executed
    pub operations_executed: u64,
    /// Total gas consumed
    pub total_gas_consumed: u64,
    /// Average execution time
    pub average_execution_time: std::time::Duration,
    /// Memory usage peak
    pub memory_usage_peak: usize,
    /// Stack usage peak
    pub stack_usage_peak: usize,
    /// Security violations count
    pub security_violations: u32,
}

impl Default for EVMStats {
    fn default() -> Self {
        Self {
            operations_executed: 0,
            total_gas_consumed: 0,
            average_execution_time: std::time::Duration::from_millis(0),
            memory_usage_peak: 0,
            stack_usage_peak: 0,
            security_violations: 0,
        }
    }
}

/// EVM Result containing execution output and statistics
pub struct EVMResult {
    /// Execution output data
    pub output: Vec<u8>,
    /// Execution statistics
    pub stats: EVMStats,
    /// Execution success status
    pub success: bool,
    /// Error message if execution failed
    pub error: Option<String>,
}

impl EVMResult {
    /// Create a successful execution result
    pub fn success(output: Vec<u8>, stats: EVMStats) -> Self {
        Self {
            output,
            stats,
            success: true,
            error: None,
        }
    }
    
    /// Create a failed execution result
    pub fn failure(error: String, stats: EVMStats) -> Self {
        Self {
            output: vec![],
            stats,
            success: false,
            error: Some(error),
        }
    }
}

/// Main EVM interface for contract execution
pub struct EVM {
    factory: EVMFactory,
    stats: EVMStats,
}

impl EVM {
    /// Create a new EVM instance
    pub fn new() -> Self {
        Self {
            factory: EVMFactory::new(),
            stats: EVMStats::default(),
        }
    }
    
    /// Create a new EVM instance with custom configuration
    pub fn with_config(config: EVMConfig) -> Self {
        Self {
            factory: EVMFactory::with_config(config),
            stats: EVMStats::default(),
        }
    }
    
    /// Execute a smart contract
    pub fn execute_contract(
        &mut self,
        bytecode: &[u8],
        input_data: &[u8],
        context: ExecutionContext,
    ) -> EVMResult {
        let start_time = std::time::Instant::now();
        
        // Create interpreter
        let mut interpreter = self.factory.create_interpreter();
        
        // Prepare execution context
        let mut execution_context = context;
        execution_context.bytecode = bytecode.to_vec();
        execution_context.call_data = input_data.to_vec();
        
        // Execute contract
        let result = interpreter.execute(execution_context);
        
        // Update statistics
        let execution_time = start_time.elapsed();
        self.stats.operations_executed += 1;
        self.stats.total_gas_consumed += interpreter.gas_used();
        self.stats.memory_usage_peak = self.stats.memory_usage_peak.max(interpreter.memory_size());
        self.stats.stack_usage_peak = self.stats.stack_usage_peak.max(interpreter.stack_size());
        self.stats.security_violations += interpreter.security_validator.violations();
        
        // Update average execution time
        if self.stats.operations_executed > 1 {
            let total_time = self.stats.average_execution_time * (self.stats.operations_executed - 1) as u32;
            let new_average = (total_time + execution_time) / self.stats.operations_executed as u32;
            self.stats.average_execution_time = new_average;
        } else {
            self.stats.average_execution_time = execution_time;
        }
        
        // Return result
        match result {
            Ok(output) => EVMResult::success(output, self.stats.clone()),
            Err(error) => EVMResult::failure(error.to_string(), self.stats.clone()),
        }
    }
    
    /// Get current statistics
    pub fn stats(&self) -> &EVMStats {
        &self.stats
    }
    
    /// Reset statistics
    pub fn reset_stats(&mut self) {
        self.stats = EVMStats::default();
    }
}

impl Default for EVM {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_evm_creation() {
        let evm = EVM::new();
        assert_eq!(evm.stats().operations_executed, 0);
    }

    #[test]
    fn test_evm_factory() {
        let factory = EVMFactory::new();
        let _interpreter = factory.create_interpreter();
        let _gas_calculator = factory.create_gas_calculator();
        let _memory_manager = factory.create_memory_manager();
        let _stack_manager = factory.create_stack_manager();
        let _security_validator = factory.create_security_validator();
    }

    #[test]
    fn test_evm_config() {
        let config = EVMConfig::default();
        assert_eq!(config.gas_limit, 10_000_000);
        assert_eq!(config.max_memory_size, 1024 * 1024);
        assert_eq!(config.max_stack_size, 1024);
        assert!(config.enable_security);
        assert!(config.enable_monitoring);
    }

    #[test]
    fn test_evm_result() {
        let stats = EVMStats::default();
        let success_result = EVMResult::success(vec![1, 2, 3], stats.clone());
        assert!(success_result.success);
        assert_eq!(success_result.output, vec![1, 2, 3]);
        assert!(success_result.error.is_none());
        
        let failure_result = EVMResult::failure("Test error".to_string(), stats);
        assert!(!failure_result.success);
        assert!(failure_result.output.is_empty());
        assert!(failure_result.error.is_some());
    }
}