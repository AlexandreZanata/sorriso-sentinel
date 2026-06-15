import { z } from 'zod';

export const changeIdentityModeSchema = z
  .object({
    mode: z.enum(['ghost', 'pseudonym', 'public']),
    pseudonym: z.string().trim().min(3).max(32).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.mode === 'pseudonym' && !value.pseudonym) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pseudonym is required for pseudonym mode',
        path: ['pseudonym'],
      });
    }
  });

export type ChangeIdentityModeInput = z.infer<typeof changeIdentityModeSchema>;
