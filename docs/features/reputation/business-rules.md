# Reputation — Business Rules

Rules for **trust score calculation**, **trust weight** for validation, and **public labels**. Personal identity display remains in [Anonymity](../anonymity/README.md).

## Actors

| Actor | Sees trust score (numeric) | Sees public label | Sees reputation ID |
|-------|---------------------------|-------------------|-------------------|
| **Visitor** | ❌ | ⚠️ on contributions only | ❌ |
| **Contributor (self)** | ⚠️ private summary on device | ✅ own label | ⚠️ own only — opaque token |
| **Other contributors** | ❌ | ⚠️ label only | ❌ |
| **Moderator** | ⚠️ aggregate bands — not precise gaming vector | ✅ | ⚠️ internal tools only |
| **Security audit** | ✅ full | ✅ | ✅ |
| **Public API** | ❌ **never** | ✅ enum label only | ❌ |

> **Rule R0:** Raw `trustScore`, `accuracyRate`, and `reportCount` are **forbidden** in public JSON responses.

---

## Permissions matrix

### Read reputation

| Action | Visitor | Contributor | Moderator | Public API |
|--------|---------|-------------|-----------|------------|
| View global leaderboard by name | ❌ | ❌ | ❌ | ❌ |
| View global leaderboard by score | ❌ | ❌ | ❌ | ❌ |
| View `trustedSourceLabel` on a report | ✅ | ✅ | ✅ | ✅ |
| View own private accuracy summary | ❌ | ✅ (device) | — | ⚠️ `GET /me/reputation` auth only |
| View another user's score | ❌ | ❌ | ⚠️ band only | ❌ |
| Export reputation history | ❌ | ⚠️ own | ✅ audit | ❌ |

### Write / system

| Action | Who | Notes |
|--------|-----|-------|
| Manually set trust score | ❌ humans | System-only via domain rules |
| Boost score via payment | ❌ | — |
| Reset score on identity rotation | ❌ | Score follows `reputationId` |
| Recalculate on outcome event | ✅ system worker | Idempotent |

---

## Scoring rules

### What increases trust

| Event | Effect |
|-------|--------|
| Reported occurrence reaches `active` | Pending outcome → **correct** (+) |
| Reported occurrence `resolved` after being `active` | Reinforces correct (+) |
| Validator confirm on occurrence that stays `active` | Validator outcome **correct** (+) |
| Validator deny on occurrence that becomes `low_confidence` | Validator outcome **correct** (+) |

### What decreases trust

| Event | Effect |
|-------|--------|
| Reported occurrence ends `low_confidence` (community rejected) | Author outcome **incorrect** (−) |
| Validator confirmed but occurrence later `low_confidence` | Validator outcome **incorrect** (−) |
| Validator denied but occurrence reaches `active` | Validator outcome **incorrect** (−) |
| Sybil burst pattern (v2) | Cap weight — no direct score dump |

### Accuracy formula (v1)

```text
accuracyRate = correctOutcomes / max(totalOutcomes, 1)
trustScore   = round(accuracyRate × 100)
```

Weighted rolling window (v1): last **50 outcomes** per `city_id` — prevents ancient history domination.

> **Rule R1:** Volume alone does not increase trust — **accuracy** does.

### Maturity rules

| Condition | Trust weight cap | Label |
|-----------|------------------|-------|
| `createdAt` &lt; 24 hours ago | 0.5 | `new_source` |
| `totalOutcomes` &lt; 3 | 0.5 | `new_source` |
| Mature + score ≥ 80 | 1.0 | `trusted_source` |
| Mature + specialist rule | 1.0 | `trusted_local_source` |

> **Rule R2:** Maturity caps apply to **weight**, not to voting permission — new users can still confirm/deny.

---

## Specialist rules (v1 simplified)

| Type | Criteria (rolling 90 days) | Effect |
|------|---------------------------|--------|
| **Neighborhood specialist** | ≥ 10 correct outcomes in same neighborhood polygon | `trusted_local_source` in that area |
| **Category specialist** | ≥ 15 correct in same category | weight 1.0 in that category (v2) |

Specialists gain **weight**, not censorship rights. Denials still need consensus.

---

## Identity rotation

| Rule | Behavior |
|------|----------|
| **INV-R1** | `reputationId` unchanged on [identity rotation](../anonymity/flows.md#6-identity-rotation-reputation-preserved) |
| **INV-R2** | Trust score transfers with `reputationId` |
| **INV-R3** | Creating new session without rotation → **new** `reputationId` → fresh maturity |

---

## Domain invariants

| ID | Invariant |
|----|-----------|
| **INV-R1** | One `ReputationProfile` per `reputationId` per `city_id` |
| **INV-R2** | `trustScore` ∈ [0, 100] |
| **INV-R3** | Public label derived from score + maturity — not set by client |
| **INV-R4** | Outcome records are append-only — never deleted |
| **INV-R5** | Recalculation is idempotent per `outcomeEventId` |
| **INV-R6** | Trust weight returned to Validation is always ∈ [0.1, 1.0] |
| **INV-R7** | No PII stored on `ReputationProfile` |
| **INV-R8** | Sensitive-category participation does not expose extra identity in labels |

---

## API exposure (`trustedSourceLabel`)

| Enum value | User-visible text (i18n key) |
|------------|------------------------------|
| `new_source` | "New source" |
| `trusted_source` | "Trusted source" |
| `trusted_local_source` | "Trusted local source" |

Never return: `trustScore: 92`, `Rep-8F29A`, `accuracyRate: 0.92` on public endpoints.

### Private endpoint (authenticated contributor)

`GET /me/reputation` may return:

```json
{
  "trustedSourceLabel": "trusted_source",
  "privateSummary": {
    "accuracyPercent": 85,
    "resolvedContributions": 12
  }
}
```

No comparison to other users. No ranking.

---

## Anti-gaming

| Threat | Mitigation |
|--------|------------|
| Sybil accounts | Maturity cap 0.5 weight; consensus still required |
| Self-confirm rings | [Self-validation forbidden](../community-validation/business-rules.md) |
| Farming easy categories | Category-specific outcome tracking (v2 weighting) |
| Score sniping | Rolling window; async recalculation |

---

## Explicit non-goals (v1)

- Karma points / gamification UI
- "Top contributors this week"
- Linking reputation to real name publicly
- Negative public badges ("untrusted person")

---

## Enforcement layers

| Rule | Domain | API | Database |
|------|--------|-----|----------|
| INV-R0 | DTO mapper | strip fields | — |
| INV-R1 | aggregate | — | UNIQUE (`city_id`, `reputation_id`) |
| INV-R5 | outcome table | — | UNIQUE (`outcome_event_id`) |
| INV-R6 | `TrustWeight` VO | — | CHECK on weight |

---

## Related docs

- [Flows](flows.md)
- [Domain model](domain-model.md)
- [TDD plan](tdd-plan.md)
- [Community validation](../community-validation/business-rules.md)
