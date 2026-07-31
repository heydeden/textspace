import { initDB } from '@/lib/db';
import { ok, err } from '@/lib/api';

export async function POST() {
  if (process.env.ALLOW_INITDB !== 'true') return err('Not allowed', 403);
  try {
    await initDB();
    return ok({ message: 'Database initialized' });
  } catch {
    return err('Database initialization failed', 500);
  }
}
