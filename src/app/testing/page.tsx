<<<<<<< HEAD
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  TestTube,
  Menu,
  X,
  Home,
  Play,
  Pause,
  RotateCcw,
  Search,
  Send,
  DollarSign,
  Gas,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Database,
  Shield,
  BarChart3
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
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Registry', href: '/registry', icon: Database },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Permissions', href: '/permissions', icon: Shield },
  { name: 'Advanced', href: '/dashboard', icon: BarChart3 },
]

const testTransactions = [
  {
    id: '1',
    type: 'Token Transfer',
    from: '0x7f9a1b...',
    to: '0x3b8c2d...',
    amount: '100.0',
    gasLimit: 21000,
    gasUsed: 21000,
    status: 'completed',
    hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    timestamp: '2024-01-15 14:30:25',
    duration: '2.3s'
  },
  {
    id: '2',
    type: 'Contract Call',
    from: '0x8c2d3e...',
    contract: '0x9e4f1a...',
    function: 'transfer',
    gasLimit: 100000,
    gasUsed: 84750,
    status: 'completed',
    hash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890a',
    timestamp: '2024-01-15 14:28:12',
    duration: '5.7s'
  },
  {
    id: '3',
    type: 'Contract Deployment',
    from: '0x1a4e5f...',
    gasLimit: 3000000,
    gasUsed: 2847500,
    status: 'failed',
    hash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    timestamp: '2024-01-15 14:25:43',
    duration: '12.1s',
    error: 'Out of gas'
  },
  {
    id: '4',
    type: 'Token Transfer',
    from: '0x5d2b3e...',
    to: '0x4f1a2b...',
    amount: '50.0',
    gasLimit: 21000,
    gasUsed: 21000,
    status: 'pending',
    hash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abc',
    timestamp: '2024-01-15 14:22:18',
    duration: '...'
  }
]

const contractOptions = [
  { value: 'token', label: 'Token Contract' },
  { value: 'nft', label: 'NFT Marketplace' },
  { value: 'staking', label: 'Staking Contract' },
]

const networkOptions = [
  { value: 'mainnet', label: 'Main Network' },
  { value: 'testnet', label: 'Test Network' },
  { value: 'devnet', label: 'Development Network' },
]

export default function TestingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('transfer')
  const [selectedNetwork, setSelectedNetwork] = useState('testnet')
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const pathname = usePathname()

  const handleStartTest = () => {
    setIsTestRunning(true)
    setTestProgress(0)
    
    // Simulate test progress
    const interval = setInterval(() => {
      setTestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsTestRunning(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const handleStopTest = () => {
    setIsTestRunning(false)
  }

  const handleResetTest = () => {
    setIsTestRunning(false)
    setTestProgress(0)
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
        return <AlertCircle className="h-4 w-4 text-gray-500" />
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

  const TransferForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="from">From Address</Label>
          <Input id="from" placeholder="0x..." />
        </div>
        <div>
          <Label htmlFor="to">To Address</Label>
          <Input id="to" placeholder="0x..." />
        </div>
      </div>
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" type="number" placeholder="100.0" step="0.1" />
      </div>
      <div>
        <Label htmlFor="gasLimit">Gas Limit</Label>
        <Input id="gasLimit" type="number" placeholder="21000" />
      </div>
      <Button className="w-full" onClick={handleStartTest} disabled={isTestRunning}>
        <Send className="h-4 w-4 mr-2" />
        Send Test Transaction
      </Button>
    </div>
  )

  const ContractCallForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="contract">Contract</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select contract" />
          </SelectTrigger>
          <SelectContent>
            {contractOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="function">Function</Label>
        <Input id="function" placeholder="transfer" />
      </div>
      <div>
        <Label htmlFor="parameters">Parameters (JSON)</Label>
        <Textarea id="parameters" placeholder='["0x...", "100"]' rows={3} />
      </div>
      <div>
        <Label htmlFor="gasLimit">Gas Limit</Label>
        <Input id="gasLimit" type="number" placeholder="100000" />
      </div>
      <Button className="w-full" onClick={handleStartTest} disabled={isTestRunning}>
        <Play className="h-4 w-4 mr-2" />
        Execute Contract Call
      </Button>
    </div>
  )

  const BatchTestForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="batchSize">Batch Size</Label>
        <Input id="batchSize" type="number" placeholder="10" />
      </div>
      <div>
        <Label htmlFor="testType">Test Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select test type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transfers">Token Transfers</SelectItem>
            <SelectItem value="calls">Contract Calls</SelectItem>
            <SelectItem value="mixed">Mixed Operations</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="delay">Delay Between Transactions (ms)</Label>
        <Input id="delay" type="number" placeholder="100" />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleStartTest} disabled={isTestRunning}>
          <Play className="h-4 w-4 mr-2" />
          Start Batch Test
        </Button>
        <Button variant="outline" onClick={handleStopTest} disabled={!isTestRunning}>
          <Pause className="h-4 w-4 mr-2" />
          Stop
        </Button>
        <Button variant="outline" onClick={handleResetTest}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
      {isTestRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Test Progress</span>
            <span>{testProgress}%</span>
          </div>
          <Progress value={testProgress} className="w-full" />
        </div>
      )}
    </div>
  )

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
              <h1 className="text-lg font-semibold">Testing</h1>
            </div>
          </div>
        </div>

        {/* Testing content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Transaction Testing</h1>
              <p className="text-muted-foreground">
                Test blockchain transactions and smart contract interactions
              </p>
            </div>

            {/* Network selection */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="network">Network:</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger className="w-48">
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
                <Badge variant={selectedNetwork === 'testnet' ? 'default' : 'secondary'}>
                  {selectedNetwork.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Test forms */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Operations</CardTitle>
                    <CardDescription>
                      Create and execute test transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="transfer">Transfer</TabsTrigger>
                        <TabsTrigger value="contract">Contract</TabsTrigger>
                        <TabsTrigger value="batch">Batch</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="transfer" className="mt-4">
                        <TransferForm />
                      </TabsContent>
                      
                      <TabsContent value="contract" className="mt-4">
                        <ContractCallForm />
                      </TabsContent>
                      
                      <TabsContent value="batch" className="mt-4">
                        <BatchTestForm />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Test stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Test Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">3</div>
                        <div className="text-sm text-muted-foreground">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">1</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">2.3s</div>
                        <div className="text-sm text-muted-foreground">Avg Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">45,250</div>
                        <div className="text-sm text-muted-foreground">Avg Gas Used</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Test results */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Test Results</CardTitle>
                    <CardDescription>
                      Latest test transactions and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testTransactions.map((tx) => (
                        <Card key={tx.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(tx.status)}
                                <span className="font-medium">{tx.type}</span>
                                {getStatusBadge(tx.status)}
                              </div>
                              
                              {tx.type === 'Token Transfer' && (
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono">{tx.from}</span>
                                    <span>→</span>
                                    <span className="font-mono">{tx.to}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {tx.amount} KALD
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Gas className="h-3 w-3" />
                                      {tx.gasUsed}/{tx.gasLimit}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {tx.duration}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {tx.type === 'Contract Call' && (
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <div>
                                    <span className="font-medium">Contract:</span>
                                    <span className="font-mono ml-2">{tx.contract}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Function:</span>
                                    <span className="ml-2">{tx.function}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Gas className="h-3 w-3" />
                                      {tx.gasUsed}/{tx.gasLimit}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {tx.duration}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {tx.error && (
                                <div className="text-sm text-red-600 mt-2">
                                  Error: {tx.error}
                                </div>
                              )}
                              
                              <div className="text-xs text-muted-foreground mt-2">
                                {tx.timestamp}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
=======
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  BarChart3, 
  Shield, 
  Zap, 
  TrendingUp, 
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  scenario: string;
  status: 'success' | 'failed' | 'error';
  duration: number;
  gasUsed: number;
  throughput: number;
  errors: string[];
  metrics: Record<string, any>;
}

interface BenchmarkResult {
  testType: string;
  overallScore: number;
  metrics: {
    performance: {
      avgExecutionTime: number;
      maxExecutionTime: number;
      minExecutionTime: number;
      throughput: number;
    };
    security: {
      vulnerabilityScore: number;
      auditScore: number;
      complianceScore: number;
    };
    scalability: {
      maxThroughput: number;
      scalabilityScore: number;
      bottleneckAnalysis: string[];
    };
    cost: {
      avgGasCost: number;
      totalCost: number;
      costEfficiency: number;
    };
  };
  recommendations: string[];
  status: 'success' | 'failed' | 'error';
  errors: string[];
}

interface Contract {
  id: string;
  name: string;
  address: string;
}

export default function TestingPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  // Simulation form state
  const [simulationForm, setSimulationForm] = useState({
    scenario: 'token_transfer',
    parameters: {
      transfers: 100,
      accounts: 10,
      amountRange: { min: 1, max: 1000 },
      iterations: 50,
      inputVariations: true,
      transactionsPerSecond: 100,
      duration: 60,
      concurrentUsers: 10,
      bytecodeSize: 'medium',
      optimization: true,
      functionName: 'transfer',
    },
  });

  // Benchmark form state
  const [benchmarkForm, setBenchmarkForm] = useState({
    testType: 'performance',
    iterations: 100,
    concurrency: 10,
    parameters: {},
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/blockchain/contracts');
      if (!response.ok) return;
      
      const data = await response.json();
      setContracts(data.data.contracts || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      // Mock contracts for demo
      setContracts([
        { id: '1', name: 'Token Contract', address: '0x1234...5678' },
        { id: '2', name: 'NFT Marketplace', address: '0xabcd...efgh' },
      ]);
    }
  };

  const runSimulation = async () => {
    if (!selectedContract) {
      toast.error('Please select a contract');
      return;
    }

    setIsRunning(true);
    setCurrentTest(simulationForm.scenario);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 500);

      const response = await fetch('/api/testing/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: selectedContract,
          scenario: simulationForm.scenario,
          parameters: simulationForm.parameters,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to run simulation');
      
      const data = await response.json();
      const result: TestResult = data.data;
      
      setTestResults(prev => [result, ...prev]);
      toast.success('Simulation completed successfully');
    } catch (error) {
      console.error('Simulation error:', error);
      toast.error('Failed to run simulation');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(0);
    }
  };

  const runBenchmark = async () => {
    if (!selectedContract) {
      toast.error('Please select a contract');
      return;
    }

    setIsRunning(true);
    setCurrentTest(benchmarkForm.testType);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 800);

      const response = await fetch('/api/testing/benchmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: selectedContract,
          testType: benchmarkForm.testType,
          iterations: benchmarkForm.iterations,
          concurrency: benchmarkForm.concurrency,
          parameters: benchmarkForm.parameters,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to run benchmark');
      
      const data = await response.json();
      const result: BenchmarkResult = data.data;
      
      setBenchmarkResults(prev => [result, ...prev]);
      toast.success('Benchmark completed successfully');
    } catch (error) {
      console.error('Benchmark error:', error);
      toast.error('Failed to run benchmark');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Testing & Simulation</h1>
          <p className="text-muted-foreground">
            Test smart contracts in a simulated environment before deployment
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="contract-select">Contract:</Label>
            <Select value={selectedContract} onValueChange={setSelectedContract}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select contract" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchContracts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">
                  Running {currentTest} test...
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="simulation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
        </TabsList>

        <TabsContent value="simulation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulation Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>
                  Configure simulation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario">Scenario</Label>
                  <Select 
                    value={simulationForm.scenario} 
                    onValueChange={(value) => setSimulationForm(prev => ({ ...prev, scenario: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="token_transfer">Token Transfer</SelectItem>
                      <SelectItem value="contract_deployment">Contract Deployment</SelectItem>
                      <SelectItem value="function_invocation">Function Invocation</SelectItem>
                      <SelectItem value="stress_test">Stress Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {simulationForm.scenario === 'token_transfer' && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="transfers">Number of Transfers</Label>
                      <Input
                        id="transfers"
                        type="number"
                        value={simulationForm.parameters.transfers}
                        onChange={(e) => setSimulationForm(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, transfers: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accounts">Number of Accounts</Label>
                      <Input
                        id="accounts"
                        type="number"
                        value={simulationForm.parameters.accounts}
                        onChange={(e) => setSimulationForm(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, accounts: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                )}

                {simulationForm.scenario === 'stress_test' && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="tps">Transactions per Second</Label>
                      <Input
                        id="tps"
                        type="number"
                        value={simulationForm.parameters.transactionsPerSecond}
                        onChange={(e) => setSimulationForm(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, transactionsPerSecond: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (seconds)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={simulationForm.parameters.duration}
                        onChange={(e) => setSimulationForm(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, duration: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={runSimulation} 
                  disabled={isRunning || !selectedContract}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Simulation
                </Button>
              </CardContent>
            </Card>

            {/* Test Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle>Available Scenarios</CardTitle>
                <CardDescription>
                  Pre-configured test scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Token Transfer</div>
                      <div className="text-xs text-muted-foreground">
                        Simulate token transfers between accounts
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Basic</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Contract Deployment</div>
                      <div className="text-xs text-muted-foreground">
                        Test contract deployment with various parameters
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Advanced</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Function Invocation</div>
                      <div className="text-xs text-muted-foreground">
                        Test function invocation with different inputs
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Intermediate</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Stress Test</div>
                      <div className="text-xs text-muted-foreground">
                        High-volume transaction stress testing
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Expert</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
                <CardDescription>
                  Latest simulation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {testResults.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No simulation results yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testResults.slice(0, 5).map((result, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.status)}
                              <span className="font-medium capitalize">{result.scenario}</span>
                            </div>
                            <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>Duration: {result.duration}ms</div>
                            <div>Gas Used: {result.gasUsed.toLocaleString()}</div>
                            <div>Throughput: {result.throughput.toFixed(2)} TPS</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benchmarking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Benchmark Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Benchmark Configuration</CardTitle>
                <CardDescription>
                  Configure benchmark parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="benchmark-type">Benchmark Type</Label>
                  <Select 
                    value={benchmarkForm.testType} 
                    onValueChange={(value) => setBenchmarkForm(prev => ({ ...prev, testType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="scalability">Scalability</SelectItem>
                      <SelectItem value="cost">Cost Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iterations">Iterations</Label>
                  <Input
                    id="iterations"
                    type="number"
                    value={benchmarkForm.iterations}
                    onChange={(e) => setBenchmarkForm(prev => ({
                      ...prev,
                      iterations: parseInt(e.target.value)
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concurrency">Concurrency</Label>
                  <Input
                    id="concurrency"
                    type="number"
                    value={benchmarkForm.concurrency}
                    onChange={(e) => setBenchmarkForm(prev => ({
                      ...prev,
                      concurrency: parseInt(e.target.value)
                    }))}
                  />
                </div>

                <Button 
                  onClick={runBenchmark} 
                  disabled={isRunning || !selectedContract}
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Run Benchmark
                </Button>
              </CardContent>
            </Card>

            {/* Benchmark Types */}
            <Card>
              <CardHeader>
                <CardTitle>Benchmark Types</CardTitle>
                <CardDescription>
                  Available benchmark categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Performance</div>
                      <div className="text-xs text-muted-foreground">
                        Execution time and throughput analysis
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Security</div>
                      <div className="text-xs text-muted-foreground">
                        Vulnerability detection and audit
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Scalability</div>
                      <div className="text-xs text-muted-foreground">
                        Load testing and scaling analysis
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">Cost Analysis</div>
                      <div className="text-xs text-muted-foreground">
                        Gas cost and economic efficiency
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benchmark Results */}
            <Card>
              <CardHeader>
                <CardTitle>Benchmark Results</CardTitle>
                <CardDescription>
                  Latest benchmark scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {benchmarkResults.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No benchmark results yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {benchmarkResults.slice(0, 5).map((result, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.status)}
                              <span className="font-medium capitalize">{result.testType}</span>
                            </div>
                            <div className={`text-lg font-bold ${getScoreColor(result.overallScore)}`}>
                              {result.overallScore}/100
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>Status: {result.status}</div>
                            <div>Recommendations: {result.recommendations.length}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
>>>>>>> 80450c96b3265079818c8907794a182e51f9e247
}