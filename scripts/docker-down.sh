#!/usr/bin/env bash
# Stop Sorriso Sentinel Docker stack (any compose project using fixed container_name).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_base="${COMPOSE_BASE:-docker/docker-compose.yml}"
compose_api="${COMPOSE_API:-docker/docker-compose.api.yml}"
project="${COMPOSE_PROJECT:-sentinel}"

for name in sentinel-routes sentinel sentinel-validate docker; do
  docker compose -f "${compose_base}" -f "${compose_api}" -p "${name}" down --remove-orphans 2>/dev/null || true
  docker compose -f "${compose_base}" -p "${name}" down --remove-orphans 2>/dev/null || true
done

docker rm -f sentinel-postgres sentinel-redis sentinel-minio sentinel-api 2>/dev/null || true

echo "Sorriso Sentinel Docker stack stopped."
