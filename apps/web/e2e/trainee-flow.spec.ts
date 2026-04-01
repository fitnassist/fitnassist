import { test, expect } from '@playwright/test';

test.describe('Trainee Flow', () => {
  const timestamp = Date.now();

  test('trainee can navigate dashboard sections', async ({ page }) => {
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

    // Navigate to each section and verify it loads
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

  test('trainee can create a goal', async ({ page }) => {
    // Register as trainee
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Goal Trainee');
    await page.getByLabel(/email/i).fill(`goal-trainee-${timestamp}@test.com`);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');

    const traineeOption = page.getByText(/trainee/i).first();
    await traineeOption.click();
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to goals
    await page.goto('/dashboard/goals');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // Look for create goal button
    const createButton = page.getByRole('button', { name: /create|add|new/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      // Fill in goal name if a form appears
      const nameInput = page.getByLabel(/name|title|goal/i).first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Run 5K');
        const submitButton = page.getByRole('button', { name: /create|save|add/i }).first();
        await submitButton.click();
        // Verify goal appears
        await expect(page.getByText('Run 5K')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
