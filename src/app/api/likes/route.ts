import { sql } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { post_id } = await req.json();
  if (!post_id) return err('post_id required');
  if (!isUUID(post_id)) return err('Invalid post_id');

  const post = await sql`SELECT user_id FROM posts WHERE id = ${post_id}`;
  if (post.length === 0) return err('Post not found', 404);
  if (post[0].user_id !== user.id) {
    const blocked = await sql`SELECT 1 FROM blocks WHERE (blocker_id = ${user.id} AND blocked_id = ${post[0].user_id}) OR (blocker_id = ${post[0].user_id} AND blocked_id = ${user.id})`;
    if (blocked.length > 0) return err('Cannot like', 403);
  }

  const existing = await sql`SELECT 1 FROM likes WHERE user_id = ${user.id} AND post_id = ${post_id}`;
  if (existing.length > 0) {
    if (post[0].user_id !== user.id) {
      await sql`DELETE FROM notifications WHERE type = 'like' AND user_id = ${post[0].user_id} AND actor_id = ${user.id} AND post_id = ${post_id}`;
    }
    await sql`DELETE FROM likes WHERE user_id = ${user.id} AND post_id = ${post_id}`;
    return ok({ liked: false });
  }

  await sql`INSERT INTO likes (user_id, post_id) VALUES (${user.id}, ${post_id})`;
  if (post[0].user_id !== user.id) {
    await sql`INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES (${post[0].user_id}, ${user.id}, 'like', ${post_id})`;
  }
  return ok({ liked: true }, 201);
});

export const dynamic = 'force-dynamic';
