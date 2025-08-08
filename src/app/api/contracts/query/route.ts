import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contractAddress = searchParams.get('address')
    const contractId = searchParams.get('id')

    if (!contractAddress && !contractId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Contract address or ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Find the contract
    const contract = await prisma.smartContract.findFirst({
      where: {
        OR: [
          { address: contractAddress || undefined },
          { id: contractId || undefined }
        ]
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        interactions: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        user: {
          select: { name: true, email: true }
        }
      }
    })

    if (!contract) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Contract not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === UserRole.VIEWER && 
        contract.userId !== session.user.id && 
        session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to query this contract',
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      )
    }

    // Generate mock contract state
    const contractState = generateMockContractState(contract.name, contract.address)

    // Get deployment transaction
    const deploymentTransaction = await prisma.transaction.findFirst({
      where: {
        contractId: contract.id,
        hash: { not: '' }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Calculate statistics
    const stats = {
      totalTransactions: contract.transactions.length,
      successfulTransactions: contract.transactions.filter(t => t.status === 'CONFIRMED').length,
      failedTransactions: contract.transactions.filter(t => t.status === 'FAILED').length,
      totalGasUsed: contract.transactions.reduce((sum, t) => sum + (t.gasUsed ? Number(t.gasUsed) : 0), 0),
      averageGasUsed: contract.transactions.length > 0 
        ? Math.round(contract.transactions.reduce((sum, t) => sum + (t.gasUsed ? Number(t.gasUsed) : 0), 0) / contract.transactions.length)
        : 0,
      totalInteractions: contract.interactions.length,
      successfulInteractions: contract.interactions.filter(i => i.status === 'success').length
    }

    return NextResponse.json({
      success: true,
      data: {
        contract: {
          id: contract.id,
          name: contract.name,
          address: contract.address,
          version: contract.version,
          status: contract.status,
          creator: contract.creator,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
          owner: contract.user
        },
        deployment: deploymentTransaction ? {
          transactionHash: deploymentTransaction.hash,
          gasUsed: deploymentTransaction.gasUsed?.toString(),
          gasLimit: deploymentTransaction.gasLimit?.toString(),
          timestamp: deploymentTransaction.createdAt
        } : null,
        state: contractState,
        statistics: stats,
        recentTransactions: contract.transactions,
        recentInteractions: contract.interactions,
        abi: contract.abi ? JSON.parse(contract.abi) : []
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error querying contract:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to query contract',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Helper function to generate mock contract state
function generateMockContractState(contractName: string, contractAddress: string): Record<string, any> {
  const baseState = {
    '_owner': '0x' + Math.random().toString(16).substring(2, 42),
    '_name': contractName,
    '_symbol': contractName.substring(0, 3).toUpperCase() + 'T',
    '_decimals': 18,
    '_totalSupply': (1000000 * Math.pow(10, 18)).toString(),
    '_paused': false,
    '_lastUpdated': new Date().toISOString()
  }

  // Add contract-specific state
  if (contractName.toLowerCase().includes('token')) {
    const address1 = '0x' + Math.random().toString(16).substring(2, 42)
    const address2 = '0x' + Math.random().toString(16).substring(2, 42)
    
    return {
      ...baseState,
      'balances': {
        [address1]: (1000 * Math.pow(10, 18)).toString(),
        [address2]: (500 * Math.pow(10, 18)).toString()
      },
      'allowances': {},
      'tokenURI': {}
    }
  }

  if (contractName.toLowerCase().includes('nft')) {
    return {
      ...baseState,
      'tokenOwners': {},
      'tokenApprovals': {},
      'operatorApprovals': {},
      'tokenURIs': {},
      '_tokenCounter': Math.floor(Math.random() * 100).toString()
    }
  }

  if (contractName.toLowerCase().includes('marketplace')) {
    return {
      ...baseState,
      'listings': {},
      'offers': {},
      'fees': {
        'platformFee': 250, // 2.5%
        'minFee': '1000000000000000000' // 0.001 ETH
      }
    }
  }

  return baseState
}