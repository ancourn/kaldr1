import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { middleware, withErrorHandling, AppError, ValidationError, RateLimitError } from '@/middleware'

// Mock Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
    json: jest.fn(),
  },
}))

describe('Middleware', () => {
  let mockRequest: Partial<NextRequest>
  let mockNextResponse: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRequest = {
      nextUrl: { pathname: '/api/test' },
      method: 'GET',
      headers: new Map(),
      ip: '192.168.1.1',
    }
    
    mockNextResponse = {
      headers: {
        set: jest.fn(),
      },
    }
    
    ;(NextResponse.next as jest.Mock).mockReturnValue(mockNextResponse)
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      mockRequest.headers = new Map([
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      const response = await middleware(mockRequest as NextRequest)
      
      expect(response).toBe(mockNextResponse)
      expect(mockNextResponse.headers.set).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        '100'
      )
    })

    it('should block requests exceeding rate limit', async () => {
      mockRequest.headers = new Map([
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      // Simulate many requests to exceed rate limit
      for (let i = 0; i < 150; i++) {
        try {
          await middleware(mockRequest as NextRequest)
        } catch (error) {
          if (error instanceof RateLimitError) {
            expect(error.statusCode).toBe(429)
            expect(error.message).toContain('Rate limit exceeded')
            return
          }
        }
      }
    })

    it('should use different rate limits for different categories', async () => {
      // Test API endpoint
      mockRequest.nextUrl = { pathname: '/api/auth/login' }
      mockRequest.headers = new Map([
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      const response = await middleware(mockRequest as NextRequest)
      
      expect(mockNextResponse.headers.set).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        '5'
      ) // Auth rate limit
    })
  })

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      mockRequest.headers = new Map([
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      await middleware(mockRequest as NextRequest)

      const securityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Content-Security-Policy',
      ]

      securityHeaders.forEach(header => {
        expect(mockNextResponse.headers.set).toHaveBeenCalledWith(
          header,
          expect.any(String)
        )
      })
    })
  })

  describe('Input Validation', () => {
    it('should validate POST request data', async () => {
      mockRequest.method = 'POST'
      mockRequest.headers = new Map([
        ['content-type', 'application/json'],
        ['content-length', '100'],
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      const response = await middleware(mockRequest as NextRequest)
      
      expect(response).toBe(mockNextResponse)
    })

    it('should reject invalid content type', async () => {
      mockRequest.method = 'POST'
      mockRequest.headers = new Map([
        ['content-type', 'text/plain'],
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      await expect(middleware(mockRequest as NextRequest)).rejects.toThrow(
        ValidationError
      )
    })

    it('should reject oversized requests', async () => {
      mockRequest.method = 'POST'
      mockRequest.headers = new Map([
        ['content-type', 'application/json'],
        ['content-length', '2000000'], // 2MB
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      await expect(middleware(mockRequest as NextRequest)).rejects.toThrow(
        ValidationError
      )
    })
  })

  describe('Path Validation', () => {
    it('should reject path traversal attempts', async () => {
      mockRequest.nextUrl = { pathname: '/api/../../../etc/passwd' }
      mockRequest.headers = new Map([
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      await expect(middleware(mockRequest as NextRequest)).rejects.toThrow(
        'Invalid path'
      )
    })

    it('should reject suspicious file extensions', async () => {
      mockRequest.nextUrl = { pathname: '/api/test.php' }
      mockRequest.headers = new Map([
        ['user-agent', 'test-agent'],
        ['x-forwarded-for', '192.168.1.1'],
      ])

      await expect(middleware(mockRequest as NextRequest)).rejects.toThrow(
        'Invalid path'
      )
    })
  })
})

describe('Error Handling', () => {
  describe('AppError', () => {
    it('should create error with status code and message', () => {
      const error = new AppError(400, 'Bad request')
      
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Bad request')
      expect(error.name).toBe('AppError')
    })

    it('should create error with code', () => {
      const error = new AppError(400, 'Bad request', 'INVALID_INPUT')
      
      expect(error.code).toBe('INVALID_INPUT')
    })
  })

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input')
      
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid email', 'email')
      
      expect(error.code).toBe('VALIDATION_ERROR_EMAIL')
    })
  })

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError('Too many requests')
      
      expect(error.statusCode).toBe(429)
      expect(error.message).toBe('Too many requests')
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError('Too many requests', 60)
      
      expect(error.retryAfter).toBe(60)
    })
  })

  describe('withErrorHandling', () => {
    it('should handle successful operations', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      const result = await withErrorHandling(operation)
      
      expect(result).toBe('success')
    })

    it('should handle AppError instances', async () => {
      const error = new AppError(400, 'Bad request')
      const operation = jest.fn().mockRejectedValue(error)
      
      await expect(withErrorHandling(operation)).rejects.toThrow(error)
    })

    it('should use fallback data when available', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'))
      const fallbackKey = 'test-fallback'
      
      const result = await withErrorHandling(operation, { fallbackKey })
      
      expect(result).toEqual({
        status: 'degraded',
        name: 'KALDRIX Mainnet',
        blockHeight: 0,
        totalTransactions: 0,
        quantumResistanceScore: 76
      })
    })

    it('should wrap non-AppError instances', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Generic error'))
      
      await expect(withErrorHandling(operation)).rejects.toThrow(
        'Operation failed'
      )
    })
  })
})
