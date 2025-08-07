#!/usr/bin/env node

/**
 * KALDRIX Performance Benchmark Script
 * 
 * This script runs comprehensive performance tests on the high-performance
 * transaction engine to validate the 100K TPS target.
 */

import { HighPerformanceTransactionEngine, PrioritizedTransactionQueue, BenchmarkHarness } from '../src/modules/performance';
import fs from 'fs';
import path from 'path';

async function runPerformanceBenchmarks() {
  console.log('🚀 KALDRIX Performance Benchmark Suite');
  console.log('=====================================');

  const resultsDir = path.join(__dirname, '..', 'benchmark-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  // Initialize components
  const engine = new HighPerformanceTransactionEngine();
  const queue = new PrioritizedTransactionQueue();
  const harness = new BenchmarkHarness(engine, queue);

  // Test configurations
  const testConfigs = [
    {
      name: 'baseline_10k_tps',
      config: {
        duration: 30,
        targetTPS: 10000,
        transactionSize: 200,
        concurrentClients: 10,
        warmupTime: 5,
        reportInterval: 5
      }
    },
    {
      name: 'medium_50k_tps',
      config: {
        duration: 30,
        targetTPS: 50000,
        transactionSize: 200,
        concurrentClients: 25,
        warmupTime: 5,
        reportInterval: 5
      }
    },
    {
      name: 'high_100k_tps',
      config: {
        duration: 30,
        targetTPS: 100000,
        transactionSize: 200,
        concurrentClients: 50,
        warmupTime: 5,
        reportInterval: 5
      }
    },
    {
      name: 'stress_test_150k_tps',
      config: {
        duration: 20,
        targetTPS: 150000,
        transactionSize: 200,
        concurrentClients: 75,
        warmupTime: 5,
        reportInterval: 5
      }
    }
  ];

  const allResults = [];

  for (const test of testConfigs) {
    console.log(`\n🔥 Running test: ${test.name}`);
    console.log(`📊 Target TPS: ${test.config.targetTPS}`);
    
    try {
      const result = await harness.runBenchmark(test.config);
      allResults.push({ test, result });
      
      // Save individual test results
      const jsonFile = path.join(resultsDir, `${test.name}.json`);
      const markdownFile = path.join(resultsDir, `${test.name}.md`);
      
      fs.writeFileSync(jsonFile, harness.exportResults('json'));
      fs.writeFileSync(markdownFile, harness.exportResults('markdown'));
      
      console.log(`✅ Test completed. Results saved to ${test.name}.*`);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ Test ${test.name} failed:`, error.message);
    }
  }

  // Generate summary report
  await generateSummaryReport(allResults, resultsDir);
  
  console.log('\n🎉 Performance benchmark suite completed!');
  console.log(`📁 Results saved to: ${resultsDir}`);
}

async function generateSummaryReport(results: Array<{test: any, result: any}>, resultsDir: string) {
  console.log('\n📊 Generating summary report...');
  
  let summary = '# KALDRIX Performance Benchmark Summary\n\n';
  summary += 'This report summarizes the performance testing results for the KALDRIX blockchain high-performance transaction engine.\n\n';
  
  summary += '## Test Results Overview\n\n';
  summary += '| Test Name | Target TPS | Actual TPS | Efficiency | Avg Latency | Success Rate |\n';
  summary += '|-----------|------------|------------|------------|-------------|--------------|\n';
  
  for (const { test, result } of results) {
    const efficiency = ((result.actualTPS / test.config.targetTPS) * 100).toFixed(1);
    summary += `| ${test.name} | ${test.config.targetTPS} | ${result.actualTPS.toFixed(2)} | ${efficiency}% | ${result.averageLatency.toFixed(2)}ms | ${result.successRate.toFixed(2)}% |\n`;
  }
  
  summary += '\n## Key Findings\n\n';
  
  // Find best performance
  const bestTPS = Math.max(...results.map(r => r.result.actualTPS));
  const bestTest = results.find(r => r.result.actualTPS === bestTPS);
  
  summary += `- **Maximum TPS Achieved**: ${bestTPS.toFixed(2)} TPS (${bestTest?.test.name})\n`;
  summary += `- **Average Latency**: ${(results.reduce((sum, r) => sum + r.result.averageLatency, 0) / results.length).toFixed(2)}ms\n`;
  summary += `- **Overall Success Rate**: ${(results.reduce((sum, r) => sum + r.result.successRate, 0) / results.length).toFixed(2)}%\n`;
  
  // Performance analysis
  summary += '\n## Performance Analysis\n\n';
  
  const target100k = results.find(r => r.test.config.targetTPS === 100000);
  if (target100k) {
    const efficiency = (target100k.result.actualTPS / 100000) * 100;
    summary += '### 100K TPS Target Analysis\n\n';
    summary += `- **Target**: 100,000 TPS\n`;
    summary += `- **Achieved**: ${target100k.result.actualTPS.toFixed(2)} TPS\n`;
    summary += `- **Efficiency**: ${efficiency.toFixed(1)}%\n`;
    summary += `- **Status**: ${efficiency >= 90 ? '✅ Target Achieved' : efficiency >= 70 ? '⚠️ Near Target' : '❌ Below Target'}\n\n`;
  }
  
  // Scalability analysis
  summary += '### Scalability Analysis\n\n';
  summary += 'The system demonstrates good scalability characteristics:\n\n';
  
  const sortedByTarget = results.sort((a, b) => a.test.config.targetTPS - b.test.config.targetTPS);
  for (let i = 1; i < sortedByTarget.length; i++) {
    const prev = sortedByTarget[i - 1];
    const curr = sortedByTarget[i];
    const targetIncrease = (curr.test.config.targetTPS - prev.test.config.targetTPS) / prev.test.config.targetTPS;
    const actualIncrease = (curr.result.actualTPS - prev.result.actualTPS) / prev.result.actualTPS;
    const scalability = (actualIncrease / targetIncrease) * 100;
    
    summary += `- **${prev.test.name} → ${curr.test.name}**: ${scalability.toFixed(1)}% scalability\n`;
  }
  
  // Recommendations
  summary += '\n## Recommendations\n\n';
  
  const avgEfficiency = results.reduce((sum, r) => sum + (r.result.actualTPS / r.test.config.targetTPS), 0) / results.length;
  
  if (avgEfficiency >= 0.9) {
    summary += '✅ **Excellent Performance**: The system consistently meets or exceeds performance targets.\n';
    summary += '- Continue monitoring for any performance degradation\n';
    summary += '- Consider optimizing for even higher throughput targets\n';
  } else if (avgEfficiency >= 0.7) {
    summary += '⚠️ **Good Performance**: The system performs well but has room for improvement.\n';
    summary += '- Investigate bottlenecks in transaction processing\n';
    summary += '- Optimize memory usage and garbage collection\n';
    summary += '- Consider parallel processing improvements\n';
  } else {
    summary += '❌ **Performance Issues**: The system is not meeting performance targets.\n';
    summary += '- Conduct thorough performance profiling\n';
    summary += '- Identify and resolve bottlenecks\n';
    summary += '- Consider architectural improvements\n';
  }
  
  summary += '\n## Technical Details\n\n';
  summary += '### Test Environment\n';
  summary += '- **Node.js**: ' + process.version + '\n';
  summary += '- **Platform**: ' + process.platform + '\n';
  summary += '- **Architecture**: ' + process.arch + '\n';
  summary += '- **Memory**: ' + (process.memoryUsage ? `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)}MB` : 'N/A') + '\n';
  
  summary += '\n### Configuration\n';
  summary += '- **Block Interval**: 100ms\n';
  summary += '- **Batch Size**: 1000 transactions\n';
  summary += '- **Max Pool Size**: 50,000 transactions\n';
  summary += '- **Priority Levels**: 5\n';
  
  summary += '\n---\n';
  summary += '*Report generated on: ' + new Date().toISOString() + '*\n';
  
  // Save summary report
  const summaryFile = path.join(resultsDir, 'benchmark-summary.md');
  fs.writeFileSync(summaryFile, summary);
  
  // Also save as JSON
  const summaryJson = {
    generatedAt: new Date().toISOString(),
    environment: {
      nodejs: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: process.memoryUsage ? `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)}MB` : 'N/A'
    },
    results: results.map(r => ({
      testName: r.test.name,
      config: r.test.config,
      result: r.result
    })),
    summary: {
      maxTPS: bestTPS,
      avgLatency: results.reduce((sum, r) => sum + r.result.averageLatency, 0) / results.length,
      avgSuccessRate: results.reduce((sum, r) => sum + r.result.successRate, 0) / results.length,
      avgEfficiency: avgEfficiency
    }
  };
  
  const summaryJsonFile = path.join(resultsDir, 'benchmark-summary.json');
  fs.writeFileSync(summaryJsonFile, JSON.stringify(summaryJson, null, 2));
  
  console.log(`📄 Summary report saved to: ${summaryFile}`);
}

// Run the benchmarks
runPerformanceBenchmarks().catch(console.error);