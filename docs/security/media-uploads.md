# Media Upload Security

Photos are high-risk: EXIF leaks location, large files enable DoS, malicious content enables stored XSS or parser exploits.

Processing must follow [privacy principle 6](../system/privacy-and-identity.md) — **server-side worker always re-processes**; client stripping is not trusted.

## Hard limits (defaults)

These are project defaults until overridden by ADR. Enforce at **API**, **presigned URL policy**, and **worker**.

| Limit | Value | Enforced at |
|-------|-------|-------------|
| Max file size | **10 MB** per image | S3 presigned conditions, API metadata check |
| Max images per occurrence | **5** | API when linking media |
| Max uploads per session / hour | **20** | Redis rate limit |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` | Magic-byte sniff + declared Content-Type |
| Max decoded dimensions | **8192 × 8192** px | Worker after decode — reject larger |
| Presigned URL TTL | **15 minutes** | S3/MinIO policy |
| Min dimensions | **100 × 100** px | Reject thumbnails abuse / 1×1 tracking pixels |

Document changes to limits in CHANGELOG and this file.

## Upload flow (secure chain)

```text
1. Client requests upload slot → API validates occurrence ownership (IDOR)
2. API issues presigned PUT with:
     - fixed object key prefix (city_id/occurrence_id/uuid)
     - max content-length
     - allowed content-type
3. Client uploads directly to object storage
4. Client notifies API → job enqueued
5. Worker:
     - fetches object
     - verifies magic bytes match extension
     - re-encodes image (strips EXIF/metadata)
     - optional: virus scan hook
     - writes sanitized object; deletes or quarantines original
6. API serves only sanitized object via signed GET
```

Never serve the raw upload to other users before step 5 completes.

## Validation rules

### MIME and extension

- Reject mismatched extension vs magic bytes.
- Reject `image/svg+xml` on user upload paths (XSS vector) unless dedicated sanitizer exists.
- Reject polyglot files that decode as executable.

### Filename

- Ignore client filename for storage key; use server-generated UUID.
- No user-controlled path segments in object keys.

### Content

| Check | Action |
|-------|--------|
| EXIF GPS | Strip |
| Device model / software | Strip |
| Embedded thumbnails | Re-encode full image |
| Animated WebP/GIF abuse | Policy: static only for v1 or frame limit |

## IDOR on media

- Presigned URL issued only if caller may attach media to **that** `occurrence_id`.
- Completion callback must verify object key matches issued key.
- Cannot link another user's uploaded object key to your occurrence.

## Denial of service

| Vector | Mitigation |
|--------|------------|
| Huge file upload | Presigned `content-length-range` |
| Decompression bomb | Dimension cap after decode; pixel count limit |
| Many small uploads | Rate limits |
| Worker queue flood | Per-user job quota; dead-letter queue |

## Storage

| Rule | Detail |
|------|--------|
| Bucket ACL | Private — no public read |
| CDN | Signed URLs only; short TTL |
| Versioning | Optional for audit; lifecycle delete quarantine after 7 days |

## Error responses

- Do not echo internal object keys or bucket names in client errors.
- Log upload failures without storing raw image bytes in logs.

## Testing checklist

- [ ] Upload 11 MB → rejected
- [ ] Upload `text/html` disguised as `.jpg` → rejected at worker
- [ ] Image with GPS EXIF → GPS absent after worker
- [ ] Attach media to another tenant's occurrence → 403
- [ ] Expired presigned URL → upload fails

## Related docs

- [Media upload feature module](../features/media-upload/README.md) — limits, EXIF pipeline, TDD
- [IDOR and access control](idor-and-access-control.md)
- [Security chain failures](security-chain-failures.md)
- [Phase gate — Phase 5](phase-gate-checklist.md#phase-5--media-upload)
- [Privacy and identity](../system/privacy-and-identity.md)
