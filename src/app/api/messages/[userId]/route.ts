import { sql, query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const userId = url.pathname.split('/').pop();
  if (!userId) return err('user_id required');
  if (!isUUID(userId)) return err('Invalid user_id');

  const other = await sql`SELECT id, username, display_name, role, points, verified, avatar_style, avatar_seed,
    (SELECT json_build_object('id', ne.id, 'name', ne.name, 'theme', ne.theme, 'effect', ne.effect) FROM name_effects ne WHERE ne.id = profiles.name_effect_id AND ne.active = true) as name_effect,
    (SELECT COALESCE(json_agg(json_build_object('id', b.id, 'name', b.name, 'theme', b.theme, 'effect', b.effect) ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL), '[]'::json) FROM user_badges ub JOIN badges b ON b.id = ub.badge_id AND b.active = true WHERE ub.user_id = profiles.id) as badges
    FROM profiles WHERE id = ${userId}`;
  if (other.length === 0) return err('User not found', 404);

  // Mark incoming messages as read before selecting so receipt is fresh
  await sql`UPDATE messages SET read = true WHERE receiver_id = ${user.id} AND sender_id = ${userId} AND read = false`;

  const rows = await query(`
    SELECT m.id, m.content, m.created_at, m.sender_id, m.read
    FROM messages m
    WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
    ORDER BY m.created_at ASC LIMIT 100
  `, [user.id, userId]);

  return ok({ messages: rows, other: other[0] });
});

export const dynamic = 'force-dynamic';
