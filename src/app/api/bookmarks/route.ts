import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { post_id } = await req.json();
  if (!post_id) return err('post_id required');

  const existing = await sql`SELECT 1 FROM bookmarks WHERE user_id = ${user.id} AND post_id = ${post_id}`;
  if (existing.length > 0) {
    await sql`DELETE FROM bookmarks WHERE user_id = ${user.id} AND post_id = ${post_id}`;
    return ok({ bookmarked: false });
  }
  await sql`INSERT INTO bookmarks (user_id, post_id) VALUES (${user.id}, ${post_id})`;
  return ok({ bookmarked: true }, 201);
});

export const GET = withUser(async (req, user) => {
  const rows = await sql`
    SELECT p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM bookmarks b
    JOIN posts p ON b.post_id = p.id
    JOIN profiles u ON p.user_id = u.id
    WHERE b.user_id = ${user.id}
    ORDER BY b.created_at DESC LIMIT 50
  `;
  return ok({ bookmarks: rows });
});
