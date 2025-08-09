'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Database,
  Menu,
  X,
  Home,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  FileText,
  TestTube,
  Shield,
  BarChart3,
  Bridge
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
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Registry', href: '/registry', icon: Database },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Permissions', href: '/permissions', icon: Shield },
  { name: 'Advanced', href: '/dashboard', icon: BarChart3 },
  { name: 'Bridge', href: '/bridge', icon: Bridge },
]

const registryData = [
  {
    id: '1',
    key: 'network.version',
    value: '1.0.0',
    type: 'string',
    description: 'Current network version',
    createdBy: '0x8c2d...',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    key: 'consensus.algorithm',
    value: 'proof-of-stake',
    type: 'string',
    description: 'Consensus mechanism used by the network',
    createdBy: '0x3e5f...',
    createdAt: '2024-01-14',
    updatedAt: '2024-01-14'
  },
  {
    id: '3',
    key: 'block.gas_limit',
    value: '30000000',
    type: 'number',
    description: 'Maximum gas limit per block',
    createdBy: '0x1a4e...',
    createdAt: '2024-01-13',
    updatedAt: '2024-01-13'
  },
  {
    id: '4',
    key: 'network.min_stake',
    value: '1000',
    type: 'number',
    description: 'Minimum stake required for validators',
    createdBy: '0x5d2b...',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-12'
  },
  {
    id: '5',
    key: 'features.smart_contracts',
    value: 'true',
    type: 'boolean',
    description: 'Smart contracts enabled',
    createdBy: '0x4f1a...',
    createdAt: '2024-01-11',
    updatedAt: '2024-01-11'
  },
]

const typeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
]

export default function RegistryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const pathname = usePathname()

  const filteredData = registryData.filter(entry => {
    const matchesSearch = entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || entry.type === selectedType
    return matchesSearch && matchesType
  })

  const handleAddEntry = (formData) => {
    console.log('Adding entry:', formData)
    setIsAddDialogOpen(false)
  }

  const handleEditEntry = (entry) => {
    setEditingEntry(entry)
  }

  const handleDeleteEntry = (id) => {
    console.log('Deleting entry:', id)
  }

  const RegistryForm = ({ entry, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      key: entry?.key || '',
      value: entry?.value || '',
      type: entry?.type || 'string',
      description: entry?.description || ''
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSubmit(formData)
      onClose()
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="key">Key</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="e.g., network.version"
            required
          />
        </div>
        <div>
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="Enter value"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
            rows={3}
          />
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {entry ? 'Update' : 'Add'} Entry
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
              <h1 className="text-lg font-semibold">Registry</h1>
            </div>
          </div>
        </div>

        {/* Registry content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Blockchain Registry</h1>
              <p className="text-muted-foreground">
                Manage and monitor blockchain configuration entries
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search registry entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {typeOptions.map((option) => (
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
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Registry Entry</DialogTitle>
                    <DialogDescription>
                      Create a new registry entry for the blockchain.
                    </DialogDescription>
                  </DialogHeader>
                  <RegistryForm
                    onSubmit={handleAddEntry}
                    onClose={() => setIsAddDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Registry table */}
            <Card>
              <CardHeader>
                <CardTitle>Registry Entries</CardTitle>
                <CardDescription>
                  Showing {filteredData.length} of {registryData.length} entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.key}</TableCell>
                          <TableCell className="font-mono text-sm">{entry.value}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{entry.type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                          <TableCell className="font-mono text-sm">{entry.createdBy}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{entry.createdAt}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEntry(entry)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEntry(entry.id)}
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
          </div>
        </main>
      </div>
    </div>
  )
}