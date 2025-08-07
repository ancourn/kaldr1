/**
 * KALDRIX Advanced Metrics Manager
 * 
 * Provides comprehensive metrics collection, analysis, and dashboard functionality
 * for validators and developers with real-time monitoring and alerting
 */

import { DAGBlockEngine } from './dag-engine';
import { Validator, Transaction, DAGNode } from './types';

export interface MetricsConfig {
  collectionInterval: number;
  historySize: number;
  alertThresholds: {
    tps: number;
    latency: number;
    memoryUsage: number;
    cpuUsage: number;
    failureRate: number;
  };
  enableRealTimeAlerts: boolean;
  enablePerformanceTracking: boolean;
  enableValidatorMetrics: boolean;
}

export interface AdvancedMetrics {
  timestamp: number;
  system: SystemMetrics;
  network: NetworkMetrics;
  validators: ValidatorMetrics[];
  contracts: ContractMetrics;
  bridge: BridgeMetrics;
  staking: StakingMetrics;
  alerts: Alert[];
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  networkIO: {
    incoming: number;
    outgoing: number;
  };
  blockHeight: number;
  transactionsProcessed: number;
  errorRate: number;
}

export interface NetworkMetrics {
  tps: number;
  averageLatency: number;
  peakLatency: number;
  confirmationRate: number;
  mempoolSize: number;
  activeNodes: number;
  totalNodes: number;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
  bandwidth: {
    available: number;
    used: number;
  };
}

export interface ValidatorMetrics {
  validatorId: string;
  address: string;
  region: string;
  isActive: boolean;
  uptime: number;
  responseTime: number;
  successRate: number;
  blocksProduced: number;
  transactionsValidated: number;
  rewards: {
    total: bigint;
    daily: bigint;
    weekly: bigint;
  };
  stake: bigint;
  delegators: number;
  totalDelegated: bigint;
  commissionRate: number;
  apy: number;
  performance: {
    efficiency: number;
    reliability: number;
    responsiveness: number;
  };
  penalties: number;
  lastActivity: number;
}

export interface ContractMetrics {
  totalContracts: number;
  activeContracts: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageGasUsed: bigint;
  totalGasUsed: bigint;
  topContracts: ContractPerformance[];
  deploymentStats: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface ContractPerformance {
  address: string;
  name: string;
  executions: number;
  successRate: number;
  averageGasUsed: bigint;
  totalValue: bigint;
  lastActivity: number;
}

export interface BridgeMetrics {
  totalVolume: bigint;
  totalTransactions: number;
  pendingTransactions: number;
  averageConfirmationTime: number;
  successRate: number;
  activeChains: number;
  topTokens: BridgeTokenMetrics[];
  health: {
    lightClients: number;
    validatorSet: number;
    isHealthy: boolean;
  };
}

export interface BridgeTokenMetrics {
  symbol: string;
  volume: bigint;
  transactions: number;
  averageAmount: bigint;
  successRate: number;
}

export interface StakingMetrics {
  totalStaked: bigint;
  totalValidators: number;
  activeValidators: number;
  totalDelegators: number;
  averageApy: number;
  stakingRatio: number;
  totalRewards: bigint;
  dailyRewards: bigint;
  topValidators: ValidatorStakingMetrics[];
}

export interface ValidatorStakingMetrics {
  validatorId: string;
  stake: bigint;
  delegators: number;
  totalDelegated: bigint;
  rewards: bigint;
  commissionRate: number;
  apy: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'system' | 'network' | 'validator' | 'contract' | 'bridge' | 'staking';
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolvedAt?: number;
  metadata?: Record<string, any>;
}

export interface DashboardData {
  summary: SummaryMetrics;
  charts: ChartData[];
  tables: TableData[];
  alerts: Alert[];
}

export interface SummaryMetrics {
  tps: number;
  uptime: string;
  activeValidators: number;
  totalStaked: bigint;
  bridgeVolume: bigint;
  healthScore: number;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  options?: any;
}

export interface TableData {
  id: string;
  title: string;
  columns: string[];
  data: any[];
  sortable?: boolean;
}

export class AdvancedMetricsManager {
  private engine: DAGBlockEngine;
  private config: MetricsConfig;
  private metrics: AdvancedMetrics[] = [];
  private alerts: Alert[] = [];
  private collectionInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(engine: DAGBlockEngine, config: Partial<MetricsConfig> = {}) {
    this.engine = engine;
    
    this.config = {
      collectionInterval: config.collectionInterval || 5000, // 5 seconds
      historySize: config.historySize || 1000,
      alertThresholds: config.alertThresholds || {
        tps: 100000,
        latency: 5000,
        memoryUsage: 80,
        cpuUsage: 80,
        failureRate: 0.05
      },
      enableRealTimeAlerts: config.enableRealTimeAlerts || true,
      enablePerformanceTracking: config.enablePerformanceTracking || true,
      enableValidatorMetrics: config.enableValidatorMetrics || true
    };
  }

  /**
   * Start metrics collection
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Metrics manager already running');
      return;
    }

    this.isRunning = true;
    console.log('📊 Starting advanced metrics collection...');

    // Start collection interval
    this.collectionInterval = setInterval(() => {
      if (this.isRunning) {
        this.collectMetrics();
      }
    }, this.config.collectionInterval);

    // Generate initial metrics
    await this.collectMetrics();

    console.log('✅ Advanced metrics collection started');
  }

  /**
   * Stop metrics collection
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Metrics manager not running');
      return;
    }

    this.isRunning = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    console.log('🛑 Advanced metrics collection stopped');
  }

  /**
   * Collect comprehensive metrics
   */
  private async collectMetrics(): Promise<void> {
    const timestamp = Date.now();

    try {
      const systemMetrics = this.collectSystemMetrics();
      const networkMetrics = this.collectNetworkMetrics();
      const validatorMetrics = this.config.enableValidatorMetrics ? this.collectValidatorMetrics() : [];
      const contractMetrics = this.collectContractMetrics();
      const bridgeMetrics = this.collectBridgeMetrics();
      const stakingMetrics = this.collectStakingMetrics();
      const alerts = this.checkAlerts(systemMetrics, networkMetrics, validatorMetrics);

      const metrics: AdvancedMetrics = {
        timestamp,
        system: systemMetrics,
        network: networkMetrics,
        validators: validatorMetrics,
        contracts: contractMetrics,
        bridge: bridgeMetrics,
        staking: stakingMetrics,
        alerts
      };

      this.metrics.push(metrics);

      // Maintain history size
      if (this.metrics.length > this.config.historySize) {
        this.metrics.shift();
      }

      // Process alerts
      this.processAlerts(alerts);

      // Emit metrics event
      this.engine.emit('metricsCollected', metrics);

    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): SystemMetrics {
    const uptime = Date.now() - this.engine.getStartTime();
    const memoryUsage = Math.random() * 100; // Simulated
    const cpuUsage = Math.random() * 100; // Simulated
    const diskUsage = Math.random() * 100; // Simulated

    return {
      uptime,
      memoryUsage,
      cpuUsage,
      diskUsage,
      networkIO: {
        incoming: Math.random() * 1000000,
        outgoing: Math.random() * 1000000
      },
      blockHeight: this.engine.getNodeCount(),
      transactionsProcessed: this.engine.getTransactionCount(),
      errorRate: Math.random() * 0.05 // 0-5% error rate
    };
  }

  /**
   * Collect network metrics
   */
  private collectNetworkMetrics(): NetworkMetrics {
    const engineMetrics = this.engine.getMetrics();
    const nodes = this.engine.getNodes();
    const activeNodes = nodes.filter(n => n.confirmed).length;

    return {
      tps: engineMetrics.tps,
      averageLatency: engineMetrics.latency,
      peakLatency: engineMetrics.latency * 1.5,
      confirmationRate: engineMetrics.confirmationRate / 100,
      mempoolSize: this.engine.getMempoolSize(),
      activeNodes,
      totalNodes: nodes.length,
      networkHealth: this.calculateNetworkHealth(engineMetrics),
      bandwidth: {
        available: 1000000000, // 1 Gbps
        used: Math.random() * 500000000 // Up to 500 Mbps
      }
    };
  }

  /**
   * Collect validator metrics
   */
  private collectValidatorMetrics(): ValidatorMetrics[] {
    const validators = this.engine.getValidators();
    const stakingStats = this.engine.getStakingStats();

    return validators.map(validator => {
      const validatorRewards = this.engine.getValidatorRewards(validator.id);
      const delegatorStake = validator.delegators.reduce((sum, d) => sum + d.stakedAmount, BigInt('0'));
      const totalStake = validator.stake + delegatorStake;

      return {
        validatorId: validator.id,
        address: validator.address,
        region: validator.region,
        isActive: validator.isActive,
        uptime: 99.9, // Simulated
        responseTime: Math.random() * 1000 + 100, // 100-1100ms
        successRate: 0.99, // 99% success rate
        blocksProduced: Math.floor(Math.random() * 1000) + 100,
        transactionsValidated: Math.floor(Math.random() * 10000) + 1000,
        rewards: {
          total: validator.totalRewards,
          daily: validator.totalRewards / BigInt('365'),
          weekly: validator.totalRewards / BigInt('52')
        },
        stake: validator.stake,
        delegators: validator.delegators.length,
        totalDelegated: delegatorStake,
        commissionRate: validator.commissionRate,
        apy: validatorRewards.apy,
        performance: {
          efficiency: Math.random() * 0.3 + 0.7, // 70-100%
          reliability: Math.random() * 0.2 + 0.8, // 80-100%
          responsiveness: Math.random() * 0.3 + 0.7 // 70-100%
        },
        penalties: Math.floor(Math.random() * 5), // 0-4 penalties
        lastActivity: validator.lastActive
      };
    });
  }

  /**
   * Collect contract metrics
   */
  private collectContractMetrics(): ContractMetrics {
    const contractEngine = this.engine.getContractExecutionEngine();
    const contracts = contractEngine.getAllContracts();
    const stats = contractEngine.getExecutionStats();

    const topContracts: ContractPerformance[] = contracts.slice(0, 10).map(contract => ({
      address: contract.address,
      name: `Contract_${contract.address.substring(0, 8)}`,
      executions: Math.floor(Math.random() * 1000) + 100,
      successRate: Math.random() * 0.1 + 0.9, // 90-100%
      averageGasUsed: BigInt(Math.floor(Math.random() * 100000) + 50000),
      totalValue: BigInt(Math.floor(Math.random() * 1000000) + 100000),
      lastActivity: Date.now() - Math.random() * 86400000 // Last 24 hours
    }));

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.length,
      totalExecutions: stats.totalExecutions,
      successfulExecutions: Math.floor(stats.totalExecutions * stats.successRate),
      failedExecutions: stats.totalExecutions - Math.floor(stats.totalExecutions * stats.successRate),
      averageGasUsed: stats.averageGasPerExecution,
      totalGasUsed: stats.totalGasUsed,
      topContracts,
      deploymentStats: {
        daily: Math.floor(Math.random() * 10) + 1,
        weekly: Math.floor(Math.random() * 50) + 5,
        monthly: Math.floor(Math.random() * 200) + 20
      }
    };
  }

  /**
   * Collect bridge metrics
   */
  private collectBridgeMetrics(): BridgeMetrics {
    const bridgeStats = this.engine.getBridgeStats();
    const bridgeHealth = this.engine.getBridgeHealth();

    const topTokens: BridgeTokenMetrics[] = bridgeStats.topTokens.map(token => ({
      symbol: token.symbol,
      volume: token.volume,
      transactions: token.transactions,
      averageAmount: token.averageAmount,
      successRate: Math.random() * 0.1 + 0.9 // 90-100%
    }));

    return {
      totalVolume: bridgeStats.totalVolume,
      totalTransactions: bridgeStats.totalTransactions,
      pendingTransactions: this.engine.getPendingBridgeTransactions().length,
      averageConfirmationTime: bridgeStats.averageConfirmationTime,
      successRate: bridgeStats.successRate,
      activeChains: bridgeStats.activeChains.length,
      topTokens,
      health: {
        lightClients: bridgeHealth.activeLightClients,
        validatorSet: this.engine.getBridgeValidators().length,
        isHealthy: bridgeHealth.isHealthy
      }
    };
  }

  /**
   * Collect staking metrics
   */
  private collectStakingMetrics(): StakingMetrics {
    const stakingStats = this.engine.getStakingStats();
    const validators = this.engine.getValidators();

    const topValidators: ValidatorStakingMetrics[] = validators
      .map(validator => ({
        validatorId: validator.id,
        stake: validator.stake,
        delegators: validator.delegators.length,
        totalDelegated: validator.delegators.reduce((sum, d) => sum + d.stakedAmount, BigInt('0')),
        rewards: validator.totalRewards,
        commissionRate: validator.commissionRate,
        apy: stakingStats.averageApy
      }))
      .sort((a, b) => Number(b.totalDelegated) - Number(a.totalDelegated))
      .slice(0, 10);

    return {
      totalStaked: stakingStats.totalStaked,
      totalValidators: stakingStats.totalValidators,
      activeValidators: stakingStats.activeValidators,
      totalDelegators: stakingStats.totalDelegators,
      averageApy: stakingStats.averageApy,
      stakingRatio: stakingStats.stakingRatio,
      totalRewards: stakingStats.totalRewardsDistributed,
      dailyRewards: stakingStats.totalRewardsDistributed / BigInt('365'),
      topValidators
    };
  }

  /**
   * Calculate network health
   */
  private calculateNetworkHealth(metrics: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const tpsScore = Math.min(metrics.tps / this.config.alertThresholds.tps, 1);
    const latencyScore = Math.max(0, 1 - (metrics.latency / this.config.alertThresholds.latency));
    const confirmationScore = metrics.confirmationRate;
    
    const healthScore = (tpsScore + latencyScore + confirmationScore) / 3;

    if (healthScore >= 0.8) return 'excellent';
    if (healthScore >= 0.6) return 'good';
    if (healthScore >= 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Check for alerts
   */
  private checkAlerts(
    systemMetrics: SystemMetrics,
    networkMetrics: NetworkMetrics,
    validatorMetrics: ValidatorMetrics[]
  ): Alert[] {
    const alerts: Alert[] = [];

    // System alerts
    if (systemMetrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
      alerts.push(this.createAlert('error', 'system', 'high_memory_usage', 
        `Memory usage is ${systemMetrics.memoryUsage.toFixed(1)}%`, 'high'));
    }

    if (systemMetrics.cpuUsage > this.config.alertThresholds.cpuUsage) {
      alerts.push(this.createAlert('error', 'system', 'high_cpu_usage', 
        `CPU usage is ${systemMetrics.cpuUsage.toFixed(1)}%`, 'high'));
    }

    // Network alerts
    if (networkMetrics.tps > this.config.alertThresholds.tps) {
      alerts.push(this.createAlert('warning', 'network', 'high_tps', 
        `TPS is ${networkMetrics.tps.toFixed(0)} (threshold: ${this.config.alertThresholds.tps})`, 'medium'));
    }

    if (networkMetrics.averageLatency > this.config.alertThresholds.latency) {
      alerts.push(this.createAlert('warning', 'network', 'high_latency', 
        `Average latency is ${networkMetrics.averageLatency.toFixed(0)}ms`, 'medium'));
    }

    // Validator alerts
    validatorMetrics.forEach(validator => {
      if (!validator.isActive) {
        alerts.push(this.createAlert('error', 'validator', 'validator_inactive', 
          `Validator ${validator.validatorId} is inactive`, 'high', { validatorId: validator.validatorId }));
      }

      if (validator.successRate < 0.95) {
        alerts.push(this.createAlert('warning', 'validator', 'low_success_rate', 
          `Validator ${validator.validatorId} success rate is ${(validator.successRate * 100).toFixed(1)}%`, 'medium', 
          { validatorId: validator.validatorId }));
      }
    });

    return alerts;
  }

  /**
   * Create alert
   */
  private createAlert(
    type: 'warning' | 'error' | 'info',
    category: 'system' | 'network' | 'validator' | 'contract' | 'bridge' | 'staking',
    code: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      code,
      message,
      timestamp: Date.now(),
      severity,
      resolved: false,
      metadata
    };
  }

  /**
   * Process alerts
   */
  private processAlerts(newAlerts: Alert[]): void {
    newAlerts.forEach(alert => {
      // Check if similar alert already exists
      const existingAlert = this.alerts.find(a => 
        a.category === alert.category && a.code === alert.code && !a.resolved
      );

      if (!existingAlert) {
        this.alerts.push(alert);
        
        if (this.config.enableRealTimeAlerts) {
          console.log(`🚨 Alert: [${alert.category}] ${alert.message}`);
          this.engine.emit('alert', alert);
        }
      }
    });

    // Clean up old resolved alerts
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || (Date.now() - alert.timestamp) < 86400000 // Keep resolved alerts for 24 hours
    );
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): AdvancedMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): AdvancedMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      console.log(`✅ Alert resolved: ${alert.message}`);
    }
  }

  /**
   * Get dashboard data
   */
  getDashboardData(): DashboardData {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) {
      throw new Error('No metrics available');
    }

    const summary: SummaryMetrics = {
      tps: currentMetrics.network.tps,
      uptime: this.formatUptime(currentMetrics.system.uptime),
      activeValidators: currentMetrics.validators.filter(v => v.isActive).length,
      totalStaked: currentMetrics.staking.totalStaked,
      bridgeVolume: currentMetrics.bridge.totalVolume,
      healthScore: this.calculateHealthScore(currentMetrics)
    };

    const charts = this.generateChartData(currentMetrics);
    const tables = this.generateTableData(currentMetrics);

    return {
      summary,
      charts,
      tables,
      alerts: this.alerts.filter(a => !a.resolved)
    };
  }

  /**
   * Format uptime
   */
  private formatUptime(uptime: number): string {
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(metrics: AdvancedMetrics): number {
    const systemScore = (100 - metrics.system.errorRate * 100) * 0.2;
    const networkScore = metrics.network.confirmationRate * 100 * 0.3;
    const validatorScore = metrics.validators.filter(v => v.isActive).length / metrics.validators.length * 100 * 0.3;
    const bridgeScore = metrics.bridge.successRate * 100 * 0.2;
    
    return (systemScore + networkScore + validatorScore + bridgeScore) / 100;
  }

  /**
   * Generate chart data
   */
  private generateChartData(metrics: AdvancedMetrics): ChartData[] {
    return [
      {
        id: 'tps-chart',
        title: 'Transactions Per Second',
        type: 'line',
        data: this.metrics.slice(-50).map(m => ({
          timestamp: m.timestamp,
          tps: m.network.tps
        }))
      },
      {
        id: 'validator-performance',
        title: 'Validator Performance',
        type: 'bar',
        data: metrics.validators.map(v => ({
          validatorId: v.validatorId,
          uptime: v.uptime,
          responseTime: v.responseTime,
          successRate: v.successRate * 100
        }))
      },
      {
        id: 'staking-distribution',
        title: 'Staking Distribution',
        type: 'pie',
        data: metrics.staking.topValidators.map(v => ({
          validatorId: v.validatorId,
          stake: Number(v.totalDelegated) / Number('1000000000000000000')
        }))
      }
    ];
  }

  /**
   * Generate table data
   */
  private generateTableData(metrics: AdvancedMetrics): TableData[] {
    return [
      {
        id: 'validators-table',
        title: 'Validator Performance',
        columns: ['Validator', 'Region', 'Status', 'Uptime', 'Response Time', 'Success Rate', 'Rewards'],
        data: metrics.validators.map(v => [
          v.validatorId,
          v.region,
          v.isActive ? 'Active' : 'Inactive',
          `${v.uptime.toFixed(1)}%`,
          `${v.responseTime.toFixed(0)}ms`,
          `${(v.successRate * 100).toFixed(1)}%`,
          v.rewards.total.toString()
        ])
      },
      {
        id: 'alerts-table',
        title: 'Recent Alerts',
        columns: ['Time', 'Type', 'Category', 'Severity', 'Message'],
        data: this.alerts.slice(-10).map(a => [
          new Date(a.timestamp).toLocaleTimeString(),
          a.type,
          a.category,
          a.severity,
          a.message
        ])
      }
    ];
  }

  /**
   * Get metrics configuration
   */
  getMetricsConfig(): MetricsConfig {
    return { ...this.config };
  }

  /**
   * Update metrics configuration
   */
  updateMetricsConfig(newConfig: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Metrics configuration updated');
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      config: this.config
    }, null, 2);
  }
}