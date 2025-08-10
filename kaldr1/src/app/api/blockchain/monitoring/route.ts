import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface TransactionMonitorConfig {
  confirmationBlocks: number
  checkInterval: number
  maxRetries: number
}

interface MonitoredTransaction {
  id: string
  hash: string
  status: 'pending' | 'confirmed' | 'failed'
  confirmations: number
  requiredConfirmations: number
  blockNumber?: number
  blockHash?: string
  gasUsed?: string
  error?: string
  lastChecked: Date
  createdAt: Date
}

class TransactionMonitor {
  private config: TransactionMonitorConfig
  private monitoredTransactions: Map<string, MonitoredTransaction> = new Map()

  constructor(config: TransactionMonitorConfig) {
    this.config = config
    this.startMonitoring()
  }

  async addTransaction(hash: string, requiredConfirmations: number = 12): Promise<void> {
    const monitoredTx: MonitoredTransaction = {
      id: `mon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash,
      status: 'pending',
      confirmations: 0,
      requiredConfirmations,
      lastChecked: new Date(),
      createdAt: new Date()
    }

    this.monitoredTransactions.set(hash, monitoredTx)
    
    // Store in database for persistence
    try {
      await db.transaction.updateMany({
        where: { hash },
        data: {
          status: 'PENDING',
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating transaction status in database:', error)
    }
  }

  async checkTransactionStatus(hash: string): Promise<MonitoredTransaction | null> {
    try {
      // Call blockchain integration API to get transaction status
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/blockchain/integration?action=getTransactionStatus&txHash=${hash}`, {
        headers: {
          'Authorization': `Bearer ${process.env.KALDRIX_API_KEY}`
        }
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get transaction status')
      }

      const tx = data.transaction
      const monitoredTx = this.monitoredTransactions.get(hash)
      
      if (!monitoredTx) {
        return null
      }

      // Update monitored transaction
      monitoredTx.lastChecked = new Date()
      monitoredTx.confirmations = tx.confirmations || 0
      monitoredTx.blockNumber = tx.blockHash ? parseInt(tx.blockHash.slice(0, 8), 16) : undefined
      monitoredTx.blockHash = tx.blockHash
      monitoredTx.gasUsed = tx.gasUsed

      // Determine status
      if (tx.status === 'failed') {
        monitoredTx.status = 'failed'
        monitoredTx.error = 'Transaction failed'
      } else if (tx.status === 'confirmed' && monitoredTx.confirmations >= monitoredTx.requiredConfirmations) {
        monitoredTx.status = 'confirmed'
      }

      // Update database
      await this.updateTransactionInDatabase(hash, monitoredTx)

      return monitoredTx
    } catch (error) {
      console.error(`Error checking transaction status for ${hash}:`, error)
      return null
    }
  }

  private async updateTransactionInDatabase(hash: string, monitoredTx: MonitoredTransaction): Promise<void> {
    try {
      await db.transaction.updateMany({
        where: { hash },
        data: {
          status: monitoredTx.status.toUpperCase() as any,
          blockNumber: monitoredTx.blockNumber,
          blockHash: monitoredTx.blockHash,
          gasUsed: monitoredTx.gasUsed ? BigInt(monitoredTx.gasUsed) : null
        }
      })

      // If transaction is confirmed, update contract interactions
      if (monitoredTx.status === 'confirmed') {
        await db.contractInteraction.updateMany({
          where: { transactionId: hash },
          data: {
            status: 'confirmed',
            gasUsed: monitoredTx.gasUsed ? BigInt(monitoredTx.gasUsed) : null
          }
        })
      }
    } catch (error) {
      console.error('Error updating transaction in database:', error)
    }
  }

  private async startMonitoring(): Promise<void> {
    setInterval(async () => {
      const pendingTransactions = Array.from(this.monitoredTransactions.values())
        .filter(tx => tx.status === 'pending')

      for (const tx of pendingTransactions) {
        await this.checkTransactionStatus(tx.hash)
      }
    }, this.config.checkInterval)
  }

  getMonitoredTransactions(): MonitoredTransaction[] {
    return Array.from(this.monitoredTransactions.values())
  }

  getTransactionStatus(hash: string): MonitoredTransaction | null {
    return this.monitoredTransactions.get(hash) || null
  }
}

// Global transaction monitor instance
const transactionMonitor = new TransactionMonitor({
  confirmationBlocks: 12,
  checkInterval: 30000, // 30 seconds
  maxRetries: 10
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...params } = await request.json()

    switch (action) {
      case 'monitor':
        const { hash, requiredConfirmations } = params
        if (!hash) {
          return NextResponse.json({ success: false, error: 'Transaction hash required' }, { status: 400 })
        }

        await transactionMonitor.addTransaction(hash, requiredConfirmations || 12)
        return NextResponse.json({ success: true, message: 'Transaction monitoring started' })

      case 'getStatus':
        const { txHash } = params
        if (!txHash) {
          return NextResponse.json({ success: false, error: 'Transaction hash required' }, { status: 400 })
        }

        const status = transactionMonitor.getTransactionStatus(txHash)
        return NextResponse.json({ success: true, data: status })

      case 'checkStatus':
        const { hashToCheck } = params
        if (!hashToCheck) {
          return NextResponse.json({ success: false, error: 'Transaction hash required' }, { status: 400 })
        }

        const checkedStatus = await transactionMonitor.checkTransactionStatus(hashToCheck)
        return NextResponse.json({ success: true, data: checkedStatus })

      case 'getAll':
        const allTransactions = transactionMonitor.getMonitoredTransactions()
        return NextResponse.json({ success: true, data: allTransactions })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Transaction monitoring error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'getAll':
        const allTransactions = transactionMonitor.getMonitoredTransactions()
        return NextResponse.json({ success: true, data: allTransactions })

      case 'getStatus':
        const hash = searchParams.get('hash')
        if (!hash) {
          return NextResponse.json({ success: false, error: 'Transaction hash required' }, { status: 400 })
        }

        const status = transactionMonitor.getTransactionStatus(hash)
        return NextResponse.json({ success: true, data: status })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Transaction monitoring error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}