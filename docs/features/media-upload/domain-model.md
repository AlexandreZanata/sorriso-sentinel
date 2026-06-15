# Media Upload — Domain Model (DDD)

Bounded context: **Media**  
Package root: `packages/domain/src/media/`

## Context map

```text
┌─────────────────┐                    ┌─────────────────┐
│   Occurrences   │◀── occurrenceId ───│      Media      │
└─────────────────┘                    │  (this module)  │
        ▲                              └────────┬────────┘
        │ EvidenceAttached                        │
        │                                         │ presigned / fetch
┌─────────────────┐                    ┌────────▼────────┐
│   Validation    │                    │  Worker + S3    │
│     (v2)        │                    │  (infrastructure)│
└─────────────────┘                    └─────────────────┘
         ▲
┌─────────────────┐
│    Identity     │  ContributorRef on slot
└─────────────────┘
```

---

## Aggregate: MediaAsset (root)

```text
MediaAsset (aggregate root)
├── id: MediaId (uuid v7)
├── occurrenceId: OccurrenceId
├── cityId: CityId
├── requestedBy: ContributorRef
├── contentType: MediaContentType (VO)
├── declaredContentLength: number
├── rawStorageKey: StorageKey (VO) — quarantine prefix
├── sanitizedStorageKey: StorageKey | null
├── processingStatus: MediaProcessingStatus (VO)
├── failureReason: MediaFailureReason | null
├── width: number | null
├── height: number | null
├── slotExpiresAt: Date
├── createdAt, updatedAt
└── version
```

### Factory & methods

```typescript
MediaAsset.issueUploadSlot(params: {
  occurrenceId, cityId, requestedBy, contentType, contentLength,
  storageKeyGenerator, clock, policy: MediaUploadPolicy,
}): DomainResult<{ asset: MediaAsset; event: UploadSlotIssued }>

markProcessing(): void
markReady(sanitizedKey: StorageKey, dimensions: ImageDimensions): EvidenceAttached
markFailed(reason: MediaFailureReason): void
markQuarantined(reason: MediaFailureReason): void
canServePublicly(): boolean  // status === ready
```

---

## Value objects

| VO | Validates |
|----|-----------|
| `MediaContentType` | `image/jpeg` \| `image/png` \| `image/webp` |
| `MediaProcessingStatus` | `pending` \| `processing` \| `ready` \| `failed` \| `quarantined` |
| `StorageKey` | server-generated; pattern `quarantine/{cityId}/{occurrenceId}/{uuid}` |
| `SanitizedStorageKey` | `sanitized/{cityId}/{occurrenceId}/{uuid}.jpg` (normalized format v1) |
| `ImageDimensions` | width/height within INV-M4, M5 |
| `MediaUploadPolicy` | limits from business rules |
| `ContentLength` | 1 byte – 10 MB |

---

## Domain services

### `MediaLimitPolicy`

```typescript
canAttachMore(existingReadyCount: number, policy: MediaUploadPolicy): boolean
canRequestSlot(sessionSlotCountLastHour: number): boolean
```

### `UploadSlotValidator`

```typescript
validateComplete(asset: MediaAsset, completer: ContributorRef, uploadedKey: StorageKey): Result<void, DomainError>
```

Enforces INV-M11, INV-M12.

### `ImageSanitizationPort` (infrastructure interface)

```typescript
sanitize(rawBuffer: Buffer): Promise<SanitizedImageResult>
// implementation in worker — not in domain package
```

Domain defines **contract** + expected properties (no EXIF GPS).

```typescript
interface SanitizedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  exifStripped: true;
  outputContentType: 'image/jpeg'; // v1 normalize to jpeg
}
```

---

## Ports

| Port | Methods | Adapter |
|------|---------|---------|
| `MediaAssetRepository` | `save`, `findById`, `countReadyByOccurrence` | Drizzle |
| `OccurrenceReadPort` | `exists(id, cityId)`, `isAttachable(id)` | API infra |
| `ObjectStoragePort` | `presignedPut`, `presignedGet`, `getObject`, `putObject`, `deleteObject` | MinIO/S3 |
| `MediaJobQueuePort` | `enqueueAnonymize(mediaId)` | BullMQ |
| `ImageSanitizationPort` | `sanitize` | Worker (sharp or similar) |

---

## Domain events

| Event | Payload |
|-------|---------|
| `UploadSlotIssued` | `mediaId`, `occurrenceId`, `cityId`, `expiresAt` |
| `MediaProcessingStarted` | `mediaId` |
| `MediaSanitized` | `mediaId`, `width`, `height` |
| `EvidenceAttached` | `mediaId`, `occurrenceId`, `cityId` |
| `MediaQuarantined` | `mediaId`, `reasonCode` |
| `MediaProcessingFailed` | `mediaId`, `reasonCode` |

No raw/sanitized keys on public event bus.

---

## Application layer (API)

```text
apps/api/src/features/media/
├── request-upload-slot/
│   ├── request-upload-slot.controller.ts
│   └── request-upload-slot.handler.ts
├── complete-upload/
├── list-occurrence-media/
└── media.module.ts
```

---

## Worker layer

```text
apps/worker/src/jobs/
├── anonymize-media.ts
├── anonymize-media.spec.ts
└── image-sanitizer.adapter.ts   # ImageSanitizationPort impl
```

Recommended library: **sharp** (MIT) — strip metadata, re-encode JPEG.

```typescript
// Worker implementation sketch (infrastructure)
sharp(input).rotate().jpeg({ quality: 85 }).toBuffer()
// .withMetadata() NOT called — strips EXIF
```

---

## Shared schemas (`packages/shared/src/media/`)

```typescript
requestUploadSlotSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  contentLength: z.number().int().positive().max(10 * 1024 * 1024),
}).strict();

completeUploadSchema = z.object({
  uploadedKey: z.string().min(1).max(512),
}).strict();
```

---

## Database (migration 0005 — planned)

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id),
  city_id UUID NOT NULL,
  requested_by_reputation_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  declared_content_length INT NOT NULL,
  raw_storage_key TEXT NOT NULL,
  sanitized_storage_key TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  width INT,
  height INT,
  slot_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_media_occurrence ON media_assets(occurrence_id);
CREATE INDEX idx_media_status ON media_assets(processing_status)
  WHERE processing_status IN ('pending', 'processing');

-- Partial unique: max 5 ready per occurrence enforced in app + trigger optional
```

RLS: `city_id` match; public read via API signed URLs only — no direct table exposure.

---

## Storage layout (MinIO)

```text
sorriso-media/
├── quarantine/{city_id}/{occurrence_id}/{media_id}   # raw — private
└── sanitized/{city_id}/{occurrence_id}/{media_id}.jpg
```

Bucket: private ACL; CORS for presigned PUT from web/mobile origins only.

---

## Folder layout

```text
packages/domain/src/media/
├── media-asset.entity.ts
├── media-asset.entity.spec.ts
├── value-objects/
│   ├── media-content-type.vo.ts
│   ├── media-processing-status.vo.ts
│   ├── storage-key.vo.ts
│   └── media-upload-policy.vo.ts
├── services/
│   ├── media-limit.policy.ts
│   └── upload-slot.validator.ts
├── events/
│   ├── evidence-attached.event.ts
│   └── upload-slot-issued.event.ts
└── ports/
    ├── media-asset.repository.port.ts
    ├── object-storage.port.ts
    └── image-sanitization.port.ts
```

---

## Cross-module contracts

| Module | Contract |
|--------|----------|
| [Occurrence creation](../occurrence-creation/README.md) | Occurrence must exist before slot |
| [Anonymity](../anonymity/README.md) | `requestedBy` = ContributorRef |
| [Community validation](../community-validation/README.md) | Photos ≠ votes; `EvidenceAttached` does not change confidence v1 |
| [Security](../../security/media-uploads.md) | Limits and chain |

---

## Related docs

- [Business rules](business-rules.md)
- [TDD plan](tdd-plan.md)
- [Docker / MinIO](../../deployment/docker.md)
