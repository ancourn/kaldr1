'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Download, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  GasPump,
  Shield,
  Bell,
  Calendar,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  metrics: Array<{
    timestamp: string;
    gasUsed: number;
    gasPrice: number;
    executionTime: number;
    successRate: number;
    tps: number;
    memoryUsage: number;
  }>;
  executions: Array<{
    id: string;
    contractId: string;
    functionName: string;
    status: string;
    gasUsed: number;
    gasPrice: number;
    createdAt: string;
    contract: {
      name: string;
      address: string;
    };
    user: {
      name: string;
      email: string;
    };
  }>;
  gasStats: {
    avgGasUsed: number;
    avgGasPrice: number;
    maxGasUsed: number;
    maxGasPrice: number;
    minGasUsed: number;
    minGasPrice: number;
    totalExecutions: number;
  };
  audits: Array<{
    id: string;
    score: number;
    status: string;
    vulnerabilities: Array<{
      type: string;
      severity: string;
      description: string;
    }>;
    createdAt: string;
    contract: {
      name: string;
      address: string;
    };
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    status: string;
    createdAt: string;
    contract: {
      name: string;
      address: string;
    };
  }>;
  gasHeatmap: Array<{
    hour: number;
    avgGas: number;
    count: number;
  }>;
  timeframe: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('24h');
  const [selectedDataType, setSelectedDataType] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('json');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedContract, selectedTimeframe]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        ...(selectedContract && { contractId: selectedContract }),
      });
      
      const response = await fetch(`/api/dashboard/metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        format: selectedFormat,
        dataType: selectedDataType,
        ...(selectedContract && { contractId: selectedContract }),
      });

      const response = await fetch(`/api/dashboard/export?${params}`);
      if (!response.ok) throw new Error('Failed to export data');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kaldrix-dashboard-${selectedTimeframe}-${Date.now()}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Dashboard data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export dashboard data');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'passed':
        return 'bg-green-500';
      case 'failed':
      case 'error':
        return 'bg-red-500';
      case 'pending':
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights into smart contract performance and security
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="contract-filter">Contract:</Label>
            <Select value={selectedContract} onValueChange={setSelectedContract}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Contracts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Contracts</SelectItem>
                {/* Add contract options here */}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="timeframe">Timeframe:</Label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.gasStats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedTimeframe}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Gas Used</CardTitle>
            <GasPump className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.gasStats.avgGasUsed).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Min: {Math.round(data.gasStats.minGasUsed).toLocaleString()} | Max: {Math.round(data.gasStats.maxGasUsed).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.audits.length > 0 
                ? Math.round(data.audits.reduce((sum, audit) => sum + audit.score, 0) / data.audits.length)
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {data.audits.length} audits completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.alerts.filter(a => a.severity === 'high').length} high severity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Execution Timeline</TabsTrigger>
          <TabsTrigger value="gas">Gas Analysis</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Contract Executions</CardTitle>
              <CardDescription>
                Latest smart contract executions with status and gas usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {data.executions.map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(execution.status)}`} />
                        <div>
                          <div className="font-medium">{execution.contract.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {execution.functionName} by {execution.user.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{Math.round(execution.gasUsed).toLocaleString()} gas</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(execution.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gas Usage Heatmap</CardTitle>
                <CardDescription>
                  Average gas usage by hour of day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {data.gasHeatmap.map((hour) => (
                    <div
                      key={hour.hour}
                      className="p-2 text-center text-xs rounded bg-blue-100 text-blue-800"
                      title={`${hour.hour}:00 - Avg: ${Math.round(hour.avgGas)} gas - ${hour.count} executions`}
                    >
                      <div>{hour.hour}:00</div>
                      <div className="font-bold">{Math.round(hour.avgGas / 1000)}k</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gas Statistics</CardTitle>
                <CardDescription>
                  Detailed gas usage metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Average Gas Used</Label>
                    <div className="text-2xl font-bold">{Math.round(data.gasStats.avgGasUsed).toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Average Gas Price</Label>
                    <div className="text-2xl font-bold">{Math.round(data.gasStats.avgGasPrice).toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Max Gas Used</Label>
                    <div className="text-2xl font-bold">{Math.round(data.gasStats.maxGasUsed).toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Min Gas Used</Label>
                    <div className="text-2xl font-bold">{Math.round(data.gasStats.minGasUsed).toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audits</CardTitle>
              <CardDescription>
                Recent security audit results and vulnerability assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {data.audits.map((audit) => (
                    <div key={audit.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{audit.contract.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={audit.status === 'PASSED' ? 'default' : 'destructive'}>
                            {audit.status}
                          </Badge>
                          <Badge variant="outline">
                            Score: {audit.score}/100
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {new Date(audit.createdAt).toLocaleString()}
                      </div>
                      {audit.vulnerabilities.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Vulnerabilities Found:</div>
                          {audit.vulnerabilities.map((vuln, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${getSeverityColor(vuln.severity)}`} />
                              <span>{vuln.type} - {vuln.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Current alerts and notifications requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {data.alerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{alert.contract.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">
                            {alert.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm">{alert.message}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Dashboard Data</CardTitle>
          <CardDescription>
            Download dashboard data for analysis and reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="data-type">Data Type:</Label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="executions">Executions</SelectItem>
                  <SelectItem value="metrics">Metrics</SelectItem>
                  <SelectItem value="audits">Audits</SelectItem>
                  <SelectItem value="alerts">Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="format">Format:</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}