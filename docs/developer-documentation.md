# KALDRIX Developer Documentation

## Table of Contents
1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Mobile SDK](#mobile-sdk)
4. [Smart Contracts](#smart-contracts)
5. [API Reference](#api-reference)
6. [Quantum-Resistant Development](#quantum-resistant-development)
7. [Testing & Deployment](#testing--deployment)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

---

## Getting Started

### Prerequisites

Before you start developing with KALDRIX, ensure you have the following:

- **Node.js**: Version 16.0 or higher
- **Rust**: Version 1.70 or higher (for core development)
- **Docker**: For containerized development
- **Git**: For version control
- **Basic Knowledge**: Understanding of blockchain concepts and cryptography

### Quick Start

#### 1. Installation

```bash
# Clone the repository
git clone https://github.com/kaldrix/kaldrix-blockchain.git
cd kaldrix-blockchain

# Install dependencies
npm install

# Install Rust dependencies (for core development)
cargo build --release
```

#### 2. Running a Local Node

```bash
# Start a local development node
npm run dev:node

# In another terminal, start the frontend
npm run dev
```

#### 3. Your First Transaction

```javascript
const { KaldrixClient } = require('@kaldrix/sdk');

async function firstTransaction() {
    // Initialize client
    const client = new KaldrixClient({
        network: 'testnet',
        endpoint: 'https://testnet.kaldrix.com'
    });

    // Create a wallet
    const wallet = await client.createWallet();
    
    // Get test tokens (faucet)
    await client.faucet(wallet.address);
    
    // Create and send transaction
    const tx = await client.createTransaction({
        from: wallet.address,
        to: '0x1234567890123456789012345678901234567890',
        amount: '1000', // in KALD units
        fee: '10'
    });
    
    // Sign and broadcast
    const signedTx = await wallet.signTransaction(tx);
    const result = await client.broadcastTransaction(signedTx);
    
    console.log('Transaction sent:', result.txHash);
}

firstTransaction().catch(console.error);
```

### Development Environment Setup

#### IDE Configuration

**Visual Studio Code**
```json
// .vscode/settings.json
{
    "rust-analyzer.cargo.features": [
        "default",
        "pqc",
        "mobile"
    ],
    "solidity.compileUsingRemoteVersion": "v0.8.19",
    "solidity.packageDefaultDependenciesContractsDirectory": "node_modules",
    "solidity.linter": "solhint"
}
```

**Recommended Extensions**
- **Rust Analyzer**: For Rust development
- **Solidity**: For smart contract development
- **Docker**: For container management
- **GitLens**: Enhanced Git integration

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│                Smart Contract Engine                         │
├─────────────────────────────────────────────────────────────┤
│                  Security Layer                              │
├─────────────────────────────────────────────────────────────┤
│                Quantum Resistance Layer                      │
├─────────────────────────────────────────────────────────────┤
│                Consensus Mechanism                           │
├─────────────────────────────────────────────────────────────┤
│                   Network Layer                              │
├─────────────────────────────────────────────────────────────┤
│                    Prime Layer                               │
├─────────────────────────────────────────────────────────────┤
│                     DAG Core                                 │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. DAG Core

The DAG Core manages the directed acyclic graph structure and basic transaction validation.

```rust
// src/core/mod.rs
pub struct DAGCore {
    pub nodes: HashMap<Hash256, DAGNode>,
    pub tips: Vec<Hash256>,
    pub config: DAGConfig,
}

impl DAGCore {
    pub fn new(config: DAGConfig) -> Self {
        DAGCore {
            nodes: HashMap::new(),
            tips: Vec::new(),
            config,
        }
    }
    
    pub fn add_transaction(&mut self, tx: Transaction) -> Result<Hash256, Error> {
        // Validate transaction
        self.validate_transaction(&tx)?;
        
        // Select parents
        let parents = self.select_parents(&tx)?;
        
        // Create DAG node
        let node = DAGNode::new(tx, parents);
        let node_hash = node.hash();
        
        // Add to DAG
        self.nodes.insert(node_hash, node);
        self.update_tips(&node_hash, &parents);
        
        Ok(node_hash)
    }
    
    pub fn validate_transaction(&self, tx: &Transaction) -> Result<(), Error> {
        // Basic validation
        if tx.amount == 0 {
            return Err(Error::InvalidAmount);
        }
        
        // Quantum signature validation
        if !self.validate_quantum_signature(tx)? {
            return Err(Error::InvalidSignature);
        }
        
        Ok(())
    }
}
```

#### 2. Prime Layer

The Prime Layer implements quantum-resistant validation using prime number properties.

```rust
// src/math/mod.rs
pub struct PrimeValidator {
    pub prime_base: u64,
    pub key_pair: QuantumKeyPair,
    pub reputation: f64,
}

impl PrimeValidator {
    pub fn validate_prime_hash(&self, tx: &Transaction) -> bool {
        let computed_hash = self.compute_prime_hash(tx);
        let expected_hash = &tx.quantum_proof.prime_hash;
        
        computed_hash == *expected_hash
    }
    
    pub fn compute_prime_hash(&self, tx: &Transaction) -> Hash256 {
        let input = self.hash_transaction(tx);
        let mut result = 1u64;
        
        // Prime number transformation
        for (i, byte) in input.iter().enumerate() {
            let prime = self.get_nth_prime(*byte as usize);
            result = result.wrapping_mul(prime);
        }
        
        Hash256::from_u64(result)
    }
    
    fn get_nth_prime(&self, n: usize) -> u64 {
        // Precomputed prime numbers for efficiency
        let primes = [
            2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53,
            59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
            127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181,
            191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251
        ];
        
        primes[n % primes.len()]
    }
}
```

#### 3. Consensus Mechanism

The consensus mechanism combines DAG-based ordering with Byzantine fault tolerance.

```rust
// src/consensus/mod.rs
pub struct ConsensusEngine {
    pub validators: Vec<PrimeValidator>,
    pub dag: Arc<RwLock<DAGCore>>,
    pub config: ConsensusConfig,
}

impl ConsensusEngine {
    pub async fn reach_consensus(&self) -> Result<Vec<Transaction>, Error> {
        // Get unconfirmed transactions
        let unconfirmed = self.get_unconfirmed_transactions().await;
        
        // Order transactions
        let ordered = self.order_transactions(unconfirmed).await?;
        
        // Byzantine agreement
        let final_ordering = self.byzantine_agreement(ordered).await?;
        
        Ok(final_ordering)
    }
    
    async fn order_transactions(&self, txs: Vec<Transaction>) -> Result<Vec<Transaction>, Error> {
        let mut ordered = txs;
        
        // Calculate weights
        for tx in &mut ordered {
            tx.weight = self.calculate_weight(tx).await?;
        }
        
        // Sort by weight and timestamp
        ordered.sort_by(|a, b| {
            b.weight.cmp(&a.weight)
                .then(b.timestamp.cmp(&a.timestamp))
        });
        
        Ok(ordered)
    }
    
    async fn byzantine_agreement(&self, txs: Vec<Transaction>) -> Result<Vec<Transaction>, Error> {
        // Phase 1: Propose
        let proposals = self.collect_proposals(ts.clone()).await?;
        
        // Phase 2: Vote
        let votes = self.collect_votes(proposals).await?;
        
        // Phase 3: Decide
        let final_ordering = self.aggregate_votes(votes).await?;
        
        Ok(final_ordering)
    }
}
```

---

## Mobile SDK

### Overview

The KALDRIX Mobile SDK provides a comprehensive toolkit for integrating quantum-resistant blockchain functionality into mobile applications. The SDK supports both iOS and Android platforms with a unified API.

### Installation

#### React Native

```bash
npm install @kaldrix/mobile-sdk
# or
yarn add @kaldrix/mobile-sdk
```

#### Native iOS

```swift
// Podfile
pod 'KaldrixSDK', '~> 1.0.0'
```

#### Native Android

```groovy
// build.gradle
implementation 'com.kaldrix:sdk:1.0.0'
```

### Quick Start

#### React Native Example

```javascript
import { KaldrixSDK, Wallet, Transaction } from '@kaldrix/mobile-sdk';

// Initialize SDK
const sdk = new KaldrixSDK({
  network: 'testnet',
  endpoint: 'https://testnet.kaldrix.com'
});

// Create wallet
const wallet = await Wallet.create();
console.log('Wallet Address:', wallet.address);

// Get balance
const balance = await wallet.getBalance();
console.log('Balance:', balance);

// Send transaction
const transaction = new Transaction({
  from: wallet.address,
  to: '0x1234567890123456789012345678901234567890',
  amount: '1000',
  fee: '10'
});

const signedTx = await wallet.signTransaction(transaction);
const result = await sdk.sendTransaction(signedTx);
console.log('Transaction Hash:', result.hash);
```

#### Native iOS Example

```swift
import KaldrixSDK

// Initialize SDK
let sdk = KaldrixSDK(network: .testnet)

// Create wallet
let wallet = try Wallet.create()
print("Wallet Address: \(wallet.address)")

// Get balance
let balance = try await wallet.getBalance()
print("Balance: \(balance)")

// Send transaction
let transaction = Transaction(
    from: wallet.address,
    to: "0x1234567890123456789012345678901234567890",
    amount: "1000",
    fee: "10"
)

let signedTx = try await wallet.sign(transaction)
let result = try await sdk.sendTransaction(signedTx)
print("Transaction Hash: \(result.hash)")
```

#### Native Android Example

```kotlin
import com.kaldrix.sdk.KaldrixSDK
import com.kaldrix.sdk.Wallet
import com.kaldrix.sdk.Transaction

// Initialize SDK
val sdk = KaldrixSDK(network = Network.TESTNET)

// Create wallet
val wallet = Wallet.create()
println("Wallet Address: ${wallet.address}")

// Get balance
val balance = wallet.getBalance()
println("Balance: $balance")

// Send transaction
val transaction = Transaction(
    from = wallet.address,
    to = "0x1234567890123456789012345678901234567890",
    amount = "1000",
    fee = "10"
)

val signedTx = wallet.sign(transaction)
val result = sdk.sendTransaction(signedTx)
println("Transaction Hash: ${result.hash}")
```

### Core Features

#### 1. Wallet Management

```javascript
// Create new wallet
const wallet = await Wallet.create();

// Import from mnemonic
const wallet = await Wallet.fromMnemonic('word1 word2 word3...');

// Import from private key
const wallet = await Wallet.fromPrivateKey('0x123...');

// Export wallet
const mnemonic = await wallet.exportMnemonic();
const privateKey = await wallet.exportPrivateKey();

// Multiple accounts
const account1 = await wallet.getAccount(0);
const account2 = await wallet.getAccount(1);
```

#### 2. Quantum-Resistant Signatures

```javascript
// Create hybrid signature (classical + PQC)
const signature = await wallet.createHybridSignature(message);

// Verify signature
const isValid = await wallet.verifyHybridSignature(message, signature, publicKey);

// Key rotation
await wallet.rotateKeys();
```

#### 3. Light Client

```javascript
// Enable light client mode
sdk.enableLightClient();

// Sync with network
await sdk.sync();

// Get latest block
const latestBlock = await sdk.getLatestBlock();

// Get transaction by hash
const transaction = await sdk.getTransaction('0xabc...');

// Subscribe to new blocks
sdk.on('newBlock', (block) => {
    console.log('New block:', block.hash);
});
```

#### 4. Smart Contract Interaction

```javascript
// Deploy contract
const contract = await sdk.deployContract({
    bytecode: '0x6060604052...',
    abi: contractABI,
    from: wallet.address
});

// Call contract method
const result = await contract.methods.myMethod(arg1, arg2).call();

// Send transaction to contract
const tx = await contract.methods.myMethod(arg1, arg2).send({
    from: wallet.address,
    gas: 100000,
    gasPrice: '20'
});
```

### Advanced Features

#### 1. Multi-Signature Wallets

```javascript
// Create multi-sig wallet
const multiSig = await MultiSigWallet.create({
    owners: [owner1, owner2, owner3],
    required: 2 // 2 out of 3
});

// Submit transaction
const txHash = await multiSig.submitTransaction({
    to: '0x123...',
    amount: '1000',
    data: '0xabc...'
});

// Confirm transaction
await multiSig.confirmTransaction(txHash, owner1);
await multiSig.confirmTransaction(txHash, owner2);

// Execute transaction
await multiSig.executeTransaction(txHash);
```

#### 2. Batch Transactions

```javascript
// Create batch of transactions
const batch = new TransactionBatch();

batch.addTransaction({
    from: wallet.address,
    to: '0x123...',
    amount: '1000'
});

batch.addTransaction({
    from: wallet.address,
    to: '0x456...',
    amount: '2000'
});

// Send batch
const results = await batch.send();
console.log('Batch results:', results);
```

#### 3. Offline Transactions

```javascript
// Create transaction offline
const offlineTx = await wallet.createOfflineTransaction({
    from: wallet.address,
    to: '0x123...',
    amount: '1000',
    nonce: 123,
    gasPrice: '20'
});

// Sign offline
const signedTx = await wallet.signTransaction(offlineTx);

// Broadcast later when online
const result = await sdk.broadcastTransaction(signedTx);
```

### Security Best Practices

#### 1. Secure Storage

```javascript
// Use secure storage for sensitive data
await sdk.setSecureStorage({
    type: 'keychain', // iOS keychain or Android keystore
    encryption: true
});

// Store wallet securely
await wallet.storeSecurely('my-wallet');

// Load wallet securely
const wallet = await Wallet.loadSecurely('my-wallet');
```

#### 2. Biometric Authentication

```javascript
// Enable biometric authentication
await sdk.enableBiometricAuth();

// Authenticate with biometrics
const isAuthenticated = await sdk.authenticateWithBiometrics();
if (isAuthenticated) {
    // Proceed with sensitive operations
    const balance = await wallet.getBalance();
}
```

#### 3. Network Security

```javascript
// Enable SSL pinning
await sdk.enableSSLPinning({
    certificates: ['path/to/certificate.pem']
});

// Use secure endpoints
sdk.setEndpoint('https://api.kaldrix.com', {
    timeout: 30000,
    retries: 3
});
```

---

## Smart Contracts

### Overview

KALDRIX provides a Turing-complete smart contract platform with quantum-resistant features. Smart contracts on KALDRIX are written in Solidity with additional quantum-resistant capabilities.

### Getting Started

#### 1. Development Environment Setup

```bash
# Install Solidity compiler
npm install -g solc

# Install development framework
npm install -g truffle

# Install KALDRIX-specific tools
npm install -g @kaldrix/contract-tools
```

#### 2. Project Structure

```
my-contract/
├── contracts/
│   ├── MyContract.sol
│   └── QuantumContract.sol
├── migrations/
│   └── 1_initial_migration.js
├── test/
│   ├── MyContract.test.js
│   └── QuantumContract.test.js
├── truffle-config.js
└── package.json
```

#### 3. Basic Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@kaldrix/contracts/QuantumFeatures.sol";

contract SimpleStorage is QuantumFeatures {
    uint256 private storedData;
    
    event ValueChanged(uint256 newValue);
    
    constructor() {
        storedData = 0;
    }
    
    function set(uint256 newValue) public {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        
        storedData = newValue;
        emit ValueChanged(newValue);
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
    
    // Quantum-resistant function
    function quantumCompute(uint256 input) public pure returns (uint256) {
        return quantumHash(input);
    }
}
```

### Quantum-Resistant Features

#### 1. Quantum Signatures

```solidity
import "@kaldrix/contracts/QuantumSignature.sol";

contract QuantumToken is QuantumSignature {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        require(verifyQuantumSignature(msg.sender), "Invalid signature");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

#### 2. Encrypted Storage

```solidity
import "@kaldrix/contracts/EncryptedStorage.sol";

contract SecureData is EncryptedStorage {
    mapping(bytes32 => bytes) private encryptedData;
    
    function storeData(bytes32 key, bytes calldata data) public {
        require(verifyQuantumSignature(msg.sender), "Invalid signature");
        
        bytes memory encrypted = encrypt(data, msg.sender);
        encryptedData[key] = encrypted;
    }
    
    function retrieveData(bytes32 key) public view returns (bytes memory) {
        require(verifyQuantumSignature(msg.sender), "Invalid signature");
        
        bytes memory encrypted = encryptedData[key];
        return decrypt(encrypted, msg.sender);
    }
}
```

#### 3. Zero-Knowledge Proofs

```solidity
import "@kaldrix/contracts/ZKFeatures.sol";

contract PrivateVoting is ZKFeatures {
    struct Vote {
        bytes32 commitment;
        bool voted;
    }
    
    mapping(address => Vote) public votes;
    uint256 public totalVotes;
    
    function castVote(bytes32 commitment) public {
        require(!votes[msg.sender].voted, "Already voted");
        require(verifyZKProof(commitment, msg.sender), "Invalid proof");
        
        votes[msg.sender] = Vote({
            commitment: commitment,
            voted: true
        });
        
        totalVotes++;
    }
    
    function revealVote(bytes32 secret, uint256 choice) public {
        require(votes[msg.sender].voted, "Not voted");
        require(verifyCommitment(votes[msg.sender].commitment, secret, choice), "Invalid reveal");
        
        // Process vote
        processVote(choice);
    }
}
```

### Advanced Contract Patterns

#### 1. Upgradable Contracts

```solidity
import "@kaldrix/contracts/Upgradeable.sol";

contract V1 is Upgradeable {
    uint256 public value;
    
    function initialize() public initializer {
        value = 0;
    }
    
    function setValue(uint256 newValue) public {
        value = newValue;
    }
}

contract V2 is V1 {
    function increment() public {
        value++;
    }
}

contract Proxy is UpgradeableProxy {
    constructor() {
        _upgradeTo(address(new V1()));
    }
    
    function upgradeToV2() public onlyOwner {
        _upgradeTo(address(new V2()));
    }
}
```

#### 2. Multi-Signature Wallet

```solidity
import "@kaldrix/contracts/QuantumMultiSig.sol";

contract QuantumMultiSigWallet is QuantumMultiSig {
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }
    
    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    
    function submitTransaction(address to, uint256 value, bytes memory data) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        require(verifyQuantumSignature(msg.sender), "Invalid signature");
        
        uint256 txIndex = transactions.length;
        transactions.push(Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmations: 0
        }));
        
        emit Submission(txIndex);
        return txIndex;
    }
    
    function confirmTransaction(uint256 txIndex) public onlyOwner {
        require(verifyQuantumSignature(msg.sender), "Invalid signature");
        require(!confirmations[txIndex][msg.sender], "Already confirmed");
        
        confirmations[txIndex][msg.sender] = true;
        transactions[txIndex].confirmations++;
        
        emit Confirmation(msg.sender, txIndex);
        
        if (transactions[txIndex].confirmations >= required) {
            executeTransaction(txIndex);
        }
    }
}
```

#### 3. Decentralized Exchange

```solidity
import "@kaldrix/contracts/QuantumDEX.sol";

contract QuantumDEX is QuantumDEX {
    struct Pair {
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalSupply;
    }
    
    mapping(address => mapping(address => uint256)) public liquidity;
    mapping(bytes32 => Pair) public pairs;
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired
    ) public returns (uint256 liquidityAmount) {
        require(verifyQuantumSignature(msg.sender), "Invalid signature");
        
        bytes32 pairId = keccak256(abi.encodePacked(tokenA, tokenB));
        
        if (pairs[pairId].token0 == address(0)) {
            // Create new pair
            pairs[pairId] = Pair({
                token0: tokenA,
                token1: tokenB,
                reserve0: amountADesired,
                reserve1: amountBDesired,
                totalSupply: amountADesired * amountBDesired
            });
        } else {
            // Add to existing pair
            // ... logic for adding liquidity
        }
        
        liquidityAmount = calculateLiquidityAmount(pairId, amountADesired, amountBDesired);
        liquidity[msg.sender][pairId] += liquidityAmount;
    }
    
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public returns (uint256 amountOut) {
        require(verifyQuantumSignature(msg.sender), "Invalid signature");
        
        bytes32 pairId = keccak256(abi.encodePacked(tokenIn, tokenOut));
        Pair storage pair = pairs[pairId];
        
        amountOut = calculateSwapAmount(pair, tokenIn, amountIn);
        
        // Execute swap
        if (tokenIn == pair.token0) {
            pair.reserve0 += amountIn;
            pair.reserve1 -= amountOut;
        } else {
            pair.reserve1 += amountIn;
            pair.reserve0 -= amountOut;
        }
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
}
```

### Testing and Deployment

#### 1. Testing Framework

```javascript
// test/MyContract.test.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('MyContract', function () {
    let MyContract;
    let myContract;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        MyContract = await ethers.getContractFactory('MyContract');
        myContract = await MyContract.deploy();
        await myContract.deployed();
    });

    it('Should set the right owner', async function () {
        expect(await myContract.owner()).to.equal(owner.address);
    });

    it('Should store and retrieve value', async function () {
        await myContract.set(42);
        expect(await myContract.get()).to.equal(42);
    });

    it('Should verify quantum signature', async function () {
        const tx = await myContract.set(42);
        await expect(tx).to.emit(myContract, 'ValueChanged').withArgs(42);
    });
});
```

#### 2. Deployment Script

```javascript
// migrations/2_deploy_contracts.js
const MyContract = artifacts.require('MyContract');
const QuantumToken = artifacts.require('QuantumToken');

module.exports = async function (deployer) {
    // Deploy MyContract
    await deployer.deploy(MyContract);
    const myContract = await MyContract.deployed();
    
    // Deploy QuantumToken
    await deployer.deploy(QuantumToken, 'Quantum Token', 'QTK', 1000000);
    const quantumToken = await QuantumToken.deployed();
    
    console.log('MyContract deployed to:', myContract.address);
    console.log('QuantumToken deployed to:', quantumToken.address);
};
```

#### 3. Configuration

```javascript
// truffle-config.js
module.exports = {
    networks: {
        development: {
            host: '127.0.0.1',
            port: 8545,
            network_id: '*',
        },
        testnet: {
            provider: () => new HDWalletProvider(
                mnemonic,
                'https://testnet.kaldrix.com'
            ),
            network_id: 2,
            gas: 5500000,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
        mainnet: {
            provider: () => new HDWalletProvider(
                mnemonic,
                'https://mainnet.kaldrix.com'
            ),
            network_id: 1,
            gas: 5500000,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        }
    },
    compilers: {
        solc: {
            version: '0.8.19',
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
    }
};
```

---

## API Reference

### Overview

The KALDRIX API provides a comprehensive set of endpoints for interacting with the blockchain, managing wallets, and deploying smart contracts. The API is RESTful and supports JSON-RPC for compatibility with existing tools.

### Base URL

- **Testnet**: `https://testnet-api.kaldrix.com`
- **Mainnet**: `https://api.kaldrix.com`

### Authentication

Most API endpoints require authentication using API keys or JWT tokens.

```javascript
// Get API key from dashboard
const apiKey = 'your-api-key-here';

// Include in headers
const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
};
```

### Core Endpoints

#### 1. Network Information

##### Get Network Status

```http
GET /network/status
```

**Response:**
```json
{
    "status": "online",
    "network_id": 1,
    "block_height": 123456,
    "peer_count": 42,
    "quantum_resistance_score": 0.95,
    "last_updated": "2024-03-15T10:30:00Z"
}
```

##### Get Latest Block

```http
GET /blocks/latest
```

**Response:**
```json
{
    "hash": "0x1234567890abcdef...",
    "parent_hash": "0x0987654321fedcba...",
    "number": 123456,
    "timestamp": 1678865400,
    "transactions": 150,
    "gas_used": 15000000,
    "gas_limit": 20000000,
    "validator": "0xabcdef1234567890..."
}
```

##### Get Block by Hash

```http
GET /blocks/{block_hash}
```

**Response:**
```json
{
    "hash": "0x1234567890abcdef...",
    "parent_hash": "0x0987654321fedcba...",
    "number": 123456,
    "timestamp": 1678865400,
    "transactions": [
        {
            "hash": "0x1111111111111111...",
            "from": "0xaaaa...",
            "to": "0xbbbb...",
            "value": "1000000000000000000",
            "gas_used": 21000,
            "status": "success"
        }
    ],
    "gas_used": 15000000,
    "gas_limit": 20000000,
    "validator": "0xabcdef1234567890..."
}
```

#### 2. Transactions

##### Send Transaction

```http
POST /transactions/send
```

**Request:**
```json
{
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0x0987654321098765432109876543210987654321",
    "value": "1000000000000000000",
    "gas": 21000,
    "gas_price": "20000000000",
    "data": "0x",
    "nonce": 123
}
```

**Response:**
```json
{
    "transaction_hash": "0xabcdef1234567890...",
    "status": "pending",
    "nonce": 123
}
```

##### Get Transaction by Hash

```http
GET /transactions/{transaction_hash}
```

**Response:**
```json
{
    "hash": "0xabcdef1234567890...",
    "block_hash": "0x1234567890abcdef...",
    "block_number": 123456,
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0x0987654321098765432109876543210987654321",
    "value": "1000000000000000000",
    "gas": 21000,
    "gas_price": "20000000000",
    "gas_used": 21000,
    "status": "success",
    "timestamp": 1678865400
}
```

##### Get Transaction Receipt

```http
GET /transactions/{transaction_hash}/receipt
```

**Response:**
```json
{
    "transaction_hash": "0xabcdef1234567890...",
    "block_hash": "0x1234567890abcdef...",
    "block_number": 123456,
    "contract_address": null,
    "gas_used": 21000,
    "status": "success",
    "logs": []
}
```

#### 3. Accounts and Wallets

##### Get Account Balance

```http
GET /accounts/{address}/balance
```

**Response:**
```json
{
    "address": "0x1234567890123456789012345678901234567890",
    "balance": "1000000000000000000000",
    "nonce": 123,
    "quantum_key_status": "active"
}
```

##### Get Account Transactions

```http
GET /accounts/{address}/transactions?page=1&limit=10
```

**Response:**
```json
{
    "transactions": [
        {
            "hash": "0xabcdef1234567890...",
            "block_number": 123456,
            "timestamp": 1678865400,
            "from": "0x1234567890123456789012345678901234567890",
            "to": "0x0987654321098765432109876543210987654321",
            "value": "1000000000000000000",
            "status": "success"
        }
    ],
    "page": 1,
    "limit": 10,
    "total": 25
}
```

##### Create Wallet

```http
POST /wallets/create
```

**Request:**
```json
{
    "encryption_password": "my-secure-password"
}
```

**Response:**
```json
{
    "address": "0x1234567890123456789012345678901234567890",
    "public_key": "0xabcdef...",
    "encrypted_private_key": "encrypted-data-here",
    "mnemonic": "word1 word2 word3..."
}
```

#### 4. Smart Contracts

##### Deploy Contract

```http
POST /contracts/deploy
```

**Request:**
```json
{
    "bytecode": "0x6060604052...",
    "abi": [...],
    "from": "0x1234567890123456789012345678901234567890",
    "gas": 2000000,
    "gas_price": "20000000000"
}
```

**Response:**
```json
{
    "contract_address": "0xabcdef1234567890...",
    "transaction_hash": "0x1234567890abcdef...",
    "status": "pending"
}
```

##### Call Contract Method

```http
POST /contracts/{contract_address}/call
```

**Request:**
```json
{
    "method": "balanceOf",
    "params": ["0x1234567890123456789012345678901234567890"],
    "from": "0x1234567890123456789012345678901234567890"
}
```

**Response:**
```json
{
    "result": "1000000000000000000000",
    "status": "success"
}
```

##### Send Contract Transaction

```http
POST /contracts/{contract_address}/transact
```

**Request:**
```json
{
    "method": "transfer",
    "params": [
        "0x0987654321098765432109876543210987654321",
        "1000000000000000000"
    ],
    "from": "0x1234567890123456789012345678901234567890",
    "gas": 100000,
    "gas_price": "20000000000"
}
```

**Response:**
```json
{
    "transaction_hash": "0xabcdef1234567890...",
    "status": "pending"
}
```

#### 5. Quantum Features

##### Generate Quantum Keys

```http
POST /quantum/keys/generate
```

**Request:**
```json
{
    "algorithm": "dilithium3"
}
```

**Response:**
```json
{
    "public_key": "0xabcdef1234567890...",
    "private_key": "encrypted-private-key-here",
    "algorithm": "dilithium3",
    "key_size": 256
}
```

##### Rotate Quantum Keys

```http
POST /quantum/keys/rotate
```

**Request:**
```json
{
    "current_public_key": "0xabcdef1234567890...",
    "new_public_key": "0x0987654321fedcba...",
    "signature": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
    "status": "success",
    "rotation_timestamp": "2024-03-15T10:30:00Z",
    "new_key_active": true
}
```

##### Verify Quantum Signature

```http
POST /quantum/signatures/verify
```

**Request:**
```json
{
    "message": "0x1234567890abcdef...",
    "signature": "0xabcdef1234567890...",
    "public_key": "0x0987654321fedcba...",
    "algorithm": "dilithium3"
}
```

**Response:**
```json
{
    "valid": true,
    "algorithm": "dilithium3",
    "verification_time": "0.002s"
}
```

### WebSocket API

The KALDRIX API also supports WebSocket connections for real-time updates.

#### Connect to WebSocket

```javascript
const ws = new WebSocket('wss://testnet-api.kaldrix.com/ws');

ws.on('open', () => {
    console.log('Connected to KALDRIX WebSocket');
    
    // Subscribe to new blocks
    ws.send(JSON.stringify({
        action: 'subscribe',
        channel: 'new_blocks'
    }));
});

ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    switch (message.channel) {
        case 'new_blocks':
            console.log('New block:', message.data);
            break;
        case 'transactions':
            console.log('New transaction:', message.data);
            break;
    }
});
```

#### Available Channels

- `new_blocks`: New block notifications
- `transactions`: Real-time transaction updates
- `account_updates`: Account balance and transaction updates
- `contract_events`: Smart contract event notifications

### Error Handling

The API uses standard HTTP status codes and provides detailed error information.

```json
{
    "error": {
        "code": 4001,
        "message": "Invalid transaction format",
        "details": "Transaction nonce too low",
        "request_id": "req_1234567890"
    }
}
```

#### Common Error Codes

| Code | Description |
|------|-------------|
| 4001 | Invalid request format |
| 4002 | Insufficient balance |
| 4003 | Invalid signature |
| 4004 | Transaction nonce too low |
| 4005 | Gas limit exceeded |
| 5001 | Internal server error |
| 5002 | Network congestion |

### Rate Limiting

API requests are rate limited to ensure fair usage:

- **Free Tier**: 100 requests per minute
- **Pro Tier**: 1000 requests per minute
- **Enterprise Tier**: Custom limits

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1678866000
```

---

## Quantum-Resistant Development

### Overview

KALDRIX provides comprehensive quantum-resistant development tools and libraries to ensure your applications remain secure in the post-quantum era. This section covers the implementation of quantum-resistant features in your applications.

### Post-Quantum Cryptography

#### 1. Supported Algorithms

KALDRIX supports the following NIST-standardized post-quantum algorithms:

**Dilithium (CRYSTALS-Dilithium)**
- **Dilithium3**: 128-bit security level
- **Dilithium5**: 256-bit security level
- **Key Sizes**: 
  - Public key: 1312 bytes (Dilithium3), 2592 bytes (Dilithium5)
  - Signature: 2420 bytes (Dilithium3), 4595 bytes (Dilithium5)

**Kyber (CRYSTALS-Kyber)**
- **Kyber512**: 128-bit security level
- **Kyber768**: 192-bit security level
- **Kyber1024**: 256-bit security level
- **Key Sizes**: 
  - Public key: 800 bytes (Kyber512), 1184 bytes (Kyber1024)
  - Ciphertext: 768 bytes (Kyber512), 1088 bytes (Kyber1024)

#### 2. Hybrid Signature Scheme

The hybrid signature scheme combines classical and post-quantum signatures for maximum security:

```javascript
const { HybridSignature } = require('@kaldrix/pqc');

async function createHybridSignature(message, keys) {
    // Create classical signature
    const classicalSig = await createClassicalSignature(message, keys.classicalPrivate);
    
    // Create post-quantum signature
    const pqcSig = await createPQCSignature(message, keys.pqcPrivate);
    
    // Combine signatures
    const hybridSig = new HybridSignature({
        classical: classicalSig,
        pqc: pqcSig,
        algorithm: 'ed25519-dilithium3',
        timestamp: Date.now()
    });
    
    return hybridSig;
}

async function verifyHybridSignature(message, signature, publicKey) {
    // Verify classical signature
    const classicalValid = await verifyClassicalSignature(
        message, 
        signature.classical, 
        publicKey.classical
    );
    
    // Verify post-quantum signature
    const pqcValid = await verifyPQCSignature(
        message, 
        signature.pqc, 
        publicKey.pqc
    );
    
    // Both signatures must be valid
    return classicalValid && pqcValid;
}
```

#### 3. Key Management

Secure key management is crucial for quantum-resistant applications:

```javascript
const { QuantumKeyManager } = require('@kaldrix/pqc');

class QuantumWallet {
    constructor() {
        this.keyManager = new QuantumKeyManager();
        this.keys = null;
    }
    
    async initialize() {
        // Generate hybrid key pair
        this.keys = await this.keyManager.generateKeyPair({
            classical: 'ed25519',
            pqc: 'dilithium3'
        });
        
        // Store keys securely
        await this.keyManager.storeKeys(this.keys, 'secure-password');
    }
    
    async rotateKeys() {
        // Generate new key pair
        const newKeys = await this.keyManager.generateKeyPair({
            classical: 'ed25519',
            pqc: 'dilithium3'
        });
        
        // Create rotation proof
        const rotationProof = await this.createRotationProof(newKeys);
        
        // Broadcast rotation to network
        await this.broadcastRotation(rotationProof);
        
        // Update keys
        this.keys = newKeys;
        await this.keyManager.storeKeys(this.keys, 'secure-password');
    }
    
    async createRotationProof(newKeys) {
        const message = JSON.stringify({
            old_public: this.keys.classicalPublic,
            new_public: newKeys.classicalPublic,
            old_pqc_public: this.keys.pqcPublic,
            new_pqc_public: newKeys.pqcPublic,
            timestamp: Date.now()
        });
        
        const signature = await createHybridSignature(message, this.keys);
        
        return {
            message,
            signature,
            old_public: this.keys.classicalPublic,
            new_public: newKeys.classicalPublic
        };
    }
}
```

### Quantum-Resistant Smart Contracts

#### 1. Quantum-Safe Storage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@kaldrix/contracts/QuantumStorage.sol";

contract QuantumSafeStorage is QuantumStorage {
    struct SecureData {
        bytes encryptedData;
        bytes32 quantumHash;
        address owner;
        uint256 timestamp;
    }
    
    mapping(bytes32 => SecureData) public dataStore;
    
    event DataStored(bytes32 indexed key, address indexed owner);
    
    function storeData(bytes32 key, bytes calldata data) public {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        
        // Encrypt data with quantum-resistant encryption
        bytes memory encrypted = quantumEncrypt(data, msg.sender);
        
        // Create quantum hash for integrity verification
        bytes32 qHash = quantumHash(data);
        
        dataStore[key] = SecureData({
            encryptedData: encrypted,
            quantumHash: qHash,
            owner: msg.sender,
            timestamp: block.timestamp
        });
        
        emit DataStored(key, msg.sender);
    }
    
    function retrieveData(bytes32 key) public view returns (bytes memory) {
        require(dataStore[key].owner == msg.sender, "Not owner");
        
        // Decrypt data
        return quantumDecrypt(dataStore[key].encryptedData, msg.sender);
    }
    
    function verifyDataIntegrity(bytes32 key, bytes calldata data) public view returns (bool) {
        bytes32 computedHash = quantumHash(data);
        return computedHash == dataStore[key].quantumHash;
    }
}
```

#### 2. Quantum-Resistant Token

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@kaldrix/contracts/QuantumToken.sol";

contract QuantumResistantToken is QuantumToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        
        balanceOf[to] += amount;
        totalSupply += amount;
        
        emit Transfer(address(0), to, amount);
    }
    
    function burn(uint256 amount) public {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
    }
}
```

#### 3. Quantum-Resistant DAO

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@kaldrix/contracts/QuantumDAO.sol";

contract QuantumResistantDAO is QuantumDAO {
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes32 targetHash;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event Voted(uint256 indexed proposalId, address indexed voter, bool inFavor);
    event ProposalExecuted(uint256 indexed proposalId);
    
    modifier onlyMember() {
        require(votingPower[msg.sender] > 0, "Not a DAO member");
        _;
    }
    
    function createProposal(string memory description, bytes32 targetHash) public onlyMember {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        
        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        
        proposal.id = proposalCount;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.targetHash = targetHash;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + 7 days;
        
        emit ProposalCreated(proposalCount, msg.sender);
    }
    
    function vote(uint256 proposalId, bool inFavor) public onlyMember {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        require(block.timestamp <= proposals[proposalId].endTime, "Voting ended");
        require(!proposals[proposalId].hasVoted[msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        uint256 power = votingPower[msg.sender];
        
        proposal.hasVoted[msg.sender] = true;
        
        if (inFavor) {
            proposal.votesFor += power;
        } else {
            proposal.votesAgainst += power;
        }
        
        emit Voted(proposalId, msg.sender, inFavor);
    }
    
    function executeProposal(uint256 proposalId) public {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        require(block.timestamp > proposals[proposalId].endTime, "Voting not ended");
        require(!proposals[proposalId].executed, "Already executed");
        require(proposals[proposalId].votesFor > proposals[proposalId].votesAgainst, "Proposal not approved");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        
        // Execute proposal logic here
        _executeProposalLogic(proposal.targetHash);
        
        emit ProposalExecuted(proposalId);
    }
    
    function _executeProposalLogic(bytes32 targetHash) internal {
        // Implementation depends on proposal type
        // This could include contract upgrades, parameter changes, etc.
    }
}
```

### Quantum-Resistant Communication

#### 1. Secure Messaging

```javascript
const { QuantumMessenger } = require('@kaldrix/pqc');

class SecureMessaging {
    constructor() {
        this.messenger = new QuantumMessenger();
        this.contacts = new Map();
    }
    
    async addContact(name, publicKey) {
        this.contacts.set(name, {
            publicKey,
            conversationKey: await this.messenger.deriveConversationKey(publicKey)
        });
    }
    
    async sendMessage(recipient, message) {
        const contact = this.contacts.get(recipient);
        if (!contact) {
            throw new Error('Contact not found');
        }
        
        // Encrypt message with quantum-resistant encryption
        const encrypted = await this.messenger.encrypt(
            message,
            contact.conversationKey
        );
        
        // Create quantum signature
        const signature = await this.messenger.sign(encrypted);
        
        return {
            encrypted,
            signature,
            timestamp: Date.now()
        };
    }
    
    async receiveMessage(sender, encryptedMessage, signature) {
        const contact = this.contacts.get(sender);
        if (!contact) {
            throw new Error('Contact not found');
        }
        
        // Verify signature
        const isValid = await this.messenger.verify(
            encryptedMessage,
            signature,
            contact.publicKey
        );
        
        if (!isValid) {
            throw new Error('Invalid signature');
        }
        
        // Decrypt message
        const message = await this.messenger.decrypt(
            encryptedMessage,
            contact.conversationKey
        );
        
        return message;
    }
}
```

#### 2. Quantum-Resistant API Authentication

```javascript
const { QuantumAuth } = require('@kaldrix/pqc');

class QuantumAPIAuth {
    constructor(apiKey) {
        this.auth = new QuantumAuth(apiKey);
        this.sessionKeys = new Map();
    }
    
    async authenticate() {
        // Generate ephemeral keys for session
        const ephemeralKeys = await this.auth.generateEphemeralKeys();
        
        // Create authentication request
        const authRequest = {
            apiKey: this.auth.apiKey,
            ephemeralPublic: ephemeralKeys.public,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex')
        };
        
        // Sign with quantum-resistant signature
        const signature = await this.auth.sign(authRequest);
        
        // Send to server
        const response = await fetch('https://api.kaldrix.com/auth/quantum', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                request: authRequest,
                signature
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Derive session keys
            const sessionKeys = await this.auth.deriveSessionKeys(
                ephemeralKeys.private,
                result.serverPublic
            );
            
            this.sessionKeys.set('session_id', sessionKeys);
            return sessionKeys;
        } else {
            throw new Error('Authentication failed');
        }
    }
    
    async makeAuthenticatedRequest(endpoint, data) {
        const sessionKeys = this.sessionKeys.get('session_id');
        if (!sessionKeys) {
            throw new Error('Not authenticated');
        }
        
        // Encrypt request data
        const encrypted = await this.auth.encrypt(data, sessionKeys.encryption);
        
        // Create authentication token
        const authToken = await this.auth.createAuthToken(encrypted, sessionKeys);
        
        const response = await fetch(`https://api.kaldrix.com${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Quantum-Auth': authToken
            },
            body: JSON.stringify({ encrypted })
        });
        
        return response.json();
    }
}
```

### Quantum Threat Detection

#### 1. Quantum Attack Monitoring

```javascript
const { QuantumMonitor } = require('@kaldrix/pqc');

class QuantumSecurityMonitor {
    constructor() {
        this.monitor = new QuantumMonitor();
        this.alerts = [];
        this.thresholds = {
            signatureFailureRate: 0.01, // 1%
            keyCompromiseAttempts: 5,
            unusualPatternScore: 0.8
        };
    }
    
    async initialize() {
        // Start monitoring
        await this.monitor.start({
            signatureVerification: true,
            keyRotation: true,
            networkAnomalies: true,
            performanceMetrics: true
        });
        
        // Set up alert handlers
        this.monitor.on('alert', (alert) => this.handleAlert(alert));
        this.monitor.on('signatureFailure', (event) => this.handleSignatureFailure(event));
        this.monitor.on('keyCompromise', (event) => this.handleKeyCompromise(event));
    }
    
    handleAlert(alert) {
        this.alerts.push({
            timestamp: Date.now(),
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            data: alert.data
        });
        
        // Take action based on severity
        if (alert.severity === 'critical') {
            this.handleCriticalAlert(alert);
        }
    }
    
    handleSignatureFailure(event) {
        // Calculate failure rate
        const failureRate = this.monitor.getSignatureFailureRate();
        
        if (failureRate > this.thresholds.signatureFailureRate) {
            this.createAlert('high_signature_failure', 'high', {
                failureRate,
                timeWindow: event.timeWindow
            });
        }
    }
    
    handleKeyCompromise(event) {
        // Track compromise attempts
        const attempts = this.monitor.getKeyCompromiseAttempts(event.keyId);
        
        if (attempts > this.thresholds.keyCompromiseAttempts) {
            this.createAlert('potential_key_compromise', 'critical', {
                keyId: event.keyId,
                attempts,
                timeframe: event.timeframe
            });
            
            // Initiate key rotation
            this.initiateKeyRotation(event.keyId);
        }
    }
    
    async initiateKeyRotation(keyId) {
        try {
            // Generate new keys
            const newKeys = await this.monitor.generateReplacementKeys(keyId);
            
            // Create rotation transaction
            const rotationTx = await this.monitor.createKeyRotation(
                keyId,
                newKeys
            );
            
            // Broadcast to network
            await this.monitor.broadcastRotation(rotationTx);
            
            console.log('Key rotation initiated for key:', keyId);
        } catch (error) {
            console.error('Key rotation failed:', error);
        }
    }
    
    createAlert(type, severity, data) {
        const alert = {
            id: crypto.randomBytes(16).toString('hex'),
            type,
            severity,
            message: this.generateAlertMessage(type, data),
            data,
            timestamp: Date.now()
        };
        
        this.alerts.push(alert);
        
        // Notify administrators
        this.notifyAdministrators(alert);
    }
    
    generateAlertMessage(type, data) {
        const messages = {
            high_signature_failure: `High signature failure rate detected: ${data.failureRate * 100}%`,
            potential_key_compromise: `Potential key compromise detected for key ${data.keyId}`,
            unusual_pattern: `Unusual network pattern detected with score ${data.score}`,
            performance_degradation: `Performance degradation detected: ${data.metrics}`
        };
        
        return messages[type] || 'Unknown alert type';
    }
    
    async notifyAdministrators(alert) {
        // Send notification to administrators
        // This could be email, Slack, SMS, etc.
        console.log('ALERT:', alert.message);
        
        // Store alert for analysis
        await this.monitor.storeAlert(alert);
    }
}
```

#### 2. Quantum Resistance Scoring

```javascript
const { QuantumScorer } = require('@kaldrix/pqc');

class QuantumResistanceAnalyzer {
    constructor() {
        this.scorer = new QuantumScorer();
        this.scores = new Map();
    }
    
    async analyzeSystem() {
        // Analyze various components
        const components = [
            'cryptography',
            'key_management',
            'network_protocols',
            'storage_systems',
            'authentication'
        ];
        
        const analysis = {};
        
        for (const component of components) {
            analysis[component] = await this.analyzeComponent(component);
        }
        
        // Calculate overall score
        const overallScore = this.calculateOverallScore(analysis);
        
        return {
            overallScore,
            components: analysis,
            recommendations: this.generateRecommendations(analysis)
        };
    }
    
    async analyzeComponent(component) {
        const metrics = await this.scorer.getComponentMetrics(component);
        const score = this.scorer.calculateComponentScore(metrics);
        
        return {
            score,
            metrics,
            status: this.getScoreStatus(score),
            lastUpdated: Date.now()
        };
    }
    
    calculateOverallScore(componentAnalysis) {
        const weights = {
            cryptography: 0.3,
            key_management: 0.25,
            network_protocols: 0.2,
            storage_systems: 0.15,
            authentication: 0.1
        };
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (const [component, analysis] of Object.entries(componentAnalysis)) {
            const weight = weights[component] || 0;
            weightedSum += analysis.score * weight;
            totalWeight += weight;
        }
        
        return weightedSum / totalWeight;
    }
    
    generateRecommendations(analysis) {
        const recommendations = [];
        
        // Cryptography recommendations
        if (analysis.cryptography.score < 0.8) {
            recommendations.push({
                priority: 'high',
                component: 'cryptography',
                action: 'Upgrade to latest post-quantum algorithms',
                description: 'Current cryptographic implementation has quantum vulnerabilities'
            });
        }
        
        // Key management recommendations
        if (analysis.key_management.score < 0.7) {
            recommendations.push({
                priority: 'high',
                component: 'key_management',
                action: 'Implement automated key rotation',
                description: 'Key management practices need improvement for quantum resistance'
            });
        }
        
        // Network protocol recommendations
        if (analysis.network_protocols.score < 0.6) {
            recommendations.push({
                priority: 'medium',
                component: 'network_protocols',
                action: 'Update network protocols with quantum-resistant versions',
                description: 'Network protocols are vulnerable to quantum attacks'
            });
        }
        
        return recommendations;
    }
    
    getScoreStatus(score) {
        if (score >= 0.9) return 'excellent';
        if (score >= 0.8) return 'good';
        if (score >= 0.7) return 'fair';
        if (score >= 0.6) return 'poor';
        return 'critical';
    }
}
```

---

## Testing & Deployment

### Overview

This section covers comprehensive testing strategies and deployment procedures for KALDRIX applications. Proper testing and deployment are crucial for ensuring the security and reliability of quantum-resistant blockchain applications.

### Testing Framework

#### 1. Unit Testing

**JavaScript/TypeScript**

```javascript
// test/unit/wallet.test.js
const { Wallet } = require('@kaldrix/sdk');
const { expect } = require('chai');

describe('Wallet', () => {
    let wallet;
    
    beforeEach(async () => {
        wallet = await Wallet.create();
    });
    
    describe('Key Generation', () => {
        it('should generate valid key pair', async () => {
            expect(wallet.address).to.be.a('string');
            expect(wallet.address).to.match(/^0x[a-fA-F0-9]{40}$/);
            expect(wallet.publicKey).to.be.a('string');
            expect(wallet.privateKey).to.be.a('string');
        });
        
        it('should generate quantum-resistant keys', async () => {
            expect(wallet.quantumKeys).to.exist;
            expect(wallet.quantumKeys.algorithm).to.equal('dilithium3');
        });
    });
    
    describe('Transaction Signing', () => {
        it('should sign transactions correctly', async () => {
            const transaction = {
                from: wallet.address,
                to: '0x1234567890123456789012345678901234567890',
                amount: '1000',
                nonce: 0
            };
            
            const signedTx = await wallet.signTransaction(transaction);
            
            expect(signedTx.signature).to.exist;
            expect(signedTx.signature.classical).to.exist;
            expect(signedTx.signature.pqc).to.exist;
        });
        
        it('should verify quantum signatures', async () => {
            const message = 'test message';
            const signature = await wallet.signMessage(message);
            
            const isValid = await wallet.verifySignature(message, signature, wallet.publicKey);
            expect(isValid).to.be.true;
        });
    });
    
    describe('Key Rotation', () => {
        it('should rotate keys successfully', async () => {
            const oldPublicKey = wallet.publicKey;
            const oldPqcPublicKey = wallet.quantumKeys.public;
            
            await wallet.rotateKeys();
            
            expect(wallet.publicKey).to.not.equal(oldPublicKey);
            expect(wallet.quantumKeys.public).to.not.equal(oldPqcPublicKey);
        });
        
        it('should maintain access after key rotation', async () => {
            const balanceBefore = await wallet.getBalance();
            
            await wallet.rotateKeys();
            
            const balanceAfter = await wallet.getBalance();
            expect(balanceAfter).to.equal(balanceBefore);
        });
    });
});
```

**Rust Testing**

```rust
// tests/core_tests.rs
use kaldrix_core::{DAGCore, Transaction, QuantumKeyPair};
use std::collections::HashMap;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dag_creation() {
        let config = DAGConfig::default();
        let dag = DAGCore::new(config);
        
        assert!(dag.nodes.is_empty());
        assert!(dag.tips.is_empty());
    }

    #[test]
    fn test_transaction_validation() {
        let config = DAGConfig::default();
        let mut dag = DAGCore::new(config);
        
        let key_pair = QuantumKeyPair::generate();
        let transaction = Transaction::new(
            key_pair.public.clone(),
            "0x1234567890123456789012345678901234567890".parse().unwrap(),
            1000,
            0,
        );
        
        let signed_tx = transaction.sign(&key_pair);
        
        let result = dag.validate_transaction(&signed_tx);
        assert!(result.is_ok());
    }

    #[test]
    fn test_quantum_signature_verification() {
        let key_pair = QuantumKeyPair::generate();
        let message = b"test message";
        
        let signature = key_pair.sign(message);
        let is_valid = key_pair.verify(message, &signature);
        
        assert!(is_valid);
    }

    #[test]
    fn test_prime_layer_validation() {
        let validator = PrimeValidator::new();
        let key_pair = QuantumKeyPair::generate();
        
        let transaction = Transaction::new(
            key_pair.public.clone(),
            "0x1234567890123456789012345678901234567890".parse().unwrap(),
            1000,
            0,
        );
        
        let is_valid = validator.validate_prime_hash(&transaction);
        assert!(is_valid);
    }
}
```

#### 2. Integration Testing

```javascript
// test/integration/blockchain.test.js
const { KaldrixClient } = require('@kaldrix/sdk');
const { expect } = require('chai');

describe('Blockchain Integration', () => {
    let client;
    let wallet1;
    let wallet2;
    
    before(async () => {
        client = new KaldrixClient({
            network: 'testnet',
            endpoint: 'https://testnet.kaldrix.com'
        });
        
        wallet1 = await Wallet.create();
        wallet2 = await Wallet.create();
        
        // Fund wallets from faucet
        await client.faucet(wallet1.address);
        await client.faucet(wallet2.address);
    });
    
    describe('Transaction Flow', () => {
        it('should send and receive transactions', async () => {
            const initialBalance1 = await wallet1.getBalance();
            const initialBalance2 = await wallet2.getBalance();
            
            const amount = '1000';
            const tx = await client.createTransaction({
                from: wallet1.address,
                to: wallet2.address,
                amount,
                fee: '10'
            });
            
            const signedTx = await wallet1.signTransaction(tx);
            const result = await client.broadcastTransaction(signedTx);
            
            expect(result.status).to.equal('pending');
            
            // Wait for confirmation
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const finalBalance1 = await wallet1.getBalance();
            const finalBalance2 = await wallet2.getBalance();
            
            expect(BigInt(finalBalance1)).to.equal(BigInt(initialBalance1) - BigInt(amount) - BigInt(10));
            expect(BigInt(finalBalance2)).to.equal(BigInt(initialBalance2) + BigInt(amount));
        });
        
        it('should handle quantum-resistant signatures', async () => {
            const message = 'test quantum message';
            const signature = await wallet1.signMessage(message);
            
            const isValid = await client.verifyQuantumSignature(
                message,
                signature,
                wallet1.publicKey
            );
            
            expect(isValid).to.be.true;
        });
    });
    
    describe('Smart Contract Interaction', () => {
        let contract;
        
        before(async () => {
            // Deploy test contract
            const bytecode = '0x6060604052...'; // Contract bytecode
            const abi = [...]; // Contract ABI
            
            contract = await client.deployContract({
                bytecode,
                abi,
                from: wallet1.address
            });
        });
        
        it('should deploy contract successfully', async () => {
            expect(contract.address).to.match(/^0x[a-fA-F0-9]{40}$/);
        });
        
        it('should call contract methods', async () => {
            const result = await contract.methods.getValue().call();
            expect(result).to.equal(0);
            
            const tx = await contract.methods.setValue(42).send({
                from: wallet1.address
            });
            
            expect(tx.status).to.equal('success');
            
            const newValue = await contract.methods.getValue().call();
            expect(newValue).to.equal(42);
        });
    });
    
    describe('Key Rotation', () => {
        it('should rotate keys and maintain functionality', async () => {
            const oldAddress = wallet1.address;
            const oldBalance = await wallet1.getBalance();
            
            await wallet1.rotateKeys();
            
            expect(wallet1.address).to.not.equal(oldAddress);
            
            const newBalance = await wallet1.getBalance();
            expect(newBalance).to.equal(oldBalance);
            
            // Test transaction with new keys
            const tx = await client.createTransaction({
                from: wallet1.address,
                to: wallet2.address,
                amount: '100',
                fee: '10'
            });
            
            const signedTx = await wallet1.signTransaction(tx);
            const result = await client.broadcastTransaction(signedTx);
            
            expect(result.status).to.equal('pending');
        });
    });
});
```

#### 3. Performance Testing

```javascript
// test/performance/throughput.test.js
const { KaldrixClient } = require('@kaldrix/sdk');
const { performance } = require('perf_hooks');

describe('Performance Testing', () => {
    let client;
    let wallets = [];
    
    before(async () => {
        client = new KaldrixClient({
            network: 'testnet',
            endpoint: 'https://testnet.kaldrix.com'
        });
        
        // Create multiple wallets for testing
        for (let i = 0; i < 10; i++) {
            const wallet = await Wallet.create();
            await client.faucet(wallet.address);
            wallets.push(wallet);
        }
    });
    
    describe('Transaction Throughput', () => {
        it('should handle high transaction volume', async () => {
            const transactionCount = 100;
            const startTime = performance.now();
            
            const promises = [];
            for (let i = 0; i < transactionCount; i++) {
                const fromWallet = wallets[i % wallets.length];
                const toWallet = wallets[(i + 1) % wallets.length];
                
                const tx = await client.createTransaction({
                    from: fromWallet.address,
                    to: toWallet.address,
                    amount: '1',
                    fee: '1'
                });
                
                const signedTx = await fromWallet.signTransaction(tx);
                promises.push(client.broadcastTransaction(signedTx));
            }
            
            const results = await Promise.allSettled(promises);
            const endTime = performance.now();
            
            const duration = (endTime - startTime) / 1000; // seconds
            const throughput = transactionCount / duration;
            
            console.log(`Processed ${transactionCount} transactions in ${duration.toFixed(2)}s`);
            console.log(`Throughput: ${throughput.toFixed(2)} TPS`);
            
            expect(throughput).to.be.greaterThan(100); // Expect at least 100 TPS
        });
        
        it('should measure quantum signature performance', async () => {
            const messageCount = 1000;
            const message = 'test message for performance testing';
            
            const startTime = performance.now();
            
            for (let i = 0; i < messageCount; i++) {
                await wallets[0].signMessage(message);
            }
            
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000;
            const signaturesPerSecond = messageCount / duration;
            
            console.log(`Signed ${messageCount} messages in ${duration.toFixed(2)}s`);
            console.log(`Signature speed: ${signaturesPerSecond.toFixed(2)} signatures/second`);
            
            expect(signaturesPerSecond).to.be.greaterThan(100);
        });
    });
    
    describe('Network Latency', () => {
        it('should measure network latency', async () => {
            const measurements = [];
            const measurementCount = 50;
            
            for (let i = 0; i < measurementCount; i++) {
                const startTime = performance.now();
                
                await client.getLatestBlock();
                
                const endTime = performance.now();
                measurements.push(endTime - startTime);
            }
            
            const averageLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            const maxLatency = Math.max(...measurements);
            const minLatency = Math.min(...measurements);
            
            console.log(`Average latency: ${averageLatency.toFixed(2)}ms`);
            console.log(`Max latency: ${maxLatency.toFixed(2)}ms`);
            console.log(`Min latency: ${minLatency.toFixed(2)}ms`);
            
            expect(averageLatency).to.be.lessThan(1000); // Expect less than 1 second average
        });
    });
});
```

### Deployment Strategies

#### 1. Development Deployment

**Docker Compose Setup**

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  kaldrix-node:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8545:8545"
      - "8546:8546"
    environment:
      - NETWORK=development
      - LOG_LEVEL=debug
      - ENABLE_METRICS=true
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    networks:
      - kaldrix-network

  kaldrix-api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - BLOCKCHAIN_URL=http://kaldrix-node:8545
      - DATABASE_URL=postgresql://user:password@db:5432/kaldrix
    depends_on:
      - kaldrix-node
      - db
    networks:
      - kaldrix-network

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=kaldrix
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - kaldrix-network

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - kaldrix-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana:/etc/grafana/provisioning
      - grafana_data:/var/lib/grafana
    networks:
      - kaldrix-network

networks:
  kaldrix-network:
    driver: bridge

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:
```

**Development Scripts**

```bash
#!/bin/bash
# scripts/dev-deploy.sh

set -e

echo "🚀 Starting KALDRIX Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
mkdir -p data logs monitoring/grafana/dashboards

# Build and start services
echo "📦 Building and starting services..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ All services are running successfully!"
    echo ""
    echo "🌐 Service URLs:"
    echo "   - Blockchain Node: http://localhost:8545"
    echo "   - API Server: http://localhost:3000"
    echo "   - Prometheus: http://localhost:9090"
    echo "   - Grafana: http://localhost:3001 (admin/admin)"
    echo ""
    echo "📊 To view logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "🛑 To stop: docker-compose -f docker-compose.dev.yml down"
else
    echo "❌ Some services failed to start. Check logs with:"
    echo "   docker-compose -f docker-compose.dev.yml logs"
    exit 1
fi
```

#### 2. Staging Deployment

**Kubernetes Configuration**

```yaml
# k8s/staging/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kaldrix-staging
  namespace: kaldrix-staging
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kaldrix
  template:
    metadata:
      labels:
        app: kaldrix
        environment: staging
    spec:
      containers:
      - name: kaldrix-node
        image: kaldrix/node:latest-staging
        ports:
        - containerPort: 8545
        - containerPort: 8546
        env:
        - name: NETWORK
          value: "staging"
        - name: LOG_LEVEL
          value: "info"
        - name: ENABLE_METRICS
          value: "true"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8546
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8546
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: data
          mountPath: /app/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: kaldrix-staging-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: kaldrix-service
  namespace: kaldrix-staging
spec:
  selector:
    app: kaldrix
  ports:
  - name: rpc
    port: 8545
    targetPort: 8545
  - name: metrics
    port: 8546
    targetPort: 8546
  type: LoadBalancer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: kaldrix-staging-pvc
  namespace: kaldrix-staging
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

**Staging Deployment Script**

```bash
#!/bin/bash
# scripts/staging-deploy.sh

set -e

ENVIRONMENT="staging"
NAMESPACE="kaldrix-staging"
IMAGE_TAG="latest-staging"

echo "🚀 Deploying KALDRIX to ${ENVIRONMENT}..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t kaldrix/node:${IMAGE_TAG} .

# Push to registry
echo "📤 Pushing image to registry..."
docker push kaldrix/node:${IMAGE_TAG}

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes configurations
echo "🔧 Applying Kubernetes configurations..."
kubectl apply -f k8s/${ENVIRONMENT}/

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/kaldrix-staging -n ${NAMESPACE}

# Get service URL
SERVICE_URL=$(kubectl get service kaldrix-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Service URL: http://${SERVICE_URL}"
echo ""
echo "📊 To check status: kubectl get pods -n ${NAMESPACE}"
echo "📋 To view logs: kubectl logs -f deployment/kaldrix-staging -n ${NAMESPACE}"
echo "🔄 To rollback: kubectl rollout undo deployment/kaldrix-staging -n ${NAMESPACE}"
```

#### 3. Production Deployment

**Terraform Configuration**

```hcl
# terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = aws_eks_cluster.kaldrix.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.kaldrix.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.kaldrix.token
}

# EKS Cluster
resource "aws_eks_cluster" "kaldrix" {
  name     = "kaldrix-production"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.27"

  vpc_config {
    subnet_ids = aws_subnet.kaldrix[*].id
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]
}

# Node Group
resource "aws_eks_node_group" "kaldrix" {
  cluster_name    = aws_eks_cluster.kaldrix.name
  node_group_name = "kaldrix-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.kaldrix[*].id

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 1
  }

  instance_types = ["m5.xlarge"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
  ]
}

# Kubernetes Deployment
resource "kubernetes_deployment" "kaldrix" {
  metadata {
    name      = "kaldrix-production"
    namespace = "default"
  }

  spec {
    replicas = 5

    selector {
      match_labels = {
        app = "kaldrix"
      }
    }

    template {
      metadata {
        labels = {
          app         = "kaldrix"
            environment = "production"
        }
      }

      spec {
        container {
          name  = "kaldrix-node"
          image = "kaldrix/node:latest-production"

          port {
            container_port = 8545
          }

          port {
            container_port = 8546
          }

          env {
            name  = "NETWORK"
            value = "mainnet"
          }

          env {
            name  = "LOG_LEVEL"
            value = "warn"
          }

          env {
            name  = "ENABLE_METRICS"
            value = "true"
          }

          resources {
            limits = {
              cpu    = "2"
              memory = "4Gi"
            }
            requests = {
              cpu    = "1"
              memory = "2Gi"
            }
          }

          livenessProbe {
            http_get {
              path = "/health"
              port = 8546
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }

          readinessProbe {
            http_get {
              path = "/ready"
              port = 8546
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }
        }
      }
    }
  }
}

# Load Balancer Service
resource "kubernetes_service" "kaldrix" {
  metadata {
    name      = "kaldrix-service"
    namespace = "default"
  }

  spec {
    selector = {
      app = "kaldrix"
    }

    port {
      name        = "rpc"
      port        = 8545
      target_port = 8545
    }

    port {
      name        = "metrics"
      port        = 8546
      target_port = 8546
    }

    type = "LoadBalancer"
  }
}
```

**Production Deployment Script**

```bash
#!/bin/bash
# scripts/production-deploy.sh

set -e

ENVIRONMENT="production"
IMAGE_TAG="latest-production"

echo "🚀 Deploying KALDRIX to ${ENVIRONMENT}..."

# Run security checks
echo "🔒 Running security checks..."
./scripts/security-check.sh

# Run tests
echo "🧪 Running tests..."
npm test

# Build Docker image
echo "📦 Building Docker image..."
docker build -t kaldrix/node:${IMAGE_TAG} .

# Security scan image
echo "🔍 Scanning image for vulnerabilities..."
docker scan kaldrix/node:${IMAGE_TAG}

# Tag and push to registry
echo "📤 Pushing image to registry..."
docker tag kaldrix/node:${IMAGE_TAG} ${ECR_REGISTRY}/kaldrix/node:${IMAGE_TAG}
docker push ${ECR_REGISTRY}/kaldrix/node:${IMAGE_TAG}

# Initialize Terraform
echo "🔧 Initializing Terraform..."
cd terraform
terraform init

# Plan deployment
echo "📋 Planning deployment..."
terraform plan -out=plan.tfplan

# Apply deployment
echo "🚀 Applying deployment..."
terraform apply plan.tfplan

# Get service URL
SERVICE_URL=$(terraform output service_url)

echo "✅ Production deployment completed successfully!"
echo ""
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "📊 Monitoring: https://monitoring.kaldrix.com"
echo "📋 Logs: https://logs.kaldrix.com"
echo ""
echo "🔄 To rollback: terraform apply -destroy"
```

### CI/CD Pipeline

#### GitHub Actions Configuration

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  RUST_VERSION: '1.70'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
    
    - name: Setup Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: ${{ env.RUST_VERSION }}
        override: true
    
    - name: Install dependencies
      run: |
        npm ci
        cargo build --release
    
    - name: Run JavaScript tests
      run: npm test
    
    - name: Run Rust tests
      run: cargo test
    
    - name: Run security audit
      run: npm audit
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Run security scan
      uses: securecodewarrior/github-action-add-sarif@v1
      with:
        sarif-file: 'security-scan.sarif'
    
    - name: Upload SARIF file
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'security-scan.sarif'

  build-and-push:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to ECR
      uses: aws-actions/amazon-ecr-login@v1
      with:
        mask-password: true
    
    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ secrets.ECR_REGISTRY }}
        ECR_REPOSITORY: kaldrix/node
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Deploy to staging
      env:
        KUBE_CONFIG: ${{ secrets.KUBE_CONFIG_STAGING }}
      run: |
        echo "$KUBE_CONFIG" > kubeconfig
        export KUBECONFIG=kubeconfig
        ./scripts/staging-deploy.sh

  deploy-production:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Deploy to production
      env:
        KUBE_CONFIG: ${{ secrets.KUBE_CONFIG_PRODUCTION }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_REGION: ${{ secrets.AWS_REGION }}
      run: |
        echo "$KUBE_CONFIG" > kubeconfig
        export KUBECONFIG=kubeconfig
        ./scripts/production-deploy.sh
```

### Monitoring and Observability

#### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'kaldrix-node'
    static_configs:
      - targets: ['kaldrix-node:8546']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'kaldrix-api'
    static_configs:
      - targets: ['kaldrix-api:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

#### Alert Rules

```yaml
# monitoring/alert_rules.yml
groups:
  - name: kaldrix-alerts
    rules:
    - alert: HighSignatureFailureRate
      expr: rate(signature_failures_total[5m]) / rate(signature_attempts_total[5m]) > 0.01
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High signature failure rate detected"
        description: "Signature failure rate is {{ $value | printf "%.2f" }}%"

    - alert: QuantumThreatDetected
      expr: quantum_threat_score > 0.8
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Quantum threat detected"
        description: "Quantum threat score is {{ $value }}"

    - alert: NodeDown
      expr: up{job="kaldrix-node"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "KALDRIX node is down"
        description: "Node {{ $labels.instance }} has been down for more than 1 minute"

    - alert: HighMemoryUsage
      expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage detected"
        description: "Memory usage is {{ $value | printf "%.2f" }}% on {{ $labels.instance }}"
```

#### Grafana Dashboard

```json
// monitoring/grafana/dashboards/kaldrix-dashboard.json
{
  "dashboard": {
    "id": null,
    "title": "KALDRIX Blockchain Dashboard",
    "tags": ["kaldrix", "blockchain"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Transaction Throughput",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(transactions_processed_total[5m])",
            "legendFormat": "TPS"
          }
        ],
        "yAxes": [
          {
            "label": "Transactions per Second"
          }
        ]
      },
      {
        "id": 2,
        "title": "Quantum Resistance Score",
        "type": "singlestat",
        "targets": [
          {
            "expr": "quantum_resistance_score",
            "legendFormat": "Score"
          }
        ],
        "thresholds": "0.7,0.9",
        "colors": ["red", "yellow", "green"]
      },
      {
        "id": 3,
        "title": "Network Health",
        "type": "graph",
        "targets": [
          {
            "expr": "up{job=\"kaldrix-node\"}",
            "legendFormat": "Node Status"
          }
        ]
      },
      {
        "id": 4,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes",
            "legendFormat": "Memory Usage"
          }
        ],
        "yAxes": [
          {
            "label": "Memory Usage (%)",
            "max": 1,
            "min": 0
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

---

## Best Practices

### Overview

This section provides comprehensive best practices for developing secure, efficient, and maintainable applications on the KALDRIX blockchain. Following these practices will help ensure your applications are quantum-resistant and production-ready.

### Security Best Practices

#### 1. Quantum-Resistant Cryptography

**Always Use Hybrid Signatures**

```javascript
// ❌ Bad: Using only classical signatures
const signature = await wallet.signClassical(message);

// ✅ Good: Using hybrid signatures
const signature = await wallet.signHybrid(message);
```

**Regular Key Rotation**

```javascript
// ❌ Bad: Never rotating keys
const keys = await generateKeys();
// Use keys indefinitely

// ✅ Good: Regular key rotation
class SecureWallet {
    constructor() {
        this.keys = null;
        this.lastRotation = Date.now();
        this.rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
    }
    
    async ensureFreshKeys() {
        if (Date.now() - this.lastRotation > this.rotationInterval) {
            await this.rotateKeys();
        }
    }
    
    async rotateKeys() {
        const newKeys = await generateKeys();
        await this.broadcastKeyRotation(newKeys);
        this.keys = newKeys;
        this.lastRotation = Date.now();
    }
}
```

**Secure Key Storage**

```javascript
// ❌ Bad: Storing keys in plain text
const privateKey = '0x123...';
localStorage.setItem('privateKey', privateKey);

// ✅ Good: Using secure storage
const { SecureStorage } = require('@kaldrix/security');

class SecureWallet {
    constructor() {
        this.storage = new SecureStorage({
            type: 'encrypted',
            encryptionKey: 'user-provided-password'
        });
    }
    
    async storeKeys(keys) {
        await this.storage.store('wallet-keys', keys);
    }
    
    async loadKeys() {
        return await this.storage.load('wallet-keys');
    }
}
```

#### 2. Smart Contract Security

**Use Quantum-Resistant Patterns**

```solidity
// ❌ Bad: Regular contract without quantum protection
contract SimpleToken {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}

// ✅ Good: Quantum-resistant contract
import "@kaldrix/contracts/QuantumFeatures.sol";

contract QuantumToken is QuantumFeatures {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        require(verifyQuantumSignature(msg.sender), "Invalid quantum signature");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

**Implement Access Controls**

```solidity
// ❌ Bad: No access control
contract VulnerableContract {
    function sensitiveFunction() public {
        // Anyone can call this
    }
}

// ✅ Good: Proper access control
import "@kaldrix/contracts/AccessControl.sol";

contract SecureContract is AccessControl {
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function sensitiveFunction() public onlyRole(DEFAULT_ADMIN_ROLE) {
        // Only admin can call this
    }
}
```

**Use Safe Math Operations**

```solidity
// ❌ Bad: Potential overflow/underflow
contract UnsafeMath {
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b; // Can overflow
    }
}

// ✅ Good: Safe math operations
import "@kaldrix/contracts/SafeMath.sol";

contract SafeMathContract {
    using SafeMath for uint256;
    
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a.add(b); // Safe from overflow
    }
}
```

#### 3. Network Security

**Use Secure Connections**

```javascript
// ❌ Bad: Using HTTP
const client = new KaldrixClient({
    endpoint: 'http://api.kaldrix.com'
});

// ✅ Good: Using HTTPS with certificate pinning
const client = new KaldrixClient({
    endpoint: 'https://api.kaldrix.com',
    sslPinning: true,
    certificates: ['path/to/certificate.pem']
});
```

**Implement Rate Limiting**

```javascript
// ❌ Bad: No rate limiting
app.post('/api/transactions', async (req, res) => {
    // Process unlimited transactions
});

// ✅ Good: Implement rate limiting
const rateLimit = require('express-rate-limit');

const transactionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many transaction requests, please try again later.'
});

app.post('/api/transactions', transactionLimiter, async (req, res) => {
    // Process transactions with rate limiting
});
```

**Validate All Inputs**

```javascript
// ❌ Bad: No input validation
app.post('/api/transactions', (req, res) => {
    const { from, to, amount } = req.body;
    // Use inputs directly without validation
});

// ✅ Good: Comprehensive input validation
const { body, validationResult } = require('express-validator');

app.post('/api/transactions', [
    body('from').isEthereumAddress().withMessage('Invalid from address'),
    body('to').isEthereumAddress().withMessage('Invalid to address'),
    body('amount').isNumeric().withMessage('Amount must be numeric'),
    body('amount').custom(value => {
        if (value <= 0) {
            throw new Error('Amount must be positive');
        }
        return true;
    })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    // Process validated inputs
});
```

### Performance Best Practices

#### 1. Transaction Optimization

**Batch Transactions**

```javascript
// ❌ Bad: Sending transactions individually
async function sendMultipleTransactions(transactions) {
    for (const tx of transactions) {
        const result = await client.sendTransaction(tx);
        console.log('Transaction sent:', result.hash);
    }
}

// ✅ Good: Using batch transactions
async function sendMultipleTransactions(transactions) {
    const batch = new TransactionBatch();
    
    for (const tx of transactions) {
        batch.addTransaction(tx);
    }
    
    const results = await batch.send();
    console.log('Batch results:', results);
}
```

**Optimize Gas Usage**

```solidity
// ❌ Bad: Inefficient gas usage
contract GasWaster {
    mapping(address => uint256[]) public largeArrays;
    
    function addToArray(address user, uint256 value) public {
        largeArrays[user].push(value); // Expensive operation
    }
}

// ✅ Good: Gas-optimized contract
contract GasOptimizer {
    mapping(address => uint256) public singleValue;
    
    function updateValue(address user, uint256 value) public {
        singleValue[user] = value; // Much cheaper
    }
}
```

**Use Event Logging Efficiently**

```solidity
// ❌ Bad: Excessive event logging
contract EventSpammer {
    function processLargeData(bytes[] calldata data) public {
        for (uint i = 0; i < data.length; i++) {
            emit DataProcessed(data[i]); // Too many events
        }
    }
}

// ✅ Good: Efficient event logging
contract EventOptimizer {
    function processLargeData(bytes[] calldata data) public {
        uint256 processedCount = data.length;
        emit BatchDataProcessed(processedCount); // Single event
    }
}
```

#### 2. Memory Management

**Use Memory-Efficient Data Structures**

```javascript
// ❌ Bad: Memory-intensive operations
function processLargeDataset(data) {
    const results = [];
    for (const item of data) {
        results.push(expensiveOperation(item)); // Stores all results in memory
    }
    return results;
}

// ✅ Good: Stream processing
async function processLargeDataset(data) {
    for (const item of data) {
        const result = await expensiveOperation(item);
        await storeResult(result); // Stream results as they're processed
    }
}
```

**Implement Proper Cleanup**

```javascript
// ❌ Bad: No cleanup
class ResourceManager {
    constructor() {
        this.connections = [];
    }
    
    createConnection() {
        const connection = createDatabaseConnection();
        this.connections.push(connection);
        return connection;
    }
}

// ✅ Good: Proper cleanup
class ResourceManager {
    constructor() {
        this.connections = new Set();
    }
    
    createConnection() {
        const connection = createDatabaseConnection();
        this.connections.add(connection);
        
        connection.on('close', () => {
            this.connections.delete(connection);
        });
        
        return connection;
    }
    
    cleanup() {
        for (const connection of this.connections) {
            connection.close();
        }
        this.connections.clear();
    }
}
```

#### 3. Caching Strategies

**Implement Smart Caching**

```javascript
// ❌ Bad: No caching
class BlockchainData {
    async getBlock(blockNumber) {
        return await client.getBlock(blockNumber); // Always fetches from network
    }
}

// ✅ Good: Smart caching
class BlockchainData {
    constructor() {
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }
    
    async getBlock(blockNumber) {
        const cacheKey = `block-${blockNumber}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        
        const block = await client.getBlock(blockNumber);
        this.cache.set(cacheKey, {
            data: block,
            timestamp: Date.now()
        });
        
        return block;
    }
    
    clearCache() {
        this.cache.clear();
    }
}
```

**Use Cache Invalidation**

```javascript
// ❌ Bad: Static cache without invalidation
class StaticCache {
    constructor() {
        this.cache = new Map();
    }
    
    get(key) {
        return this.cache.get(key);
    }
    
    set(key, value) {
        this.cache.set(key, value);
    }
}

// ✅ Good: Cache with invalidation
class SmartCache {
    constructor() {
        this.cache = new Map();
        this.invalidations = new Map();
    }
    
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const invalidationTime = this.invalidations.get(key) || 0;
        if (cached.timestamp < invalidationTime) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    set(key, value) {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now()
        });
    }
    
    invalidate(key) {
        this.invalidations.set(key, Date.now());
    }
    
    invalidateAll() {
        const now = Date.now();
        for (const key of this.cache.keys()) {
            this.invalidations.set(key, now);
        }
    }
}
```

### Code Quality Best Practices

#### 1. Code Organization

**Use Modular Architecture**

```javascript
// ❌ Bad: Monolithic structure
// app.js
const express = require('express');
const app = express();

// All routes in one file
app.get('/api/blocks', async (req, res) => { /* ... */ });
app.get('/api/transactions', async (req, res) => { /* ... */ });
app.get('/api/accounts', async (req, res) => { /* ... */ });
// ... hundreds more routes

// ✅ Good: Modular structure
// routes/
// ├── blocks.js
// ├── transactions.js
// ├── accounts.js
// └── index.js

// routes/blocks.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    // Block-related logic
});

router.get('/:blockNumber', async (req, res) => {
    // Single block logic
});

module.exports = router;

// routes/index.js
const blocks = require('./blocks');
const transactions = require('./transactions');
const accounts = require('./accounts');

const router = express.Router();
router.use('/blocks', blocks);
router.use('/transactions', transactions);
router.use('/accounts', accounts);

module.exports = router;
```

**Follow Consistent Naming Conventions**

```javascript
// ❌ Bad: Inconsistent naming
const blockchain_data = require('./blockchain-data');
const getUserBalance = require('./get_user_balance');
const TX_FEE = 1000;

// ✅ Good: Consistent naming
const blockchainData = require('./blockchain-data');
const getUserBalance = require('./get-user-balance');
const TRANSACTION_FEE = 1000;
```

#### 2. Error Handling

**Implement Comprehensive Error Handling**

```javascript
// ❌ Bad: Basic error handling
async function sendTransaction(transaction) {
    try {
        const result = await client.sendTransaction(transaction);
        return result;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// ✅ Good: Comprehensive error handling
class TransactionError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
    }
}

async function sendTransaction(transaction) {
    try {
        // Validate transaction
        if (!transaction.from || !transaction.to) {
            throw new TransactionError(
                'Invalid transaction structure',
                'INVALID_STRUCTURE',
                { transaction }
            );
        }
        
        // Check balance
        const balance = await getBalance(transaction.from);
        if (balance < transaction.amount) {
            throw new TransactionError(
                'Insufficient balance',
                'INSUFFICIENT_BALANCE',
                { balance, required: transaction.amount }
            );
        }
        
        // Send transaction
        const result = await client.sendTransaction(transaction);
        
        // Validate result
        if (!result.hash) {
            throw new TransactionError(
                'Transaction failed',
                'TRANSACTION_FAILED',
                { result }
            );
        }
        
        return result;
        
    } catch (error) {
        // Log error with context
        logger.error('Transaction failed', {
            error: error.message,
            code: error.code,
            details: error.details,
            transaction,
            timestamp: error.timestamp
        });
        
        // Re-throw with appropriate handling
        if (error.code === 'INSUFFICIENT_BALANCE') {
            throw new TransactionError(
                'Please check your balance and try again',
                'USER_ERROR',
                { originalError: error }
            );
        }
        
        throw error;
    }
}
```

**Use Proper HTTP Status Codes**

```javascript
// ❌ Bad: Always using 500
app.get('/api/blocks/:number', async (req, res) => {
    try {
        const block = await getBlock(req.params.number);
        res.json(block);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// ✅ Good: Appropriate status codes
app.get('/api/blocks/:number', async (req, res) => {
    try {
        const blockNumber = parseInt(req.params.number);
        if (isNaN(blockNumber) || blockNumber < 0) {
            return res.status(400).json({
                error: 'Invalid block number',
                code: 'INVALID_BLOCK_NUMBER'
            });
        }
        
        const block = await getBlock(blockNumber);
        if (!block) {
            return res.status(404).json({
                error: 'Block not found',
                code: 'BLOCK_NOT_FOUND'
            });
        }
        
        res.json(block);
        
    } catch (error) {
        logger.error('Error fetching block', {
            error: error.message,
            blockNumber: req.params.number
        });
        
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
```

#### 3. Documentation

**Write Comprehensive Documentation**

```javascript
// ❌ Bad: No documentation
function processTransaction(tx) {
    // ... complex logic
}

// ✅ Good: Well-documented code
/**
 * Processes a quantum-resistant transaction on the KALDRIX blockchain.
 * 
 * @param {Object} transaction - The transaction to process
 * @param {string} transaction.from - Sender's address
 * @param {string} transaction.to - Recipient's address
 * @param {string|number} transaction.amount - Transaction amount in wei
 * @param {Object} [transaction.metadata] - Optional transaction metadata
 * @returns {Promise<Object>} Processing result with transaction hash
 * @throws {TransactionError} If transaction validation fails
 * 
 * @example
 * const result = await processTransaction({
 *   from: '0x123...',
 *   to: '0x456...',
 *   amount: '1000000000000000000'
 * });
 */
async function processTransaction(transaction) {
    // Implementation with inline comments
    if (!transaction.from || !transaction.to) {
        throw new TransactionError('Missing required fields');
    }
    
    // Convert amount to BigInt for precise arithmetic
    const amount = BigInt(transaction.amount);
    
    // ... rest of implementation
}
```

**Use Type Definitions**

```javascript
// ❌ Bad: No type definitions
function validateTransaction(tx) {
    // No type information
}

// ✅ Good: Type definitions
/**
 * @typedef {Object} Transaction
 * @property {string} from - Sender's address
 * @property {string} to - Recipient's address
 * @property {string|number} amount - Transaction amount
 * @property {number} [nonce] - Transaction nonce
 * @property {string} [data] - Transaction data
 * @property {Object} [quantumSignature] - Quantum signature data
 */

/**
 * Validates a transaction structure and quantum signature
 * @param {Transaction} transaction - Transaction to validate
 * @returns {Promise<boolean>} True if valid
 * @throws {ValidationError} If validation fails
 */
async function validateTransaction(transaction) {
    // Implementation with type safety
    if (typeof transaction.from !== 'string' || !transaction.from.startsWith('0x')) {
        throw new ValidationError('Invalid from address');
    }
    
    // ... rest of validation
}
```

### Testing Best Practices

#### 1. Test Coverage

**Write Comprehensive Tests**

```javascript
// ❌ Bad: Minimal test coverage
describe('Wallet', () => {
    it('should create wallet', () => {
        const wallet = new Wallet();
        expect(wallet).to.exist;
    });
});

// ✅ Good: Comprehensive test coverage
describe('Wallet', () => {
    let wallet;
    
    beforeEach(async () => {
        wallet = await Wallet.create();
    });
    
    describe('Key Generation', () => {
        it('should generate valid address', () => {
            expect(wallet.address).to.match(/^0x[a-fA-F0-9]{40}$/);
        });
        
        it('should generate quantum-resistant keys', () => {
            expect(wallet.quantumKeys).to.exist;
            expect(wallet.quantumKeys.algorithm).to.equal('dilithium3');
        });
        
        it('should generate unique keys each time', async () => {
            const wallet2 = await Wallet.create();
            expect(wallet.address).to.not.equal(wallet2.address);
            expect(wallet.privateKey).to.not.equal(wallet2.privateKey);
        });
    });
    
    describe('Transaction Signing', () => {
        it('should sign transactions correctly', async () => {
            const transaction = {
                from: wallet.address,
                to: '0x1234567890123456789012345678901234567890',
                amount: '1000',
                nonce: 0
            };
            
            const signedTx = await wallet.signTransaction(transaction);
            
            expect(signedTx.signature).to.exist;
            expect(signedTx.signature.classical).to.exist;
            expect(signedTx.signature.pqc).to.exist;
        });
        
        it('should verify signatures correctly', async () => {
            const message = 'test message';
            const signature = await wallet.signMessage(message);
            
            const isValid = await wallet.verifySignature(message, signature, wallet.publicKey);
            expect(isValid).to.be.true;
        });
        
        it('should reject invalid signatures', async () => {
            const message = 'test message';
            const signature = await wallet.signMessage(message);
            const tamperedMessage = 'tampered message';
            
            const isValid = await wallet.verifySignature(tamperedMessage, signature, wallet.publicKey);
            expect(isvalid).to.be.false;
        });
    });
    
    describe('Key Rotation', () => {
        it('should rotate keys successfully', async () => {
            const oldPublicKey = wallet.publicKey;
            const oldPqcPublicKey = wallet.quantumKeys.public;
            
            await wallet.rotateKeys();
            
            expect(wallet.publicKey).to.not.equal(oldPublicKey);
            expect(wallet.quantumKeys.public).to.not.equal(oldPqcPublicKey);
        });
        
        it('should maintain functionality after key rotation', async () => {
            const balanceBefore = await wallet.getBalance();
            
            await wallet.rotateKeys();
            
            const balanceAfter = await wallet.getBalance();
            expect(balanceAfter).to.equal(balanceBefore);
        });
    });
    
    describe('Error Handling', () => {
        it('should handle invalid transaction structure', async () => {
            const invalidTransaction = {
                from: wallet.address
                // Missing 'to' and 'amount'
            };
            
            await expect(wallet.signTransaction(invalidTransaction))
                .to.be.rejectedWith('Invalid transaction structure');
        });
        
        it('should handle insufficient balance', async () => {
            const transaction = {
                from: wallet.address,
                to: '0x1234567890123456789012345678901234567890',
                amount: '999999999999999999999999999999999999'
            };
            
            await expect(wallet.sendTransaction(transaction))
                .to.be.rejectedWith('Insufficient balance');
        });
    });
});
```

#### 2. Integration Testing

**Test Real Scenarios**

```javascript
// ❌ Bad: Only unit tests
describe('Blockchain', () => {
    it('should calculate hash', () => {
        const hash = calculateHash('test');
        expect(hash).to.equal('expected-hash');
    });
});

// ✅ Good: Integration tests
describe('Blockchain Integration', () => {
    let client;
    let wallet1;
    let wallet2;
    
    before(async () => {
        client = new KaldrixClient({
            network: 'testnet',
            endpoint: 'https://testnet.kaldrix.com'
        });
        
        wallet1 = await Wallet.create();
        wallet2 = await Wallet.create();
        
        // Fund wallets
        await client.faucet(wallet1.address);
        await client.faucet(wallet2.address);
    });
    
    describe('Transaction Flow', () => {
        it('should complete full transaction lifecycle', async () => {
            // Get initial balances
            const balance1Before = await wallet1.getBalance();
            const balance2Before = await wallet2.getBalance();
            
            // Create and send transaction
            const amount = '1000';
            const fee = '10';
            const tx = await client.createTransaction({
                from: wallet1.address,
                to: wallet2.address,
                amount,
                fee
            });
            
            const signedTx = await wallet1.signTransaction(tx);
            const result = await client.broadcastTransaction(signedTx);
            
            expect(result.status).to.equal('pending');
            
            // Wait for confirmation
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Verify final balances
            const balance1After = await wallet1.getBalance();
            const balance2After = await wallet2.getBalance();
            
            expect(BigInt(balance1After)).to.equal(
                BigInt(balance1Before) - BigInt(amount) - BigInt(fee)
            );
            expect(BigInt(balance2After)).to.equal(
                BigInt(balance2Before) + BigInt(amount)
            );
        });
        
        it('should handle concurrent transactions', async () => {
            const transactionCount = 10;
            const promises = [];
            
            for (let i = 0; i < transactionCount; i++) {
                const tx = await client.createTransaction({
                    from: wallet1.address,
                    to: wallet2.address,
                    amount: '1',
                    fee: '1'
                });
                
                const signedTx = await wallet1.signTransaction(tx);
                promises.push(client.broadcastTransaction(signedTx));
            }
            
            const results = await Promise.allSettled(promises);
            
            // All transactions should be processed
            const successful = results.filter(r => r.status === 'fulfilled');
            expect(successful.length).to.equal(transactionCount);
        });
    });
    
    describe('Quantum Features', () => {
        it('should verify quantum signatures across network', async () => {
            const message = 'quantum test message';
            const signature = await wallet1.signMessage(message);
            
            // Verify through API
            const isValid = await client.verifyQuantumSignature(
                message,
                signature,
                wallet1.publicKey
            );
            
            expect(isValid).to.be.true;
        });
        
        it('should handle key rotation in network context', async () => {
            const oldAddress = wallet1.address;
            const balanceBefore = await wallet1.getBalance();
            
            // Rotate keys
            await wallet1.rotateKeys();
            
            // Verify new address is different
            expect(wallet1.address).to.not.equal(oldAddress);
            
            // Verify balance is maintained
            const balanceAfter = await wallet1.getBalance();
            expect(balanceAfter).to.equal(balanceBefore);
            
            // Test transaction with new keys
            const tx = await client.createTransaction({
                from: wallet1.address,
                to: wallet2.address,
                amount: '100',
                fee: '10'
            });
            
            const signedTx = await wallet1.signTransaction(tx);
            const result = await client.broadcastTransaction(signedTx);
            
            expect(result.status).to.equal('pending');
        });
    });
});
```

#### 3. Performance Testing

**Test Under Load**

```javascript
// ❌ Bad: No performance testing
describe('Performance', () => {
    it('should work', () => {
        // No performance metrics
    });
});

// ✅ Good: Comprehensive performance testing
describe('Performance Testing', () => {
    let client;
    let wallets = [];
    
    before(async () => {
        client = new KaldrixClient({
            network: 'testnet',
            endpoint: 'https://testnet.kaldrix.com'
        });
        
        // Create test wallets
        for (let i = 0; i < 20; i++) {
            const wallet = await Wallet.create();
            await client.faucet(wallet.address);
            wallets.push(wallet);
        }
    });
    
    describe('Transaction Throughput', () => {
        it('should handle high transaction volume', async () => {
            const transactionCount = 100;
            const startTime = Date.now();
            
            const promises = [];
            for (let i = 0; i < transactionCount; i++) {
                const fromWallet = wallets[i % wallets.length];
                const toWallet = wallets[(i + 1) % wallets.length];
                
                const tx = await client.createTransaction({
                    from: fromWallet.address,
                    to: toWallet.address,
                    amount: '1',
                    fee: '1'
                });
                
                const signedTx = await fromWallet.signTransaction(tx);
                promises.push(client.broadcastTransaction(signedTx));
            }
            
            const results = await Promise.allSettled(promises);
            const endTime = Date.now();
            
            const duration = (endTime - startTime) / 1000; // seconds
            const throughput = transactionCount / duration;
            const successRate = results.filter(r => r.status === 'fulfilled').length / transactionCount;
            
            console.log(`Throughput: ${throughput.toFixed(2)} TPS`);
            console.log(`Success rate: ${(successRate * 100).toFixed(2)}%`);
            
            expect(throughput).to.be.greaterThan(50); // Minimum 50 TPS
            expect(successRate).to.be.greaterThan(0.95); // 95% success rate
        });
        
        it('should measure quantum signature performance', async () => {
            const messageCount = 1000;
            const message = 'performance test message';
            
            const startTime = Date.now();
            
            for (let i = 0; i < messageCount; i++) {
                await wallets[0].signMessage(message);
            }
            
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            const signaturesPerSecond = messageCount / duration;
            
            console.log(`Signature speed: ${signaturesPerSecond.toFixed(2)} signatures/second`);
            
            expect(signaturesPerSecond).to.be.greaterThan(100);
        });
    });
    
    describe('Memory Usage', () => {
        it('should monitor memory usage under load', async () => {
            const initialMemory = process.memoryUsage();
            
            // Create memory pressure
            const transactions = [];
            for (let i = 0; i < 1000; i++) {
                transactions.push({
                    from: wallets[0].address,
                    to: wallets[1].address,
                    amount: '1',
                    fee: '1'
                });
            }
            
            // Process transactions
            const promises = transactions.map(async (tx) => {
                const signedTx = await wallets[0].signTransaction(tx);
                return client.broadcastTransaction(signedTx);
            });
            
            await Promise.allSettled(promises);
            
            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            
            console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
            
            // Memory increase should be reasonable
            expect(memoryIncrease).to.be.lessThan(100 * 1024 * 1024); // Less than 100MB
        });
    });
});
```

---

## Troubleshooting

### Overview

This section provides comprehensive troubleshooting guidance for common issues encountered when developing with KALDRIX. Follow these steps to diagnose and resolve problems efficiently.

### Common Issues and Solutions

#### 1. Connection Issues

**Problem: Cannot connect to KALDRIX network**

```javascript
// Error message: "Connection refused" or "Network unreachable"
const client = new KaldrixClient({
    network: 'testnet',
    endpoint: 'https://testnet.kaldrix.com'
});

// Symptoms:
// - Connection timeout
// - DNS resolution failure
// - SSL/TLS handshake failure
```

**Solutions:**

1. **Check Network Connectivity**
```javascript
// Test basic network connectivity
const fetch = require('node-fetch');

async function testConnectivity() {
    try {
        const response = await fetch('https://testnet.kaldrix.com/health');
        console.log('Network connectivity: OK');
        console.log('Status:', response.status);
    } catch (error) {
        console.error('Network connectivity failed:', error.message);
    }
}

testConnectivity();
```

2. **Verify Endpoint Configuration**
```javascript
// Ensure correct endpoint configuration
const config = {
    testnet: 'https://testnet-api.kaldrix.com',
    mainnet: 'https://api.kaldrix.com',
    development: 'http://localhost:8545'
};

const network = process.env.NETWORK || 'testnet';
const endpoint = config[network];

if (!endpoint) {
    throw new Error(`Invalid network: ${network}`);
}

const client = new KaldrixClient({ network, endpoint });
```

3. **Check Firewall and Proxy Settings**
```bash
# Check if port is open
telnet testnet.kaldrix.com 443

# Or use curl
curl -I https://testnet.kaldrix.com/health
```

4. **Configure Proxy (if needed)**
```javascript
const HttpsProxyAgent = require('https-proxy-agent');

const proxyAgent = new HttpsProxyAgent('http://proxy.company.com:8080');

const client = new KaldrixClient({
    endpoint: 'https://testnet.kaldrix.com',
    agent: proxyAgent
});
```

#### 2. Transaction Issues

**Problem: Transactions fail or get stuck**

```javascript
// Error message: "Transaction failed" or "Transaction not confirmed"
const result = await client.sendTransaction(signedTx);
// result.status === 'failed' or transaction stays pending
```

**Solutions:**

1. **Check Transaction Parameters**
```javascript
async function validateTransaction(tx) {
    // Check required fields
    if (!tx.from || !tx.to) {
        throw new Error('Missing required fields: from, to');
    }
    
    // Validate addresses
    if (!tx.from.startsWith('0x') || tx.from.length !== 42) {
        throw new Error('Invalid from address');
    }
    
    if (!tx.to.startsWith('0x') || tx.to.length !== 42) {
        throw new Error('Invalid to address');
    }
    
    // Validate amount
    const amount = BigInt(tx.amount || 0);
    if (amount <= 0) {
        throw new Error('Amount must be positive');
    }
    
    // Check nonce
    const nonce = await client.getNonce(tx.from);
    if (tx.nonce !== undefined && tx.nonce < nonce) {
        throw new Error('Nonce too low');
    }
    
    // Check balance
    const balance = await client.getBalance(tx.from);
    const requiredAmount = amount + BigInt(tx.fee || 0);
    if (balance < requiredAmount) {
        throw new Error('Insufficient balance');
    }
    
    return true;
}

// Usage
try {
    await validateTransaction(transaction);
    const result = await client.sendTransaction(transaction);
} catch (error) {
    console.error('Transaction validation failed:', error.message);
}
```

2. **Check Gas Settings**
```javascript
async function getOptimalGasSettings() {
    // Get current gas price
    const gasPrice = await client.getGasPrice();
    
    // Estimate gas limit
    const gasLimit = await client.estimateGas({
        from: wallet.address,
        to: contract.address,
        data: contract.methods.myMethod().encodeABI()
    });
    
    // Add buffer for safety
    const gasLimitWithBuffer = gasLimit * BigInt(120) / BigInt(100);
    
    return {
        gasPrice: gasPrice.toString(),
        gasLimit: gasLimitWithBuffer.toString()
    };
}

// Usage
const gasSettings = await getOptimalGasSettings();
const transaction = {
    ...txData,
    ...gasSettings
};
```

3. **Monitor Transaction Status**
```javascript
async function monitorTransaction(txHash, timeout = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        const receipt = await client.getTransactionReceipt(txHash);
        
        if (receipt) {
            if (receipt.status === 'success') {
                console.log('Transaction confirmed successfully');
                return receipt;
            } else {
                throw new Error('Transaction failed');
            }
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Transaction confirmation timeout');
}

// Usage
try {
    const receipt = await monitorTransaction(txHash);
    console.log('Transaction confirmed:', receipt.transactionHash);
} catch (error) {
    console.error('Transaction monitoring failed:', error.message);
}
```

#### 3. Quantum Signature Issues

**Problem: Quantum signature verification fails**

```javascript
// Error message: "Invalid quantum signature" or "Signature verification failed"
const isValid = await wallet.verifyQuantumSignature(message, signature, publicKey);
// isValid === false
```

**Solutions:**

1. **Check Signature Format**
```javascript
function validateQuantumSignature(signature) {
    // Check required fields
    if (!signature.classical || !signature.pqc) {
        throw new Error('Missing signature components');
    }
    
    // Check classical signature format
    if (!signature.classical.r || !signature.classical.s) {
        throw new Error('Invalid classical signature format');
    }
    
    // Check PQC signature format
    if (!signature.pqc.signature || !signature.pqc.publicKey) {
        throw new Error('Invalid PQC signature format');
    }
    
    // Check timestamp
    if (!signature.timestamp || Date.now() - signature.timestamp > 300000) {
        throw new Error('Signature expired');
    }
    
    return true;
}

// Usage
try {
    validateQuantumSignature(signature);
    const isValid = await wallet.verifyQuantumSignature(message, signature, publicKey);
} catch (error) {
    console.error('Signature validation failed:', error.message);
}
```

2. **Verify Key Compatibility**
```javascript
async function verifyKeyCompatibility(publicKey, signature) {
    // Check algorithm compatibility
    if (publicKey.algorithm !== signature.algorithm) {
        throw new Error('Algorithm mismatch');
    }
    
    // Check key size compatibility
    if (publicKey.keySize !== signature.keySize) {
        throw new Error('Key size mismatch');
    }
    
    // Verify key format
    if (!publicKey.key || !signature.key) {
        throw new Error('Invalid key format');
    }
    
    return true;
}

// Usage
try {
    await verifyKeyCompatibility(publicKey, signature);
    const isValid = await wallet.verifyQuantumSignature(message, signature, publicKey);
} catch (error) {
    console.error('Key compatibility check failed:', error.message);
}
```

3. **Debug Signature Process**
```javascript
async function debugSignatureProcess(wallet, message) {
    console.log('=== Signature Debug Info ===');
    console.log('Message:', message);
    console.log('Wallet address:', wallet.address);
    console.log('Public key:', wallet.publicKey);
    console.log('PQC public key:', wallet.quantumKeys.public);
    
    try {
        // Create signature
        const signature = await wallet.signMessage(message);
        console.log('Signature created successfully');
        console.log('Classical signature:', signature.classical);
        console.log('PQC signature:', signature.pqc);
        
        // Verify signature
        const isValid = await wallet.verifySignature(message, signature, wallet.publicKey);
        console.log('Signature verification result:', isValid);
        
        if (!isValid) {
            // Try to identify the issue
            console.log('=== Troubleshooting ===');
            
            // Check message encoding
            const messageBuffer = Buffer.from(message, 'utf8');
            console.log('Message buffer:', messageBuffer.toString('hex'));
            
            // Check signature components
            console.log('Classical R:', signature.classical.r);
            console.log('Classical S:', signature.classical.s);
            console.log('PQC Signature:', signature.pqc.signature);
            
            // Try verification with different approaches
            const classicalValid = await wallet.verifyClassicalSignature(message, signature.classical, wallet.publicKey);
            const pqcValid = await wallet.verifyPQCSignature(message, signature.pqc, wallet.quantumKeys.public);
            
            console.log('Classical verification:', classicalValid);
            console.log('PQC verification:', pqcValid);
        }
        
        return isValid;
        
    } catch (error) {
        console.error('Signature process failed:', error);
        return false;
    }
}

// Usage
const result = await debugSignatureProcess(wallet, 'test message');
console.log('Final result:', result);
```

#### 4. Smart Contract Issues

**Problem: Smart contract deployment or execution fails**

```solidity
// Error message: "Contract deployment failed" or "Contract execution reverted"
contract MyContract {
    function myFunction() public {
        // This function fails
        require(false, "This always fails");
    }
}
```

**Solutions:**

1. **Debug Contract Deployment**
```javascript
async function debugContractDeployment(bytecode, abi, from) {
    console.log('=== Contract Deployment Debug ===');
    console.log('Bytecode length:', bytecode.length);
    console.log('ABI:', JSON.stringify(abi, null, 2));
    console.log('From address:', from);
    
    try {
        // Estimate gas
        const gasEstimate = await client.estimateGas({
            from,
            data: bytecode
        });
        console.log('Estimated gas:', gasEstimate.toString());
        
        // Get current gas price
        const gasPrice = await client.getGasPrice();
        console.log('Gas price:', gasPrice.toString());
        
        // Deploy contract
        const contract = await client.deployContract({
            bytecode,
            abi,
            from,
            gas: gasEstimate,
            gasPrice
        });
        
        console.log('Contract deployed at:', contract.address);
        return contract;
        
    } catch (error) {
        console.error('Contract deployment failed:', error.message);
        
        // Additional debugging
        if (error.message.includes('insufficient funds')) {
            const balance = await client.getBalance(from);
            console.log('Account balance:', balance.toString());
            console.log('Required balance:', (BigInt(gasEstimate) * BigInt(gasPrice)).toString());
        }
        
        if (error.message.includes('revert')) {
            console.log('Contract constructor reverted - check constructor logic');
        }
        
        throw error;
    }
}

// Usage
try {
    const contract = await debugContractDeployment(bytecode, abi, wallet.address);
} catch (error) {
    console.error('Contract deployment failed:', error.message);
}
```

2. **Debug Contract Execution**
```javascript
async function debugContractExecution(contract, method, args, from) {
    console.log('=== Contract Execution Debug ===');
    console.log('Contract address:', contract.address);
    console.log('Method:', method);
    console.log('Arguments:', args);
    console.log('From address:', from);
    
    try {
        // Encode function call
        const encodedData = contract.methods[method](...args).encodeABI();
        console.log('Encoded data:', encodedData);
        
        // Estimate gas
        const gasEstimate = await contract.methods[method](...args).estimateGas({ from });
        console.log('Estimated gas:', gasEstimate.toString());
        
        // Get current gas price
        const gasPrice = await client.getGasPrice();
        console.log('Gas price:', gasPrice.toString());
        
        // Call method (read-only)
        const result = await contract.methods[method](...args).call();
        console.log('Call result:', result);
        
        // Send transaction (write operation)
        const tx = await contract.methods[method](...args).send({
            from,
            gas: gasEstimate,
            gasPrice
        });
        
        console.log('Transaction hash:', tx.transactionHash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        
        return receipt;
        
    } catch (error) {
        console.error('Contract execution failed:', error.message);
        
        // Additional debugging
        if (error.message.includes('revert')) {
            console.log('Contract execution reverted - check require statements');
            
            // Try to get revert reason
            try {
                const result = await contract.methods[method](...args).call({ from });
                console.log('Call succeeded but transaction failed - check gas or permissions');
            } catch (callError) {
                console.log('Call also failed:', callError.message);
            }
        }
        
        if (error.message.includes('out of gas')) {
            console.log('Out of gas - increase gas limit');
            console.log('Estimated gas:', gasEstimate.toString());
            console.log('Try with higher gas limit');
        }
        
        throw error;
    }
}

// Usage
try {
    const receipt = await debugContractExecution(
        contract,
        'myMethod',
        [arg1, arg2],
        wallet.address
    );
} catch (error) {
    console.error('Contract execution failed:', error.message);
}
```

#### 5. Performance Issues

**Problem: Application is slow or unresponsive**

```javascript
// Symptoms:
// - High latency in API calls
// - Memory usage keeps growing
// - CPU usage is high
// - Transactions take too long to confirm
```

**Solutions:**

1. **Profile Application Performance**
```javascript
const profiler = require('v8-profiler-next');

class PerformanceProfiler {
    constructor() {
        this.snapshots = [];
    }
    
    startProfiling(name) {
        profiler.startProfiling(name, true);
    }
    
    stopProfiling(name) {
        const profile = profiler.stopProfiling(name);
        const snapshot = profile.export();
        this.snapshots.push({ name, snapshot, timestamp: Date.now() });
        
        // Save to file for analysis
        require('fs').writeFileSync(
            `profile-${name}-${Date.now()}.cpuprofile`,
            JSON.stringify(snapshot)
        );
        
        return snapshot;
    }
    
    async measureAsyncOperation(name, operation) {
        const startMemory = process.memoryUsage();
        const startTime = Date.now();
        
        this.startProfiling(name);
        
        try {
            const result = await operation();
            
            const endTime = Date.now();
            const endMemory = process.memoryUsage();
            
            this.stopProfiling(name);
            
            console.log(`=== ${name} Performance ===`);
            console.log(`Duration: ${endTime - startTime}ms`);
            console.log(`Memory increase: ${endMemory.heapUsed - startMemory.heapUsed} bytes`);
            
            return result;
            
        } catch (error) {
            this.stopProfiling(name);
            throw error;
        }
    }
}

// Usage
const profiler = new PerformanceProfiler();

async function testPerformance() {
    await profiler.measureAsyncOperation('Transaction Sending', async () => {
        const tx = await client.createTransaction({
            from: wallet.address,
            to: '0x123...',
            amount: '1000'
        });
        return await client.sendTransaction(tx);
    });
    
    await profiler.measureAsyncOperation('Balance Query', async () => {
        return await client.getBalance(wallet.address);
    });
}

testPerformance().catch(console.error);
```

2. **Optimize Database Queries**
```javascript
// ❌ Bad: Inefficient database queries
async function getAllTransactions(address) {
    // This loads all transactions into memory
    const allTransactions = await db.collection('transactions').find({}).toArray();
    return allTransactions.filter(tx => tx.from === address || tx.to === address);
}

// ✅ Good: Optimized database queries
async function getAllTransactions(address, limit = 100, skip = 0) {
    // Use database indexing and pagination
    return await db.collection('transactions')
        .find({
            $or: [{ from: address }, { to: address }]
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
}

// Create indexes for better performance
async function setupDatabaseIndexes() {
    await db.collection('transactions').createIndex({ from: 1 });
    await db.collection('transactions').createIndex({ to: 1 });
    await db.collection('transactions').createIndex({ timestamp: -1 });
    await db.collection('transactions').createIndex({ from: 1, timestamp: -1 });
    await db.collection('transactions').createIndex({ to: 1, timestamp: -1 });
}
```

3. **Implement Caching**
```javascript
const NodeCache = require('node-cache');

class CacheManager {
    constructor(ttl = 300) { // 5 minutes default TTL
        this.cache = new NodeCache({ stdTTL: ttl, checkperiod: 60 });
        this.hitCount = 0;
        this.missCount = 0;
    }
    
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.hitCount++;
            return value;
        }
        this.missCount++;
        return null;
    }
    
    set(key, value, ttl) {
        this.cache.set(key, value, ttl);
    }
    
    invalidate(key) {
        this.cache.del(key);
    }
    
    getStats() {
        const total = this.hitCount + this.missCount;
        const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;
        
        return {
            hits: this.hitCount,
            misses: this.missCount,
            hitRate: hitRate.toFixed(2) + '%',
            keys: this.cache.keys().length
        };
    }
}

// Usage
const cache = new CacheManager();

async function getBlockWithCache(blockNumber) {
    const cacheKey = `block-${blockNumber}`;
    let block = cache.get(cacheKey);
    
    if (!block) {
        block = await client.getBlock(blockNumber);
        cache.set(cacheKey, block, 300); // Cache for 5 minutes
    }
    
    return block;
}

// Monitor cache performance
setInterval(() => {
    console.log('Cache stats:', cache.getStats());
}, 60000); // Every minute
```

### Debugging Tools and Techniques

#### 1. Logging and Monitoring

**Structured Logging**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'kaldrix-app' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Usage in application
async function sendTransaction(transaction) {
    logger.info('Sending transaction', {
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        nonce: transaction.nonce
    });
    
    try {
        const result = await client.sendTransaction(transaction);
        logger.info('Transaction sent successfully', {
            hash: result.hash,
            nonce: result.nonce
        });
        return result;
    } catch (error) {
        logger.error('Transaction failed', {
            error: error.message,
            stack: error.stack,
            transaction
        });
        throw error;
    }
}
```

**Performance Monitoring**
```javascript
const promClient = require('prom-client');

// Create metrics
const transactionCounter = new promClient.Counter({
    name: 'kaldrix_transactions_total',
    help: 'Total number of transactions processed',
    labelNames: ['status', 'network']
});

const transactionDuration = new promClient.Histogram({
    name: 'kaldrix_transaction_duration_seconds',
    help: 'Transaction processing duration in seconds',
    labelNames: ['network'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const activeConnections = new promClient.Gauge({
    name: 'kaldrix_active_connections',
    help: 'Number of active connections'
});

// Use metrics in application
async function processTransaction(transaction) {
    const startTime = Date.now();
    
    try {
        const result = await client.sendTransaction(transaction);
        
        transactionCounter.inc({ status: 'success', network: 'testnet' });
        transactionDuration.observe(
            (Date.now() - startTime) / 1000,
            { network: 'testnet' }
        );
        
        return result;
        
    } catch (error) {
        transactionCounter.inc({ status: 'failed', network: 'testnet' });
        throw error;
    }
}

// Expose metrics endpoint
const express = require('express');
const app = express();

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});
```

#### 2. Debugging Tools

**Interactive Debugging**
```javascript
// Use Node.js debugger
const inspect = require('util').inspect;

function debugObject(obj, depth = 2) {
    console.log(inspect(obj, { depth, colors: true }));
}

// Debug transaction object
function debugTransaction(transaction) {
    console.log('=== Transaction Debug ===');
    console.log('Type:', typeof transaction);
    console.log('Keys:', Object.keys(transaction));
    console.log('From:', transaction.from);
    console.log('To:', transaction.to);
    console.log('Amount:', transaction.amount);
    console.log('Nonce:', transaction.nonce);
    
    if (transaction.signature) {
        console.log('Signature:', {
            hasClassical: !!transaction.signature.classical,
            hasPQC: !!transaction.signature.pqc,
            algorithm: transaction.signature.algorithm,
            timestamp: transaction.signature.timestamp
        });
    }
}

// Usage
debugTransaction(transaction);
```

**Network Debugging**
```javascript
const net = require('net');
const tls = require('tls');

async function testConnection(host, port, useTls = true) {
    return new Promise((resolve, reject) => {
        const socket = useTls ? tls.connect(port, host) : net.connect(port, host);
        
        socket.on('connect', () => {
            console.log('Connected to', host, port);
            socket.end();
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error('Connection failed:', error.message);
            reject(error);
        });
        
        socket.on('timeout', () => {
            console.error('Connection timeout');
            socket.destroy();
            reject(new Error('Connection timeout'));
        });
        
        socket.setTimeout(10000); // 10 seconds timeout
    });
}

// Test network connectivity
async function testNetworkConnectivity() {
    const endpoints = [
        { host: 'testnet.kaldrix.com', port: 443, useTls: true },
        { host: 'api.kaldrix.com', port: 443, useTls: true },
        { host: 'localhost', port: 8545, useTls: false }
    ];
    
    for (const endpoint of endpoints) {
        try {
            await testConnection(endpoint.host, endpoint.port, endpoint.useTls);
            console.log(`✅ ${endpoint.host}:${endpoint.port} - OK`);
        } catch (error) {
            console.log(`❌ ${endpoint.host}:${endpoint.port} - ${error.message}`);
        }
    }
}

testNetworkConnectivity().catch(console.error);
```

### Getting Help

#### 1. Community Resources

**Official Channels**
- **Documentation**: https://docs.kaldrix.com
- **GitHub Issues**: https://github.com/kaldrix/kaldrix-blockchain/issues
- **Discord**: https://discord.gg/kaldrix
- **Twitter**: @kaldrix_blockchain

**When Asking for Help**
1. **Search Existing Issues**: Check if your issue has been reported before
2. **Provide Detailed Information**: Include error messages, code snippets, and environment details
3. **Reproduce the Issue**: Provide steps to reproduce the problem
4. **Share Your Research**: Explain what you've tried so far

**Example Issue Template**
```markdown
## Issue Description
Brief description of the issue

## Environment
- Node.js version: `node --version`
- KALDRIX SDK version: `npm list @kaldrix/sdk`
- Operating System: `uname -a`
- Network: testnet/mainnet/development

## Steps to Reproduce
1. Initialize wallet
2. Create transaction
3. Sign transaction
4. Broadcast transaction
5. Error occurs

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Error Messages
```
Paste error messages here
```

## Code Snippet
```javascript
// Paste relevant code here
```

## Additional Context
Any other relevant information
```

#### 2. Professional Support

**Enterprise Support**
For enterprise customers, KALDRIX offers professional support with:
- 24/7 technical support
- Dedicated account manager
- Custom development assistance
- Priority bug fixes
- Security audits

**Contact Information**
- Email: enterprise@kaldrix.com
- Website: https://kaldrix.com/enterprise
- Phone: +1 (555) 123-4567

#### 3. Contributing to Documentation

**Improving Documentation**
If you find gaps in the documentation or want to contribute improvements:

1. **Fork the Repository**
   ```bash
   git clone https://github.com/kaldrix/kaldrix-blockchain.git
   cd kaldrix-blockchain
   ```

2. **Make Your Changes**
   ```bash
   # Edit documentation files
   nano docs/developer-documentation.md
   ```

3. **Submit Pull Request**
   ```bash
   git add docs/developer-documentation.md
   git commit -m "Improve developer documentation"
   git push origin your-branch-name
   ```

**Documentation Guidelines**
- Use clear, concise language
- Include code examples
- Provide step-by-step instructions
- Add troubleshooting sections
- Keep examples up-to-date

---

## Contributing

### Overview

We welcome contributions to the KALDRIX blockchain project! This section provides guidelines for contributing code, documentation, and other improvements to the project.

### Getting Started

#### 1. Development Environment Setup

**Prerequisites**
- Node.js 16.0 or higher
- Rust 1.70 or higher
- Docker and Docker Compose
- Git
- GitHub account

**Clone the Repository**
```bash
git clone https://github.com/kaldrix/kaldrix-blockchain.git
cd kaldrix-blockchain
```

**Install Dependencies**
```bash
# Install Node.js dependencies
npm install

# Install Rust dependencies
cargo build --release

# Install development tools
npm install -g @kaldrix/dev-tools
```

**Set Up Development Environment**
```bash
# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development services
npm run dev:setup
```

#### 2. Understanding the Codebase

**Project Structure**
```
kaldrix-blockchain/
├── src/                    # Core Rust source code
│   ├── core/               # DAG core implementation
│   ├── consensus/          # Consensus mechanisms
│   ├── network/            # Network layer
│   ├── security/           # Security features
│   ├── governance/         # Governance system
│   └── lib.rs              # Main library file
├── mobile-sdk/             # Mobile SDK source code
├── api/                    # API server source code
├── docs/                   # Documentation
├── test/                   # Test files
├── scripts/                # Development scripts
├── docker/                 # Docker configurations
├── monitoring/             # Monitoring configurations
└── examples/               # Example applications
```

**Key Components**
- **DAG Core**: Core DAG implementation and transaction processing
- **Consensus**: Hybrid DAG-BFT consensus mechanism
- **Quantum Layer**: Post-quantum cryptography implementation
- **Network**: P2P networking and communication protocols
- **Security**: Security features and threat detection
- **Governance**: On-chain governance and voting systems

### Contribution Guidelines

#### 1. Code Contributions

**Fork and Clone**
```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/kaldrix-blockchain.git
cd kaldrix-blockchain
git remote add upstream https://github.com/kaldrix/kaldrix-blockchain.git
```

**Create a Feature Branch**
```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/your-fix-name
```

**Development Workflow**
```bash
# Make your changes
# Write tests for your changes
npm test

# Run linting
npm run lint

# Run security audit
npm audit

# Build the project
npm run build

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

**Pull Request Process**
1. **Update Your Fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill in the PR template
   - Submit the PR

3. **PR Review Process**
   - Automated checks will run
   - Code review by maintainers
   - Address review comments
   - Merge when approved

**Code Style Guidelines**

**Rust Code Style**
```rust
// ✅ Good: Follow Rust conventions
use std::collections::HashMap;

pub struct Transaction {
    pub id: Hash256,
    pub sender: Address,
    pub receiver: Address,
    pub amount: u64,
    pub nonce: u64,
}

impl Transaction {
    pub fn new(sender: Address, receiver: Address, amount: u64, nonce: u64) -> Self {
        Transaction {
            id: Hash256::zero(),
            sender,
            receiver,
            amount,
            nonce,
        }
    }
    
    pub fn validate(&self) -> Result<(), Error> {
        if self.amount == 0 {
            return Err(Error::InvalidAmount);
        }
        Ok(())
    }
}
```

**JavaScript/TypeScript Code Style**
```javascript
// ✅ Good: Follow modern JavaScript conventions
import { KaldrixClient, Wallet } from '@kaldrix/sdk';

class TransactionManager {
    constructor(client) {
        this.client = client;
        this.wallet = null;
    }
    
    async initialize() {
        this.wallet = await Wallet.create();
        return this.wallet;
    }
    
    async sendTransaction(to, amount) {
        if (!this.wallet) {
            throw new Error('Wallet not initialized');
        }
        
        const transaction = {
            from: this.wallet.address,
            to,
            amount: amount.toString(),
            nonce: await this.client.getNonce(this.wallet.address)
        };
        
        const signedTx = await this.wallet.signTransaction(transaction);
        return await this.client.broadcastTransaction(signedTx);
    }
}
```

**Commit Message Guidelines**
```
# Format: <type>(<scope>): <description>
# 
# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code style changes
# refactor: Code refactoring
# test: Test changes
# chore: Build process or auxiliary tool changes
#
# Examples:
# feat(core): add quantum-resistant signature verification
# fix(api): handle connection timeout gracefully
# docs(readme): update installation instructions
# test(wallet): add comprehensive wallet tests
```

#### 2. Documentation Contributions

**Documentation Guidelines**
- Use clear, concise language
- Include code examples
- Provide step-by-step instructions
- Add troubleshooting sections
- Keep documentation up-to-date

**Adding New Documentation**
```markdown
---
title: Your Document Title
description: Brief description of the document
---

# Your Document Title

## Overview
Brief overview of what this document covers.

## Prerequisites
What readers need to know before starting.

## Getting Started
Step-by-step instructions.

## Code Examples
```javascript
// Your code examples here
```

## Troubleshooting
Common issues and solutions.

## Related Resources
Links to related documentation.
```

**Updating Existing Documentation**
1. **Find the relevant file**
2. **Make your changes**
3. **Test your changes**
4. **Submit a pull request**

#### 3. Testing Contributions

**Test Guidelines**
- Write comprehensive tests
- Test both success and failure cases
- Use descriptive test names
- Include setup and teardown
- Mock external dependencies

**Unit Test Example**
```javascript
// ✅ Good: Comprehensive unit test
describe('TransactionManager', () => {
    let transactionManager;
    let mockClient;
    
    beforeEach(() => {
        mockClient = {
            getNonce: sinon.stub().resolves(123),
            broadcastTransaction: sinon.stub().resolves({ hash: '0x123' })
        };
        
        transactionManager = new TransactionManager(mockClient);
    });
    
    describe('sendTransaction', () => {
        it('should send transaction successfully', async () => {
            // Setup
            await transactionManager.initialize();
            
            // Execute
            const result = await transactionManager.sendTransaction(
                '0x456',
                '1000'
            );
            
            // Verify
            expect(result.hash).to.equal('0x123');
            expect(mockClient.broadcastTransaction.calledOnce).to.be.true;
        });
        
        it('should throw error if wallet not initialized', async () => {
            // Execute & Verify
            await expect(
                transactionManager.sendTransaction('0x456', '1000')
            ).to.be.rejectedWith('Wallet not initialized');
        });
        
        it('should use correct nonce from client', async () => {
            // Setup
            await transactionManager.initialize();
            
            // Execute
            await transactionManager.sendTransaction('0x456', '1000');
            
            // Verify
            expect(mockClient.getNonce.calledOnce).to.be.true;
            expect(mockClient.getNonce.calledWith(transactionManager.wallet.address)).to.be.true;
        });
    });
});
```

**Integration Test Example**
```javascript
// ✅ Good: Integration test
describe('Blockchain Integration', () => {
    let client;
    let wallet;
    
    before(async () => {
        client = new KaldrixClient({
            network: 'testnet',
            endpoint: process.env.TESTNET_ENDPOINT
        });
        
        wallet = await Wallet.create();
        await fundWalletFromFaucet(wallet.address);
    });
    
    describe('Transaction Lifecycle', () => {
        it('should complete full transaction flow', async () => {
            // Get initial state
            const initialBalance = await client.getBalance(wallet.address);
            
            // Create and send transaction
            const transaction = await client.createTransaction({
                from: wallet.address,
                to: '0x1234567890123456789012345678901234567890',
                amount: '1000',
                fee: '10'
            });
            
            const signedTx = await wallet.signTransaction(transaction);
            const result = await client.broadcastTransaction(signedTx);
            
            // Wait for confirmation
            const receipt = await client.waitForTransaction(result.hash);
            
            // Verify final state
            const finalBalance = await client.getBalance(wallet.address);
            const expectedBalance = BigInt(initialBalance) - BigInt(1010);
            
            expect(BigInt(finalBalance)).to.equal(expectedBalance);
            expect(receipt.status).to.equal('success');
        });
    });
});
```

#### 4. Bug Reports

**Bug Report Guidelines**
- Use the issue template
- Provide detailed reproduction steps
- Include error messages and stack traces
- Specify environment information
- Add screenshots if applicable

**Bug Report Template**
```markdown
## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- Node.js version: [e.g. 16.0]
- KALDRIX SDK version: [e.g. 1.0.0]
- Operating System: [e.g. Ubuntu 20.04]
- Network: [e.g. testnet]

## Additional Context
Add any other context about the problem here.

## Logs
```
Paste relevant logs here
```
```

### Development Guidelines

#### 1. Code Quality

**Linting and Formatting**
```bash
# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

**Security Audit**
```bash
# Run security audit
npm audit

# Fix security issues
npm audit fix

# Run static analysis
npm run security:scan
```

**Performance Testing**
```bash
# Run performance tests
npm run test:performance

# Generate performance report
npm run test:performance:report
```

#### 2. Testing Requirements

**Test Coverage**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test file
npm test -- --grep "TransactionManager"
```

**Test Requirements**
- Minimum 80% code coverage
- All critical paths must be tested
- Include both unit and integration tests
- Test error conditions and edge cases

#### 3. Documentation Requirements

**API Documentation**
```javascript
/**
 * Sends a transaction to the blockchain
 * @param {Object} transaction - Transaction object
 * @param {string} transaction.from - Sender address
 * @param {string} transaction.to - Recipient address
 * @param {string|number} transaction.amount - Transaction amount
 * @param {number} [transaction.nonce] - Transaction nonce
 * @returns {Promise<Object>} Transaction result with hash
 * @throws {TransactionError} If transaction validation fails
 * 
 * @example
 * const result = await sendTransaction({
 *   from: '0x123...',
 *   to: '0x456...',
 *   amount: '1000'
 * });
 */
async function sendTransaction(transaction) {
    // Implementation
}
```

**Code Comments**
```rust
/// Implements the DAG-based consensus mechanism
/// 
/// This module provides the core consensus functionality for the KALDRIX blockchain,
/// combining DAG-based transaction ordering with Byzantine fault tolerance.
/// 
/// # Examples
/// 
/// ```rust
/// let consensus = ConsensusEngine::new(config);
/// let transactions = consensus.order_transactions(unconfirmed_txs).await?;
/// ```
pub struct ConsensusEngine {
    validators: Vec<PrimeValidator>,
    dag: Arc<RwLock<DAGCore>>,
    config: ConsensusConfig,
}

impl ConsensusEngine {
    /// Creates a new consensus engine with the given configuration
    pub fn new(config: ConsensusConfig) -> Self {
        ConsensusEngine {
            validators: Vec::new(),
            dag: Arc::new(RwLock::new(DAGCore::new(config.dag_config))),
            config,
        }
    }
    
    /// Reaches consensus on a set of unconfirmed transactions
    /// 
    /// # Arguments
    /// * `transactions` - Set of unconfirmed transactions to order
    /// 
    /// # Returns
    /// Ordered transactions ready for inclusion in the DAG
    /// 
    /// # Errors
    /// Returns an error if consensus cannot be reached
    pub async fn reach_consensus(&self, transactions: Vec<Transaction>) -> Result<Vec<Transaction>, Error> {
        // Implementation
    }
}
```

### Community Guidelines

#### 1. Code of Conduct

**Our Pledge**
We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

**Our Standards**
Examples of behavior that contributes to creating a positive environment include:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable Behavior**
Examples of unacceptable behavior include:
- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information, such as a physical or electronic address, without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

#### 2. Communication Guidelines

**GitHub Issues**
- Use descriptive titles
- Provide detailed information
- Include reproduction steps
- Be respectful and constructive
- Search existing issues before creating new ones

**Pull Request Reviews**
- Be constructive and respectful
- Focus on the code, not the person
- Provide specific feedback
- Suggest improvements
- Be patient with new contributors

**Discord/Community Channels**
- Be helpful and supportive
- Stay on topic
- Respect others' time
- Use appropriate channels
- Follow community guidelines

### Recognition and Rewards

#### 1. Contributor Recognition

**Contributor Levels**
- **Contributor**: Submitted 1+ accepted PRs
- **Active Contributor**: Submitted 5+ accepted PRs
- **Core Contributor**: Submitted 10+ accepted PRs
- **Maintainer**: Trusted contributor with merge rights

**Benefits**
- Recognition in project documentation
- Contributor badge on GitHub
- Invitation to private contributor channels
- Early access to new features
- Potential for paid contributions

#### 2. Bounty Program

**Bug Bounties**
- Critical bugs: $500 - $2000
- Major bugs: $200 - $500
- Minor bugs: $50 - $200
- Security vulnerabilities: $1000 - $5000

**Feature Bounties**
- Major features: $1000 - $5000
- Minor features: $200 - $1000
- Documentation improvements: $50 - $200

**Bounty Guidelines**
- Check bounty board for open bounties
- Submit claim with completed work
- Work will be reviewed by maintainers
- Payment upon acceptance and merge

#### 3. Grant Program

**Development Grants**
- Small grants: $1000 - $5000
- Medium grants: $5000 - $20000
- Large grants: $20000 - $100000

**Grant Categories**
- Core protocol development
- Tooling and infrastructure
- Research and development
- Community and education
- Integration and partnerships

**Application Process**
1. Submit grant proposal
2. Proposal review by committee
3. Interview and discussion
4. Approval and funding
5. Milestone-based disbursement

### Legal and Licensing

#### 1. License Agreement

**Project License**
KALDRIX is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

**Contributor License Agreement**
By contributing to the KALDRIX project, you agree that your contributions will be licensed under the MIT License.

#### 2. Intellectual Property

**Ownership**
- Contributors retain ownership of their contributions
- Project maintains license to use contributions
- All contributions must be original work
- Third-party code must be properly licensed

**Patents**
- Contributors grant patent license for their contributions
- Project does not file patents on contributed code
- Community agrees to patent non-assertion

#### 3. Compliance

**Export Compliance**
- All contributions must comply with export regulations
- No cryptographic contributions from restricted countries
- Compliance with international laws and regulations

**Security Compliance**
- Security vulnerabilities must be responsibly disclosed
- No intentional security backdoors
- Compliance with security best practices

### Getting Help

#### 1. Documentation Resources
- [Developer Documentation](https://docs.kaldrix.com)
- [API Reference](https://api.kaldrix.com)
- [Examples](https://github.com/kaldrix/kaldrix-examples)
- [Tutorials](https://docs.kaldrix.com/tutorials)

#### 2. Community Support
- [GitHub Discussions](https://github.com/kaldrix/kaldrix-blockchain/discussions)
- [Discord Server](https://discord.gg/kaldrix)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/kaldrix)
- [Reddit](https://reddit.com/r/kaldrix)

#### 3. Professional Support
- [Enterprise Support](https://kaldrix.com/enterprise)
- [Consulting Services](https://kaldrix.com/consulting)
- [Training Programs](https://kaldrix.com/training)
- [Partnership Program](https://kaldrix.com/partners)

---

Thank you for contributing to the KALDRIX blockchain project! Your contributions help make quantum-resistant blockchain technology accessible to everyone.