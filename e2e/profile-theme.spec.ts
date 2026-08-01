import { test, expect } from '@playwright/test';
import { getApi, adminCookie, setBrowserSession, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
const USER = `thx${SUF}`;
const PASS = '20011400';
let userId = '';

test.beforeAll(async () => {
  const api = await getApi();
  const reg = await api.post('/api/auth/register', {
    data: { username: USER, display_name: 'Theme Test', password: PASS },
  });
  expect(reg.status()).toBe(201);
  ({ id: userId } = (await reg.json()).data);

  // admin set theme via API (the only grant path)
  const cookie = await adminCookie();
  const patch = await api.patch('/api/admin/users', {
    data: { user_id: userId, theme: 'crimson' },
    headers: { Cookie: cookie },
  });
  expect(patch.status()).toBe(200);

  // admin creates a post as the themed user via API? posts require session -> post as admin is fine
  // (PostCard theming is per author; admin's own theme is default, so use the themed user's profile posts:
  //  create post as the themed user through API cookie)
  const login = await api.post('/api/auth/login', {
    data: { username: USER, password: PASS },
  });
  const userCookie = login.headers()['set-cookie']?.split(';')[0] ?? '';
  const post = await api.post('/api/posts', {
    data: { content: `theme check ${SUF}` },
    headers: { Cookie: userCookie },
  });
  expect(post.status()).toBe(201);
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

test('admin-set theme applies to profile card and post card border', async ({ page, context }) => {
  await setBrowserSession(context);
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto(`/profile/${USER}`);
  await expect(page.locator('h1')).toHaveText('Theme Test', { timeout: 15_000 });
  // profile card border class from theme map
  const card = page.locator('div.overflow-hidden');
  await expect(card.first()).toHaveClass(/border-red-900/, { timeout: 15_000 });
  // post card (by themed author) has themed border
  await expect(page.locator('a[href^="/post/"]').first()).toBeVisible({ timeout: 15_000 });
  const postCard = page.locator('div.rounded-xl.p-4.mb-3').first();
  await expect(postCard).toHaveClass(/border-red-900/);
});
