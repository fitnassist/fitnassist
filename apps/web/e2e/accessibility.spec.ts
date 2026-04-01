import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TEST_TRAINEE, loginViaUI } from './helpers/auth';

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
  for (const pg of publicPages) {
    test(`${pg.name} has no accessibility violations`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('Accessibility - Authenticated Pages', () => {
  const dashboardPages = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'messages', path: '/dashboard/messages' },
    { name: 'contacts', path: '/dashboard/contacts' },
    { name: 'settings', path: '/dashboard/settings' },
    { name: 'bookings', path: '/dashboard/bookings' },
  ];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);
    await page.context().storageState({ path: 'e2e/.auth/a11y-user.json' });
    await page.close();
  });

  for (const dp of dashboardPages) {
    test(`${dp.name} has no accessibility violations`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: 'e2e/.auth/a11y-user.json' });
      const page = await context.newPage();

      await page.goto(dp.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();

      expect(results.violations).toEqual([]);

      await context.close();
    });
  }
});
