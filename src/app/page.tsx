'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Blocks, 
  FileText, 
  TestTube, 
  Shield, 
  BarChart3, 
  Database,
  Menu,
  X,
  Home,
  Wallet,
  TrendingUp,
  Clock,
  Users,
  Network,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Registry', href: '/registry', icon: Database },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Permissions', href: '/permissions', icon: Shield },
  { name: 'Advanced', href: '/dashboard', icon: BarChart3 },
  { name: 'Bridge', href: '/bridge', icon: Network },
  { name: 'Explorer', href: '/explorer', icon: Search },
]

const stats = [
  {
    title: 'Total Blocks',
    value: '1,247',
    change: '+12%',
    icon: Blocks,
    description: 'Blocks in the chain'
  },
  {
    title: 'Transactions',
    value: '8,492',
    change: '+23%',
    icon: TrendingUp,
    description: 'Total transactions'
  },
  {
    title: 'Active Contracts',
    value: '156',
    change: '+5%',
    icon: FileText,
    description: 'Deployed smart contracts'
  },
  {
    title: 'Network Nodes',
    value: '42',
    change: '+2',
    icon: Users,
    description: 'Connected nodes'
  },
  {
    title: 'Total Supply',
    value: '2.5M',
    change: 'Stable',
    icon: Wallet,
    description: 'KALD tokens'
  },
  {
    title: 'Block Time',
    value: '15s',
    change: 'Optimal',
    icon: Clock,
    description: 'Average block time'
  }
]

const recentTransactions = [
  { id: '1', hash: '0x7f9a1b...', from: '0x8c2d...', to: '0x3e5f...', amount: '125.5', status: 'confirmed', time: '2 min ago' },
  { id: '2', hash: '0x3b8c2d...', from: '0x1a4e...', to: '0x7f9a...', amount: '75.2', status: 'pending', time: '5 min ago' },
  { id: '3', hash: '0x9e4f1a...', from: '0x5d2b...', to: '0x8c2d...', amount: '200.0', status: 'confirmed', time: '8 min ago' },
  { id: '4', hash: '0x2d7b8c...', from: '0x4f1a...', to: '0x5d2b...', amount: '50.0', status: 'failed', time: '12 min ago' },
]

const recentBlocks = [
  { id: '1', height: 1247, hash: '0x1a2b3c...', transactions: 45, miner: '0x8c2d...', time: '1 min ago' },
  { id: '2', height: 1246, hash: '0x4d5e6f...', transactions: 32, miner: '0x3e5f...', time: '2 min ago' },
  { id: '3', height: 1245, hash: '0x7g8h9i...', transactions: 28, miner: '0x1a4e...', time: '3 min ago' },
]

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

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
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold">Blockchain Dashboard</h1>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">KALDRIX Blockchain</h1>
              <p className="text-muted-foreground">
                Monitor and manage your blockchain network in real-time
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                      <Badge variant={stat.change.includes('+') ? "default" : "secondary"}>
                        {stat.change}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest transactions on the network</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div>
                            <p className="text-sm font-medium">{tx.hash}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.from} → {tx.to}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{tx.amount} KALD</p>
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={
                                tx.status === 'confirmed' ? 'default' :
                                tx.status === 'pending' ? 'secondary' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {tx.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{tx.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent blocks */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Blocks</CardTitle>
                  <CardDescription>Latest blocks added to the chain</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBlocks.map((block) => (
                      <div key={block.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div>
                            <p className="text-sm font-medium">Block #{block.height}</p>
                            <p className="text-xs text-muted-foreground">{block.hash}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{block.transactions} txs</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">{block.miner}</span>
                            <span className="text-xs text-muted-foreground">• {block.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}