import { query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withAdmin } from '@/lib/api';
import { validateNameEffectName, validateNameEffectTheme, validateNameEffectFx } from '@/lib/nameEffects';

export const GET = withAdmin(async () => {
  const rows = await query(
    `SELECT ne.id, ne.name, ne.theme, ne.effect, ne.active, ne.created_at::text,
       (SELECT COUNT(*)::int FROM profiles p WHERE p.name_effect_id = ne.id) as grant_count
     FROM name_effects ne ORDER BY ne.created_at DESC`
  );
  return ok({ nameEffects: rows });
});

export const POST = withAdmin(async (req, user) => {
  const { name, theme, effect } = await req.json();
  const cleanName = validateNameEffectName(name);
  if (cleanName === null) return err('Invalid name effect name: 1-24 chars');
  const t = validateNameEffectTheme(theme);
  if (t === null) return err('Invalid theme');
  const e = validateNameEffectFx(effect);
  if (e === null) return err('Invalid effect');

  const existing = await query('SELECT id FROM name_effects WHERE name = $1', [cleanName]);
  if (existing.length > 0) return err('Name effect name taken', 409);

  const rows = await query(
    `INSERT INTO name_effects (name, theme, effect, created_by) VALUES ($1, $2, $3, $4)
     RETURNING id, name, theme, effect, active, created_at::text`,
    [cleanName, t, e, user.id]
  );
  return ok(rows[0], 201);
});

export const PATCH = withAdmin(async (req) => {
  const { effect_id, name, theme, effect, active } = await req.json();
  if (!effect_id || !isUUID(effect_id)) return err('Invalid effect_id');

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (name !== undefined) {
    const cleanName = validateNameEffectName(name);
    if (cleanName === null) return err('Invalid name effect name: 1-24 chars');
    const existing = await query('SELECT id FROM name_effects WHERE name = $1 AND id != $2', [cleanName, effect_id]);
    if (existing.length > 0) return err('Name effect name taken', 409);
    updates.push(`name = $${idx++}`);
    params.push(cleanName);
  }
  if (theme !== undefined) {
    const t = validateNameEffectTheme(theme);
    if (t === null) return err('Invalid theme');
    updates.push(`theme = $${idx++}`);
    params.push(t);
  }
  if (effect !== undefined) {
    const e = validateNameEffectFx(effect);
    if (e === null) return err('Invalid effect');
    updates.push(`effect = $${idx++}`);
    params.push(e);
  }
  if (active !== undefined) {
    if (typeof active !== 'boolean') return err('active must be boolean');
    updates.push(`active = $${idx++}`);
    params.push(active);
  }

  if (updates.length === 0) return err('Nothing to update');
  params.push(effect_id);
  await query(`UPDATE name_effects SET ${updates.join(', ')} WHERE id = $${idx}`, params);
  return ok({ updated: true });
});

export const DELETE = withAdmin(async (req) => {
  const { effect_id } = await req.json();
  if (!effect_id || !isUUID(effect_id)) return err('Invalid effect_id');
  await query('UPDATE profiles SET name_effect_id = NULL WHERE name_effect_id = $1', [effect_id]);
  await query('DELETE FROM name_effects WHERE id = $1', [effect_id]);
  return ok({ deleted: true });
});

export const dynamic = 'force-dynamic';
