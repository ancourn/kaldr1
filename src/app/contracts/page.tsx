'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FileText,
  Menu,
  X,
  Home,
  Plus,
  Search,
  Code,
  Play,
  Pause,
  Trash2,
  Filter,
  Download,
  Upload,
  Eye,
  Settings,
  Database,
  TestTube,
  Shield,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Registry', href: '/registry', icon: Database },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Permissions', href: '/permissions', icon: Shield },
  { name: 'Advanced', href: '/dashboard', icon: BarChart3 },
]

const contractsData = [
  {
    id: '1',
    address: '0x7f9a1b2c3d4e5f67890abcdef1234567890abcdef',
    name: 'Token Contract',
    version: '1.0.0',
    creator: '0x8c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    deployedAt: '2024-01-15',
    status: 'active',
    gasLimit: 3000000,
    functions: [
      { name: 'transfer', signature: 'transfer(address,uint256)', inputs: '2', outputs: '1' },
      { name: 'balanceOf', signature: 'balanceOf(address)', inputs: '1', outputs: '1' },
      { name: 'approve', signature: 'approve(address,uint256)', inputs: '2', outputs: '1' }
    ],
    events: [
      { name: 'Transfer', signature: 'Transfer(address,address,uint256)', parameters: '3' },
      { name: 'Approval', signature: 'Approval(address,address,uint256)', parameters: '3' }
    ]
  },
  {
    id: '2',
    address: '0x3b8c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    name: 'NFT Marketplace',
    version: '2.1.0',
    creator: '0x1a4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
    deployedAt: '2024-01-14',
    status: 'active',
    gasLimit: 5000000,
    functions: [
      { name: 'listNFT', signature: 'listNFT(uint256,uint256)', inputs: '2', outputs: '0' },
      { name: 'buyNFT', signature: 'buyNFT(uint256)', inputs: '1', outputs: '0' },
      { name: 'cancelListing', signature: 'cancelListing(uint256)', inputs: '1', outputs: '0' }
    ],
    events: [
      { name: 'NFTListed', signature: 'NFTListed(uint256,uint256,address)', parameters: '3' },
      { name: 'NFTSold', signature: 'NFTSold(uint256,uint256,address,address)', parameters: '4' }
    ]
  },
  {
    id: '3',
    address: '0x9e4f1a2b3c4d5e6f7890abcdef1234567890abcdef',
    name: 'Staking Contract',
    version: '1.2.0',
    creator: '0x5d2b3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    deployedAt: '2024-01-13',
    status: 'inactive',
    gasLimit: 2000000,
    functions: [
      { name: 'stake', signature: 'stake(uint256)', inputs: '1', outputs: '0' },
      { name: 'unstake', signature: 'unstake(uint256)', inputs: '1', outputs: '0' },
      { name: 'getRewards', signature: 'getRewards()', inputs: '0', outputs: '1' }
    ],
    events: [
      { name: 'Staked', signature: 'Staked(address,uint256)', parameters: '2' },
      { name: 'Unstaked', signature: 'Unstaked(address,uint256)', parameters: '2' }
    ]
  }
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deprecated', label: 'Deprecated' },
]

export default function ContractsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const pathname = usePathname()

  const filteredContracts = contractsData.filter(contract => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.creator.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || contract.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const handleDeployContract = (formData) => {
    console.log('Deploying contract:', formData)
    setIsDeployDialogOpen(false)
  }

  const handleViewContract = (contract) => {
    setSelectedContract(contract)
  }

  const handleToggleContract = (id) => {
    console.log('Toggling contract:', id)
  }

  const handleDeleteContract = (id) => {
    console.log('Deleting contract:', id)
  }

  const DeployContractForm = ({ onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      version: '1.0.0',
      bytecode: '',
      abi: '',
      gasLimit: '3000000'
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSubmit(formData)
      onClose()
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Contract Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Token Contract"
            required
          />
        </div>
        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="1.0.0"
            required
          />
        </div>
        <div>
          <Label htmlFor="gasLimit">Gas Limit</Label>
          <Input
            id="gasLimit"
            type="number"
            value={formData.gasLimit}
            onChange={(e) => setFormData({ ...formData, gasLimit: e.target.value })}
            placeholder="3000000"
            required
          />
        </div>
        <div>
          <Label htmlFor="bytecode">Bytecode</Label>
          <Textarea
            id="bytecode"
            value={formData.bytecode}
            onChange={(e) => setFormData({ ...formData, bytecode: e.target.value })}
            placeholder="0x608060405234801561001057600080fd5b50..."
            rows={4}
            required
          />
        </div>
        <div>
          <Label htmlFor="abi">ABI (JSON)</Label>
          <Textarea
            id="abi"
            value={formData.abi}
            onChange={(e) => setFormData({ ...formData, abi: e.target.value })}
            placeholder='[{"inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function"}]'
            rows={6}
            required
          />
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            Deploy Contract
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    )
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
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold">Contracts</h1>
            </div>
          </div>
        </div>

        {/* Contracts content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Smart Contracts</h1>
              <p className="text-muted-foreground">
                Deploy, manage, and interact with smart contracts on the blockchain
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Deploy Contract
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Deploy Smart Contract</DialogTitle>
                    <DialogDescription>
                      Deploy a new smart contract to the blockchain.
                    </DialogDescription>
                  </DialogHeader>
                  <DeployContractForm
                    onSubmit={handleDeployContract}
                    onClose={() => setIsDeployDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Contracts table */}
            <Card>
              <CardHeader>
                <CardTitle>Deployed Contracts</CardTitle>
                <CardDescription>
                  Showing {filteredContracts.length} of {contractsData.length} contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deployed</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">{contract.name}</TableCell>
                          <TableCell className="font-mono text-sm max-w-xs truncate">
                            {contract.address}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{contract.version}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm max-w-xs truncate">
                            {contract.creator}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                contract.status === 'active' ? 'default' :
                                contract.status === 'inactive' ? 'secondary' : 'destructive'
                              }
                            >
                              {contract.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {contract.deployedAt}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewContract(contract)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleContract(contract.id)}
                              >
                                {contract.status === 'active' ? 
                                  <Pause className="h-4 w-4" /> : 
                                  <Play className="h-4 w-4" />
                                }
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteContract(contract.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details Dialog */}
            {selectedContract && (
              <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      {selectedContract.name}
                      <Badge variant="outline">{selectedContract.version}</Badge>
                    </DialogTitle>
                    <DialogDescription>
                      Contract details and interface
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="functions">Functions</TabsTrigger>
                      <TabsTrigger value="events">Events</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Address</Label>
                          <p className="text-sm font-mono bg-muted p-2 rounded">
                            {selectedContract.address}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Creator</Label>
                          <p className="text-sm font-mono bg-muted p-2 rounded">
                            {selectedContract.creator}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Gas Limit</Label>
                          <p className="text-sm bg-muted p-2 rounded">
                            {selectedContract.gasLimit.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Deployed At</Label>
                          <p className="text-sm bg-muted p-2 rounded">
                            {selectedContract.deployedAt}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="functions" className="space-y-4">
                      <div className="space-y-3">
                        {selectedContract.functions.map((func, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{func.name}</h4>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {func.signature}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    {func.inputs} inputs → {func.outputs} outputs
                                  </p>
                                  <Button size="sm" className="mt-2">
                                    Execute
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="events" className="space-y-4">
                      <div className="space-y-3">
                        {selectedContract.events.map((event, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{event.name}</h4>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {event.signature}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    {event.parameters} parameters
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}