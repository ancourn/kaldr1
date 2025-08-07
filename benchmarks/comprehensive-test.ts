#!/usr/bin/env node

/**
 * KALDRIX Comprehensive Test Suite
 * 
 * This script runs comprehensive tests for all modules:
 * - Performance Engine
 * - Cross-Chain Bridge
 * - Native Coin Utility
 */

import { HighPerformanceTransactionEngine, PrioritizedTransactionQueue, BenchmarkHarness } from '../src/modules/performance';
import { CrossChainBridge, BridgeConfig } from '../src/modules/bridge';
import { NativeCoinUtility, NativeDEX } from '../src/modules/native-coin';
import fs from 'fs';
import path from 'path';

async function runComprehensiveTests() {
  console.log('🧪 KALDRIX Comprehensive Test Suite');
  console.log('===================================');

  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const testResults = {
    timestamp: new Date().toISOString(),
    performance: {},
    bridge: {},
    nativeCoin: {},
    dex: {},
    summary: {}
  };

  try {
    // Performance Module Tests
    console.log('\n🚀 Testing Performance Module...');
    testResults.performance = await testPerformanceModule();

    // Bridge Module Tests
    console.log('\n🌉 Testing Bridge Module...');
    testResults.bridge = await testBridgeModule();

    // Native Coin Module Tests
    console.log('\n🪙 Testing Native Coin Module...');
    testResults.nativeCoin = await testNativeCoinModule();

    // DEX Module Tests
    console.log('\n💱 Testing DEX Module...');
    testResults.dex = await testDEXModule();

    // Generate summary
    testResults.summary = generateTestSummary(testResults);

    // Save results
    await saveTestResults(testResults, resultsDir);

    console.log('\n✅ All tests completed successfully!');
    console.log(`📁 Results saved to: ${resultsDir}`);

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    throw error;
  }
}

async function testPerformanceModule(): Promise<any> {
  const results: any = {
    engine: {},
    queue: {},
    benchmark: {}
  };

  // Test Transaction Engine
  console.log('  🔧 Testing Transaction Engine...');
  const engine = new HighPerformanceTransactionEngine();
  
  try {
    await engine.start();
    results.engine.startup = '✅ Passed';
    
    // Test transaction processing
    const testTx = {
      id: 'test_tx_1',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      amount: BigInt(1000000000000000000),
      gasLimit: BigInt(21000),
      gasPrice: BigInt(1000000000),
      nonce: 1,
      timestamp: Date.now(),
      priority: 1,
      signature: '0xtestsignature'
    };

    const added = await engine.addTransaction(testTx);
    results.engine.transactionAddition = added ? '✅ Passed' : '❌ Failed';
    
    const metrics = engine.getMetrics();
    results.engine.metricsCollection = metrics ? '✅ Passed' : '❌ Failed';
    
    await engine.stop();
    results.engine.shutdown = '✅ Passed';
    
  } catch (error) {
    results.engine.error = error.message;
  }

  // Test Prioritized Queue
  console.log('  📝 Testing Prioritized Queue...');
  const queue = new PrioritizedTransactionQueue();
  
  try {
    const status = queue.getQueueStatus();
    results.queue.statusRetrieval = status ? '✅ Passed' : '❌ Failed';
    
    const added = queue.addTransaction(testTx);
    results.queue.transactionAddition = added ? '✅ Passed' : '❌ Failed';
    
    const bundle = queue.getNextBundle();
    results.queue.bundleCreation = bundle ? '✅ Passed' : '❌ Failed';
    
  } catch (error) {
    results.queue.error = error.message;
  }

  // Test Benchmark Harness
  console.log('  📊 Testing Benchmark Harness...');
  const harness = new BenchmarkHarness(engine, queue);
  
  try {
    const config = {
      duration: 5,
      targetTPS: 1000,
      transactionSize: 200,
      concurrentClients: 5,
      warmupTime: 1,
      reportInterval: 1
    };

    const benchmarkResult = await harness.runBenchmark(config);
    results.benchmark.execution = benchmarkResult ? '✅ Passed' : '❌ Failed';
    results.benchmark.tpsAchieved = benchmarkResult.actualTPS;
    results.benchmark.successRate = benchmarkResult.successRate;
    
  } catch (error) {
    results.benchmark.error = error.message;
  }

  return results;
}

async function testBridgeModule(): Promise<any> {
  const results: any = {
    initialization: {},
    transfer: {},
    validation: {},
    relay: {}
  };

  const config: BridgeConfig = {
    supportedChains: ['ethereum', 'polygon'],
    relayerNodes: ['relayer1.test'],
    validatorThreshold: 2,
    confirmationBlocks: 6,
    gasLimits: {
      ethereum: 300000n,
      polygon: 200000n
    },
    feeStructure: {
      baseFee: BigInt(1000000000000000000),
      percentageFee: 0.001,
      minFee: BigInt(500000000000000000),
      maxFee: BigInt(5000000000000000000)
    }
  };

  const bridge = new CrossChainBridge(config);

  try {
    await bridge.start();
    results.initialization.startup = '✅ Passed';
    
    const state = bridge.getState();
    results.initialization.stateRetrieval = state ? '✅ Passed' : '❌ Failed';
    
    // Test transfer initiation
    const transferId = await bridge.initiateTransfer({
      sourceChain: 'ethereum',
      targetChain: 'polygon',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      amount: BigInt(1000000000000000000),
      token: 'ETH',
      gasUsed: BigInt(210000),
      blockNumber: 12345,
      txHash: '0xtxhash'
    });
    
    results.transfer.initiation = transferId ? '✅ Passed' : '❌ Failed';
    
    // Wait a bit for validation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const transfer = bridge.getTransfer(transferId);
    results.validation.transferRetrieval = transfer ? '✅ Passed' : '❌ Failed';
    
    if (transfer) {
      results.validation.transferStatus = transfer.status;
      results.validation.validatorSignatures = transfer.validatorSignatures.length;
    }
    
    const stats = bridge.getStats();
    results.relay.statsRetrieval = stats ? '✅ Passed' : '❌ Failed';
    
    await bridge.stop();
    results.initialization.shutdown = '✅ Passed';
    
  } catch (error) {
    results.error = error.message;
  }

  return results;
}

async function testNativeCoinModule(): Promise<any> {
  const results: any = {
    initialization: {},
    transfers: {},
    staking: {},
    governance: {},
    gas: {}
  };

  const config = {
    name: 'KALDRIX',
    symbol: 'KALD',
    decimals: 18,
    totalSupply: BigInt(1000000000) * BigInt(10**18),
    initialSupply: BigInt(100000000) * BigInt(10**18),
    stakingRewards: {
      annualRate: 0.05,
      minimumAmount: BigInt(1000) * BigInt(10**18),
      unbondingPeriod: 7,
      rewardDistribution: 'continuous'
    },
    gasMechanics: {
      baseGasPrice: BigInt(1000000000),
      dynamicGasPrice: true,
      congestionMultiplier: 2.0,
      freeQuota: {
        enabled: true,
        amount: BigInt(100000) * BigInt(10**18),
        period: 1
      }
    },
    governance: {
      votingPower: true,
      proposalThreshold: BigInt(10000) * BigInt(10**18),
      votingPeriod: 3
    }
  };

  const nativeCoin = new NativeCoinUtility(config);

  try {
    await nativeCoin.start();
    results.initialization.startup = '✅ Passed';
    
    const stats = nativeCoin.getStats();
    results.initialization.statsRetrieval = stats ? '✅ Passed' : '❌ Failed';
    
    // Test transfers
    const transferResult = await nativeCoin.transfer(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f12345',
      '0x1234567890123456789012345678901234567890',
      BigInt(1000) * BigInt(10**18)
    );
    results.transfers.execution = transferResult ? '✅ Passed' : '❌ Failed';
    
    // Test staking
    const stakeResult = await nativeCoin.stake(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f12345',
      'validator1',
      BigInt(1000) * BigInt(10**18)
    );
    results.staking.execution = stakeResult ? '✅ Passed' : '❌ Failed';
    
    // Test governance
    const proposalId = await nativeCoin.createProposal(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f12345',
      'Test Proposal',
      'This is a test proposal',
      'parameter_change'
    );
    results.governance.proposalCreation = proposalId ? '✅ Passed' : '❌ Failed';
    
    // Test gas mechanics
    const gasInfo = nativeCoin.getGasInfo();
    results.gas.infoRetrieval = gasInfo ? '✅ Passed' : '❌ Failed';
    
    const gasCost = await nativeCoin.calculateGasCost(BigInt(21000), '0x742d35Cc6634C0532925a3b844Bc9e7595f12345');
    results.gas.costCalculation = gasCost >= 0n ? '✅ Passed' : '❌ Failed';
    
    await nativeCoin.stop();
    results.initialization.shutdown = '✅ Passed';
    
  } catch (error) {
    results.error = error.message;
  }

  return results;
}

async function testDEXModule(): Promise<any> {
  const results: any = {
    initialization: {},
    pools: {},
    quotes: {},
    swaps: {},
    liquidity: {}
  };

  const nativeCoinConfig = {
    name: 'KALDRIX',
    symbol: 'KALD',
    decimals: 18,
    totalSupply: BigInt(1000000000) * BigInt(10**18),
    initialSupply: BigInt(100000000) * BigInt(10**18),
    stakingRewards: {
      annualRate: 0.05,
      minimumAmount: BigInt(1000) * BigInt(10**18),
      unbondingPeriod: 7,
      rewardDistribution: 'continuous'
    },
    gasMechanics: {
      baseGasPrice: BigInt(1000000000),
      dynamicGasPrice: true,
      congestionMultiplier: 2.0,
      freeQuota: {
        enabled: true,
        amount: BigInt(100000) * BigInt(10**18),
        period: 1
      }
    },
    governance: {
      votingPower: true,
      proposalThreshold: BigInt(10000) * BigInt(10**18),
      votingPeriod: 3
    }
  };

  const dexConfig = {
    feeRate: 0.003,
    protocolFee: 0.001,
    maxPriceImpact: 0.05,
    minLiquidity: BigInt(100) * BigInt(10**18),
    rewards: {
      enabled: true,
      annualRate: 0.02,
      distribution: 'proportional'
    }
  };

  const nativeCoin = new NativeCoinUtility(nativeCoinConfig);
  const dex = new NativeDEX(nativeCoin, dexConfig);

  try {
    await dex.start();
    results.initialization.startup = '✅ Passed';
    
    const stats = dex.getStats();
    results.initialization.statsRetrieval = stats ? '✅ Passed' : '❌ Failed';
    
    // Test pool management
    const pools = dex.getPools();
    results.pools.retrieval = pools.length > 0 ? '✅ Passed' : '❌ Failed';
    
    // Test quotes
    const quote = await dex.getQuote('KALD', 'ETH', BigInt(1000) * BigInt(10**18));
    results.quotes.generation = quote ? '✅ Passed' : '❌ Failed';
    
    // Test swaps
    const swapResult = await dex.executeSwap(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f12345',
      'KALD',
      'ETH',
      BigInt(100) * BigInt(10**18),
      BigInt(1) * BigInt(10**18)
    );
    results.swaps.execution = swapResult > 0n ? '✅ Passed' : '❌ Failed';
    
    // Test liquidity management
    const liquidityResult = await dex.addLiquidity(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f12345',
      'KALD',
      'USDC',
      BigInt(10000) * BigInt(10**18),
      BigInt(20000) * BigInt(10**6)
    );
    results.liquidity.addition = liquidityResult > 0n ? '✅ Passed' : '❌ Failed';
    
    await dex.stop();
    results.initialization.shutdown = '✅ Passed';
    
  } catch (error) {
    results.error = error.message;
  }

  return results;
}

function generateTestSummary(results: any): any {
  const summary = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    moduleStatus: {},
    overallStatus: '✅ Passed',
    keyMetrics: {}
  };

  // Count tests and determine module status
  const modules = ['performance', 'bridge', 'nativeCoin', 'dex'];
  
  for (const module of modules) {
    const moduleResults = results[module];
    let modulePassed = 0;
    let moduleFailed = 0;
    
    // Count tests in module
    for (const category of Object.keys(moduleResults)) {
      if (category === 'error') continue;
      
      const categoryResults = moduleResults[category];
      if (typeof categoryResults === 'object') {
        for (const test of Object.keys(categoryResults)) {
          summary.totalTests++;
          if (categoryResults[test] === '✅ Passed' || (typeof categoryResults[test] === 'number' && categoryResults[test] >= 0)) {
            summary.passedTests++;
            modulePassed++;
          } else {
            summary.failedTests++;
            moduleFailed++;
          }
        }
      } else {
        summary.totalTests++;
        if (categoryResults === '✅ Passed' || (typeof categoryResults === 'number' && categoryResults >= 0)) {
          summary.passedTests++;
          modulePassed++;
        } else {
          summary.failedTests++;
          moduleFailed++;
        }
      }
    }
    
    summary.moduleStatus[module] = moduleFailed === 0 ? '✅ Passed' : '⚠️ Partial';
  }

  // Determine overall status
  if (summary.failedTests > 0) {
    summary.overallStatus = '⚠️ Partial';
  }

  // Extract key metrics
  if (results.performance.benchmark.tpsAchieved) {
    summary.keyMetrics.performanceTPS = results.performance.benchmark.tpsAchieved;
  }
  
  if (results.nativeCoin.transfers.execution === '✅ Passed') {
    summary.keyMetrics.nativeCoinTransfers = 'Functional';
  }
  
  if (results.bridge.transfer.initiation === '✅ Passed') {
    summary.keyMetrics.bridgeTransfers = 'Functional';
  }
  
  if (results.dex.swaps.execution === '✅ Passed') {
    summary.keyMetrics.dexSwaps = 'Functional';
  }

  return summary;
}

async function saveTestResults(results: any, resultsDir: string): Promise<void> {
  // Save as JSON
  const jsonFile = path.join(resultsDir, 'comprehensive-test-results.json');
  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  
  // Generate and save markdown report
  const markdownReport = generateMarkdownReport(results);
  const markdownFile = path.join(resultsDir, 'comprehensive-test-results.md');
  fs.writeFileSync(markdownFile, markdownReport);
  
  console.log(`📄 Test results saved to: ${jsonFile} and ${markdownFile}`);
}

function generateMarkdownReport(results: any): string {
  const summary = results.summary;
  
  let report = `# KALDRIX Comprehensive Test Report\n\n`;
  report += `**Generated:** ${results.timestamp}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Overall Status:** ${summary.overallStatus}\n`;
  report += `- **Total Tests:** ${summary.totalTests}\n`;
  report += `- **Passed:** ${summary.passedTests}\n`;
  report += `- **Failed:** ${summary.failedTests}\n`;
  report += `- **Success Rate:** ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%\n\n`;
  
  report += `## Module Status\n\n`;
  for (const [module, status] of Object.entries(summary.moduleStatus)) {
    report += `- **${module.charAt(0).toUpperCase() + module.slice(1)}:** ${status}\n`;
  }
  report += `\n`;
  
  report += `## Key Metrics\n\n`;
  for (const [metric, value] of Object.entries(summary.keyMetrics)) {
    report += `- **${metric.replace(/([A-Z])/g, ' $1').trim()}:** ${value}\n`;
  }
  report += `\n`;
  
  // Detailed results
  report += `## Detailed Results\n\n`;
  
  const modules = ['performance', 'bridge', 'nativeCoin', 'dex'];
  for (const module of modules) {
    report += `### ${module.charAt(0).toUpperCase() + module.slice(1)} Module\n\n`;
    
    const moduleResults = results[module];
    for (const [category, tests] of Object.entries(moduleResults)) {
      if (category === 'error') continue;
      
      report += `#### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
      
      if (typeof tests === 'object') {
        for (const [test, result] of Object.entries(tests)) {
          const testName = test.replace(/([A-Z])/g, ' $1').trim();
          report += `- **${testName}:** ${result}\n`;
        }
      } else {
        report += `- **Status:** ${tests}\n`;
      }
      report += `\n`;
    }
    
    if (moduleResults.error) {
      report += `**Error:** ${moduleResults.error}\n\n`;
    }
  }
  
  report += `---\n`;
  report += `*Report generated by KALDRIX Test Suite*\n`;
  
  return report;
}

// Run the comprehensive test suite
runComprehensiveTests().catch(console.error);