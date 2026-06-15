import { describe, expect, it } from 'vitest';
import {
  completeUploadSchema,
  createRequestUploadSlotSchema,
} from './request-upload-slot.schema.js';

describe('requestUploadSlotSchema', () => {
  it('should_reject_extra_fields_on_request_slot', () => {
    const result = createRequestUploadSlotSchema().safeParse({
      contentType: 'image/jpeg',
      contentLength: 1024,
      filename: 'photo.jpg',
    });

    expect(result.success).toBe(false);
  });

  it('should_reject_content_length_zero', () => {
    const result = createRequestUploadSlotSchema().safeParse({
      contentType: 'image/jpeg',
      contentLength: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe('completeUploadSchema', () => {
  it('should_accept_valid_uploaded_key', () => {
    const result = completeUploadSchema.safeParse({
      uploadedKey: 'quarantine/city/occurrence/media-id',
    });

    expect(result.success).toBe(true);
  });
});
