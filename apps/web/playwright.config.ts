import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -w @fitnassist/api',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      cwd: '../../',
    },
    {
      command: 'npm run dev -w @fitnassist/web',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      cwd: '../../',
    },
  ],
});
