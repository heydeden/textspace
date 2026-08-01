import { test, expect } from '@playwright/test';
import { getApi, adminCookie, setBrowserSession, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
const USERNAME = `bdg_${SUF}`;
const PASSWORD = '20011400';
let userId = '';
let badgeId = '';

test.beforeAll(async () => {
  const api = await getApi();

  const reg = await api.post('/api/auth/register', {
    data: { username: USERNAME, display_name: 'Badge Test', password: PASSWORD },
  });
  expect(reg.status()).toBe(201);
  ({ id: userId } = (await reg.json()).data);

  // admin creates a badge (with theme + effect) then assigns it
  const cookie = await adminCookie();
  const created = await api.post('/api/admin/badges', {
    data: { name: `OG ${SUF}`, theme: 'gold', effect: 'shimmer' },
    headers: { Cookie: cookie },
  });
  expect(created.status()).toBe(201);
  ({ id: badgeId } = (await created.json()).data);

  const assign = await api.patch('/api/admin/users', {
    data: { user_id: userId, badges: [badgeId] },
    headers: { Cookie: cookie },
  });
  expect(assign.status()).toBe(200);
});

test.afterAll(async () => {
  const api = await getApi();
  const cookie = await adminCookie();
  if (userId) {
    await api.delete('/api/admin/users', { data: { user_id: userId }, headers: { Cookie: cookie } });
  }
  if (badgeId) {
    await api.delete('/api/admin/badges', { data: { badge_id: badgeId }, headers: { Cookie: cookie } });
  }
  await disposeApi();
});

test('admin-created badge with effect shows on user profile', async ({ page, context }) => {
  await setBrowserSession(context);
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto(`/profile/${USERNAME}`);
  await expect(page.getByText(`OG ${SUF}`, { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  // badge has theme + effect classes
  const badge = page.getByText(`OG ${SUF}`, { exact: true }).first();
  await expect(badge).toHaveClass(/bg-gradient-to-r/);
  await expect(badge).toHaveClass(/badge-effect-shimmer/);
});
