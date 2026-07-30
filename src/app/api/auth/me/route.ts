import { getSession, clearSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';

export async function GET() {
  const user = getSession();
  if (!user) return err('Not logged in', 401);

  const rows = await sql`
    SELECT id, username, display_name, bio, role, points, created_at FROM profiles WHERE id = ${user.id}
  `;
  if (rows.length === 0) { clearSession(); return err('User not found', 404); }
  return ok(rows[0]);
}

export async function DELETE() {
  clearSession();
  return ok({ message: 'Logged out' });
}
