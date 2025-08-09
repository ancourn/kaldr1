import { NextRequest, NextResponse } from 'next/server'
import { testSuiteService } from '@/lib/ai/test_suite'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')
    
    const benchmarks = await testSuiteService.listBenchmarks(modelId || undefined)
    return NextResponse.json({ benchmarks })
  } catch (error) {
    console.error('Error fetching benchmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const benchmarkData = await request.json()
    const benchmark = await testSuiteService.createBenchmark(benchmarkData)
    return NextResponse.json({ benchmark }, { status: 201 })
  } catch (error) {
    console.error('Error creating benchmark:', error)
    return NextResponse.json(
      { error: 'Failed to create benchmark' },
      { status: 500 }
    )
  }
}