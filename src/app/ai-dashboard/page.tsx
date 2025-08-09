'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, 
  Cpu, 
  BarChart3, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Zap,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  Download,
  Play,
  Pause,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { RealTimeMonitor } from '@/components/ai/real-time-monitor'
import { ModelManagement } from '@/components/ai/model-management'
import { AnalyticsReporting } from '@/components/ai/analytics-reporting'
import { ModelMarketplace } from '@/components/ai/model-marketplace'
import { PerformanceMonitor } from '@/components/ai/performance-monitor'
import { TestingBenchmarking } from '@/components/ai/testing-benchmarking'
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
  ResponsiveContainer
} from 'recharts'

// Types
interface AIModel {
  id: string
  name: string
  type: 'transformer' | 'neural_network' | 'ensemble' | 'random_forest'
  version: string
  status: 'active' | 'training' | 'inactive'
  accuracy: number
  lastTrained: string
  description: string
}

interface AIPrediction {
  timestamp: string
  value: number
  confidence: number
  type: 'risk' | 'throughput' | 'anomaly' | 'gas'
}

interface AIAnomaly {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  timestamp: string
  confidence: number
}

interface AIMetrics {
  modelId: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  latency: number
  throughput: number
  timestamp: string
}

interface AIStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  uptime: string
  lastUpdate: string
  activeModels: string[]
  systemMetrics: {
    cpu: number
    memory: number
    connections: number
    requestsPerMinute: number
  }
}

// Mock data
const mockModels: AIModel[] = [
  {
    id: 'model_1',
    name: 'Security Analyzer',
    type: 'transformer',
    version: '1.2.0',
    status: 'active',
    accuracy: 0.94,
    lastTrained: '2024-01-15T10:30:00Z',
    description: 'Advanced smart contract vulnerability detection'
  },
  {
    id: 'model_2',
    name: 'Performance Predictor',
    type: 'neural_network',
    version: '2.1.0',
    status: 'active',
    accuracy: 0.87,
    lastTrained: '2024-01-14T15:45:00Z',
    description: 'Network performance and throughput forecasting'
  },
  {
    id: 'model_3',
    name: 'Anomaly Detector',
    type: 'ensemble',
    version: '1.5.0',
    status: 'training',
    accuracy: 0.91,
    lastTrained: '2024-01-13T09:20:00Z',
    description: 'Real-time anomaly detection for blockchain transactions'
  },
  {
    id: 'model_4',
    name: 'Gas Optimizer',
    type: 'random_forest',
    version: '1.0.0',
    status: 'inactive',
    accuracy: 0.82,
    lastTrained: '2024-01-10T14:15:00Z',
    description: 'Smart contract gas optimization recommendations'
  }
]

const mockPredictions: AIPrediction[] = [
  { timestamp: '2024-01-15T10:00:00Z', value: 0.15, confidence: 0.92, type: 'risk' },
  { timestamp: '2024-01-15T11:00:00Z', value: 0.18, confidence: 0.89, type: 'risk' },
  { timestamp: '2024-01-15T12:00:00Z', value: 0.22, confidence: 0.94, type: 'risk' },
  { timestamp: '2024-01-15T13:00:00Z', value: 0.19, confidence: 0.87, type: 'risk' },
  { timestamp: '2024-01-15T14:00:00Z', value: 0.25, confidence: 0.91, type: 'risk' }
]

const mockAnomalies: AIAnomaly[] = [
  {
    id: 'anomaly_1',
    type: 'transaction',
    severity: 'high',
    description: 'Unusual transaction pattern detected',
    timestamp: '2024-01-15T14:30:00Z',
    confidence: 0.87
  },
  {
    id: 'anomaly_2',
    type: 'contract',
    severity: 'medium',
    description: 'Contract behavior deviation detected',
    timestamp: '2024-01-15T13:45:00Z',
    confidence: 0.76
  },
  {
    id: 'anomaly_3',
    type: 'network',
    severity: 'low',
    description: 'Network latency spike observed',
    timestamp: '2024-01-15T12:20:00Z',
    confidence: 0.68
  }
]

const mockMetrics: AIMetrics[] = [
  {
    modelId: 'model_1',
    accuracy: 0.94,
    precision: 0.92,
    recall: 0.95,
    f1Score: 0.93,
    latency: 45.2,
    throughput: 1250,
    timestamp: '2024-01-15T14:00:00Z'
  },
  {
    modelId: 'model_2',
    accuracy: 0.87,
    precision: 0.85,
    recall: 0.89,
    f1Score: 0.87,
    latency: 32.8,
    throughput: 1890,
    timestamp: '2024-01-15T14:00:00Z'
  }
]

const mockStatus: AIStatus = {
  status: 'healthy',
  version: '1.0.0',
  uptime: '15d 4h 32m',
  lastUpdate: '2024-01-15T14:45:00Z',
  activeModels: ['model_1', 'model_2'],
  systemMetrics: {
    cpu: 45,
    memory: 62,
    connections: 24,
    requestsPerMinute: 156
  }
}

const performanceData = [
  { time: '10:00', accuracy: 94, latency: 45, throughput: 1250 },
  { time: '11:00', accuracy: 93, latency: 48, throughput: 1180 },
  { time: '12:00', accuracy: 95, latency: 42, throughput: 1320 },
  { time: '13:00', accuracy: 92, latency: 52, throughput: 1090 },
  { time: '14:00', accuracy: 94, latency: 45, throughput: 1250 }
]

const modelDistribution = [
  { name: 'Active', value: 2, color: '#22c55e' },
  { name: 'Training', value: 1, color: '#f59e0b' },
  { name: 'Inactive', value: 1, color: '#6b7280' }
]

const anomalySeverity = [
  { name: 'Critical', value: 0, color: '#dc2626' },
  { name: 'High', value: 1, color: '#ea580c' },
  { name: 'Medium', value: 1, color: '#ca8a04' },
  { name: 'Low', value: 1, color: '#65a30d' }
]

export default function AIDashboardPage() {
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [timeRange, setTimeRange] = useState('24h')
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [models, setModels] = useState<AIModel[]>(mockModels)
  const [predictions, setPredictions] = useState<AIPrediction[]>(mockPredictions)
  const [anomalies, setAnomalies] = useState<AIAnomaly[]>(mockAnomalies)
  const [metrics, setMetrics] = useState<AIMetrics[]>(mockMetrics)
  const [status, setStatus] = useState<AIStatus>(mockStatus)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'training': return 'bg-yellow-500'
      case 'inactive': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">AI Intelligence Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time AI monitoring and analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.status)}
              <span className={cn("text-sm font-medium", getStatusColor(status.status))}>
                {status.status.toUpperCase()}
              </span>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant={isMonitoring ? "destructive" : "default"} size="sm" onClick={toggleMonitoring}>
              {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              {getStatusIcon(status.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.status}</div>
              <p className="text-xs text-muted-foreground">Uptime: {status.uptime}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Models</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.activeModels.length}</div>
              <p className="text-xs text-muted-foreground">Total: {models.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{anomalies.length}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.reduce((acc, m) => acc + m.accuracy, 0) / metrics.length * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Across all models</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-11">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="hosting">Hosting</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="monitoring">Real-time</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance</CardTitle>
                  <CardDescription>Accuracy and latency over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy %" />
                      <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#82ca9d" name="Latency (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Model Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Status Distribution</CardTitle>
                  <CardDescription>Current status of all AI models</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={modelDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {modelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* System Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                  <CardDescription>Real-time system performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>{status.systemMetrics.cpu}%</span>
                    </div>
                    <Progress value={status.systemMetrics.cpu} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{status.systemMetrics.memory}%</span>
                    </div>
                    <Progress value={status.systemMetrics.memory} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{status.systemMetrics.connections}</div>
                      <div className="text-sm text-muted-foreground">Active Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{status.systemMetrics.requestsPerMinute}</div>
                      <div className="text-sm text-muted-foreground">Requests/min</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Anomalies */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Anomalies</CardTitle>
                  <CardDescription>Latest detected anomalies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {anomalies.slice(0, 3).map((anomaly) => (
                      <div key={anomaly.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getSeverityColor(anomaly.severity)}`} />
                          <div>
                            <div className="font-medium">{anomaly.type}</div>
                            <div className="text-sm text-muted-foreground">{anomaly.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{(anomaly.confidence * 100).toFixed(0)}%</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(anomaly.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <Card key={model.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <div className={`w-3 h-3 rounded-full ${getModelStatusColor(model.status)}`} />
                    </div>
                    <CardDescription>{model.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Type</div>
                        <div className="font-medium">{model.type}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Version</div>
                        <div className="font-medium">{model.version}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Accuracy</div>
                        <div className="font-medium">{(model.accuracy * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <Badge variant={model.status === 'active' ? 'default' : model.status === 'training' ? 'secondary' : 'outline'}>
                          {model.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">Last Trained</div>
                      <div className="font-medium">{new Date(model.lastTrained).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Model Management Tab */}
          <TabsContent value="management" className="space-y-6">
            <ModelManagement />
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Predictions</CardTitle>
                  <CardDescription>AI-powered risk assessment over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={predictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prediction Confidence</CardTitle>
                  <CardDescription>Model confidence levels for predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={predictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="confidence" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Anomaly Severity Distribution</CardTitle>
                  <CardDescription>Breakdown of detected anomalies by severity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={anomalySeverity}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {anomalySeverity.map((entry, index) => (
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
                  <CardTitle>Recent Anomalies</CardTitle>
                  <CardDescription>Detailed view of recent anomalies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {anomalies.map((anomaly) => (
                      <Alert key={anomaly.id}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{anomaly.type}</div>
                              <div className="text-sm">{anomaly.description}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(anomaly.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getSeverityColor(anomaly.severity)}`} />
                              <Badge variant="outline">{anomaly.severity}</Badge>
                              <span className="text-sm font-medium">{(anomaly.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Real-time Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <RealTimeMonitor onAlert={(alert) => {
              console.log('New alert:', alert)
            }} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsReporting />
          </TabsContent>

          {/* Model Hosting Tab */}
          <TabsContent value="hosting" className="space-y-6">
            <ModelManagement />
          </TabsContent>

          {/* Model Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <ModelMarketplace />
          </TabsContent>

          {/* Performance Monitor Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceMonitor />
          </TabsContent>

          {/* Testing & Benchmarking Tab */}
          <TabsContent value="testing" className="space-y-6">
            <TestingBenchmarking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}