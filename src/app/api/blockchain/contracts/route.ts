import { NextRequest, NextResponse } from 'next/server'

// Mock smart contract data
const generateMockContracts = () => [
  {
    id: '1',
    name: 'Token Contract',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    version: '1.0.0',
    status: 'active',
    transactions: 15420,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
    abi: [
      {
        name: 'transfer',
        type: 'function',
        inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: 'success', type: 'bool' }]
      },
      {
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }]
      }
    ]
  },
  {
    id: '2',
    name: 'NFT Marketplace',
    address: '0xabcdabcdef1234567890abcdef1234567890abcd',
    version: '2.1.0',
    status: 'active',
    transactions: 8750,
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-18T16:20:00Z',
    abi: [
      {
        name: 'listNFT',
        type: 'function',
        inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'price', type: 'uint256' }],
        outputs: [{ name: 'success', type: 'bool' }]
      },
      {
        name: 'buyNFT',
        type: 'function',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: 'success', type: 'bool' }]
      }
    ]
  },
  {
    id: '3',
    name: 'Staking Contract',
    address: '0x5678901234567890abcdef1234567890abcdef12',
    version: '1.2.0',
    status: 'active',
    transactions: 5320,
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-15T13:30:00Z',
    abi: [
      {
        name: 'stake',
        type: 'function',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: [{ name: 'success', type: 'bool' }]
      },
      {
        name: 'unstake',
        type: 'function',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: [{ name: 'success', type: 'bool' }]
      }
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    const contracts = generateMockContracts()
    
    if (id) {
      const contract = contracts.find(c => c.id === id)
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
      
      return NextResponse.json({
        success: true,
        data: contract,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        contracts,
        total: contracts.length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contracts',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, bytecode, abi, version } = body
    
    // Validate required fields
    if (!name || !bytecode || !abi) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, bytecode, abi',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    // Mock contract deployment
    const newContract = {
      id: Date.now().toString(),
      name,
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      version: version || '1.0.0',
      status: 'deploying',
      transactions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      abi
    }
    
    return NextResponse.json({
      success: true,
      data: newContract,
      message: 'Contract deployment initiated',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deploying contract:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to deploy contract',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}