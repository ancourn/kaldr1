# Dev Assistant TypeScript Client SDK

A TypeScript client SDK for the Dev Assistant API, providing type-safe methods for smart contract analysis and optimization.

## Features

- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Contract Analysis**: Comprehensive analysis of smart contracts for security vulnerabilities and performance issues
- **Contract Optimization**: AI-powered optimization of smart contract code for better gas efficiency
- **Health Checks**: Monitor API service status and availability
- **Error Handling**: Comprehensive error handling with custom error types
- **Async/Await**: Modern Promise-based API
- **Auto-generation**: Automatically generated from OpenAPI specification

## Installation

```bash
npm install @kaldrix/dev-assistant-client
```

## Quick Start

```typescript
import { DevAssistantClient } from '@kaldrix/dev-assistant-client';

const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com',
  apiKey: 'your-api-key'
});

// Analyze a contract
const analysis = await client.analyzeContract('0x1234567890abcdef1234567890abcdef12345678');
console.log(`Security score: ${analysis.security_score}`);
console.log(`Issues found: ${analysis.issues_found.length}`);

// Optimize a contract
const optimization = await client.optimizeContract({
  contract_code: `
    contract SimpleStorage {
      uint256 private storedData;
      
      function set(uint256 x) public {
        storedData = x;
      }
      
      function get() public view returns (uint256) {
        return storedData;
      }
    }
  `,
  optimization_level: 'basic',
  target_gas_reduction: 20
});

console.log(`Gas reduction: ${optimization.optimization_summary.gas_reduction_percent}%`);
console.log('Optimized code:', optimization.optimized_code);
```

## API Reference

### DevAssistantClient

The main client class for interacting with the Dev Assistant API.

#### Constructor

```typescript
new DevAssistantClient(config: DevAssistantClientConfig)
```

**Parameters:**
- `config.baseURL`: The base URL of the API (e.g., "https://api.kaldrix.com")
- `config.apiKey`: Your API key for authentication
- `config.timeout`: Request timeout in milliseconds (default: 30000)
- `config.headers`: Additional headers to include in requests

**Example:**
```typescript
const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com',
  apiKey: 'your-api-key',
  timeout: 60000,
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

#### Methods

##### `analyzeContract(contractId: string): Promise<AnalysisResponse>`

Analyzes a smart contract for issues and optimization opportunities.

**Parameters:**
- `contractId`: The ID of the contract to analyze

**Returns:**
- `Promise<AnalysisResponse>`: Analysis results including issues, gas analysis, and scores

**Example:**
```typescript
const analysis = await client.analyzeContract('0x1234...5678');
console.log(`Security score: ${analysis.security_score}`);
console.log(`Issues found: ${analysis.issues_found.length}`);
```

##### `optimizeContract(request: OptimizeRequest): Promise<OptimizeResponse>`

Optimizes smart contract code for better performance and gas efficiency.

**Parameters:**
- `request`: Optimization request containing contract code and options

**Returns:**
- `Promise<OptimizeResponse>`: Optimized code and summary of changes

**Example:**
```typescript
const result = await client.optimizeContract({
  contract_code: 'contract Test { }',
  optimization_level: 'basic',
  target_gas_reduction: 20
});
console.log(`Gas reduction: ${result.optimization_summary.gas_reduction_percent}%`);
```

##### `healthCheck(): Promise<HealthResponse>`

Checks the health status of the API service.

**Returns:**
- `Promise<HealthResponse>`: Health status information

**Example:**
```typescript
const health = await client.healthCheck();
console.log(`API status: ${health.status}`);
```

##### `updateApiKey(apiKey: string): void`

Updates the API key for authentication.

**Parameters:**
- `apiKey`: New API key

**Example:**
```typescript
client.updateApiKey('new-api-key');
```

##### `updateBaseURL(baseURL: string): void`

Updates the base URL for the API.

**Parameters:**
- `baseURL`: New base URL

**Example:**
```typescript
client.updateBaseURL('https://staging-api.kaldrix.com');
```

##### `withConfig(config: Partial<DevAssistantClientConfig>): DevAssistantClient`

Creates a new client instance with modified configuration.

**Parameters:**
- `config`: Partial configuration to override

**Returns:**
- `DevAssistantClient`: New client instance

**Example:**
```typescript
const stagingClient = client.withConfig({
  baseURL: 'https://staging-api.kaldrix.com',
  apiKey: 'staging-key'
});
```

### Data Types

#### OptimizeRequest

```typescript
interface OptimizeRequest {
  contract_code: string;
  optimization_level?: 'basic' | 'aggressive' | 'maximum';
  target_gas_reduction?: number;
}
```

#### AnalysisResponse

```typescript
interface AnalysisResponse {
  contract_id: string;
  analysis_timestamp: string;
  issues_found: Issue[];
  gas_analysis: GasAnalysis;
  security_score: number;
  performance_score: number;
}
```

#### OptimizeResponse

```typescript
interface OptimizeResponse {
  optimized_code: string;
  optimization_summary: OptimizationSummary;
  warnings: string[];
  optimization_timestamp: string;
}
```

#### Issue

```typescript
interface Issue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  line_number?: number;
  suggestion: string;
}
```

## Error Handling

The SDK provides comprehensive error handling with custom error types:

```typescript
import { DevAssistantClient, DevAssistantError, isDevAssistantError } from '@kaldrix/dev-assistant-client';

try {
  const analysis = await client.analyzeContract('invalid-contract');
} catch (error) {
  if (isDevAssistantError(error)) {
    console.error(`API Error (${error.code}): ${error.message}`);
    console.error(`Status: ${error.statusCode}`);
    if (error.details) {
      console.error('Details:', error.details);
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Error Types

- `DevAssistantError`: API-related errors with status codes and error details
- `NetworkError`: Network-related issues (timeouts, connection failures)
- `ValidationError`: Request validation failures

## Advanced Usage

### Retry Logic

For resilient operations, you can use the retry utility:

```typescript
import { withRetry } from '@kaldrix/dev-assistant-client';

const analysis = await withRetry(
  () => client.analyzeContract('contract-id'),
  3, // max retries
  1000 // base delay in ms
);
```

### Custom Configuration

```typescript
const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com',
  apiKey: 'your-api-key',
  timeout: 60000, // 60 seconds timeout
  headers: {
    'X-Organization-ID': 'your-org-id',
    'X-Environment': 'production'
  }
});
```

### Using Generated API

For advanced use cases, you can access the auto-generated API directly:

```typescript
import { DevAssistantClient, Configuration, ContractsApi } from '@kaldrix/dev-assistant-client';

const config = new Configuration({
  basePath: 'https://api.kaldrix.com',
  accessToken: 'your-api-key'
});

const contractsApi = new ContractsApi(config);
const analysis = await contractsApi.analyzeContract('contract-id');
```

## Testing

Run tests with:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test -- --coverage
```

## Auto-Generation

This SDK is automatically generated from the OpenAPI specification. To regenerate:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Regenerate the client:
   ```bash
   npm run generate:clean
   ```

3. Build the package:
   ```bash
   npm run build
   ```

## Building

```bash
npm run build
```

This will compile the TypeScript code and generate type definitions in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on the GitHub repository or contact the development team at dev@kaldrix.com.