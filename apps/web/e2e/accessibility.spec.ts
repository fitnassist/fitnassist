import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicPages = [
  { name: 'home', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'trainers', path: '/trainers' },
  { name: 'pricing', path: '/pricing' },
  { name: 'terms', path: '/terms' },
  { name: 'privacy', path: '/privacy' },
  { name: 'support', path: '/support' },
];

test.describe('Accessibility - Public Pages', () => {
  for (const page of publicPages) {
    test(`${page.name} has no accessibility violations`, async ({ page: p }) => {
      await p.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: p })
        .disableRules(['color-contrast']) // Disable until design system is audited
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('Accessibility - Authenticated Pages', () => {
  const timestamp = Date.now();
  const dashboardPages = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'messages', path: '/dashboard/messages' },
    { name: 'contacts', path: '/dashboard/contacts' },
    { name: 'settings', path: '/dashboard/settings' },
    { name: 'bookings', path: '/dashboard/bookings' },
  ];

  test.beforeAll(async ({ browser }) => {
    // Register a user via the UI once for all tests in this describe
    const page = await browser.newPage();
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('A11y User');
    await page.getByLabel(/email/i).fill(`a11y-${timestamp}@test.com`);
    await page.getByLabel(/^password$/i).fill('Test1234!');
    await page.getByLabel(/confirm/i).fill('Test1234!');
    const traineeOption = page.getByText(/trainee/i).first();
    await traineeOption.click();
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    // Save storage state for reuse
    await page.context().storageState({ path: 'e2e/.auth/a11y-user.json' });
    await page.close();
  });

  for (const dp of dashboardPages) {
    test(`${dp.name} has no accessibility violations`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: 'e2e/.auth/a11y-user.json' });
      const page = await context.newPage();

      await page.goto(dp.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();

      expect(results.violations).toEqual([]);

      await context.close();
    });
  }
});
