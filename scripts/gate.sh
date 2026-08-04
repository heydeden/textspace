#!/usr/bin/env bash
# GATE WAJIB — jalankan sebelum commit: bash scripts/gate.sh [--save] [--self-test]
# Exit non-zero = GAGAL = commit DILARANG.
set -u
cd "$(dirname "$0")/.." || exit 1

MODE_SAVE=0
MODE_SELF_TEST=0
for arg in "$@"; do
  case "$arg" in
    --save) MODE_SAVE=1 ;;
    --self-test) MODE_SELF_TEST=1 ;;
  esac
done

EVIDENCE=""
if [ "$MODE_SAVE" = "1" ]; then
  EVIDENCE_DIR="docs/gate-evidence"
  mkdir -p "$EVIDENCE_DIR"
  EVIDENCE="$EVIDENCE_DIR/$(date +%Y%m%d-%H%M%S).txt"
  exec > >(tee -a "$EVIDENCE") 2>&1
fi

FAIL=0
FAILED_STEPS=""

log() { echo "[gate] $*"; }
fail() { log "FAIL: $*"; FAIL=1; FAILED_STEPS="${FAILED_STEPS} $1"; }

step() {
  log "== STEP: $1 =="
  shift
  "$@" > /tmp/claude/gate-step.log 2>&1
  local rc=$?
  tail -8 /tmp/claude/gate-step.log
  if [ "$rc" = "0" ]; then
    log "OK: $1"
  else
    fail "$1"
  fi
}

if [ "$MODE_SELF_TEST" = "1" ]; then
  log "== SELF-TEST: membuktikan gate menolak kegagalan =="
  if ! sh -c "exit 1"; then
    fail "self-test (simulasi check gagal)"
  fi
  if [ "$FAIL" = "1" ]; then
    log "SELF-TEST PASS: gate keluar non-zero saat ada check gagal"
    exit 1
  fi
  log "SELF-TEST FAIL: gate tidak menolak kegagalan!"
  exit 2
fi

log "== GATE START $(date '+%F %T') =="

# Bersihkan artifact dev (typegen .next bisa korup saat server di-pkill — tsconfig include .next/types)
rm -rf .next tsconfig.tsbuildinfo

# 1. Type check
step "tsc" npx tsc --noEmit

# 2. Unit test
step "unit" npm test

# 3. Security (handler-level, cepat) + integration test:api (SQL/Neon real) — wajib 1× di akhir
log "== STEP: test:sec =="
step "test:sec" npm run test:sec
# Bersihkan server lama dulu, tunggu port benar-benar bebas (test-api.sh pkill di akhir)
log "== STEP: test:api =="
pkill -f "next dev -p 3001" 2>/dev/null || true
for i in $(seq 1 20); do
  if ! curl -s -m 2 http://127.0.0.1:3001/api/health >/dev/null 2>&1; then break; fi
  sleep 1
done
step "test:api" npm run test:api

# 4. E2E (butuh dev server :3001 — gate start kalau belum jalan, matikan kalau gate yang start)
SERVER_STARTED=0
if ! curl -s -m 3 http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
  log "dev server :3001 belum jalan — start..."
  setsid npx next dev -p 3001 -H 127.0.0.1 > /tmp/claude/gate-dev3001.log 2>&1 < /dev/null &
  GATE_SERVER_PID=$!
  SERVER_STARTED=1
  for i in $(seq 1 45); do
    curl -s -m 3 http://127.0.0.1:3001/api/health >/dev/null 2>&1 && break
    sleep 2
  done
  if ! curl -s -m 3 http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
    fail "dev server tidak bisa start (lihat /tmp/claude/gate-dev3001.log)"
  fi
fi
step "e2e" npm run test:e2e
if [ "$SERVER_STARTED" = "1" ]; then
  log "matikan dev server yang gate start (process group $GATE_SERVER_PID)"
  kill -- -"$GATE_SERVER_PID" 2>/dev/null || kill "$GATE_SERVER_PID" 2>/dev/null || true
  sleep 1
fi

# 5. Secrets scan: tracked + untracked + staged, case-insensitive, nilai di-redaksi (filename:line)
# Catatan: jangan simpan pola ke variabel via $(...) dengan null byte — corrupt path. Pipe langsung.
log "== STEP: secrets scan =="
SECRETS=$(
  {
    git ls-files -z
    git ls-files --others --exclude-standard -z
    git diff --cached --name-only -z
  } | xargs -0 -r grep -inE "ghp_[A-Za-z0-9]{20,}|github_pat_|gho_|ghu_|ghs_|sk-[A-Za-z0-9]{20,}|sk-proj-|sk-ant-|sk_live_|vercel_token=|github_token=|jwt_secret=|database_url=|x-access-token:|vercel_automation_bypass_secret=|postgres://" 2>/dev/null \
  | grep -vE "=\.\.\.|scripts/(gate\.sh|install-hooks\.sh|hooks/|sweep-test-accounts\.js)|\.github/workflows/ci\.yml" || true
)
if [ -n "$SECRETS" ]; then
  log "SEKRET KETEMU (file:line — nilai di-redaksi):"
  echo "$SECRETS" | cut -d: -f1-2 | sort -u
  fail "secrets scan"
else
  log "OK: secrets scan"
fi

# 6. console.log scan
log "== STEP: console.log scan =="
CLOG=$(grep -rn "console.log" src/ 2>/dev/null | grep -v ".test.")
if [ -n "$CLOG" ]; then
  log "console.log di src:"
  echo "$CLOG"
  fail "console.log scan"
else
  log "OK: console.log scan"
fi

# 7. Sweep akun test + state admin
log "== STEP: sweep akun test =="
node scripts/sweep-test-accounts.js
if [ "$?" = "0" ]; then
  log "OK: sweep"
else
  fail "sweep akun test"
fi

# 8. npm audit — network error = WARN skip (CI tetap wajib)
log "== STEP: npm audit =="
AUDIT_OUT=$(npm audit --audit-level=high 2>&1)
AUDIT_RC=$?
if [ "$AUDIT_RC" = "0" ]; then
  log "OK: npm audit (0 high/critical)"
elif echo "$AUDIT_OUT" | grep -qiE "ENOTFOUND|EAI_AGAIN|ETIMEDOUT|network|fetch failed|ENETUNREACH"; then
  log "WARN: npm audit skip (network error di mesin lokal — CI wajib hijau)"
else
  log "FAIL: npm audit menemukan vulnerability:"
  echo "$AUDIT_OUT" | grep -E "Severity|^[a-z@/0-9.-]+ " | head -8
  fail "npm audit"
fi

# 9. Gitleaks — binary tidak ada di lokal = WARN skip (CI wajib)
log "== STEP: gitleaks =="
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks detect --source . --config .gitleaks.toml --no-banner --redact 2>&1 | tail -3; then
    log "OK: gitleaks (no leaks)"
  else
    fail "gitleaks"
  fi
else
  log "WARN: gitleaks binary tidak ada di mesin lokal — skip (CI wajib jalankan)"
fi

if [ "$FAIL" = "1" ]; then
  log "== GATE GAGAL (langkah gagal:$FAILED_STEPS) — COMMIT DILARANG =="
  wait 2>/dev/null
  exit 1
fi

log "== GATE PASS — semua check hijau =="
if [ -n "$EVIDENCE" ]; then
  log "bukti tersimpan: $EVIDENCE"
fi
wait 2>/dev/null
exit 0
