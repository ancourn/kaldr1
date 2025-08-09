import { NextRequest, NextResponse } from 'next/server'
import { testSuiteService } from '@/lib/ai/test_suite'

export async function POST(request: NextRequest) {
  try {
    const { modelId, version } = await request.json()
    
    if (!modelId || !version) {
      return NextResponse.json(
        { error: 'Missing required parameters: modelId and version' },
        { status: 400 }
      )
    }

    const report = await testSuiteService.createValidationReport(modelId, version)
    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Error creating validation report:', error)
    return NextResponse.json(
      { error: 'Failed to create validation report' },
      { status: 500 }
    )
  }
}