# Territorial Memory Module

**Bounded context:** Territorial Intelligence  
**Status:** spec complete (implementation not started)  
**System doc:** [territorial intelligence](../../system/territorial-intelligence.md)

## One-line summary

Every street, neighborhood, bridge, and rural route **accumulates history** — occurrences are linked to **Places**, trends and timelines are computed asynchronously, and the map becomes a window into collective memory.

## Problem this module solves

A map with pins is forgettable. **Territorial memory** answers: *what happened here over years?* — enabling trends, recurrence detection, missions for data-blind areas, and feeding city health scores.

## Core concepts

| Term | Meaning |
|------|---------|
| **Place** | Named geographic entity — street, neighborhood, bridge, rural segment |
| **Place link** | Association occurrence ↔ place with confidence |
| **Territorial memory** | Time-ordered events per place |
| **Timeline** | City rewind by year/season — TimescaleDB |
| **Trend** | % change vs prior window — not raw count |
| **Recurrence** | Same problem type repeating at same place |
| **Mission** | Suggested contributor task for stale coverage |
| **Read model** | CQRS projection — map API never aggregates synchronously |

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | Who sees what, privacy, aggregation rules |
| [flows.md](flows.md) | Indexing, timeline, trends, missions |
| [domain-model.md](domain-model.md) | Place, projections, workers, events |
| [tdd-plan.md](tdd-plan.md) | Red → Green → Refactor test order |

## Dependencies

```text
Occurrence creation ──▶ OccurrenceCreated
Community validation ─▶ status / confidence changes
Media upload ─────────▶ EvidenceAttached (optional enrichment)
Territorial memory (this module)
     │
     ├──▶ feeds City health (aggregates per neighborhood)
     └──▶ Web map / timeline / missions UI (read APIs)
```

## v1 scope

| In scope | Out of scope (later) |
|----------|----------------------|
| Place resolution via PostGIS | Dedicated graph DB |
| Occurrence → place indexing | ML predictions |
| Neighborhood timeline API | Real-time push missions |
| Trend worker (30/90 day) | Go geoprocessing service |
| Recurrence rule (3+ same category) | Admin place editor UI |

## Related docs

- [City health](../city-health/README.md) — consumes territorial aggregates
- [Occurrence lifecycle](../../system/occurrence-lifecycle.md)
- [Technology stack](../../architecture/stack.md) — PostGIS, TimescaleDB
