'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, AlertCircle, Info, Coins, Lock, Unlock, Calendar, Percent } from 'lucide-react'

interface StakingPosition {
  id: string
  amount: string
  validator: string
  startTime: string
  endTime?: string
  rewards: string
  apy: number
  status: 'active' | 'completed' | 'unstaking'
}

interface ValidatorInfo {
  id: string
  address: string
  name: string
  commission: number
  uptime: number
  totalStaked: string
  apy: number
  status: 'active' | 'inactive'
}

export default function StakingDashboard() {
  const [stakeAmount, setStakeAmount] = useState<string>('')
  const [selectedValidator, setSelectedValidator] = useState<string>('')
  const [stakingPeriod, setStakingPeriod] = useState<string>('30')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Mock staking positions
  const stakingPositions: StakingPosition[] = [
    {
      id: 'pos_001',
      amount: '1000000000000000000000',
      validator: 'val_001',
      startTime: '2024-01-01T00:00:00Z',
      rewards: '50000000000000000000',
      apy: 15.5,
      status: 'active'
    },
    {
      id: 'pos_002',
      amount: '500000000000000000000',
      validator: 'val_002',
      startTime: '2023-12-15T00:00:00Z',
      endTime: '2024-01-15T00:00:00Z',
      rewards: '25000000000000000000',
      apy: 14.2,
      status: 'completed'
    }
  ]

  // Mock validators
  const validators: ValidatorInfo[] = [
    {
      id: 'val_001',
      address: '0x1234567890123456789012345678901234567890',
      name: 'Validator Alpha',
      commission: 5,
      uptime: 99.8,
      totalStaked: '10000000000000000000000',
      apy: 15.5,
      status: 'active'
    },
    {
      id: 'val_002',
      address: '0x2345678901234567890123456789012345678901',
      name: 'Validator Beta',
      commission: 7,
      uptime: 99.5,
      totalStaked: '8000000000000000000000',
      apy: 14.2,
      status: 'active'
    },
    {
      id: 'val_003',
      address: '0x3456789012345678901234567890123456789012',
      name: 'Validator Gamma',
      commission: 3,
      uptime: 99.9,
      totalStaked: '12000000000000000000000',
      apy: 16.8,
      status: 'active'
    }
  ]

  // Mock staking stats
  const stakingStats = {
    totalStaked: '1500000000000000000000',
    totalRewards: '75000000000000000000',
    averageApy: 15.5,
    activePositions: 1,
    completedPositions: 1
  }

  const stakeTokens = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!selectedValidator) {
      setError('Please select a validator')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simulate staking operation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset form after successful staking
      setStakeAmount('')
      setSelectedValidator('')
      
      // Show success message (in real app, this would be a toast)
      alert('Staking successful!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Staking failed')
    } finally {
      setLoading(false)
    }
  }

  const unstakeTokens = async (positionId: string) => {
    setLoading(true)
    setError(null)

    try {
      // Simulate unstaking operation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success message
      alert('Unstaking initiated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unstaking failed')
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: string, decimals: number = 18) => {
    const num = parseFloat(value) / Math.pow(10, decimals)
    return num.toFixed(4)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const selectedValidatorData = validators.find(v => v.id === selectedValidator)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Staking Dashboard
          </CardTitle>
          <CardDescription>
            Stake your KALD tokens to earn rewards and secure the network
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Staking Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Total Staked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(stakingStats.totalStaked)} KALD</div>
            <div className="text-sm text-muted-foreground">Across all positions</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(stakingStats.totalRewards)} KALD</div>
            <div className="text-sm text-muted-foreground">Earned so far</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Average APY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stakingStats.averageApy.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Annual yield</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stakingStats.activePositions}</div>
            <div className="text-sm text-muted-foreground">
              {stakingStats.completedPositions} completed
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stake" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
          <TabsTrigger value="positions">My Positions</TabsTrigger>
          <TabsTrigger value="validators">Validators</TabsTrigger>
        </TabsList>

        <TabsContent value="stake">
          <Card>
            <CardHeader>
              <CardTitle>Stake KALD Tokens</CardTitle>
              <CardDescription>
                Delegate your tokens to validators and earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount to Stake</label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground">
                    Available: 1,000.00 KALD
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Validator</label>
                  <Select value={selectedValidator} onValueChange={setSelectedValidator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a validator" />
                    </SelectTrigger>
                    <SelectContent>
                      {validators.map((validator) => (
                        <SelectItem key={validator.id} value={validator.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{validator.name}</span>
                            <Badge className="ml-2">{validator.apy.toFixed(1)}% APY</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Staking Period</label>
                  <Select value={stakingPeriod} onValueChange={setStakingPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Staking Preview */}
                {selectedValidatorData && stakeAmount && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <h4 className="font-semibold">Staking Preview</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Validator:</span>
                        <div className="font-medium">{selectedValidatorData.name}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">APY:</span>
                        <div className="font-medium">{selectedValidatorData.apy.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Commission:</span>
                        <div className="font-medium">{selectedValidatorData.commission}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <div className="font-medium">{selectedValidatorData.uptime.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Estimated Annual Rewards:</span>
                        <span className="font-semibold">
                          {(parseFloat(stakeAmount) * selectedValidatorData.apy / 100).toFixed(4)} KALD
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={stakeTokens} 
                  disabled={loading || !stakeAmount || !selectedValidator}
                  className="w-full"
                >
                  {loading ? 'Staking...' : `Stake ${stakeAmount || '0'} KALD`}
                </Button>

                {error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This is a demo interface. In a real application, this would connect to actual staking contracts and handle token transfers, validator selection, and reward distribution.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>My Staking Positions</CardTitle>
              <CardDescription>
                View and manage your active staking positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stakingPositions.map((position) => (
                  <div key={position.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold">{formatValue(position.amount)} KALD</div>
                        <div className="text-sm text-muted-foreground">
                          {validators.find(v => v.id === position.validator)?.name || 'Unknown Validator'}
                        </div>
                      </div>
                      <Badge className={
                        position.status === 'active' ? 'bg-green-100 text-green-800' :
                        position.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {position.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">APY:</span>
                        <div className="font-medium">{position.apy.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rewards:</span>
                        <div className="font-medium">{formatValue(position.rewards)} KALD</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <div className="font-medium">{new Date(position.startTime).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">
                          {position.endTime ? 
                            `${Math.ceil((new Date(position.endTime).getTime() - new Date(position.startTime).getTime()) / (1000 * 60 * 60 * 24))} days` :
                            'Ongoing'
                          }
                        </div>
                      </div>
                    </div>

                    {position.status === 'active' && (
                      <div className="mt-4 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => unstakeTokens(position.id)}
                          disabled={loading}
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Unstake
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validators">
          <Card>
            <CardHeader>
              <CardTitle>Available Validators</CardTitle>
              <CardDescription>
                Choose a validator to delegate your tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validators.map((validator) => (
                  <div key={validator.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold">{validator.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {formatAddress(validator.address)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{validator.apy.toFixed(1)}% APY</div>
                        <Badge className={
                          validator.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {validator.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Commission:</span>
                        <div className="font-medium">{validator.commission}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <div className="font-medium">{validator.uptime.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Staked:</span>
                        <div className="font-medium">{formatValue(validator.totalStaked)} KALD</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-medium">{validator.status}</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground mb-2">Uptime</div>
                      <Progress value={validator.uptime} className="w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}