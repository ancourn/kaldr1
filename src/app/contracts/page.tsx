'use client'

<<<<<<< HEAD
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
=======
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Upload, 
  Play, 
  Search, 
  Code, 
  Database, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  Hash,
  User,
  Calendar,
  TrendingUp,
  FileCode
} from 'lucide-react'
import ContractEditor from '@/components/ContractEditor'
import { contractTemplates } from '@/lib/contracts/templates'

interface Contract {
  id: string
  name: string
  address: string
  version: string
  status: string
  creator: string
  createdAt: string
  updatedAt: string
  owner?: {
    name: string
    email: string
  }
}

interface ContractState {
  [key: string]: any
}

interface DeploymentLog {
  level: string
  message: string
  timestamp: string
}

export default function ContractsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [contractState, setContractState] = useState<ContractState | null>(null)
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [invoking, setInvoking] = useState(false)
  
  // Deployment form state
  const [deploymentForm, setDeploymentForm] = useState({
    contractName: '',
    contractVersion: '1.0.0',
    description: '',
    gasLimit: '',
    contractFile: null as File | null
  })

  // Invocation form state
  const [invocationForm, setInvocationForm] = useState({
    contractAddress: '',
    functionName: '',
    parameters: '{}',
    gasLimit: ''
  })

  // Gas estimation state
  const [gasEstimation, setGasEstimation] = useState<any>(null)
  const [estimatingGas, setEstimatingGas] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Fetch contracts
  useEffect(() => {
    if (session) {
      fetchContracts()
    }
  }, [session])

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/blockchain/contracts')
      const data = await response.json()
      
      if (data.success) {
        setContracts(data.data.contracts)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setDeploymentForm(prev => ({ ...prev, contractFile: file }))
    }
  }

  const estimateDeploymentGas = async () => {
    if (!deploymentForm.contractFile) {
      alert('Please select a contract file first')
      return
    }

    setEstimatingGas(true)
    try {
      const fileContent = await deploymentForm.contractFile.text()
      const bytecode = Buffer.from(fileContent).toString('hex')

      const response = await fetch('/api/contracts/gas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deploy',
          bytecode,
          contractName: deploymentForm.contractName
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setGasEstimation(result.data)
        // Auto-fill gas limit with recommendation
        setDeploymentForm(prev => ({
          ...prev,
          gasLimit: result.data.estimation.recommendedGasLimit.toString()
        }))
      } else {
        alert('Failed to estimate gas: ' + result.error)
      }
    } catch (error) {
      alert('Failed to estimate gas')
    } finally {
      setEstimatingGas(false)
    }
  }

  const estimateInvocationGas = async () => {
    if (!invocationForm.contractAddress || !invocationForm.functionName) {
      alert('Please fill in contract address and function name')
      return
    }

    setEstimatingGas(true)
    try {
      let parameters
      try {
        parameters = JSON.parse(invocationForm.parameters)
      } catch {
        alert('Invalid JSON in parameters')
        setEstimatingGas(false)
        return
      }

      const response = await fetch('/api/contracts/gas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'invoke',
          contractAddress: invocationForm.contractAddress,
          functionName: invocationForm.functionName,
          parameters
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setGasEstimation(result.data)
        // Auto-fill gas limit with recommendation
        setInvocationForm(prev => ({
          ...prev,
          gasLimit: result.data.estimation.recommendedGasLimit.toString()
        }))
      } else {
        alert('Failed to estimate gas: ' + result.error)
      }
    } catch (error) {
      alert('Failed to estimate gas')
    } finally {
      setEstimatingGas(false)
    }
  }

  const handleDeploy = async () => {
    if (!deploymentForm.contractFile || !deploymentForm.contractName) {
      alert('Please fill in all required fields')
      return
    }

    setDeploying(true)
    setDeploymentLogs([])

    try {
      const formData = new FormData()
      formData.append('contractFile', deploymentForm.contractFile)
      formData.append('contractName', deploymentForm.contractName)
      formData.append('contractVersion', deploymentForm.contractVersion)
      formData.append('description', deploymentForm.description)
      if (deploymentForm.gasLimit) {
        formData.append('gasLimit', deploymentForm.gasLimit)
      }

      const response = await fetch('/api/contracts/deploy', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setDeploymentLogs(result.data.logs)
        // Refresh contracts list
        setTimeout(fetchContracts, 3000)
      } else {
        setDeploymentLogs([{
          level: 'error',
          message: result.error,
          timestamp: new Date().toISOString()
        }])
      }
    } catch (error) {
      setDeploymentLogs([{
        level: 'error',
        message: 'Failed to deploy contract',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setDeploying(false)
    }
  }

  const handleDeployFromEditor = async (code: string, name: string, version: string) => {
    setDeploying(true)
    setDeploymentLogs([])

    try {
      // Create a blob from the code
      const blob = new Blob([code], { type: 'text/x-rust' })
      const file = new File([blob], `${name.toLowerCase().replace(/\s+/g, '_')}.rs`, { type: 'text/x-rust' })

      const formData = new FormData()
      formData.append('contractFile', file)
      formData.append('contractName', name)
      formData.append('contractVersion', version)
      formData.append('description', `Contract created from template`)

      const response = await fetch('/api/contracts/deploy', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setDeploymentLogs(result.data.logs)
        // Refresh contracts list
        setTimeout(fetchContracts, 3000)
        // Switch to deploy tab to show logs
        const deployTab = document.querySelector('[value="deploy"]') as HTMLElement
        if (deployTab) {
          deployTab.click()
        }
      } else {
        alert('Failed to deploy contract: ' + result.error)
      }
    } catch (error) {
      alert('Failed to deploy contract')
    } finally {
      setDeploying(false)
    }
  }

  const handleEstimateGasFromEditor = async (code: string, name: string) => {
    setEstimatingGas(true)
    try {
      const bytecode = Buffer.from(code).toString('hex')

      const response = await fetch('/api/contracts/gas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deploy',
          bytecode,
          contractName: name
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setGasEstimation(result.data)
        alert(`Estimated gas: ${result.data.estimation.estimatedGas.toLocaleString()}\nEstimated cost: $${result.data.pricing.gasCostUSD.toFixed(6)}`)
      } else {
        alert('Failed to estimate gas: ' + result.error)
      }
    } catch (error) {
      alert('Failed to estimate gas')
    } finally {
      setEstimatingGas(false)
    }
  }

  const handleInvoke = async () => {
    if (!invocationForm.contractAddress || !invocationForm.functionName) {
      alert('Please fill in all required fields')
      return
    }

    setInvoking(true)

    try {
      let parameters
      try {
        parameters = JSON.parse(invocationForm.parameters)
      } catch {
        alert('Invalid JSON in parameters')
        setInvoking(false)
        return
      }

      const response = await fetch('/api/contracts/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: invocationForm.contractAddress,
          functionName: invocationForm.functionName,
          parameters,
          gasLimit: invocationForm.gasLimit ? parseInt(invocationForm.gasLimit) : undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('Function invocation initiated successfully!')
        setInvocationForm({
          contractAddress: '',
          functionName: '',
          parameters: '{}',
          gasLimit: ''
        })
      } else {
        alert('Failed to invoke function: ' + result.error)
      }
    } catch (error) {
      alert('Failed to invoke function')
    } finally {
      setInvoking(false)
    }
  }

  const handleQueryContract = async (contract: Contract) => {
    setSelectedContract(contract)
    
    try {
      const response = await fetch(`/api/contracts/query?id=${contract.id}`)
      const result = await response.json()
      
      if (result.success) {
        setContractState(result.data.state)
      }
    } catch (error) {
      console.error('Error querying contract:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500'
      case 'deploying':
        return 'bg-yellow-500'
      case 'inactive':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'deploying':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading contracts...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Smart Contracts</h1>
            <p className="text-muted-foreground mt-2">
              Deploy, invoke, and manage smart contracts on KALDRIX blockchain
            </p>
          </div>
          <Badge variant="outline" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Phase 5: Smart Contract Deployment Suite</span>
          </Badge>
        </div>

        <Tabs defaultValue="deploy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="deploy">Deploy Contract</TabsTrigger>
            <TabsTrigger value="invoke">Invoke Function</TabsTrigger>
            <TabsTrigger value="editor">Contract Editor</TabsTrigger>
            <TabsTrigger value="contracts">My Contracts</TabsTrigger>
            <TabsTrigger value="query">Query State</TabsTrigger>
          </TabsList>

          <TabsContent value="deploy" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Deployment Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Deploy New Contract</span>
                  </CardTitle>
                  <CardDescription>
                    Upload your smart contract (.wasm or .rs) to deploy on the blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractName">Contract Name *</Label>
                    <Input
                      id="contractName"
                      value={deploymentForm.contractName}
                      onChange={(e) => setDeploymentForm(prev => ({ ...prev, contractName: e.target.value }))}
                      placeholder="MyToken"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contractVersion">Version</Label>
                    <Input
                      id="contractVersion"
                      value={deploymentForm.contractVersion}
                      onChange={(e) => setDeploymentForm(prev => ({ ...prev, contractVersion: e.target.value }))}
                      placeholder="1.0.0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={deploymentForm.description}
                      onChange={(e) => setDeploymentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Contract description..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gasLimit">Gas Limit</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="gasLimit"
                        type="number"
                        value={deploymentForm.gasLimit}
                        onChange={(e) => setDeploymentForm(prev => ({ ...prev, gasLimit: e.target.value }))}
                        placeholder="2000000"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={estimateDeploymentGas}
                        disabled={estimatingGas || !deploymentForm.contractFile}
                      >
                        {estimatingGas ? 'Estimating...' : 'Estimate'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contractFile">Contract File *</Label>
                    <Input
                      id="contractFile"
                      type="file"
                      accept=".wasm,.rs"
                      onChange={handleFileUpload}
                    />
                    {deploymentForm.contractFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {deploymentForm.contractFile.name}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleDeploy} 
                    disabled={deploying || !deploymentForm.contractFile || !deploymentForm.contractName}
                    className="w-full"
                  >
                    {deploying ? 'Deploying...' : 'Deploy Contract'}
                  </Button>
                </CardContent>
              </Card>

              {/* Gas Estimation & Logs */}
              <div className="space-y-6">
                {/* Gas Estimation Results */}
                {gasEstimation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Gas Estimation</span>
                      </CardTitle>
                      <CardDescription>
                        Estimated gas usage and cost analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Estimated Gas</Label>
                          <p className="font-mono text-sm">{gasEstimation.estimation.estimatedGas.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label>Recommended Limit</Label>
                          <p className="font-mono text-sm">{gasEstimation.estimation.recommendedGasLimit.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label>Estimated Cost</Label>
                          <p className="font-mono text-sm">${gasEstimation.pricing.gasCostUSD.toFixed(6)}</p>
                        </div>
                        <div>
                          <Label>Confidence</Label>
                          <p className="font-mono text-sm">{(gasEstimation.estimation.confidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Network Conditions</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            gasEstimation.networkConditions.congestion === 'low' ? 'bg-green-500' :
                            gasEstimation.networkConditions.congestion === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm capitalize">{gasEstimation.networkConditions.congestion} congestion</span>
                        </div>
                      </div>

                      {gasEstimation.optimization.suggestions.length > 0 && (
                        <div>
                          <Label>Optimization Suggestions</Label>
                          <ul className="text-sm space-y-1 mt-1">
                            {gasEstimation.optimization.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                              <li key={index} className="text-muted-foreground">• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Deployment Logs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Deployment Logs</span>
                    </CardTitle>
                    <CardDescription>
                      Real-time deployment status and logs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {deploymentLogs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No deployment logs yet. Deploy a contract to see logs here.
                        </p>
                      ) : (
                        deploymentLogs.map((log, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 rounded bg-muted/50">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              log.level === 'error' ? 'bg-red-500' :
                              log.level === 'warn' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{log.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoke" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Invoke Contract Function</span>
                </CardTitle>
                <CardDescription>
                  Call functions on deployed smart contracts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractAddress">Contract Address *</Label>
                    <Input
                      id="contractAddress"
                      value={invocationForm.contractAddress}
                      onChange={(e) => setInvocationForm(prev => ({ ...prev, contractAddress: e.target.value }))}
                      placeholder="0x..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="functionName">Function Name *</Label>
                    <Input
                      id="functionName"
                      value={invocationForm.functionName}
                      onChange={(e) => setInvocationForm(prev => ({ ...prev, functionName: e.target.value }))}
                      placeholder="transfer"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parameters">Parameters (JSON)</Label>
                    <Textarea
                      id="parameters"
                      value={invocationForm.parameters}
                      onChange={(e) => setInvocationForm(prev => ({ ...prev, parameters: e.target.value }))}
                      placeholder='{"to": "0x...", "amount": "1000"}'
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invokeGasLimit">Gas Limit</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="invokeGasLimit"
                        type="number"
                        value={invocationForm.gasLimit}
                        onChange={(e) => setInvocationForm(prev => ({ ...prev, gasLimit: e.target.value }))}
                        placeholder="100000"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={estimateInvocationGas}
                        disabled={estimatingGas || !invocationForm.contractAddress || !invocationForm.functionName}
                      >
                        {estimatingGas ? 'Estimating...' : 'Estimate'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleInvoke} 
                  disabled={invoking || !invocationForm.contractAddress || !invocationForm.functionName}
                >
                  {invoking ? 'Invoking...' : 'Invoke Function'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="space-y-6">
            <ContractEditor 
              onDeploy={handleDeployFromEditor}
              onEstimateGas={handleEstimateGasFromEditor}
            />
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>My Contracts</span>
                </CardTitle>
                <CardDescription>
                  View and manage your deployed smart contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p>Loading contracts...</p>
                  </div>
                ) : contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No contracts deployed yet.</p>
                    <p className="text-sm text-muted-foreground">Deploy your first contract to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(contract.status)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{contract.name}</p>
                              <Badge variant="outline">{contract.version}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">
                              {contract.address}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                {contract.creator}
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(contract.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQueryContract(contract)}
                              >
                                <Search className="h-4 w-4 mr-1" />
                                Query
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Contract Details: {contract.name}</DialogTitle>
                                <DialogDescription>
                                  View contract state and information
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedContract && (
                                <div className="space-y-6">
                                  {/* Contract Info */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Address</Label>
                                      <p className="font-mono text-sm">{selectedContract.address}</p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <Badge variant="outline">{selectedContract.status}</Badge>
                                    </div>
                                    <div>
                                      <Label>Version</Label>
                                      <p>{selectedContract.version}</p>
                                    </div>
                                    <div>
                                      <Label>Creator</Label>
                                      <p>{selectedContract.creator}</p>
                                    </div>
                                  </div>

                                  {/* Contract State */}
                                  <div>
                                    <Label>Contract State</Label>
                                    <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                                      {contractState ? (
                                        <pre className="text-sm">
                                          {JSON.stringify(contractState, null, 2)}
                                        </pre>
                                      ) : (
                                        <p className="text-muted-foreground">Loading contract state...</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="query" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Query Contract State</span>
                </CardTitle>
                <CardDescription>
                  Inspect the current state of any smart contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="queryAddress">Contract Address</Label>
                      <Input
                        id="queryAddress"
                        placeholder="0x..."
                        value={invocationForm.contractAddress}
                        onChange={(e) => setInvocationForm(prev => ({ ...prev, contractAddress: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => {
                          const contract = contracts.find(c => c.address === invocationForm.contractAddress)
                          if (contract) {
                            handleQueryContract(contract)
                          }
                        }}
                        disabled={!invocationForm.contractAddress}
                      >
                        Query State
                      </Button>
                    </div>
                  </div>

                  {contractState && (
                    <div className="space-y-2">
                      <Label>Contract State</Label>
                      <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-sm">
                          {JSON.stringify(contractState, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
>>>>>>> 80450c96b3265079818c8907794a182e51f9e247
      </div>
    </div>
  )
}