import { NextRequest, NextResponse } from 'next/server'
import { testSuiteService } from '@/lib/ai/test_suite'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const suite = await testSuiteService.getTestSuite(params.id)
    if (!suite) {
      return NextResponse.json(
        { error: 'Test suite not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ suite })
  } catch (error) {
    console.error('Error fetching test suite:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test suite' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const suite = await testSuiteService.runTestSuite(params.id)
    return NextResponse.json({ suite })
  } catch (error) {
    console.error('Error running test suite:', error)
    return NextResponse.json(
      { error: 'Failed to run test suite' },
      { status: 500 }
    )
  }
}