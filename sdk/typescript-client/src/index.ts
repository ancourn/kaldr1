/**
 * Dev Assistant API Client SDK for TypeScript
 * 
 * This SDK provides a convenient way to interact with the Dev Assistant API
 * for smart contract analysis and optimization.
 * 
 * @example
 * ```typescript
 * import { DevAssistantClient } from '@kaldrix/dev-assistant-client';
 * 
 * const client = new DevAssistantClient({
 *   baseURL: 'https://api.kaldrix.com',
 *   apiKey: 'your-api-key'
 * });
 * 
 * // Analyze a contract
 * const analysis = await client.analyzeContract('0x1234567890abcdef1234567890abcdef12345678');
 * console.log(`Found ${analysis.issues_found.length} issues`);
 * 
 * // Optimize a contract
 * const optimization = await client.optimizeContract({
 *   contract_code: 'contract SimpleStorage { uint256 private data; }',
 *   optimization_level: 'basic',
 *   target_gas_reduction: 20
 * });
 * console.log('Optimized code:', optimization.optimized_code);
 * ```
 */

export * from './client';
export * from './types';
export * from './errors';

// Re-export generated types and API for advanced usage
export * from './generated';