# Docker Guide

Docker is the standard way to run infrastructure locally and validate new features before merge.

## Images (pinned, performant)

| Service | Image | Why |
|---------|-------|-----|
| PostgreSQL | `postgis/postgis:18-3.6` | PG 18 + PostGIS, UUID v7 native |
| Redis | `redis:7.4-alpine` | Small Alpine image, LRU eviction for dev |
| MinIO | `minio/minio:RELEASE.2025-04-22T22-12-26Z` | Pinned release — no `latest` |
| API | `docker/Dockerfile.api` | Multi-stage Alpine, non-root |

### Performance tuning (dev)

- **Postgres**: `shared_buffers=256MB`, tuned `work_mem` for local dev
- **Redis**: no persistence in dev (`--save ''`), 256MB max memory with LRU
- **MinIO**: pinned release, health check on `/minio/health/live`
- **Ports**: bound to `127.0.0.1` only — not exposed to the network

### Security

- Non-root user in API production image
- Secrets via environment variables — never in compose files committed to git
- Production overlay removes public port bindings
- Init scripts mounted read-only

## Quick start

```bash
cp .env.example .env
make docker-up
# or: npm run docker:up
```

## Validate (required before PR when touching infra/DB/API)

```bash
make docker-validate
# or: npm run docker:validate
```

This script:

1. Validates compose syntax (`docker compose config`)
2. Starts all services with `--wait` (health checks)
3. Verifies PostgreSQL, PostGIS, pgcrypto, UUID v7
4. Verifies Redis PING
5. Verifies MinIO health endpoint
6. Tears down containers and volumes

**Every new feature that depends on Postgres, Redis, MinIO, or Docker must pass `docker:validate` before opening a PR.**

## CI

GitHub Actions runs `scripts/docker-validate.sh` on every PR to `main`. See `.github/workflows/ci.yml`.

## File layout

```text
docker/
├── docker-compose.yml          # Local dev infrastructure
├── docker-compose.prod.yml     # Production overlay
├── Dockerfile.api              # Multi-stage API image
└── postgres/
    └── init/
        └── 01-extensions.sql   # PostGIS + pgcrypto on first boot
```

## Production

See [production.md](production.md) for deploy checklist, secrets, and rollback.

### PostgreSQL 18 volume mount

PostgreSQL 18+ images require the data volume at `/var/lib/postgresql` (not `/var/lib/postgresql/data`). See [docker-library/postgres#1259](https://github.com/docker-library/postgres/pull/1259).

## Troubleshooting

### Port already in use

```bash
docker compose -f docker/docker-compose.yml down
# or change ports in docker-compose.override.yml (gitignored)
```

### Postgres volume stale

```bash
docker compose -f docker/docker-compose.yml down -v
make docker-up
```

### Health check timeout

Increase wait: `DOCKER_WAIT_TIMEOUT=180 npm run docker:validate`

## Related docs

- [Development setup](../contributing/development-setup.md)
- [Production deployment](production.md)
- [ADR: PostgreSQL 18 UUID v7](../adr/0002-postgresql-18-uuidv7.md)
