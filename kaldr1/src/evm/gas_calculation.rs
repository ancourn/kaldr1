//! Gas Calculation Module for KALDRIX EVM
//! 
//! This module implements gas calculation and metering according to EVM specifications
//! with KALDRIX-specific optimizations and post-quantum security considerations.

use crate::evm::bytecode_interpreter::ExecutionError;

/// Gas calculator for EVM operations
pub struct GasCalculator {
    /// Gas limit for execution
    gas_limit: u64,
    /// Gas used so far
    gas_used: u64,
    /// Gas price
    gas_price: u64,
    /// Refund counter
    refund_counter: u64,
}

impl GasCalculator {
    /// Create a new gas calculator with specified gas limit
    pub fn new(gas_limit: u64) -> Self {
        Self {
            gas_limit,
            gas_used: 0,
            gas_price: 0,
            refund_counter: 0,
        }
    }
    
    /// Set gas price
    pub fn set_gas_price(&mut self, gas_price: u64) {
        self.gas_price = gas_price;
    }
    
    /// Get current gas used
    pub fn gas_used(&self) -> u64 {
        self.gas_used
    }
    
    /// Get remaining gas
    pub fn gas_remaining(&self) -> u64 {
        self.gas_limit.saturating_sub(self.gas_used)
    }
    
    /// Get refund counter
    pub fn refund_counter(&self) -> u64 {
        self.refund_counter
    }
    
    /// Consume gas for an operation
    pub fn consume_gas(&mut self, amount: u64) -> Result<(), ExecutionError> {
        if self.gas_used + amount > self.gas_limit {
            return Err(ExecutionError::OutOfGas);
        }
        self.gas_used += amount;
        Ok(())
    }
    
    /// Add gas refund
    pub fn add_refund(&mut self, amount: u64) {
        self.refund_counter += amount;
    }
    
    /// Calculate gas cost for opcode
    pub fn opcode_gas_cost(&self, opcode: u8) -> u64 {
        match opcode {
            // Zero cost opcodes
            0x00 | 0x50 | 0x56 | 0x57 | 0x58 | 0x59 | 0x5a | 0x5b => 0,
            
            // Base cost of 2 gas
            0x01 | 0x03 | 0x10 | 0x11 | 0x12 | 0x13 | 0x14 | 0x15 | 0x16 | 0x17 | 0x18 | 0x19 | 0x1a | 0x1b => 2,
            
            // Base cost of 3 gas
            0x20 | 0x30 | 0x40 => 3,
            
            // Base cost of 5 gas
            0x02 | 0x04 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0a | 0x0b | 0x0c | 0x0d | 0x0e | 0x0f => 5,
            
            // Base cost of 8 gas
            0x21 | 0x31 | 0x41 => 8,
            
            // Base cost of 10 gas
            0x22 | 0x32 | 0x42 => 10,
            
            // Push operations (3 gas + 1 gas per byte)
            op if op >= 0x60 && op <= 0x7f => 3 + (op - 0x60 + 1) as u64,
            
            // Dup operations (3 gas)
            op if op >= 0x80 && op <= 0x8f => 3,
            
            // Swap operations (3 gas)
            op if op >= 0x90 && op <= 0x9f => 3,
            
            // Log operations (375 gas + 375 gas per topic)
            op if op >= 0xa0 && op <= 0xa4 => 375 + (op - 0xa0) as u64 * 375,
            
            // System operations
            0xf0 => 32000, // CREATE
            0xf1 => 40000, // CALL
            0xf2 => 40000, // CALLCODE
            0xf3 => 0,     // RETURN
            0xf4 => 40000, // DELEGATECALL
            0xfa => 40000, // STATICCALL
            0xfd => 0,     // REVERT
            0xff => 0,     // SELFDESTRUCT
            
            // Memory operations
            0x51 => 3,     // MLOAD
            0x52 => 3,     // MSTORE
            0x53 => 3,     // MSTORE8
            0x54 => 800,   // SLOAD
            0x55 => 20000, // SSTORE
            
            // Default cost for unknown opcodes
            _ => 2,
        }
    }
    
    /// Calculate memory expansion cost
    pub fn memory_expansion_cost(&self, current_size: usize, new_size: usize) -> u64 {
        if new_size <= current_size {
            return 0;
        }
        
        // Calculate memory expansion cost according to EVM specifications
        let current_words = (current_size + 31) / 32;
        let new_words = (new_size + 31) / 32;
        
        if new_words <= current_words {
            return 0;
        }
        
        // Cost formula: 3 * new_words + new_words^2 / 512
        let new_cost = 3 * new_words as u64 + (new_words as u64 * new_words as u64) / 512;
        let current_cost = 3 * current_words as u64 + (current_words as u64 * current_words as u64) / 512;
        
        new_cost - current_cost
    }
    
    /// Calculate call gas cost
    pub fn call_gas_cost(&self, value: u64, gas_limit: u64) -> u64 {
        let base_cost = 40000;
        let value_cost = if value > 0 { 9000 } else { 0 };
        let memory_cost = gas_limit / 64; // 64th of gas limit for memory
        
        base_cost + value_cost + memory_cost
    }
    
    /// Calculate create gas cost
    pub fn create_gas_cost(&self, value: u64) -> u64 {
        let base_cost = 32000;
        let value_cost = if value > 0 { 9000 } else { 0 };
        
        base_cost + value_cost
    }
    
    /// Calculate storage gas cost
    pub fn storage_gas_cost(&self, current_value: Option<u64>, new_value: u64) -> (u64, u64) {
        match (current_value, new_value) {
            (None, 0) => (20000, 0), // First set to zero
            (None, _) => (20000, 0), // First set to non-zero
            (Some(0), 0) => (0, 0),   // Zero to zero (no change)
            (Some(0), _) => (20000, 19800), // Zero to non-zero
            (Some(_), 0) => (5000, 15000),   // Non-zero to zero
            (Some(_), _) => (5000, 0),        // Non-zero to non-zero
        }
    }
    
    /// Reset gas calculator
    pub fn reset(&mut self) {
        self.gas_used = 0;
        self.refund_counter = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gas_calculator_creation() {
        let calculator = GasCalculator::new(1_000_000);
        assert_eq!(calculator.gas_limit, 1_000_000);
        assert_eq!(calculator.gas_used(), 0);
        assert_eq!(calculator.gas_remaining(), 1_000_000);
    }

    #[test]
    fn test_gas_consumption() {
        let mut calculator = GasCalculator::new(1000);
        assert!(calculator.consume_gas(500).is_ok());
        assert_eq!(calculator.gas_used(), 500);
        assert_eq!(calculator.gas_remaining(), 500);
        
        assert!(calculator.consume_gas(500).is_ok());
        assert_eq!(calculator.gas_used(), 1000);
        assert_eq!(calculator.gas_remaining(), 0);
        
        assert!(calculator.consume_gas(1).is_err());
    }

    #[test]
    fn test_opcode_gas_costs() {
        let calculator = GasCalculator::new(1_000_000);
        
        // Test zero cost opcodes
        assert_eq!(calculator.opcode_gas_cost(0x00), 0); // STOP
        assert_eq!(calculator.opcode_gas_cost(0x50), 0); // POP
        
        // Test base cost 2 gas
        assert_eq!(calculator.opcode_gas_cost(0x01), 2); // ADD
        assert_eq!(calculator.opcode_gas_cost(0x03), 2); // SUB
        
        // Test push operations
        assert_eq!(calculator.opcode_gas_cost(0x60), 4); // PUSH1 (3 + 1)
        assert_eq!(calculator.opcode_gas_cost(0x7f), 35); // PUSH32 (3 + 32)
        
        // Test system operations
        assert_eq!(calculator.opcode_gas_cost(0xf0), 32000); // CREATE
        assert_eq!(calculator.opcode_gas_cost(0xf1), 40000); // CALL
    }

    #[test]
    fn test_memory_expansion_cost() {
        let calculator = GasCalculator::new(1_000_000);
        
        // No expansion
        assert_eq!(calculator.memory_expansion_cost(32, 32), 0);
        assert_eq!(calculator.memory_expansion_cost(64, 32), 0);
        
        // Expansion from 0 to 32 bytes (1 word)
        let cost = calculator.memory_expansion_cost(0, 32);
        assert!(cost > 0);
        
        // Expansion from 32 to 64 bytes (2 words)
        let cost = calculator.memory_expansion_cost(32, 64);
        assert!(cost > 0);
    }

    #[test]
    fn test_refund_counter() {
        let mut calculator = GasCalculator::new(1_000_000);
        assert_eq!(calculator.refund_counter(), 0);
        
        calculator.add_refund(100);
        assert_eq!(calculator.refund_counter(), 100);
        
        calculator.add_refund(50);
        assert_eq!(calculator.refund_counter(), 150);
    }

    #[test]
    fn test_storage_gas_cost() {
        let calculator = GasCalculator::new(1_000_000);
        
        // First set to non-zero
        let (cost, refund) = calculator.storage_gas_cost(None, 42);
        assert_eq!(cost, 20000);
        assert_eq!(refund, 0);
        
        // Non-zero to zero
        let (cost, refund) = calculator.storage_gas_cost(Some(42), 0);
        assert_eq!(cost, 5000);
        assert_eq!(refund, 15000);
        
        // Non-zero to non-zero
        let (cost, refund) = calculator.storage_gas_cost(Some(42), 100);
        assert_eq!(cost, 5000);
        assert_eq!(refund, 0);
    }

    #[test]
    fn test_reset() {
        let mut calculator = GasCalculator::new(1_000_000);
        calculator.consume_gas(500).unwrap();
        calculator.add_refund(100);
        
        calculator.reset();
        assert_eq!(calculator.gas_used(), 0);
        assert_eq!(calculator.refund_counter(), 0);
        assert_eq!(calculator.gas_remaining(), 1_000_000);
    }
}