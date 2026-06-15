import { z } from 'zod';

export const createOccurrenceSchema = z.object({
  cityId: z.string().uuid(),
  category: z.string().min(1).max(64),
  description: z.string().max(2000).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  privacyLevel: z.enum(['public', 'neighborhood', 'approximate', 'hidden']),
});

export type CreateOccurrenceInput = z.infer<typeof createOccurrenceSchema>;
