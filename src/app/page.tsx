<<<<<<< HEAD
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src="/logo.svg"
          alt="Z.ai Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
=======
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { blockchainService } from '@/lib/blockchain-service';

interface BlockchainData {
  status: any;
  metrics: any;
  consensus: any;
  transactions: any;
  validators: any;
  topology: any;
  security: any;
  economic: any;
}

export default function Home() {
  const [blockchainData, setBlockchainData] = useState<BlockchainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await blockchainService.getDashboardData();
        setBlockchainData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch blockchain data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
      case 'PASSED':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case 'offline':
      case 'unhealthy':
      case 'FAILED':
        return <Badge className="bg-red-500">Offline</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <img
            src="/logo.svg"
            alt="Z.ai Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-lg">Loading KALDRIX Blockchain Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <img
            src="/logo.svg"
            alt="Z.ai Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-8 py-8">
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            <img
              src="/logo.svg"
              alt="Z.ai Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold">KALDRIX Blockchain</h1>
            <p className="text-xl text-muted-foreground">Quantum DAG Network</p>
          </div>
        </div>

        {/* Blockchain Data Display */}
        {blockchainData ? (
          <>
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network Status</CardTitle>
                  {getStatusBadge(blockchainData.status.network_status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{blockchainData.status.network_peers}</div>
                  <p className="text-xs text-muted-foreground">Active Peers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions/sec</CardTitle>
                  <Badge variant="secondary">Live</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{blockchainData.status.transactions_per_second.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Current TPS</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consensus Height</CardTitle>
                  <Badge variant="outline">Block</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{blockchainData.consensus.consensus_height.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Latest Block</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Node Health</CardTitle>
                  {getStatusBadge(blockchainData.metrics.node_health_score > 95 ? 'healthy' : 'degraded')}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{blockchainData.metrics.node_health_score}%</div>
                  <p className="text-xs text-muted-foreground">Health Score</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Network Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Network Information</CardTitle>
                  <CardDescription>Current network status and topology</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Nodes</p>
                      <p className="text-lg">{blockchainData.topology.total_nodes}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Regions</p>
                      <p className="text-lg">{blockchainData.topology.regions.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Avg Latency</p>
                      <p className="text-lg">{blockchainData.topology.average_latency}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Partition Resistance</p>
                      <p className="text-lg">{blockchainData.topology.network_partition_resistance}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Active Regions</p>
                    <div className="flex flex-wrap gap-2">
                      {blockchainData.topology.regions.map((region: string, index: number) => (
                        <Badge key={index} variant="outline">{region}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Consensus Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Consensus Information</CardTitle>
                  <CardDescription>Quantum DAG consensus details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Consensus Type</p>
                      <p className="text-lg">{blockchainData.consensus.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Shard Count</p>
                      <p className="text-lg">{blockchainData.consensus.shard_count}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Validators</p>
                      <p className="text-lg">{blockchainData.consensus.validators}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Block Time</p>
                      <p className="text-lg">{blockchainData.consensus.last_block_time}ms</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Consensus Health</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${blockchainData.consensus.health_score}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">{blockchainData.consensus.health_score}%</p>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Statistics</CardTitle>
                  <CardDescription>Network transaction performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Transactions</p>
                      <p className="text-lg">{blockchainData.transactions.total_transactions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Success Rate</p>
                      <p className="text-lg">
                        {((blockchainData.transactions.successful_transactions / blockchainData.transactions.total_transactions) * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Failed Transactions</p>
                      <p className="text-lg">{blockchainData.transactions.failed_transactions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Avg Block Time</p>
                      <p className="text-lg">{blockchainData.transactions.average_block_time}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Economic Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Economic Metrics</CardTitle>
                  <CardDescription>Token economics and supply</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Token Symbol</p>
                      <p className="text-lg">{blockchainData.economic.token_symbol}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Price</p>
                      <p className="text-lg">${blockchainData.economic.current_price_usd}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Supply</p>
                      <p className="text-lg">{(parseInt(blockchainData.economic.total_supply) / 1e18).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Circulating Supply</p>
                      <p className="text-lg">{(parseInt(blockchainData.economic.circulating_supply) / 1e18).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Staked Supply</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(parseInt(blockchainData.economic.staked_supply) / parseInt(blockchainData.economic.total_supply)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(parseInt(blockchainData.economic.staked_supply) / 1e18).toLocaleString()} KALD ({((parseInt(blockchainData.economic.staked_supply) / parseInt(blockchainData.economic.total_supply)) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground">No blockchain data available</p>
          </div>
        )}
      </div>
    </div>
  );
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
}