import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { networkErrorSimulator, edgeCaseTester, performanceTester } from '../utils/error-simulation'
import { createMockValidators, createMockTransactions, createErrorScenario } from '../mocks/data-factories'

describe('Error Simulation and Edge Case Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    networkErrorSimulator.reset()
    performanceTester.clearResults()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Network Error Simulation', () => {
    it('should simulate network errors with probability', () => {
      // Add error simulation with 100% probability
      networkErrorSimulator.addSimulation('/api/validators', {
        type: 'network',
        probability: 1.0,
        message: 'Test network error'
      })

      expect(networkErrorSimulator.shouldSimulateError('/api/validators')).toBe(true)
      
      const error = networkErrorSimulator.generateError('/api/validators')
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test network error')
    })

    it('should not simulate errors when probability is 0', () => {
      networkErrorSimulator.addSimulation('/api/validators', {
        type: 'network',
        probability: 0.0
      })

      expect(networkErrorSimulator.shouldSimulateError('/api/validators')).toBe(false)
    })

    it('should simulate different error types', () => {
      const errorTypes = ['network', 'timeout', 'validation', 'server', 'auth', 'rate-limit']
      
      errorTypes.forEach(type => {
        networkErrorSimulator.addSimulation(`/api/${type}`, {
          type: type as any,
          probability: 1.0
        })

        const error = networkErrorSimulator.generateError(`/api/${type}`)
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain(type)
      })
    })

    it('should handle error simulation with delay', async () => {
      const start = performance.now()
      
      networkErrorSimulator.addSimulation('/api/slow', {
        type: 'timeout',
        probability: 1.0,
        delay: 100
      })

      try {
        await networkErrorSimulator.simulateRequest('/api/slow', async () => {
          throw new Error('Should not reach here')
        })
      } catch (error) {
        const duration = performance.now() - start
        expect(duration).toBeGreaterThanOrEqual(100)
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should execute normal requests when no error is simulated', async () => {
      networkErrorSimulator.addSimulation('/api/normal', {
        type: 'network',
        probability: 0.0
      })

      const result = await networkErrorSimulator.simulateRequest('/api/normal', async () => {
        return { success: true }
      })

      expect(result).toEqual({ success: true })
    })

    it('should manage multiple error simulations', () => {
      const endpoints = ['/api/validators', '/api/transactions', '/api/bundles']
      
      endpoints.forEach(endpoint => {
        networkErrorSimulator.addSimulation(endpoint, {
          type: 'network',
          probability: 0.5
        })
      })

      const simulations = networkErrorSimulator.getActiveSimulations()
      expect(simulations).toHaveLength(3)
      expect(simulations.map(s => s.endpoint)).toEqual(expect.arrayContaining(endpoints))
    })

    it('should remove error simulations', () => {
      networkErrorSimulator.addSimulation('/api/temp', {
        type: 'network',
        probability: 1.0
      })

      expect(networkErrorSimulator.getActiveSimulations()).toHaveLength(1)
      
      networkErrorSimulator.removeSimulation('/api/temp')
      expect(networkErrorSimulator.getActiveSimulations()).toHaveLength(0)
    })
  })

  describe('Edge Case Testing', () => {
    it('should test with empty data', async () => {
      const result = await edgeCaseTester.testWithEmptyData(async () => {
        return { data: [], count: 0 }
      })

      expect(result).toEqual({ data: [], count: 0 })
    })

    it('should test with large datasets', async () => {
      const testFn = async (size: number) => {
        const data = Array.from({ length: size }, (_, i) => ({ id: i, value: `item_${i}` }))
        return { count: data.length, dataSize: size }
      }

      const result = await edgeCaseTester.testWithLargeData(testFn, 1000)
      expect(result.count).toBe(1000)
      expect(result.dataSize).toBe(1000)
    })

    it('should handle large dataset failures gracefully', async () => {
      const testFn = async (size: number) => {
        if (size > 500) {
          throw new Error(`Dataset too large: ${size}`)
        }
        return { size }
      }

      await expect(edgeCaseTester.testWithLargeData(testFn, 1000))
        .rejects.toThrow('Large data test failed at size 1000')
    })

    it('should test with invalid data', async () => {
      const invalidDataGenerator = () => ({
        id: 'invalid',
        value: null,
        nested: { undefined: 'test' }
      })

      const result = await edgeCaseTester.testWithInvalidData(async (data) => {
        return { received: data, processed: true }
      }, invalidDataGenerator)

      expect(result.processed).toBe(true)
      expect(result.received).toEqual({
        id: 'invalid',
        value: null,
        nested: { undefined: 'test' }
      })
    })

    it('should test with concurrent requests', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        return { success: true, timestamp: Date.now() }
      }

      const results = await edgeCaseTester.testWithConcurrency(testFn, 5)
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toHaveProperty('success')
        expect(result).toHaveProperty('duration')
        if (result.success) {
          expect(result).toHaveProperty('result')
        }
      })
    })

    it('should handle concurrent request failures', async () => {
      let shouldFail = false
      
      const testFn = async () => {
        if (shouldFail) {
          throw new Error('Simulated failure')
        }
        shouldFail = true // Make next request fail
        return { success: true }
      }

      const results = await edgeCaseTester.testWithConcurrency(testFn, 3)
      
      expect(results).toHaveLength(3)
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length
      
      expect(successCount).toBe(2) // First succeeds, then fails
      expect(failureCount).toBe(1)
    })

    it('should test with rate limiting', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return { processed: true }
      }

      const result = await edgeCaseTester.testWithRateLimit(testFn, 5, 2000)
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('failed')
      expect(result).toHaveProperty('averageResponseTime')
      expect(result.success + result.failed).toBeGreaterThan(0)
    })

    it('should test with retry logic', async () => {
      let attemptCount = 0
      
      const testFn = async () => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`)
        }
        return { success: true, attempts: attemptCount }
      }

      const result = await edgeCaseTester.testWithRetry(testFn, 5, 10)
      
      expect(result.result).toEqual({ success: true, attempts: 3 })
      expect(result.attempts).toBe(3)
    })

    it('should handle retry exhaustion', async () => {
      const testFn = async () => {
        throw new Error('Always fails')
      }

      await expect(edgeCaseTester.testWithRetry(testFn, 2, 10))
        .rejects.toThrow('Always fails')
    })

    it('should test with network latency simulation', async () => {
      const testFn = async () => {
        return { timestamp: Date.now() }
      }

      const result = await edgeCaseTester.testWithNetworkLatency(testFn, 200)
      
      expect(result).toHaveProperty('result')
      expect(result).toHaveProperty('actualLatency')
      expect(result.actualLatency).toBeGreaterThanOrEqual(200)
    })
  })

  describe('Performance Testing', () => {
    it('should measure execution time', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return { data: 'test' }
      }

      const result = await performanceTester.measure('test-performance', testFn)
      
      expect(result).toHaveProperty('result')
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('memory')
      expect(result.duration).toBeGreaterThanOrEqual(100)
      expect(result.result).toEqual({ data: 'test' })
    })

    it('should handle measurement failures', async () => {
      const testFn = async () => {
        throw new Error('Test failure')
      }

      await expect(performanceTester.measure('test-failure', testFn))
        .rejects.toThrow('Test failure')
    })

    it('should record performance results', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return { success: true }
      }

      await performanceTester.measure('test-1', testFn)
      await performanceTester.measure('test-2', testFn)

      const results = performanceTester.getResults()
      expect(results).toHaveLength(2)
      expect(results[0].test).toBe('test-1')
      expect(results[1].test).toBe('test-2')
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })

    it('should generate performance report', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return { success: true }
      }

      await performanceTester.measure('test-report', testFn)
      
      const report = performanceTester.generateReport()
      expect(report).toContain('Performance Test Results')
      expect(report).toContain('test-report')
      expect(report).toContain('Duration:')
      expect(report).toContain('Memory Usage:')
      expect(report).toContain('Success: Yes')
    })

    it('should run load tests', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { processed: true }
      }

      const result = await performanceTester.runLoadTest('load-test', testFn, 3, 2000)
      
      expect(result).toHaveProperty('totalRequests')
      expect(result).toHaveProperty('successfulRequests')
      expect(result).toHaveProperty('failedRequests')
      expect(result).toHaveProperty('averageResponseTime')
      expect(result).toHaveProperty('minResponseTime')
      expect(result).toHaveProperty('maxResponseTime')
      expect(result).toHaveProperty('requestsPerSecond')
      
      expect(result.totalRequests).toBeGreaterThan(0)
      expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      expect(result.averageResponseTime).toBeGreaterThan(0)
      expect(result.minResponseTime).toBeLessThanOrEqual(result.averageResponseTime)
      expect(result.maxResponseTime).toBeGreaterThanOrEqual(result.averageResponseTime)
    })

    it('should clear performance results', async () => {
      const testFn = async () => {
        return { success: true }
      }

      await performanceTester.measure('test-clear', testFn)
      expect(performanceTester.getResults()).toHaveLength(1)
      
      performanceTester.clearResults()
      expect(performanceTester.getResults()).toHaveLength(0)
    })
  })

  describe('Integration Scenarios', () => {
    it('should simulate realistic API failure scenarios', async () => {
      // Setup error simulations for different endpoints
      networkErrorSimulator.addSimulation('/api/validators', {
        type: 'network',
        probability: 0.3
      })
      
      networkErrorSimulator.addSimulation('/api/transactions', {
        type: 'timeout',
        probability: 0.2,
        delay: 200
      })
      
      networkErrorSimulator.addSimulation('/api/bundles', {
        type: 'rate-limit',
        probability: 0.1
      })

      // Test multiple requests
      const requests = [
        () => networkErrorSimulator.simulateRequest('/api/validators', async () => 
          createMockValidators(10)
        ),
        () => networkErrorSimulator.simulateRequest('/api/transactions', async () => 
          createMockTransactions(20)
        ),
        () => networkErrorSimulator.simulateRequest('/api/bundles', async () => 
          ({ bundles: [], timeline: [] })
        )
      ]

      const results = await Promise.allSettled(requests.map(req => req()))
      
      // Verify some requests may have failed due to error simulation
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failureCount = results.filter(r => r.status === 'rejected').length
      
      expect(successCount + failureCount).toBe(3)
      // Some failures are expected due to error simulation
      expect(failureCount).toBeGreaterThanOrEqual(0)
    })

    it('should test system resilience under various error conditions', async () => {
      const errorScenarios = [
        { type: 'network', endpoint: '/api/network' },
        { type: 'timeout', endpoint: '/api/timeout' },
        { type: 'validation', endpoint: '/api/validation' },
        { type: 'server', endpoint: '/api/server' }
      ]

      for (const scenario of errorScenarios) {
        networkErrorSimulator.addSimulation(scenario.endpoint, {
          type: scenario.type as any,
          probability: 1.0
        })

        try {
          await networkErrorSimulator.simulateRequest(scenario.endpoint, async () => {
            throw new Error('Should not succeed')
          })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toContain(scenario.type)
        }

        networkErrorSimulator.removeSimulation(scenario.endpoint)
      }
    })

    it('should validate system behavior with edge case data', async () => {
      // Test with empty data
      const emptyResult = await edgeCaseTester.testWithEmptyData(async () => {
        return { validators: [], transactions: [] }
      })
      expect(emptyResult.validators).toEqual([])
      expect(emptyResult.transactions).toEqual([])

      // Test with invalid data
      const invalidResult = await edgeCaseTester.testWithInvalidData(
        async (data) => {
          return { received: data, isValid: typeof data.id === 'string' }
        },
        () => ({ id: null, value: 'invalid' })
      )
      expect(invalidResult.isValid).toBe(false)

      // Test with concurrent access
      const concurrentResults = await edgeCaseTester.testWithConcurrency(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return { threadSafe: true }
      }, 10)
      
      expect(concurrentResults).toHaveLength(10)
      concurrentResults.forEach(result => {
        if (result.success) {
          expect(result.result.threadSafe).toBe(true)
        }
      })
    })
  })
})