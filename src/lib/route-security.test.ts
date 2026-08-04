// Handler-level security test — CEPAT, tanpa server, tanpa Neon.
// Mock @/lib/db + @/lib/auth + @/lib/ratelimit, panggil handler route langsung.
// Baseline: 401 no-cookie / 403 non-admin / 403 banned / 429 rate-limit.
// Fast loop: npx tsc --noEmit && npm test (~8s). test-api.sh penuh hanya 1× di akhir.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn().mockResolvedValue([]),
  sql: vi.fn().mockResolvedValue([]),
  transaction: vi.fn(),
}));
vi.mock('@/lib/ratelimit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue(null),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  createToken: vi.fn(),
  verifyToken: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

import { query, sql, transaction } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { getSession as mockGetSession, clearSession } from '@/lib/auth';

import * as badgesRoute from '@/app/api/badges/route';
import * as nameEffectsRoute from '@/app/api/name-effects/route';
import * as blocksRoute from '@/app/api/blocks/route';
import * as commentsRoute from '@/app/api/comments/route';
import * as followRoute from '@/app/api/follow/route';
import * as followCheckRoute from '@/app/api/follow/check/route';
import * as likesRoute from '@/app/api/likes/route';
import * as messagesRoute from '@/app/api/messages/route';
import * as messageUserIdRoute from '@/app/api/messages/[userId]/route';
import * as notificationsRoute from '@/app/api/notifications/route';
import * as postsRoute from '@/app/api/posts/route';
import * as reportsRoute from '@/app/api/reports/route';
import * as trendingRoute from '@/app/api/trending/route';
import * as groupsRoute from '@/app/api/groups/route';
import * as groupIdRoute from '@/app/api/groups/[id]/route';
import * as groupMembersRoute from '@/app/api/groups/[id]/members/route';
import * as groupMemberIdRoute from '@/app/api/groups/[id]/members/[userId]/route';
import * as adminRecoverRoute from '@/app/api/admin/recover/route';
import * as adminUsersRoute from '@/app/api/admin/users/route';
import * as adminBadgesRoute from '@/app/api/admin/badges/route';
import * as adminNameEffectsRoute from '@/app/api/admin/name-effects/route';
import * as adminPostsRoute from '@/app/api/admin/posts/route';
import * as adminReportsRoute from '@/app/api/admin/reports/route';
import * as adminStatsRoute from '@/app/api/admin/stats/route';
import * as authMeRoute from '@/app/api/auth/me/route';
import * as profileRoute from '@/app/api/profile/route';
import * as searchRoute from '@/app/api/search/route';
import * as initdbRoute from '@/app/api/initdb/route';

const USER = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'alice', display_name: 'Alice' };
const ADMIN = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', username: 'admin', display_name: 'Admin' };
const UID = '11111111-1111-4111-8111-111111111111';
const CID = '22222222-2222-4222-8222-222222222222';

function row(over: Record<string, unknown> = {}) {
  return { id: UID, user_id: UID, post_id: UID, group_id: UID, privacy: 'public', status: 'active', role: 'user', banned: false, count: 0, ...over };
}

beforeEach(() => {
  vi.resetAllMocks();
  (rateLimit as ReturnType<typeof vi.fn>).mockReturnValue(true);
  (mockGetSession as ReturnType<typeof vi.fn>).mockResolvedValue(USER);
  // withUser/withAdmin cek banned via sql → default row agar login-lookup lulus.
  (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ banned: false })]);
  (query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

const req = (path: string, init: RequestInit = {}) =>
  new Request('http://localhost' + path, { method: init.method || 'GET', ...init });

// --- Baseline: semua route dengan wrapper withUser/withAdmin ---
type RouteModule = Record<string, unknown>; // route modules juga punya `dynamic: string`
interface Case { mod: RouteModule; method: string; path: string; body?: unknown; admin: boolean }
function handler(c: Case) { return c.mod[c.method] as (r: Request) => Promise<Response>; }

describe('security baseline semua route', () => {
  const CASES: Case[] = [
    // user routes
    { mod: badgesRoute, method: 'GET', path: '/api/badges', admin: false },
    { mod: nameEffectsRoute, method: 'GET', path: '/api/name-effects', admin: false },
    { mod: blocksRoute, method: 'POST', path: '/api/blocks', body: { username: 'bob' }, admin: false },
    { mod: blocksRoute, method: 'GET', path: '/api/blocks', admin: false },
    { mod: commentsRoute, method: 'GET', path: '/api/comments?post_id=' + UID, admin: false },
    { mod: commentsRoute, method: 'POST', path: '/api/comments', body: { post_id: UID, content: 'hai' }, admin: false },
    { mod: commentsRoute, method: 'PATCH', path: '/api/comments', body: { comment_id: CID, content: 'x' }, admin: false },
    { mod: commentsRoute, method: 'DELETE', path: '/api/comments', body: { comment_id: CID }, admin: false },
    { mod: followRoute, method: 'POST', path: '/api/follow', body: { username: 'bob' }, admin: false },
    { mod: followCheckRoute, method: 'POST', path: '/api/follow/check', body: { username: 'bob' }, admin: false },
    { mod: likesRoute, method: 'POST', path: '/api/likes', body: { post_id: UID }, admin: false },
    { mod: messagesRoute, method: 'GET', path: '/api/messages', admin: false },
    { mod: messagesRoute, method: 'POST', path: '/api/messages', body: { receiver_id: CID, content: 'hai' }, admin: false },
    { mod: messageUserIdRoute, method: 'GET', path: '/api/messages/' + CID, admin: false },
    { mod: notificationsRoute, method: 'GET', path: '/api/notifications', admin: false },
    { mod: notificationsRoute, method: 'POST', path: '/api/notifications', body: { all: true }, admin: false },
    { mod: postsRoute, method: 'GET', path: '/api/posts', admin: false },
    { mod: postsRoute, method: 'POST', path: '/api/posts', body: { content: 'hai' }, admin: false },
    { mod: postsRoute, method: 'PATCH', path: '/api/posts', body: { post_id: UID, content: 'x' }, admin: false },
    { mod: postsRoute, method: 'DELETE', path: '/api/posts', body: { post_id: UID }, admin: false },
    { mod: reportsRoute, method: 'POST', path: '/api/reports', body: { post_id: UID, reason: 'spam spam spam' }, admin: false },
    { mod: trendingRoute, method: 'GET', path: '/api/trending', admin: false },
    { mod: groupsRoute, method: 'GET', path: '/api/groups', admin: false },
    { mod: groupsRoute, method: 'POST', path: '/api/groups', body: { name: 'Grup', slug: 'grup', privacy: 'public' }, admin: false },
    { mod: groupIdRoute, method: 'GET', path: '/api/groups/' + UID, admin: false },
    { mod: groupIdRoute, method: 'PATCH', path: '/api/groups/' + UID, body: { name: 'X' }, admin: false },
    { mod: groupIdRoute, method: 'DELETE', path: '/api/groups/' + UID, admin: false },
    { mod: groupMembersRoute, method: 'POST', path: '/api/groups/' + UID + '/members', admin: false },
    { mod: groupMembersRoute, method: 'DELETE', path: '/api/groups/' + UID + '/members', admin: false },
    { mod: groupMemberIdRoute, method: 'PATCH', path: '/api/groups/' + UID + '/members/' + CID, body: { action: 'kick' }, admin: false },
    { mod: adminRecoverRoute, method: 'POST', path: '/api/admin/recover', admin: false },
    // admin routes
    { mod: adminUsersRoute, method: 'GET', path: '/api/admin/users', admin: true },
    { mod: adminUsersRoute, method: 'PATCH', path: '/api/admin/users', body: { user_id: UID, role: 'mod' }, admin: true },
    { mod: adminUsersRoute, method: 'DELETE', path: '/api/admin/users', body: { user_id: UID }, admin: true },
    { mod: adminBadgesRoute, method: 'GET', path: '/api/admin/badges', admin: true },
    { mod: adminBadgesRoute, method: 'POST', path: '/api/admin/badges', body: { name: 'OG', theme: 'gold', effect: 'none' }, admin: true },
    { mod: adminBadgesRoute, method: 'PATCH', path: '/api/admin/badges', body: { badge_id: UID, active: true }, admin: true },
    { mod: adminBadgesRoute, method: 'DELETE', path: '/api/admin/badges', body: { badge_id: UID }, admin: true },
    { mod: adminNameEffectsRoute, method: 'GET', path: '/api/admin/name-effects', admin: true },
    { mod: adminNameEffectsRoute, method: 'POST', path: '/api/admin/name-effects', body: { name: 'Electric', theme: 'gold', effect: 'bounce' }, admin: true },
    { mod: adminNameEffectsRoute, method: 'PATCH', path: '/api/admin/name-effects', body: { effect_id: UID, active: true }, admin: true },
    { mod: adminNameEffectsRoute, method: 'DELETE', path: '/api/admin/name-effects', body: { effect_id: UID }, admin: true },
    { mod: adminPostsRoute, method: 'GET', path: '/api/admin/posts', admin: true },
    { mod: adminPostsRoute, method: 'DELETE', path: '/api/admin/posts', body: { post_id: UID }, admin: true },
    { mod: adminReportsRoute, method: 'GET', path: '/api/admin/reports', admin: true },
    { mod: adminReportsRoute, method: 'DELETE', path: '/api/admin/reports', body: { report_id: UID }, admin: true },
    { mod: adminReportsRoute, method: 'PATCH', path: '/api/admin/reports', body: { report_id: UID }, admin: true },
    { mod: adminStatsRoute, method: 'GET', path: '/api/admin/stats', admin: true },
  ];

  function run(c: Case) {
    return handler(c)(req(c.path, { method: c.method, body: c.body ? JSON.stringify(c.body) : undefined }));
  }

  it('401 tanpa cookie di semua route', async () => {
    (mockGetSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    for (const c of CASES) {
      const res = await run(c);
      expect(res.status, `${c.method} ${c.path}`).toBe(401);
    }
  });

  it('403 user biasa ke route admin', async () => {
    for (const c of CASES.filter(x => x.admin)) {
      (query as ReturnType<typeof vi.fn>).mockResolvedValue([row({ role: 'user' })]);
      (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ role: 'user' })]);
      const res = await run(c);
      expect(res.status, `${c.method} ${c.path}`).toBe(403);
    }
  });

  it('403 banned (lookup di wrapper)', async () => {
    for (const c of CASES.filter(x => x.mod !== adminRecoverRoute)) {
      (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ banned: true })]);
      (query as ReturnType<typeof vi.fn>).mockResolvedValue([row({ banned: true })]);
      const res = await run(c);
      expect(res.status, `${c.method} ${c.path}`).toBe(403);
    }
  });

  it('429 rate-limit di semua route', async () => {
    (rateLimit as ReturnType<typeof vi.fn>).mockReturnValue(false);
    for (const c of CASES) {
      const res = await run(c);
      expect(res.status, `${c.method} ${c.path}`).toBe(429);
    }
  });

  it('tidak ada 5xx pada happy path (mock data)', async () => {
    for (const c of CASES) {
      if (c.admin) {
        (query as ReturnType<typeof vi.fn>).mockResolvedValue([row({ role: 'admin' })]);
        (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ role: 'admin' })]);
      }
      if (c.mod === messagesRoute && c.method === 'GET') {
        // conversations (query 1) → []; unread (query 2) → [{ count }].
        (query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0 }]);
      }
      if (c.mod === groupsRoute && c.method === 'POST') {
        // INSERT groups (query 1) → [{ id }]; INSERT group_members (query 2) → [].
        (query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([row({ id: UID })]);
      }
      const res = await run(c);
      expect(res.status, `${c.method} ${c.path}`).toBeLessThan(500);
    }
  });
});

// --- Logika khusus route (mock db, tidak nembak Neon) ---
describe('posts — ownership & validasi', () => {
  it('PATCH bukan pemilik → 403', async () => {
    (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ user_id: 'other-user', created_at: new Date().toISOString() })]);
    const res = await postsRoute.PATCH(req('/api/posts', { method: 'PATCH', body: JSON.stringify({ post_id: UID, content: 'edit' }) }));
    expect(res.status).toBe(403);
  });

  it('PATCH >24 jam → 403', async () => {
    const old = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ user_id: USER.id, created_at: old })]);
    const res = await postsRoute.PATCH(req('/api/posts', { method: 'PATCH', body: JSON.stringify({ post_id: UID, content: 'edit' }) }));
    expect(res.status).toBe(403);
  });

  it('POST tanpa content → 400', async () => {
    const res = await postsRoute.POST(req('/api/posts', { method: 'POST', body: JSON.stringify({}) }));
    expect(res.status).toBe(400);
  });

  it('POST content >280 → 400', async () => {
    const res = await postsRoute.POST(req('/api/posts', { method: 'POST', body: JSON.stringify({ content: 'x'.repeat(281) }) }));
    expect(res.status).toBe(400);
  });

  it('POST ke grup non-member → 403', async () => {
    (sql as ReturnType<typeof vi.fn>).mockResolvedValueOnce([row({ banned: false })]);
    (sql as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const res = await postsRoute.POST(req('/api/posts', { method: 'POST', body: JSON.stringify({ content: 'hai', group_id: UID }) }));
    expect(res.status).toBe(403);
  });

  it('POST ke grup member aktif → 201', async () => {
    (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ status: 'active' })]);
    const res = await postsRoute.POST(req('/api/posts', { method: 'POST', body: JSON.stringify({ content: 'hai', group_id: UID }) }));
    expect(res.status).toBe(201);
  });
});

describe('groups — privacy & membership', () => {
  it('GET privat non-member → 403', async () => {
    (query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([row({ privacy: 'private' })]).mockResolvedValueOnce([]);
    const res = await groupIdRoute.GET(req('/api/groups/' + UID));
    expect(res.status).toBe(403);
  });

  it('GET privat member aktif → 200', async () => {
    (query as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([row({ privacy: 'private' })])
      .mockResolvedValueOnce([row({ status: 'active' })]);
    const res = await groupIdRoute.GET(req('/api/groups/' + UID));
    expect(res.status).toBe(200);
  });

  it('PATCH grup non-admin → 403', async () => {
    (query as ReturnType<typeof vi.fn>).mockResolvedValue([row({ role: 'user', status: 'active' })]);
    const res = await groupIdRoute.PATCH(req('/api/groups/' + UID, { method: 'PATCH', body: JSON.stringify({ name: 'X' }) }));
    expect(res.status).toBe(403);
  });

  it('join grup tidak ada → 404', async () => {
    (query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await groupMembersRoute.POST(req('/api/groups/' + UID + '/members', { method: 'POST' }));
    expect(res.status).toBe(404);
  });

  it('kick admin → 403', async () => {
    (query as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([row({ role: 'admin', status: 'active' })])
      .mockResolvedValueOnce([row({ role: 'admin' })]);
    const res = await groupMemberIdRoute.PATCH(req('/api/groups/' + UID + '/members/' + CID, { method: 'PATCH', body: JSON.stringify({ action: 'kick' }) }));
    expect(res.status).toBe(403);
  });

  it('approve pending member → 200', async () => {
    (query as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([row({ role: 'admin', status: 'active' })])
      .mockResolvedValueOnce([row({ status: 'pending' })]);
    const res = await groupMemberIdRoute.PATCH(req('/api/groups/' + UID + '/members/' + CID, { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }));
    expect(res.status).toBe(200);
  });

  it('POST slug duplikat → 409', async () => {
    (query as ReturnType<typeof vi.fn>).mockResolvedValue([row({ id: UID })]);
    const res = await groupsRoute.POST(req('/api/groups', { method: 'POST', body: JSON.stringify({ name: 'Grup', slug: 'grup', privacy: 'public' }) }));
    expect(res.status).toBe(409);
  });
});

describe('admin/users — self-protection & validasi', () => {
  beforeEach(() => {
    // withAdmin cek role via sql → aktifkan role admin.
    (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ role: 'admin' })]);
  });

  it('demote SELF → 403', async () => {
    const res = await adminUsersRoute.PATCH(req('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ user_id: USER.id, role: 'user' }) }));
    expect(res.status).toBe(403);
  });

  it('ban SELF → 403', async () => {
    const res = await adminUsersRoute.PATCH(req('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ user_id: USER.id, banned: true }) }));
    expect(res.status).toBe(403);
  });

  it('delete SELF → 403', async () => {
    const res = await adminUsersRoute.DELETE(req('/api/admin/users', { method: 'DELETE', body: JSON.stringify({ user_id: USER.id }) }));
    expect(res.status).toBe(403);
  });

  it('role invalid → 400', async () => {
    (query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await adminUsersRoute.PATCH(req('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ user_id: UID, role: 'god' }) }));
    expect(res.status).toBe(400);
  });

  it('user_id bukan uuid → 400', async () => {
    const res = await adminUsersRoute.PATCH(req('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ user_id: 'x', role: 'mod' }) }));
    expect(res.status).toBe(400);
  });
});

// --- Route tanpa wrapper (auth/session sendiri) ---
describe('search — no-cookie tetap jalan (public)', () => {
  it('GET tanpa cookie → 200', async () => {
    (mockGetSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await searchRoute.GET(req('/api/search?q=alice&type=users'));
    expect(res.status).toBe(200);
  });

  it('GET logged in → 200', async () => {
    const res = await searchRoute.GET(req('/api/search?q=alice&type=users'));
    expect(res.status).toBe(200);
  });
});

describe('auth/me — session & cleanup', () => {
  it('no session → 401', async () => {
    (mockGetSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await authMeRoute.GET(req('/api/auth/me'));
    expect(res.status).toBe(401);
  });

  it('session valid tapi user hilang → 404 + clearSession', async () => {
    (sql as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await authMeRoute.GET(req('/api/auth/me'));
    expect(res.status).toBe(404);
    expect(clearSession).toHaveBeenCalled();
  });

  it('DELETE logout → 200', async () => {
    const res = await authMeRoute.DELETE(req('/api/auth/me', { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(clearSession).toHaveBeenCalled();
  });
});

describe('profile — GET public (tanpa wrapper), PATCH withUser', () => {
  it('GET tanpa username → 400', async () => {
    const res = await profileRoute.GET(req('/api/profile'));
    expect(res.status).toBe(400);
  });

  it('GET user tidak ada → 404', async () => {
    (query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await profileRoute.GET(req('/api/profile?username=ghost'));
    expect(res.status).toBe(404);
  });

  it('GET user banned → 404 (hidden)', async () => {
    (query as ReturnType<typeof vi.fn>).mockResolvedValue([row({ banned: true })]);
    const res = await profileRoute.GET(req('/api/profile?username=banned'));
    expect(res.status).toBe(404);
  });
});

describe('initdb & admin/recover — env-gated', () => {
  it('initdb tanpa ALLOW_INITDB → 403', async () => {
    const before = process.env.ALLOW_INITDB;
    delete process.env.ALLOW_INITDB;
    try {
      const res = await initdbRoute.POST();
      expect(res.status).toBe(403);
    } finally { if (before !== undefined) process.env.ALLOW_INITDB = before; }
  });

  it('recover tanpa ENABLE_ADMIN_RECOVERY → 403', async () => {
    const before = process.env.ENABLE_ADMIN_RECOVERY;
    delete process.env.ENABLE_ADMIN_RECOVERY;
    try {
      const res = await adminRecoverRoute.POST(req('/api/admin/recover', { method: 'POST' }));
      expect(res.status).toBe(403);
    } finally { if (before !== undefined) process.env.ENABLE_ADMIN_RECOVERY = before; }
  });

  it('recover sudah ada admin → 403', async () => {
    const before = process.env.ENABLE_ADMIN_RECOVERY;
    process.env.ENABLE_ADMIN_RECOVERY = 'true';
    try {
      (sql as ReturnType<typeof vi.fn>).mockResolvedValue([row({ cnt: 1 })]);
      const res = await adminRecoverRoute.POST(req('/api/admin/recover', { method: 'POST' }));
      expect(res.status).toBe(403);
    } finally { if (before === undefined) delete process.env.ENABLE_ADMIN_RECOVERY; else process.env.ENABLE_ADMIN_RECOVERY = before; }
  });
});

// Guard: pastikan mock aktif — kalau DB asli kebangun, sql/query bukan mock → test ini gagal.
describe('guard mock aktif', () => {
  it('query/sql/rateLimit/auth adalah mock', () => {
    expect(transaction).toBeDefined();
    expect((rateLimit as ReturnType<typeof vi.fn>).getMockImplementation?.()).toBeDefined();
    expect((mockGetSession as ReturnType<typeof vi.fn>).getMockImplementation?.()).toBeDefined();
    expect((sql as unknown as { mock?: unknown }).mock ?? (query as unknown as { mock?: unknown }).mock).toBeTruthy();
  });
});
