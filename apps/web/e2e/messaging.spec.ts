import { test, expect } from '@playwright/test';
import { TEST_TRAINEE, loginViaUI } from './helpers/auth';

test.describe('Messaging', () => {
  test('messages page loads', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);

    await page.goto('/dashboard/messages');
    await expect(page.getByText(/messages/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('seeded conversation is visible', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);

    await page.goto('/dashboard/messages');
    // The seed creates a conversation between trainer and trainee
    await expect(page.getByText(/coach sarah/i).first()).toBeVisible({ timeout: 10000 });
  });
});
