# Occurrence Lifecycle

The **Occurrence** aggregate owns consistency for the full lifecycle. History is never lost — changes are appended, not overwritten.

## State machine

```text
                    ┌──────────────────┐
                    │  Unverified      │◀── creation
                    └────────┬─────────┘
                             │ community validation
                             ▼
                    ┌──────────────────┐
         ┌─────────│  Under review    │─────────┐
         │         └────────┬─────────┘         │
    denials               │ confirmations      │
         │                 ▼                    │
         │         ┌──────────────────┐        │
         └────────▶│  Low confidence  │        │
                   └────────┬─────────┘        │
                            │ threshold met     │
                            ▼                   │
                   ┌──────────────────┐        │
                   │  Active          │◀───────┘
                   └────────┬─────────┘
                            │ evolution / updates
                            ▼
                   ┌──────────────────┐
                   │  Evolved         │ (e.g. small pothole → street closed)
                   └────────┬─────────┘
                            │ resolution confirmed
                            ▼
                   ┌──────────────────┐
                   │  Resolved        │
                   └──────────────────┘
```

Statuses are domain values — exact enum names defined in code during implementation.

## 1. Creation

A contributor reports an occurrence. It is born as:

| Field | Initial value |
|-------|---------------|
| Status | `Unverified` |
| Confidence level | `0%` |
| Author visibility | Per privacy level (see [privacy doc](privacy-and-identity.md)) |

**Domain event**: `OccurrenceCreated`

> **Implementation detail:** [Occurrence creation feature module](../features/occurrence-creation/README.md) — permissions, flows, domain factory, TDD plan.

## 2. Community validation

Other contributors can:

| Action | Effect |
|--------|--------|
| **Confirm** | Increases confidence |
| **Deny** | Decreases confidence |
| **Add photos** | Evidence (anonymized before storage) |
| **Comment** | Context (anti-doxxing filters applied) |

**Never trust a single person** — consensus required. See Principle 9 in [privacy and identity](privacy-and-identity.md).

> **Implementation detail:** [Community validation feature module](../features/community-validation/README.md) — permissions, confidence rules, domain methods, TDD plan.

**Domain events**: `OccurrenceConfirmed`, `OccurrenceDenied`, `EvidenceAttached`, `CommentAdded`

## 3. Confidence gain

As independent validations accumulate:

```text
Confidence level: 0% → 100%
```

Rules (domain service):

- Minimum independent confirmations before `Active` (e.g. 5 — configurable per category)
- Weighted by contributor trust score (invisible to community)
- Sensitive categories may require higher thresholds

**Domain event**: `OccurrenceConfidenceChanged`

## 4. Evolution

Occurrences change over time. The system records **history**, never deleting prior state.

Example:

```text
Small pothole  →  Large pothole  →  Street closed
```

Each transition stores:

- Previous state snapshot
- New state
- Timestamp
- Triggering evidence (photos, validations)

**Domain event**: `OccurrenceEvolved`

## 5. Resolution

When resolved:

| Captured data | Purpose |
|---------------|---------|
| Resolution date | Timeline and trends |
| Confirmations | Who validated resolution (reputation IDs only) |
| Before/after photos | Proof (anonymized) |

**Domain event**: `OccurrenceResolved`

Soft delete only — business records are never hard-deleted. See database rules in `.cursor/rules/02-database.mdc`.

## Temporary events

Not everything is a problem. Same lifecycle applies to:

- Fair, festival, construction, road closure

Category metadata distinguishes `problem` vs `temporary_event` for analytics filtering.

## Sensitive categories

Categories such as corruption, crime, trafficking, violence:

- Author is **never** displayed — system-enforced
- Special handling in API and RLS policies
- See [privacy and identity](privacy-and-identity.md) — Principle 7

## Aggregate invariants

The Occurrence root guarantees:

1. Confidence cannot decrease without a `Deny` or evidence review
2. `Resolved` occurrences cannot return to `Active` without a new `OccurrenceEvolved` event (reopened)
3. Location of the **problem** is stored; location of the **contributor** is never stored
4. All state transitions emit domain events for the outbox

## API read model notes

Map queries are read-heavy — CQRS projection for map tiles and list views. Write path goes through the aggregate. Target: ≤ 3 queries per map viewport request (joins + spatial index).
