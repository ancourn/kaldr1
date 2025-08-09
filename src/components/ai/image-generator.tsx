'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Image as ImageIcon, 
  Download, 
  Copy, 
  Loader2, 
  Sparkles,
  Palette
} from 'lucide-react'

interface ImageGeneratorProps {
  onGenerateImage?: (prompt: string, size: string) => Promise<string>
  title?: string
  placeholder?: string
}

const imageSizes = [
  { value: '256x256', label: '256x256 (Small)' },
  { value: '512x512', label: '512x512 (Medium)' },
  { value: '1024x1024', label: '1024x1024 (Large)' },
  { value: '1024x1792', label: '1024x1792 (Portrait)' },
  { value: '1792x1024', label: '1792x1024 (Landscape)' }
]

export function ImageGenerator({
  onGenerateImage,
  title = "AI Image Generator",
  placeholder = "Describe the image you want to generate..."
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedSize, setSelectedSize] = useState('1024x1024')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setGeneratedImage(null)

    try {
      let imageData: string
      
      if (onGenerateImage) {
        imageData = await onGenerateImage(prompt.trim(), selectedSize)
      } else {
        // Default API call
        const response = await fetch('/api/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            size: selectedSize
          })
        })

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to generate image')
        }
        
        imageData = data.image
      }

      setGeneratedImage(imageData)
    } catch (err) {
      console.error('Error generating image:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `ai-generated-${Date.now()}.png`
    link.click()
  }

  const handleCopy = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
    } catch (err) {
      console.error('Error copying image:', err)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Image Description</label>
              <Textarea
                placeholder={placeholder}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Image Size</label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {imageSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isLoading || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Generated Image</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <img
                    src={generatedImage}
                    alt="Generated image"
                    className="max-w-full h-auto rounded-lg shadow-lg"
                    style={{ maxHeight: '500px' }}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Size: {selectedSize}</Badge>
                    <Badge variant="outline">Prompt: {prompt.length} characters</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <strong>Prompt:</strong> {prompt}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          {!generatedImage && !isLoading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                Tips for better results:
              </h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Be descriptive and specific about what you want</li>
                <li>• Include style preferences (e.g., "photorealistic", "cartoon", "oil painting")</li>
                <li>• Specify lighting and mood if important</li>
                <li>• Mention colors or color schemes if desired</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}