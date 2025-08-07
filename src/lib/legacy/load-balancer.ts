// Mock load balancer for testing
export default class LoadBalancer {
  constructor(private config: any) {}
  
  addNode(node: any): void {
    // Mock add node
  }
  
  removeNode(nodeId: string): void {
    // Mock remove node
  }
  
  getNodeStatus(nodeId: string): any {
    return {
      id: nodeId,
      quantumReady: true
    };
  }
  
  getStats() {
    return {
      healthyNodes: this.config.maxWorkers || 4
    };
  }
  
  async shutdown(): Promise<void> {
    // Mock shutdown
  }
  
  on(event: string, callback: Function) {
    // Mock event listener
  }
}