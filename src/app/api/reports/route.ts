import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { post_id, user_id, reason } = await req.json();
  if (!post_id && !user_id) return err('post_id or user_id required');
  if (!reason || reason.length < 10) return err('Reason min 10 characters');
  if (reason.length > 500) return err('Reason max 500 characters');

  await sql`
    INSERT INTO reports (reporter_id, post_id, user_id, reason)
    VALUES (${user.id}, ${post_id || null}, ${user_id || null}, ${reason})
  `;
  return ok({ reported: true }, 201);
});
