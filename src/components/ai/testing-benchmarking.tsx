'use client'

import { useState, useEffect } from 'react'
import { 
  FlaskConical, 
  Gauge, 
  Timer, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Pause, 
  RefreshCw, 
  Download,
  Upload,
  FileText,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Shield,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Settings,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  Star,
  Award,
  Activity,
  Database
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter
} from 'recharts'

// Mock data types
interface TestSuite {
  id: string
  name: string
  description: string
  modelId: string
  modelName: string
  category: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalTests: number
  passedTests: number
  failedTests: number
  duration: number
  createdAt: string
  lastRun?: string
}

interface Benchmark {
  id: string
  name: string
  description: string
  modelId: string
  modelName: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  metrics: {
    latency: number
    throughput: number
    memory: number
    cpu: number
    errorRate: number
    successRate: number
  }
  createdAt: string
  lastRun?: string
}

interface ValidationReport {
  id: string
  modelId: string
  modelName: string
  version: string
  status: 'valid' | 'invalid' | 'warning'
  score: number
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warnings: number
  createdAt: string
}

export function TestingBenchmarking({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState('test-suites')
  const [selectedModel, setSelectedModel] = useState('all')
  const [isRunning, setIsRunning] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data
  const testSuites: TestSuite[] = [
    {
      id: 'suite_1',
      name: 'Security Model Test Suite',
      description: 'Comprehensive security testing for smart contract analysis models',
      modelId: 'model_1',
      modelName: 'Security Analyzer',
      category: 'security',
      status: 'completed',
      totalTests: 150,
      passedTests: 142,
      failedTests: 8,
      duration: 245,
      createdAt: '2024-01-15T10:00:00Z',
      lastRun: '2024-01-15T14:30:00Z'
    },
    {
      id: 'suite_2',
      name: 'Performance Validation Suite',
      description: 'Performance and latency testing for prediction models',
      modelId: 'model_2',
      modelName: 'Performance Predictor',
      category: 'performance',
      status: 'running',
      totalTests: 75,
      passedTests: 45,
      failedTests: 2,
      duration: 180,
      createdAt: '2024-01-15T09:00:00Z',
      lastRun: '2024-01-15T14:25:00Z'
    },
    {
      id: 'suite_3',
      name: 'Accuracy Benchmark Suite',
      description: 'Accuracy and precision testing for all models',
      modelId: 'model_3',
      modelName: 'Anomaly Detector',
      category: 'accuracy',
      status: 'pending',
      totalTests: 200,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      createdAt: '2024-01-15T11:00:00Z'
    }
  ]

  const benchmarks: Benchmark[] = [
    {
      id: 'benchmark_1',
      name: 'Latency Benchmark',
      description: 'Measure response latency under various load conditions',
      modelId: 'model_1',
      modelName: 'Security Analyzer',
      type: 'latency',
      status: 'completed',
      metrics: {
        latency: 45.2,
        throughput: 1250,
        memory: 2.4,
        cpu: 35,
        errorRate: 0.02,
        successRate: 98.5
      },
      createdAt: '2024-01-15T10:00:00Z',
      lastRun: '2024-01-15T14:20:00Z'
    },
    {
      id: 'benchmark_2',
      name: 'Throughput Stress Test',
      description: 'Maximum throughput testing under heavy load',
      modelId: 'model_2',
      modelName: 'Performance Predictor',
      type: 'throughput',
      status: 'completed',
      metrics: {
        latency: 32.8,
        throughput: 1890,
        memory: 1.8,
        cpu: 42,
        errorRate: 0.01,
        successRate: 99.2
      },
      createdAt: '2024-01-15T09:30:00Z',
      lastRun: '2024-01-15T14:15:00Z'
    },
    {
      id: 'benchmark_3',
      name: 'Memory Usage Analysis',
      description: 'Memory consumption analysis and optimization',
      modelId: 'model_3',
      modelName: 'Anomaly Detector',
      type: 'memory',
      status: 'running',
      metrics: {
        latency: 67.5,
        throughput: 890,
        memory: 3.2,
        cpu: 55,
        errorRate: 0.05,
        successRate: 96.8
      },
      createdAt: '2024-01-15T11:30:00Z',
      lastRun: '2024-01-15T14:10:00Z'
    }
  ]

  const validationReports: ValidationReport[] = [
    {
      id: 'validation_1',
      modelId: 'model_1',
      modelName: 'Security Analyzer',
      version: '2.1.0',
      status: 'valid',
      score: 92,
      totalChecks: 25,
      passedChecks: 23,
      failedChecks: 1,
      warnings: 1,
      createdAt: '2024-01-15T14:00:00Z'
    },
    {
      id: 'validation_2',
      modelId: 'model_2',
      modelName: 'Performance Predictor',
      version: '1.8.0',
      status: 'warning',
      score: 78,
      totalChecks: 20,
      passedChecks: 16,
      failedChecks: 1,
      warnings: 3,
      createdAt: '2024-01-15T13:45:00Z'
    },
    {
      id: 'validation_3',
      modelId: 'model_3',
      modelName: 'Anomaly Detector',
      version: '3.0.0',
      status: 'invalid',
      score: 65,
      totalChecks: 30,
      passedChecks: 19,
      failedChecks: 8,
      warnings: 3,
      createdAt: '2024-01-15T13:30:00Z'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'valid':
        return 'text-green-600'
      case 'running':
        return 'text-blue-600'
      case 'pending':
        return 'text-gray-600'
      case 'failed':
      case 'invalid':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'running':
        return <Timer className="h-4 w-4 text-blue-600 animate-spin" />
      case 'pending':
        return <Timer className="h-4 w-4 text-gray-600" />
      case 'failed':
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Timer className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleRunTest = (id: string) => {
    setIsRunning(id)
    setTimeout(() => setIsRunning(null), 3000)
  }

  // Performance comparison data
  const performanceComparisonData = [
    { model: 'Security Analyzer', latency: 45, throughput: 1250, accuracy: 94 },
    { model: 'Performance Predictor', latency: 33, throughput: 1890, accuracy: 87 },
    { model: 'Anomaly Detector', latency: 68, throughput: 890, accuracy: 91 },
    { model: 'Gas Optimizer', latency: 23, throughput: 2150, accuracy: 82 }
  ]

  const testResultsData = [
    { name: 'Passed', value: 187, color: '#22c55e' },
    { name: 'Failed', value: 11, color: '#ef4444' },
    { name: 'Warning', value: 4, color: '#f59e0b' }
  ]

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Testing & Benchmarking</h2>
          <p className="text-muted-foreground">Comprehensive testing, validation, and performance benchmarking</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Test Suite
          </Button>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Benchmark
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Suites</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testSuites.length}</div>
            <p className="text-xs text-muted-foreground">
              {testSuites.filter(s => s.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benchmarks</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benchmarks.length}</div>
            <p className="text-xs text-muted-foreground">
              {benchmarks.filter(b => b.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Reports</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validationReports.length}</div>
            <p className="text-xs text-muted-foreground">
              {validationReports.filter(v => v.status === 'valid').length} valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94.2%</div>
            <p className="text-xs text-muted-foreground">Overall test pass rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test-suites">Test Suites</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* Test Suites Tab */}
        <TabsContent value="test-suites" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Test Suites List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search test suites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    <SelectItem value="model_1">Security Analyzer</SelectItem>
                    <SelectItem value="model_2">Performance Predictor</SelectItem>
                    <SelectItem value="model_3">Anomaly Detector</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {testSuites.map((suite) => (
                  <Card key={suite.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(suite.status)}
                          <CardTitle className="text-lg">{suite.name}</CardTitle>
                        </div>
                        <Badge variant={suite.status === 'completed' ? 'default' : suite.status === 'running' ? 'secondary' : 'outline'}>
                          {suite.status}
                        </Badge>
                      </div>
                      <CardDescription>{suite.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Model</div>
                          <div className="font-medium">{suite.modelName}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Category</div>
                          <div className="font-medium">{suite.category}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-medium">{formatDuration(suite.duration)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Created</div>
                          <div className="font-medium">{formatDate(suite.createdAt)}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Test Progress</span>
                          <span>{suite.passedTests}/{suite.totalTests}</span>
                        </div>
                        <Progress 
                          value={(suite.passedTests / suite.totalTests) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            {suite.passedTests}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3 w-3" />
                            {suite.failedTests}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRunTest(suite.id)}
                            disabled={isRunning === suite.id}
                          >
                            {isRunning === suite.id ? (
                              <Timer className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            Run
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                            Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Test Results Overview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results Overview</CardTitle>
                  <CardDescription>Summary of all test results</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={testResultsData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {testResultsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest test runs and results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium">Security Model Test Suite</div>
                      <div className="text-muted-foreground">Completed successfully</div>
                    </div>
                    <div className="text-muted-foreground">2 min ago</div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Timer className="h-4 w-4 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <div className="font-medium">Performance Validation Suite</div>
                      <div className="text-muted-foreground">Running...</div>
                    </div>
                    <div className="text-muted-foreground">5 min ago</div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <div className="font-medium">Accuracy Benchmark Suite</div>
                      <div className="text-muted-foreground">3 warnings detected</div>
                    </div>
                    <div className="text-muted-foreground">1 hour ago</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Benchmarks List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search benchmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    <SelectItem value="model_1">Security Analyzer</SelectItem>
                    <SelectItem value="model_2">Performance Predictor</SelectItem>
                    <SelectItem value="model_3">Anomaly Detector</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {benchmarks.map((benchmark) => (
                  <Card key={benchmark.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(benchmark.status)}
                          <CardTitle className="text-lg">{benchmark.name}</CardTitle>
                        </div>
                        <Badge variant={benchmark.status === 'completed' ? 'default' : benchmark.status === 'running' ? 'secondary' : 'outline'}>
                          {benchmark.status}
                        </Badge>
                      </div>
                      <CardDescription>{benchmark.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Model</div>
                          <div className="font-medium">{benchmark.modelName}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Type</div>
                          <div className="font-medium">{benchmark.type}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Latency</div>
                          <div className="font-medium">{benchmark.metrics.latency.toFixed(1)}ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Throughput</div>
                          <div className="font-medium">{benchmark.metrics.throughput}/s</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Memory</div>
                          <div className="font-medium">{benchmark.metrics.memory}GB</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">CPU</div>
                          <div className="font-medium">{benchmark.metrics.cpu}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Success Rate</div>
                          <div className="font-medium">{benchmark.metrics.successRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Error Rate</div>
                          <div className="font-medium">{(benchmark.metrics.errorRate * 100).toFixed(2)}%</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Last run: {benchmark.lastRun ? formatDate(benchmark.lastRun) : 'Never'}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRunTest(benchmark.id)}
                            disabled={isRunning === benchmark.id}
                          >
                            {isRunning === benchmark.id ? (
                              <Timer className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            Run
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Comparison</CardTitle>
                  <CardDescription>Compare model performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={performanceComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="latency" fill="#8884d8" name="Latency (ms)" />
                      <Line yAxisId="right" type="monotone" dataKey="throughput" stroke="#82ca9d" name="Throughput" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                  <CardDescription>Current system resource usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        CPU Usage
                      </span>
                      <span>42%</span>
                    </div>
                    <Progress value={42} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <MemoryStick className="h-4 w-4" />
                        Memory Usage
                      </span>
                      <span>68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Network I/O
                      </span>
                      <span>35%</span>
                    </div>
                    <Progress value={35} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Validation Reports */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search validation reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    <SelectItem value="model_1">Security Analyzer</SelectItem>
                    <SelectItem value="model_2">Performance Predictor</SelectItem>
                    <SelectItem value="model_3">Anomaly Detector</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {validationReports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(report.status)}
                          <CardTitle className="text-lg">{report.modelName}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={report.status === 'valid' ? 'default' : report.status === 'warning' ? 'secondary' : 'destructive'}>
                            {report.status}
                          </Badge>
                          <Badge variant="outline">
                            {report.score}/100
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>Version {report.version}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Checks</div>
                          <div className="font-medium">{report.totalChecks}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Passed</div>
                          <div className="font-medium text-green-600">{report.passedChecks}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Failed</div>
                          <div className="font-medium text-red-600">{report.failedChecks}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Warnings</div>
                          <div className="font-medium text-yellow-600">{report.warnings}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Validation Score</span>
                          <span>{report.score}/100</span>
                        </div>
                        <Progress value={report.score} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Created: {formatDate(report.createdAt)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                            View Report
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" />
                            Re-run
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Validation Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Validation Summary</CardTitle>
                  <CardDescription>Overall validation status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">78%</div>
                    <div className="text-sm text-muted-foreground">Average Validation Score</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Valid Models</span>
                      <span className="text-green-600">{validationReports.filter(v => v.status === 'valid').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Warnings</span>
                      <span className="text-yellow-600">{validationReports.filter(v => v.status === 'warning').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Invalid</span>
                      <span className="text-red-600">{validationReports.filter(v => v.status === 'invalid').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Issues</CardTitle>
                  <CardDescription>Frequently detected validation issues</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div>
                      <div className="font-medium">Input Validation</div>
                      <div className="text-muted-foreground">3 models affected</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium">Memory Usage</div>
                      <div className="text-muted-foreground">2 models affected</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">Performance Threshold</div>
                      <div className="text-muted-foreground">4 models affected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}