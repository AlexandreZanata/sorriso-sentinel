# Production Deployment

Sorriso Sentinel production runs as containerized services with pinned images, health checks, and secrets from environment variables — never baked into images.

## Architecture

```text
                    ┌─────────────┐
                    │   CDN / LB  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌──────────┐  ┌────────┐
         │  Web   │  │   API    │  │ Worker │
         │ Next.js│  │  NestJS  │  │ BullMQ │
         └────────┘  └────┬─────┘  └───┬────┘
                          │            │
              ┌───────────┼────────────┘
              ▼           ▼
         ┌─────────┐ ┌───────┐ ┌───────┐
         │ Postgres│ │ Redis │ │ MinIO │
         │ 18+GIS  │ │       │ │  S3   │
         └─────────┘ └───────┘ └───────┘
```

## Environments

| Environment | Purpose | Compose |
|-------------|---------|---------|
| **Local dev** | Developer machines | `docker/docker-compose.yml` |
| **Production** | Live deployment | `docker-compose.yml` + `docker-compose.prod.yml` |

## Production principles

| Principle | Implementation |
|-----------|----------------|
| **Pinned images** | No `latest` tags — explicit versions in compose |
| **Non-root containers** | API Dockerfile runs as `sentinel` user (UID 1001) |
| **Secrets external** | `POSTGRES_PASSWORD`, `MINIO_*` via env / secret manager |
| **Bind localhost** | Dev ports on `127.0.0.1` only — not exposed to LAN |
| **Health checks** | Every service has liveness/readiness probes |
| **Resource limits** | Memory caps prevent runaway containers |
| **Stateless API** | Horizontal scaling behind load balancer |
| **Backups** | Postgres PITR + MinIO replication (operator responsibility) |

## Deploy checklist

- [ ] `VERSION` file matches release tag
- [ ] `CHANGELOG.md` updated
- [ ] All CI checks green (including Docker validation)
- [ ] Secrets rotated and stored in secret manager
- [ ] Database migrations applied
- [ ] Feature flags configured for gradual rollout
- [ ] Health endpoints verified: `/health`, `/ready`, `/live`
- [ ] Structured logging and correlation IDs active
- [ ] Rollback procedure documented and tested

## Production compose

```bash
export VERSION=0.1.0
export POSTGRES_PASSWORD="$(openssl rand -base64 32)"
export MINIO_ROOT_USER=sentinel
export MINIO_ROOT_PASSWORD="$(openssl rand -base64 32)"
export DATABASE_URL="postgresql://sentinel:${POSTGRES_PASSWORD}@postgres:5432/sorriso_sentinel"
export REDIS_URL="redis://redis:6379"

docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  up -d --wait
```

## API container

Built from `docker/Dockerfile.api` — multi-stage Alpine image:

1. **deps** — install production dependencies only
2. **build** — compile domain, shared, api packages
3. **runner** — minimal runtime, non-root, health check on `/health`

```bash
docker build -f docker/Dockerfile.api -t sorriso-sentinel/api:0.1.0 .
```

## Database (production)

- PostgreSQL 18.1 + PostGIS + `pgcrypto`
- UUID v7 native (`uuidv7()`)
- Row Level Security enabled on all tenant tables
- Soft delete (`deleted_at`) — no hard deletes
- Connection pooling via PgBouncer (recommended at scale)
- SSL required in production (`ssl=on` in prod overlay)

## Observability

| Signal | Tool |
|--------|------|
| Logs | Structured JSON → log aggregator |
| Metrics | Latency, errors, throughput per route |
| Traces | Correlation ID across API + workers |
| Health | `/health` (liveness), `/ready` (dependencies), `/live` |

## Rollback

1. Revert to previous image tag: `sorriso-sentinel/api:<previous-version>`
2. Run `docker compose ... up -d`
3. Roll back DB migration if needed (reversible migrations only)
4. Verify health checks

## Related docs

- [Docker guide](docker.md)
- [CI/CD](../contributing/ci-cd.md)
- [Technology stack](../architecture/stack.md)
