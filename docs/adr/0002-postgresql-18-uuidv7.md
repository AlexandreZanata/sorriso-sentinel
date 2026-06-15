# 0002. PostgreSQL 18.1 with native UUID v7

Date: 2026-06-15
Status: accepted

## Context

Sorriso Sentinel requires a primary database with geospatial support, row-level security for privacy, time-series capabilities, and distributed-friendly primary keys at high write volume (occurrence reports).

PostgreSQL 18.1 introduces native `uuidv7()` generation, providing time-ordered UUIDs without application-side ID factories.

## Decision

Use **PostgreSQL 18.1** as the sole primary database with:

- Native **UUID v7** for all primary keys
- **PostGIS** for geospatial queries
- **TimescaleDB** extension for occurrence event time series
- **pgcrypto** for sensitive field encryption
- **Row Level Security** for privacy levels and tenant isolation

## Consequences

### Positive

- Time-ordered UUIDs improve index locality vs UUID v4
- Single database for relational, geo, time-series, and graph-like CTE queries
- RLS enforces privacy at the data layer — not only application code
- Mature ecosystem, self-hostable, open source aligned with project goals

### Negative

- PostgreSQL 18.1 is newer — hosting providers may lag; Docker image pinned in dev
- TimescaleDB adds operational complexity (extension management)
- Graph queries via CTE may need redesign at very large scale

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| PostgreSQL 16 + app-generated UUID v7 | Native DB generation is simpler and consistent |
| MongoDB | Weak geospatial + RLS story for privacy requirements |
| Separate time-series DB (InfluxDB) | Unnecessary with TimescaleDB on same Postgres |
| Neo4j from day one | Over-engineering; relational CTEs sufficient initially |
