import { test, expect, request as pwRequest } from '@playwright/test';

const SUF = Date.now().toString(36);
let api: Awaited<ReturnType<typeof pwRequest.newContext>>;

async function adminCookie() {
  const login = await api.post('/api/auth/login', {
    data: { username: 'setrahden', password: '200114' },
  });
  return login.headers()['set-cookie']?.split(';')[0] ?? '';
}

test.beforeAll(async () => {
  api = await pwRequest.newContext({ baseURL: 'http://127.0.0.1:3001' });
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
  if (api) {
    const cookie = await adminCookie();
    const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
    const { id } = (await me.json()).data;
    await api.patch('/api/admin/users', {
      data: { user_id: id, custom_roles: [] },
      headers: { Cookie: cookie },
    });
    await api.dispose();
  }
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
