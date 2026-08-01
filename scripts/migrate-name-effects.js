#!/usr/bin/env node
// Migrasi sekali jalan: profiles.name_effect (string key legacy) -> name_effects + profiles.name_effect_id.
// Jalankan: DATABASE_URL=... node scripts/migrate-name-effects.js
// Idempotent: ON CONFLICT (name) + hanya proses user yang name_effect_id masih NULL.
const { neon } = require('@neondatabase/serverless');

// key legacy -> { defaultTheme, defaultName }
const LEGACY = {
  lightning: { name: 'Lightning', theme: 'sky' },
  neon: { name: 'Neon', theme: 'fuchsia' },
  fire: { name: 'Fire', theme: 'fire' },
  aurora: { name: 'Aurora', theme: 'ocean' },
  gold: { name: 'Gold', theme: 'gold' },
  rainbow: { name: 'Rainbow', theme: 'purple' },
  glow: { name: 'Glow', theme: 'sky' },
};

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const db = neon(url);

  const rows = await db`SELECT id, username, name_effect FROM profiles WHERE name_effect IS NOT NULL AND name_effect <> 'none' AND name_effect_id IS NULL`;
  let effectCount = 0;
  let assignCount = 0;

  for (const row of rows) {
    const legacy = LEGACY[row.name_effect];
    if (!legacy) {
      console.log(`  skip ${row.username}: efek legacy tak dikenal '${row.name_effect}'`);
      continue;
    }
    const inserted = await db`
      INSERT INTO name_effects (name, theme, effect) VALUES (${legacy.name}, ${legacy.theme}, ${row.name_effect})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    effectCount++;
    await db`UPDATE profiles SET name_effect_id = ${inserted[0].id} WHERE id = ${row.id}`;
    assignCount++;
  }

  const total = await db`SELECT COUNT(*)::int as c FROM name_effects`;
  console.log(`Migrasi selesai: ${effectCount} efek diproses (total ${total[0].c}), ${assignCount} user di-assign.`);
})().catch(e => { console.error(e); process.exit(1); });
