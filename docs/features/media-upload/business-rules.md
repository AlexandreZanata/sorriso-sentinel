# Media Upload — Business Rules

Photo evidence rules. Video, documents, and audio are out of scope for v1.

## Actors

Same as [Anonymity](../anonymity/business-rules.md#actors). Only **contributors** with valid session may request upload slots or complete uploads.

---

## Permissions matrix

Legend: ✅ allowed · ❌ forbidden · ⚠️ conditional

### Upload slot & attach

| Action | Visitor | Ghost | Pseudonym | Public | Moderator |
|--------|---------|-------|-----------|--------|-----------|
| Request upload slot | ❌ | ✅ | ✅ | ✅ | ✅ |
| Upload to presigned URL | ❌ | ✅ | ✅ | ✅ | ✅ |
| Complete / confirm upload | ❌ | ✅ | ✅ | ✅ | ✅ |
| Attach to own occurrence | ❌ | ✅ | ✅ | ✅ | ✅ |
| Attach to another user's occurrence | ❌ | ❌ | ❌ | ❌ | ⚠️ service |
| Attach to other city's occurrence | ❌ | ❌ | ❌ | ❌ | ❌ |
| Attach to `resolved` occurrence | ❌ | ⚠️ 24h window | same | same | ✅ |
| Attach when occurrence has 5 images | ❌ | ❌ | ❌ | ❌ | ❌ |
| View sanitized image on public occurrence | ✅ | ✅ | ✅ | ✅ | ✅ |
| View raw quarantine object | ❌ | ❌ | ❌ | ❌ | ⚠️ security only |
| Delete own uploaded image | ❌ | ⚠️ before `ready` only | same | same | ✅ |
| Replace image after `ready` | ❌ | ❌ | ❌ | ❌ | ⚠️ moderator |

### Trust & privacy

| Action | Allowed |
|--------|---------|
| Trust client EXIF strip | ❌ **always forbidden** |
| Store raw EXIF in database | ❌ |
| Serve raw upload before worker completes | ❌ |
| Include device model in metadata | ❌ |
| Store original filename from client | ❌ |

---

## File rules

| Rule | Value | Invariant |
|------|-------|-----------|
| Max size | 10 MB | INV-M1 |
| MIME allowlist | jpeg, png, webp | INV-M2 |
| Magic bytes must match Content-Type | required | INV-M3 |
| Max decoded dimensions | 8192×8192 | INV-M4 |
| Min dimensions | 100×100 | INV-M5 |
| SVG / HTML disguised as image | reject | INV-M6 |
| Animated WebP | reject (v1 static only) | INV-M7 |

---

## Per-occurrence limits

| Rule | Value |
|------|-------|
| Max media per occurrence | 5 |
| Max slots requested per hour / session | 20 |
| Max complete calls per slot | 1 |

> **INV-M8:** Sixth slot request for same occurrence → `403 MEDIA_LIMIT_REACHED`.

---

## IDOR & tenant rules

| Rule | ID | Description |
|------|-----|-------------|
| Slot only for occurrence in session `city_id` | INV-M9 | Tenant match |
| Uploader must have contribute permission | INV-M10 | Session required |
| Object key must match issued slot | INV-M11 | Prevents cross-link |
| Cannot complete upload for another user's slot | INV-M12 | Slot bound to `reputationId` |

Reporter may attach to **any** occurrence in city (not only own) — evidence is community contribution. Slot issuance still validates occurrence exists and is not deleted.

---

## Processing & visibility rules

| `processingStatus` | Public API shows image? | Map thumbnail? |
|--------------------|-------------------------|----------------|
| `pending` | ❌ | ❌ |
| `processing` | ❌ | ❌ |
| `ready` | ✅ signed URL | ✅ |
| `failed` | ❌ | ❌ |
| `quarantined` | ❌ | ❌ |

> **INV-M13:** `GET` media URL returns **404** until `ready` (or 403 per policy — document as 404 to avoid oracle).

### EXIF & metadata (worker output)

| Field | After worker |
|-------|--------------|
| GPS latitude/longitude | ❌ removed |
| Device make/model | ❌ removed |
| Software / author tags | ❌ removed |
| Original capture datetime | ❌ removed |
| Orientation | ✅ normalized into pixels |
| Image dimensions | ✅ preserved |

---

## Sensitive occurrences

| Rule | Behavior |
|------|----------|
| Photos allowed | ✅ |
| EXIF strip | ✅ mandatory |
| Author on media metadata | ❌ never |
| Public listing shows uploader | ❌ on sensitive — same as comments |
| Audit access raw | `security_audit` only |

---

## Domain invariants

| ID | Invariant |
|----|-----------|
| **INV-M1** | Raw upload size ≤ 10 MB |
| **INV-M2** | Declared MIME ∈ allowlist |
| **INV-M3** | Magic bytes match declared MIME |
| **INV-M4** | Decoded pixels ≤ 8192×8192 |
| **INV-M5** | Decoded pixels ≥ 100×100 |
| **INV-M6** | Reject non-image payloads |
| **INV-M7** | Static images only (v1) |
| **INV-M8** | ≤ 5 `ready` media per occurrence |
| **INV-M9** | `media.cityId === occurrence.cityId` |
| **INV-M10** | Slot created only with valid contributor session |
| **INV-M11** | Complete verifies `storageKey` matches slot |
| **INV-M12** | Slot `requestedBy` matches completer |
| **INV-M13** | No public URL until `processingStatus = ready` |
| **INV-M14** | Sanitized object has no EXIF GPS (verified in tests) |
| **INV-M15** | `EvidenceAttached` emitted only once per successful sanitize |

---

## Rate limits

| Action | Limit | Window |
|--------|-------|--------|
| Request upload slot | 20 | 1 h / session |
| Complete upload | 20 | 1 h / session |

See [rate limiting](../../security/rate-limiting-and-abuse.md).

---

## Explicit non-goals (v1)

- User-provided titles / captions on images (use comments)
- Public permanent URLs without expiry
- Bulk ZIP upload
- OCR on images

---

## Enforcement layers

| Rule | API | Worker | Storage |
|------|-----|--------|---------|
| INV-M1 | presigned `content-length-range` | re-check size | — |
| INV-M3, M6 | — | magic sniff | — |
| INV-M14 | — | re-encode strip EXIF | — |
| INV-M9 | handler + RLS | job re-validates | bucket policy |
| INV-M13 | signed GET guard | — | private bucket |

---

## Related docs

- [Flows](flows.md)
- [Domain model](domain-model.md)
- [TDD plan](tdd-plan.md)
- [Security media-uploads](../../security/media-uploads.md)
