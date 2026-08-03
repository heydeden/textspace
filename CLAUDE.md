# TextSpace — Agent Rules (Claude Code)

## Environment

- **DEV (lokal)**: folder ini — `npx next dev -p 3001 -H 127.0.0.1` (pakai `-H 127.0.0.1`, tanpa itu crash di sandbox)
- **PROD**: live di Vercel (custom domain). Jangan edit langsung; semua perubahan lewat repo ini.
- **DB Neon SHARED** antar env: e2e/test-api yang menulis state admin (verified/badges/name_effect_id/theme) WAJIB restore state asli; akun test WAJIB dihapus.
- **Env lokal**: `DATABASE_URL` + `JWT_SECRET` dari Vercel project `textspace` (`vercel env pull` atau `.env.local`).

## GATE WAJIB sebelum commit — `bash scripts/gate.sh --save` (exit non-zero = commit DILARANG)

- Urutan: tsc → unit → test:api → e2e → secrets scan → console.log scan → sweep akun test → npm audit → gitleaks.
- `--save` wajib: bukti tersimpan di `docs/gate-evidence/` — pre-commit MENOLAK kalau bukti tidak fresh (< 30 menit).
- npm audit/gitleaks di lokal: network/binary tidak ada = WARN skip — **CI wajib hijau** (`.github/workflows/ci.yml`).

## WORKFLOW CEPAT (hemat waktu nunggu — ikuti ini, bukan full gate tiap edit)

Full `gate.sh` = ~5-7 menit. JANGAN jalankan penuh setiap edit. Gunakan step parsial sesuai perubahan:

| Perubahan | Perintah (cepat) |
|-----------|------------------|
| Type script | `npx tsc --noEmit` (~20s) |
| Hanya unit / lib | `npm test` (~3s) |
| API route | `bash scripts/test-api.sh` (~3m, butuh dev server :3001) |
| UI/component | `npx tsc --noEmit` + `npm test` + smoke manual |
| Semua | `bash scripts/gate.sh --save` |

**Aturan:**
1. Edit kecil → `tsc` + `npm test` saja. Jangan sentuh test:api/e2e.
2. **Full gate `--save` HANYA 1× di akhir** (semua fitur selesai), bukan per langkah.
3. Bukti `docs/gate-evidence/` fresh = 30 menit. Setelah gate PASS, commit cepat — jangan re-run gate kalau tak ada perubahan (waktu terbuang).
4. Test flaky sudah diperbaiki (rate-limit pakai XFF stabil, admin-self e2e timeout, sandbox pakai chromium alpine auto-detect di `playwright.config.ts`). Jangan "perbaiki" lagi tanpa root cause.
5. Satu sesi besar: baca → TDD → implement → full gate → commit → rilis. Jangan jeda (konteks dingin = re-explore).
6. Jangan install ulang Chromium / ulang setup sandbox — sudah bekerja (musl → `/usr/bin/chromium`).

Commit TANPA bukti ditolak hook `commit-msg` (di `scripts/hooks/`, aktif via `bash scripts/install-hooks.sh`). Baris wajib di pesan commit:

```
Gate: tsc OK, unit X/X, test:api X/X, e2e X/X, review: code-reviewer PASS, security-reviewer PASS, skills: <skill yang dipakai>
```

## WORKFLOW FITUR BARU (ikuti otomatis — JANGAN menunggu disuruh langkah per langkah)

1. **Baca dulu (wajib)**: `README.md` (fitur), `SETUP.md` (deploy), arsitektur di `src/` — status terkini, env, cara preview
2. **Tanya spesifikasi MINIMAL** (2-3 pertanyaan singkat): apa yang dijual/dibeli, mata uangnya apa, halaman di mana
3. **Tulis rencana 5 baris** + daftar tes baru yang akan ditambah (suite AKUMULATIF — sebutkan target angka baru)
4. **Implementasi**: pakai skill superpowers (test-driven-development, dll) + review agent setelah selesai
5. **`bash scripts/gate.sh --save`** — wajib PASS
6. **Rilis**: commit (baris Gate + `skills:`) → branch → push (auto-deploy) → preview smoke → merge main → prod smoke → SQL cleanup akun test
7. Laporkan ringkas: apa yang dibuat, hasil gate, status live

## Rules (jangan pernah dilanggar)

1. **Fitur baru = tes baru, suite AKUMULATIF** — jangan hapus tes lama; angka check wajib naik/setara (turun tanpa hapus fitur = pelanggaran)
2. **Review wajib sebelum commit**: pakai `/code-review` (diff) + `/security-review`, laporkan hasilnya di baris Gate
3. **Urutan rilis**: gate PASS → commit (+baris Gate) → branch → push (auto-deploy) → preview smoke → merge → prod smoke → SQL cleanup akun test
4. **tidak ada `console.log` di src/**, tidak ada secret di tracked files
5. Darurat: `GATE_SKIP=1` + `[skip-gate]` + baris `Skip-reason:` di pesan (tidak disarankan, alasan wajib tertulis)
