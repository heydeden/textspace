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

## Step 3: Akses
https://textspace-beryl.vercel.app

## Troubleshooting
- **Build error:** Cek logs di Vercel dashboard → Deployments → klik deployment → View logs
- **DB error:** Pastikan Neon terhubung di Storage tab
- **Reset DB:** Klik "Reset" di dashboard Neon, app akan bikin ulang tabel
