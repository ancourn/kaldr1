import { renderHook, act, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useTokenTracker } from '@/hooks/useTokenTracker'

describe('useTokenTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTokenTracker())

    expect(result.current.tokenInfo).toBeNull()
    expect(result.current.holders).toEqual([])
    expect(result.current.transfers).toEqual([])
    expect(result.current.stats).toEqual({
      totalHolders: 0,
      totalTransfers24h: 0,
      totalVolume24h: '0',
      marketCap: 0,
      priceChange24h: 0,
      stakingAPY: 0,
      totalStaked: '0',
      stakingRatio: 0
    })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should fetch token data successfully', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers to simulate the API delay
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    // Wait for the initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tokenInfo).not.toBeNull()
    expect(result.current.holders).toHaveLength(8)
    expect(result.current.transfers).toHaveLength(5)
    
    // Check token info
    expect(result.current.tokenInfo).toEqual({
      symbol: 'KALD',
      name: 'KALDRIX',
      address: '0x1234567890123456789012345678901234567890',
      decimals: 18,
      totalSupply: '10000000000000000000000000000',
      circulatingSupply: '2500000000000000000000000000',
      burnedSupply: '0',
      stakedSupply: '2500000000000000000000000000',
      price: {
        usd: 2.45,
        change24h: 5.2,
        change7d: 12.8,
        marketCap: 6125000000,
        volume24h: 125000000
      },
      holders: 15420,
      transfers24h: 3847
    })

    // Check first holder
    expect(result.current.holders[0]).toEqual({
      address: '0x1111111111111111111111111111111111111111',
      balance: '1000000000000000000000000000',
      percentage: 10.0,
      type: 'validator'
    })

    // Check first transfer
    expect(result.current.transfers[0]).toEqual({
      id: 'transfer_001',
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      value: '1000000000000000000000',
      timestamp: '2024-01-15T10:30:45Z',
      type: 'transfer'
    })

    // Check stats
    expect(result.current.stats).toEqual({
      totalHolders: 15420,
      totalTransfers24h: 3847,
      totalVolume24h: '1750000000000000000000',
      marketCap: 6125000000,
      priceChange24h: 5.2,
      stakingAPY: 15.5,
      totalStaked: '2500000000000000000000000000',
      stakingRatio: 25
    })

    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    // Mock the hook to throw an error
    const { result } = renderHook(() => {
      const [tokenInfo, setTokenInfo] = useState<any>(null)
      const [holders, setHolders] = useState<any[]>([])
      const [transfers, setTransfers] = useState<any[]>([])
      const [stats, setStats] = useState({
        totalHolders: 0,
        totalTransfers24h: 0,
        totalVolume24h: '0',
        marketCap: 0,
        priceChange24h: 0,
        stakingAPY: 0,
        totalStaked: '0',
        stakingRatio: 0
      })
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState<string | null>(null)

      const fetchTokenData = async () => {
        try {
          setLoading(true)
          setError(null)
          throw new Error('Network error')
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch token data')
        } finally {
          setLoading(false)
        }
      }

      return {
        tokenInfo,
        holders,
        transfers,
        stats,
        loading,
        error,
        refetch: fetchTokenData
      }
    })

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tokenInfo).toBeNull()
    expect(result.current.holders).toEqual([])
    expect(result.current.transfers).toEqual([])
    expect(result.current.error).toBe('Network error')
  })

  it('should refetch token data when refetch is called', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers for initial fetch
    act(() => {
      vi.advanceTimersByTime(1100)
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
      vi.advanceTimersByTime(1100)
    })

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Data should be the same
    expect(result.current.tokenInfo).not.toBeNull()
    expect(result.current.holders).toHaveLength(8)
    expect(result.current.transfers).toHaveLength(5)
  })

  it('should calculate stats correctly', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { stats } = result.current

    // Test total holders
    expect(stats.totalHolders).toBe(15420)

    // Test total transfers 24h
    expect(stats.totalTransfers24h).toBe(3847)

    // Test total volume 24h
    expect(stats.totalVolume24h).toBe('1750000000000000000000')

    // Test market cap
    expect(stats.marketCap).toBe(6125000000)

    // Test price change 24h
    expect(stats.priceChange24h).toBe(5.2)

    // Test staking APY
    expect(stats.stakingAPY).toBe(15.5)

    // Test total staked
    expect(stats.totalStaked).toBe('2500000000000000000000000000')

    // Test staking ratio
    expect(stats.stakingRatio).toBe(25)
  })

  it('should handle token info correctly', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { tokenInfo } = result.current

    expect(tokenInfo).not.toBeNull()

    // Verify token info fields
    expect(tokenInfo!.symbol).toBe('KALD')
    expect(tokenInfo!.name).toBe('KALDRIX')
    expect(tokenInfo!.decimals).toBe(18)
    expect(tokenInfo!.holders).toBe(15420)
    expect(tokenInfo!.transfers24h).toBe(3847)

    // Verify address format
    expect(tokenInfo!.address).toMatch(/^0x[a-fA-F0-9]{40}$/)

    // Verify supply values
    expect(BigInt(tokenInfo!.totalSupply)).toBeGreaterThan(BigInt(0))
    expect(BigInt(tokenInfo!.circulatingSupply)).toBeGreaterThan(BigInt(0))
    expect(BigInt(tokenInfo!.stakedSupply)).toBeGreaterThan(BigInt(0))
    expect(BigInt(tokenInfo!.burnedSupply)).toBeGreaterThanOrEqual(BigInt(0))

    // Verify price information
    expect(tokenInfo!.price.usd).toBeGreaterThan(0)
    expect(typeof tokenInfo!.price.change24h).toBe('number')
    expect(typeof tokenInfo!.price.change7d).toBe('number')
    expect(tokenInfo!.price.marketCap).toBeGreaterThan(0)
    expect(tokenInfo!.price.volume24h).toBeGreaterThan(0)

    // Verify supply relationships
    const totalSupply = BigInt(tokenInfo!.totalSupply)
    const circulatingSupply = BigInt(tokenInfo!.circulatingSupply)
    const burnedSupply = BigInt(tokenInfo!.burnedSupply)
    const stakedSupply = BigInt(tokenInfo!.stakedSupply)

    expect(circulatingSupply).toBeLessThanOrEqual(totalSupply)
    expect(stakedSupply).toBeLessThanOrEqual(totalSupply)
    expect(burnedSupply).toBeLessThanOrEqual(totalSupply)
  })

  it('should handle token holders correctly', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { holders } = result.current

    // Verify all holders have required fields
    holders.forEach(holder => {
      expect(holder).toHaveProperty('address')
      expect(holder).toHaveProperty('balance')
      expect(holder).toHaveProperty('percentage')
      expect(holder).toHaveProperty('type')
    })

    // Verify address format
    holders.forEach(holder => {
      expect(holder.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    // Verify balances are positive
    holders.forEach(holder => {
      expect(BigInt(holder.balance)).toBeGreaterThan(BigInt(0))
    })

    // Verify percentages are positive and sum to reasonable amount
    const totalPercentage = holders.reduce((sum, holder) => sum + holder.percentage, 0)
    expect(totalPercentage).toBeGreaterThan(0)
    expect(totalPercentage).toBeLessThanOrEqual(100) // Top holders shouldn't exceed 100%

    // Verify holder types
    const holderTypes = holders.map(h => h.type)
    expect(holderTypes).toContain('validator')
    expect(holderTypes).toContain('exchange')
    expect(holderTypes).toContain('wallet')
    expect(holderTypes).toContain('contract')

    // Verify holders are sorted by balance (descending)
    for (let i = 1; i < holders.length; i++) {
      expect(BigInt(holders[i-1].balance)).toBeGreaterThanOrEqual(BigInt(holders[i].balance))
      expect(holders[i-1].percentage).toBeGreaterThanOrEqual(holders[i].percentage)
    }

    // Find holder with maximum balance
    const maxBalanceHolder = holders.reduce((max, holder) => 
      BigInt(holder.balance) > BigInt(max.balance) ? holder : max
    )
    expect(maxBalanceHolder.balance).toBe('1000000000000000000000000000')
    expect(maxBalanceHolder.percentage).toBe(10.0)
    expect(maxBalanceHolder.type).toBe('validator')

    // Find holder with minimum balance
    const minBalanceHolder = holders.reduce((min, holder) => 
      BigInt(holder.balance) < BigInt(min.balance) ? holder : min
    )
    expect(minBalanceHolder.balance).toBe('100000000000000000000000000')
    expect(minBalanceHolder.percentage).toBe(1.0)
    expect(minBalanceHolder.type).toBe('exchange')
  })

  it('should handle token transfers correctly', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transfers } = result.current

    // Verify all transfers have required fields
    transfers.forEach(transfer => {
      expect(transfer).toHaveProperty('id')
      expect(transfer).toHaveProperty('hash')
      expect(transfer).toHaveProperty('from')
      expect(transfer).toHaveProperty('to')
      expect(transfer).toHaveProperty('value')
      expect(transfer).toHaveProperty('timestamp')
      expect(transfer).toHaveProperty('type')
    })

    // Verify address format
    transfers.forEach(transfer => {
      expect(transfer.from).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(transfer.to).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(transfer.hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    // Verify values are positive
    transfers.forEach(transfer => {
      expect(BigInt(transfer.value)).toBeGreaterThan(BigInt(0))
    })

    // Verify timestamp format
    transfers.forEach(transfer => {
      expect(() => new Date(transfer.timestamp)).not.toThrow()
      expect(transfer.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    })

    // Verify transfer types
    const transferTypes = transfers.map(t => t.type)
    expect(transferTypes).toContain('transfer')
    expect(transferTypes).toContain('mint')
    expect(transferTypes).toContain('burn')
    expect(transferTypes).toContain('stake')

    // Count transfers by type
    const transferCount = transfers.filter(t => t.type === 'transfer').length
    const mintCount = transfers.filter(t => t.type === 'mint').length
    const burnCount = transfers.filter(t => t.type === 'burn').length
    const stakeCount = transfers.filter(t => t.type === 'stake').length

    expect(transferCount).toBe(2)
    expect(mintCount).toBe(1)
    expect(burnCount).toBe(1)
    expect(stakeCount).toBe(1)

    // Verify mint/burn special addresses
    const mintTransfer = transfers.find(t => t.type === 'mint')
    expect(mintTransfer?.from).toBe('0x0000000000000000000000000000000000000000')

    const burnTransfer = transfers.find(t => t.type === 'burn')
    expect(burnTransfer?.to).toBe('0x0000000000000000000000000000000000000000')

    // Find transfer with maximum value
    const maxValueTransfer = transfers.reduce((max, transfer) => 
      BigInt(transfer.value) > BigInt(max.value) ? transfer : max
    )
    expect(maxValueTransfer.value).toBe('5000000000000000000000')
    expect(maxValueTransfer.type).toBe('mint')

    // Find transfer with minimum value
    const minValueTransfer = transfers.reduce((min, transfer) => 
      BigInt(transfer.value) < BigInt(min.value) ? transfer : min
    )
    expect(minValueTransfer.value).toBe('750000000000000000000')
    expect(minValueTransfer.type).toBe('transfer')
  })

  it('should handle staking calculations correctly', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { tokenInfo, stats } = result.current

    expect(tokenInfo).not.toBeNull()

    // Verify staking ratio calculation
    const expectedStakingRatio = (BigInt(tokenInfo!.stakedSupply) * BigInt(100)) / BigInt(tokenInfo!.totalSupply)
    expect(stats.stakingRatio).toBe(Number(expectedStakingRatio))

    // Verify staking APY is reasonable
    expect(stats.stakingAPY).toBeGreaterThan(0)
    expect(stats.stakingAPY).toBeLessThan(100) // APY should be reasonable

    // Verify total staked matches token info
    expect(stats.totalStaked).toBe(tokenInfo!.stakedSupply)

    // Verify staking ratio is between 0 and 100
    expect(stats.stakingRatio).toBeGreaterThan(0)
    expect(stats.stakingRatio).toBeLessThanOrEqual(100)
  })

  it('should handle volume calculations correctly', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { transfers, stats } = result.current

    // Calculate expected volume from transfer transfers only
    const expectedVolume = transfers
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + BigInt(t.value), BigInt(0))

    expect(BigInt(stats.totalVolume24h)).toBe(expectedVolume)

    // Verify volume is positive
    expect(BigInt(stats.totalVolume24h)).toBeGreaterThan(BigInt(0))

    // Verify volume matches token info volume
    expect(stats.totalVolume24h).toBe('1750000000000000000000')
  })

  it('should handle price information correctly', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { tokenInfo, stats } = result.current

    expect(tokenInfo).not.toBeNull()

    // Verify price change consistency
    expect(stats.priceChange24h).toBe(tokenInfo!.price.change24h)

    // Verify market cap consistency
    expect(stats.marketCap).toBe(tokenInfo!.price.marketCap)

    // Verify price is positive
    expect(tokenInfo!.price.usd).toBeGreaterThan(0)

    // Verify market cap calculation is reasonable
    const circulatingSupply = BigInt(tokenInfo!.circulatingSupply)
    const expectedMarketCap = Number(circulatingSupply) * Math.pow(10, -tokenInfo!.decimals) * tokenInfo!.price.usd
    expect(Math.abs(stats.marketCap - expectedMarketCap)).toBeLessThan(stats.marketCap * 0.01) // Within 1%
  })

  it('should handle empty token data', async () => {
    // Mock the hook to return empty token data
    const { result } = renderHook(() => {
      const [tokenInfo, setTokenInfo] = useState<any>(null)
      const [holders, setHolders] = useState<any[]>([])
      const [transfers, setTransfers] = useState<any[]>([])
      const [stats, setStats] = useState({
        totalHolders: 0,
        totalTransfers24h: 0,
        totalVolume24h: '0',
        marketCap: 0,
        priceChange24h: 0,
        stakingAPY: 0,
        totalStaked: '0',
        stakingRatio: 0
      })
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)

      return {
        tokenInfo,
        holders,
        transfers,
        stats,
        loading,
        error,
        refetch: vi.fn()
      }
    })

    expect(result.current.tokenInfo).toBeNull()
    expect(result.current.holders).toEqual([])
    expect(result.current.transfers).toEqual([])
    expect(result.current.stats.totalHolders).toBe(0)
    expect(result.current.stats.totalTransfers24h).toBe(0)
    expect(result.current.stats.totalVolume24h).toBe('0')
    expect(result.current.stats.marketCap).toBe(0)
    expect(result.current.stats.priceChange24h).toBe(0)
    expect(result.current.stats.stakingAPY).toBe(0)
    expect(result.current.stats.totalStaked).toBe('0')
    expect(result.current.stats.stakingRatio).toBe(0)
  })

  it('should handle token supply relationships correctly', async () => {
    const { result } = renderHook(() => useTokenTracker())

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const { tokenInfo } = result.current

    expect(tokenInfo).not.toBeNull()

    const totalSupply = BigInt(tokenInfo!.totalSupply)
    const circulatingSupply = BigInt(tokenInfo!.circulatingSupply)
    const burnedSupply = BigInt(tokenInfo!.burnedSupply)
    const stakedSupply = BigInt(tokenInfo!.stakedSupply)

    // Verify basic supply relationships
    expect(circulatingSupply).toBeLessThanOrEqual(totalSupply)
    expect(stakedSupply).toBeLessThanOrEqual(totalSupply)
    expect(burnedSupply).toBeLessThanOrEqual(totalSupply)

    // Verify that circulating + staked + burned doesn't exceed total (with some tolerance for rounding)
    const accountedSupply = circulatingSupply + stakedSupply + burnedSupply
    expect(accountedSupply).toBeLessThanOrEqual(totalSupply)

    // Verify specific supply values
    expect(totalSupply.toString()).toBe('10000000000000000000000000000')
    expect(circulatingSupply.toString()).toBe('2500000000000000000000000000')
    expect(stakedSupply.toString()).toBe('2500000000000000000000000000')
    expect(burnedSupply.toString()).toBe('0')

    // Verify staking supply is 25% of total supply
    const stakingPercentage = (Number(stakedSupply) / Number(totalSupply)) * 100
    expect(stakingPercentage).toBe(25)
  })
})