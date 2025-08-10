import { NextRequest, NextResponse } from 'next/server'

// Mock blockchain status data
const getBlockchainStatus = () => ({
  network: 'KALDRIX Testnet',
  blockHeight: Math.floor(Math.random() * 1000) + 15000,
  tps: Math.floor(Math.random() * 500) + 1000,
  gasPrice: Math.floor(Math.random() * 500) + 800,
  status: 'online',
  uptime: '99.9%',
  connectedNodes: 8,
  lastUpdated: new Date().toISOString()
})

export async function GET(request: NextRequest) {
  try {
    const status = getBlockchainStatus()
    
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching blockchain status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch blockchain status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}