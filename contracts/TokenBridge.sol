// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenBridge
 * @dev Contract for locking tokens on EVM chain to be bridged to KALDRIX chain
 */
contract TokenBridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event TokensLocked(
        address indexed token,
        address indexed from,
        string toKaldrixAddress,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );
    
    event TokensUnlocked(
        address indexed token,
        string indexed fromKaldrixAddress,
        address to,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );
    
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event TokenWhitelisted(address indexed token);
    event TokenDewhitelisted(address indexed token);

    // State variables
    mapping(address => bool) public validators;
    mapping(address => bool) public whitelistedTokens;
    mapping(uint256 => bool) public processedNonces;
    mapping(address => uint256) public userNonces;
    
    address[] public validatorList;
    uint256 public validatorThreshold;
    uint256 public totalNonce;
    
    // Constants
    uint256 public constant MAX_VALIDATORS = 21;
    uint256 public constant MIN_THRESHOLD = 1;
    
    constructor(uint256 _threshold) {
        require(_threshold >= MIN_THRESHOLD, "Threshold too low");
        validatorThreshold = _threshold;
    }

    // Modifiers
    modifier onlyValidator() {
        require(validators[msg.sender], "Not a validator");
        _;
    }

    modifier onlyWhitelistedToken(address token) {
        require(whitelistedTokens[token], "Token not whitelisted");
        _;
    }

    // External functions
    
    /**
     * @dev Lock tokens to be bridged to KALDRIX chain
     * @param token The ERC20 token address
     * @param amount The amount to lock
     * @param toKaldrixAddress The recipient address on KALDRIX chain
     */
    function lockTokens(
        address token,
        uint256 amount,
        string calldata toKaldrixAddress
    ) external nonReentrant onlyWhitelistedToken(token) {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(toKaldrixAddress).length > 0, "Invalid KALDRIX address");
        
        // Get user nonce
        uint256 userNonce = userNonces[msg.sender]++;
        totalNonce++;
        
        // Transfer tokens from user to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit TokensLocked(
            token,
            msg.sender,
            toKaldrixAddress,
            amount,
            userNonce,
            block.timestamp
        );
    }
    
    /**
     * @dev Unlock tokens from KALDRIX chain (called by validators)
     * @param token The ERC20 token address
     * @param fromKaldrixAddress The sender address on KALDRIX chain
     * @param to The recipient address on EVM chain
     * @param amount The amount to unlock
     * @param nonce The nonce from KALDRIX chain
     * @param signatures Array of validator signatures
     */
    function unlockTokens(
        address token,
        string calldata fromKaldrixAddress,
        address to,
        uint256 amount,
        uint256 nonce,
        bytes[] calldata signatures
    ) external nonReentrant onlyValidator {
        require(!processedNonces[nonce], "Nonce already processed");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(fromKaldrixAddress).length > 0, "Invalid KALDRIX address");
        require(to != address(0), "Invalid recipient address");
        
        // Verify signatures
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                token,
                fromKaldrixAddress,
                to,
                amount,
                nonce,
                block.chainid
            )
        );
        
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        uint256 validSignatures = 0;
        address[] memory signers = new address[](signatures.length);
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = recoverSigner(ethSignedMessageHash, signatures[i]);
            
            // Check if signer is a validator and not duplicated
            if (validators[signer] && !isSignerDuplicate(signers, signer, validSignatures)) {
                signers[validSignatures] = signer;
                validSignatures++;
            }
        }
        
        require(validSignatures >= validatorThreshold, "Insufficient validator signatures");
        
        // Mark nonce as processed
        processedNonces[nonce] = true;
        
        // Transfer tokens to recipient
        IERC20(token).safeTransfer(to, amount);
        
        emit TokensUnlocked(
            token,
            fromKaldrixAddress,
            to,
            amount,
            nonce,
            block.timestamp
        );
    }

    // Admin functions
    
    /**
     * @dev Add a validator
     * @param validator The validator address to add
     */
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid validator address");
        require(!validators[validator], "Validator already exists");
        require(validatorList.length < MAX_VALIDATORS, "Max validators reached");
        
        validators[validator] = true;
        validatorList.push(validator);
        
        emit ValidatorAdded(validator);
    }
    
    /**
     * @dev Remove a validator
     * @param validator The validator address to remove
     */
    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "Validator not found");
        
        validators[validator] = false;
        
        // Remove from validator list
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validatorList[i] == validator) {
                validatorList[i] = validatorList[validatorList.length - 1];
                validatorList.pop();
                break;
            }
        }
        
        emit ValidatorRemoved(validator);
    }
    
    /**
     * @dev Update validator threshold
     * @param newThreshold The new threshold value
     */
    function updateThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold >= MIN_THRESHOLD, "Threshold too low");
        require(newThreshold <= validatorList.length, "Threshold cannot exceed validator count");
        
        uint256 oldThreshold = validatorThreshold;
        validatorThreshold = newThreshold;
        
        emit ThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @dev Whitelist a token for bridging
     * @param token The token address to whitelist
     */
    function whitelistToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!whitelistedTokens[token], "Token already whitelisted");
        
        whitelistedTokens[token] = true;
        
        emit TokenWhitelisted(token);
    }
    
    /**
     * @dev Dewhitelist a token
     * @param token The token address to dewhitelist
     */
    function dewhitelistToken(address token) external onlyOwner {
        require(whitelistedTokens[token], "Token not whitelisted");
        
        whitelistedTokens[token] = false;
        
        emit TokenDewhitelisted(token);
    }

    // View functions
    
    /**
     * @dev Get all validators
     * @return Array of validator addresses
     */
    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }
    
    /**
     * @dev Get validator count
     * @return Number of validators
     */
    function getValidatorCount() external view returns (uint256) {
        return validatorList.length;
    }
    
    /**
     * @dev Check if an address is a validator
     * @param account The address to check
     * @return True if validator, false otherwise
     */
    function isValidator(address account) external view returns (bool) {
        return validators[account];
    }
    
    /**
     * @dev Get token balance for this contract
     * @param token The token address
     * @return Balance of the token
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // Internal functions
    
    /**
     * @dev Recover signer address from signature
     * @param hash The message hash
     * @param signature The signature
     * @return The signer address
     */
    function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature version");
        
        return ecrecover(hash, v, r, s);
    }
    
    /**
     * @dev Check if signer is duplicate in the array
     * @param signers Array of signers
     * @param signer The signer to check
     * @param count Number of valid signers so far
     * @return True if duplicate, false otherwise
     */
    function isSignerDuplicate(
        address[] memory signers,
        address signer,
        uint256 count
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < count; i++) {
            if (signers[i] == signer) {
                return true;
            }
        }
        return false;
    }
}