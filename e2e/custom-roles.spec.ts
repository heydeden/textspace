import { test, expect } from '@playwright/test';

test('admin sets custom roles, badge shows on profile', async ({ page }) => {
  // login as admin
  await page.goto('/');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.getByPlaceholder('Username').fill('setrahden');
  await page.getByPlaceholder('Password').fill('200114');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  // open admin users, set custom roles for crtest1
  await page.goto('/admin/users');
  await expect(page.getByText('@crtest1')).toBeVisible({ timeout: 15_000 });
  await page.locator('div', { hasText: '@crtest1' }).locator('button:has-text("⋯")').first().click();
  await page.getByRole('button', { name: 'Edit Role' }).click();
  await page.getByPlaceholder('Veteran, Artist, OG').fill('Veteran, Artist');
  await page.getByRole('button', { name: 'Save Custom Roles' }).click();
  await expect(page.getByText('Custom roles updated')).toBeVisible({ timeout: 10_000 });

  // badges visible in admin list
  await expect(page.getByText('Veteran', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Artist', { exact: true }).first()).toBeVisible();

  // badges visible on user profile
  await page.goto('/profile/crtest1');
  await expect(page.getByText('Veteran', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Artist', { exact: true }).first()).toBeVisible();
});
