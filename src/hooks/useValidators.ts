'use client'

import { useState, useEffect } from 'react'

interface Validator {
  id: string
  address: string
  stake: string
  rewards: string
  uptime: number
  status: 'active' | 'inactive' | 'slashed'
  lastSeen: string
  commission: number
  delegations: number
}

interface ValidatorStats {
  totalValidators: number
  activeValidators: number
  totalStaked: string
  averageUptime: number
  totalRewards: string
}

interface UseValidatorsReturn {
  validators: Validator[]
  stats: ValidatorStats
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useValidators(): UseValidatorsReturn {
  const [validators, setValidators] = useState<Validator[]>([])
  const [stats, setStats] = useState<ValidatorStats>({
    totalValidators: 0,
    activeValidators: 0,
    totalStaked: '0',
    averageUptime: 0,
    totalRewards: '0'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchValidators = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API call to get validators
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock validator data
      const mockValidators: Validator[] = [
        {
          id: 'val_001',
          address: '0x1234567890123456789012345678901234567890',
          stake: '1000000000000000000000',
          rewards: '50000000000000000000',
          uptime: 99.8,
          status: 'active',
          lastSeen: '2024-01-15T10:30:00Z',
          commission: 5,
          delegations: 45
        },
        {
          id: 'val_002',
          address: '0x2345678901234567890123456789012345678901',
          stake: '800000000000000000000',
          rewards: '40000000000000000000',
          uptime: 99.5,
          status: 'active',
          lastSeen: '2024-01-15T10:29:00Z',
          commission: 7,
          delegations: 32
        },
        {
          id: 'val_003',
          address: '0x3456789012345678901234567890123456789012',
          stake: '1200000000000000000000',
          rewards: '60000000000000000000',
          uptime: 99.9,
          status: 'active',
          lastSeen: '2024-01-15T10:31:00Z',
          commission: 3,
          delegations: 67
        },
        {
          id: 'val_004',
          address: '0x4567890123456789012345678901234567890123',
          stake: '500000000000000000000',
          rewards: '25000000000000000000',
          uptime: 98.2,
          status: 'inactive',
          lastSeen: '2024-01-15T08:15:00Z',
          commission: 10,
          delegations: 12
        },
        {
          id: 'val_005',
          address: '0x5678901234567890123456789012345678901234',
          stake: '2000000000000000000000',
          rewards: '100000000000000000000',
          uptime: 100,
          status: 'active',
          lastSeen: '2024-01-15T10:30:00Z',
          commission: 2,
          delegations: 89
        }
      ]

      setValidators(mockValidators)

      // Calculate stats
      const activeValidators = mockValidators.filter(v => v.status === 'active').length
      const totalStaked = mockValidators.reduce((sum, v) => sum + BigInt(v.stake), BigInt(0))
      const averageUptime = mockValidators.reduce((sum, v) => sum + v.uptime, 0) / mockValidators.length
      const totalRewards = mockValidators.reduce((sum, v) => sum + BigInt(v.rewards), BigInt(0))

      setStats({
        totalValidators: mockValidators.length,
        activeValidators,
        totalStaked: totalStaked.toString(),
        averageUptime,
        totalRewards: totalRewards.toString()
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch validators')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchValidators()
  }, [])

  return {
    validators,
    stats,
    loading,
    error,
    refetch: fetchValidators
  }
}