# Media Upload — TDD Plan

**Prerequisites:** [Occurrence creation](../occurrence-creation/tdd-plan.md) Step 7+ (occurrence in DB). [Anonymity](../anonymity/tdd-plan.md) session / ContributorRef.

## Vertical slice order

```text
Step 1  Media VOs + MediaUploadPolicy + MediaLimitPolicy
Step 2  MediaAsset.issueUploadSlot + UploadSlotValidator
Step 3  Shared Zod schemas
Step 4  RequestUploadSlotHandler (mocked storage)
Step 5  Image sanitizer adapter (worker unit tests)
Step 6  anonymize-media job
Step 7  CompleteUploadHandler + API integration
Step 8  Security: IDOR, size, EXIF, rate limits
```

---

## Step 1 — Value objects & policies

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 1.1 | `should_reject_content_type_svg` | INV-M6 | unit |
| 1.2 | `should_accept_image_jpeg_content_type` | INV-M2 | unit |
| 1.3 | `should_reject_content_length_over_10mb` | INV-M1 | unit |
| 1.4 | `should_forbid_sixth_media_on_occurrence` | INV-M8 | unit |
| 1.5 | `should_forbid_slot_when_hourly_limit_reached` | rate | unit |

**Green:** `media-content-type.vo.ts`, `media-limit.policy.ts`, `MediaUploadPolicy` defaults.

---

## Step 2 — MediaAsset aggregate

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 2.1 | `should_issue_slot_with_pending_status` | — | unit |
| 2.2 | `should_emit_upload_slot_issued_event` | — | unit |
| 2.3 | `should_transition_to_processing_on_complete` | — | unit |
| 2.4 | `should_transition_to_ready_and_emit_evidence_attached` | INV-M15 | unit |
| 2.5 | `should_reject_complete_with_wrong_storage_key` | INV-M11 | unit |
| 2.6 | `should_reject_complete_by_different_reputation_id` | INV-M12 | unit |
| 2.7 | `should_not_serve_publicly_when_pending` | INV-M13 | unit |

**Green:** `media-asset.entity.ts`, `upload-slot.validator.ts`.

---

## Step 3 — Shared schemas

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 3.1 | `should_reject_extra_fields_on_request_slot` | strict | unit |
| 3.2 | `should_reject_content_length_zero` | — | unit |

**Green:** `packages/shared/src/media/*.schema.ts`.

---

## Step 4 — Request slot handler

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 4.1 | `should_persist_media_asset_and_return_presigned_url` | — | unit |
| 4.2 | `should_return_403_when_occurrence_in_other_city` | INV-M9 | unit |
| 4.3 | `should_return_403_when_media_limit_reached` | INV-M8 | unit |
| 4.4 | `should_include_expiry_15_minutes_from_now` | TTL | unit |

**Green:** `request-upload-slot.handler.ts`.

---

## Step 5 — Image sanitizer (worker)

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 5.1 | `should_strip_gps_exif_from_jpeg_fixture` | INV-M14 | unit |
| 5.2 | `should_strip_device_model_metadata` | Principle 6 | unit |
| 5.3 | `should_reject_file_with_html_magic_bytes` | INV-M6 | unit |
| 5.4 | `should_reject_image_exceeding_8192_dimensions` | INV-M4 | unit |
| 5.5 | `should_reject_image_smaller_than_100x100` | INV-M5 | unit |
| 5.6 | `should_output_jpeg_without_metadata` | — | unit |

**Fixtures:** `packages/domain` or `apps/worker` test fixtures — sample JPEG with EXIF GPS.

**Green:** `image-sanitizer.adapter.ts` using sharp.

---

## Step 6 — Worker job

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 6.1 | `should_mark_ready_after_successful_sanitize` | — | unit |
| 6.2 | `should_mark_quarantined_on_invalid_magic_bytes` | — | unit |
| 6.3 | `should_be_idempotent_when_already_ready` | — | unit |
| 6.4 | `should_delete_raw_object_after_success` | storage | integration |

**Green:** `anonymize-media.ts`.

---

## Step 7 — API integration

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 7.1 | `should_return_401_when_requesting_slot_without_session` | INV-M10 | integration |
| 7.2 | `should_return_201_slot_and_upload_to_minio` | — | integration |
| 7.3 | `should_return_202_on_complete_and_enqueue_job` | — | integration |
| 7.4 | `should_list_only_ready_media_with_signed_urls` | INV-M13 | integration |
| 7.5 | `should_return_400_when_declared_size_over_10mb` | INV-M1 | integration |
| 7.6 | `should_process_job_and_reach_ready_end_to_end` | E2E slice | integration |

**Green:** Controllers + migration `0005_media_assets.sql` + MinIO in docker-validate.

---

## Step 8 — Security negatives

| # | Test name | Rule | Layer |
|---|-----------|------|-------|
| 8.1 | `should_return_403_when_linking_slot_to_other_tenant_occurrence` | IDOR | integration |
| 8.2 | `should_return_429_on_upload_slot_rate_limit` | rate | integration |
| 8.3 | `should_not_expose_raw_storage_key_in_public_api` | — | integration |
| 8.4 | `should_fail_put_to_expired_presigned_url` | TTL | integration |
| 8.5 | `should_not_log_raw_image_bytes_on_failure` | secrets | integration |

---

## Security phase gate mapping

| Phase 5 gate | Tests |
|--------------|-------|
| Upload limits | 1.3, 1.4, 7.5 |
| Presigned TTL | 4.4, 8.4 |
| EXIF worker | 5.1, 5.2, 5.6 |
| IDOR attach | 4.2, 8.1, 2.5 |
| Malware/size bomb | 5.3, 5.4 |

---

## Definition of done (media upload v1)

- [ ] Tests 1.1–8.5 green
- [ ] `docker-validate` includes MinIO upload + worker smoke
- [ ] [Security media-uploads](../../security/media-uploads.md) checklist marked
- [ ] No public access to `quarantine/` prefix
- [ ] EXIF GPS fixture test proves removal

---

## Suggested first RED test

```text
packages/domain/src/media/media-limit.policy.spec.ts

should_forbid_sixth_media_on_occurrence
```

---

## Related docs

- [Business rules](business-rules.md)
- [Domain model](domain-model.md)
- [Security phase gate — Phase 5](../../security/phase-gate-checklist.md#phase-5--media-upload)
