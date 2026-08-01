import { test, expect } from '@playwright/test';
import { getApi, adminCookie, setBrowserSession, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
const NAME = `Efx ${SUF}`;
let effectId = '';

test.beforeAll(async () => {
  const api = await getApi();
  const cookie = await adminCookie();

  // admin creates custom name effect (theme + fx) and assigns to self
  const created = await api.post('/api/admin/name-effects', {
    data: { name: NAME, theme: 'cyan', effect: 'lightning' },
    headers: { Cookie: cookie },
  });
  expect(created.status()).toBe(201);
  ({ id: effectId } = (await created.json()).data);

  const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
  const adminId = (await me.json()).data.id;
  const assign = await api.patch('/api/admin/users', {
    data: { user_id: adminId, name_effect_id: effectId },
    headers: { Cookie: cookie },
  });
  expect(assign.status()).toBe(200);
});

test.afterAll(async () => {
  const api = await getApi();
  const cookie = await adminCookie();
  const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
  const adminId = (await me.json()).data.id;
  await api.patch('/api/admin/users', {
    data: { user_id: adminId, name_effect_id: null },
    headers: { Cookie: cookie },
  });
  if (effectId) {
    await api.delete('/api/admin/name-effects', { data: { effect_id: effectId }, headers: { Cookie: cookie } });
  }
  await disposeApi();
});

test('admin-defined name effect shows as themed class combo on profile name', async ({ page, context }) => {
  await setBrowserSession(context);
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto('/profile/setrahden');
  const h1 = page.locator('h1');
  await expect(h1).toHaveClass(/name-theme-cyan/, { timeout: 15_000 });
  await expect(h1).toHaveClass(/name-fx-lightning/);
});
