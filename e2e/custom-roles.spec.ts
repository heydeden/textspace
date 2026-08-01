import { test, expect, request as pwRequest } from '@playwright/test';

const SUF = Date.now().toString(36);
const USERNAME = `cr_${SUF}`;
const PASSWORD = '20011400';
let userId = '';
let api: Awaited<ReturnType<typeof pwRequest.newContext>>;

test.beforeAll(async () => {
  api = await pwRequest.newContext({ baseURL: 'http://127.0.0.1:3001' });

  const reg = await api.post('/api/auth/register', {
    data: { username: USERNAME, display_name: 'CR Badge', password: PASSWORD },
  });
  expect(reg.status()).toBe(201);
  ({ id: userId } = (await reg.json()).data);

  // admin login -> set custom roles
  const login = await api.post('/api/auth/login', {
    data: { username: 'setrahden', password: '200114' },
  });
  expect(login.status()).toBe(200);
  const cookie = login.headers()['set-cookie']?.split(';')[0] ?? '';
  const patch = await api.patch('/api/admin/users', {
    data: { user_id: userId, custom_roles: ['Veteran', 'Artist'] },
    headers: { Cookie: cookie },
  });
  expect(patch.status()).toBe(200);
});

test.afterAll(async () => {
  if (userId && api) {
    const login = await api.post('/api/auth/login', {
      data: { username: 'setrahden', password: '200114' },
    });
    const cookie = login.headers()['set-cookie']?.split(';')[0] ?? '';
    await api.delete('/api/admin/users', {
      data: { user_id: userId },
      headers: { Cookie: cookie },
    });
  }
  await api?.dispose();
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
