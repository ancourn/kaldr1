import { vi } from 'vitest'

// Error types for testing
export type ErrorType = 'network' | 'timeout' | 'validation' | 'server' | 'auth' | 'rate-limit'

// Error simulation configuration
export interface ErrorSimulationConfig {
  type: ErrorType
  probability: number // 0.0 to 1.0
  delay?: number // milliseconds
  statusCode?: number
  message?: string
}

// Network error simulator
export class NetworkErrorSimulator {
  private simulations: Map<string, ErrorSimulationConfig> = new Map()
  
  constructor() {
    this.reset()
  }
  
  // Add error simulation for a specific endpoint
  addSimulation(endpoint: string, config: ErrorSimulationConfig): void {
    this.simulations.set(endpoint, config)
  }
  
  // Remove error simulation for an endpoint
  removeSimulation(endpoint: string): void {
    this.simulations.delete(endpoint)
  }
  
  // Check if an error should be simulated for this request
  shouldSimulateError(endpoint: string): boolean {
    const config = this.simulations.get(endpoint)
    if (!config) return false
    
    return Math.random() < config.probability
  }
  
  // Generate error based on configuration
  generateError(endpoint: string): Error {
    const config = this.simulations.get(endpoint)
    if (!config) {
      return new Error('Unknown error')
    }
    
    const { type, statusCode, message, delay } = config
    
    // Create error based on type
    let error: Error
    switch (type) {
      case 'network':
        error = new Error(message || 'Network error: Unable to connect to server')
        break
      case 'timeout':
        error = new Error(message || 'Request timeout: Server did not respond in time')
        break
      case 'validation':
        error = new Error(message || 'Validation error: Invalid input parameters')
        break
      case 'server':
        error = new Error(message || 'Server error: Internal server error')
        break
      case 'auth':
        error = new Error(message || 'Authentication error: Invalid credentials')
        break
      case 'rate-limit':
        error = new Error(message || 'Rate limit exceeded: Too many requests')
        break
      default:
        error = new Error('Unknown error occurred')
    }
    
    // Add status code if provided
    if (statusCode) {
      Object.defineProperty(error, 'statusCode', {
        value: statusCode,
        enumerable: true
      })
    }
    
    return error
  }
  
  // Simulate request with potential error
  async simulateRequest<T>(
    endpoint: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const config = this.simulations.get(endpoint)
    
    // Check if we should simulate an error
    if (config && this.shouldSimulateError(endpoint)) {
      // Add delay if specified
      if (config.delay) {
        await new Promise(resolve => setTimeout(resolve, config.delay))
      }
      
      // Throw the simulated error
      throw this.generateError(endpoint)
    }
    
    // Otherwise, execute the request normally
    return requestFn()
  }
  
  // Reset all simulations
  reset(): void {
    this.simulations.clear()
  }
  
  // Get all active simulations
  getActiveSimulations(): Array<{ endpoint: string; config: ErrorSimulationConfig }> {
    return Array.from(this.simulations.entries()).map(([endpoint, config]) => ({
      endpoint,
      config
    }))
  }
}

// Edge case testing utilities
export class EdgeCaseTester {
  private networkErrorSimulator: NetworkErrorSimulator
  
  constructor() {
    this.networkErrorSimulator = new NetworkErrorSimulator()
  }
  
  // Test with empty data
  async testWithEmptyData<T>(testFn: () => Promise<T>): Promise<T> {
    return testFn()
  }
  
  // Test with large datasets
  async testWithLargeData<T>(
    testFn: (dataSize: number) => Promise<T>,
    maxSize: number = 10000
  ): Promise<T> {
    const sizes = [100, 1000, 5000, maxSize]
    let lastResult: T
    
    for (const size of sizes) {
      try {
        lastResult = await testFn(size)
      } catch (error) {
        throw new Error(`Large data test failed at size ${size}: ${error}`)
      }
    }
    
    return lastResult!
  }
  
  // Test with invalid data
  async testWithInvalidData<T>(
    testFn: (invalidData: any) => Promise<T>,
    invalidDataGenerator: () => any
  ): Promise<T> {
    const invalidData = invalidDataGenerator()
    return testFn(invalidData)
  }
  
  // Test with concurrent requests
  async testWithConcurrency<T>(
    testFn: () => Promise<T>,
    concurrency: number = 10
  ): Promise<Array<{ result: T; duration: number }>> {
    const requests = Array.from({ length: concurrency }, async (_, index) => {
      const start = performance.now()
      try {
        const result = await testFn()
        const duration = performance.now() - start
        return { result, duration, success: true }
      } catch (error) {
        const duration = performance.now() - start
        return { 
          result: null as unknown as T, 
          duration, 
          success: false, 
          error: error as Error 
        }
      }
    })
    
    return Promise.all(requests)
  }
  
  // Test with rate limiting
  async testWithRateLimit<T>(
    testFn: () => Promise<T>,
    requestsPerSecond: number = 10,
    duration: number = 5000
  ): Promise<{ success: number; failed: number; averageResponseTime: number }> {
    const interval = 1000 / requestsPerSecond
    const totalRequests = Math.floor((duration / 1000) * requestsPerSecond)
    const results: Array<{ success: boolean; duration: number }> = []
    
    const executeRequest = async (): Promise<void> => {
      const start = performance.now()
      try {
        await testFn()
        const responseTime = performance.now() - start
        results.push({ success: true, duration: responseTime })
      } catch (error) {
        const responseTime = performance.now() - start
        results.push({ success: false, duration: responseTime })
      }
    }
    
    // Execute requests with rate limiting
    const requestPromises: Promise<void>[] = []
    for (let i = 0; i < totalRequests; i++) {
      requestPromises.push(
        new Promise<void>(resolve => {
          setTimeout(async () => {
            await executeRequest()
            resolve()
          }, i * interval)
        })
      )
    }
    
    await Promise.all(requestPromises)
    
    const success = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const averageResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    
    return { success, failed, averageResponseTime }
  }
  
  // Test with memory pressure
  async testWithMemoryPressure<T>(
    testFn: (memoryUsage: NodeJS.MemoryUsage) => Promise<T>
  ): Promise<{ result: T; memoryBefore: NodeJS.MemoryUsage; memoryAfter: NodeJS.MemoryUsage }> {
    const memoryBefore = process.memoryUsage()
    
    // Allocate some memory to create pressure
    const largeArray = new Array(1000000).fill('memory_pressure_data')
    
    const result = await testFn(memoryBefore)
    
    const memoryAfter = process.memoryUsage()
    
    // Clean up
    largeArray.length = 0
    
    return { result, memoryBefore, memoryAfter }
  }
  
  // Test with network latency simulation
  async testWithNetworkLatency<T>(
    testFn: () => Promise<T>,
    latency: number = 100
  ): Promise<{ result: T; actualLatency: number }> {
    const start = performance.now()
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, latency))
    
    const result = await testFn()
    
    const actualLatency = performance.now() - start
    
    return { result, actualLatency }
  }
  
  // Test with retry logic
  async testWithRetry<T>(
    testFn: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<{ result: T; attempts: number }> {
    let attempts = 0
    let lastError: Error | null = null
    
    while (attempts <= maxRetries) {
      attempts++
      try {
        const result = await testFn()
        return { result, attempts }
      } catch (error) {
        lastError = error as Error
        
        if (attempts <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }
    
    throw lastError || new Error('Unknown error occurred during retry test')
  }
  
  // Get network error simulator instance
  getNetworkErrorSimulator(): NetworkErrorSimulator {
    return this.networkErrorSimulator
  }
}

// Performance testing utilities
export class PerformanceTester {
  private results: Array<{
    test: string
    duration: number
    memory: NodeJS.MemoryUsage
    success: boolean
    error?: string
  }> = []
  
  // Measure execution time of a function
  async measure<T>(
    testName: string,
    testFn: () => Promise<T>
  ): Promise<{ result: T; duration: number; memory: NodeJS.MemoryUsage }> {
    const memoryBefore = process.memoryUsage()
    const start = performance.now()
    
    try {
      const result = await testFn()
      const duration = performance.now() - start
      const memoryAfter = process.memoryUsage()
      
      this.results.push({
        test: testName,
        duration,
        memory: memoryAfter,
        success: true
      })
      
      return { result, duration, memory: memoryAfter }
    } catch (error) {
      const duration = performance.now() - start
      const memoryAfter = process.memoryUsage()
      
      this.results.push({
        test: testName,
        duration,
        memory: memoryAfter,
        success: false,
        error: (error as Error).message
      })
      
      throw error
    }
  }
  
  // Run load test
  async runLoadTest<T>(
    testName: string,
    testFn: () => Promise<T>,
    concurrentUsers: number = 10,
    duration: number = 10000
  ): Promise<{
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    minResponseTime: number
    maxResponseTime: number
    requestsPerSecond: number
  }> {
    const startTime = performance.now()
    const endTime = startTime + duration
    
    const results: Array<{ duration: number; success: boolean }> = []
    let activeRequests = 0
    
    const executeRequest = async (): Promise<void> => {
      activeRequests++
      const start = performance.now()
      
      try {
        await testFn()
        const duration = performance.now() - start
        results.push({ duration, success: true })
      } catch (error) {
        const duration = performance.now() - start
        results.push({ duration, success: false })
      } finally {
        activeRequests--
      }
    }
    
    // Execute requests continuously for the duration
    const requestPromises: Promise<void>[] = []
    
    const scheduleRequest = (): void => {
      if (performance.now() >= endTime) return
      
      const promise = executeRequest()
        .then(() => {
          // Schedule next request
          if (performance.now() < endTime) {
            setTimeout(scheduleRequest, Math.random() * 100) // Random delay
          }
        })
        .catch(() => {
          // Schedule next request even if this one failed
          if (performance.now() < endTime) {
            setTimeout(scheduleRequest, Math.random() * 100)
          }
        })
      
      requestPromises.push(promise)
    }
    
    // Start initial requests
    for (let i = 0; i < concurrentUsers; i++) {
      setTimeout(scheduleRequest, i * (duration / concurrentUsers))
    }
    
    // Wait for all requests to complete
    await Promise.all(requestPromises)
    
    // Calculate statistics
    const successfulRequests = results.filter(r => r.success).length
    const failedRequests = results.filter(r => !r.success).length
    const totalRequests = results.length
    
    const responseTimes = results.map(r => r.duration)
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    const minResponseTime = Math.min(...responseTimes)
    const maxResponseTime = Math.max(...responseTimes)
    
    const actualDuration = (performance.now() - startTime) / 1000 // Convert to seconds
    const requestsPerSecond = totalRequests / actualDuration
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond
    }
  }
  
  // Get performance results
  getResults(): Array<{
    test: string
    duration: number
    memory: NodeJS.MemoryUsage
    success: boolean
    error?: string
  }> {
    return [...this.results]
  }
  
  // Clear results
  clearResults(): void {
    this.results = []
  }
  
  // Generate performance report
  generateReport(): string {
    const report = ['Performance Test Results', '========================']
    
    this.results.forEach(result => {
      report.push(`\nTest: ${result.test}`)
      report.push(`Duration: ${result.duration.toFixed(2)}ms`)
      report.push(`Memory Usage: ${Math.round(result.memory.heapUsed / 1024 / 1024)}MB`)
      report.push(`Success: ${result.success ? 'Yes' : 'No'}`)
      
      if (result.error) {
        report.push(`Error: ${result.error}`)
      }
    })
    
    return report.join('\n')
  }
}

// Export singleton instances
export const networkErrorSimulator = new NetworkErrorSimulator()
export const edgeCaseTester = new EdgeCaseTester()
export const performanceTester = new PerformanceTester()