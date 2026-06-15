# Input Validation and XSS

All external input is untrusted: JSON bodies, query params, path params, headers, file metadata, and queue messages.

## Validation strategy

```text
HTTP request → Zod schema (packages/shared) → DTO → domain invariants → persistence
```

| Layer | Responsibility |
|-------|----------------|
| `packages/shared` | Syntax, types, ranges, string length |
| Domain | Business rules (state transitions, confidence bounds) |
| Database | Constraints, enums, CHECK, FK |

**Rule:** Controllers do not parse raw `req.body` without schema validation.

## Zod conventions

- One schema per command/query in `packages/shared`.
- Export inferred types: `type CreateOccurrenceInput = z.infer<typeof createOccurrenceSchema>`.
- Reject unknown keys: `z.object({...}).strict()` on write schemas.
- Coerce carefully — prefer explicit `z.coerce.number()` with bounds.

### Example bounds (occurrences)

| Field | Validation |
|-------|------------|
| `category` | Enum or max length 64 |
| `latitude` | -90 to 90 |
| `longitude` | -180 to 180 |
| Free text | Max length 2000; HTML stripped or escaped on output |
| `privacyLevel` | Enum allowlist |

## XSS (Cross-Site Scripting)

| Context | Defense |
|---------|---------|
| JSON API | `Content-Type: application/json`; no HTML in API responses unless escaped |
| Web (Next.js) | React auto-escapes; avoid `dangerouslySetInnerHTML` |
| User comments | Sanitize or strip HTML server-side; block script tags |
| Map popups | Encode user text; CSP restricts inline scripts |
| Admin dashboard | Strict CSP; sanitize rich text if ever allowed |

Stored XSS in comments is a **write-path** problem — filter on ingest, encode on egress.

## CSRF

See [CORS and HTTP security](cors-and-http-security.md).

- Cookie sessions: require CSRF token on mutations.
- Bearer tokens: validate `Origin` / `Referer` on sensitive POST/PATCH/DELETE.

## Injection beyond SQL

| Vector | Prevention |
|--------|------------|
| SQL | [SQL injection](sql-injection.md) |
| NoSQL (Redis keys) | No user input in key names; hash or allowlist |
| Command | Never `exec` shell with user input |
| LDAP / template | N/A today — forbid without review |
| Log injection | Sanitize newlines in user strings before logging |

## Anti-doxxing (content filter)

Block or flag patterns in free text (server-side on write):

- CPF, phone numbers, license plates
- Full residential addresses when policy requires
- Email addresses in public comments (configurable)

Align with [privacy principle 12](../system/privacy-and-identity.md).

## Error messages

- Validation errors: field-level messages without stack traces in production.
- Do not echo unsanitized user input in error text (reflection XSS in HTML error pages).

## Testing

- [ ] Schema rejects extra properties
- [ ] Oversized strings rejected
- [ ] `<script>alert(1)</script>` in comment stored safely or rejected
- [ ] Invalid enums return 400 with stable error shape

## Related docs

- [SQL injection](sql-injection.md)
- [Phase gate — universal](phase-gate-checklist.md#universal-gates-every-pr)
- [Privacy and identity](../system/privacy-and-identity.md)
