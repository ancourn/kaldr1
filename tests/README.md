# KALDRIX Testing Infrastructure

This document provides an overview of the comprehensive testing infrastructure implemented for the KALDRIX Quantum DAG Blockchain project.

## 🧪 Test Categories

### 1. Unit Tests
**Location:** `tests/hooks/`, `tests/components/`
**Purpose:** Test individual functions, components, and hooks in isolation.

#### Hook Tests
- `useValidators.test.ts` - Tests validator data management and statistics
- `useTransactions.test.ts` - Tests transaction data fetching and processing
- `useDag.test.ts` - Tests DAG node and edge data management
- `useBundleStats.test.ts` - Tests bundle statistics and timeline data
- `useTokenTracker.test.ts` - Tests token tracking and holder management

#### Running Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test file
npx vitest run tests/hooks/useValidators.test.ts

# Run with coverage
npm run test:coverage
```

### 2. Integration Tests
**Location:** `tests/integration/`
**Purpose:** Test interactions between multiple components and services.

#### Integration Test Files
- `error-simulation.test.ts` - Tests error handling and edge cases
- `smart-contracts/contract-deployment.test.ts` - Tests smart contract deployment
- `parallel-processing/parallel-processing.test.ts` - Tests parallel processing capabilities
- `monitoring/performance-monitoring.test.ts` - Tests performance monitoring
- `api/health-endpoint.test.ts` - Tests API health endpoints

#### Running Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npx vitest run tests/integration/error-simulation.test.ts
```

### 3. End-to-End (E2E) Tests
**Location:** `tests/e2e/` (to be implemented with Playwright)
**Purpose:** Test complete user flows and scenarios.

#### Running E2E Tests
```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run E2E tests
npm run test:e2e

# Run in headed mode for debugging
npx playwright test --headed
```

### 4. Performance Tests
**Location:** `tests/performance/`
**Purpose:** Test system performance under various load conditions.

#### Performance Test Scenarios
- Validator Data Load Test
- Transaction Processing Load Test
- DAG Node Processing Load Test
- Mixed Operations Load Test
- High Frequency Load Test

#### Running Performance Tests
```bash
# Run performance tests
npm run test:performance

# Run specific performance test
node tests/performance/load-test.js
```

### 5. Security Tests
**Location:** Integrated with CI/CD pipeline
**Purpose:** Test security vulnerabilities and compliance.

#### Running Security Tests
```bash
# Run security audit
npm run security:scan

# Run detailed audit
npm audit --audit-level=moderate
```

## 🏗️ Test Infrastructure Components

### Mock Data Factories
**Location:** `tests/mocks/data-factories.ts`
**Purpose:** Generate realistic test data for various scenarios.

#### Available Factories
- `createMockValidator()` - Generate validator data
- `createMockTransaction()` - Generate transaction data
- `createMockDagNode()` - Generate DAG node data
- `createMockBundle()` - Generate bundle data
- `createMockTokenInfo()` - Generate token information
- `createMockTokenHolder()` - Generate token holder data
- `createMockTokenTransfer()` - Generate token transfer data

#### Usage Example
```typescript
import { createMockValidators, createMockTransactions } from '../mocks/data-factories'

const validators = createMockValidators(10)
const transactions = createMockTransactions(20)
```

### Error Simulation
**Location:** `tests/utils/error-simulation.ts`
**Purpose:** Simulate various error conditions and edge cases.

#### Available Simulators
- `NetworkErrorSimulator` - Simulate network errors
- `EdgeCaseTester` - Test edge cases and unusual conditions
- `PerformanceTester` - Measure performance and run load tests

#### Usage Example
```typescript
import { networkErrorSimulator, edgeCaseTester } from '../utils/error-simulation'

// Simulate network errors
networkErrorSimulator.addSimulation('/api/validators', {
  type: 'network',
  probability: 0.3
})

// Test with edge cases
await edgeCaseTester.testWithLargeData(async (size) => {
  return processLargeDataset(size)
}, 10000)
```

### Service Mocks
**Location:** `tests/mocks/service-mocks.ts`
**Purpose:** Mock external services and API calls.

#### Available Mocks
- `mockRpcService` - Mock RPC service calls
- `mockApiHandlers` - Mock API endpoint handlers
- `mockWebSocketService` - Mock WebSocket connections
- `errorSimulator` - Simulate various error conditions

#### Usage Example
```typescript
import { mockRpcService, testSetup } from '../mocks/service-mocks'

// Setup test environment
testSetup.beforeEach()

// Mock service responses
mockRpcService.getValidators.mockResolvedValue(createMockApiResponse(validators))
```

## 📊 Test Coverage

### Coverage Configuration
**File:** `.nycrc.json`
- **Target Coverage:** 80% for branches, lines, functions, and statements
- **Reporters:** text, html, lcov, json
- **Output Directory:** `./coverage`

### Coverage Reports
- **HTML Report:** `coverage/index.html`
- **LCOV Report:** `coverage/lcov.info`
- **JSON Report:** `coverage/coverage-final.json`

### Viewing Coverage
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report in browser
open coverage/index.html
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow
**File:** `.github/workflows/test.yml`

#### Workflow Jobs
1. **Test** - Unit tests with coverage reporting
2. **Integration Test** - Integration tests
3. **E2E Test** - End-to-end tests
4. **Performance Test** - Performance and load tests
5. **Security Scan** - Security vulnerability scanning

#### Triggers
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches

### Test Matrix
- **Node Versions:** 18.x, 20.x
- **Operating System:** Ubuntu Latest
- **Parallel Execution:** Multiple jobs run concurrently

## 🔧 Test Configuration

### Vitest Configuration
**File:** `vitest.config.ts`

#### Key Settings
- **Environment:** jsdom for DOM testing
- **Globals:** Enabled for global test functions
- **Setup File:** `tests/setup.ts`
- **Coverage:** Integrated with v8 provider

### Test Setup
**File:** `tests/setup.ts`

#### Mocks Included
- Next.js router and navigation
- Window APIs (matchMedia, IntersectionObserver, ResizeObserver)
- WebSocket connections
- Console methods (reduced noise)
- CSS imports
- shadcn/ui components
- Lucide React icons

## 📝 Test Writing Guidelines

### 1. Test Structure
```typescript
describe('Component/Hook/Service', () => {
  beforeEach(() => {
    // Setup test environment
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks()
  })

  it('should do something expected', () => {
    // Test implementation
    expect(result).toBe(expected)
  })

  it('should handle edge cases', async () => {
    // Test edge cases
    await expect(asyncOperation).resolves.toBe(expected)
  })
})
```

### 2. Mock Data Usage
```typescript
// Use factories for realistic test data
const validators = createMockValidators(5)
const transactions = createMockTransactions(10)

// Use error simulation for failure scenarios
networkErrorSimulator.addSimulation('/api/endpoint', {
  type: 'network',
  probability: 1.0
})
```

### 3. Async Testing
```typescript
it('should handle async operations', async () => {
  // Use waitFor for async operations
  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  // Test error handling
  await expect(asyncOperation).rejects.toThrow('Expected error')
})
```

### 4. Performance Testing
```typescript
it('should meet performance requirements', async () => {
  const result = await performanceTester.measure(
    'performance-test',
    async () => {
      return await expensiveOperation()
    }
  )

  expect(result.duration).toBeLessThan(1000) // 1 second threshold
})
```

## 🐛 Debugging Tests

### 1. Vitest UI
```bash
npm run test:ui
```
Provides a web interface for running and debugging tests interactively.

### 2. Console Output
- Use `console.log` sparingly for debugging
- Mock console methods in setup to reduce noise
- Use `vi.fn()` to spy on function calls

### 3. Test Isolation
- Each test runs in isolation
- Use `beforeEach` and `afterEach` for setup/teardown
- Mock external dependencies to ensure test reliability

## 📈 Test Metrics and Reporting

### 1. Coverage Metrics
- **Lines:** Percentage of code lines covered by tests
- **Branches:** Percentage of decision branches covered
- **Functions:** Percentage of functions covered
- **Statements:** Percentage of statements covered

### 2. Performance Metrics
- **Response Time:** Average time for operations to complete
- **Throughput:** Requests per second under load
- **Success Rate:** Percentage of successful operations
- **Memory Usage:** Memory consumption during tests

### 3. Error Metrics
- **Error Rate:** Percentage of failed operations
- **Recovery Time:** Time to recover from errors
- **Retry Success:** Success rate after retries

## 🔍 Best Practices

### 1. Test Naming
- Use descriptive test names that explain what is being tested
- Follow the pattern: "should [expected behavior] when [condition]"
- Use `describe` blocks to group related tests

### 2. Test Data
- Use factories instead of hardcoded test data
- Generate realistic data that matches production patterns
- Test with edge cases and boundary conditions

### 3. Assertions
- Use specific assertions that test exact behavior
- Test both positive and negative scenarios
- Include error handling and edge case testing

### 4. Mocking
- Mock external dependencies to isolate tests
- Use realistic mock data that matches API responses
- Test error scenarios by mocking failures

### 5. Performance
- Include performance tests for critical paths
- Set reasonable performance thresholds
- Monitor memory usage and resource consumption

## 🚀 Running Tests in Development

### 1. Watch Mode
```bash
npm test
```
Runs tests in watch mode, re-running on file changes.

### 2. Single Run
```bash
npm run test:run
```
Runs all tests once and exits.

### 3. Coverage Mode
```bash
npm run test:coverage
```
Runs tests with coverage reporting.

### 4. Debug Mode
```bash
npm run test:ui
```
Opens interactive test runner in browser.

## 📊 Test Results and Artifacts

### 1. Coverage Reports
- **HTML Report:** `coverage/index.html`
- **LCOV Report:** `coverage/lcov.info`
- **JSON Report:** `coverage/coverage-final.json`

### 2. Performance Reports
- **Load Test Results:** `performance-reports/load-test-report-[timestamp].txt`
- **Performance Metrics:** Available in CI/CD artifacts

### 3. Test Results
- **Integration Tests:** `test-results/`
- **E2E Tests:** `playwright-report/`
- **Performance Tests:** `performance-reports/`

## 🔧 Troubleshooting

### 1. Common Issues
- **Import Errors:** Check path aliases in `vitest.config.ts`
- **Mock Issues:** Verify mocks in `tests/setup.ts`
- **Timeout Errors:** Increase timeout in test configuration
- **Memory Issues:** Check for memory leaks in test setup

### 2. Debug Commands
```bash
# Check test configuration
npx vitest --config vitest.config.ts

# Run specific test with verbose output
npx vitest run tests/hooks/useValidators.test.ts --reporter=verbose

# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/vitest run
```

### 3. Performance Issues
- **Slow Tests:** Use mocking to reduce I/O operations
- **Memory Leaks:** Check for proper cleanup in `afterEach`
- **Flaky Tests:** Ensure proper test isolation and deterministic data

---

This testing infrastructure provides comprehensive coverage for the KALDRIX project, ensuring reliability, performance, and maintainability of the codebase.