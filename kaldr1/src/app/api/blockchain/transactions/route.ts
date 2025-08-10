import { NextRequest, NextResponse } from 'next/server'

// Mock transaction data
const generateMockTransactions = (count: number = 10) => {
  const transactions = []
  const statuses = ['pending', 'confirmed', 'failed']
  const senders = ['0x1234...5678', '0xabcd...efgh', '0x5678...9012', '0x3456...7890']
  const receivers = ['0x9876...5432', '0xfedc...ba98', '0x1357...2468', '0x8642...9753']
  
  for (let i = 0; i < count; i++) {
    transactions.push({
      id: (i + 1).toString(),
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
      from: senders[Math.floor(Math.random() * senders.length)],
      to: receivers[Math.floor(Math.random() * receivers.length)],
      amount: parseFloat((Math.random() * 10).toFixed(2)),
      gasUsed: Math.floor(Math.random() * 50000) + 21000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: `${Math.floor(Math.random() * 60) + 1} minutes ago`,
      blockNumber: Math.floor(Math.random() * 1000) + 15000
    })
  }
  
  return transactions
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const transactions = generateMockTransactions(limit)
    
    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.slice(offset, offset + limit),
        total: 100, // Mock total count
        limit,
        offset
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to, amount, gasLimit } = body
    
    // Validate required fields
    if (!from || !to || !amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: from, to, amount',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    // Mock transaction creation
    const newTransaction = {
      id: Date.now().toString(),
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
      from,
      to,
      amount: parseFloat(amount),
      gasUsed: gasLimit || 21000,
      status: 'pending',
      timestamp: 'just now',
      blockNumber: null
    }
    
    return NextResponse.json({
      success: true,
      data: newTransaction,
      message: 'Transaction created successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create transaction',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}