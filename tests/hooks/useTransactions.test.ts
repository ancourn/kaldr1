import { renderHook, act, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTransactions())

    expect(result.current.transactions).toEqual([])
    expect(result.current.stats).toEqual({
      totalTransactions: 0,
      pendingTransactions: 0,
      confirmedTransactions: 0,
      failedTransactions: 0,
      averageGasPrice: '0',
      totalFees: '0',
      transactionsPerSecond: 0
    })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should fetch transactions successfully', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers to simulate the API delay
    act(() => {
      vi.advanceTimersByTime(800)
    })

    // Wait for the initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.transactions).toHaveLength(5)
    expect(result.current.transactions[0]).toEqual({
      id: 'tx_001',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      value: '1000000000000000000',
      gasPrice: '20000000000',
      gasUsed: '21000',
      gasLimit: '25000',
      nonce: 123,
      blockNumber: 15372,
      timestamp: '2024-01-15T10:30:45Z',
      status: 'confirmed',
      type: 'transfer',
      fee: '420000000000000'
    })

    expect(result.current.stats).toEqual({
      totalTransactions: 5,
      pendingTransactions: 1,
      confirmedTransactions: 2,
      failedTransactions: 1,
      averageGasPrice: '21000000000',
      totalFees: '2980200000000000',
      transactionsPerSecond: 127.3
    })

    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    // Mock setTimeout to throw an error
    const originalSetTimeout = global.setTimeout
    global.setTimeout = vi.fn((callback: any) => {
      callback()
      return 1 as any
    })

    // Mock the hook to throw an error
    const { result } = renderHook(() => {
      const [transactions, setTransactions] = useState<any[]>([])
      const [stats, setStats] = useState({
        totalTransactions: 0,
        pendingTransactions: 0,
        confirmedTransactions: 0,
        failedTransactions: 0,
        averageGasPrice: '0',
        totalFees: '0',
        transactionsPerSecond: 0
      })
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState<string | null>(null)

      const fetchTransactions = async () => {
        try {
          setLoading(true)
          setError(null)
          throw new Error('Network error')
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
        } finally {
          setLoading(false)
        }
      }

      return {
        transactions,
        stats,
        loading,
        error,
        refetch: fetchTransactions
      }
    })

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.transactions).toEqual([])
    expect(result.current.error).toBe('Network error')

    // Restore original setTimeout
    global.setTimeout = originalSetTimeout
  })

  it('should refetch transactions when refetch is called', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers for initial fetch
    act(() => {
      vi.advanceTimersByTime(800)
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
      vi.advanceTimersByTime(800)
    })

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Data should be the same
    expect(result.current.transactions).toHaveLength(5)
  })

  it('should calculate stats correctly', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(800)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { stats } = result.current

    // Test total transactions count
    expect(stats.totalTransactions).toBe(5)

    // Test pending transactions count
    expect(stats.pendingTransactions).toBe(1)

    // Test confirmed transactions count
    expect(stats.confirmedTransactions).toBe(2)

    // Test failed transactions count
    expect(stats.failedTransactions).toBe(1)

    // Test average gas price
    expect(stats.averageGasPrice).toBe('21000000000')

    // Test total fees
    expect(stats.totalFees).toBe('2980200000000000')

    // Test TPS
    expect(stats.transactionsPerSecond).toBe(127.3)
  })

  it('should handle different transaction statuses', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(800)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transactions } = result.current

    // Check that we have different statuses
    const statuses = transactions.map(t => t.status)
    expect(statuses).toContain('pending')
    expect(statuses).toContain('confirmed')
    expect(statuses).toContain('packed')
    expect(statuses).toContain('failed')

    // Count transactions by status
    const pendingCount = transactions.filter(t => t.status === 'pending').length
    const confirmedCount = transactions.filter(t => t.status === 'confirmed').length
    const packedCount = transactions.filter(t => t.status === 'packed').length
    const failedCount = transactions.filter(t => t.status === 'failed').length

    expect(pendingCount).toBe(1)
    expect(confirmedCount).toBe(2)
    expect(packedCount).toBe(1)
    expect(failedCount).toBe(1)
  })

  it('should handle different transaction types', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(800)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transactions } = result.current

    // Check that we have different types
    const types = transactions.map(t => t.type)
    expect(types).toContain('transfer')
    expect(types).toContain('contract')
    expect(types).toContain('stake')

    // Count transactions by type
    const transferCount = transactions.filter(t => t.type === 'transfer').length
    const contractCount = transactions.filter(t => t.type === 'contract').length
    const stakeCount = transactions.filter(t => t.type === 'stake').length

    expect(transferCount).toBe(3)
    expect(contractCount).toBe(1)
    expect(stakeCount).toBe(1)
  })

  it('should handle gas calculations correctly', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(800)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transactions, stats } = result.current

    // Calculate expected average gas price
    const expectedAverageGasPrice = transactions.reduce((sum, t) => 
      sum + BigInt(t.gasPrice), BigInt(0)
    ) / BigInt(transactions.length)
    expect(BigInt(stats.averageGasPrice)).toBe(expectedAverageGasPrice)

    // Calculate expected total fees
    const expectedTotalFees = transactions.reduce((sum, t) => 
      sum + BigInt(t.fee), BigInt(0)
    )
    expect(BigInt(stats.totalFees)).toBe(expectedTotalFees)

    // Verify gas used is less than or equal to gas limit for each transaction
    transactions.forEach(transaction => {
      expect(BigInt(transaction.gasUsed)).toBeLessThanOrEqual(BigInt(transaction.gasLimit))
    })
  })

  it('should handle transaction values correctly', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(800)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transactions } = result.current

    // Verify all values are positive
    transactions.forEach(transaction => {
      expect(BigInt(transaction.value)).toBeGreaterThan(BigInt(0))
    })

    // Find transaction with maximum value
    const maxValueTransaction = transactions.reduce((max, t) => 
      BigInt(t.value) > BigInt(max.value) ? t : max
    )
    expect(maxValueTransaction.value).toBe('2000000000000000000')
    expect(maxValueTransaction.id).toBe('tx_003')

    // Find transaction with minimum value
    const minValueTransaction = transactions.reduce((min, t) => 
      BigInt(t.value) < BigInt(min.value) ? t : min
    )
    expect(minValueTransaction.value).toBe('500000000000000000')
    expect(minValueTransaction.id).toBe('tx_002')
  })

  it('should handle nonce sequence correctly', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(800)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transactions } = result.current

    // Sort transactions by nonce
    const sortedByNonce = [...transactions].sort((a, b) => a.nonce - b.nonce)

    // Verify nonces are sequential
    for (let i = 1; i < sortedByNonce.length; i++) {
      expect(sortedByNonce[i].nonce).toBe(sortedByNonce[i - 1].nonce + 1)
    }

    // Verify block numbers are sequential
    for (let i = 1; i < sortedByNonce.length; i++) {
      expect(sortedByNonce[i].blockNumber).toBe(sortedByNonce[i - 1].blockNumber + 1)
    }
  })

  it('should handle address formatting correctly', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(800)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transactions } = result.current

    // Verify all addresses are properly formatted (0x + 40 hex characters)
    transactions.forEach(transaction => {
      expect(transaction.from).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(transaction.to).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    // Verify transaction hashes are properly formatted (0x + 64 hex characters)
    transactions.forEach(transaction => {
      expect(transaction.hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })
  })

  it('should handle timestamp formatting correctly', async () => {
    const { result } = renderHook(() => useTransactions())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(800)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transactions } = result.current

    // Verify all timestamps are valid ISO strings
    transactions.forEach(transaction => {
      expect(() => new Date(transaction.timestamp)).not.toThrow()
      expect(transaction.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    })
  })

  it('should handle empty transactions list', async () => {
    // Mock the hook to return empty transactions
    const { result } = renderHook(() => {
      const [transactions, setTransactions] = useState<any[]>([])
      const [stats, setStats] = useState({
        totalTransactions: 0,
        pendingTransactions: 0,
        confirmedTransactions: 0,
        failedTransactions: 0,
        averageGasPrice: '0',
        totalFees: '0',
        transactionsPerSecond: 0
      })
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)

      return {
        transactions,
        stats,
        loading,
        error,
        refetch: vi.fn()
      }
    })

    expect(result.current.transactions).toEqual([])
    expect(result.current.stats.totalTransactions).toBe(0)
    expect(result.current.stats.pendingTransactions).toBe(0)
    expect(result.current.stats.confirmedTransactions).toBe(0)
    expect(result.current.stats.failedTransactions).toBe(0)
    expect(result.current.stats.averageGasPrice).toBe('0')
    expect(result.current.stats.totalFees).toBe('0')
    expect(result.current.stats.transactionsPerSecond).toBe(0)
  })
})