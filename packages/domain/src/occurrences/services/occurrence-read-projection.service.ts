import type { AuthorDisplayPolicy } from '../../identity/value-objects/author-display-policy.vo.js';
import { isForcedGhostDisplay } from '../../identity/value-objects/author-display-policy.vo.js';
import type { PrivacyLevel } from '../value-objects/privacy-level.vo.js';

export interface OccurrenceReadLocation {
  latitude: number;
  longitude: number;
}

export interface OccurrenceAuthorReadDto {
  displayPolicy: AuthorDisplayPolicy;
  pseudonym: string | null;
}

export interface OccurrenceReadDto {
  id: string;
  cityId: string;
  category: string;
  occurrenceKind: string;
  status: string;
  confidenceLevel: number;
  privacyLevel: PrivacyLevel;
  location?: OccurrenceReadLocation;
  description?: string;
  author?: OccurrenceAuthorReadDto;
  createdAt: string;
  updatedAt: string;
}

export interface OccurrenceReadSource {
  id: string;
  cityId: string;
  category: string;
  occurrenceKind: string;
  status: string;
  confidenceLevel: number;
  privacyLevel: PrivacyLevel;
  latitude: number;
  longitude: number;
  description?: string;
  authorDisplayPolicy: AuthorDisplayPolicy;
  isSensitive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class OccurrenceReadProjection {
  project(
    source: OccurrenceReadSource,
    authorPseudonym: string | null = null,
  ): OccurrenceReadDto {
    const dto: OccurrenceReadDto = {
      id: source.id,
      cityId: source.cityId,
      category: source.category,
      occurrenceKind: source.occurrenceKind,
      status: source.status,
      confidenceLevel: source.confidenceLevel,
      privacyLevel: source.privacyLevel,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    };

    if (this.shouldExposeCoordinates(source.privacyLevel)) {
      dto.location = {
        latitude: source.latitude,
        longitude: source.longitude,
      };
    }

    if (!source.isSensitive && source.description) {
      dto.description = source.description;
    }

    if (this.shouldExposeAuthor(source)) {
      dto.author = {
        displayPolicy: source.authorDisplayPolicy,
        pseudonym: authorPseudonym,
      };
    }

    return dto;
  }

  private shouldExposeCoordinates(privacyLevel: PrivacyLevel): boolean {
    return privacyLevel === 'public' || privacyLevel === 'approximate';
  }

  private shouldExposeAuthor(source: OccurrenceReadSource): boolean {
    if (source.isSensitive || isForcedGhostDisplay(source.authorDisplayPolicy)) {
      return false;
    }

    return (
      source.authorDisplayPolicy === 'pseudonym' ||
      source.authorDisplayPolicy === 'public'
    );
  }
}
