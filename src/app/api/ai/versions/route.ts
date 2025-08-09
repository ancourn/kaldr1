import { NextRequest, NextResponse } from 'next/server'
import { modelHostingService } from '@/lib/ai/model_hosting'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')
    
    const versions = await modelHostingService.listModelVersions(modelId || undefined)
    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error fetching model versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model versions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const versionData = await request.json()
    const version = await modelHostingService.createModelVersion(versionData)
    return NextResponse.json({ version }, { status: 201 })
  } catch (error) {
    console.error('Error creating model version:', error)
    return NextResponse.json(
      { error: 'Failed to create model version' },
      { status: 500 }
    )
  }
}