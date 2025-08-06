const { performanceTester } = require('../utils/error-simulation')
const { 
  createMockValidators, 
  createMockTransactions, 
  createMockDagNodes, 
  createMockBundles,
  createMockTokenInfo,
  createMockTokenHolders,
  createMockTokenTransfers
} = require('../mocks/data-factories')

async function runBenchmarks() {
  console.log('⏱️  Starting Performance Benchmarks...\n')

  const benchmarks = []
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    cpus: require('os').cpus().length
  }

  console.log('🖥️  System Information:')
  console.log(`   Platform: ${systemInfo.platform} (${systemInfo.arch})`)
  console.log(`   Node Version: ${systemInfo.nodeVersion}`)
  console.log(`   CPU Cores: ${systemInfo.cpus}`)
  console.log(`   Memory: ${Math.round(systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB used\n`)

  // Benchmark 1: Validator Data Processing
  console.log('📊 Benchmark 1: Validator Data Processing')
  try {
    const sizes = [100, 500, 1000, 5000]
    
    for (const size of sizes) {
      const result = await performanceTester.measure(
        `validator-processing-${size}`,
        async () => {
          const validators = createMockValidators(size)
          
          // Simulate validator processing
          const activeValidators = validators.filter(v => v.status === 'active')
          const totalStake = validators.reduce((sum, v) => sum + BigInt(v.stake), BigInt(0))
          const averageUptime = validators.reduce((sum, v) => sum + v.uptime, 0) / validators.length
          const totalRewards = validators.reduce((sum, v) => sum + BigInt(v.rewards), BigInt(0))
          
          return {
            processed: validators.length,
            active: activeValidators.length,
            totalStake: totalStake.toString(),
            averageUptime,
            totalRewards: totalRewards.toString()
          }
        }
      )
      
      console.log(`   Size ${size}: ${result.duration.toFixed(2)}ms (${(size / result.duration * 1000).toFixed(2)} validators/sec)`)
      
      benchmarks.push({
        name: `Validator Processing (${size})`,
        category: 'data-processing',
        size,
        duration: result.duration,
        throughput: size / result.duration * 1000,
        memory: result.memory
      })
    }
    console.log()
  } catch (error) {
    console.error(`❌ Validator Processing Benchmark Failed: ${error.message}\n`)
  }

  // Benchmark 2: Transaction Processing
  console.log('📊 Benchmark 2: Transaction Processing')
  try {
    const sizes = [500, 1000, 5000, 10000]
    
    for (const size of sizes) {
      const result = await performanceTester.measure(
        `transaction-processing-${size}`,
        async () => {
          const transactions = createMockTransactions(size)
          
          // Simulate transaction processing
          const pendingTransactions = transactions.filter(t => t.status === 'pending')
          const confirmedTransactions = transactions.filter(t => t.status === 'confirmed')
          const failedTransactions = transactions.filter(t => t.status === 'failed')
          const averageGasPrice = transactions.reduce((sum, t) => sum + BigInt(t.gasPrice), BigInt(0)) / BigInt(transactions.length)
          const totalFees = transactions.reduce((sum, t) => sum + BigInt(t.fee), BigInt(0))
          
          return {
            processed: transactions.length,
            pending: pendingTransactions.length,
            confirmed: confirmedTransactions.length,
            failed: failedTransactions.length,
            averageGasPrice: averageGasPrice.toString(),
            totalFees: totalFees.toString()
          }
        }
      )
      
      console.log(`   Size ${size}: ${result.duration.toFixed(2)}ms (${(size / result.duration * 1000).toFixed(2)} transactions/sec)`)
      
      benchmarks.push({
        name: `Transaction Processing (${size})`,
        category: 'data-processing',
        size,
        duration: result.duration,
        throughput: size / result.duration * 1000,
        memory: result.memory
      })
    }
    console.log()
  } catch (error) {
    console.error(`❌ Transaction Processing Benchmark Failed: ${error.message}\n`)
  }

  // Benchmark 3: DAG Structure Processing
  console.log('📊 Benchmark 3: DAG Structure Processing')
  try {
    const sizes = [100, 500, 1000, 2000]
    
    for (const size of sizes) {
      const result = await performanceTester.measure(
        `dag-processing-${size}`,
        async () => {
          const nodes = createMockDagNodes(size)
          
          // Build adjacency list for DAG processing
          const adjacencyList = {}
          nodes.forEach(node => {
            adjacencyList[node.id] = []
          })
          
          // Simulate edge creation (simplified)
          for (let i = 1; i < nodes.length; i++) {
            const parentIndex = Math.floor(Math.random() * i)
            adjacencyList[nodes[parentIndex].id].push(nodes[i].id)
          }
          
          // Simulate DAG traversal and analysis
          const visited = new Set()
          const queue = [nodes[0].id]
          
          while (queue.length > 0) {
            const current = queue.shift()
            if (!visited.has(current)) {
              visited.add(current)
              queue.push(...adjacencyList[current])
            }
          }
          
          // Calculate DAG statistics
          const maxDepth = Math.max(...nodes.map(n => n.height))
          const totalTransactions = nodes.reduce((sum, n) => sum + n.transactions, 0)
          const averageNodeSize = nodes.reduce((sum, n) => sum + n.size, 0) / nodes.length
          
          return {
            nodesProcessed: nodes.length,
            visitedNodes: visited.size,
            maxDepth,
            totalTransactions,
            averageNodeSize
          }
        }
      )
      
      console.log(`   Size ${size}: ${result.duration.toFixed(2)}ms (${(size / result.duration * 1000).toFixed(2)} nodes/sec)`)
      
      benchmarks.push({
        name: `DAG Processing (${size})`,
        category: 'data-processing',
        size,
        duration: result.duration,
        throughput: size / result.duration * 1000,
        memory: result.memory
      })
    }
    console.log()
  } catch (error) {
    console.error(`❌ DAG Processing Benchmark Failed: ${error.message}\n`)
  }

  // Benchmark 4: Bundle Processing
  console.log('📊 Benchmark 4: Bundle Processing')
  try {
    const sizes = [50, 100, 500, 1000]
    
    for (const size of sizes) {
      const result = await performanceTester.measure(
        `bundle-processing-${size}`,
        async () => {
          const bundles = createMockBundles(size)
          
          // Simulate bundle processing
          const totalBundles = bundles.length
          const pendingBundles = bundles.filter(b => b.status === 'pending').length
          const confirmedBundles = bundles.filter(b => b.status === 'confirmed').length
          const failedBundles = bundles.filter(b => b.status === 'failed').length
          const averageBundleSize = bundles.reduce((sum, b) => sum + b.bundleSize, 0) / totalBundles
          const totalTransactions = bundles.reduce((sum, b) => sum + b.transactionCount, 0)
          const totalValue = bundles.reduce((sum, b) => sum + BigInt(b.totalValue), BigInt(0))
          const totalFees = bundles.reduce((sum, b) => sum + BigInt(b.fees), BigInt(0))
          
          return {
            processed: totalBundles,
            pending: pendingBundles,
            confirmed: confirmedBundles,
            failed: failedBundles,
            averageBundleSize,
            totalTransactions,
            totalValue: totalValue.toString(),
            totalFees: totalFees.toString()
          }
        }
      )
      
      console.log(`   Size ${size}: ${result.duration.toFixed(2)}ms (${(size / result.duration * 1000).toFixed(2)} bundles/sec)`)
      
      benchmarks.push({
        name: `Bundle Processing (${size})`,
        category: 'data-processing',
        size,
        duration: result.duration,
        throughput: size / result.duration * 1000,
        memory: result.memory
      })
    }
    console.log()
  } catch (error) {
    console.error(`❌ Bundle Processing Benchmark Failed: ${error.message}\n`)
  }

  // Benchmark 5: Token Data Processing
  console.log('📊 Benchmark 5: Token Data Processing')
  try {
    const holderSizes = [100, 500, 1000, 5000]
    const transferSizes = [500, 1000, 5000, 10000]
    
    for (let i = 0; i < holderSizes.length; i++) {
      const holderSize = holderSizes[i]
      const transferSize = transferSizes[i]
      
      const result = await performanceTester.measure(
        `token-processing-${holderSize}-${transferSize}`,
        async () => {
          const tokenInfo = createMockTokenInfo()
          const holders = createMockTokenHolders(holderSize)
          const transfers = createMockTokenTransfers(transferSize)
          
          // Simulate token data processing
          const totalHolders = holders.length
          const totalTransfers = transfers.length
          const totalSupply = BigInt(tokenInfo.totalSupply)
          const circulatingSupply = BigInt(tokenInfo.circulatingSupply)
          const stakedSupply = BigInt(tokenInfo.stakedSupply)
          
          // Calculate holder statistics
          const topHolders = holders
            .sort((a, b) => BigInt(b.balance) - BigInt(a.balance))
            .slice(0, 10)
          
          const topHolderPercentage = topHolders.reduce((sum, h) => sum + h.percentage, 0)
          
          // Calculate transfer statistics
          const transferTypes = transfers.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1
            return acc
          }, {})
          
          const totalVolume24h = transfers
            .filter(t => t.type === 'transfer')
            .reduce((sum, t) => sum + BigInt(t.value), BigInt(0))
          
          return {
            tokenInfo: {
              symbol: tokenInfo.symbol,
              totalSupply: totalSupply.toString(),
              circulatingSupply: circulatingSupply.toString(),
              stakedSupply: stakedSupply.toString()
            },
            holders: {
              total: totalHolders,
              topHolders: topHolders.length,
              topHolderPercentage
            },
            transfers: {
              total: totalTransfers,
              types: transferTypes,
              volume24h: totalVolume24h.toString()
            },
            processedAt: Date.now()
          }
        }
      )
      
      console.log(`   Holders ${holderSize}, Transfers ${transferSize}: ${result.duration.toFixed(2)}ms`)
      
      benchmarks.push({
        name: `Token Processing (${holderSize}H, ${transferSize}T)`,
        category: 'data-processing',
        holderSize,
        transferSize,
        duration: result.duration,
        throughput: (holderSize + transferSize) / result.duration * 1000,
        memory: result.memory
      })
    }
    console.log()
  } catch (error) {
    console.error(`❌ Token Processing Benchmark Failed: ${error.message}\n`)
  }

  // Benchmark 6: Memory Allocation and Garbage Collection
  console.log('💾 Benchmark 6: Memory Allocation and GC')
  try {
    const iterations = 5
    
    for (let i = 0; i < iterations; i++) {
      const memoryBefore = process.memoryUsage()
      
      const result = await performanceTester.measure(
        `memory-allocation-${i + 1}`,
        async () => {
          // Allocate and process large amounts of data
          const largeArray = []
          
          for (let j = 0; j < 10000; j++) {
            largeArray.push({
              id: j,
              data: Math.random().toString(36).repeat(100), // Large string
              nested: {
                level1: {
                  level2: {
                    level3: {
                      value: Math.random() * 1000000
                    }
                  }
                }
              }
            })
          }
          
          // Process the data
          const processed = largeArray.map(item => ({
            ...item,
            processed: true,
            calculated: item.nested.level1.level2.level3.value * Math.PI
          }))
          
          // Sort and filter
          const sorted = processed.sort((a, b) => b.calculated - a.calculated)
          const filtered = sorted.filter(item => item.calculated > 500000)
          
          // Force garbage collection opportunity
          if (i === iterations - 1) {
            largeArray.length = 0 // Clear reference
            global.gc && global.gc() // Manually trigger GC if available
          }
          
          return {
            itemsProcessed: processed.length,
            sortedItems: sorted.length,
            filteredItems: filtered.length,
            maxCalculated: Math.max(...processed.map(p => p.calculated))
          }
        }
      )
      
      const memoryAfter = process.memoryUsage()
      const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed
      
      console.log(`   Iteration ${i + 1}: ${result.duration.toFixed(2)}ms, Memory Δ: ${Math.round(memoryDelta / 1024)}KB`)
      
      benchmarks.push({
        name: `Memory Allocation (${i + 1})`,
        category: 'memory',
        iteration: i + 1,
        duration: result.duration,
        memoryBefore,
        memoryAfter,
        memoryDelta,
        memory: result.memory
      })
    }
    console.log()
  } catch (error) {
    console.error(`❌ Memory Allocation Benchmark Failed: ${error.message}\n`)
  }

  // Generate benchmark report
  console.log('📋 Benchmark Report')
  console.log('==================')
  
  console.log(`📊 Summary Statistics:`)
  
  const categories = [...new Set(benchmarks.map(b => b.category))]
  
  categories.forEach(category => {
    const categoryBenchmarks = benchmarks.filter(b => b.category === category)
    const avgDuration = categoryBenchmarks.reduce((sum, b) => sum + b.duration, 0) / categoryBenchmarks.length
    const avgThroughput = categoryBenchmarks
      .filter(b => b.throughput)
      .reduce((sum, b) => sum + b.throughput, 0) / categoryBenchmarks.filter(b => b.throughput).length
    
    console.log(`   ${category.toUpperCase()}:`)
    console.log(`     Average Duration: ${avgDuration.toFixed(2)}ms`)
    if (avgThroughput) {
      console.log(`     Average Throughput: ${avgThroughput.toFixed(2)} ops/sec`)
    }
    console.log()
  })
  
  console.log(`📈 Performance Rankings (Fastest to Slowest):`)
  const sortedBenchmarks = benchmarks
    .filter(b => b.duration)
    .sort((a, b) => a.duration - b.duration)
    .slice(0, 10)
  
  sortedBenchmarks.forEach((benchmark, index) => {
    console.log(`   ${index + 1}. ${benchmark.name}: ${benchmark.duration.toFixed(2)}ms`)
  })
  
  console.log()
  
  // Save detailed benchmark results
  const fs = require('fs')
  const path = require('path')
  const reportDir = path.join(__dirname, '..', '..', 'performance-reports')
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  const reportFile = path.join(reportDir, `benchmark-report-${Date.now()}.json`)
  const reportData = {
    systemInfo,
    benchmarks,
    generatedAt: new Date().toISOString(),
    summary: {
      totalBenchmarks: benchmarks.length,
      categories: categories,
      averageDuration: benchmarks.reduce((sum, b) => sum + b.duration, 0) / benchmarks.length
    }
  }
  
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2))
  
  console.log(`📄 Detailed benchmark report saved to: ${reportFile}`)
  console.log('✅ Benchmarks Completed!\n')
  
  return { systemInfo, benchmarks, reportData }
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

// Enable garbage collection for testing
if (typeof global.gc !== 'function') {
  global.gc = require('vm').runInNewContext('gc')
}

// Run the benchmarks
if (require.main === module) {
  runBenchmarks().catch(console.error)
}

module.exports = { runBenchmarks }