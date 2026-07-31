import { query, sql } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withAdmin } from '@/lib/api';

export const GET = withAdmin(async () => {
  const rows = await query(`
    SELECT r.id, r.reason, r.resolved, r.created_at,
      rp.username as reporter_username,
      p.id as post_id, p.content as post_content,
      pu.username as post_author_username
    FROM reports r
    JOIN profiles rp ON r.reporter_id = rp.id
    LEFT JOIN posts p ON r.post_id = p.id
    LEFT JOIN profiles pu ON p.user_id = pu.id
    ORDER BY r.resolved ASC, r.created_at DESC LIMIT 50
  `);
  return ok({ reports: rows });
});

export const DELETE = withAdmin(async (req) => {
  const { report_id } = await req.json();
  if (!report_id) return err('report_id required');
  if (!isUUID(report_id)) return err('Invalid report_id');
  await sql`DELETE FROM reports WHERE id = ${report_id}`;
  return ok({ deleted: true });
});

export const PATCH = withAdmin(async (req) => {
  const { report_id } = await req.json();
  if (!report_id) return err('report_id required');
  if (!isUUID(report_id)) return err('Invalid report_id');
  await sql`UPDATE reports SET resolved = true WHERE id = ${report_id}`;
  return ok({ resolved: true });
});
