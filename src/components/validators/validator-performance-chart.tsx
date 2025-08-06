'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useValidators } from '@/hooks/useValidators'
import { TrendingUp, RefreshCw, AlertCircle, Shield, DollarSign, Users, Clock } from 'lucide-react'

interface PerformanceDataPoint {
  timestamp: string
  uptime: number
  rewards: string
  stake: string
  delegations: number
}

export default function ValidatorPerformanceChart() {
  const { validators, stats, loading, error, refetch } = useValidators()
  const [selectedValidator, setSelectedValidator] = useState<string>('')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  // Generate mock performance data for selected validator
  const performanceData = useMemo(() => {
    if (!selectedValidator) return []
    
    const validator = validators.find(v => v.id === selectedValidator)
    if (!validator) return []

    const dataPoints: PerformanceDataPoint[] = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      const variation = Math.random() * 0.1 - 0.05 // ±5% variation
      
      dataPoints.push({
        timestamp: timestamp.toISOString(),
        uptime: Math.max(95, Math.min(100, validator.uptime + variation * 100)),
        rewards: (BigInt(validator.rewards) * BigInt(100 + Math.floor(variation * 1000)) / BigInt(100)).toString(),
        stake: validator.stake,
        delegations: Math.max(1, validator.delegations + Math.floor(variation * 10))
      })
    }
    
    return dataPoints
  }, [selectedValidator, validators])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-yellow-500'
      case 'slashed': return 'bg-red-500'
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
            <TrendingUp className="h-5 w-5" />
            Validator Performance
          </CardTitle>
          <CardDescription>
            Monitor validator performance and rewards
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
            <TrendingUp className="h-5 w-5" />
            Validator Performance
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
              <TrendingUp className="h-5 w-5" />
              Validator Performance
            </CardTitle>
            <CardDescription>
              Monitor validator performance and rewards
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: '24h' | '7d' | '30d') => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
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
              <div className="text-2xl font-bold">{stats.totalValidators}</div>
              <div className="text-sm text-muted-foreground">Total Validators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.activeValidators}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.averageUptime.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatValue(stats.totalStaked)}</div>
              <div className="text-sm text-muted-foreground">Total Staked</div>
            </div>
          </div>

          {/* Validator Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Validator</label>
              <Select value={selectedValidator} onValueChange={setSelectedValidator}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a validator to view performance" />
                </SelectTrigger>
                <SelectContent>
                  {validators.map((validator) => (
                    <SelectItem key={validator.id} value={validator.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(validator.status)}`} />
                        <span>{formatAddress(validator.address)}</span>
                        <Badge variant="outline" className="text-xs">
                          {validator.commission}%
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Performance Chart */}
            {selectedValidator && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Uptime Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Uptime Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-end justify-between h-full">
                        {performanceData.slice(-12).map((point, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div 
                              className="w-6 bg-blue-500 rounded-t"
                              style={{ height: `${(point.uptime - 95) * 20}%` }}
                            />
                            <div className="text-xs mt-1">
                              {new Date(point.timestamp).getHours()}h
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-lg font-semibold">
                        {performanceData[performanceData.length - 1]?.uptime.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Current Uptime</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rewards Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Rewards Accumulation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-end justify-between h-full">
                        {performanceData.slice(-12).map((point, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div 
                              className="w-6 bg-green-500 rounded-t"
                              style={{ height: `${(parseFloat(formatValue(point.rewards)) / parseFloat(formatValue(performanceData[0]?.rewards || '0'))) * 80}%` }}
                            />
                            <div className="text-xs mt-1">
                              {new Date(point.timestamp).getHours()}h
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-lg font-semibold">
                        {formatValue(performanceData[performanceData.length - 1]?.rewards || '0')} KALD
                      </div>
                      <div className="text-sm text-muted-foreground">Total Rewards</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Validator List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">All Validators</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {validators.map((validator) => (
                  <div key={validator.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(validator.status)}`} />
                      <div>
                        <div className="font-mono text-sm">{formatAddress(validator.address)}</div>
                        <div className="text-xs text-muted-foreground">
                          Last seen: {new Date(validator.lastSeen).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="font-semibold">{formatValue(validator.stake)} KALD</div>
                        <div className="text-xs text-muted-foreground">Stake</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{validator.uptime.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Uptime</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{validator.commission}%</div>
                        <div className="text-xs text-muted-foreground">Commission</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{validator.delegations}</div>
                        <div className="text-xs text-muted-foreground">Delegations</div>
                      </div>
                      <Badge className={
                        validator.status === 'active' ? 'bg-green-100 text-green-800' :
                        validator.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {validator.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}