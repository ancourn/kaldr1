# New Language SDK Template

This is a template for adding new programming language support to the KALDRIX SDK system.

## Directory Structure

```
sdk/
├── new-language-client/
│   ├── src/
│   │   ├── generated/    # Auto-generated code from OpenAPI
│   │   └── lib/          # Manual implementation (fallback)
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── examples/
│   │   ├── basic-usage.NEW_LANG_EXT
│   │   └── advanced-usage.NEW_LANG_EXT
│   ├── README.md
│   ├── package.NEW_LANG_EXT  # Language-specific package config
│   ├── openapitools.json   # OpenAPI Generator config
│   └── .gitignore
```

## Required Files

### 1. Package Configuration (`package.NEW_LANG_EXT`)

```json
{
  "name": "@kaldrix/dev-assistant-client",
  "version": "1.0.0",
  "description": "New Language SDK for KALDRIX Dev Assistant API",
  "main": "src/index.NEW_LANG_EXT",
  "scripts": {
    "build": "NEW_LANG_BUILD_COMMAND",
    "test": "NEW_LANG_TEST_COMMAND",
    "test:integration": "NEW_LANG_INTEGRATION_TEST_COMMAND"
  },
  "dependencies": {
    "http-client": "^1.0.0"
  },
  "devDependencies": {
    "testing-framework": "^1.0.0"
  },
  "keywords": ["kaldrix", "sdk", "api", "new-language"],
  "author": "KALDRIX Team",
  "license": "MIT"
}
```

### 2. OpenAPI Generator Config (`openapitools.json`)

```json
{
  "generator-cli": {
    "version": "6.6.0",
    "generators": {
      "new-language": {
        "output": "#{cwd}/src/generated",
        "glob": "openapi.yaml",
        "templateDir": "#{cwd}/templates"
      }
    }
  }
}
```

### 3. Main SDK File (`src/index.NEW_LANG_EXT`)

```new_language
// Main SDK entry point
class DevAssistantClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3000';
    this.timeout = config.timeout || 30000;
    this.initializeClient();
  }
  
  initializeClient() {
    // Initialize HTTP client
    this.httpClient = createHttpClient({
      baseURL: this.baseURL,
      timeout: this.timeout
    });
  }
  
  // Health Check
  async health() {
    try {
      const response = await this.httpClient.get('/api/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
  
  // Chat Completion
  async chat(request) {
    try {
      const response = await this.httpClient.post('/api/chat', request);
      return response.data;
    } catch (error) {
      throw new Error(`Chat completion failed: ${error.message}`);
    }
  }
  
  // Image Generation
  async image(request) {
    try {
      const response = await this.httpClient.post('/api/image', request);
      return response.data;
    } catch (error) {
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }
  
  // Web Search
  async search(request) {
    try {
      const response = await this.httpClient.post('/api/search', request);
      return response.data;
    } catch (error) {
      throw new Error(`Web search failed: ${error.message}`);
    }
  }
}

// Export the client
module.exports = { DevAssistantClient };
```

### 4. Integration Tests (`tests/integration/health.test.NEW_LANG_EXT`)

```new_language
const { DevAssistantClient } = require('../../src/index.NEW_LANG_EXT');

describe('DevAssistantClient Integration Tests', () => {
  let client;
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  
  beforeAll(() => {
    client = new DevAssistantClient({
      baseURL: baseUrl,
      timeout: 30000
    });
  });
  
  describe('Health Check', () => {
    test('should return health status', async () => {
      const health = await client.health();
      
      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeDefined();
      expect(health.services).toBeDefined();
    });
  });
  
  describe('Chat API', () => {
    test('should send chat message and receive response', async () => {
      const request = {
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?'
          }
        ]
      };
      
      const response = await client.chat(request);
      
      expect(response.success).toBe(true);
      expect(response.response).toBeDefined();
      expect(typeof response.response).toBe('string');
    });
  });
  
  describe('Image Generation API', () => {
    test('should generate image from prompt', async () => {
      const request = {
        prompt: 'A beautiful sunset over mountains',
        size: '1024x1024'
      };
      
      const response = await client.image(request);
      
      expect(response.success).toBe(true);
      expect(response.image).toBeDefined();
      expect(response.size).toBe('1024x1024');
    });
  });
  
  describe('Web Search API', () => {
    test('should perform web search', async () => {
      const request = {
        query: 'What is artificial intelligence?',
        num: 5
      };
      
      const response = await client.search(request);
      
      expect(response.success).toBe(true);
      expect(response.results).toBeDefined();
      expect(Array.isArray(response.results)).toBe(true);
    });
  });
});
```

### 5. Usage Example (`examples/basic-usage.NEW_LANG_EXT`)

```new_language
const { DevAssistantClient } = require('../src/index.NEW_LANG_EXT');

// Initialize the client
const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com'
});

async function main() {
  try {
    // Health check
    console.log('Checking API health...');
    const health = await client.health();
    console.log('API Status:', health.status);
    
    // Chat completion
    console.log('\\nSending chat message...');
    const chatResponse = await client.chat({
      messages: [
        {
          role: 'user',
          content: 'Hello! Can you help me with something?'
        }
      ]
    });
    console.log('Assistant:', chatResponse.response);
    
    // Image generation
    console.log('\\nGenerating image...');
    const imageResponse = await client.image({
      prompt: 'A cute cat playing with a ball of yarn',
      size: '1024x1024'
    });
    console.log('Image generated:', imageResponse.success ? 'Success' : 'Failed');
    
    // Web search
    console.log('\\nPerforming web search...');
    const searchResponse = await client.search({
      query: 'Latest developments in AI',
      num: 3
    });
    console.log(`Found ${searchResponse.results.length} results`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
main();
```

### 6. README Template

```markdown
# New Language SDK for KALDRIX Dev Assistant API

A type-safe, modern SDK for interacting with the KALDRIX Dev Assistant API in New Language.

## Features

- ✅ Type-safe API client
- ✅ Async/await support
- ✅ Comprehensive error handling
- ✅ Health check endpoint
- ✅ Chat completion
- ✅ Image generation
- ✅ Web search
- ✅ Integration tests

## Installation

```bash
NEW_LANG_INSTALL_COMMAND kaldrix-dev-assistant
```

## Quick Start

```new_language
const { DevAssistantClient } = require('kaldrix-dev-assistant');

const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com'
});

// Health check
const health = await client.health();
console.log(health.status);

// Chat completion
const response = await client.chat({
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});
console.log(response.response);
```

## API Reference

### Health Check

```new_language
const health = await client.health();
```

### Chat Completion

```new_language
const response = await client.chat({
  messages: [
    { role: 'user', content: 'Your message here' }
  ]
});
```

### Image Generation

```new_language
const image = await client.image({
  prompt: 'A beautiful landscape',
  size: '1024x1024'
});
```

### Web Search

```new_language
const results = await client.search({
  query: 'Search query',
  num: 10
});
```

## Testing

```bash
# Run unit tests
NEW_LANG_TEST_COMMAND

# Run integration tests
NEW_LANG_INTEGRATION_TEST_COMMAND
```

## Examples

See the `examples/` directory for more usage examples.

## Contributing

Please read our [contributing guidelines](../../CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License.

---

🤖 Generated with [Claude Code](https://claude.ai/code)
```

## Implementation Steps

1. **Copy this template** to `sdk/new-language-client/`
2. **Replace placeholders** with language-specific values:
   - `NEW_LANG_EXT` → File extension for your language
   - `NEW_LANG_BUILD_COMMAND` → Build command for your language
   - `NEW_LANG_TEST_COMMAND` → Test command for your language
   - `NEW_LANG_INTEGRATION_TEST_COMMAND` → Integration test command
   - `NEW_LANG_INSTALL_COMMAND` → Install command for your language
3. **Update generator scripts** to include your language
4. **Add CI/CD configuration** for your language
5. **Test the implementation** thoroughly
6. **Update documentation** with language-specific details

## Next Steps

After creating the basic structure:

1. Add the language to `sdk/scripts/generate-sdks.js`
2. Update `.github/workflows/generate-sdks.yml`
3. Update `.github/workflows/publish-sdks.yml`
4. Add to `package.json` scripts
5. Update `sdk/scripts/run-integration-tests.js`
6. Update `sdk/scripts/version-manager.js`
7. Update `sdk/scripts/publish-sdks.js`

---

🤖 Generated with [Claude Code](https://claude.ai/code)