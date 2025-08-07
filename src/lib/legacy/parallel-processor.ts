// Mock parallel processor for testing
export default class ParallelProcessor {
  constructor(private maxWorkers: number) {}
  
  async submitJob(type: string, data: any, priority: number = 0): Promise<any> {
    return { id: `job_${Date.now()}`, status: 'completed', type, data };
  }
  
  getStats() {
    return {
      throughput: 1250,
      activeWorkers: this.maxWorkers,
      completedJobs: 100,
      totalJobs: 100
    };
  }
  
  async shutdown(): Promise<void> {
    // Mock shutdown
  }
  
  on(event: string, callback: Function) {
    // Mock event listener
  }
}