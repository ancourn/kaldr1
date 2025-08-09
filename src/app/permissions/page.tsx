'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield,
  Menu,
  X,
  Home,
  Plus,
  Search,
  Users,
  Key,
  Settings,
  Activity,
  Check,
  X,
  Edit,
  Trash2,
  Filter,
  UserPlus,
  Database,
  FileText,
  TestTube,
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
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Registry', href: '/registry', icon: Database },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Permissions', href: '/permissions', icon: Shield },
  { name: 'Advanced', href: '/dashboard', icon: BarChart3 },
]

const usersData = [
  {
    id: '1',
    email: 'admin@kaldrix.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15 14:30:25',
    permissions: [
      { resource: 'contracts', action: 'read', granted: true },
      { resource: 'contracts', action: 'write', granted: true },
      { resource: 'registry', action: 'read', granted: true },
      { resource: 'registry', action: 'write', granted: true },
      { resource: 'testing', action: 'read', granted: true },
      { resource: 'testing', action: 'write', granted: true },
    ]
  },
  {
    id: '2',
    email: 'developer@kaldrix.com',
    name: 'Developer User',
    role: 'developer',
    status: 'active',
    lastLogin: '2024-01-15 12:15:10',
    permissions: [
      { resource: 'contracts', action: 'read', granted: true },
      { resource: 'contracts', action: 'write', granted: true },
      { resource: 'registry', action: 'read', granted: true },
      { resource: 'registry', action: 'write', granted: false },
      { resource: 'testing', action: 'read', granted: true },
      { resource: 'testing', action: 'write', granted: true },
    ]
  },
  {
    id: '3',
    email: 'viewer@kaldrix.com',
    name: 'Viewer User',
    role: 'viewer',
    status: 'active',
    lastLogin: '2024-01-14 16:45:30',
    permissions: [
      { resource: 'contracts', action: 'read', granted: true },
      { resource: 'contracts', action: 'write', granted: false },
      { resource: 'registry', action: 'read', granted: true },
      { resource: 'registry', action: 'write', granted: false },
      { resource: 'testing', action: 'read', granted: true },
      { resource: 'testing', action: 'write', granted: false },
    ]
  }
]

const rolesData = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system access',
    permissions: [
      { resource: 'contracts', action: 'read' },
      { resource: 'contracts', action: 'write' },
      { resource: 'registry', action: 'read' },
      { resource: 'registry', action: 'write' },
      { resource: 'testing', action: 'read' },
      { resource: 'testing', action: 'write' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'write' },
    ],
    userCount: 1
  },
  {
    id: '2',
    name: 'Developer',
    description: 'Contract and testing access',
    permissions: [
      { resource: 'contracts', action: 'read' },
      { resource: 'contracts', action: 'write' },
      { resource: 'registry', action: 'read' },
      { resource: 'testing', action: 'read' },
      { resource: 'testing', action: 'write' },
    ],
    userCount: 1
  },
  {
    id: '3',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      { resource: 'contracts', action: 'read' },
      { resource: 'registry', action: 'read' },
      { resource: 'testing', action: 'read' },
    ],
    userCount: 1
  }
]

const auditLogs = [
  {
    id: '1',
    user: 'admin@kaldrix.com',
    action: 'permission_granted',
    resource: 'contracts.write',
    target: 'developer@kaldrix.com',
    timestamp: '2024-01-15 14:30:25',
    ip: '192.168.1.100'
  },
  {
    id: '2',
    user: 'developer@kaldrix.com',
    action: 'contract_deployed',
    resource: '0x7f9a1b...',
    target: 'Token Contract',
    timestamp: '2024-01-15 12:15:10',
    ip: '192.168.1.101'
  },
  {
    id: '3',
    user: 'viewer@kaldrix.com',
    action: 'access_denied',
    resource: 'registry.write',
    target: 'network.version',
    timestamp: '2024-01-14 16:45:30',
    ip: '192.168.1.102'
  }
]

const resourceOptions = [
  { value: 'contracts', label: 'Contracts' },
  { value: 'registry', label: 'Registry' },
  { value: 'testing', label: 'Testing' },
  { value: 'users', label: 'Users' },
  { value: 'dashboard', label: 'Dashboard' },
]

const actionOptions = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'delete', label: 'Delete' },
  { value: 'execute', label: 'Execute' },
]

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'developer', label: 'Developer' },
  { value: 'viewer', label: 'Viewer' },
]

export default function PermissionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const pathname = usePathname()

  const filteredUsers = usersData.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleAddUser = (formData) => {
    console.log('Adding user:', formData)
    setIsAddUserDialogOpen(false)
  }

  const handleAddRole = (formData) => {
    console.log('Adding role:', formData)
    setIsAddRoleDialogOpen(false)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
  }

  const handleEditRole = (role) => {
    setEditingRole(role)
  }

  const handleDeleteUser = (id) => {
    console.log('Deleting user:', id)
  }

  const handleDeleteRole = (id) => {
    console.log('Deleting role:', id)
  }

  const handleTogglePermission = (userId, resource, action, granted) => {
    console.log('Toggling permission:', { userId, resource, action, granted })
  }

  const UserForm = ({ user, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      email: user?.email || '',
      name: user?.name || '',
      role: user?.role || 'viewer',
      status: user?.status || 'active'
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSubmit(formData)
      onClose()
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Full Name"
            required
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="status"
            checked={formData.status === 'active'}
            onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
          />
          <Label htmlFor="status">Active</Label>
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {user ? 'Update' : 'Add'} User
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  const RoleForm = ({ role, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      name: role?.name || '',
      description: role?.description || '',
      permissions: role?.permissions || []
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSubmit(formData)
      onClose()
    }

    const togglePermission = (resource, action) => {
      const permissionIndex = formData.permissions.findIndex(
        p => p.resource === resource && p.action === action
      )
      
      if (permissionIndex >= 0) {
        setFormData({
          ...formData,
          permissions: formData.permissions.filter((_, index) => index !== permissionIndex)
        })
      } else {
        setFormData({
          ...formData,
          permissions: [...formData.permissions, { resource, action }]
        })
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Role Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Role Name"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Role description"
            rows={3}
          />
        </div>
        <div>
          <Label>Permissions</Label>
          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {resourceOptions.map(resource => (
              <div key={resource.value} className="space-y-1">
                <div className="font-medium text-sm">{resource.label}</div>
                <div className="grid grid-cols-2 gap-2 ml-2">
                  {actionOptions.map(action => (
                    <div key={action.value} className="flex items-center space-x-2">
                      <Switch
                        id={`${resource.value}-${action.value}`}
                        checked={formData.permissions.some(
                          p => p.resource === resource.value && p.action === action.value
                        )}
                        onCheckedChange={() => togglePermission(resource.value, action.value)}
                      />
                      <Label htmlFor={`${resource.value}-${action.value}`} className="text-sm">
                        {action.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {role ? 'Update' : 'Add'} Role
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
              <h1 className="text-lg font-semibold">Permissions</h1>
            </div>
          </div>
        </div>

        {/* Permissions content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
              <p className="text-muted-foreground">
                Manage user permissions and roles for the blockchain platform
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="audit">Audit Log</TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Create a new user account with specified permissions.
                        </DialogDescription>
                      </DialogHeader>
                      <UserForm
                        onSubmit={handleAddUser}
                        onClose={() => setIsAddUserDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                      Showing {filteredUsers.length} of {usersData.length} users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.role}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                  {user.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {user.lastLogin}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
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

                {/* User Permissions Detail */}
                {filteredUsers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Permission Matrix</CardTitle>
                      <CardDescription>
                        Detailed permissions for each user
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              {resourceOptions.map(resource => (
                                <TableHead key={resource.value} className="text-center">
                                  {resource.label}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                {resourceOptions.map(resource => (
                                  <TableCell key={resource.value} className="text-center">
                                    <div className="flex justify-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`p-1 h-6 w-6 ${
                                          user.permissions.find(p => 
                                            p.resource === resource.value && p.action === 'read'
                                          )?.granted ? 'text-green-600' : 'text-gray-400'
                                        }`}
                                      >
                                        R
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`p-1 h-6 w-6 ${
                                          user.permissions.find(p => 
                                            p.resource === resource.value && p.action === 'write'
                                          )?.granted ? 'text-green-600' : 'text-gray-400'
                                        }`}
                                      >
                                        W
                                      </Button>
                                    </div>
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Roles</h2>
                    <p className="text-muted-foreground">Manage user roles and their permissions</p>
                  </div>
                  <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Role</DialogTitle>
                        <DialogDescription>
                          Create a new role with specific permissions.
                        </DialogDescription>
                      </DialogHeader>
                      <RoleForm
                        onSubmit={handleAddRole}
                        onClose={() => setIsAddRoleDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rolesData.map((role) => (
                    <Card key={role.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Users</span>
                            <Badge variant="secondary">{role.userCount}</Badge>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-2">Permissions</div>
                            <div className="space-y-1">
                              {role.permissions.slice(0, 3).map((permission, index) => (
                                <div key={index} className="text-xs text-muted-foreground">
                                  {permission.resource}.{permission.action}
                                </div>
                              ))}
                              {role.permissions.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{role.permissions.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Audit Log Tab */}
              <TabsContent value="audit" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Audit Log</h2>
                  <p className="text-muted-foreground">Track permission changes and access attempts</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest security and permission events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{log.user}</span>
                              <Badge variant={
                                log.action === 'permission_granted' ? 'default' :
                                log.action === 'access_denied' ? 'destructive' : 'secondary'
                              }>
                                {log.action.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.resource} → {log.target}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {log.timestamp} • {log.ip}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}