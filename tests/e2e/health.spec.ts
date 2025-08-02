import { test, expect } from '@playwright/test'

test.describe('Health Check E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the health page
    await page.goto('/api/health')
  })

  test('should display health status', async ({ page }) => {
    // The API should return JSON, so we need to check the response
    const response = await page.request.get('/api/health')
    const data = await response.json()

    expect(response.status()).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.database).toBe('connected')
    expect(data.uptime).toBeGreaterThan(0)
    expect(data.memory).toBeDefined()
    expect(data.cpu).toBeDefined()
  })

  test('should include performance metrics', async ({ page }) => {
    const response = await page.request.get('/api/health')
    const data = await response.json()

    expect(data.memory.rss).toBeGreaterThan(0)
    expect(data.memory.heapTotal).toBeGreaterThan(0)
    expect(data.memory.heapUsed).toBeGreaterThan(0)
    expect(data.cpu.user).toBeGreaterThanOrEqual(0)
    expect(data.cpu.system).toBeGreaterThanOrEqual(0)
  })

  test('should handle comprehensive health check', async ({ page }) => {
    const response = await page.request.post('/api/health')
    const data = await response.json()

    expect(response.status()).toBe(200)
    expect(data.status).toMatch(/healthy|degraded/)
    expect(data.diagnostics).toBeDefined()
    expect(data.diagnostics.database).toBeDefined()
    expect(data.diagnostics.memory).toBeDefined()
    expect(data.diagnostics.disk).toBeDefined()
    expect(data.diagnostics.network).toBeDefined()
    expect(data.diagnostics.services).toBeDefined()
    expect(data.summary).toBeDefined()
  })

  test('should respond within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    const response = await page.request.get('/api/health')
    const endTime = Date.now()

    expect(response.status()).toBe(200)
    expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max
  })
})

test.describe('Blockchain API E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load blockchain status', async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="blockchain-status"]', { timeout: 10000 })
    
    // Check if blockchain status is displayed
    const statusElement = await page.locator('[data-testid="blockchain-status"]')
    await expect(statusElement).toBeVisible()
    
    // Check if key metrics are displayed
    const totalTransactions = await page.locator('[data-testid="total-transactions"]')
    await expect(totalTransactions).toBeVisible()
    
    const quantumScore = await page.locator('[data-testid="quantum-score"]')
    await expect(quantumScore).toBeVisible()
  })

  test('should handle transaction creation', async ({ page }) => {
    // Navigate to transaction page
    await page.click('[data-testid="create-transaction"]')
    
    // Wait for form to load
    await page.waitForSelector('[data-testid="transaction-form"]', { timeout: 10000 })
    
    // Fill in transaction details
    await page.fill('[data-testid="receiver-address"]', '0x2345678901234567890123456789012345678901')
    await page.fill('[data-testid="amount"]', '100')
    await page.fill('[data-testid="fee"]', '1')
    
    // Submit transaction
    await page.click('[data-testid="submit-transaction"]')
    
    // Wait for success message
    await page.waitForSelector('[data-testid="transaction-success"]', { timeout: 10000 })
    
    // Verify success message
    const successMessage = await page.locator('[data-testid="transaction-success"]')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toHaveText(/Transaction created successfully/)
  })

  test('should display transaction history', async ({ page }) => {
    // Navigate to transaction history
    await page.click('[data-testid="transaction-history"]')
    
    // Wait for history to load
    await page.waitForSelector('[data-testid="transaction-list"]', { timeout: 10000 })
    
    // Check if transactions are displayed
    const transactionItems = await page.locator('[data-testid="transaction-item"]')
    await expect(transactionItems.first()).toBeVisible()
    
    // Verify transaction details
    const firstTransaction = await transactionItems.first()
    const transactionId = await firstTransaction.locator('[data-testid="transaction-id"]').textContent()
    const transactionAmount = await firstTransaction.locator('[data-testid="transaction-amount"]').textContent()
    
    expect(transactionId).toBeDefined()
    expect(transactionAmount).toBeDefined()
  })

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Navigate to transaction page
    await page.click('[data-testid="create-transaction"]')
    
    // Wait for form to load
    await page.waitForSelector('[data-testid="transaction-form"]', { timeout: 10000 })
    
    // Submit with invalid data
    await page.fill('[data-testid="receiver-address"]', 'invalid-address')
    await page.fill('[data-testid="amount"]', '-100')
    await page.click('[data-testid="submit-transaction"]')
    
    // Wait for error message
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 })
    
    // Verify error message
    const errorMessage = await page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText(/Invalid input/)
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    await page.waitForSelector('[data-testid="blockchain-status"]', { timeout: 10000 })
    const mobileStatus = await page.locator('[data-testid="blockchain-status"]')
    await expect(mobileStatus).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    await page.waitForSelector('[data-testid="blockchain-status"]', { timeout: 10000 })
    const tabletStatus = await page.locator('[data-testid="blockchain-status"]')
    await expect(tabletStatus).toBeVisible()
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    await page.waitForSelector('[data-testid="blockchain-status"]', { timeout: 10000 })
    const desktopStatus = await page.locator('[data-testid="blockchain-status"]')
    await expect(desktopStatus).toBeVisible()
  })
})

test.describe('Performance E2E Tests', () => {
  test('should load main page quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const endTime = Date.now()
    
    await page.waitForSelector('[data-testid="blockchain-status"]', { timeout: 10000 })
    
    expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max load time
  })

  test('should handle concurrent requests', async ({ page }) => {
    // Create multiple concurrent requests
    const requests = []
    for (let i = 0; i < 10; i++) {
      requests.push(page.request.get('/api/health'))
    }
    
    const responses = await Promise.all(requests)
    
    // All requests should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200)
    }
  })

  test('should maintain performance under load', async ({ page }) => {
    // Simulate rapid navigation
    const navigationTimes = []
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForSelector('[data-testid="blockchain-status"]', { timeout: 10000 })
      const endTime = Date.now()
      navigationTimes.push(endTime - startTime)
    }
    
    // Calculate average navigation time
    const averageTime = navigationTimes.reduce((sum, time) => sum + time, 0) / navigationTimes.length
    
    expect(averageTime).toBeLessThan(3000) // 3 seconds average
  })
})
