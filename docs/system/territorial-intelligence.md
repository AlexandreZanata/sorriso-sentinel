# Territorial Intelligence

Territorial intelligence is the core differentiator: every point on the map has **memory**.

## Location memory

Each place accumulates history over time.

Example — `Mato Grosso Street`:

| Year | Events |
|------|--------|
| 2024 | Pothole reported and resolved |
| 2025 | Flooding during rainy season |
| 2025 | Streetlight replacement |
| 2026 | Construction completed |

The system learns about each location. This data powers trends, predictions, and missions.

## Territorial graph

The city becomes a knowledge graph. Relationships are modeled relationally first (recursive CTEs in PostgreSQL) — no dedicated graph DB until scale demands it.

Example chain:

```text
School
  ↓ adjacent to
Street
  ↓ has
Occurrences (problems)
  ↓ correlated with
Accidents
  ↓ related to
Lighting quality
```

### Graph entities (conceptual)

| Node type | Examples |
|-----------|----------|
| `Place` | Street, neighborhood, school, bridge, rural segment |
| `Occurrence` | Linked to a place with temporal dimension |
| `Infrastructure` | Lighting, drainage, pavement (derived) |

Edges are stored as relational tables with `from_place_id`, `to_place_id`, `relationship_type`.

## City timeline

Users can rewind time:

```text
Show Sorriso in 2024
Show Sorriso in 2025
Show Sorriso in 2026
```

Powered by **TimescaleDB** hypertables on occurrence events — time-series optimized for "what happened here over time" without a separate database.

## Trends

Show change, not just counts:

```text
NOT: "There are 20 potholes"
IS:  "Potholes increased 35% vs last quarter"
```

Computed by background workers on scheduled intervals — never synchronous on map API routes.

## Predictions

Pattern detection over historical series:

```text
"Every rainy season, this neighborhood floods"
```

Initial implementation: rule-based + statistical thresholds on TimescaleDB aggregates. ML models are a future ADR if accuracy requirements grow.

## Recurring problems

Detect structural issues, not one-off events:

```text
Streetlight broken → fixed → broken again → fixed → broken again
                                              ↓
                              System flags: structural problem
```

**Domain event**: `RecurringProblemDetected` — may spawn a mission or elevate city health alert.

## Missions

The system generates missions when data is stale or missing:

```text
"No data about Neighborhood X in the last 30 days. Updates needed."
```

Missions are read-model suggestions driven by territorial coverage gaps — not push notifications without user consent.

## Rural intelligence

Same logic for rural routes:

- Damaged bridge, mud trap, poor road, wildfire, no mobile signal

Rural segments are first-class `Place` entities with PostGIS geometry (LineString for roads, Point for bridges).

## Processing architecture

| Workload | Where it runs |
|----------|---------------|
| Map viewport reads | API (CQRS read model, Redis cache) |
| Trend aggregation | Background worker (BullMQ) |
| Recurrence detection | Background worker |
| Timeline queries | TimescaleDB via read replica |
| Heavy geoprocessing (future) | Optional Go worker service via events |

## Related docs

- [Territorial memory feature module](../features/territorial-memory/README.md) — indexing, trends, missions, TDD
- [Occurrence lifecycle](occurrence-lifecycle.md)
- [City health](city-health.md)
- [Technology stack](../architecture/stack.md)
