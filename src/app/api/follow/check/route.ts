import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { username } = await req.json();
  if (!username) return err('username required');

  const target = await sql`SELECT id FROM profiles WHERE username = ${username}`;
  if (target.length === 0) return err('User not found', 404);

  const existing = await sql`
    SELECT 1 FROM follows WHERE follower_id = ${user.id} AND following_id = ${target[0].id}
  `;
  return ok({ following: existing.length > 0 });
});

export const dynamic = 'force-dynamic';
