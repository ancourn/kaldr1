/**
 * KALDRIX Consensus Visualization Tool
 * 
 * Real-time DAG visualization system for monitoring consensus state,
 * node confirmations, bundle linkages, and validator performance.
 */

import { DAGBlockEngine } from './dag-engine';
import type { DAGNode, TransactionBundle, Validator } from './types';

export interface VisualizationConfig {
  updateInterval: number; // in milliseconds
  maxNodes: number;
  maxHistory: number;
  showTransactions: boolean;
  showValidatorHeatmap: boolean;
  showLatencyMetrics: boolean;
  enableRealTimeUpdates: boolean;
}

export interface DAGVisualizationData {
  timestamp: number;
  nodes: VisualNode[];
  edges: VisualEdge[];
  bundles: VisualBundle[];
  validators: VisualValidator[];
  metrics: VisualMetrics;
  topology: TopologyInfo;
  signatureCharts: ValidatorSignatureChart[];
  bundleHistory: BundleHistoryEntry[];
}

export interface BundleHistoryEntry {
  bundleId: string;
  nodeId: string;
  timestamp: number;
  transactionCount: number;
  validatorSignatures: ValidatorSignature[];
  confirmationTime: number;
  status: 'pending' | 'confirmed' | 'failed';
  totalFee: bigint;
}

export interface VisualNode {
  id: string;
  hash: string;
  level: number;
  x: number;
  y: number;
  confirmed: boolean;
  validator: string;
  transactionCount: number;
  gasUsed: bigint;
  timestamp: number;
  latency: number;
  size: number;
  color: string;
  parentHashes: string[];
  childrenHashes: string[];
}

export interface VisualEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  confirmed: boolean;
  latency: number;
  color: string;
}

export interface VisualBundle {
  id: string;
  nodeId: string;
  transactionCount: number;
  totalFee: bigint;
  preConfirmed: boolean;
  validatorSignatures: ValidatorSignature[];
  priority: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  signatureHeatmap: SignatureHeatmapData;
  averageConfirmationTime: number;
  signatureDistribution: Record<string, number>;
}

export interface ValidatorSignature {
  validatorId: string;
  validatorAddress: string;
  signature: string;
  timestamp: number;
  region: string;
  isValid: boolean;
  weight: number;
}

export interface SignatureHeatmapData {
  validatorIds: string[];
  signatureCount: number[];
  confirmationRate: number[];
  averageResponseTime: number[];
  regions: string[];
}

export interface ValidatorSignatureChart {
  nodeId: string;
  validatorSignatures: {
    validatorId: string;
    signatureCount: number;
    averageResponseTime: number;
    successRate: number;
    region: string;
  }[];
  totalSignatures: number;
  uniqueValidators: number;
  signatureDistribution: {
    region: string;
    count: number;
    percentage: number;
  }[];
}

export interface VisualValidator {
  id: string;
  address: string;
  region: string;
  stake: bigint;
  reputation: number;
  uptime: number;
  responseTime: number;
  isActive: boolean;
  contributionScore: number;
  nodesProduced: number;
  color: string;
  x: number;
  y: number;
  lastActivity: number;
}

export interface VisualMetrics {
  totalNodes: number;
  confirmedNodes: number;
  pendingNodes: number;
  averageLatency: number;
  peakLatency: number;
  tps: number;
  confirmationRate: number;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
  memoryUsage: number;
  cpuUsage: number;
}

export interface TopologyInfo {
  maxLevel: number;
  averageLevel: number;
  branchingFactor: number;
  density: number;
  diameter: number;
  clusters: ClusterInfo[];
}

export interface ClusterInfo {
  id: string;
  level: number;
  nodeCount: number;
  averageLatency: number;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  validatorDistribution: Record<string, number>;
}

export class ConsensusVisualizer {
  private engine: DAGBlockEngine;
  private config: VisualizationConfig;
  private isRunning = false;
  private updateInterval?: NodeJS.Timeout;
  private visualizationData: DAGVisualizationData | null = null;
  private history: DAGVisualizationData[] = [];
  private nodePositions: Map<string, { x: number; y: number }> = new Map();
  private validatorPositions: Map<string, { x: number; y: number }> = new Map();
  private bundleHistory: BundleHistoryEntry[] = [];
  private maxBundleHistory = 1000;

  constructor(engine: DAGBlockEngine, config: Partial<VisualizationConfig> = {}) {
    this.engine = engine;
    
    this.config = {
      updateInterval: config.updateInterval || 1000,
      maxNodes: config.maxNodes || 100,
      maxHistory: config.maxHistory || 50,
      showTransactions: config.showTransactions || true,
      showValidatorHeatmap: config.showValidatorHeatmap || true,
      showLatencyMetrics: config.showLatencyMetrics || true,
      enableRealTimeUpdates: config.enableRealTimeUpdates || true
    };
  }

  /**
   * Start visualization
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Visualization already running');
      return;
    }

    this.isRunning = true;
    console.log('🎨 Starting consensus visualization...');
    console.log(`📊 Update interval: ${this.config.updateInterval}ms`);
    console.log(`🔧 Max nodes: ${this.config.maxNodes}, History: ${this.config.maxHistory}`);

    // Initialize positions
    this.initializePositions();

    // Start real-time updates
    if (this.config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }

    // Generate initial visualization
    await this.generateVisualization();

    console.log('✅ Consensus visualization started');
  }

  /**
   * Stop visualization
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Visualization not running');
      return;
    }

    this.isRunning = false;

    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    console.log('🛑 Consensus visualization stopped');
  }

  /**
   * Get current visualization data
   */
  getCurrentVisualization(): DAGVisualizationData | null {
    return this.visualizationData;
  }

  /**
   * Get visualization history
   */
  getVisualizationHistory(): DAGVisualizationData[] {
    return [...this.history];
  }

  /**
   * Force visualization update
   */
  async forceUpdate(): Promise<DAGVisualizationData> {
    return await this.generateVisualization();
  }

  /**
   * Get node position
   */
  getNodePosition(nodeId: string): { x: number; y: number } | null {
    return this.nodePositions.get(nodeId) || null;
  }

  /**
   * Get validator position
   */
  getValidatorPosition(validatorId: string): { x: number; y: number } | null {
    return this.validatorPositions.get(validatorId) || null;
  }

  /**
   * Export visualization as SVG
   */
  exportToSVG(): string {
    if (!this.visualizationData) {
      return '';
    }

    const svg = this.generateSVG(this.visualizationData);
    return svg;
  }

  /**
   * Export visualization as JSON
   */
  exportToJSON(): string {
    if (!this.visualizationData) {
      return '{}';
    }

    return JSON.stringify(this.visualizationData, null, 2);
  }

  /**
   * Get bundle history
   */
  getBundleHistory(): BundleHistoryEntry[] {
    return [...this.bundleHistory];
  }

  /**
   * Get bundle history for a specific node
   */
  getBundleHistoryForNode(nodeId: string): BundleHistoryEntry[] {
    return this.bundleHistory.filter(entry => entry.nodeId === nodeId);
  }

  /**
   * Get signature statistics for a validator
   */
  getValidatorSignatureStats(validatorId: string): {
    totalSignatures: number;
    averageResponseTime: number;
    successRate: number;
    recentActivity: number;
  } {
    const validatorBundles = this.bundleHistory.filter(entry => 
      entry.validatorSignatures.some(sig => sig.validatorId === validatorId)
    );

    const signatures = validatorBundles.flatMap(entry => 
      entry.validatorSignatures.filter(sig => sig.validatorId === validatorId)
    );

    const totalSignatures = signatures.length;
    const averageResponseTime = totalSignatures > 0 
      ? signatures.reduce((sum, sig) => sum + (sig.timestamp - entry.timestamp), 0) / totalSignatures
      : 0;
    const successRate = totalSignatures > 0 
      ? signatures.filter(sig => sig.isValid).length / totalSignatures
      : 0;
    const recentActivity = signatures.filter(sig => 
      Date.now() - sig.timestamp < 300000 // 5 minutes
    ).length;

    return {
      totalSignatures,
      averageResponseTime,
      successRate,
      recentActivity
    };
  }

  /**
   * Clear bundle history
   */
  clearBundleHistory(): void {
    this.bundleHistory = [];
  }

  /**
   * Export bundle history as JSON
   */
  exportBundleHistory(): string {
    return JSON.stringify(this.bundleHistory, null, 2);
  }

  private initializePositions(): void {
    // Initialize node positions in a circular layout
    const centerX = 500;
    const centerY = 300;
    const radius = 200;

    // Initialize validator positions in a grid layout
    const validatorGridSize = Math.ceil(Math.sqrt(this.engine.getValidators().length));
    const validatorSpacing = 80;
    const validatorStartX = 50;
    const validatorStartY = 50;

    this.engine.getValidators().forEach((validator, index) => {
      const row = Math.floor(index / validatorGridSize);
      const col = index % validatorGridSize;
      
      this.validatorPositions.set(validator.id, {
        x: validatorStartX + col * validatorSpacing,
        y: validatorStartY + row * validatorSpacing
      });
    });
  }

  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(async () => {
      if (!this.isRunning) return;
      await this.generateVisualization();
    }, this.config.updateInterval);
  }

  private async generateVisualization(): Promise<DAGVisualizationData> {
    const timestamp = Date.now();
    
    // Get current DAG state
    const nodes = this.engine.getNodes().slice(0, this.config.maxNodes);
    const bundles = this.engine.getBundles().slice(0, this.config.maxNodes);
    const validators = this.engine.getValidators();
    const metrics = this.engine.getMetrics();

    // Generate visual components
    const visualNodes = this.generateVisualNodes(nodes);
    const visualEdges = this.generateVisualEdges(visualNodes);
    const visualBundles = this.generateVisualBundles(bundles);
    const visualValidators = this.generateVisualValidators(validators);
    const visualMetrics = this.generateVisualMetrics(metrics);
    const topology = this.generateTopologyInfo(visualNodes);
    
    // Generate signature charts
    const signatureCharts = this.generateSignatureCharts(visualBundles);
    
    // Update bundle history
    this.updateBundleHistory(bundles, visualBundles);

    const visualizationData: DAGVisualizationData = {
      timestamp,
      nodes: visualNodes,
      edges: visualEdges,
      bundles: visualBundles,
      validators: visualValidators,
      metrics: visualMetrics,
      topology,
      signatureCharts,
      bundleHistory: this.bundleHistory.slice(-100) // Show last 100 in current visualization
    };

    this.visualizationData = visualizationData;
    
    // Add to history
    this.history.push(visualizationData);
    if (this.history.length > this.config.maxHistory) {
      this.history.shift();
    }

    // Emit update event
    this.engine.emit('visualizationUpdate', visualizationData);

    return visualizationData;
  }

  private generateSignatureCharts(bundles: VisualBundle[]): ValidatorSignatureChart[] {
    const nodeMap = new Map<string, VisualBundle[]>();
    
    // Group bundles by node
    bundles.forEach(bundle => {
      if (!nodeMap.has(bundle.nodeId)) {
        nodeMap.set(bundle.nodeId, []);
      }
      nodeMap.get(bundle.nodeId)!.push(bundle);
    });

    return Array.from(nodeMap.entries()).map(([nodeId, nodeBundles]) => {
      const validatorStats = new Map<string, {
        signatureCount: number;
        totalResponseTime: number;
        successCount: number;
        region: string;
      }>();

      // Aggregate validator statistics
      nodeBundles.forEach(bundle => {
        bundle.validatorSignatures.forEach(sig => {
          if (!validatorStats.has(sig.validatorId)) {
            validatorStats.set(sig.validatorId, {
              signatureCount: 0,
              totalResponseTime: 0,
              successCount: 0,
              region: sig.region
            });
          }
          
          const stats = validatorStats.get(sig.validatorId)!;
          stats.signatureCount++;
          stats.totalResponseTime += (sig.timestamp - bundle.timestamp);
          if (sig.isValid) {
            stats.successCount++;
          }
        });
      });

      const validatorSignatures = Array.from(validatorStats.entries()).map(([validatorId, stats]) => ({
        validatorId,
        signatureCount: stats.signatureCount,
        averageResponseTime: stats.signatureCount > 0 ? stats.totalResponseTime / stats.signatureCount : 0,
        successRate: stats.signatureCount > 0 ? stats.successCount / stats.signatureCount : 0,
        region: stats.region
      }));

      // Calculate regional distribution
      const regionCount = new Map<string, number>();
      validatorSignatures.forEach(sig => {
        regionCount.set(sig.region, (regionCount.get(sig.region) || 0) + sig.signatureCount);
      });

      const totalSignatures = validatorSignatures.reduce((sum, sig) => sum + sig.signatureCount, 0);
      const signatureDistribution = Array.from(regionCount.entries()).map(([region, count]) => ({
        region,
        count,
        percentage: totalSignatures > 0 ? (count / totalSignatures) * 100 : 0
      }));

      return {
        nodeId,
        validatorSignatures,
        totalSignatures,
        uniqueValidators: validatorSignatures.length,
        signatureDistribution
      };
    });
  }

  private updateBundleHistory(bundles: any[], visualBundles: VisualBundle[]): void {
    bundles.forEach((bundle, index) => {
      const visualBundle = visualBundles[index];
      if (!visualBundle) return;

      const historyEntry: BundleHistoryEntry = {
        bundleId: bundle.id,
        nodeId: bundle.nodeId || '',
        timestamp: bundle.timestamp,
        transactionCount: bundle.transactions.length,
        validatorSignatures: visualBundle.validatorSignatures,
        confirmationTime: visualBundle.averageConfirmationTime,
        status: visualBundle.status,
        totalFee: bundle.totalFee
      };

      // Add to history
      this.bundleHistory.push(historyEntry);
      
      // Maintain history size limit
      if (this.bundleHistory.length > this.maxBundleHistory) {
        this.bundleHistory.shift();
      }
    });
  }

  private generateVisualNodes(nodes: any[]): VisualNode[] {
    const visualNodes: VisualNode[] = [];
    
    // Calculate layout positions
    const levels = this.groupNodesByLevel(nodes);
    const levelHeight = 600 / (Object.keys(levels).length || 1);
    
    Object.entries(levels).forEach(([level, levelNodes]) => {
      const levelY = parseInt(level) * levelHeight + 50;
      const nodeSpacing = 900 / (levelNodes.length || 1);
      
      levelNodes.forEach((node, index) => {
        const x = (index + 0.5) * nodeSpacing + 50;
        const y = levelY;
        
        // Store position
        this.nodePositions.set(node.id, { x, y });
        
        const visualNode: VisualNode = {
          id: node.id,
          hash: node.hash,
          level: node.level,
          x,
          y,
          confirmed: node.confirmed,
          validator: node.validator,
          transactionCount: node.transactions.length,
          gasUsed: node.gasUsed,
          timestamp: node.timestamp,
          latency: this.calculateNodeLatency(node),
          size: this.calculateNodeSize(node),
          color: this.getNodeColor(node),
          parentHashes: node.parentHashes || [],
          childrenHashes: this.findChildrenHashes(node.id, nodes)
        };
        
        visualNodes.push(visualNode);
      });
    });
    
    return visualNodes;
  }

  private generateVisualEdges(nodes: VisualNode[]): VisualEdge[] {
    const edges: VisualEdge[] = [];
    
    nodes.forEach(node => {
      node.parentHashes.forEach(parentHash => {
        const parentNode = nodes.find(n => n.hash === parentHash);
        if (parentNode) {
          const edge: VisualEdge = {
            id: `edge_${parentNode.id}_${node.id}`,
            source: parentNode.id,
            target: node.id,
            weight: this.calculateEdgeWeight(parentNode, node),
            confirmed: parentNode.confirmed && node.confirmed,
            latency: Math.abs(node.latency - parentNode.latency),
            color: this.getEdgeColor(parentNode, node)
          };
          
          edges.push(edge);
        }
      });
    });
    
    return edges;
  }

  private generateVisualBundles(bundles: any[]): VisualBundle[] {
    return bundles.map(bundle => {
      const validatorSignatures = this.generateValidatorSignatures(bundle);
      const signatureHeatmap = this.generateSignatureHeatmap(validatorSignatures);
      const signatureDistribution = this.generateSignatureDistribution(validatorSignatures);
      
      return {
        id: bundle.id,
        nodeId: bundle.nodeId || '',
        transactionCount: bundle.transactions.length,
        totalFee: bundle.totalFee,
        preConfirmed: bundle.preConfirmed,
        validatorSignatures,
        priority: bundle.priority,
        timestamp: bundle.timestamp,
        status: this.getBundleStatus(bundle),
        signatureHeatmap,
        averageConfirmationTime: this.calculateAverageConfirmationTime(validatorSignatures, bundle.timestamp),
        signatureDistribution
      };
    });
  }

  private generateValidatorSignatures(bundle: any): ValidatorSignature[] {
    const validators = this.engine.getValidators();
    const signatureCount = Math.floor(Math.random() * 3) + 1; // 1-3 signatures
    const signatures: ValidatorSignature[] = [];
    
    for (let i = 0; i < signatureCount; i++) {
      const validator = validators[Math.floor(Math.random() * validators.length)];
      const responseTime = Math.random() * 5000 + 1000; // 1-6 seconds response time
      
      signatures.push({
        validatorId: validator.id,
        validatorAddress: validator.address,
        signature: '0x' + Math.random().toString(16).substr(2, 128),
        timestamp: bundle.timestamp + responseTime,
        region: validator.region,
        isValid: Math.random() > 0.1, // 90% success rate
        weight: Number(validator.stake) / Number('1000000000000000000')
      });
    }
    
    return signatures;
  }

  private generateSignatureHeatmap(signatures: ValidatorSignature[]): SignatureHeatmapData {
    const validatorIds = Array.from(new Set(signatures.map(sig => sig.validatorId)));
    const regions = Array.from(new Set(signatures.map(sig => sig.region)));
    
    const signatureCount = validatorIds.map(id => 
      signatures.filter(sig => sig.validatorId === id).length
    );
    
    const confirmationRate = validatorIds.map(id => {
      const validatorSigs = signatures.filter(sig => sig.validatorId === id);
      return validatorSigs.length > 0 
        ? validatorSigs.filter(sig => sig.isValid).length / validatorSigs.length 
        : 0;
    });
    
    const averageResponseTime = validatorIds.map(id => {
      const validatorSigs = signatures.filter(sig => sig.validatorId === id);
      return validatorSigs.length > 0 
        ? validatorSigs.reduce((sum, sig) => sum + (sig.timestamp - signatures[0].timestamp), 0) / validatorSigs.length 
        : 0;
    });
    
    return {
      validatorIds,
      signatureCount,
      confirmationRate,
      averageResponseTime,
      regions
    };
  }

  private generateSignatureDistribution(signatures: ValidatorSignature[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    signatures.forEach(sig => {
      distribution[sig.region] = (distribution[sig.region] || 0) + 1;
    });
    
    return distribution;
  }

  private calculateAverageConfirmationTime(signatures: ValidatorSignature[], bundleTimestamp: number): number {
    if (signatures.length === 0) return 0;
    
    const totalResponseTime = signatures.reduce((sum, sig) => sum + (sig.timestamp - bundleTimestamp), 0);
    return totalResponseTime / signatures.length;
  }

  private generateVisualValidators(validators: Validator[]): VisualValidator[] {
    return validators.map(validator => {
      const position = this.validatorPositions.get(validator.id) || { x: 0, y: 0 };
      
      return {
        id: validator.id,
        address: validator.address,
        region: validator.region,
        stake: validator.stake,
        reputation: validator.reputation,
        uptime: 100, // This would come from validator stats
        responseTime: 100, // This would come from validator stats
        isActive: validator.isActive,
        contributionScore: 0, // This would come from validator stats
        nodesProduced: 0, // This would come from validator stats
        color: this.getValidatorColor(validator),
        x: position.x,
        y: position.y,
        lastActivity: validator.lastActive
      };
    });
  }

  private generateVisualMetrics(metrics: any): VisualMetrics {
    return {
      totalNodes: metrics.nodeCount,
      confirmedNodes: Math.floor(metrics.nodeCount * metrics.confirmationRate / 100),
      pendingNodes: Math.floor(metrics.nodeCount * (100 - metrics.confirmationRate) / 100),
      averageLatency: metrics.latency,
      peakLatency: metrics.latency * 1.5, // Simulated peak
      tps: metrics.tps,
      confirmationRate: metrics.confirmationRate,
      networkHealth: this.getNetworkHealth(metrics),
      memoryUsage: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage
    };
  }

  private generateTopologyInfo(nodes: VisualNode[]): TopologyInfo {
    const levels = this.groupNodesByLevel(nodes);
    const maxLevel = Math.max(...Object.keys(levels).map(Number));
    const averageLevel = nodes.reduce((sum, node) => sum + node.level, 0) / nodes.length;
    
    // Calculate branching factor
    const totalChildren = nodes.reduce((sum, node) => sum + node.childrenHashes.length, 0);
    const branchingFactor = totalChildren / nodes.length;
    
    // Calculate density
    const maxPossibleEdges = nodes.length * (nodes.length - 1) / 2;
    const actualEdges = nodes.reduce((sum, node) => sum + node.parentHashes.length, 0);
    const density = actualEdges / maxPossibleEdges;
    
    // Calculate diameter (longest path)
    const diameter = this.calculateDiameter(nodes);
    
    // Generate clusters by level
    const clusters: ClusterInfo[] = Object.entries(levels).map(([level, levelNodes]) => {
      const avgLatency = levelNodes.reduce((sum, node) => sum + node.latency, 0) / levelNodes.length;
      const validatorDist: Record<string, number> = {};
      
      levelNodes.forEach(node => {
        validatorDist[node.validator] = (validatorDist[node.validator] || 0) + 1;
      });
      
      return {
        id: `cluster_${level}`,
        level: parseInt(level),
        nodeCount: levelNodes.length,
        averageLatency: avgLatency,
        health: this.getClusterHealth(avgLatency),
        validatorDistribution: validatorDist
      };
    });

    return {
      maxLevel,
      averageLevel,
      branchingFactor,
      density,
      diameter,
      clusters
    };
  }

  private groupNodesByLevel(nodes: any[]): Record<number, any[]> {
    const levels: Record<number, any[]> = {};
    
    nodes.forEach(node => {
      const level = node.level || 0;
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(node);
    });
    
    return levels;
  }

  private findChildrenHashes(nodeId: string, nodes: any[]): string[] {
    return nodes
      .filter(node => node.parentHashes && node.parentHashes.includes(nodeId))
      .map(node => node.hash);
  }

  private calculateNodeLatency(node: any): number {
    const now = Date.now();
    const age = now - node.timestamp;
    return Math.min(age, 5000); // Cap at 5 seconds
  }

  private calculateNodeSize(node: any): number {
    const baseSize = 20;
    const transactionMultiplier = Math.log(node.transactions.length + 1) * 5;
    return Math.min(baseSize + transactionMultiplier, 50);
  }

  private getNodeColor(node: any): string {
    if (node.confirmed) {
      return '#10b981'; // Green for confirmed
    } else {
      return '#f59e0b'; // Yellow for pending
    }
  }

  private calculateEdgeWeight(source: VisualNode, target: VisualNode): number {
    const timeDiff = Math.abs(target.timestamp - source.timestamp);
    return Math.max(1, 5 - timeDiff / 1000); // Weight based on time difference
  }

  private getEdgeColor(source: VisualNode, target: VisualNode): string {
    if (source.confirmed && target.confirmed) {
      return '#10b981'; // Green for confirmed edges
    } else {
      return '#6b7280'; // Gray for unconfirmed edges
    }
  }

  private getBundleStatus(bundle: any): 'pending' | 'confirmed' | 'failed' {
    if (bundle.preConfirmed) {
      return 'confirmed';
    } else if (bundle.timestamp < Date.now() - 30000) {
      return 'failed'; // Failed if not pre-confirmed after 30 seconds
    } else {
      return 'pending';
    }
  }

  private getValidatorColor(validator: Validator): string {
    if (!validator.isActive) {
      return '#ef4444'; // Red for inactive
    } else if (validator.reputation > 95) {
      return '#10b981'; // Green for high reputation
    } else if (validator.reputation > 80) {
      return '#3b82f6'; // Blue for medium reputation
    } else {
      return '#f59e0b'; // Yellow for low reputation
    }
  }

  private getNetworkHealth(metrics: any): 'excellent' | 'good' | 'fair' | 'poor' {
    if (metrics.confirmationRate >= 95 && metrics.tps >= 1000) {
      return 'excellent';
    } else if (metrics.confirmationRate >= 85 && metrics.tps >= 500) {
      return 'good';
    } else if (metrics.confirmationRate >= 70 && metrics.tps >= 100) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private getClusterHealth(avgLatency: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (avgLatency < 500) return 'excellent';
    if (avgLatency < 1000) return 'good';
    if (avgLatency < 2000) return 'fair';
    return 'poor';
  }

  private calculateDiameter(nodes: VisualNode[]): number {
    // Simplified diameter calculation
    const levels = new Set(nodes.map(node => node.level));
    return levels.size;
  }

  private generateSVG(data: DAGVisualizationData): string {
    const width = 1000;
    const height = 600;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Add edges
    data.edges.forEach(edge => {
      const sourceNode = data.nodes.find(n => n.id === edge.source);
      const targetNode = data.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        svg += `<line x1="${sourceNode.x}" y1="${sourceNode.y}" x2="${targetNode.x}" y2="${targetNode.y}" stroke="${edge.color}" stroke-width="${edge.weight}" opacity="${edge.confirmed ? '1' : '0.5'}"/>`;
      }
    });
    
    // Add nodes
    data.nodes.forEach(node => {
      svg += `<circle cx="${node.x}" cy="${node.y}" r="${node.size / 2}" fill="${node.color}" stroke="#000" stroke-width="2"/>`;
      svg += `<text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-size="10" fill="#000">${node.level}</text>`;
    });
    
    // Add validators
    data.validators.forEach(validator => {
      svg += `<rect x="${validator.x - 15}" y="${validator.y - 10}" width="30" height="20" fill="${validator.color}" stroke="#000" stroke-width="1"/>`;
      svg += `<text x="${validator.x}" y="${validator.y + 5}" text-anchor="middle" font-size="8" fill="#000">${validator.region}</text>`;
    });
    
    svg += '</svg>';
    
    return svg;
  }

  // Helper methods to access engine data (these would be implemented in the actual DAG engine)
  private getNodes(): any[] {
    // This would access the actual DAG nodes from the engine
    return [];
  }

  private getBundles(): any[] {
    // This would access the actual bundles from the engine
    return [];
  }
}