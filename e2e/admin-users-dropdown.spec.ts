import { test, expect } from '@playwright/test';
import { getApi, adminCookie, setBrowserSession, disposeApi } from './helpers';

const SUF = Date.now().toString(36);
const PREFIX = `dd_${SUF}`;

test.describe.configure({ retries: 1, timeout: 60_000 });

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

async function seedDummy(api: Awaited<ReturnType<typeof getApi>>, username: string) {
  // 201 = created, 409 = already seeded by a previous (failed) attempt — retry-safe
  expect([201, 409]).toContain((await registerDummy(api, username)).status());
  // spread registrations so the 10/min register bucket is not exhausted by this spec
  await new Promise(r => setTimeout(r, 700));
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

async function openLastRowMenu(page: import('@playwright/test').Page, viewportHeight: number) {
  await page.setViewportSize({ width: 1280, height: viewportHeight });
  await setBrowserSession(page.context());
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/users/, { timeout: 15_000 });

  await page.getByPlaceholder('Search users...').fill(PREFIX);
  // match only the search fetch (has q=), not the mount fetch without q=
  const searchResp = page.waitForResponse(r => r.url().includes('/api/admin/users?') && r.url().includes('q=') && r.status() === 200);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await searchResp;

  const rows = page.locator('.space-y-2 > div');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThanOrEqual(3);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);

  // the menu is centered, so any row works; first row = newest dummy (never self)
  await rows.first().getByText('⋯', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Delete User', exact: true })).toBeVisible();
}

test('kebab menu on last user row is centered in viewport, never clipped', async ({ page, context }) => {
  const api = await getApi();
  for (let i = 1; i <= 3; i++) {
    await seedDummy(api, `${PREFIX}_${i}`);
  }

  await openLastRowMenu(page, 720);

  // menu is horizontally centered
  const menu = page.locator('.dropdown-scroll');
  const mbox = await menu.boundingBox();
  expect(mbox).not.toBeNull();
  expect(mbox!.x + mbox!.width / 2).toBeGreaterThanOrEqual(638);
  expect(mbox!.x + mbox!.width / 2).toBeLessThanOrEqual(642);

  // first and last menu items fully inside the viewport
  const verifyBox = await page.getByRole('button', { name: 'Verify', exact: true }).boundingBox();
  expect(verifyBox).not.toBeNull();
  expect(verifyBox!.y).toBeGreaterThanOrEqual(0);
  expect(verifyBox!.y + verifyBox!.height).toBeLessThanOrEqual(720 + 1);

  const box = await page.getByRole('button', { name: 'Delete User', exact: true }).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(720 + 1);
});

test('tall menu on short viewport stays centered and scrolls internally', async ({ page, context }) => {
  const api = await getApi();
  for (let i = 4; i <= 6; i++) {
    await seedDummy(api, `${PREFIX}_${i}`);
  }

  await openLastRowMenu(page, 300);

  // menu clamped to 70% of the short viewport, fully inside it
  const menu = page.locator('.dropdown-scroll');
  const mbox = await menu.boundingBox();
  expect(mbox).not.toBeNull();
  expect(mbox!.y).toBeGreaterThanOrEqual(0);
  expect(mbox!.y + mbox!.height).toBeLessThanOrEqual(300 + 1);
  expect(mbox!.height).toBeLessThanOrEqual(Math.round(300 * 0.7) + 1);
  expect(mbox!.x + mbox!.width / 2).toBeGreaterThanOrEqual(638);
  expect(mbox!.x + mbox!.width / 2).toBeLessThanOrEqual(642);

  // internal scroll is active (content taller than visible area)
  const scrollable = await menu.evaluate(el => {
    const e = el as HTMLElement;
    return { scrollHeight: e.scrollHeight, clientHeight: e.clientHeight };
  });
  expect(scrollable.scrollHeight).toBeGreaterThan(scrollable.clientHeight);

  // scrolling the menu reveals the last item
  await menu.evaluate(el => { (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight; });
  const box = await page.getByRole('button', { name: 'Delete User', exact: true }).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(300 + 1);
});

test('kebab menu item action opens modal (edit role)', async ({ page, context }) => {
  await openLastRowMenu(page, 720);

  await page.getByRole('button', { name: 'Edit Role', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edit Role' })).toBeVisible({ timeout: 5_000 });
});

test('post card menu item action opens modal (report)', async ({ page, context }) => {
  const api = await getApi();
  await seedDummy(api, `${PREFIX}_1`);

  // create a post as the dummy user so the admin sees someone else's post
  const login = await api.post('/api/auth/login', {
    data: { username: `${PREFIX}_1`, password: '20011400' },
  });
  expect(login.status()).toBe(200);
  const dummyCookie = login.headers()['set-cookie']?.split(';')[0];
  const postRes = await api.post('/api/posts', {
    data: { content: `reportable ${SUF}` },
    headers: { Cookie: dummyCookie },
  });
  expect(postRes.status()).toBe(201);

  await setBrowserSession(context);
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

  const card = page.locator('.border.rounded-xl', { hasText: `reportable ${SUF}` }).first();
  await expect(card).toBeVisible();
  await card.getByText('⋯', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Report', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Report Post' })).toBeVisible({ timeout: 5_000 });
});
