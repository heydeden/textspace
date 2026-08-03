import { defineConfig } from '@playwright/test';
import { existsSync } from 'fs';

// Sandbox Alpine punya chromium native (musl); Playwright bundlenya butuh glibc.
// Pakai binary alpine kalau ada, kalau tidak biarkan bawaan Playwright.
const ALPINE_CHROMIUM = '/usr/bin/chromium';
const launchOptions = existsSync(ALPINE_CHROMIUM)
  ? { executablePath: ALPINE_CHROMIUM, args: ['--no-sandbox', '--disable-dev-shm-usage'] }
  : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium', launchOptions } }],
  workers: 1,
});