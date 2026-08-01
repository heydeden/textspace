import { sql, query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  // Get all conversations for this user (last message per other user)
  const rows = await query(`
    SELECT DISTINCT ON (other_id)
      other_id as user_id, other.username, other.display_name, other.role, other.points, other.verified, other.custom_roles, other.name_effect, other.avatar_style, other.avatar_seed,
      m.content as last_message, m.created_at as last_message_at
    FROM (
      SELECT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_id,
        id, content, created_at
      FROM messages WHERE sender_id = $1 OR receiver_id = $1
    ) m
    JOIN profiles other ON m.other_id = other.id
    ORDER BY other_id, m.created_at DESC
    LIMIT 50
  `, [user.id]);

  const unreadResult = await query(
    `SELECT COUNT(*)::int as count FROM messages WHERE receiver_id = $1 AND read = false`,
    [user.id]
  );

  return ok({ conversations: rows, unread: unreadResult[0].count });
});

export const POST = withUser(async (req, user) => {
  const { receiver_id, content } = await req.json();
  if (!receiver_id || !content) return err('receiver_id and content required');
  if (!isUUID(receiver_id)) return err('Invalid receiver_id');
  if (content.length > 500) return err('Max 500 characters');

  if (receiver_id === user.id) return err('Cannot message yourself');

  const blocked = await sql`
    SELECT 1 FROM blocks
    WHERE (blocker_id = ${user.id} AND blocked_id = ${receiver_id})
       OR (blocker_id = ${receiver_id} AND blocked_id = ${user.id})
  `;
  if (blocked.length > 0) return err('Cannot message this user', 403);

  const rows = await sql`
    INSERT INTO messages (sender_id, receiver_id, content)
    VALUES (${user.id}, ${receiver_id}, ${content})
    RETURNING id, content, created_at
  `;
  return ok(rows[0], 201);
});

export const dynamic = 'force-dynamic';
