import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');

  let queryStr = `
    SELECT p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_me
    FROM posts p
    JOIN profiles u ON p.user_id = u.id
  `;
  const params: any[] = [user.id];

  if (username) {
    queryStr += ` WHERE u.username = $2`;
    params.push(username);
  }

  queryStr += ` ORDER BY p.created_at DESC LIMIT 21`;

  const rows = await sql(queryStr, ...params);
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
  return ok(rows[0], 201);
});
