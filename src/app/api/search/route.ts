import { query } from '@/lib/db';
import { ok } from '@/lib/api';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const type = url.searchParams.get('type') || 'users';
  if (!q || q.length < 1) return ok({ users: [], posts: [] });

  const me = await getSession();

  if (type === 'posts') {
    const posts = await query(
      `SELECT p.id, p.content, p.created_at,
        u.id as user_id, u.username, u.display_name, u.role, u.points,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        ${me ? `EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_me` : 'false as liked_by_me'}
       FROM posts p
       JOIN profiles u ON p.user_id = u.id
       WHERE p.content ILIKE ${me ? '$2' : '$1'} AND u.banned = false
       ${me ? `AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = p.user_id) OR (blocker_id = p.user_id AND blocked_id = $1))` : ''}
       ORDER BY p.created_at DESC LIMIT 50`,
      me ? [me.id, `%${q}%`] : [`%${q}%`]
    );
    return ok({ users: [], posts });
  }

  const users = await query(
    `SELECT id, username, display_name, role, points, banned
     FROM profiles WHERE (username ILIKE $1 OR display_name ILIKE $1) AND banned = false
     ${me ? `AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = $2 AND blocked_id = profiles.id) OR (blocker_id = profiles.id AND blocked_id = $2))` : ''}
     ORDER BY points DESC LIMIT 20`,
    me ? [`%${q}%`, me.id] : [`%${q}%`]
  );
  return ok({ users });
}
