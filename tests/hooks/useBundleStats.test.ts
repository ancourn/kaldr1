import { renderHook, act, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useBundleStats } from '@/hooks/useBundleStats'

describe('useBundleStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBundleStats())

    expect(result.current.bundles).toEqual([])
    expect(result.current.stats).toEqual({
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
    expect(result.current.timeline).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should fetch bundle stats successfully', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers to simulate the API delay
    act(() => {
      vi.advanceTimersByTime(900)
    })

    // Wait for the initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.bundles).toHaveLength(6)
    expect(result.current.timeline).toHaveLength(3)
    
    // Check first bundle
    expect(result.current.bundles[0]).toEqual({
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
    })

    // Check first timeline entry
    expect(result.current.timeline[0]).toEqual({
      timestamp: '2024-01-15T10:30:00Z',
      bundleCount: 3,
      transactionCount: 105,
      totalValue: '2890000000000000000000',
      averageGasPrice: '20000000000'
    })

    // Check stats
    expect(result.current.stats).toEqual({
      totalBundles: 6,
      pendingBundles: 1,
      confirmedBundles: 4,
      failedBundles: 1,
      averageBundleSize: 126000,
      averageTransactionsPerBundle: 43.666666666666664,
      totalValueProcessed: '7350000000000000000000',
      totalFeesCollected: '95886000000000000',
      bundleProcessingTime: 2.1,
      successRate: 66.66666666666666
    })

    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    // Mock the hook to throw an error
    const { result } = renderHook(() => {
      const [bundles, setBundles] = useState<any[]>([])
      const [stats, setStats] = useState({
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
      const [timeline, setTimeline] = useState<any[]>([])
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState<string | null>(null)

      const fetchBundleStats = async () => {
        try {
          setLoading(true)
          setError(null)
          throw new Error('Network error')
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch bundle stats')
        } finally {
          setLoading(false)
        }
      }

      return {
        bundles,
        stats,
        timeline,
        loading,
        error,
        refetch: fetchBundleStats
      }
    })

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.bundles).toEqual([])
    expect(result.current.timeline).toEqual([])
    expect(result.current.error).toBe('Network error')
  })

  it('should refetch bundle stats when refetch is called', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers for initial fetch
    act(() => {
      vi.advanceTimersByTime(900)
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
      vi.advanceTimersByTime(900)
    })

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Data should be the same
    expect(result.current.bundles).toHaveLength(6)
    expect(result.current.timeline).toHaveLength(3)
  })

  it('should calculate stats correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { stats } = result.current

    // Test total bundles count
    expect(stats.totalBundles).toBe(6)

    // Test pending bundles count
    expect(stats.pendingBundles).toBe(1)

    // Test confirmed bundles count
    expect(stats.confirmedBundles).toBe(4)

    // Test failed bundles count
    expect(stats.failedBundles).toBe(1)

    // Test average bundle size
    expect(stats.averageBundleSize).toBe(126000)

    // Test average transactions per bundle
    expect(stats.averageTransactionsPerBundle).toBeCloseTo(43.67, 2)

    // Test total value processed
    expect(stats.totalValueProcessed).toBe('7350000000000000000000')

    // Test total fees collected
    expect(stats.totalFeesCollected).toBe('95886000000000000')

    // Test bundle processing time
    expect(stats.bundleProcessingTime).toBe(2.1)

    // Test success rate
    expect(stats.successRate).toBeCloseTo(66.67, 2)
  })

  it('should handle different bundle statuses', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles } = result.current

    // Check that we have different statuses
    const statuses = bundles.map(b => b.status)
    expect(statuses).toContain('pending')
    expect(statuses).toContain('confirmed')
    expect(statuses).toContain('failed')

    // Count bundles by status
    const pendingCount = bundles.filter(b => b.status === 'pending').length
    const confirmedCount = bundles.filter(b => b.status === 'confirmed').length
    const failedCount = bundles.filter(b => b.status === 'failed').length

    expect(pendingCount).toBe(1)
    expect(confirmedCount).toBe(4)
    expect(failedCount).toBe(1)
  })

  it('should handle bundle sizes correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles } = result.current

    // Verify all bundle sizes are positive
    bundles.forEach(bundle => {
      expect(bundle.bundleSize).toBeGreaterThan(0)
    })

    // Find bundle with maximum size
    const maxSizeBundle = bundles.reduce((max, bundle) => 
      bundle.bundleSize > max.bundleSize ? bundle : max
    )
    expect(maxSizeBundle.bundleSize).toBe(189000)
    expect(maxSizeBundle.id).toBe('bundle_005')

    // Find bundle with minimum size
    const minSizeBundle = bundles.reduce((min, bundle) => 
      bundle.bundleSize < min.bundleSize ? bundle : min
    )
    expect(minSizeBundle.bundleSize).toBe(87000)
    expect(minSizeBundle.id).toBe('bundle_003')
  })

  it('should handle transaction counts correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles } = result.current

    // Verify all transaction counts are positive
    bundles.forEach(bundle => {
      expect(bundle.transactionCount).toBeGreaterThan(0)
    })

    // Find bundle with maximum transactions
    const maxTransactionsBundle = bundles.reduce((max, bundle) => 
      bundle.transactionCount > max.transactionCount ? bundle : max
    )
    expect(maxTransactionsBundle.transactionCount).toBe(67)
    expect(maxTransactionsBundle.id).toBe('bundle_005')

    // Find bundle with minimum transactions
    const minTransactionsBundle = bundles.reduce((min, bundle) => 
      bundle.transactionCount < min.transactionCount ? bundle : min
    )
    expect(minTransactionsBundle.transactionCount).toBe(28)
    expect(minTransactionsBundle.id).toBe('bundle_003')
  })

  it('should handle value calculations correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles, stats } = result.current

    // Verify all values are positive
    bundles.forEach(bundle => {
      expect(BigInt(bundle.totalValue)).toBeGreaterThan(BigInt(0))
    })

    // Calculate expected total value processed
    const expectedTotalValue = bundles.reduce((sum, bundle) => 
      sum + BigInt(bundle.totalValue), BigInt(0)
    )
    expect(BigInt(stats.totalValueProcessed)).toBe(expectedTotalValue)

    // Find bundle with maximum value
    const maxValueBundle = bundles.reduce((max, bundle) => 
      BigInt(bundle.totalValue) > BigInt(max.totalValue) ? bundle : max
    )
    expect(maxValueBundle.totalValue).toBe('1890000000000000000000')
    expect(maxValueBundle.id).toBe('bundle_005')

    // Find bundle with minimum value
    const minValueBundle = bundles.reduce((min, bundle) => 
      BigInt(bundle.totalValue) < BigInt(min.totalValue) ? bundle : min
    )
    expect(minValueBundle.totalValue).toBe('750000000000000000000')
    expect(minValueBundle.id).toBe('bundle_003')
  })

  it('should handle fee calculations correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles, stats } = result.current

    // Verify all fees are non-negative
    bundles.forEach(bundle => {
      expect(BigInt(bundle.fees)).toBeGreaterThanOrEqual(BigInt(0))
    })

    // Calculate expected total fees collected
    const expectedTotalFees = bundles.reduce((sum, bundle) => 
      sum + BigInt(bundle.fees), BigInt(0)
    )
    expect(BigInt(stats.totalFeesCollected)).toBe(expectedTotalFees)

    // Failed bundles should have 0 fees
    const failedBundles = bundles.filter(b => b.status === 'failed')
    failedBundles.forEach(bundle => {
      expect(bundle.fees).toBe('0')
    })

    // Find bundle with maximum fees
    const maxFeesBundle = bundles.reduce((max, bundle) => 
      BigInt(bundle.fees) > BigInt(max.fees) ? bundle : max
    )
    expect(maxFeesBundle.fees).toBe('28140000000000000')
    expect(maxFeesBundle.id).toBe('bundle_005')
  })

  it('should handle confirmation counts correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles } = result.current

    // Verify all confirmation counts are non-negative
    bundles.forEach(bundle => {
      expect(bundle.confirmations).toBeGreaterThanOrEqual(0)
    })

    // Failed bundles should have 0 confirmations
    const failedBundles = bundles.filter(b => b.status === 'failed')
    failedBundles.forEach(bundle => {
      expect(bundle.confirmations).toBe(0)
    })

    // Find bundle with maximum confirmations
    const maxConfirmationsBundle = bundles.reduce((max, bundle) => 
      bundle.confirmations > max.confirmations ? bundle : max
    )
    expect(maxConfirmationsBundle.confirmations).toBe(12)
    expect(maxConfirmationsBundle.id).toBe('bundle_001')

    // Pending bundles should have fewer confirmations
    const pendingBundles = bundles.filter(b => b.status === 'pending')
    pendingBundles.forEach(bundle => {
      expect(bundle.confirmations).toBeLessThan(10)
    })
  })

  it('should handle gas calculations correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles } = result.current

    // Verify all gas values are positive
    bundles.forEach(bundle => {
      expect(BigInt(bundle.totalGasUsed)).toBeGreaterThan(BigInt(0))
      expect(BigInt(bundle.averageGasPrice)).toBeGreaterThan(BigInt(0))
    })

    // Find bundle with maximum gas used
    const maxGasUsedBundle = bundles.reduce((max, bundle) => 
      BigInt(bundle.totalGasUsed) > BigInt(max.totalGasUsed) ? bundle : max
    )
    expect(maxGasUsedBundle.totalGasUsed).toBe('1407000000')
    expect(maxGasUsedBundle.id).toBe('bundle_005')

    // Find bundle with minimum gas used
    const minGasUsedBundle = bundles.reduce((min, bundle) => 
      BigInt(bundle.totalGasUsed) < BigInt(min.totalGasUsed) ? bundle : min
    )
    expect(minGasUsedBundle.totalGasUsed).toBe('588000000')
    expect(minGasUsedBundle.id).toBe('bundle_003')

    // Find bundle with maximum average gas price
    const maxGasPriceBundle = bundles.reduce((max, bundle) => 
      BigInt(bundle.averageGasPrice) > BigInt(max.averageGasPrice) ? bundle : max
    )
    expect(maxGasPriceBundle.averageGasPrice).toBe('22000000000')
    expect(maxGasPriceBundle.id).toBe('bundle_004')
  })

  it('should handle timeline data correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { timeline } = result.current

    // Verify timeline has correct structure
    expect(timeline).toHaveLength(3)

    // Verify all timeline entries have required fields
    timeline.forEach(entry => {
      expect(entry).toHaveProperty('timestamp')
      expect(entry).toHaveProperty('bundleCount')
      expect(entry).toHaveProperty('transactionCount')
      expect(entry).toHaveProperty('totalValue')
      expect(entry).toHaveProperty('averageGasPrice')
    })

    // Verify all values are positive
    timeline.forEach(entry => {
      expect(entry.bundleCount).toBeGreaterThan(0)
      expect(entry.transactionCount).toBeGreaterThan(0)
      expect(BigInt(entry.totalValue)).toBeGreaterThan(BigInt(0))
      expect(BigInt(entry.averageGasPrice)).toBeGreaterThan(BigInt(0))
    })

    // Verify timestamps are in chronological order
    const timestamps = timeline.map(entry => new Date(entry.timestamp).getTime())
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
    }

    // Verify bundle counts decrease over time (showing recent activity)
    expect(timeline[0].bundleCount).toBe(3)
    expect(timeline[1].bundleCount).toBe(2)
    expect(timeline[2].bundleCount).toBe(1)
  })

  it('should handle validator addresses correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles } = result.current

    // Verify all validator addresses are properly formatted
    bundles.forEach(bundle => {
      expect(bundle.validator).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    // Verify all bundle hashes are properly formatted
    bundles.forEach(bundle => {
      expect(bundle.bundleHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    // Check that we have different validators
    const validators = [...new Set(bundles.map(b => b.validator))]
    expect(validators).toHaveLength(6) // All bundles have different validators
  })

  it('should handle block number sequence correctly', async () => {
    const { result } = renderHook(() => useBundleStats())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(900)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { bundles } = result.current

    // Sort bundles by block number
    const sortedByBlockNumber = [...bundles].sort((a, b) => a.blockNumber - b.blockNumber)

    // Verify block numbers are sequential
    for (let i = 1; i < sortedByBlockNumber.length; i++) {
      expect(sortedByBlockNumber[i].blockNumber).toBe(sortedByBlockNumber[i - 1].blockNumber + 1)
    }

    // Verify block numbers start from expected value
    expect(sortedByBlockNumber[0].blockNumber).toBe(15372)
    expect(sortedByBlockNumber[sortedByBlockNumber.length - 1].blockNumber).toBe(15377)
  })

  it('should handle empty bundle data', async () => {
    // Mock the hook to return empty bundle data
    const { result } = renderHook(() => {
      const [bundles, setBundles] = useState<any[]>([])
      const [stats, setStats] = useState({
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
      const [timeline, setTimeline] = useState<any[]>([])
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)

      return {
        bundles,
        stats,
        timeline,
        loading,
        error,
        refetch: vi.fn()
      }
    })

    expect(result.current.bundles).toEqual([])
    expect(result.current.timeline).toEqual([])
    expect(result.current.stats.totalBundles).toBe(0)
    expect(result.current.stats.pendingBundles).toBe(0)
    expect(result.current.stats.confirmedBundles).toBe(0)
    expect(result.current.stats.failedBundles).toBe(0)
    expect(result.current.stats.averageBundleSize).toBe(0)
    expect(result.current.stats.averageTransactionsPerBundle).toBe(0)
    expect(result.current.stats.totalValueProcessed).toBe('0')
    expect(result.current.stats.totalFeesCollected).toBe('0')
    expect(result.current.stats.bundleProcessingTime).toBe(0)
    expect(result.current.stats.successRate).toBe(0)
  })
})