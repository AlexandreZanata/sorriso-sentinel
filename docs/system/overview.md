# System Overview

## Mission

Transform dispersed local knowledge into **collective city intelligence**.

The goal is not a complaint form. Most civic apps die because they are static forms with no reason to return daily. Sorriso Sentinel must behave as a **living organism** — a memory that grows with every contribution.

## The central entity: Occurrence

Everything revolves around a single domain entity:

### Occurrence

An occurrence can be anything reported at a location:

- Pothole, broken streetlight, accident, flood
- Construction work, event, abandoned lot
- Loose animal, wildfire, reported assault
- Rural problem: damaged bridge, mud trap, poor road, fire, no signal

The system does **not** treat these as fundamentally different product types. They share the same lifecycle, validation model, and territorial memory. Category is metadata — the aggregate is always an **Occurrence**.

## The map is not the product

The map is a **visualization layer**.

The product is **territorial knowledge**: every street, square, bridge, school, neighborhood, and rural road accumulates history over years.

When that happens, the platform stops depending on city hall, police, or external databases. The community produces a unique, historical, high-value dataset about the real city.

## Product equation

```text
NOT:  Map + Complaint form

IS:   Collective City Memory
      + Anonymous contribution by default
      + Strong reputation (invisible)
      + Community validation
      + Temporal intelligence (trends, predictions)
```

## Why people return daily

| Driver | Mechanism |
|--------|-----------|
| **Validation** | Confirm, deny, add photos, comment on nearby occurrences |
| **Reputation** | Accuracy builds invisible trust; specialists emerge naturally |
| **Territorial memory** | See what happened on your street over years |
| **City health** | Neighborhood scores for infrastructure, safety, mobility, cleanliness |
| **Trends** | "Potholes increased 35%" — not just "20 potholes exist" |
| **Missions** | System requests updates for data-blind areas |
| **Timeline** | Rewind the city: Sorriso in 2024, 2025, 2026 |

## Bounded contexts (high level)

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Occurrences   │────▶│   Territorial    │────▶│  City Health    │
│   (core domain) │     │   Intelligence   │     │  & Analytics    │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Identity &      │     │  Media           │
│ Reputation      │     │  (anonymization) │
└─────────────────┘     └──────────────────┘
```

Communication between contexts: domain events and DTOs — never direct cross-imports. See [monorepo structure](../architecture/monorepo-structure.md).

## Rural parity

Rural occurrences (damaged bridges, mud traps, poor roads, wildfires, no signal) follow the **same model** as urban ones. Territorial intelligence covers the full municipality — not only the urban core.

## Related docs

- [Occurrence lifecycle](occurrence-lifecycle.md)
- [Privacy and identity](privacy-and-identity.md) — anonymity is foundational; wrong design means no sensitive reports
- [Technology stack](../architecture/stack.md)
