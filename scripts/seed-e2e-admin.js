#!/usr/bin/env node
// Seed/cleanup akun admin test UNIK untuk CI — supaya test-api.sh + e2e tidak
// menyentuh akun admin asli (setrahden) di DB Neon shared.
//
// Penggunaan:
//   CI (seed):  TEST_ADMIN_USERNAME=xxx TEST_ADMIN_PASSWORD=yyy node scripts/seed-e2e-admin.js seed
//   CI (clean): TEST_ADMIN_USERNAME=xxx node scripts/seed-e2e-admin.js cleanup
//
// seed:   bikin akun (role=admin, verified=true) kalau belum ada. Print username+password ke stdout.
// cleanup: hapus akun. Exit 0 baik dihapus maupun tidak ada (idempotent).
//
// DB: env DATABASE_URL, fallback .env.local (strip quote). Tanpa DB: lokal = SKIP (exit 0), CI = FAIL.
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

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
    console.error('[seed-e2e-admin] FAIL — CI tanpa DATABASE_URL: set secrets.DATABASE_URL (job main-only)');
    process.exit(1);
  }
  console.log('[seed-e2e-admin] SKIP — DATABASE_URL tidak ada');
  process.exit(0);
}

const sql = neon(url);
const mode = process.argv[2];
const username = process.env.TEST_ADMIN_USERNAME;
const password = process.env.TEST_ADMIN_PASSWORD;

async function seed() {
  if (!username || !password) {
    console.error('[seed-e2e-admin] seed butuh TEST_ADMIN_USERNAME + TEST_ADMIN_PASSWORD');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const existing = await sql`SELECT id FROM profiles WHERE username = ${username}`;
  if (existing.length > 0) {
    // Update jadi admin + verified (idempotent — jalankan ulang tetap konsisten).
    await sql`UPDATE profiles SET role = 'admin', verified = true WHERE username = ${username}`;
  } else {
    await sql`
      INSERT INTO profiles (username, display_name, password_hash, role, verified)
      VALUES (${username}, ${username}, ${hash}, 'admin', true)
    `;
  }
  console.log(`[seed-e2e-admin] seeded admin test: ${username}`);
}

async function cleanup() {
  if (!username) {
    console.error('[seed-e2e-admin] cleanup butuh TEST_ADMIN_USERNAME');
    process.exit(1);
  }
  await sql`DELETE FROM profiles WHERE username = ${username}`;
  console.log(`[seed-e2e-admin] cleaned admin test: ${username}`);
}

(async () => {
  try {
    if (mode === 'seed') await seed();
    else if (mode === 'cleanup') await cleanup();
    else { console.error('[seed-e2e-admin] mode: seed | cleanup'); process.exit(1); }
    process.exit(0);
  } catch (e) {
    console.error('[seed-e2e-admin] ERROR:', e.message);
    process.exit(1);
  }
})();
