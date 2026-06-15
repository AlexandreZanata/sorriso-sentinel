# Security Chain Failures

A **security chain** is the sequence of controls that must all hold for a request to be safe. A **chain failure** is when one layer is missing, bypassed, or trusted alone.

## Defense-in-depth model

```text
Client
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Transport        TLS, certificate pinning (mobile)   │
├─────────────────────────────────────────────────────────┤
│ 2. Edge             Rate limit, WAF (optional), CORS   │
├─────────────────────────────────────────────────────────┤
│ 3. API gateway      AuthN, request size limits          │
├─────────────────────────────────────────────────────────┤
│ 4. Application      AuthZ, validation, domain rules   │
├─────────────────────────────────────────────────────────┤
│ 5. Database         RLS, constraints, least-privilege │
├─────────────────────────────────────────────────────────┤
│ 6. Storage          Private bucket, signed URLs       │
├─────────────────────────────────────────────────────────┤
│ 7. Workers          Re-validate tenant, strip EXIF      │
└─────────────────────────────────────────────────────────┘
```

**Rule:** If layer N fails, layer N+1 must still prevent harm.

## Common chain failures

| Failure | What breaks | Safe pattern |
|---------|-------------|--------------|
| **UI-only authorization** | User calls API directly | Guards + handler policy + RLS |
| **Controller-only check** | Internal job or test helper skips guard | Central `AuthorizationService` or policy module |
| **Trust client `city_id`** | Cross-tenant data access | Resolve tenant from JWT/config; ignore client tenant override |
| **RLS disabled in dev** | Shipped to prod without RLS | RLS on in staging; migration tests assert policies exist |
| **ORM = safe assumption** | Raw `sql` fragment with user input | [SQL injection prevention](sql-injection.md) |
| **Presigned URL without link check** | Upload to bucket, attach to any occurrence | Verify occurrence ownership before issuing URL |
| **Worker trusts queue payload** | Forged job with another `city_id` | Re-load entity from DB; re-check tenant in worker |
| **Log the chain of trust** | PII in logs defeats privacy | [Secrets and logging](secrets-logging-and-data.md) |
| **Anonymous = no authz** | IDOR on public IDs | Anonymous still needs object-level checks |
| **Validation only on create** | Update endpoint skips Zod | Validate every write path |
| **CORS as security** | CORS blocks browsers, not curl | Never use CORS as sole access control |
| **Security through obscurity** | UUID hides resources | [IDOR](idor-and-access-control.md) — UUIDs are guessable over time |

## Layer failure matrix

What must still hold if an outer layer fails:

| Compromised layer | Minimum inner layers that must block abuse |
|-------------------|------------------------------------------|
| Client tampering | Server validation + authz |
| Stolen JWT | Short TTL + refresh rotation + RLS still scopes rows |
| Bug in handler | RLS denies cross-tenant row access |
| SQL bug in app | DB user has no `DROP`, minimal grants |
| Leaked presigned URL | Short TTL + object not linked until verified |
| Compromised worker | Worker DB user cannot bypass RLS (use same role policy) |

## Review questions (use in every PR)

1. If I remove the controller guard, is the handler still safe?
2. If I call the repository directly, does RLS block wrong `city_id`?
3. If I replay this request with another user's ID, what happens?
4. If this field is malicious JSON/HTML, where is it encoded or rejected?
5. If this endpoint is hammered, is there a rate limit?
6. Does a background job repeat all checks the HTTP path performs?

## Anti-patterns in this codebase

```text
❌  if (user.role === 'admin') in controller only
✅  Policy class + guard + RLS for admin tables

❌  db.execute(`SELECT * FROM occurrences WHERE id = '${id}'`)
✅  db.select().from(occurrences).where(eq(occurrences.id, id))

❌  Trust Expo/client to strip EXIF before upload
✅  Worker re-encodes image; EXIF removed server-side

❌  Return 404 for forbidden AND not-found inconsistently without policy
✅  Document chosen policy; test both cases
```

## Testing chain failures

Integration tests should explicitly **bypass outer layers** where safe:

| Test | Proves |
|------|--------|
| Request without `Authorization` | Returns 401 on protected routes |
| Valid token, wrong `city_id` in path | 403 or empty — never other tenant's rows |
| Direct repository call in test with wrong tenant | RLS blocks (when enabled) |
| Oversized body | Rejected at body parser / reverse proxy |
| Invalid state transition | Domain throws; DB unchanged |

## Related docs

- [Phase gate checklist](phase-gate-checklist.md)
- [IDOR and access control](idor-and-access-control.md)
- [Privacy and identity](../system/privacy-and-identity.md)
