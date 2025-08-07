// MARK: - Common Test Wallet Data

// Sample wallet data for testing
export const testWallets = [
  {
    id: 'test-wallet-1',
    name: 'Test Wallet 1',
    address: '0x1234567890123456789012345678901234567890',
    publicKey: 'test-public-key-1',
    balance: 1000.0,
    encrypted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'test-wallet-2',
    name: 'Test Wallet 2',
    address: '0x2345678901234567890123456789012345678901',
    publicKey: 'test-public-key-2',
    balance: 2500.0,
    encrypted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'test-wallet-3',
    name: 'Test Wallet 3',
    address: '0x3456789012345678901234567890123456789012',
    publicKey: 'test-public-key-3',
    balance: 500.0,
    encrypted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample transaction data for testing
export const testTransactions = [
  {
    id: 'test-transaction-1',
    fromAddress: '0x1234567890123456789012345678901234567890',
    toAddress: '0x2345678901234567890123456789012345678901',
    amount: 100.0,
    timestamp: new Date().toISOString(),
    status: 'confirmed',
    hash: '0xabcdef1234567890abcdef1234567890abcdef12',
    gasPrice: 20.0,
    gasUsed: 21000,
    nonce: 1
  },
  {
    id: 'test-transaction-2',
    fromAddress: '0x2345678901234567890123456789012345678901',
    toAddress: '0x1234567890123456789012345678901234567890',
    amount: 250.0,
    timestamp: new Date().toISOString(),
    status: 'pending',
    hash: '0x1234567890abcdef1234567890abcdef12345678',
    gasPrice: 25.0,
    gasUsed: 21000,
    nonce: 2
  },
  {
    id: 'test-transaction-3',
    fromAddress: '0x3456789012345678901234567890123456789012',
    toAddress: '0x1234567890123456789012345678901234567890',
    amount: 50.0,
    timestamp: new Date().toISOString(),
    status: 'failed',
    hash: '0x9876543210fedcba9876543210fedcba98765432',
    gasPrice: 30.0,
    gasUsed: 0,
    nonce: 1,
    error: 'Insufficient balance'
  }
];

// Sample mnemonic phrases for testing
export const testMnemonics = [
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  'legal winner thank year wave sausage worth useful legal winner thank yellow',
  'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
  'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
  'bounce harvest option travel mirror open fan phone round effort rhythm husband'
];

// Sample private keys for testing
export const testPrivateKeys = [
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  '0x2345678901abcdef1234567890abcdef1234567890abcdef1234567890abcdef1',
  '0x3456789012abcdef1234567890abcdef1234567890abcdef1234567890abcdef2'
];

// Sample network configurations for testing
export const testNetworks = [
  {
    id: 'mainnet',
    name: 'KALDRIX Mainnet',
    rpcUrl: 'https://mainnet.kaldrix.network',
    chainId: 1,
    symbol: 'KALD',
    blockExplorer: 'https://explorer.kaldrix.network',
    isTestnet: false
  },
  {
    id: 'testnet',
    name: 'KALDRIX Testnet',
    rpcUrl: 'https://testnet.kaldrix.network',
    chainId: 2,
    symbol: 'tKALD',
    blockExplorer: 'https://testnet.explorer.kaldrix.network',
    isTestnet: true
  },
  {
    id: 'devnet',
    name: 'KALDRIX Devnet',
    rpcUrl: 'https://devnet.kaldrix.network',
    chainId: 3,
    symbol: 'dKALD',
    blockExplorer: 'https://devnet.explorer.kaldrix.network',
    isTestnet: true
  }
];

// Sample gas prices for testing
export const testGasPrices = {
  slow: 10.0,
  average: 20.0,
  fast: 30.0,
  fastest: 50.0
};

// Sample token data for testing
export const testTokens = [
  {
    id: 'kald',
    name: 'KALDRIX',
    symbol: 'KALD',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    balance: 1000.0,
    price: 1.0
  },
  {
    id: 'usdt',
    name: 'Tether USD',
    symbol: 'USDT',
    address: '0x1111111111111111111111111111111111111111',
    decimals: 6,
    balance: 500.0,
    price: 1.0
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0x2222222222222222222222222222222222222222',
    decimals: 6,
    balance: 750.0,
    price: 1.0
  }
];

// Sample NFT data for testing
export const testNFTs = [
  {
    id: 'nft-1',
    name: 'KALDRIX Genesis NFT',
    symbol: 'KGEN',
    address: '0x3333333333333333333333333333333333333333',
    tokenId: '1',
    tokenUri: 'https://api.kaldrix.network/nft/1',
    image: 'https://api.kaldrix.network/nft/1/image',
    description: 'Genesis NFT for KALDRIX network',
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Generation', value: 'Genesis' }
    ]
  },
  {
    id: 'nft-2',
    name: 'KALDRIX Developer NFT',
    symbol: 'KDEV',
    address: '0x4444444444444444444444444444444444444444',
    tokenId: '1',
    tokenUri: 'https://api.kaldrix.network/nft/2',
    image: 'https://api.kaldrix.network/nft/2/image',
    description: 'Developer NFT for KALDRIX network',
    attributes: [
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Type', value: 'Developer' }
    ]
  }
];

// Sample DeFi positions for testing
export const testDefiPositions = [
  {
    id: 'defi-1',
    protocol: 'KALDRIX Swap',
    type: 'liquidity',
    poolAddress: '0x5555555555555555555555555555555555555555',
    token0: testTokens[0],
    token1: testTokens[1],
    balance0: 100.0,
    balance1: 500.0,
    share: 0.01,
    value: 600.0,
    apr: 15.5
  },
  {
    id: 'defi-2',
    protocol: 'KALDRIX Lend',
    type: 'lending',
    marketAddress: '0x6666666666666666666666666666666666666666',
    token: testTokens[1],
    supplied: 1000.0,
    borrowed: 0.0,
    apy: 8.5,
    collateralFactor: 0.75
  }
];

// Sample staking positions for testing
export const testStakingPositions = [
  {
    id: 'stake-1',
    validator: 'KALDRIX Validator 1',
    validatorAddress: '0x7777777777777777777777777777777777777777',
    amount: 1000.0,
    rewards: 50.0,
    apr: 12.5,
    status: 'active',
    startTime: new Date().toISOString()
  },
  {
    id: 'stake-2',
    validator: 'KALDRIX Validator 2',
    validatorAddress: '0x8888888888888888888888888888888888888888',
    amount: 500.0,
    rewards: 25.0,
    apr: 11.8,
    status: 'active',
    startTime: new Date().toISOString()
  }
];

// Sample governance data for testing
export const testGovernance = [
  {
    id: 'proposal-1',
    title: 'Protocol Upgrade Proposal',
    description: 'Proposal to upgrade the KALDRIX protocol to version 2.0',
    proposer: '0x1234567890123456789012345678901234567890',
    status: 'active',
    forVotes: 10000.0,
    againstVotes: 2000.0,
    abstainVotes: 500.0,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    quorum: 5000.0
  },
  {
    id: 'proposal-2',
    title: 'Treasury Allocation',
    description: 'Proposal to allocate treasury funds for ecosystem development',
    proposer: '0x2345678901234567890123456789012345678901',
    status: 'pending',
    forVotes: 0.0,
    againstVotes: 0.0,
    abstainVotes: 0.0,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    quorum: 10000.0
  }
];

// Sample analytics data for testing
export const testAnalytics = {
  walletStats: {
    totalWallets: 3,
    totalBalance: 4000.0,
    totalTransactions: 3,
    averageTransactionValue: 133.33,
    mostActiveWallet: 'test-wallet-2'
  },
  networkStats: {
    currentBlock: 12345678,
    gasPrice: 20.0,
    networkHashrate: 1000000.0,
    difficulty: 500000.0,
    blockTime: 15.0
  },
  tokenStats: {
    totalSupply: 1000000000.0,
    circulatingSupply: 500000000.0,
    marketCap: 500000000.0,
    price: 1.0,
    priceChange24h: 5.5,
    volume24h: 1000000.0
  }
};

// Sample error scenarios for testing
export const testErrors = [
  {
    name: 'Insufficient Balance',
    code: 'INSUFFICIENT_BALANCE',
    message: 'Insufficient balance for transaction',
    details: { required: 1000.0, available: 500.0 }
  },
  {
    name: 'Invalid Address',
    code: 'INVALID_ADDRESS',
    message: 'Invalid wallet address',
    details: { address: 'invalid-address' }
  },
  {
    name: 'Network Error',
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    details: { url: 'https://api.kaldrix.network', status: 500 }
  },
  {
    name: 'Invalid Mnemonic',
    code: 'INVALID_MNEMONIC',
    message: 'Invalid mnemonic phrase',
    details: { mnemonic: 'invalid mnemonic phrase' }
  },
  {
    name: 'Transaction Failed',
    code: 'TRANSACTION_FAILED',
    message: 'Transaction execution failed',
    details: { hash: '0x1234567890abcdef1234567890abcdef12345678', reason: 'Out of gas' }
  }
];

// Sample performance metrics for testing
export const testPerformanceMetrics = {
  startupTime: 1500, // milliseconds
  memoryUsage: 50, // MB
  cpuUsage: 25, // percentage
  networkLatency: 100, // milliseconds
  transactionSpeed: 5000, // transactions per second
  syncTime: 30000, // milliseconds
  encryptionTime: 100, // milliseconds
  decryptionTime: 150 // milliseconds
};

// Sample configuration for testing
export const testConfig = {
  network: 'testnet',
  gasLimit: 21000,
  gasPrice: 'auto',
  timeout: 30000,
  maxRetries: 3,
  confirmations: 1,
  currency: 'USD',
  language: 'en',
  theme: 'light',
  notifications: true,
  biometrics: true,
  autoLock: 300 // seconds
};

// Export all test fixtures
export default {
  wallets: testWallets,
  transactions: testTransactions,
  mnemonics: testMnemonics,
  privateKeys: testPrivateKeys,
  networks: testNetworks,
  gasPrices: testGasPrices,
  tokens: testTokens,
  nfts: testNFTs,
  defiPositions: testDefiPositions,
  stakingPositions: testStakingPositions,
  governance: testGovernance,
  analytics: testAnalytics,
  errors: testErrors,
  performanceMetrics: testPerformanceMetrics,
  config: testConfig
};