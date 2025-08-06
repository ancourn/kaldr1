const { performanceTester, edgeCaseTester } = require('../utils/error-simulation')
const { 
  createMockValidators, 
  createMockTransactions, 
  createMockDagNodes, 
  createMockBundles,
  createMockTokenTransfers,
  createEdgeCaseData 
} = require('../mocks/data-factories')

async function runStressTests() {
  console.log('🔥 Starting Stress Tests...\n')

  const results = {
    tests: [],
    startTime: Date.now(),
    systemInfo: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    }
  }

  // Test 1: Memory Stress Test
  console.log('💾 Test 1: Memory Stress Test')
  try {
    const memoryBefore = process.memoryUsage()
    console.log(`   Memory Before: ${Math.round(memoryBefore.heapUsed / 1024 / 1024)}MB`)

    const result = await performanceTester.runLoadTest(
      'memory-stress-test',
      async () => {
        // Create large datasets to stress memory
        const validators = createMockValidators(1000)
        const transactions = createMockTransactions(5000)
        const nodes = createMockDagNodes(2000)
        const bundles = createMockBundles(1000)
        const transfers = createMockTokenTransfers(3000)
        
        return {
          validators: validators.length,
          transactions: transactions.length,
          nodes: nodes.length,
          bundles: bundles.length,
          transfers: transfers.length,
          totalItems: validators.length + transactions.length + nodes.length + bundles.length + transfers.length
        }
      },
      10,  // concurrent users
      30000 // duration in ms
    )

    const memoryAfter = process.memoryUsage()
    const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed
    
    console.log(`   Memory After: ${Math.round(memoryAfter.heapUsed / 1024 / 1024)}MB`)
    console.log(`   Memory Increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`)
    console.log(`   ✅ Memory Stress Test Completed`)
    console.log(`   📊 Results: ${result.totalRequests} requests, ${result.requestsPerSecond.toFixed(2)} RPS\n`)

    results.tests.push({
      name: 'Memory Stress Test',
      type: 'stress',
      result,
      memoryBefore,
      memoryAfter,
      memoryIncrease,
      success: true
    })
  } catch (error) {
    console.error(`   ❌ Memory Stress Test Failed: ${error.message}\n`)
    results.tests.push({
      name: 'Memory Stress Test',
      type: 'stress',
      error: error.message,
      success: false
    })
  }

  // Test 2: CPU Stress Test
  console.log('⚡ Test 2: CPU Stress Test')
  try {
    const result = await performanceTester.runLoadTest(
      'cpu-stress-test',
      async () => {
        // Perform CPU-intensive operations
        const start = Date.now()
        
        // Complex calculations
        let result = 0
        for (let i = 0; i < 100000; i++) {
          result += Math.sqrt(i) * Math.log(i + 1)
        }
        
        // Data processing
        const data = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: Math.random() * 1000,
          processed: false
        }))
        
        // Sort and process data
        data.sort((a, b) => a.value - b.value)
        const processed = data.map(item => ({
          ...item,
          processed: true,
          calculated: item.value * Math.PI
        }))
        
        return {
          calculationResult: result,
          processedItems: processed.length,
          processingTime: Date.now() - start
        }
      },
      20,  // concurrent users
      20000 // duration in ms
    )
    
    console.log(`   ✅ CPU Stress Test Completed`)
    console.log(`   📊 Results: ${result.totalRequests} requests, ${result.requestsPerSecond.toFixed(2)} RPS\n`)

    results.tests.push({
      name: 'CPU Stress Test',
      type: 'stress',
      result,
      success: true
    })
  } catch (error) {
    console.error(`   ❌ CPU Stress Test Failed: ${error.message}\n`)
    results.tests.push({
      name: 'CPU Stress Test',
      type: 'stress',
      error: error.message,
      success: false
    })
  }

  // Test 3: Concurrent Access Stress Test
  console.log('🔄 Test 3: Concurrent Access Stress Test')
  try {
    const sharedData = new Map()
    let counter = 0
    
    const result = await performanceTester.runLoadTest(
      'concurrent-access-test',
      async () => {
        // Simulate concurrent access to shared resources
        const id = Math.random().toString(36).substr(2, 9)
        const value = Math.random() * 1000
        
        // Simulate race condition potential
        sharedData.set(id, value)
        counter++
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
        
        const retrieved = sharedData.get(id)
        
        return {
          id,
          value,
          retrieved,
          counter,
          match: retrieved === value
        }
      },
      50,  // concurrent users
      25000 // duration in ms
    )
    
    console.log(`   ✅ Concurrent Access Stress Test Completed`)
    console.log(`   📊 Results: ${result.totalRequests} requests, ${result.requestsPerSecond.toFixed(2)} RPS`)
    console.log(`   📈 Shared Data Size: ${sharedData.size} items\n`)

    results.tests.push({
      name: 'Concurrent Access Stress Test',
      type: 'stress',
      result,
      sharedDataSize: sharedData.size,
      counter,
      success: true
    })
  } catch (error) {
    console.error(`   ❌ Concurrent Access Stress Test Failed: ${error.message}\n`)
    results.tests.push({
      name: 'Concurrent Access Stress Test',
      type: 'stress',
      error: error.message,
      success: false
    })
  }

  // Test 4: Large Dataset Processing Stress Test
  console.log('📊 Test 4: Large Dataset Processing Stress Test')
  try {
    const result = await performanceTester.runLoadTest(
      'large-dataset-test',
      async () => {
        // Process very large datasets
        const datasetSize = 10000
        const data = Array.from({ length: datasetSize }, (_, i) => ({
          id: i,
          value: Math.random() * 1000000,
          category: Math.floor(Math.random() * 10),
          timestamp: Date.now() - Math.random() * 86400000 // Random time in last 24h
        }))
        
        // Complex data processing
        const grouped = data.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = []
          }
          acc[item.category].push(item)
          return acc
        }, {})
        
        const aggregated = Object.keys(grouped).map(category => {
          const items = grouped[category]
          const sum = items.reduce((acc, item) => acc + item.value, 0)
          const avg = sum / items.length
          const max = Math.max(...items.map(item => item.value))
          const min = Math.min(...items.map(item => item.value))
          
          return {
            category,
            count: items.length,
            sum,
            avg,
            max,
            min
          }
        })
        
        // Sort by average value
        aggregated.sort((a, b) => b.avg - a.avg)
        
        return {
          datasetSize,
          categories: Object.keys(grouped).length,
          aggregatedStats: aggregated.length,
          topCategory: aggregated[0]?.category,
          topAverage: aggregated[0]?.avg
        }
      },
      5,   // concurrent users
      45000 // duration in ms
    )
    
    console.log(`   ✅ Large Dataset Processing Stress Test Completed`)
    console.log(`   📊 Results: ${result.totalRequests} requests, ${result.requestsPerSecond.toFixed(2)} RPS\n`)

    results.tests.push({
      name: 'Large Dataset Processing Stress Test',
      type: 'stress',
      result,
      success: true
    })
  } catch (error) {
    console.error(`   ❌ Large Dataset Processing Stress Test Failed: ${error.message}\n`)
    results.tests.push({
      name: 'Large Dataset Processing Stress Test',
      type: 'stress',
      error: error.message,
      success: false
    })
  }

  // Test 5: Error Handling Stress Test
  console.log('⚠️  Test 5: Error Handling Stress Test')
  try {
    let errorCount = 0
    let successCount = 0
    
    const result = await performanceTester.runLoadTest(
      'error-handling-stress-test',
      async () => {
        // Simulate mixed success/failure scenarios
        const shouldFail = Math.random() < 0.3 // 30% failure rate
        
        if (shouldFail) {
          errorCount++
          throw new Error(`Simulated error ${errorCount}`)
        }
        
        successCount++
        
        // Simulate processing with potential delays
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        
        return {
          success: true,
          processingTime: Math.random() * 100,
          timestamp: Date.now()
        }
      },
      30,  // concurrent users
      30000 // duration in ms
    )
    
    const errorRate = (errorCount / (errorCount + successCount)) * 100
    
    console.log(`   ✅ Error Handling Stress Test Completed`)
    console.log(`   📊 Results: ${result.totalRequests} requests, ${result.requestsPerSecond.toFixed(2)} RPS`)
    console.log(`   📈 Error Rate: ${errorRate.toFixed(2)}% (${errorCount} errors, ${successCount} successes)\n`)

    results.tests.push({
      name: 'Error Handling Stress Test',
      type: 'stress',
      result,
      errorCount,
      successCount,
      errorRate,
      success: true
    })
  } catch (error) {
    console.error(`   ❌ Error Handling Stress Test Failed: ${error.message}\n`)
    results.tests.push({
      name: 'Error Handling Stress Test',
      type: 'stress',
      error: error.message,
      success: false
    })
  }

  // Test 6: Edge Case Stress Test
  console.log('🔍 Test 6: Edge Case Stress Test')
  try {
    const edgeCases = ['empty', 'large', 'invalid', 'extreme']
    
    for (const edgeCase of edgeCases) {
      console.log(`   Testing edge case: ${edgeCase}`)
      
      const edgeCaseData = createEdgeCaseData(edgeCase)
      
      const result = await performanceTester.runLoadTest(
        `edge-case-${edgeCase}-test`,
        async () => {
          // Process edge case data
          const processed = {
            caseType: edgeCase,
            validators: edgeCaseData.validators?.length || 0,
            transactions: edgeCaseData.transactions?.length || 0,
            nodes: edgeCaseData.nodes?.length || 0,
            edges: edgeCaseData.edges?.length || 0,
            bundles: edgeCaseData.bundles?.length || 0,
            tokenInfo: edgeCaseData.tokenInfo ? 'present' : 'absent',
            holders: edgeCaseData.holders?.length || 0,
            transfers: edgeCaseData.transfers?.length || 0,
            processedAt: Date.now()
          }
          
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
          
          return processed
        },
        10,  // concurrent users
        15000 // duration in ms
      )
      
      console.log(`   ✅ Edge Case '${edgeCase}' Test: ${result.totalRequests} requests, ${result.requestsPerSecond.toFixed(2)} RPS`)
      
      results.tests.push({
        name: `Edge Case '${edgeCase}' Test`,
        type: 'stress',
        edgeCase,
        result,
        success: true
      })
    }
    
    console.log()
  } catch (error) {
    console.error(`   ❌ Edge Case Stress Test Failed: ${error.message}\n`)
    results.tests.push({
      name: 'Edge Case Stress Test',
      type: 'stress',
      error: error.message,
      success: false
    })
  }

  // Generate comprehensive report
  console.log('📋 Stress Test Report')
  console.log('===================')
  
  const endTime = Date.now()
  const totalDuration = (endTime - results.startTime) / 1000
  
  console.log(`Test Duration: ${totalDuration.toFixed(2)} seconds`)
  console.log(`System Info: ${results.systemInfo.platform} (${results.systemInfo.arch})`)
  console.log(`Node Version: ${results.systemInfo.nodeVersion}`)
  console.log(`Initial Memory: ${Math.round(results.systemInfo.systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB`)
  console.log()
  
  let totalTests = results.tests.length
  let successfulTests = results.tests.filter(t => t.success).length
  let failedTests = totalTests - successfulTests
  
  console.log(`📊 Test Summary:`)
  console.log(`   Total Tests: ${totalTests}`)
  console.log(`   Successful: ${successfulTests}`)
  console.log(`   Failed: ${failedTests}`)
  console.log(`   Success Rate: ${((successfulTests / totalTests) * 100).toFixed(2)}%`)
  console.log()
  
  console.log(`📈 Test Results:`)
  results.tests.forEach((test, index) => {
    if (test.success) {
      console.log(`   ${index + 1}. ✅ ${test.name}`)
      if (test.result) {
        console.log(`      Requests: ${test.result.totalRequests}`)
        console.log(`      RPS: ${test.result.requestsPerSecond.toFixed(2)}`)
        console.log(`      Success Rate: ${((test.result.successfulRequests / test.result.totalRequests) * 100).toFixed(2)}%`)
      }
      if (test.memoryIncrease) {
        console.log(`      Memory Increase: ${Math.round(test.memoryIncrease / 1024 / 1024)}MB`)
      }
    } else {
      console.log(`   ${index + 1}. ❌ ${test.name}`)
      console.log(`      Error: ${test.error}`)
    }
    console.log()
  })
  
  // Save detailed report
  const fs = require('fs')
  const path = require('path')
  const reportDir = path.join(__dirname, '..', '..', 'performance-reports')
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  const reportFile = path.join(reportDir, `stress-test-report-${Date.now()}.json`)
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2))
  
  console.log(`📄 Detailed report saved to: ${reportFile}`)
  console.log('✅ Stress Tests Completed!\n')
  
  return results
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Run the tests
if (require.main === module) {
  runStressTests().catch(console.error)
}

module.exports = { runStressTests }