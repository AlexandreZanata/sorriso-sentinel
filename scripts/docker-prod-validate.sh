#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_base="${COMPOSE_BASE:-docker/docker-compose.yml}"
compose_prod="${COMPOSE_PROD:-docker/docker-compose.prod.yml}"
project="${COMPOSE_PROJECT:-sentinel-prod-validate}"
timeout="${DOCKER_WAIT_TIMEOUT:-180}"
version="$(tr -d '[:space:]' < VERSION)"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required but not installed."
  exit 1
fi

export VERSION="${version}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-prod-validate-postgres-secret}"
export MINIO_ROOT_USER="${MINIO_ROOT_USER:-sentinel}"
export MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-prod-validate-minio-secret}"
export DATABASE_URL="${DATABASE_URL:-postgresql://sentinel_app:sentinel_app@postgres:5432/sorriso_sentinel}"
export REDIS_URL="${REDIS_URL:-redis://redis:6379}"
export CORS_ORIGINS="${CORS_ORIGINS:-https://app.example.com}"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-prod-validate-jwt-secret-not-dev}"
export SESSION_TOKEN_SECRET="${SESSION_TOKEN_SECRET:-prod-validate-session-secret-not-dev}"
export TRUST_PROXY="${TRUST_PROXY:-true}"

ssl_dir="${root}/docker/postgres/ssl"
mkdir -p "${ssl_dir}"
if [[ ! -f "${ssl_dir}/server.crt" ]]; then
  echo "==> Generating self-signed PostgreSQL TLS certs for local prod validation"
  docker run --rm \
    -v "${ssl_dir}:/ssl" \
    postgis/postgis:18-3.6 \
    bash -c 'openssl req -new -x509 -days 365 -nodes \
      -out /ssl/server.crt -keyout /ssl/server.key -subj "/CN=postgres" \
      && chown postgres:postgres /ssl/server.crt /ssl/server.key \
      && chmod 600 /ssl/server.key'
fi

echo "==> Removing stale sentinel containers (fixed container_name conflicts)"
docker rm -f sentinel-postgres sentinel-redis sentinel-minio sentinel-api 2>/dev/null || true

echo "==> Validating production compose: ${compose_base} + ${compose_prod}"
docker compose -f "${compose_base}" -f "${compose_prod}" -p "${project}" config --quiet

echo "==> Starting production infrastructure..."
docker compose -f "${compose_base}" -f "${compose_prod}" -p "${project}" up -d --wait --timeout "${timeout}" postgres redis minio

cleanup() {
  echo "==> Stopping production stack..."
  docker compose -f "${compose_base}" -f "${compose_prod}" -p "${project}" down -v --remove-orphans
}
trap cleanup EXIT

migrations_dir="${root}/packages/database/migrations"
echo "==> Applying SQL migrations (superuser)"
for migration in "${migrations_dir}"/0*.sql; do
  docker compose -f "${compose_base}" -f "${compose_prod}" -p "${project}" exec -T postgres \
    psql -U sentinel -d sorriso_sentinel -v ON_ERROR_STOP=1 -f - < "${migration}" >/dev/null
done

echo "==> RLS staging check (sentinel_app runtime role)"
rls_hidden="$(docker compose -f "${compose_base}" -f "${compose_prod}" -p "${project}" exec -T \
  -e PGPASSWORD=sentinel_app postgres \
  psql -U sentinel_app -d sorriso_sentinel -v ON_ERROR_STOP=1 -tAc \
  "BEGIN;
   SELECT set_config('app.city_id', '01932f1a-0000-7000-8000-000000000001', true);
   INSERT INTO occurrences (
     id, city_id, category, status, confidence_level, latitude, longitude,
     privacy_level, contributor_reputation_id, occurrence_kind, is_sensitive, author_display_policy
   ) VALUES (
     '01932f1a-0000-7000-8000-000000000199', '01932f1a-0000-7000-8000-000000000001',
     'crime', 'unverified', 0, -12.54, -55.72, 'public', 'rep-prod-rls',
     'problem', true, 'forced_ghost'
   );
   SELECT count(*) FROM occurrences WHERE id = '01932f1a-0000-7000-8000-000000000199';
   ROLLBACK;")"
rls_hidden="$(echo "${rls_hidden}" | grep -E '^[0-9]+$' | tail -1)"
[[ "${rls_hidden}" == "0" ]] || { echo "ERROR: sensitive row visible in staging RLS check (got ${rls_hidden})"; exit 1; }

echo "==> Starting production API (image tag ${VERSION})"
docker compose -f "${compose_base}" -f "${compose_prod}" -p "${project}" up -d --wait --timeout "${timeout}" api

echo "==> Security headers on /health"
headers="$(curl -sI "http://127.0.0.1:3000/health")"
echo "${headers}" | grep -qi 'x-content-type-options: nosniff' || {
  echo "ERROR: missing X-Content-Type-Options: nosniff"
  exit 1
}
echo "${headers}" | grep -qi 'x-frame-options: DENY' || {
  echo "ERROR: missing X-Frame-Options: DENY"
  exit 1
}
echo "${headers}" | grep -qi 'strict-transport-security:' || {
  echo "ERROR: missing Strict-Transport-Security (TRUST_PROXY must be enabled)"
  exit 1
}

echo "==> CORS allowlist (allowed origin)"
cors_ok="$(curl -sI -X OPTIONS "http://127.0.0.1:3000/health" \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: GET")"
echo "${cors_ok}" | grep -qi 'access-control-allow-origin: https://app.example.com' || {
  echo "ERROR: allowed CORS origin not returned"
  exit 1
}

echo "==> CORS allowlist (disallowed origin)"
cors_bad="$(curl -sI -X OPTIONS "http://127.0.0.1:3000/health" \
  -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: GET")"
echo "${cors_bad}" | grep -qi 'access-control-allow-origin:' && {
  echo "ERROR: disallowed CORS origin was accepted"
  exit 1
}

echo "==> Rollback tag pin (compose requires VERSION, not latest)"
if docker compose -f "${compose_base}" -f "${compose_prod}" -p "${project}" config 2>/dev/null | grep -q 'image: sorriso-sentinel/api:latest'; then
  echo "ERROR: production API image must not default to latest"
  exit 1
fi

echo "Production Docker validation passed."
