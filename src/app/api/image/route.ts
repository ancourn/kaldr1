import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024' } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt,
      size
    })

    const imageBase64 = response.data[0].base64

    return NextResponse.json({
      success: true,
      image: imageBase64,
      size,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Image generation API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}