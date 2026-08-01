import { test, expect } from '@playwright/test';

test('landing page renders login/register', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('TextSpace');
  await expect(page.getByPlaceholder('Username')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
});
