# Secrets, Logging, and Data Protection

## Secrets

| Rule | Detail |
|------|--------|
| Never commit | API keys, DB passwords, JWT private keys, MinIO credentials |
| `.env` | Local only; listed in `.gitignore` |
| `.env.example` | Placeholder values only — no production secrets |
| CI | GitHub Actions secrets; fork PRs restricted |
| Production | Secret manager (Vault, AWS SM, etc.) — [production](../deployment/production.md) |
| Rotation | Document rotation for DB, JWT signing keys, S3 keys |

### If a secret is committed

1. Revoke immediately — rotation is mandatory, not optional.
2. Remove from git history if still private repo policy requires (BFG/filter-repo).
3. Post-incident review — how it was committed.

## Logging

### Never log

- Passwords, refresh tokens, JWT full strings
- Private signing keys
- Full CPF, phone, email (unless dedicated secure audit with access control)
- Raw EXIF from uploads
- Complete request bodies on auth endpoints

### Safe to log (structured JSON)

- `request_id`, `city_id`, `route`, `status_code`, `duration_ms`
- `occurrence_id`, `user_sub` (pseudonym id) — not real names
- Error types without user-controlled strings unescaped

### PII in audit tables

- `occurrence_audit` stores state diffs — strip PII fields from JSONB snapshots.
- Sensitive categories: extra restriction on audit read role.

## Data at rest

| Data class | Protection |
|------------|------------|
| Sensitive report content | `pgcrypto` or app-level encryption — [privacy](../system/privacy-and-identity.md) |
| Passwords | Argon2/bcrypt hash only |
| Media | Private bucket; sanitized derivatives public via signed URL |
| Backups | Encrypted; access same as production DB |

## Data in transit

- TLS 1.2+ for all client and service traffic in production.
- Redis and Postgres: TLS in production; not plain text over public networks.

## Retention

| Data | Retention guidance |
|------|-------------------|
| Rate limit Redis keys | TTL-based — auto expire |
| Access logs | Minimize; align with legal/policy |
| Soft-deleted rows | Retain per policy; hard delete job documented |
| Quarantined uploads | Delete after 7 days default |

## Observability vs security

Correlation IDs aid debugging — they must not become a side channel for enumerating users. See [observability rule](../../.cursor/rules/07-observability.mdc).

## Checklist

- [ ] New log statements reviewed for PII
- [ ] Error handler does not dump `err.stack` to client in production
- [ ] Health endpoints do not expose secrets or full config
- [ ] `DATABASE_URL` not printed on startup

## Related docs

- [SECURITY.md](../../SECURITY.md)
- [Security chain failures](security-chain-failures.md)
- [Authentication and authorization](authentication-authorization.md)
