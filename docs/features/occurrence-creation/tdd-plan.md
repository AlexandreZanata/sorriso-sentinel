# Occurrence Creation — TDD Plan

Depends on [Anonymity TDD plan](../anonymity/tdd-plan.md) steps 1–3 (ContributorRef, sensitive policy) for full integration — can stub `ContributorResolverPort` until those are green.

## Vertical slice order

```text
Step 1  Value objects (category, kind, privacy, description, confidence)
Step 2  ProblemLocation + geo privacy shift
Step 3  Occurrence.createNew() factory + invariants
Step 4  Extend OccurrenceCreatedEvent payload
Step 5  Shared Zod schema (.strict(), new fields)
Step 6  CreateOccurrenceHandler (unit with mocks)
Step 7  API integration + DB migration 0002
Step 8  Rate limit + security negative tests
```

---

## Step 1 — Value objects (`packages/domain`)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 1.1 | `should_accept_pothole_as_valid_category` | C1 | unit |
| 1.2 | `should_reject_unknown_category` | C1 | unit |
| 1.3 | `should_default_occurrence_kind_to_problem` | — | unit |
| 1.4 | `should_accept_temporary_event_kind_for_fair` | — | unit |
| 1.5 | `should_reject_confidence_level_not_zero_on_create` | INV-O2 | unit |
| 1.6 | `should_reject_description_longer_than_2000_chars` | — | unit |
| 1.7 | `should_parse_privacy_level_enum` | — | unit |

**Green:** `occurrence-category.vo.ts`, `occurrence-kind.vo.ts`, `privacy-level.vo.ts`, `occurrence-description.vo.ts`, `confidence-level.vo.ts`.

---

## Step 2 — Location privacy (`packages/geo`)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 2.1 | `should_keep_coordinates_when_privacy_is_public` | P1 | unit |
| 2.2 | `should_offset_coordinates_when_privacy_is_approximate` | approximate | unit |
| 2.3 | `should_offset_between_90_and_110_meters_for_default_approximate` | 100m | unit |
| 2.4 | `should_reject_invalid_latitude_on_problem_location` | INV-O3 | unit |
| 2.5 | `should_reject_invalid_longitude_on_problem_location` | INV-O3 | unit |

**Green:** `privacy-shift.ts` + `ProblemLocation` VO.

---

## Step 3 — Occurrence.createNew()

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 3.1 | `should_create_occurrence_with_status_unverified` | INV-O1 | unit |
| 3.2 | `should_create_occurrence_with_confidence_zero` | INV-O2 | unit |
| 3.3 | `should_create_occurrence_with_version_one` | INV-O9 | unit |
| 3.4 | `should_emit_occurrence_created_event` | INV-O10 | unit |
| 3.5 | `should_mark_crime_category_as_sensitive` | INV-O7 | unit |
| 3.6 | `should_apply_forced_ghost_for_sensitive_category` | INV-O7 | unit |
| 3.7 | `should_require_contributor_ref` | INV-O5 | unit |
| 3.8 | `should_reject_description_with_doxxing` | INV-O8 | unit |
| 3.9 | `should_apply_approximate_shift_on_create` | privacy | unit |

**Green:** Extend `occurrence.entity.ts` with `createNew()`; deprecate direct `create()` for writes.

---

## Step 4 — Domain event

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 4.1 | `should_not_include_contributor_ref_in_event_payload` | privacy | unit |
| 4.2 | `should_include_is_sensitive_flag_in_event_payload` | — | unit |

**Green:** Update `occurrence-created.event.ts`.

---

## Step 5 — Shared schema (`packages/shared`)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 5.1 | `should_reject_contributor_latitude_in_create_payload` | INV-O4 | unit |
| 5.2 | `should_reject_status_field_in_create_payload` | INV-O1 | unit |
| 5.3 | `should_reject_confidence_level_in_create_payload` | INV-O2 | unit |
| 5.4 | `should_reject_unknown_extra_properties` | strict | unit |
| 5.5 | `should_default_privacy_level_to_public` | — | unit |
| 5.6 | `should_accept_minimal_valid_create_payload` | — | unit |

**Green:** Update `create-occurrence.schema.ts` with `.strict()` and defaults.

---

## Step 6 — Application handler (mocked ports)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 6.1 | `should_resolve_city_id_from_session_when_body_omits_city_id` | C2 | unit |
| 6.2 | `should_reject_when_body_city_id_mismatches_session` | C2, INV-O6 | unit |
| 6.3 | `should_call_repository_save_once` | — | unit |
| 6.4 | `should_map_sensitive_response_without_author` | API response | unit |

**Green:** `create-occurrence.handler.ts`.

---

## Step 7 — API integration (`apps/api` + Docker Postgres)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 7.1 | `should_return_401_when_creating_without_session` | — | integration |
| 7.2 | `should_return_201_when_valid_ghost_session_creates_pothole` | matrix | integration |
| 7.3 | `should_persist_occurrence_with_unverified_status` | INV-O1 | integration |
| 7.4 | `should_return_400_when_contributor_gps_in_body` | INV-O4 | integration |
| 7.5 | `should_return_403_when_city_id_mismatches_tenant` | INV-O6 | integration |
| 7.6 | `should_return_400_for_invalid_category` | C1 | integration |
| 7.7 | `should_omit_author_on_crime_category_response` | INV-O7 | integration |
| 7.8 | `should_store_contributor_reputation_id_in_database` | INV-O5 | integration |
| 7.9 | `should_generate_uuidv7_primary_key` | ADR-0002 | integration |

**Green:** Controller + Drizzle adapter + migration `0002_occurrence_creation.sql`.

---

## Step 8 — Security and abuse

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 8.1 | `should_return_429_on_eleventh_create_in_one_hour` | INV-O11 | integration |
| 8.2 | `should_not_echo_raw_description_in_error_on_doxxing` | XSS/logs | integration |
| 8.3 | `should_not_log_contributor_ref_in_info_logs` | secrets | integration |

---

## Stub strategy (parallel work)

If Anonymity is not implemented yet:

```typescript
// test double
ContributorResolverPort.resolve() → fixed ContributorRef + ghost policy
```

Replace with real Identity integration when [anonymity Step 6](../anonymity/tdd-plan.md) is green.

---

## Security phase gate mapping

| Gate | Tests |
|------|-------|
| Phase 2 — Create Occurrence | 5.x, 7.x, 8.x |
| Universal — tenant isolation | 6.2, 7.5 |
| Universal — SQL injection | repository uses Drizzle only |
| Anonymity cross-ref | 7.7, 3.5, 3.6 |

---

## Definition of done (occurrence creation v1)

- [ ] Tests 1.1–8.3 green in CI
- [ ] `POST /occurrences` documented in OpenAPI or `docs/api/` stub
- [ ] Migration 0002 applied in `docker-validate`
- [ ] [Business rules](business-rules.md) matrix covered
- [ ] No `contributor_*` GPS columns in schema
- [ ] `OccurrenceCreated` published to outbox or event bus stub

---

## Suggested first RED test (start here)

```text
packages/domain/src/occurrences/occurrence.entity.spec.ts

should_create_occurrence_with_status_unverified
```

Write test → fail → implement `createNew()` minimal → green → continue 3.x series.

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Anonymity TDD plan](../anonymity/tdd-plan.md)
- [Security phase gate — Phase 2](../../security/phase-gate-checklist.md#phase-2--create-occurrence-write-path)
