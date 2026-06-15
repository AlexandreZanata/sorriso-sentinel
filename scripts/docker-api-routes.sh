#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
migrations_dir="${root}/packages/database/migrations"
compose_base="docker/docker-compose.yml"
compose_api="docker/docker-compose.api.yml"
project="${COMPOSE_PROJECT:-sentinel-routes}"
api_url="${API_URL:-http://127.0.0.1:3010}"
city_id="01932f1a-0000-7000-8000-000000000001"
session_secret="${SESSION_TOKEN_SECRET:-dev-session-secret-change-me}"
local_key_ref="fingerprint-docker-routes-$(date +%s)"
passed=0
failed=0

pass() {
  passed=$((passed + 1))
  echo "  PASS: $1"
}

fail() {
  failed=$((failed + 1))
  echo "  FAIL: $1"
  if [[ -n "${2:-}" ]]; then
    echo "        $2"
  fi
}

expect_status() {
  local label="$1"
  local expected="$2"
  shift 2
  local status
  status="$(curl -s -o /tmp/route-body.json -w '%{http_code}' "$@")"

  if [[ "${status}" == "${expected}" ]]; then
    pass "${label} (HTTP ${status})"
  else
    fail "${label}" "expected HTTP ${expected}, got ${status}: $(cat /tmp/route-body.json)"
  fi
}

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
  docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
    psql -U sentinel -d sorriso_sentinel -v ON_ERROR_STOP=1 -f - < "${migration}" >/dev/null
done

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" restart api
sleep 5

echo ""
echo "==> Route validation (${api_url})"
echo ""

echo "--- Health ---"
expect_status "GET /health" 200 "${api_url}/health"
grep -q '"status":"ok"' /tmp/route-body.json && pass "GET /health body" || fail "GET /health body" "$(cat /tmp/route-body.json)"

expect_status "GET /health/live" 200 "${api_url}/health/live"
grep -q '"status":"live"' /tmp/route-body.json && pass "GET /health/live body" || fail "GET /health/live body" "$(cat /tmp/route-body.json)"

expect_status "GET /health/ready" 200 "${api_url}/health/ready"
grep -q '"redis":"ok"' /tmp/route-body.json && pass "GET /health/ready redis" || fail "GET /health/ready redis" "$(cat /tmp/route-body.json)"
grep -q '"postgres":"ok"' /tmp/route-body.json && pass "GET /health/ready postgres" || fail "GET /health/ready postgres" "$(cat /tmp/route-body.json)"

echo ""
echo "--- Sessions ---"
expect_status "POST /sessions/bootstrap" 201 \
  -X POST "${api_url}/sessions/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"${local_key_ref}\"}"

token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['sessionToken'])")"
contributor_id="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['contributorId'])")"
reputation_id="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['reputationId'])")"
[[ -n "${token}" ]] && pass "POST /sessions/bootstrap sessionToken" || fail "POST /sessions/bootstrap sessionToken"

expect_status "POST /sessions/bootstrap (extra field -> 400)" 400 \
  -X POST "${api_url}/sessions/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"${local_key_ref}\",\"extra\":true}"

echo ""
echo "--- Occurrences ---"
expect_status "POST /occurrences (no session -> 401)" 401 \
  -X POST "${api_url}/occurrences" \
  -H 'Content-Type: application/json' \
  -d '{"category":"pothole","latitude":-12.5423,"longitude":-55.7214}'

expect_status "POST /occurrences (invalid category -> 400)" 400 \
  -X POST "${api_url}/occurrences" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"category":"not-valid","latitude":-12.5423,"longitude":-55.7214}'

expect_status "POST /occurrences (valid pothole -> 201)" 201 \
  -X POST "${api_url}/occurrences" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"category":"pothole","latitude":-12.5423,"longitude":-55.7214}'

occurrence_id="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['id'])")"
grep -q '"status":"unverified"' /tmp/route-body.json && pass "POST /occurrences status unverified" || fail "POST /occurrences status"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT contributor_reputation_id FROM occurrences WHERE id = '${occurrence_id}';" \
  | grep -q "${reputation_id}" \
  && pass "POST /occurrences persisted reputation_id" \
  || fail "POST /occurrences persisted reputation_id"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT uuid_extract_version('${occurrence_id}'::uuid) = 7;" \
  | grep -q t \
  && pass "POST /occurrences uuidv7 from Postgres" \
  || fail "POST /occurrences uuidv7 from Postgres"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT COUNT(*) FROM domain_outbox WHERE event_type = 'OccurrenceCreated' AND payload->>'occurrenceId' = '${occurrence_id}';" \
  | grep -q 1 \
  && pass "POST /occurrences OccurrenceCreated in domain_outbox" \
  || fail "POST /occurrences OccurrenceCreated in domain_outbox"

expect_status "POST /occurrences (crime, ghost author omitted -> 201)" 201 \
  -X POST "${api_url}/occurrences" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"category":"crime","latitude":-12.5423,"longitude":-55.7214}'

python3 -c "import json; b=json.load(open('/tmp/route-body.json')); exit(0 if 'author' not in b else 1)" \
  && pass "POST /occurrences crime omits author" \
  || fail "POST /occurrences crime omits author" "$(cat /tmp/route-body.json)"

echo ""
echo "--- Identity ---"
expect_status "PATCH /identity/mode (no session -> 401)" 401 \
  -X PATCH "${api_url}/identity/mode" \
  -H 'Content-Type: application/json' \
  -d '{"mode":"pseudonym","pseudonym":"RotaTeste"}'

expect_status "PATCH /identity/mode (pseudonym -> 200)" 200 \
  -X PATCH "${api_url}/identity/mode" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"mode":"pseudonym","pseudonym":"RotaTeste"}'

token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['sessionToken'])")"
grep -q '"identityMode":"pseudonym"' /tmp/route-body.json && pass "PATCH /identity/mode body" || fail "PATCH /identity/mode body" "$(cat /tmp/route-body.json)"

expect_status "POST /identity/rotate (no session -> 401)" 401 \
  -X POST "${api_url}/identity/rotate" \
  -H 'Content-Type: application/json' \
  -d '{"newLocalKeyRef":"x","rotationProof":"y"}'

new_local_key_ref="${local_key_ref}-rotated"
rotation_proof="$(python3 - <<PY
import hashlib, hmac
secret = "${session_secret}"
payload = f"${contributor_id}:${local_key_ref}:${new_local_key_ref}"
print(hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest())
PY
)"

expect_status "POST /identity/rotate (valid proof -> 200)" 200 \
  -X POST "${api_url}/identity/rotate" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d "{\"newLocalKeyRef\":\"${new_local_key_ref}\",\"rotationProof\":\"${rotation_proof}\"}"

token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['sessionToken'])")"
grep -q '"reputationId"' /tmp/route-body.json && pass "POST /identity/rotate body" || fail "POST /identity/rotate body" "$(cat /tmp/route-body.json)"

echo ""
echo "--- Comments ---"
expect_status "POST /occurrences/:id/comments (no session -> 401)" 401 \
  -X POST "${api_url}/occurrences/${occurrence_id}/comments" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Sem token."}'

expect_status "POST /occurrences/:id/comments (unknown occurrence -> 404)" 404 \
  -X POST "${api_url}/occurrences/01932f1a-0000-7000-8000-000000000099/comments" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Ocorrencia inexistente."}'

expect_status "POST /occurrences/:id/comments (valid -> 201)" 201 \
  -X POST "${api_url}/occurrences/${occurrence_id}/comments" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Confirmado via docker routes."}'

grep -q 'Confirmado via docker routes' /tmp/route-body.json && pass "POST /comments body" || fail "POST /comments body" "$(cat /tmp/route-body.json)"
grep -q '"author"' /tmp/route-body.json && pass "POST /comments author (pseudonym session)" || fail "POST /comments author" "$(cat /tmp/route-body.json)"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT COUNT(*) FROM occurrence_comments WHERE occurrence_id = '${occurrence_id}';" \
  | grep -qv '^0$' \
  && pass "POST /comments persisted in Postgres" \
  || fail "POST /comments persisted in Postgres"

echo ""
echo "==> Summary: ${passed} passed, ${failed} failed"

if [[ "${failed}" -gt 0 ]]; then
  exit 1
fi

echo "All API routes validated in Docker."
