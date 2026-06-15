export interface MediaIdGeneratorPort {
  generate(): Promise<string>;
}

export const MEDIA_ID_GENERATOR = Symbol('MEDIA_ID_GENERATOR');
