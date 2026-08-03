import { query } from '@/lib/db';
import { ok } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const rows = await query(`
    SELECT p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name, u.role, u.verified, u.theme, u.avatar_style,
     (SELECT json_build_object('id', ne.id, 'name', ne.name, 'theme', ne.theme, 'effect', ne.effect) FROM name_effects ne WHERE ne.id = u.name_effect_id AND ne.active = true) as name_effect,
     (SELECT COALESCE(json_agg(json_build_object('id', b.id, 'name', b.name, 'theme', b.theme, 'effect', b.effect, 'expires_at', ub.expires_at::text) ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL), '[]'::json) FROM user_badges ub JOIN badges b ON b.id = ub.badge_id AND b.active = true WHERE ub.user_id = u.id AND (ub.expires_at IS NULL OR ub.expires_at > NOW())) as badges, u.avatar_seed,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
       EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_me
    FROM posts p
    JOIN profiles u ON p.user_id = u.id
    WHERE p.created_at > NOW() - INTERVAL '24 hours' AND u.banned = false
      AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = p.user_id) OR (blocker_id = p.user_id AND blocked_id = $1))
    ORDER BY like_count DESC LIMIT 20
  `, [user.id]);
  return ok({ posts: rows });
});

export const dynamic = 'force-dynamic';
