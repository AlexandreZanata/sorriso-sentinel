import { z } from 'zod';
import {
  CONFIRM_VALIDATION_REASONS,
  DENY_VALIDATION_REASONS,
} from '@sorriso-sentinel/domain';

export const confirmOccurrenceSchema = z
  .object({
    version: z.number().int().positive(),
    reason: z.enum(CONFIRM_VALIDATION_REASONS).optional(),
  })
  .strict();

export const denyOccurrenceSchema = z
  .object({
    version: z.number().int().positive(),
    reason: z.enum(DENY_VALIDATION_REASONS).optional(),
  })
  .strict();

export type ConfirmOccurrenceInput = z.infer<typeof confirmOccurrenceSchema>;
export type DenyOccurrenceInput = z.infer<typeof denyOccurrenceSchema>;
