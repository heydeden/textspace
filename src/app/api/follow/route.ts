import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { username } = await req.json();
  if (!username) return err('username required');
  if (username === user.username) return err('Cannot follow yourself');

  const target = await sql`SELECT id FROM profiles WHERE username = ${username}`;
  if (target.length === 0) return err('User not found', 404);

  const following_id = target[0].id;

  const blocked = await sql`SELECT 1 FROM blocks WHERE (blocker_id = ${user.id} AND blocked_id = ${following_id}) OR (blocker_id = ${following_id} AND blocked_id = ${user.id})`;
  if (blocked.length > 0) return err('Cannot follow', 403);

  const existing = await sql`SELECT 1 FROM follows WHERE follower_id = ${user.id} AND following_id = ${following_id}`;
  if (existing.length > 0) {
    await sql`DELETE FROM follows WHERE follower_id = ${user.id} AND following_id = ${following_id}`;
    return ok({ following: false });
  }

  await sql`INSERT INTO follows (follower_id, following_id) VALUES (${user.id}, ${following_id})`;
  await sql`INSERT INTO notifications (user_id, actor_id, type) VALUES (${following_id}, ${user.id}, 'follow')`;
  return ok({ following: true }, 201);
});

export const dynamic = 'force-dynamic';
