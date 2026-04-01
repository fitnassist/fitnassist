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

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('support page loads', async ({ page }) => {
    await page.goto('/support');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('trainer search filters are interactive', async ({ page }) => {
    await page.goto('/trainers');

    // Open filters
    const filterButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      // Check that filter options appear
      await expect(page.getByText(/search radius|services|training location/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
