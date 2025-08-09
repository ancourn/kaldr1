'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  Star, 
  Eye, 
  Share2, 
  Heart, 
  Settings, 
  Play, 
  Pause,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Shield,
  Database,
  BarChart3,
  Upload,
  Tag,
  Calendar,
  Award,
  Globe,
  Lock,
  Unlock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface MarketplaceModel {
  id: string
  name: string
  description: string
  author: string
  category: string
  tags: string[]
  version: string
  downloads: number
  likes: number
  rating: number
  isPublic: boolean
  isVerified: boolean
  license: string
  price: number
  createdAt: string
  updatedAt: string
  metrics: {
    accuracy: number
    latency: number
    throughput: number
    modelSize: string
  }
  preview: {
    image?: string
    demoUrl?: string
    documentation: string
  }
  requirements: {
    framework: string
    dependencies: string[]
    hardware: string
  }
}

interface FilterOptions {
  category: string
  license: string
  sortBy: string
  priceRange: string
  verified: boolean
}

export function ModelMarketplace({ className }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModel, setSelectedModel] = useState<MarketplaceModel | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    license: 'all',
    sortBy: 'popular',
    priceRange: 'all',
    verified: false
  })
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [likedModels, setLikedModels] = useState<Set<string>>(new Set())

  // Mock marketplace models
  const marketplaceModels: MarketplaceModel[] = [
    {
      id: 'market_model_1',
      name: 'Smart Contract Auditor',
      description: 'Advanced AI model for detecting vulnerabilities in smart contracts with 94% accuracy',
      author: 'AI Security Labs',
      category: 'Security',
      tags: ['security', 'auditing', 'smart-contracts', 'vulnerability-detection'],
      version: '2.1.0',
      downloads: 15420,
      likes: 892,
      rating: 4.8,
      isPublic: true,
      isVerified: true,
      license: 'MIT',
      price: 0,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      metrics: {
        accuracy: 0.94,
        latency: 45.2,
        throughput: 1250,
        modelSize: '2.4GB'
      },
      preview: {
        documentation: 'https://docs.aisecuritylabs.com/contract-auditor'
      },
      requirements: {
        framework: 'PyTorch',
        dependencies: ['torch', 'transformers', 'numpy', 'pandas'],
        hardware: 'GPU Recommended'
      }
    },
    {
      id: 'market_model_2',
      name: 'Gas Optimization Pro',
      description: 'Machine learning model for optimizing smart contract gas usage and reducing costs',
      author: 'Blockchain Optimizers',
      category: 'Optimization',
      tags: ['optimization', 'gas', 'cost-reduction', 'performance'],
      version: '1.5.0',
      downloads: 8750,
      likes: 543,
      rating: 4.6,
      isPublic: true,
      isVerified: true,
      license: 'Apache 2.0',
      price: 0,
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-12T16:20:00Z',
      metrics: {
        accuracy: 0.87,
        latency: 23.4,
        throughput: 2150,
        modelSize: '890MB'
      },
      preview: {
        documentation: 'https://docs.blockchainoptimizers.com/gas-pro'
      },
      requirements: {
        framework: 'TensorFlow',
        dependencies: ['tensorflow', 'scikit-learn', 'web3'],
        hardware: 'CPU'
      }
    },
    {
      id: 'market_model_3',
      name: 'Transaction Anomaly Detector',
      description: 'Real-time anomaly detection for blockchain transactions using ensemble methods',
      author: 'Crypto AI Solutions',
      category: 'Analytics',
      tags: ['anomaly-detection', 'transactions', 'real-time', 'ensemble'],
      version: '3.0.0',
      downloads: 12300,
      likes: 756,
      rating: 4.7,
      isPublic: true,
      isVerified: true,
      license: 'GPL-3.0',
      price: 299,
      createdAt: '2023-12-20T11:00:00Z',
      updatedAt: '2024-01-14T10:15:00Z',
      metrics: {
        accuracy: 0.91,
        latency: 67.5,
        throughput: 890,
        modelSize: '3.2GB'
      },
      preview: {
        documentation: 'https://docs.cryptoai.solutions/anomaly-detector'
      },
      requirements: {
        framework: 'PyTorch',
        dependencies: ['torch', 'sklearn', 'numpy', 'pandas', 'scipy'],
        hardware: 'GPU Required'
      }
    },
    {
      id: 'market_model_4',
      name: 'DeFi Risk Analyzer',
      description: 'Comprehensive risk assessment model for DeFi protocols and lending platforms',
      author: 'DeFi Analytics Pro',
      category: 'DeFi',
      tags: ['defi', 'risk-analysis', 'lending', 'protocols'],
      version: '1.8.0',
      downloads: 6420,
      likes: 412,
      rating: 4.5,
      isPublic: true,
      isVerified: false,
      license: 'Commercial',
      price: 599,
      createdAt: '2024-01-01T14:00:00Z',
      updatedAt: '2024-01-13T09:45:00Z',
      metrics: {
        accuracy: 0.89,
        latency: 52.1,
        throughput: 1100,
        modelSize: '1.8GB'
      },
      preview: {
        documentation: 'https://docs.defianalytics.pro/risk-analyzer'
      },
      requirements: {
        framework: 'PyTorch',
        dependencies: ['torch', 'transformers', 'yfinance', 'pandas'],
        hardware: 'GPU Recommended'
      }
    }
  ]

  const categories = ['all', 'Security', 'Optimization', 'Analytics', 'DeFi', 'Trading', 'Mining']
  const licenses = ['all', 'MIT', 'Apache 2.0', 'GPL-3.0', 'Commercial']
  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Recently Updated' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'downloads', label: 'Most Downloaded' }
  ]
  const priceRanges = ['all', 'free', 'paid', 'premium']

  const filteredModels = marketplaceModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = filters.category === 'all' || model.category === filters.category
    const matchesLicense = filters.license === 'all' || model.license === filters.license
    const matchesVerified = !filters.verified || model.isVerified
    
    let matchesPrice = true
    if (filters.priceRange === 'free') matchesPrice = model.price === 0
    else if (filters.priceRange === 'paid') matchesPrice = model.price > 0
    else if (filters.priceRange === 'premium') matchesPrice = model.price >= 500

    return matchesSearch && matchesCategory && matchesLicense && matchesVerified && matchesPrice
  })

  const sortedModels = [...filteredModels].sort((a, b) => {
    switch (filters.sortBy) {
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'rating':
        return b.rating - a.rating
      case 'downloads':
        return b.downloads - a.downloads
      case 'popular':
      default:
        return b.likes - a.likes
    }
  })

  const handleDownload = async (modelId: string) => {
    setIsDownloading(modelId)
    // Simulate download process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsDownloading(null)
  }

  const handleLike = (modelId: string) => {
    const newLikedModels = new Set(likedModels)
    if (newLikedModels.has(modelId)) {
      newLikedModels.delete(modelId)
    } else {
      newLikedModels.add(modelId)
    }
    setLikedModels(newLikedModels)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Model Marketplace</h2>
          <p className="text-muted-foreground">Discover, share, and deploy AI models</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Publish Model
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.license} onValueChange={(value) => setFilters({...filters, license: value})}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {licenses.map(license => (
                <SelectItem key={license} value={license}>
                  {license === 'all' ? 'All Licenses' : license}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.priceRange} onValueChange={(value) => setFilters({...filters, priceRange: value})}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map(range => (
                <SelectItem key={range} value={range}>
                  {range === 'all' ? 'All' : range === 'free' ? 'Free' : range === 'paid' ? 'Paid' : 'Premium'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={filters.verified ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({...filters, verified: !filters.verified})}
          >
            <Shield className="h-4 w-4 mr-2" />
            Verified
          </Button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedModels.map((model) => (
          <Card key={model.id} className="relative hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    {model.isVerified && (
                      <Badge variant="default" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {model.price > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        ${model.price}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm line-clamp-2">
                    {model.description}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {model.author}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(model.updatedAt)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {model.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {model.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{model.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Accuracy</div>
                  <div className="font-medium">{(model.metrics.accuracy * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Latency</div>
                  <div className="font-medium">{model.metrics.latency.toFixed(1)}ms</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Size</div>
                  <div className="font-medium">{model.metrics.modelSize}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">License</div>
                  <div className="font-medium">{model.license}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {formatNumber(model.downloads)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {model.rating}
                  </span>
                </div>
                <Badge variant="outline">{model.version}</Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <div className="flex items-center gap-2">
                        <DialogTitle>{model.name}</DialogTitle>
                        {model.isVerified && (
                          <Badge variant="default" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <DialogDescription>{model.description}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Model Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Performance Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Accuracy</span>
                              <span>{(model.metrics.accuracy * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Latency</span>
                              <span>{model.metrics.latency.toFixed(1)}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Throughput</span>
                              <span>{model.metrics.throughput}/s</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Model Size</span>
                              <span>{model.metrics.modelSize}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Requirements</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Framework</span>
                              <span>{model.requirements.framework}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Hardware</span>
                              <span>{model.requirements.hardware}</span>
                            </div>
                            <div>
                              <span>Dependencies</span>
                              <div className="text-xs text-muted-foreground mt-1">
                                {model.requirements.dependencies.join(', ')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <h4 className="font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {model.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => handleDownload(model.id)}
                          disabled={isDownloading === model.id}
                        >
                          {isDownloading === model.id ? (
                            <>
                              <Pause className="h-4 w-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              {model.price > 0 ? `Purchase $${model.price}` : 'Download'}
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleLike(model.id)}
                        >
                          <Heart className={`h-4 w-4 ${likedModels.has(model.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleLike(model.id)}
                >
                  <Heart className={`h-4 w-4 ${likedModels.has(model.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>

                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleDownload(model.id)}
                  disabled={isDownloading === model.id}
                >
                  {isDownloading === model.id ? (
                    <Pause className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedModels.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No models found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}