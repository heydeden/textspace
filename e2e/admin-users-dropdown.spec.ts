import { test, expect } from '@playwright/test';
import { getApi, adminCookie, setBrowserSession, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
const PREFIX = `dd_${SUF}`;

async function registerDummy(api: Awaited<ReturnType<typeof getApi>>, username: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const reg = await api.post('/api/auth/register', {
      data: { username, display_name: 'Dummy', password: '20011400' },
    });
    if (reg.status() !== 429) return reg;
    await new Promise(r => setTimeout(r, 4000));
  }
  throw new Error(`register ${username} failed: rate limited`);
}

test.afterAll(async () => {
  const api = await getApi();
  const cookie = await adminCookie();
  const users = await api.get(`/api/admin/users?q=${PREFIX}&limit=50`, { headers: { Cookie: cookie } });
  for (const u of (await users.json()).data?.users ?? []) {
    await api.delete('/api/admin/users', { data: { user_id: u.id }, headers: { Cookie: cookie } });
  }
  await disposeApi();
});

test('kebab menu on last user row flips up instead of clipping below viewport', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  // seed enough users so the filtered list overflows the viewport
  const api = await getApi();
  for (let i = 1; i <= 4; i++) {
    const reg = await registerDummy(api, `${PREFIX}_${i}`);
    expect(reg.status()).toBe(201);
  }

  await setBrowserSession(context);
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/users/, { timeout: 15_000 });

  // filter to the dummy users so the last row is a fresh (non-self) account
  await page.getByPlaceholder('Search users...').fill(PREFIX);
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  const rows = page.locator('.space-y-2 > div');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBe(4);

  // scroll to the bottom of the page so the last row sits at the viewport edge
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);

  // open the kebab menu of the last row
  const lastRow = rows.last();
  await lastRow.getByText('⋯', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Delete User', exact: true })).toBeVisible();

  // the last menu item must be fully inside the viewport (flipped up, not clipped)
  const box = await page.getByRole('button', { name: 'Delete User', exact: true }).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(720 + 1);

  // first menu item must also be inside the viewport
  const verifyBox = await page.getByRole('button', { name: 'Verify', exact: true }).boundingBox();
  expect(verifyBox).not.toBeNull();
  expect(verifyBox!.y).toBeGreaterThanOrEqual(0);
  expect(verifyBox!.y + verifyBox!.height).toBeLessThanOrEqual(720 + 1);
});
