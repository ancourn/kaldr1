'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBundleStats } from '@/hooks/useBundleStats'
import { Clock, RefreshCw, AlertCircle, Package, TrendingUp, DollarSign, Zap } from 'lucide-react'

interface TimelineEvent {
  timestamp: string
  bundleId: string
  type: 'created' | 'confirmed' | 'failed'
  details: string
  value?: string
}

export default function BundleTimeline() {
  const { bundles, stats, timeline, loading, error, refetch } = useBundleStats()
  const [sortBy, setSortBy] = useState<'timestamp' | 'value' | 'transactions'>('timestamp')
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'failed'>('all')

  // Generate timeline events from bundles
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = []
    
    bundles.forEach(bundle => {
      events.push({
        timestamp: bundle.timestamp,
        bundleId: bundle.id,
        type: 'created',
        details: `Bundle created with ${bundle.transactionCount} transactions`,
        value: bundle.totalValue
      })
      
      if (bundle.status === 'confirmed') {
        events.push({
          timestamp: new Date(new Date(bundle.timestamp).getTime() + bundle.confirmations * 800).toISOString(),
          bundleId: bundle.id,
          type: 'confirmed',
          details: `Bundle confirmed after ${bundle.confirmations} confirmations`,
          value: bundle.fees
        })
      } else if (bundle.status === 'failed') {
        events.push({
          timestamp: new Date(new Date(bundle.timestamp).getTime() + 5000).toISOString(),
          bundleId: bundle.id,
          type: 'failed',
          details: 'Bundle processing failed'
        })
      }
    })
    
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [bundles])

  // Filter and sort bundles
  const filteredBundles = useMemo(() => {
    let filtered = bundles
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(bundle => bundle.status === filterStatus)
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'value':
          return BigInt(b.totalValue) > BigInt(a.totalValue) ? 1 : -1
        case 'transactions':
          return b.transactionCount - a.transactionCount
        default:
          return 0
      }
    })
  }, [bundles, filterStatus, sortBy])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'created': return 'bg-blue-500'
      case 'confirmed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatValue = (value: string, decimals: number = 18) => {
    const num = parseFloat(value) / Math.pow(10, decimals)
    return num.toFixed(2)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bundle Timeline
          </CardTitle>
          <CardDescription>
            Track bundle processing and confirmation timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bundle Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Bundle Timeline
            </CardTitle>
            <CardDescription>
              Track bundle processing and confirmation timeline
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: 'timestamp' | 'value' | 'transactions') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Time</SelectItem>
                <SelectItem value="value">Value</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value: 'all' | 'confirmed' | 'pending' | 'failed') => setFilterStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalBundles}</div>
              <div className="text-sm text-muted-foreground">Total Bundles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.confirmedBundles}</div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.averageTransactionsPerBundle.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Timeline Events</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
              <div className="space-y-4">
                {timelineEvents.slice(0, 10).map((event, index) => (
                  <div key={index} className="relative flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)} relative z-10`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={
                              event.type === 'created' ? 'bg-blue-100 text-blue-800' :
                              event.type === 'confirmed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {event.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {event.value && (
                            <div className="text-sm font-medium">
                              {formatValue(event.value)} KALD
                            </div>
                          )}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Bundle {event.bundleId}:</span> {event.details}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bundle Processing Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Bundle Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.averageBundleSize / 1024).toFixed(1)} KB
                </div>
                <div className="text-sm text-muted-foreground">Average Size</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Processing Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.bundleProcessingTime.toFixed(1)}s
                </div>
                <div className="text-sm text-muted-foreground">Average Time</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Fees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatValue(stats.totalFeesCollected)} KALD
                </div>
                <div className="text-sm text-muted-foreground">Collected</div>
              </CardContent>
            </Card>
          </div>

          {/* Bundle List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bundle List</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredBundles.map((bundle) => (
                <div key={bundle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(bundle.status)}`} />
                    <div>
                      <div className="font-mono text-sm">{bundle.bundleHash.slice(0, 16)}...</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(bundle.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="font-semibold">{bundle.transactionCount}</div>
                      <div className="text-xs text-muted-foreground">Transactions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatValue(bundle.totalValue)} KALD</div>
                      <div className="text-xs text-muted-foreground">Value</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{bundle.confirmations}</div>
                      <div className="text-xs text-muted-foreground">Confirmations</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatValue(bundle.fees)} KALD</div>
                      <div className="text-xs text-muted-foreground">Fees</div>
                    </div>
                    <Badge className={
                      bundle.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      bundle.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {bundle.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}