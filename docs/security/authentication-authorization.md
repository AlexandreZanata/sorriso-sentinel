# Authentication and Authorization

Sorriso Sentinel supports **anonymous contribution by default** with optional identity. Auth must not weaken privacy or tenant isolation.

## Authentication (AuthN)

| Mechanism | Use case |
|-----------|----------|
| Anonymous session | Device-generated session id; rate limiting key |
| Local key pair | Pseudonym / reputation wallet — [privacy](../system/privacy-and-identity.md) |
| JWT access token | Short-lived API access |
| Refresh token | Separate storage; revocable |
| Optional email/password | Public profile mode only |

### JWT standards

| Claim / rule | Value |
|--------------|--------|
| Access token TTL | **15 minutes** (default) |
| Refresh token TTL | **7 days** (default); rotate on use |
| Algorithm | RS256 or ES256 — no `none` |
| Required claims | `sub`, `exp`, `iat`, `iss`, `aud` |
| Tenant claim | `city_id` when multi-city |
| Storage (web) | Memory preferred; not `localStorage` for refresh if avoidable |

### Passwords (when used)

- Hash with **Argon2id** (preferred) or **bcrypt** (cost ≥ 12).
- Never store or log plaintext passwords.
- Enforce minimum length (≥ 12) and breach list check when online.

### MFA

- Required for `moderator`, `city_admin`, `security_audit` before production admin features.
- TOTP or WebAuthn — document in deployment guide when enabled.

## Authorization (AuthZ)

Authentication alone is insufficient. See [IDOR and access control](idor-and-access-control.md).

```text
Guard pipeline:  AuthGuard → TenantGuard → RolesGuard / Policy → Handler
```

| Principle | Implementation |
|-----------|----------------|
| Least privilege | Default deny; explicit grants per route |
| Server-side only | Never trust client role flags |
| Anonymous ≠ unrestricted | Anonymous can create/read per policy — not admin |

## Anonymous endpoints

Endpoints that allow anonymous access must still:

- Validate input (Zod)
- Enforce rate limits
- Scope by `city_id`
- Apply IDOR checks on object operations

## Token lifecycle

| Event | Action |
|-------|--------|
| Logout | Revoke refresh token server-side |
| Password change | Invalidate all refresh tokens |
| Role change | Invalidate tokens or reduce access token TTL |
| Suspected theft | Blocklist `jti` in Redis until `exp` |

## Service-to-service (future)

- mTLS or signed service JWT with narrow audience.
- Workers use DB role subject to RLS — not superuser.

## Checklist

- [ ] All protected routes have `@UseGuards` or global guard equivalent
- [ ] JWT verified with correct `aud` and `iss`
- [ ] Refresh endpoint rate limited
- [ ] Admin routes require role + MFA plan documented
- [ ] Tests: expired token, wrong role, missing `city_id` claim

## Related docs

- [IDOR and access control](idor-and-access-control.md)
- [Rate limiting and abuse](rate-limiting-and-abuse.md)
- [CORS and HTTP security](cors-and-http-security.md)
- [Phase gate — Phase 6](phase-gate-checklist.md#phase-6--authentication-and-identity)
