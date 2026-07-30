import { query, sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');

  let sqlStr = `
    SELECT p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
       EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_me,
       EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) as bookmarked_by_me
    FROM posts p
    JOIN profiles u ON p.user_id = u.id
  `;
  const params: any[] = [user.id];
  const conditions: string[] = ['u.banned = false'];

  if (username) {
    conditions.push(`u.username = $${params.length + 1}`);
    params.push(username);
  }

  sqlStr += ` WHERE ${conditions.join(' AND ')}`;

  sqlStr += ` ORDER BY p.created_at DESC LIMIT 21`;

  const rows = await query(sqlStr, params);
  const has_more = rows.length > 21;
  if (has_more) rows.pop();

  return ok({ posts: rows, has_more, cursor: rows.length > 0 ? rows[rows.length - 1].created_at : null });
});

export const POST = withUser(async (req, user) => {
  const { content } = await req.json();
  if (!content || content.trim().length === 0) return err('Content required');
  if (content.length > 280) return err('Max 280 characters');

  const rows = await sql`
    INSERT INTO posts (user_id, content) VALUES (${user.id}, ${content})
    RETURNING id, content, created_at
  `;

  // +5 points for posting
  await sql`UPDATE profiles SET points = points + 5 WHERE id = ${user.id}`;

  return ok(rows[0], 201);
});

export const DELETE = withUser(async (req, user) => {
  const { post_id } = await req.json();
  if (!post_id) return err('post_id required');

  const post = await sql`SELECT user_id FROM posts WHERE id = ${post_id}`;
  if (post.length === 0) return err('Post not found', 404);
  if (post[0].user_id !== user.id) return err('Not your post', 403);

  await sql`DELETE FROM posts WHERE id = ${post_id}`;
  await sql`UPDATE profiles SET points = GREATEST(0, points - 5) WHERE id = ${user.id}`;

  return ok({ deleted: true });
});
