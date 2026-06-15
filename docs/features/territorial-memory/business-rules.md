# Territorial Memory — Business Rules

Rules for **indexing**, **reading**, and **computing** territorial intelligence. Write paths for occurrences stay in sibling modules.

## Actors

| Actor | Description |
|-------|-------------|
| **Visitor** | Views public timeline / place history (aggregated) |
| **Contributor** | Same as visitor + may receive missions |
| **Moderator** | Views enriched stats — no PII |
| **City admin** | Configures place boundaries, mission thresholds |
| **System worker** | Indexes events, computes trends |

---

## Permissions matrix — read APIs

| Action | Visitor | Contributor | Moderator | Admin |
|--------|---------|-------------|-----------|-------|
| `GET /places/:id/timeline` | ✅ | ✅ | ✅ | ✅ |
| `GET /places/:id/trends` | ✅ | ✅ | ✅ | ✅ |
| `GET /city/timeline?year=` | ✅ | ✅ | ✅ | ✅ |
| View occurrence detail on timeline | ⚠️ privacy level | same | same | same |
| View author on sensitive in timeline | ❌ | ❌ | ❌ | ⚠️ audit |
| `GET /missions/nearby` | ❌ | ✅ session | ✅ | ✅ |
| Edit place geometry | ❌ | ❌ | ❌ | ✅ |
| View raw reporter IDs in territorial data | ❌ | ❌ | ❌ | ❌ |

---

## Indexing rules (system)

| Rule | ID | Description |
|------|-----|-------------|
| Index on `OccurrenceCreated` | INV-T1 | Every new occurrence linked to ≥1 place |
| Re-index on status change | INV-T2 | `active`, `resolved` update memory |
| Use `map_latitude/longitude` | INV-T3 | Respect privacy-shifted coords for public index |
| Hidden privacy occurrences | INV-T4 | Index for stats only — excluded from public timeline pin |
| Rural parity | INV-T5 | LineString places for rural roads |
| No contributor location | INV-T6 | Never index device GPS |

### Place resolution

| Priority | Method |
|----------|--------|
| 1 | Point-in-polygon → neighborhood |
| 2 | Nearest street segment within 50m |
| 3 | Rural segment match (PostGIS `ST_DWithin`) |
| 4 | Fallback: city-level bucket only |

> **Rule T1:** If no place matches, occurrence still stored — linked to `city_root` place.

---

## Timeline rules

| Rule | Behavior |
|------|----------|
| Public timeline shows | `active`, `resolved`, `evolved` (not `unverified` unless policy flag) |
| Sort order | `occurredAt` DESC |
| Pagination | Required — max 50 per page |
| Year filter | Calendar year of `created_at` or `resolved_at` per event type |
| Sensitive categories | Show category + area — **no author** |

---

## Trend rules

| Window | Comparison |
|--------|------------|
| 30d | vs previous 30d |
| 90d | vs previous 90d |
| 365d | vs previous 365d |

**Formula (v1):**

```text
trendPercent = ((currentCount - previousCount) / max(previousCount, 1)) × 100
```

| Output | Example |
|--------|---------|
| Copy | "Potholes increased 35% vs last quarter" |
| Not allowed | Only "20 potholes" without context |

> **INV-T7:** Trend APIs return **change %** + direction — raw counts optional secondary field.

---

## Recurrence detection

| Rule | Threshold |
|------|-----------|
| Same `placeId` + same `category` | ≥ 3 in 180 days |
| Status pattern | At least 2 were `resolved` then reappeared |
| Event | `RecurringProblemDetected` |

Does not auto-create occurrences — flags place + may trigger city health alert.

---

## Mission rules

| Trigger | Mission text pattern |
|---------|---------------------|
| No `active`/`resolved` data in neighborhood 30d | "No recent updates for {place}" |
| Recurrence detected | "Confirm if problem returned at {place}" |
| Post-disaster window (config) | "Report current conditions in {place}" |

| Constraint | Rule |
|------------|------|
| Push notification | ❌ v1 — in-app list only |
| Max missions per user per day | 5 |
| Missions never expose PII | INV-T8 |

---

## Domain invariants

| ID | Invariant |
|----|-----------|
| **INV-T1** | Every indexed occurrence has ≥1 `place_occurrence_link` |
| **INV-T2** | Projections update idempotently per `sourceEventId` |
| **INV-T3** | Public read uses privacy-safe coordinates |
| **INV-T4** | Hidden occurrences excluded from public timeline |
| **INV-T5** | Rural places use same link model as urban |
| **INV-T6** | No contributor GPS in territorial tables |
| **INV-T7** | Trend responses include comparative context |
| **INV-T8** | Missions contain no reporter identity |
| **INV-T9** | Map viewport queries ≤ 3 DB round-trips (cached) |
| **INV-T10** | Heavy aggregation never runs on request thread |

---

## Performance & caching

| Endpoint | Cache TTL |
|----------|-----------|
| Place trends | 15 min Redis |
| City timeline year summary | 1 h |
| Missions list | 5 min per user |

Invalidate on `OccurrenceStatusChanged` → `active` \| `resolved`.

---

## Explicit non-goals (v1)

- User-editable place graph
- Neo4j / graph database
- Predictive ML models
- Export full occurrence list per street (deanonymization risk)

---

## Related docs

- [Flows](flows.md)
- [Domain model](domain-model.md)
- [City health](../city-health/business-rules.md)
