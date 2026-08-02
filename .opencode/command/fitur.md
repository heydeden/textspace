---
description: Tambah fitur baru TextSpace — alur lengkap self-driving (baca handoff → spesifikasi → TDD → gate → rilis → handoff)
---

# Fitur Baru TextSpace

Jalankan WORKFLOW FITUR BARU dari `AGENTS.md` secara penuh, TANPA menunggu instruksi langkah per langkah.

Deskripsi fitur dari user: $ARGUMENTS

## Alur wajib

1. **Baca konteks dulu** (wajib, sebelum coding):
   - `/home/userland/webdev/SESSION_HANDOFF.md` — status terkini, akun (admin `setrahden`/`200114`), cara preview
   - `/home/userland/webdev/TEXTSPACE_GUIDE.md` — arsitektur, API, DB schema
   - `/home/userland/webdev/.opencode/instructions/INSTRUCTIONS.md` — rules lengkap + DoD

2. **Spesifikasi**: kalau deskripsi belum lengkap, tanya MAX 3 pertanyaan singkat (barang/mata uang/halaman). Setelah jelas: tulis rencana 5 baris + daftar tes baru (target angka suite).

3. **Implementasi**: load skill relevan via skill tool (tdd-workflow, security-review, frontend-patterns, dst) → TDD → implementasi → setelah selesai panggil agent code-reviewer + security-reviewer.

4. **Gate**: `bash scripts/gate.sh --save` — wajib exit 0.

5. **Rilis** (setelah semua hijau):
   - commit dengan baris: `Gate: tsc OK, unit X/X, test:api X/X, e2e X/X, review: code-reviewer PASS, security-reviewer PASS, skills: <skill>`
   - branch → push → tunggu preview Vercel READY → smoke preview (header `x-vercel-protection-bypass`, secret di `textspace-dev/.env.local`)
   - merge main → prod smoke (custom domain) → SQL cleanup akun test → update SESSION_HANDOFF.md

6. **Laporan akhir singkat**: fitur dibuat, angka gate, status live, apa yang belum bisa diverifikasi.

## Stop condition

- Gate merah → FIX dulu, jangan lanjut rilis.
- Jangan pernah merge ke main tanpa preview smoke hijau.
- Jangan pernah simpan secret (token/password/DB URL) di file tracked.
