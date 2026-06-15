# OWASP Top 10 Mapping

Quick map from [OWASP Top 10 (2021)](https://owasp.org/Top10/) to Sorriso Sentinel controls. Use with the [phase gate checklist](phase-gate-checklist.md).

| # | Risk | Project controls | Doc |
|---|------|------------------|-----|
| A01 | Broken Access Control | IDOR checks, RBAC, RLS, tenant `city_id` | [idor-and-access-control](idor-and-access-control.md) |
| A02 | Cryptographic Failures | TLS, `pgcrypto`, password hashing, private buckets | [secrets-logging-and-data](secrets-logging-and-data.md), [privacy](../system/privacy-and-identity.md) |
| A03 | Injection | Drizzle parameterization, Zod validation | [sql-injection](sql-injection.md), [input-validation](input-validation-and-xss.md) |
| A04 | Insecure Design | Phase gates, privacy-by-default, consensus validation | [phase-gate-checklist](phase-gate-checklist.md), [security-chain-failures](security-chain-failures.md) |
| A05 | Security Misconfiguration | CORS allowlist, headers, Docker bind, no default secrets | [cors-and-http-security](cors-and-http-security.md), [production](../deployment/production.md) |
| A06 | Vulnerable Components | Dependabot, CI dependency scan | [ci-cd](../contributing/ci-cd.md) |
| A07 | Auth Failures | JWT TTL, refresh rotation, MFA for admin | [authentication-authorization](authentication-authorization.md) |
| A08 | Data Integrity Failures | Signed webhooks (future), migration review, outbox | [sql-injection](sql-injection.md) |
| A09 | Logging Failures | Structured logs, no PII, audit role separation | [secrets-logging-and-data](secrets-logging-and-data.md) |
| A10 | SSRF | Allowlist outbound URLs in workers; no user-controlled fetch URLs | [security-chain-failures](security-chain-failures.md) |

## Review cadence

- **Every PR**: Universal gates in [phase gate checklist](phase-gate-checklist.md)
- **Each phase**: Phase-specific section before merge
- **Release**: Phase 8 production gates + dependency scan green
