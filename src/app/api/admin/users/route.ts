import { query, transaction } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withAdmin } from '@/lib/api';
import { validateProfileTheme } from '@/lib/profileThemes';
import { parseBadgeGrants } from '@/lib/badgeGrants';

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
    `SELECT id, username, display_name, bio, role, banned, verified, theme, avatar_style, created_at::text,
      (SELECT json_build_object('id', ne.id, 'name', ne.name, 'theme', ne.theme, 'effect', ne.effect) FROM name_effects ne WHERE ne.id = profiles.name_effect_id AND ne.active = true) as name_effect,
      (SELECT COALESCE(json_agg(json_build_object('id', b.id, 'name', b.name, 'theme', b.theme, 'effect', b.effect, 'expires_at', ub.expires_at::text, 'granted_at', ub.granted_at::text) ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL), '[]'::json) FROM user_badges ub JOIN badges b ON b.id = ub.badge_id AND b.active = true WHERE ub.user_id = profiles.id AND (ub.expires_at IS NULL OR ub.expires_at > NOW())) as badges,
      (SELECT COUNT(*)::int FROM posts WHERE user_id = profiles.id) as post_count
     FROM profiles ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return ok({ users: rows, total, page, limit, pages: Math.ceil(total / limit) });
});

export const PATCH = withAdmin(async (req, user) => {
  const { user_id, role, banned, verified, name_effect_id, theme, badges } = await req.json();
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
  if (verified !== undefined) {
    if (typeof verified !== 'boolean') return err('verified must be boolean');
    updates.push(`verified = $${idx++}`);
    params.push(verified);
  }
  if (name_effect_id !== undefined) {
    if (name_effect_id === null) {
      updates.push(`name_effect_id = $${idx++}`);
      params.push(null);
    } else if (typeof name_effect_id === 'string' && isUUID(name_effect_id)) {
      const exists = await query('SELECT id FROM name_effects WHERE id = $1 AND active = true', [name_effect_id]);
      if (exists.length === 0) return err('Name effect not found');
      updates.push(`name_effect_id = $${idx++}`);
      params.push(name_effect_id);
    } else {
      return err('Invalid name_effect_id');
    }
  }
  if (theme !== undefined) {
    const t = validateProfileTheme(theme);
    if (t === null) return err('Invalid theme');
    updates.push(`theme = $${idx++}`);
    params.push(t);
  }
  if (badges !== undefined) {
    const grants = parseBadgeGrants(badges);
    if (grants === null) return err('Invalid badges: max 5, format id atau {id,value,unit}');
    const badgeIds = grants.map(g => g.id);
    const valid = await query(
      `SELECT id FROM badges WHERE id = ANY($1::uuid[]) AND active = true`,
      [badgeIds]
    );
    if (valid.length !== badgeIds.length) return err('One or more badges not found');
    // Transaction: replace badges atomic — kalau insert gagal, set lama tidak hilang.
    await transaction((tx) => [
      tx`DELETE FROM user_badges WHERE user_id = ${user_id}`,
      ...grants.map(g => tx`INSERT INTO user_badges (user_id, badge_id, expires_at) VALUES (${user_id}, ${g.id}, ${g.expiresAt})`),
    ]);
  }

  if (updates.length > 0) {
    params.push(user_id);
    await query(`UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx}`, params);
  }
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
