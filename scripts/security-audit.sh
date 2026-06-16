#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

echo "==> pnpm audit — production dependencies (fail on high or critical)"
pnpm audit --prod --audit-level high

echo "Security audit passed."
