import { query } from '@/lib/db';
import { ok } from '@/lib/api';
import { withUser } from '@/lib/api';

export const GET = withUser(async () => {
  const rows = await query(
    `SELECT id, name, theme, effect FROM name_effects WHERE active = true ORDER BY name`
  );
  return ok({ nameEffects: rows });
});

export const dynamic = 'force-dynamic';
