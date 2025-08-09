'use client'

import { useState } from 'react'
import { 
  Brain, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Upload,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Zap,
  Database,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface AIModel {
  id: string
  name: string
  type: 'transformer' | 'neural_network' | 'ensemble' | 'random_forest'
  version: string
  status: 'active' | 'training' | 'inactive' | 'error'
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  latency: number
  throughput: number
  lastTrained: string
  description: string
  parameters: Record<string, any>
  dataset: string
  size: string
  config: string
}

interface TrainingJob {
  id: string
  modelId: string
  modelName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: string
  estimatedCompletion: string
  dataset: string
  epochs: number
  currentEpoch: number
  loss: number
  accuracy: number
}

interface ModelManagementProps {
  className?: string
}

export function ModelManagement({ className }: ModelManagementProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingConfig, setTrainingConfig] = useState({
    dataset: '',
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2
  })

  // Mock data
  const models: AIModel[] = [
    {
      id: 'model_1',
      name: 'Security Analyzer',
      type: 'transformer',
      version: '1.2.0',
      status: 'active',
      accuracy: 0.94,
      precision: 0.92,
      recall: 0.95,
      f1Score: 0.93,
      latency: 45.2,
      throughput: 1250,
      lastTrained: '2024-01-15T10:30:00Z',
      description: 'Advanced smart contract vulnerability detection using transformer architecture',
      parameters: {
        layers: 12,
        heads: 8,
        hidden_size: 768,
        dropout: 0.1
      },
      dataset: 'smart_contracts_v3',
      size: '2.4GB',
      config: 'security_analyzer_config.json'
    },
    {
      id: 'model_2',
      name: 'Performance Predictor',
      type: 'neural_network',
      version: '2.1.0',
      status: 'active',
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.89,
      f1Score: 0.87,
      latency: 32.8,
      throughput: 1890,
      lastTrained: '2024-01-14T15:45:00Z',
      description: 'Network performance and throughput forecasting using deep neural networks',
      parameters: {
        layers: 6,
        neurons: 512,
        activation: 'relu',
        optimizer: 'adam'
      },
      dataset: 'network_metrics_v2',
      size: '1.8GB',
      config: 'performance_predictor_config.json'
    },
    {
      id: 'model_3',
      name: 'Anomaly Detector',
      type: 'ensemble',
      version: '1.5.0',
      status: 'training',
      accuracy: 0.91,
      precision: 0.89,
      recall: 0.93,
      f1Score: 0.91,
      latency: 67.5,
      throughput: 890,
      lastTrained: '2024-01-13T09:20:00Z',
      description: 'Real-time anomaly detection using ensemble methods',
      parameters: {
        models: ['isolation_forest', 'autoencoder', 'lstm'],
        voting: 'soft',
        threshold: 0.8
      },
      dataset: 'transaction_patterns_v4',
      size: '3.2GB',
      config: 'anomaly_detector_config.json'
    },
    {
      id: 'model_4',
      name: 'Gas Optimizer',
      type: 'random_forest',
      version: '1.0.0',
      status: 'inactive',
      accuracy: 0.82,
      precision: 0.80,
      recall: 0.84,
      f1Score: 0.82,
      latency: 23.4,
      throughput: 2150,
      lastTrained: '2024-01-10T14:15:00Z',
      description: 'Smart contract gas optimization recommendations using random forest',
      parameters: {
        trees: 100,
        max_depth: 10,
        min_samples_split: 5,
        criterion: 'mse'
      },
      dataset: 'gas_optimization_v1',
      size: '890MB',
      config: 'gas_optimizer_config.json'
    }
  ]

  const trainingJobs: TrainingJob[] = [
    {
      id: 'job_1',
      modelId: 'model_3',
      modelName: 'Anomaly Detector',
      status: 'running',
      progress: 65,
      startTime: '2024-01-15T12:00:00Z',
      estimatedCompletion: '2024-01-15T18:00:00Z',
      dataset: 'transaction_patterns_v4',
      epochs: 100,
      currentEpoch: 65,
      loss: 0.0234,
      accuracy: 0.91
    },
    {
      id: 'job_2',
      modelId: 'model_1',
      modelName: 'Security Analyzer',
      status: 'completed',
      progress: 100,
      startTime: '2024-01-14T08:00:00Z',
      estimatedCompletion: '2024-01-14T16:00:00Z',
      dataset: 'smart_contracts_v3',
      epochs: 50,
      currentEpoch: 50,
      loss: 0.0156,
      accuracy: 0.94
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'training': return 'bg-yellow-500'
      case 'inactive': return 'bg-gray-500'
      case 'error': return 'bg-red-500'
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      case 'pending': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'training': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'inactive': return <Pause className="h-4 w-4 text-gray-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatFileSize = (size: string) => {
    return size
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleStartTraining = (modelId: string) => {
    setIsTraining(true)
    // In a real implementation, this would start the training process
    setTimeout(() => setIsTraining(false), 2000)
  }

  const handleStopTraining = (modelId: string) => {
    // In a real implementation, this would stop the training process
    console.log('Stopping training for model:', modelId)
  }

  const handleDeployModel = (modelId: string) => {
    // In a real implementation, this would deploy the model
    console.log('Deploying model:', modelId)
  }

  const handleDeleteModel = (modelId: string) => {
    // In a real implementation, this would delete the model
    console.log('Deleting model:', modelId)
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {models.map((model) => (
              <Card key={model.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(model.status)}`} />
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{model.version}</Badge>
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
                      <div className="text-muted-foreground">Status</div>
                      <Badge variant={model.status === 'active' ? 'default' : model.status === 'training' ? 'secondary' : 'outline'}>
                        {model.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Accuracy</div>
                      <div className="font-medium">{(model.accuracy * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Latency</div>
                      <div className="font-medium">{model.latency.toFixed(1)}ms</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>F1 Score</span>
                      <span>{(model.f1Score * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={model.f1Score * 100} className="h-2" />
                  </div>

                  <div className="text-sm">
                    <div className="text-muted-foreground">Dataset</div>
                    <div className="font-medium">{model.dataset}</div>
                  </div>

                  <div className="text-sm">
                    <div className="text-muted-foreground">Size</div>
                    <div className="font-medium">{formatFileSize(model.size)}</div>
                  </div>

                  <div className="text-sm">
                    <div className="text-muted-foreground">Last Trained</div>
                    <div className="font-medium">{formatDate(model.lastTrained)}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleStartTraining(model.id)}
                      disabled={model.status === 'training'}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Train
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
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

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Training Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Active Training Jobs</CardTitle>
                <CardDescription>Currently running model training processes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trainingJobs.filter(job => job.status === 'running').map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{job.modelName}</div>
                          <div className="text-sm text-muted-foreground">{job.dataset}</div>
                        </div>
                        <Badge variant="default">Running</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <div className="text-muted-foreground">Epoch</div>
                          <div className="font-medium">{job.currentEpoch}/{job.epochs}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Loss</div>
                          <div className="font-medium">{job.loss.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Accuracy</div>
                          <div className="font-medium">{(job.accuracy * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">ETA</div>
                          <div className="font-medium">{new Date(job.estimatedCompletion).toLocaleTimeString()}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => handleStopTraining(job.modelId)}>
                          <Pause className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Training Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Training Configuration</CardTitle>
                <CardDescription>Configure new model training parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-select">Model</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model to train" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.filter(m => m.status !== 'training').map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataset">Dataset</Label>
                  <Input
                    id="dataset"
                    placeholder="Enter dataset name or path"
                    value={trainingConfig.dataset}
                    onChange={(e) => setTrainingConfig({...trainingConfig, dataset: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="epochs">Epochs</Label>
                    <Input
                      id="epochs"
                      type="number"
                      value={trainingConfig.epochs}
                      onChange={(e) => setTrainingConfig({...trainingConfig, epochs: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      value={trainingConfig.batchSize}
                      onChange={(e) => setTrainingConfig({...trainingConfig, batchSize: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="learning-rate">Learning Rate</Label>
                    <Input
                      id="learning-rate"
                      type="number"
                      step="0.0001"
                      value={trainingConfig.learningRate}
                      onChange={(e) => setTrainingConfig({...trainingConfig, learningRate: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validation-split">Validation Split</Label>
                    <Input
                      id="validation-split"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={trainingConfig.validationSplit}
                      onChange={(e) => setTrainingConfig({...trainingConfig, validationSplit: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <Button className="w-full" disabled={isTraining}>
                  {isTraining ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  {isTraining ? 'Starting Training...' : 'Start Training'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Training History */}
          <Card>
            <CardHeader>
              <CardTitle>Training History</CardTitle>
              <CardDescription>Recent training jobs and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trainingJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
                      <div>
                        <div className="font-medium">{job.modelName}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.dataset} • {formatDate(job.startTime)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                        {job.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {job.accuracy ? `Accuracy: ${(job.accuracy * 100).toFixed(1)}%` : 'In progress'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Deployment */}
            <Card>
              <CardHeader>
                <CardTitle>Model Deployment</CardTitle>
                <CardDescription>Deploy models to production environments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.filter(m => m.status === 'active' || m.status === 'inactive').map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {model.type} • {model.version}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                          {model.status === 'active' ? 'Deployed' : 'Not Deployed'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleDeployModel(model.id)}>
                          {model.status === 'active' ? 'Redeploy' : 'Deploy'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deployment Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Deployment Settings</CardTitle>
                <CardDescription>Configure deployment parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deployment environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="replicas">Replicas</Label>
                  <Input id="replicas" type="number" defaultValue="3" min="1" max="10" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resources">Resource Allocation</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (2CPU, 4GB RAM)</SelectItem>
                      <SelectItem value="medium">Medium (4CPU, 8GB RAM)</SelectItem>
                      <SelectItem value="large">Large (8CPU, 16GB RAM)</SelectItem>
                      <SelectItem value="xlarge">X-Large (16CPU, 32GB RAM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoscaling">Autoscaling</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select autoscaling policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="cpu">CPU-based</SelectItem>
                      <SelectItem value="memory">Memory-based</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Deploy Configuration
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Deployment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Deployment Status</CardTitle>
              <CardDescription>Current deployment status and health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">2</div>
                  <div className="text-sm text-muted-foreground">Active Deployments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">45ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}