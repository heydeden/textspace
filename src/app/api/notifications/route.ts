import { query } from '@/lib/db';
import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unread') === 'true';

  let q = `
    SELECT n.id, n.type, n.read, n.created_at,
      a.id as actor_id, a.username, a.display_name, a.verified, a.avatar_style,
      n.post_id
    FROM notifications n
    JOIN profiles a ON n.actor_id = a.id
    WHERE n.user_id = $1 AND a.banned = false
      AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = n.actor_id) OR (blocker_id = n.actor_id AND blocked_id = $1))
  `;
  if (unreadOnly) q += ` AND n.read = false`;
  q += ` ORDER BY n.created_at DESC LIMIT 50`;

  const rows = await query(q, [user.id]);
  const unread = await sql`
    SELECT COUNT(*)::int as count FROM notifications n JOIN profiles a ON n.actor_id = a.id WHERE n.user_id = ${user.id} AND n.read = false AND a.banned = false AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = ${user.id} AND blocked_id = n.actor_id) OR (blocker_id = n.actor_id AND blocked_id = ${user.id}))
  `;
  return ok({ notifications: rows, unread: unread[0].count });
});

export const POST = withUser(async (req, user) => {
  const { all } = await req.json();
  if (all) {
    await sql`UPDATE notifications SET read = true WHERE user_id = ${user.id}`;
  }
  return ok({ read: true });
});

export const dynamic = 'force-dynamic';
