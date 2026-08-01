import { query } from '@/lib/db';
import { ok } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async () => {
  const rows = await query(
    `SELECT id, name, theme, effect FROM badges WHERE active = true ORDER BY name`
  );
  return ok({ badges: rows });
});

export const dynamic = 'force-dynamic';
