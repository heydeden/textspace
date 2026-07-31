import { query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withAdmin } from '@/lib/api';

export const GET = withAdmin(async (req) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const countResult = await query('SELECT COUNT(*)::int as count FROM posts');
  const total = countResult[0].count;

  const rows = await query(
    `SELECT p.id, p.content, p.created_at::text,
      u.id as user_id, u.username, u.display_name,
      (SELECT COUNT(*)::int FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comment_count
     FROM posts p JOIN profiles u ON p.user_id = u.id
     ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return ok({ posts: rows, total, page, limit, pages: Math.ceil(total / limit) });
});

export const DELETE = withAdmin(async (req) => {
  const { post_id } = await req.json();
  if (!post_id) return err('post_id required');
  if (!isUUID(post_id)) return err('Invalid post_id');
  await query('DELETE FROM posts WHERE id = $1', [post_id]);
  return ok({ deleted: true });
});

export const dynamic = 'force-dynamic';
