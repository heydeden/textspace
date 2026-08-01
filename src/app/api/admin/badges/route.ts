import { query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withAdmin } from '@/lib/api';
import { validateBadgeName, validateBadgeTheme, validateBadgeEffect } from '@/lib/badges';

export const GET = withAdmin(async () => {
  const rows = await query(
    `SELECT b.id, b.name, b.theme, b.effect, b.active, b.created_at::text,
       (SELECT COUNT(*)::int FROM user_badges ub WHERE ub.badge_id = b.id) as grant_count
     FROM badges b ORDER BY b.created_at DESC`
  );
  return ok({ badges: rows });
});

export const POST = withAdmin(async (req, user) => {
  const { name, theme, effect } = await req.json();
  const cleanName = validateBadgeName(name);
  if (cleanName === null) return err('Invalid badge name: 1-24 chars');
  const t = validateBadgeTheme(theme);
  if (t === null) return err('Invalid badge theme');
  const e = validateBadgeEffect(effect);
  if (e === null) return err('Invalid badge effect');

  const existing = await query('SELECT id FROM badges WHERE name = $1', [cleanName]);
  if (existing.length > 0) return err('Badge name taken', 409);

  const rows = await query(
    `INSERT INTO badges (name, theme, effect, created_by) VALUES ($1, $2, $3, $4)
     RETURNING id, name, theme, effect, active, created_at::text`,
    [cleanName, t, e, user.id]
  );
  return ok(rows[0], 201);
});

export const PATCH = withAdmin(async (req) => {
  const { badge_id, name, theme, effect, active } = await req.json();
  if (!badge_id || !isUUID(badge_id)) return err('Invalid badge_id');

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (name !== undefined) {
    const cleanName = validateBadgeName(name);
    if (cleanName === null) return err('Invalid badge name: 1-24 chars');
    const existing = await query('SELECT id FROM badges WHERE name = $1 AND id != $2', [cleanName, badge_id]);
    if (existing.length > 0) return err('Badge name taken', 409);
    updates.push(`name = $${idx++}`);
    params.push(cleanName);
  }
  if (theme !== undefined) {
    const t = validateBadgeTheme(theme);
    if (t === null) return err('Invalid badge theme');
    updates.push(`theme = $${idx++}`);
    params.push(t);
  }
  if (effect !== undefined) {
    const e = validateBadgeEffect(effect);
    if (e === null) return err('Invalid badge effect');
    updates.push(`effect = $${idx++}`);
    params.push(e);
  }
  if (active !== undefined) {
    if (typeof active !== 'boolean') return err('active must be boolean');
    updates.push(`active = $${idx++}`);
    params.push(active);
  }

  if (updates.length === 0) return err('Nothing to update');
  params.push(badge_id);
  await query(`UPDATE badges SET ${updates.join(', ')} WHERE id = $${idx}`, params);
  return ok({ updated: true });
});

export const DELETE = withAdmin(async (req) => {
  const { badge_id } = await req.json();
  if (!badge_id || !isUUID(badge_id)) return err('Invalid badge_id');
  await query('DELETE FROM badges WHERE id = $1', [badge_id]);
  return ok({ deleted: true });
});

export const dynamic = 'force-dynamic';
