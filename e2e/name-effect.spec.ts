import { test, expect } from '@playwright/test';
import { getApi, adminCookie, setBrowserSession, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
const NAME = `Efx ${SUF}`;
let effectId = '';
let bounceId = '';

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

  // bounce effect for transform/inline-block check
  const b = await api.post('/api/admin/name-effects', {
    data: { name: `Hop ${SUF}`, theme: 'gold', effect: 'bounce' },
    headers: { Cookie: cookie },
  });
  expect(b.status()).toBe(201);
  ({ id: bounceId } = (await b.json()).data);

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
  if (bounceId) {
    await api.delete('/api/admin/name-effects', { data: { effect_id: bounceId }, headers: { Cookie: cookie } });
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

test('transform effects actually animate: display inline-block + animation-name active', async ({ page, context, baseURL }) => {
  // assign bounce effect to admin via API, then verify computed style on profile
  const api = await getApi();
  const cookie = await adminCookie();
  const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
  const adminId = (await me.json()).data.id;
  const assign = await api.patch('/api/admin/users', {
    data: { user_id: adminId, name_effect_id: bounceId },
    headers: { Cookie: cookie },
  });
  expect(assign.status()).toBe(200);

  await setBrowserSession(context);
  await page.goto('/profile/setrahden');
  const h1 = page.locator('h1');
  await expect(h1).toHaveClass(/name-fx-bounce/, { timeout: 15_000 });

  const style = await h1.evaluate(el => {
    const cs = getComputedStyle(el);
    return { display: cs.display, animationName: cs.animationName };
  });
  // flex item blockification: display bisa 'block' (flex container) atau 'inline-block'
  // bukti efek aktif = animation-name terisi (rule applied)
  expect(['inline-block', 'block']).toContain(style.display);
  expect(style.animationName).toContain('name-fx-bounce');

  // restore lightning
  await api.patch('/api/admin/users', {
    data: { user_id: adminId, name_effect_id: effectId },
    headers: { Cookie: cookie },
  });
});
