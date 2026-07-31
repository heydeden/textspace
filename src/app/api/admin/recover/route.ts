import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const POST = withUser(async (req, user) => {
  if (process.env.ENABLE_ADMIN_RECOVERY !== 'true') return err('Not allowed', 403);
  const admins = await sql`SELECT COUNT(*)::int as cnt FROM profiles WHERE role = 'admin'`;
  if (admins[0].cnt > 0) return err('Admins already exist', 403);

  await sql`UPDATE profiles SET role = 'admin' WHERE id = ${user.id}`;
  return ok({ message: 'You are now admin. Please login again.', role: 'admin' });
});
