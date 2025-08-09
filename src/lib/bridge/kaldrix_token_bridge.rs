use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use libsecp256k1::{SecretKey, PublicKey, Signature, Message, recover};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

/// KALDRIX Token Bridge Implementation
/// Handles token unlocking on KALDRIX chain with cryptographic proof verification

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUnlockRequest {
    pub token_id: String,
    pub from_evm_address: String,
    pub to_kaldrix_address: String,
    pub amount: u64,
    pub nonce: u64,
    pub chain_id: u64,
    pub signatures: Vec<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenLockRequest {
    pub token_id: String,
    pub from_kaldrix_address: String,
    pub to_evm_address: String,
    pub amount: u64,
    pub nonce: u64,
    pub signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeValidator {
    pub address: String,
    pub public_key: String,
    pub is_active: bool,
    pub stake_amount: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeConfig {
    pub validator_threshold: u8,
    pub max_validators: u8,
    pub min_threshold: u8,
    pub supported_tokens: Vec<String>,
}

pub struct KaldrixTokenBridge {
    validators: HashMap<String, BridgeValidator>,
    config: BridgeConfig,
    processed_nonces: HashMap<u64, bool>,
    user_nonces: HashMap<String, u64>,
    total_nonce: u64,
}

impl KaldrixTokenBridge {
    /// Create a new KALDRIX token bridge instance
    pub fn new(config: BridgeConfig) -> Self {
        Self {
            validators: HashMap::new(),
            config,
            processed_nonces: HashMap::new(),
            user_nonces: HashMap::new(),
            total_nonce: 0,
        }
    }

    /// Add a validator to the bridge
    pub fn add_validator(&mut self, validator: BridgeValidator) -> Result<(), String> {
        if self.validators.len() >= self.config.max_validators as usize {
            return Err("Maximum validators reached".to_string());
        }

        if self.validators.contains_key(&validator.address) {
            return Err("Validator already exists".to_string());
        }

        self.validators.insert(validator.address.clone(), validator);
        Ok(())
    }

    /// Remove a validator from the bridge
    pub fn remove_validator(&mut self, address: &str) -> Result<(), String> {
        if !self.validators.contains_key(address) {
            return Err("Validator not found".to_string());
        }

        self.validators.remove(address);
        Ok(())
    }

    /// Process token unlock from EVM chain
    pub fn unlock_tokens(&mut self, request: TokenUnlockRequest) -> Result<(), String> {
        // Validate request
        self.validate_unlock_request(&request)?;

        // Verify cryptographic proofs
        self.verify_signatures(&request)?;

        // Mark nonce as processed
        self.processed_nonces.insert(request.nonce, true);

        // Mint tokens to recipient on KALDRIX chain
        self.mint_tokens(&request.to_kaldrix_address, request.amount, &request.token_id)?;

        Ok(())
    }

    /// Lock tokens to be bridged to EVM chain
    pub fn lock_tokens(&mut self, request: TokenLockRequest) -> Result<(), String> {
        // Validate request
        self.validate_lock_request(&request)?;

        // Verify user signature
        self.verify_user_signature(&request)?;

        // Get user nonce
        let user_nonce = self.user_nonces.entry(request.from_kaldrix_address.clone())
            .or_insert(0);
        *user_nonce += 1;
        self.total_nonce += 1;

        // Burn tokens on KALDRIX chain
        self.burn_tokens(&request.from_kaldrix_address, request.amount, &request.token_id)?;

        // Emit lock event for relayer to pick up
        self.emit_lock_event(request, *user_nonce - 1)?;

        Ok(())
    }

    /// Validate token unlock request
    fn validate_unlock_request(&self, request: &TokenUnlockRequest) -> Result<(), String> {
        if request.amount == 0 {
            return Err("Amount must be greater than 0".to_string());
        }

        if request.to_kaldrix_address.is_empty() {
            return Err("Invalid KALDRIX address".to_string());
        }

        if request.from_evm_address.is_empty() {
            return Err("Invalid EVM address".to_string());
        }

        if self.processed_nonces.contains_key(&request.nonce) {
            return Err("Nonce already processed".to_string());
        }

        if !self.config.supported_tokens.contains(&request.token_id) {
            return Err("Token not supported".to_string());
        }

        Ok(())
    }

    /// Validate token lock request
    fn validate_lock_request(&self, request: &TokenLockRequest) -> Result<(), String> {
        if request.amount == 0 {
            return Err("Amount must be greater than 0".to_string());
        }

        if request.from_kaldrix_address.is_empty() {
            return Err("Invalid KALDRIX address".to_string());
        }

        if request.to_evm_address.is_empty() {
            return Err("Invalid EVM address".to_string());
        }

        if !self.config.supported_tokens.contains(&request.token_id) {
            return Err("Token not supported".to_string());
        }

        Ok(())
    }

    /// Verify validator signatures
    fn verify_signatures(&self, request: &TokenUnlockRequest) -> Result<(), String> {
        // Create message hash
        let message_hash = self.create_message_hash(request);

        let mut valid_signatures = 0;
        let mut used_signers = std::collections::HashSet::new();

        for signature_str in &request.signatures {
            // Parse signature
            let signature = self.parse_signature(signature_str)?;

            // Recover signer
            let signer = self.recover_signer(&message_hash, &signature)?;

            // Check if signer is a validator and not duplicate
            if let Some(validator) = self.validators.get(&signer) {
                if validator.is_active && !used_signers.contains(&signer) {
                    valid_signatures += 1;
                    used_signers.insert(signer);
                }
            }
        }

        if valid_signatures < self.config.validator_threshold as usize {
            return Err(format!(
                "Insufficient validator signatures: {} < {}",
                valid_signatures,
                self.config.validator_threshold
            ));
        }

        Ok(())
    }

    /// Verify user signature for lock request
    fn verify_user_signature(&self, request: &TokenLockRequest) -> Result<(), String> {
        // Create message hash
        let message = format!(
            "{}{}{}{}{}",
            request.token_id,
            request.from_kaldrix_address,
            request.to_evm_address,
            request.amount,
            request.nonce
        );

        let message_hash = Keccak256::digest(message.as_bytes());

        // Parse signature
        let signature = self.parse_signature(&request.signature)?;

        // Recover signer
        let signer = self.recover_signer(&message_hash, &signature)?;

        // Verify signer matches the sender
        if signer != request.from_kaldrix_address {
            return Err("Invalid signature".to_string());
        }

        Ok(())
    }

    /// Create message hash for signature verification
    fn create_message_hash(&self, request: &TokenUnlockRequest) -> [u8; 32] {
        let message = format!(
            "{}{}{}{}{}{}",
            request.token_id,
            request.from_evm_address,
            request.to_kaldrix_address,
            request.amount,
            request.nonce,
            request.chain_id
        );

        Keccak256::digest(message.as_bytes()).into()
    }

    /// Parse signature from hex string
    fn parse_signature(&self, signature_str: &str) -> Result<Signature, String> {
        let signature_bytes = hex::decode(signature_str)
            .map_err(|e| format!("Invalid signature hex: {}", e))?;

        if signature_bytes.len() != 65 {
            return Err("Invalid signature length".to_string());
        }

        let mut signature_array = [0u8; 65];
        signature_array.copy_from_slice(&signature_bytes);

        Signature::parse_standard(&signature_array)
            .map_err(|e| format!("Failed to parse signature: {}", e))
    }

    /// Recover signer address from signature
    fn recover_signer(&self, message_hash: &[u8; 32], signature: &Signature) -> Result<String, String> {
        let message = Message::parse_slice(message_hash)
            .map_err(|e| format!("Failed to parse message: {}", e))?;

        let public_key = recover(&message, signature)
            .map_err(|e| format!("Failed to recover public key: {}", e))?;

        let public_key_bytes = public_key.serialize();
        let address = format!("0x{}", hex::encode(&public_key_bytes[1..]));

        Ok(address)
    }

    /// Mint tokens on KALDRIX chain
    fn mint_tokens(&self, recipient: &str, amount: u64, token_id: &str) -> Result<(), String> {
        // This would integrate with KALDRIX's token system
        println!("Minting {} {} tokens to {}", amount, token_id, recipient);
        
        // TODO: Integrate with actual KALDRIX token minting logic
        // self.kaldrix_chain.mint_tokens(recipient, amount, token_id)?;
        
        Ok(())
    }

    /// Burn tokens on KALDRIX chain
    fn burn_tokens(&self, sender: &str, amount: u64, token_id: &str) -> Result<(), String> {
        // This would integrate with KALDRIX's token system
        println!("Burning {} {} tokens from {}", amount, token_id, sender);
        
        // TODO: Integrate with actual KALDRIX token burning logic
        // self.kaldrix_chain.burn_tokens(sender, amount, token_id)?;
        
        Ok(())
    }

    /// Emit lock event for relayer
    fn emit_lock_event(&self, request: TokenLockRequest, nonce: u64) -> Result<(), String> {
        let event = serde_json::json!({
            "event_type": "tokens_locked",
            "token_id": request.token_id,
            "from_kaldrix_address": request.from_kaldrix_address,
            "to_evm_address": request.to_evm_address,
            "amount": request.amount,
            "nonce": nonce,
            "timestamp": SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        });

        println!("Emitting lock event: {}", serde_json::to_string_pretty(&event).unwrap());
        
        // TODO: Send event to relayer service
        // self.relayer.send_event(event)?;
        
        Ok(())
    }

    /// Get current validator count
    pub fn get_validator_count(&self) -> usize {
        self.validators.len()
    }

    /// Get active validators
    pub fn get_active_validators(&self) -> Vec<&BridgeValidator> {
        self.validators
            .values()
            .filter(|v| v.is_active)
            .collect()
    }

    /// Check if address is a validator
    pub fn is_validator(&self, address: &str) -> bool {
        self.validators.contains_key(address)
    }

    /// Get bridge statistics
    pub fn get_statistics(&self) -> serde_json::Value {
        serde_json::json!({
            "total_validators": self.validators.len(),
            "active_validators": self.get_active_validators().len(),
            "validator_threshold": self.config.validator_threshold,
            "supported_tokens": self.config.supported_tokens.len(),
            "total_nonce": self.total_nonce,
            "processed_nonces": self.processed_nonces.len(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bridge_initialization() {
        let config = BridgeConfig {
            validator_threshold: 2,
            max_validators: 5,
            min_threshold: 1,
            supported_tokens: vec!["KALD".to_string(), "ETH".to_string()],
        };

        let bridge = KaldrixTokenBridge::new(config);
        assert_eq!(bridge.get_validator_count(), 0);
    }

    #[test]
    fn test_add_validator() {
        let config = BridgeConfig {
            validator_threshold: 1,
            max_validators: 5,
            min_threshold: 1,
            supported_tokens: vec!["KALD".to_string()],
        };

        let mut bridge = KaldrixTokenBridge::new(config);
        let validator = BridgeValidator {
            address: "0x123...".to_string(),
            public_key: "pubkey...".to_string(),
            is_active: true,
            stake_amount: 1000,
        };

        assert!(bridge.add_validator(validator).is_ok());
        assert_eq!(bridge.get_validator_count(), 1);
    }
}