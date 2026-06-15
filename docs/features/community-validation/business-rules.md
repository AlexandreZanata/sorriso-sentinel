# Community Validation — Business Rules

Rules for **confirm**, **deny**, and **comment** on existing occurrences. Confidence promotion to `active` is part of this module; evolution and resolution are separate.

## Actors

Same as [Anonymity](../anonymity/business-rules.md#actors). **Visitors** may read comments where policy allows — they cannot vote or comment.

---

## Permissions matrix

Legend: ✅ allowed · ❌ forbidden · ⚠️ conditional

### Validation votes (confirm / deny)

| Action | Visitor | Ghost | Pseudonym | Public | Moderator |
|--------|---------|-------|-----------|--------|-----------|
| `POST .../confirm` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST .../deny` | ❌ | ✅ | ✅ | ✅ | ✅ |
| Vote without session | ❌ | ❌ | ❌ | ❌ | ❌ |
| Confirm own occurrence | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deny own occurrence | ❌ | ❌ | ❌ | ❌ | ❌ |
| Second vote on same occurrence | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vote on `resolved` occurrence | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vote on soft-deleted occurrence | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vote on other city's occurrence | ❌ | ❌ | ❌ | ❌ | ❌ |
| Confirm and deny same occurrence | ❌ | ❌ | ❌ | ❌ | ❌ |

### Comments

| Action | Visitor | Ghost | Pseudonym | Public | Moderator |
|--------|---------|-------|-----------|--------|-----------|
| `POST .../comments` | ❌ | ✅ | ✅ | ✅ | ✅ |
| Read comments on public occurrence | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read comments on sensitive occurrence | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| See commenter identity on sensitive | ❌ | ❌ | ❌ | ❌ | ⚠️ audit only |
| See commenter pseudonym on sensitive | ❌ | ❌ | ❌ | ❌ | ❌ |
| Comment with doxxing content | ❌ | ❌ | ❌ | ❌ | ❌ |
| Unlimited comments same thread | ❌ | ⚠️ max 5/occurrence/session/day | | | |

### Moderator-only (v2 — document now, implement later)

| Action | Moderator |
|--------|-----------|
| Hide comment | ✅ |
| Force `under_review` | ✅ |
| Flag for security audit | ✅ |

---

## Payload rules

### Confirm / deny

| Field | Client may send | Notes |
|-------|-----------------|-------|
| `reason` | ⚠️ optional enum | `still_there`, `verified_locally`, `false_alarm`, … |
| `occurrenceId` | path param | UUID |
| `version` | ✅ recommended | Optimistic lock — INV-V10 |
| `confidenceLevel` | ❌ | Server recalculates |
| `status` | ❌ | Server transitions |

### Comment

| Field | Rule |
|-------|------|
| `text` | Required, 1–1000 chars |
| `parentCommentId` | Optional — one level reply (v1) |
| Author fields | ❌ — from session |

---

## Confidence and status rules

### Confidence changes

| Event | Confidence effect |
|-------|---------------------|
| Confirmation | `+ (basePoints × trustWeight)` — default base 20 |
| Denial | `− (basePoints × trustWeight)` — default base 25 |
| Cap | 0–100 inclusive |

**Rule V1:** Confidence cannot increase without a `Confirmation` record.  
**Rule V2:** Confidence cannot decrease without a `Denial` record.  
(Aligns with [lifecycle invariants](../../system/occurrence-lifecycle.md#aggregate-invariants).)

### Status transitions triggered by validation

| From | Condition | To |
|------|-----------|-----|
| `unverified` | First confirm or deny | `under_review` |
| `under_review` | `confidenceLevel` ≥ threshold AND distinct confirms ≥ min | `active` |
| `under_review` | `confidenceLevel` ≤ floor | `low_confidence` |
| `low_confidence` | Recovery: confidence > floor AND threshold met | `active` |
| `active` | New denials drop below floor | `low_confidence` |
| any terminal | `resolved` | no transitions from validation |

### Consensus thresholds

| Category type | Min distinct confirmations | Min weighted score |
|---------------|---------------------------|-------------------|
| Standard | 5 | 100 (e.g. 5 × 20 × 1.0) |
| Sensitive | 8 | 160 (stricter) |
| `temporary_event` | 3 | 60 (fairs — lower bar) |

> **Rule V3:** A single confirmation **never** promotes to `active` — `distinctConfirmCount` must meet minimum.

### Anti-gaming

| Rule | ID | Description |
|------|-----|-------------|
| No self-validation | INV-V1 | Reporter `reputationId` ≠ voter |
| One vote per contributor | INV-V2 | Unique (`occurrenceId`, `reputationId`) |
| Sybil cap | INV-V3 | Votes from accounts &lt; 24h old count at 0.5 weight max |
| Collusion hint (v2) | — | Same IP burst flagged — not blocking v1 |

---

## Domain invariants

| ID | Invariant |
|----|-----------|
| **INV-V1** | Contributor cannot confirm or deny own occurrence |
| **INV-V2** | At most one vote (confirm OR deny) per `reputationId` per occurrence |
| **INV-V3** | New reputation IDs use reduced trust weight until maturity |
| **INV-V4** | Comments do not change confidence directly |
| **INV-V5** | Comment text passes anti-doxxing filter |
| **INV-V6** | Sensitive occurrence comments hide commenter in public DTO |
| **INV-V7** | Validation only when `status` ∉ {`resolved`} and not soft-deleted |
| **INV-V8** | `cityId` of occurrence must match session tenant |
| **INV-V9** | `active` requires consensus threshold — never single-vote promotion |
| **INV-V10** | Optimistic lock: stale `version` → `409 CONFLICT` |
| **INV-V11** | Rate limit: 30 validation actions per session per hour |
| **INV-V12** | Events must not include voter pseudonym on sensitive threads |

---

## Rate limits

| Action | Limit | Window |
|--------|-------|--------|
| Confirm + deny combined | 30 | 1 hour / session |
| Comments | 20 | 1 hour / session |
| Same occurrence comments | 5 | 24 hours / session |

See [rate limiting](../../security/rate-limiting-and-abuse.md).

---

## API response rules

### After confirm/deny

| Field | Public response |
|-------|-----------------|
| `confidenceLevel` | ✅ updated |
| `status` | ✅ if changed |
| `version` | ✅ incremented |
| `confirmationCount` | ✅ aggregate count only |
| Voter identity | ❌ |
| Individual vote list | ❌ on public API (moderator read model separate) |

### Comment response

| Field | Standard | Sensitive |
|-------|----------|-----------|
| `id`, `text`, `createdAt` | ✅ | ✅ |
| `authorPseudonym` | ⚠️ per identity mode | ❌ |
| `trustedSourceLabel` | ⚠️ optional | ⚠️ optional |

---

## Explicit non-goals (v1)

- Public vote leaderboard per occurrence
- Downvoting comments
- Editing comments after post
- Validator identity exposed for sensitive categories

---

## Enforcement layers

| Rule | Domain | API | Database |
|------|--------|-----|----------|
| INV-V1, V2 | `Occurrence.recordVote` | 403 | UNIQUE vote constraint |
| INV-V5 | `ContentPolicyService` | 400 | — |
| INV-V10 | `version` check | 409 | `version` column |
| INV-V8 | Handler | 403 | RLS |
| INV-V11 | Throttler | 429 | — |

---

## Related docs

- [Flows](flows.md)
- [Domain model](domain-model.md)
- [TDD plan](tdd-plan.md)
- [Occurrence creation](../occurrence-creation/business-rules.md)
- [Anonymity](../anonymity/business-rules.md)
