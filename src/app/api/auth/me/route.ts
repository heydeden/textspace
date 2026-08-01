import { getSession, clearSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { rateLimit } from '@/lib/ratelimit';

export async function GET(req: Request) {
  if (!rateLimit(req, 60)) return err('Too many requests', 429);
  const user = await getSession();
  if (!user) return err('Not logged in', 401);

  const rows = await sql`
    SELECT id, username, display_name, bio, role, points, verified, name_effect, theme, avatar_style, avatar_seed, created_at,
      (SELECT COALESCE(json_agg(json_build_object('id', b.id, 'name', b.name, 'theme', b.theme, 'effect', b.effect) ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL), '[]'::json) FROM user_badges ub JOIN badges b ON b.id = ub.badge_id AND b.active = true WHERE ub.user_id = profiles.id) as badges
    FROM profiles WHERE id = ${user.id}
  `;
  if (rows.length === 0) { await clearSession(); return err('User not found', 404); }
  return ok(rows[0]);
}

export async function DELETE(req: Request) {
  if (!rateLimit(req, 60)) return err('Too many requests', 429);
  await clearSession();
  return ok({ message: 'Logged out' });
}

export const dynamic = 'force-dynamic';
