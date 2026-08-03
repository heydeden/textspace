import { query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';
import { validateGroupName, validateGroupSlug, validateGroupPrivacy, validateGroupDescription, canManageGroup } from '@/lib/groups';

// Detail grup + keanggotaan saya + daftar anggota.
export const GET = withUser(async (req, user) => {
  const id = new URL(req.url).pathname.split('/')[3];
  if (!isUUID(id)) return err('Invalid group id');

  const group = await query(
    `SELECT g.id, g.name, g.slug, g.description, g.privacy, g.created_at::text,
       (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') as member_count,
       (SELECT COALESCE(json_agg(json_build_object(
          'user_id', u.id, 'username', u.username, 'display_name', u.display_name,
          'role', gm.role, 'status', gm.status, 'joined_at', gm.joined_at::text) ORDER BY
          CASE gm.role WHEN 'admin' THEN 0 ELSE 1 END, gm.joined_at) FILTER (WHERE u.id IS NOT NULL), '[]'::json)
        FROM group_members gm JOIN profiles u ON u.id = gm.user_id WHERE gm.group_id = g.id) as members
     FROM groups g WHERE g.id = $1`,
    [id]
  );
  if (group.length === 0) return err('Group not found', 404);

  const mine = await query(
    `SELECT role, status FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [id, user.id]
  );
  const membership = mine.length > 0 ? mine[0] : null;

  // Privat + bukan anggota aktif → sembunyikan.
  if (group[0].privacy === 'private' && (!membership || membership.status !== 'active')) {
    return err('Private group', 403);
  }

  return ok({ group: group[0], membership });
});

// Edit grup — hanya admin.
export const PATCH = withUser(async (req, user) => {
  const id = new URL(req.url).pathname.split('/')[3];
  if (!isUUID(id)) return err('Invalid group id');
  const { name, slug, description, privacy } = await req.json();

  const members = await query(`SELECT role, status FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, user.id]);
  if (members.length === 0 || members[0].status !== 'active') return err('Not a member', 403);
  if (!canManageGroup(members[0].role)) return err('Only group admin can edit', 403);

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (name !== undefined) {
    const cleanName = validateGroupName(name);
    if (cleanName === null) return err('Invalid group name: 1-40 chars');
    updates.push(`name = $${idx++}`);
    params.push(cleanName);
  }
  if (slug !== undefined) {
    const cleanSlug = validateGroupSlug(slug);
    if (cleanSlug === null) return err('Invalid slug');
    const existing = await query('SELECT id FROM groups WHERE slug = $1 AND id != $2', [cleanSlug, id]);
    if (existing.length > 0) return err('Group slug taken', 409);
    updates.push(`slug = $${idx++}`);
    params.push(cleanSlug);
  }
  if (description !== undefined) {
    updates.push(`description = $${idx++}`);
    params.push(validateGroupDescription(description));
  }
  if (privacy !== undefined) {
    const p = validateGroupPrivacy(privacy);
    if (p === null) return err('Invalid privacy');
    updates.push(`privacy = $${idx++}`);
    params.push(p);
  }
  if (updates.length === 0) return err('Nothing to update');

  params.push(id);
  const rows = await query(
    `UPDATE groups SET ${updates.join(', ')} WHERE id = $${idx}
     RETURNING id, name, slug, description, privacy, created_at::text`,
    params
  );
  return ok(rows[0]);
});

// Hapus grup — hanya admin.
export const DELETE = withUser(async (req, user) => {
  const id = new URL(req.url).pathname.split('/')[3];
  if (!isUUID(id)) return err('Invalid group id');

  const members = await query(`SELECT role, status FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, user.id]);
  if (members.length === 0 || members[0].status !== 'active') return err('Not a member', 403);
  if (!canManageGroup(members[0].role)) return err('Only group admin can delete', 403);

  await query(`DELETE FROM groups WHERE id = $1`, [id]);
  return ok({ deleted: true });
});

export const dynamic = 'force-dynamic';
