import { test, expect } from '@playwright/test';
import { getApi, adminCookie, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
const USERNAME = `cr_${SUF}`;
const PASSWORD = '20011400';
let userId = '';

test.beforeAll(async () => {
  const api = await getApi();

  const reg = await api.post('/api/auth/register', {
    data: { username: USERNAME, display_name: 'CR Badge', password: PASSWORD },
  });
  expect(reg.status()).toBe(201);
  ({ id: userId } = (await reg.json()).data);

  // admin login -> set custom roles
  const cookie = await adminCookie();
  const patch = await api.patch('/api/admin/users', {
    data: { user_id: userId, custom_roles: ['Veteran', 'Artist'] },
    headers: { Cookie: cookie },
  });
  expect(patch.status()).toBe(200);
});

test.afterAll(async () => {
  const api = await getApi();
  if (userId) {
    const cookie = await adminCookie();
    await api.delete('/api/admin/users', {
      data: { user_id: userId },
      headers: { Cookie: cookie },
    });
  }
  await disposeApi();
});

test('custom role badges show on user profile', async ({ page }) => {
  // profile requires session -> login as the user
  await page.goto('/');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.getByPlaceholder('Username').fill(USERNAME);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto(`/profile/${USERNAME}`);
  await expect(page.getByText('Veteran', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Artist', { exact: true }).first()).toBeVisible();
});
