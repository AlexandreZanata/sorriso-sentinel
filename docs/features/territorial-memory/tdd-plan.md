# Territorial Memory — TDD Plan

**Prerequisites:** [Occurrence creation](../occurrence-creation/tdd-plan.md) + PostGIS places seed data. TimescaleDB optional in integration tests (can use plain Postgres + view v1).

## Vertical slice order

```text
Step 1  TrendCalculator + TrendPercent VO
Step 2  PlaceOccurrenceLink + PlaceResolution rules (mocked geo)
Step 3  index-occurrence-place worker
Step 4  Place timeline read model + API
Step 5  compute-trends worker
Step 6  RecurrenceDetector + detect-recurrence job
Step 7  Missions generator + nearby API
```

---

## Step 1 — Trend calculator

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 1.1 | `should_compute_35_percent_increase` | INV-T7 | unit |
| 1.2 | `should_handle_zero_previous_count` | — | unit |
| 1.3 | `should_cap_display_trend_extremes` | — | unit |

---

## Step 2 — Place linking

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 2.1 | `should_link_occurrence_to_neighborhood_polygon` | INV-T1 | unit |
| 2.2 | `should_exclude_hidden_privacy_from_public_timeline` | INV-T4 | unit |
| 2.3 | `should_use_map_coordinates_not_contributor_gps` | INV-T6 | unit |
| 2.4 | `should_idempotent_index_on_duplicate_event` | INV-T2 | unit |

---

## Step 3 — Index worker

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 3.1 | `should_create_place_links_on_occurrence_created` | — | integration |
| 3.2 | `should_append_occurrence_events_hypertable` | — | integration |

---

## Step 4 — Timeline API

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 4.1 | `should_return_paginated_timeline` | — | integration |
| 4.2 | `should_omit_author_on_sensitive_timeline_entries` | privacy | integration |
| 4.3 | `should_respond_within_query_budget` | INV-T9 | integration |

---

## Step 5 — Trends worker

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 5.1 | `should_persist_place_trends_90d_window` | — | integration |
| 5.2 | `should_include_trend_percent_in_api` | INV-T7 | integration |

---

## Step 6 — Recurrence

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 6.1 | `should_detect_three_potholes_same_place_180d` | — | unit |
| 6.2 | `should_emit_recurring_problem_detected` | — | unit |

---

## Step 7 — Missions

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 7.1 | `should_create_mission_for_stale_neighborhood` | — | integration |
| 7.2 | `should_not_include_reporter_pii_in_mission` | INV-T8 | integration |
| 7.3 | `should_list_missions_near_coordinates` | — | integration |

---

## Definition of done (territorial memory v1)

- [ ] Tests 1.1–7.3 green
- [ ] `index-occurrence-place` subscribed to `OccurrenceCreated`
- [ ] Timeline + trends APIs documented
- [ ] Migration 0006 applied

---

## Suggested first RED test

```text
should_compute_35_percent_increase
```

---

## Related docs

- [City health TDD](../city-health/tdd-plan.md)
- [Domain model](domain-model.md)
