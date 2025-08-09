// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFTBridge
 * @dev Cross-chain NFT bridge contract for locking/unlocking ERC721 tokens
 */
contract NFTBridge is Ownable, ERC721Holder, ReentrancyGuard {
    // Events
    event NFTRemainingLocked(
        address indexed token,
        uint256 indexed tokenId,
        address indexed owner,
        address recipient,
        uint256 chainId,
        bytes32 proofId
    );
    
    event NFTUnlocked(
        address indexed token,
        uint256 indexed tokenId,
        address indexed recipient,
        bytes32 proofId
    );
    
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ThresholdUpdated(uint256 newThreshold);
    event BridgePaused();
    event BridgeResumed();

    // State variables
    mapping(address => bool) public supportedTokens;
    mapping(address => bool) public validators;
    mapping(bytes32 => bool) public usedProofs;
    mapping(address => mapping(uint256 => bool)) public lockedNFTs;
    mapping(bytes32 => LockData) public lockData;
    
    uint256 public validatorThreshold;
    bool public isPaused;
    
    struct LockData {
        address token;
        uint256 tokenId;
        address owner;
        address recipient;
        uint256 sourceChainId;
        uint256 timestamp;
    }
    
    // Modifiers
    modifier onlyValidator() {
        require(validators[msg.sender], "Not a validator");
        _;
    }
    
    modifier whenNotPaused() {
        require(!isPaused, "Bridge is paused");
        _;
    }
    
    constructor(uint256 _threshold) {
        validatorThreshold = _threshold;
        isPaused = false;
    }
    
    /**
     * @dev Lock NFT for cross-chain transfer
     * @param token The ERC721 token address
     * @param tokenId The token ID to lock
     * @param recipient The recipient address on target chain
     * @param targetChainId The target chain ID
     */
    function lockNFT(
        address token,
        uint256 tokenId,
        address recipient,
        uint256 targetChainId
    ) external whenNotPaused nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(recipient != address(0), "Invalid recipient");
        require(targetChainId != block.chainid, "Cannot transfer to same chain");
        
        IERC721 nft = IERC721(token);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Token not approved");
        
        // Transfer NFT to this contract
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Mark as locked
        lockedNFTs[token][tokenId] = true;
        
        // Generate proof ID
        bytes32 proofId = keccak256(
            abi.encodePacked(
                token,
                tokenId,
                msg.sender,
                recipient,
                block.chainid,
                targetChainId,
                block.timestamp
            )
        );
        
        // Store lock data
        lockData[proofId] = LockData({
            token: token,
            tokenId: tokenId,
            owner: msg.sender,
            recipient: recipient,
            sourceChainId: block.chainid,
            timestamp: block.timestamp
        });
        
        emit NFTRemainingLocked(token, tokenId, msg.sender, recipient, targetChainId, proofId);
    }
    
    /**
     * @dev Unlock NFT with validator signatures
     * @param proofId The unique proof identifier
     * @param token The ERC721 token address
     * @param tokenId The token ID to unlock
     * @param recipient The recipient address
     * @param sourceChainId The source chain ID
     * @param signatures Array of validator signatures
     * @param validatorAddresses Array of validator addresses
     */
    function unlockNFT(
        bytes32 proofId,
        address token,
        uint256 tokenId,
        address recipient,
        uint256 sourceChainId,
        bytes[] calldata signatures,
        address[] calldata validatorAddresses
    ) external whenNotPaused nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(recipient != address(0), "Invalid recipient");
        require(sourceChainId != block.chainid, "Cannot unlock from same chain");
        require(!usedProofs[proofId], "Proof already used");
        require(signatures.length >= validatorThreshold, "Insufficient signatures");
        require(signatures.length == validatorAddresses.length, "Signature count mismatch");
        
        // Verify signatures
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                proofId,
                token,
                tokenId,
                recipient,
                sourceChainId,
                block.chainid
            )
        );
        
        uint256 validSignatures = 0;
        for (uint256 i = 0; i < signatures.length; i++) {
            if (validators[validatorAddresses[i]]) {
                address recoveredAddress = recoverSigner(messageHash, signatures[i]);
                if (recoveredAddress == validatorAddresses[i]) {
                    validSignatures++;
                }
            }
        }
        
        require(validSignatures >= validatorThreshold, "Insufficient valid signatures");
        
        // Mark proof as used
        usedProofs[proofId] = true;
        
        // Mint or transfer NFT to recipient
        // For this implementation, we assume the NFT is already minted on this chain
        // In a real implementation, you might need to mint a wrapped NFT
        IERC721 nft = IERC721(token);
        if (nft.ownerOf(tokenId) == address(this)) {
            nft.safeTransferFrom(address(this), recipient, tokenId);
        } else {
            // If NFT doesn't exist, mint a wrapped version (simplified)
            // In production, implement proper wrapped NFT logic
            revert("NFT not found - implement wrapped NFT logic");
        }
        
        emit NFTUnlocked(token, tokenId, recipient, proofId);
    }
    
    /**
     * @dev Add supported token
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        supportedTokens[token] = true;
    }
    
    /**
     * @dev Remove supported token
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }
    
    /**
     * @dev Add validator
     */
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid validator address");
        validators[validator] = true;
        emit ValidatorAdded(validator);
    }
    
    /**
     * @dev Remove validator
     */
    function removeValidator(address validator) external onlyOwner {
        validators[validator] = false;
        emit ValidatorRemoved(validator);
    }
    
    /**
     * @dev Update validator threshold
     */
    function updateThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold > 0, "Threshold must be positive");
        validatorThreshold = newThreshold;
        emit ThresholdUpdated(newThreshold);
    }
    
    /**
     * @dev Pause bridge
     */
    function pause() external onlyOwner {
        isPaused = true;
        emit BridgePaused();
    }
    
    /**
     * @dev Resume bridge
     */
    function resume() external onlyOwner {
        isPaused = false;
        emit BridgeResumed();
    }
    
    /**
     * @dev Recover signer address from signature
     */
    function recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        if (signature.length != 65) {
            return address(0);
        }
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        if (v != 27 && v != 28) {
            return address(0);
        }
        
        return ecrecover(messageHash, v, r, s);
    }
    
    /**
     * @dev Get lock data for a proof ID
     */
    function getLockData(bytes32 proofId) external view returns (LockData memory) {
        return lockData[proofId];
    }
    
    /**
     * @dev Check if NFT is locked
     */
    function isLocked(address token, uint256 tokenId) external view returns (bool) {
        return lockedNFTs[token][tokenId];
    }
    
    /**
     * @dev Get validator count
     */
    function getValidatorCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < 1000; i++) { // Simplified loop
            if (validators[address(uint160(i))]) {
                count++;
            }
        }
        return count;
    }
}