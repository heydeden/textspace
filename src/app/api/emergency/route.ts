import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';

export async function POST() {
  const user = await sql`SELECT id, role FROM profiles WHERE username = 'setrahden'`;
  if (user.length === 0) return err('User setrahden not found', 404);

  await sql`UPDATE profiles SET role = 'admin' WHERE username = 'setrahden'`;
  return ok({ message: 'setrahden is now admin. Re-login required.' });
}
