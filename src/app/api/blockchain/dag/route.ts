import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface DAGIndex {
  id: string
  transactionHash: string
  blockHash: string
  dagLevel: number
  dagTips: string[]
  confidence: number
  isFinalized: boolean
  indexedAt: Date
  additionalData: any
}

interface DAGNode {
  id: string
  hash: string
  level: number
  parents: string[]
  children: string[]
  transactions: string[]
  weight: number
  timestamp: Date
}

class DAGIndexer {
  private index: Map<string, DAGIndex> = new Map()
  private nodes: Map<string, DAGNode> = new Map()

  async indexTransaction(txHash: string, blockHash: string, dagData: any): Promise<void> {
    const dagIndex: DAGIndex = {
      id: `dag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionHash: txHash,
      blockHash,
      dagLevel: dagData.level || 0,
      dagTips: dagData.tips || [],
      confidence: dagData.confidence || 0,
      isFinalized: dagData.isFinalized || false,
      indexedAt: new Date(),
      additionalData: dagData
    }

    this.index.set(txHash, dagIndex)

    // Store in database
    try {
      await db.transaction.updateMany({
        where: { hash: txHash },
        data: {
          // Store DAG data in a field that can hold additional information
          // For SQLite, we'll use a JSON string in an existing field or add a new field
        }
      })
    } catch (error) {
      console.error('Error indexing transaction in database:', error)
    }
  }

  async addNode(nodeData: any): Promise<void> {
    const node: DAGNode = {
      id: nodeData.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash: nodeData.hash,
      level: nodeData.level || 0,
      parents: nodeData.parents || [],
      children: nodeData.children || [],
      transactions: nodeData.transactions || [],
      weight: nodeData.weight || 1,
      timestamp: new Date(nodeData.timestamp || Date.now())
    }

    this.nodes.set(node.hash, node)

    // Update relationships
    for (const parentHash of node.parents) {
      const parent = this.nodes.get(parentHash)
      if (parent && !parent.children.includes(node.hash)) {
        parent.children.push(node.hash)
      }
    }

    for (const childHash of node.children) {
      const child = this.nodes.get(childHash)
      if (child && !child.parents.includes(node.hash)) {
        child.parents.push(node.hash)
      }
    }
  }

  async getTransactionDAGInfo(txHash: string): Promise<DAGIndex | null> {
    return this.index.get(txHash) || null
  }

  async getDAGPath(txHash: string): Promise<DAGNode[]> {
    const dagIndex = this.index.get(txHash)
    if (!dagIndex) {
      return []
    }

    const path: DAGNode[] = []
    const visited = new Set<string>()

    // Find the node containing this transaction
    let currentNode: DAGNode | null = null
    for (const node of this.nodes.values()) {
      if (node.transactions.includes(txHash)) {
        currentNode = node
        break
      }
    }

    if (!currentNode) {
      return []
    }

    // Traverse up the DAG to find the path
    while (currentNode && !visited.has(currentNode.hash)) {
      visited.add(currentNode.hash)
      path.unshift(currentNode)

      if (currentNode.parents.length === 0) {
        break
      }

      // Get the parent with the highest weight (main chain)
      let bestParent: DAGNode | null = null
      let maxWeight = -1

      for (const parentHash of currentNode.parents) {
        const parent = this.nodes.get(parentHash)
        if (parent && parent.weight > maxWeight) {
          maxWeight = parent.weight
          bestParent = parent
        }
      }

      currentNode = bestParent
    }

    return path
  }

  async getDAGStats(): Promise<any> {
    const nodes = Array.from(this.nodes.values())
    const transactions = Array.from(this.index.values())

    return {
      totalNodes: nodes.length,
      totalTransactions: transactions.length,
      maxLevel: Math.max(...nodes.map(n => n.level), 0),
      avgConfidence: transactions.reduce((sum, tx) => sum + tx.confidence, 0) / transactions.length || 0,
      finalizedTransactions: transactions.filter(tx => tx.isFinalized).length,
      pendingTransactions: transactions.filter(tx => !tx.isFinalized).length
    }
  }

  async getTips(): Promise<string[]> {
    const nodes = Array.from(this.nodes.values())
    const tips: string[] = []

    for (const node of nodes) {
      if (node.children.length === 0) {
        tips.push(node.hash)
      }
    }

    return tips
  }

  async validateDAG(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    const nodes = Array.from(this.nodes.values())

    // Check for cycles
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (nodeHash: string): boolean => {
      if (recursionStack.has(nodeHash)) {
        return true
      }

      if (visited.has(nodeHash)) {
        return false
      }

      visited.add(nodeHash)
      recursionStack.add(nodeHash)

      const node = this.nodes.get(nodeHash)
      if (node) {
        for (const childHash of node.children) {
          if (hasCycle(childHash)) {
            return true
          }
        }
      }

      recursionStack.delete(nodeHash)
      return false
    }

    for (const node of nodes) {
      if (hasCycle(node.hash)) {
        errors.push(`Cycle detected in DAG starting from node ${node.hash}`)
        break
      }
    }

    // Check for orphaned nodes (except genesis)
    const hasParent = new Set<string>()
    for (const node of nodes) {
      for (const parentHash of node.parents) {
        hasParent.add(parentHash)
      }
    }

    for (const node of nodes) {
      if (node.parents.length === 0 && node.level > 0) {
        errors.push(`Orphaned node detected: ${node.hash}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Global DAG indexer instance
const dagIndexer = new DAGIndexer()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...params } = await request.json()

    switch (action) {
      case 'indexTransaction':
        const { txHash, blockHash, dagData } = params
        if (!txHash || !blockHash) {
          return NextResponse.json({ success: false, error: 'Transaction hash and block hash required' }, { status: 400 })
        }

        await dagIndexer.indexTransaction(txHash, blockHash, dagData || {})
        return NextResponse.json({ success: true, message: 'Transaction indexed in DAG' })

      case 'addNode':
        const { nodeData } = params
        if (!nodeData || !nodeData.hash) {
          return NextResponse.json({ success: false, error: 'Node data with hash required' }, { status: 400 })
        }

        await dagIndexer.addNode(nodeData)
        return NextResponse.json({ success: true, message: 'DAG node added' })

      case 'getTransactionDAGInfo':
        const { transactionHash } = params
        if (!transactionHash) {
          return NextResponse.json({ success: false, error: 'Transaction hash required' }, { status: 400 })
        }

        const dagInfo = await dagIndexer.getTransactionDAGInfo(transactionHash)
        return NextResponse.json({ success: true, data: dagInfo })

      case 'getDAGPath':
        const { txHashForPath } = params
        if (!txHashForPath) {
          return NextResponse.json({ success: false, error: 'Transaction hash required' }, { status: 400 })
        }

        const path = await dagIndexer.getDAGPath(txHashForPath)
        return NextResponse.json({ success: true, data: path })

      case 'getStats':
        const stats = await dagIndexer.getDAGStats()
        return NextResponse.json({ success: true, data: stats })

      case 'getTips':
        const tips = await dagIndexer.getTips()
        return NextResponse.json({ success: true, data: tips })

      case 'validate':
        const validation = await dagIndexer.validateDAG()
        return NextResponse.json({ success: true, data: validation })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('DAG indexing error:', error)
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
      case 'getStats':
        const stats = await dagIndexer.getDAGStats()
        return NextResponse.json({ success: true, data: stats })

      case 'getTips':
        const tips = await dagIndexer.getTips()
        return NextResponse.json({ success: true, data: tips })

      case 'validate':
        const validation = await dagIndexer.validateDAG()
        return NextResponse.json({ success: true, data: validation })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('DAG indexing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}