import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { username } = await req.json();
  if (!username) return err('username required');
  if (username === user.username) return err('Cannot follow yourself');

  const { rows: target } = await sql`
    SELECT id FROM profiles WHERE username = ${username}
  `;
  if (target.length === 0) return err('User not found', 404);

  const following_id = target[0].id;
  if (following_id === user.id) return err('Cannot follow yourself');

  const existing = await sql`
    SELECT 1 FROM follows WHERE follower_id = ${user.id} AND following_id = ${following_id}
  `;
  if (existing.rows.length > 0) {
    await sql`DELETE FROM follows WHERE follower_id = ${user.id} AND following_id = ${following_id}`;
    return ok({ following: false });
  }

  await sql`INSERT INTO follows (follower_id, following_id) VALUES (${user.id}, ${following_id})`;
  return ok({ following: true }, 201);
});
