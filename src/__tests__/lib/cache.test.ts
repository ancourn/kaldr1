import { SimpleCache, blockchainCache, transactionCache, withCache, withTiming } from '@/lib/cache'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

describe('Cache System', () => {
  let cache: SimpleCache

  beforeEach(() => {
    cache = new SimpleCache(1000, 10) // 1 second TTL, max 10 entries
  })

  describe('SimpleCache', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key'
      const value = { data: 'test-value' }
      
      cache.set(key, value)
      const retrieved = cache.get(key)
      
      expect(retrieved).toEqual(value)
    })

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('should expire entries after TTL', () => {
      const key = 'test-key'
      const value = { data: 'test-value' }
      
      cache.set(key, value)
      
      // Mock time to simulate TTL expiration
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000)
      
      const result = cache.get(key)
      expect(result).toBeNull()
    })

    it('should evict oldest entries when cache is full', () => {
      // Fill cache to capacity
      for (let i = 0; i < 12; i++) {
        cache.set(`key-${i}`, { data: `value-${i}` })
      }
      
      // First entries should be evicted
      expect(cache.get('key-0')).toBeNull()
      expect(cache.get('key-1')).toBeNull()
      
      // Last entries should still be there
      expect(cache.get('key-10')).not.toBeNull()
      expect(cache.get('key-11')).not.toBeNull()
    })

    it('should track cache statistics', () => {
      cache.set('key1', 'value1')
      cache.get('key1') // hit
      cache.get('key2') // miss
      
      const stats = cache.getStats()
      
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(50)
      expect(stats.size).toBe(1)
    })
  })

  describe('Pre-configured Caches', () => {
    it('should have different configurations for different cache types', () => {
      expect(blockchainCache).toBeInstanceOf(SimpleCache)
      expect(transactionCache).toBeInstanceOf(SimpleCache)
      
      // Test that they have different configurations
      const blockchainStats = blockchainCache.getStats()
      const transactionStats = transactionCache.getStats()
      
      expect(blockchainStats.maxSize).toBe(500)
      expect(transactionStats.maxSize).toBe(1000)
    })
  })

  describe('withCache helper', () => {
    it('should return cached value when available', async () => {
      const key = 'test-key'
      const cachedValue = { data: 'cached-value' }
      const mockFn = jest.fn().mockResolvedValue('fresh-value')
      
      cache.set(key, cachedValue)
      
      const result = await withCache(key, mockFn, cache)
      
      expect(result).toEqual(cachedValue)
      expect(mockFn).not.toHaveBeenCalled() // Should not call the function
    })

    it('should call function and cache result when not cached', async () => {
      const key = 'test-key'
      const freshValue = { data: 'fresh-value' }
      const mockFn = jest.fn().mockResolvedValue(freshValue)
      
      const result = await withCache(key, mockFn, cache)
      
      expect(result).toEqual(freshValue)
      expect(mockFn).toHaveBeenCalled()
      
      // Should be cached now
      const cachedResult = cache.get(key)
      expect(cachedResult).toEqual(freshValue)
    })

    it('should retry failed operations', async () => {
      const key = 'test-key'
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success')
      
      const result = await withCache(key, mockFn, cache, { retries: 2 })
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should use fallback when provided', async () => {
      const key = 'test-key'
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'))
      const fallbackFn = jest.fn().mockResolvedValue('fallback-value')
      
      const result = await withCache(key, mockFn, cache, { 
        retries: 1, 
        fallback: fallbackFn 
      })
      
      expect(result).toBe('fallback-value')
      expect(fallbackFn).toHaveBeenCalled()
    })
  })

  describe('withTiming helper', () => {
    it('should measure execution time', async () => {
      const mockFn = jest.fn().mockResolvedValue('result')
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await withTiming(mockFn, 'test-operation')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-operation took')
      )
      
      consoleSpy.mockRestore()
    })

    it('should log performance warnings for slow operations', async () => {
      const mockFn = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1500)) // 1.5 seconds
        return 'result'
      })
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await withTiming(mockFn, 'slow-operation')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance warning')
      )
      
      consoleSpy.mockRestore()
    })
  })
})
