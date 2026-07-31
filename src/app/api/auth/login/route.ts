import { sql } from '@/lib/db';
import { verifyPassword, setSession } from '@/lib/auth';
import { ok, err } from '@/lib/api';
import { rateLimit } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    if (!rateLimit(req, 10)) return err('Too many requests', 429);
    const { username, password } = await req.json();
    if (!username || !password) return err('Username and password required');

    const rows = await sql`
      SELECT id, username, display_name, password_hash, banned FROM profiles WHERE username = ${username}
    `;
    if (rows.length === 0) return err('Invalid credentials', 401);

    const user = rows[0];
    if (user.banned) return err('Account suspended. Contact admin.', 403);

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return err('Invalid credentials', 401);

    await setSession({ id: user.id, username: user.username, display_name: user.display_name });
    return ok({ id: user.id, username: user.username, display_name: user.display_name });
  } catch (e) { return err('Login failed', 500); }
}

export const dynamic = 'force-dynamic';
