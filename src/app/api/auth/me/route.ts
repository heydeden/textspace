import { getSession, clearSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { rateLimit } from '@/lib/ratelimit';

export async function GET(req: Request) {
  if (!rateLimit(req, 60)) return err('Too many requests', 429);
  const user = await getSession();
  if (!user) return err('Not logged in', 401);

  const rows = await sql`
    SELECT id, username, display_name, bio, role, points, verified, created_at FROM profiles WHERE id = ${user.id}
  `;
  if (rows.length === 0) { await clearSession(); return err('User not found', 404); }
  return ok(rows[0]);
}

export async function DELETE(req: Request) {
  if (!rateLimit(req, 60)) return err('Too many requests', 429);
  await clearSession();
  return ok({ message: 'Logged out' });
}

export const dynamic = 'force-dynamic';
