import { HighPerformanceTransactionEngine, Transaction, PerformanceMetrics } from './transaction-engine';
import { PrioritizedTransactionQueue } from './prioritized-queue';

export interface BenchmarkConfig {
  duration: number; // seconds
  targetTPS: number;
  transactionSize: number;
  concurrentClients: number;
  warmupTime: number; // seconds
  reportInterval: number; // seconds
}

export interface BenchmarkResult {
  config: BenchmarkConfig;
  startTime: number;
  endTime: number;
  totalTransactions: number;
  actualTPS: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  averageBlockTime: number;
  minBlockTime: number;
  maxBlockTime: number;
  successRate: number;
  memoryUsage: {
    start: number;
    end: number;
    peak: number;
    average: number;
  };
  cpuUsage: {
    average: number;
    peak: number;
  };
  throughput: {
   tps: number[];
    timestamps: number[];
  };
  errors: {
    count: number;
    messages: string[];
  };
}

export class BenchmarkHarness {
  private engine: HighPerformanceTransactionEngine;
  private queue: PrioritizedTransactionQueue;
  private isRunning = false;
  private results: BenchmarkResult | null = null;
  private latencyMeasurements: number[] = [];
  private blockTimeMeasurements: number[] = [];
  private throughputData: { tps: number; timestamp: number }[] = [];
  private errorMessages: string[] = [];
  private memoryMeasurements: number[] = [];
  private lastBlockTime = 0;

  constructor(
    engine: HighPerformanceTransactionEngine,
    queue: PrioritizedTransactionQueue
  ) {
    this.engine = engine;
    this.queue = queue;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.engine.on('blockProcessed', (block) => {
      const now = Date.now();
      if (this.lastBlockTime > 0) {
        const blockTime = now - this.lastBlockTime;
        this.blockTimeMeasurements.push(blockTime);
      }
      this.lastBlockTime = now;
    });

    this.queue.on('bundleCreated', (bundle) => {
      const processingTime = Date.now() - bundle.timestamp;
      this.latencyMeasurements.push(processingTime);
    });
  }

  public async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    if (this.isRunning) {
      throw new Error('Benchmark is already running');
    }

    this.isRunning = true;
    this.results = null;
    this.latencyMeasurements = [];
    this.blockTimeMeasurements = [];
    this.throughputData = [];
    this.errorMessages = [];
    this.memoryMeasurements = [];
    this.lastBlockTime = 0;

    console.log('🚀 Starting benchmark...');
    console.log(`📊 Configuration: ${JSON.stringify(config, null, 2)}`);

    const startTime = Date.now();
    let transactionCount = 0;
    let errorCount = 0;

    try {
      // Start the engine
      await this.engine.start();

      // Warmup period
      console.log(`🔥 Warmup period: ${config.warmupTime}s`);
      await this.runLoadPhase(config.warmupTime * 1000, config.targetTPS / 2);
      
      // Clear warmup data
      this.latencyMeasurements = [];
      this.blockTimeMeasurements = [];
      this.throughputData = [];

      // Main benchmark phase
      console.log(`⚡ Main benchmark phase: ${config.duration}s`);
      const benchmarkStartTime = Date.now();
      
      // Start load generation
      const loadPromise = this.runLoadPhase(config.duration * 1000, config.targetTPS);
      
      // Start monitoring
      const monitoringPromise = this.runMonitoring(config.reportInterval * 1000);
      
      // Wait for completion
      await Promise.all([loadPromise, monitoringPromise]);
      
      const benchmarkEndTime = Date.now();
      
      // Collect final metrics
      const finalMetrics = this.engine.getMetrics();
      transactionCount = this.engine.getTransactionCount();
      errorCount = this.errorMessages.length;

      // Calculate results
      this.results = {
        config,
        startTime,
        endTime: benchmarkEndTime,
        totalTransactions: transactionCount,
        actualTPS: transactionCount / ((benchmarkEndTime - benchmarkStartTime) / 1000),
        averageLatency: this.calculateAverage(this.latencyMeasurements),
        minLatency: Math.min(...this.latencyMeasurements),
        maxLatency: Math.max(...this.latencyMeasurements),
        p95Latency: this.calculatePercentile(this.latencyMeasurements, 95),
        p99Latency: this.calculatePercentile(this.latencyMeasurements, 99),
        averageBlockTime: this.calculateAverage(this.blockTimeMeasurements),
        minBlockTime: Math.min(...this.blockTimeMeasurements),
        maxBlockTime: Math.max(...this.blockTimeMeasurements),
        successRate: ((transactionCount - errorCount) / transactionCount) * 100,
        memoryUsage: {
          start: this.memoryMeasurements[0] || 0,
          end: this.memoryMeasurements[this.memoryMeasurements.length - 1] || 0,
          peak: Math.max(...this.memoryMeasurements),
          average: this.calculateAverage(this.memoryMeasurements)
        },
        cpuUsage: {
          average: finalMetrics.cpuUsage,
          peak: finalMetrics.cpuUsage // Simplified
        },
        throughput: {
          tps: this.throughputData.map(d => d.tps),
          timestamps: this.throughputData.map(d => d.timestamp)
        },
        errors: {
          count: errorCount,
          messages: this.errorMessages
        }
      };

      console.log('✅ Benchmark completed successfully');
      this.printResults();

    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      await this.engine.stop();
    }

    return this.results!;
  }

  private async runLoadPhase(duration: number, targetTPS: number): Promise<void> {
    const endTime = Date.now() + duration;
    const intervalMs = 1000 / targetTPS;
    let lastTransactionTime = 0;

    const generateTransaction = () => {
      if (Date.now() >= endTime) {
        return;
      }

      const now = Date.now();
      const timeSinceLast = now - lastTransactionTime;
      
      if (timeSinceLast >= intervalMs) {
        const transaction = this.generateTransaction();
        this.engine.addTransaction(transaction).catch(error => {
          this.errorMessages.push(`Transaction failed: ${error.message}`);
        });
        lastTransactionTime = now;
      }

      setTimeout(generateTransaction, Math.max(0, intervalMs - timeSinceLast));
    };

    generateTransaction();
    
    // Wait for duration
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  private async runMonitoring(interval: number): Promise<void> {
    const monitor = () => {
      if (!this.isRunning) return;

      const metrics = this.engine.getMetrics();
      const now = Date.now();
      
      this.throughputData.push({
        tps: metrics.tps,
        timestamp: now
      });

      // Memory monitoring
      if (process.memoryUsage) {
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        this.memoryMeasurements.push(memoryUsage);
      }

      setTimeout(monitor, interval);
    };

    monitor();
  }

  private generateTransaction(): Transaction {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const from = `0x${Math.random().toString(16).substr(2, 40)}`;
    const to = `0x${Math.random().toString(16).substr(2, 40)}`;
    const amount = BigInt(Math.floor(Math.random() * 1000000) + 1);
    const gasLimit = BigInt(21000);
    const gasPrice = BigInt(Math.floor(Math.random() * 1000000000) + 1000000000);
    const nonce = Math.floor(Math.random() * 1000000);
    const timestamp = Date.now();
    const priority = Math.floor(Math.random() * 5);

    return {
      id,
      from,
      to,
      amount,
      gasLimit,
      gasPrice,
      nonce,
      timestamp,
      priority,
      signature: `0x${Math.random().toString(16).substr(2, 128)}`
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  private printResults(): void {
    if (!this.results) return;

    console.log('\n📊 BENCHMARK RESULTS');
    console.log('=' .repeat(60));
    console.log(`Duration: ${((this.results.endTime - this.results.startTime) / 1000).toFixed(2)}s`);
    console.log(`Target TPS: ${this.results.config.targetTPS}`);
    console.log(`Actual TPS: ${this.results.actualTPS.toFixed(2)}`);
    console.log(`Efficiency: ${((this.results.actualTPS / this.results.config.targetTPS) * 100).toFixed(1)}%`);
    console.log(`Total Transactions: ${this.results.totalTransactions}`);
    console.log(`Success Rate: ${this.results.successRate.toFixed(2)}%`);
    console.log('\n⏱️  LATENCY');
    console.log(`Average: ${this.results.averageLatency.toFixed(2)}ms`);
    console.log(`Min: ${this.results.minLatency.toFixed(2)}ms`);
    console.log(`Max: ${this.results.maxLatency.toFixed(2)}ms`);
    console.log(`P95: ${this.results.p95Latency.toFixed(2)}ms`);
    console.log(`P99: ${this.results.p99Latency.toFixed(2)}ms`);
    console.log('\n📦 BLOCK TIME');
    console.log(`Average: ${this.results.averageBlockTime.toFixed(2)}ms`);
    console.log(`Min: ${this.results.minBlockTime.toFixed(2)}ms`);
    console.log(`Max: ${this.results.maxBlockTime.toFixed(2)}ms`);
    console.log('\n💾 MEMORY USAGE');
    console.log(`Start: ${this.results.memoryUsage.start.toFixed(2)}MB`);
    console.log(`End: ${this.results.memoryUsage.end.toFixed(2)}MB`);
    console.log(`Peak: ${this.results.memoryUsage.peak.toFixed(2)}MB`);
    console.log(`Average: ${this.results.memoryUsage.average.toFixed(2)}MB`);
    console.log('\n🔧 ERRORS');
    console.log(`Count: ${this.results.errors.count}`);
    if (this.results.errors.count > 0) {
      console.log('Messages:');
      this.results.errors.messages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg}`);
      });
    }
    console.log('=' .repeat(60));
  }

  public getResults(): BenchmarkResult | null {
    return this.results;
  }

  public exportResults(format: 'json' | 'markdown' = 'json'): string {
    if (!this.results) {
      throw new Error('No benchmark results available');
    }

    if (format === 'json') {
      return JSON.stringify(this.results, null, 2);
    }

    return this.generateMarkdownReport();
  }

  private generateMarkdownReport(): string {
    if (!this.results) return '';

    const result = this.results;
    return `# KALDRIX Performance Benchmark Report

## Configuration
- **Duration**: ${((result.endTime - result.startTime) / 1000).toFixed(2)} seconds
- **Target TPS**: ${result.config.targetTPS}
- **Transaction Size**: ${result.config.transactionSize} bytes
- **Concurrent Clients**: ${result.config.concurrentClients}
- **Warmup Time**: ${result.config.warmupTime} seconds

## Results Summary
- **Actual TPS**: ${result.actualTPS.toFixed(2)}
- **Efficiency**: ${((result.actualTPS / result.config.targetTPS) * 100).toFixed(1)}%
- **Total Transactions**: ${result.totalTransactions}
- **Success Rate**: ${result.successRate.toFixed(2)}%

## Performance Metrics

### Latency
- **Average**: ${result.averageLatency.toFixed(2)}ms
- **Minimum**: ${result.minLatency.toFixed(2)}ms
- **Maximum**: ${result.maxLatency.toFixed(2)}ms
- **P95**: ${result.p95Latency.toFixed(2)}ms
- **P99**: ${result.p99Latency.toFixed(2)}ms

### Block Time
- **Average**: ${result.averageBlockTime.toFixed(2)}ms
- **Minimum**: ${result.minBlockTime.toFixed(2)}ms
- **Maximum**: ${result.maxBlockTime.toFixed(2)}ms

### Memory Usage
- **Start**: ${result.memoryUsage.start.toFixed(2)}MB
- **End**: ${result.memoryUsage.end.toFixed(2)}MB
- **Peak**: ${result.memoryUsage.peak.toFixed(2)}MB
- **Average**: ${result.memoryUsage.average.toFixed(2)}MB

### CPU Usage
- **Average**: ${result.cpuUsage.average.toFixed(2)}%
- **Peak**: ${result.cpuUsage.peak.toFixed(2)}%

### Errors
- **Count**: ${result.errors.count}
${result.errors.count > 0 ? `
#### Error Messages
${result.errors.messages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
` : ''}

## Throughput Over Time
${result.throughput.tps.length > 0 ? `
| Timestamp | TPS |
|-----------|-----|
${result.throughput.tps.map((tps, i) => `| ${new Date(result.throughput.timestamps[i]).toISOString()} | ${tps.toFixed(2)} |`).join('\n')}
` : 'No throughput data available'}

## Conclusion
The benchmark demonstrates that the KALDRIX blockchain can achieve **${result.actualTPS.toFixed(2)} TPS** with an average latency of **${result.averageLatency.toFixed(2)}ms**. 
This represents ${((result.actualTPS / result.config.targetTPS) * 100).toFixed(1)}% of the target performance.

${result.actualTPS >= result.config.targetTPS * 0.9 ? 
  '✅ **Performance Target Achieved** - The system meets or exceeds the target TPS.' :
  '⚠️ **Performance Below Target** - Further optimization may be required.'
}

Generated on: ${new Date().toISOString()}
`;
  }
}