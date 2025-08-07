/**
 * KALDRIX Advanced Stress Testing Module
 * 
 * Comprehensive stress testing for DAG engine with bottleneck identification
 * and performance analysis capabilities.
 */

import { DAGBlockEngine } from './dag-engine';
import type { Transaction, PerformanceSnapshot } from './types';

export interface StressTestConfig {
  targetTPS: number;
  duration: number; // in seconds
  transactionSize: 'small' | 'medium' | 'large' | 'mixed';
  burstMode: boolean;
  memoryMonitoring: boolean;
  latencyTracking: boolean;
  extendedLogging: boolean;
  maxMemoryMB?: number;
  cpuThreshold?: number;
}

export interface StressTestResults {
  testId: string;
  config: StressTestConfig;
  startTime: number;
  endTime: number;
  actualTPS: number;
  peakTPS: number;
  averageLatency: number;
  peakLatency: number;
  memoryLeakDetected: boolean;
  memoryGrowthRate: number; // MB per hour
  bottlenecks: BottleneckReport[];
  performanceSnapshots: PerformanceSnapshot[];
  errorRate: number;
  successRate: number;
  dagNodeCount: number;
  confirmationRate: number;
  degradationPoints: DegradationPoint[];
}

export interface BottleneckReport {
  type: 'memory' | 'cpu' | 'network' | 'consensus' | 'validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  metrics: Record<string, number>;
  recommendation: string;
}

export interface DegradationPoint {
  timestamp: number;
  tps: number;
  latency: number;
  memoryUsage: number;
  cpuUsage: number;
  description: string;
}

export class StressTestManager {
  private engine: DAGBlockEngine;
  private isRunning = false;
  private currentTest: StressTestResults | null = null;
  private snapshots: PerformanceSnapshot[] = [];
  private degradationPoints: DegradationPoint[] = [];
  private bottlenecks: BottleneckReport[] = [];
  private memoryBaseline = 0;
  private lastMemoryCheck = 0;

  constructor(engine: DAGBlockEngine) {
    this.engine = engine;
  }

  /**
   * Run comprehensive stress test
   */
  async runStressTest(config: StressTestConfig): Promise<StressTestResults> {
    if (this.isRunning) {
      throw new Error('Stress test already running');
    }

    this.isRunning = true;
    const testId = `stress_${Date.now()}_${config.targetTPS}tps`;
    const startTime = Date.now();

    console.log(`🚀 Starting stress test: ${testId}`);
    console.log(`📊 Target: ${config.targetTPS} TPS for ${config.duration}s`);
    console.log(`📦 Transaction size: ${config.transactionSize}`);

    // Initialize test
    this.currentTest = {
      testId,
      config,
      startTime,
      endTime: 0,
      actualTPS: 0,
      peakTPS: 0,
      averageLatency: 0,
      peakLatency: 0,
      memoryLeakDetected: false,
      memoryGrowthRate: 0,
      bottlenecks: [],
      performanceSnapshots: [],
      errorRate: 0,
      successRate: 100,
      dagNodeCount: 0,
      confirmationRate: 100,
      degradationPoints: []
    };

    // Set up monitoring
    this.setupMonitoring(config);

    try {
      // Run the stress test
      await this.executeStressTest(config);
      
      // Analyze results
      const results = await this.analyzeResults();
      
      console.log(`✅ Stress test completed: ${testId}`);
      console.log(`📈 Actual TPS: ${results.actualTPS.toFixed(2)}`);
      console.log(`🚨 Bottlenecks found: ${results.bottlenecks.length}`);
      console.log(`💾 Memory leak detected: ${results.memoryLeakDetected}`);
      
      return results;
    } catch (error) {
      console.error('❌ Stress test failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.cleanup();
    }
  }

  private setupMonitoring(config: StressTestConfig): void {
    if (config.memoryMonitoring) {
      this.memoryBaseline = process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0;
      this.lastMemoryCheck = Date.now();
    }

    // Set up performance snapshot interval
    const snapshotInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(snapshotInterval);
        return;
      }

      const snapshot = this.takePerformanceSnapshot();
      this.snapshots.push(snapshot);
      
      // Check for degradation
      this.checkForDegradation(snapshot, config);
      
      // Check for bottlenecks
      this.identifyBottlenecks(snapshot, config);
    }, 1000); // Take snapshot every second

    // Extended logging
    if (config.extendedLogging) {
      console.log(`📊 Extended logging enabled for stress test`);
    }
  }

  private async executeStressTest(config: StressTestConfig): Promise<void> {
    const endTime = Date.now() + (config.duration * 1000);
    let transactionCount = 0;
    let errorCount = 0;
    const latencyMeasurements: number[] = [];

    const generateTransaction = (): Transaction => {
      const size = this.getTransactionSize(config.transactionSize);
      return {
        id: `stress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        amount: BigInt(Math.floor(Math.random() * 1000000000)),
        gasLimit: BigInt(size.gasLimit),
        gasPrice: BigInt(size.gasPrice),
        nonce: Math.floor(Math.random() * 1000000),
        data: size.data,
        signature: '0x' + Math.random().toString(16).substr(2, 128),
        timestamp: Date.now(),
        priority: Math.floor(Math.random() * 5) + 1,
        quantumSignature: Math.random() > 0.7 ? '0x' + Math.random().toString(16).substr(2, 128) : undefined
      };
    };

    const sendTransactions = async (count: number): Promise<void> => {
      const transactions: Transaction[] = [];
      const sendTime = Date.now();
      
      for (let i = 0; i < count; i++) {
        transactions.push(generateTransaction());
      }

      try {
        const addedCount = await this.engine.addTransactions(transactions);
        transactionCount += addedCount;
        errorCount += (count - addedCount);
        
        // Measure latency
        const latency = Date.now() - sendTime;
        latencyMeasurements.push(latency);
        
        if (config.extendedLogging && transactionCount % 10000 === 0) {
          console.log(`📦 Sent ${transactionCount} transactions, ${errorCount} errors`);
        }
      } catch (error) {
        errorCount += count;
        if (config.extendedLogging) {
          console.error('❌ Transaction batch failed:', error);
        }
      }
    };

    // Calculate transactions per batch based on target TPS
    const transactionsPerSecond = config.targetTPS;
    const batchInterval = 100; // Send batches every 100ms
    const transactionsPerBatch = Math.floor(transactionsPerSecond * (batchInterval / 1000));

    console.log(`📊 Sending ${transactionsPerBatch} transactions every ${batchInterval}ms`);

    const batchIntervalId = setInterval(async () => {
      if (Date.now() >= endTime || !this.isRunning) {
        clearInterval(batchIntervalId);
        return;
      }

      // Burst mode handling
      let batchCount = transactionsPerBatch;
      if (config.burstMode && Math.random() > 0.7) {
        // Burst: send 2-5x normal load
        batchCount = Math.floor(transactionsPerBatch * (2 + Math.random() * 3));
      }

      await sendTransactions(batchCount);
    }, batchInterval);

    // Wait for test completion
    await new Promise(resolve => setTimeout(resolve, config.duration * 1000));
    
    // Clean up interval
    clearInterval(batchIntervalId);

    // Update current test with final metrics
    if (this.currentTest) {
      this.currentTest.actualTPS = transactionCount / config.duration;
      this.currentTest.peakTPS = Math.max(...this.snapshots.map(s => s.tps));
      this.currentTest.averageLatency = latencyMeasurements.reduce((a, b) => a + b, 0) / latencyMeasurements.length;
      this.currentTest.peakLatency = Math.max(...latencyMeasurements);
      this.currentTest.errorRate = (errorCount / transactionCount) * 100;
      this.currentTest.successRate = 100 - this.currentTest.errorRate;
      this.currentTest.performanceSnapshots = [...this.snapshots];
      this.currentTest.degradationPoints = [...this.degradationPoints];
      this.currentTest.bottlenecks = [...this.bottlenecks];
    }
  }

  private getTransactionSize(size: string): { gasLimit: number; gasPrice: number; data?: string } {
    switch (size) {
      case 'small':
        return { gasLimit: 21000, gasPrice: 1000000000 };
      case 'medium':
        return { gasLimit: 100000, gasPrice: 2000000000, data: '0x' + '00'.repeat(100) };
      case 'large':
        return { gasLimit: 500000, gasPrice: 5000000000, data: '0x' + '00'.repeat(1000) };
      case 'mixed':
        const sizes = ['small', 'medium', 'large'];
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        return this.getTransactionSize(randomSize);
      default:
        return { gasLimit: 21000, gasPrice: 1000000000 };
    }
  }

  private takePerformanceSnapshot(): PerformanceSnapshot {
    const metrics = this.engine.getMetrics();
    const memoryUsage = process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0;
    
    return {
      timestamp: Date.now(),
      tps: metrics.tps,
      latency: metrics.latency,
      memoryUsage,
      cpuUsage: metrics.cpuUsage,
      nodeCount: metrics.nodeCount,
      bundleCount: this.engine.getBundleCount(),
      confirmationRate: metrics.confirmationRate
    };
  }

  private checkForDegradation(snapshot: PerformanceSnapshot, config: StressTestConfig): void {
    if (this.snapshots.length < 5) return; // Need baseline

    const recent = this.snapshots.slice(-5);
    const avgTPS = recent.reduce((sum, s) => sum + s.tps, 0) / recent.length;
    const avgLatency = recent.reduce((sum, s) => sum + s.latency, 0) / recent.length;

    // Check for significant degradation
    if (snapshot.tps < avgTPS * 0.7) {
      this.degradationPoints.push({
        timestamp: snapshot.timestamp,
        tps: snapshot.tps,
        latency: snapshot.latency,
        memoryUsage: snapshot.memoryUsage,
        cpuUsage: snapshot.cpuUsage,
        description: `TPS degradation: ${snapshot.tps.toFixed(2)} vs avg ${avgTPS.toFixed(2)}`
      });
    }

    if (snapshot.latency > avgLatency * 2) {
      this.degradationPoints.push({
        timestamp: snapshot.timestamp,
        tps: snapshot.tps,
        latency: snapshot.latency,
        memoryUsage: snapshot.memoryUsage,
        cpuUsage: snapshot.cpuUsage,
        description: `Latency spike: ${snapshot.latency}ms vs avg ${avgLatency.toFixed(2)}ms`
      });
    }

    // Memory leak detection
    if (config.memoryMonitoring && snapshot.memoryUsage > this.memoryBaseline * 1.5) {
      this.degradationPoints.push({
        timestamp: snapshot.timestamp,
        tps: snapshot.tps,
        latency: snapshot.latency,
        memoryUsage: snapshot.memoryUsage,
        cpuUsage: snapshot.cpuUsage,
        description: `Memory usage high: ${snapshot.memoryUsage.toFixed(2)}MB vs baseline ${this.memoryBaseline.toFixed(2)}MB`
      });
    }
  }

  private identifyBottlenecks(snapshot: PerformanceSnapshot, config: StressTestConfig): void {
    // Memory bottleneck
    if (config.memoryMonitoring && snapshot.memoryUsage > (config.maxMemoryMB || 1024)) {
      this.bottlenecks.push({
        type: 'memory',
        severity: 'high',
        description: `Memory usage exceeded threshold: ${snapshot.memoryUsage.toFixed(2)}MB`,
        timestamp: snapshot.timestamp,
        metrics: { memoryUsage: snapshot.memoryUsage, threshold: config.maxMemoryMB || 1024 },
        recommendation: 'Increase memory limit or optimize memory usage'
      });
    }

    // CPU bottleneck
    if (config.cpuThreshold && snapshot.cpuUsage > config.cpuThreshold) {
      this.bottlenecks.push({
        type: 'cpu',
        severity: 'medium',
        description: `CPU usage exceeded threshold: ${snapshot.cpuUsage.toFixed(2)}%`,
        timestamp: snapshot.timestamp,
        metrics: { cpuUsage: snapshot.cpuUsage, threshold: config.cpuThreshold },
        recommendation: 'Optimize CPU-intensive operations or add more processing power'
      });
    }

    // Consensus bottleneck
    if (snapshot.confirmationRate < 80) {
      this.bottlenecks.push({
        type: 'consensus',
        severity: 'high',
        description: `Low confirmation rate: ${snapshot.confirmationRate.toFixed(2)}%`,
        timestamp: snapshot.timestamp,
        metrics: { confirmationRate: snapshot.confirmationRate },
        recommendation: 'Optimize consensus algorithm or increase validator participation'
      });
    }

    // Network bottleneck (high latency)
    if (snapshot.latency > 1000) {
      this.bottlenecks.push({
        type: 'network',
        severity: 'medium',
        description: `High network latency: ${snapshot.latency}ms`,
        timestamp: snapshot.timestamp,
        metrics: { latency: snapshot.latency },
        recommendation: 'Optimize network configuration or reduce network hops'
      });
    }
  }

  private async analyzeResults(): Promise<StressTestResults> {
    if (!this.currentTest) {
      throw new Error('No test results available');
    }

    const results = { ...this.currentTest };
    results.endTime = Date.now();

    // Calculate memory growth rate
    if (this.snapshots.length > 60) {
      const startMemory = this.snapshots[0].memoryUsage;
      const endMemory = this.snapshots[this.snapshots.length - 1].memoryUsage;
      const timeSpanHours = (results.endTime - results.startTime) / 1000 / 3600;
      results.memoryGrowthRate = (endMemory - startMemory) / timeSpanHours;
      results.memoryLeakDetected = results.memoryGrowthRate > 10; // 10MB per hour threshold
    }

    // Get final DAG metrics
    const finalMetrics = this.engine.getMetrics();
    results.dagNodeCount = finalMetrics.nodeCount;
    results.confirmationRate = finalMetrics.confirmationRate;

    return results;
  }

  private cleanup(): void {
    this.snapshots = [];
    this.degradationPoints = [];
    this.bottlenecks = [];
    this.memoryBaseline = 0;
    this.lastMemoryCheck = 0;
  }

  /**
   * Get current test status
   */
  getCurrentTest(): StressTestResults | null {
    return this.currentTest;
  }

  /**
   * Check if stress test is running
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get test history
   */
  getTestHistory(): StressTestResults[] {
    // This would typically be stored in a database
    return this.currentTest ? [this.currentTest] : [];
  }
}