"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Server, 
  Database, 
  Network, 
  Shield, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  HardDrive,
  Cpu,
  Globe,
  Users,
  Building,
  DollarSign,
  BarChart3,
  Settings,
  Monitor,
  Backup,
  Lock,
  Target,
  Rocket,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";

interface DeploymentStatus {
  overall_health: 'excellent' | 'good' | 'warning' | 'critical';
  uptime_percentage: number;
  active_nodes: number;
  total_nodes: number;
  network_throughput: number;
  block_height: number;
  last_block_time: string;
  quantum_resistance_score: number;
  security_status: 'secure' | 'monitoring' | 'alert' | 'breached';
}

interface PerformanceMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_latency: number;
  transaction_throughput: number;
  block_confirmation_time: number;
  api_response_time: number;
  database_performance: number;
}

interface ResourceOptimization {
  cost_efficiency: number;
  resource_utilization: number;
  scaling_efficiency: number;
  energy_efficiency: number;
  optimization_score: number;
  recommendations: string[];
}

interface MonitoringAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'performance' | 'security' | 'availability' | 'capacity';
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  affected_systems: string[];
}

interface EnterpriseDeployment {
  id: string;
  name: string;
  industry: string;
  deployment_size: 'small' | 'medium' | 'large' | 'enterprise';
  status: 'deploying' | 'active' | 'maintenance' | 'issue';
  uptime: number;
  transactions_per_day: number;
  last_health_check: string;
  integration_status: 'pending' | 'partial' | 'complete';
}

export default function ProductionPage() {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    overall_health: 'excellent',
    uptime_percentage: 0,
    active_nodes: 0,
    total_nodes: 0,
    network_throughput: 0,
    block_height: 0,
    last_block_time: '',
    quantum_resistance_score: 0,
    security_status: 'secure'
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_latency: 0,
    transaction_throughput: 0,
    block_confirmation_time: 0,
    api_response_time: 0,
    database_performance: 0
  });

  const [resourceOptimization, setResourceOptimization] = useState<ResourceOptimization>({
    cost_efficiency: 0,
    resource_utilization: 0,
    scaling_efficiency: 0,
    energy_efficiency: 0,
    optimization_score: 0,
    recommendations: []
  });

  const [monitoringAlerts, setMonitoringAlerts] = useState<MonitoringAlert[]>([]);
  const [enterpriseDeployments, setEnterpriseDeployments] = useState<EnterpriseDeployment[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductionData = async () => {
      // Simulate API calls with mock data
      setDeploymentStatus({
        overall_health: 'excellent',
        uptime_percentage: 99.98,
        active_nodes: 15420,
        total_nodes: 15420,
        network_throughput: 2847000,
        block_height: 1584720,
        last_block_time: new Date().toISOString(),
        quantum_resistance_score: 98.5,
        security_status: 'secure'
      });

      setPerformanceMetrics({
        cpu_usage: 67,
        memory_usage: 72,
        disk_usage: 58,
        network_latency: 12,
        transaction_throughput: 2847,
        block_confirmation_time: 2.1,
        api_response_time: 45,
        database_performance: 94
      });

      setResourceOptimization({
        cost_efficiency: 87,
        resource_utilization: 82,
        scaling_efficiency: 91,
        energy_efficiency: 85,
        optimization_score: 86,
        recommendations: [
          "Consider auto-scaling for peak hours",
          "Optimize database query performance",
          "Implement edge caching for global users",
          "Review storage allocation for cost savings"
        ]
      });

      setMonitoringAlerts([
        {
          id: 'alert-001',
          severity: 'medium',
          type: 'performance',
          message: 'High CPU usage detected on European nodes',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          status: 'active',
          affected_systems: ['eu-node-1', 'eu-node-2']
        },
        {
          id: 'alert-002',
          severity: 'low',
          type: 'capacity',
          message: 'Database storage approaching 80% capacity',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          status: 'acknowledged',
          affected_systems: ['primary-db', 'backup-db']
        },
        {
          id: 'alert-003',
          severity: 'high',
          type: 'security',
          message: 'Unusual login attempts detected',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          status: 'resolved',
          affected_systems: ['auth-service', 'api-gateway']
        }
      ]);

      setEnterpriseDeployments([
        {
          id: 'ent-001',
          name: 'Global Financial Corp',
          industry: 'Finance',
          deployment_size: 'enterprise',
          status: 'active',
          uptime: 99.99,
          transactions_per_day: 450000,
          last_health_check: new Date().toISOString(),
          integration_status: 'complete'
        },
        {
          id: 'ent-002',
          name: 'TechSupply Chain Ltd',
          industry: 'Logistics',
          deployment_size: 'large',
          status: 'active',
          uptime: 99.95,
          transactions_per_day: 125000,
          last_health_check: new Date(Date.now() - 300000).toISOString(),
          integration_status: 'complete'
        },
        {
          id: 'ent-003',
          name: 'Healthcare Systems Inc',
          industry: 'Healthcare',
          deployment_size: 'medium',
          status: 'deploying',
          uptime: 98.2,
          transactions_per_day: 75000,
          last_health_check: new Date(Date.now() - 600000).toISOString(),
          integration_status: 'partial'
        }
      ]);

      setLoading(false);
    };

    fetchProductionData();

    // Set up auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchProductionData, 10000);
    }

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSecurityColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-green-600';
      case 'monitoring': return 'text-blue-600';
      case 'alert': return 'text-yellow-600';
      case 'breached': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'deploying': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-yellow-600" />;
      case 'issue': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatUptime = (uptime: number) => {
    return uptime.toFixed(2) + "%";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Server className="h-16 w-16 text-white" />
              <h1 className="text-6xl font-bold">
                Production Deployment
              </h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Mainnet Optimization & Enterprise Scaling
            </h2>
            <p className="text-xl max-w-4xl mx-auto mb-8 text-blue-100">
              Production-ready infrastructure with enterprise-grade monitoring, optimization, 
              and deployment tools. Scalable, secure, and optimized for global enterprise adoption.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                <Rocket className="mr-2 h-5 w-5" />
                Deploy to Production
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                <Monitor className="mr-2 h-5 w-5" />
                View Monitoring
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getHealthColor(deploymentStatus.overall_health).split(' ')[1]}`}></div>
                <span className="text-sm font-medium capitalize">{deploymentStatus.overall_health} Health</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">{formatUptime(deploymentStatus.uptime_percentage)} Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">{deploymentStatus.active_nodes} Nodes Active</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Control Panel */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="deployment-status" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deployment-status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Deployment Status
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="enterprise" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Enterprise
            </TabsTrigger>
          </TabsList>

          {/* Deployment Status Tab */}
          <TabsContent value="deployment-status" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{deploymentStatus.overall_health}</div>
                  <p className="text-xs text-muted-foreground">System status</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUptime(deploymentStatus.uptime_percentage)}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
                  <Network className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(deploymentStatus.active_nodes)}</div>
                  <p className="text-xs text-muted-foreground">of {formatNumber(deploymentStatus.total_nodes)} total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getSecurityColor(deploymentStatus.security_status)}`}>
                    {deploymentStatus.security_status}
                  </div>
                  <p className="text-xs text-muted-foreground">Quantum resistance</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Network Performance
                  </CardTitle>
                  <CardDescription>
                    Real-time network throughput and block processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Network Throughput</span>
                      <span className="font-medium">{formatNumber(deploymentStatus.network_throughput)} TPS</span>
                    </div>
                    <Progress value={(deploymentStatus.network_throughput / 5000) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Block Height</span>
                      <span className="font-medium">{formatNumber(deploymentStatus.block_height)}</span>
                    </div>
                    <Progress value={(deploymentStatus.block_height / 2000000) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Quantum Resistance</span>
                      <span className="font-medium">{deploymentStatus.quantum_resistance_score}%</span>
                    </div>
                    <Progress value={deploymentStatus.quantum_resistance_score} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Active Alerts
                  </CardTitle>
                  <CardDescription>
                    Current monitoring alerts and system notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monitoringAlerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getAlertSeverityColor(alert.severity)}`}></div>
                          <div>
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">{alert.type}</p>
                          </div>
                        </div>
                        <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                          {alert.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceMetrics.cpu_usage}%</div>
                  <Progress value={performanceMetrics.cpu_usage} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceMetrics.memory_usage}%</div>
                  <Progress value={performanceMetrics.memory_usage} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceMetrics.disk_usage}%</div>
                  <Progress value={performanceMetrics.disk_usage} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
                  <Network className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceMetrics.network_latency}ms</div>
                  <p className="text-xs text-muted-foreground">Average response</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Transaction Performance
                  </CardTitle>
                  <CardDescription>
                    Transaction throughput and confirmation metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Transaction Throughput</span>
                      <span className="font-medium">{formatNumber(performanceMetrics.transaction_throughput)} TPS</span>
                    </div>
                    <Progress value={(performanceMetrics.transaction_throughput / 5000) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Block Confirmation Time</span>
                      <span className="font-medium">{performanceMetrics.block_confirmation_time}s</span>
                    </div>
                    <Progress value={100 - (performanceMetrics.block_confirmation_time / 10) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>API Response Time</span>
                      <span className="font-medium">{performanceMetrics.api_response_time}ms</span>
                    </div>
                    <Progress value={100 - (performanceMetrics.api_response_time / 200) * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Performance
                  </CardTitle>
                  <CardDescription>
                    Database efficiency and query performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Database Performance</span>
                      <span className="font-medium">{performanceMetrics.database_performance}%</span>
                    </div>
                    <Progress value={performanceMetrics.database_performance} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Query Cache Hit:</span>
                      <span className="ml-1 font-medium">94%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Connection Pool:</span>
                      <span className="ml-1 font-medium">87%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Index Usage:</span>
                      <span className="ml-1 font-medium">92%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Replication Lag:</span>
                      <span className="ml-1 font-medium">12ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resourceOptimization.cost_efficiency}%</div>
                  <Progress value={resourceOptimization.cost_efficiency} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resourceOptimization.resource_utilization}%</div>
                  <Progress value={resourceOptimization.resource_utilization} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resourceOptimization.optimization_score}%</div>
                  <Progress value={resourceOptimization.optimization_score} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Optimization Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered recommendations for system optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resourceOptimization.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">{recommendation}</p>
                        <p className="text-xs text-muted-foreground">Priority: {index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enterprise Tab */}
          <TabsContent value="enterprise" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{enterpriseDeployments.length}</div>
                  <p className="text-xs text-muted-foreground">Enterprise clients</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {enterpriseDeployments.filter(d => d.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently operational</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Transactions</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(enterpriseDeployments.reduce((sum, d) => sum + d.transactions_per_day, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all deployments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatUptime(enterpriseDeployments.reduce((sum, d) => sum + d.uptime, 0) / enterpriseDeployments.length)}
                  </div>
                  <p className="text-xs text-muted-foreground">System reliability</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Enterprise Deployments
                </CardTitle>
                <CardDescription>
                  Active enterprise deployments and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enterpriseDeployments.map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <h4 className="font-medium">{deployment.name}</h4>
                          <p className="text-sm text-muted-foreground">{deployment.industry} • {deployment.deployment_size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatNumber(deployment.transactions_per_day)} TX/day</p>
                          <p className="text-xs text-muted-foreground">{formatUptime(deployment.uptime)} uptime</p>
                        </div>
                        <Badge variant={deployment.status === 'active' ? 'default' : 'secondary'}>
                          {deployment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}