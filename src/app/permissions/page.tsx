'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Edit, 
  Users, 
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
  id: string;
  contractId: string;
  userId: string;
  role: 'OWNER' | 'DEVELOPER' | 'AUDITOR';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  contract: {
    id: string;
    name: string;
    address: string;
    owner: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Contract {
  id: string;
  name: string;
  address: string;
  owner: string;
}

const availablePermissions = [
  'read',
  'write',
  'deploy',
  'invoke',
  'freeze',
  'unfreeze',
  'audit',
  'manage_permissions',
  'delete',
];

const roleDescriptions = {
  OWNER: 'Full control over the contract including deployment, invocation, and permission management',
  DEVELOPER: 'Can read, write, and invoke contracts but cannot manage permissions',
  AUDITOR: 'Can read contract details and perform security audits',
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    role: 'DEVELOPER' as 'OWNER' | 'DEVELOPER' | 'AUDITOR',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
    fetchContracts();
  }, [selectedContract]);

  const fetchPermissions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedContract) params.append('contractId', selectedContract);
      
      const response = await fetch(`/api/permissions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      
      const data = await response.json();
      setPermissions(data.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) return; // Users endpoint might not exist yet
      
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Mock users for demo
      setUsers([
        { id: '1', name: 'Alice Developer', email: 'alice@example.com', role: 'DEVELOPER' },
        { id: '2', name: 'Bob Auditor', email: 'bob@example.com', role: 'AUDITOR' },
        { id: '3', name: 'Charlie Admin', email: 'charlie@example.com', role: 'ADMIN' },
      ]);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/blockchain/contracts');
      if (!response.ok) return;
      
      const data = await response.json();
      setContracts(data.data.contracts || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      // Mock contracts for demo
      setContracts([
        { id: '1', name: 'Token Contract', address: '0x1234...5678', owner: '1' },
        { id: '2', name: 'NFT Marketplace', address: '0xabcd...efgh', owner: '1' },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContract || !formData.userId) {
      toast.error('Please select a contract and user');
      return;
    }

    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: selectedContract,
          userId: formData.userId,
          role: formData.role,
          permissions: formData.permissions,
        }),
      });

      if (!response.ok) throw new Error('Failed to save permission');
      
      const data = await response.json();
      toast.success('Permission saved successfully');
      
      // Reset form and close dialog
      setFormData({ userId: '', role: 'DEVELOPER', permissions: [] });
      setIsDialogOpen(false);
      setEditingPermission(null);
      
      // Refresh permissions
      fetchPermissions();
    } catch (error) {
      console.error('Error saving permission:', error);
      toast.error('Failed to save permission');
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (!confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    try {
      const response = await fetch(`/api/permissions?contractId=${permission.contractId}&userId=${permission.userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete permission');
      
      toast.success('Permission deleted successfully');
      fetchPermissions();
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission');
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      userId: permission.userId,
      role: permission.role,
      permissions: permission.permissions,
    });
    setIsDialogOpen(true);
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500';
      case 'DEVELOPER':
        return 'bg-blue-500';
      case 'AUDITOR':
        return 'bg-green-500';
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
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role-Based Access Control</h1>
          <p className="text-muted-foreground">
            Manage user permissions and access control for smart contracts
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
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Permission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPermission ? 'Edit Permission' : 'Add New Permission'}
                </DialogTitle>
                <DialogDescription>
                  Configure user access permissions for smart contracts
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contract">Contract</Label>
                    <Select value={selectedContract} onValueChange={setSelectedContract}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.name} ({contract.address})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user">User</Label>
                    <Select 
                      value={formData.userId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: 'OWNER' | 'DEVELOPER' | 'AUDITOR') => 
                        setFormData(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OWNER">Owner</SelectItem>
                        <SelectItem value="DEVELOPER">Developer</SelectItem>
                        <SelectItem value="AUDITOR">Auditor</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.role && (
                      <p className="text-sm text-muted-foreground">
                        {roleDescriptions[formData.role]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Specific Permissions</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {availablePermissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Switch
                            id={permission}
                            checked={formData.permissions.includes(permission)}
                            onCheckedChange={() => handlePermissionToggle(permission)}
                          />
                          <Label htmlFor={permission} className="text-sm">
                            {permission.replace('_', ' ').toUpperCase()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPermission ? 'Update Permission' : 'Add Permission'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Contract Permissions
          </CardTitle>
          <CardDescription>
            Current permissions assigned to users for smart contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No permissions found. Add permissions to manage user access to contracts.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{permission.contract.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {permission.contract.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{permission.user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {permission.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(permission.role)}>
                        {permission.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {permission.permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(permission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(permission)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Full control over the contract including deployment, invocation, and permission management
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Deploy contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Invoke functions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Manage permissions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Freeze/unfreeze</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Developer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Can read, write, and invoke contracts but cannot manage permissions
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Read contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Write contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Invoke functions</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Manage permissions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Auditor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Can read contract details and perform security audits
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Read contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Security audit</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Write contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Invoke functions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}