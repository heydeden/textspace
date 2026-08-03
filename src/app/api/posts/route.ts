import { query, sql } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');
  const feed = url.searchParams.get('feed');
  const id = url.searchParams.get('id');
  const group_id = url.searchParams.get('group_id');
  if (id && !isUUID(id)) return err('Invalid post id');
  if (group_id && !isUUID(group_id)) return err('Invalid group_id');

  // Privat group: hanya anggota aktif yang bisa baca feed-nya.
  if (group_id) {
    const g = await query(`SELECT privacy FROM groups WHERE id = $1`, [group_id]);
    if (g.length === 0) return err('Group not found', 404);
    if (g[0].privacy === 'private') {
      const mem = await query(`SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'active'`, [group_id, user.id]);
      if (mem.length === 0) return err('Private group', 403);
    }
  }

  // Permalink post dalam grup privat: hanya anggota aktif yang boleh lihat.
  if (id && !group_id) {
    const pg = await query(`SELECT g.privacy, p.group_id FROM posts p LEFT JOIN groups g ON g.id = p.group_id WHERE p.id = $1`, [id]);
    if (pg.length > 0 && pg[0].group_id && pg[0].privacy === 'private') {
      const mem = await query(`SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'active'`, [pg[0].group_id, user.id]);
      if (mem.length === 0) return err('Private group', 403);
    }
  }

  let sqlStr = `
    SELECT p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name, u.role, u.verified, u.theme, u.avatar_style, u.avatar_seed,
     (SELECT json_build_object('id', ne.id, 'name', ne.name, 'theme', ne.theme, 'effect', ne.effect) FROM name_effects ne WHERE ne.id = u.name_effect_id AND ne.active = true) as name_effect,
     (SELECT COALESCE(json_agg(json_build_object('id', b.id, 'name', b.name, 'theme', b.theme, 'effect', b.effect, 'expires_at', ub.expires_at::text) ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL), '[]'::json) FROM user_badges ub JOIN badges b ON b.id = ub.badge_id AND b.active = true WHERE ub.user_id = u.id AND (ub.expires_at IS NULL OR ub.expires_at > NOW())) as badges,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
       EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_me
    FROM posts p
    JOIN profiles u ON p.user_id = u.id
  `;
  const params: any[] = [user.id];
  const conditions: string[] = ['u.banned = false'];

  if (feed === 'following') {
    conditions.push(`(p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $${params.length + 1}) OR p.user_id = $${params.length + 1})`);
    params.push(user.id);
  }

  if (username) {
    conditions.push(`u.username = $${params.length + 1}`);
    params.push(username);
  }

  if (id) {
    conditions.push(`p.id = $${params.length + 1}`);
    params.push(id);
  }

  if (group_id) {
    // Feed grup: hanya post milik grup tsb. Privat → harus anggota aktif.
    conditions.push(`p.group_id = $${params.length + 1}`);
    params.push(group_id);
  } else if (!id) {
    // Feed global/profile/following: kecualikan post dalam grup (hanya tampil di grup).
    conditions.push(`p.group_id IS NULL`);
  }
  // id lookup (permalink): tanpa batasan grup — tapi cek privacy privat di bawah.

  conditions.push(`NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = $${params.length + 1} AND blocked_id = p.user_id) OR (blocker_id = p.user_id AND blocked_id = $${params.length + 1}))`);
  params.push(user.id);

  sqlStr += ` WHERE ${conditions.join(' AND ')}`;

  sqlStr += ` ORDER BY p.created_at DESC LIMIT 21`;

  const rows = await query(sqlStr, params);
  const has_more = rows.length > 21;
  if (has_more) rows.pop();

  return ok({ posts: rows, has_more, cursor: rows.length > 0 ? rows[rows.length - 1].created_at : null });
});

export const POST = withUser(async (req, user) => {
  const { content, group_id } = await req.json();
  if (!content || content.trim().length === 0) return err('Content required');
  if (content.length > 280) return err('Max 280 characters');
  if (group_id && !isUUID(group_id)) return err('Invalid group_id');

  if (group_id) {
    // Harus anggota aktif grup untuk post ke dalam grup.
    const mem = await sql`SELECT status FROM group_members WHERE group_id = ${group_id} AND user_id = ${user.id}`;
    if (mem.length === 0 || mem[0].status !== 'active') return err('Not a group member', 403);
  }

  const rows = await sql`
    INSERT INTO posts (user_id, content, group_id) VALUES (${user.id}, ${content}, ${group_id ?? null})
    RETURNING id, content, created_at
  `;

  return ok(rows[0], 201);
});

export const PATCH = withUser(async (req, user) => {
  const { post_id, content } = await req.json();
  if (!post_id) return err('post_id required');
  if (!content || content.trim().length === 0) return err('Content required');
  if (!isUUID(post_id)) return err('Invalid post_id');
  if (content.length > 280) return err('Max 280 characters');

  const post = await sql`SELECT user_id, created_at FROM posts WHERE id = ${post_id}`;
  if (post.length === 0) return err('Post not found', 404);
  if (post[0].user_id !== user.id) return err('Not your post', 403);

  const ageHours = (Date.now() - new Date(post[0].created_at).getTime()) / 3600000;
  if (ageHours > 24) return err('Can only edit posts within 24 hours', 403);

  const rows = await sql`
    UPDATE posts SET content = ${content} WHERE id = ${post_id}
    RETURNING id, content, created_at
  `;
  return ok(rows[0]);
});

export const DELETE = withUser(async (req, user) => {
  const { post_id } = await req.json();
  if (!post_id) return err('post_id required');
  if (!isUUID(post_id)) return err('Invalid post_id');

  const post = await sql`SELECT user_id, group_id FROM posts WHERE id = ${post_id}`;
  if (post.length === 0) return err('Post not found', 404);

  let canDelete = post[0].user_id === user.id;
  if (!canDelete && post[0].group_id) {
    // Admin grup boleh hapus post anggota di grupnya.
    const mem = await sql`SELECT role FROM group_members WHERE group_id = ${post[0].group_id} AND user_id = ${user.id} AND status = 'active'`;
    if (mem.length > 0 && mem[0].role === 'admin') canDelete = true;
  }
  if (!canDelete) return err('Not your post', 403);

  await sql`DELETE FROM posts WHERE id = ${post_id}`;

  return ok({ deleted: true });
});

export const dynamic = 'force-dynamic';
