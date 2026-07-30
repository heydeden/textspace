import { sql, query } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { post_id } = await req.json();
  if (!post_id) return err('post_id required');

  const existing = await sql`SELECT 1 FROM reposts WHERE user_id = ${user.id} AND post_id = ${post_id}`;
  if (existing.length > 0) {
    await sql`DELETE FROM reposts WHERE user_id = ${user.id} AND post_id = ${post_id}`;
    return ok({ reposted: false });
  }

  await sql`INSERT INTO reposts (user_id, post_id) VALUES (${user.id}, ${post_id})`;
  // +1 point for reposting
  await sql`UPDATE profiles SET points = points + 1 WHERE id = ${user.id}`;
  return ok({ reposted: true }, 201);
});

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');

  let q = `
    SELECT r.post_id, r.created_at as reposted_at,
      p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name
    FROM reposts r
    JOIN posts p ON r.post_id = p.id
    JOIN profiles u ON p.user_id = u.id
  `;
  const params: any[] = [];
  if (username) {
    q += ` WHERE u.username = $1`;
    params.push(username);
  }
  q += ` ORDER BY r.created_at DESC LIMIT 50`;
  const rows = await query(q, params);
  return ok({ reposts: rows });
});
