# TextSpace — Agent Rules (Claude Code)

## Environment

- **DEV (lokal)**: folder ini — `npx next dev -p 3001 -H 127.0.0.1` (pakai `-H 127.0.0.1`, tanpa itu crash di sandbox)
- **PROD**: live di Vercel (custom domain). Jangan edit langsung; semua perubahan lewat repo ini.
- **DB Neon SHARED** antar env: e2e/test-api yang menulis state admin (verified/badges/name_effect_id/theme) WAJIB restore state asli; akun test WAJIB dihapus.
- **Env lokal**: `DATABASE_URL` + `JWT_SECRET` dari Vercel project `textspace` (`vercel env pull` atau `.env.local`).

## GATE WAJIB — lokal ringan, penuh di CI (main push)

**GATE LOKAL (sebelum commit)**: `npx tsc --noEmit` + `npm test` (~8s). Semua check cepat tanpa server/Neon.
**GATE PENUH (test:api + e2e, butuh DB real)**: jalan otomatis di CI saat **push ke `main`** (`.github/workflows/ci.yml` job `integration`) — akun admin test di-seed lalu dihapus, tidak menyentuh `setrahden`. `db-sweep` di main juga bersihkan akun test.

### Prasyarat CI (sekali-set, wajib ada di GitHub repo → Settings → Secrets)
- `DATABASE_URL` — wajib untuk job `integration` + `db-sweep` (main-only).
- `TEST_ADMIN_PASSWORD` — password akun admin test `ci_admin` yang di-seed CI `integration`. **Belum di-set = job integration GAGAL saat push ke main.**

### Apa yang jalan di CI tiap push
| Push ke | CI yang jalan |
|----------|---------------|
| PR / branch | `gate` saja (tsc, unit, secrets/console scan, npm audit, gitleaks) — TANPA DB secret |
| `main` | `gate` + `integration` (test:api + e2e) + `db-sweep` — pakai `DATABASE_URL` + `TEST_ADMIN_PASSWORD` |

Perubahan fitur → commit → push ke **branch** dulu (gate ringsan). Saat fitur siap → merge/push ke `main` → `integration` + `db-sweep` jalan penuh otomatis.

## WORKFLOW CEPAT (hemat waktu nunggu — ikuti ini, bukan gate penuh tiap edit)

| Perubahan | Perintah (cepat) |
|-----------|------------------|
| Type script | `npx tsc --noEmit` (~20s) |
| Hanya unit / lib | `npm test` (~3s) |
| API route / fitur baru | `npx tsc --noEmit` + `npm test` (handler-level mock, ~8s) |
| Security API | `npm run test:sec` (route-security.test.ts, tanpa server/Neon) |
| UI/component | `npx tsc --noEmit` + `npm test` + smoke manual |
| Semua (local) | `bash scripts/gate.sh` (tsc+unit+test:sec+scan — tanpa test:api/e2e) |

**Aturan:**
1. Edit kecil → `tsc` + `npm test` saja. Jangan sentuh test:api/e2e (dijalankan CI di main push).
2. **Security route baru wajib masuk `src/lib/route-security.test.ts`** (baseline table-driven + logic khusus) — nambah endpoint/route tanpa tesnya = gagal konsep.
3. **Gate penuh tidak perlu dijalankan manual di lokal** — CI `integration` jalan otomatis saat push ke main. Kalau ingin verifikasi manual: `bash scripts/test-api.sh` + `npm run test:e2e` (butuh server + DB).
4. Test flaky sudah diperbaiki (rate-limit pakai XFF stabil, admin-self e2e timeout, sandbox pakai chromium alpine auto-detect di `playwright.config.ts`). Jangan "perbaiki" lagi tanpa root cause.
5. Satu sesi besar: baca → TDD → implement → `tsc`+`npm test` → commit → push (CI integration + db-sweep jalan di main). Jangan jeda (konteks dingin = re-explore).
6. Jangan install ulang Chromium / ulang setup sandbox — sudah bekerja (musl → `/usr/bin/chromium`).

Commit TANPA bukti ditolak hook `commit-msg` (di `scripts/hooks/`, aktif via `bash scripts/install-hooks.sh`). Baris wajib di pesan commit:

```
Gate: tsc OK, unit X/X, test:sec X/X, review: code-reviewer PASS, security-reviewer PASS, skills: <skill yang dipakai> (test:api + e2e = CI main push)
```

## WORKFLOW FITUR BARU (ikuti otomatis — JANGAN menunggu disuruh langkah per langkah)

1. **Baca dulu (wajib)**: `README.md` (fitur), `SETUP.md` (deploy), arsitektur di `src/` — status terkini, env, cara preview
2. **Tanya spesifikasi MINIMAL** (2-3 pertanyaan singkat): apa yang dijual/dibeli, mata uangnya apa, halaman di mana
3. **Tulis rencana 5 baris** + daftar tes baru yang akan ditambah (suite AKUMULATIF — sebutkan target angka baru)
4. **Implementasi**: pakai skill superpowers (test-driven-development, dll) + review agent setelah selesai
5. **Verify**: `npx tsc --noEmit` + `npm test` (wajib PASS, ~8s). Test:api/e2e TIDAK perlu manual — CI `integration` jalan saat push ke main.
6. **Rilis**: commit (baris Gate + `skills:`) → push **branch** (gate ringsan + auto-deploy preview) → merge/push ke `main` → CI `integration` + `db-sweep` jalan penuh (test:api + e2e + cleanup akun test) → prod smoke.
7. Laporkan ringkas: apa yang dibuat, hasil gate lokal, status CI (cek GitHub Actions — job `integration` di main)

## Rules (jangan pernah dilanggar)

1. **Fitur baru = tes baru, suite AKUMULATIF** — jangan hapus tes lama; angka check wajib naik/setara (turun tanpa hapus fitur = pelanggaran). Route/endpoint baru WAJIB ditambahkan ke `src/lib/route-security.test.ts` (baseline + logic).
2. **Review wajib sebelum commit**: pakai `/code-review` (diff) + `/security-review`, laporkan hasilnya di baris Gate
3. **Urutan rilis**: gate PASS → commit (+baris Gate) → branch → push (auto-deploy) → preview smoke → merge → prod smoke → SQL cleanup akun test
4. **tidak ada `console.log` di src/**, tidak ada secret di tracked files
5. Darurat: `GATE_SKIP=1` + `[skip-gate]` + baris `Skip-reason:` di pesan (tidak disarankan, alasan wajib tertulis)
