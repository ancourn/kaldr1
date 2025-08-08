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
}