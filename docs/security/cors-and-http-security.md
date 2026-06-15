# CORS and HTTP Security

CORS protects **browsers** from cross-origin misuse. It is **not** a substitute for authentication or authorization.

## CORS policy

### Development

| Setting | Value |
|---------|--------|
| Allowed origins | `http://localhost:3000` (web), Expo dev URLs as needed |
| Credentials | `true` only if cookies used; prefer `Authorization` header |
| Methods | Explicit list: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS` |
| Headers | `Content-Type`, `Authorization`, `X-Request-Id` |
| Preflight cache | `maxAge` ≤ 86400 |

### Production

| Setting | Value |
|---------|--------|
| Allowed origins | **Explicit allowlist** per environment — no `*` |
| Credentials | `true` only with named origins — never `*` + credentials |
| Wildcard subdomains | Avoid `*.example.com` unless controlled DNS |

### NestJS reference

```typescript
app.enableCors({
  origin: config.get<string[]>('CORS_ORIGINS'),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
  maxAge: 3600,
});
```

Load `CORS_ORIGINS` from environment — commit allowlists in `docs/deployment/production.md`, not secrets.

## Security headers

Apply at reverse proxy (nginx, Cloudflare) or NestJS helmet middleware:

| Header | Recommended value |
|--------|-------------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (production HTTPS only) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Restrict camera/geolocation to required origins |
| `Content-Security-Policy` | Tighten per app; start with default-src 'self' for admin |

### Web (Next.js) map tiles

MapLibre may require CSP exceptions for tile servers — document each `connect-src` and `img-src` host in deployment docs.

## Cookies (if used)

| Rule | Detail |
|------|--------|
| `HttpOnly` | Always for session cookies |
| `Secure` | Production only |
| `SameSite` | `Lax` or `Strict`; `None` only with `Secure` + justified |
| Scope | Minimal path; separate refresh token cookie if needed |

Prefer **Bearer JWT in memory** (SPA) over long-lived cookies when feasible.

## CSRF

| API style | CSRF mitigation |
|-----------|-----------------|
| Bearer token in `Authorization` | CSRF risk lower — still validate Origin on state-changing requests |
| Cookie-based session | CSRF token (double-submit or synchronizer) required |

See [input validation and XSS](input-validation-and-xss.md).

## Request size limits

| Layer | Limit |
|-------|--------|
| JSON body (API) | 1 MB default (adjust per endpoint) |
| File upload | [Media uploads](media-uploads.md) — use presigned direct-to-S3 |
| URL length | Reject oversized query strings at proxy |

## What CORS does not protect

- `curl`, Postman, mobile apps, server-side attackers
- IDOR — use [access control](idor-and-access-control.md)
- Rate limiting — use [rate limiting](rate-limiting-and-abuse.md)

## Checklist

- [ ] Production `CORS_ORIGINS` documented and reviewed per deploy
- [ ] No `origin: true` (reflect any origin) in production
- [ ] Security headers verified with securityheaders.com or CI probe
- [ ] TLS 1.2+ only; HTTP redirects to HTTPS

## Related docs

- [Phase gate — Phase 3](phase-gate-checklist.md#phase-3--read-occurrence-read-path-geo)
- [Production deployment](../deployment/production.md)
