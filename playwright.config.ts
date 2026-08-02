import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  workers: 1,
});
