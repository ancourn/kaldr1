import { NextRequest, NextResponse } from 'next/server'
import { testSuiteService } from '@/lib/ai/test_suite'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const benchmark = await testSuiteService.getBenchmark(params.id)
    if (!benchmark) {
      return NextResponse.json(
        { error: 'Benchmark not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ benchmark })
  } catch (error) {
    console.error('Error fetching benchmark:', error)
    return NextResponse.json(
      { error: 'Failed to fetch benchmark' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const benchmark = await testSuiteService.runBenchmark(params.id)
    return NextResponse.json({ benchmark })
  } catch (error) {
    console.error('Error running benchmark:', error)
    return NextResponse.json(
      { error: 'Failed to run benchmark' },
      { status: 500 }
    )
  }
}