import { Transaction } from './transaction-engine';

export interface QueueConfig {
  maxSize: number;
  priorityLevels: number;
  baseFee: bigint;
  feeAdjustmentFactor: number;
  bundleSize: number;
  preConfirmationTimeout: number;
}

export interface TransactionBundle {
  id: string;
  transactions: Transaction[];
  totalFee: bigint;
  estimatedGas: bigint;
  preConfirmed: boolean;
  timestamp: number;
  validatorSignatures: string[];
}

export class PrioritizedTransactionQueue {
  private queues: Map<number, Transaction[]> = new Map();
  private config: QueueConfig;
  private bundleCounter = 0;
  private preConfirmationCallbacks: Map<string, (bundle: TransactionBundle) => void> = new Map();
  private feeHistory: Array<{ timestamp: number; fee: bigint }> = [];
  private maxFeeHistorySize = 100;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 50000,
      priorityLevels: config.priorityLevels || 5,
      baseFee: config.baseFee || BigInt(1000000000), // 1 gwei
      feeAdjustmentFactor: config.feeAdjustmentFactor || 0.1,
      bundleSize: config.bundleSize || 100,
      preConfirmationTimeout: config.preConfirmationTimeout || 5000
    };

    this.initializeQueues();
    this.startFeeAdjustment();
    this.startBundleProcessing();
  }

  private initializeQueues(): void {
    for (let i = 0; i < this.config.priorityLevels; i++) {
      this.queues.set(i, []);
    }
  }

  public addTransaction(transaction: Transaction): boolean {
    if (this.getTotalSize() >= this.config.maxSize) {
      console.log('⚠️ Transaction queue is full');
      return false;
    }

    const priority = this.calculatePriority(transaction);
    const queue = this.queues.get(priority);
    
    if (!queue) {
      console.log('❌ Invalid priority level:', priority);
      return false;
    }

    // Insert in sorted order (by gas price)
    const insertIndex = this.findInsertIndex(queue, transaction);
    queue.splice(insertIndex, 0, transaction);

    console.log(`📝 Transaction ${transaction.id} added to priority ${priority} queue`);
    return true;
  }

  public addTransactions(transactions: Transaction[]): number {
    let addedCount = 0;
    
    for (const tx of transactions) {
      if (this.addTransaction(tx)) {
        addedCount++;
      }
    }

    return addedCount;
  }

  private calculatePriority(transaction: Transaction): number {
    const gasPrice = transaction.gasPrice;
    const currentBaseFee = this.getCurrentBaseFee();
    
    // Calculate priority based on gas price premium over base fee
    const premium = gasPrice - currentBaseFee;
    const premiumRatio = Number(premium) / Number(currentBaseFee);
    
    // Map to priority levels (0 = highest priority)
    let priority = Math.floor(premiumRatio * 2);
    
    // Clamp to valid range
    priority = Math.max(0, Math.min(this.config.priorityLevels - 1, priority));
    
    // Consider transaction size and age
    if (transaction.data && transaction.data.length > 1000) {
      priority = Math.min(this.config.priorityLevels - 1, priority + 1);
    }
    
    return priority;
  }

  private findInsertIndex(queue: Transaction[], transaction: Transaction): number {
    let left = 0;
    let right = queue.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (queue[mid].gasPrice >= transaction.gasPrice) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    return left;
  }

  public getNextBundle(): TransactionBundle | null {
    const transactions = this.selectTransactionsForBundle();
    
    if (transactions.length === 0) {
      return null;
    }

    const bundle: TransactionBundle = {
      id: `bundle_${this.bundleCounter++}`,
      transactions,
      totalFee: transactions.reduce((sum, tx) => sum + (tx.gasPrice * tx.gasLimit), 0n),
      estimatedGas: transactions.reduce((sum, tx) => sum + tx.gasLimit, 0n),
      preConfirmed: false,
      timestamp: Date.now(),
      validatorSignatures: []
    };

    // Remove transactions from queues
    this.removeTransactionsFromQueues(transactions);

    // Request pre-confirmation
    this.requestPreConfirmation(bundle);

    return bundle;
  }

  private selectTransactionsForBundle(): Transaction[] {
    const selected: Transaction[] = [];
    
    // Try to fill bundle from highest priority first
    for (let priority = 0; priority < this.config.priorityLevels; priority++) {
      const queue = this.queues.get(priority);
      if (!queue) continue;
      
      const remaining = this.config.bundleSize - selected.length;
      if (remaining <= 0) break;
      
      const toTake = Math.min(remaining, queue.length);
      selected.push(...queue.slice(0, toTake));
    }
    
    return selected;
  }

  private removeTransactionsFromQueues(transactions: Transaction[]): void {
    const txIds = new Set(transactions.map(tx => tx.id));
    
    for (const [priority, queue] of this.queues) {
      this.queues.set(priority, queue.filter(tx => !txIds.has(tx.id)));
    }
  }

  private requestPreConfirmation(bundle: TransactionBundle): void {
    // Simulate pre-confirmation process
    setTimeout(() => {
      bundle.preConfirmed = true;
      bundle.validatorSignatures = this.generateValidatorSignatures();
      
      console.log(`✅ Bundle ${bundle.id} pre-confirmed with ${bundle.validatorSignatures.length} signatures`);
      
      // Notify callbacks
      const callback = this.preConfirmationCallbacks.get(bundle.id);
      if (callback) {
        callback(bundle);
        this.preConfirmationCallbacks.delete(bundle.id);
      }
    }, Math.random() * this.config.preConfirmationTimeout);
  }

  private generateValidatorSignatures(): string[] {
    const signatureCount = Math.floor(Math.random() * 3) + 1; // 1-3 signatures
    const signatures: string[] = [];
    
    for (let i = 0; i < signatureCount; i++) {
      signatures.push('0x' + Math.random().toString(16).substr(2, 128));
    }
    
    return signatures;
  }

  public waitForPreConfirmation(bundleId: string): Promise<TransactionBundle> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Pre-confirmation timeout for bundle ${bundleId}`));
      }, this.config.preConfirmationTimeout * 2);
      
      const callback = (bundle: TransactionBundle) => {
        clearTimeout(timeout);
        resolve(bundle);
      };
      
      this.preConfirmationCallbacks.set(bundleId, callback);
    });
  }

  private startFeeAdjustment(): void {
    setInterval(() => {
      this.adjustFees();
    }, 10000); // Adjust fees every 10 seconds
  }

  private adjustFees(): void {
    const now = Date.now();
    const totalSize = this.getTotalSize();
    
    // Calculate target utilization (80%)
    const targetUtilization = this.config.maxSize * 0.8;
    const utilizationRatio = totalSize / targetUtilization;
    
    // Adjust base fee based on utilization
    let adjustmentFactor = 1.0;
    
    if (utilizationRatio > 1.2) {
      // High utilization - increase fees
      adjustmentFactor = 1.0 + this.config.feeAdjustmentFactor;
    } else if (utilizationRatio < 0.8) {
      // Low utilization - decrease fees
      adjustmentFactor = 1.0 - this.config.feeAdjustmentFactor;
    }
    
    // Apply adjustment
    this.config.baseFee = BigInt(Math.floor(Number(this.config.baseFee) * adjustmentFactor));
    
    // Record fee history
    this.feeHistory.push({
      timestamp: now,
      fee: this.config.baseFee
    });
    
    // Limit history size
    if (this.feeHistory.length > this.maxFeeHistorySize) {
      this.feeHistory.shift();
    }
    
    console.log(`💰 Base fee adjusted to: ${this.config.baseFee} (utilization: ${(utilizationRatio * 100).toFixed(1)}%)`);
  }

  private startBundleProcessing(): void {
    setInterval(() => {
      const bundle = this.getNextBundle();
      if (bundle) {
        this.emit('bundleCreated', bundle);
      }
    }, 100); // Process bundles every 100ms
  }

  public getCurrentBaseFee(): bigint {
    return this.config.baseFee;
  }

  public getEstimatedFee(priority: number = 0): bigint {
    const priorityMultiplier = 1 + (priority * 0.2); // 20% increase per priority level
    return this.config.baseFee * BigInt(Math.floor(priorityMultiplier * 100)) / BigInt(100);
  }

  public getQueueStatus(): {
    totalSize: number;
    maxSize: number;
    utilization: number;
    queues: Array<{ priority: number; size: number }>;
    currentBaseFee: bigint;
  } {
    const totalSize = this.getTotalSize();
    const utilization = totalSize / this.config.maxSize;
    
    const queues = [];
    for (let i = 0; i < this.config.priorityLevels; i++) {
      const queue = this.queues.get(i);
      queues.push({
        priority: i,
        size: queue ? queue.length : 0
      });
    }
    
    return {
      totalSize,
      maxSize: this.config.maxSize,
      utilization,
      queues,
      currentBaseFee: this.config.baseFee
    };
  }

  public getFeeHistory(): Array<{ timestamp: number; fee: bigint }> {
    return [...this.feeHistory];
  }

  private getTotalSize(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  public configure(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Transaction queue configuration updated');
  }

  public clear(): void {
    this.queues.clear();
    this.initializeQueues();
    this.bundleCounter = 0;
    this.preConfirmationCallbacks.clear();
    this.feeHistory = [];
    console.log('🧹 Transaction queue cleared');
  }

  private emit(event: string, data?: any): void {
    // Simple event emitter implementation
    process.nextTick(() => {
      if (this.listeners && this.listeners[event]) {
        this.listeners[event].forEach((callback: (data?: any) => void) => callback(data));
      }
    });
  }

  private listeners: { [event: string]: ((data?: any) => void)[] } = {};

  public on(event: string, callback: (data?: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
}