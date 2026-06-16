#!/usr/bin/env bash
# Start API container with BuildKit cache and skip rebuild when image exists.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_base="${COMPOSE_BASE:-docker/docker-compose.yml}"
compose_api="${COMPOSE_API:-docker/docker-compose.api.yml}"
project="${COMPOSE_PROJECT:-sentinel}"
api_image="${DOCKER_API_IMAGE:-sorriso-sentinel/api:local}"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

compose=(docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}")

if docker ps --format '{{.Names}}' | grep -qx sentinel-api; then
  if curl -sf "http://127.0.0.1:3010/health" >/dev/null 2>&1; then
    echo "Sorriso Sentinel API already running on http://127.0.0.1:3010"
    exit 0
  fi
fi

if docker ps -a --format '{{.Names}}' | grep -qE '^sentinel-(postgres|redis|minio|api)$'; then
  echo "==> Removing stale sentinel containers from a previous compose project..."
  bash "${root}/scripts/docker-down.sh"
fi

services=(postgres redis minio api)
migrations_dir="${root}/packages/database/migrations"

run_migrations() {
  echo "==> Applying SQL migrations"
  for migration in "${migrations_dir}"/0*.sql; do
    echo "    -> $(basename "${migration}")"
    "${compose[@]}" exec -T postgres \
      psql -U sentinel -d sorriso_sentinel -v ON_ERROR_STOP=1 -f - < "${migration}" >/dev/null
  done
}

infra=(postgres redis minio)

if [[ "${FORCE_DOCKER_API_BUILD:-0}" == "1" ]]; then
  echo "==> Building API image (FORCE_DOCKER_API_BUILD=1)"
  "${compose[@]}" up -d --build --wait "${infra[@]}"
  run_migrations
  "${compose[@]}" up -d --build --wait api
elif docker image inspect "${api_image}" >/dev/null 2>&1; then
  echo "==> Starting API from cached image ${api_image} (set FORCE_DOCKER_API_BUILD=1 to rebuild)"
  "${compose[@]}" up -d --wait "${infra[@]}"
  run_migrations
  "${compose[@]}" up -d --wait api
else
  echo "==> Building API image (first run — BuildKit + pnpm store cache)"
  "${compose[@]}" up -d --build --wait "${infra[@]}"
  run_migrations
  "${compose[@]}" up -d --build --wait api
fi

if curl -sf "http://127.0.0.1:3010/health" >/dev/null 2>&1; then
  echo "Sorriso Sentinel API is up at http://127.0.0.1:3010"
else
  echo "WARNING: API started but /health is not reachable yet. Check: docker logs sentinel-api"
  exit 1
fi
