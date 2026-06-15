# Territorial Memory — Domain Model (DDD)

Bounded context: **Territorial Intelligence**  
Package root: `packages/domain/src/territorial/`

## Context map

```text
Occurrences ──events──▶ Territorial (index, trends)
Media ───────────────▶ optional enrichment on timeline DTO
Territorial ──aggregates──▶ City Health
Territorial ──read API──▶ Web map / timeline
```

No imports from Occurrences **entities** — only event payloads and read ports.

---

## Aggregate: Place (root)

Administrative / geographic unit. Geometry in PostGIS — domain holds IDs and metadata.

```text
Place
├── id: PlaceId
├── cityId: CityId
├── placeType: PlaceType — neighborhood | street | bridge | rural_segment | city_root
├── name: PlaceName
├── slug: string
├── geometryRef: string — PostGIS row id / WKT ref (infra)
├── parentPlaceId: PlaceId | null — hierarchy
├── createdAt, updatedAt
```

### Entity: PlaceOccurrenceLink

```text
PlaceOccurrenceLink
├── id
├── placeId
├── occurrenceId
├── cityId
├── linkType: primary | adjacent | administrative
├── indexedAt
```

Unique: (`occurrenceId`, `placeId`, `linkType`).

---

## Read models (CQRS — not aggregate roots)

| Projection | Purpose |
|------------|---------|
| `PlaceTimelineEntry` | UI timeline row |
| `PlaceTrend` | category + window + trendPercent |
| `Mission` | contributor suggestion |
| `OccurrenceEvent` (Timescale) | time-series hypertable row |

---

## Value objects

| VO | Notes |
|----|-------|
| `PlaceId` | uuid |
| `PlaceType` | enum |
| `TrendWindow` | `30d` \| `90d` \| `365d` |
| `TrendDirection` | improving \| stable \| declining |
| `TrendPercent` | -100..+∞ capped display |
| `MissionStatus` | open \| completed \| dismissed |

---

## Domain services

### `PlaceResolutionService` (port + domain logic)

```typescript
resolvePlaces(
  location: MapLocation,
  cityId: CityId,
): PlaceId[]
```

Implemented with PostGIS adapter — domain defines rules INV-T1–T5.

### `TrendCalculator`

```typescript
computeTrend(currentCount: number, previousCount: number): TrendPercent
```

### `RecurrenceDetector`

```typescript
detect(links: PlaceOccurrenceHistory[]): RecurringProblem | null
```

---

## Ports

| Port | Adapter |
|------|---------|
| `PlaceRepository` | Drizzle + PostGIS |
| `PlaceOccurrenceLinkRepository` | Drizzle |
| `PlaceTimelineReadPort` | SQL read model |
| `TrendReadPort` | SQL + Redis cache |
| `MissionRepository` | Drizzle |
| `OccurrenceEventStorePort` | TimescaleDB |
| `GeoQueryPort` | PostGIS ST_Contains, ST_DWithin |

---

## Domain events

| Event | Payload |
|-------|---------|
| `PlaceMemoryUpdated` | `placeId`, `cityId`, `occurrenceId` |
| `PlaceTrendComputed` | `placeId`, `category`, `window`, `trendPercent` |
| `RecurringProblemDetected` | `placeId`, `category`, `occurrenceIds[]` (ids only internal) |
| `MissionCreated` | `missionId`, `placeId`, `cityId`, `reason` |

---

## Application & worker layout

```text
apps/api/src/features/territorial/
├── place-timeline/
├── place-trends/
├── city-timeline/
└── missions-nearby/

apps/worker/src/jobs/
├── index-occurrence-place.ts
├── compute-trends.ts
├── detect-recurrence.ts
└── generate-missions.ts
```

---

## Database (migration 0006 — planned)

```sql
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  city_id UUID NOT NULL,
  place_type TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_place_id UUID REFERENCES places(id),
  geom GEOGRAPHY NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);

CREATE TABLE place_occurrence_links (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  place_id UUID NOT NULL REFERENCES places(id),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id),
  city_id UUID NOT NULL,
  link_type TEXT NOT NULL,
  source_event_id TEXT NOT NULL UNIQUE,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE place_trends (
  place_id UUID NOT NULL,
  category TEXT NOT NULL,
  window TEXT NOT NULL,
  current_count INT NOT NULL,
  previous_count INT NOT NULL,
  trend_percent NUMERIC(6,2) NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (place_id, category, window)
);

-- Timescale hypertable (extension)
CREATE TABLE occurrence_events (
  time TIMESTAMPTZ NOT NULL,
  occurrence_id UUID NOT NULL,
  city_id UUID NOT NULL,
  place_id UUID,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  event_type TEXT NOT NULL
);
-- SELECT create_hypertable('occurrence_events', 'time');
```

---

## Folder layout

```text
packages/domain/src/territorial/
├── place.entity.ts
├── place-occurrence-link.entity.ts
├── value-objects/
│   ├── place-type.vo.ts
│   ├── trend-window.vo.ts
│   └── trend-percent.vo.ts
├── services/
│   ├── trend-calculator.ts
│   └── recurrence-detector.ts
├── events/
│   └── recurring-problem-detected.event.ts
└── ports/
    ├── place.repository.port.ts
    └── geo-query.port.ts
```

---

## Related docs

- [Business rules](business-rules.md)
- [TDD plan](tdd-plan.md)
- [City health domain model](../city-health/domain-model.md)
