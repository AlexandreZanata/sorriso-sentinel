# API documentation

Interactive reference for all public HTTP routes, served by the NestJS API.

| URL | Format | Description |
|-----|--------|-------------|
| `GET /docs` | HTML | Custom UI (atomic design: atoms → molecules → organisms) |
| `GET /docs/spec.json` | JSON | Machine-readable spec with real example values |

## Source of truth

- **Spec & examples:** `packages/shared/src/api-docs/` — `getApiDocumentationSpec(baseUrl)` builds the full catalog (27 endpoints).
- **HTML renderer:** `apps/api/src/features/docs/` — server-side UI without a separate frontend build.

Example values mirror the live system: city UUID `01932f1a-0000-7000-8000-000000000001`, reputation IDs `Rep-XXXXX`, session bootstrap flow, validation votes, user account fields, etc.

## Legacy OpenAPI stubs

| File | Routes |
|------|--------|
| [occurrences.yaml](occurrences.yaml) | `POST /occurrences` |

These YAML stubs remain for early contracts; prefer `/docs` and `/docs/spec.json` for the current API surface.

## Local access

With the API on port 3010:

```bash
curl -s http://127.0.0.1:3010/docs | head
curl -s http://127.0.0.1:3010/docs/spec.json | jq '.endpoints | length'
```

Set `API_PUBLIC_URL` when the API is behind a reverse proxy so generated links in the spec use the public origin.
