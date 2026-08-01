import { sql } from '@/lib/db';
import { hashPassword, setSession, type UserPayload } from '@/lib/auth';
import { ok, err } from '@/lib/api';
import { rateLimit } from '@/lib/ratelimit';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const DISPLAY_NAME_MAX = 16;

export async function POST(req: Request) {
  try {
    if (!rateLimit(req, 10)) return err('Too many requests', 429);
    const { username, display_name, password } = await req.json();
    if (!username || !display_name || !password) return err('All fields required');
    if (!USERNAME_RE.test(username)) return err('Username 3-30 chars, letters/numbers/underscore only');
    const cleanName = display_name.trim();
    if (cleanName.length < 1 || cleanName.length > DISPLAY_NAME_MAX) return err(`Display name 1-${DISPLAY_NAME_MAX} chars`);
    if (password.length < 8) return err('Password min 8 chars');

    const existing = await sql`SELECT id FROM profiles WHERE username = ${username}`;
    if (existing.length > 0) return err('Username taken', 409);

    const password_hash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO profiles (username, display_name, password_hash)
      VALUES (${username}, ${cleanName}, ${password_hash})
      RETURNING id, username, display_name
    `;
    const user = rows[0] as unknown as UserPayload;
    await setSession(user);
    return ok(user, 201);
  } catch (e) { return err('Registration failed', 500); }
}

export const dynamic = 'force-dynamic';
