# KALDRIX SDK Examples

This directory contains practical examples demonstrating how to use the KALDRIX Dev Assistant SDKs in both Rust and TypeScript.

## 📁 Available Examples

### Rust Examples

#### `rust-basic-usage.rs`
Comprehensive example showing:
- Client initialization and configuration
- Health checks
- Contract analysis with detailed results
- Contract optimization with gas reduction analysis
- Error handling patterns
- Client configuration updates
- Custom client creation

**To run:**
```bash
cd rust-client
cargo run --example basic-usage
```

### TypeScript Examples

#### `typescript-basic-usage.ts`
Comprehensive example showing:
- Client initialization with custom configuration
- Health checks
- Contract analysis with issue reporting
- Contract optimization with warnings
- Error handling with custom error types
- Retry logic for resilient operations
- Batch processing
- Concurrent operations
- Rate limiting simulation

**To run:**
```bash
cd typescript-client
npm run example:basic
```

## 🚀 Getting Started

### Prerequisites

- **Rust Examples**: Rust toolchain installed
- **TypeScript Examples**: Node.js 16+ and npm installed

### Setup

1. **Install dependencies**:
   ```bash
   # For Rust
   cd rust-client
   cargo build
   
   # For TypeScript
   cd typescript-client
   npm install
   ```

2. **Configure API credentials**:
   Replace `"your-api-key"` in the examples with your actual API key.

3. **Set the correct base URL**:
   Update the `baseURL` to point to your KALDRIX API instance.

## 📋 Example Categories

### 1. Basic Operations
- Health checks
- Contract analysis
- Contract optimization

### 2. Error Handling
- API error handling
- Network error handling
- Validation error handling
- Custom error types

### 3. Advanced Patterns
- Retry logic
- Batch processing
- Concurrent operations
- Rate limiting
- Configuration management

### 4. Real-world Scenarios
- Processing multiple contracts
- Handling partial failures
- Monitoring API health
- Optimizing contract performance

## 🔧 Customization

### Adapting Examples for Your Use Case

1. **Update API endpoints**: Modify the `baseURL` to match your deployment
2. **Add custom headers**: Include additional authentication or tracking headers
3. **Implement custom logic**: Add business-specific validation or processing
4. **Add logging**: Integrate with your logging system
5. **Add monitoring**: Add performance metrics and error tracking

### Common Customizations

#### Adding Custom Headers
```typescript
const client = new DevAssistantClient({
    baseURL: 'https://api.kaldrix.com',
    apiKey: 'your-api-key',
    headers: {
        'X-Organization-ID': 'your-org-id',
        'X-Environment': 'production',
        'X-Request-ID': generateRequestId(),
    }
});
```

#### Adding Retry Logic
```typescript
import { withRetry } from '@kaldrix/dev-assistant-client';

const result = await withRetry(
    () => client.analyzeContract(contractId),
    5, // max retries
    2000 // base delay
);
```

#### Adding Custom Error Handling
```typescript
try {
    const result = await client.analyzeContract(contractId);
    // Process successful result
} catch (error) {
    if (error instanceof DevAssistantError) {
        // Handle API errors
        if (error.statusCode === 429) {
            // Handle rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            return client.analyzeContract(contractId);
        }
    }
    // Handle other errors
    throw error;
}
```

## 🧪 Testing Examples

### Running Tests
```bash
# Rust tests
cd rust-client
cargo test

# TypeScript tests
cd typescript-client
npm test
```

### Writing Your Own Tests
```typescript
import { DevAssistantClient } from '@kaldrix/dev-assistant-client';

describe('Custom Integration Tests', () => {
    let client: DevAssistantClient;

    beforeEach(() => {
        client = new DevAssistantClient({
            baseURL: process.env.API_BASE_URL || 'https://api.kaldrix.com',
            apiKey: process.env.API_KEY || 'test-key',
        });
    });

    test('should analyze contract successfully', async () => {
        const analysis = await client.analyzeContract('test-contract-id');
        expect(analysis.contract_id).toBe('test-contract-id');
        expect(analysis.security_score).toBeGreaterThanOrEqual(0);
        expect(analysis.security_score).toBeLessThanOrEqual(100);
    });
});
```

## 📊 Performance Considerations

### Batch Processing
For processing multiple contracts, use batch operations:
```typescript
const contractIds = ['id1', 'id2', 'id3'];
const results = await Promise.allSettled(
    contractIds.map(id => client.analyzeContract(id))
);
```

### Concurrent Operations
Use `Promise.all` for independent operations:
```typescript
const [health, analysis] = await Promise.all([
    client.healthCheck(),
    client.analyzeContract(contractId),
]);
```

### Rate Limiting
Implement rate limiting for high-volume operations:
```typescript
async function analyzeWithRateLimit(contractIds: string[]) {
    const results = [];
    for (const id of contractIds) {
        const result = await client.analyzeContract(id);
        results.push(result);
        // Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return results;
}
```

## 🚨 Error Handling Best Practices

### 1. Always Handle Errors
```typescript
try {
    const result = await client.analyzeContract(contractId);
    // Process result
} catch (error) {
    console.error('Analysis failed:', error);
    // Implement fallback or retry logic
}
```

### 2. Use Specific Error Types
```typescript
import { DevAssistantError, isDevAssistantError } from '@kaldrix/dev-assistant-client';

if (isDevAssistantError(error)) {
    // Handle API-specific errors
    switch (error.statusCode) {
        case 401:
            // Handle authentication errors
            break;
        case 429:
            // Handle rate limiting
            break;
        case 404:
            // Handle not found errors
            break;
    }
}
```

### 3. Implement Retry Logic
```typescript
import { withRetry } from '@kaldrix/dev-assistant-client';

const result = await withRetry(
    () => client.analyzeContract(contractId),
    3, // max retries
    1000 // base delay in ms
);
```

## 📝 Logging and Monitoring

### Adding Logging
```typescript
const client = new DevAssistantClient({
    baseURL: 'https://api.kaldrix.com',
    apiKey: 'your-api-key',
});

// Add request interceptor for logging
client.http.interceptors.request.use(request => {
    console.log('API Request:', {
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString(),
    });
    return request;
});

// Add response interceptor for logging
client.http.interceptors.response.use(response => {
    console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        timestamp: new Date().toISOString(),
    });
    return response;
});
```

## 🔄 Integration Patterns

### 1. CI/CD Integration
```yaml
# .github/workflows/sdk-test.yml
name: SDK Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Run Rust tests
        run: cd rust-client && cargo test
      - name: Run TypeScript tests
        run: cd typescript-client && npm install && npm test
```

### 2. Application Integration
```typescript
// src/services/devAssistant.ts
import { DevAssistantClient } from '@kaldrix/dev-assistant-client';

export class DevAssistantService {
    private client: DevAssistantClient;

    constructor() {
        this.client = new DevAssistantClient({
            baseURL: process.env.DEV_ASSISTANT_API_URL,
            apiKey: process.env.DEV_ASSISTANT_API_KEY,
        });
    }

    async analyzeContract(contractId: string) {
        try {
            return await this.client.analyzeContract(contractId);
        } catch (error) {
            // Log error and implement retry logic
            console.error('Contract analysis failed:', error);
            throw new Error('Failed to analyze contract');
        }
    }
}
```

## 🤝 Contributing

To contribute new examples:

1. **Create a new example file** in the appropriate language directory
2. **Follow the existing structure** and naming conventions
3. **Add comprehensive comments** explaining the concepts
4. **Include error handling** for all operations
5. **Add the example to this README** with a clear description
6. **Test your example** thoroughly before submitting

## 📞 Support

For questions or issues with the examples:
1. Check the main SDK documentation
2. Review the OpenAPI specification
3. Open an issue on the GitHub repository
4. Contact the development team at dev@kaldrix.com

## 📚 Additional Resources

- [KALDRIX API Documentation](https://docs.kaldrix.com)
- [OpenAPI Specification](../openapi.yaml)
- [Rust SDK Documentation](../rust-client/README.md)
- [TypeScript SDK Documentation](../typescript-client/README.md)