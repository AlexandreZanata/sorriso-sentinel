# City Health — Domain Model (DDD)

Bounded context: **City Health & Analytics**  
Package root: `packages/domain/src/city-health/`

## Context map

```text
Territorial ──place stats / trends──▶ City Health
City Health ──read API──▶ Web dashboard / neighborhood cards
```

City Health **never** queries Occurrence aggregate directly — only territorial read ports and pre-aggregated stats.

---

## Aggregate: NeighborhoodHealthSnapshot (root)

Point-in-time computed scores for one neighborhood.

```text
NeighborhoodHealthSnapshot
├── id: SnapshotId
├── placeId: PlaceId — neighborhood polygon
├── cityId: CityId
├── window: HealthWindow — 30d | 90d | 365d
├── dimensions: HealthDimensionScores (VO)
├── computedAt: Date
├── aggregationRunId: string — idempotency
└── version
```

Immutable once written — new run creates new row (or upsert by `placeId+window`).

---

## Value objects

### `HealthDimensionScores`

```text
infrastructure: DimensionScore | SuppressedScore
safety: DimensionScore | SuppressedScore
mobility: DimensionScore | SuppressedScore
cleanliness: DimensionScore | SuppressedScore
```

### `DimensionScore`

```text
score: 0–100
trend: TrendDirection
delta: number — vs prior window
```

### `SuppressedScore`

```text
reason: 'insufficient_data' | 'k_anonymity'
trend: TrendDirection (optional stable)
```

### `CityHealthIndex`

```text
score: 0–100
trend: TrendDirection
deltaPercent: number — vs last quarter
topConcern: HealthDimension
```

### `HealthConfig`

```text
neighborhoodWeights: Record<PlaceId, number>
dimensionWeights: Record<HealthDimension, number>
kAnonymityMinimum: number — default 5
```

---

## Domain services

### `HealthScoreCalculator`

```typescript
calculate(params: {
  stats: PlaceOccurrenceStats;
  dimension: HealthDimension;
  window: HealthWindow;
  policy: HealthConfig;
}): DimensionScore | SuppressedScore
```

Applies INV-H1 k-anonymity for safety.

### `CityIndexCalculator`

```typescript
aggregate(snapshots: NeighborhoodHealthSnapshot[], config: HealthConfig): CityHealthIndex
```

### `CategoryDimensionMapper`

Maps occurrence category → dimension — config-driven.

---

## Ports

| Port | Adapter |
|------|---------|
| `TerritorialStatsReadPort` | SQL read model from territorial projections |
| `NeighborhoodHealthRepository` | Drizzle |
| `CityHealthIndexRepository` | Drizzle |
| `HealthConfigRepository` | Drizzle |
| `HealthCachePort` | Redis |

---

## Domain events

| Event | Payload |
|-------|---------|
| `NeighborhoodHealthUpdated` | `placeId`, `cityId`, `window` — no raw counts public |
| `CityHealthIndexUpdated` | `cityId`, `score`, `trend` |
| `HealthConfigChanged` | `cityId` |

---

## Application layer

```text
apps/api/src/features/city-health/
├── get-neighborhood-health/
├── get-city-health/
├── get-health-history/
└── admin-update-health-config/

apps/worker/src/jobs/
├── aggregate-neighborhood-health.ts
└── aggregate-city-index.ts
```

---

## Database (migration 0007 — planned)

```sql
CREATE TABLE neighborhood_health_scores (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  place_id UUID NOT NULL REFERENCES places(id),
  city_id UUID NOT NULL,
  window TEXT NOT NULL,
  infrastructure_score SMALLINT,
  infrastructure_trend TEXT,
  safety_score SMALLINT,
  safety_suppressed BOOLEAN NOT NULL DEFAULT false,
  mobility_score SMALLINT,
  mobility_trend TEXT,
  cleanliness_score SMALLINT,
  cleanliness_trend TEXT,
  aggregation_run_id TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  UNIQUE (place_id, window)
);

CREATE TABLE city_health_index (
  city_id UUID PRIMARY KEY,
  score SMALLINT NOT NULL,
  trend TEXT NOT NULL,
  delta_percent NUMERIC(5,2),
  top_concern TEXT,
  computed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE city_health_config (
  city_id UUID PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

No `reputation_id` columns (INV-H4).

---

## Folder layout

```text
packages/domain/src/city-health/
├── neighborhood-health-snapshot.entity.ts
├── value-objects/
│   ├── health-dimension.vo.ts
│   ├── dimension-score.vo.ts
│   ├── city-health-index.vo.ts
│   └── health-window.vo.ts
├── services/
│   ├── health-score-calculator.ts
│   ├── health-score-calculator.spec.ts
│   ├── city-index-calculator.ts
│   └── category-dimension-mapper.ts
├── events/
│   └── neighborhood-health-updated.event.ts
└── ports/
    ├── territorial-stats-read.port.ts
    └── neighborhood-health.repository.port.ts
```

---

## Related docs

- [Business rules](business-rules.md)
- [TDD plan](tdd-plan.md)
- [Territorial memory](../territorial-memory/domain-model.md)
