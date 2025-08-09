import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// KALDRIX DAG Node Integration
interface KaldrixNodeConfig {
  url: string
  apiKey?: string
  network: 'mainnet' | 'testnet' | 'development'
  timeout: number
}

interface DAGTransaction {
  hash: string
  blockHash?: string
  from: string
  to?: string
  value: string
  gasLimit: string
  gasPrice: string
  input: string
  nonce: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  confirmations?: number
  dagIndex?: string
}

interface DAGBlock {
  hash: string
  number: number
  parentHash: string
  timestamp: number
  transactions: string[]
  gasUsed: string
  gasLimit: string
  size: number
  dagTips: string[]
  dagLevel: number
}

class KaldrixNodeClient {
  private config: KaldrixNodeConfig

  constructor(config: KaldrixNodeConfig) {
    this.config = config
  }

  async broadcastTransaction(signedTx: string): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.config.url}/api/v1/transactions/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          transaction: signedTx,
          network: this.config.network
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          hash: data.transactionHash
        }
      } else {
        return {
          success: false,
          error: data.error || 'Failed to broadcast transaction'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getTransactionStatus(txHash: string): Promise<{ success: boolean; transaction?: DAGTransaction; error?: string }> {
    try {
      const response = await fetch(`${this.config.url}/api/v1/transactions/${txHash}`, {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          transaction: data.transaction
        }
      } else {
        return {
          success: false,
          error: data.error || 'Failed to get transaction status'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getBlockByNumber(blockNumber: number): Promise<{ success: boolean; block?: DAGBlock; error?: string }> {
    try {
      const response = await fetch(`${this.config.url}/api/v1/blocks/${blockNumber}`, {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          block: data.block
        }
      } else {
        return {
          success: false,
          error: data.error || 'Failed to get block'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getLatestBlock(): Promise<{ success: boolean; block?: DAGBlock; error?: string }> {
    try {
      const response = await fetch(`${this.config.url}/api/v1/blocks/latest`, {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          block: data.block
        }
      } else {
        return {
          success: false,
          error: data.error || 'Failed to get latest block'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getNetworkStatus(): Promise<{ success: boolean; status?: any; error?: string }> {
    try {
      const response = await fetch(`${this.config.url}/api/v1/network/status`, {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          status: data.status
        }
      } else {
        return {
          success: false,
          error: data.error || 'Failed to get network status'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Initialize KALDRIX node client
function getKaldrixClient(): KaldrixNodeClient {
  const config: KaldrixNodeConfig = {
    url: process.env.KALDRIX_NODE_URL || 'http://localhost:8545',
    apiKey: process.env.KALDRIX_API_KEY,
    network: (process.env.KALDRIX_NETWORK as 'mainnet' | 'testnet' | 'development') || 'development',
    timeout: 30000
  }

  return new KaldrixNodeClient(config)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...params } = await request.json()
    const client = getKaldrixClient()

    switch (action) {
      case 'broadcast':
        const { signedTx } = params
        if (!signedTx) {
          return NextResponse.json({ success: false, error: 'Signed transaction required' }, { status: 400 })
        }

        const broadcastResult = await client.broadcastTransaction(signedTx)
        return NextResponse.json(broadcastResult)

      case 'getTransactionStatus':
        const { txHash } = params
        if (!txHash) {
          return NextResponse.json({ success: false, error: 'Transaction hash required' }, { status: 400 })
        }

        const txStatusResult = await client.getTransactionStatus(txHash)
        return NextResponse.json(txStatusResult)

      case 'getBlock':
        const { blockNumber } = params
        if (blockNumber === undefined) {
          return NextResponse.json({ success: false, error: 'Block number required' }, { status: 400 })
        }

        const blockResult = await client.getBlockByNumber(blockNumber)
        return NextResponse.json(blockResult)

      case 'getLatestBlock':
        const latestBlockResult = await client.getLatestBlock()
        return NextResponse.json(latestBlockResult)

      case 'getNetworkStatus':
        const networkStatusResult = await client.getNetworkStatus()
        return NextResponse.json(networkStatusResult)

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Blockchain integration error:', error)
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
    const client = getKaldrixClient()

    switch (action) {
      case 'networkStatus':
        const networkStatusResult = await client.getNetworkStatus()
        return NextResponse.json(networkStatusResult)

      case 'latestBlock':
        const latestBlockResult = await client.getLatestBlock()
        return NextResponse.json(latestBlockResult)

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Blockchain integration error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}