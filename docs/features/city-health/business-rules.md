# City Health — Business Rules

Rules for **neighborhood scores** and **city index**. All inputs are **aggregates** from [territorial memory](../territorial-memory/README.md).

## Actors

| Actor | Can view neighborhood scores | Can view city index | Can configure weights |
|-------|------------------------------|---------------------|---------------------|
| **Visitor** | ✅ public neighborhoods | ✅ | ❌ |
| **Contributor** | ✅ | ✅ | ❌ |
| **Moderator** | ✅ | ✅ | ❌ |
| **City admin** | ✅ | ✅ | ✅ |
| **Security audit** | ✅ + drill-down bands | ✅ | ❌ |

---

## Permissions matrix

| Action | Visitor | Contributor | Admin |
|--------|---------|-------------|-------|
| `GET /neighborhoods/:id/health` | ✅ | ✅ | ✅ |
| `GET /city/health` | ✅ | ✅ | ✅ |
| `GET /neighborhoods/:id/health/history` | ✅ | ✅ | ✅ |
| Drill-down to individual occurrences from score | ❌ | ❌ | ⚠️ moderator link to filtered map |
| Drill-down to reporter identity | ❌ | ❌ | ❌ |
| Set dimension weights | ❌ | ❌ | ✅ |
| Export citizen PII in health report | ❌ | ❌ | ❌ |

---

## Dimensions (v1)

| Dimension | Key | Included categories (examples) |
|-----------|-----|--------------------------------|
| Infrastructure | `infrastructure` | pothole, broken_light, flooding, rural_road_damage |
| Safety | `safety` | accident, crime, violence |
| Mobility | `mobility` | road_closure, construction, flooding |
| Cleanliness | `cleanliness` | abandoned_lot, sanitation (when added) |

Categories map via `CityHealthCategoryMapping` config per `city_id`.

---

## Scoring model (v1)

Per neighborhood, per dimension, per window (default 90d):

```text
rawScore = 100 - penaltyPoints + resolutionBonus

penaltyPoints = Σ (occurrenceWeight × severityWeight) capped at 100
resolutionBonus = min(20, resolvedRate × 20)
```

| Factor | Weight |
|--------|--------|
| `active` occurrence | 1.0 |
| `low_confidence` | 0.3 (ignored in safety if sensitive) |
| `resolved` in window | contributes to resolutionBonus |
| Sensitive category | counts toward **safety aggregate only** — min k-anonymity |

### K-anonymity (safety dimension)

> **INV-H1:** Safety score for a neighborhood is **suppressed** (returns `null` + `insufficient_data`) if fewer than **5** distinct active+resolved safety-related occurrences in window.

Prevents deanonymization via rare crime reports.

---

## Trend direction

| Condition | Label |
|-----------|-------|
| Δ score ≥ +3 vs prior window | `improving` ↑ |
| Δ score ≤ −3 | `declining` ↓ |
| else | `stable` → |

Stored alongside score in read model.

---

## City index

```text
cityIndex = Σ (neighborhoodScore[d] × neighborhoodWeight[d]) / Σ weights
```

Default: equal weight per neighborhood polygon. Admin may override weights (sum to 1.0).

> **INV-H2:** City index uses **only** published neighborhood scores — skip `insufficient_data` neighborhoods in denominator adjustment.

---

## Domain invariants

| ID | Invariant |
|----|-----------|
| **INV-H1** | Safety suppressed below k-anonymity threshold |
| **INV-H2** | City index excludes invalid neighborhood cells |
| **INV-H3** | Scores ∈ [0, 100] |
| **INV-H4** | No `reputationId` or author in health tables |
| **INV-H5** | Computation is idempotent per `aggregationRunId` |
| **INV-H6** | API never computes scores synchronously — read cache/MV only |
| **INV-H7** | Sensitive raw descriptions never in health pipeline |
| **INV-H8** | Historical scores retained 2 years (rollup) |

---

## Presentation rules

### Neighborhood card (public API)

```json
{
  "placeId": "...",
  "name": "Industrial District",
  "dimensions": {
    "infrastructure": { "score": 62, "trend": "declining" },
    "safety": { "score": null, "trend": "stable", "reason": "insufficient_data" },
    "mobility": { "score": 55, "trend": "declining" },
    "cleanliness": { "score": 71, "trend": "improving" }
  }
}
```

Never include: occurrence IDs list, reporter counts per capita identifiable.

---

## Worker schedule

| Job | Frequency |
|-----|-----------|
| `aggregate-neighborhood-health` | every 6 h |
| `aggregate-city-index` | after neighborhood job |
| Manual refresh | admin trigger — rate limited |

---

## Explicit non-goals (v1)

- Personal health score for contributors
- Ranking neighbors against named individuals
- Real-time score on every map pan

---

## Related docs

- [Flows](flows.md)
- [Domain model](domain-model.md)
- [Territorial memory](../territorial-memory/business-rules.md)
