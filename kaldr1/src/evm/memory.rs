//! Memory Management Module for KALDRIX EVM
//! 
//! This module implements EVM memory management with optimized performance
//! and security considerations for the KALDRIX blockchain.

use crate::evm::bytecode_interpreter::ExecutionError;

/// Memory manager for EVM operations
pub struct MemoryManager {
    /// Memory storage
    memory: Vec<u8>,
    /// Maximum memory size
    max_size: usize,
    /// Current memory cost
    current_cost: u64,
}

impl MemoryManager {
    /// Create a new memory manager with maximum size
    pub fn new(max_size: usize) -> Self {
        Self {
            memory: Vec::new(),
            max_size,
            current_cost: 0,
        }
    }
    
    /// Get current memory size in bytes
    pub fn size(&self) -> usize {
        self.memory.len()
    }
    
    /// Get current memory cost
    pub fn cost(&self) -> u64 {
        self.current_cost
    }
    
    /// Expand memory to specified size
    pub fn expand(&mut self, new_size: usize) -> Result<u64, ExecutionError> {
        if new_size > self.max_size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        if new_size <= self.memory.len() {
            return Ok(0);
        }
        
        // Calculate expansion cost
        let expansion_cost = self.calculate_expansion_cost(new_size)?;
        self.current_cost += expansion_cost;
        
        // Expand memory with zeros
        self.memory.resize(new_size, 0);
        
        Ok(expansion_cost)
    }
    
    /// Ensure memory is at least the specified size
    pub fn ensure_size(&mut self, size: usize) -> Result<u64, ExecutionError> {
        if size > self.memory.len() {
            self.expand(size)
        } else {
            Ok(0)
        }
    }
    
    /// Read a byte from memory at specified offset
    pub fn read_byte(&self, offset: usize) -> Result<u8, ExecutionError> {
        if offset >= self.memory.len() {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        Ok(self.memory[offset])
    }
    
    /// Write a byte to memory at specified offset
    pub fn write_byte(&mut self, offset: usize, value: u8) -> Result<u64, ExecutionError> {
        let cost = self.ensure_size(offset + 1)?;
        self.memory[offset] = value;
        Ok(cost)
    }
    
    /// Read a word (32 bytes) from memory at specified offset
    pub fn read_word(&self, offset: usize) -> Result<[u8; 32], ExecutionError> {
        let end = offset + 32;
        if end > self.memory.len() {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        let mut word = [0u8; 32];
        word.copy_from_slice(&self.memory[offset..end]);
        Ok(word)
    }
    
    /// Write a word (32 bytes) to memory at specified offset
    pub fn write_word(&mut self, offset: usize, word: &[u8; 32]) -> Result<u64, ExecutionError> {
        let cost = self.ensure_size(offset + 32)?;
        self.memory[offset..offset + 32].copy_from_slice(word);
        Ok(cost)
    }
    
    /// Read a slice of bytes from memory
    pub fn read_slice(&self, offset: usize, size: usize) -> Result<Vec<u8>, ExecutionError> {
        let end = offset + size;
        if end > self.memory.len() {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        Ok(self.memory[offset..end].to_vec())
    }
    
    /// Write a slice of bytes to memory
    pub fn write_slice(&mut self, offset: usize, data: &[u8]) -> Result<u64, ExecutionError> {
        let end = offset + data.len();
        let cost = self.ensure_size(end)?;
        self.memory[offset..end].copy_from_slice(data);
        Ok(cost)
    }
    
    /// Copy data within memory
    pub fn copy(&mut self, dest_offset: usize, src_offset: usize, size: usize) -> Result<u64, ExecutionError> {
        let dest_end = dest_offset + size;
        let src_end = src_offset + size;
        
        if dest_end > self.max_size || src_end > self.max_size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        let cost = self.ensure_size(std::cmp::max(dest_end, src_end))?;
        
        // Handle overlapping regions
        if dest_offset < src_offset {
            // Copy forward
            for i in 0..size {
                self.memory[dest_offset + i] = self.memory[src_offset + i];
            }
        } else {
            // Copy backward
            for i in (0..size).rev() {
                self.memory[dest_offset + i] = self.memory[src_offset + i];
            }
        }
        
        Ok(cost)
    }
    
    /// Get a reference to the memory data
    pub fn data(&self) -> &[u8] {
        &self.memory
    }
    
    /// Get a mutable reference to the memory data
    pub fn data_mut(&mut self) -> &mut [u8] {
        &mut self.memory
    }
    
    /// Clear memory
    pub fn clear(&mut self) {
        self.memory.clear();
        self.current_cost = 0;
    }
    
    /// Calculate memory expansion cost
    fn calculate_expansion_cost(&self, new_size: usize) -> Result<u64, ExecutionError> {
        let current_words = (self.memory.len() + 31) / 32;
        let new_words = (new_size + 31) / 32;
        
        if new_words <= current_words {
            return Ok(0);
        }
        
        // Cost formula: 3 * new_words + new_words^2 / 512
        let new_cost = 3 * new_words as u64 + (new_words as u64 * new_words as u64) / 512;
        let current_cost = 3 * current_words as u64 + (current_words as u64 * current_words as u64) / 512;
        
        Ok(new_cost - current_cost)
    }
}

/// Memory region for efficient access
pub struct MemoryRegion<'a> {
    memory: &'a [u8],
    offset: usize,
    size: usize,
}

impl<'a> MemoryRegion<'a> {
    /// Create a new memory region
    pub fn new(memory: &'a [u8], offset: usize, size: usize) -> Result<Self, ExecutionError> {
        let end = offset + size;
        if end > memory.len() {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        Ok(Self {
            memory,
            offset,
            size,
        })
    }
    
    /// Get the size of the region
    pub fn size(&self) -> usize {
        self.size
    }
    
    /// Read a byte from the region
    pub fn read_byte(&self, offset: usize) -> Result<u8, ExecutionError> {
        if offset >= self.size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        Ok(self.memory[self.offset + offset])
    }
    
    /// Read a word (32 bytes) from the region
    pub fn read_word(&self, offset: usize) -> Result<[u8; 32], ExecutionError> {
        let end = offset + 32;
        if end > self.size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        let mut word = [0u8; 32];
        word.copy_from_slice(&self.memory[self.offset + offset..self.offset + end]);
        Ok(word)
    }
    
    /// Read a slice from the region
    pub fn read_slice(&self, offset: usize, size: usize) -> Result<Vec<u8>, ExecutionError> {
        let end = offset + size;
        if end > self.size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        Ok(self.memory[self.offset + offset..self.offset + end].to_vec())
    }
    
    /// Get the entire region as a slice
    pub fn as_slice(&self) -> &[u8] {
        &self.memory[self.offset..self.offset + self.size]
    }
}

/// Mutable memory region for efficient access
pub struct MemoryRegionMut<'a> {
    memory: &'a mut [u8],
    offset: usize,
    size: usize,
}

impl<'a> MemoryRegionMut<'a> {
    /// Create a new mutable memory region
    pub fn new(memory: &'a mut [u8], offset: usize, size: usize) -> Result<Self, ExecutionError> {
        let end = offset + size;
        if end > memory.len() {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        Ok(Self {
            memory,
            offset,
            size,
        })
    }
    
    /// Get the size of the region
    pub fn size(&self) -> usize {
        self.size
    }
    
    /// Read a byte from the region
    pub fn read_byte(&self, offset: usize) -> Result<u8, ExecutionError> {
        if offset >= self.size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        Ok(self.memory[self.offset + offset])
    }
    
    /// Write a byte to the region
    pub fn write_byte(&mut self, offset: usize, value: u8) -> Result<(), ExecutionError> {
        if offset >= self.size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        self.memory[self.offset + offset] = value;
        Ok(())
    }
    
    /// Write a word (32 bytes) to the region
    pub fn write_word(&mut self, offset: usize, word: &[u8; 32]) -> Result<(), ExecutionError> {
        let end = offset + 32;
        if end > self.size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        self.memory[self.offset + offset..self.offset + end].copy_from_slice(word);
        Ok(())
    }
    
    /// Write a slice to the region
    pub fn write_slice(&mut self, offset: usize, data: &[u8]) -> Result<(), ExecutionError> {
        let end = offset + data.len();
        if end > self.size {
            return Err(ExecutionError::InvalidMemoryAccess);
        }
        
        self.memory[self.offset + offset..self.offset + end].copy_from_slice(data);
        Ok(())
    }
    
    /// Get the entire region as a slice
    pub fn as_slice(&self) -> &[u8] {
        &self.memory[self.offset..self.offset + self.size]
    }
    
    /// Get the entire region as a mutable slice
    pub fn as_slice_mut(&mut self) -> &mut [u8] {
        &mut self.memory[self.offset..self.offset + self.size]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_manager_creation() {
        let memory = MemoryManager::new(1024);
        assert_eq!(memory.size(), 0);
        assert_eq!(memory.cost(), 0);
    }

    #[test]
    fn test_memory_expansion() {
        let mut memory = MemoryManager::new(1024);
        
        // Expand to 32 bytes
        let cost = memory.expand(32).unwrap();
        assert_eq!(memory.size(), 32);
        assert!(cost > 0);
        
        // Expand to 64 bytes
        let cost = memory.expand(64).unwrap();
        assert_eq!(memory.size(), 64);
        assert!(cost > 0);
        
        // No expansion needed
        let cost = memory.expand(64).unwrap();
        assert_eq!(cost, 0);
    }

    #[test]
    fn test_memory_read_write() {
        let mut memory = MemoryManager::new(1024);
        
        // Write and read byte
        memory.write_byte(10, 42).unwrap();
        assert_eq!(memory.read_byte(10).unwrap(), 42);
        
        // Write and read word
        let word = [1u8, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
        memory.write_word(32, &word).unwrap();
        let read_word = memory.read_word(32).unwrap();
        assert_eq!(read_word, word);
        
        // Write and read slice
        let slice = [100u8, 101, 102, 103];
        memory.write_slice(64, &slice).unwrap();
        let read_slice = memory.read_slice(64, 4).unwrap();
        assert_eq!(read_slice, slice);
    }

    #[test]
    fn test_memory_copy() {
        let mut memory = MemoryManager::new(1024);
        
        // Write some data
        let data = [1u8, 2, 3, 4, 5];
        memory.write_slice(10, &data).unwrap();
        
        // Copy data
        memory.copy(20, 10, 5).unwrap();
        
        // Verify copy
        let copied_data = memory.read_slice(20, 5).unwrap();
        assert_eq!(copied_data, data);
    }

    #[test]
    fn test_memory_region() {
        let mut memory = MemoryManager::new(1024);
        memory.expand(100).unwrap();
        
        // Write some data
        for i in 0..50 {
            memory.write_byte(i, i as u8).unwrap();
        }
        
        // Create region
        let region = MemoryRegion::new(memory.data(), 10, 20).unwrap();
        assert_eq!(region.size(), 20);
        assert_eq!(region.read_byte(5).unwrap(), 15);
        
        // Create mutable region
        let mut region_mut = MemoryRegionMut::new(memory.data_mut(), 30, 20).unwrap();
        region_mut.write_byte(5, 99).unwrap();
        assert_eq!(memory.read_byte(35).unwrap(), 99);
    }

    #[test]
    fn test_memory_errors() {
        let mut memory = MemoryManager::new(100);
        
        // Test out of bounds access
        assert!(memory.read_byte(200).is_err());
        assert!(memory.write_byte(200, 42).is_err());
        assert!(memory.read_word(200).is_err());
        assert!(memory.write_word(200, &[0u8; 32]).is_err());
        assert!(memory.read_slice(200, 10).is_err());
        assert!(memory.write_slice(200, &[1u8, 2, 3]).is_err());
        
        // Test expansion beyond limit
        assert!(memory.expand(200).is_err());
    }

    #[test]
    fn test_memory_clear() {
        let mut memory = MemoryManager::new(1024);
        memory.expand(100).unwrap();
        memory.write_byte(50, 42).unwrap();
        
        memory.clear();
        assert_eq!(memory.size(), 0);
        assert_eq!(memory.cost(), 0);
    }
}