# Disaster Recovery

Operational targets and procedures for Sorriso Sentinel production. Adjust RPO/RTO with your hosting provider and municipal SLA.

## Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **RPO** (Recovery Point Objective) | 15 minutes | Postgres WAL/PITR + object storage replication |
| **RTO** (Recovery Time Objective) | 4 hours | Restore DB, redeploy API/worker, verify health |

## Backup scope

| Component | Method | Frequency |
|-----------|--------|-----------|
| PostgreSQL | Continuous WAL + daily base backup | Continuous / daily |
| MinIO / S3 media | Cross-region or cross-bucket replication | Continuous |
| Redis | AOF persistence (prod overlay) | Continuous |
| Secrets | Secret manager versioning | On rotation |

## Backup procedure (operator)

1. Confirm automated Postgres backups and PITR are enabled on the managed instance.
2. Confirm MinIO/S3 replication or lifecycle rules to a secondary bucket/region.
3. Export secret manager snapshot metadata (not secret values) for audit.
4. Record backup job success in the ops runbook.

## Restore procedure (tested quarterly)

1. **Isolate** — stop traffic to the failed environment (LB maintenance mode).
2. **Database** — restore Postgres to a point in time ≤ RPO from latest healthy backup.
3. **Apply migrations** — run pending migrations only if restore snapshot is behind schema.
4. **Object storage** — verify media bucket integrity; re-sync from replica if needed.
5. **Redeploy** — `docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d --wait` with pinned `VERSION`.
6. **Verify** — `/health`, `/ready`, smoke test create/read occurrence, admin audit route 403 for non-admin.
7. **RLS** — run `pnpm run docker:prod-validate` or staging equivalent to confirm `sentinel_app` RLS.

## Rollback (application)

Documented in [production.md](production.md#rollback-verified). Summary:

1. Set `VERSION` to the previous release tag.
2. Redeploy compose stack; do not run destructive migrations.
3. Verify health and security headers (`Strict-Transport-Security`, CORS allowlist).
4. Monitor error rate for 30 minutes.

## Incident contacts

Define in your operator runbook (not in git): on-call rotation, municipal IT contact, security escalation.

## Related docs

- [Production deployment](production.md)
- [Docker guide](docker.md)
- [Security phase gate — Phase 8](../security/phase-gate-checklist.md#phase-8--production-release)
