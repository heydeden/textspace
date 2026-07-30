import { sql, query } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const userId = url.pathname.split('/').pop();
  if (!userId) return err('user_id required');

  const rows = await query(`
    SELECT m.id, m.content, m.created_at, m.sender_id
    FROM messages m
    WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
    ORDER BY m.created_at ASC LIMIT 100
  `, [user.id, userId]);

  const other = await sql`SELECT id, username, display_name FROM profiles WHERE id = ${userId}`;
  if (other.length === 0) return err('User not found', 404);

  return ok({ messages: rows, other: other[0] });
});
