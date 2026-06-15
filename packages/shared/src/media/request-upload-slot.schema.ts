import { z } from 'zod';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function createRequestUploadSlotSchema(maxFileSizeBytes = MAX_FILE_SIZE_BYTES) {
  return z
    .object({
      contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
      contentLength: z
        .number()
        .int()
        .positive()
        .max(maxFileSizeBytes),
    })
    .strict();
}

export const requestUploadSlotSchema = createRequestUploadSlotSchema();

export type RequestUploadSlotInput = z.infer<typeof requestUploadSlotSchema>;

export const completeUploadSchema = z
  .object({
    uploadedKey: z.string().min(1).max(512),
  })
  .strict();

export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
