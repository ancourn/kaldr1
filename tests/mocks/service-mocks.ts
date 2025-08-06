import { vi } from 'vitest'
import { 
  createMockApiResponse, 
  createMockErrorResponse, 
  createMockNetworkStatus,
  createMockPerformanceMetrics,
  createMockValidators,
  createMockTransactions,
  createMockDagNodes,
  createMockDagEdges,
  createMockBundles,
  createMockBundleTimeline,
  createMockTokenInfo,
  createMockTokenHolders,
  createMockTokenTransfers,
  createErrorScenario
} from './data-factories'

// Mock fetch responses
export const mockFetch = vi.fn()

// Mock RPC service
export const mockRpcService = {
  getValidators: vi.fn().mockImplementation(async () => {
    return createMockApiResponse(createMockValidators(10))
  }),
  
  getTransactions: vi.fn().mockImplementation(async () => {
    return createMockApiResponse(createMockTransactions(20))
  }),
  
  getDagData: vi.fn().mockImplementation(async () => {
    const nodes = createMockDagNodes(15)
    const edges = createMockDagEdges(nodes, 20)
    return createMockApiResponse({ nodes, edges })
  }),
  
  getBundleStats: vi.fn().mockImplementation(async () => {
    const bundles = createMockBundles(12)
    const timeline = createMockBundleTimeline(6)
    return createMockApiResponse({ bundles, timeline })
  }),
  
  getTokenData: vi.fn().mockImplementation(async () => {
    const tokenInfo = createMockTokenInfo()
    const holders = createMockTokenHolders(10)
    const transfers = createMockTokenTransfers(15)
    return createMockApiResponse({ tokenInfo, holders, transfers })
  }),
  
  getNetworkStatus: vi.fn().mockImplementation(async () => {
    return createMockApiResponse(createMockNetworkStatus())
  }),
  
  getPerformanceMetrics: vi.fn().mockImplementation(async () => {
    return createMockApiResponse(createMockPerformanceMetrics())
  })
}

// Mock WebSocket service
export const mockWebSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  emit: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true)
}

// Mock API handlers
export const mockApiHandlers = {
  health: vi.fn().mockImplementation(async () => {
    return createMockApiResponse(createMockNetworkStatus())
  }),
  
  validators: vi.fn().mockImplementation(async () => {
    return createMockApiResponse(createMockValidators(10))
  }),
  
  transactions: vi.fn().mockImplementation(async () => {
    return createMockApiResponse(createMockTransactions(20))
  }),
  
  dag: vi.fn().mockImplementation(async () => {
    const nodes = createMockDagNodes(15)
    const edges = createMockDagEdges(nodes, 20)
    return createMockApiResponse({ nodes, edges })
  }),
  
  bundles: vi.fn().mockImplementation(async () => {
    const bundles = createMockBundles(12)
    const timeline = createMockBundleTimeline(6)
    return createMockApiResponse({ bundles, timeline })
  }),
  
  tokens: vi.fn().mockImplementation(async () => {
    const tokenInfo = createMockTokenInfo()
    const holders = createMockTokenHolders(10)
    const transfers = createMockTokenTransfers(15)
    return createMockApiResponse({ tokenInfo, holders, transfers })
  }),
  
  performance: vi.fn().mockImplementation(async () => {
    return createMockApiResponse(createMockPerformanceMetrics())
  })
}

// Error simulation utilities
export const errorSimulator = {
  simulateNetworkError: vi.fn().mockImplementation(() => {
    throw createErrorScenario('network')
  }),
  
  simulateTimeoutError: vi.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(createErrorScenario('timeout')), 100)
    })
  }),
  
  simulateValidationError: vi.fn().mockImplementation(() => {
    throw createErrorScenario('validation')
  }),
  
  simulateServerError: vi.fn().mockImplementation(() => {
    throw createErrorScenario('server')
  }),
  
  simulatePartialFailure: vi.fn().mockImplementation(() => {
    return createMockApiResponse({
      validators: createMockValidators(5),
      transactions: [],
      error: 'Partial data failure'
    })
  })
}

// Performance testing utilities
export const performanceTester = {
  measureResponseTime: vi.fn().mockImplementation(async (fn: Function) => {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    return {
      result,
      responseTime: end - start
    }
  }),
  
  simulateHighLoad: vi.fn().mockImplementation(async (requestCount: number) => {
    const requests = Array.from({ length: requestCount }, () => mockRpcService.getValidators())
    const results = await Promise.allSettled(requests)
    return {
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      successRate: (results.filter(r => r.status === 'fulfilled').length / requestCount) * 100
    }
  }),
  
  simulateMemoryStress: vi.fn().mockImplementation(async () => {
    const largeData = createMockValidators(10000)
    const largeTransactions = createMockTransactions(50000)
    return {
      validatorsProcessed: largeData.length,
      transactionsProcessed: largeTransactions.length,
      memoryUsage: process.memoryUsage()
    }
  })
}

// Data validation utilities
export const dataValidator = {
  validateValidator: vi.fn().mockImplementation((validator: any) => {
    const errors: string[] = []
    
    if (!validator.id || typeof validator.id !== 'string') {
      errors.push('Invalid validator ID')
    }
    
    if (!validator.address || !validator.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Invalid validator address')
    }
    
    if (!validator.stake || BigInt(validator.stake) < 0) {
      errors.push('Invalid stake amount')
    }
    
    if (validator.uptime < 0 || validator.uptime > 100) {
      errors.push('Invalid uptime percentage')
    }
    
    if (validator.commission < 0 || validator.commission > 100) {
      errors.push('Invalid commission rate')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }),
  
  validateTransaction: vi.fn().mockImplementation((transaction: any) => {
    const errors: string[] = []
    
    if (!transaction.id || typeof transaction.id !== 'string') {
      errors.push('Invalid transaction ID')
    }
    
    if (!transaction.hash || !transaction.hash.match(/^0x[a-fA-F0-9]{64}$/)) {
      errors.push('Invalid transaction hash')
    }
    
    if (!transaction.from || !transaction.from.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Invalid from address')
    }
    
    if (!transaction.to || !transaction.to.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Invalid to address')
    }
    
    if (!transaction.value || BigInt(transaction.value) < 0) {
      errors.push('Invalid transaction value')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }),
  
  validateDagStructure: vi.fn().mockImplementation((nodes: any[], edges: any[]) => {
    const errors: string[] = []
    
    // Check for cycles
    const adjacencyList: { [key: string]: string[] } = {}
    nodes.forEach(node => {
      adjacencyList[node.id] = []
    })
    
    edges.forEach(edge => {
      if (adjacencyList[edge.from]) {
        adjacencyList[edge.from].push(edge.to)
      }
    })
    
    const hasCycle = (nodeId: string, visited: Set<string>, recursionStack: Set<string>): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      
      for (const neighbor of adjacencyList[nodeId] || []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor, visited, recursionStack)) {
            return true
          }
        } else if (recursionStack.has(neighbor)) {
          return true
        }
      }
      
      recursionStack.delete(nodeId)
      return false
    }
    
    for (const node of nodes) {
      if (hasCycle(node.id, new Set(), new Set())) {
        errors.push('DAG contains cycles')
        break
      }
    }
    
    // Check for disconnected nodes
    const allNodeIds = new Set(nodes.map(n => n.id))
    const connectedNodes = new Set<string>()
    
    // Start from first node
    const traverse = (nodeId: string) => {
      connectedNodes.add(nodeId)
      adjacencyList[nodeId]?.forEach(neighbor => {
        if (!connectedNodes.has(neighbor)) {
          traverse(neighbor)
        }
      })
    }
    
    if (nodes.length > 0) {
      traverse(nodes[0].id)
      
      if (connectedNodes.size !== allNodeIds.size) {
        errors.push('DAG contains disconnected nodes')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  })
}

// Test scenario builders
export const testScenarioBuilder = {
  buildHappyPath: vi.fn().mockImplementation(() => {
    return {
      validators: createMockValidators(10),
      transactions: createMockTransactions(20),
      dagNodes: createMockDagNodes(15),
      dagEdges: createMockDagEdges(createMockDagNodes(15), 20),
      bundles: createMockBundles(12),
      tokenInfo: createMockTokenInfo(),
      tokenHolders: createMockTokenHolders(10),
      tokenTransfers: createMockTokenTransfers(15),
      networkStatus: createMockNetworkStatus(),
      performanceMetrics: createMockPerformanceMetrics()
    }
  }),
  
  buildErrorScenario: vi.fn().mockImplementation((errorType: string) => {
    return {
      error: createErrorScenario(errorType as any),
      validators: [],
      transactions: [],
      dagNodes: [],
      dagEdges: [],
      bundles: [],
      tokenInfo: null,
      tokenHolders: [],
      tokenTransfers: []
    }
  }),
  
  buildHighLoadScenario: vi.fn().mockImplementation(() => {
    return {
      validators: createMockValidators(100),
      transactions: createMockTransactions(500),
      dagNodes: createMockDagNodes(200),
      dagEdges: createMockDagEdges(createMockDagNodes(200), 800),
      bundles: createMockBundles(100),
      tokenInfo: createMockTokenInfo(),
      tokenHolders: createMockTokenHolders(100),
      tokenTransfers: createMockTokenTransfers(300),
      networkStatus: createMockNetworkStatus({ status: 'degraded' }),
      performanceMetrics: createMockPerformanceMetrics({ 
        tps: 1500, 
        latency: 150, 
        errorRate: 2.5 
      })
    }
  }),
  
  buildEdgeCaseScenario: vi.fn().mockImplementation((edgeCaseType: string) => {
    switch (edgeCaseType) {
      case 'empty':
        return {
          validators: [],
          transactions: [],
          dagNodes: [],
          dagEdges: [],
          bundles: [],
          tokenInfo: null,
          tokenHolders: [],
          tokenTransfers: []
        }
      case 'large':
        return {
          validators: createMockValidators(1000),
          transactions: createMockTransactions(5000),
          dagNodes: createMockDagNodes(500),
          dagEdges: createMockDagEdges(createMockDagNodes(500), 2000),
          bundles: createMockBundles(500),
          tokenInfo: createMockTokenInfo(),
          tokenHolders: createMockTokenHolders(1000),
          tokenTransfers: createMockTokenTransfers(2000)
        }
      default:
        return testScenarioBuilder.buildHappyPath()
    }
  })
}

// Setup and teardown utilities
export const testSetup = {
  beforeEach: vi.fn().mockImplementation(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    Object.values(mockRpcService).forEach(mock => mock.mockClear())
    Object.values(mockApiHandlers).forEach(mock => mock.mockClear())
    Object.values(errorSimulator).forEach(mock => mock.mockClear())
  }),
  
  afterEach: vi.fn().mockImplementation(() => {
    vi.restoreAllMocks()
  }),
  
  setupHappyPath: vi.fn().mockImplementation(() => {
    mockRpcService.getValidators.mockResolvedValue(createMockApiResponse(createMockValidators(10)))
    mockRpcService.getTransactions.mockResolvedValue(createMockApiResponse(createMockTransactions(20)))
    mockRpcService.getDagData.mockResolvedValue(createMockApiResponse({
      nodes: createMockDagNodes(15),
      edges: createMockDagEdges(createMockDagNodes(15), 20)
    }))
    mockRpcService.getBundleStats.mockResolvedValue(createMockApiResponse({
      bundles: createMockBundles(12),
      timeline: createMockBundleTimeline(6)
    }))
    mockRpcService.getTokenData.mockResolvedValue(createMockApiResponse({
      tokenInfo: createMockTokenInfo(),
      holders: createMockTokenHolders(10),
      transfers: createMockTokenTransfers(15)
    }))
  }),
  
  setupErrorScenario: vi.fn().mockImplementation((errorType: string) => {
    const error = createErrorScenario(errorType as any)
    mockRpcService.getValidators.mockRejectedValue(error)
    mockRpcService.getTransactions.mockRejectedValue(error)
    mockRpcService.getDagData.mockRejectedValue(error)
    mockRpcService.getBundleStats.mockRejectedValue(error)
    mockRpcService.getTokenData.mockRejectedValue(error)
  })
}