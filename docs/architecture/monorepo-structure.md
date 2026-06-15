# Monorepo Structure

Planned layout using **Turborepo**. Organized by Vertical Slice inside the API — not by technical layer globally.

## Top-level layout

```text
sorriso-sentinel/
├── apps/
│   ├── api/                 # NestJS — HTTP API, CQRS command handlers
│   ├── worker/              # BullMQ consumers (media, trends, missions)
│   ├── web/                 # Next.js — public map, admin, SSR
│   └── mobile/              # React Native + Expo
├── packages/
│   ├── domain/              # Entities, VOs, domain events, ports (no framework imports)
│   ├── shared/              # DTOs, validation schemas (Zod), shared types
│   ├── database/            # Migrations, Prisma/Drizzle schema, RLS policies
│   └── geo/                 # PostGIS helpers, coordinate utilities
├── docs/                    # Documentation (this repo)
├── scripts/                 # Dev and CI scripts
├── docker/                  # Dockerfiles and compose
├── turbo.json
├── package.json
└── pnpm-workspace.yaml      # or npm workspaces
```

## API internal structure (Vertical Slice)

```text
apps/api/src/
├── features/
│   ├── occurrences/
│   │   ├── create-occurrence/
│   │   │   ├── create-occurrence.controller.ts
│   │   │   ├── create-occurrence.handler.ts      # command
│   │   │   ├── create-occurrence.handler.spec.ts
│   │   │   └── create-occurrence.dto.ts
│   │   ├── confirm-occurrence/
│   │   ├── evolve-occurrence/
│   │   └── resolve-occurrence/
│   ├── validation/
│   ├── reputation/
│   ├── territorial/
│   ├── city-health/
│   ├── media/
│   └── identity/
├── infrastructure/
│   ├── database/            # adapters implementing domain ports
│   ├── redis/
│   ├── queue/
│   └── storage/             # S3 adapter
└── main.ts
```

**Rule**: `packages/domain` has zero imports from NestJS, Prisma, or Redis.

## Package dependency direction

```text
apps/*  →  packages/shared  →  packages/domain
                ↓
         packages/database (infra only — apps wire it)
```

Domain never imports from apps or infrastructure.

## Database conventions

| Convention | Value |
|------------|-------|
| Primary keys | `UUID` with `uuidv7()` default |
| Timestamps | `created_at`, `updated_at`, `deleted_at` (soft delete) |
| Optimistic lock | `version` column on aggregates |
| Tenant key | `city_id` (multitenancy — one row per city deployment or RLS) |
| Audit | `occurrence_audit` table — before/after JSONB |

## Bounded context → module mapping

| Bounded context | API module | Worker jobs |
|-----------------|------------|-------------|
| Occurrences | `features/occurrences` | — |
| Validation | `features/validation` | — |
| Identity & Reputation | `features/identity`, `features/reputation` | — |
| Media | `features/media` | `anonymize-media` |
| Territorial Intelligence | `features/territorial` | `compute-trends`, `detect-recurrence` |
| City Health | `features/city-health` | `aggregate-health-scores` |
| Missions | `features/missions` | `generate-missions` |

## Shared types example

```text
packages/domain/src/occurrences/
  occurrence.entity.ts
  occurrence-status.vo.ts
  occurrence-created.event.ts
  occurrence.repository.port.ts

packages/shared/src/
  create-occurrence.schema.ts   # Zod — used by API and mobile
```

## CI per package

Turborepo pipeline:

```text
lint → test → build
  ├── packages/domain
  ├── packages/shared
  ├── apps/api
  ├── apps/worker
  ├── apps/web
  └── apps/mobile
```

## Related docs

- [Technology stack](stack.md)
- [System overview](../system/overview.md)
- [Branches and workflow](../contributing/branches.md)
