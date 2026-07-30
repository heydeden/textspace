import { initDB } from '@/lib/db';
import { ok, err } from '@/lib/api';

export async function POST() {
  try {
    await initDB();
    return ok({ message: 'Database initialized' });
  } catch (e: any) {
    return err('Failed: ' + e.message, 500);
  }
}
