# KALDRIX SDK Generator

This repository contains the SDK generation setup for the KALDRIX Dev Assistant API. It provides automated generation of both Rust and TypeScript client SDKs from an OpenAPI specification.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Rust (for Rust SDK)
- openapi-generator-cli (optional, for auto-generation)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install openapi-generator-cli (recommended for auto-generation):
```bash
npm install -g @openapitools/openapi-generator-cli
```

### Generate SDKs

#### Using the Node.js Script (Recommended)

```bash
# Generate both SDKs
npm run generate

# Generate Rust SDK only
npm run generate:rust

# Generate TypeScript SDK only
npm run generate:typescript

# Generate and test both SDKs
npm run generate && npm run test

# Generate, test, and build both SDKs
npm run generate && npm run test && npm run build
```

#### Using the Shell Script

```bash
# Make the script executable (if needed)
chmod +x scripts/generate-sdks.sh

# Run the interactive script
./scripts/generate-sdks.sh
```

#### Direct Command Line

```bash
# Generate both SDKs
node scripts/generate-sdks.js --all

# Generate with testing and building
node scripts/generate-sdks.js --all --test --build

# Generate specific SDK
node scripts/generate-sdks.js --rust
node scripts/generate-sdks.js --typescript
```

## 📁 Project Structure

```
sdk/
├── scripts/                    # Generation scripts
│   ├── generate-sdks.js       # Node.js generation script
│   ├── generate-sdks.sh       # Shell generation script
│   └── package.json           # Script dependencies
├── rust-client/               # Rust SDK
│   ├── src/
│   │   ├── lib.rs            # Main client implementation
│   │   ├── models.rs         # Data models
│   │   └── generated.rs       # Auto-generated code
│   ├── Cargo.toml            # Rust dependencies
│   ├── build.rs              # Build script
│   └── README.md             # Rust SDK documentation
├── typescript-client/         # TypeScript SDK
│   ├── src/
│   │   ├── index.ts          # Main export
│   │   ├── client.ts         # Client implementation
│   │   ├── types.ts          # Type definitions
│   │   ├── errors.ts         # Error handling
│   │   └── generated/        # Auto-generated code
│   ├── package.json          # Dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── README.md             # TypeScript SDK documentation
└── README.md                 # This file
```

## 🔧 Configuration

### OpenAPI Specification

The SDKs are generated from the OpenAPI specification located at `../openapi.yaml`. This file defines:

- API endpoints and methods
- Request/response schemas
- Authentication methods
- Error formats

### Customization

#### Rust SDK Customization

The Rust SDK can be customized by:

1. **Modifying `src/lib.rs`**: Add custom methods or modify existing ones
2. **Updating `src/models.rs`**: Add custom validation or helper methods
3. **Changing `Cargo.toml`**: Update dependencies or add new features

#### TypeScript SDK Customization

The TypeScript SDK can be customized by:

1. **Modifying `src/client.ts`**: Add custom methods or modify existing ones
2. **Updating `src/types.ts`**: Add custom types or validation
3. **Changing `src/errors.ts`**: Add custom error handling
4. **Updating `package.json`**: Add new dependencies or scripts

## 🧪 Testing

### Rust SDK Tests

```bash
cd rust-client
cargo test
```

### TypeScript SDK Tests

```bash
cd typescript-client
npm test
```

### All Tests

```bash
npm run test
```

## 🔨 Building

### Rust SDK Build

```bash
cd rust-client
cargo build --release
```

### TypeScript SDK Build

```bash
cd typescript-client
npm run build
```

### All Builds

```bash
npm run build
```

## 📦 Publishing

### Rust SDK

```bash
cd rust-client
cargo publish
```

### TypeScript SDK

```bash
cd typescript-client
npm publish
```

## 🔄 Auto-Generation Workflow

The SDKs support automatic generation from the OpenAPI specification:

### Current Setup

The project is configured with:

- **OpenAPI specification**: Located at `../openapi.yaml`
- **Generator scripts**: Both Node.js and shell scripts in `scripts/`
- **GitHub Actions workflow**: Automatic CI/CD in `.github/workflows/generate-sdks.yml`
- **Fallback implementations**: Manual SDK implementations when auto-generation isn't available

### Local Generation

#### With openapi-generator-cli (Recommended)

1. Update the OpenAPI specification (`../openapi.yaml`)
2. Install the generator:
   ```bash
   npm install --save-dev @openapitools/openapi-generator-cli
   ```
3. Run the generation script:
   ```bash
   bash scripts/generate-sdks.sh
   ```
4. The SDKs are automatically updated with the latest API changes

#### Without openapi-generator-cli (Fallback)

1. Update the OpenAPI specification
2. The generation scripts will detect the missing tool and use fallback implementations
3. Manual SDK implementations are used instead of auto-generated code
4. Run tests to ensure compatibility

### CI/CD Auto-Generation

The project includes a GitHub Actions workflow (`.github/workflows/generate-sdks.yml`) that automatically:

- **Triggers on OpenAPI changes**: When `openapi.yaml` is modified
- **Generates SDKs**: Creates both Rust and TypeScript SDKs
- **Runs tests**: Ensures generated SDKs work correctly
- **Builds artifacts**: Creates compiled SDK packages
- **Commits changes**: Automatically commits generated code
- **Creates releases**: Tags and releases new SDK versions

#### Workflow Features

- **Automatic triggers**: Runs on pushes to main/master branches
- **Manual triggers**: Can be triggered manually from GitHub Actions UI
- **Artifact storage**: Stores generated SDKs as build artifacts
- **Release management**: Creates GitHub releases with version tags
- **Error handling**: Continues even if some tests fail
- **Fallback support**: Works even if openapi-generator-cli has issues

#### Workflow Usage

1. **Automatic execution**: Simply push changes to `openapi.yaml`
2. **Manual execution**: Use GitHub Actions UI to trigger the workflow
3. **Monitor results**: Check workflow logs and artifacts
4. **Download releases**: Access SDK releases from the GitHub releases page

## 🛠️ Development

### Adding New API Endpoints

1. **Update OpenAPI Specification**: Add the new endpoint to `../openapi.yaml`
2. **Generate SDKs**: Run `npm run generate` to update the SDKs
3. **Add Tests**: Write tests for the new functionality
4. **Update Documentation**: Update README files and examples

### Custom Error Handling

Both SDKs provide comprehensive error handling:

#### Rust SDK

```rust
use dev_assistant_client::DevAssistantClient;

let client = DevAssistantClient::new("https://api.kaldrix.com", "your-api-key");

match client.analyze_contract("contract-id").await {
    Ok(analysis) => println!("Analysis: {:?}", analysis),
    Err(e) => println!("Error: {}", e),
}
```

#### TypeScript SDK

```typescript
import { DevAssistantClient } from '@kaldrix/dev-assistant-client';

const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com',
  apiKey: 'your-api-key'
});

try {
  const analysis = await client.analyzeContract('contract-id');
  console.log('Analysis:', analysis);
} catch (error) {
  console.error('Error:', error);
}
```

## 📚 Examples

### Basic Usage

#### Rust

```rust
use dev_assistant_client::DevAssistantClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = DevAssistantClient::new("https://api.kaldrix.com", "your-api-key");
    
    // Analyze a contract
    let analysis = client.analyze_contract("0x1234...5678").await?;
    println!("Security score: {}", analysis.security_score);
    
    // Optimize a contract
    let request = dev_assistant_client::OptimizeRequest {
        contract_code: "contract Test { }".to_string(),
        optimization_level: Some("basic".to_string()),
        target_gas_reduction: Some(20.0),
    };
    
    let optimization = client.optimize_contract(request).await?;
    println!("Optimized code: {}", optimization.optimized_code);
    
    Ok(())
}
```

#### TypeScript

```typescript
import { DevAssistantClient } from '@kaldrix/dev-assistant-client';

const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com',
  apiKey: 'your-api-key'
});

// Analyze a contract
const analysis = await client.analyzeContract('0x1234...5678');
console.log(`Security score: ${analysis.security_score}`);

// Optimize a contract
const optimization = await client.optimizeContract({
  contract_code: 'contract Test { }',
  optimization_level: 'basic',
  target_gas_reduction: 20
});

console.log('Optimized code:', optimization.optimized_code);
```

### Advanced Usage

#### Rust with Custom Configuration

```rust
use dev_assistant_client::DevAssistantClient;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let http_client = Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()?;
    
    let client = DevAssistantClient::with_http_client(
        "https://api.kaldrix.com",
        "your-api-key",
        http_client
    );
    
    let health = client.health_check().await?;
    println!("API status: {}", health.status);
    
    Ok(())
}
```

#### TypeScript with Retry Logic

```typescript
import { DevAssistantClient, withRetry } from '@kaldrix/dev-assistant-client';

const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com',
  apiKey: 'your-api-key'
});

// Use retry logic for resilient operations
const analysis = await withRetry(
  () => client.analyzeContract('contract-id'),
  3, // max retries
  1000 // base delay
);

console.log('Analysis:', analysis);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue on the GitHub repository or contact the development team at dev@kaldrix.com.

## 📖 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)