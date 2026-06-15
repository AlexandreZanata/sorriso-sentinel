#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

echo "==> Installing dependencies..."
npm ci

echo "==> Configuring git hooks (Husky)..."
npm run prepare

echo "==> Running validation..."
npm run validate

echo ""
echo "Development environment ready."
echo ""
echo "Next steps:"
echo "  git checkout main && git pull origin main"
echo "  git checkout -b feat/your-feature"
echo "  npm run check          # run before opening a PR"
echo ""
echo "See docs/contributing/development-setup.md for details."
