#!/usr/bin/env node
// Bikin/upgrade akun jadi admin PERMANEN — untuk setup admin kedua (prod shared,
// ENABLE_ADMIN_RECOVERY gak bisa karena sudah ada admin setrahden).
// Hapus setelah dipakai! Jangan commit username/password.
//
// Pakai (beri nilai di env shell, bukan hardcode):
//   ADMIN_USERNAME=x ADMIN_PASSWORD=y node scripts/create-admin.js
//
// DB: env DATABASE_URL, fallback .env.local (strip quote). Tanpa DB: local = SKIP, CI = FAIL.
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
  console.error('[create-admin] DATABASE_URL tidak ada (set env atau .env.local)');
  process.exit(1);
}

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!username || !password) {
  console.error('[create-admin] butuh ADMIN_USERNAME + ADMIN_PASSWORD');
  process.exit(1);
}

const sql = neon(url);

(async () => {
  try {
    const existing = await sql`SELECT id, role FROM profiles WHERE username = ${username}`;
    if (existing.length === 0) {
      const hash = await bcrypt.hash(password, 10);
      await sql`
        INSERT INTO profiles (username, display_name, password_hash, role, verified)
        VALUES (${username}, ${username}, ${hash}, 'admin', true)
      `;
      console.log(`[create-admin] akun admin dibuat: ${username}`);
    } else {
      await sql`UPDATE profiles SET role = 'admin', verified = true WHERE username = ${username}`;
      console.log(`[create-admin] akun di-upgrade jadi admin: ${username} (role lama: ${existing[0].role})`);
    }
  } catch (e) {
    console.error('[create-admin] ERROR:', e.message);
    process.exit(1);
  }
})();
