#!/usr/bin/env bash
# Pasang hooks versioned: git config core.hooksPath scripts/hooks
set -u
cd "$(dirname "$0")/.." || exit 1
chmod +x scripts/hooks/pre-commit scripts/hooks/commit-msg
git config core.hooksPath scripts/hooks
echo "[install-hooks] core.hooksPath -> $(git config core.hooksPath)"
echo "[install-hooks] aktif: pre-commit (tsc+unit+sweep+secrets+evidence) + commit-msg (baris Gate wajib)"
exit 0
