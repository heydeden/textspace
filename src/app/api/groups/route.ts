import { query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';
import { validateGroupName, validateGroupSlug, validateGroupPrivacy, validateGroupDescription } from '@/lib/groups';

// Daftar grup: publik (semua) + privat (yang saya anggota). Sorted by member count.
export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();

  const rows = await query(
    `SELECT g.id, g.name, g.slug, g.description, g.privacy, g.created_at::text,
       (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') as member_count,
       (SELECT COUNT(*)::int FROM posts p WHERE p.group_id = g.id) as post_count,
       EXISTS(SELECT 1 FROM group_members m2 WHERE m2.group_id = g.id AND m2.user_id = $1 AND m2.status = 'active') as is_member,
       EXISTS(SELECT 1 FROM group_members m3 WHERE m3.group_id = g.id AND m3.user_id = $1 AND m3.status = 'pending') as is_pending
     FROM groups g
     WHERE (g.privacy = 'public' OR EXISTS(SELECT 1 FROM group_members m4 WHERE m4.group_id = g.id AND m4.user_id = $1))
       ${q ? `AND LOWER(g.name) LIKE $2 ESCAPE '\\\\'` : ''}
     ORDER BY member_count DESC, g.created_at DESC`,
    q ? [user.id, `%${q.replace(/[\\%_]/g, '\\$&')}%`] : [user.id]
  );
  return ok({ groups: rows });
});

// Buat grup — creator jadi admin.
export const POST = withUser(async (req, user) => {
  const { name, slug, description, privacy } = await req.json();
  const cleanName = validateGroupName(name);
  if (cleanName === null) return err('Invalid group name: 1-40 chars');
  const cleanSlug = validateGroupSlug(slug ?? name);
  if (cleanSlug === null) return err('Invalid slug: 2-40 chars, lowercase alnum + dash');
  const p = validateGroupPrivacy(privacy ?? 'public');
  if (p === null) return err('Invalid privacy');
  const desc = validateGroupDescription(description);

  const existing = await query('SELECT id FROM groups WHERE slug = $1', [cleanSlug]);
  if (existing.length > 0) return err('Group slug taken', 409);

  const group = await query(
    `INSERT INTO groups (name, slug, description, privacy, created_by) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, slug, description, privacy, created_at::text`,
    [cleanName, cleanSlug, desc, p, user.id]
  );
  await query(
    `INSERT INTO group_members (group_id, user_id, role, status) VALUES ($1, $2, 'admin', 'active')`,
    [group[0].id, user.id]
  );
  return ok({ ...group[0], member_count: 1, is_member: true, is_pending: false }, 201);
});

export const dynamic = 'force-dynamic';
