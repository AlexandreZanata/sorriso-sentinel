# Occurrence Creation — Flows

## 1. Primary flow — report from map (happy path)

```mermaid
sequenceDiagram
    participant App as Mobile/Web
    participant API as API Gateway
    participant Identity as Identity context
    participant Handler as CreateOccurrenceHandler
    participant Domain as Occurrence aggregate
    participant Geo as LocationPrivacyService
    participant DB as PostgreSQL
    participant Outbox as Event outbox

    App->>API: POST /occurrences + session token
    Note over App,API: Body: category, lat, lng, privacyLevel, description?
    API->>API: Rate limit check
    API->>Identity: resolveContributor(session)
    Identity-->>API: ContributorRef + AuthorDisplayPolicy
    API->>Handler: CreateOccurrenceCommand
    Handler->>Handler: resolve cityId (Rule C2)
    Handler->>Domain: Occurrence.createNew(...)
    Domain->>Identity: applySensitiveCategoryPolicy(category)
    Domain->>Geo: applyPrivacyShift(privacyLevel, coordinates)
    Geo-->>Domain: storedLocation
    Domain-->>Handler: Occurrence + OccurrenceCreated
    Handler->>DB: INSERT occurrences
    Handler->>Outbox: OccurrenceCreated
    Handler-->>API: OccurrenceCreatedDto
    API-->>App: 201 Created
```

---

## 2. Reject contributor GPS (security path)

```mermaid
sequenceDiagram
    participant App
    participant API

    App->>API: POST /occurrences { ..., contributorLatitude: -12.5 }
    API->>API: Zod strict() rejects unknown/forbidden fields
    API-->>App: 400 VALIDATION_ERROR
```

---

## 3. Sensitive category create

```mermaid
flowchart TD
    A[POST category=crime] --> B[SensitiveCategoryPolicy]
    B --> C[forced_ghost display]
    C --> D[Encrypt description]
    D --> E[Persist with sensitive flag]
    E --> F[Map response DTO]
    F --> G[Strip author fields]
    G --> H[201 — no author in JSON]
```

---

## 4. City mismatch (IDOR prevention)

```mermaid
sequenceDiagram
    participant App
    participant Handler
    participant Session

    App->>Handler: POST { cityId: city-B }
    Handler->>Session: session.cityId = city-A
    Handler->>Handler: cityId mismatch
    Handler-->>App: 403 FORBIDDEN_CITY
```

---

## 5. Approximate privacy at write

```mermaid
sequenceDiagram
    participant Domain as Occurrence
    participant Geo as LocationPrivacyService

    Domain->>Geo: shift(problemLocation, approximate_100)
    Geo->>Geo: random bearing, 100m offset
    Geo-->>Domain: shifted lat/lng
    Note over Domain: Store shifted coords for map;<br/>optionally retain true point in encrypted column (v2)
```

**v1 decision:** Store single pair — shifted coordinates when `privacyLevel = approximate`. True point recovery is **not** required for v1 (document in ADR if changed).

---

## 6. Rate limit exceeded

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Redis

    App->>API: POST /occurrences (11th in hour)
    API->>Redis: INCR create:reputationId
    Redis-->>API: count > 10
    API-->>App: 429 Retry-After: 3600
```

---

## Command catalog

### `CreateOccurrence`

| Property | Value |
|----------|-------|
| **Actor** | Authenticated contributor |
| **Idempotent** | No (each call creates new occurrence) |
| **Transaction** | Single DB transaction + outbox |

**Input (application DTO after Zod):**

```typescript
// Conceptual — not implementation
{
  category: string;
  description?: string;
  problemLocation: { latitude: number; longitude: number };
  privacyLevel: 'public' | 'neighborhood' | 'approximate' | 'hidden';
  occurrenceKind?: 'problem' | 'temporary_event';
  cityId?: string; // validated against session
}
```

**Plus from context (not client body):**

```typescript
{
  contributorRef: ContributorRef;
  resolvedCityId: string;
}
```

**Output:** `OccurrenceCreatedDto` + event `OccurrenceCreated`

**Errors:**

| Code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 400 | Zod / domain VO failure |
| `INVALID_CATEGORY` | 400 | Unknown category |
| `DOXXING_DETECTED` | 400 | Description filter |
| `UNAUTHORIZED` | 401 | No session |
| `FORBIDDEN_CITY` | 403 | cityId mismatch |
| `RATE_LIMITED` | 429 | INV-O11 |

---

## Query catalog (creation slice)

Creation is write-only. Related read for UX:

| Query | Purpose |
|-------|---------|
| `GET /categories` | List allowed categories for city (cached) |
| `GET /occurrences/:id` | Confirm create — separate read slice (Phase 3) |

---

## Domain events

| Event | When | Consumers (future) |
|-------|------|-------------------|
| `OccurrenceCreated` | After persist | Territorial indexing, city health counters, notifications |
| `SensitiveOccurrenceCreated` | Subtype or flag on payload | Audit log, elevated review queue |

`OccurrenceCreated` payload (no PII):

```typescript
{
  occurrenceId: string;
  cityId: string;
  category: string;
  occurrenceKind: string;
  status: 'unverified';
  privacyLevel: string;
  isSensitive: boolean;
  occurredAt: Date;
}
```

---

## UI flows (presentation)

### Mobile / Web report wizard

```text
1. Pin on map (problem location)     → lat/lng
2. Select category                  → category + kind inferred
3. Optional description             → text
4. Privacy level selector           → privacyLevel
5. Identity mode (from Anonymity)   → read-only summary
6. Submit                           → POST /occurrences
7. Success                          → show id + "awaiting validation"
```

No step collects device GPS for storage — map pin is **problem** location only.

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Anonymity flows](../anonymity/flows.md)
- [Occurrence lifecycle](../../system/occurrence-lifecycle.md)
