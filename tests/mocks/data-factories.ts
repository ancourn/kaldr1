import { faker } from '@faker-js/faker'

// Validator data factory
export function createMockValidator(overrides: Partial<any> = {}) {
  return {
    id: `val_${faker.string.uuid()}`,
    address: faker.finance.ethereumAddress(),
    stake: faker.finance.amount({ min: 100000000000000000000, max: 5000000000000000000000, precision: 0 }),
    rewards: faker.finance.amount({ min: 10000000000000000000, max: 500000000000000000000, precision: 0 }),
    uptime: faker.number.float({ min: 95, max: 100, precision: 1 }),
    status: faker.helpers.arrayElement(['active', 'inactive', 'slashed']),
    lastSeen: faker.date.recent().toISOString(),
    commission: faker.number.int({ min: 1, max: 20 }),
    delegations: faker.number.int({ min: 1, max: 100 }),
    ...overrides
  }
}

export function createMockValidators(count: number = 10) {
  return Array.from({ length: count }, () => createMockValidator())
}

// Transaction data factory
export function createMockTransaction(overrides: Partial<any> = {}) {
  return {
    id: `tx_${faker.string.uuid()}`,
    hash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
    from: faker.finance.ethereumAddress(),
    to: faker.finance.ethereumAddress(),
    value: faker.finance.amount({ min: 1000000000000000000, max: 1000000000000000000000, precision: 0 }),
    gasPrice: faker.finance.amount({ min: 10000000000, max: 50000000000, precision: 0 }),
    gasUsed: faker.finance.amount({ min: 21000, max: 1000000, precision: 0 }),
    gasLimit: faker.finance.amount({ min: 25000, max: 1500000, precision: 0 }),
    nonce: faker.number.int({ min: 1, max: 10000 }),
    blockNumber: faker.number.int({ min: 15000, max: 20000 }),
    timestamp: faker.date.recent().toISOString(),
    status: faker.helpers.arrayElement(['pending', 'confirmed', 'failed', 'packed']),
    type: faker.helpers.arrayElement(['transfer', 'contract', 'stake', 'unstake', 'reward']),
    fee: faker.finance.amount({ min: 100000000000000, max: 10000000000000000, precision: 0 }),
    ...overrides
  }
}

export function createMockTransactions(count: number = 20) {
  return Array.from({ length: count }, () => createMockTransaction())
}

// DAG Node data factory
export function createMockDagNode(overrides: Partial<any> = {}) {
  const height = faker.number.int({ min: 1, max: 10 })
  const parentCount = height === 1 ? 0 : faker.number.int({ min: 1, max: 3 })
  
  return {
    id: `node_${faker.string.uuid()}`,
    hash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
    parentHashes: Array.from({ length: parentCount }, () => 
      faker.string.hexadecimal({ length: 64, prefix: '0x' })
    ),
    timestamp: faker.date.recent().toISOString(),
    height,
    transactions: faker.number.int({ min: 10, max: 100 }),
    size: faker.number.int({ min: 50000, max: 500000 }),
    status: faker.helpers.arrayElement(['confirmed', 'pending', 'orphaned']),
    validator: faker.finance.ethereumAddress(),
    gasUsed: faker.finance.amount({ min: 100000000, max: 2000000000, precision: 0 }),
    gasLimit: faker.finance.amount({ min: 150000000, max: 2500000000, precision: 0 }),
    ...overrides
  }
}

export function createMockDagNodes(count: number = 15) {
  return Array.from({ length: count }, () => createMockDagNode())
}

// DAG Edge data factory
export function createMockDagEdge(nodes: any[], overrides: Partial<any> = {}) {
  const fromNode = faker.helpers.arrayElement(nodes)
  const toNode = faker.helpers.arrayElement(nodes.filter(n => n.id !== fromNode.id))
  
  return {
    from: fromNode.id,
    to: toNode.id,
    weight: faker.number.float({ min: 0.1, max: 1, precision: 2 }),
    ...overrides
  }
}

export function createMockDagEdges(nodes: any[], count: number = 20) {
  return Array.from({ length: count }, () => createMockDagEdge(nodes))
}

// Bundle data factory
export function createMockBundle(overrides: Partial<any> = {}) {
  return {
    id: `bundle_${faker.string.uuid()}`,
    bundleHash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
    timestamp: faker.date.recent().toISOString(),
    blockNumber: faker.number.int({ min: 15000, max: 20000 }),
    transactionCount: faker.number.int({ min: 10, max: 100 }),
    totalValue: faker.finance.amount({ min: 100000000000000000000, max: 10000000000000000000000, precision: 0 }),
    totalGasUsed: faker.finance.amount({ min: 100000000, max: 2000000000, precision: 0 }),
    averageGasPrice: faker.finance.amount({ min: 10000000000, max: 50000000000, precision: 0 }),
    bundleSize: faker.number.int({ min: 50000, max: 500000 }),
    status: faker.helpers.arrayElement(['pending', 'confirmed', 'failed']),
    validator: faker.finance.ethereumAddress(),
    confirmations: faker.number.int({ min: 0, max: 20 }),
    fees: faker.finance.amount({ min: 0, max: 100000000000000000, precision: 0 }),
    ...overrides
  }
}

export function createMockBundles(count: number = 12) {
  return Array.from({ length: count }, () => createMockBundle())
}

// Bundle Timeline data factory
export function createMockBundleTimeline(overrides: Partial<any> = {}) {
  return {
    timestamp: faker.date.recent().toISOString(),
    bundleCount: faker.number.int({ min: 1, max: 10 }),
    transactionCount: faker.number.int({ min: 50, max: 500 }),
    totalValue: faker.finance.amount({ min: 1000000000000000000000, max: 100000000000000000000000, precision: 0 }),
    averageGasPrice: faker.finance.amount({ min: 10000000000, max: 50000000000, precision: 0 }),
    ...overrides
  }
}

export function createMockBundleTimeline(count: number = 6) {
  return Array.from({ length: count }, () => createMockBundleTimeline())
}

// Token Info data factory
export function createMockTokenInfo(overrides: Partial<any> = {}) {
  return {
    symbol: faker.finance.currencyCode(),
    name: faker.company.name(),
    address: faker.finance.ethereumAddress(),
    decimals: faker.number.int({ min: 6, max: 18 }),
    totalSupply: faker.finance.amount({ min: 1000000000000000000000000, max: 10000000000000000000000000000, precision: 0 }),
    circulatingSupply: faker.finance.amount({ min: 100000000000000000000000, max: 10000000000000000000000000000, precision: 0 }),
    burnedSupply: faker.finance.amount({ min: 0, max: 1000000000000000000000000, precision: 0 }),
    stakedSupply: faker.finance.amount({ min: 0, max: 10000000000000000000000000000, precision: 0 }),
    price: {
      usd: faker.number.float({ min: 0.01, max: 1000, precision: 2 }),
      change24h: faker.number.float({ min: -20, max: 20, precision: 1 }),
      change7d: faker.number.float({ min: -50, max: 50, precision: 1 }),
      marketCap: faker.number.float({ min: 1000000, max: 10000000000, precision: 0 }),
      volume24h: faker.number.float({ min: 100000, max: 1000000000, precision: 0 })
    },
    holders: faker.number.int({ min: 1000, max: 100000 }),
    transfers24h: faker.number.int({ min: 100, max: 10000 }),
    ...overrides
  }
}

// Token Holder data factory
export function createMockTokenHolder(overrides: Partial<any> = {}) {
  return {
    address: faker.finance.ethereumAddress(),
    balance: faker.finance.amount({ min: 1000000000000000000, max: 1000000000000000000000000, precision: 0 }),
    percentage: faker.number.float({ min: 0.1, max: 20, precision: 1 }),
    type: faker.helpers.arrayElement(['validator', 'exchange', 'wallet', 'contract']),
    ...overrides
  }
}

export function createMockTokenHolders(count: number = 10) {
  return Array.from({ length: count }, () => createMockTokenHolder())
}

// Token Transfer data factory
export function createMockTokenTransfer(overrides: Partial<any> = {}) {
  return {
    id: `transfer_${faker.string.uuid()}`,
    hash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
    from: faker.finance.ethereumAddress(),
    to: faker.finance.ethereumAddress(),
    value: faker.finance.amount({ min: 1000000000000000000, max: 10000000000000000000000, precision: 0 }),
    timestamp: faker.date.recent().toISOString(),
    type: faker.helpers.arrayElement(['transfer', 'mint', 'burn', 'stake', 'unstake']),
    ...overrides
  }
}

export function createMockTokenTransfers(count: number = 15) {
  return Array.from({ length: count }, () => createMockTokenTransfer())
}

// API Response factory
export function createMockApiResponse<T>(data: T, overrides: Partial<any> = {}) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...overrides
  }
}

export function createMockErrorResponse(message: string, statusCode: number = 400) {
  return {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  }
}

// Network Status factory
export function createMockNetworkStatus(overrides: Partial<any> = {}) {
  return {
    status: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy']),
    uptime: faker.number.float({ min: 0, max: 100, precision: 1 }),
    version: `1.0.${faker.number.int({ min: 0, max: 9 })}`,
    timestamp: new Date().toISOString(),
    services: {
      blockchain: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy']),
      quantum: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy']),
      network: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy']),
      database: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy'])
    },
    metrics: {
      tps: faker.number.float({ min: 10, max: 2000, precision: 1 }),
      latency: faker.number.float({ min: 10, max: 500, precision: 0 }),
      node_count: faker.number.int({ min: 100, max: 5000 }),
      quantum_security_score: faker.number.float({ min: 70, max: 100, precision: 0 })
    },
    ...overrides
  }
}

// Error scenarios factory
export function createErrorScenario(type: 'network' | 'timeout' | 'validation' | 'server') {
  switch (type) {
    case 'network':
      return new Error('Network error: Unable to connect to server')
    case 'timeout':
      return new Error('Request timeout: Server did not respond in time')
    case 'validation':
      return new Error('Validation error: Invalid input parameters')
    case 'server':
      return new Error('Server error: Internal server error')
    default:
      return new Error('Unknown error occurred')
  }
}

// Performance metrics factory
export function createMockPerformanceMetrics(overrides: Partial<any> = {}) {
  return {
    tps: faker.number.float({ min: 50, max: 2000, precision: 1 }),
    latency: faker.number.float({ min: 10, max: 200, precision: 0 }),
    throughput: faker.number.float({ min: 1000, max: 10000, precision: 0 }),
    errorRate: faker.number.float({ min: 0, max: 5, precision: 2 }),
    memoryUsage: faker.number.float({ min: 50, max: 90, precision: 1 }),
    cpuUsage: faker.number.float({ min: 10, max: 80, precision: 1 }),
    timestamp: new Date().toISOString(),
    ...overrides
  }
}

// Test data generators for edge cases
export function createEdgeCaseData(type: 'empty' | 'large' | 'invalid' | 'extreme') {
  switch (type) {
    case 'empty':
      return {
        validators: [],
        transactions: [],
        nodes: [],
        edges: [],
        bundles: [],
        tokenInfo: null,
        holders: [],
        transfers: []
      }
    case 'large':
      return {
        validators: createMockValidators(1000),
        transactions: createMockTransactions(5000),
        nodes: createMockDagNodes(500),
        edges: createMockDagEdges(createMockDagNodes(500), 2000),
        bundles: createMockBundles(500),
        tokenInfo: createMockTokenInfo(),
        holders: createMockTokenHolders(1000),
        transfers: createMockTokenTransfers(2000)
      }
    case 'invalid':
      return {
        validators: [createMockValidator({ uptime: 150, commission: -5 })],
        transactions: [createMockTransaction({ gasUsed: -1 })],
        nodes: [createMockDagNode({ height: -1 })],
        edges: [{ from: '', to: '', weight: -1 }],
        bundles: [createMockBundle({ transactionCount: -1 })],
        tokenInfo: createMockTokenInfo({ decimals: -1 }),
        holders: [createMockTokenHolder({ percentage: -10 })],
        transfers: [createMockTokenTransfer({ value: '-1' })]
      }
    case 'extreme':
      return {
        validators: [createMockValidator({ stake: '0', rewards: '0', uptime: 0, commission: 100 })],
        transactions: [createMockTransaction({ value: '0', gasPrice: '0', gasUsed: '0' })],
        nodes: [createMockDagNode({ transactions: 0, size: 0 })],
        edges: [{ from: 'node_1', to: 'node_2', weight: 0 }],
        bundles: [createMockBundle({ transactionCount: 0, totalValue: '0', fees: '0' })],
        tokenInfo: createMockTokenInfo({ totalSupply: '0', price: { usd: 0, change24h: -100, change7d: -100 } }),
        holders: [createMockTokenHolder({ balance: '0', percentage: 0 })],
        transfers: [createMockTokenTransfer({ value: '0' })]
      }
    default:
      return {}
  }
}