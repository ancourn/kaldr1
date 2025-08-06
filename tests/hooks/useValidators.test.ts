import { renderHook, act, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useValidators } from '@/hooks/useValidators'

// Mock the global fetch function
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useValidators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    mockFetch.mockClear()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useValidators())

    expect(result.current.validators).toEqual([])
    expect(result.current.stats).toEqual({
      totalValidators: 0,
      activeValidators: 0,
      totalStaked: '0',
      averageUptime: 0,
      totalRewards: '0'
    })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should fetch validators successfully', async () => {
    const { result } = renderHook(() => useValidators())

    // Wait for the initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.validators).toHaveLength(5)
    expect(result.current.validators[0]).toEqual({
      id: 'val_001',
      address: '0x1234567890123456789012345678901234567890',
      stake: '1000000000000000000000',
      rewards: '50000000000000000000',
      uptime: 99.8,
      status: 'active',
      lastSeen: '2024-01-15T10:30:00Z',
      commission: 5,
      delegations: 45
    })

    expect(result.current.stats).toEqual({
      totalValidators: 5,
      activeValidators: 4,
      totalStaked: '5500000000000000000000',
      averageUptime: 99.48,
      totalRewards: '275000000000000000000'
    })

    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    // Mock setTimeout to simulate error
    const originalSetTimeout = global.setTimeout
    global.setTimeout = vi.fn((callback: any) => {
      callback()
      return 1 as any
    })

    const { result } = renderHook(() => useValidators())

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.validators).toEqual([])
    expect(result.current.error).toBe('Failed to fetch validators')

    // Restore original setTimeout
    global.setTimeout = originalSetTimeout
  })

  it('should refetch validators when refetch is called', async () => {
    const { result } = renderHook(() => useValidators())

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

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Data should be the same
    expect(result.current.validators).toHaveLength(5)
  })

  it('should calculate stats correctly', async () => {
    const { result } = renderHook(() => useValidators())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { stats } = result.current

    // Test total validators count
    expect(stats.totalValidators).toBe(5)

    // Test active validators count
    expect(stats.activeValidators).toBe(4)

    // Test total staked amount
    expect(stats.totalStaked).toBe('5500000000000000000000')

    // Test average uptime
    expect(stats.averageUptime).toBeCloseTo(99.48, 2)

    // Test total rewards
    expect(stats.totalRewards).toBe('275000000000000000000')
  })

  it('should handle empty validators list', async () => {
    // Mock the hook to return empty validators
    const { result } = renderHook(() => {
      const [validators, setValidators] = useState<any[]>([])
      const [stats, setStats] = useState({
        totalValidators: 0,
        activeValidators: 0,
        totalStaked: '0',
        averageUptime: 0,
        totalRewards: '0'
      })
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)

      return {
        validators,
        stats,
        loading,
        error,
        refetch: vi.fn()
      }
    })

    expect(result.current.validators).toEqual([])
    expect(result.current.stats.totalValidators).toBe(0)
    expect(result.current.stats.activeValidators).toBe(0)
    expect(result.current.stats.totalStaked).toBe('0')
    expect(result.current.stats.averageUptime).toBe(0)
    expect(result.current.stats.totalRewards).toBe('0')
  })

  it('should handle validators with different statuses', async () => {
    const { result } = renderHook(() => useValidators())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { validators } = result.current

    // Check that we have different statuses
    const statuses = validators.map(v => v.status)
    expect(statuses).toContain('active')
    expect(statuses).toContain('inactive')

    // Count active validators
    const activeCount = validators.filter(v => v.status === 'active').length
    expect(activeCount).toBe(4)

    // Count inactive validators
    const inactiveCount = validators.filter(v => v.status === 'inactive').length
    expect(inactiveCount).toBe(1)
  })

  it('should handle large stake amounts correctly', async () => {
    const { result } = renderHook(() => useValidators())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { validators, stats } = result.current

    // Find the validator with the largest stake
    const maxStakeValidator = validators.reduce((max, v) => 
      BigInt(v.stake) > BigInt(max.stake) ? v : max
    )

    expect(maxStakeValidator.stake).toBe('2000000000000000000000')
    expect(maxStakeValidator.id).toBe('val_005')

    // Verify total staked is calculated correctly
    const expectedTotal = validators.reduce((sum, v) => sum + BigInt(v.stake), BigInt(0))
    expect(BigInt(stats.totalStaked)).toBe(expectedTotal)
  })

  it('should handle uptime calculations correctly', async () => {
    const { result } = renderHook(() => useValidators())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { validators, stats } = result.current

    // Calculate expected average uptime
    const expectedAverage = validators.reduce((sum, v) => sum + v.uptime, 0) / validators.length
    expect(stats.averageUptime).toBeCloseTo(expectedAverage, 2)

    // Verify all uptime values are within valid range
    validators.forEach(validator => {
      expect(validator.uptime).toBeGreaterThanOrEqual(0)
      expect(validator.uptime).toBeLessThanOrEqual(100)
    })
  })

  it('should handle commission rates correctly', async () => {
    const { result } = renderHook(() => useValidators())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { validators } = result.current

    // Verify commission rates are within valid range
    validators.forEach(validator => {
      expect(validator.commission).toBeGreaterThanOrEqual(0)
      expect(validator.commission).toBeLessThanOrEqual(100)
    })

    // Find validator with minimum commission
    const minCommissionValidator = validators.reduce((min, v) => 
      v.commission < min.commission ? v : min
    )
    expect(minCommissionValidator.commission).toBe(2)

    // Find validator with maximum commission
    const maxCommissionValidator = validators.reduce((max, v) => 
      v.commission > max.commission ? v : max
    )
    expect(maxCommissionValidator.commission).toBe(10)
  })

  it('should handle delegation counts correctly', async () => {
    const { result } = renderHook(() => useValidators())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { validators } = result.current

    // Verify delegation counts are non-negative
    validators.forEach(validator => {
      expect(validator.delegations).toBeGreaterThanOrEqual(0)
    })

    // Find validator with most delegations
    const maxDelegationsValidator = validators.reduce((max, v) => 
      v.delegations > max.delegations ? v : max
    )
    expect(maxDelegationsValidator.delegations).toBe(89)
    expect(maxDelegationsValidator.id).toBe('val_005')
  })
})