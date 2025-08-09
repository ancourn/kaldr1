import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  OptimizeRequest,
  OptimizeResponse,
  AnalysisResponse,
  HealthResponse,
  ErrorResponse,
} from './types';

export interface DevAssistantClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class DevAssistantClient {
  private http: AxiosInstance;
  private config: DevAssistantClientConfig;

  constructor(config: DevAssistantClientConfig) {
    this.config = config;
    
    this.http = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': '@kaldrix/dev-assistant-client/1.0.0',
        ...config.headers,
      },
    });

    // Add response interceptor for error handling
    this.http.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const errorData = error.response.data as ErrorResponse;
          throw new DevAssistantError(
            errorData.error || 'API request failed',
            error.response.status,
            errorData.code,
            errorData.details
          );
        } else if (error.request) {
          // The request was made but no response was received
          throw new DevAssistantError(
            'No response received from server',
            0,
            'NETWORK_ERROR'
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new DevAssistantError(
            error.message || 'Request setup failed',
            0,
            'REQUEST_ERROR'
          );
        }
      }
    );
  }

  /**
   * Analyze a smart contract for security vulnerabilities and optimization opportunities
   * 
   * @param contractId - The ID of the contract to analyze
   * @returns Promise<AnalysisResponse> - Analysis results including issues, gas analysis, and scores
   * 
   * @example
   * ```typescript
   * const analysis = await client.analyzeContract('0x1234567890abcdef1234567890abcdef12345678');
   * console.log(`Security score: ${analysis.security_score}`);
   * console.log(`Issues found: ${analysis.issues_found.length}`);
   * ```
   */
  async analyzeContract(contractId: string): Promise<AnalysisResponse> {
    const response = await this.http.get<AnalysisResponse>(`/contracts/${contractId}/analyze`);
    return response.data;
  }

  /**
   * Optimize smart contract code for better performance and gas efficiency
   * 
   * @param request - Optimization request containing contract code and options
   * @returns Promise<OptimizeResponse> - Optimized code and summary of changes
   * 
   * @example
   * ```typescript
   * const optimization = await client.optimizeContract({
   *   contract_code: 'contract SimpleStorage { uint256 private data; }',
   *   optimization_level: 'basic',
   *   target_gas_reduction: 20
   * });
   * console.log(`Gas reduction: ${optimization.optimization_summary.gas_reduction_percent}%`);
   * ```
   */
  async optimizeContract(request: OptimizeRequest): Promise<OptimizeResponse> {
    const response = await this.http.post<OptimizeResponse>('/contracts/optimize', request);
    return response.data;
  }

  /**
   * Check the health status of the API service
   * 
   * @returns Promise<HealthResponse> - Health status information
   * 
   * @example
   * ```typescript
   * const health = await client.healthCheck();
   * console.log(`API status: ${health.status}`);
   * ```
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await this.http.get<HealthResponse>('/health');
    return response.data;
  }

  /**
   * Update the API key for authentication
   * 
   * @param apiKey - New API key
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.http.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * Update the base URL for the API
   * 
   * @param baseURL - New base URL
   */
  updateBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.http.defaults.baseURL = baseURL;
  }

  /**
   * Get the current configuration
   */
  getConfig(): DevAssistantClientConfig {
    return { ...this.config };
  }

  /**
   * Create a new client instance with modified configuration
   * 
   * @param config - Partial configuration to override
   * @returns New DevAssistantClient instance
   */
  withConfig(config: Partial<DevAssistantClientConfig>): DevAssistantClient {
    return new DevAssistantClient({
      ...this.config,
      ...config,
    });
  }
}

/**
 * Custom error class for Dev Assistant API errors
 */
export class DevAssistantError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any
  ) {
    super(message);
    this.name = 'DevAssistantError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DevAssistantError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}