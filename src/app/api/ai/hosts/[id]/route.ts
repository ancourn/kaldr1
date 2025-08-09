import { NextRequest, NextResponse } from 'next/server'
import { modelHostingService } from '@/lib/ai/model_hosting'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const host = await modelHostingService.getHost(params.id)
    if (!host) {
      return NextResponse.json(
        { error: 'Model host not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ host })
  } catch (error) {
    console.error('Error fetching model host:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model host' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const host = await modelHostingService.updateHost(params.id, updates)
    return NextResponse.json({ host })
  } catch (error) {
    console.error('Error updating model host:', error)
    return NextResponse.json(
      { error: 'Failed to update model host' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await modelHostingService.deleteHost(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting model host:', error)
    return NextResponse.json(
      { error: 'Failed to delete model host' },
      { status: 500 }
    )
  }
}