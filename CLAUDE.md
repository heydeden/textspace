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
