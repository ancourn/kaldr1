import { NextRequest, NextResponse } from 'next/server'
import { modelHostingService } from '@/lib/ai/model_hosting'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await modelHostingService.getFineTuningJob(params.id)
    if (!job) {
      return NextResponse.json(
        { error: 'Fine-tuning job not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ job })
  } catch (error) {
    console.error('Error fetching fine-tuning job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fine-tuning job' },
      { status: 500 }
    )
  }
}