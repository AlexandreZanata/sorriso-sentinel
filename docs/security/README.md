# Security Documentation

Security standards for Sorriso Sentinel. Every feature phase must pass the [phase gate checklist](phase-gate-checklist.md) before merge.

## Philosophy

```text
Defense in depth — no single layer is trusted alone.

API authorization  →  application policy  →  database RLS  →  storage policies
```

Privacy is a security property. See [privacy and identity](../system/privacy-and-identity.md) for domain-specific rules (anonymity, EXIF stripping, sensitive categories).

## Module index

| Module | Scope |
|--------|--------|
| [Phase gate checklist](phase-gate-checklist.md) | **Mandatory review before each development phase and every PR** |
| [Security chain failures](security-chain-failures.md) | Defense-in-depth gaps, broken chains, anti-patterns |
| [SQL injection prevention](sql-injection.md) | Parameterized queries, Drizzle, raw SQL rules |
| [IDOR and access control](idor-and-access-control.md) | Object-level authorization, BOLA, tenant scope |
| [CORS and HTTP security](cors-and-http-security.md) | Origins, headers, CSP, cookies |
| [Media uploads](media-uploads.md) | Size limits, MIME validation, presigned URLs, worker pipeline |
| [Authentication and authorization](authentication-authorization.md) | JWT, anonymous access, RBAC/ABAC |
| [Input validation and XSS](input-validation-and-xss.md) | Zod, output encoding, CSRF |
| [Rate limiting and abuse](rate-limiting-and-abuse.md) | Redis limits, brute force, spam |
| [Secrets, logging, and data](secrets-logging-and-data.md) | No secrets in repo, PII in logs, retention |
| [OWASP Top 10 mapping](owasp-top-10.md) | Control map for reviews and releases |

## Related project docs

| Doc | Relationship |
|-----|--------------|
| [SECURITY.md](../../SECURITY.md) | Vulnerability reporting and disclosure |
| [Privacy and identity](../system/privacy-and-identity.md) | Anonymity, photo anonymization, RLS privacy levels |
| [Multitenancy rule](../../.cursor/rules/05-multitenancy.mdc) | `city_id` isolation, tenant context |
| [CI/CD](../contributing/ci-cd.md) | Security scanning in pipeline |
| [Production deployment](../deployment/production.md) | TLS, secrets manager, hardening |

## Enforcement

| Layer | Mechanism |
|-------|-----------|
| Development | Cursor rule [19-security-phase-gate](../../.cursor/rules/19-security-phase-gate.mdc) |
| PR review | [Pull request checklist](../contributing/pull-requests.md) + phase gate |
| CI | Lint, tests, dependency scan (extend as stack matures) |
| Runtime | NestJS guards, Drizzle + RLS, Redis rate limits, worker sanitization |

## Reporting vulnerabilities

Do **not** open public issues for security bugs. Follow [SECURITY.md](../../SECURITY.md).
