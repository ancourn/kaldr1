'use client'

import { useState, useEffect } from 'react'

interface Bundle {
  id: string
  bundleHash: string
  timestamp: string
  blockNumber: number
  transactionCount: number
  totalValue: string
  totalGasUsed: string
  averageGasPrice: string
  bundleSize: number
  status: 'pending' | 'confirmed' | 'failed'
  validator: string
  confirmations: number
  fees: string
}

interface BundleStats {
  totalBundles: number
  pendingBundles: number
  confirmedBundles: number
  failedBundles: number
  averageBundleSize: number
  averageTransactionsPerBundle: number
  totalValueProcessed: string
  totalFeesCollected: string
  bundleProcessingTime: number
  successRate: number
}

interface BundleTimeline {
  timestamp: string
  bundleCount: number
  transactionCount: number
  totalValue: string
  averageGasPrice: string
}

interface UseBundleStatsReturn {
  bundles: Bundle[]
  stats: BundleStats
  timeline: BundleTimeline[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useBundleStats(): UseBundleStatsReturn {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [stats, setStats] = useState<BundleStats>({
    totalBundles: 0,
    pendingBundles: 0,
    confirmedBundles: 0,
    failedBundles: 0,
    averageBundleSize: 0,
    averageTransactionsPerBundle: 0,
    totalValueProcessed: '0',
    totalFeesCollected: '0',
    bundleProcessingTime: 0,
    successRate: 0
  })
  const [timeline, setTimeline] = useState<BundleTimeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBundleStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API call to get bundle data
      await new Promise(resolve => setTimeout(resolve, 900))

      // Mock bundle data
      const mockBundles: Bundle[] = [
        {
          id: 'bundle_001',
          bundleHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          timestamp: '2024-01-15T10:30:00Z',
          blockNumber: 15372,
          transactionCount: 45,
          totalValue: '1250000000000000000000',
          totalGasUsed: '945000000',
          averageGasPrice: '20000000000',
          bundleSize: 125000,
          status: 'confirmed',
          validator: '0x1234567890123456789012345678901234567890',
          confirmations: 12,
          fees: '18900000000000000'
        },
        {
          id: 'bundle_002',
          bundleHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          timestamp: '2024-01-15T10:30:15Z',
          blockNumber: 15373,
          transactionCount: 32,
          totalValue: '890000000000000000000',
          totalGasUsed: '672000000',
          averageGasPrice: '21000000000',
          bundleSize: 98000,
          status: 'confirmed',
          validator: '0x2345678901234567890123456789012345678901',
          confirmations: 11,
          fees: '14112000000000000'
        },
        {
          id: 'bundle_003',
          bundleHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
          timestamp: '2024-01-15T10:30:30Z',
          blockNumber: 15374,
          transactionCount: 28,
          totalValue: '750000000000000000000',
          totalGasUsed: '588000000',
          averageGasPrice: '19000000000',
          bundleSize: 87000,
          status: 'confirmed',
          validator: '0x3456789012345678901234567890123456789012',
          confirmations: 10,
          fees: '11172000000000000'
        },
        {
          id: 'bundle_004',
          bundleHash: '0x4444444444444444444444444444444444444444444444444444444444444444',
          timestamp: '2024-01-15T10:30:45Z',
          blockNumber: 15375,
          transactionCount: 51,
          totalValue: '1450000000000000000000',
          totalGasUsed: '1071000000',
          averageGasPrice: '22000000000',
          bundleSize: 145000,
          status: 'pending',
          validator: '0x4567890123456789012345678901234567890123',
          confirmations: 3,
          fees: '23562000000000000'
        },
        {
          id: 'bundle_005',
          bundleHash: '0x5555555555555555555555555555555555555555555555555555555555555555',
          timestamp: '2024-01-15T10:31:00Z',
          blockNumber: 15376,
          transactionCount: 67,
          totalValue: '1890000000000000000000',
          totalGasUsed: '1407000000',
          averageGasPrice: '20000000000',
          bundleSize: 189000,
          status: 'confirmed',
          validator: '0x5678901234567890123456789012345678901234',
          confirmations: 8,
          fees: '28140000000000000'
        },
        {
          id: 'bundle_006',
          bundleHash: '0x6666666666666666666666666666666666666666666666666666666666666666',
          timestamp: '2024-01-15T10:31:15Z',
          blockNumber: 15377,
          transactionCount: 39,
          totalValue: '1120000000000000000000',
          totalGasUsed: '819000000',
          averageGasPrice: '21000000000',
          bundleSize: 112000,
          status: 'failed',
          validator: '0x6789012345678901234567890123456789012345',
          confirmations: 0,
          fees: '0'
        }
      ]

      setBundles(mockBundles)

      // Calculate stats
      const totalBundles = mockBundles.length
      const pendingBundles = mockBundles.filter(b => b.status === 'pending').length
      const confirmedBundles = mockBundles.filter(b => b.status === 'confirmed').length
      const failedBundles = mockBundles.filter(b => b.status === 'failed').length
      const averageBundleSize = mockBundles.reduce((sum, b) => sum + b.bundleSize, 0) / totalBundles
      const averageTransactionsPerBundle = mockBundles.reduce((sum, b) => sum + b.transactionCount, 0) / totalBundles
      const totalValueProcessed = mockBundles.reduce((sum, b) => sum + BigInt(b.totalValue), BigInt(0))
      const totalFeesCollected = mockBundles.reduce((sum, b) => sum + BigInt(b.fees), BigInt(0))
      const successRate = (confirmedBundles / totalBundles) * 100

      setStats({
        totalBundles,
        pendingBundles,
        confirmedBundles,
        failedBundles,
        averageBundleSize,
        averageTransactionsPerBundle,
        totalValueProcessed: totalValueProcessed.toString(),
        totalFeesCollected: totalFeesCollected.toString(),
        bundleProcessingTime: 2.1, // Mock processing time in seconds
        successRate
      })

      // Mock timeline data
      const mockTimeline: BundleTimeline[] = [
        {
          timestamp: '2024-01-15T10:30:00Z',
          bundleCount: 3,
          transactionCount: 105,
          totalValue: '2890000000000000000000',
          averageGasPrice: '20000000000'
        },
        {
          timestamp: '2024-01-15T10:31:00Z',
          bundleCount: 2,
          transactionCount: 106,
          totalValue: '3010000000000000000000',
          averageGasPrice: '20500000000'
        },
        {
          timestamp: '2024-01-15T10:32:00Z',
          bundleCount: 1,
          transactionCount: 39,
          totalValue: '1120000000000000000000',
          averageGasPrice: '21000000000'
        }
      ]

      setTimeline(mockTimeline)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bundle stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBundleStats()
  }, [])

  return {
    bundles,
    stats,
    timeline,
    loading,
    error,
    refetch: fetchBundleStats
  }
}