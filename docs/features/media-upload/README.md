# Media Upload Module

**Bounded context:** Media  
**Status:** spec complete (implementation not started)  
**Principle:** [Privacy #6 — Anonymized photos](../../system/privacy-and-identity.md)  
**Security:** [media-uploads.md](../../security/media-uploads.md)

## One-line summary

Contributors attach **photo evidence** to occurrences via **presigned upload** → **worker strips EXIF** and re-encodes → only **sanitized** images are served publicly.

## Problem this module solves

Photos prove occurrences but leak identity through EXIF GPS, device model, and timestamps. Client-side stripping is unreliable. This module enforces **server-side anonymization**, size limits, and IDOR-safe linking before evidence affects trust or map display.

## Core concepts

| Term | Meaning |
|------|---------|
| **Upload slot** | Short-lived presigned PUT URL for one object |
| **Raw object** | Client upload in quarantine prefix — never public |
| **Sanitized object** | Worker output — EXIF-free, re-encoded |
| **Media asset** | Domain record linking occurrence ↔ sanitized storage key |
| **Processing status** | `pending` → `processing` → `ready` \| `failed` \| `quarantined` |
| **Evidence** | Media attached to occurrence — may affect validation weight (v2) |

## Hard limits (v1 — canonical)

| Limit | Value |
|-------|-------|
| Max file size | **10 MB** |
| Max images per occurrence | **5** |
| Max upload slots per session / hour | **20** |
| Allowed MIME | `image/jpeg`, `image/png`, `image/webp` |
| Max dimensions (decoded) | **8192 × 8192** px |
| Min dimensions | **100 × 100** px |
| Presigned URL TTL | **15 minutes** |
| Quarantine retention | **7 days** then delete |

Full security detail: [security/media-uploads.md](../../security/media-uploads.md).

## Docs in this module

| File | Description |
|------|-------------|
| [business-rules.md](business-rules.md) | Permissions, limits, forbidden actions |
| [flows.md](flows.md) | Presigned upload, worker pipeline, serve |
| [domain-model.md](domain-model.md) | `MediaAsset` aggregate, ports, events |
| [tdd-plan.md](tdd-plan.md) | Red → Green → Refactor test order |

## Dependencies

```text
Anonymity ──────────▶ session, ContributorRef
Occurrence creation ▶ occurrence must exist (same city)
Media upload (this module)
     │
     ├──▶ Worker (anonymize-media job)
     ├──▶ S3/MinIO storage
     └──▶ emits EvidenceAttached → Validation / Reputation (v2)
```

## Out of scope (v1)

- Video upload
- SVG / GIF animation
- Client-side-only EXIF removal as trusted path
- Public CDN without signed URLs
- AI content moderation (beyond MIME/magic checks)
- Attach at occurrence create (two-step: create → upload)

## Related docs

- [Security phase gate — Phase 5](../../security/phase-gate-checklist.md#phase-5--media-upload)
- [Community validation](../community-validation/README.md) — comments separate from photos
- [Occurrence lifecycle](../../system/occurrence-lifecycle.md) — `EvidenceAttached` event
