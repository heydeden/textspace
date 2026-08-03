import { test, expect } from '@playwright/test';
import { getApi, adminCookie, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
let badgeId = '';

test.beforeAll(async () => {
  const api = await getApi();
  const cookie = await adminCookie();
  const me = await api.get('/api/auth/me', { headers: { Cookie: cookie } });
  const { id } = (await me.json()).data;
  // create badge + assign to self (admin)
  const created = await api.post('/api/admin/badges', {
    data: { name: `Self Boss ${SUF}`, theme: 'gold', effect: 'glow' },
    headers: { Cookie: cookie },
  });
  expect(created.status()).toBe(201);
  ({ id: badgeId } = (await created.json()).data);
  const patch = await api.patch('/api/admin/users', {
    data: { user_id: id, badges: [badgeId] },
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
    data: { user_id: id, badges: [] },
    headers: { Cookie: cookie },
  });
  if (badgeId) {
    await api.delete('/api/admin/badges', { data: { badge_id: badgeId }, headers: { Cookie: cookie } });
  }
  await disposeApi();
});

test('admin can create badge and assign to self, badge shows on own profile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.getByPlaceholder('Username').fill('setrahden');
  await page.getByPlaceholder('Password').fill('200114');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto('/profile/setrahden');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(`Self Boss ${SUF}`, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
});
