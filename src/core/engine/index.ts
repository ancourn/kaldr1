/**
 * KALDRIX Core Engine - DAG-based Blockchain Architecture
 * 
 * This package provides a high-performance DAG-based blockchain engine
 * with prioritized transaction processing and validator simulation.
 * 
 * Main Components:
 * - DAGBlockEngine: Core DAG processing engine
 * - KaldrixCoreEngine: Interface layer for backward compatibility
 * - Types: Core type definitions
 */

import { DAGBlockEngine } from './dag-engine';
import { KaldrixCoreEngine, kaldrixCoreEngine } from './interface';

export { DAGBlockEngine } from './dag-engine';
export { KaldrixCoreEngine, kaldrixCoreEngine } from './interface';

// Export stress testing components
export { StressTestManager } from './stress-test';
export type {
  StressTestConfig,
  StressTestResults,
  BottleneckReport,
  DegradationPoint
} from './stress-test';

// Export real-world simulation components
export { RealWorldSimulation } from './real-world-simulation';
export type {
  SimulationConfig,
  SimulationResults,
  UserWallet,
  SimulatedValidator,
  ValidatorPerformance,
  UserActivitySummary,
  NetworkHealthMetrics
} from './real-world-simulation';

// Export validator election components
export { ValidatorElectionManager } from './validator-election';
export type {
  ValidatorElectionConfig,
  ValidatorStats,
  ElectionResult,
  RewardDistribution
} from './validator-election';

// Export consensus visualization components
export { ConsensusVisualizer } from './consensus-viz';
export type {
  VisualizationConfig,
  DAGVisualizationData,
  VisualNode,
  VisualEdge,
  VisualBundle,
  VisualValidator,
  VisualMetrics,
  TopologyInfo,
  ClusterInfo
} from './consensus-viz';

// Export security layer components
export { SecurityLayer } from './security-layer';
export type {
  SecurityConfig,
  SecurityMetrics,
  AnomalyReport,
  QuantumSignature,
  IntegrityProof,
  SecurityAlert
} from './security-layer';

// Re-export types for convenience
export type {
  Transaction,
  DAGNode,
  Validator,
  MempoolEntry,
  TransactionBundle,
  DAGMetrics,
  ConsensusState,
  EngineConfig,
  PerformanceSnapshot,
  DAGEngineEvents
} from './types';

// Default export
const KaldrixCoreEnginePackage = {
  DAGBlockEngine,
  KaldrixCoreEngine,
  kaldrixCoreEngine
};

export default KaldrixCoreEnginePackage;