import { NextRequest, NextResponse } from 'next/server'
import { modelHostingService } from '@/lib/ai/model_hosting'

export async function POST(request: NextRequest) {
  try {
    const { hostId, input, apiKey } = await request.json()
    
    if (!hostId || !input) {
      return NextResponse.json(
        { error: 'Missing required parameters: hostId and input' },
        { status: 400 }
      )
    }

    const result = await modelHostingService.predict(hostId, input, apiKey)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error making prediction:', error)
    return NextResponse.json(
      { error: 'Failed to make prediction', details: error.message },
      { status: 500 }
    )
  }
}