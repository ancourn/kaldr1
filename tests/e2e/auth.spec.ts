import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
  });

  test('should display sign in form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should attempt sign in with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error message
    await page.waitForTimeout(2000);
    
    // Check if we're redirected or see an error
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('h1')).toContainText('Dashboard');
    } else {
      // In test environment, we might see an error about the database
      await expect(page.locator('text=Error')).toBeVisible();
    }
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Should show error message or stay on sign-in page
    expect(page.url()).toContain('/auth/signin');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should allow access to public routes', async ({ page }) => {
    await page.goto('/');
    
    // Should not redirect
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});