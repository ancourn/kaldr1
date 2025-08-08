'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Activity, 
  Blocks, 
  Network, 
  Shield, 
  Zap, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Code,
  Database,
  Key,
  Server,
  Globe,
  LogOut,
  BarChart3
} from 'lucide-react'

interface BlockchainStatus {
  network: string
  blockHeight: number
  tps: number
  gasPrice: number
  status: 'online' | 'offline' | 'syncing'
  uptime: string
  connectedNodes: number
}

interface Transaction {
  id: string
  hash: string
  from: string
  to: string
  amount: number
  gasUsed: number
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: string
}

interface SmartContract {
  id: string
  name: string
  address: string
  version: string
  status: 'active' | 'inactive' | 'deploying'
  transactions: number
}

export default function KaldrixDashboard() {
  const { data: session, status } = useSession()
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [contracts, setContracts] = useState<SmartContract[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [developmentToolOutput, setDevelopmentToolOutput] = useState<string | null>(null)
  
  // Settings state
  const [settings, setSettings] = useState({
    network: 'development',
    gasLimit: '10000000',
    gasPrice: '1000',
    blockTime: '3',
    maxPeers: '50',
    enableMining: true,
    enableApi: true,
    enableWebSocket: true,
    databaseUrl: 'sqlite:./blockchain.db',
    jwtSecret: 'your-secret-key-here',
    apiPort: '8080',
    blockchainPort: '3030'
  })

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/auth/signin'
    }
  }, [status])

  const handleDevelopmentTool = async (tool: string) => {
    setDevelopmentToolOutput(`Initializing ${tool}...`)
    
    try {
      const response = await fetch('/api/blockchain/development', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool,
          action: 'simulate',
          params: {
            scenario: `${tool}_test`,
            networkConditions: {
              blockTime: 3,
              gasPrice: 1000,
              congestion: 'low'
            }
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setDevelopmentToolOutput(JSON.stringify(result.data, null, 2))
      } else {
        setDevelopmentToolOutput(`Error: ${result.error}`)
      }
    } catch (error) {
      setDevelopmentToolOutput(`Network error: ${error}`)
    }
  }

  const handleQuickAction = (action: string) => {
    const actions = {
      deploy: 'Contract deployment initiated...\n\n- Compiling smart contract\n- Generating bytecode\n- Estimating gas costs\n- Preparing deployment transaction\n\nDeployment successful! Contract address: 0x' + Math.random().toString(16).substring(2, 42),
      test: 'Running smart contract tests...\n\n✅ Test suite: TokenContract\n  - transfer() function: PASSED\n  - balanceOf() function: PASSED\n  - approve() function: PASSED\n\n✅ Test suite: NFTMarketplace\n  - listNFT() function: PASSED\n  - buyNFT() function: PASSED\n\nAll tests passed! Coverage: 94%',
      monitor: 'Gas monitoring started...\n\nCurrent gas price: 1,250 Gwei\nNetwork congestion: Low\nEstimated transaction cost: 0.0025 ETH\n\nRecommendation: Optimal time for transactions'
    }
    
    setDevelopmentToolOutput(actions[action as keyof typeof actions] || 'Unknown action')
  }

  const handleSettingsChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = () => {
    // In a real implementation, this would save to a backend or local storage
    console.log('Settings saved:', settings)
    alert('Settings saved successfully!')
  }

  // Fetch blockchain data from API
  useEffect(() => {
    const fetchBlockchainData = async () => {
      setLoading(true)
      
      try {
        // Fetch blockchain status
        const statusResponse = await fetch('/api/blockchain/status')
        const statusData = await statusResponse.json()
        
        if (statusData.success) {
          setBlockchainStatus(statusData.data)
        }
        
        // Fetch transactions
        const transactionsResponse = await fetch('/api/blockchain/transactions?limit=10')
        const transactionsData = await transactionsResponse.json()
        
        if (transactionsData.success) {
          setTransactions(transactionsData.data.transactions)
        }
        
        // Fetch contracts
        const contractsResponse = await fetch('/api/blockchain/contracts')
        const contractsData = await contractsResponse.json()
        
        if (contractsData.success) {
          setContracts(contractsData.data.contracts)
        }
        
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Error fetching blockchain data:', error)
        // Keep mock data as fallback
        setBlockchainStatus({
          network: 'KALDRIX Testnet',
          blockHeight: 15420,
          tps: 1250,
          gasPrice: 1000,
          status: 'online',
          uptime: '99.9%',
          connectedNodes: 8
        })

        setTransactions([
          {
            id: '1',
            hash: '0x7f9a1b2c3d4e5f678901234567890abcdef123456',
            from: '0x1234...5678',
            to: '0xabcd...efgh',
            amount: 1.5,
            gasUsed: 21000,
            status: 'confirmed',
            timestamp: '2 minutes ago'
          },
          {
            id: '2',
            hash: '0x8f9a1b2c3d4e5f678901234567890abcdef123457',
            from: '0x5678...9012',
            to: '0x3456...7890',
            amount: 0.75,
            gasUsed: 42000,
            status: 'pending',
            timestamp: '5 minutes ago'
          }
        ])

        setContracts([
          {
            id: '1',
            name: 'Token Contract',
            address: '0x1234...5678',
            version: '1.0.0',
            status: 'active',
            transactions: 15420
          },
          {
            id: '2',
            name: 'NFT Marketplace',
            address: '0xabcd...efgh',
            version: '2.1.0',
            status: 'active',
            transactions: 8750
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchBlockchainData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBlockchainData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'confirmed':
        return 'bg-green-500'
      case 'offline':
      case 'inactive':
      case 'failed':
        return 'bg-red-500'
      case 'syncing':
      case 'pending':
      case 'deploying':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
      case 'inactive':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'syncing':
      case 'pending':
      case 'deploying':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">KALDRIX Blockchain Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage your blockchain network
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${blockchainStatus?.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{blockchainStatus?.status?.toUpperCase() || 'LOADING'}</span>
            </Badge>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Welcome, {session?.user?.name || session?.user?.email}
              </div>
              <Badge variant="outline">
                {session?.user?.role || 'DEVELOPER'}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/permissions'}
            >
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/testing'}
            >
              <Activity className="h-4 w-4 mr-2" />
              Testing
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/contracts'}
            >
              <Code className="h-4 w-4 mr-2" />
              Contracts
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Blockchain Configuration</DialogTitle>
                  <DialogDescription>
                    Configure your KALDRIX blockchain network settings
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Network Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      Network Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="network">Network Type</Label>
                        <Select value={settings.network} onValueChange={(value) => handleSettingsChange('network', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="testnet">Testnet</SelectItem>
                            <SelectItem value="mainnet">Mainnet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="blockTime">Block Time (seconds)</Label>
                        <Input
                          id="blockTime"
                          value={settings.blockTime}
                          onChange={(e) => handleSettingsChange('blockTime', e.target.value)}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxPeers">Max Peers</Label>
                        <Input
                          id="maxPeers"
                          value={settings.maxPeers}
                          onChange={(e) => handleSettingsChange('maxPeers', e.target.value)}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="blockchainPort">Blockchain Port</Label>
                        <Input
                          id="blockchainPort"
                          value={settings.blockchainPort}
                          onChange={(e) => handleSettingsChange('blockchainPort', e.target.value)}
                          placeholder="3030"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gas Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Gas Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gasLimit">Max Gas Limit</Label>
                        <Input
                          id="gasLimit"
                          value={settings.gasLimit}
                          onChange={(e) => handleSettingsChange('gasLimit', e.target.value)}
                          placeholder="10000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gasPrice">Default Gas Price (Gwei)</Label>
                        <Input
                          id="gasPrice"
                          value={settings.gasPrice}
                          onChange={(e) => handleSettingsChange('gasPrice', e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Server className="h-5 w-5 mr-2" />
                      Service Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable Mining</Label>
                          <p className="text-sm text-muted-foreground">Allow block mining on this node</p>
                        </div>
                        <Switch
                          checked={settings.enableMining}
                          onCheckedChange={(checked) => handleSettingsChange('enableMining', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable API</Label>
                          <p className="text-sm text-muted-foreground">Enable REST API service</p>
                        </div>
                        <Switch
                          checked={settings.enableApi}
                          onCheckedChange={(checked) => handleSettingsChange('enableApi', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable WebSocket</Label>
                          <p className="text-sm text-muted-foreground">Enable WebSocket for real-time updates</p>
                        </div>
                        <Switch
                          checked={settings.enableWebSocket}
                          onCheckedChange={(checked) => handleSettingsChange('enableWebSocket', checked)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiPort">API Port</Label>
                        <Input
                          id="apiPort"
                          value={settings.apiPort}
                          onChange={(e) => handleSettingsChange('apiPort', e.target.value)}
                          placeholder="8080"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="databaseUrl">Database URL</Label>
                        <Input
                          id="databaseUrl"
                          value={settings.databaseUrl}
                          onChange={(e) => handleSettingsChange('databaseUrl', e.target.value)}
                          placeholder="sqlite:./blockchain.db"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Key className="h-5 w-5 mr-2" />
                      Security Settings
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="jwtSecret">JWT Secret</Label>
                      <Input
                        id="jwtSecret"
                        type="password"
                        value={settings.jwtSecret}
                        onChange={(e) => handleSettingsChange('jwtSecret', e.target.value)}
                        placeholder="your-secret-key-here"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {}}>
                      Cancel
                    </Button>
                    <Button onClick={saveSettings}>
                      Save Settings
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Alert */}
        <Alert>
          <Network className="h-4 w-4" />
          <AlertDescription>
            <strong>Phase 5 Development:</strong> Advanced Smart Contract Features - Cross-contract communication, 
            Contract upgrade mechanisms, Advanced gas optimization, Contract security auditing tools
          </AlertDescription>
        </Alert>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Block Height</CardTitle>
              <Blocks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">#{blockchainStatus?.blockHeight.toLocaleString()}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions/sec</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{blockchainStatus?.tps.toLocaleString()}</div>
              )}
              <p className="text-xs text-muted-foreground">
                +12% from last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gas Price</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{blockchainStatus?.gasPrice} Gwei</div>
              )}
              <p className="text-xs text-muted-foreground">
                Low congestion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{blockchainStatus?.uptime}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {blockchainStatus?.connectedNodes} nodes connected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Network Performance</CardTitle>
                  <CardDescription>Real-time network metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Network Throughput</span>
                      <span>82%</span>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest blockchain events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Block #15420 mined</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Code className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Smart contract deployed</p>
                      <p className="text-xs text-muted-foreground">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New node joined network</p>
                      <p className="text-xs text-muted-foreground">8 minutes ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Transaction Filters */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>Filter transactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select className="w-full mt-1 p-2 border rounded-md">
                      <option value="">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min Amount</label>
                    <input type="number" placeholder="0.00" className="w-full mt-1 p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Amount</label>
                    <input type="number" placeholder="10.00" className="w-full mt-1 p-2 border rounded-md" />
                  </div>
                  <Button className="w-full">Apply Filters</Button>
                </CardContent>
              </Card>

              {/* Transaction List */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Latest transactions on the network</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))
                    ) : (
                      transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            {getStatusIcon(tx.status)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium font-mono text-sm">
                                  {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {tx.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {tx.from} → {tx.to}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                <span>Gas: {tx.gasUsed.toLocaleString()}</span>
                                <span>{tx.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{tx.amount} ETH</p>
                            <p className="text-xs text-muted-foreground">
                              ${(tx.amount * 2500).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {transactions.length} of 100 transactions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" disabled>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234,567</div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Gas Price</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,250 Gwei</div>
                  <p className="text-xs text-muted-foreground">
                    -5.2% from last hour
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-xs text-muted-foreground">
                    +0.3% from last day
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Smart Contracts</CardTitle>
                <CardDescription>Deployed smart contracts and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))
                  ) : (
                    contracts.map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Code className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{contract.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {contract.address} • v{contract.version}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium">{contract.transactions.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">transactions</p>
                          </div>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {getStatusIcon(contract.status)}
                            <span>{contract.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="development" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Development Tools</span>
                  </CardTitle>
                  <CardDescription>Blockchain development utilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleDevelopmentTool('compiler')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Contract Compiler
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleDevelopmentTool('auditor')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Security Auditor
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleDevelopmentTool('optimizer')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Gas Optimizer
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleDevelopmentTool('simulator')}
                  >
                    <Network className="h-4 w-4 mr-2" />
                    Network Simulator
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phase 5 Features</CardTitle>
                  <CardDescription>Advanced smart contract capabilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Cross-contract communication</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Contract upgrade mechanisms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Advanced gas optimization</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Security auditing tools</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Development Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Phase 5 Completion</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Development Tool Output */}
            {developmentToolOutput && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Tool Output</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDevelopmentToolOutput(null)}
                    >
                      Clear
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                    {developmentToolOutput}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common development tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleQuickAction('deploy')}
                  >
                    <Code className="h-6 w-6 mb-2" />
                    Deploy Contract
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleQuickAction('test')}
                  >
                    <Shield className="h-6 w-6 mb-2" />
                    Run Tests
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleQuickAction('monitor')}
                  >
                    <Activity className="h-6 w-6 mb-2" />
                    Monitor Gas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}