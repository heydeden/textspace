// Sweep read-only: deteksi akun test sisa + state admin rusak. Exit 1 = ada masalah.
// Pakai: node scripts/sweep-test-accounts.js
// DB: env DATABASE_URL, fallback .env.local (strip quote). Tanpa DB: lokal = SKIP (exit 0), CI = FAIL (wajib di-set).
const fs = require('fs');
const path = require('path');

function getDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    const m = env.match(/^DATABASE_URL=(.*)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  } catch {
    return null;
  }
}

const url = getDbUrl();
if (!url) {
  if (process.env.CI) {
    console.log('[sweep] FAIL — CI tanpa DATABASE_URL: set secrets.DATABASE_URL (job main-only)');
    process.exit(1);
  }
  console.log('[sweep] SKIP — DATABASE_URL tidak ada');
  process.exit(0);
}

const { neon } = require('@neondatabase/serverless');
const sql = neon(url);

// Pola akun test aktual (dari test-api.sh: byptest*, e2e specs: bdg_/thx/e2ebyp, historis: cr_/xy_/nefx/uivtest/smokeuiv)
const PATTERNS = ['e2e%', 'bdg%', 'thx%', 'byptest%', 'nefx%', 'uivtest%', 'smokeuiv%', 'cr_%', 'xy_%'];

(async () => {
  let rows;
  try {
    rows = await sql`
      SELECT username, verified FROM profiles
      WHERE username ILIKE ANY(${PATTERNS})
      ORDER BY created_at DESC LIMIT 20
    `;
  } catch (e) {
    console.log('[sweep] WARN — DB tidak terjangkau, skip (bukan kegagalan data):', e.message);
    process.exit(0);
  }

  const admin = await sql`SELECT username, verified FROM profiles WHERE username = 'setrahden'`;

  let fail = false;
  if (rows.length > 0) {
    console.log('[sweep] FAIL — akun test sisa:', rows.map(r => r.username).join(', '));
    fail = true;
  } else {
    console.log('[sweep] OK — 0 akun test sisa');
  }

  if (admin.length === 1 && admin[0].verified !== true) {
    console.log('[sweep] FAIL — state admin rusak: setrahden verified != true (e2e/test-api wajib restore)');
    fail = true;
  } else if (admin.length === 0) {
    console.log('[sweep] WARN — admin setrahden tidak ditemukan');
  } else {
    console.log('[sweep] OK — state admin: setrahden verified=true');
  }

  process.exit(fail ? 1 : 0);
})().catch(e => {
  console.log('[sweep] ERROR:', e.message);
  process.exit(1);
});
