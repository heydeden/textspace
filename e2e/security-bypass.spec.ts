import { test, expect, request as pwRequest } from '@playwright/test';

const SUF = Date.now().toString(36);
const USERNAME = `e2ebyp_${SUF}`;
const PASSWORD = '20011400';

test.afterAll(async () => {
  const api = await pwRequest.newContext({ baseURL: 'http://127.0.0.1:3001' });
  const login = await api.post('/api/auth/login', {
    data: { username: 'setrahden', password: '200114' },
  });
  const cookie = login.headers()['set-cookie']?.split(';')[0] ?? '';
  const users = await api.get('/api/admin/users?q=e2ebyp&limit=50', { headers: { Cookie: cookie } });
  for (const u of (await users.json()).data?.users ?? []) {
    await api.delete('/api/admin/users', { data: { user_id: u.id }, headers: { Cookie: cookie } });
  }
  await api.dispose();
});

test('non-admin cannot access admin panel or admin API', async ({ page }) => {
  // register + login as normal user via API (faster than UI)
  const api = await pwRequest.newContext({ baseURL: 'http://127.0.0.1:3001' });
  const reg = await api.post('/api/auth/register', {
    data: { username: USERNAME, display_name: 'E2E Bypass', password: PASSWORD },
  });
  expect(reg.status()).toBe(201);
  const { data } = await reg.json();
  const userId: string = data.id;

  // login in browser
  await page.goto('/');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.getByPlaceholder('Username').fill(USERNAME);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  // direct navigation to admin panel is blocked (redirect back to feed)
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  // direct PATCH with user session -> 403
  const res = await page.evaluate(async (uid) => {
    const r = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: uid, custom_roles: ['Hacker'] }),
    });
    return { status: r.status, body: await r.json() };
  }, userId);
  expect(res.status).toBe(403);
  expect(res.body.error).toBe('Forbidden');

  // admin users list -> 403
  const listRes = await page.evaluate(async () => {
    const r = await fetch('/api/admin/users');
    return { status: r.status };
  });
  expect(listRes.status).toBe(403);

  await api.dispose();
});
