# Anonymity Module

**Bounded context:** Identity & Privacy  
**Status:** spec complete (implementation not started)  
**ADR:** [0004 — Privacy by default](../../adr/0004-privacy-by-default.md)

## One-line summary

Contributors use the platform **without registration by default**. The system tracks **reputation**, not people — unless the user explicitly opts into pseudonym or public identity.

## Problem this module solves

If reporting a pothole requires an account, people report potholes. If reporting crime requires real identity, **nobody reports crime**. Anonymity is not a nice-to-have — it is the precondition for sensitive civic intelligence.

## Core concepts

| Term | Meaning |
|------|---------|
| **Anonymous session** | Ephemeral client session (device key or session token) — no email/phone |
| **Ghost mode** | Default identity mode — no display name on contributions |
| **Pseudonym mode** | User-chosen handle (e.g. `JoaoDoCentro`) — no verified real name |
| **Public mode** | Optional linked profile with display name |
| **Reputation ID** | System identifier (`Rep-8F29A`) for scoring — never shown raw to community |
| **Contributor reference** | Internal link between action and reputation ID — never contributor GPS |

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | What each actor **can and cannot** do |
| [flows.md](flows.md) | Session bootstrap, mode selection, sensitive reporting |
| [domain-model.md](domain-model.md) | Aggregates, VOs, events, ports |
| [tdd-plan.md](tdd-plan.md) | Red → Green → Refactor test order |

## Relationship to other modules

```text
Anonymity (Identity & Privacy)
    │
    ├── supplies reputationId to ──▶ Occurrences (author reference only)
    │                                    ▲
    │                                    │ ContributorRef required
    └── see Occurrence creation ─────────┘  [occurrence-creation](../occurrence-creation/README.md)
    ├── constrains visibility in ──▶ Validation (comments, confirms)
    ├── triggers rules in ──────────▶ Media (EXIF strip — worker)
    └── enforced by ────────────────▶ Security (RLS, audit roles)
```

Principles 1–5, 7, 11–15 from [privacy and identity](../../system/privacy-and-identity.md) are **implemented here**. Principles 6 (photos) and 8–10 (trust/consensus/encryption) belong to sibling modules but **anonymity defines the constraints they must respect**.

## Implementation map (future code)

| Layer | Path |
|-------|------|
| Domain | `packages/domain/src/identity/` |
| Shared schemas | `packages/shared/src/identity/` |
| API slice | `apps/api/src/features/identity/` |
| DB | `packages/database` — `contributors`, `identity_modes`, RLS |
| Web/Mobile | identity mode selector on report flow |

## Out of scope (v1)

- OAuth as sole login
- Real-name verification (KYC)
- Cross-city identity federation
- Recovering ghost sessions without local key backup
