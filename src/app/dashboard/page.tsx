<<<<<<< HEAD
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3,
  Menu,
  X,
  Home,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Database,
  FileText,
  TestTube,
  Shield,
  Calendar,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Registry', href: '/registry', icon: Database },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Permissions', href: '/permissions', icon: Shield },
  { name: 'Advanced', href: '/dashboard', icon: BarChart3 },
]

// Mock data for charts
const transactionData = [
  { hour: '00:00', transactions: 120, gas: 2500000 },
  { hour: '04:00', transactions: 85, gas: 1800000 },
  { hour: '08:00', transactions: 320, gas: 6800000 },
  { hour: '12:00', transactions: 580, gas: 12200000 },
  { hour: '16:00', transactions: 450, gas: 9500000 },
  { hour: '20:00', transactions: 280, gas: 5900000 },
  { hour: '24:00', transactions: 150, gas: 3200000 },
]

const blockTimeData = [
  { day: 'Mon', avgTime: 12.5, minTime: 8.2, maxTime: 18.7 },
  { day: 'Tue', avgTime: 13.1, minTime: 9.1, maxTime: 19.3 },
  { day: 'Wed', avgTime: 11.8, minTime: 7.8, maxTime: 17.2 },
  { day: 'Thu', avgTime: 12.9, minTime: 8.9, maxTime: 18.9 },
  { day: 'Fri', avgTime: 14.2, minTime: 10.1, maxTime: 20.5 },
  { day: 'Sat', avgTime: 15.8, minTime: 11.2, maxTime: 22.1 },
  { day: 'Sun', avgTime: 16.3, minTime: 12.0, maxTime: 23.4 },
]

const networkHealthData = [
  { name: 'Nodes', value: 42, color: '#8884d8' },
  { name: 'Active', value: 38, color: '#82ca9d' },
  { name: 'Syncing', value: 3, color: '#ffc658' },
  { name: 'Offline', value: 1, color: '#ff7c7c' },
]

const contractUsageData = [
  { name: 'Token Contracts', calls: 15420, gas: 324500000 },
  { name: 'NFT Marketplace', calls: 8750, gas: 187000000 },
  { name: 'Staking', calls: 6320, gas: 134000000 },
  { name: 'DEX', calls: 4890, gas: 105000000 },
  { name: 'Lending', calls: 3210, gas: 69000000 },
]

const performanceMetrics = [
  { metric: 'TPS', current: 45.2, target: 50, change: '+5.2%' },
  { metric: 'Block Time', current: 12.8, target: 15, change: '-2.2s' },
  { metric: 'Gas Price', current: 25, target: 30, change: '-16.7%' },
  { metric: 'Success Rate', current: 98.5, target: 95, change: '+3.5%' },
  { metric: 'Network Load', current: 68, target: 80, change: '-12%' },
]

const timeRangeOptions = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
]

export default function AdvancedDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [timeRange, setTimeRange] = useState('24h')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pathname = usePathname()

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

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
            <div className="flex flex-1 items-center justify-between">
              <h1 className="text-lg font-semibold">Advanced Dashboard</h1>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
              <p className="text-muted-foreground">
                Comprehensive blockchain performance metrics and network insights
              </p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {performanceMetrics.map((metric) => (
                <Card key={metric.metric}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                    {metric.change.includes('+') ? 
                      <TrendingUp className="h-4 w-4 text-green-600" /> :
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    }
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.current}</div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">Target: {metric.target}</p>
                      <Badge 
                        variant={metric.change.includes('+') ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {metric.change}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="contracts">Contracts</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transaction Volume Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction Volume</CardTitle>
                      <CardDescription>Transactions per hour</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={transactionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="transactions" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Gas Usage Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Gas Usage</CardTitle>
                      <CardDescription>Total gas consumed per hour</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={transactionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="gas" stroke="#82ca9d" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Block Time Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Block Time Analysis</CardTitle>
                      <CardDescription>Average, min, and max block times</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={blockTimeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="avgTime" stroke="#8884d8" name="Average" />
                          <Line type="monotone" dataKey="minTime" stroke="#82ca9d" name="Minimum" />
                          <Line type="monotone" dataKey="maxTime" stroke="#ffc658" name="Maximum" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Network Health */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Network Health</CardTitle>
                      <CardDescription>Node status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={networkHealthData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {networkHealthData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* TPS Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Transactions Per Second (TPS)</CardTitle>
                      <CardDescription>Real-time TPS monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current TPS</span>
                          <span className="text-2xl font-bold">45.2</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Peak TPS (24h)</span>
                          <span className="text-lg font-semibold">67.8</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Average TPS (24h)</span>
                          <span className="text-lg font-semibold">42.1</span>
                        </div>
                        <Progress value={90.4} className="w-full" />
                        <p className="text-xs text-muted-foreground">90.4% of target (50 TPS)</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Latency Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Network Latency</CardTitle>
                      <CardDescription>Transaction confirmation times</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Average</span>
                          <span className="text-lg font-semibold">2.3s</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Median</span>
                          <span className="text-lg font-semibold">1.8s</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">95th Percentile</span>
                          <span className="text-lg font-semibold">5.2s</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">99th Percentile</span>
                          <span className="text-lg font-semibold">8.7s</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resource Usage */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Resource Usage</CardTitle>
                      <CardDescription>System resource consumption</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">CPU Usage</span>
                            <span className="text-sm text-muted-foreground">68%</span>
                          </div>
                          <Progress value={68} className="w-full" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Memory Usage</span>
                            <span className="text-sm text-muted-foreground">4.2GB / 8GB</span>
                          </div>
                          <Progress value={52.5} className="w-full" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Disk Usage</span>
                            <span className="text-sm text-muted-foreground">125GB / 500GB</span>
                          </div>
                          <Progress value={25} className="w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Contracts Tab */}
              <TabsContent value="contracts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Usage Analytics</CardTitle>
                    <CardDescription>Smart contract interaction statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={contractUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="calls" fill="#8884d8" name="Function Calls" />
                        <Bar dataKey="gas" fill="#82ca9d" name="Gas Used" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Contracts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Token Contract</span>
                          <Badge variant="secondary">15,420 calls</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">NFT Marketplace</span>
                          <Badge variant="secondary">8,750 calls</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Staking Contract</span>
                          <Badge variant="secondary">6,320 calls</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Overall</span>
                          <span className="text-sm font-medium text-green-600">98.5%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Token Transfers</span>
                          <span className="text-sm font-medium text-green-600">99.2%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Contract Calls</span>
                          <span className="text-sm font-medium text-green-600">97.8%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Gas Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Average Gas Price</span>
                          <span className="text-sm font-medium">25 Gwei</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Gas Saved</span>
                          <span className="text-sm font-medium text-green-600">12.5%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Optimization Score</span>
                          <span className="text-sm font-medium">A+</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Network Tab */}
              <TabsContent value="network" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Node Distribution</CardTitle>
                      <CardDescription>Geographic distribution of network nodes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">North America</span>
                          <div className="flex items-center gap-2">
                            <Progress value={45} className="w-20" />
                            <span className="text-sm">19 nodes</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Europe</span>
                          <div className="flex items-center gap-2">
                            <Progress value={33} className="w-20" />
                            <span className="text-sm">14 nodes</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Asia</span>
                          <div className="flex items-center gap-2">
                            <Progress value="17" className="w-20" />
                            <span className="text-sm">7 nodes</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Other</span>
                          <div className="flex items-center gap-2">
                            <Progress value="5" className="w-20" />
                            <span className="text-sm">2 nodes</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Network Statistics</CardTitle>
                      <CardDescription>Current network status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Nodes</span>
                          <span className="text-lg font-semibold">42</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Active Nodes</span>
                          <span className="text-lg font-semibold text-green-600">38</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Network Uptime</span>
                          <span className="text-lg font-semibold text-green-600">99.9%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Peer Connections</span>
                          <span className="text-lg font-semibold">156</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Network Throughput</span>
                          <span className="text-lg font-semibold">1.2 GB/s</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Real-time Network Activity</CardTitle>
                      <CardDescription>Live network monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">1,247</div>
                            <div className="text-sm text-muted-foreground">Total Blocks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">8,492</div>
                            <div className="text-sm text-muted-foreground">Transactions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">156</div>
                            <div className="text-sm text-muted-foreground">Contracts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">42</div>
                            <div className="text-sm text-muted-foreground">Active Nodes</div>
                          </div>
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Updated</span>
                            <span className="text-sm font-medium">Just now</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
=======
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
>>>>>>> 80450c96b3265079818c8907794a182e51f9e247
}