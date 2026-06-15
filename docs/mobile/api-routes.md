# Mobile API Routes

Mapping of HTTP routes to mobile features. **Source of truth:** `packages/shared/src/api-docs/api-spec.ts` (27 endpoints). Live spec: `GET /docs/spec.json`.

Legend:

- **Mobile** — `yes` = mobile MVP, `no` = web/admin only, `future` = later phase
- **Auth** — `public`, `session`, `jwt`, `admin`

## Health

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| GET | `/health` | no | public | Dev diagnostics only |
| GET | `/health/live` | no | public | — |
| GET | `/health/ready` | no | public | — |

## Sessions

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| POST | `/sessions/bootstrap` | yes | public | `bootstrap` — first launch, ghost identity |

## Occurrences

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| POST | `/occurrences` | yes | session | `occurrences/create` — report problem |
| GET | `/occurrences` | yes | session | `map` — list / map drawer |
| GET | `/occurrences/:id` | yes | session | `occurrences/detail` |
| GET | `/occurrences/:id/comments` | yes | session | `occurrences/detail` — comment thread |
| POST | `/occurrences/:id/comments` | yes | session | `occurrences/detail` — add comment |

## Validation

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| POST | `/occurrences/:id/confirm` | yes | session | `validation` — confirm vote |
| POST | `/occurrences/:id/deny` | yes | session | `validation` — deny vote |

## Media

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| POST | `/occurrences/:id/media/upload-slots` | yes | session | `media` — request presigned slot |
| POST | `/media/upload-slots/:slotId/complete` | yes | session | `media` — finalize upload |
| GET | `/occurrences/:id/media` | yes | session | `occurrences/detail` — gallery |

## Identity

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| PATCH | `/identity/mode` | yes | session | `identity/settings` — ghost / pseudonym / public |
| POST | `/identity/rotate` | yes | session | `identity/settings` — rotate cryptographic identity |

## Auth (account)

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| POST | `/auth/login` | yes | public | `account/login` |
| POST | `/auth/refresh` | yes | public | Background token refresh |
| POST | `/auth/logout` | yes | jwt | `account/settings` — revoke refresh family |

## User accounts

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| POST | `/user-accounts/register` | yes | session | `account/register` |
| POST | `/user-accounts/verify-email` | yes | public | `account/verify-email` |
| GET | `/user-accounts/me` | yes | jwt | `account/profile` |
| PATCH | `/user-accounts/me` | yes | jwt | `account/profile` — edit |
| PATCH | `/user-accounts/me/profile-photo` | yes | jwt | `account/profile` — photo |
| DELETE | `/user-accounts/me` | yes | jwt | `account/settings` — LGPD erasure |

## Admin

| Method | Path | Mobile | Auth | Feature / screen |
|--------|------|--------|------|------------------|
| GET | `/admin/audit-summary` | no | admin | Web admin — `security_audit` / `city_admin` |
| GET | `/admin/moderation-queue` | no | admin | Web admin — `moderator` / `city_admin` |

## Mobile MVP route count

| Category | Endpoints used by mobile |
|----------|--------------------------|
| Sessions | 1 |
| Occurrences | 5 |
| Validation | 2 |
| Media | 3 |
| Identity | 2 |
| Auth | 3 |
| User accounts | 6 |
| **Total** | **22** |

## Adapter module map

| API group | File `src/api/routes/` |
|-----------|-------------------------|
| Health | — (not used in mobile) |
| Sessions | `sessions.ts` |
| Occurrences | `occurrences.ts` |
| Validation | `validation.ts` |
| Media | `media.ts` |
| Identity | `identity.ts` |
| Auth | `auth.ts` |
| User accounts | `user-accounts.ts` |
| Admin | — (web only) |

## Related docs

- [API integration](api-integration.md)
- [API documentation](../api/README.md)
- [Feature modules](../features/README.md)
