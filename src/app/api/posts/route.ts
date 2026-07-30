import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  let query = sql`
    SELECT p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${(await import('@/lib/auth')).getSession()!.id}) as liked_by_me
    FROM posts p
    JOIN profiles u ON p.user_id = u.id
  `;

  if (username) {
    query = sql`
      ${query} WHERE u.username = ${username}
    `;
  }

  if (cursor) {
    query = sql`
      ${query} AND p.created_at < ${cursor}::timestamptz
    `;
  }

  query = sql`${query} ORDER BY p.created_at DESC LIMIT ${limit + 1}`;

  const { rows } = await query;
  const has_more = rows.length > limit;
  if (has_more) rows.pop();

  return ok({ posts: rows, has_more, cursor: rows.length > 0 ? rows[rows.length - 1].created_at : null });
});

export const POST = withUser(async (req, user) => {
  const { content } = await req.json();
  if (!content || content.trim().length === 0) return err('Content required');
  if (content.length > 280) return err('Max 280 characters');

  const { rows } = await sql`
    INSERT INTO posts (user_id, content) VALUES (${user.id}, ${content})
    RETURNING id, content, created_at
  `;
  return ok(rows[0], 201);
});
