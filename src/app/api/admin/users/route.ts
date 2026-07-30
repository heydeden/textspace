import { query } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withAdmin } from '@/lib/api';

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
    `SELECT id, username, display_name, bio, role, points, banned, created_at::text,
      (SELECT COUNT(*)::int FROM posts WHERE user_id = profiles.id) as post_count
     FROM profiles ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return ok({ users: rows, total, page, limit, pages: Math.ceil(total / limit) });
});

export const PATCH = withAdmin(async (req, user) => {
  const { user_id, role, banned } = await req.json();
  if (!user_id) return err('user_id required');
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

  if (updates.length === 0) return err('Nothing to update');
  params.push(user_id);
  await query(`UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx}`, params);
  return ok({ updated: true });
});

export const DELETE = withAdmin(async (req, user) => {
  const { user_id } = await req.json();
  if (!user_id) return err('user_id required');
  if (user_id === user.id) return err('Cannot delete yourself', 403);

  await query('DELETE FROM profiles WHERE id = $1', [user_id]);
  return ok({ deleted: true });
});
