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
pseudonym="RtUser$(printf '%x' "${RANDOM}")"
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

echo "==> Starting Postgres, Redis, and MinIO"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" up -d --wait postgres redis minio

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

echo "==> Starting API (after migrations and sentinel_app role)"
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" up -d --build --wait api
sleep 3

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
echo "--- Documentation ---"
expect_status "GET /docs" 200 "${api_url}/docs"
grep -q '<!DOCTYPE html>' /tmp/route-body.json && pass "GET /docs HTML" || fail "GET /docs HTML" "$(head -c 200 /tmp/route-body.json)"
grep -q '/occurrences/:id/confirm' /tmp/route-body.json && pass "GET /docs contains confirm route" || fail "GET /docs confirm route"

expect_status "GET /docs/spec.json" 200 "${api_url}/docs/spec.json"
cp /tmp/route-body.json /tmp/docs-spec.json
grep -q '"endpoints"' /tmp/docs-spec.json && pass "GET /docs/spec.json structure" || fail "GET /docs/spec.json structure" "$(cat /tmp/docs-spec.json)"
grep -q '"version"' /tmp/docs-spec.json && pass "GET /docs/spec.json version" || fail "GET /docs/spec.json version" "$(cat /tmp/docs-spec.json)"

python3 -c "import json; spec=json.load(open('/tmp/docs-spec.json')); exit(0 if len(spec.get('endpoints',[]))==27 else 1)" \
  && pass "GET /docs/spec.json endpoint count (27)" \
  || fail "GET /docs/spec.json endpoint count" "$(python3 -c "import json; print(len(json.load(open('/tmp/docs-spec.json')).get('endpoints',[])))")"

declare -a DOC_ROUTE_PATHS=(
  '/health'
  '/health/live'
  '/health/ready'
  '/sessions/bootstrap'
  '/occurrences'
  '/occurrences/:id'
  '/occurrences/:id/comments'
  '/occurrences/:id/confirm'
  '/occurrences/:id/deny'
  '/occurrences/:id/media/upload-slots'
  '/media/upload-slots/:slotId/complete'
  '/occurrences/:id/media'
  '/identity/mode'
  '/identity/rotate'
  '/auth/login'
  '/auth/refresh'
  '/auth/logout'
  '/user-accounts/register'
  '/user-accounts/verify-email'
  '/user-accounts/me'
  '/user-accounts/me/profile-photo'
  '/admin/audit-summary'
  '/admin/moderation-queue'
)

for route_path in "${DOC_ROUTE_PATHS[@]}"; do
  grep -q "\"path\":\"${route_path}\"" /tmp/docs-spec.json \
    && pass "spec.json documents ${route_path}" \
    || fail "spec.json missing path ${route_path}"
done

curl -s -o /tmp/docs-html.json "${api_url}/docs"
for route_path in "${DOC_ROUTE_PATHS[@]}"; do
  grep -q "${route_path}" /tmp/docs-html.json \
    && pass "GET /docs HTML contains ${route_path}" \
    || fail "GET /docs HTML missing ${route_path}"
done

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

expect_status "GET /occurrences (no session -> 401)" 401 \
  "${api_url}/occurrences?minLatitude=-12.55&maxLatitude=-12.53&minLongitude=-55.73&maxLongitude=-55.71"

expect_status "GET /occurrences (invalid bbox -> 400)" 400 \
  "${api_url}/occurrences?minLatitude=-12.53&maxLatitude=-12.55&minLongitude=-55.73&maxLongitude=-55.71" \
  -H "Authorization: Bearer ${token}"

expect_status "GET /occurrences (valid bbox -> 200)" 200 \
  "${api_url}/occurrences?minLatitude=-12.55&maxLatitude=-12.53&minLongitude=-55.73&maxLongitude=-55.71" \
  -H "Authorization: Bearer ${token}"

python3 -c "import json; ids=[item['id'] for item in json.load(open('/tmp/route-body.json')).get('items',[])]; exit(0 if '${occurrence_id}' in ids else 1)" \
  && pass "GET /occurrences includes created id" \
  || fail "GET /occurrences includes created id" "$(cat /tmp/route-body.json)"

expect_status "GET /occurrences/:id (valid -> 200)" 200 \
  "${api_url}/occurrences/${occurrence_id}" \
  -H "Authorization: Bearer ${token}"

grep -q '"privacyLevel":"public"' /tmp/route-body.json && pass "GET /occurrences/:id privacyLevel" || fail "GET /occurrences/:id privacyLevel" "$(cat /tmp/route-body.json)"
grep -q '"location":{' /tmp/route-body.json && pass "GET /occurrences/:id location present" || fail "GET /occurrences/:id location" "$(cat /tmp/route-body.json)"

expect_status "GET /occurrences/:id (missing -> 404)" 404 \
  "${api_url}/occurrences/01932f1a-0000-7000-8000-000000009999" \
  -H "Authorization: Bearer ${token}"

echo ""
echo "--- Media upload ---"
fixture="${root}/scripts/fixtures/test-100x100.jpg"
fixture_size="$(wc -c < "${fixture}" | tr -d ' ')"

expect_status "POST /occurrences/:id/media/upload-slots (no session -> 401)" 401 \
  -X POST "${api_url}/occurrences/${occurrence_id}/media/upload-slots" \
  -H 'Content-Type: application/json' \
  -d "{\"contentType\":\"image/jpeg\",\"contentLength\":${fixture_size}}"

expect_status "POST /occurrences/:id/media/upload-slots (valid -> 201)" 201 \
  -X POST "${api_url}/occurrences/${occurrence_id}/media/upload-slots" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d "{\"contentType\":\"image/jpeg\",\"contentLength\":${fixture_size}}"

media_slot_id="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['slotId'])")"
media_upload_url="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['uploadUrl'])")"
grep -q '"uploadUrl":' /tmp/route-body.json && pass "POST upload-slots returns uploadUrl" || fail "POST upload-slots uploadUrl"

media_raw_key="$(docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT raw_storage_key FROM media_assets WHERE id = '${media_slot_id}';" | tr -d '[:space:]')"

[[ -n "${media_raw_key}" ]] && pass "POST upload-slots persisted media_assets row" \
  || fail "POST upload-slots persisted media_assets row"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" cp "${fixture}" api:/tmp/test-100x100.jpg
docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T api \
  wget -q -O /dev/null --method=PUT \
  --header="Content-Type: image/jpeg" \
  --body-file=/tmp/test-100x100.jpg \
  "${media_upload_url}" \
  && pass "PUT image to presigned MinIO URL" \
  || fail "PUT image to presigned MinIO URL"

expect_status "POST /media/upload-slots/:id/complete (valid -> 202)" 202 \
  -X POST "${api_url}/media/upload-slots/${media_slot_id}/complete" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d "{\"uploadedKey\":\"${media_raw_key}\"}"

grep -q '"status":"ready"' /tmp/route-body.json && pass "POST complete inline processing ready" \
  || grep -q '"status":"processing"' /tmp/route-body.json && pass "POST complete returns processing" \
  || fail "POST complete status" "$(cat /tmp/route-body.json)"

expect_status "GET /occurrences/:id/media (ready -> 200)" 200 \
  "${api_url}/occurrences/${occurrence_id}/media" \
  -H "Authorization: Bearer ${token}"

python3 -c "import json; items=json.load(open('/tmp/route-body.json')).get('items',[]); exit(0 if len(items)>=1 and items[0]['id']=='${media_slot_id}' else 1)" \
  && pass "GET /occurrences/:id/media lists ready item" \
  || fail "GET /occurrences/:id/media lists ready item" "$(cat /tmp/route-body.json)"

grep -q 'quarantine' /tmp/route-body.json && fail "GET media exposes quarantine key" "$(cat /tmp/route-body.json)" || pass "GET media hides quarantine keys"

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
  -d "{\"mode\":\"pseudonym\",\"pseudonym\":\"${pseudonym}\"}"

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

expect_status "GET /occurrences/:id/comments (no session -> 401)" 401 \
  "${api_url}/occurrences/${occurrence_id}/comments"

expect_status "GET /occurrences/:id/comments (valid -> 200)" 200 \
  "${api_url}/occurrences/${occurrence_id}/comments" \
  -H "Authorization: Bearer ${token}"

grep -q 'Confirmado via docker routes' /tmp/route-body.json && pass "GET /comments lists posted comment" \
  || fail "GET /comments lists posted comment" "$(cat /tmp/route-body.json)"

echo ""
echo "--- Validation (confirm/deny) ---"
voter_local_key_ref="${local_key_ref}-voter"
expect_status "POST /occurrences/:id/confirm (no session -> 401)" 401 \
  -X POST "${api_url}/occurrences/${occurrence_id}/confirm" \
  -H 'Content-Type: application/json' \
  -d '{"version":1}'

expect_status "POST /sessions/bootstrap (voter session -> 201)" 201 \
  -X POST "${api_url}/sessions/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"${voter_local_key_ref}\"}"

voter_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['sessionToken'])")"

expect_status "POST /occurrences/:id/confirm (valid -> 200)" 200 \
  -X POST "${api_url}/occurrences/${occurrence_id}/confirm" \
  -H "Authorization: Bearer ${voter_token}" \
  -H 'Content-Type: application/json' \
  -d '{"version":1,"reason":"verified_locally"}'

grep -q '"confidenceLevel":20' /tmp/route-body.json && pass "POST /confirm increased confidence" || fail "POST /confirm confidence" "$(cat /tmp/route-body.json)"
grep -q '"status":"under_review"' /tmp/route-body.json && pass "POST /confirm status under_review" || fail "POST /confirm status" "$(cat /tmp/route-body.json)"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT COUNT(*) FROM validation_votes WHERE occurrence_id = '${occurrence_id}';" \
  | grep -q 1 \
  && pass "POST /confirm persisted validation vote" \
  || fail "POST /confirm persisted validation vote"

expect_status "POST /occurrences/:id/confirm (duplicate vote -> 403)" 403 \
  -X POST "${api_url}/occurrences/${occurrence_id}/confirm" \
  -H "Authorization: Bearer ${voter_token}" \
  -H 'Content-Type: application/json' \
  -d '{"version":2}'

expect_status "POST /occurrences/:id/deny (self-validation -> 403)" 403 \
  -X POST "${api_url}/occurrences/${occurrence_id}/deny" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"version":2,"reason":"false_alarm"}'

deny_voter_key_ref="${local_key_ref}-deny-voter"
expect_status "POST /sessions/bootstrap (deny voter -> 201)" 201 \
  -X POST "${api_url}/sessions/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"${deny_voter_key_ref}\"}"

deny_voter_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['sessionToken'])")"
deny_occurrence_version="$(docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT version FROM occurrences WHERE id = '${occurrence_id}';" | tr -d '[:space:]')"

expect_status "POST /occurrences/:id/deny (valid -> 200)" 200 \
  -X POST "${api_url}/occurrences/${occurrence_id}/deny" \
  -H "Authorization: Bearer ${deny_voter_token}" \
  -H 'Content-Type: application/json' \
  -d "{\"version\":${deny_occurrence_version},\"reason\":\"false_alarm\"}"

grep -q '"occurrenceId"' /tmp/route-body.json && pass "POST /deny body" || fail "POST /deny body" "$(cat /tmp/route-body.json)"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT COUNT(*) FROM validation_votes WHERE occurrence_id = '${occurrence_id}' AND vote_type = 'deny';" \
  | grep -q 1 \
  && pass "POST /deny persisted validation vote" \
  || fail "POST /deny persisted validation vote"

stale_voter_key_ref="${local_key_ref}-stale-voter"
expect_status "POST /sessions/bootstrap (stale-version voter -> 201)" 201 \
  -X POST "${api_url}/sessions/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"${stale_voter_key_ref}\"}"

stale_voter_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['sessionToken'])")"

expect_status "POST /occurrences/:id/confirm (stale version -> 409)" 409 \
  -X POST "${api_url}/occurrences/${occurrence_id}/confirm" \
  -H "Authorization: Bearer ${stale_voter_token}" \
  -H 'Content-Type: application/json' \
  -d '{"version":1}'

grep -q 'OCCURRENCE_VERSION_CONFLICT' /tmp/route-body.json && pass "POST /confirm stale version body" \
  || fail "POST /confirm stale version body" "$(cat /tmp/route-body.json)"

expect_status "POST /occurrences (consensus target -> 201)" 201 \
  -X POST "${api_url}/occurrences" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"category":"pothole","latitude":-12.5428,"longitude":-55.7219}'

consensus_occurrence_id="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['id'])")"
consensus_version=1

for voter_index in 1 2 3 4 5; do
  voter_key_ref="${local_key_ref}-consensus-${voter_index}"
  expect_status "POST /sessions/bootstrap (consensus voter ${voter_index} -> 201)" 201 \
    -X POST "${api_url}/sessions/bootstrap" \
    -H 'Content-Type: application/json' \
    -d "{\"cityId\":\"${city_id}\",\"localKeyRef\":\"${voter_key_ref}\"}"

  consensus_voter_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['sessionToken'])")"

  expect_status "POST /occurrences/:id/confirm (consensus vote ${voter_index} -> 200)" 200 \
    -X POST "${api_url}/occurrences/${consensus_occurrence_id}/confirm" \
    -H "Authorization: Bearer ${consensus_voter_token}" \
    -H 'Content-Type: application/json' \
    -d "{\"version\":${consensus_version},\"reason\":\"verified_locally\"}"

  consensus_version="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['version'])")"
done

grep -q '"status":"active"' /tmp/route-body.json && pass "POST /confirm fifth vote promotes to active" \
  || fail "POST /confirm fifth vote promotes to active" "$(cat /tmp/route-body.json)"
grep -q '"confidenceLevel":100' /tmp/route-body.json && pass "POST /confirm fifth vote confidence 100" \
  || fail "POST /confirm fifth vote confidence" "$(cat /tmp/route-body.json)"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT status FROM occurrences WHERE id = '${consensus_occurrence_id}';" \
  | grep -q active \
  && pass "POST /confirm consensus persisted active status" \
  || fail "POST /confirm consensus persisted active status"

echo ""
echo "--- User accounts ---"
pqc_ref="$(printf 'a%.0s' {1..64})"
pqc_signature="$(python3 -c "import base64; print(base64.urlsafe_b64encode(b'valid-dev-signature').decode())")"
user_email="docker.user.${RANDOM}@example.com"
user_password="docker-secure-password-12"

expect_status "POST /user-accounts/register (no session -> 401)" 401 \
  -X POST "${api_url}/user-accounts/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${user_email}\",\"displayName\":\"Docker User\",\"password\":\"${user_password}\",\"deviceNonce\":\"nonce-docker-001\",\"pqcPublicKeyRef\":\"${pqc_ref}\",\"pqcSignature\":\"${pqc_signature}\",\"lgpdConsent\":{\"termsVersion\":\"1.0.0\",\"privacyVersion\":\"1.0.0\",\"consentedAt\":\"2026-06-15T12:00:00.000Z\",\"purposes\":[\"account_creation\",\"email_communication\"]}}"

expect_status "POST /user-accounts/register (valid -> 201)" 201 \
  -X POST "${api_url}/user-accounts/register" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${user_email}\",\"displayName\":\"Docker User\",\"password\":\"${user_password}\",\"deviceNonce\":\"nonce-docker-001\",\"pqcPublicKeyRef\":\"${pqc_ref}\",\"pqcSignature\":\"${pqc_signature}\",\"lgpdConsent\":{\"termsVersion\":\"1.0.0\",\"privacyVersion\":\"1.0.0\",\"consentedAt\":\"2026-06-15T12:00:00.000Z\",\"purposes\":[\"account_creation\",\"email_communication\"]}}"

user_account_id="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['userAccountId'])")"
verification_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['verificationToken'])")"
grep -q '"status":"pending_verification"' /tmp/route-body.json && pass "POST /register pending_verification" || fail "POST /register status" "$(cat /tmp/route-body.json)"

expect_status "POST /user-accounts/verify-email (valid -> 200)" 200 \
  -X POST "${api_url}/user-accounts/verify-email" \
  -H 'Content-Type: application/json' \
  -d "{\"userAccountId\":\"${user_account_id}\",\"cityId\":\"${city_id}\",\"token\":\"${verification_token}\"}"

grep -q '"status":"active"' /tmp/route-body.json && pass "POST /verify-email active" || fail "POST /verify-email status" "$(cat /tmp/route-body.json)"

expect_status "GET /user-accounts/me (no session -> 401)" 401 \
  "${api_url}/user-accounts/me"

expect_status "GET /user-accounts/me (valid -> 200)" 200 \
  -H "Authorization: Bearer ${token}" \
  "${api_url}/user-accounts/me"

grep -q '"trustedSourceLabel":"new_source"' /tmp/route-body.json && pass "GET /me reputation label" || fail "GET /me reputation" "$(cat /tmp/route-body.json)"
grep -q 'docker.user' /tmp/route-body.json && pass "GET /me email present" || fail "GET /me email" "$(cat /tmp/route-body.json)"

expect_status "PATCH /user-accounts/me (update profile -> 200)" 200 \
  -X PATCH "${api_url}/user-accounts/me" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Docker Civic User","showIdentityOnReports":true}'

grep -q '"showIdentityOnReports":true' /tmp/route-body.json && pass "PATCH /me showIdentityOnReports" || fail "PATCH /me body" "$(cat /tmp/route-body.json)"

expect_status "PATCH /user-accounts/me/profile-photo (valid -> 200)" 200 \
  -X PATCH "${api_url}/user-accounts/me/profile-photo" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  -d '{"storageKey":"profiles/docker-user.jpg","visibility":"public"}'

grep -q '"visibility":"public"' /tmp/route-body.json && pass "PATCH /me/profile-photo visibility" || fail "PATCH /me/profile-photo" "$(cat /tmp/route-body.json)"

echo ""
echo "--- Auth (JWT login / refresh / admin) ---"
expect_status "POST /auth/refresh (invalid body -> 400)" 400 \
  -X POST "${api_url}/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d '{}'

expect_status "POST /auth/logout (invalid body -> 400)" 400 \
  -X POST "${api_url}/auth/logout" \
  -H 'Content-Type: application/json' \
  -d '{"extra":true}'

expect_status "POST /auth/login (invalid credentials -> 401)" 401 \
  -X POST "${api_url}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"email\":\"${user_email}\",\"password\":\"wrong-password-12\"}"

expect_status "POST /auth/login (valid -> 200)" 200 \
  -X POST "${api_url}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"email\":\"${user_email}\",\"password\":\"${user_password}\"}"

access_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['accessToken'])")"
refresh_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['refreshToken'])")"
grep -q '"tokenType":"Bearer"' /tmp/route-body.json && pass "POST /auth/login returns Bearer tokens" || fail "POST /auth/login tokenType" "$(cat /tmp/route-body.json)"

expect_status "GET /user-accounts/me (JWT access -> 200)" 200 \
  -H "Authorization: Bearer ${access_token}" \
  "${api_url}/user-accounts/me"

expect_status "GET /admin/audit-summary (no auth -> 401)" 401 \
  "${api_url}/admin/audit-summary"

expect_status "GET /admin/moderation-queue (no auth -> 401)" 401 \
  "${api_url}/admin/moderation-queue"

expect_status "GET /admin/audit-summary (no admin role -> 403)" 403 \
  -H "Authorization: Bearer ${access_token}" \
  "${api_url}/admin/audit-summary"

expect_status "GET /admin/moderation-queue (no moderator role -> 403)" 403 \
  -H "Authorization: Bearer ${access_token}" \
  "${api_url}/admin/moderation-queue"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -c \
  "INSERT INTO user_account_roles (user_account_id, city_id, role) VALUES ('${user_account_id}', '${city_id}', 'security_audit') ON CONFLICT DO NOTHING;" >/dev/null

expect_status "POST /auth/login (security_audit user -> 200)" 200 \
  -X POST "${api_url}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"email\":\"${user_email}\",\"password\":\"${user_password}\"}"

audit_access_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['accessToken'])")"

expect_status "GET /admin/audit-summary (security_audit -> 200)" 200 \
  -H "Authorization: Bearer ${audit_access_token}" \
  "${api_url}/admin/audit-summary"

python3 -c "import json; b=json.load(open('/tmp/route-body.json')); exit(0 if b.get('status')=='ok' and 'totalEntries' in b else 1)" \
  && pass "GET /admin/audit-summary body" \
  || fail "GET /admin/audit-summary body" "$(cat /tmp/route-body.json)"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -c \
  "INSERT INTO user_account_roles (user_account_id, city_id, role) VALUES ('${user_account_id}', '${city_id}', 'moderator') ON CONFLICT DO NOTHING;" >/dev/null

expect_status "POST /auth/login (moderator user -> 200)" 200 \
  -X POST "${api_url}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"email\":\"${user_email}\",\"password\":\"${user_password}\"}"

moderator_access_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['accessToken'])")"

expect_status "GET /admin/moderation-queue (moderator -> 200)" 200 \
  -H "Authorization: Bearer ${moderator_access_token}" \
  "${api_url}/admin/moderation-queue"

python3 -c "import json; b=json.load(open('/tmp/route-body.json')); exit(0 if b.get('status')=='ok' and 'pendingReviewCount' in b else 1)" \
  && pass "GET /admin/moderation-queue body" \
  || fail "GET /admin/moderation-queue body" "$(cat /tmp/route-body.json)"

expect_status "POST /auth/refresh (valid -> 200)" 200 \
  -X POST "${api_url}/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"${refresh_token}\"}"

new_refresh_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['refreshToken'])")"
grep -q '"accessToken":' /tmp/route-body.json && pass "POST /auth/refresh returns new access token" || fail "POST /auth/refresh body" "$(cat /tmp/route-body.json)"

expect_status "POST /auth/logout (valid -> 200)" 200 \
  -X POST "${api_url}/auth/logout" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"${new_refresh_token}\"}"

expect_status "POST /auth/refresh (revoked -> 401)" 401 \
  -X POST "${api_url}/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"${new_refresh_token}\"}"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -c \
  "INSERT INTO user_account_roles (user_account_id, city_id, role) VALUES ('${user_account_id}', '${city_id}', 'city_admin') ON CONFLICT DO NOTHING;" >/dev/null

expect_status "POST /auth/login (admin user -> 200)" 200 \
  -X POST "${api_url}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"cityId\":\"${city_id}\",\"email\":\"${user_email}\",\"password\":\"${user_password}\"}"

admin_access_token="$(python3 -c "import json; print(json.load(open('/tmp/route-body.json'))['accessToken'])")"

expect_status "GET /admin/audit-summary (city_admin -> 200)" 200 \
  -H "Authorization: Bearer ${admin_access_token}" \
  "${api_url}/admin/audit-summary"

python3 -c "import json; b=json.load(open('/tmp/route-body.json')); exit(0 if b.get('status')=='ok' and 'totalEntries' in b else 1)" \
  && pass "GET /admin/audit-summary city_admin body" \
  || fail "GET /admin/audit-summary city_admin body" "$(cat /tmp/route-body.json)"

expect_status "GET /admin/moderation-queue (city_admin -> 200)" 200 \
  -H "Authorization: Bearer ${admin_access_token}" \
  "${api_url}/admin/moderation-queue"

expect_status "GET /user-accounts/me (city mismatch header -> 403)" 403 \
  -H "Authorization: Bearer ${admin_access_token}" \
  -H "x-city-id: 01932f1a-0000-7000-8000-000000000099" \
  "${api_url}/user-accounts/me"

echo ""
echo "--- User account erasure (LGPD) ---"
expect_status "DELETE /user-accounts/me (no session -> 401)" 401 \
  -X DELETE "${api_url}/user-accounts/me"

expect_status "DELETE /user-accounts/me (valid -> 204)" 204 \
  -X DELETE "${api_url}/user-accounts/me" \
  -H "Authorization: Bearer ${admin_access_token}"

[[ ! -s /tmp/route-body.json ]] && pass "DELETE /user-accounts/me empty body" \
  || fail "DELETE /user-accounts/me body not empty" "$(cat /tmp/route-body.json)"

expect_status "GET /user-accounts/me (after erasure -> 200 deleted)" 200 \
  -H "Authorization: Bearer ${admin_access_token}" \
  "${api_url}/user-accounts/me"

grep -q '"status":"deleted"' /tmp/route-body.json && pass "GET /me after erasure status deleted" \
  || fail "GET /me after erasure status" "$(cat /tmp/route-body.json)"
grep -q 'anonymous.local' /tmp/route-body.json && pass "GET /me after erasure anonymized email" \
  || fail "GET /me after erasure email" "$(cat /tmp/route-body.json)"

docker compose -f "${compose_base}" -f "${compose_api}" -p "${project}" exec -T postgres \
  psql -U sentinel -d sorriso_sentinel -tAc \
  "SELECT status FROM user_accounts WHERE id = '${user_account_id}';" \
  | grep -q deleted \
  && pass "DELETE /me persisted deleted status" \
  || fail "DELETE /me persisted deleted status"

echo ""
echo "==> Summary: ${passed} passed, ${failed} failed"

if [[ "${failed}" -gt 0 ]]; then
  exit 1
fi

echo "All API routes validated in Docker."
