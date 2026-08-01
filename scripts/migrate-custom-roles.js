#!/usr/bin/env node
// Migrasi sekali jalan: custom_roles (legacy) -> badges + user_badges.
// Jalankan: DATABASE_URL=... node scripts/migrate-custom-roles.js
// Idempotent: role yang sudah jadi badge tidak dibuat ulang (UNIQUE name),
// assignment user_badges pakai ON CONFLICT DO NOTHING.
const { neon } = require('@neondatabase/serverless');

const PALETTE = ['violet', 'pink', 'emerald', 'orange', 'cyan', 'rose', 'lime', 'sky', 'fuchsia', 'teal'];

function legacyTheme(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const db = neon(url);

  const rows = await db`SELECT username, custom_roles FROM profiles WHERE custom_roles IS NOT NULL AND array_length(custom_roles, 1) > 0`;

  const roleToBadge = new Map();
  let badgeCount = 0;
  let assignCount = 0;

  for (const row of rows) {
    const roles = row.custom_roles || [];
    for (const role of roles) {
      if (!roleToBadge.has(role)) {
        const inserted = await db`
          INSERT INTO badges (name, theme, effect) VALUES (${role}, ${legacyTheme(role)}, 'none')
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        roleToBadge.set(role, inserted[0].id);
        badgeCount++;
      }
      const badgeId = roleToBadge.get(role);
      const user = await db`SELECT id FROM profiles WHERE username = ${row.username}`;
      if (user.length > 0) {
        await db`
          INSERT INTO user_badges (user_id, badge_id) VALUES (${user[0].id}, ${badgeId})
          ON CONFLICT DO NOTHING
        `;
        assignCount++;
      }
    }
  }

  const activeBadges = await db`SELECT COUNT(*)::int as c FROM badges`;
  console.log(`Migrasi selesai: ${badgeCount} badge dibuat (total ${activeBadges[0].c}), ${assignCount} assignment.`);
})().catch(e => { console.error(e); process.exit(1); });
