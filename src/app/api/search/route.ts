import { query } from '@/lib/db';
import { ok } from '@/lib/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  if (!q || q.length < 1) return ok({ users: [] });

  const users = await query(
    `SELECT id, username, display_name, role, points, banned
     FROM profiles WHERE (username ILIKE $1 OR display_name ILIKE $1) AND banned = false
     ORDER BY points DESC LIMIT 20`,
    [`%${q}%`]
  );
  return ok({ users });
}
