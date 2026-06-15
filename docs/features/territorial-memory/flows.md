# Territorial Memory — Flows

## 1. Index occurrence on create (async)

```mermaid
sequenceDiagram
    participant Bus as Event bus
    participant Worker as index-occurrence-place
    participant GIS as PostGIS
    participant DB

    Bus->>Worker: OccurrenceCreated
    Worker->>GIS: resolvePlaces(lat, lng, cityId)
    GIS-->>Worker: [neighborhoodId, streetSegmentId?]
    Worker->>DB: INSERT place_occurrence_links
    Worker->>DB: INSERT occurrence_events (Timescale)
    Worker->>Bus: PlaceMemoryUpdated
```

Idempotent on `occurrenceId + sourceEventId`.

---

## 2. Update memory on status change

```mermaid
sequenceDiagram
    participant Bus
    participant Worker
    participant DB

    Bus->>Worker: OccurrenceStatusChanged (active|resolved)
    Worker->>DB: UPDATE projection + append timeline event
    Worker->>Bus: invalidate trend cache keys
```

---

## 3. Place timeline query (read API)

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Cache as Redis
    participant DB

    App->>API: GET /places/:id/timeline?page=1
    API->>Cache: get timeline:place:id:page1
    alt cache hit
        Cache-->>API: cached
    else miss
        API->>DB: SELECT from read model (≤3 queries)
        API->>Cache: set TTL 15m
    end
    API-->>App: 200 { events[], pagination }
```

Response DTOs apply privacy + sensitive author stripping.

---

## 4. Trend computation (scheduled worker)

```mermaid
sequenceDiagram
    participant Cron
    participant Worker as compute-trends
    participant DB
    participant Cache

    Cron->>Worker: every 6h
    Worker->>DB: aggregate counts by place+category window
    Worker->>Worker: trendPercent vs previous window
    Worker->>DB: UPSERT place_trends
    Worker->>Cache: SET trend:place:category
```

---

## 5. Recurrence detection

```mermaid
flowchart TD
    A[Scheduled job] --> B[Find place+category clusters 180d]
    B --> C{count >= 3 and resolved pattern?}
    C -->|Yes| D[Emit RecurringProblemDetected]
    D --> E[Flag place_trends]
    D --> F[Enqueue city health alert hook]
    C -->|No| G[Skip]
```

---

## 6. Mission generation

```mermaid
sequenceDiagram
    participant Worker as generate-missions
    participant DB
    participant API

    Worker->>DB: find neighborhoods stale > 30d
    Worker->>DB: UPSERT missions (status=open)
    Note over API: Contributor polls GET /missions/nearby
```

---

## 7. City timeline by year

```mermaid
sequenceDiagram
    participant App
    participant API
    participant TS as TimescaleDB

    App->>API: GET /city/timeline?year=2025
    API->>TS: time_bucket query on occurrence_events
    API-->>App: monthly aggregates + top categories
```

No per-reporter breakdown.

---

## Command catalog (system)

| Command | Trigger | Actor |
|---------|---------|-------|
| `IndexOccurrencePlaces` | `OccurrenceCreated` | worker |
| `UpdatePlaceMemory` | status events | worker |
| `ComputePlaceTrends` | cron | worker |
| `DetectRecurringProblems` | cron | worker |
| `GenerateMissions` | cron | worker |
| `UpsertPlace` | admin API | city_admin |

---

## Query catalog

| Query | HTTP |
|-------|------|
| `GetPlaceTimeline` | `GET /places/:id/timeline` |
| `GetPlaceTrends` | `GET /places/:id/trends?window=90d` |
| `GetCityTimeline` | `GET /city/timeline?year=` |
| `GetNearbyMissions` | `GET /missions/nearby?lat=&lng=` |
| `SearchPlaces` | `GET /places/search?q=` |

---

## Domain events

| Event | Consumers |
|-------|-----------|
| `PlaceMemoryUpdated` | City health worker |
| `PlaceTrendComputed` | Cache, notifications (future) |
| `RecurringProblemDetected` | City health, missions |
| `MissionCreated` | Mobile inbox |

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
