// MARK: - Test Helper Functions

import { testWallets, testTransactions, testMnemonics, testNetworks } from './fixtures/testData';

// MARK: - Wallet Test Helpers

/**
 * Creates a test wallet with specified parameters
 */
export function createTestWallet(overrides = {}) {
  const defaultWallet = {
    id: `test-wallet-${Date.now()}`,
    name: 'Test Wallet',
    address: generateTestAddress(),
    publicKey: generateTestPublicKey(),
    balance: 1000.0,
    encrypted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return { ...defaultWallet, ...overrides };
}

/**
 * Creates multiple test wallets
 */
export function createTestWallets(count: number, overrides = {}) {
  return Array.from({ length: count }, (_, index) => 
    createTestWallet({
      ...overrides,
      id: `test-wallet-${index}`,
      name: `Test Wallet ${index + 1}`
    })
  );
}

/**
 * Generates a random test address
 */
export function generateTestAddress() {
  return '0x' + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generates a random test public key
 */
export function generateTestPublicKey() {
  return '0x' + Array.from({ length: 66 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Validates a wallet address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates a public key format
 */
export function isValidPublicKey(publicKey: string): boolean {
  return /^0x[a-fA-F0-9]{66}$/.test(publicKey);
}

// MARK: - Transaction Test Helpers

/**
 * Creates a test transaction with specified parameters
 */
export function createTestTransaction(overrides = {}) {
  const defaultTransaction = {
    id: `test-transaction-${Date.now()}`,
    fromAddress: generateTestAddress(),
    toAddress: generateTestAddress(),
    amount: Math.random() * 1000,
    timestamp: new Date().toISOString(),
    status: 'pending',
    hash: generateTestHash(),
    gasPrice: 20.0,
    gasUsed: 21000,
    nonce: Math.floor(Math.random() * 1000)
  };
  
  return { ...defaultTransaction, ...overrides };
}

/**
 * Creates multiple test transactions
 */
export function createTestTransactions(count: number, overrides = {}) {
  return Array.from({ length: count }, (_, index) => 
    createTestTransaction({
      ...overrides,
      id: `test-transaction-${index}`,
      nonce: index
    })
  );
}

/**
 * Generates a random test transaction hash
 */
export function generateTestHash() {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Validates a transaction hash format
 */
export function isValidHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Calculates total amount from transactions
 */
export function calculateTotalAmount(transactions: any[], address: string): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.fromAddress === address) {
      return total - transaction.amount;
    } else if (transaction.toAddress === address) {
      return total + transaction.amount;
    }
    return total;
  }, 0);
}

// MARK: - Network Test Helpers

/**
 * Gets a test network by ID
 */
export function getTestNetwork(networkId: string) {
  return testNetworks.find(network => network.id === networkId);
}

/**
 * Creates a test network configuration
 */
export function createTestNetwork(overrides = {}) {
  const defaultNetwork = {
    id: `test-network-${Date.now()}`,
    name: 'Test Network',
    rpcUrl: 'https://test.kaldrix.network',
    chainId: Math.floor(Math.random() * 1000000),
    symbol: 'TEST',
    blockExplorer: 'https://test.explorer.kaldrix.network',
    isTestnet: true
  };
  
  return { ...defaultNetwork, ...overrides };
}

/**
 * Validates network configuration
 */
export function isValidNetwork(network: any): boolean {
  return (
    network.id &&
    network.name &&
    network.rpcUrl &&
    network.chainId &&
    network.symbol &&
    typeof network.isTestnet === 'boolean'
  );
}

// MARK: - Mnemonic Test Helpers

/**
 * Gets a random test mnemonic
 */
export function getRandomTestMnemonic(): string {
  return testMnemonics[Math.floor(Math.random() * testMnemonics.length)];
}

/**
 * Validates a mnemonic phrase
 */
export function isValidMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/);
  return words.length === 12 || words.length === 24;
}

/**
 * Generates a random mnemonic for testing
 */
export function generateTestMnemonic(wordCount: number = 12): string {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
    'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
    'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
    'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'agent', 'agree',
    'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien',
    'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always',
    'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
    'angry', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area',
    'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive',
    'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist',
    'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
    'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware',
    'away', 'awesome', 'awful', 'awkward', 'axis'
  ];
  
  const mnemonicWords = [];
  for (let i = 0; i < wordCount; i++) {
    mnemonicWords.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return mnemonicWords.join(' ');
}

// MARK: - Performance Test Helpers

/**
 * Measures execution time of a function
 */
export function measureExecutionTime(fn: Function): { result: any, time: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  return {
    result,
    time: end - start
  };
}

/**
 * Measures memory usage of a function
 */
export function measureMemoryUsage(fn: Function): { result: any, memory: number } {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const before = process.memoryUsage().heapUsed;
    const result = fn();
    const after = process.memoryUsage().heapUsed;
    
    return {
      result,
      memory: after - before
    };
  }
  
  // Browser fallback
  const result = fn();
  return {
    result,
    memory: 0 // Not available in browser
  };
}

/**
 * Runs a function multiple times and returns average execution time
 */
export function benchmarkFunction(fn: Function, iterations: number = 100): { averageTime: number, totalTime: number } {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const { time } = measureExecutionTime(fn);
    times.push(time);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  
  return {
    averageTime,
    totalTime
  };
}

/**
 * Creates a performance test report
 */
export function createPerformanceReport(tests: Array<{ name: string, time: number, memory?: number }>) {
  return {
    timestamp: new Date().toISOString(),
    tests,
    summary: {
      totalTime: tests.reduce((sum, test) => sum + test.time, 0),
      averageTime: tests.reduce((sum, test) => sum + test.time, 0) / tests.length,
      slowestTest: tests.reduce((slowest, test) => test.time > slowest.time ? test : slowest, tests[0]),
      fastestTest: tests.reduce((fastest, test) => test.time < fastest.time ? test : fastest, tests[0])
    }
  };
}

// MARK: - Async Test Helpers

/**
 * Creates a delay for testing async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Waits for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await delay(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Runs multiple async operations in parallel
 */
export async function runInParallel<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
  return Promise.all(operations.map(op => op()));
}

/**
 * Runs async operations with concurrency limit
 */
export async function runWithConcurrency<T>(
  operations: Array<() => Promise<T>>,
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = [];
  const executing = new Set<Promise<T>>();
  
  for (const operation of operations) {
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
    
    const promise = operation().then(result => {
      executing.delete(promise);
      return result;
    });
    
    executing.add(promise);
    results.push(promise);
  }
  
  return Promise.all(results);
}

// MARK: - Mock Data Helpers

/**
 * Creates a mock blockchain service
 */
export function createMockBlockchainService() {
  return {
    async getBalance(address: string) {
      return Math.random() * 10000;
    },
    
    async sendTransaction(transaction: any) {
      return {
        ...transaction,
        status: 'confirmed',
        hash: generateTestHash()
      };
    },
    
    async getTransactionHistory(address: string) {
      return createTestTransactions(Math.floor(Math.random() * 10) + 1);
    },
    
    async getTransaction(transactionId: string) {
      return createTestTransaction({ id: transactionId });
    }
  };
}

/**
 * Creates a mock network service
 */
export function createMockNetworkService() {
  return {
    isConnected: true,
    
    async request(endpoint: string, options: any = {}) {
      if (endpoint.includes('balance')) {
        return { balance: Math.random() * 10000 };
      }
      
      if (endpoint.includes('transaction')) {
        return {
          id: generateTestHash(),
          status: 'confirmed',
          hash: generateTestHash()
        };
      }
      
      throw new Error('Unknown endpoint');
    }
  };
}

/**
 * Creates a mock storage service
 */
export function createMockStorageService() {
  const storage = new Map();
  
  return {
    async set(key: string, value: any) {
      storage.set(key, JSON.stringify(value));
    },
    
    async get(key: string) {
      const value = storage.get(key);
      return value ? JSON.parse(value) : null;
    },
    
    async delete(key: string) {
      storage.delete(key);
    },
    
    async clear() {
      storage.clear();
    },
    
    async keys() {
      return Array.from(storage.keys());
    }
  };
}

// MARK: - Test Assertion Helpers

/**
 * Asserts that a value is within a range
 */
export function assertInRange(value: number, min: number, max: number, message?: string) {
  if (value < min || value > max) {
    throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
  }
}

/**
 * Asserts that a value is approximately equal to another
 */
export function assertApproximatelyEqual(actual: number, expected: number, tolerance: number = 0.01, message?: string) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(message || `Expected ${actual} to be approximately ${expected} (tolerance: ${tolerance})`);
  }
}

/**
 * Asserts that an array contains all expected items
 */
export function assertContainsAll<T>(array: T[], expectedItems: T[], message?: string) {
  const missingItems = expectedItems.filter(item => !array.includes(item));
  if (missingItems.length > 0) {
    throw new Error(message || `Array is missing items: ${missingItems.join(', ')}`);
  }
}

/**
 * Asserts that an object has all expected properties
 */
export function assertHasProperties(obj: any, properties: string[], message?: string) {
  const missingProperties = properties.filter(prop => !(prop in obj));
  if (missingProperties.length > 0) {
    throw new Error(message || `Object is missing properties: ${missingProperties.join(', ')}`);
  }
}

/**
 * Asserts that a function throws an error
 */
export async function assertThrowsAsync(fn: () => Promise<any>, errorType?: any, message?: string) {
  try {
    await fn();
    throw new Error(message || 'Expected function to throw an error');
  } catch (error) {
    if (errorType && !(error instanceof errorType)) {
      throw new Error(`Expected error to be instance of ${errorType.name}, but got ${error.constructor.name}`);
    }
  }
}

// MARK: - Test Data Generation Helpers

/**
 * Generates random test data
 */
export function generateTestData(type: string, count: number = 1) {
  switch (type) {
    case 'wallets':
      return createTestWallets(count);
    case 'transactions':
      return createTestTransactions(count);
    case 'addresses':
      return Array.from({ length: count }, () => generateTestAddress());
    case 'hashes':
      return Array.from({ length: count }, () => generateTestHash());
    case 'mnemonics':
      return Array.from({ length: count }, () => generateTestMnemonic());
    default:
      throw new Error(`Unknown test data type: ${type}`);
  }
}

/**
 * Shuffles an array randomly
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates a deep copy of an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Export all helper functions
export default {
  // Wallet helpers
  createTestWallet,
  createTestWallets,
  generateTestAddress,
  generateTestPublicKey,
  isValidAddress,
  isValidPublicKey,
  
  // Transaction helpers
  createTestTransaction,
  createTestTransactions,
  generateTestHash,
  isValidHash,
  calculateTotalAmount,
  
  // Network helpers
  getTestNetwork,
  createTestNetwork,
  isValidNetwork,
  
  // Mnemonic helpers
  getRandomTestMnemonic,
  isValidMnemonic,
  generateTestMnemonic,
  
  // Performance helpers
  measureExecutionTime,
  measureMemoryUsage,
  benchmarkFunction,
  createPerformanceReport,
  
  // Async helpers
  delay,
  waitForCondition,
  runInParallel,
  runWithConcurrency,
  
  // Mock helpers
  createMockBlockchainService,
  createMockNetworkService,
  createMockStorageService,
  
  // Assertion helpers
  assertInRange,
  assertApproximatelyEqual,
  assertContainsAll,
  assertHasProperties,
  assertThrowsAsync,
  
  // Data generation helpers
  generateTestData,
  shuffleArray,
  deepClone
};