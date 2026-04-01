import { test, expect } from '@playwright/test';
import { TEST_TRAINER, loginViaUI } from './helpers/auth';

test.describe('Trainer Flow', () => {
  test('trainer views dashboard', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINER.email, TEST_TRAINER.password);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('trainer can navigate dashboard sections', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINER.email, TEST_TRAINER.password);

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
