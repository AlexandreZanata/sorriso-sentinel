#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
migrations_dir="${root}/packages/database/migrations"
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

echo "==> Applying SQL migrations"
for migration in "${migrations_dir}"/0*.sql; do
  echo "    -> $(basename "${migration}")"
  docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
    psql -U sentinel -d sorriso_sentinel -v ON_ERROR_STOP=1 -f - < "${migration}" >/dev/null
done

echo "==> Restart API after migrations"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" restart api
sleep 5

echo "==> Redis PING"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T redis \
  redis-cli ping | grep -q PONG

echo "==> API /health/ready"
curl -sf "${api_url}/health/ready" | grep -q '"redis":"ok"'

echo "==> PostgreSQL 18+ with native uuidv7()"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT split_part(current_setting('server_version'), '.', 1)::int >= 18;" \
  | grep -q t

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT uuid_extract_version(uuidv7()) = 7;" \
  | grep -q t

echo "==> Bootstrap session"
bootstrap_payload="$(curl -sf -X POST "${api_url}/sessions/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"fingerprint-docker-smoke\"}")"
echo "${bootstrap_payload}" | grep -q 'sessionToken'

token="$(echo "${bootstrap_payload}" | python3 -c "import sys, json; print(json.load(sys.stdin)['sessionToken'])")"
reputation_id="$(echo "${bootstrap_payload}" | python3 -c "import sys, json; print(json.load(sys.stdin)['reputationId'])")"

echo "==> Postgres contributor row exists"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT COUNT(*) FROM contributors WHERE reputation_id = '${reputation_id}';" \
  | grep -q 1

echo "==> Create occurrence (persisted)"
occurrence_payload="$(curl -sf -X POST "${api_url}/occurrences" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"category":"pothole","latitude":-12.5423,"longitude":-55.7214}')"
occurrence_id="$(echo "${occurrence_payload}" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT COUNT(*) FROM occurrences WHERE id = '${occurrence_id}';" \
  | grep -q 1

echo "==> PATCH identity mode to pseudonym"
mode_payload="$(curl -sf -X PATCH "${api_url}/identity/mode" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"mode":"pseudonym","pseudonym":"JoaoDoCentro"}')"
token="$(echo "${mode_payload}" | python3 -c "import sys, json; print(json.load(sys.stdin)['sessionToken'])")"

echo "==> Add comment"
curl -sf -X POST "${api_url}/occurrences/${occurrence_id}/comments" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Confirmado, buraco ainda la."}' \
  | grep -q 'Confirmado'

echo "==> RLS enabled on contributors and occurrences"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT relrowsecurity FROM pg_class WHERE relname = 'contributors';" \
  | grep -q t

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('contributors', 'occurrences', 'occurrence_comments');" \
  | grep -qv '^0$'

echo "All Postgres + Redis + API smoke checks passed."
