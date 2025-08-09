import { NextRequest, NextResponse } from 'next/server'
import { testSuiteService } from '@/lib/ai/test_suite'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')
    
    const suites = await testSuiteService.listTestSuites(modelId || undefined)
    return NextResponse.json({ suites })
  } catch (error) {
    console.error('Error fetching test suites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test suites' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const suiteData = await request.json()
    const suite = await testSuiteService.createTestSuite(suiteData)
    return NextResponse.json({ suite }, { status: 201 })
  } catch (error) {
    console.error('Error creating test suite:', error)
    return NextResponse.json(
      { error: 'Failed to create test suite' },
      { status: 500 }
    )
  }
}