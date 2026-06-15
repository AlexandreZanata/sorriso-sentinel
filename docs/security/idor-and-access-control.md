# IDOR and Access Control

**IDOR** (Insecure Direct Object Reference) and **BOLA** (Broken Object Level Authorization) occur when a client supplies an object ID and the server fails to verify that the caller may access or modify that object.

UUID v7 IDs are **not** authorization. They are opaque identifiers — still enumerable via leaks, logs, and timing.

## Authorization model

```text
Authentication (AuthN)  →  Who is this caller? (including anonymous session)
Authorization (AuthZ)   →  May this caller perform this action on this resource?
```

Every mutating and sensitive read operation requires **both** when applicable.

## Mandatory checks

For every endpoint that accepts `occurrenceId`, `mediaId`, `commentId`, etc.:

1. **Resolve resource** from database (not cache-only for authz decisions).
2. **Verify tenant**: `resource.cityId === request.cityId` (from trusted context).
3. **Verify action policy**: e.g. only author pseudonym can edit within window; admin role for moderation.
4. **Apply privacy rules**: sensitive categories hide author even for "owner" on public API.
5. **Return consistent errors** per project policy (403 vs 404 — document choice).

## Trusted tenant context

| Source | Use |
|--------|-----|
| JWT claim `city_id` | Authenticated requests |
| Deployment config | Single-city deployment |
| Admin-selected city (admin UI) | Must require admin role |

| Never trust | Reason |
|-------------|--------|
| `city_id` in request body on create/update | Client can pick another tenant |
| `city_id` query param alone | Spoofable without binding to session |
| Object ID prefix or encoding | Obscurity is not authz |

## Horizontal vs vertical escalation

| Type | Example | Prevention |
|------|---------|------------|
| **Horizontal (IDOR)** | User A reads User B's occurrence by ID | Tenant + ownership policy |
| **Vertical** | Contributor calls `/admin/audit` | RBAC guard on route + handler |
| **Context switch** | Valid user changes `city_id` in JWT (if forged) | Sign JWT server-side; verify signature and claims |

## RBAC minimum roles (evolving)

| Role | Scope |
|------|--------|
| `anonymous` | Create/read per privacy rules; rate limited |
| `contributor` | Linked pseudonym operations |
| `moderator` | Review queue, hide content |
| `city_admin` | City-scoped configuration |
| `security_audit` | Audit logs for sensitive categories — break-glass logged |

Use **ABAC** when row-level attributes matter (privacy level, sensitive category, neighborhood).

## NestJS implementation pattern

```text
Request → AuthGuard → TenantGuard → PolicyGuard/Handler check → Repository (with city_id in WHERE) → RLS
```

Guards are not optional on "internal" controllers used by tests — use the same pipeline.

## Database layer (RLS)

Application checks must be **duplicated** by RLS where possible:

```sql
-- Conceptual policy: rows visible only for current city
CREATE POLICY occurrences_city_isolation ON occurrences
  USING (city_id = current_setting('app.city_id')::uuid);
```

Set `app.city_id` per connection/transaction from trusted middleware.

## IDOR test matrix (required for new routes)

| Case | Expected |
|------|----------|
| Valid ID, same tenant, allowed action | 200/201 |
| Valid ID, **wrong tenant** | 403 or 404 (per policy) |
| Valid ID, same tenant, **forbidden action** | 403 |
| Random UUID | 404 or 403 (consistent) |
| Soft-deleted resource | 404 |
| Sensitive occurrence — author field in response | Must be absent |

## Related docs

- [Security chain failures](security-chain-failures.md)
- [Authentication and authorization](authentication-authorization.md)
- [Privacy and identity](../system/privacy-and-identity.md)
- [Multitenancy rule](../../.cursor/rules/05-multitenancy.mdc)
