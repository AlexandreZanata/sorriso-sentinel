# Rate Limiting and Abuse Prevention

Public civic platforms are spam targets. Rate limiting protects availability without retaining unnecessary identity data.

Align with [privacy principle 5](../system/privacy-and-identity.md) — minimize metadata retention.

## Default limits (starting point)

Tune per environment. Document changes here.

| Endpoint class | Limit | Window | Key |
|----------------|-------|--------|-----|
| `POST /occurrences` | 10 | 1 hour | session / reputation id |
| `POST /validation/*` | 30 | 1 hour | session |
| `POST /comments` | 20 | 1 hour | session |
| `POST /auth/login` | 5 | 15 min | IP + identifier (hashed) |
| `POST /auth/refresh` | 60 | 1 hour | refresh token id |
| Media upload slot request | 20 | 1 hour | session |
| Global per IP (anonymous) | 300 | 1 hour | IP (short TTL only) |

**IP storage:** Use for rate limiting only; do not persist IP history tables. Redis TTL expires keys automatically.

## Implementation

- **Redis** sliding window or token bucket (BullMQ stack already includes Redis).
- Return `429 Too Many Requests` with `Retry-After` header.
- Include stable error body — no internal Redis keys in response.

## NestJS pattern

```text
@UseGuards(ThrottlerGuard)  // or custom Redis guard
```

Apply globally with stricter overrides on auth endpoints.

## Abuse patterns

| Pattern | Detection | Response |
|---------|-----------|----------|
| Occurrence spam | Burst creates same category/geo | Throttle + captcha hook (future) |
| Validation brigading | Coordinated confirm/deny | Consensus rules + anomaly job |
| Scraping map feed | High GET rate | Throttle + pagination caps |
| Credential stuffing | Failed logins | Lockout + alert |
| Upload flood | Many presigned requests | Per-session upload quota |

## Do not rely on rate limiting alone

Rate limits complement — do not replace — authz, validation, and consensus rules.

## Checklist

- [ ] New public write endpoints have defined limits
- [ ] Limits tested (11th request in window → 429)
- [ ] Redis failure mode documented (fail open vs closed — prefer **closed** for auth, **open with alert** for read if availability critical)

## Related docs

- [Authentication and authorization](authentication-authorization.md)
- [Media uploads](media-uploads.md)
- [Privacy and identity](../system/privacy-and-identity.md)
