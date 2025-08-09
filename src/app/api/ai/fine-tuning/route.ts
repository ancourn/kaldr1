import { NextRequest, NextResponse } from 'next/server'
import { modelHostingService } from '@/lib/ai/model_hosting'

export async function GET(request: NextRequest) {
  try {
    const jobs = await modelHostingService.listFineTuningJobs()
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error fetching fine-tuning jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fine-tuning jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const jobData = await request.json()
    const job = await modelHostingService.createFineTuningJob(jobData)
    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Error creating fine-tuning job:', error)
    return NextResponse.json(
      { error: 'Failed to create fine-tuning job' },
      { status: 500 }
    )
  }
}