#!/usr/bin/env bash
set -euo pipefail

required_files=(
  LICENSE
  NOTICE
  README.md
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md
  CHANGELOG.md
  VERSION
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "ERROR: Missing required open source file: ${file}"
    exit 1
  fi
done

echo "All required open source files present."
