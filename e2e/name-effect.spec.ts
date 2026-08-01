import { test, expect } from '@playwright/test';
import { getApi, adminCookie, setBrowserSession, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
const USER = `nefx${SUF}`;
const PASS = '20011400';

test.beforeAll(async () => {
  const api = await getApi();
  const reg = await api.post('/api/auth/register', {
    data: { username: USER, display_name: 'Effect Test', password: PASS },
  });
  expect(reg.status()).toBe(201);

  const cookie = await adminCookie();
  const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
  const adminId = (await me.json()).data.id;

  // set name_effect via admin API (the only grant path)
  const patch = await api.patch('/api/admin/users', {
    data: { user_id: adminId, name_effect: 'lightning' },
    headers: { Cookie: cookie },
  });
  expect(patch.status()).toBe(200);
});

test.afterAll(async () => {
  const api = await getApi();
  const cookie = await adminCookie();
  const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
  const adminId = (await me.json()).data.id;
  await api.patch('/api/admin/users', {
    data: { user_id: adminId, name_effect: 'none' },
    headers: { Cookie: cookie },
  });
  const users = await api.get('/api/admin/users?q=' + USER, { headers: { Cookie: cookie } });
  const found = (await users.json()).data?.users?.[0];
  if (found) {
    await api.delete('/api/admin/users', {
      data: { user_id: found.id },
      headers: { Cookie: cookie },
    });
  }
  await disposeApi();
});

test('admin-set name effect shows as animated class on profile name', async ({ page, context }) => {
  await setBrowserSession(context);
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto('/profile/setrahden');
  await expect(page.locator('h1')).toHaveClass(/name-effect-lightning/, { timeout: 15_000 });
});
