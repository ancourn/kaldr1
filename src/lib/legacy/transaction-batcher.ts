// Mock transaction batcher for testing
export default class TransactionBatcher {
  constructor(private config: any) {}
  
  async addTransaction(transaction: any): Promise<string> {
    return `batch_${Date.now()}`;
  }
  
  getQueueSize(): number {
    return 0;
  }
  
  getStats() {
    return {
      batchSize: this.config.maxSize,
      queueSize: 0
    };
  }
  
  async shutdown(): Promise<void> {
    // Mock shutdown
  }
  
  on(event: string, callback: Function) {
    // Mock event listener
  }
}