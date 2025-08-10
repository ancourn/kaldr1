//! Stack Management Module for KALDRIX EVM
//! 
//! This module implements EVM stack operations with optimized performance
//! and security considerations for the KALDRIX blockchain.

use crate::evm::bytecode_interpreter::{ExecutionError, U256};

/// Stack manager for EVM operations
pub struct StackManager {
    /// EVM stack
    stack: Vec<U256>,
    /// Maximum stack size
    max_size: usize,
    /// Current stack depth
    depth: usize,
}

impl StackManager {
    /// Create a new stack manager with maximum size
    pub fn new(max_size: usize) -> Self {
        Self {
            stack: Vec::with_capacity(max_size),
            max_size,
            depth: 0,
        }
    }
    
    /// Get current stack size
    pub fn size(&self) -> usize {
        self.depth
    }
    
    /// Get maximum stack size
    pub fn max_size(&self) -> usize {
        self.max_size
    }
    
    /// Check if stack is empty
    pub fn is_empty(&self) -> bool {
        self.depth == 0
    }
    
    /// Check if stack is full
    pub fn is_full(&self) -> bool {
        self.depth >= self.max_size
    }
    
    /// Push a value onto the stack
    pub fn push(&mut self, value: U256) -> Result<(), ExecutionError> {
        if self.depth >= self.max_size {
            return Err(ExecutionError::StackOverflow);
        }
        
        if self.depth == self.stack.len() {
            self.stack.push(value);
        } else {
            self.stack[self.depth] = value;
        }
        
        self.depth += 1;
        Ok(())
    }
    
    /// Pop a value from the stack
    pub fn pop(&mut self) -> Result<U256, ExecutionError> {
        if self.depth == 0 {
            return Err(ExecutionError::StackUnderflow);
        }
        
        self.depth -= 1;
        Ok(self.stack[self.depth])
    }
    
    /// Peek at a value on the stack without removing it
    pub fn peek(&self, depth: usize) -> Result<U256, ExecutionError> {
        if depth >= self.depth {
            return Err(ExecutionError::StackUnderflow);
        }
        
        Ok(self.stack[self.depth - 1 - depth])
    }
    
    /// Swap the top element with an element at specified depth
    pub fn swap(&mut self, depth: usize) -> Result<(), ExecutionError> {
        if depth == 0 {
            return Ok(()); // SWAP0 is a no-op
        }
        
        if depth >= self.depth {
            return Err(ExecutionError::StackUnderflow);
        }
        
        let top_index = self.depth - 1;
        let target_index = self.depth - 1 - depth;
        
        self.stack.swap(top_index, target_index);
        Ok(())
    }
    
    /// Duplicate an element at specified depth to the top of the stack
    pub fn dup(&mut self, depth: usize) -> Result<(), ExecutionError> {
        if depth >= self.depth {
            return Err(ExecutionError::StackUnderflow);
        }
        
        let value = self.stack[self.depth - 1 - depth];
        self.push(value)
    }
    
    /// Get the top element of the stack
    pub fn top(&self) -> Result<U256, ExecutionError> {
        self.peek(0)
    }
    
    /// Get the second element of the stack
    pub fn second(&self) -> Result<U256, ExecutionError> {
        self.peek(1)
    }
    
    /// Get the third element of the stack
    pub fn third(&self) -> Result<U256, ExecutionError> {
        self.peek(2)
    }
    
    /// Get the fourth element of the stack
    pub fn fourth(&self) -> Result<U256, ExecutionError> {
        self.peek(3)
    }
    
    /// Pop multiple values from the stack
    pub fn pop_n(&mut self, count: usize) -> Result<Vec<U256>, ExecutionError> {
        if count > self.depth {
            return Err(ExecutionError::StackUnderflow);
        }
        
        let mut values = Vec::with_capacity(count);
        for _ in 0..count {
            values.push(self.pop()?);
        }
        
        // Reverse to maintain order
        values.reverse();
        Ok(values)
    }
    
    /// Push multiple values onto the stack
    pub fn push_n(&mut self, values: &[U256]) -> Result<(), ExecutionError> {
        if self.depth + values.len() > self.max_size {
            return Err(ExecutionError::StackOverflow);
        }
        
        for &value in values {
            self.push(value)?;
        }
        
        Ok(())
    }
    
    /// Clear the stack
    pub fn clear(&mut self) {
        self.depth = 0;
    }
    
    /// Get the entire stack as a slice
    pub fn as_slice(&self) -> &[U256] {
        &self.stack[..self.depth]
    }
    
    /// Get the entire stack as a mutable slice
    pub fn as_slice_mut(&mut self) -> &mut [U256] {
        &mut self.stack[..self.depth]
    }
    
    /// Get stack capacity
    pub fn capacity(&self) -> usize {
        self.stack.capacity()
    }
    
    /// Reserve additional capacity
    pub fn reserve(&mut self, additional: usize) {
        self.stack.reserve(additional);
    }
    
    /// Shrink stack capacity to fit current size
    pub fn shrink_to_fit(&mut self) {
        self.stack.shrink_to_fit();
    }
}

/// Stack iterator for traversing stack elements
pub struct StackIterator<'a> {
    stack: &'a StackManager,
    index: usize,
}

impl<'a> Iterator for StackIterator<'a> {
    type Item = U256;
    
    fn next(&mut self) -> Option<Self::Item> {
        if self.index >= self.stack.depth {
            return None;
        }
        
        let value = self.stack.stack[self.stack.depth - 1 - self.index];
        self.index += 1;
        Some(value)
    }
}

impl<'a> IntoIterator for &'a StackManager {
    type Item = U256;
    type IntoIter = StackIterator<'a>;
    
    fn into_iter(self) -> Self::IntoIter {
        StackIterator {
            stack: self,
            index: 0,
        }
    }
}

/// Stack snapshot for saving and restoring stack state
#[derive(Clone)]
pub struct StackSnapshot {
    stack: Vec<U256>,
    depth: usize,
}

impl StackManager {
    /// Create a snapshot of the current stack state
    pub fn snapshot(&self) -> StackSnapshot {
        StackSnapshot {
            stack: self.stack[..self.depth].to_vec(),
            depth: self.depth,
        }
    }
    
    /// Restore stack from a snapshot
    pub fn restore(&mut self, snapshot: StackSnapshot) -> Result<(), ExecutionError> {
        if snapshot.depth > self.max_size {
            return Err(ExecutionError::StackOverflow);
        }
        
        self.stack[..snapshot.depth].copy_from_slice(&snapshot.stack);
        self.depth = snapshot.depth;
        
        Ok(())
    }
}

impl StackSnapshot {
    /// Get the depth of the snapshot
    pub fn depth(&self) -> usize {
        self.depth
    }
    
    /// Get the stack data
    pub fn data(&self) -> &[U256] {
        &self.stack
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stack_manager_creation() {
        let stack = StackManager::new(1024);
        assert_eq!(stack.size(), 0);
        assert_eq!(stack.max_size(), 1024);
        assert!(stack.is_empty());
        assert!(!stack.is_full());
    }

    #[test]
    fn test_stack_push_pop() {
        let mut stack = StackManager::new(10);
        
        // Push values
        let val1 = U256::from_u64(42);
        let val2 = U256::from_u64(100);
        
        stack.push(val1).unwrap();
        assert_eq!(stack.size(), 1);
        assert_eq!(stack.top().unwrap(), val1);
        
        stack.push(val2).unwrap();
        assert_eq!(stack.size(), 2);
        assert_eq!(stack.top().unwrap(), val2);
        
        // Pop values
        let popped = stack.pop().unwrap();
        assert_eq!(popped, val2);
        assert_eq!(stack.size(), 1);
        
        let popped = stack.pop().unwrap();
        assert_eq!(popped, val1);
        assert_eq!(stack.size(), 0);
        assert!(stack.is_empty());
    }

    #[test]
    fn test_stack_peek() {
        let mut stack = StackManager::new(10);
        
        let val1 = U256::from_u64(10);
        let val2 = U256::from_u64(20);
        let val3 = U256::from_u64(30);
        
        stack.push(val1).unwrap();
        stack.push(val2).unwrap();
        stack.push(val3).unwrap();
        
        assert_eq!(stack.size(), 3);
        assert_eq!(stack.peek(0).unwrap(), val3);
        assert_eq!(stack.peek(1).unwrap(), val2);
        assert_eq!(stack.peek(2).unwrap(), val1);
        
        // Test convenience methods
        assert_eq!(stack.top().unwrap(), val3);
        assert_eq!(stack.second().unwrap(), val2);
        assert_eq!(stack.third().unwrap(), val1);
    }

    #[test]
    fn test_stack_swap() {
        let mut stack = StackManager::new(10);
        
        let val1 = U256::from_u64(10);
        let val2 = U256::from_u64(20);
        let val3 = U256::from_u64(30);
        
        stack.push(val1).unwrap();
        stack.push(val2).unwrap();
        stack.push(val3).unwrap();
        
        // Swap top with second element
        stack.swap(1).unwrap();
        assert_eq!(stack.top().unwrap(), val2);
        assert_eq!(stack.second().unwrap(), val3);
        assert_eq!(stack.third().unwrap(), val1);
        
        // Swap top with third element
        stack.swap(2).unwrap();
        assert_eq!(stack.top().unwrap(), val1);
        assert_eq!(stack.second().unwrap(), val3);
        assert_eq!(stack.third().unwrap(), val2);
    }

    #[test]
    fn test_stack_dup() {
        let mut stack = StackManager::new(10);
        
        let val1 = U256::from_u64(10);
        let val2 = U256::from_u64(20);
        
        stack.push(val1).unwrap();
        stack.push(val2).unwrap();
        
        // Duplicate top element
        stack.dup(0).unwrap();
        assert_eq!(stack.size(), 3);
        assert_eq!(stack.top().unwrap(), val2);
        assert_eq!(stack.second().unwrap(), val2);
        assert_eq!(stack.third().unwrap(), val1);
        
        // Duplicate second element
        stack.dup(1).unwrap();
        assert_eq!(stack.size(), 4);
        assert_eq!(stack.top().unwrap(), val2);
        assert_eq!(stack.second().unwrap(), val2);
        assert_eq!(stack.third().unwrap(), val2);
    }

    #[test]
    fn test_stack_multiple_operations() {
        let mut stack = StackManager::new(10);
        
        let values = vec![
            U256::from_u64(1),
            U256::from_u64(2),
            U256::from_u64(3),
            U256::from_u64(4),
            U256::from_u64(5),
        ];
        
        // Push multiple values
        stack.push_n(&values).unwrap();
        assert_eq!(stack.size(), 5);
        
        // Pop multiple values
        let popped = stack.pop_n(3).unwrap();
        assert_eq!(popped.len(), 3);
        assert_eq!(popped[0], U256::from_u64(3));
        assert_eq!(popped[1], U256::from_u64(4));
        assert_eq!(popped[2], U256::from_u64(5));
        assert_eq!(stack.size(), 2);
    }

    #[test]
    fn test_stack_errors() {
        let mut stack = StackManager::new(3);
        
        // Test stack underflow
        assert!(stack.pop().is_err());
        assert!(stack.peek(0).is_err());
        assert!(stack.swap(0).is_ok()); // SWAP0 is allowed
        assert!(stack.swap(1).is_err());
        assert!(stack.dup(0).is_err());
        
        // Test stack overflow
        stack.push(U256::from_u64(1)).unwrap();
        stack.push(U256::from_u64(2)).unwrap();
        stack.push(U256::from_u64(3)).unwrap();
        assert!(stack.is_full());
        assert!(stack.push(U256::from_u64(4)).is_err());
    }

    #[test]
    fn test_stack_iterator() {
        let mut stack = StackManager::new(10);
        
        stack.push(U256::from_u64(1)).unwrap();
        stack.push(U256::from_u64(2)).unwrap();
        stack.push(U256::from_u64(3)).unwrap();
        
        let values: Vec<U256> = stack.into_iter().collect();
        assert_eq!(values, vec![
            U256::from_u64(3),
            U256::from_u64(2),
            U256::from_u64(1),
        ]);
    }

    #[test]
    fn test_stack_snapshot() {
        let mut stack = StackManager::new(10);
        
        stack.push(U256::from_u64(1)).unwrap();
        stack.push(U256::from_u64(2)).unwrap();
        stack.push(U256::from_u64(3)).unwrap();
        
        // Create snapshot
        let snapshot = stack.snapshot();
        assert_eq!(snapshot.depth(), 3);
        
        // Modify stack
        stack.pop().unwrap();
        stack.push(U256::from_u64(99)).unwrap();
        
        // Restore from snapshot
        stack.restore(snapshot).unwrap();
        assert_eq!(stack.size(), 3);
        assert_eq!(stack.top().unwrap(), U256::from_u64(3));
        assert_eq!(stack.second().unwrap(), U256::from_u64(2));
        assert_eq!(stack.third().unwrap(), U256::from_u64(1));
    }

    #[test]
    fn test_stack_clear() {
        let mut stack = StackManager::new(10);
        
        stack.push(U256::from_u64(1)).unwrap();
        stack.push(U256::from_u64(2)).unwrap();
        stack.push(U256::from_u64(3)).unwrap();
        
        assert_eq!(stack.size(), 3);
        
        stack.clear();
        assert_eq!(stack.size(), 0);
        assert!(stack.is_empty());
    }
}