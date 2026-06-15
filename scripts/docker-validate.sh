#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_file="${COMPOSE_FILE:-docker/docker-compose.yml}"
timeout="${DOCKER_WAIT_TIMEOUT:-120}"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required but not installed."
  exit 1
fi

echo "==> Validating compose file: ${compose_file}"
docker compose -f "${compose_file}" config --quiet

echo "==> Starting infrastructure (wait for health checks)..."
docker compose -f "${compose_file}" up -d --wait --timeout "${timeout}"

cleanup() {
  echo "==> Stopping infrastructure..."
  docker compose -f "${compose_file}" down -v --remove-orphans
}
trap cleanup EXIT

echo "==> PostgreSQL"
docker compose -f "${compose_file}" exec -T postgres \
  pg_isready -U sentinel -d sorriso_sentinel

echo "==> PostgreSQL extensions"
docker compose -f "${compose_file}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -c "SELECT extname FROM pg_extension WHERE extname IN ('postgis', 'pgcrypto');" \
  | grep -q postgis

echo "==> Redis"
docker compose -f "${compose_file}" exec -T redis redis-cli ping | grep -q PONG

echo "==> MinIO"
curl -sf http://localhost:9000/minio/health/live >/dev/null

echo "==> UUID v7 (PostgreSQL 18)"
docker compose -f "${compose_file}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc "SELECT uuidv7() IS NOT NULL;"

echo "All Docker health checks passed."
