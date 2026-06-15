# Occurrence Creation Module

**Bounded context:** Occurrences  
**Status:** spec complete (implementation not started)  
**ADR:** [0003 — Occurrence as central aggregate](../../adr/0003-occurrence-centric-domain.md)

## One-line summary

A contributor reports **what happened** and **where** (problem location) — the occurrence is born `unverified` with `0%` confidence, subject to anonymity and privacy rules.

## Problem this module solves

This is the **first write path** of the platform: turning a citizen observation into durable territorial memory. Without a rigorous creation flow, privacy leaks, bad coordinates, and spam undermine every downstream feature (validation, reputation, city health).

## Core concepts

| Term | Meaning |
|------|---------|
| **Occurrence** | Aggregate root — any reportable event at a location (pothole, flood, fair, crime, …) |
| **Category** | Classification metadata (`pothole`, `flood`, `crime`, …) — not a separate aggregate |
| **Occurrence kind** | `problem` or `temporary_event` — affects analytics filters |
| **Problem location** | WGS84 coordinates of the issue — **only** location stored |
| **Privacy level** | Controls how problem location appears on the map |
| **Contributor ref** | Opaque link to reputation ID + display policy — from [Anonymity](../anonymity/README.md) |
| **Sensitive category** | Subset where author is never shown and encryption may apply |

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | Permissions, validation, forbidden fields |
| [flows.md](flows.md) | Create report journey, API sequence |
| [domain-model.md](domain-model.md) | Occurrence aggregate, VOs, events, ports |
| [tdd-plan.md](tdd-plan.md) | Red → Green → Refactor test order |

## Dependencies

```text
Anonymity ──▶ ContributorRef, AuthorDisplayPolicy, session
     │
     └──▶ Occurrence Creation (this module)
              │
              ├──▶ Validation (future — confirm/deny)  [community-validation](../community-validation/README.md)
              ├──▶ Media (attach photos)  [media-upload](../media-upload/README.md)
              └──▶ Territorial Intelligence (reads OccurrenceCreated)
```

**Prerequisite:** Session bootstrap from [anonymity flows](../anonymity/flows.md) before first `POST /occurrences`.

## Initial state on creation

| Field | Value |
|-------|-------|
| `status` | `unverified` |
| `confidenceLevel` | `0` |
| `version` | `1` |
| `authorDisplay` | From anonymity + sensitive category policy |

## Implementation map (future code)

| Layer | Path |
|-------|------|
| Domain | `packages/domain/src/occurrences/` (extend existing) |
| Geo helpers | `packages/geo` — coordinate validation, approximate shift |
| Shared schemas | `packages/shared/src/occurrences/create-occurrence.schema.ts` |
| API slice | `apps/api/src/features/occurrences/create-occurrence/` |
| DB | `packages/database` — extend `occurrences` table |

## Out of scope (v1)

- Attaching photos at create time (separate Media module — link after create)
- Auto-duplicate merge of nearby reports
- AI category suggestion
- Offline queue sync conflict resolution
- Editing occurrence after create (Evolution module)

## Related system docs

- [Occurrence lifecycle](../../system/occurrence-lifecycle.md) — full state machine (creation is step 1)
- [Security phase gate — Phase 2](../../security/phase-gate-checklist.md#phase-2--create-occurrence-write-path)
