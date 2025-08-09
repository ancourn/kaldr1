import { NextRequest, NextResponse } from 'next/server'
import { modelHostingService } from '@/lib/ai/model_hosting'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const version = await modelHostingService.getModelVersion(params.id)
    if (!version) {
      return NextResponse.json(
        { error: 'Model version not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ version })
  } catch (error) {
    console.error('Error fetching model version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model version' },
      { status: 500 }
    )
  }
}