#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Configuring git hooks (Husky)..."
pnpm run prepare

echo "==> Running validation..."
pnpm run validate

echo ""
echo "Development environment ready."
echo ""
echo "Next steps:"
echo "  git checkout main && git pull origin main"
echo "  git checkout -b feat/your-feature"
echo "  pnpm run check          # run before opening a PR"
echo ""
echo "See docs/contributing/development-setup.md for details."
