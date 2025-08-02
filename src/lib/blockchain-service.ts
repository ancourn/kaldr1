import { db } from './db';

export interface BlockchainStatus {
  total_transactions: number;
  network_peers: number;
  consensus_height: number;
  quantum_resistance_score: number;
  transactions_per_second: number;
  block_time: number;
  active_validators: number;
  total_stake: number;
  network_status: "online" | "degraded" | "offline";
  last_updated: string;
  version: string;
}

export interface TransactionData {
  id: string;
  txHash: string;
  sender: string;
  receiver: string;
  amount: number;
  fee: number;
  timestamp: Date;
  status: string;
  confirmations: number;
  quantumResistanceScore: number;
}

export interface NetworkMetricsData {
  cpu_usage: number;
  memory_usage: number;
  network_latency: number;
  active_connections: number;
  tps: number;
  block_time: number;
  mempool_size: number;
  total_peers: number;
  active_peers: number;
}

class BlockchainService {
  private blockchainId: string;

  constructor() {
    this.blockchainId = 'kaldrix-mainnet-1'; // Default blockchain ID
  }

  async initializeBlockchain(): Promise<void> {
    try {
      // Check if blockchain exists, if not create it
      let blockchain = await db.blockchain.findUnique({
        where: { networkId: this.blockchainId }
      });

      if (!blockchain) {
        blockchain = await db.blockchain.create({
          data: {
            name: 'KALDRIX Mainnet',
            networkId: this.blockchainId,
            version: '1.0.0',
            status: 'active'
          }
        });
        console.log('Blockchain initialized:', blockchain.name);
      }
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
      throw error;
    }
  }

  async getBlockchainStatus(): Promise<BlockchainStatus> {
    try {
      const blockchain = await db.blockchain.findUnique({
        where: { networkId: this.blockchainId },
        include: {
          transactions: {
            where: { status: 'confirmed' },
            select: { id: true }
          },
          peers: {
            where: { isConnected: true },
            select: { id: true }
          },
          blocks: {
            orderBy: { height: 'desc' },
            take: 1,
            select: { height: true, timestamp: true }
          }
        }
      });

      if (!blockchain) {
        throw new Error('Blockchain not found');
      }

      const latestBlock = blockchain.blocks[0];
      const totalTransactions = blockchain.transactions.length;
      const activePeers = blockchain.peers.length;
      const consensusHeight = latestBlock?.height || 0;

      // Calculate TPS from recent transactions
      const recentTime = new Date(Date.now() - 60000); // Last minute
      const recentTransactions = await db.transaction.count({
        where: {
          blockchainId: blockchain.id,
          timestamp: { gte: recentTime },
          status: 'confirmed'
        }
      });

      // Get latest metrics
      const latestMetrics = await db.networkMetrics.findFirst({
        where: { blockchainId: blockchain.id },
        orderBy: { timestamp: 'desc' }
      });

      // Calculate average quantum resistance score
      const avgQuantumScore = await db.transaction.aggregate({
        where: { blockchainId: blockchain.id, status: 'confirmed' },
        _avg: { quantumResistanceScore: true }
      });

      return {
        total_transactions: totalTransactions,
        network_peers: activePeers,
        consensus_height: consensusHeight,
        quantum_resistance_score: (avgQuantumScore._avg.quantumResistanceScore || 80) / 100,
        transactions_per_second: recentTransactions,
        block_time: latestMetrics?.blockTime || 3.2,
        active_validators: 3, // Mock value
        total_stake: 15000, // Mock value
        network_status: this.determineNetworkStatus(activePeers, latestMetrics),
        last_updated: new Date().toISOString(),
        version: blockchain.version
      };
    } catch (error) {
      console.error('Failed to get blockchain status:', error);
      throw error;
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<TransactionData[]> {
    try {
      const transactions = await db.transaction.findMany({
        where: { blockchainId: this.blockchainId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          quantumProofs: {
            select: { score: true }
          }
        }
      });

      return transactions.map(tx => ({
        id: tx.id,
        txHash: tx.txHash,
        sender: tx.sender,
        receiver: tx.receiver,
        amount: Number(tx.amount),
        fee: Number(tx.fee),
        timestamp: tx.timestamp,
        status: tx.status,
        confirmations: tx.confirmations,
        quantumResistanceScore: tx.quantumProofs[0]?.score || tx.quantumResistanceScore
      }));
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      throw error;
    }
  }

  async createTransaction(transactionData: {
    sender: string;
    receiver: string;
    amount: number;
    fee?: number;
    metadata?: string;
  }): Promise<TransactionData> {
    try {
      const blockchain = await db.blockchain.findUnique({
        where: { networkId: this.blockchainId }
      });

      if (!blockchain) {
        throw new Error('Blockchain not found');
      }

      const transaction = await db.transaction.create({
        data: {
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          sender: transactionData.sender,
          receiver: transactionData.receiver,
          amount: BigInt(transactionData.amount),
          fee: BigInt(transactionData.fee || 1),
          nonce: Math.floor(Math.random() * 1000000),
          status: 'pending',
          quantumResistanceScore: Math.floor(Math.random() * 20) + 80,
          metadata: transactionData.metadata,
          blockchainId: blockchain.id
        },
        include: {
          quantumProofs: {
            select: { score: true }
          }
        }
      });

      // Create quantum proof
      await db.quantumProof.create({
        data: {
          transactionId: transaction.id,
          algorithm: 'Kyber',
          proofData: Buffer.from('mock-proof-data').toString('base64'),
          verificationKey: `0x${Math.random().toString(16).substr(2, 64)}`,
          score: Math.floor(Math.random() * 20) + 80,
          isValid: true
        }
      });

      return {
        id: transaction.id,
        txHash: transaction.txHash,
        sender: transaction.sender,
        receiver: transaction.receiver,
        amount: Number(transaction.amount),
        fee: Number(transaction.fee),
        timestamp: transaction.timestamp,
        status: transaction.status,
        confirmations: transaction.confirmations,
        quantumResistanceScore: transaction.quantumProofs[0]?.score || transaction.quantumResistanceScore
      };
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  }

  async updateNetworkMetrics(metrics: NetworkMetricsData): Promise<void> {
    try {
      const blockchain = await db.blockchain.findUnique({
        where: { networkId: this.blockchainId }
      });

      if (!blockchain) {
        throw new Error('Blockchain not found');
      }

      await db.networkMetrics.create({
        data: {
          blockchainId: blockchain.id,
          cpuUsage: metrics.cpu_usage,
          memoryUsage: metrics.memory_usage,
          networkLatency: metrics.network_latency,
          activeConnections: metrics.active_connections,
          tps: metrics.tps,
          blockTime: metrics.block_time,
          mempoolSize: metrics.mempool_size,
          totalPeers: metrics.total_peers,
          activePeers: metrics.active_peers
        }
      });
    } catch (error) {
      console.error('Failed to update network metrics:', error);
      throw error;
    }
  }

  async getNetworkMetrics(): Promise<NetworkMetricsData> {
    try {
      const latestMetrics = await db.networkMetrics.findFirst({
        where: { blockchainId: this.blockchainId },
        orderBy: { timestamp: 'desc' }
      });

      if (!latestMetrics) {
        // Return default metrics if none exist
        return {
          cpu_usage: 0,
          memory_usage: 0,
          network_latency: 0,
          active_connections: 0,
          tps: 0,
          block_time: 0,
          mempool_size: 0,
          total_peers: 0,
          active_peers: 0
        };
      }

      return {
        cpu_usage: latestMetrics.cpuUsage,
        memory_usage: latestMetrics.memoryUsage,
        network_latency: latestMetrics.networkLatency,
        active_connections: latestMetrics.activeConnections,
        tps: latestMetrics.tps,
        block_time: latestMetrics.blockTime,
        mempool_size: latestMetrics.mempoolSize,
        total_peers: latestMetrics.totalPeers,
        active_peers: latestMetrics.activePeers
      };
    } catch (error) {
      console.error('Failed to get network metrics:', error);
      throw error;
    }
  }

  private determineNetworkStatus(activePeers: number, metrics: any): "online" | "degraded" | "offline" {
    if (activePeers === 0) {
      return "offline";
    }
    
    if (activePeers < 5 || (metrics && metrics.cpuUsage > 90)) {
      return "degraded";
    }
    
    return "online";
  }

  async simulateNetworkLoad(): Promise<void> {
    try {
      // Update blockchain status to degraded
      await db.blockchain.update({
        where: { networkId: this.blockchainId },
        data: { status: 'degraded' }
      });

      // Create high load metrics
      await this.updateNetworkMetrics({
        cpu_usage: 95,
        memory_usage: 85,
        network_latency: 150,
        active_connections: 5,
        tps: 500,
        block_time: 8.5,
        mempool_size: 200,
        total_peers: 25,
        active_peers: 5
      });
    } catch (error) {
      console.error('Failed to simulate network load:', error);
      throw error;
    }
  }

  async resetNetwork(): Promise<void> {
    try {
      // Reset blockchain status to active
      await db.blockchain.update({
        where: { networkId: this.blockchainId },
        data: { status: 'active' }
      });

      // Reset to normal metrics
      await this.updateNetworkMetrics({
        cpu_usage: 45,
        memory_usage: 62,
        network_latency: 23,
        active_connections: 15,
        tps: 1250,
        block_time: 3.2,
        mempool_size: 45,
        total_peers: 25,
        active_peers: 18
      });
    } catch (error) {
      console.error('Failed to reset network:', error);
      throw error;
    }
  }

  async seedDatabase(): Promise<void> {
    try {
      console.log('🌱 Seeding database with initial data...');
      
      // Create blockchain if not exists
      const blockchain = await db.blockchain.upsert({
        where: { networkId: this.blockchainId },
        update: {},
        create: {
          name: 'KALDRIX Devnet',
          networkId: this.blockchainId,
          version: '1.0.0-dev',
          status: 'active'
        }
      });

      console.log('✅ Blockchain created:', blockchain.name);

      // Create initial network peers
      const peers = [
        { peerId: 'peer-1', address: '127.0.0.1', port: 8081, version: '1.0.0' },
        { peerId: 'peer-2', address: '127.0.0.1', port: 8082, version: '1.0.0' },
        { peerId: 'peer-3', address: '127.0.0.1', port: 8083, version: '1.0.0' }
      ];

      for (const peer of peers) {
        await db.networkPeer.upsert({
          where: { peerId: peer.peerId },
          update: { isConnected: true },
          create: {
            ...peer,
            isConnected: true,
            reputation: 100,
            blockchainId: blockchain.id
          }
        });
      }

      console.log('✅ Network peers created');

      // Create initial block
      const genesisBlock = await db.block.upsert({
        where: { hash: 'genesis-block-hash' },
        update: {},
        create: {
          hash: 'genesis-block-hash',
          previousHash: '0',
          height: 0,
          nonce: 0,
          difficulty: 1,
          merkleRoot: 'genesis-merkle-root',
          txCount: 0,
          size: 0,
          blockchainId: blockchain.id
        }
      });

      console.log('✅ Genesis block created');

      // Create sample transactions
      const sampleTransactions = [
        { sender: '0x1234567890123456789012345678901234567890', receiver: '0x0987654321098765432109876543210987654321', amount: 100 },
        { sender: '0x0987654321098765432109876543210987654321', receiver: '0x1234567890123456789012345678901234567890', amount: 50 },
        { sender: '0x1111111111111111111111111111111111111111', receiver: '0x2222222222222222222222222222222222222222', amount: 25 }
      ];

      for (let i = 0; i < sampleTransactions.length; i++) {
        const tx = sampleTransactions[i];
        const transaction = await db.transaction.create({
          data: {
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            sender: tx.sender,
            receiver: tx.receiver,
            amount: BigInt(tx.amount),
            fee: BigInt(1),
            nonce: i,
            status: 'confirmed',
            confirmations: 10,
            quantumResistanceScore: 85 + Math.floor(Math.random() * 15),
            blockchainId: blockchain.id,
            blockId: genesisBlock.id
          }
        });

        // Create quantum proof for each transaction
        await db.quantumProof.create({
          data: {
            transactionId: transaction.id,
            algorithm: 'Kyber',
            proofData: Buffer.from('mock-proof-data').toString('base64'),
            verificationKey: `0x${Math.random().toString(16).substr(2, 64)}`,
            score: 85 + Math.floor(Math.random() * 15),
            isValid: true
          }
        });
      }

      console.log('✅ Sample transactions created');

      // Create initial network metrics
      await db.networkMetrics.create({
        data: {
          blockchainId: blockchain.id,
          cpuUsage: 45.2,
          memoryUsage: 62.8,
          networkLatency: 23.5,
          activeConnections: 15,
          tps: 1250.0,
          blockTime: 3.2,
          mempoolSize: 45,
          totalPeers: 25,
          activePeers: 18
        }
      });

      console.log('✅ Network metrics created');

      // Create governance proposals
      const proposals = [
        {
          title: 'Enable Quantum Resistance Upgrade',
          description: 'Proposal to upgrade the quantum resistance algorithm to the latest version',
          type: 'protocol_upgrade',
          status: 'active',
          votesFor: 15,
          votesAgainst: 3,
          totalVotes: 18
        },
        {
          title: 'Increase Block Size Limit',
          description: 'Proposal to increase the block size limit from 2MB to 4MB',
          type: 'parameter_change',
          status: 'pending',
          votesFor: 8,
          votesAgainst: 2,
          totalVotes: 10
        },
        {
          title: 'Add New Validator Node',
          description: 'Proposal to add a new validator node to the network',
          type: 'network_change',
          status: 'passed',
          votesFor: 20,
          votesAgainst: 1,
          totalVotes: 21
        }
      ];

      for (const proposal of proposals) {
        await db.governanceProposal.create({
          data: {
            ...proposal,
            blockchainId: blockchain.id,
            createdBy: '0x1234567890123456789012345678901234567890',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        });
      }

      console.log('✅ Governance proposals created');
      console.log('🎉 Database seeded successfully!');
      
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; database: string; blockchain: string }> {
    try {
      // Check database connection
      await db.$queryRaw`SELECT 1`;
      
      // Check if blockchain exists
      const blockchain = await db.blockchain.findUnique({
        where: { networkId: this.blockchainId }
      });
      
      return {
        status: 'healthy',
        database: 'connected',
        blockchain: blockchain ? 'initialized' : 'not_initialized'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        blockchain: 'unknown'
      };
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();