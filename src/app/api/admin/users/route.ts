import { query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withAdmin } from '@/lib/api';
import { validateCustomRoles } from '@/lib/customRoles';
import { validateNameEffect } from '@/lib/nameEffects';

export const GET = withAdmin(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  let where = '';
  const params: any[] = [];
  if (q) {
    where = 'WHERE (username ILIKE $1 OR display_name ILIKE $1)';
    params.push(`%${q}%`);
  }

  const countResult = await query(`SELECT COUNT(*)::int as count FROM profiles ${where}`, params);
  const total = countResult[0].count;

  params.push(limit, offset);
  const rows = await query(
    `SELECT id, username, display_name, bio, role, points, banned, verified, custom_roles, name_effect, avatar_style, created_at::text,
      (SELECT COUNT(*)::int FROM posts WHERE user_id = profiles.id) as post_count
     FROM profiles ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return ok({ users: rows, total, page, limit, pages: Math.ceil(total / limit) });
});

export const PATCH = withAdmin(async (req, user) => {
  const { user_id, role, banned, points, verified, custom_roles, name_effect } = await req.json();
  if (!user_id) return err('user_id required');
  if (!isUUID(user_id)) return err('Invalid user_id');
  if (user_id === user.id && role !== undefined && role !== 'admin') return err('Cannot demote yourself', 403);

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (role !== undefined) {
    if (!['user', 'mod', 'admin'].includes(role)) return err('Invalid role');
    updates.push(`role = $${idx++}`);
    params.push(role);
  }
  if (banned !== undefined) {
    if (user_id === user.id) return err('Cannot ban yourself', 403);
    updates.push(`banned = $${idx++}`);
    params.push(banned);
  }
  if (points !== undefined) {
    if (!Number.isInteger(points) || points < 0 || points > 1000000) return err('Points must be integer 0-1000000');
    updates.push(`points = $${idx++}`);
    params.push(points);
  }
  if (verified !== undefined) {
    if (typeof verified !== 'boolean') return err('verified must be boolean');
    updates.push(`verified = $${idx++}`);
    params.push(verified);
  }
  if (custom_roles !== undefined) {
    const roles = validateCustomRoles(custom_roles);
    if (roles === null) return err('Invalid custom_roles: max 5 roles, 1-24 chars each');
    updates.push(`custom_roles = $${idx++}`);
    params.push(roles);
  }
  if (name_effect !== undefined) {
    const effect = validateNameEffect(name_effect);
    if (effect === null) return err('Invalid name_effect');
    updates.push(`name_effect = $${idx++}`);
    params.push(effect);
  }

  if (updates.length === 0) return err('Nothing to update');
  params.push(user_id);
  await query(`UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx}`, params);
  return ok({ updated: true });
});

export const DELETE = withAdmin(async (req, user) => {
  const { user_id } = await req.json();
  if (!user_id) return err('user_id required');
  if (!isUUID(user_id)) return err('Invalid user_id');
  if (user_id === user.id) return err('Cannot delete yourself', 403);

  await query('DELETE FROM profiles WHERE id = $1', [user_id]);
  return ok({ deleted: true });
});

export const dynamic = 'force-dynamic';
