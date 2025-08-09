import { NextRequest, NextResponse } from 'next/server'
import { modelHostingService } from '@/lib/ai/model_hosting'

export async function GET(request: NextRequest) {
  try {
    const hosts = await modelHostingService.listHosts()
    return NextResponse.json({ hosts })
  } catch (error) {
    console.error('Error fetching model hosts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model hosts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const hostData = await request.json()
    const host = await modelHostingService.createHost(hostData)
    return NextResponse.json({ host }, { status: 201 })
  } catch (error) {
    console.error('Error creating model host:', error)
    return NextResponse.json(
      { error: 'Failed to create model host' },
      { status: 500 }
    )
  }
}