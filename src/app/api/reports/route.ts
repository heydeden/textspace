import { sql } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { post_id, user_id, reason } = await req.json();
  if (!post_id && !user_id) return err('post_id or user_id required');
  if (post_id && !isUUID(post_id)) return err('Invalid post_id');
  if (user_id && !isUUID(user_id)) return err('Invalid user_id');
  if (!reason || reason.length < 10) return err('Reason min 10 characters');
  if (reason.length > 500) return err('Reason max 500 characters');

  await sql`
    INSERT INTO reports (reporter_id, post_id, user_id, reason)
    VALUES (${user.id}, ${post_id || null}, ${user_id || null}, ${reason})
  `;
  return ok({ reported: true }, 201);
});
