# City Health — TDD Plan

**Prerequisites:** [Territorial memory](territorial-memory/tdd-plan.md) Step 3+ (place stats available). Can stub `TerritorialStatsReadPort` until then.

## Vertical slice order

```text
Step 1  HealthDimension VOs + CategoryDimensionMapper
Step 2  HealthScoreCalculator + k-anonymity
Step 3  CityIndexCalculator
Step 4  NeighborhoodHealthSnapshot aggregate
Step 5  aggregate-neighborhood-health worker
Step 6  aggregate-city-index worker
Step 7  GET /neighborhoods/:id/health + /city/health APIs
Step 8  Admin health config + privacy negatives
```

---

## Step 1 — Mapping

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 1.1 | `should_map_pothole_to_infrastructure` | — | unit |
| 1.2 | `should_map_crime_to_safety` | — | unit |
| 1.3 | `should_ignore_unknown_category` | — | unit |

---

## Step 2 — HealthScoreCalculator

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 2.1 | `should_return_score_between_0_and_100` | INV-H3 | unit |
| 2.2 | `should_suppress_safety_when_below_k_anonymity` | INV-H1 | unit |
| 2.3 | `should_apply_resolution_bonus` | scoring | unit |
| 2.4 | `should_mark_declining_trend_when_delta_below_minus_3` | — | unit |
| 2.5 | `should_never_use_reputation_id_in_calculation` | INV-H4 | unit |

---

## Step 3 — City index

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 3.1 | `should_compute_weighted_city_index` | — | unit |
| 3.2 | `should_exclude_suppressed_neighborhoods_from_denominator` | INV-H2 | unit |

---

## Step 4 — Snapshot aggregate

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 4.1 | `should_create_snapshot_with_all_dimensions` | — | unit |
| 4.2 | `should_be_idempotent_for_same_aggregation_run_id` | INV-H5 | unit |

---

## Step 5 — Neighborhood worker

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 5.1 | `should_persist_neighborhood_health_scores` | — | integration |
| 5.2 | `should_read_from_territorial_stats_port` | — | integration |

---

## Step 6 — City index worker

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 6.1 | `should_update_city_health_index_after_neighborhood_job` | — | integration |

---

## Step 7 — Read APIs

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 7.1 | `should_return_neighborhood_health_from_cache` | INV-H6 | integration |
| 7.2 | `should_not_compute_scores_synchronously_on_request` | INV-H6 | integration |
| 7.3 | `should_return_null_safety_with_insufficient_data_reason` | INV-H1 | integration |
| 7.4 | `should_return_city_index_with_top_concern` | — | integration |

---

## Step 8 — Privacy & security

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 8.1 | `should_not_include_occurrence_ids_in_health_response` | privacy | integration |
| 8.2 | `should_not_include_author_fields_in_health_tables` | INV-H4 | integration |
| 8.3 | `should_forbid_non_admin_health_config_update` | — | integration |

---

## Stub strategy

```typescript
TerritorialStatsReadPort.getStats(placeId) → fixture counts per category
```

Replace with real projections when territorial Step 3 is green.

---

## Definition of done (city health v1)

- [ ] Tests 1.1–8.3 green
- [ ] Workers scheduled every 6h
- [ ] Public API returns scores + trends only
- [ ] Migration 0007 applied
- [ ] k-anonymity integration test with 4 safety reports → suppressed

---

## Suggested first RED test

```text
should_suppress_safety_when_below_k_anonymity
```

---

## Related docs

- [Business rules](business-rules.md)
- [Territorial memory TDD](../territorial-memory/tdd-plan.md)
