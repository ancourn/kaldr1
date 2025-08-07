/**
 * KALDRIX DAG Explorer Component
 * 
 * Provides debugging interface for exploring DAG structure and bundle history
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

// Mock data structure - in real implementation, this would come from the DAG engine
interface DAGNode {
  id: string;
  hash: string;
  level: number;
  confirmed: boolean;
  transactionCount: number;
  timestamp: number;
  validator: string;
  gasUsed: bigint;
}

interface BundleHistoryEntry {
  bundleId: string;
  nodeId: string;
  timestamp: number;
  transactionCount: number;
  validatorSignatures: Array<{
    validatorId: string;
    validatorAddress: string;
    signature: string;
    timestamp: number;
    region: string;
    isValid: boolean;
    weight: number;
  }>;
  confirmationTime: number;
  status: 'pending' | 'confirmed' | 'failed';
  totalFee: bigint;
}

interface ValidatorStats {
  validatorId: string;
  totalSignatures: number;
  averageResponseTime: number;
  successRate: number;
  recentActivity: number;
  region: string;
}

export function DAGExplorer() {
  const [nodes, setNodes] = useState<DAGNode[]>([]);
  const [bundleHistory, setBundleHistory] = useState<BundleHistoryEntry[]>([]);
  const [validatorStats, setValidatorStats] = useState<ValidatorStats[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  // Mock data initialization
  useEffect(() => {
    // Generate mock data for demonstration
    const mockNodes: DAGNode[] = Array.from({ length: 50 }, (_, i) => ({
      id: `node_${i}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      level: Math.floor(i / 10),
      confirmed: Math.random() > 0.2,
      transactionCount: Math.floor(Math.random() * 100) + 1,
      timestamp: Date.now() - Math.random() * 86400000, // Last 24 hours
      validator: `validator_${Math.floor(Math.random() * 7) + 1}`,
      gasUsed: BigInt(Math.floor(Math.random() * 1000000) + 21000)
    }));

    const mockBundleHistory: BundleHistoryEntry[] = Array.from({ length: 100 }, (_, i) => ({
      bundleId: `bundle_${i}`,
      nodeId: `node_${Math.floor(Math.random() * 50)}`,
      timestamp: Date.now() - Math.random() * 86400000,
      transactionCount: Math.floor(Math.random() * 100) + 1,
      validatorSignatures: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
        validatorId: `validator_${Math.floor(Math.random() * 7) + 1}`,
        validatorAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        signature: `0x${Math.random().toString(16).substr(2, 128)}`,
        timestamp: Date.now() - Math.random() * 86400000,
        region: ['US-East', 'EU-West', 'Asia-Pacific'][Math.floor(Math.random() * 3)],
        isValid: Math.random() > 0.1,
        weight: Math.random() * 1000 + 100
      })),
      confirmationTime: Math.random() * 5000,
      status: ['pending', 'confirmed', 'failed'][Math.floor(Math.random() * 3)] as 'pending' | 'confirmed' | 'failed',
      totalFee: BigInt(Math.floor(Math.random() * 1000000) + 1000)
    }));

    const mockValidatorStats: ValidatorStats[] = Array.from({ length: 7 }, (_, i) => ({
      validatorId: `validator_${i + 1}`,
      totalSignatures: Math.floor(Math.random() * 1000) + 100,
      averageResponseTime: Math.random() * 3000 + 1000,
      successRate: Math.random() * 0.2 + 0.8, // 80-100%
      recentActivity: Math.floor(Math.random() * 100),
      region: ['US-East', 'EU-West', 'Asia-Pacific'][i % 3]
    }));

    setNodes(mockNodes);
    setBundleHistory(mockBundleHistory);
    setValidatorStats(mockValidatorStats);
  }, []);

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.validator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'confirmed' && node.confirmed) ||
                         (filterStatus === 'pending' && !node.confirmed);
    return matchesSearch && matchesStatus;
  });

  const filteredBundles = bundleHistory.filter(bundle => {
    const matchesSearch = bundle.bundleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bundle.nodeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bundle.status === filterStatus;
    const matchesRegion = filterRegion === 'all' || 
                         bundle.validatorSignatures.some(sig => sig.region === filterRegion);
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;
  const selectedNodeBundles = selectedNode ? bundleHistory.filter(b => b.nodeId === selectedNode) : [];

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DAG Explorer</h1>
          <p className="text-muted-foreground">
            Debug and explore DAG structure, bundle history, and validator performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setFilterStatus('all');
            setFilterRegion('all');
            setSelectedNode(null);
          }}>
            Clear Filters
          </Button>
          <Button variant="default">
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="nodes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nodes">DAG Nodes</TabsTrigger>
          <TabsTrigger value="bundles">Bundle History</TabsTrigger>
          <TabsTrigger value="validators">Validator Stats</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DAG Nodes</CardTitle>
              <CardDescription>
                Browse and filter DAG nodes by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Search by ID, hash, or validator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Validator</TableHead>
                      <TableHead>Gas Used</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNodes.map((node) => (
                      <TableRow 
                        key={node.id}
                        className={selectedNode === node.id ? 'bg-muted' : 'cursor-pointer'}
                        onClick={() => setSelectedNode(node.id)}
                      >
                        <TableCell className="font-medium">{node.id}</TableCell>
                        <TableCell>{node.level}</TableCell>
                        <TableCell>
                          {getStatusBadge(node.confirmed ? 'confirmed' : 'pending')}
                        </TableCell>
                        <TableCell>{node.transactionCount}</TableCell>
                        <TableCell>{node.validator}</TableCell>
                        <TableCell>{node.gasUsed.toString()}</TableCell>
                        <TableCell>{formatTimestamp(node.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {selectedNodeData && (
            <Card>
              <CardHeader>
                <CardTitle>Node Details: {selectedNodeData.id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Hash</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedNodeData.hash}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Level</p>
                    <p className="text-sm text-muted-foreground">{selectedNodeData.level}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {getStatusBadge(selectedNodeData.confirmed ? 'confirmed' : 'pending')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Gas Used</p>
                    <p className="text-sm text-muted-foreground">{selectedNodeData.gasUsed.toString()}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Associated Bundles ({selectedNodeBundles.length})</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {selectedNodeBundles.map((bundle) => (
                        <div key={bundle.bundleId} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{bundle.bundleId}</p>
                              <p className="text-sm text-muted-foreground">
                                {bundle.transactionCount} transactions • {formatTimestamp(bundle.timestamp)}
                              </p>
                            </div>
                            <div>
                              {getStatusBadge(bundle.status)}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            Signatures: {bundle.validatorSignatures.length} • 
                            Confirmation: {bundle.confirmationTime.toFixed(0)}ms
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bundles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bundle History</CardTitle>
              <CardDescription>
                View historical bundle data and validator signatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Search by bundle ID or node ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="US-East">US-East</SelectItem>
                    <SelectItem value="EU-West">EU-West</SelectItem>
                    <SelectItem value="Asia-Pacific">Asia-Pacific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bundle ID</TableHead>
                      <TableHead>Node ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Signatures</TableHead>
                      <TableHead>Confirmation Time</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBundles.map((bundle) => (
                      <TableRow key={bundle.bundleId}>
                        <TableCell className="font-medium">{bundle.bundleId}</TableCell>
                        <TableCell>{bundle.nodeId}</TableCell>
                        <TableCell>{getStatusBadge(bundle.status)}</TableCell>
                        <TableCell>{bundle.transactionCount}</TableCell>
                        <TableCell>{bundle.validatorSignatures.length}</TableCell>
                        <TableCell>{bundle.confirmationTime.toFixed(0)}ms</TableCell>
                        <TableCell>{formatTimestamp(bundle.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validator Statistics</CardTitle>
              <CardDescription>
                Performance metrics and signature statistics for each validator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Validator ID</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Total Signatures</TableHead>
                      <TableHead>Avg Response Time</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Recent Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatorStats.map((validator) => (
                      <TableRow key={validator.validatorId}>
                        <TableCell className="font-medium">{validator.validatorId}</TableCell>
                        <TableCell>{validator.region}</TableCell>
                        <TableCell>{validator.totalSignatures}</TableCell>
                        <TableCell>{validator.averageResponseTime.toFixed(0)}ms</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${validator.successRate * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">
                              {(validator.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{validator.recentActivity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nodes.length}</div>
                <p className="text-xs text-muted-foreground">
                  {nodes.filter(n => n.confirmed).length} confirmed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bundle History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bundleHistory.length}</div>
                <p className="text-xs text-muted-foreground">
                  {bundleHistory.filter(b => b.status === 'confirmed').length} confirmed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{validatorStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across 3 regions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bundleHistory.length > 0 
                    ? (bundleHistory.reduce((sum, b) => sum + b.confirmationTime, 0) / bundleHistory.length).toFixed(0)
                    : '0'
                  }ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all bundles
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Node Confirmation Rate</span>
                    <span>
                      {nodes.length > 0 
                        ? ((nodes.filter(n => n.confirmed).length / nodes.length) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: nodes.length > 0 
                          ? `${(nodes.filter(n => n.confirmed).length / nodes.length) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Bundle Success Rate</span>
                    <span>
                      {bundleHistory.length > 0 
                        ? ((bundleHistory.filter(b => b.status === 'confirmed').length / bundleHistory.length) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: bundleHistory.length > 0 
                          ? `${(bundleHistory.filter(b => b.status === 'confirmed').length / bundleHistory.length) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Validator Success Rate</span>
                    <span>
                      {validatorStats.length > 0 
                        ? ((validatorStats.reduce((sum, v) => sum + v.successRate, 0) / validatorStats.length) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ 
                        width: validatorStats.length > 0 
                          ? `${(validatorStats.reduce((sum, v) => sum + v.successRate, 0) / validatorStats.length) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}