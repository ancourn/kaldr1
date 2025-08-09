'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Database,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Settings,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Lightbulb,
  Wrench,
  Rocket,
  Shield,
  Timer,
  Gauge,
  Brain
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Radar
} from 'recharts'

interface PerformanceMetrics {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: number
  requests: number
  latency: number
  errorRate: number
  throughput: number
}

interface ModelPerformance {
  modelId: string
  modelName: string
  status: 'healthy' | 'degraded' | 'critical'
  metrics: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    latency: number
    throughput: number
    availability: number
  }
  trends: {
    accuracy: number
    latency: number
    throughput: number
    errorRate: number
  }
  alerts: AlertItem[]
}

interface AlertItem {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
}

interface OptimizationRecommendation {
  id: string
  type: 'performance' | 'resource' | 'configuration' | 'scaling'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedImprovement: string
  priority: number
}

export function PerformanceMonitor({ className }: { className?: string }) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h')
  const [selectedModel, setSelectedModel] = useState('all')
  const [isRealTime, setIsRealTime] = useState(true)
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([])
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])

  // Mock performance data
  const generatePerformanceData = () => {
    const data: PerformanceMetrics[] = []
    const now = new Date()
    
    for (let i = 0; i < 60; i++) {
      const timestamp = new Date(now.getTime() - i * 60000).toISOString()
      data.push({
        timestamp,
        cpu: Math.random() * 30 + 40,
        memory: Math.random() * 20 + 60,
        disk: Math.random() * 10 + 20,
        network: Math.random() * 50 + 25,
        requests: Math.floor(Math.random() * 1000) + 500,
        latency: Math.random() * 20 + 30,
        errorRate: Math.random() * 2,
        throughput: Math.random() * 500 + 1000
      })
    }
    
    return data.reverse()
  }

  // Mock model performance data
  const mockModelPerformance: ModelPerformance[] = [
    {
      modelId: 'model_1',
      modelName: 'Security Analyzer',
      status: 'healthy',
      metrics: {
        accuracy: 0.94,
        precision: 0.92,
        recall: 0.95,
        f1Score: 0.93,
        latency: 45.2,
        throughput: 1250,
        availability: 99.9
      },
      trends: {
        accuracy: 2.1,
        latency: -5.3,
        throughput: 8.7,
        errorRate: -12.4
      },
      alerts: [
        {
          id: 'alert_1',
          type: 'warning',
          message: 'Latency increasing trend detected',
          timestamp: '2024-01-15T14:30:00Z',
          severity: 'medium',
          resolved: false
        }
      ]
    },
    {
      modelId: 'model_2',
      modelName: 'Performance Predictor',
      status: 'healthy',
      metrics: {
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.89,
        f1Score: 0.87,
        latency: 32.8,
        throughput: 1890,
        availability: 99.8
      },
      trends: {
        accuracy: 1.5,
        latency: -2.1,
        throughput: 12.3,
        errorRate: -8.9
      },
      alerts: []
    },
    {
      modelId: 'model_3',
      modelName: 'Anomaly Detector',
      status: 'degraded',
      metrics: {
        accuracy: 0.91,
        precision: 0.89,
        recall: 0.93,
        f1Score: 0.91,
        latency: 67.5,
        throughput: 890,
        availability: 98.5
      },
      trends: {
        accuracy: -1.2,
        latency: 15.7,
        throughput: -8.4,
        errorRate: 23.1
      },
      alerts: [
        {
          id: 'alert_2',
          type: 'error',
          message: 'High error rate detected',
          timestamp: '2024-01-15T14:25:00Z',
          severity: 'high',
          resolved: false
        },
        {
          id: 'alert_3',
          type: 'warning',
          message: 'Memory usage approaching limit',
          timestamp: '2024-01-15T14:20:00Z',
          severity: 'medium',
          resolved: false
        }
      ]
    }
  ]

  // Mock optimization recommendations
  const mockRecommendations: OptimizationRecommendation[] = [
    {
      id: 'rec_1',
      type: 'performance',
      title: 'Optimize Model Batch Size',
      description: 'Increase batch size from 32 to 64 to improve throughput by approximately 25%',
      impact: 'high',
      difficulty: 'easy',
      estimatedImprovement: '+25% throughput',
      priority: 1
    },
    {
      id: 'rec_2',
      type: 'resource',
      title: 'Add GPU Acceleration',
      description: 'Enable GPU support for Anomaly Detector model to reduce latency by up to 60%',
      impact: 'high',
      difficulty: 'medium',
      estimatedImprovement: '-60% latency',
      priority: 2
    },
    {
      id: 'rec_3',
      type: 'configuration',
      title: 'Adjust Cache Settings',
      description: 'Increase model cache size to reduce cold start latency',
      impact: 'medium',
      difficulty: 'easy',
      estimatedImprovement: '-15% latency',
      priority: 3
    },
    {
      id: 'rec_4',
      type: 'scaling',
      title: 'Implement Auto-scaling',
      description: 'Configure auto-scaling based on request volume to handle peak loads efficiently',
      impact: 'high',
      difficulty: 'hard',
      estimatedImprovement: '+200% scalability',
      priority: 4
    }
  ]

  useEffect(() => {
    setPerformanceData(generatePerformanceData())
    setModelPerformance(mockModelPerformance)
    setAlerts(mockModelPerformance.flatMap(m => m.alerts))
    setRecommendations(mockRecommendations)

    if (isRealTime) {
      const interval = setInterval(() => {
        setPerformanceData(prev => {
          const newData = [...prev.slice(1)]
          const now = new Date()
          newData.push({
            timestamp: now.toISOString(),
            cpu: Math.random() * 30 + 40,
            memory: Math.random() * 20 + 60,
            disk: Math.random() * 10 + 20,
            network: Math.random() * 50 + 25,
            requests: Math.floor(Math.random() * 1000) + 500,
            latency: Math.random() * 20 + 30,
            errorRate: Math.random() * 2,
            throughput: Math.random() * 500 + 1000
          })
          return newData
        })
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isRealTime])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatTrend = (trend: number) => {
    const isPositive = trend > 0
    const icon = isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
    const color = isPositive ? 'text-green-600' : 'text-red-600'
    const sign = isPositive ? '+' : ''
    
    return (
      <span className={`flex items-center gap-1 ${color}`}>
        {icon}
        {sign}{trend.toFixed(1)}%
      </span>
    )
  }

  const resourceUsageData = [
    { name: 'CPU', value: 65, color: '#8884d8' },
    { name: 'Memory', value: 72, color: '#82ca9d' },
    { name: 'Disk', value: 28, color: '#ffc658' },
    { name: 'Network', value: 45, color: '#ff7300' }
  ]

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time model performance monitoring and optimization</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={isRealTime ? "default" : "outline"}
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
          >
            {isRealTime ? <Activity className="h-4 w-4 mr-2" /> : <Timer className="h-4 w-4 mr-2" />}
            {isRealTime ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <p className="text-xs text-muted-foreground">Overall system availability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              {modelPerformance.filter(m => m.status === 'healthy').length} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.length > 0 
                ? performanceData[performanceData.length - 1].latency.toFixed(1) 
                : '0'
              }ms
            </div>
            <p className="text-xs text-muted-foreground">Across all models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alerts.filter(a => !a.resolved).length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Current system resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={resourceUsageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {resourceUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Key metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#8884d8" name="Latency (ms)" />
                    <Line yAxisId="right" type="monotone" dataKey="throughput" stroke="#82ca9d" name="Throughput" />
                  </LineChart>
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
                {performanceData.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Cpu className="h-4 w-4" />
                          CPU Usage
                        </span>
                        <span>{performanceData[performanceData.length - 1].cpu.toFixed(1)}%</span>
                      </div>
                      <Progress value={performanceData[performanceData.length - 1].cpu} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <MemoryStick className="h-4 w-4" />
                          Memory Usage
                        </span>
                        <span>{performanceData[performanceData.length - 1].memory.toFixed(1)}%</span>
                      </div>
                      <Progress value={performanceData[performanceData.length - 1].memory} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          Network I/O
                        </span>
                        <span>{performanceData[performanceData.length - 1].network.toFixed(1)}%</span>
                      </div>
                      <Progress value={performanceData[performanceData.length - 1].network} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          Disk Usage
                        </span>
                        <span>{performanceData[performanceData.length - 1].disk.toFixed(1)}%</span>
                      </div>
                      <Progress value={performanceData[performanceData.length - 1].disk} className="h-2" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Request Volume */}
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
                <CardDescription>Requests per minute</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="requests" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {modelPerformance.map((model) => (
              <Card key={model.modelId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(model.status)}
                      <CardTitle className="text-lg">{model.modelName}</CardTitle>
                    </div>
                    <Badge variant={model.status === 'healthy' ? 'default' : model.status === 'degraded' ? 'secondary' : 'destructive'}>
                      {model.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Accuracy</div>
                      <div className="font-medium">{(model.metrics.accuracy * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Latency</div>
                      <div className="font-medium">{model.metrics.latency.toFixed(1)}ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Throughput</div>
                      <div className="font-medium">{model.metrics.throughput}/s</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Availability</div>
                      <div className="font-medium">{model.metrics.availability.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Performance Trends</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Accuracy</span>
                        {formatTrend(model.trends.accuracy)}
                      </div>
                      <div className="flex justify-between">
                        <span>Latency</span>
                        {formatTrend(model.trends.latency)}
                      </div>
                      <div className="flex justify-between">
                        <span>Throughput</span>
                        {formatTrend(model.trends.throughput)}
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate</span>
                        {formatTrend(model.trends.errorRate)}
                      </div>
                    </div>
                  </div>

                  {model.alerts.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {model.alerts.length} active alert{model.alerts.length > 1 ? 's' : ''}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {alerts.filter(a => !a.resolved).map((alert) => (
              <Alert key={alert.id} className={alert.type === 'error' ? 'border-red-200' : 'border-yellow-200'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
            
            {alerts.filter(a => !a.resolved).length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No active alerts</h3>
                <p className="text-muted-foreground">All systems are operating normally</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getImpactColor(rec.impact)}>
                        {rec.impact} impact
                      </Badge>
                      <Badge variant="outline">
                        {rec.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{rec.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Estimated improvement: {rec.estimatedImprovement}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Wrench className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}