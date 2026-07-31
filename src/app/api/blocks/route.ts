import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  const { username } = await req.json();
  if (!username) return err('username required');
  if (username === user.username) return err('Cannot block yourself');

  const target = await sql`SELECT id FROM profiles WHERE username = ${username} AND banned = false`;
  if (target.length === 0) return err('User not found', 404);

  const blocked_id = target[0].id;

  const existing = await sql`SELECT 1 FROM blocks WHERE blocker_id = ${user.id} AND blocked_id = ${blocked_id}`;
  if (existing.length > 0) {
    await sql`DELETE FROM blocks WHERE blocker_id = ${user.id} AND blocked_id = ${blocked_id}`;
    return ok({ blocked: false });
  }

  await sql`INSERT INTO blocks (blocker_id, blocked_id) VALUES (${user.id}, ${blocked_id})`;
  await sql`DELETE FROM follows WHERE (follower_id = ${user.id} AND following_id = ${blocked_id}) OR (follower_id = ${blocked_id} AND following_id = ${user.id})`;
  await sql`DELETE FROM notifications WHERE (user_id = ${user.id} AND actor_id = ${blocked_id}) OR (user_id = ${blocked_id} AND actor_id = ${user.id})`;
  return ok({ blocked: true }, 201);
});

export const GET = withUser(async (req, user) => {
  const rows = await sql`
    SELECT b.blocked_id as id, u.username, u.display_name, u.role
    FROM blocks b
    JOIN profiles u ON b.blocked_id = u.id
    WHERE b.blocker_id = ${user.id}
    ORDER BY b.created_at DESC LIMIT 100
  `;
  return ok({ blocked: rows });
});

export const dynamic = 'force-dynamic';
