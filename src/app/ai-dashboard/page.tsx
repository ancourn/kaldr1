'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Search, 
  Send, 
  Download,
  Copy,
  RefreshCw,
  Loader2,
  Wifi,
  Users
} from 'lucide-react'
import { ChatComponent, ImageGenerator, WebSearch, WebSocketChat } from '@/components/ai'

export default function AIDashboard() {
  const [activeTab, setActiveTab] = useState('chat')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI assistant. How can I help you today?' }
  ])
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    
    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsLoading(true)

    try {
      // Simulate AI response (in real implementation, this would call the AI API)
      setTimeout(() => {
        const aiResponse = { role: 'assistant', content: 'I understand your message. This is a simulated response. In the actual implementation, this would connect to the z-ai-web-dev-sdk for real AI responses.' }
        setChatMessages(prev => [...prev, aiResponse])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return
    
    setIsLoading(true)
    
    try {
      // Simulate image generation (in real implementation, this would call the AI image generation API)
      setTimeout(() => {
        setGeneratedImage('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTYgMTI4QzMxMy4yIDEyOCAzNjAgMTc0LjggMzYwIDIzMkMzNjAgMjg5LjIgMzEzLjIgMzM2IDI1NiAzMzZDMTk4LjggMzM2IDE1MiAyODkuMiAxNTIgMjMyQzE1MiAxNzQuOCAxOTguOCAxMjggMjU2IDEyOFoiIGZpbGw9IiM0Rjc1RkYiLz4KPHBhdGggZD0iTTI1NiAxOTJDMjgyLjEgMTkyIDMwNCAyMTMuOSAzMDQgMjQwQzMwNCAyNjYuMSAyODIuMSAyODggMjU2IDI4OEMyMjkuOSAyODggMjA4IDI2Ni4xIDIwOCAyNDBDMjA4IDIxMy45IDIyOS45IDE5MiAyNTYgMTkyWiIgZmlsbD0iIzFFNDA4MCIvPgo8cGF0aCBkPSJNMjU2IDI2MEMyNjUuNSAyNjAgMjczLjUgMjY4IDI3My41IDI3Ny41QzI3My41IDI4NyAyNjUuNSAyOTUgMjU2IDI5NUMyNDYuNSAyOTUgMjM4LjUgMjg3IDIzOC41IDI3Ny41QzIzOC41IDI2OCAyNDYuNSAyNjAgMjU2IDI2MFoiIGZpbGw9IiMxRTQwODAiLz4KPC9zdmc+')
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error('Error generating image:', error)
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    
    try {
      // Simulate web search (in real implementation, this would call the web search API)
      setTimeout(() => {
        setSearchResults([
          {
            url: 'https://example.com/result1',
            name: 'Example Result 1',
            snippet: 'This is a sample search result snippet that would contain relevant information about your query.',
            host_name: 'example.com',
            rank: 1,
            date: '2024-01-01',
            favicon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiIGZpbGw9IiM0Rjc1RkYiLz4KPC9zdmc+'
          },
          {
            url: 'https://example.com/result2',
            name: 'Example Result 2',
            snippet: 'Another sample search result that demonstrates how the web search functionality would work.',
            host_name: 'example.com',
            rank: 2,
            date: '2024-01-02',
            favicon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiIGZpbGw9IiM0Rjc1RkYiLz4KPC9zdmc+'
          }
        ])
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      console.error('Error searching:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI Dashboard
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Explore AI-powered features including chat, image generation, web search, and real-time communication
          </p>
        </div>

        {/* Main Dashboard */}
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image Generation
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Web Search
              </TabsTrigger>
              <TabsTrigger value="realtime" className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Real-time
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-6">
              <ChatComponent
                initialMessages={chatMessages.map(msg => ({
                  role: msg.role as 'user' | 'assistant',
                  content: msg.content
                }))}
                title="AI Chat Assistant"
                placeholder="Ask me anything..."
                height="500px"
              />
            </TabsContent>

            {/* Image Generation Tab */}
            <TabsContent value="image" className="space-y-6">
              <ImageGenerator
                title="AI Image Generator"
                placeholder="Describe the image you want to generate..."
              />
            </TabsContent>

            {/* Web Search Tab */}
            <TabsContent value="search" className="space-y-6">
              <WebSearch
                title="AI Web Search"
                placeholder="Search the web for information..."
                maxResults={10}
              />
            </TabsContent>

            {/* Real-time Tab */}
            <TabsContent value="realtime" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WebSocketChat
                  title="Real-time Chat"
                  room="general"
                  height="400px"
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Real-time Features
                    </CardTitle>
                    <CardDescription>
                      Experience live WebSocket communication
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span>Live Chat</span>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <span>User Presence</span>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-purple-600" />
                            <span>WebSocket</span>
                          </div>
                          <Badge variant="outline">Connected</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-orange-600" />
                            <span>Typing Indicators</span>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                          Real-time Features:
                        </h4>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                          <li>• Live chat with multiple users</li>
                          <li>• Real-time typing indicators</li>
                          <li>• User presence and status</li>
                          <li>• Room-based messaging</li>
                          <li>• Server health updates</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}