const WINDOW_MS = 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const CLEANUP_EVERY = 500;
let checksSinceCleanup = 0;

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'local';
}

function sweep() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(req: Request, limit: number): boolean {
  const key = clientIp(req);
  const now = Date.now();

  checksSinceCleanup++;
  if (checksSinceCleanup >= CLEANUP_EVERY) {
    checksSinceCleanup = 0;
    sweep();
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  bucket.count++;
  return bucket.count <= limit;
}
