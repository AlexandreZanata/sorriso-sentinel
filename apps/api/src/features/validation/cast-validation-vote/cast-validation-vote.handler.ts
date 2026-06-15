import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DuplicateVoteError,
  OccurrenceValidationClosedError,
  OccurrenceVersionMismatchError,
  SelfValidationForbiddenError,
  ValidationVote,
  computeValidationVoteStats,
  resolveValidationPolicy,
  type ValidationVoteType,
} from '@sorriso-sentinel/domain';
import { randomUUID } from 'node:crypto';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  domainOccurrenceToStored,
  storedOccurrenceToDomain,
} from '../../../infrastructure/occurrences/occurrence.mapper';
import {
  OCCURRENCE_EVENT_PUBLISHER,
  type OccurrenceEventPublisherPort,
} from '../../../infrastructure/occurrences/occurrence-event-publisher.port';
import {
  OccurrenceUpdateConflictError,
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';
import {
  REPUTATION_PORT,
} from '../../../infrastructure/reputation/stub-reputation.port';
import type { ReputationPort } from '@sorriso-sentinel/domain';
import type { RateLimiterPort } from '../../../infrastructure/redis/rate-limiter.port';
import { VALIDATION_VOTE_REPOSITORY } from '@sorriso-sentinel/domain';
import type { ValidationVoteRepositoryPort } from '@sorriso-sentinel/domain';
import { REDIS_RATE_LIMITER } from '../../../infrastructure/redis/redis.tokens';

export interface CastValidationVoteResponse {
  occurrenceId: string;
  status: string;
  confidenceLevel: number;
  version: number;
}

@Injectable()
export class CastValidationVoteHandler {
  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(VALIDATION_VOTE_REPOSITORY)
    private readonly votes: ValidationVoteRepositoryPort,
    @Inject(REPUTATION_PORT)
    private readonly reputation: ReputationPort,
    @Inject(OCCURRENCE_EVENT_PUBLISHER)
    private readonly eventPublisher: OccurrenceEventPublisherPort,
    @Inject(REDIS_RATE_LIMITER)
    private readonly rateLimiter: RateLimiterPort,
  ) {}

  async execute(params: {
    occurrenceId: string;
    voteType: ValidationVoteType;
    version: number;
    reason?: string;
    session: SessionClaims;
  }): Promise<CastValidationVoteResponse> {
    const rateLimit = await this.rateLimiter.consume(
      `validation:${params.session.reputationId}`,
      30,
      3600,
    );

    if (!rateLimit.allowed) {
      throw new HttpException({ code: 'RATE_LIMIT_EXCEEDED' }, 429);
    }

    const stored = await this.occurrences.findById(
      params.occurrenceId,
      params.session.cityId,
    );

    if (!stored) {
      throw new NotFoundException({ code: 'OCCURRENCE_NOT_FOUND' });
    }

    const occurrence = storedOccurrenceToDomain(stored);
    const policy = resolveValidationPolicy({
      isSensitive: occurrence.isSensitive,
      occurrenceKind: occurrence.occurrenceKind,
    });

    const existingVotes = await this.votes.findByOccurrence(
      params.occurrenceId,
      params.session.cityId,
    );
    const existingSummary = computeValidationVoteStats(existingVotes, policy);

    const trustWeight = await this.reputation.getTrustWeight(
      params.session.reputationId,
      params.session.cityId,
    );

    let vote: ValidationVote;

    try {
      vote = ValidationVote.cast({
        id: randomUUID(),
        occurrenceId: params.occurrenceId,
        cityId: params.session.cityId,
        voter: { reputationId: params.session.reputationId },
        authorReputationId: occurrence.contributorRef.reputationId,
        voteType: params.voteType,
        reason: params.reason,
        trustWeight,
        existingVotes: existingSummary.summary,
        clock: () => new Date(),
      });
    } catch (error) {
      this.rethrowVoteError(error);
    }

    const allVotes = [...existingVotes, vote.toProps()];
    const voteStats = computeValidationVoteStats(allVotes, policy);
    const expectedVersion = params.version;

    let result;

    try {
      result =
        params.voteType === 'confirm'
          ? occurrence.recordConfirmation({
              vote,
              voteStats,
              policy,
              expectedVersion,
              clock: () => new Date(),
            })
          : occurrence.recordDenial({
              vote,
              voteStats,
              policy,
              expectedVersion,
              clock: () => new Date(),
            });
    } catch (error) {
      this.rethrowOccurrenceError(error);
    }

    try {
      await this.votes.save(vote.toProps());
      await this.occurrences.update(
        domainOccurrenceToStored(result.occurrence),
        expectedVersion,
      );
    } catch (error) {
      if (error instanceof OccurrenceUpdateConflictError) {
        throw new ConflictException({ code: 'OCCURRENCE_VERSION_CONFLICT' });
      }

      if (
        error instanceof Error &&
        error.message.includes('duplicate key value')
      ) {
        throw new ForbiddenException({ code: 'DUPLICATE_VOTE' });
      }

      throw error;
    }

    for (const event of result.events) {
      await this.eventPublisher.publish(event);
    }

    return {
      occurrenceId: result.occurrence.id,
      status: result.occurrence.status,
      confidenceLevel: result.occurrence.confidenceLevel,
      version: result.occurrence.version,
    };
  }

  private rethrowVoteError(error: unknown): never {
    if (error instanceof SelfValidationForbiddenError) {
      throw new ForbiddenException({ code: 'SELF_VALIDATION_FORBIDDEN' });
    }

    if (error instanceof DuplicateVoteError) {
      throw new ForbiddenException({ code: 'DUPLICATE_VOTE' });
    }

    throw error;
  }

  private rethrowOccurrenceError(error: unknown): never {
    if (error instanceof OccurrenceValidationClosedError) {
      throw new ForbiddenException({ code: 'OCCURRENCE_VALIDATION_CLOSED' });
    }

    if (error instanceof OccurrenceVersionMismatchError) {
      throw new ConflictException({ code: 'OCCURRENCE_VERSION_CONFLICT' });
    }

    throw error;
  }
}
