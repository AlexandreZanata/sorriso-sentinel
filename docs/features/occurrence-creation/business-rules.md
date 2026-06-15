# Occurrence Creation — Business Rules

Rules for **creating** an occurrence. Lifecycle transitions after creation belong to the Community validation module.

## Actors

Same actors as [Anonymity](../anonymity/business-rules.md#actors). Only **contributors** (ghost, pseudonym, public, moderator) may create — not visitors.

---

## Permissions matrix

Legend: ✅ allowed · ❌ forbidden · ⚠️ conditional

### Create occurrence

| Action | Visitor | Ghost | Pseudonym | Public | Moderator |
|--------|---------|-------|-----------|--------|-----------|
| `POST /occurrences` | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create without session | ❌ | ❌ | ❌ | ❌ | ⚠️ service account |
| Create in another city | ❌ | ❌ | ❌ | ❌ | ⚠️ admin only |
| Set initial status ≠ `unverified` | ❌ | ❌ | ❌ | ❌ | ❌ |
| Set initial confidence > 0 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Choose sensitive category | ❌ | ✅ | ✅ | ✅ | ✅ |
| See own author on sensitive create response | ❌ | ❌ | ❌ | ❌ | ❌ |

### Payload fields

| Field | Required | Contributor may set | Notes |
|-------|----------|-------------------|-------|
| `category` | ✅ | ✅ | Must be allowed category for city |
| `latitude` / `longitude` | ✅ | ✅ | Problem location only |
| `privacyLevel` | ✅ | ✅ | Default `public` if omitted in API policy |
| `description` | ❌ | ✅ | Max 2000 chars; anti-doxxing filter |
| `occurrenceKind` | ❌ | ✅ | Default `problem`; `temporary_event` for fairs, etc. |
| `cityId` | ⚠️ | ⚠️ | Must match session tenant — see Rule C2 |
| `contributorLatitude` | ❌ | ❌ | **Forbidden** — INV-O4 |
| `contributorLongitude` | ❌ | ❌ | **Forbidden** — INV-O4 |
| `status` | ❌ | ❌ | Server assigns `unverified` |
| `confidenceLevel` | ❌ | ❌ | Server assigns `0` |
| `reputationId` | ❌ | ❌ | Resolved from session |
| `authorDisplayName` | ❌ | ❌ | Resolved from identity context |

---

## Category rules

### Allowed categories (configurable per `city_id`)

| Category | Kind default | Sensitive | Notes |
|----------|--------------|-----------|-------|
| `pothole` | problem | No | |
| `flooding` | problem | No | |
| `broken_light` | problem | No | |
| `accident` | problem | No | |
| `construction` | temporary_event | No | |
| `fair` | temporary_event | No | |
| `road_closure` | temporary_event | No | |
| `wildfire` | problem | No | Rural parity |
| `rural_road_damage` | problem | No | |
| `loose_animal` | problem | No | |
| `crime` | problem | **Yes** | Author never shown |
| `violence` | problem | **Yes** | Author never shown |
| `corruption` | problem | **Yes** | Encrypt description |
| `trafficking` | problem | **Yes** | Encrypt description |

> **Rule C1:** Unknown category → `400 INVALID_CATEGORY`. Cities may enable subsets via config.

### Sensitive category behavior on create

| Behavior | Enforced |
|----------|----------|
| `authorDisplayPolicy = forced_ghost` | Domain + API response |
| Description encrypted at rest | DB `pgcrypto` or app layer |
| Higher validation threshold flag stored | Domain metadata |
| Author fields omitted from response DTO | API mapper |

Uses [Anonymity `SensitiveCategoryPolicy`](../anonymity/domain-model.md#domain-services).

---

## Privacy level rules (at creation)

| Level | Stored coordinates | Map at create response | Notes |
|-------|-------------------|------------------------|-------|
| `public` | Exact problem location | Exact pin (if exposed in create response) | Default |
| `neighborhood` | Exact internally | Neighborhood name only in public DTO | PostGIS lookup async ok |
| `approximate` | Shifted point (50/100/200m) | Shifted pin only | Shift at **write** in domain service |
| `hidden` | Exact internally | No pin; confirmation message only | Stats-only visibility |

> **Rule P1:** Privacy applies to **problem** location — contributor location is never collected (INV-O4).

Approximate shift parameters (v1 defaults):

| Variant | Offset |
|---------|--------|
| `approximate_50` | Random bearing, 50m |
| `approximate_100` | 100m (default when `approximate`) |
| `approximate_200` | 200m |

---

## Domain invariants

| ID | Invariant |
|----|-----------|
| **INV-O1** | New occurrence `status` is always `unverified` |
| **INV-O2** | New occurrence `confidenceLevel` is always `0` |
| **INV-O3** | `problemLocation` must be valid WGS84 inside city bounds (or warn — configurable) |
| **INV-O4** | Contributor GPS fields are rejected — not stored, not accepted |
| **INV-O5** | `contributorRef.reputationId` must be present — from authenticated session |
| **INV-O6** | `cityId` on record equals tenant from session (Rule C2) |
| **INV-O7** | Sensitive category forces `forced_ghost` author display |
| **INV-O8** | Description passes anti-doxxing filter if present |
| **INV-O9** | `version` starts at `1` |
| **INV-O10** | `OccurrenceCreated` domain event emitted exactly once per successful create |
| **INV-O11** | Duplicate create burst from same session (>10/hour) blocked by rate limit |

---

## Trusted tenant context (Rule C2)

```text
resolvedCityId = session.cityId OR deployment.singleCityId
```

| Case | Result |
|------|--------|
| Body `cityId` matches `resolvedCityId` | Proceed |
| Body `cityId` missing | Use `resolvedCityId` |
| Body `cityId` mismatch | `403 FORBIDDEN_CITY` |
| No session | `401 UNAUTHORIZED` |

Never persist an occurrence under a city the contributor does not belong to.

---

## Rate limits (creation only)

| Limit | Value | Key |
|-------|-------|-----|
| Creates per session per hour | 10 | `reputationId` + window |
| Creates per IP per hour (fallback) | 30 | Redis TTL |

See [rate limiting](../../security/rate-limiting-and-abuse.md). Exceeding → `429` with `Retry-After`.

---

## API response rules

| Field in response | Included |
|-------------------|----------|
| `id` | ✅ |
| `category`, `status`, `confidenceLevel` | ✅ |
| `privacyLevel` | ✅ |
| `problemLocation` | ⚠️ per privacy level |
| `description` | ⚠️ only for creator on sensitive; public DTO may redact |
| `author`, `pseudonym`, `reputationId` | ❌ never on sensitive; ⚠️ per display policy otherwise |
| `createdAt` | ✅ |
| Internal `contributorRef` | ❌ |

---

## Explicit non-goals (v1)

- Bulk import of occurrences
- Creating on behalf of another user without moderator role
- Backdating `createdAt`
- Creating already `resolved` or `active` occurrences

---

## Enforcement layers

| Rule | Domain | API | Database |
|------|--------|-----|----------|
| INV-O1, O2, O9 | `Occurrence.create()` | — | DEFAULT constraints |
| INV-O4 | — | Zod `.strict()` + 400 | No columns |
| INV-O6 | Handler checks tenant | 403 | RLS `city_id` |
| INV-O7 | `SensitiveCategoryPolicy` | Response mapper | RLS |
| INV-O8 | `ContentPolicyService` | 400 | — |
| INV-O11 | — | Throttler guard | — |

---

## Related docs

- [Flows](flows.md)
- [Domain model](domain-model.md)
- [TDD plan](tdd-plan.md)
- [Anonymity business rules](../anonymity/business-rules.md)
- [Security — Phase 2](../../security/phase-gate-checklist.md#phase-2--create-occurrence-write-path)
