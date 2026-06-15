import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import type { OccurrenceIdGeneratorPort } from '../../../infrastructure/database/occurrence-id-generator.port';
import type { OccurrenceEventPublisherPort } from '../../../infrastructure/occurrences/occurrence-event-publisher.port';
import type {
  OccurrenceStorePort,
  StoredOccurrence,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';
import type { AuditLogRepositoryPort } from '@sorriso-sentinel/domain';
import type { RateLimiterPort } from '../../../infrastructure/redis/rate-limiter.port';
import { CreateOccurrenceHandler } from './create-occurrence.handler';

describe('CreateOccurrenceHandler', () => {
  const cityId = '01932f1a-0000-7000-8000-000000000001';
  const session: SessionClaims = {
    contributorId: '01932f1a-0000-7000-8000-000000000002',
    cityId,
    reputationId: 'Rep-ABCDE',
    identityMode: 'ghost',
    pseudonym: null,
  };

  let occurrences: OccurrenceStorePort;
  let rateLimiter: RateLimiterPort;
  let eventPublisher: OccurrenceEventPublisherPort;
  let occurrenceIds: OccurrenceIdGeneratorPort;
  let auditLog: AuditLogRepositoryPort;
  let handler: CreateOccurrenceHandler;

  const validBody = {
    category: 'pothole',
    latitude: -12.5423,
    longitude: -55.7214,
  };

  beforeEach(() => {
    occurrences = {
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      listInBbox: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      countByStatus: vi.fn().mockResolvedValue(0),
    };
    rateLimiter = {
      consume: vi.fn().mockResolvedValue({ allowed: true }),
    };
    eventPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };
    occurrenceIds = {
      generate: vi
        .fn()
        .mockResolvedValue('01932f1a-0000-7000-8000-000000000099'),
    };
    auditLog = {
      append: vi.fn().mockResolvedValue(undefined),
      getSummary: vi.fn().mockResolvedValue({
        totalEntries: 0,
        sensitiveEntries: 0,
        lastRecordedAt: null,
        actionCounts: {},
      }),
    };
    handler = new CreateOccurrenceHandler(
      occurrences,
      rateLimiter,
      eventPublisher,
      occurrenceIds,
      auditLog,
    );
  });

  it('should_resolve_city_id_from_session_when_body_omits_city_id', async () => {
    const result = await handler.execute(validBody, session);

    expect(result.cityId).toBe(cityId);
    expect(occurrences.save).toHaveBeenCalledWith(
      expect.objectContaining({ cityId }),
    );
  });

  it('should_reject_when_body_city_id_mismatches_session', async () => {
    await expect(
      handler.execute(
        {
          ...validBody,
          cityId: '01932f1a-0000-7000-8000-000000000099',
        },
        session,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should_call_repository_save_once', async () => {
    await handler.execute(validBody, session);

    expect(occurrences.save).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(auditLog.append).toHaveBeenCalledTimes(1);
  });

  it('should_map_sensitive_response_without_author', async () => {
    const result = await handler.execute(
      {
        category: 'crime',
        latitude: -12.5423,
        longitude: -55.7214,
      },
      session,
    );

    expect(result.category).toBe('crime');
    expect(result.author).toBeUndefined();
    expect(
      (occurrences.save as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as StoredOccurrence,
    ).toMatchObject({
      isSensitive: true,
      authorDisplayPolicy: 'forced_ghost',
    });
  });
});
