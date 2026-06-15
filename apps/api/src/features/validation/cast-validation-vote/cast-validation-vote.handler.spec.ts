import {
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import type { OccurrenceEventPublisherPort } from '../../../infrastructure/occurrences/occurrence-event-publisher.port';
import type {
  OccurrenceStorePort,
  StoredOccurrence,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';
import type { RateLimiterPort } from '../../../infrastructure/redis/rate-limiter.port';
import type { ValidationVoteRepositoryPort } from '@sorriso-sentinel/domain';
import type { ReputationPort } from '@sorriso-sentinel/domain';
import { CastValidationVoteHandler } from './cast-validation-vote.handler';

describe('CastValidationVoteHandler', () => {
  const cityId = '01932f1a-0000-7000-8000-000000000001';
  const occurrenceId = '01932f1a-0000-7000-8000-000000000010';
  const authorSession: SessionClaims = {
    contributorId: '01932f1a-0000-7000-8000-000000000002',
    cityId,
    reputationId: 'Rep-AUTH1',
    identityMode: 'ghost',
    pseudonym: null,
  };
  const voterSession: SessionClaims = {
    contributorId: '01932f1a-0000-7000-8000-000000000003',
    cityId,
    reputationId: 'Rep-VOTR1',
    identityMode: 'ghost',
    pseudonym: null,
  };

  const baseStoredOccurrence = (): StoredOccurrence => ({
    id: occurrenceId,
    cityId,
    category: 'pothole',
    occurrenceKind: 'problem',
    status: 'unverified',
    confidenceLevel: 0,
    latitude: -12.5423,
    longitude: -55.7214,
    privacyLevel: 'public',
    reputationId: authorSession.reputationId,
    authorDisplayPolicy: 'ghost',
    isSensitive: false,
    version: 1,
    createdAt: new Date('2026-06-15T12:00:00.000Z'),
    updatedAt: new Date('2026-06-15T12:00:00.000Z'),
  });

  let occurrences: OccurrenceStorePort;
  let votes: ValidationVoteRepositoryPort;
  let reputation: ReputationPort;
  let eventPublisher: OccurrenceEventPublisherPort;
  let rateLimiter: RateLimiterPort;
  let handler: CastValidationVoteHandler;

  beforeEach(() => {
    occurrences = {
      save: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(baseStoredOccurrence()),
      listInBbox: vi.fn(),
      countByStatus: vi.fn().mockResolvedValue(0),
    };
    votes = {
      save: vi.fn().mockResolvedValue(undefined),
      findByOccurrence: vi.fn().mockResolvedValue([]),
    };
    reputation = {
      getTrustWeight: vi.fn().mockResolvedValue(1),
      getPublicLabel: vi.fn().mockResolvedValue('new_source'),
    };
    eventPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };
    rateLimiter = {
      consume: vi.fn().mockResolvedValue({ allowed: true }),
    };
    handler = new CastValidationVoteHandler(
      occurrences,
      votes,
      reputation,
      eventPublisher,
      rateLimiter,
    );
  });

  it('should_return_404_when_occurrence_missing', async () => {
    vi.mocked(occurrences.findById).mockResolvedValue(null);

    await expect(
      handler.execute({
        occurrenceId,
        voteType: 'confirm',
        version: 1,
        session: voterSession,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should_return_403_when_confirming_own_occurrence', async () => {
    await expect(
      handler.execute({
        occurrenceId,
        voteType: 'confirm',
        version: 1,
        session: authorSession,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should_return_409_when_version_stale', async () => {
    await expect(
      handler.execute({
        occurrenceId,
        voteType: 'confirm',
        version: 99,
        session: voterSession,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should_return_429_when_rate_limit_exceeded', async () => {
    vi.mocked(rateLimiter.consume).mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 3600,
    });

    await expect(
      handler.execute({
        occurrenceId,
        voteType: 'confirm',
        version: 1,
        session: voterSession,
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
