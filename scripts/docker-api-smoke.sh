#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_base="docker/docker-compose.yml"
compose_api="docker/docker-compose.api.yml"
project="${COMPOSE_PROJECT:-sentinel}"
api_url="${API_URL:-http://127.0.0.1:3010}"
city_id="01932f1a-0000-7000-8000-000000000001"

echo "==> Starting Postgres, Redis, MinIO, and API"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" up -d --build --wait

cleanup() {
  echo "==> Stopping stack"
  docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" down
}
if [[ "${KEEP_STACK:-0}" != "1" ]]; then
  trap cleanup EXIT
fi

echo "==> Redis PING"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T redis \
  redis-cli ping | grep -q PONG

echo "==> API /health/ready (Redis check)"
curl -sf "${api_url}/health/ready" | grep -q '"redis":"ok"'

echo "==> Bootstrap session"
bootstrap_payload="$(curl -sf -X POST "${api_url}/sessions/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"fingerprint-docker-smoke\"}")"
echo "${bootstrap_payload}" | grep -q 'sessionToken'

token="$(echo "${bootstrap_payload}" | python3 -c "import sys, json; print(json.load(sys.stdin)['sessionToken'])")"
reputation_id="$(echo "${bootstrap_payload}" | python3 -c "import sys, json; print(json.load(sys.stdin)['reputationId'])")"

echo "==> Redis contributor key exists"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T redis \
  redis-cli EXISTS "sentinel:contributor:local:${city_id}:fingerprint-docker-smoke" | grep -q 1

echo "==> Create occurrence"
occurrence_payload="$(curl -sf -X POST "${api_url}/occurrences" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"category":"pothole","latitude":-12.5423,"longitude":-55.7214}')"
echo "${occurrence_payload}" | grep -q 'unverified'

echo "==> Idempotent bootstrap returns same reputation"
second_payload="$(curl -sf -X POST "${api_url}/sessions/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"fingerprint-docker-smoke\"}")"
second_reputation="$(echo "${second_payload}" | python3 -c "import sys, json; print(json.load(sys.stdin)['reputationId'])")"
test "${second_reputation}" = "${reputation_id}"

echo "All Redis + API smoke checks passed."
