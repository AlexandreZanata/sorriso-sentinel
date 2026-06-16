# Mobile API Integration

How the React Native client talks to the NestJS API. Route details: [api-routes.md](api-routes.md). Machine-readable spec: `GET /docs/spec.json`.

## Base URL

| Environment | URL |
|-------------|-----|
| Local (Docker API) | `http://127.0.0.1:3010` |
| Production | `EXPO_PUBLIC_API_URL` — HTTPS only |

Use physical device with Expo: replace `127.0.0.1` with machine LAN IP or tunnel.

## HTTP client (`src/api/client.ts`)

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` when authenticated |
| `x-correlation-id` | UUID v7 per request — [observability](../contributing/ci-cd.md) |
| `x-city-id` | Optional; must match token `city_id` or API returns 403 |

```typescript
// Planned shape
export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: 'session' | 'jwt' | 'none' },
): Promise<T>;
```

## Authentication modes

| Mode | Token source | TTL | Routes |
|------|--------------|-----|--------|
| **Ghost session** | `POST /sessions/bootstrap` | 24h HMAC | Occurrence create, validation, anonymous reads |
| **JWT access** | `POST /auth/login` | 15 min | Account profile, authenticated writes |
| **JWT refresh** | `POST /auth/refresh` | Rotating | Renew access without re-login |

Store tokens in **Expo SecureStore** — never AsyncStorage for secrets.

## Route adapters (`src/api/routes/`)

One file per API group — thin wrappers over `apiRequest`:

```text
api/routes/occurrences.ts
  createOccurrence(body)
  listOccurrences(query)
  getOccurrence(id)
  listComments(id)
  addComment(id, body)
```

Types inferred from `packages/shared` Zod schemas where available; otherwise from `ApiDocumentationSpec` in `packages/shared/src/api-docs/`.

## Error mapping

| HTTP | API pattern | Mobile action | i18n key (example) |
|------|-------------|---------------|---------------------|
| 400 | Validation | Show field errors | `errors.validation` |
| 401 | Missing / expired token | Refresh or re-bootstrap | `errors.sessionExpired` |
| 403 | `CITY_MISMATCH`, role denied | Block action | `errors.forbidden` |
| 404 | Not found | Navigate back | `errors.notFound` |
| 429 | Rate limit | Disable button + countdown | `errors.rateLimitExceeded` |
| 5xx | Server error | Retry banner | `errors.serverError` |

Never log tokens or passwords. Correlation id may be shown in debug builds only.

## Multitenancy

Every tenant-scoped call includes `cityId` in body or derives from token. Mobile must not allow switching city without new bootstrap/login.

## Media uploads

Direct upload to presigned URL — **not** through API body. Max **10 MB** per image; client validates size before PUT. See [media-uploads.md](../security/media-uploads.md).

## Admin routes

`GET /admin/*` routes are **web admin only** for MVP — not exposed in mobile navigation. Documented in [api-routes.md](api-routes.md) for completeness.

## Sync with API spec

When API routes change:

1. Update `packages/shared/src/api-docs/api-spec.ts`
2. Update [api-routes.md](api-routes.md) mobile column
3. Update route adapter module
4. Run `pnpm run docker:api-routes`

## Related docs

- [API documentation](../api/README.md)
- [Authentication](../security/authentication-authorization.md)
- [IDOR and access control](../security/idor-and-access-control.md)
