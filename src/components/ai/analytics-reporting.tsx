'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Database,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  ResponsiveContainer
} from 'recharts'

interface AnalyticsReport {
  id: string
  type: 'performance' | 'security' | 'usage' | 'comprehensive'
  title: string
  description: string
  generatedAt: string
  timeframe: string
  summary: Record<string, any>
  metrics: Array<{
    name: string
    value: number
    change: number
    unit: string
  }>
  insights: string[]
  recommendations: string[]
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'area'
    title: string
    data: any[]
    description: string
  }>
}

interface AnalyticsReportingProps {
  className?: string
}

export function AnalyticsReporting({ className }: AnalyticsReportingProps) {
  const [selectedReport, setSelectedReport] = useState<string>('comprehensive')
  const [timeRange, setTimeRange] = useState('24h')
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'csv'>('pdf')

  // Mock data
  const reports: AnalyticsReport[] = [
    {
      id: 'perf_24h',
      type: 'performance',
      title: 'Performance Analysis - Last 24 Hours',
      description: 'Comprehensive performance metrics and trends',
      generatedAt: '2024-01-15T15:00:00Z',
      timeframe: '24h',
      summary: {
        totalRequests: 23456,
        averageLatency: 45.2,
        throughput: 1250,
        uptime: '99.9%',
        errorRate: 0.02
      },
      metrics: [
        { name: 'Throughput', value: 1250, change: 5.2, unit: '/s' },
        { name: 'Latency', value: 45.2, change: -2.1, unit: 'ms' },
        { name: 'Accuracy', value: 94.2, change: 1.8, unit: '%' },
        { name: 'Error Rate', value: 0.02, change: -0.01, unit: '%' }
      ],
      insights: [
        'Model accuracy has improved by 1.8% over the last 24 hours',
        'System throughput increased by 5.2% due to optimization efforts',
        'Latency decreased by 2.1ms after infrastructure upgrades',
        'Error rate remains low at 0.02%, indicating stable operation'
      ],
      recommendations: [
        'Continue monitoring the accuracy improvements to identify successful strategies',
        'Consider applying the optimization techniques to other models',
        'Schedule regular infrastructure maintenance to maintain low latency',
        'Implement additional error monitoring for proactive issue detection'
      ],
      charts: [
        {
          type: 'line',
          title: 'Performance Trends',
          data: [
            { time: '00:00', throughput: 1180, latency: 48, accuracy: 92.5 },
            { time: '04:00', throughput: 1090, latency: 52, accuracy: 91.8 },
            { time: '08:00', throughput: 1320, latency: 42, accuracy: 94.2 },
            { time: '12:00', throughput: 1250, latency: 45, accuracy: 94.0 },
            { time: '16:00', throughput: 1290, latency: 43, accuracy: 94.5 },
            { time: '20:00', throughput: 1150, latency: 47, accuracy: 93.8 },
            { time: '24:00', throughput: 1050, latency: 50, accuracy: 92.0 }
          ],
          description: '24-hour performance trends showing throughput, latency, and accuracy'
        }
      ]
    },
    {
      id: 'sec_7d',
      type: 'security',
      title: 'Security Analysis - Last 7 Days',
      description: 'Security metrics and vulnerability assessment',
      generatedAt: '2024-01-15T14:30:00Z',
      timeframe: '7d',
      summary: {
        vulnerabilitiesFound: 23,
        criticalIssues: 2,
        highRiskIssues: 5,
        mediumRiskIssues: 8,
        lowRiskIssues: 8,
        contractsAnalyzed: 156
      },
      metrics: [
        { name: 'Vulnerabilities Found', value: 23, change: -3, unit: '' },
        { name: 'Critical Issues', value: 2, change: -1, unit: '' },
        { name: 'Detection Rate', value: 96.8, change: 2.3, unit: '%' },
        { name: 'False Positives', value: 3.2, change: -0.8, unit: '%' }
      ],
      insights: [
        'Security model detection rate improved by 2.3% this week',
        'Critical vulnerabilities decreased by 1 compared to last week',
        'False positive rate reduced to 3.2%, improving analysis efficiency',
        'Total vulnerabilities found decreased by 3, showing improved security posture'
      ],
      recommendations: [
        'Focus on addressing the remaining 2 critical vulnerabilities immediately',
        'Continue refining the security model to further reduce false positives',
        'Schedule regular security audits to maintain the improved security posture',
        'Implement automated remediation for medium and low-risk issues'
      ],
      charts: [
        {
          type: 'bar',
          title: 'Vulnerability Distribution',
          data: [
            { severity: 'Critical', count: 2, color: '#dc2626' },
            { severity: 'High', count: 5, color: '#ea580c' },
            { severity: 'Medium', count: 8, color: '#ca8a04' },
            { severity: 'Low', count: 8, color: '#65a30d' }
          ],
          description: 'Distribution of vulnerabilities by severity level'
        }
      ]
    },
    {
      id: 'usage_30d',
      type: 'usage',
      title: 'Usage Analytics - Last 30 Days',
      description: 'System usage patterns and user behavior analysis',
      generatedAt: '2024-01-15T13:45:00Z',
      timeframe: '30d',
      summary: {
        activeUsers: 1247,
        totalRequests: 567890,
        apiCalls: 2345678,
        avgSessionDuration: '12m 34s',
        peakUsageTime: '14:00-16:00'
      },
      metrics: [
        { name: 'Active Users', value: 1247, change: 12.5, unit: '' },
        { name: 'API Calls', value: 2345678, change: 18.3, unit: '' },
        { name: 'Session Duration', value: 754, change: 8.7, unit: 's' },
        { name: 'Satisfaction Score', value: 4.6, change: 0.3, unit: '/5' }
      ],
      insights: [
        'User engagement increased by 12.5% over the last 30 days',
        'API usage grew by 18.3%, indicating increased integration',
        'Average session duration increased by 8.7%, showing improved user experience',
        'User satisfaction score improved to 4.6/5, reflecting positive feedback'
      ],
      recommendations: [
        'Scale infrastructure to accommodate the growing user base',
        'Optimize API endpoints to handle increased traffic efficiently',
        'Continue UX improvements to maintain high satisfaction scores',
        'Implement user feedback collection to guide future enhancements'
      ],
      charts: [
        {
          type: 'area',
          title: 'Usage Growth',
          data: [
            { day: 'Day 1', users: 1108, requests: 18900 },
            { day: 'Day 7', users: 1156, requests: 21200 },
            { day: 'Day 14', users: 1198, requests: 23400 },
            { day: 'Day 21', users: 1225, requests: 25600 },
            { day: 'Day 30', users: 1247, requests: 27800 }
          ],
          description: '30-day growth trend in active users and requests'
        }
      ]
    },
    {
      id: 'comp_24h',
      type: 'comprehensive',
      title: 'Comprehensive Analysis - Last 24 Hours',
      description: 'Complete system analysis covering all aspects',
      generatedAt: '2024-01-15T15:00:00Z',
      timeframe: '24h',
      summary: {
        systemHealth: 'excellent',
        performanceScore: 94.2,
        securityScore: 96.8,
        usageScore: 87.5,
        overallScore: 92.8
      },
      metrics: [
        { name: 'System Health', value: 98.5, change: 1.2, unit: '%' },
        { name: 'Performance', value: 94.2, change: 2.1, unit: '%' },
        { name: 'Security', value: 96.8, change: 1.8, unit: '%' },
        { name: 'User Satisfaction', value: 92.3, change: 3.4, unit: '%' }
      ],
      insights: [
        'Overall system performance improved by 2.1% across all metrics',
        'Security posture strengthened with 96.8% effectiveness score',
        'User satisfaction reached 92.3%, the highest in the last quarter',
        'System reliability maintained at 98.5% with minimal downtime'
      ],
      recommendations: [
        'Maintain current performance optimization strategies',
        'Continue security enhancements to build on recent improvements',
        'Focus on user experience to further increase satisfaction scores',
        'Implement predictive maintenance to sustain high reliability'
      ],
      charts: [
        {
          type: 'pie',
          title: 'System Score Distribution',
          data: [
            { name: 'Performance', value: 94.2, color: '#8884d8' },
            { name: 'Security', value: 96.8, color: '#82ca9d' },
            { name: 'Usage', value: 87.5, color: '#ffc658' },
            { name: 'Reliability', value: 98.5, color: '#ff7c7c' }
          ],
          description: 'Distribution of system scores across different categories'
        }
      ]
    }
  ]

  const currentReport = reports.find(r => r.id === selectedReport) || reports[3]

  const handleGenerateReport = () => {
    setIsGenerating(true)
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  const handleExportReport = () => {
    // Simulate report export
    console.log(`Exporting report as ${exportFormat}`)
  }

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const renderChart = (chart: any) => {
    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(chart.data[0]).filter(key => key !== 'time').map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={['#8884d8', '#82ca9d', '#ffc658'][index]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="severity" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="requests" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chart.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reporting</h2>
          <p className="text-muted-foreground">Generate comprehensive reports and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report) => (
          <Card 
            key={report.id} 
            className={`cursor-pointer transition-colors ${
              selectedReport === report.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedReport(report.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{report.type}</Badge>
                <span className="text-xs text-muted-foreground">{report.timeframe}</span>
              </div>
              <CardTitle className="text-sm">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{report.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentReport.title}</CardTitle>
              <CardDescription>{currentReport.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(currentReport.summary).map(([key, value]) => (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{value}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentReport.metrics.map((metric) => (
                  <Card key={metric.name}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{metric.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">
                            {metric.value}{metric.unit}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {getChangeIcon(metric.change)}
                            <span className={cn("text-sm", getChangeColor(metric.change))}>
                              {metric.change >= 0 ? '+' : ''}{metric.change}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Change</div>
                          <div className={cn("text-sm font-medium", getChangeColor(metric.change))}>
                            {metric.change >= 0 ? '+' : ''}{metric.change}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentReport.metrics.map((metric) => (
                  <Card key={metric.name}>
                    <CardHeader>
                      <CardTitle className="text-base">{metric.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold">
                            {metric.value}{metric.unit}
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-2">
                            {getChangeIcon(metric.change)}
                            <span className={cn("text-sm", getChangeColor(metric.change))}>
                              {metric.change >= 0 ? '+' : ''}{metric.change}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Performance</span>
                            <span>{Math.min(100, Math.max(0, metric.value + (metric.change * 2)))}%</span>
                          </div>
                          <Progress 
                            value={Math.min(100, Math.max(0, metric.value + (metric.change * 2)))} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentReport.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentReport.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              {currentReport.charts.map((chart, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{chart.title}</CardTitle>
                    <CardDescription>{chart.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderChart(chart)}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}