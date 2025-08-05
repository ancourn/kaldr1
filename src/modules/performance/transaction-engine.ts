import { EventEmitter } from 'events';

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: bigint;
  gasLimit: bigint;
  gasPrice: bigint;
  nonce: number;
  data?: string;
  signature: string;
  timestamp: number;
  priority: number;
}

export interface Block {
  hash: string;
  parentHash: string;
  number: number;
  timestamp: number;
  transactions: Transaction[];
  gasUsed: bigint;
  gasLimit: bigint;
  validator: string;
  signature: string;
}

export interface PerformanceMetrics {
  tps: number;
  latency: number;
  blockTime: number;
  successRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class HighPerformanceTransactionEngine extends EventEmitter {
  private transactionPool: Map<string, Transaction> = new Map();
  private pendingBlocks: Block[] = [];
  private processedBlocks: Block[] = [];
  private validatorSet: Set<string> = new Set();
  private isRunning = false;
  private blockInterval: number = 100; // 100ms block time for 10+ TPS
  private batchSize: number = 1000; // Process 1000 transactions per batch
  private maxPoolSize: number = 50000; // Maximum transactions in pool
  
  // Performance tracking
  private metrics: PerformanceMetrics = {
    tps: 0,
    latency: 0,
    blockTime: 0,
    successRate: 0,
    memoryUsage: 0,
    cpuUsage: 0
  };

  private transactionCount = 0;
  private blockCount = 0;
  private startTime = Date.now();
  private lastBlockTime = Date.now();

  constructor() {
    super();
    this.initializeEngine();
  }

  private initializeEngine() {
    // Initialize with some default validators
    this.validatorSet.add('validator1');
    this.validatorSet.add('validator2');
    this.validatorSet.add('validator3');
    
    console.log('🚀 High Performance Transaction Engine initialized');
    console.log(`📊 Target: 100K TPS with ${this.blockInterval}ms block time`);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Engine is already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    console.log('🔥 Starting High Performance Transaction Engine...');

    // Start block production
    this.startBlockProduction();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();

    this.emit('started');
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Engine is not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 Stopping High Performance Transaction Engine...');

    this.emit('stopped');
  }

  public async addTransaction(transaction: Transaction): Promise<boolean> {
    if (!this.isRunning) {
      console.log('⚠️ Engine is not running');
      return false;
    }

    // Check pool size
    if (this.transactionPool.size >= this.maxPoolSize) {
      console.log('⚠️ Transaction pool is full');
      return false;
    }

    // Validate transaction
    if (!this.validateTransaction(transaction)) {
      console.log('❌ Invalid transaction:', transaction.id);
      return false;
    }

    // Add to pool with priority
    this.transactionPool.set(transaction.id, transaction);
    this.transactionCount++;

    this.emit('transactionAdded', transaction);
    
    return true;
  }

  public async addTransactions(transactions: Transaction[]): Promise<number> {
    let addedCount = 0;
    
    for (const tx of transactions) {
      if (await this.addTransaction(tx)) {
        addedCount++;
      }
    }

    return addedCount;
  }

  private validateTransaction(transaction: Transaction): boolean {
    // Basic validation
    if (!transaction.id || !transaction.from || !transaction.to) {
      return false;
    }

    if (transaction.amount <= 0n) {
      return false;
    }

    if (transaction.gasLimit <= 0n || transaction.gasPrice <= 0n) {
      return false;
    }

    if (!transaction.signature) {
      return false;
    }

    // Check for duplicate
    if (this.transactionPool.has(transaction.id)) {
      return false;
    }

    return true;
  }

  private startBlockProduction(): void {
    if (!this.isRunning) return;

    const produceBlock = () => {
      if (!this.isRunning) return;

      const block = this.createBlock();
      if (block.transactions.length > 0) {
        this.processBlock(block);
      }

      // Schedule next block
      setTimeout(produceBlock, this.blockInterval);
    };

    // Start producing blocks
    produceBlock();
  }

  private createBlock(): Block {
    const transactions = this.selectTransactionsForBlock();
    const lastBlock = this.processedBlocks[this.processedBlocks.length - 1];
    
    const block: Block = {
      hash: this.generateBlockHash(),
      parentHash: lastBlock ? lastBlock.hash : 'genesis',
      number: this.blockCount + 1,
      timestamp: Date.now(),
      transactions,
      gasUsed: transactions.reduce((sum, tx) => sum + tx.gasLimit, 0n),
      gasLimit: BigInt(this.batchSize * 21000), // Average gas per transaction
      validator: this.selectValidator(),
      signature: this.generateBlockSignature()
    };

    return block;
  }

  private selectTransactionsForBlock(): Transaction[] {
    const transactions = Array.from(this.transactionPool.values());
    
    // Sort by priority (gas price * gas limit) and timestamp
    transactions.sort((a, b) => {
      const priorityA = a.priority * Number(a.gasPrice * a.gasLimit);
      const priorityB = b.priority * Number(b.gasPrice * b.gasLimit);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      return a.timestamp - b.timestamp; // Earlier transactions first
    });

    // Select top transactions up to batch size
    const selected = transactions.slice(0, this.batchSize);
    
    // Remove selected transactions from pool
    selected.forEach(tx => this.transactionPool.delete(tx.id));
    
    return selected;
  }

  private selectValidator(): string {
    const validators = Array.from(this.validatorSet);
    return validators[Math.floor(Math.random() * validators.length)];
  }

  private generateBlockHash(): string {
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  private generateBlockSignature(): string {
    return '0x' + Math.random().toString(16).substr(2, 128);
  }

  private processBlock(block: Block): void {
    const startTime = Date.now();
    
    // Process transactions in parallel
    const processingPromises = block.transactions.map(async (tx) => {
      return this.processTransaction(tx);
    });

    Promise.all(processingPromises).then(() => {
      const processingTime = Date.now() - startTime;
      
      // Add to processed blocks
      this.processedBlocks.push(block);
      this.blockCount++;
      
      // Update metrics
      this.updateMetrics(block, processingTime);
      
      this.emit('blockProcessed', block);
      
      console.log(`📦 Block #${block.number} processed with ${block.transactions.length} transactions in ${processingTime}ms`);
    });
  }

  private async processTransaction(transaction: Transaction): Promise<void> {
    // Simulate transaction processing
    // In a real implementation, this would update state, execute smart contracts, etc.
    
    return new Promise((resolve) => {
      // Simulate processing time (microseconds for high performance)
      setTimeout(resolve, Math.random() * 100); // 0-100 microseconds
    });
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.calculateMetrics();
      this.emit('metricsUpdated', this.metrics);
    }, 1000); // Update metrics every second
  }

  private updateMetrics(block: Block, processingTime: number): void {
    const now = Date.now();
    const timeSinceLastBlock = now - this.lastBlockTime;
    
    // Calculate TPS
    const txCount = block.transactions.length;
    const currentTps = (txCount / timeSinceLastBlock) * 1000;
    
    // Update metrics with exponential moving average
    const alpha = 0.1; // Smoothing factor
    this.metrics.tps = alpha * currentTps + (1 - alpha) * this.metrics.tps;
    this.metrics.latency = processingTime;
    this.metrics.blockTime = timeSinceLastBlock;
    this.metrics.successRate = 100; // Assuming all transactions succeed for now
    
    // Update memory usage (simplified)
    this.metrics.memoryUsage = process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0;
    
    this.lastBlockTime = now;
  }

  private calculateMetrics(): void {
    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000; // seconds
    
    if (elapsed > 0) {
      this.metrics.tps = this.transactionCount / elapsed;
      this.metrics.blockTime = elapsed > 0 ? (elapsed * 1000) / this.blockCount : 0;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getTransactionPoolSize(): number {
    return this.transactionPool.size;
  }

  public getProcessedBlockCount(): number {
    return this.blockCount;
  }

  public getTransactionCount(): number {
    return this.transactionCount;
  }

  public getStatus(): string {
    return this.isRunning ? 'running' : 'stopped';
  }

  public addValidator(validator: string): void {
    this.validatorSet.add(validator);
    console.log(`➕ Added validator: ${validator}`);
  }

  public removeValidator(validator: string): void {
    this.validatorSet.delete(validator);
    console.log(`➖ Removed validator: ${validator}`);
  }

  public getValidators(): string[] {
    return Array.from(this.validatorSet);
  }

  public configurePerformance(options: {
    blockInterval?: number;
    batchSize?: number;
    maxPoolSize?: number;
  }): void {
    if (options.blockInterval) {
      this.blockInterval = options.blockInterval;
      console.log(`⚙️ Block interval updated to: ${this.blockInterval}ms`);
    }
    
    if (options.batchSize) {
      this.batchSize = options.batchSize;
      console.log(`⚙️ Batch size updated to: ${this.batchSize}`);
    }
    
    if (options.maxPoolSize) {
      this.maxPoolSize = options.maxPoolSize;
      console.log(`⚙️ Max pool size updated to: ${this.maxPoolSize}`);
    }
  }
}