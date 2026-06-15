import { z } from 'zod';

export const addCommentSchema = z
  .object({
    text: z.string().trim().min(1).max(1000),
    parentCommentId: z.string().uuid().optional(),
  })
  .strict();

export type AddCommentInput = z.infer<typeof addCommentSchema>;
