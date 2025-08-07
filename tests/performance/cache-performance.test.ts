import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { SimpleCache, withCache, withTiming, PerformanceMonitor } from '@/lib/cache'

describe('Cache Performance Tests', () => {
  let cache: SimpleCache
  let performanceMonitor: PerformanceMonitor

  beforeEach(() => {
    cache = new SimpleCache(60000, 1000) // 1 minute TTL, 1000 entries
    performanceMonitor = new PerformanceMonitor()
    jest.clearAllMocks()
  })

  describe('Cache Read Performance', () => {
    it('should handle high read throughput', async () => {
      const iterations = 10000
      const testData = Array.from({ length: 100 }, (_, i) => ({
        key: `key-${i}`,
        value: { data: `value-${i}`, timestamp: Date.now() },
      }))

      // Pre-populate cache
      testData.forEach(({ key, value }) => cache.set(key, value))

      // Measure read performance
      const endTiming = performanceMonitor.startTiming('cache-read')
      
      for (let i = 0; i < iterations; i++) {
        const key = `key-${i % 100}`
        cache.get(key)
      }
      
      endTiming()

      const stats = performanceMonitor.getStats('cache-read')
      
      expect(stats.count).toBe(iterations)
      expect(stats.average).toBeLessThan(1) // Should be very fast (< 1ms per read)
      expect(stats.max).toBeLessThan(10) // No single read should take more than 10ms
    })

    it('should maintain performance with cache misses', async () => {
      const iterations = 5000
      const hitRate = 0.7 // 70% cache hit rate

      // Pre-populate some data
      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, { data: `value-${i}` })
      }

      const endTiming = performanceMonitor.startTiming('cache-mixed-read')
      
      for (let i = 0; i < iterations; i++) {
        const key = Math.random() < hitRate ? `key-${Math.floor(Math.random() * 100)}` : `non-existent-${i}`
        cache.get(key)
      }
      
      endTiming()

      const stats = performanceMonitor.getStats('cache-mixed-read')
      
      expect(stats.count).toBe(iterations)
      expect(stats.average).toBeLessThan(2) // Should still be fast even with misses
    })
  })

  describe('Cache Write Performance', () => {
    it('should handle high write throughput', async () => {
      const iterations = 5000

      const endTiming = performanceMonitor.startTiming('cache-write')
      
      for (let i = 0; i < iterations; i++) {
        cache.set(`key-${i}`, { data: `value-${i}`, timestamp: Date.now() })
      }
      
      endTiming()

      const stats = performanceMonitor.getStats('cache-write')
      
      expect(stats.count).toBe(iterations)
      expect(stats.average).toBeLessThan(2) // Should be fast (< 2ms per write)
    })

    it('should handle cache eviction efficiently', async () => {
      const cacheSize = 100
      const smallCache = new SimpleCache(60000, cacheSize)
      
      // Fill cache beyond capacity
      const endTiming = performanceMonitor.startTiming('cache-eviction')
      
      for (let i = 0; i < cacheSize * 2; i++) {
        smallCache.set(`key-${i}`, { data: `value-${i}` })
      }
      
      endTiming()

      const stats = performanceMonitor.getStats('cache-eviction')
      
      expect(stats.count).toBe(cacheSize * 2)
      expect(stats.average).toBeLessThan(5) // Eviction should be efficient
      
      // Verify eviction worked
      expect(smallCache.get('key-0')).toBeNull() // First entry should be evicted
      expect(smallCache.get(`key-${cacheSize * 2 - 1}`)).not.toBeNull() // Last entry should remain
    })
  })

  describe('withCache Performance', () => {
    it('should be faster with cached results', async () => {
      const mockFunction = jest.fn().mockResolvedValue('result')
      const key = 'test-key'

      // First call - should cache the result
      const firstTiming = performanceMonitor.startTiming('first-call')
      await withCache(key, mockFunction, cache)
      firstTiming()

      // Second call - should use cache
      const secondTiming = performanceMonitor.startTiming('cached-call')
      await withCache(key, mockFunction, cache)
      secondTiming()

      const firstStats = performanceMonitor.getStats('first-call')
      const secondStats = performanceMonitor.getStats('cached-call')

      expect(secondStats.average).toBeLessThan(firstStats.average)
      expect(mockFunction).toHaveBeenCalledTimes(1) // Should only be called once
    })

    it('should handle concurrent cache requests efficiently', async () => {
      const mockFunction = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate slow operation
        return 'result'
      })
      
      const key = 'concurrent-key'
      const concurrentRequests = 50

      const endTiming = performanceMonitor.startTiming('concurrent-cache')
      
      const promises = Array.from({ length: concurrentRequests }, () => 
        withCache(key, mockFunction, cache)
      )
      
      await Promise.all(promises)
      endTiming()

      const stats = performanceMonitor.getStats('concurrent-cache')
      
      expect(stats.count).toBe(concurrentRequests)
      expect(stats.average).toBeLessThan(200) // Should be much faster than individual calls
      expect(mockFunction).toHaveBeenCalledTimes(1) // Should only be called once
    })
  })

  describe('Memory Usage Performance', () => {
    it('should not leak memory during operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Perform many cache operations
      for (let i = 0; i < 10000; i++) {
        cache.set(`key-${i}`, { data: `value-${i}` })
        cache.get(`key-${i}`)
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 10MB for 10k operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should clean up expired entries efficiently', async () => {
      const shortTtlCache = new SimpleCache(100, 1000) // 100ms TTL
      
      // Add entries
      for (let i = 0; i < 500; i++) {
        shortTtlCache.set(`key-${i}`, { data: `value-${i}` })
      }
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Access all entries to trigger cleanup
      const endTiming = performanceMonitor.startTiming('cache-cleanup')
      
      for (let i = 0; i < 500; i++) {
        shortTtlCache.get(`key-${i}`)
      }
      
      endTiming()

      const stats = performanceMonitor.getStats('cache-cleanup')
      
      expect(stats.count).toBe(500)
      expect(stats.average).toBeLessThan(5) // Cleanup should be efficient
      
      // Verify entries are cleaned up
      expect(shortTtlCache.get('key-0')).toBeNull()
    })
  })

  describe('Scalability Performance', () => {
    it('should scale linearly with cache size', async () => {
      const sizes = [100, 1000, 5000]
      const timings: { size: number; averageTime: number }[] = []

      for (const size of sizes) {
        const testCache = new SimpleCache(60000, size)
        
        // Populate cache
        for (let i = 0; i < size; i++) {
          testCache.set(`key-${i}`, { data: `value-${i}` })
        }
        
        const endTiming = performanceMonitor.startTiming(`scale-test-${size}`)
        
        // Read all entries
        for (let i = 0; i < size; i++) {
          testCache.get(`key-${i}`)
        }
        
        endTiming()
        
        const stats = performanceMonitor.getStats(`scale-test-${size}`)
        timings.push({ size, averageTime: stats.average })
      }

      // Performance should scale linearly (not exponentially)
      const ratio1000to100 = timings[1].averageTime / timings[0].averageTime
      const ratio5000to100 = timings[2].averageTime / timings[0].averageTime
      
      expect(ratio1000to100).toBeLessThan(20) // Should be less than 20x slower for 10x data
      expect(ratio5000to100).toBeLessThan(100) // Should be less than 100x slower for 50x data
    })

    it('should handle concurrent access patterns', async () => {
      const concurrentUsers = 100
      const operationsPerUser = 50
      
      const endTiming = performanceMonitor.startTiming('concurrent-patterns')
      
      const promises = Array.from({ length: concurrentUsers }, async (userIndex) => {
        const userCache = new SimpleCache(60000, 100)
        
        for (let i = 0; i < operationsPerUser; i++) {
          const key = `user-${userIndex}-key-${i}`
          const value = { data: `user-${userIndex}-value-${i}` }
          
          // Mix of reads and writes
          if (i % 3 === 0) {
            userCache.get(key)
          } else {
            userCache.set(key, value)
          }
        }
      })
      
      await Promise.all(promises)
      endTiming()

      const stats = performanceMonitor.getStats('concurrent-patterns')
      
      expect(stats.count).toBe(concurrentUsers * operationsPerUser)
      expect(stats.average).toBeLessThan(5) // Should handle concurrent access efficiently
    })
  })
})
