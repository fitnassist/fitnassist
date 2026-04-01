import { test, expect } from '@playwright/test';
import { TEST_TRAINEE, loginViaUI } from './helpers/auth';

test.describe('Trainee Flow', () => {
  test('trainee can navigate dashboard sections', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);

    const sections = [
      '/dashboard/contacts',
      '/dashboard/messages',
      '/dashboard/bookings',
      '/dashboard/diary',
      '/dashboard/goals',
      '/dashboard/friends',
      '/dashboard/feed',
      '/dashboard/settings',
    ];

    for (const section of sections) {
      await page.goto(section);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('trainee can access goals page and open create dialog', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);

    await page.goto('/dashboard/goals');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    const createButton = page.getByRole('button', { name: /create|add|new/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      // Verify dialog opens
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }
  });
});
