import { query } from '@/lib/db';
import { ok } from '@/lib/api';
import { withAdmin } from '@/lib/api';

export const GET = withAdmin(async () => {
  const [users, posts, comments, todayUsers, todayPosts] = await Promise.all([
    query('SELECT COUNT(*)::int as count FROM profiles'),
    query('SELECT COUNT(*)::int as count FROM posts'),
    query('SELECT COUNT(*)::int as count FROM comments'),
    query("SELECT COUNT(*)::int as count FROM profiles WHERE created_at >= CURRENT_DATE"),
    query("SELECT COUNT(*)::int as count FROM posts WHERE created_at >= CURRENT_DATE"),
  ]);

  return ok({
    total_users: users[0].count,
    total_posts: posts[0].count,
    total_comments: comments[0].count,
    today_users: todayUsers[0].count,
    today_posts: todayPosts[0].count,
  });
});

export const dynamic = 'force-dynamic';
