import { z } from 'zod';

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const MAX_LIST_LIMIT = 100;
export const DEFAULT_LIST_LIMIT = 50;
export const MAX_BBOX_SPAN_DEGREES = 0.5;

export const listOccurrencesQuerySchema = z
  .object({
    minLatitude: latitude,
    maxLatitude: latitude,
    minLongitude: longitude,
    maxLongitude: longitude,
    limit: z.coerce.number().int().min(1).max(MAX_LIST_LIMIT).optional(),
    cursor: z.string().min(1).max(256).optional(),
    status: z
      .enum([
        'unverified',
        'under_review',
        'active',
        'low_confidence',
        'resolved',
      ])
      .optional(),
    category: z.string().min(1).max(64).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.minLatitude >= value.maxLatitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minLatitude must be less than maxLatitude',
        path: ['minLatitude'],
      });
    }

    if (value.minLongitude >= value.maxLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minLongitude must be less than maxLongitude',
        path: ['minLongitude'],
      });
    }

    const latSpan = value.maxLatitude - value.minLatitude;
    const lonSpan = value.maxLongitude - value.minLongitude;

    if (latSpan > MAX_BBOX_SPAN_DEGREES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Latitude span must not exceed ${MAX_BBOX_SPAN_DEGREES} degrees`,
        path: ['maxLatitude'],
      });
    }

    if (lonSpan > MAX_BBOX_SPAN_DEGREES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Longitude span must not exceed ${MAX_BBOX_SPAN_DEGREES} degrees`,
        path: ['maxLongitude'],
      });
    }
  });

export type ListOccurrencesQuery = z.infer<typeof listOccurrencesQuerySchema>;

export function encodeOccurrenceCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString('base64url');
}

export function decodeOccurrenceCursor(cursor: string): { createdAt: Date; id: string } {
  const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
  const separator = decoded.indexOf('|');

  if (separator <= 0) {
    throw new Error('Invalid cursor');
  }

  const createdAt = new Date(decoded.slice(0, separator));
  const id = decoded.slice(separator + 1);

  if (Number.isNaN(createdAt.getTime()) || id.length === 0) {
    throw new Error('Invalid cursor');
  }

  return { createdAt, id };
}
