'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRightLeft, AlertCircle, Info } from 'lucide-react'

interface TokenPair {
  symbol: string
  name: string
  address: string
  decimals: number
  balance: string
  price: number
}

interface SwapQuote {
  inputAmount: string
  outputAmount: string
  priceImpact: number
  exchangeRate: number
  fee: string
  estimatedGas: string
}

export default function SwapUI() {
  const [fromToken, setFromToken] = useState<string>('KALD')
  const [toToken, setToToken] = useState<string>('ETH')
  const [amount, setAmount] = useState<string>('')
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Mock token data
  const tokens: TokenPair[] = [
    {
      symbol: 'KALD',
      name: 'KALDRIX',
      address: '0x1234567890123456789012345678901234567890',
      decimals: 18,
      balance: '1000000000000000000000',
      price: 2.45
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      balance: '5000000000000000000',
      price: 3200.00
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x1111111111111111111111111111111111111111',
      decimals: 6,
      balance: '1000000000',
      price: 1.00
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0x2222222222222222222222222222222222222222',
      decimals: 6,
      balance: '1000000000',
      price: 1.00
    }
  ]

  const getSwapQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const fromTokenData = tokens.find(t => t.symbol === fromToken)
      const toTokenData = tokens.find(t => t.symbol === toToken)

      if (!fromTokenData || !toTokenData) {
        setError('Invalid token selection')
        return
      }

      const inputAmount = (parseFloat(amount) * Math.pow(10, fromTokenData.decimals)).toString()
      const exchangeRate = fromTokenData.price / toTokenData.price
      const outputAmount = (parseFloat(amount) * exchangeRate).toFixed(6)
      const priceImpact = Math.random() * 0.5 // Mock price impact
      const fee = (parseFloat(amount) * 0.003).toString() // 0.3% fee
      const estimatedGas = '210000'

      setSwapQuote({
        inputAmount: amount,
        outputAmount,
        priceImpact,
        exchangeRate,
        fee,
        estimatedGas
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get swap quote')
    } finally {
      setLoading(false)
    }
  }

  const executeSwap = async () => {
    if (!swapQuote) return

    setLoading(true)
    setError(null)

    try {
      // Simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset form after successful swap
      setAmount('')
      setSwapQuote(null)
      
      // Show success message (in real app, this would be a toast)
      alert('Swap executed successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed')
    } finally {
      setLoading(false)
    }
  }

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance) / Math.pow(10, decimals)
    return num.toFixed(decimals === 6 ? 2 : 4)
  }

  const selectedFromToken = tokens.find(t => t.symbol === fromToken)
  const selectedToToken = tokens.find(t => t.symbol === toToken)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Token Swap
        </CardTitle>
        <CardDescription>
          Exchange tokens instantly with competitive rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* From Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium">From</label>
            <div className="flex gap-2">
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>
            {selectedFromToken && (
              <div className="text-sm text-muted-foreground">
                Balance: {formatBalance(selectedFromToken.balance, selectedFromToken.decimals)} {selectedFromToken.symbol}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const temp = fromToken
                setFromToken(toToken)
                setToToken(temp)
                setSwapQuote(null)
              }}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            <div className="flex gap-2">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={swapQuote?.outputAmount || ''}
                  readOnly
                  className="text-right bg-gray-50"
                />
              </div>
            </div>
            {selectedToToken && (
              <div className="text-sm text-muted-foreground">
                Balance: {formatBalance(selectedToToken.balance, selectedToToken.decimals)} {selectedToToken.symbol}
              </div>
            )}
          </div>

          {/* Get Quote Button */}
          {!swapQuote && (
            <Button 
              onClick={getSwapQuote} 
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              {loading ? 'Getting Quote...' : 'Get Quote'}
            </Button>
          )}

          {/* Swap Quote Details */}
          {swapQuote && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Exchange Rate</span>
                <span className="font-semibold">1 {fromToken} = {swapQuote.exchangeRate.toFixed(6)} {toToken}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Price Impact</span>
                <Badge className={swapQuote.priceImpact > 0.1 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  {(swapQuote.priceImpact * 100).toFixed(2)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Fee</span>
                <span className="font-semibold">{swapQuote.fee} {fromToken}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Estimated Gas</span>
                <span className="font-semibold">{swapQuote.estimatedGas}</span>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This is a demo interface. In a real application, this would connect to actual DEX protocols like Uniswap, PancakeSwap, or other decentralized exchanges.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={executeSwap} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Swapping...' : `Swap ${amount} ${fromToken} → ${swapQuote.outputAmount} ${toToken}`}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Minimum amount: 0.001 {fromToken}</p>
            <p>• Maximum slippage: 0.5%</p>
            <p>• Network: Ethereum Mainnet</p>
            <p>• This is a demo interface for demonstration purposes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}