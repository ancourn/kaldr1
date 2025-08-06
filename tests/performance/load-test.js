const { performanceTester } = require('../utils/error-simulation')
const { createMockValidators, createMockTransactions, createMockDagNodes } = require('../mocks/data-factories')

async function runLoadTests() {
  console.log('🚀 Starting Load Tests...\n')

  // Test 1: Validator Data Load Test
  console.log('📊 Test 1: Validator Data Load Test')
  try {
    const result = await performanceTester.runLoadTest(
      'validator-load-test',
      async () => {
        const validators = createMockValidators(100)
        return { validators, count: validators.length }
      },
      50,  // concurrent users
      10000 // duration in ms
    )
    
    console.log(`✅ Validator Load Test Results:`)
    console.log(`   Total Requests: ${result.totalRequests}`)
    console.log(`   Successful: ${result.successfulRequests}`)
    console.log(`   Failed: ${result.failedRequests}`)
    console.log(`   Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`)
    console.log(`   Requests/Second: ${result.requestsPerSecond.toFixed(2)}`)
    console.log(`   Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%\n`)
  } catch (error) {
    console.error(`❌ Validator Load Test Failed: ${error.message}\n`)
  }

  // Test 2: Transaction Processing Load Test
  console.log('📊 Test 2: Transaction Processing Load Test')
  try {
    const result = await performanceTester.runLoadTest(
      'transaction-load-test',
      async () => {
        const transactions = createMockTransactions(500)
        return { transactions, count: transactions.length }
      },
      30,  // concurrent users
      15000 // duration in ms
    )
    
    console.log(`✅ Transaction Load Test Results:`)
    console.log(`   Total Requests: ${result.totalRequests}`)
    console.log(`   Successful: ${result.successfulRequests}`)
    console.log(`   Failed: ${result.failedRequests}`)
    console.log(`   Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`)
    console.log(`   Requests/Second: ${result.requestsPerSecond.toFixed(2)}`)
    console.log(`   Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%\n`)
  } catch (error) {
    console.error(`❌ Transaction Load Test Failed: ${error.message}\n`)
  }

  // Test 3: DAG Node Processing Load Test
  console.log('📊 Test 3: DAG Node Processing Load Test')
  try {
    const result = await performanceTester.runLoadTest(
      'dag-load-test',
      async () => {
        const nodes = createMockDagNodes(200)
        return { nodes, count: nodes.length }
      },
      20,  // concurrent users
      20000 // duration in ms
    )
    
    console.log(`✅ DAG Load Test Results:`)
    console.log(`   Total Requests: ${result.totalRequests}`)
    console.log(`   Successful: ${result.successfulRequests}`)
    console.log(`   Failed: ${result.failedRequests}`)
    console.log(`   Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`)
    console.log(`   Requests/Second: ${result.requestsPerSecond.toFixed(2)}`)
    console.log(`   Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%\n`)
  } catch (error) {
    console.error(`❌ DAG Load Test Failed: ${error.message}\n`)
  }

  // Test 4: Mixed Operations Load Test
  console.log('📊 Test 4: Mixed Operations Load Test')
  try {
    const result = await performanceTester.runLoadTest(
      'mixed-operations-test',
      async () => {
        const operations = [
          () => createMockValidators(10),
          () => createMockTransactions(50),
          () => createMockDagNodes(20)
        ]
        
        const randomOperation = operations[Math.floor(Math.random() * operations.length)]
        const result = randomOperation()
        
        return { 
          operation: randomOperation.name,
          result: result,
          timestamp: Date.now()
        }
      },
      40,  // concurrent users
      25000 // duration in ms
    )
    
    console.log(`✅ Mixed Operations Load Test Results:`)
    console.log(`   Total Requests: ${result.totalRequests}`)
    console.log(`   Successful: ${result.successfulRequests}`)
    console.log(`   Failed: ${result.failedRequests}`)
    console.log(`   Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`)
    console.log(`   Requests/Second: ${result.requestsPerSecond.toFixed(2)}`)
    console.log(`   Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%\n`)
  } catch (error) {
    console.error(`❌ Mixed Operations Load Test Failed: ${error.message}\n`)
  }

  // Test 5: High Frequency Load Test
  console.log('📊 Test 5: High Frequency Load Test')
  try {
    const result = await performanceTester.runLoadTest(
      'high-frequency-test',
      async () => {
        // Simulate high-frequency small operations
        const smallData = { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }
        return { data: smallData, processed: true }
      },
      100, // concurrent users
      30000 // duration in ms
    )
    
    console.log(`✅ High Frequency Load Test Results:`)
    console.log(`   Total Requests: ${result.totalRequests}`)
    console.log(`   Successful: ${result.successfulRequests}`)
    console.log(`   Failed: ${result.failedRequests}`)
    console.log(`   Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`)
    console.log(`   Requests/Second: ${result.requestsPerSecond.toFixed(2)}`)
    console.log(`   Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%\n`)
  } catch (error) {
    console.error(`❌ High Frequency Load Test Failed: ${error.message}\n`)
  }

  // Generate Performance Report
  console.log('📋 Performance Test Report')
  console.log('========================')
  const report = performanceTester.generateReport()
  console.log(report)

  // Save report to file
  const fs = require('fs')
  const path = require('path')
  const reportDir = path.join(__dirname, '..', '..', 'performance-reports')
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  const reportFile = path.join(reportDir, `load-test-report-${Date.now()}.txt`)
  fs.writeFileSync(reportFile, report)
  
  console.log(`📄 Performance report saved to: ${reportFile}`)
  console.log('✅ Load Tests Completed!\n')
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
  runLoadTests().catch(console.error)
}

module.exports = { runLoadTests }