# TextSpace — 1-Click Deploy Guide

## Step 1: Add Neon Database (30 detik)
1. Buka https://vercel.com/heydedens-projects/textspace/storage
2. Klik **"Connect Database → Create → Neon"**
3. Pilih **Hobby plan (free)**
4. Klik **Create**
5. Tunggu provisioning selesai (otomatis inject DATABASE_URL)

## Step 2: Redeploy
Vercel otomatis redeploy setelah env berubah.
Pastikan status deployment hijau (Ready) di dashboard.

## Step 3: Env lokal
1. `vercel env pull` (dari project `textspace`) → otomatis isi `.env.local`.
2. Referensi nilai & variabel opsional: `.env.example`.
3. Yang app butuh: `DATABASE_URL`, `JWT_SECRET` (+ `ALLOW_INITDB`/`ENABLE_ADMIN_RECOVERY` untuk fitur opsional).

## Step 4: CI (GitHub Actions)
Set di **Settings → Secrets and variables → Actions**:
- `DATABASE_URL` — wajib. Job `integration` (test:api + e2e) & `db-sweep` jalan main-only pakai ini.
- `TEST_ADMIN_PASSWORD` — wajib. Password akun admin test `ci_admin` yang di-seed/cleanup tiap run. **Belum di-set = job `integration` GAGAL saat push ke main.**
- `TEST_ADMIN_USERNAME` — opsional, default `ci_admin`.

Alur: commit → push **branch** (CI `gate` ringan) → merge/push ke **main** → `gate` + `integration` + `db-sweep` jalan penuh.

## Step 5: Akses
https://textspace-beryl.vercel.app

## Troubleshooting
- **Build error:** Cek logs di Vercel dashboard → Deployments → klik deployment → View logs
- **DB error:** Pastikan Neon terhubung di Storage tab
- **Reset DB:** Klik "Reset" di dashboard Neon, app akan bikin ulang tabel
