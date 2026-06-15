import { parseOccurrenceCategory } from './occurrence-category.vo.js';

export const OCCURRENCE_KINDS = ['problem', 'temporary_event'] as const;

export type OccurrenceKind = (typeof OCCURRENCE_KINDS)[number];

const TEMPORARY_EVENT_CATEGORIES = new Set(['construction', 'fair', 'road_closure']);

export class InvalidOccurrenceKindError extends Error {
  constructor(value: string) {
    super(`Invalid occurrence kind: ${value}`);
    this.name = 'InvalidOccurrenceKindError';
  }
}

export function parseOccurrenceKind(value: string): OccurrenceKind {
  if ((OCCURRENCE_KINDS as readonly string[]).includes(value)) {
    return value as OccurrenceKind;
  }

  throw new InvalidOccurrenceKindError(value);
}

export function defaultOccurrenceKindForCategory(category: string): OccurrenceKind {
  const normalized = parseOccurrenceCategory(category);
  return TEMPORARY_EVENT_CATEGORIES.has(normalized) ? 'temporary_event' : 'problem';
}

export function resolveOccurrenceKind(
  category: string,
  occurrenceKind?: string,
): OccurrenceKind {
  if (occurrenceKind === undefined) {
    return defaultOccurrenceKindForCategory(category);
  }

  return parseOccurrenceKind(occurrenceKind);
}
