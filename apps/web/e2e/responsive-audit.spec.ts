import { test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const publicPages = [
  { name: 'home', path: '/' },
  { name: 'trainers', path: '/trainers' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
];

for (const vp of viewports) {
  test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const page of publicPages) {
      test(`${page.name}`, async ({ page: p }) => {
        await p.goto(page.path, { waitUntil: 'networkidle' });
        await p.waitForTimeout(500);
        await p.screenshot({
          path: `e2e/screenshots/${vp.name}-${page.name}.png`,
          fullPage: true,
        });
      });
    }
  });
}

// Authenticated dashboard pages - register then screenshot
test.describe('dashboard pages', () => {
  for (const vp of viewports) {
    test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test(`dashboard`, async ({ page }) => {
        const ts = Date.now();
        // Register
        await page.goto('/register');
        await page.getByLabel(/name/i).fill('Audit User');
        await page.getByLabel(/email/i).fill(`audit-${vp.name}-${ts}@test.com`);
        await page.getByLabel(/^password$/i).fill('Test1234!');
        await page.getByLabel(/confirm/i).fill('Test1234!');
        const traineeOption = page.getByText(/trainee/i).first();
        await traineeOption.click();
        await page.getByRole('button', { name: /sign up|register|create/i }).click();
        await page.waitForURL(/\/dashboard/, { timeout: 15000 });
        await page.waitForTimeout(1000);

        // Dashboard home
        await page.screenshot({
          path: `e2e/screenshots/${vp.name}-dashboard.png`,
          fullPage: true,
        });

        // Contacts
        await page.goto('/dashboard/contacts');
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `e2e/screenshots/${vp.name}-contacts.png`,
          fullPage: true,
        });

        // Messages
        await page.goto('/dashboard/messages');
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `e2e/screenshots/${vp.name}-messages.png`,
          fullPage: true,
        });

        // Settings
        await page.goto('/dashboard/settings');
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `e2e/screenshots/${vp.name}-settings.png`,
          fullPage: true,
        });
      });
    });
  }
});
