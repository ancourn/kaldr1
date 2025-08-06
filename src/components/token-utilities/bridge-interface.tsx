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
import { ArrowRightLeft, AlertCircle, Info, Clock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'

interface BridgeTransaction {
  id: string
  fromChain: string
  toChain: string
  token: string
  amount: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime: string
  endTime?: string
  txHash: string
  estimatedTime: number
}

interface ChainInfo {
  id: string
  name: string
  logo: string
  isSupported: boolean
  estimatedTime: number
  fee: string
}

interface TokenInfo {
  symbol: string
  name: string
  address: string
  decimals: number
  balance: string
  isBridged: boolean
}

export default function BridgeInterface() {
  const [fromChain, setFromChain] = useState<string>('ethereum')
  const [toChain, setToChain] = useState<string>('binance')
  const [selectedToken, setSelectedToken] = useState<string>('KALD')
  const [amount, setAmount] = useState<string>('')
  const [recipient, setRecipient] = useState<string>('')
  const [bridgeQuote, setBridgeQuote] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Mock chain information
  const chains: ChainInfo[] = [
    {
      id: 'ethereum',
      name: 'Ethereum',
      logo: 'ETH',
      isSupported: true,
      estimatedTime: 15,
      fee: '0.01'
    },
    {
      id: 'binance',
      name: 'Binance Smart Chain',
      logo: 'BSC',
      isSupported: true,
      estimatedTime: 5,
      fee: '0.005'
    },
    {
      id: 'polygon',
      name: 'Polygon',
      logo: 'MATIC',
      isSupported: true,
      estimatedTime: 3,
      fee: '0.002'
    },
    {
      id: 'arbitrum',
      name: 'Arbitrum',
      logo: 'ARB',
      isSupported: true,
      estimatedTime: 8,
      fee: '0.008'
    }
  ]

  // Mock token information
  const tokens: TokenInfo[] = [
    {
      symbol: 'KALD',
      name: 'KALDRIX',
      address: '0x1234567890123456789012345678901234567890',
      decimals: 18,
      balance: '1000000000000000000000',
      isBridged: true
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      balance: '5000000000000000000',
      isBridged: true
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x1111111111111111111111111111111111111111',
      decimals: 6,
      balance: '1000000000',
      isBridged: true
    }
  ]

  // Mock bridge transactions
  const bridgeTransactions: BridgeTransaction[] = [
    {
      id: 'bridge_001',
      fromChain: 'ethereum',
      toChain: 'binance',
      token: 'KALD',
      amount: '100000000000000000000',
      status: 'completed',
      startTime: '2024-01-15T10:30:00Z',
      endTime: '2024-01-15T10:35:00Z',
      txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      estimatedTime: 5
    },
    {
      id: 'bridge_002',
      fromChain: 'binance',
      toChain: 'polygon',
      token: 'USDC',
      amount: '500000000',
      status: 'processing',
      startTime: '2024-01-15T10:45:00Z',
      txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      estimatedTime: 3
    }
  ]

  const getBridgeQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!recipient) {
      setError('Please enter recipient address')
      return
    }

    if (fromChain === toChain) {
      setError('Source and destination chains must be different')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const fromChainData = chains.find(c => c.id === fromChain)
      const toChainData = chains.find(c => c.id === toChain)
      const tokenData = tokens.find(t => t.symbol === selectedToken)

      if (!fromChainData || !toChainData || !tokenData) {
        setError('Invalid selection')
        return
      }

      const estimatedFee = (parseFloat(amount) * 0.001).toString() // 0.1% fee
      const estimatedTime = Math.max(fromChainData.estimatedTime, toChainData.estimatedTime)

      setBridgeQuote({
        amount,
        recipient,
        fromChain: fromChainData,
        toChain: toChainData,
        token: tokenData,
        estimatedFee,
        estimatedTime,
        estimatedArrival: new Date(Date.now() + estimatedTime * 60000).toISOString()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get bridge quote')
    } finally {
      setLoading(false)
    }
  }

  const executeBridge = async () => {
    if (!bridgeQuote) return

    setLoading(true)
    setError(null)

    try {
      // Simulate bridge execution
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Reset form after successful bridge
      setAmount('')
      setRecipient('')
      setBridgeQuote(null)
      
      // Show success message
      alert('Bridge transaction initiated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bridge failed')
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: string, decimals: number = 18) => {
    const num = parseFloat(value) / Math.pow(10, decimals)
    return num.toFixed(decimals === 6 ? 2 : 4)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': return 'bg-blue-500'
      case 'pending': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing': return <Clock className="h-4 w-4 text-blue-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const selectedFromChain = chains.find(c => c.id === fromChain)
  const selectedToChain = chains.find(c => c.id === toChain)
  const selectedTokenData = tokens.find(t => t.symbol === selectedToken)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Cross-Chain Bridge
          </CardTitle>
          <CardDescription>
            Transfer assets securely between different blockchain networks
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="bridge" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bridge">Bridge Assets</TabsTrigger>
          <TabsTrigger value="history">Bridge History</TabsTrigger>
        </TabsList>

        <TabsContent value="bridge">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Assets</CardTitle>
              <CardDescription>
                Bridge your tokens between different blockchain networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Chain Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Chain</label>
                    <Select value={fromChain} onValueChange={setFromChain}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {chains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{chain.name}</span>
                              {chain.isSupported && (
                                <Badge className="ml-2 bg-green-100 text-green-800">Supported</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Chain</label>
                    <Select value={toChain} onValueChange={setToChain}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {chains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{chain.name}</span>
                              {chain.isSupported && (
                                <Badge className="ml-2 bg-green-100 text-green-800">Supported</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Token Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Token</label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{token.name} ({token.symbol})</span>
                            {token.isBridged && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800">Bridged</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {selectedTokenData && (
                    <div className="text-sm text-muted-foreground">
                      Available: {formatValue(selectedTokenData.balance, selectedTokenData.decimals)} {selectedTokenData.symbol}
                    </div>
                  )}
                </div>

                {/* Recipient Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient Address</label>
                  <Input
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground">
                    Address on {selectedToChain?.name}
                  </div>
                </div>

                {/* Get Quote Button */}
                {!bridgeQuote && (
                  <Button 
                    onClick={getBridgeQuote} 
                    disabled={loading || !amount || !recipient || fromChain === toChain}
                    className="w-full"
                  >
                    {loading ? 'Getting Quote...' : 'Get Bridge Quote'}
                  </Button>
                )}

                {/* Bridge Quote */}
                {bridgeQuote && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">Bridge Quote</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">From:</span>
                        <div className="font-medium">{bridgeQuote.fromChain.name}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To:</span>
                        <div className="font-medium">{bridgeQuote.toChain.name}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <div className="font-medium">{bridgeQuote.amount} {bridgeQuote.token.symbol}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estimated Fee:</span>
                        <div className="font-medium">{bridgeQuote.estimatedFee} {bridgeQuote.token.symbol}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estimated Time:</span>
                        <div className="font-medium">{bridgeQuote.estimatedTime} minutes</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recipient:</span>
                        <div className="font-medium font-mono">{formatAddress(bridgeQuote.recipient)}</div>
                      </div>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This is a demo interface. In a real application, this would connect to actual bridge protocols like Wormhole, Multichain, or other cross-chain solutions.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      onClick={executeBridge} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Bridging...' : `Bridge ${bridgeQuote.amount} ${bridgeQuote.token.symbol}`}
                    </Button>
                  </div>
                )}

                {error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Bridge History</CardTitle>
              <CardDescription>
                View your cross-chain transfer history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bridgeTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <div className="font-semibold">
                            {formatValue(transaction.amount)} {transaction.token}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {chains.find(c => c.id === transaction.fromChain)?.name} → {chains.find(c => c.id === transaction.toChain)?.name}
                          </div>
                        </div>
                      </div>
                      <Badge className={
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {transaction.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <div className="font-medium">{new Date(transaction.startTime).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transaction Hash:</span>
                        <div className="font-medium font-mono">{formatAddress(transaction.txHash)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estimated Time:</span>
                        <div className="font-medium">{transaction.estimatedTime} minutes</div>
                      </div>
                    </div>

                    {transaction.status === 'processing' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground mb-2">Processing</div>
                        <Progress value={65} className="w-full" />
                      </div>
                    )}
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