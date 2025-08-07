import { Server } from 'socket.io';

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
<<<<<<< HEAD
=======
=======
interface BlockchainStatus {
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

interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  quantum_score: number;
  fee: number;
}

interface NetworkMetrics {
  cpu_usage: number;
  memory_usage: number;
  network_latency: number;
  active_connections: number;
}

export const setupSocket = (io: Server) => {
  // Store connected clients
  const connectedClients = new Set<string>();
  
  // Simulate blockchain data updates
  let blockchainStatus: BlockchainStatus = {
    total_transactions: 1247,
    network_peers: 8,
    consensus_height: 523,
    quantum_resistance_score: 0.95,
    transactions_per_second: 1250,
    block_time: 3.2,
    active_validators: 3,
    total_stake: 15000,
    network_status: "online",
    last_updated: new Date().toISOString(),
    version: "1.0.0"
  };

  let networkMetrics: NetworkMetrics = {
    cpu_usage: 45.2,
    memory_usage: 62.8,
    network_latency: 23.5,
    active_connections: 15
  };

  // Simulate real-time updates
  const updateBlockchainData = () => {
    // Update blockchain status
    blockchainStatus = {
      ...blockchainStatus,
      total_transactions: blockchainStatus.total_transactions + Math.floor(Math.random() * 5) + 1,
      consensus_height: blockchainStatus.consensus_height + 1,
      transactions_per_second: Math.max(1000, blockchainStatus.transactions_per_second + (Math.random() - 0.5) * 100),
      last_updated: new Date().toISOString()
    };

    // Update network metrics
    networkMetrics = {
      cpu_usage: Math.max(0, Math.min(100, networkMetrics.cpu_usage + (Math.random() - 0.5) * 10)),
      memory_usage: Math.max(0, Math.min(100, networkMetrics.memory_usage + (Math.random() - 0.5) * 5)),
      network_latency: Math.max(0, networkMetrics.network_latency + (Math.random() - 0.5) * 20),
      active_connections: Math.max(0, networkMetrics.active_connections + Math.floor((Math.random() - 0.5) * 5))
    };

    // Broadcast updates to all connected clients
    io.emit('blockchain_update', {
      type: 'blockchain_update',
      payload: blockchainStatus
    });

    io.emit('network_metrics', {
      type: 'network_metrics',
      payload: networkMetrics
    });
  };

  // Simulate new transactions
  const generateNewTransaction = () => {
    const newTransaction: Transaction = {
      id: `tx_${Math.random().toString(36).substr(2, 9)}`,
      sender: `0x${Math.random().toString(16).substr(2, 8)}`,
      receiver: `0x${Math.random().toString(16).substr(2, 8)}`,
      amount: Math.floor(Math.random() * 1000) + 1,
      timestamp: Date.now(),
      status: Math.random() > 0.1 ? "confirmed" : "pending",
      quantum_score: Math.floor(Math.random() * 20) + 80,
      fee: Math.floor(Math.random() * 10) + 1
    };

    io.emit('new_transaction', {
      type: 'new_transaction',
      payload: newTransaction
    });
  };

  // Set up intervals for real-time updates
  const blockchainUpdateInterval = setInterval(updateBlockchainData, 3000);
  const transactionInterval = setInterval(generateNewTransaction, 8000);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    connectedClients.add(socket.id);

    // Send current status to newly connected client
    socket.emit('blockchain_update', {
      type: 'blockchain_update',
      payload: blockchainStatus
    });

    socket.emit('network_metrics', {
      type: 'network_metrics',
      payload: networkMetrics
    });

    // Handle client messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only to the client who sent the message
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

<<<<<<< HEAD
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
=======
<<<<<<< HEAD
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
=======
    // Handle blockchain control commands
    socket.on('blockchain_control', (command: { action: string; data?: any }) => {
      console.log('Blockchain control command:', command);
      
      switch (command.action) {
        case 'simulate_load':
          blockchainStatus.network_status = "degraded";
          blockchainStatus.quantum_resistance_score *= 0.8;
          blockchainStatus.transactions_per_second *= 0.5;
          break;
          
        case 'reset':
          blockchainStatus.network_status = "online";
          blockchainStatus.quantum_resistance_score = 0.95;
          blockchainStatus.transactions_per_second = 1250;
          break;
          
        case 'toggle_simulation':
          // Toggle simulation mode (handled by frontend)
          break;
      }

      // Broadcast updated status
      io.emit('blockchain_update', {
        type: 'blockchain_update',
        payload: blockchainStatus
      });
    });

    // Handle request for latest transactions
    socket.on('request_transactions', (limit: number = 10) => {
      const transactions: Transaction[] = Array.from({ length: limit }, (_, i) => ({
        id: `tx_${Math.random().toString(36).substr(2, 9)}`,
        sender: `0x${Math.random().toString(16).substr(2, 8)}`,
        receiver: `0x${Math.random().toString(16).substr(2, 8)}`,
        amount: Math.floor(Math.random() * 1000) + 1,
        timestamp: Date.now() - i * 60000,
        status: Math.random() > 0.1 ? "confirmed" : "pending",
        quantum_score: Math.floor(Math.random() * 20) + 80,
        fee: Math.floor(Math.random() * 10) + 1
      }));

      socket.emit('transactions_list', {
        type: 'transactions_list',
        payload: transactions
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      connectedClients.delete(socket.id);
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
    });

    // Send welcome message
    socket.emit('message', {
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
<<<<<<< HEAD
=======
=======
      text: 'Connected to KALDRIX Blockchain WebSocket!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });

    // Send connection info
    socket.emit('connection_info', {
      type: 'connection_info',
      payload: {
        connectedClients: connectedClients.size,
        serverTime: new Date().toISOString(),
        blockchainVersion: blockchainStatus.version
      }
    });
  });

  // Clean up intervals on server shutdown
  io.on('close', () => {
    clearInterval(blockchainUpdateInterval);
    clearInterval(transactionInterval);
  });

  console.log('WebSocket blockchain server initialized');
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
};