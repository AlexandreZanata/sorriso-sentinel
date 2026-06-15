# 0003. Occurrence as central domain aggregate

Date: 2026-06-15
Status: accepted

## Context

The platform reports many event types: potholes, floods, crimes, fairs, rural road damage, etc. Modeling each as a separate aggregate would fragment validation, reputation, territorial memory, and privacy rules.

## Decision

Treat all reportable events as a single aggregate root: **Occurrence**.

Category (pothole, flood, crime, fair, etc.) is a value object / classification metadata — not a separate domain entity with its own lifecycle.

Shared lifecycle: `Unverified → validation → confidence → evolution → resolved`.

## Consequences

### Positive

- One validation and reputation pipeline for all types
- Territorial memory and city health aggregate uniformly
- Simpler API and map read models
- Privacy rules (especially sensitive categories) apply consistently

### Negative

- Category-specific fields may need JSONB or subtype tables — must be modeled carefully to avoid a "god occurrence" table
- Some UI flows may need category-specific forms — handled at presentation layer only

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Separate aggregates per category | Duplicated validation, reputation, and privacy logic |
| STI (single table inheritance) in ORM only | Domain rules would still diverge without a unified model |
| Event sourcing for everything | Justified later for audit-heavy slices; not required day one |
