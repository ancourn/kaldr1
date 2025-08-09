'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Bridge,
  Menu,
  X,
  Home,
  ArrowRightLeft,
  Lock,
  Unlock,
  Shield,
  Activity,
  Search,
  Plus,
  Settings,
  Download,
  Upload,
  Database,
  FileText,
  TestTube,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Registry', href: '/registry', icon: Database },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Permissions', href: '/permissions', icon: Shield },
  { name: 'Advanced', href: '/dashboard', icon: BarChart3 },
  { name: 'Bridge', href: '/bridge', icon: Bridge },
]

const bridgeTransactions = [
  {
    id: '1',
    type: 'lock',
    from: '0x7f9a1b...',
    to: 'kaldrix1...',
    amount: '100.0',
    token: 'KALD',
    status: 'completed',
    hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    timestamp: '2024-01-15 14:30:25',
    confirmations: 12,
    gas_used: '45000'
  },
  {
    id: '2',
    type: 'unlock',
    from: 'kaldrix1...',
    to: '0x3b8c2d...',
    amount: '50.0',
    token: 'ETH',
    status: 'pending',
    hash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890a',
    timestamp: '2024-01-15 14:28:12',
    confirmations: 3,
    gas_used: '68000'
  },
  {
    id: '3',
    type: 'lock',
    from: '0x8c2d3e...',
    to: 'kaldrix1...',
    amount: '200.0',
    token: 'USDC',
    status: 'failed',
    hash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    timestamp: '2024-01-15 14:25:43',
    confirmations: 0,
    gas_used: '0',
    error: 'Insufficient gas'
  },
  {
    id: '4',
    type: 'unlock',
    from: 'kaldrix1...',
    to: '0x5d2b3e...',
    amount: '75.0',
    token: 'KALD',
    status: 'completed',
    hash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abc',
    timestamp: '2024-01-15 14:22:18',
    confirmations: 15,
    gas_used: '52000'
  }
]

const validators = [
  {
    id: '1',
    address: '0x1a4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
    name: 'Validator Alpha',
    stake: '100,000 KALD',
    status: 'active',
    uptime: '99.9%',
    rewards: '1,250 KALD'
  },
  {
    id: '2',
    address: '0x2b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f',
    name: 'Validator Beta',
    stake: '85,000 KALD',
    status: 'active',
    uptime: '99.8%',
    rewards: '1,080 KALD'
  },
  {
    id: '3',
    address: '0x3c6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
    name: 'Validator Gamma',
    stake: '75,000 KALD',
    status: 'active',
    uptime: '99.7%',
    rewards: '950 KALD'
  }
]

const supportedTokens = [
  { symbol: 'KALD', name: 'KALDRIX Token', decimals: 18, chain: 'both' },
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, chain: 'evm' },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, chain: 'evm' },
  { symbol: 'USDT', name: 'Tether', decimals: 6, chain: 'evm' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, chain: 'evm' },
]

const networkOptions = [
  { value: 'ethereum', label: 'Ethereum Mainnet' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'kaldrix', label: 'KALDRIX Network' },
]

export default function BridgePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('transfer')
  const [fromChain, setFromChain] = useState('ethereum')
  const [toChain, setToChain] = useState('kaldrix')
  const [selectedToken, setSelectedToken] = useState('KALD')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isTransferProcessing, setIsTransferProcessing] = useState(false)
  const [transferProgress, setTransferProgress] = useState(0)
  const pathname = usePathname()

  const handleChainSwap = () => {
    const temp = fromChain
    setFromChain(toChain)
    setToChain(temp)
  }

  const handleTransfer = async () => {
    setIsTransferProcessing(true)
    setTransferProgress(0)
    
    // Simulate transfer process
    const steps = [
      { progress: 20, message: 'Validating parameters...' },
      { progress: 40, message: 'Generating proof...' },
      { progress: 60, message: 'Submitting transaction...' },
      { progress: 80, message: 'Waiting for confirmations...' },
      { progress: 100, message: 'Transfer completed!' }
    ]
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTransferProgress(step.progress)
    }
    
    setIsTransferProcessing(false)
    setIsTransferDialogOpen(false)
    setAmount('')
    setRecipient('')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getChainName = (chain) => {
    const network = networkOptions.find(n => n.value === chain)
    return network ? network.label : chain
  }

  const getTokenInfo = (symbol) => {
    return supportedTokens.find(t => t.symbol === symbol)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold">KALDRIX</h1>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="p-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-6 py-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold">KALDRIX</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold">Cross-Chain Bridge</h1>
            </div>
          </div>
        </div>

        {/* Bridge content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Cross-Chain Bridge</h1>
              <p className="text-muted-foreground">
                Transfer assets securely between EVM chains and KALDRIX network
              </p>
            </div>

            {/* Bridge Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5" />
                      Token Transfer
                    </CardTitle>
                    <CardDescription>
                      Bridge tokens between EVM chains and KALDRIX network
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Chain Selection */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>From Chain</Label>
                        <Select value={fromChain} onValueChange={setFromChain}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {networkOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleChainSwap}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Label>To Chain</Label>
                        <Select value={toChain} onValueChange={setToChain}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {networkOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Token Selection */}
                    <div>
                      <Label>Token</Label>
                      <Select value={selectedToken} onValueChange={setSelectedToken}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedTokens
                            .filter(token => 
                              token.chain === 'both' || 
                              (fromChain !== 'kaldrix' && token.chain === 'evm') ||
                              (toChain !== 'kaldrix' && token.chain === 'evm')
                            )
                            .map((token) => (
                              <SelectItem key={token.symbol} value={token.symbol}>
                                {token.symbol} - {token.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount */}
                    <div>
                      <Label>Amount</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-sm text-muted-foreground">
                            {selectedToken}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recipient */}
                    <div>
                      <Label>Recipient Address</Label>
                      <Input
                        placeholder={toChain === 'kaldrix' ? 'kaldrix1...' : '0x...'}
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                      />
                    </div>

                    {/* Transfer Button */}
                    <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" disabled={!amount || !recipient}>
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Transfer Tokens
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Transfer</DialogTitle>
                          <DialogDescription>
                            Review the transfer details before confirming
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">From:</span>
                              <div className="font-medium">{getChainName(fromChain)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">To:</span>
                              <div className="font-medium">{getChainName(toChain)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Token:</span>
                              <div className="font-medium">{selectedToken}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <div className="font-medium">{amount} {selectedToken}</div>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Recipient:</span>
                            <div className="font-mono text-sm bg-muted p-2 rounded">
                              {recipient}
                            </div>
                          </div>
                          
                          {isTransferProcessing && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Processing...</span>
                                <span>{transferProgress}%</span>
                              </div>
                              <Progress value={transferProgress} className="w-full" />
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleTransfer} 
                              className="flex-1"
                              disabled={isTransferProcessing}
                            >
                              {isTransferProcessing ? 'Processing...' : 'Confirm Transfer'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsTransferDialogOpen(false)}
                              disabled={isTransferProcessing}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>

              {/* Bridge Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bridge Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Volume</span>
                        <span className="font-medium">$2.5M</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">24h Volume</span>
                        <span className="font-medium">$125K</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Transfers</span>
                        <span className="font-medium">8,492</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="font-medium text-green-600">98.5%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Time</span>
                        <span className="font-medium">2.3 min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Supported Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {supportedTokens.map((token) => (
                        <div key={token.symbol} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{token.name}</div>
                          </div>
                          <Badge variant="outline">{token.chain}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Tabs defaultValue="transactions" className="space-y-6">
              <TabsList>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="validators">Validators</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Latest cross-chain transfers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bridgeTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {tx.type === 'lock' ? 
                                    <Lock className="h-4 w-4 text-blue-500" /> :
                                    <Unlock className="h-4 w-4 text-green-500" />
                                  }
                                  <span className="capitalize">{tx.type}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm max-w-xs truncate">
                                {tx.from}
                              </TableCell>
                              <TableCell className="font-mono text-sm max-w-xs truncate">
                                {tx.to}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{tx.amount}</span>
                                  <span className="text-sm text-muted-foreground">{tx.token}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(tx.status)}
                                  {getStatusBadge(tx.status)}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {tx.timestamp}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Validators Tab */}
              <TabsContent value="validators">
                <Card>
                  <CardHeader>
                    <CardTitle>Bridge Validators</CardTitle>
                    <CardDescription>
                      Network validators securing cross-chain transfers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {validators.map((validator) => (
                        <Card key={validator.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{validator.name}</h4>
                                  <Badge variant={validator.status === 'active' ? 'default' : 'secondary'}>
                                    {validator.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground font-mono">
                                  {validator.address}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span>Stake: {validator.stake}</span>
                                  <span>Uptime: {validator.uptime}</span>
                                  <span>Rewards: {validator.rewards}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Status</div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">Active</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Bridge Settings</CardTitle>
                    <CardDescription>
                      Configure bridge parameters and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-confirm transfers</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically confirm transfers after threshold validations
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable test mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Use test networks for development
                          </p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Advanced logging</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable detailed transaction logging
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Security Threshold</h4>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">Validator signatures required:</span>
                          <Select defaultValue="2">
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Advanced Settings
                        </Button>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export Config
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}