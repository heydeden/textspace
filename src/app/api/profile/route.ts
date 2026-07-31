import { query, sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { isValidAvatarStyle } from '@/lib/avatars';

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');
  if (!username) return err('username required');

  const rows = await query(
    `SELECT id, username, display_name, bio, role, points, banned, verified, avatar_style, created_at FROM profiles WHERE username = $1`,
    [username]
  );
  if (rows.length === 0) return err('User not found', 404);

  const target = rows[0];
  if (target.banned) return err('User not found', 404);

  const stats = await query(
    `SELECT
       (SELECT COUNT(*) FROM posts WHERE user_id = $1)::int as post_count,
       (SELECT COUNT(*) FROM follows WHERE following_id = $1)::int as follower_count,
       (SELECT COUNT(*) FROM follows WHERE follower_id = $1)::int as following_count,
       (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = $1)::int as like_count`,
    [target.id]
  );

  let blocked_by_me = false;
  const me = await getSession();
  if (me) {
    const b = await sql`SELECT 1 FROM blocks WHERE blocker_id = ${me.id} AND blocked_id = ${target.id}`;
    blocked_by_me = b.length > 0;
  }

  return ok({ ...rows[0], ...stats[0], blocked_by_me });
};

export const PATCH = withUser(async (req, user) => {
  const { display_name, bio, avatar_style } = await req.json();
  if (display_name !== undefined && (display_name.length < 1 || display_name.length > 50)) {
    return err('Display name 1-50 characters');
  }
  if (bio !== undefined && bio.length > 200) return err('Bio max 200 characters');
  if (avatar_style !== undefined && !isValidAvatarStyle(avatar_style)) {
    return err('Invalid avatar style');
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
  if (avatar_style !== undefined) {
    updates.push(`avatar_style = $${idx++}`);
    params.push(avatar_style);
  }

  if (updates.length === 0) return err('Nothing to update');

  params.push(user.id);
  const rows = await query(
    `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, display_name, bio, role, points, verified, avatar_style`,
    params
  );
  return ok(rows[0]);
});

export const dynamic = 'force-dynamic';
