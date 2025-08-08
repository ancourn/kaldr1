'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Star, 
  CheckCircle, 
  Globe, 
  Clock,
  User,
  Hash,
  TrendingUp,
  Zap,
  Eye,
  Settings,
  ExternalLink,
  Calendar,
  Tag,
  Award,
  Shield
} from 'lucide-react'

interface RegistryEntry {
  id: string
  contract: {
    id: string
    name: string
    address: string
    version: string
    type: string
    status: string
    creator: string
    description?: string
    tags?: string[]
    gasUsed?: string
    createdAt: string
    updatedAt: string
  }
  registry: {
    isPublic: boolean
    verified: boolean
    verificationDate?: string
    verifiedBy?: string
    usageCount: number
    totalGasUsed: string
    popularityScore: number
    featured: boolean
    category?: string
    website?: string
    socialLinks?: any
    createdAt: string
    updatedAt: string
  }
  owner?: {
    name: string
    email: string
    role: string
  }
}

interface RegistryFilters {
  search?: string
  type?: string
  status?: string
  category?: string
  verified?: boolean
  featured?: boolean
  owner?: string
  tags?: string[]
  minGasUsed?: number
  maxGasUsed?: number
  dateFrom?: string
  dateTo?: string
  sortBy?: 'name' | 'createdAt' | 'usageCount' | 'popularityScore' | 'gasUsed'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface RegistryResponse {
  contracts: RegistryEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ContractRegistryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contracts, setContracts] = useState<RegistryEntry[]>([])
  const [featuredContracts, setFeaturedContracts] = useState<RegistryEntry[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<RegistryFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedContract, setSelectedContract] = useState<RegistryEntry | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Fetch initial data
  useEffect(() => {
    if (session) {
      fetchContracts()
      fetchFeaturedContracts()
      fetchCategories()
    }
  }, [session])

  const fetchContracts = async (newFilters?: RegistryFilters) => {
    try {
      setSearching(true)
      const fetchFilters = newFilters || filters
      
      const params = new URLSearchParams()
      Object.entries(fetchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, value.toString())
          }
        }
      })
      
      const response = await fetch(`/api/contracts/registry?action=search&${params}`)
      const data = await response.json()
      
      if (data.success) {
        setContracts(data.data.contracts)
        setPagination({
          total: data.data.total,
          page: data.data.page,
          limit: data.data.limit,
          totalPages: data.data.totalPages
        })
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setSearching(false)
      setLoading(false)
    }
  }

  const fetchFeaturedContracts = async () => {
    try {
      const response = await fetch('/api/contracts/registry?action=getFeatured')
      const data = await response.json()
      
      if (data.success) {
        setFeaturedContracts(data.data)
      }
    } catch (error) {
      console.error('Error fetching featured contracts:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/contracts/registry?action=getCategories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    fetchContracts({ ...filters, page: 1 })
  }

  const handleFilterChange = (key: keyof RegistryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
    fetchContracts({ ...filters, page })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500'
      case 'deploying':
        return 'bg-yellow-500'
      case 'inactive':
      case 'frozen':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'erc20':
        return 'bg-blue-500'
      case 'erc721':
        return 'bg-purple-500'
      case 'erc1155':
        return 'bg-indigo-500'
      case 'defi':
        return 'bg-green-500'
      case 'nft_marketplace':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatNumber = (num: number | string) => {
    const number = typeof num === 'string' ? parseFloat(num) : num
    return number.toLocaleString()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading contract registry...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Smart Contract Registry</h1>
            <p className="text-muted-foreground mt-2">
              Discover and explore smart contracts on the KALDRIX blockchain
            </p>
          </div>
          <Badge variant="outline" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Phase 6: Blockchain Integration</span>
          </Badge>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Contracts</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Search Contracts</span>
                </CardTitle>
                <CardDescription>
                  Search through the global smart contract registry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, address, or description..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={searching}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label>Contract Type</Label>
                      <Select 
                        value={filters.type || ''} 
                        onValueChange={(value) => handleFilterChange('type', value || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All types</SelectItem>
                          <SelectItem value="ERC20">ERC20</SelectItem>
                          <SelectItem value="ERC721">ERC721</SelectItem>
                          <SelectItem value="ERC1155">ERC1155</SelectItem>
                          <SelectItem value="DEFI">DeFi</SelectItem>
                          <SelectItem value="NFT_MARKETPLACE">NFT Marketplace</SelectItem>
                          <SelectItem value="GOVERNANCE">Governance</SelectItem>
                          <SelectItem value="UTILITY">Utility</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={filters.status || ''} 
                        onValueChange={(value) => handleFilterChange('status', value || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="DEPLOYING">Deploying</SelectItem>
                          <SelectItem value="FROZEN">Frozen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={filters.category || ''} 
                        onValueChange={(value) => handleFilterChange('category', value || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <Select 
                        value={filters.sortBy || 'createdAt'} 
                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">Date Created</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="usageCount">Usage Count</SelectItem>
                          <SelectItem value="popularityScore">Popularity</SelectItem>
                          <SelectItem value="gasUsed">Gas Used</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sort Order</Label>
                      <Select 
                        value={filters.sortOrder || 'desc'} 
                        onValueChange={(value) => handleFilterChange('sortOrder', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Descending</SelectItem>
                          <SelectItem value="asc">Ascending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setFilters({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' })
                          setTimeout(() => fetchContracts({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }), 100)
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {pagination.total} contracts (Page {pagination.page} of {pagination.totalPages})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p>Loading contracts...</p>
                  </div>
                ) : contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No contracts found matching your search criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <Card key={contract.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold">{contract.contract.name}</h3>
                                <Badge variant="outline" className={`text-white ${getTypeColor(contract.contract.type)}`}>
                                  {contract.contract.type}
                                </Badge>
                                <Badge variant="outline" className={`text-white ${getStatusColor(contract.contract.status)}`}>
                                  {contract.contract.status}
                                </Badge>
                                {contract.registry.verified && (
                                  <Badge variant="outline" className="text-white bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                {contract.registry.featured && (
                                  <Badge variant="outline" className="text-white bg-yellow-500">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                  <Hash className="h-4 w-4" />
                                  <span>{formatAddress(contract.contract.address)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Tag className="h-4 w-4" />
                                  <span>v{contract.contract.version}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4" />
                                  <span>{contract.contract.creator}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <TrendingUp className="h-4 w-4" />
                                  <span>{formatNumber(contract.registry.usageCount)} uses</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Zap className="h-4 w-4" />
                                  <span>{formatNumber(contract.registry.totalGasUsed)} gas</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(contract.contract.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {contract.contract.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {contract.contract.description}
                                </p>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                      <span>{contract.contract.name}</span>
                                      <Badge variant="outline" className={`text-white ${getTypeColor(contract.contract.type)}`}>
                                        {contract.contract.type}
                                      </Badge>
                                    </DialogTitle>
                                    <DialogDescription>
                                      Contract details and information
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Address</Label>
                                        <p className="text-sm text-muted-foreground font-mono">
                                          {contract.contract.address}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Version</Label>
                                        <p className="text-sm text-muted-foreground">
                                          {contract.contract.version}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <Badge variant="outline" className={`text-white ${getStatusColor(contract.contract.status)}`}>
                                          {contract.contract.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Creator</Label>
                                        <p className="text-sm text-muted-foreground">
                                          {contract.contract.creator}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Registry Info */}
                                    <div>
                                      <h4 className="font-medium mb-3">Registry Information</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Verification Status</Label>
                                          {contract.registry.verified ? (
                                            <div className="flex items-center space-x-2">
                                              <CheckCircle className="h-4 w-4 text-green-500" />
                                              <span className="text-sm">Verified by {contract.registry.verifiedBy}</span>
                                            </div>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">Not verified</span>
                                          )}
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Usage Count</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {formatNumber(contract.registry.usageCount)} times
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Total Gas Used</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {formatNumber(contract.registry.totalGasUsed)}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Popularity Score</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {contract.registry.popularityScore.toFixed(2)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Description */}
                                    {contract.contract.description && (
                                      <div>
                                        <Label className="text-sm font-medium">Description</Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {contract.contract.description}
                                        </p>
                                      </div>
                                    )}

                                    {/* Tags */}
                                    {contract.contract.tags && contract.contract.tags.length > 0 && (
                                      <div>
                                        <Label className="text-sm font-medium">Tags</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {contract.contract.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Links */}
                                    <div className="flex space-x-4">
                                      {contract.registry.website && (
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={contract.registry.website} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Website
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {contract.registry.website && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={contract.registry.website} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Website
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                        >
                          Previous
                        </Button>
                        
                        <div className="flex space-x-1">
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let page = i + 1
                            if (pagination.page > 3) {
                              page = pagination.page - 3 + i
                            }
                            if (page > pagination.totalPages) return null
                            
                            return (
                              <Button
                                key={page}
                                variant={page === pagination.page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            )
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Featured Contracts</span>
                </CardTitle>
                <CardDescription>
                  Discover the most popular and verified smart contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {featuredContracts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No featured contracts available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredContracts.map((contract) => (
                      <Card key={contract.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{contract.contract.name}</CardTitle>
                            <Star className="h-5 w-5 text-yellow-500" />
                          </div>
                          <CardDescription className="line-clamp-2">
                            {contract.contract.description || 'No description available'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Type</span>
                              <Badge variant="outline" className={`text-white ${getTypeColor(contract.contract.type)}`}>
                                {contract.contract.type}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Usage</span>
                              <span>{formatNumber(contract.registry.usageCount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Popularity</span>
                              <span>{contract.registry.popularityScore.toFixed(2)}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => setSelectedContract(contract)}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="h-5 w-5" />
                  <span>Contract Categories</span>
                </CardTitle>
                <CardDescription>
                  Browse contracts by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No categories available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <Card 
                        key={category} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          handleFilterChange('category', category)
                          setShowFilters(false)
                          setTimeout(() => {
                            fetchContracts({ ...filters, category, page: 1 })
                          }, 100)
                        }}
                      >
                        <CardContent className="p-6 text-center">
                          <Tag className="h-8 w-8 mx-auto mb-4 text-primary" />
                          <h3 className="font-semibold">{category}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Click to view contracts
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}