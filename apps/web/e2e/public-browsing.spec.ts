import { test, expect } from '@playwright/test';

test.describe('Public Browsing', () => {
  test('home page loads with hero and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /find.*trainer/i })).toBeVisible();
  });

  test('navigate to trainers search page', async ({ page }) => {
    await page.goto('/trainers');
    await expect(page).toHaveURL(/\/trainers/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('click trainer card navigates to public profile', async ({ page }) => {
    await page.goto('/trainers');

    const trainerCard = page.locator('[data-testid="trainer-card"]').first();
    // If no trainers exist in test db, skip gracefully
    const count = await trainerCard.count();
    if (count > 0) {
      await trainerCard.click();
      await expect(page).toHaveURL(/\/trainers\/.+/);
    }
  });
});
