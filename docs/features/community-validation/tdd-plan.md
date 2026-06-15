# Community Validation — TDD Plan

**Prerequisites:** [Occurrence creation](../occurrence-creation/tdd-plan.md) Step 3+ (Occurrence aggregate exists). [Anonymity](../anonymity/tdd-plan.md) ContentPolicy + ContributorRef (stub ok).

## Vertical slice order

```text
Step 1  Validation VOs + policies (self, duplicate)
Step 2  ConfidenceCalculator + StatusTransitionService
Step 3  Occurrence.recordConfirmation / recordDenial
Step 4  OccurrenceComment aggregate
Step 5  Shared Zod schemas
Step 6  Handlers (confirm, deny, comment) — unit mocked
Step 7  API integration + migration 0003
Step 8  Rate limits + security negatives
```

---

## Step 1 — Policies and VOs

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 1.1 | `should_forbid_self_confirmation` | INV-V1 | unit |
| 1.2 | `should_forbid_self_denial` | INV-V1 | unit |
| 1.3 | `should_detect_duplicate_vote` | INV-V2 | unit |
| 1.4 | `should_reject_comment_text_over_1000_chars` | — | unit |
| 1.5 | `should_parse_validation_policy_defaults` | thresholds | unit |

**Green:** `self-validation.policy.ts`, `duplicate-vote.policy.ts`, VOs.

---

## Step 2 — Confidence and status services

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 2.1 | `should_increase_confidence_on_confirm_with_full_weight` | V1 | unit |
| 2.2 | `should_decrease_confidence_on_deny` | V2 | unit |
| 2.3 | `should_clamp_confidence_at_zero` | — | unit |
| 2.4 | `should_clamp_confidence_at_100` | — | unit |
| 2.5 | `should_apply_reduced_weight_for_new_reputation` | INV-V3 | unit |
| 2.6 | `should_transition_unverified_to_under_review_on_first_vote` | — | unit |
| 2.7 | `should_not_promote_to_active_with_single_confirm` | INV-V9 | unit |
| 2.8 | `should_promote_to_active_when_threshold_met` | consensus | unit |
| 2.9 | `should_transition_to_low_confidence_when_below_floor` | — | unit |
| 2.10 | `should_use_higher_threshold_for_sensitive_category` | — | unit |

**Green:** `confidence-calculator.ts`, `status-transition.service.ts`.

---

## Step 3 — Occurrence aggregate validation methods

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 3.1 | `should_emit_occurrence_confirmed_event` | — | unit |
| 3.2 | `should_emit_occurrence_denied_event` | — | unit |
| 3.3 | `should_emit_confidence_changed_event` | — | unit |
| 3.4 | `should_increment_version_on_confirm` | INV-V10 | unit |
| 3.5 | `should_reject_confirm_on_resolved_occurrence` | INV-V7 | unit |
| 3.6 | `should_reject_confirm_when_self_validation` | INV-V1 | unit |
| 3.7 | `should_not_change_confidence_on_comment` | INV-V4 | unit |

**Green:** Extend `occurrence.entity.ts`.

---

## Step 4 — OccurrenceComment aggregate

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 4.1 | `should_create_comment_with_valid_text` | — | unit |
| 4.2 | `should_reject_comment_with_doxxing` | INV-V5 | unit |
| 4.3 | `should_emit_comment_added_event` | — | unit |
| 4.4 | `should_allow_reply_with_parent_comment_id` | — | unit |

**Green:** `occurrence-comment.entity.ts`.

---

## Step 5 — Shared schemas

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 5.1 | `should_require_version_on_confirm` | INV-V10 | unit |
| 5.2 | `should_reject_confidence_in_confirm_payload` | — | unit |
| 5.3 | `should_reject_extra_fields_on_deny` | strict | unit |

**Green:** `packages/shared/src/validation/*.schema.ts`.

---

## Step 6 — Handlers (mocked)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 6.1 | `should_load_occurrence_and_save_vote_on_confirm` | — | unit |
| 6.2 | `should_return_409_when_version_stale` | INV-V10 | unit |
| 6.3 | `should_map_sensitive_comment_without_author` | INV-V6 | unit |
| 6.4 | `should_call_content_policy_before_persist_comment` | INV-V5 | unit |

**Green:** `confirm-occurrence.handler.ts`, `deny-occurrence.handler.ts`, `add-comment.handler.ts`.

---

## Step 7 — API integration

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 7.1 | `should_return_401_when_confirm_without_session` | — | integration |
| 7.2 | `should_return_403_when_confirming_own_occurrence` | INV-V1 | integration |
| 7.3 | `should_return_403_on_second_vote_same_occurrence` | INV-V2 | integration |
| 7.4 | `should_increase_confidence_after_confirm` | — | integration |
| 7.5 | `should_reach_active_after_five_distinct_confirms` | INV-V9 | integration |
| 7.6 | `should_return_403_when_voting_on_resolved` | INV-V7 | integration |
| 7.7 | `should_return_403_when_occurrence_in_other_city` | INV-V8 | integration |
| 7.8 | `should_persist_comment_and_return_201` | — | integration |
| 7.9 | `should_return_400_on_doxxing_comment` | INV-V5 | integration |
| 7.10 | `should_enforce_unique_vote_constraint_in_database` | INV-V2 | integration |

**Green:** Controllers + migration `0003_community_validation.sql`.

---

## Step 8 — Abuse and security

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 8.1 | `should_return_429_on_validation_rate_limit_exceeded` | INV-V11 | integration |
| 8.2 | `should_not_include_voter_id_in_public_confirm_response` | INV-V12 | integration |
| 8.3 | `should_not_log_voter_pseudonym_on_sensitive_confirm` | privacy | integration |

---

## Stub strategy

```typescript
// ReputationPort until Reputation module exists
getTrustWeight(): TrustWeight => TrustWeight.full(1.0)

// For INV-V3 tests — pass `isNewContributor: true` in port mock
```

---

## Security phase gate mapping

| Gate | Tests |
|------|-------|
| Phase 4 — Community validation | 3.x, 7.x, 8.x |
| Optimistic locking | 3.4, 6.2, 7.x version |
| State machine invalid transitions | 3.5, 7.6 |
| Self-validation block | 1.1, 3.6, 7.2 |

---

## Definition of done (community validation v1)

- [ ] Tests 1.1–8.3 green
- [ ] `POST confirm/deny`, `POST comments` routes live
- [ ] Migration 0003 in `docker-validate`
- [ ] Consensus promotion to `active` proven with 5 confirms integration test
- [ ] [Business rules](business-rules.md) matrix covered

---

## Suggested first RED test

```text
packages/domain/src/validation/self-validation.policy.spec.ts

should_forbid_self_confirmation
```

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Security phase gate — Phase 4](../../security/phase-gate-checklist.md#phase-4--community-validation-confirm--deny--comment)
