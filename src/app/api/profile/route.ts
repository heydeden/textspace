import { query } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');
  if (!username) return err('username required');

  const rows = await query(
    'SELECT id, username, display_name, bio, role, points, created_at FROM profiles WHERE username = $1',
    [username]
  );
  if (rows.length === 0) return err('User not found', 404);
  return ok(rows[0]);
};

export const PATCH = withUser(async (req, user) => {
  const { display_name, bio } = await req.json();
  if (display_name !== undefined && (display_name.length < 1 || display_name.length > 50)) {
    return err('Display name 1-50 characters');
  }

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (display_name !== undefined) {
    updates.push(`display_name = $${idx++}`);
    params.push(display_name);
  }
  if (bio !== undefined) {
    updates.push(`bio = $${idx++}`);
    params.push(bio);
  }

  if (updates.length === 0) return err('Nothing to update');

  params.push(user.id);
  const rows = await query(
    `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, display_name, bio, role, points`,
    params
  );
  return ok(rows[0]);
});
