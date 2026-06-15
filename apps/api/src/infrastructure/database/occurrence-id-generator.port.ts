export interface OccurrenceIdGeneratorPort {
  generate(): Promise<string>;
}

export const OCCURRENCE_ID_GENERATOR = Symbol('OCCURRENCE_ID_GENERATOR');
