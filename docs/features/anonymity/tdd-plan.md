# Anonymity — TDD Plan

Implementation order and test specifications. Follow **Red → Green → Refactor** for each row before moving on.

## Vertical slice order

```text
Step 1  Value objects (IdentityMode, Pseudonym, ReputationId)
Step 2  ContributorIdentity aggregate — session bootstrap
Step 3  SensitiveCategoryPolicy + AuthorDisplayPolicy
Step 4  ContentPolicyService (anti-doxxing)
Step 5  Shared Zod schemas
Step 6  API handlers + integration tests
Step 7  RLS policies (integration with Docker Postgres)
```

---

## Step 1 — Value objects (`packages/domain`)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 1.1 | `should_default_identity_mode_to_ghost` | INV-A1 | unit |
| 1.2 | `should_reject_pseudonym_shorter_than_3_characters` | INV-A6 | unit |
| 1.3 | `should_reject_pseudonym_with_doxxing_pattern` | INV-A8 | unit |
| 1.4 | `should_accept_valid_reputation_id_format` | — | unit |
| 1.5 | `should_reject_invalid_identity_mode_enum` | — | unit |

**Green:** Implement `identity-mode.vo.ts`, `pseudonym.vo.ts`, `reputation-id.vo.ts`.

---

## Step 2 — ContributorIdentity aggregate

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 2.1 | `should_assign_reputation_id_on_session_bootstrap` | INV-A2 | unit |
| 2.2 | `should_start_in_ghost_mode_on_bootstrap` | INV-A1 | unit |
| 2.3 | `should_change_mode_from_ghost_to_pseudonym` | business matrix | unit |
| 2.4 | `should_reject_pseudonym_mode_without_handle` | — | unit |
| 2.5 | `should_preserve_reputation_id_on_identity_rotation` | INV-A7 | unit |
| 2.6 | `should_reject_rotation_without_valid_cryptographic_proof` | INV-A7 | unit |

**Green:** `contributor-identity.entity.ts` + `ContributorIdentity.create()`, `changeMode()`, `rotate()`.

---

## Step 3 — Sensitive category policy

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 3.1 | `should_force_ghost_display_for_crime_category` | INV-A3, S1 | unit |
| 3.2 | `should_force_ghost_display_when_public_mode_user_reports_sensitive` | INV-A3 | unit |
| 3.3 | `should_allow_pseudonym_display_for_non_sensitive_pothole` | business matrix | unit |
| 3.4 | `should_return_forced_ghost_policy_object_for_sensitive_category` | — | unit |

**Green:** `sensitive-category-policy.ts`.

---

## Step 4 — Content policy (anti-doxxing)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 4.1 | `should_reject_comment_containing_cpf_pattern` | INV-A8 | unit |
| 4.2 | `should_reject_comment_containing_phone_pattern` | INV-A8 | unit |
| 4.3 | `should_reject_comment_containing_license_plate_pattern` | INV-A8 | unit |
| 4.4 | `should_accept_neutral_comment_text` | — | unit |
| 4.5 | `should_reject_pseudonym_that_is_a_full_name` | INV-A8 | unit |

**Green:** `content-policy.service.ts` with pluggable pattern list per city.

---

## Step 5 — Shared schemas (`packages/shared`)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 5.1 | `should_reject_bootstrap_payload_with_extra_fields` | security strict | unit |
| 5.2 | `should_reject_create_occurrence_with_contributor_gps_fields` | INV-A4, L1 | unit |
| 5.3 | `should_accept_valid_change_identity_mode_payload` | — | unit |

**Green:** Extend `create-occurrence.schema.ts` with `.strict()`; add `identity/*.schema.ts`.

---

## Step 6 — API integration (`apps/api`)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 6.1 | `should_bootstrap_session_without_authentication` | Rule A0, matrix | integration |
| 6.2 | `should_create_occurrence_as_ghost_without_registration` | core actions | integration |
| 6.3 | `should_return_400_when_contributor_gps_in_payload` | INV-A4 | integration |
| 6.4 | `should_omit_author_on_sensitive_occurrence_response` | S1 | integration |
| 6.5 | `should_return_409_when_pseudonym_already_taken` | INV-A6 | integration |
| 6.6 | `should_return_400_when_comment_contains_doxxing` | INV-A8 | integration |
| 6.7 | `should_return_403_when_accessing_another_city_contributor` | tenant | integration |
| 6.8 | `should_not_expose_reputation_id_raw_score_in_public_api` | Principle 8 | integration |

**Green:** `features/identity/*` handlers + `features/occurrences/create-occurrence` integration.

---

## Step 7 — Database / RLS

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 7.1 | `should_enforce_city_id_rls_on_contributors_table` | multitenancy | integration |
| 7.2 | `should_hide_contributor_ref_on_sensitive_occurrence_via_rls` | S1 | integration |
| 7.3 | `should_not_have_contributor_gps_column_on_occurrences` | schema guard | integration |

**Green:** Migration + `docker-validate` extension.

---

## Security phase gate mapping

| Phase gate section | Tests |
|--------------------|-------|
| Universal — no PII in logs | 6.x assert log snapshots in tests |
| Phase 2 — Create Occurrence | 5.2, 6.2, 6.3, 6.4 |
| Phase 6 — Authentication | 6.1, 2.x rotation |
| Phase 7 — Sensitive categories | 3.x, 6.4, 7.2 |

---

## Refactor checkpoints

After Step 2 green:

- Extract `AuthorDisplayPolicy` VO if branching duplicated
- Ensure `ContributorRef` factory is single entry point for Occurrences context

After Step 6 green:

- Map domain events to outbox table (future)
- Extract `IdentityPolicyPort` if Occurrences handler grows

---

## Definition of done (anonymity v1)

- [ ] All tests 1.1–7.3 green in CI
- [ ] [Business rules](business-rules.md) matrix implemented or explicitly deferred with issue link
- [ ] [Security phase gate](../../security/phase-gate-checklist.md) Phase 2 + 6 items checked
- [ ] No `contributor_latitude` / `contributor_longitude` in any schema
- [ ] ADR-0004 constraints traceable to test IDs in this file

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Testing TDD rule](../../../.cursor/rules/08-testing-tdd.mdc)
