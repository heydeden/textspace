import { sql } from '@/lib/db';
import { hashPassword, setSession, type UserPayload } from '@/lib/auth';
import { ok, err } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const { username, display_name, password } = await req.json();
    if (!username || !display_name || !password) return err('All fields required');
    if (username.length < 3 || username.length > 30) return err('Username 3-30 chars');
    if (password.length < 6) return err('Password min 6 chars');

    const existing = await sql`SELECT id FROM profiles WHERE username = ${username}`;
    if (existing.length > 0) return err('Username taken', 409);

    const password_hash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO profiles (username, display_name, password_hash)
      VALUES (${username}, ${display_name}, ${password_hash})
      RETURNING id, username, display_name
    `;
    const user = rows[0] as unknown as UserPayload;
    await setSession(user);
    return ok(user, 201);
  } catch (e) { return err('Registration failed', 500); }
}

export const dynamic = 'force-dynamic';
