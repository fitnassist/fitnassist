import { test, expect } from '@playwright/test';
import { TEST_TRAINEE, TEST_TRAINER, loginViaUI } from './helpers/auth';

test.describe('Authentication', () => {
  test('login as trainee redirects to dashboard', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login as trainer redirects to dashboard', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINER.email, TEST_TRAINER.password);
    await expect(page).toHaveURL(/\/(dashboard|trainer)/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('nonexistent@test.com');
    await page.locator('#password').fill('WrongPassword1!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('protected route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('protected route /dashboard/messages redirects to login', async ({ page }) => {
    await page.goto('/dashboard/messages');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('social auth buttons render on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with apple/i })).toBeVisible();
  });

  test('social auth buttons render on register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with apple/i })).toBeVisible();
  });

  test('select-role page shows role options when authenticated', async ({ page }) => {
    await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);
    await page.goto('/select-role');
    await expect(page.getByText(/trainee/i).first()).toBeVisible();
    await expect(page.getByText(/personal trainer/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('select-role page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/select-role');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
