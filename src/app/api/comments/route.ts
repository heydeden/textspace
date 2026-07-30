import { sql } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const post_id = url.searchParams.get('post_id');
  if (!post_id) return err('post_id required');

  const rows = await sql`
    SELECT c.id, c.content, c.created_at, c.parent_id,
      u.id as user_id, u.username, u.display_name
    FROM comments c
    JOIN profiles u ON c.user_id = u.id
    WHERE c.post_id = ${post_id}
    ORDER BY c.created_at ASC
  `;
  return ok(rows);
};

export const POST = withUser(async (req, user) => {
  const { post_id, content, parent_id } = await req.json();
  if (!post_id || !content) return err('post_id and content required');
  if (content.length > 200) return err('Max 200 characters');

  const rows = await sql`
    INSERT INTO comments (post_id, user_id, content, parent_id)
    VALUES (${post_id}, ${user.id}, ${content}, ${parent_id || null})
    RETURNING id, content, created_at, parent_id
  `;
  return ok(rows[0], 201);
});
