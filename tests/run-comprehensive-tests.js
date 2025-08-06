const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      startTime: Date.now(),
      tests: {},
      summary: {},
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cpus: require('os').cpus().length
      }
    }
    this.reportDir = path.join(__dirname, '..', 'test-reports')
    
    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true })
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite for KALDRIX\n')
    console.log('🖥️  System Information:')
    console.log(`   Platform: ${this.results.systemInfo.platform} (${this.results.systemInfo.arch})`)
    console.log(`   Node Version: ${this.results.systemInfo.nodeVersion}`)
    console.log(`   CPU Cores: ${this.results.systemInfo.cpus}`)
    console.log(`   Memory: ${Math.round(this.results.systemInfo.systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB used\n`)

    try {
      // 1. Unit Tests
      await this.runUnitTests()
      
      // 2. Integration Tests
      await this.runIntegrationTests()
      
      // 3. Performance Tests
      await this.runPerformanceTests()
      
      // 4. Stress Tests
      await this.runStressTests()
      
      // 5. Benchmarks
      await this.runBenchmarks()
      
      // 6. Security Audit
      await this.runSecurityAudit()
      
      // Generate final report
      await this.generateFinalReport()
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error)
      process.exit(1)
    }
  }

  async runUnitTests() {
    console.log('🧪 Running Unit Tests...')
    const startTime = Date.now()
    
    try {
      // Run unit tests with coverage
      console.log('   Executing unit tests with coverage...')
      execSync('npm run test:coverage', { stdio: 'inherit' })
      
      const duration = Date.now() - startTime
      this.results.tests.unit = {
        status: 'passed',
        duration,
        coverage: this.getCoverageSummary()
      }
      
      console.log(`   ✅ Unit Tests Completed (${duration}ms)\n`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.tests.unit = {
        status: 'failed',
        duration,
        error: error.message
      }
      
      console.log(`   ❌ Unit Tests Failed (${duration}ms): ${error.message}\n`)
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...')
    const startTime = Date.now()
    
    try {
      console.log('   Executing integration tests...')
      execSync('npm run test:integration', { stdio: 'inherit' })
      
      const duration = Date.now() - startTime
      this.results.tests.integration = {
        status: 'passed',
        duration
      }
      
      console.log(`   ✅ Integration Tests Completed (${duration}ms)\n`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.tests.integration = {
        status: 'failed',
        duration,
        error: error.message
      }
      
      console.log(`   ❌ Integration Tests Failed (${duration}ms): ${error.message}\n`)
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...')
    const startTime = Date.now()
    
    try {
      console.log('   Executing performance load tests...')
      const { runLoadTests } = require('./performance/load-test')
      await runLoadTests()
      
      const duration = Date.now() - startTime
      this.results.tests.performance = {
        status: 'passed',
        duration
      }
      
      console.log(`   ✅ Performance Tests Completed (${duration}ms)\n`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.tests.performance = {
        status: 'failed',
        duration,
        error: error.message
      }
      
      console.log(`   ❌ Performance Tests Failed (${duration}ms): ${error.message}\n`)
    }
  }

  async runStressTests() {
    console.log('🔥 Running Stress Tests...')
    const startTime = Date.now()
    
    try {
      console.log('   Executing stress tests...')
      const { runStressTests } = require('./performance/stress-test')
      await runStressTests()
      
      const duration = Date.now() - startTime
      this.results.tests.stress = {
        status: 'passed',
        duration
      }
      
      console.log(`   ✅ Stress Tests Completed (${duration}ms)\n`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.tests.stress = {
        status: 'failed',
        duration,
        error: error.message
      }
      
      console.log(`   ❌ Stress Tests Failed (${duration}ms): ${error.message}\n`)
    }
  }

  async runBenchmarks() {
    console.log('⏱️  Running Benchmarks...')
    const startTime = Date.now()
    
    try {
      console.log('   Executing benchmarks...')
      const { runBenchmarks } = require('./performance/benchmark')
      await runBenchmarks()
      
      const duration = Date.now() - startTime
      this.results.tests.benchmarks = {
        status: 'passed',
        duration
      }
      
      console.log(`   ✅ Benchmarks Completed (${duration}ms)\n`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.tests.benchmarks = {
        status: 'failed',
        duration,
        error: error.message
      }
      
      console.log(`   ❌ Benchmarks Failed (${duration}ms): ${error.message}\n`)
    }
  }

  async runSecurityAudit() {
    console.log('🔒 Running Security Audit...')
    const startTime = Date.now()
    
    try {
      console.log('   Executing security audit...')
      execSync('npm run security:scan', { stdio: 'inherit' })
      
      const duration = Date.now() - startTime
      this.results.tests.security = {
        status: 'passed',
        duration
      }
      
      console.log(`   ✅ Security Audit Completed (${duration}ms)\n`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.tests.security = {
        status: 'failed',
        duration,
        error: error.message
      }
      
      console.log(`   ❌ Security Audit Failed (${duration}ms): ${error.message}\n`)
    }
  }

  getCoverageSummary() {
    try {
      const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-final.json')
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
        return {
          lines: coverageData.total.lines.pct,
          branches: coverageData.total.branches.pct,
          functions: coverageData.total.functions.pct,
          statements: coverageData.total.statements.pct
        }
      }
    } catch (error) {
      console.warn('Could not read coverage data:', error.message)
    }
    return null
  }

  async generateFinalReport() {
    console.log('📋 Generating Final Test Report...')
    
    const endTime = Date.now()
    const totalDuration = endTime - this.results.startTime
    
    // Calculate summary statistics
    const testCategories = Object.keys(this.results.tests)
    const passedTests = testCategories.filter(cat => this.results.tests[cat].status === 'passed').length
    const failedTests = testCategories.filter(cat => this.results.tests[cat].status === 'failed').length
    const successRate = (passedTests / testCategories.length) * 100
    
    this.results.summary = {
      totalDuration,
      testCategories: testCategories.length,
      passedTests,
      failedTests,
      successRate,
      overallStatus: failedTests === 0 ? 'passed' : 'failed'
    }
    
    // Generate console report
    console.log('\n📊 Final Test Summary')
    console.log('====================')
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`)
    console.log(`Test Categories: ${testCategories.length}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log(`Success Rate: ${successRate.toFixed(2)}%`)
    console.log(`Overall Status: ${this.results.summary.overallStatus.toUpperCase()}\n`)
    
    console.log('📈 Test Results by Category:')
    testCategories.forEach(category => {
      const test = this.results.tests[category]
      const status = test.status === 'passed' ? '✅' : '❌'
      const duration = test.duration ? ` (${test.duration}ms)` : ''
      const error = test.error ? ` - ${test.error}` : ''
      
      console.log(`   ${status} ${category.charAt(0).toUpperCase() + category.slice(1)}${duration}${error}`)
    })
    
    // Generate detailed JSON report
    const reportData = {
      ...this.results,
      generatedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
    
    const reportFile = path.join(this.reportDir, `comprehensive-test-report-${Date.now()}.json`)
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2))
    
    console.log(`📄 Detailed report saved to: ${reportFile}`)
    
    // Generate human-readable report
    const humanReadableReport = this.generateHumanReadableReport()
    const humanReportFile = path.join(this.reportDir, `comprehensive-test-report-${Date.now()}.txt`)
    fs.writeFileSync(humanReportFile, humanReadableReport)
    
    console.log(`📄 Human-readable report saved to: ${humanReportFile}`)
    
    console.log('\n✅ Comprehensive Test Suite Completed!')
    
    if (this.results.summary.overallStatus === 'failed') {
      console.log('⚠️  Some tests failed. Please review the reports for details.')
      process.exit(1)
    } else {
      console.log('🎉 All tests passed successfully!')
    }
  }

  generateHumanReadableReport() {
    const { summary, tests, systemInfo } = this.results
    const timestamp = new Date().toISOString()
    
    let report = `KALDRIX Comprehensive Test Report
========================================

Generated: ${timestamp}
Environment: ${process.env.NODE_ENV || 'development'}

System Information:
- Platform: ${systemInfo.platform} (${systemInfo.arch})
- Node Version: ${systemInfo.nodeVersion}
- CPU Cores: ${systemInfo.cpus}
- Memory: ${Math.round(systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB used

Test Summary:
- Total Duration: ${(summary.totalDuration / 1000).toFixed(2)} seconds
- Test Categories: ${summary.testCategories}
- Passed: ${summary.passedTests}
- Failed: ${summary.failedTests}
- Success Rate: ${summary.successRate.toFixed(2)}%
- Overall Status: ${summary.overallStatus.toUpperCase()}

Detailed Results:
`
    
    Object.keys(tests).forEach(category => {
      const test = tests[category]
      const status = test.status === 'passed' ? 'PASS' : 'FAIL'
      const duration = test.duration ? `${test.duration}ms` : 'N/A'
      const error = test.error ? `\n    Error: ${test.error}` : ''
      
      report += `\n${category.toUpperCase()} Test:
  Status: ${status}
  Duration: ${duration}${error}`
      
      if (test.coverage) {
        report += `\n  Coverage:
    Lines: ${test.coverage.lines}%
    Branches: ${test.coverage.branches}%
    Functions: ${test.coverage.functions}%
    Statements: ${test.coverage.statements}%`
      }
    })
    
    report += `\n\nReport Files:
- Detailed JSON: comprehensive-test-report-${Date.now()}.json
- Human Readable: comprehensive-test-report-${Date.now()}.txt
- Coverage Report: ../coverage/index.html
- Performance Reports: ../performance-reports/
`
    
    return report
  }
}

// Main execution
if (require.main === module) {
  const runner = new ComprehensiveTestRunner()
  runner.runAllTests().catch(console.error)
}

module.exports = { ComprehensiveTestRunner }