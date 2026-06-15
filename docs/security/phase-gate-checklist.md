# Security Phase Gate Checklist

Use this checklist **before opening a PR** and **before starting the next development phase**. All items must be verifiable in code, tests, or configuration — not assumed.

Mark each section when the phase is complete. Link to the detailed module for standards.

## Universal gates (every PR)

These apply to **every** change, regardless of phase.

- [ ] No secrets, tokens, or credentials in code, tests, fixtures, or commits
- [ ] Input validated at API boundary with Zod schemas from `packages/shared` — [input validation](input-validation-and-xss.md)
- [ ] Authorization checked in handler/service — not only in controller or UI — [IDOR](idor-and-access-control.md)
- [ ] Database access uses parameterized queries / Drizzle — no string-built SQL — [SQL injection](sql-injection.md)
- [ ] `city_id` (tenant) enforced on every data access path — [multitenancy](../../.cursor/rules/05-multitenancy.mdc)
- [ ] No sensitive data in logs (passwords, tokens, full PII, raw IPs) — [secrets and logging](secrets-logging-and-data.md)
- [ ] New public endpoints have rate limiting plan or implementation — [rate limiting](rate-limiting-and-abuse.md)
- [ ] Security chain reviewed — no single-layer-only protection — [chain failures](security-chain-failures.md)
- [ ] Integration tests cover unauthorized access (401/403) for new routes
- [ ] English-only code, comments, and docs

---

## Phase 0 — Repository and infrastructure

*Scaffold, Docker, CI, docs.*

- [ ] `.env` and local secrets gitignored; `.env.example` has no real values
- [ ] Docker services bind to `127.0.0.1` in development compose
- [ ] Postgres/Redis/MinIO use strong passwords via env vars in production docs
- [ ] CI does not echo secrets; fork PRs do not receive repository secrets
- [ ] `SECURITY.md` and vulnerability reporting path documented
- [ ] Dependency audit step planned or enabled in CI

**Gate:** `make check` passes; no credentials in git history for this phase.

---

## Phase 1 — Database and migrations

*Drizzle schema, SQL migrations, connection module.*

- [ ] Migrations are idempotent and reviewed — no `DROP` without ADR
- [ ] Primary keys use `uuidv7()` — no sequential integer IDs exposed on public APIs
- [ ] RLS policies drafted for tenant (`city_id`) isolation — even if not enabled yet, document in migration comments
- [ ] No raw SQL in application code without security review — [SQL injection](sql-injection.md)
- [ ] Soft delete (`deleted_at`) on business tables; queries filter deleted rows by default
- [ ] Audit table design avoids storing PII in `before`/`after` JSONB
- [ ] Migration runner does not use superuser credentials in application runtime

**Gate:** `docker-validate` applies migrations; integration test proves RLS/tenant filter when enabled.

---

## Phase 2 — Create Occurrence (write path) ✅

*POST occurrence, anonymous contribution.*

- [x] Request body validated with `createOccurrenceSchema` (or successor)
- [x] Contributor GPS / device location **never** persisted — [privacy](../system/privacy-and-identity.md)
- [x] `city_id` taken from trusted context (config/JWT/header policy) — **not** blindly from client body
- [x] Category and free text pass anti-doxxing filter stub or implementation
- [x] Rate limit on create endpoint (per device/session key, not long-term IP storage)
- [x] Response DTO excludes internal fields (`deleted_at`, internal scores)
- [x] IDOR test: cannot create occurrence scoped to another city's internal IDs

**Gate:** Unauthorized and cross-tenant tests fail as expected; create works for allowed anonymous flow.

---

## Phase 3 — Read Occurrence (read path, geo) ✅

*GET list/detail, bbox queries, map feed.*

- [x] Every read filters by `city_id` + privacy level — [IDOR](idor-and-access-control.md)
- [x] Bbox/query params validated (numeric ranges, max area) — prevents DoS via huge queries
- [x] Sensitive category occurrences never expose author in API response
- [x] Hidden/approximate privacy levels enforced server-side (PostGIS + RLS), not map-only
- [x] Pagination enforced (`limit` cap, cursor or offset bounds)
- [x] No enumeration oracle — consistent 404 for missing vs forbidden (policy decision documented)
- [ ] CORS allowlist configured for web origin — [CORS](cors-and-http-security.md)

**Gate:** Integration tests for privacy levels; bbox abuse test; cross-tenant read returns empty or 403 per policy.

---

## Phase 4 — Community validation (confirm / deny / comment) ✅

*State transitions, confidence, comments.*

- [x] State machine transitions validated in domain — no skip to `resolved` from `unverified`
- [x] Optimistic locking (`version`) on concurrent updates
- [x] One actor cannot confirm their own occurrence (or policy explicitly documented)
- [x] Comment text filtered for doxxing patterns server-side
- [x] Rate limits on validation actions (anti-spam)
- [x] Events published do not leak PII to public subscribers

**Gate:** Tests for invalid transitions, version conflict, and self-validation block.

---

## Phase 5 — Media upload ✅

*Presigned URLs, worker anonymization, S3.*

- [x] Upload limits enforced — [media uploads](media-uploads.md) (size, count, MIME)
- [x] Presigned URL: short TTL, single object key, content-type constraint
- [x] Server never trusts client-side EXIF removal — worker re-processes all images
- [x] Object keys are not guessable; bucket is private; download via signed URLs
- [x] Occurrence-media link verified — cannot attach to another user's occurrence (IDOR)
- [x] Malware/size bomb handling documented (reject + log without storing)

**Gate:** Upload over limit rejected; EXIF stripped in worker test; IDOR attach test fails.

---

## Phase 6 — Authentication and identity ✅

*JWT, local keys, optional profiles.*

- [x] Access tokens short-lived; refresh tokens revocable and stored separately — [auth](authentication-authorization.md)
- [x] Passwords hashed with Argon2 or bcrypt; never logged
- [x] JWT claims include `city_id` / tenant when applicable; validated on every request
- [x] Anonymous endpoints remain usable without weakening authenticated routes
- [x] MFA plan for admin/sensitive roles documented
- [x] Token rotation and logout invalidate refresh tokens

**Gate:** Expired/invalid token tests; privilege escalation tests; admin routes require role.

---

## Phase 7 — Admin, audit, and sensitive categories 🚧

*Moderation, sensitive reports, audit access.*

- [x] Admin routes behind RBAC + optional MFA
- [x] Sensitive category author suppression at API, DB (RLS), and UI layers
- [x] Audit log access restricted to security role; audit entries minimize PII
- [ ] Export/bulk endpoints rate-limited and role-gated
- [ ] Break-glass access documented with logging

**Gate:** Non-admin cannot access audit; sensitive occurrence author never in API JSON.

---

## Phase 8 — Production release

*Deploy, observability, incident response.*

- [ ] TLS everywhere; HSTS; security headers — [CORS and HTTP security](cors-and-http-security.md)
- [ ] Secrets in secret manager — not env files on disk in production
- [ ] CORS production allowlist — no `*` with credentials
- [ ] Database RLS enabled and tested in staging
- [ ] Backup/restore tested; RPO/RTO documented
- [ ] Security scan (dependencies + SAST) green on release tag
- [ ] Rollback procedure verified

**Gate:** Production checklist in [deployment/production.md](../deployment/production.md) complete.

---

## PR template snippet

Copy into PR descriptions when security-relevant:

```markdown
## Security
- Phase gate sections completed: <!-- e.g. Phase 2, Universal -->
- [ ] Authorization tested (401/403)
- [ ] Tenant isolation verified
- [ ] No new SQL injection surface
- [ ] Rate limits considered
- Details: <!-- link to threat or "N/A — docs only" -->
```

## Sign-off

| Role | Responsibility |
|------|----------------|
| Author | Complete checklist honestly; add tests for negative cases |
| Reviewer | Spot-check chain failures and IDOR paths |
| Agent (Cursor) | Apply [19-security-phase-gate](../../.cursor/rules/19-security-phase-gate.mdc) before suggesting merge |
