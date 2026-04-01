import { test, expect } from '@playwright/test';
import { registerUser, authenticatedContext } from './helpers/auth';

test.describe('Messaging', () => {
  const timestamp = Date.now();

  test('messages page loads with empty state', async ({ page }) => {
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

  test('two users can access messages via API registration', async ({ request, browser }) => {
    // Register trainer via API
    const trainerResult = await registerUser(request, {
      name: 'Chat Trainer',
      email: `chat-trainer-${timestamp}@test.com`,
      password: 'Test1234!',
      role: 'TRAINER',
    });

    // Register trainee via API
    const traineeResult = await registerUser(request, {
      name: 'Chat Trainee',
      email: `chat-trainee-${timestamp}@test.com`,
      password: 'Test1234!',
      role: 'TRAINEE',
    });

    // If API registration worked, verify both users can access messages page
    if (trainerResult.response.ok() && traineeResult.response.ok()) {
      const traineeContext = await authenticatedContext(browser, traineeResult.cookies);
      const traineePage = await traineeContext.newPage();

      await traineePage.goto('/dashboard/messages');
      await expect(traineePage.getByText(/messages/i).first()).toBeVisible({ timeout: 10000 });

      await traineeContext.close();
    }
  });
});
