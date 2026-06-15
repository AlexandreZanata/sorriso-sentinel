import { z } from 'zod';

export const rotateIdentitySchema = z
  .object({
    newLocalKeyRef: z.string().trim().min(8).max(128),
    rotationProof: z.string().trim().min(16).max(256),
  })
  .strict();

export type RotateIdentityInput = z.infer<typeof rotateIdentitySchema>;
