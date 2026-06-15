#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

echo "==> npm audit — production dependencies (fail on high or critical)"
npm audit --omit=dev --audit-level=high

echo "Security audit passed."
