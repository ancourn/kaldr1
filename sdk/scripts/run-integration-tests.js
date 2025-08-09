#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk').default;
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const program = new Command();

program
  .name('run-integration-tests')
  .description('Run integration tests for KALDRIX SDKs')
  .option('--rust', 'Run Rust SDK integration tests only')
  .option('--typescript', 'Run TypeScript SDK integration tests only')
  .option('--all', 'Run both Rust and TypeScript SDK integration tests')
  .option('--api-url <url>', 'API URL to test against', 'http://localhost:3000')
  .option('--start-server', 'Start the development server before running tests')
  .option('--stop-server', 'Stop the development server after running tests')
  .option('--timeout <ms>', 'Test timeout in milliseconds', '30000')
  .parse();

const options = program.opts();

const PROJECT_ROOT = path.dirname(__dirname);

async function checkServerHealth(apiUrl, timeout = 5000) {
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      timeout: timeout,
    });
    
    if (response.ok) {
      const health = await response.json();
      return health.status === 'healthy';
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function startDevelopmentServer() {
  console.log(chalk.blue('🚀 Starting development server...'));
  
  try {
    // Start the server in the background
    const serverProcess = execSync('npm run dev', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      detached: true,
    });
    
    // Wait for server to start
    console.log(chalk.yellow('⏳ Waiting for server to start...'));
    
    for (let i = 0; i < 30; i++) {
      if (await checkServerHealth(options.apiUrl)) {
        console.log(chalk.green('✅ Server is healthy and ready!'));
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(chalk.red('❌ Server failed to start within timeout'));
    return false;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to start server: ${error.message}`));
    return false;
  }
}

async function stopDevelopmentServer() {
  console.log(chalk.blue('🛑 Stopping development server...'));
  
  try {
    // Find and kill the development server process
    execSync('pkill -f "nodemon.*server.ts" || true', {
      stdio: 'inherit',
    });
    
    console.log(chalk.green('✅ Server stopped'));
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not stop server gracefully'));
  }
}

async function runTypeScriptIntegrationTests() {
  console.log(chalk.yellow('📝 Running TypeScript SDK integration tests...'));
  
  const tsDir = path.join(PROJECT_ROOT, 'typescript-client');
  
  try {
    // Check if TypeScript SDK exists
    if (!await fs.pathExists(tsDir)) {
      throw new Error('TypeScript SDK directory not found');
    }
    
    // Set environment variable for API URL
    process.env.TEST_API_URL = options.apiUrl;
    
    // Change to TypeScript SDK directory
    process.chdir(tsDir);
    
    // Install dependencies if needed
    if (!await fs.pathExists('node_modules')) {
      console.log(chalk.blue('📦 Installing TypeScript dependencies...'));
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Run integration tests
    console.log(chalk.blue('🧪 Running integration tests...'));
    execSync('npm test -- --testPathPattern=integration', {
      stdio: 'inherit',
      timeout: parseInt(options.timeout),
      env: { ...process.env, TEST_API_URL: options.apiUrl }
    });
    
    console.log(chalk.green('✅ TypeScript integration tests completed!'));
    return true;
    
  } catch (error) {
    console.error(chalk.red(`❌ TypeScript integration tests failed: ${error.message}`));
    return false;
  } finally {
    // Change back to original directory
    process.chdir(PROJECT_ROOT);
  }
}

async function runRustIntegrationTests() {
  console.log(chalk.yellow('🦀 Running Rust SDK integration tests...'));
  
  const rustDir = path.join(PROJECT_ROOT, 'rust-client');
  
  try {
    // Check if Rust SDK exists
    if (!await fs.pathExists(rustDir)) {
      throw new Error('Rust SDK directory not found');
    }
    
    // Check if cargo is available
    try {
      execSync('cargo --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Cargo is not available');
    }
    
    // Change to Rust SDK directory
    process.chdir(rustDir);
    
    // Set environment variable for API URL
    process.env.TEST_API_URL = options.apiUrl;
    
    // Run integration tests
    console.log(chalk.blue('🧪 Running integration tests...'));
    execSync('cargo test --test integration', {
      stdio: 'inherit',
      timeout: parseInt(options.timeout),
      env: { ...process.env, TEST_API_URL: options.apiUrl }
    });
    
    console.log(chalk.green('✅ Rust integration tests completed!'));
    return true;
    
  } catch (error) {
    console.error(chalk.red(`❌ Rust integration tests failed: ${error.message}`));
    return false;
  } finally {
    // Change back to original directory
    process.chdir(PROJECT_ROOT);
  }
}

async function generateTestReport(results) {
  console.log(chalk.blue('📊 Generating test report...'));
  
  const report = {
    timestamp: new Date().toISOString(),
    apiUrl: options.apiUrl,
    results: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length,
    }
  };
  
  const reportPath = path.join(PROJECT_ROOT, 'integration-test-report.json');
  await fs.writeJson(reportPath, report, { spaces: 2 });
  
  console.log(chalk.green(`📄 Test report saved to: ${reportPath}`));
  
  // Print summary
  console.log('');
  console.log(chalk.blue('📋 Test Summary:'));
  console.log(chalk.gray(`   Total tests: ${report.summary.total}`));
  console.log(chalk.gray(`   Passed: ${report.summary.passed}`));
  console.log(chalk.gray(`   Failed: ${report.summary.failed}`));
  
  if (report.summary.failed > 0) {
    console.log('');
    console.log(chalk.red('❌ Failed tests:'));
    Object.entries(results).forEach(([sdk, result]) => {
      if (!result.success) {
        console.log(chalk.gray(`   - ${sdk}: ${result.error}`));
      }
    });
  }
}

async function main() {
  console.log(chalk.cyan('🧪 KALDRIX SDK Integration Tests'));
  console.log(chalk.cyan('=============================='));
  
  const runRust = options.rust || options.all;
  const runTypeScript = options.typescript || options.all;
  
  if (!runRust && !runTypeScript) {
    console.log(chalk.yellow('📋 No SDK specified, running both...'));
    options.all = true;
    return main();
  }
  
  console.log(chalk.blue('📋 Test Configuration:'));
  console.log(chalk.gray(`   API URL: ${options.apiUrl}`));
  console.log(chalk.gray(`   Rust SDK: ${runRust ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`   TypeScript SDK: ${runTypeScript ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`   Start server: ${options.startServer ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`   Stop server: ${options.stopServer ? 'Yes' : 'No'}`));
  console.log('');
  
  let serverStarted = false;
  const results = {};
  
  try {
    // Start server if requested
    if (options.startServer) {
      serverStarted = await startDevelopmentServer();
      if (!serverStarted) {
        console.error(chalk.red('❌ Failed to start server, aborting tests'));
        process.exit(1);
      }
    }
    
    // Check server health
    console.log(chalk.blue('🔍 Checking server health...'));
    const isHealthy = await checkServerHealth(options.apiUrl);
    
    if (!isHealthy) {
      console.error(chalk.red('❌ Server is not healthy, aborting tests'));
      console.error(chalk.yellow('💡 Make sure the server is running or use --start-server'));
      process.exit(1);
    }
    
    console.log(chalk.green('✅ Server is healthy!'));
    console.log('');
    
    // Run TypeScript tests
    if (runTypeScript) {
      results.typescript = {
        success: await runTypeScriptIntegrationTests(),
        error: null,
      };
      if (!results.typescript.success) {
        results.typescript.error = 'TypeScript integration tests failed';
      }
    }
    
    // Run Rust tests
    if (runRust) {
      results.rust = {
        success: await runRustIntegrationTests(),
        error: null,
      };
      if (!results.rust.success) {
        results.rust.error = 'Rust integration tests failed';
      }
    }
    
    // Generate test report
    await generateTestReport(results);
    
    // Check if all tests passed
    const allPassed = Object.values(results).every(r => r.success);
    
    if (allPassed) {
      console.log('');
      console.log(chalk.green('🎉 All integration tests passed!'));
    } else {
      console.log('');
      console.log(chalk.red('❌ Some integration tests failed'));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ Integration tests failed: ${error.message}`));
    process.exit(1);
  } finally {
    // Stop server if requested and we started it
    if (options.stopServer && serverStarted) {
      await stopDevelopmentServer();
    }
  }
}

main();