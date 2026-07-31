import { sql, initDB } from '@/lib/db';
import { ok, err } from '@/lib/api';

let initialized = false;

export async function GET() {
  try {
    if (!initialized) {
      await initDB();
      initialized = true;
    }
    const result = await sql`SELECT 1 as ok`;
    return ok({ status: 'ready', db: result.length > 0 });
  } catch (e: any) {
    return err('Database not configured. Go to Vercel Dashboard → Storage → Add Neon.', 503);
  }
}

export const dynamic = 'force-dynamic';
