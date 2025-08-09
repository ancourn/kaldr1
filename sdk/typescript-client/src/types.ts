/**
 * Type definitions for the Dev Assistant API
 */

/**
 * Request for contract optimization
 */
export interface OptimizeRequest {
  /** The smart contract code to optimize */
  contract_code: string;
  /** Level of optimization to apply (basic, aggressive, maximum) */
  optimization_level?: 'basic' | 'aggressive' | 'maximum';
  /** Target percentage of gas reduction (0-100) */
  target_gas_reduction?: number;
}

/**
 * Response from contract optimization
 */
export interface OptimizeResponse {
  /** The optimized smart contract code */
  optimized_code: string;
  /** Summary of optimizations applied */
  optimization_summary: OptimizationSummary;
  /** Any warnings generated during optimization */
  warnings: string[];
  /** When the optimization was performed */
  optimization_timestamp: string;
}

/**
 * Summary of optimization results
 */
export interface OptimizationSummary {
  /** Percentage of gas reduction achieved */
  gas_reduction_percent: number;
  /** List of optimizations applied */
  optimizations_applied: OptimizationApplied[];
  /** Estimated gas cost of original code */
  original_gas_estimate: number;
  /** Estimated gas cost of optimized code */
  optimized_gas_estimate: number;
}

/**
 * Individual optimization that was applied
 */
export interface OptimizationApplied {
  /** Type of optimization applied */
  type: string;
  /** Description of what was optimized */
  description: string;
  /** Impact of the optimization */
  impact: string;
}

/**
 * Response from contract analysis
 */
export interface AnalysisResponse {
  /** ID of the analyzed contract */
  contract_id: string;
  /** When the analysis was performed */
  analysis_timestamp: string;
  /** List of issues found in the contract */
  issues_found: Issue[];
  /** Gas usage analysis */
  gas_analysis: GasAnalysis;
  /** Overall security score (0-100) */
  security_score: number;
  /** Overall performance score (0-100) */
  performance_score: number;
}

/**
 * Issue found during contract analysis
 */
export interface Issue {
  /** Severity level of the issue (low, medium, high, critical) */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Type of issue (e.g., security, performance, gas) */
  type: string;
  /** Detailed description of the issue */
  description: string;
  /** Line number where the issue occurs */
  line_number?: number;
  /** Suggested fix for the issue */
  suggestion: string;
}

/**
 * Gas usage analysis
 */
export interface GasAnalysis {
  /** Total gas cost */
  total_gas: number;
  /** Percentage of gas that could be optimized */
  optimization_potential: number;
  /** List of high-cost functions */
  high_cost_functions: HighCostFunction[];
}

/**
 * High-cost function identified during analysis
 */
export interface HighCostFunction {
  /** Name of the function */
  function_name: string;
  /** Gas cost of the function */
  gas_cost: number;
  /** Suggestion for optimization */
  optimization_suggestion: string;
}

/**
 * Response from health check
 */
export interface HealthResponse {
  /** Health status */
  status: string;
  /** When the check was performed */
  timestamp: string;
  /** API version */
  version: string;
  /** Status of individual services */
  services: HealthServices;
}

/**
 * Status of individual services
 */
export interface HealthServices {
  /** Server status */
  server: string;
  /** Database status */
  database: string;
  /** AI services status */
  ai_services: string;
}

/**
 * Error response from the API
 */
export interface ErrorResponse {
  /** Error message */
  error: string;
  /** Error code */
  code: string;
  /** Additional error details */
  details?: any;
  /** When the error occurred */
  timestamp: string;
}