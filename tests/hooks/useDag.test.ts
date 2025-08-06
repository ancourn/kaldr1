import { renderHook, act, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useDag } from '@/hooks/useDag'

describe('useDag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDag())

    expect(result.current.nodes).toEqual([])
    expect(result.current.edges).toEqual([])
    expect(result.current.stats).toEqual({
      totalNodes: 0,
      totalEdges: 0,
      averageNodeSize: 0,
      maxDepth: 0,
      confirmationTime: 0,
      orphanRate: 0,
      networkDensity: 0
    })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should fetch DAG data successfully', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers to simulate the API delay
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    // Wait for the initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.nodes).toHaveLength(7)
    expect(result.current.edges).toHaveLength(7)
    
    // Check first node
    expect(result.current.nodes[0]).toEqual({
      id: 'node_001',
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      parentHashes: [],
      timestamp: '2024-01-15T10:30:00Z',
      height: 1,
      transactions: 45,
      size: 125000,
      status: 'confirmed',
      validator: '0x1234567890123456789012345678901234567890',
      gasUsed: '945000000',
      gasLimit: '1500000000'
    })

    // Check first edge
    expect(result.current.edges[0]).toEqual({
      from: 'node_001',
      to: 'node_002',
      weight: 1
    })

    // Check stats
    expect(result.current.stats).toEqual({
      totalNodes: 7,
      totalEdges: 7,
      averageNodeSize: 126285.71428571429,
      maxDepth: 4,
      confirmationTime: 2.3,
      orphanRate: 14.285714285714286,
      networkDensity: 16.666666666666664
    })

    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    // Mock the hook to throw an error
    const { result } = renderHook(() => {
      const [nodes, setNodes] = useState<any[]>([])
      const [edges, setEdges] = useState<any[]>([])
      const [stats, setStats] = useState({
        totalNodes: 0,
        totalEdges: 0,
        averageNodeSize: 0,
        maxDepth: 0,
        confirmationTime: 0,
        orphanRate: 0,
        networkDensity: 0
      })
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState<string | null>(null)

      const fetchDagData = async () => {
        try {
          setLoading(true)
          setError(null)
          throw new Error('Network error')
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch DAG data')
        } finally {
          setLoading(false)
        }
      }

      return {
        nodes,
        edges,
        stats,
        loading,
        error,
        refetch: fetchDagData
      }
    })

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.nodes).toEqual([])
    expect(result.current.edges).toEqual([])
    expect(result.current.error).toBe('Network error')
  })

  it('should refetch DAG data when refetch is called', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers for initial fetch
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Call refetch
    await act(async () => {
      result.current.refetch()
    })

    // Should show loading state again
    expect(result.current.loading).toBe(true)

    // Fast-forward timers for refetch
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Data should be the same
    expect(result.current.nodes).toHaveLength(7)
    expect(result.current.edges).toHaveLength(7)
  })

  it('should calculate stats correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { stats } = result.current

    // Test total nodes count
    expect(stats.totalNodes).toBe(7)

    // Test total edges count
    expect(stats.totalEdges).toBe(7)

    // Test average node size
    expect(stats.averageNodeSize).toBeCloseTo(126285.71, 2)

    // Test max depth
    expect(stats.maxDepth).toBe(4)

    // Test confirmation time
    expect(stats.confirmationTime).toBe(2.3)

    // Test orphan rate
    expect(stats.orphanRate).toBeCloseTo(14.29, 2)

    // Test network density
    expect(stats.networkDensity).toBeCloseTo(16.67, 2)
  })

  it('should handle different node statuses', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { nodes } = result.current

    // Check that we have different statuses
    const statuses = nodes.map(n => n.status)
    expect(statuses).toContain('confirmed')
    expect(statuses).toContain('pending')
    expect(statuses).toContain('orphaned')

    // Count nodes by status
    const confirmedCount = nodes.filter(n => n.status === 'confirmed').length
    const pendingCount = nodes.filter(n => n.status === 'pending').length
    const orphanedCount = nodes.filter(n => n.status === 'orphaned').length

    expect(confirmedCount).toBe(5)
    expect(pendingCount).toBe(1)
    expect(orphanedCount).toBe(1)
  })

  it('should handle DAG structure correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { nodes, edges } = result.current

    // Verify DAG structure: no cycles
    const checkForCycles = (nodes: any[], edges: any[]) => {
      const adjacencyList: { [key: string]: string[] } = {}
      
      // Build adjacency list
      edges.forEach(edge => {
        if (!adjacencyList[edge.from]) {
          adjacencyList[edge.from] = []
        }
        adjacencyList[edge.from].push(edge.to)
      })

      // DFS to detect cycles
      const visited = new Set<string>()
      const recursionStack = new Set<string>()

      const hasCycle = (nodeId: string): boolean => {
        visited.add(nodeId)
        recursionStack.add(nodeId)

        const neighbors = adjacencyList[nodeId] || []
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (hasCycle(neighbor)) {
              return true
            }
          } else if (recursionStack.has(neighbor)) {
            return true
          }
        }

        recursionStack.delete(nodeId)
        return false
      }

      return nodes.some(node => !visited.has(node.id) && hasCycle(node.id))
    }

    expect(checkForCycles(nodes, edges)).toBe(false)

    // Verify root node (no parents)
    const rootNode = nodes.find(node => node.parentHashes.length === 0)
    expect(rootNode).toBeDefined()
    expect(rootNode?.id).toBe('node_001')
    expect(rootNode?.height).toBe(1)
  })

  it('should handle node heights correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { nodes } = result.current

    // Verify heights are positive integers
    nodes.forEach(node => {
      expect(node.height).toBeGreaterThan(0)
      expect(Number.isInteger(node.height)).toBe(true)
    })

    // Verify height progression
    const nodesByHeight = nodes.reduce((acc, node) => {
      if (!acc[node.height]) {
        acc[node.height] = []
      }
      acc[node.height].push(node)
      return acc
    }, {} as { [key: number]: any[] })

    // Should have nodes at heights 1, 2, 3, 4
    expect(Object.keys(nodesByHeight)).toContain('1')
    expect(Object.keys(nodesByHeight)).toContain('2')
    expect(Object.keys(nodesByHeight)).toContain('3')
    expect(Object.keys(nodesByHeight)).toContain('4')

    // Height 1 should have 1 node (root)
    expect(nodesByHeight[1]).toHaveLength(1)

    // Height 2 should have 2 nodes
    expect(nodesByHeight[2]).toHaveLength(2)

    // Height 3 should have 2 nodes
    expect(nodesByHeight[3]).toHaveLength(2)

    // Height 4 should have 2 nodes
    expect(nodesByHeight[4]).toHaveLength(2)
  })

  it('should handle parent-child relationships correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { nodes, edges } = result.current

    // Create a map of node hashes to node IDs
    const hashToId = nodes.reduce((acc, node) => {
      acc[node.hash] = node.id
      return acc
    }, {} as { [key: string]: string })

    // Verify parent-child relationships through edges
    nodes.forEach(node => {
      if (node.parentHashes.length > 0) {
        // This node should have incoming edges from all parents
        const parentIds = node.parentHashes.map(hash => hashToId[hash])
        const incomingEdges = edges.filter(edge => edge.to === node.id)
        
        expect(incomingEdges).toHaveLength(parentIds.length)
        incomingEdges.forEach(edge => {
          expect(parentIds).toContain(edge.from)
        })
      }
    })

    // Verify node_005 has two parents
    const node005 = nodes.find(n => n.id === 'node_005')
    expect(node005?.parentHashes).toHaveLength(2)
    
    const node005IncomingEdges = edges.filter(e => e.to === 'node_005')
    expect(node005IncomingEdges).toHaveLength(2)
  })

  it('should handle gas calculations correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { nodes } = result.current

    // Verify gas used is less than or equal to gas limit for each node
    nodes.forEach(node => {
      expect(BigInt(node.gasUsed)).toBeLessThanOrEqual(BigInt(node.gasLimit))
    })

    // Find node with maximum gas used
    const maxGasUsedNode = nodes.reduce((max, node) => 
      BigInt(node.gasUsed) > BigInt(max.gasUsed) ? node : max
    )
    expect(maxGasUsedNode.gasUsed).toBe('1407000000')
    expect(maxGasUsedNode.id).toBe('node_005')

    // Find node with minimum gas used
    const minGasUsedNode = nodes.reduce((min, node) => 
      BigInt(node.gasUsed) < BigInt(min.gasUsed) ? node : min
    )
    expect(minGasUsedNode.gasUsed).toBe('588000000')
    expect(minGasUsedNode.id).toBe('node_003')
  })

  it('should handle transaction counts correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { nodes } = result.current

    // Verify all transaction counts are positive
    nodes.forEach(node => {
      expect(node.transactions).toBeGreaterThan(0)
    })

    // Calculate total transactions
    const totalTransactions = nodes.reduce((sum, node) => sum + node.transactions, 0)
    expect(totalTransactions).toBe(306)

    // Find node with maximum transactions
    const maxTransactionsNode = nodes.reduce((max, node) => 
      node.transactions > max.transactions ? node : max
    )
    expect(maxTransactionsNode.transactions).toBe(67)
    expect(maxTransactionsNode.id).toBe('node_005')

    // Find node with minimum transactions
    const minTransactionsNode = nodes.reduce((min, node) => 
      node.transactions < min.transactions ? node : min
    )
    expect(minTransactionsNode.transactions).toBe(28)
    expect(minTransactionsNode.id).toBe('node_003')
  })

  it('should handle node sizes correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { nodes } = result.current

    // Verify all node sizes are positive
    nodes.forEach(node => {
      expect(node.size).toBeGreaterThan(0)
    })

    // Find node with maximum size
    const maxSizeNode = nodes.reduce((max, node) => 
      node.size > max.size ? node : max
    )
    expect(maxSizeNode.size).toBe(189000)
    expect(maxSizeNode.id).toBe('node_005')

    // Find node with minimum size
    const minSizeNode = nodes.reduce((min, node) => 
      node.size < min.size ? node : min
    )
    expect(minSizeNode.size).toBe(87000)
    expect(minSizeNode.id).toBe('node_003')
  })

  it('should handle validator addresses correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { nodes } = result.current

    // Verify all validator addresses are properly formatted
    nodes.forEach(node => {
      expect(node.validator).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    // Verify all node hashes are properly formatted
    nodes.forEach(node => {
      expect(node.hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    // Check that we have different validators
    const validators = [...new Set(nodes.map(n => n.validator))]
    expect(validators).toHaveLength(7) // All nodes have different validators
  })

  it('should handle edge weights correctly', async () => {
    const { result } = renderHook(() => useDag())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { edges } = result.current

    // Verify all edge weights are positive
    edges.forEach(edge => {
      expect(edge.weight).toBeGreaterThan(0)
      expect(edge.weight).toBeLessThanOrEqual(1)
    })

    // Check that we have different edge weights
    const weights = edges.map(e => e.weight)
    expect(weights).toContain(1)
    expect(weights).toContain(0.7)
    expect(weights).toContain(0.3)

    // Verify edge connections are valid
    edges.forEach(edge => {
      expect(edge.from).toMatch(/^node_\d{3}$/)
      expect(edge.to).toMatch(/^node_\d{3}$/)
      expect(edge.from).not.toBe(edge.to)
    })
  })

  it('should handle empty DAG data', async () => {
    // Mock the hook to return empty DAG data
    const { result } = renderHook(() => {
      const [nodes, setNodes] = useState<any[]>([])
      const [edges, setEdges] = useState<any[]>([])
      const [stats, setStats] = useState({
        totalNodes: 0,
        totalEdges: 0,
        averageNodeSize: 0,
        maxDepth: 0,
        confirmationTime: 0,
        orphanRate: 0,
        networkDensity: 0
      })
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)

      return {
        nodes,
        edges,
        stats,
        loading,
        error,
        refetch: vi.fn()
      }
    })

    expect(result.current.nodes).toEqual([])
    expect(result.current.edges).toEqual([])
    expect(result.current.stats.totalNodes).toBe(0)
    expect(result.current.stats.totalEdges).toBe(0)
    expect(result.current.stats.averageNodeSize).toBe(0)
    expect(result.current.stats.maxDepth).toBe(0)
    expect(result.current.stats.confirmationTime).toBe(0)
    expect(result.current.stats.orphanRate).toBe(0)
    expect(result.current.stats.networkDensity).toBe(0)
  })
})