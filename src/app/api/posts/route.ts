import { query, sql } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');
  const feed = url.searchParams.get('feed');
  const id = url.searchParams.get('id');
  if (id && !isUUID(id)) return err('Invalid post id');

  let sqlStr = `
    SELECT p.id, p.content, p.created_at,
      u.id as user_id, u.username, u.display_name, u.role, u.points, u.verified, u.theme, u.avatar_style, u.avatar_seed,
     (SELECT json_build_object('id', ne.id, 'name', ne.name, 'theme', ne.theme, 'effect', ne.effect) FROM name_effects ne WHERE ne.id = u.name_effect_id AND ne.active = true) as name_effect,
     (SELECT COALESCE(json_agg(json_build_object('id', b.id, 'name', b.name, 'theme', b.theme, 'effect', b.effect) ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL), '[]'::json) FROM user_badges ub JOIN badges b ON b.id = ub.badge_id AND b.active = true WHERE ub.user_id = u.id) as badges,
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
  const { content } = await req.json();
  if (!content || content.trim().length === 0) return err('Content required');
  if (content.length > 280) return err('Max 280 characters');

  const rows = await sql`
    INSERT INTO posts (user_id, content) VALUES (${user.id}, ${content})
    RETURNING id, content, created_at
  `;

  // +5 points for posting
  await sql`UPDATE profiles SET points = points + 5 WHERE id = ${user.id}`;

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

  const post = await sql`SELECT user_id FROM posts WHERE id = ${post_id}`;
  if (post.length === 0) return err('Post not found', 404);
  if (post[0].user_id !== user.id) return err('Not your post', 403);

  await sql`DELETE FROM posts WHERE id = ${post_id}`;
  await sql`UPDATE profiles SET points = GREATEST(0, points - 5) WHERE id = ${user.id}`;

  return ok({ deleted: true });
});

export const dynamic = 'force-dynamic';
