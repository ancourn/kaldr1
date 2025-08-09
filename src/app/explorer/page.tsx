'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, RefreshCw, Eye, Copy, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Types
interface BridgeTransaction {
  id: string;
  type: 'lock' | 'unlock';
  sourceChain: string;
  targetChain: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  amountUsd: number;
  recipient: string;
  sender: string;
  status: 'pending' | 'collecting' | 'verifying' | 'verified' | 'failed' | 'completed';
  proofId?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: number;
  gasPrice: string;
  confirmations: number;
  requiredConfirmations: number;
}

interface Proof {
  id: string;
  transactionHash: string;
  messageHash: string;
  sourceChain: string;
  targetChain: string;
  signatures: ValidatorSignature[];
  status: 'pending' | 'collecting' | 'verified' | 'failed';
  createdAt: number;
  expiresAt: number;
  validatorCount: number;
  requiredSignatures: number;
}

interface ValidatorSignature {
  validatorAddress: string;
  validatorName: string;
  signature: string;
  messageHash: string;
  timestamp: number;
}

interface Validator {
  address: string;
  name: string;
  publicKey: string;
  stakeAmount: number;
  isActive: boolean;
  isSlashed: boolean;
  reputationScore: number;
  lastSeen: number;
}

export default function BridgeExplorer() {
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<BridgeTransaction | null>(null);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockData = {
      transactions: [
        {
          id: 'tx_001',
          type: 'lock' as const,
          sourceChain: 'Ethereum',
          targetChain: 'KALDRIX',
          tokenAddress: '0x1234567890123456789012345678901234567890',
          tokenSymbol: 'USDC',
          amount: '1000.00',
          amountUsd: 1000.00,
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          sender: '0x1111111111111111111111111111111111111111',
          status: 'verified' as const,
          proofId: 'proof_001',
          transactionHash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          blockNumber: 18456789,
          timestamp: Date.now() - 3600000,
          gasUsed: 85000,
          gasPrice: '20',
          confirmations: 15,
          requiredConfirmations: 12,
        },
        {
          id: 'tx_002',
          type: 'unlock' as const,
          sourceChain: 'KALDRIX',
          targetChain: 'Ethereum',
          tokenAddress: '0x1234567890123456789012345678901234567890',
          tokenSymbol: 'USDC',
          amount: '500.00',
          amountUsd: 500.00,
          recipient: '0x2222222222222222222222222222222222222222',
          sender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          status: 'pending' as const,
          transactionHash: '0x1234567890123456789012345678901234567890123456789012345667890',
          blockNumber: 845678,
          timestamp: Date.now() - 1800000,
          gasUsed: 95000,
          gasPrice: '25',
          confirmations: 3,
          requiredConfirmations: 6,
        },
        {
          id: 'tx_003',
          type: 'lock' as const,
          sourceChain: 'Polygon',
          targetChain: 'KALDRIX',
          tokenAddress: '0x9876543210987654321098765432109876543210',
          tokenSymbol: 'MATIC',
          amount: '100.00',
          amountUsd: 75.00,
          recipient: '0x3333333333333333333333333333333333333333',
          sender: '0x4444444444444444444444444444444444444444',
          status: 'collecting' as const,
          proofId: 'proof_002',
          transactionHash: '0x987654321098765432109876543210987654321098765432109876543210',
          blockNumber: 45678901,
          timestamp: Date.now() - 900000,
          gasUsed: 75000,
          gasPrice: '15',
          confirmations: 8,
          requiredConfirmations: 10,
        },
        {
          id: 'tx_004',
          type: 'unlock' as const,
          sourceChain: 'KALDRIX',
          targetChain: 'BSC',
          tokenAddress: '0x5555555555555555555555555555555555555555',
          tokenSymbol: 'BNB',
          amount: '2.50',
          amountUsd: 750.00,
          recipient: '0x6666666666666666666666666666666666666666',
          sender: '0x7777777777777777777777777777777777777777',
          status: 'failed' as const,
          transactionHash: '0x5555555555555555555555555555555555555555555555555555555555555',
          blockNumber: 12345678,
          timestamp: Date.now() - 7200000,
          gasUsed: 110000,
          gasPrice: '30',
          confirmations: 20,
          requiredConfirmations: 12,
        },
      ],
      proofs: [
        {
          id: 'proof_001',
          transactionHash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          messageHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          sourceChain: 'Ethereum',
          targetChain: 'KALDRIX',
          signatures: [
            {
              validatorAddress: '0xval1',
              validatorName: 'Validator Alpha',
              signature: '0xsig1...',
              messageHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              timestamp: Date.now() - 3500000,
            },
            {
              validatorAddress: '0xval2',
              validatorName: 'Validator Beta',
              signature: '0xsig2...',
              messageHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              timestamp: Date.now() - 3400000,
            },
          ],
          status: 'verified' as const,
          createdAt: Date.now() - 3600000,
          expiresAt: Date.now() + 600000,
          validatorCount: 3,
          requiredSignatures: 2,
        },
        {
          id: 'proof_002',
          transactionHash: '0x987654321098765432109876543210987654321098765432109876543210',
          messageHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          sourceChain: 'Polygon',
          targetChain: 'KALDRIX',
          signatures: [
            {
              validatorAddress: '0xval1',
              validatorName: 'Validator Alpha',
              signature: '0xsig3...',
              messageHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              timestamp: Date.now() - 850000,
            },
          ],
          status: 'collecting' as const,
          createdAt: Date.now() - 900000,
          expiresAt: Date.now() + 300000,
          validatorCount: 3,
          requiredSignatures: 2,
        },
      ],
      validators: [
        {
          address: '0xval1',
          name: 'Validator Alpha',
          publicKey: 'pub_key_alpha...',
          stakeAmount: 100000,
          isActive: true,
          isSlashed: false,
          reputationScore: 95,
          lastSeen: Date.now() - 300000,
        },
        {
          address: '0xval2',
          name: 'Validator Beta',
          publicKey: 'pub_key_beta...',
          stakeAmount: 80000,
          isActive: true,
          isSlashed: false,
          reputationScore: 88,
          lastSeen: Date.now() - 600000,
        },
        {
          address: '0xval3',
          name: 'Validator Gamma',
          publicKey: 'pub_key_gamma...',
          stakeAmount: 120000,
          isActive: false,
          isSlashed: false,
          reputationScore: 92,
          lastSeen: Date.now() - 3600000,
        },
      ],
    };

    setTransactions(mockData.transactions);
    setProofs(mockData.proofs);
    setValidators(mockData.validators);
    setLoading(false);
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchTerm === '' || 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      collecting: { variant: 'outline', icon: <Clock className="w-3 h-3" /> },
      verifying: { variant: 'outline', icon: <AlertCircle className="w-3 h-3" /> },
      verified: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
    };

    const config = variants[status] || variants.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bridge Explorer</h1>
          <p className="text-muted-foreground">
            Monitor cross-chain transactions and proofs
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {transactions.filter(tx => tx.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transactions.filter(tx => tx.status === 'verified').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {validators.filter(v => v.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by ID, hash, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="collecting">Collecting</SelectItem>
                <SelectItem value="verifying">Verifying</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lock">Lock</SelectItem>
                <SelectItem value="unlock">Unlock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="proofs">Proofs</TabsTrigger>
          <TabsTrigger value="validators">Validators</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bridge Transactions</CardTitle>
              <CardDescription>
                All cross-chain bridge transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Source → Target</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                          <TableCell>
                            <Badge variant={tx.type === 'lock' ? 'default' : 'secondary'}>
                              {tx.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {tx.sourceChain} → {tx.targetChain}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{tx.tokenSymbol}</div>
                              <div className="text-muted-foreground text-xs">
                                {formatAddress(tx.tokenAddress)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{tx.amount} {tx.tokenSymbol}</div>
                              <div className="text-muted-foreground text-xs">
                                ${tx.amountUsd.toFixed(2)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {formatTimestamp(tx.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTransaction(tx)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(tx.transactionHash)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://etherscan.io/tx/${tx.transactionHash}`, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proofs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bridge Proofs</CardTitle>
              <CardDescription>
                Cryptographic proofs for cross-chain transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proofs.map((proof) => (
                  <Card key={proof.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{proof.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {proof.sourceChain} → {proof.targetChain}
                        </p>
                      </div>
                      {getStatusBadge(proof.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Transaction Hash</p>
                        <p className="text-xs font-mono">{proof.transactionHash}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Message Hash</p>
                        <p className="text-xs font-mono">{proof.messageHash}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Signatures</p>
                        <p className="text-sm">
                          {proof.signatures.length} / {proof.requiredSignatures}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Expires</p>
                        <p className="text-sm">{formatTimestamp(proof.expiresAt)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Validator Signatures</p>
                      {proof.signatures.map((sig, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="text-sm font-medium">{sig.validatorName}</p>
                            <p className="text-xs text-muted-foreground">{sig.validatorAddress}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(sig.timestamp)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(sig.signature)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProof(proof)}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bridge Validators</CardTitle>
              <CardDescription>
                Network validators securing the bridge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {validators.map((validator) => (
                  <Card key={validator.address} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{validator.name}</h3>
                      <div className="flex gap-2">
                        {validator.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {validator.isSlashed && (
                          <Badge variant="destructive">Slashed</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Address:</span>
                        <div className="font-mono text-xs">{formatAddress(validator.address)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stake:</span>
                        <div>{validator.stakeAmount.toLocaleString()} tokens</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reputation:</span>
                        <div>{validator.reputationScore}/100</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Seen:</span>
                        <div>{formatTimestamp(validator.lastSeen)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">ID</p>
                  <p className="font-mono text-sm">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm">{selectedTransaction.type.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm">{formatTimestamp(selectedTransaction.timestamp)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Transfer Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Source Chain</p>
                    <p>{selectedTransaction.sourceChain}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target Chain</p>
                    <p>{selectedTransaction.targetChain}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Token</p>
                    <p>{selectedTransaction.tokenSymbol}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p>{selectedTransaction.amount} {selectedTransaction.tokenSymbol}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sender</p>
                    <p className="font-mono text-xs">{selectedTransaction.sender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recipient</p>
                    <p className="font-mono text-xs">{selectedTransaction.recipient}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Blockchain Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Transaction Hash</p>
                    <p className="font-mono text-xs">{selectedTransaction.transactionHash}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Block Number</p>
                    <p>{selectedTransaction.blockNumber.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gas Used</p>
                    <p>{selectedTransaction.gasUsed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gas Price</p>
                    <p>{selectedTransaction.gasPrice} Gwei</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Confirmations</p>
                    <p>{selectedTransaction.confirmations} / {selectedTransaction.requiredConfirmations}</p>
                  </div>
                  {selectedTransaction.proofId && (
                    <div>
                      <p className="text-muted-foreground">Proof ID</p>
                      <p className="font-mono text-xs">{selectedTransaction.proofId}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}