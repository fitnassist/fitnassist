import { test, expect } from '@playwright/test';

test.describe('Trainer Flow', () => {
  const timestamp = Date.now();
  const trainerEmail = `trainer-flow-${timestamp}@test.com`;

  test('trainer creates profile and views dashboard', async ({ page }) => {
    // Register as trainer
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Flow Trainer');
    await page.getByLabel(/email/i).fill(trainerEmail);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');

    const trainerOption = page.getByText(/personal trainer/i).first();
    await trainerOption.click();

    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await page.waitForURL(/\/(dashboard|trainer)/, { timeout: 10000 });

    // Should be redirected to create profile or be on dashboard
    await expect(page.locator('h1')).toBeVisible();
  });

  test('trainer can navigate dashboard sections', async ({ page }) => {
    // Register as trainer
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Nav Trainer');
    await page.getByLabel(/email/i).fill(`nav-trainer-${timestamp}@test.com`);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');

    const trainerOption = page.getByText(/personal trainer/i).first();
    await trainerOption.click();
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await page.waitForURL(/\/(dashboard|trainer)/, { timeout: 10000 });

    // Navigate to each section and verify it loads
    const sections = [
      '/dashboard/requests',
      '/dashboard/messages',
      '/dashboard/bookings',
      '/dashboard/settings',
    ];

    for (const section of sections) {
      await page.goto(section);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
