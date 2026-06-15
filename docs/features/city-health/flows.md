# City Health — Flows

## 1. Neighborhood aggregation (scheduled)

```mermaid
sequenceDiagram
    participant Cron
    participant Worker as aggregate-neighborhood-health
    participant TM as Territorial read model
    participant Domain as HealthScoreCalculator
    participant DB
    participant Cache

    Cron->>Worker: every 6h
    Worker->>TM: load place stats per neighborhood
    Worker->>Domain: calculate(dimensions, window=90d)
    Domain->>Domain: apply k-anonymity safety rule
    Worker->>DB: UPSERT neighborhood_health_scores
    Worker->>Cache: SET health:neighborhood:id
    Worker->>Bus: NeighborhoodHealthUpdated
```

---

## 2. City index aggregation

```mermaid
sequenceDiagram
    participant Worker as aggregate-city-index
    participant DB
    participant Cache

    Worker->>DB: load all neighborhood scores
    Worker->>Worker: weighted composite
    Worker->>DB: UPSERT city_health_index
    Worker->>Cache: SET health:city
```

Runs after neighborhood job completes.

---

## 3. Invalidate cache on occurrence resolution

```mermaid
sequenceDiagram
    participant Bus
    participant Worker

    Bus->>Worker: OccurrenceStatusChanged → resolved
    Worker->>Worker: DEL health:neighborhood:* (affected)
    Note over Worker: Next scheduled run refreshes; optional eager partial update v2
```

---

## 4. Public read — neighborhood health

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Cache
    participant DB

    App->>API: GET /neighborhoods/:id/health
    API->>Cache: get health:neighborhood:id
    alt hit
        Cache-->>API: scores
    else miss
        API->>DB: read materialized view
        API->>Cache: populate
    end
    API-->>App: 200 dimensions + trends
```

**INV-H6:** Handler never calls calculator — read only.

---

## 5. Admin configure weights

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant DB

    Admin->>API: PUT /admin/city/health-config { weights }
    API->>API: validate sum ≈ 1.0
    API->>DB: UPSERT city_health_config
    API->>Bus: HealthConfigChanged
    Note over API: Triggers full re-aggregation job
```

---

## Command catalog

| Command | Trigger | Actor |
|---------|---------|-------|
| `AggregateNeighborhoodHealth` | cron / config change | worker |
| `AggregateCityIndex` | after neighborhood job | worker |
| `UpdateHealthConfig` | admin API | city_admin |

---

## Query catalog

| Query | HTTP |
|-------|------|
| `GetNeighborhoodHealth` | `GET /neighborhoods/:id/health` |
| `GetCityHealth` | `GET /city/health` |
| `GetNeighborhoodHealthHistory` | `GET /neighborhoods/:id/health/history?window=365d` |
| `GetHealthConfig` | `GET /admin/city/health-config` |

---

## Domain events

| Event | Consumers |
|-------|-----------|
| `NeighborhoodHealthUpdated` | Web cache, admin dashboards |
| `CityHealthIndexUpdated` | City dashboard |
| `HealthAlertTriggered` | When dimension < threshold (v2) |

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Territorial memory flows](../territorial-memory/flows.md)
