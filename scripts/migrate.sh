#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
migrations_dir="${root}/packages/database/migrations"
database_url="${DATABASE_URL:-postgresql://sentinel:sentinel@localhost:5432/sorriso_sentinel}"

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required to apply migrations."
  exit 1
fi

echo "==> Applying migrations to ${database_url}"
for migration in "${migrations_dir}"/0*.sql; do
  echo "    -> $(basename "${migration}")"
  psql "${database_url}" -v ON_ERROR_STOP=1 -f "${migration}" >/dev/null
done

echo "All migrations applied."
