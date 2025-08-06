'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTokenTracker } from '@/hooks/useTokenTracker'
import { TrendingUp, RefreshCw, AlertCircle, Coins, Users, ArrowUpRight, ArrowDownRight, DollarSign, BarChart3 } from 'lucide-react'

export default function TokenTracker() {
  const { tokenInfo, holders, transfers, stats, loading, error, refetch } = useTokenTracker()
  const [sortBy, setSortBy] = useState<'balance' | 'percentage'>('balance')
  const [transferFilter, setTransferFilter] = useState<'all' | 'transfer' | 'mint' | 'burn' | 'stake'>('all')

  const filteredTransfers = useMemo(() => {
    if (transferFilter === 'all') return transfers
    return transfers.filter(t => t.type === transferFilter)
  }, [transfers, transferFilter])

  const sortedHolders = useMemo(() => {
    return [...holders].sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return BigInt(b.balance) > BigInt(a.balance) ? 1 : -1
        case 'percentage':
          return b.percentage - a.percentage
        default:
          return 0
      }
    })
  }, [holders, sortBy])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatValue = (value: string, decimals: number = 18) => {
    const num = parseFloat(value) / Math.pow(10, decimals)
    return num.toFixed(2)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTransferTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer': return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      case 'mint': return <ArrowDownRight className="h-4 w-4 text-green-600" />
      case 'burn': return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'stake': return <BarChart3 className="h-4 w-4 text-purple-600" />
      case 'unstake': return <BarChart3 className="h-4 w-4 text-orange-600" />
      default: return <ArrowUpRight className="h-4 w-4 text-gray-600" />
    }
  }

  const getHolderTypeColor = (type: string) => {
    switch (type) {
      case 'validator': return 'bg-blue-100 text-blue-800'
      case 'exchange': return 'bg-green-100 text-green-800'
      case 'wallet': return 'bg-purple-100 text-purple-800'
      case 'contract': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Tracker
          </CardTitle>
          <CardDescription>
            Track KALD token metrics and holder information
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
            <Coins className="h-5 w-5" />
            Token Tracker
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
              <Coins className="h-5 w-5" />
              Token Tracker
            </CardTitle>
            <CardDescription>
              Track KALD token metrics and holder information
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Token Overview */}
          {tokenInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${tokenInfo.price.usd.toFixed(2)}</div>
                  <div className={`text-sm ${tokenInfo.price.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tokenInfo.price.change24h >= 0 ? '+' : ''}{tokenInfo.price.change24h.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Market Cap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${formatNumber(tokenInfo.price.marketCap)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Volume: ${formatNumber(tokenInfo.price.volume24h)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Supply
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(tokenInfo.circulatingSupply)}M
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Circulating Supply
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Holders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(stats.totalHolders)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.totalTransfers24h} transfers today
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.stakingAPY.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Staking APY</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.stakingRatio.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Staked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatValue(stats.totalStaked)}M</div>
              <div className="text-sm text-muted-foreground">Total Staked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.priceChange24h >= 0 ? '+' : ''}{stats.priceChange24h.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">24h Change</div>
            </div>
          </div>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="holders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="holders">Top Holders</TabsTrigger>
              <TabsTrigger value="transfers">Recent Transfers</TabsTrigger>
              <TabsTrigger value="supply">Supply Distribution</TabsTrigger>
            </TabsList>

            <TabsContent value="holders" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Top Token Holders</h3>
                <Select value={sortBy} onValueChange={(value: 'balance' | 'percentage') => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedHolders.map((holder, index) => (
                  <div key={holder.address} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold">#{index + 1}</div>
                      <div>
                        <div className="font-mono text-sm">{formatAddress(holder.address)}</div>
                        <Badge className={getHolderTypeColor(holder.type)}>
                          {holder.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="font-semibold">{formatValue(holder.balance)} KALD</div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{holder.percentage.toFixed(2)}%</div>
                        <div className="text-xs text-muted-foreground">Share</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="transfers" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Token Transfers</h3>
                <Select value={transferFilter} onValueChange={(value: 'all' | 'transfer' | 'mint' | 'burn' | 'stake') => setTransferFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="mint">Mint</SelectItem>
                    <SelectItem value="burn">Burn</SelectItem>
                    <SelectItem value="stake">Stake</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTransfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getTransferTypeIcon(transfer.type)}
                      <div>
                        <div className="font-mono text-sm">{transfer.hash.slice(0, 16)}...</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transfer.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="font-semibold">{formatValue(transfer.value)} KALD</div>
                        <div className="text-xs text-muted-foreground">Value</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs">{formatAddress(transfer.from)}</div>
                        <div className="text-xs text-muted-foreground">From</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs">{formatAddress(transfer.to)}</div>
                        <div className="text-xs text-muted-foreground">To</div>
                      </div>
                      <Badge className={
                        transfer.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                        transfer.type === 'mint' ? 'bg-green-100 text-green-800' :
                        transfer.type === 'burn' ? 'bg-red-100 text-red-800' :
                        transfer.type === 'stake' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }>
                        {transfer.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="supply" className="space-y-4">
              <h3 className="text-lg font-semibold">Supply Distribution</h3>
              {tokenInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Supply Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Circulating Supply</span>
                          <span className="font-semibold">{formatValue(tokenInfo.circulatingSupply)} KALD</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Staked Supply</span>
                          <span className="font-semibold">{formatValue(tokenInfo.stakedSupply)} KALD</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Burned Supply</span>
                          <span className="font-semibold">{formatValue(tokenInfo.burnedSupply)} KALD</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Supply</span>
                          <span className="font-semibold">{formatValue(tokenInfo.totalSupply)} KALD</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Staking Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Staking APY</span>
                          <span className="font-semibold">{stats.stakingAPY.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Staking Ratio</span>
                          <span className="font-semibold">{stats.stakingRatio.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Staked</span>
                          <span className="font-semibold">{formatValue(stats.totalStaked)} KALD</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Stakers</span>
                          <span className="font-semibold">{formatNumber(stats.totalHolders)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}