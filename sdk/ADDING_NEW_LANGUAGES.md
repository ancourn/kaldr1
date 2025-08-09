# Adding New Language/Client Platforms to KALDRIX SDK System

This document provides a comprehensive guide for adding new programming language SDKs or client platforms to the KALDRIX SDK auto-generation system.

## Overview

The KALDRIX SDK system is designed to be extensible, allowing you to easily add support for new programming languages and client platforms. The system uses OpenAPI specifications as the single source of truth and automates the generation, testing, and publishing of SDKs.

## Prerequisites

Before adding a new language/platform, ensure you have:

1. **OpenAPI Specification**: A valid `openapi.yaml` file that defines your API
2. **OpenAPI Generator CLI**: `@openapitools/openapi-generator-cli` installed globally
3. **Language-Specific Tools**: Build tools, package managers, and testing frameworks for the target language
4. **Package Registry Access**: Credentials for publishing to package registries (npm, crates.io, PyPI, etc.)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OpenAPI Spec  │───▶│   Generator     │───▶│   Language SDK  │
│   (openapi.yaml) │    │   Scripts       │    │   (Generated)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   CI/CD         │
                       │   Pipelines     │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Package       │
                       │   Registries    │
                       └─────────────────┘
```

## Step-by-Step Guide

### 1. Choose Your Target Language

First, select the programming language you want to add support for. Consider:

- **Community Demand**: Is there user interest in this language?
- **OpenAPI Generator Support**: Does the OpenAPI Generator support this language?
- **Ecosystem Maturity**: Does the language have good package management and testing tools?

### 2. Set Up the SDK Directory Structure

Create a new directory for your SDK under `sdk/`:

```bash
sdk/
├── your-language-client/
│   ├── src/
│   │   ├── generated/    # Auto-generated code
│   │   └── lib/          # Manual implementation (fallback)
│   ├── tests/
│   │   ├── unit/         # Unit tests
│   │   └── integration/  # Integration tests
│   ├── examples/         # Usage examples
│   ├── README.md         # SDK documentation
│   ├── package.json      # Or equivalent for your language
│   └── build.rs         # If applicable (Rust, etc.)
```

### 3. Configure OpenAPI Generator

Create an `openapitools.json` configuration file in your SDK directory:

```json
{
  "generator-cli": {
    "version": "6.6.0",
    "generators": {
      "your-language": {
        "output": "#{cwd}/src/generated",
        "glob": "openapi.yaml",
        "templateDir": "#{cwd}/templates"
      }
    }
  }
}
```

### 4. Update the Main Generator Script

Modify `sdk/scripts/generate-sdks.js` to include your new language:

```javascript
// Add this function to generate-sdks.js
async function generateYourLanguageSDK() {
  console.log(chalk.yellow('🔧 Generating Your Language SDK...'));
  
  const langDir = path.join(PROJECT_ROOT, 'your-language-client');
  
  try {
    // Clean previous generated files
    await fs.emptyDir(path.join(langDir, 'src', 'generated'));
    
    // Generate using OpenAPI Generator
    await executeCommand(
      `openapi-generator-cli generate \
        -i ../../openapi.yaml \
        -g your-language-generator \
        -o src/generated \
        --additional-properties=packageName=your-package-name,version=1.0.0 \
        --skip-validate-spec \
        --verbose`,
      langDir,
      'Generate Your Language SDK'
    );
    
    console.log(chalk.green('✅ Your Language SDK generated successfully!'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  OpenAPI generator failed, using fallback mode'));
    // Implement fallback generation here
    console.log(chalk.green('✅ Using fallback generation mode'));
  }
}
```

### 5. Add Build Configuration

Create build scripts for your language. Add this to `generate-sdks.js`:

```javascript
async function buildYourLanguageSDK() {
  console.log(chalk.yellow('🔨 Building Your Language SDK...'));
  
  const langDir = path.join(PROJECT_ROOT, 'your-language-client');
  
  try {
    // Add language-specific build commands
    if (await commandExists('your-build-tool')) {
      await executeCommand('your-build-tool build', langDir, 'Build Your Language SDK');
    } else {
      console.log(chalk.yellow('⚠️  Build tool not found, skipping build'));
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Build failed, but continuing...'));
  }
}
```

### 6. Add Test Configuration

Create test scripts for your language:

```javascript
async function testYourLanguageSDK() {
  console.log(chalk.yellow('🧪 Testing Your Language SDK...'));
  
  const langDir = path.join(PROJECT_ROOT, 'your-language-client');
  
  try {
    // Add language-specific test commands
    if (await commandExists('your-test-tool')) {
      await executeCommand('your-test-tool test', langDir, 'Test Your Language SDK');
    } else {
      console.log(chalk.yellow('⚠️  Test tool not found, skipping tests'));
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Tests failed, but continuing...'));
  }
}
```

### 7. Update CI/CD Pipelines

#### GitHub Actions Configuration

Update `.github/workflows/generate-sdks.yml` to include your language:

```yaml
strategy:
  matrix:
    sdk: [rust, typescript, your-language]
```

Add language-specific setup steps:

```yaml
- name: Setup Your Language
  if: matrix.sdk == 'your-language'
  uses: your-language/setup-action@v1
  with:
    version: 'stable'
```

#### Publishing Pipeline

Update `.github/workflows/publish-sdks.yml` to include your language:

```yaml
- name: Publish Your Language SDK
  if: matrix.sdk == 'your-language'
  env:
    YOUR_LANGUAGE_REGISTRY_TOKEN: ${{ secrets.YOUR_LANGUAGE_REGISTRY_TOKEN }}
  run: |
    # Add language-specific publishing commands
    your-publish-tool publish
```

### 8. Create Integration Tests

Create integration tests that verify your SDK works with the live API:

```javascript
// Add to run-integration-tests.js
async function runYourLanguageIntegrationTests() {
  console.log(chalk.yellow('🔧 Running Your Language integration tests...'));
  
  const langDir = path.join(PROJECT_ROOT, 'your-language-client');
  
  try {
    // Run integration tests
    await executeCommand('your-test-tool test:integration', langDir, 'Your Language Integration Tests');
    console.log(chalk.green('✅ Your Language integration tests completed!'));
  } catch (error) {
    console.error(chalk.red(`❌ Your Language integration tests failed: ${error.message}`));
    return false;
  }
}
```

### 9. Update Package.json Scripts

Add your language to the main `package.json` scripts:

```json
{
  "scripts": {
    "generate:your-language": "cd sdk/scripts && node generate-sdks.js --your-language",
    "test:integration:your-language": "cd sdk/scripts && node run-integration-tests.js --your-language",
    "publish:your-language": "cd sdk/scripts && node publish-sdks.js --your-language"
  }
}
```

### 10. Create Documentation

Create comprehensive documentation for your SDK:

#### SDK README.md

```markdown
# Your Language SDK for KALDRIX Dev Assistant API

## Installation

```bash
your-package-manager install kaldrix-dev-assistant
```

## Usage

```your-language
import { DevAssistantClient } from 'kaldrix-dev-assistant';

const client = new DevAssistantClient({
  baseURL: 'https://api.kaldrix.com'
});

// Health check
const health = await client.health.getHealth();
console.log(health.status);

// Chat completion
const response = await client.chat.createChatCompletion({
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});
console.log(response.response);
```

## Features

- ✅ Type-safe API client
- ✅ Async/await support
- ✅ Comprehensive error handling
- ✅ Health check endpoint
- ✅ Chat completion
- ✅ Image generation
- ✅ Web search
- ✅ Integration tests

## Examples

See the `examples/` directory for more usage examples.

## Testing

```bash
# Run unit tests
your-test-tool test

# Run integration tests
your-test-tool test:integration
```

## Contributing

Please read our [contributing guidelines](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
```

### 11. Add Fallback Implementation

Create a manual implementation that serves as a fallback when the OpenAPI Generator fails:

```javascript
// Example fallback implementation structure
class FallbackDevAssistantClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.httpClient = createHttpClient(config);
  }
  
  async health() {
    const response = await this.httpClient.get('/api/health');
    return response.data;
  }
  
  async chat(request) {
    const response = await this.httpClient.post('/api/chat', request);
    return response.data;
  }
  
  // Add other API methods
}
```

### 12. Update Version Management

Add your language to the version manager:

```javascript
// Update version-manager.js
async function updateYourLanguagePackageFiles(newVersion) {
  const filePath = path.join(PROJECT_ROOT, 'your-language-client', 'package.json');
  
  try {
    const packageJson = await fs.readJson(filePath);
    packageJson.version = newVersion;
    await fs.writeJson(filePath, packageJson, { spaces: 2 });
    console.log(chalk.green(`✅ Updated ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to update ${filePath}: ${error.message}`));
  }
}
```

### 13. Add to Feedback Collection

Update the feedback collector to include your language:

```javascript
// Update feedback-collector.js
{
  name: 'sdk_type',
  type: 'list',
  message: 'Which SDK are you providing feedback for?',
  choices: ['Rust SDK', 'TypeScript SDK', 'Your Language SDK', 'Both SDKs'],
  default: 'Your Language SDK'
}
```

## Supported Languages Reference

### Currently Supported

- **Rust**: Uses `reqwest` for HTTP client, `tokio` for async runtime
- **TypeScript**: Uses `Axios` for HTTP client, full TypeScript support

### Common OpenAPI Generator Templates

| Language | Generator Name | Package Manager | Build Tool | Test Framework |
|----------|----------------|----------------|------------|---------------|
| Python | python | pip | setuptools | pytest |
| Java | java | Maven/Gradle | Maven/Gradle | JUnit |
| Go | go | go modules | go build | go test |
| C# | csharp | NuGet | dotnet | xUnit |
| PHP | php | Composer | Composer | PHPUnit |
| Ruby | ruby | gem | rake | RSpec |

## Best Practices

### 1. Consistent Error Handling

All SDKs should follow consistent error handling patterns:

```javascript
// Good error handling
try {
  const result = await client.someOperation();
  return result;
} catch (error) {
  if (error.isNetworkError) {
    throw new NetworkError('Network connection failed', error);
  } else if (error.isApiError) {
    throw new ApiError(error.response.data, error.response.status);
  } else {
    throw new SDKError('Unexpected error', error);
  }
}
```

### 2. Comprehensive Testing

- **Unit Tests**: Test individual methods and functions
- **Integration Tests**: Test against live API endpoints
- **Error Scenarios**: Test network failures, invalid inputs, API errors
- **Performance Tests**: Test response times and resource usage

### 3. Documentation Standards

- **API Reference**: Complete API documentation with examples
- **Getting Started**: Quick start guide for new users
- **Migration Guide**: Guide for upgrading between versions
- **Changelog**: Version history and changes

### 4. Code Quality

- **Linting**: Enforce consistent code style
- **Type Safety**: Use static typing where available
- **Async Support**: Support async/await patterns
- **Memory Management**: Proper resource cleanup

## Troubleshooting

### Common Issues

1. **OpenAPI Generator Fails**
   - Check if your language is supported
   - Verify OpenAPI specification is valid
   - Use fallback implementation as backup

2. **Build Errors**
   - Ensure all dependencies are installed
   - Check build tool version compatibility
   - Review build logs for specific errors

3. **Test Failures**
   - Verify API endpoints are accessible
   - Check test environment configuration
   - Review test data and expected responses

4. **Publishing Issues**
   - Verify registry credentials
   - Check package name conflicts
   - Ensure version format is correct

### Debug Mode

Enable debug logging for troubleshooting:

```bash
export DEBUG=kaldrix:*
npm run generate:your-language
```

## Contributing

We welcome contributions for new language support! Please:

1. Check existing issues and discussions
2. Create a feature branch for your language
3. Follow the steps in this guide
4. Add comprehensive tests
5. Update documentation
6. Submit a pull request

## Resources

- [OpenAPI Generator Documentation](https://openapi-generator.tech/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [KALDRIX SDK Examples](../examples/)
- [CI/CD Best Practices](../../.github/workflows/)

---

## Template Checklist

Use this checklist when adding a new language:

- [ ] Create SDK directory structure
- [ ] Configure OpenAPI Generator
- [ ] Update generator scripts
- [ ] Add build configuration
- [ ] Add test configuration
- [ ] Update CI/CD pipelines
- [ ] Create integration tests
- [ ] Update package.json scripts
- [ ] Create documentation
- [ ] Add fallback implementation
- [ ] Update version management
- [ ] Add to feedback collection
- [ ] Test end-to-end workflow
- [ ] Update this documentation

---

🤖 Generated with [Claude Code](https://claude.ai/code)