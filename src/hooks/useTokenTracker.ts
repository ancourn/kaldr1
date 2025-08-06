'use client'

import { useState, useEffect } from 'react'

interface TokenInfo {
  symbol: string
  name: string
  address: string
  decimals: number
  totalSupply: string
  circulatingSupply: string
  burnedSupply: string
  stakedSupply: string
  price: {
    usd: number
    change24h: number
    change7d: number
    marketCap: number
    volume24h: number
  }
  holders: number
  transfers24h: number
}

interface TokenHolder {
  address: string
  balance: string
  percentage: number
  type: 'validator' | 'exchange' | 'wallet' | 'contract'
}

interface TokenTransfer {
  id: string
  hash: string
  from: string
  to: string
  value: string
  timestamp: string
  type: 'transfer' | 'mint' | 'burn' | 'stake' | 'unstake'
}

interface TokenStats {
  totalHolders: number
  totalTransfers24h: number
  totalVolume24h: string
  marketCap: number
  priceChange24h: number
  stakingAPY: number
  totalStaked: string
  stakingRatio: number
}

interface UseTokenTrackerReturn {
  tokenInfo: TokenInfo | null
  holders: TokenHolder[]
  transfers: TokenTransfer[]
  stats: TokenStats
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTokenTracker(): UseTokenTrackerReturn {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [holders, setHolders] = useState<TokenHolder[]>([])
  const [transfers, setTransfers] = useState<TokenTransfer[]>([])
  const [stats, setStats] = useState<TokenStats>({
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

      // Simulate API call to get token data
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Mock token info
      const mockTokenInfo: TokenInfo = {
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
      }

      // Mock token holders
      const mockHolders: TokenHolder[] = [
        {
          address: '0x1111111111111111111111111111111111111111',
          balance: '1000000000000000000000000000',
          percentage: 10.0,
          type: 'validator'
        },
        {
          address: '0x2222222222222222222222222222222222222222',
          balance: '800000000000000000000000000',
          percentage: 8.0,
          type: 'exchange'
        },
        {
          address: '0x3333333333333333333333333333333333333333',
          balance: '500000000000000000000000000',
          percentage: 5.0,
          type: 'validator'
        },
        {
          address: '0x4444444444444444444444444444444444444444',
          balance: '300000000000000000000000000',
          percentage: 3.0,
          type: 'wallet'
        },
        {
          address: '0x5555555555555555555555555555555555555555',
          balance: '250000000000000000000000000',
          percentage: 2.5,
          type: 'contract'
        },
        {
          address: '0x6666666666666666666666666666666666666666',
          balance: '200000000000000000000000000',
          percentage: 2.0,
          type: 'wallet'
        },
        {
          address: '0x7777777777777777777777777777777777777777',
          balance: '150000000000000000000000000',
          percentage: 1.5,
          type: 'validator'
        },
        {
          address: '0x8888888888888888888888888888888888888888',
          balance: '100000000000000000000000000',
          percentage: 1.0,
          type: 'exchange'
        }
      ]

      // Mock token transfers
      const mockTransfers: TokenTransfer[] = [
        {
          id: 'transfer_001',
          hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          value: '1000000000000000000000',
          timestamp: '2024-01-15T10:30:45Z',
          type: 'transfer'
        },
        {
          id: 'transfer_002',
          hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          from: '0x0000000000000000000000000000000000000000',
          to: '0xcccccccccccccccccccccccccccccccccccccccccc',
          value: '5000000000000000000000',
          timestamp: '2024-01-15T10:31:12Z',
          type: 'mint'
        },
        {
          id: 'transfer_003',
          hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
          from: '0xdddddddddddddddddddddddddddddddddddddddd',
          to: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          value: '2500000000000000000000',
          timestamp: '2024-01-15T10:31:28Z',
          type: 'stake'
        },
        {
          id: 'transfer_004',
          hash: '0x4444444444444444444444444444444444444444444444444444444444444444',
          from: '0xffffffffffffffffffffffffffffffffffffffff',
          to: '0x0000000000000000000000000000000000000000',
          value: '1000000000000000000000',
          timestamp: '2024-01-15T10:31:45Z',
          type: 'burn'
        },
        {
          id: 'transfer_005',
          hash: '0x5555555555555555555555555555555555555555555555555555555555555555',
          from: '0xgggggggggggggggggggggggggggggggggggggggg',
          to: '0xhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
          value: '750000000000000000000',
          timestamp: '2024-01-15T10:32:01Z',
          type: 'transfer'
        }
      ]

      setTokenInfo(mockTokenInfo)
      setHolders(mockHolders)
      setTransfers(mockTransfers)

      // Calculate stats
      const totalVolume24h = mockTransfers
        .filter(t => t.type === 'transfer')
        .reduce((sum, t) => sum + BigInt(t.value), BigInt(0))
      
      const stakingRatio = (BigInt(mockTokenInfo.stakedSupply) * BigInt(100)) / BigInt(mockTokenInfo.totalSupply)

      setStats({
        totalHolders: mockTokenInfo.holders,
        totalTransfers24h: mockTokenInfo.transfers24h,
        totalVolume24h: totalVolume24h.toString(),
        marketCap: mockTokenInfo.price.marketCap,
        priceChange24h: mockTokenInfo.price.change24h,
        stakingAPY: 15.5, // Mock APY
        totalStaked: mockTokenInfo.stakedSupply,
        stakingRatio: Number(stakingRatio)
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokenData()
  }, [])

  return {
    tokenInfo,
    holders,
    transfers,
    stats,
    loading,
    error,
    refetch: fetchTokenData
  }
}