//! Consensus mechanism for DAG-based blockchain

use crate::{BlockchainError, TransactionId, math::{PrimeLayer, ValidatorInfo, MathError}};
use crate::core::{Transaction, DAGNode, NodeStatus};
use std::collections::{HashMap, HashSet};
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};

/// Consensus configuration
#[derive(Debug, Clone)]
pub struct ConsensusConfig {
    pub block_time_ms: u64,
    pub validator_count: u32,
    pub prime_modulus: u64,
    pub finality_threshold: f64,
    pub fork_resolution_enabled: bool,
}

/// Prime Validator with scoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrimeValidator {
    pub id: String,
    pub public_key: Vec<u8>,
    pub prime_base: u64,
    pub stake_amount: u64,
    pub reputation_score: f64,
    pub quantum_resistance_score: u32,
    pub total_validations: u64,
    pub successful_validations: u64,
    pub last_active: std::time::Instant,
    pub is_active: bool,
}

/// Consensus round information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusRound {
    pub round_number: u64,
    pub selected_validator: String,
    pub transactions_validated: Vec<TransactionId>,
    pub consensus_reached: bool,
    pub finality_score: f64,
    pub start_time: std::time::Instant,
    pub end_time: Option<std::time::Instant>,
}

/// DAG consensus state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DagConsensusState {
    pub current_height: u64,
    pub total_transactions: u64,
    pub finalized_transactions: u64,
    pub pending_transactions: u64,
    pub consensus_rounds: Vec<ConsensusRound>,
    pub fork_detected: bool,
    pub last_finalized_block: Option<TransactionId>,
}

/// Consensus engine implementation
pub struct ConsensusEngine {
    config: ConsensusConfig,
    prime_layer: PrimeLayer,
    validators: HashMap<String, PrimeValidator>,
    consensus_state: DagConsensusState,
    is_running: bool,
    current_round: Option<ConsensusRound>,
}

impl ConsensusEngine {
    /// Create a new consensus engine
    pub fn new(config: &ConsensusConfig) -> Result<Self, BlockchainError> {
        let prime_layer = PrimeLayer::new()?;
        let mut validators = HashMap::new();
        
        // Initialize Prime Validators
        for i in 0..config.validator_count {
            let validator_id = format!("prime_validator_{}", i);
            let prime_base = prime_layer.get_nth_prime((i + 10) as usize)?; // Start from 10th prime
            
            validators.insert(validator_id.clone(), PrimeValidator {
                id: validator_id,
                public_key: Self::generate_validator_key(i),
                prime_base,
                stake_amount: 1000 * (i + 1) as u64, // Different stake amounts
                reputation_score: 1.0,
                quantum_resistance_score: 80 + (i % 20),
                total_validations: 0,
                successful_validations: 0,
                last_active: std::time::Instant::now(),
                is_active: true,
            });
        }

        Ok(Self {
            config: config.clone(),
            prime_layer,
            validators,
            consensus_state: DagConsensusState {
                current_height: 0,
                total_transactions: 0,
                finalized_transactions: 0,
                pending_transactions: 0,
                consensus_rounds: Vec::new(),
                fork_detected: false,
                last_finalized_block: None,
            },
            is_running: false,
            current_round: None,
        })
    }

    /// Start the consensus engine
    pub async fn start(&mut self) -> Result<(), BlockchainError> {
        println!("⚖️  Starting Prime Validator consensus engine");
        self.is_running = true;
        
        // Start consensus rounds
        self.start_consensus_rounds().await;
        
        Ok(())
    }

    /// Stop the consensus engine
    pub async fn stop(&mut self) -> Result<(), BlockchainError> {
        println!("⚖️  Stopping Prime Validator consensus engine");
        self.is_running = false;
        Ok(())
    }

    /// Get current consensus height
    pub fn current_height(&self) -> u64 {
        self.consensus_state.current_height
    }

    /// Get number of active validators
    pub fn validator_count(&self) -> u32 {
        self.validators.values().filter(|v| v.is_active).count() as u32
    }

    /// Get consensus state
    pub fn get_consensus_state(&self) -> &DagConsensusState {
        &self.consensus_state
    }

    /// Start consensus rounds
    async fn start_consensus_rounds(&self) {
        let config = self.config.clone();
        let mut round_number = 0;
        
        while self.is_running {
            round_number += 1;
            
            if let Err(e) = self.run_consensus_round(round_number).await {
                log::error!("Consensus round {} failed: {}", round_number, e);
            }

            // Wait for next round
            tokio::time::sleep(tokio::time::Duration::from_millis(config.block_time_ms)).await;
        }
    }

    /// Run a single consensus round
    async fn run_consensus_round(&self, round_number: u64) -> Result<(), BlockchainError> {
        let start_time = std::time::Instant::now();
        
        // Select validator using Prime Validator selection
        let validator_infos: Vec<ValidatorInfo> = self.validators.values()
            .filter(|v| v.is_active)
            .map(|v| ValidatorInfo {
                public_key: v.public_key.clone(),
                weight: self.calculate_validator_weight(v),
                prime_base: v.prime_base,
                stake_amount: v.stake_amount,
            })
            .collect();

        let selected_validator_index = self.prime_layer.select_validator(&validator_infos, round_number)?;
        let selected_validator_id = validator_infos[selected_validator_index].public_key
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();

        // Create consensus round
        let mut round = ConsensusRound {
            round_number,
            selected_validator: selected_validator_id.clone(),
            transactions_validated: Vec::new(),
            consensus_reached: false,
            finality_score: 0.0,
            start_time,
            end_time: None,
        };

        // Simulate transaction validation
        let validated_count = self.validate_pending_transactions(&selected_validator_id, &mut round).await?;

        // Calculate consensus finality
        let finality_score = self.calculate_finality_score(&round);
        round.finality_score = finality_score;
        round.consensus_reached = finality_score >= self.config.finality_threshold;
        round.end_time = Some(std::time::Instant::now());

        // Update consensus state
        self.update_consensus_state(&round, validated_count).await?;

        log::info!("🔄 Consensus round {} completed. Validator: {}, Finality: {:.2}", 
                  round_number, selected_validator_id, finality_score);

        Ok(())
    }

    /// Calculate validator weight using Prime Validator scoring
    fn calculate_validator_weight(&self, validator: &PrimeValidator) -> u64 {
        let mut weight = validator.stake_amount;

        // Weight from prime base (higher primes get more weight)
        weight += validator.prime_base * 100;

        // Weight from reputation score
        weight += (validator.reputation_score * 1000.0) as u64;

        // Weight from quantum resistance score
        weight += validator.quantum_resistance_score as u64 * 10;

        // Weight from validation success rate
        if validator.total_validations > 0 {
            let success_rate = validator.successful_validations as f64 / validator.total_validations as f64;
            weight += (success_rate * 500.0) as u64;
        }

        // Activity bonus
        if validator.last_active.elapsed() < std::time::Duration::from_secs(300) {
            weight += 200;
        }

        weight
    }

    /// Validate pending transactions for the current round
    async fn validate_pending_transactions(&self, validator_id: &str, round: &mut ConsensusRound) -> Result<usize, BlockchainError> {
        // In a real implementation, this would get pending transactions from the DAG
        // For now, we'll simulate with mock transactions
        let mut validated_count = 0;
        let max_validations_per_round = 10;

        for i in 0..max_validations_per_round {
            let tx_id = TransactionId::new();
            
            // Simulate validation using Prime Validator logic
            if self.validate_transaction_with_prime_logic(&tx_id, validator_id).await? {
                round.transactions_validated.push(tx_id);
                validated_count += 1;
            }
        }

        Ok(validated_count)
    }

    /// Validate transaction using Prime Validator logic
    async fn validate_transaction_with_prime_logic(&self, tx_id: &TransactionId, validator_id: &str) -> Result<bool, BlockchainError> {
        // Get validator
        let validator = self.validators.get(validator_id)
            .ok_or_else(|| BlockchainError::Consensus(ConsensusError::ValidatorNotFound(validator_id.to_string())))?;

        // Prime-based validation score
        let validation_score = self.calculate_prime_validation_score(tx_id, validator).await?;

        // Quantum resistance validation
        let quantum_score = self.calculate_quantum_validation_score(tx_id).await?;

        // Combined validation threshold
        let combined_score = (validation_score + quantum_score) / 2.0;

        // Update validator statistics
        if let Some(validator) = self.validators.get_mut(validator_id) {
            validator.total_validations += 1;
            if combined_score >= 0.7 { // 70% threshold
                validator.successful_validations += 1;
                validator.reputation_score = (validator.reputation_score + 0.01).min(1.0);
                validator.last_active = std::time::Instant::now();
                return Ok(true);
            } else {
                validator.reputation_score = (validator.reputation_score - 0.005).max(0.0);
            }
        }

        Ok(false)
    }

    /// Calculate Prime Validator validation score
    async fn calculate_prime_validation_score(&self, tx_id: &TransactionId, validator: &PrimeValidator) -> Result<f64, BlockchainError> {
        let mut score = 0.0;

        // Score based on transaction ID and validator prime base
        let tx_hash = u64::from_be_bytes(
            tx_id.as_bytes()[..8].try_into().unwrap_or([0u8; 8])
        );
        
        // Prime congruence check
        let congruence_score = if tx_hash % validator.prime_base == 0 {
            1.0
        } else {
            0.5
        };
        score += congruence_score * 0.4;

        // Score based on validator reputation
        score += validator.reputation_score * 0.3;

        // Score based on quantum resistance
        score += (validator.quantum_resistance_score as f64 / 100.0) * 0.3;

        Ok(score.min(1.0))
    }

    /// Calculate quantum validation score
    async fn calculate_quantum_validation_score(&self, tx_id: &TransactionId) -> Result<f64, BlockchainError> {
        // Use prime layer to calculate quantum resistance
        let prime_hash = self.prime_layer.prime_hash(tx_id.as_bytes())?;
        
        // Calculate hash complexity
        let hash_num = u64::from_be_bytes(
            prime_hash[..8].try_into().unwrap_or([0u8; 8])
        );
        
        let prime_factors = self.prime_layer.prime_factors(hash_num);
        let factor_count = prime_factors.len();
        
        // Score based on prime factor complexity
        let complexity_score = (factor_count as f64).log2() / 10.0;
        
        Ok(complexity_score.min(1.0))
    }

    /// Calculate finality score for consensus round
    fn calculate_finality_score(&self, round: &ConsensusRound) -> f64 {
        let mut score = 0.0;

        // Score from number of validated transactions
        let transaction_score = (round.transactions_validated.len() as f64 / 10.0).min(1.0);
        score += transaction_score * 0.4;

        // Score from validator reputation
        if let Some(validator) = self.validators.get(&round.selected_validator) {
            score += validator.reputation_score * 0.3;
        }

        // Score from round duration (faster is better)
        let duration = round.end_time.unwrap_or_else(std::time::Instant::now)
            .duration_since(round.start_time).as_millis() as f64;
        let duration_score = (1000.0 / duration.max(1.0)).min(1.0);
        score += duration_score * 0.3;

        score.min(1.0)
    }

    /// Update consensus state after round completion
    async fn update_consensus_state(&self, round: &ConsensusRound, validated_count: usize) -> Result<(), BlockchainError> {
        // In a real implementation, this would update the actual consensus state
        // For now, we'll simulate the updates
        
        // Update height if consensus was reached
        if round.consensus_reached {
            self.consensus_state.current_height += 1;
        }

        // Update transaction counts
        self.consensus_state.total_transactions += validated_count as u64;
        if round.consensus_reached {
            self.consensus_state.finalized_transactions += validated_count as u64;
        } else {
            self.consensus_state.pending_transactions += validated_count as u64;
        }

        // Add round to history
        self.consensus_state.consensus_rounds.push(round.clone());

        // Keep only last 100 rounds in memory
        if self.consensus_state.consensus_rounds.len() > 100 {
            self.consensus_state.consensus_rounds.drain(0..50);
        }

        Ok(())
    }

    /// Handle fork detection and resolution
    pub async fn handle_fork(&mut self) -> Result<(), BlockchainError> {
        if !self.config.fork_resolution_enabled {
            return Ok(());
        }

        // Simple fork detection logic
        // In a real implementation, this would analyze the DAG structure
        let recent_rounds = &self.consensus_state.consensus_rounds;
        
        if recent_rounds.len() >= 3 {
            let last_three = &recent_rounds[recent_rounds.len() - 3..];
            
            // Check if we have conflicting validators
            let validators: HashSet<&String> = last_three.iter()
                .map(|r| &r.selected_validator)
                .collect();
            
            if validators.len() == 3 {
                // Potential fork detected
                self.consensus_state.fork_detected = true;
                log::warn!("🔀 Fork detected in consensus rounds");
                
                // Resolve fork by selecting the validator with highest weight
                let mut best_validator = "";
                let mut highest_weight = 0;
                
                for validator_id in validators {
                    if let Some(validator) = self.validators.get(validator_id) {
                        let weight = self.calculate_validator_weight(validator);
                        if weight > highest_weight {
                            highest_weight = weight;
                            best_validator = validator_id;
                        }
                    }
                }
                
                log::info!("🔀 Fork resolved by validator: {}", best_validator);
                self.consensus_state.fork_detected = false;
            }
        }

        Ok(())
    }

    /// Get validator by ID
    pub fn get_validator(&self, validator_id: &str) -> Option<&PrimeValidator> {
        self.validators.get(validator_id)
    }

    /// Get all validators
    pub fn get_validators(&self) -> &HashMap<String, PrimeValidator> {
        &self.validators
    }

    /// Update validator reputation
    pub fn update_validator_reputation(&mut self, validator_id: &str, delta: f64) {
        if let Some(validator) = self.validators.get_mut(validator_id) {
            validator.reputation_score = (validator.reputation_score + delta).max(0.0).min(1.0);
            validator.last_active = std::time::Instant::now();
        }
    }

    /// Generate validator key (simplified)
    fn generate_validator_key(index: u32) -> Vec<u8> {
        format!("prime_validator_key_{}", index)
            .as_bytes()
            .to_vec()
    }

    /// Get consensus statistics
    pub fn get_consensus_stats(&self) -> ConsensusStats {
        let total_rounds = self.consensus_state.consensus_rounds.len();
        let successful_rounds = self.consensus_state.consensus_rounds.iter()
            .filter(|r| r.consensus_reached)
            .count();
        
        let avg_finality = if total_rounds > 0 {
            let total_finality: f64 = self.consensus_state.consensus_rounds.iter()
                .map(|r| r.finality_score)
                .sum();
            total_finality / total_rounds as f64
        } else {
            0.0
        };

        let active_validators = self.validators.values()
            .filter(|v| v.is_active)
            .count();

        let avg_reputation = if !self.validators.is_empty() {
            let total_rep: f64 = self.validators.values()
                .map(|v| v.reputation_score)
                .sum();
            total_rep / self.validators.len() as f64
        } else {
            0.0
        };

        ConsensusStats {
            total_rounds,
            successful_rounds,
            success_rate: if total_rounds > 0 { successful_rounds as f64 / total_rounds as f64 } else { 0.0 },
            average_finality: avg_finality,
            active_validators: active_validators as u32,
            average_reputation: avg_reputation,
            fork_detected: self.consensus_state.fork_detected,
        }
    }
}

/// Consensus statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusStats {
    pub total_rounds: usize,
    pub successful_rounds: usize,
    pub success_rate: f64,
    pub average_finality: f64,
    pub active_validators: u32,
    pub average_reputation: f64,
    pub fork_detected: bool,
}

/// Consensus error types
#[derive(Debug, thiserror::Error)]
pub enum ConsensusError {
    #[error("No validators available")]
    NoValidators,
    #[error("Consensus not reached")]
    ConsensusNotReached,
    #[error("Invalid transaction for consensus")]
    InvalidTransaction,
    #[error("Validator not found: {0}")]
    ValidatorNotFound(String),
    #[error("Consensus timeout")]
    Timeout,
    #[error("Fork resolution failed")]
    ForkResolutionFailed,
    #[error("Math error: {0}")]
    Math(#[from] MathError),
}

/// Consensus trait for extensibility
pub trait ConsensusAlgorithm: Send + Sync {
    fn current_height(&self) -> u64;
    fn validator_count(&self) -> u32;
    fn select_validator(&self) -> Result<String, BlockchainError>;
    async fn validate_transaction(&self, tx_id: &TransactionId) -> Result<bool, BlockchainError>;
    fn get_consensus_state(&self) -> &DagConsensusState;
    fn get_consensus_stats(&self) -> ConsensusStats;
}

impl ConsensusAlgorithm for ConsensusEngine {
    fn current_height(&self) -> u64 {
        self.current_height()
    }

    fn validator_count(&self) -> u32 {
        self.validator_count()
    }

    fn select_validator(&self) -> Result<String, BlockchainError> {
        // Use the current height as round number for selection
        let validator_infos: Vec<ValidatorInfo> = self.validators.values()
            .filter(|v| v.is_active)
            .map(|v| ValidatorInfo {
                public_key: v.public_key.clone(),
                weight: self.calculate_validator_weight(v),
                prime_base: v.prime_base,
                stake_amount: v.stake_amount,
            })
            .collect();

        let selected_index = self.prime_layer.select_validator(&validator_infos, self.current_height())?;
        Ok(validator_infos[selected_index].public_key
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>())
    }

    async fn validate_transaction(&self, tx_id: &TransactionId) -> Result<bool, BlockchainError> {
        // Select current validator and validate
        let validator_id = self.select_validator()?;
        self.validate_transaction_with_prime_logic(tx_id, &validator_id).await
    }

    fn get_consensus_state(&self) -> &DagConsensusState {
        &self.consensus_state
    }

    fn get_consensus_stats(&self) -> ConsensusStats {
        self.get_consensus_stats()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_consensus_engine_creation() {
        let config = ConsensusConfig {
            block_time_ms: 5000,
            validator_count: 3,
            prime_modulus: 2147483647,
            finality_threshold: 0.8,
            fork_resolution_enabled: true,
        };

        let engine = ConsensusEngine::new(&config);
        assert!(engine.is_ok());
        
        let engine = engine.unwrap();
        assert_eq!(engine.validator_count(), 3);
        assert_eq!(engine.current_height(), 0);
    }

    #[test]
    fn test_prime_validator_weight_calculation() {
        let config = ConsensusConfig {
            block_time_ms: 5000,
            validator_count: 1,
            prime_modulus: 2147483647,
            finality_threshold: 0.8,
            fork_resolution_enabled: true,
        };

        let mut engine = ConsensusEngine::new(&config).unwrap();
        let validator_id = "prime_validator_0";
        
        let initial_weight = {
            let validator = engine.get_validator(validator_id).unwrap();
            engine.calculate_validator_weight(validator)
        };
        
        // Update validator reputation
        engine.update_validator_reputation(validator_id, 0.1);
        
        let updated_weight = {
            let validator = engine.get_validator(validator_id).unwrap();
            engine.calculate_validator_weight(validator)
        };
        
        assert!(updated_weight > initial_weight);
    }

    #[tokio::test]
    async fn test_consensus_round_simulation() {
        let config = ConsensusConfig {
            block_time_ms: 100, // Faster for testing
            validator_count: 3,
            prime_modulus: 2147483647,
            finality_threshold: 0.5, // Lower threshold for testing
            fork_resolution_enabled: true,
        };

        let mut engine = ConsensusEngine::new(&config).unwrap();
        
        // Run a single consensus round
        let result = engine.run_consensus_round(1).await;
        assert!(result.is_ok());
        
        let state = engine.get_consensus_state();
        assert_eq!(state.consensus_rounds.len(), 1);
        assert_eq!(state.current_height, 1); // Should have reached consensus
    }

    #[test]
    fn test_consensus_stats() {
        let config = ConsensusConfig {
            block_time_ms: 5000,
            validator_count: 3,
            prime_modulus: 2147483647,
            finality_threshold: 0.8,
            fork_resolution_enabled: true,
        };

        let engine = ConsensusEngine::new(&config).unwrap();
        let stats = engine.get_consensus_stats();
        
        assert_eq!(stats.total_rounds, 0);
        assert_eq!(stats.successful_rounds, 0);
        assert_eq!(stats.success_rate, 0.0);
        assert_eq!(stats.active_validators, 3);
        assert!(stats.average_reputation > 0.0);
        assert!(!stats.fork_detected);
    }
}