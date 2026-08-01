import { query } from '@/lib/db';
import { ok } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const rows = await query(`
    SELECT u.id, u.username, u.display_name, u.role, u.points, u.verified, u.avatar_style,
     (SELECT json_build_object('id', ne.id, 'name', ne.name, 'theme', ne.theme, 'effect', ne.effect) FROM name_effects ne WHERE ne.id = u.name_effect_id AND ne.active = true) as name_effect,
     (SELECT COALESCE(json_agg(json_build_object('id', b.id, 'name', b.name, 'theme', b.theme, 'effect', b.effect) ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL), '[]'::json) FROM user_badges ub JOIN badges b ON b.id = ub.badge_id AND b.active = true WHERE ub.user_id = u.id) as badges,
      (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
    FROM profiles u
    WHERE u.banned = false
      AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = u.id) OR (blocker_id = u.id AND blocked_id = $1))
    ORDER BY u.points DESC
    LIMIT 50
  `, [user.id]);
  return ok({ leaderboard: rows });
});

export const dynamic = 'force-dynamic';
