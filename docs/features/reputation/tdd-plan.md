# Reputation — TDD Plan

**Prerequisites:** [Anonymity](../anonymity/tdd-plan.md) Step 2 (`reputationId` assignment). [Community validation](../community-validation/tdd-plan.md) defines `ReputationPort` consumer tests — replace stub when this module is green.

## Vertical slice order

```text
Step 1  Value objects (TrustScore, TrustWeight, TrustedSourceLabel, Maturity)
Step 2  AccuracyCalculator + TrustWeightCalculator + PublicLabelResolver
Step 3  ReputationProfile aggregate + recordOutcome
Step 4  ReputationOutcome idempotency
Step 5  ReputationPort adapter
Step 6  OnReputationAssigned handler + migration 0004
Step 7  Worker outcome recording on status change
Step 8  GET /me/reputation + public DTO mapper tests
```

---

## Step 1 — Value objects

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 1.1 | `should_reject_trust_score_below_zero` | INV-R2 | unit |
| 1.2 | `should_reject_trust_score_above_100` | INV-R2 | unit |
| 1.3 | `should_clamp_trust_weight_to_minimum_0_1` | INV-R6 | unit |
| 1.4 | `should_clamp_trust_weight_to_maximum_1_0` | INV-R6 | unit |
| 1.5 | `should_parse_trusted_source_label_enum` | INV-R3 | unit |
| 1.6 | `should_mark_maturity_new_when_less_than_24_hours` | Rule R2 | unit |
| 1.7 | `should_mark_maturity_new_when_fewer_than_3_outcomes` | Rule R2 | unit |

**Green:** `packages/domain/src/reputation/value-objects/`.

---

## Step 2 — Domain services

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 2.1 | `should_compute_accuracy_from_correct_and_total_outcomes` | R1 | unit |
| 2.2 | `should_apply_rolling_window_of_50_outcomes` | — | unit |
| 2.3 | `should_return_weight_0_5_for_new_maturity` | Rule R2 | unit |
| 2.4 | `should_return_weight_0_75_for_score_between_50_and_79` | — | unit |
| 2.5 | `should_return_weight_1_0_for_score_80_or_higher` | — | unit |
| 2.6 | `should_resolve_public_label_new_source_for_immature_profile` | INV-R3 | unit |
| 2.7 | `should_resolve_public_label_trusted_source_for_high_score` | INV-R3 | unit |
| 2.8 | `should_resolve_trusted_local_source_when_specialist_tag_present` | specialist | unit |

**Green:** `trust-weight-calculator.ts`, `accuracy-calculator.ts`, `public-label-resolver.ts`.

---

## Step 3 — ReputationProfile aggregate

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 3.1 | `should_create_profile_with_zero_trust_score` | — | unit |
| 3.2 | `should_emit_reputation_profile_created_event` | — | unit |
| 3.3 | `should_increase_correct_count_on_positive_outcome` | scoring | unit |
| 3.4 | `should_increase_incorrect_count_on_negative_outcome` | scoring | unit |
| 3.5 | `should_recalculate_trust_score_after_outcome` | R1 | unit |
| 3.6 | `should_emit_reputation_score_updated_on_change` | — | unit |
| 3.7 | `should_not_store_pii_on_profile` | INV-R7 | unit |

**Green:** `reputation-profile.entity.ts`.

---

## Step 4 — Outcome idempotency

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 4.1 | `should_ignore_duplicate_source_event_id` | INV-R5 | unit |
| 4.2 | `should_append_outcome_when_new_event_id` | INV-R4 | unit |

**Green:** `reputation-outcome.entity.ts` + repository contract tests.

---

## Step 5 — ReputationPort adapter

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 5.1 | `should_return_trust_weight_for_existing_reputation` | — | unit |
| 5.2 | `should_return_default_weight_when_profile_missing` | edge | unit |
| 5.3 | `should_return_public_label_without_trust_score` | INV-R0 | unit |

**Green:** `reputation.port.adapter.ts` — unblocks community-validation integration.

---

## Step 6 — Bootstrap + DB

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 6.1 | `should_create_profile_on_reputation_identity_assigned` | INV-R1 | integration |
| 6.2 | `should_enforce_unique_city_reputation_pair` | INV-R1 | integration |
| 6.3 | `should_preserve_profile_on_identity_rotation` | INV-R1 rotation | integration |

**Green:** `on-reputation-assigned.handler.ts` + migration `0004_reputation.sql`.

---

## Step 7 — Worker outcomes

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 7.1 | `should_record_correct_outcome_when_author_report_becomes_active` | scoring | integration |
| 7.2 | `should_record_incorrect_outcome_when_report_low_confidence` | scoring | integration |
| 7.3 | `should_record_validator_outcome_on_terminal_state` | — | integration |
| 7.4 | `should_not_double_count_outcome_on_duplicate_event` | INV-R5 | integration |

**Green:** `apps/worker/src/jobs/recalculate-reputation-on-status.ts`.

---

## Step 8 — API exposure

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 8.1 | `should_return_private_summary_on_get_me_reputation` | — | integration |
| 8.2 | `should_never_expose_trust_score_on_public_occurrence_dto` | INV-R0 | integration |
| 8.3 | `should_include_trusted_source_label_on_public_occurrence_dto` | — | integration |
| 8.4 | `should_return_401_on_get_me_reputation_without_session` | — | integration |
| 8.5 | `should_not_allow_querying_other_user_reputation_by_id` | IDOR | integration |

**Green:** `get-my-reputation.controller.ts` + occurrence response mapper update.

---

## Integration with Community validation

When Step 5 is green, update community-validation tests:

| Test | Change |
|------|--------|
| `should_apply_reduced_weight_for_new_reputation` | Use real port — expect 0.5 |
| `should_reach_active_after_five_distinct_confirms` | Optional: mix of weights |

Remove `getTrustWeight(): 1.0` stub.

---

## Security phase gate mapping

| Concern | Tests |
|---------|-------|
| No PII in reputation store | 3.7, 6.x |
| No score on public API | 8.2 |
| IDOR | 8.5 |
| Privacy principle 8 | 8.2, 8.3 |

---

## Definition of done (reputation v1)

- [ ] Tests 1.1–8.5 green
- [ ] `ReputationPort` wired in validation handlers
- [ ] Migration 0004 in `docker-validate`
- [ ] Worker processes `OccurrenceStatusChanged`
- [ ] Public occurrence API exposes label only — never numeric score
- [ ] [Business rules](business-rules.md) matrix covered

---

## Suggested first RED test

```text
packages/domain/src/reputation/trust-weight-calculator.spec.ts

should_return_weight_0_5_for_new_maturity
```

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Community validation TDD](../community-validation/tdd-plan.md)
