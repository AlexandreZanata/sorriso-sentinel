# City Health

City health translates territorial intelligence into actionable indicators for neighborhoods and the municipality as a whole.

## Neighborhood indicators

Each neighborhood receives scores across dimensions:

| Dimension | Derived from |
|-----------|--------------|
| **Infrastructure** | Roads, lighting, drainage occurrences + resolution rate |
| **Safety** | Crime/accident reports (privacy-weighted, aggregated) |
| **Mobility** | Closures, floods, transit disruptions |
| **Cleanliness** | Illegal dumping, abandoned lots, sanitation |

Scores are **aggregated statistics** — never expose individual sensitive reports in health calculations.

## City-level index

```text
General City Index = weighted composite of neighborhood scores
```

Weights may differ by city priorities — configured via admin, not hardcoded.

## How scores are computed

1. Background workers aggregate occurrence data per `Place` (neighborhood polygon)
2. Time windows: rolling 30 / 90 / 365 days
3. Trend direction (improving / stable / declining) stored alongside absolute score
4. Results cached in Redis; invalidated on significant occurrence state changes

**Never compute on synchronous API requests** — read from materialized view or cache.

## Presentation examples

### Neighborhood card

```text
Industrial District
  Infrastructure: 62 ↓
  Safety:         78 →
  Mobility:       55 ↓
  Cleanliness:    71 ↑
```

### City dashboard

```text
Sorriso General Index: 68
  vs last quarter: -4%
  Top concern: Mobility (flooding season)
```

## Privacy constraints

- Sensitive categories contribute only to **statistical aggregates** at neighborhood level or higher
- No health score drill-down that could deanonymize a reporter
- RLS enforces visibility levels (Principle 11)

## Related docs

- [Territorial intelligence](territorial-intelligence.md) — trends and predictions
- [Occurrence lifecycle](occurrence-lifecycle.md)
