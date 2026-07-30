import { sql } from '@/lib/db';
import { verifyPassword, setSession } from '@/lib/auth';
import { ok, err } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return err('Username and password required');

    const rows = await sql`
      SELECT id, username, display_name, password_hash FROM profiles WHERE username = ${username}
    `;
    if (rows.length === 0) return err('Invalid credentials', 401);

    const user = rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return err('Invalid credentials', 401);

    setSession({ id: user.id, username: user.username, display_name: user.display_name });
    return ok({ id: user.id, username: user.username, display_name: user.display_name });
  } catch (e) { return err('Login failed', 500); }
}
