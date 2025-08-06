'use client'

import { useState, useEffect } from 'react'

interface DagNode {
  id: string
  hash: string
  parentHashes: string[]
  timestamp: string
  height: number
  transactions: number
  size: number
  status: 'confirmed' | 'pending' | 'orphaned'
  validator: string
  gasUsed: string
  gasLimit: string
}

interface DagEdge {
  from: string
  to: string
  weight: number
}

interface DagStats {
  totalNodes: number
  totalEdges: number
  averageNodeSize: number
  maxDepth: number
  confirmationTime: number
  orphanRate: number
  networkDensity: number
}

interface UseDagReturn {
  nodes: DagNode[]
  edges: DagEdge[]
  stats: DagStats
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDag(): UseDagReturn {
  const [nodes, setNodes] = useState<DagNode[]>([])
  const [edges, setEdges] = useState<DagEdge[]>([])
  const [stats, setStats] = useState<DagStats>({
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

      // Simulate API call to get DAG data
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Mock DAG nodes
      const mockNodes: DagNode[] = [
        {
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
        },
        {
          id: 'node_002',
          hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          parentHashes: ['0x1111111111111111111111111111111111111111111111111111111111111111'],
          timestamp: '2024-01-15T10:30:15Z',
          height: 2,
          transactions: 32,
          size: 98000,
          status: 'confirmed',
          validator: '0x2345678901234567890123456789012345678901',
          gasUsed: '672000000',
          gasLimit: '1000000000'
        },
        {
          id: 'node_003',
          hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
          parentHashes: ['0x1111111111111111111111111111111111111111111111111111111111111111'],
          timestamp: '2024-01-15T10:30:30Z',
          height: 2,
          transactions: 28,
          size: 87000,
          status: 'confirmed',
          validator: '0x3456789012345678901234567890123456789012',
          gasUsed: '588000000',
          gasLimit: '900000000'
        },
        {
          id: 'node_004',
          hash: '0x4444444444444444444444444444444444444444444444444444444444444444',
          parentHashes: ['0x2222222222222222222222222222222222222222222222222222222222222222'],
          timestamp: '2024-01-15T10:30:45Z',
          height: 3,
          transactions: 51,
          size: 145000,
          status: 'confirmed',
          validator: '0x4567890123456789012345678901234567890123',
          gasUsed: '1071000000',
          gasLimit: '1600000000'
        },
        {
          id: 'node_005',
          hash: '0x5555555555555555555555555555555555555555555555555555555555555555',
          parentHashes: ['0x2222222222222222222222222222222222222222222222222222222222222222', '0x3333333333333333333333333333333333333333333333333333333333333333'],
          timestamp: '2024-01-15T10:31:00Z',
          height: 3,
          transactions: 67,
          size: 189000,
          status: 'confirmed',
          validator: '0x5678901234567890123456789012345678901234',
          gasUsed: '1407000000',
          gasLimit: '2000000000'
        },
        {
          id: 'node_006',
          hash: '0x6666666666666666666666666666666666666666666666666666666666666666',
          parentHashes: ['0x4444444444444444444444444444444444444444444444444444444444444444'],
          timestamp: '2024-01-15T10:31:15Z',
          height: 4,
          transactions: 39,
          size: 112000,
          status: 'pending',
          validator: '0x6789012345678901234567890123456789012345',
          gasUsed: '819000000',
          gasLimit: '1200000000'
        },
        {
          id: 'node_007',
          hash: '0x7777777777777777777777777777777777777777777777777777777777777777',
          parentHashes: ['0x5555555555555555555555555555555555555555555555555555555555555555'],
          timestamp: '2024-01-15T10:31:30Z',
          height: 4,
          transactions: 44,
          size: 128000,
          status: 'orphaned',
          validator: '0x7890123456789012345678901234567890123456',
          gasUsed: '924000000',
          gasLimit: '1400000000'
        }
      ]

      // Mock DAG edges
      const mockEdges: DagEdge[] = [
        { from: 'node_001', to: 'node_002', weight: 1 },
        { from: 'node_001', to: 'node_003', weight: 1 },
        { from: 'node_002', to: 'node_004', weight: 1 },
        { from: 'node_002', to: 'node_005', weight: 0.7 },
        { from: 'node_003', to: 'node_005', weight: 0.3 },
        { from: 'node_004', to: 'node_006', weight: 1 },
        { from: 'node_005', to: 'node_007', weight: 1 }
      ]

      setNodes(mockNodes)
      setEdges(mockEdges)

      // Calculate stats
      const totalNodes = mockNodes.length
      const totalEdges = mockEdges.length
      const averageNodeSize = mockNodes.reduce((sum, node) => sum + node.size, 0) / totalNodes
      const maxDepth = Math.max(...mockNodes.map(node => node.height))
      const confirmedNodes = mockNodes.filter(node => node.status === 'confirmed').length
      const orphanedNodes = mockNodes.filter(node => node.status === 'orphaned').length
      const orphanRate = (orphanedNodes / totalNodes) * 100
      const networkDensity = (totalEdges / (totalNodes * (totalNodes - 1))) * 100

      setStats({
        totalNodes,
        totalEdges,
        averageNodeSize,
        maxDepth,
        confirmationTime: 2.3, // Mock confirmation time in seconds
        orphanRate,
        networkDensity
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch DAG data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDagData()
  }, [])

  return {
    nodes,
    edges,
    stats,
    loading,
    error,
    refetch: fetchDagData
  }
}