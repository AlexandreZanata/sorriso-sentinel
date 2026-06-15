import { z } from 'zod';

export const bootstrapSessionSchema = z
  .object({
    cityId: z.string().uuid(),
    localKeyRef: z.string().trim().min(8).max(128),
  })
  .strict();

export type BootstrapSessionInput = z.infer<typeof bootstrapSessionSchema>;
