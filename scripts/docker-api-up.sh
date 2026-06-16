#!/usr/bin/env bash
# Start API container with BuildKit cache and skip rebuild when image exists.
set -euo pipefail

compose_base="${COMPOSE_BASE:-docker/docker-compose.yml}"
compose_api="${COMPOSE_API:-docker/docker-compose.api.yml}"
project="${COMPOSE_PROJECT:-sentinel-routes}"
api_image="${DOCKER_API_IMAGE:-sorriso-sentinel/api:local}"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

compose=(docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}")

if [[ "${FORCE_DOCKER_API_BUILD:-0}" == "1" ]]; then
  echo "==> Building API image (FORCE_DOCKER_API_BUILD=1)"
  "${compose[@]}" up -d --build --wait api
elif docker image inspect "${api_image}" >/dev/null 2>&1; then
  echo "==> Starting API from cached image ${api_image} (set FORCE_DOCKER_API_BUILD=1 to rebuild)"
  "${compose[@]}" up -d --wait api
else
  echo "==> Building API image (first run — BuildKit + pnpm store cache)"
  "${compose[@]}" up -d --build --wait api
fi
