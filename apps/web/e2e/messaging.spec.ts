import { test, expect } from '@playwright/test';

test.describe('Messaging', () => {
  test('messages page loads', async ({ page }) => {
    const timestamp = Date.now();

    // Register as trainee
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Msg Trainee');
    await page.getByLabel(/email/i).fill(`msg-trainee-${timestamp}@test.com`);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');

    const traineeOption = page.getByText(/trainee/i).first();
    await traineeOption.click();
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to messages
    await page.goto('/dashboard/messages');
    await expect(page.getByText(/messages/i).first()).toBeVisible({ timeout: 10000 });
  });
});
