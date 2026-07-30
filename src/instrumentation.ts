export async function register() {
  if (process.env.DATABASE_URL) {
    try {
      const { initDB } = await import('@/lib/db');
      await initDB();
    } catch {}
  }
}
