# TextSpace — Agent Rules (WAJIB, versi inti — detail: .opencode/instructions/INSTRUCTIONS.md)

## Environment
- **DEV**: folder ini (textspace-dev) port :3001 — `npx next dev -p 3001 -H 127.0.0.1` (tanpa `-H` crash di sandbox)
- **PROD**: `/home/userland/webdev/textspace` port :3000 — JANGAN pernah edit langsung (tidak punya git; semua perubahan lewat repo ini)
- **DB Neon SHARED** antar env: e2e/test-api yang menulis state admin (verified/badges/name_effect_id/theme) WAJIB restore state asli; akun test WAJIB dihapus

## GATE WAJIB sebelum commit — `bash scripts/gate.sh --save` (exit non-zero = commit DILARANG)
tsc → unit → test:api → e2e → secrets scan → console.log scan → sweep akun test (read-only)
`--save` wajib: bukti tersimpan di `docs/gate-evidence/` — pre-commit MENOLAK kalau bukti fresh (< 30 menit) tidak ada.

Commit TANPA bukti ditolak hook `commit-msg` (versioned di `scripts/hooks/`, aktif via `git config core.hooksPath scripts/hooks` — setup: `bash scripts/install-hooks.sh`). Baris wajib di pesan commit:
```
Gate: tsc OK, unit X/X, test:api X/X, e2e X/X, review: code-reviewer PASS, security-reviewer PASS
```

## Rules (jangan pernah dilanggar)
1. **Fitur baru = tes baru, suite AKUMULATIF** — jangan hapus tes lama; angka check wajib naik/setara (turun tanpa hapus fitur = pelanggaran)
2. **Review wajib sebelum commit**: panggil agent code-reviewer + security-reviewer, laporkan hasilnya di baris Gate
3. **Urutan rilis**: gate PASS → commit (+baris Gate) → branch → push (auto-deploy, repo public) → preview smoke (header `x-vercel-protection-bypass`) → merge → prod smoke → SQL cleanup akun → update `/home/userland/webdev/SESSION_HANDOFF.md`
4. **tidak ada `console.log` di src/**, tidak ada secret di tracked files
5. Darurat: `GATE_SKIP=1` + `[skip-gate]` + baris `Skip-reason:` di pesan (tidak disarankan, alasan wajib tertulis)
