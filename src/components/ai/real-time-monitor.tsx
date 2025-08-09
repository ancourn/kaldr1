'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  Zap,
  RefreshCw,
  Pause,
  Play,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface RealTimeMetrics {
  timestamp: string
  cpu: number
  memory: number
  requestsPerMinute: number
  activeConnections: number
  modelLatency: number
  throughput: number
  anomalyCount: number
  riskScore: number
}

interface AlertData {
  id: string
  type: 'system' | 'model' | 'anomaly' | 'performance'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  timestamp: string
  resolved: boolean
}

interface ModelStatus {
  id: string
  name: string
  status: 'active' | 'training' | 'inactive' | 'error'
  accuracy: number
  latency: number
  throughput: number
  lastUpdate: string
}

interface RealTimeMonitorProps {
  className?: string
  onAlert?: (alert: AlertData) => void
}

export function RealTimeMonitor({ className, onAlert }: RealTimeMonitorProps) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [metrics, setMetrics] = useState<RealTimeMetrics[]>([])
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [updateInterval, setUpdateInterval] = useState(5000) // 5 seconds
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize mock data
  useEffect(() => {
    const initialMetrics: RealTimeMetrics = {
      timestamp: new Date().toISOString(),
      cpu: 45,
      memory: 62,
      requestsPerMinute: 156,
      activeConnections: 24,
      modelLatency: 45.2,
      throughput: 1250,
      anomalyCount: 3,
      riskScore: 0.15
    }
    setMetrics([initialMetrics])

    const initialModels: ModelStatus[] = [
      {
        id: 'model_1',
        name: 'Security Analyzer',
        status: 'active',
        accuracy: 0.94,
        latency: 45.2,
        throughput: 1250,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'model_2',
        name: 'Performance Predictor',
        status: 'active',
        accuracy: 0.87,
        latency: 32.8,
        throughput: 1890,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'model_3',
        name: 'Anomaly Detector',
        status: 'training',
        accuracy: 0.91,
        latency: 67.5,
        throughput: 890,
        lastUpdate: new Date().toISOString()
      }
    ]
    setModelStatuses(initialModels)

    const initialAlerts: AlertData[] = [
      {
        id: 'alert_1',
        type: 'performance',
        severity: 'medium',
        message: 'Model latency increased by 15%',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        resolved: false
      },
      {
        id: 'alert_2',
        type: 'anomaly',
        severity: 'high',
        message: 'Unusual transaction pattern detected',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        resolved: false
      }
    ]
    setAlerts(initialAlerts)
  }, [])

  // Simulate real-time updates
  useEffect(() => {
    if (isMonitoring) {
      intervalRef.current = setInterval(() => {
        updateMetrics()
        updateModelStatuses()
        checkForAlerts()
      }, updateInterval)

      setConnectionStatus('connected')
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setConnectionStatus('disconnected')
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isMonitoring, updateInterval])

  const updateMetrics = () => {
    const lastMetric = metrics[metrics.length - 1]
    const newMetric: RealTimeMetrics = {
      timestamp: new Date().toISOString(),
      cpu: Math.max(20, Math.min(90, lastMetric.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(40, Math.min(85, lastMetric.memory + (Math.random() - 0.5) * 8)),
      requestsPerMinute: Math.max(100, Math.min(300, lastMetric.requestsPerMinute + (Math.random() - 0.5) * 20)),
      activeConnections: Math.max(15, Math.min(50, lastMetric.activeConnections + (Math.random() - 0.5) * 5)),
      modelLatency: Math.max(20, Math.min(100, lastMetric.modelLatency + (Math.random() - 0.5) * 15)),
      throughput: Math.max(800, Math.min(2000, lastMetric.throughput + (Math.random() - 0.5) * 100)),
      anomalyCount: Math.max(0, Math.min(10, Math.floor(lastMetric.anomalyCount + (Math.random() - 0.5) * 2))),
      riskScore: Math.max(0, Math.min(1, lastMetric.riskScore + (Math.random() - 0.5) * 0.1))
    }

    setMetrics(prev => [...prev.slice(-19), newMetric]) // Keep last 20 metrics
  }

  const updateModelStatuses = () => {
    setModelStatuses(prev => prev.map(model => ({
      ...model,
      accuracy: Math.max(0.7, Math.min(0.99, model.accuracy + (Math.random() - 0.5) * 0.02)),
      latency: Math.max(20, Math.min(100, model.latency + (Math.random() - 0.5) * 10)),
      throughput: Math.max(500, Math.min(2500, model.throughput + (Math.random() - 0.5) * 100)),
      lastUpdate: new Date().toISOString()
    })))
  }

  const checkForAlerts = () => {
    const lastMetric = metrics[metrics.length - 1]
    const newAlerts: AlertData[] = []

    // Check for performance alerts
    if (lastMetric.cpu > 80) {
      newAlerts.push({
        id: `alert_${Date.now()}_cpu`,
        type: 'system',
        severity: 'high',
        message: `High CPU usage: ${lastMetric.cpu.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    if (lastMetric.memory > 80) {
      newAlerts.push({
        id: `alert_${Date.now()}_memory`,
        type: 'system',
        severity: 'high',
        message: `High memory usage: ${lastMetric.memory.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    if (lastMetric.modelLatency > 80) {
      newAlerts.push({
        id: `alert_${Date.now()}_latency`,
        type: 'performance',
        severity: 'medium',
        message: `High model latency: ${lastMetric.modelLatency.toFixed(1)}ms`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    if (lastMetric.riskScore > 0.8) {
      newAlerts.push({
        id: `alert_${Date.now()}_risk`,
        type: 'anomaly',
        severity: 'high',
        message: `High risk score detected: ${(lastMetric.riskScore * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]) // Keep last 10 alerts
      newAlerts.forEach(alert => onAlert?.(alert))
    }
  }

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'disconnected': return 'text-gray-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
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
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const currentMetrics = metrics[metrics.length - 1] || {
    cpu: 0,
    memory: 0,
    requestsPerMinute: 0,
    activeConnections: 0,
    modelLatency: 0,
    throughput: 0,
    anomalyCount: 0,
    riskScore: 0
  }

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved)

  if (!isExpanded) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle className="text-lg">Real-time Monitor</CardTitle>
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleMonitoring}>
                {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsExpanded(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU</span>
                <span>{currentMetrics.cpu.toFixed(1)}%</span>
              </div>
              <Progress value={currentMetrics.cpu} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory</span>
                <span>{currentMetrics.memory.toFixed(1)}%</span>
              </div>
              <Progress value={currentMetrics.memory} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Latency</span>
                <span>{currentMetrics.modelLatency.toFixed(1)}ms</span>
              </div>
              <Progress value={Math.min(100, currentMetrics.modelLatency)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Alerts</span>
                <Badge variant="destructive">{unresolvedAlerts.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {unresolvedAlerts.length} active alerts
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle className="text-lg">Real-time AI Monitor</CardTitle>
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleMonitoring}>
                {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isMonitoring ? 'Stop' : 'Start'} Monitoring
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsExpanded(false)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span>{currentMetrics.cpu.toFixed(1)}%</span>
              </div>
              <Progress value={currentMetrics.cpu} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{currentMetrics.memory.toFixed(1)}%</span>
              </div>
              <Progress value={currentMetrics.memory} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Model Latency</span>
                <span>{currentMetrics.modelLatency.toFixed(1)}ms</span>
              </div>
              <Progress value={Math.min(100, currentMetrics.modelLatency)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Throughput</span>
                <span>{currentMetrics.throughput.toFixed(0)}/s</span>
              </div>
              <Progress value={Math.min(100, currentMetrics.throughput / 20)} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Performance</CardTitle>
                <CardDescription>Real-time CPU and Memory usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Model Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Status</CardTitle>
                <CardDescription>Current status of AI models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modelStatuses.map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getModelStatusColor(model.status)}`} />
                        <div>
                          <div className="font-medium text-sm">{model.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Accuracy: {(model.accuracy * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{model.latency.toFixed(1)}ms</div>
                        <div className="text-xs text-muted-foreground">
                          {model.throughput.toFixed(0)}/s
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Active Alerts</CardTitle>
              <CardDescription>Recent system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {unresolvedAlerts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p>No active alerts</p>
                  </div>
                ) : (
                  unresolvedAlerts.map((alert) => (
                    <Alert key={alert.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{alert.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                            <Badge variant="outline">{alert.severity}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}