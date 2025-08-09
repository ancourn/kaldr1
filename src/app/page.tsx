'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  Code, 
  Database, 
  Globe, 
  Zap, 
  Shield, 
  Terminal, 
  BarChart3,
  MessageSquare,
  Image as ImageIcon,
  Search
} from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview')

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Intelligence',
      description: 'Advanced AI capabilities with chat completions, image generation, and web search integration.'
    },
    {
      icon: Code,
      title: 'Next.js 15 Framework',
      description: 'Built with the latest Next.js 15 featuring App Router, TypeScript, and modern React patterns.'
    },
    {
      icon: Database,
      title: 'Prisma & SQLite',
      description: 'Robust database management with Prisma ORM and SQLite for efficient data operations.'
    },
    {
      icon: Globe,
      title: 'Real-time Communication',
      description: 'WebSocket support with Socket.IO for live updates and real-time interactions.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with server-side rendering and efficient state management.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Built-in authentication with NextAuth.js and secure API endpoints.'
    }
  ]

  const aiCapabilities = [
    {
      icon: MessageSquare,
      title: 'Chat Completions',
      description: 'Interactive AI conversations with context-aware responses.'
    },
    {
      icon: ImageIcon,
      title: 'Image Generation',
      description: 'Create stunning images from text descriptions using AI models.'
    },
    {
      icon: Search,
      title: 'Web Search',
      description: 'Integrate real-time web search results into your applications.'
    }
  ]

  const techStack = [
    { name: 'Next.js 15', category: 'Framework' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'shadcn/ui', category: 'Components' },
    { name: 'Prisma', category: 'Database' },
    { name: 'Zustand', category: 'State Management' },
    { name: 'Socket.IO', category: 'Real-time' },
    { name: 'NextAuth.js', category: 'Authentication' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                KALDRIX
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
                Next-Generation AI-Powered Web Application Platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
                <Button size="lg" variant="outline">
                  View Documentation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Built with cutting-edge technology to deliver exceptional performance and user experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">AI Capabilities</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Integrated AI features powered by z-ai-web-dev-sdk for intelligent applications.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aiCapabilities.map((capability, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <capability.icon className="w-8 h-8 text-purple-600" />
                    <CardTitle className="text-lg">{capability.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{capability.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Technology Stack</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Built with modern, production-ready technologies.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {techStack.map((tech, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <Badge variant="secondary" className="mb-2">{tech.category}</Badge>
                  <p className="font-semibold">{tech.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Interactive Dashboard</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Explore our AI-powered dashboard with real-time features and intelligent insights.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quick Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ai-features">AI Features</TabsTrigger>
                    <TabsTrigger value="api">API Status</TabsTrigger>
                    <TabsTrigger value="database">Database</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">System Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Server</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700">Online</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Database</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>AI Services</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Button className="w-full" variant="outline">
                              <Terminal className="w-4 h-4 mr-2" />
                              Open AI Dashboard
                            </Button>
                            <Button className="w-full" variant="outline">
                              <Database className="w-4 h-4 mr-2" />
                              View Database
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ai-features" className="mt-6">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">AI Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                <span>Chat Completions</span>
                              </div>
                              <Badge variant="outline">Available</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                <span>Image Generation</span>
                              </div>
                              <Badge variant="outline">Available</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                <span>Web Search</span>
                              </div>
                              <Badge variant="outline">Available</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="api" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">API Endpoints</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 border rounded">
                            <code className="text-sm">GET /api/health</code>
                            <Badge variant="outline">Health Check</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 border rounded">
                            <code className="text-sm">POST /api/chat</code>
                            <Badge variant="outline">Chat API</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 border rounded">
                            <code className="text-sm">POST /api/image</code>
                            <Badge variant="outline">Image Generation</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="database" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Database Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Database Type</span>
                            <Badge variant="outline">SQLite</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>ORM</span>
                            <Badge variant="outline">Prisma</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Models</span>
                            <Badge variant="outline">2 (User, Post)</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Join the KALDRIX platform and start building AI-powered applications today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Explore AI Dashboard
              </Button>
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}