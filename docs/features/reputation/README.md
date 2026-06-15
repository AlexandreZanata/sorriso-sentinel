# Reputation Module

**Bounded context:** Identity & Reputation  
**Status:** spec complete (implementation not started)  
**Principle:** [Privacy #8 — Invisible trust score](../../system/privacy-and-identity.md)

## One-line summary

Every contributor has a **mandatory reputation identity** with an internal **accuracy-based trust score**. The community sees only aggregate labels like *"Trusted source"* — never raw scores or real names.

## Problem this module solves

Validation needs weighted consensus without exposing who is powerful. Reputation rewards **precision over volume** and resists Sybil attacks — without turning the platform into a popularity contest or doxxing leaderboard.

## Core concepts

| Term | Meaning |
|------|---------|
| **Reputation ID** | Stable internal key (`Rep-8F29A` / uuid) — binds to contributor, not PII |
| **Trust score** | 0–100 internal accuracy metric — **never public** |
| **Trust weight** | 0.1–1.0 multiplier passed to [Community validation](../community-validation/README.md) |
| **Trusted source label** | Public-facing enum: `new_source`, `trusted_source`, `trusted_local_source` |
| **Maturity** | New reputation IDs have capped weight until age/report threshold |
| **Specialist** | Emergent area expertise — affects label and weight, not moderation power |
| **Accuracy** | `validated_correct / validated_total` — not likes or followers |

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | Visibility rules, scoring, what users can/cannot see |
| [flows.md](flows.md) | Score updates, weight lookup, identity transfer |
| [domain-model.md](domain-model.md) | `ReputationProfile` aggregate, ports, events |
| [tdd-plan.md](tdd-plan.md) | Red → Green → Refactor test order |

## Dependencies

```text
Anonymity ──▶ ReputationIdentityAssigned (creates profile)
Occurrence creation ──▶ report authored (track pending outcome)
Community validation ──▶ confirms/denies (outcomes + TrustWeight consumer)
Reputation (this module)
     │
     └──▶ supplies TrustWeight + public label to Validation, Occurrences DTO mappers
```

## Trust weight bands (v1 defaults)

| Trust score (internal) | Trust weight | Public label |
|------------------------|--------------|--------------|
| New (&lt; 24h or &lt; 3 resolved outcomes) | 0.5 max | `new_source` |
| 50–79 | 0.75 | `trusted_source` |
| ≥ 80 | 1.0 | `trusted_source` |
| Area specialist (rule-based) | 1.0 | `trusted_local_source` |

Scores are **never** returned in public API — only labels.

## Implementation map (future code)

| Layer | Path |
|-------|------|
| Domain | `packages/domain/src/reputation/` |
| API slice | `apps/api/src/features/reputation/` |
| Worker (optional) | `apps/worker` — async recalculation on events |
| DB | `reputation_profiles`, `reputation_outcomes` |

## Out of scope (v1)

- Public leaderboards
- Exposing reputation ID to other users
- Paid reputation boosts
- Moderator-appointed badges
- Cross-city reputation federation

## Related docs

- [System — reputation and trust](../../system/reputation-and-trust.md)
- [Community validation](../community-validation/README.md)
- [Anonymity](../anonymity/README.md)
