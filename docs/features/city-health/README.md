# City Health Module

**Bounded context:** City Health & Analytics  
**Status:** spec complete (implementation not started)  
**System doc:** [city health](../../system/city-health.md)

## One-line summary

Neighborhood and city-wide **health scores** (infrastructure, safety, mobility, cleanliness) derived from **aggregated territorial memory** — never from identifiable individual reports.

## Problem this module solves

Citizens and admins need *"how is my neighborhood doing?"* without exposing sensitive reporters. City health turns occurrence history into **actionable indicators** with trends (↑↓→).

## Core concepts

| Term | Meaning |
|------|---------|
| **Health dimension** | infrastructure, safety, mobility, cleanliness |
| **Neighborhood score** | 0–100 per dimension per place (neighborhood polygon) |
| **City index** | Weighted composite across neighborhoods |
| **Trend direction** | `improving` \| `stable` \| `declining` |
| **Time window** | 30 / 90 / 365 rolling days |
| **Aggregate-only** | No individual occurrence in health API responses |

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | Scoring rules, privacy, visibility |
| [flows.md](flows.md) | Worker aggregation, cache, APIs |
| [domain-model.md](domain-model.md) | Score aggregates, ports, events |
| [tdd-plan.md](tdd-plan.md) | Red → Green → Refactor test order |

## Dependencies

```text
Territorial memory ──▶ place-level occurrence stats, trends
City health (this module)
     │
     └──▶ Web dashboard, neighborhood cards, admin reports
```

## v1 default dimensions

| Dimension | Example occurrence categories |
|-----------|------------------------------|
| Infrastructure | pothole, broken_light, flooding, rural_road_damage |
| Safety | accident, crime, violence (aggregated only) |
| Mobility | road_closure, construction, flooding |
| Cleanliness | abandoned lot, illegal dumping (future category) |

## Related docs

- [Territorial memory](../territorial-memory/README.md)
- [Privacy and identity](../../system/privacy-and-identity.md)
- [Reputation](../reputation/README.md) — not used in public health scores
