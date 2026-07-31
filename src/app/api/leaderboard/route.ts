import { query } from '@/lib/db';
import { ok } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const rows = await query(`
    SELECT u.id, u.username, u.display_name, u.role, u.points,
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
