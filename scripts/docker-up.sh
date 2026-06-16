#!/usr/bin/env bash
# Start Postgres, Redis, MinIO for local development.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_base="${COMPOSE_BASE:-docker/docker-compose.yml}"
project="${COMPOSE_PROJECT:-sentinel}"

infra_running() {
  docker ps --format '{{.Names}}' | grep -qx sentinel-postgres \
    && docker ps --format '{{.Names}}' | grep -qx sentinel-redis \
    && docker ps --format '{{.Names}}' | grep -qx sentinel-minio
}

if infra_running; then
  echo "Sorriso Sentinel infra already running (postgres, redis, minio)."
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qE '^sentinel-(postgres|redis|minio|api)$'; then
  echo "==> Removing stale sentinel containers from a previous compose project..."
  bash "${root}/scripts/docker-down.sh"
fi

docker compose -f "${compose_base}" -p "${project}" up -d --wait
echo "Sorriso Sentinel infra is up."
