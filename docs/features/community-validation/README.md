# Community Validation Module

**Bounded context:** Validation (orchestrates Occurrences + Comments)  
**Status:** spec complete · domain Steps 1–2 in implementation  
**ADR:** [0003 — Occurrence-centric domain](../../adr/0003-occurrence-centric-domain.md)

## One-line summary

Contributors **confirm**, **deny**, or **comment** on occurrences — building **consensus-driven confidence** before an occurrence becomes `active`. No single vote is trusted alone.

## Problem this module solves

Raw reports are unreliable. Community validation turns isolated claims into **trustworthy territorial memory** — weighted by invisible reputation, protected by anti-gaming rules, and safe for anonymous participants.

## Core concepts

| Term | Meaning |
|------|---------|
| **Confirmation** | Contributor attests the occurrence is real / accurate |
| **Denial** | Contributor attests the occurrence is false / inaccurate |
| **Comment** | Text context — filtered for doxxing; not a vote |
| **Validation vote** | One confirm **or** deny per contributor per occurrence (v1) — **not** a star rating |
| **Confidence level** | 0–100% on the occurrence — derived from weighted votes |
| **Consensus threshold** | Minimum independent confirmations to reach `active` |
| **Trust weight** | Invisible multiplier from reputation — [reputation doc](../../system/reputation-and-trust.md) |
| **Self-validation** | Reporter confirming own report — **forbidden** |

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | Permissions, thresholds, forbidden actions |
| [flows.md](flows.md) | Confirm, deny, comment sequences |
| [domain-model.md](domain-model.md) | Aggregates, domain services, events |
| [tdd-plan.md](tdd-plan.md) | Red → Green → Refactor test order |

## Dependencies

```text
Anonymity ──────────▶ ContributorRef, ContentPolicy, display rules
Occurrence creation ▶ Occurrence aggregate (target of validation)
Reputation (port) ──▶ TrustWeight + public label — [reputation module](../reputation/README.md)
Community validation (this module)
     │
     ├──▶ emits OccurrenceConfirmed / Denied / ConfidenceChanged
     └──▶ Comment aggregate → CommentAdded
```

## Status transitions (validation slice)

```text
unverified ──first vote──▶ under_review
under_review ──denials──▶ low_confidence (if below floor)
under_review ──threshold met──▶ active
low_confidence ──recovery votes──▶ under_review | active
resolved / soft-deleted ──▶ no new votes (v1)
```

Full machine: [occurrence lifecycle](../../system/occurrence-lifecycle.md).

## Default thresholds (v1)

| Setting | Standard category | Sensitive category |
|---------|-------------------|-------------------|
| Min confirmations for `active` | 5 | 8 |
| Min distinct contributors | 5 | 8 |
| Confidence floor (deny triggers `low_confidence`) | ≤ 20% | ≤ 15% |
| Trust weight new contributor | 0.5 | 0.3 |
| Trust weight trusted | 1.0 | 1.0 |

Configurable per `city_id` via `ValidationPolicyPort`.

## Implementation map (future code)

| Layer | Path |
|-------|------|
| Domain — occurrence methods | `packages/domain/src/occurrences/` |
| Domain — comments | `packages/domain/src/validation/` |
| Shared schemas | `packages/shared/src/validation/` |
| API slices | `apps/api/src/features/validation/` |
| DB | `validation_votes`, `occurrence_comments` tables |

## Out of scope (v1)

- Photo evidence attach (Media module)
- Moderator override / force-active
- ML fraud detection
- Changing a vote after submit (immutable vote v1)
- Validation on `resolved` occurrences (Resolution module)

## Related docs

- [Security phase gate — Phase 4](../../security/phase-gate-checklist.md#phase-4--community-validation-confirm--deny--comment)
- [Reputation and trust](../../system/reputation-and-trust.md)
