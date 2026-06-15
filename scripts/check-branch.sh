#!/usr/bin/env bash
set -euo pipefail

branch="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$branch" == "main" || "$branch" == "master" ]]; then
  echo "ERROR: Direct commits on '${branch}' are not allowed."
  echo "Create a topic branch from main:"
  echo "  git checkout main && git pull origin main"
  echo "  git checkout -b feat/your-feature"
  exit 1
fi

echo "Branch check passed: ${branch}"
