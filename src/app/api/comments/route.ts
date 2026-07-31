import { sql } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async (req, user) => {
  const url = new URL(req.url);
  const post_id = url.searchParams.get('post_id');
  if (!post_id) return err('post_id required');
  if (!isUUID(post_id)) return err('Invalid post_id');

  const rows = await sql`
    SELECT c.id, c.content, c.created_at, c.parent_id,
      u.id as user_id, u.username, u.display_name, u.role, u.points, u.verified, u.avatar_style
    FROM comments c
    JOIN profiles u ON c.user_id = u.id
    WHERE c.post_id = ${post_id} AND u.banned = false
      AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = ${user.id} AND blocked_id = c.user_id) OR (blocker_id = c.user_id AND blocked_id = ${user.id}))
    ORDER BY c.created_at ASC
  `;
  return ok(rows);
});

export const POST = withUser(async (req, user) => {
  const { post_id, content, parent_id } = await req.json();
  if (!post_id || !content) return err('post_id and content required');
  if (!isUUID(post_id)) return err('Invalid post_id');
  if (parent_id && !isUUID(parent_id)) return err('Invalid parent_id');
  if (content.length > 200) return err('Max 200 characters');

  const post = await sql`SELECT user_id FROM posts WHERE id = ${post_id}`;
  if (post.length === 0) return err('Post not found', 404);
  if (post[0].user_id !== user.id) {
    const blocked = await sql`SELECT 1 FROM blocks WHERE (blocker_id = ${user.id} AND blocked_id = ${post[0].user_id}) OR (blocker_id = ${post[0].user_id} AND blocked_id = ${user.id})`;
    if (blocked.length > 0) return err('Cannot comment', 403);
  }

  if (parent_id) {
    const p = await sql`SELECT post_id, parent_id FROM comments WHERE id = ${parent_id}`;
    if (p.length === 0) return err('Parent comment not found', 404);
    if (p[0].post_id !== post_id) return err('Parent not in this post', 400);
    if (p[0].parent_id) return err('Only one level of replies', 400);
  }

  const rows = await sql`
    INSERT INTO comments (post_id, user_id, content, parent_id)
    VALUES (${post_id}, ${user.id}, ${content}, ${parent_id || null})
    RETURNING id, content, created_at, parent_id
  `;

  if (post[0].user_id !== user.id) {
    await sql`UPDATE profiles SET points = points + 3 WHERE id = ${post[0].user_id}`;
    await sql`INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES (${post[0].user_id}, ${user.id}, 'comment', ${post_id})`;
  }

  return ok(rows[0], 201);
});

export const PATCH = withUser(async (req, user) => {
  const { comment_id, content } = await req.json();
  if (!comment_id) return err('comment_id required');
  if (!isUUID(comment_id)) return err('Invalid comment_id');
  if (!content || content.trim().length === 0) return err('Content required');
  if (content.length > 200) return err('Max 200 characters');

  const comment = await sql`SELECT user_id FROM comments WHERE id = ${comment_id}`;
  if (comment.length === 0) return err('Comment not found', 404);
  if (comment[0].user_id !== user.id) return err('Not your comment', 403);

  const rows = await sql`
    UPDATE comments SET content = ${content} WHERE id = ${comment_id}
    RETURNING id, content, created_at, parent_id
  `;
  return ok(rows[0]);
});

export const DELETE = withUser(async (req, user) => {
  const { comment_id } = await req.json();
  if (!comment_id) return err('comment_id required');
  if (!isUUID(comment_id)) return err('Invalid comment_id');

  const comment = await sql`SELECT user_id FROM comments WHERE id = ${comment_id}`;
  if (comment.length === 0) return err('Comment not found', 404);
  if (comment[0].user_id !== user.id) return err('Not your comment', 403);

  const post = await sql`SELECT user_id FROM posts WHERE id = (SELECT post_id FROM comments WHERE id = ${comment_id})`;
  if (post.length > 0 && post[0].user_id !== user.id) {
    await sql`UPDATE profiles SET points = GREATEST(0, points - 3) WHERE id = ${post[0].user_id}`;
  }

  await sql`DELETE FROM comments WHERE id = ${comment_id} OR parent_id = ${comment_id} OR parent_id IN (SELECT id FROM comments WHERE parent_id = ${comment_id})`;
  return ok({ deleted: true });
});

export const dynamic = 'force-dynamic';
