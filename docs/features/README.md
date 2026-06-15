# Feature Modules — Business Logic Specification

Each folder under `docs/features/` is a **self-contained specification** for one product capability. These docs are the source of truth for domain design, user permissions, flows, and TDD before implementation.

## Why this exists

High-level system docs ([system/](../system/README.md)) describe philosophy and principles. Feature modules translate that into **implementable business logic**: what users can do, what the domain enforces, and which tests prove it.

## Document set per module

Every feature folder follows the same structure:

| File | Purpose |
|------|---------|
| `README.md` | Summary, bounded context, links, implementation status |
| `business-rules.md` | Permissions matrix — **allowed / forbidden / conditional** |
| `flows.md` | User journeys, sequence diagrams, command/query flows |
| `domain-model.md` | DDD — aggregates, entities, VOs, events, ports, invariants |
| `tdd-plan.md` | Red → Green → Refactor order, test names, layers |

Copy [_module-template.md](_module-template.md) when adding a new feature.

## How DDD works in practice (Sorriso Sentinel)

```text
┌─────────────────────────────────────────────────────────────┐
│  Presentation (apps/api, apps/web, apps/mobile)             │
│  Controllers, DTOs, guards — no business rules here          │
└───────────────────────────┬─────────────────────────────────┘
                            │ commands / queries
┌───────────────────────────▼─────────────────────────────────┐
│  Application (apps/api/features/<feature>/)                  │
│  Handlers orchestrate: load aggregate → call domain → save   │
└───────────────────────────┬─────────────────────────────────┘
                            │ uses ports
┌───────────────────────────▼─────────────────────────────────┐
│  Domain (packages/domain/src/<context>/)                     │
│  Entities, VOs, domain services, events — zero framework     │
└───────────────────────────┬─────────────────────────────────┘
                            │ implemented by
┌───────────────────────────▼─────────────────────────────────┐
│  Infrastructure (apps/api/infrastructure/, packages/database)│
│  Drizzle adapters, Redis, S3, workers                      │
└─────────────────────────────────────────────────────────────┘
```

### Rules

1. **One bounded context per feature folder** (may share ubiquitous language terms).
2. **Aggregates** enforce invariants; handlers never bypass the root.
3. **Cross-context communication** only via domain events or application DTOs — no direct imports between context internals.
4. **Zod** lives in `packages/shared` for API boundaries; **invariants** live in domain VOs/entities.

## How TDD works in practice

For each business rule in `business-rules.md`, `tdd-plan.md` defines tests **before** code:

```text
1. RED    — Write failing test in packages/domain (unit) or apps/api (integration)
2. GREEN  — Minimal domain/handler code to pass
3. REFACTOR — Extract VOs, domain services; keep tests green
```

| Layer | Package / path | What to test |
|-------|----------------|--------------|
| Unit | `packages/domain` | Invariants, state transitions, domain services |
| Unit | `packages/shared` | Zod schema edge cases |
| Integration | `apps/api` | HTTP + DB + RLS; 401/403 paths |
| Worker | `apps/worker` | Async side effects (e.g. EXIF strip) |

Test names use behavior style: `should_reject_ghost_identity_when_displaying_sensitive_author`.

## Module index

| Module | Bounded context | Status |
|--------|-----------------|--------|
| [Anonymity](anonymity/README.md) | Identity & Privacy | Spec complete |
| [Occurrence creation](occurrence-creation/README.md) | Occurrences | Spec complete |
| [Community validation](community-validation/README.md) | Validation | Spec complete |
| [Reputation](reputation/README.md) | Identity & Reputation | Spec complete |
| Territorial memory | Territorial Intelligence | Planned |
| [Media upload](media-upload/README.md) | Media | Spec complete |
| City health | City Health & Analytics | Planned |

## Related docs

- [System overview](../system/overview.md)
- [Privacy and identity (principles)](../system/privacy-and-identity.md)
- [Monorepo structure](../architecture/monorepo-structure.md)
- [Security phase gate](../security/phase-gate-checklist.md)
- [ADR 0004 — Privacy by default](../adr/0004-privacy-by-default.md)
