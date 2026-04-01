import { test, expect } from '@playwright/test';
import { TEST_TRAINEE, loginViaUI } from './helpers/auth';

test.describe('Profile Management', () => {
  test('trainee can access settings page', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);

    await page.goto('/dashboard/settings');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });
});
