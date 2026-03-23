import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const timestamp = Date.now();

  test('register as trainee redirects to dashboard', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/name/i).fill('Test Trainee');
    await page.getByLabel(/email/i).fill(`trainee-${timestamp}@test.com`);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');

    // Select trainee role
    const traineeOption = page.getByText(/trainee/i).first();
    await traineeOption.click();

    await page.getByRole('button', { name: /sign up|register|create/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('register as trainer redirects to profile create', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/name/i).fill('Test Trainer');
    await page.getByLabel(/email/i).fill(`trainer-${timestamp}@test.com`);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');

    const trainerOption = page.getByText(/personal trainer/i).first();
    await trainerOption.click();

    await page.getByRole('button', { name: /sign up|register|create/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|trainer)/, { timeout: 10000 });
  });

  test('login with valid credentials', async ({ page }) => {
    // First register
    await page.goto('/register');
    const email = `login-test-${timestamp}@test.com`;
    await page.getByLabel(/name/i).fill('Login Test');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');
    const traineeOption = page.getByText(/trainee/i).first();
    await traineeOption.click();
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Logout
    await page.goto('/');

    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('Test1234!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('nonexistent@test.com');
    await page.getByLabel(/password/i).fill('WrongPassword1!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 5000 });
  });
});
