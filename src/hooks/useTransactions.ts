'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  gasUsed: string
  gasLimit: string
  nonce: number
  blockNumber: number
  timestamp: string
  status: 'pending' | 'confirmed' | 'failed' | 'packed'
  type: 'transfer' | 'contract' | 'stake' | 'unstake' | 'reward'
  fee: string
}

interface TransactionStats {
  totalTransactions: number
  pendingTransactions: number
  confirmedTransactions: number
  failedTransactions: number
  averageGasPrice: string
  totalFees: string
  transactionsPerSecond: number
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  stats: TransactionStats
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
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

      // Simulate API call to get transactions
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock transaction data
      const mockTransactions: Transaction[] = [
        {
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
        },
        {
          id: 'tx_002',
          hash: '0x2345678901bcdefa2345678901bcdefa2345678901bcdefa2345678901bcdefa',
          from: '0x3333333333333333333333333333333333333333',
          to: '0x4444444444444444444444444444444444444444',
          value: '500000000000000000',
          gasPrice: '25000000000',
          gasUsed: '52008',
          gasLimit: '60000',
          nonce: 124,
          blockNumber: 15373,
          timestamp: '2024-01-15T10:31:12Z',
          status: 'pending',
          type: 'contract',
          fee: '1300200000000000'
        },
        {
          id: 'tx_003',
          hash: '0x3456789012cdefb3456789012cdefb3456789012cdefb3456789012cdefb345',
          from: '0x5555555555555555555555555555555555555555',
          to: '0x6666666666666666666666666666666666666666',
          value: '2000000000000000000',
          gasPrice: '18000000000',
          gasUsed: '21000',
          gasLimit: '25000',
          nonce: 125,
          blockNumber: 15374,
          timestamp: '2024-01-15T10:31:28Z',
          status: 'packed',
          type: 'stake',
          fee: '378000000000000'
        },
        {
          id: 'tx_004',
          hash: '0x4567890123defac4567890123defac4567890123defac4567890123defac456',
          from: '0x7777777777777777777777777777777777777777',
          to: '0x8888888888888888888888888888888888888888',
          value: '750000000000000000',
          gasPrice: '22000000000',
          gasUsed: '21000',
          gasLimit: '25000',
          nonce: 126,
          blockNumber: 15375,
          timestamp: '2024-01-15T10:31:45Z',
          status: 'confirmed',
          type: 'transfer',
          fee: '462000000000000'
        },
        {
          id: 'tx_005',
          hash: '0x5678901234efabd5678901234efabd5678901234efabd5678901234efabd567',
          from: '0x9999999999999999999999999999999999999999',
          to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          value: '1500000000000000000',
          gasPrice: '20000000000',
          gasUsed: '21000',
          gasLimit: '25000',
          nonce: 127,
          blockNumber: 15376,
          timestamp: '2024-01-15T10:32:01Z',
          status: 'failed',
          type: 'transfer',
          fee: '420000000000000'
        }
      ]

      setTransactions(mockTransactions)

      // Calculate stats
      const pendingTransactions = mockTransactions.filter(t => t.status === 'pending').length
      const confirmedTransactions = mockTransactions.filter(t => t.status === 'confirmed').length
      const failedTransactions = mockTransactions.filter(t => t.status === 'failed').length
      const averageGasPrice = mockTransactions.reduce((sum, t) => sum + BigInt(t.gasPrice), BigInt(0)) / BigInt(mockTransactions.length)
      const totalFees = mockTransactions.reduce((sum, t) => sum + BigInt(t.fee), BigInt(0))

      setStats({
        totalTransactions: mockTransactions.length,
        pendingTransactions,
        confirmedTransactions,
        failedTransactions,
        averageGasPrice: averageGasPrice.toString(),
        totalFees: totalFees.toString(),
        transactionsPerSecond: 127.3 // Mock TPS
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return {
    transactions,
    stats,
    loading,
    error,
    refetch: fetchTransactions
  }
}