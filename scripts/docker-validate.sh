#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_base="${COMPOSE_BASE:-docker/docker-compose.yml}"
compose_api="${COMPOSE_API:-docker/docker-compose.api.yml}"
project="${COMPOSE_PROJECT:-sentinel-validate}"
timeout="${DOCKER_WAIT_TIMEOUT:-120}"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required but not installed."
  exit 1
fi

echo "==> Removing stale sentinel containers (fixed container_name conflicts)"
docker rm -f sentinel-postgres sentinel-redis sentinel-minio sentinel-api 2>/dev/null || true

echo "==> Validating compose files: ${compose_base} + ${compose_api}"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" config --quiet

echo "==> Starting infrastructure (wait for health checks)..."
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" up -d --wait --timeout "${timeout}" postgres redis minio

cleanup() {
  echo "==> Stopping infrastructure..."
  docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" down -v --remove-orphans
}
trap cleanup EXIT

echo "==> PostgreSQL"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  pg_isready -U sentinel -d sorriso_sentinel

echo "==> PostgreSQL extensions"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -c "SELECT extname FROM pg_extension WHERE extname IN ('postgis', 'pgcrypto');" \
  | grep -q postgis

migrations_dir="${root}/packages/database/migrations"
echo "==> Applying SQL migrations"
for migration in "${migrations_dir}"/0*.sql; do
  docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
    psql -U sentinel -d sorriso_sentinel -v ON_ERROR_STOP=1 -f - < "${migration}" >/dev/null
done

echo "==> Redis"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T redis \
  redis-cli ping | grep -q PONG

echo "==> MinIO"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T minio \
  curl -sf http://localhost:9000/minio/health/live >/dev/null

echo "==> UUID v7 (PostgreSQL 18)"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc "SELECT uuidv7() IS NOT NULL;"

echo "==> RLS forced on tenant tables"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname IN ('contributors', 'occurrences', 'occurrence_comments', 'occurrence_audit')
     AND c.relrowsecurity AND c.relforcerowsecurity;" \
  | grep -q '^4$'

echo "==> No contributor GPS column on occurrences"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT count(*) FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'occurrences'
     AND column_name LIKE '%contributor%gps%';" \
  | grep -q '^0$'

echo "==> Sensitive occurrence hidden via RLS SELECT policy (sentinel_app runtime role)"
rls_hidden="$(docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T \
  -e PGPASSWORD=sentinel_app postgres \
  psql -U sentinel_app -d sorriso_sentinel -v ON_ERROR_STOP=1 -tAc \
  "BEGIN;
   SELECT set_config('app.city_id', '01932f1a-0000-7000-8000-000000000001', true);
   INSERT INTO occurrences (
     id, city_id, category, status, confidence_level, latitude, longitude,
     privacy_level, contributor_reputation_id, occurrence_kind, is_sensitive, author_display_policy
   ) VALUES (
     '01932f1a-0000-7000-8000-000000000099', '01932f1a-0000-7000-8000-000000000001',
     'crime', 'unverified', 0, -12.54, -55.72, 'public', 'rep-rls-validate',
     'problem', true, 'forced_ghost'
   );
   SELECT count(*) FROM occurrences WHERE id = '01932f1a-0000-7000-8000-000000000099';
   ROLLBACK;")"
rls_visible="$(docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T \
  -e PGPASSWORD=sentinel_app postgres \
  psql -U sentinel_app -d sorriso_sentinel -v ON_ERROR_STOP=1 -tAc \
  "BEGIN;
   SELECT set_config('app.city_id', '01932f1a-0000-7000-8000-000000000001', true);
   INSERT INTO occurrences (
     id, city_id, category, status, confidence_level, latitude, longitude,
     privacy_level, contributor_reputation_id, occurrence_kind, is_sensitive, author_display_policy
   ) VALUES (
     '01932f1a-0000-7000-8000-000000000098', '01932f1a-0000-7000-8000-000000000001',
     'crime', 'unverified', 0, -12.54, -55.72, 'public', 'rep-rls-validate-bypass',
     'problem', true, 'forced_ghost'
   );
   SELECT set_config('app.bypass_sensitive', 'true', true);
   SELECT count(*) FROM occurrences WHERE id = '01932f1a-0000-7000-8000-000000000098';
   ROLLBACK;")"
rls_hidden="$(echo "${rls_hidden}" | grep -E '^[0-9]+$' | tail -1)"
rls_visible="$(echo "${rls_visible}" | grep -E '^[0-9]+$' | tail -1)"
[[ "${rls_hidden}" == "0" ]] || { echo "ERROR: sensitive row visible without bypass (got ${rls_hidden})"; exit 1; }
[[ "${rls_visible}" == "1" ]] || { echo "ERROR: sensitive row not visible with bypass (got ${rls_visible})"; exit 1; }

echo "All Docker health checks passed."
