import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { post_id } = await req.json();
  if (!post_id) return err('post_id required');

  const existing = await sql`SELECT 1 FROM likes WHERE user_id = ${user.id} AND post_id = ${post_id}`;
  if (existing.length > 0) {
    await sql`DELETE FROM likes WHERE user_id = ${user.id} AND post_id = ${post_id}`;
    return ok({ liked: false });
  }

  await sql`INSERT INTO likes (user_id, post_id) VALUES (${user.id}, ${post_id})`;
  const post = await sql`SELECT user_id FROM posts WHERE id = ${post_id}`;
  if (post.length > 0 && post[0].user_id !== user.id) {
    await sql`UPDATE profiles SET points = points + 2 WHERE id = ${post[0].user_id}`;
    await sql`INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES (${post[0].user_id}, ${user.id}, 'like', ${post_id})`;
  }
  return ok({ liked: true }, 201);
});
