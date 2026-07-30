import { query } from '@/lib/db';
import { ok } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const rows = await query(`
    SELECT p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name, u.role,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
       EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_me,
       EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) as bookmarked_by_me
    FROM posts p
    JOIN profiles u ON p.user_id = u.id
    WHERE p.created_at > NOW() - INTERVAL '24 hours' AND u.banned = false
    ORDER BY like_count DESC LIMIT 20
  `, [user.id]);
  return ok({ posts: rows });
});
