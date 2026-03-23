import { test, expect } from '@playwright/test';

test.describe('Trainee Flow', () => {
  const timestamp = Date.now();

  test('trainee can view contacts page', async ({ page }) => {
    // Register as trainee
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Flow Trainee');
    await page.getByLabel(/email/i).fill(`trainee-flow-${timestamp}@test.com`);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');

    const traineeOption = page.getByText(/trainee/i).first();
    await traineeOption.click();
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to contacts
    await page.goto('/dashboard/contacts');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });
});
