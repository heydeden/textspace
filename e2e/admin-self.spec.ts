import { test, expect } from '@playwright/test';
import { getApi, adminCookie, disposeApi } from './helpers';

const SUF = Date.now().toString(36);

test.beforeAll(async () => {
  const api = await getApi();
  const cookie = await adminCookie();
  const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
  const { id } = (await me.json()).data;
  // set custom role for self (admin)
  const patch = await api.patch('/api/admin/users', {
    data: { user_id: id, custom_roles: [`Self Boss ${SUF}`] },
    headers: { Cookie: cookie },
  });
  expect(patch.status()).toBe(200);
});

test.afterAll(async () => {
  const api = await getApi();
  const cookie = await adminCookie();
  const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
  const { id } = (await me.json()).data;
  await api.patch('/api/admin/users', {
    data: { user_id: id, custom_roles: [] },
    headers: { Cookie: cookie },
  });
  await disposeApi();
});

test('admin can set custom role for self, badge shows on own profile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.getByPlaceholder('Username').fill('setrahden');
  await page.getByPlaceholder('Password').fill('200114');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto('/profile/setrahden');
  await expect(page.getByText(`Self Boss ${SUF}`, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
});
