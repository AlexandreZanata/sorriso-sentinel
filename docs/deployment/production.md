# Production Deployment

Sorriso Sentinel production runs as containerized services with pinned images, health checks, and secrets from a secret manager — never baked into images or committed env files.

## Architecture

```text
                    ┌─────────────┐
                    │   CDN / LB  │  TLS termination, HSTS, WAF
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
| **Staging** | Pre-production validation | `docker-compose.yml` + `docker-compose.prod.yml` |
| **Production** | Live deployment | `docker-compose.yml` + `docker-compose.prod.yml` |

## Production principles

| Principle | Implementation |
|-----------|----------------|
| **Pinned images** | `VERSION` required — no `latest` tags in prod overlay |
| **Non-root containers** | API Dockerfile runs as `sentinel` user (UID 1001) |
| **Secrets external** | Secret manager injects env at runtime — not files on disk |
| **RLS runtime role** | API uses `sentinel_app` (`NOBYPASSRLS`); migrations use superuser |
| **Health checks** | Every service has liveness/readiness probes |
| **Resource limits** | Memory caps prevent runaway containers |
| **Stateless API** | Horizontal scaling behind load balancer |
| **Backups** | Postgres PITR + object storage replication — see [disaster-recovery.md](disaster-recovery.md) |

## Deploy checklist

- [x] `VERSION` file matches release tag
- [x] `CHANGELOG.md` updated
- [x] All CI checks green (`validate`, `security-scan`, `docker-validate`, `docker-prod-validate`)
- [ ] Secrets rotated and stored in secret manager (operator)
- [ ] Database migrations applied
- [ ] Feature flags configured for gradual rollout
- [x] Health endpoints verified: `/health`, `/ready`, `/live`
- [x] Structured logging and correlation IDs active
- [x] Rollback procedure documented and tested (see below)
- [x] Security headers and CORS allowlist verified (`npm run docker:prod-validate`)
- [x] RLS tested with `sentinel_app` in staging/prod validate script
- [x] RPO/RTO documented — [disaster-recovery.md](disaster-recovery.md)

## Required environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `VERSION` | Yes | Must match release tag; pins API image |
| `POSTGRES_PASSWORD` | Yes | Postgres superuser (migrations only) |
| `DATABASE_URL` | Yes | **`sentinel_app` runtime role** — RLS enforced |
| `REDIS_URL` | Yes | Redis connection |
| `CORS_ORIGINS` | Yes | Comma-separated HTTPS origins — **no `*`** |
| `JWT_ACCESS_SECRET` | Yes | Non-default secret from secret manager |
| `SESSION_TOKEN_SECRET` | Yes | Non-default secret from secret manager |
| `TRUST_PROXY` | Yes (prod) | `true` behind TLS-terminating LB — enables HSTS |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Yes | Object storage credentials |

### CORS production allowlist (example)

Document each city deployment — do not commit secrets:

| Environment | `CORS_ORIGINS` |
|-------------|----------------|
| Staging | `https://staging.example.gov.br` |
| Production | `https://app.example.gov.br,https://admin.example.gov.br` |

See [CORS and HTTP security](../security/cors-and-http-security.md).

### Secrets manager

Production secrets **must not** live in `.env` files on disk. Inject at deploy time from:

- AWS Secrets Manager / Parameter Store
- HashiCorp Vault
- GCP Secret Manager
- Azure Key Vault

Minimum secret set: `POSTGRES_PASSWORD`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `SESSION_TOKEN_SECRET`, `MINIO_ROOT_PASSWORD`, optional S3 keys.

## Production compose

```bash
export VERSION=0.1.0
export POSTGRES_PASSWORD="$(openssl rand -base64 32)"
export MINIO_ROOT_USER=sentinel
export MINIO_ROOT_PASSWORD="$(openssl rand -base64 32)"
export DATABASE_URL="postgresql://sentinel_app:sentinel_app@postgres:5432/sorriso_sentinel"
export REDIS_URL="redis://redis:6379"
export CORS_ORIGINS="https://app.example.gov.br"
export JWT_ACCESS_SECRET="$(openssl rand -base64 48)"
export SESSION_TOKEN_SECRET="$(openssl rand -base64 48)"
export TRUST_PROXY=true

docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  up -d --wait
```

Validate locally before deploy:

```bash
npm run docker:prod-validate
```

## API container

Built from `docker/Dockerfile.api` — multi-stage Alpine image:

1. **deps** — install production dependencies only
2. **build** — compile domain, shared, api packages
3. **runner** — minimal runtime, non-root, health check on `/health`

Security middleware (Phase 8):

- Helmet: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- HSTS when `NODE_ENV=production` and `TRUST_PROXY=true`
- CORS explicit allowlist; rejects wildcard in production
- Production bootstrap rejects dev JWT/session secrets

```bash
docker build -f docker/Dockerfile.api -t sorriso-sentinel/api:0.1.0 .
```

## Database (production)

- PostgreSQL 18.1 + PostGIS + `pgcrypto`
- UUID v7 native (`uuidv7()`)
- Row Level Security **forced** on tenant tables
- API connects as `sentinel_app` — superuser for migrations only
- Soft delete (`deleted_at`) — no hard deletes
- Connection pooling via PgBouncer (recommended at scale)
- SSL enabled in prod overlay (`ssl=on`)

Staging RLS verification: `npm run docker:prod-validate` (or `packages/database` integration tests with `DATABASE_URL`).

## Observability

| Signal | Tool |
|--------|------|
| Logs | Structured JSON → log aggregator |
| Metrics | Latency, errors, throughput per route |
| Traces | Correlation ID across API + workers |
| Health | `/health` (liveness), `/ready` (dependencies), `/live` |

## Rollback (verified)

Procedure tested via `docker-prod-validate` image tag pin and documented steps:

1. Set `VERSION` to previous release (e.g. `0.0.9`).
2. Rebuild or pull previous image: `sorriso-sentinel/api:<previous-version>`.
3. Run `docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d --wait`.
4. Roll back DB migration **only** if the release included a reversible migration.
5. Verify `/health`, security headers, and CORS allowlist.
6. Monitor error rate and audit logs for 30 minutes.

See [disaster-recovery.md](disaster-recovery.md) for RPO/RTO and restore testing.

## Security scan on release

CI job `security-scan` runs `npm audit --omit=dev --audit-level=high` on every PR and before GitHub Release creation (tag push).

```bash
npm run validate:security
```

## Related docs

- [Docker guide](docker.md)
- [Disaster recovery](disaster-recovery.md)
- [CI/CD](../contributing/ci-cd.md)
- [Technology stack](../architecture/stack.md)
- [CORS and HTTP security](../security/cors-and-http-security.md)
