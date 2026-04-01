import { test } from '@playwright/test';
import { TEST_TRAINEE, loginViaUI } from './helpers/auth';

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

    for (const pg of publicPages) {
      test(`${pg.name}`, async ({ page }) => {
        await page.goto(pg.path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `e2e/screenshots/${vp.name}-${pg.name}.png`,
          fullPage: true,
        });
      });
    }
  });
}

test.describe('dashboard pages', () => {
  for (const vp of viewports) {
    test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test(`dashboard`, async ({ page }) => {
        await loginViaUI(page, TEST_TRAINEE.email, TEST_TRAINEE.password);
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: `e2e/screenshots/${vp.name}-dashboard.png`,
          fullPage: true,
        });

        await page.goto('/dashboard/contacts');
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `e2e/screenshots/${vp.name}-contacts.png`,
          fullPage: true,
        });

        await page.goto('/dashboard/messages');
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `e2e/screenshots/${vp.name}-messages.png`,
          fullPage: true,
        });

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
