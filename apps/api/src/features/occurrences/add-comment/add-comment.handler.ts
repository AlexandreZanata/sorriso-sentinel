import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentPolicyService,
  SensitiveCategoryPolicy,
  type AuthorDisplayPolicy,
} from '@sorriso-sentinel/domain';
import { addCommentSchema } from '@sorriso-sentinel/shared';
import { randomUUID } from 'node:crypto';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  OCCURRENCE_COMMENT_STORE,
  type OccurrenceCommentStorePort,
} from '../../../infrastructure/database/drizzle-occurrence-comment.store';
import {
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';

export interface AddCommentResponse {
  id: string;
  occurrenceId: string;
  text: string;
  createdAt: string;
  author?: {
    displayPolicy: AuthorDisplayPolicy;
    pseudonym: string | null;
  };
}

@Injectable()
export class AddCommentHandler {
  private readonly sensitivePolicy = SensitiveCategoryPolicy.default();
  private readonly contentPolicy = ContentPolicyService.default();

  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(OCCURRENCE_COMMENT_STORE)
    private readonly comments: OccurrenceCommentStorePort,
  ) {}

  async execute(
    occurrenceId: string,
    body: unknown,
    session: SessionClaims,
  ): Promise<AddCommentResponse> {
    const parsed = addCommentSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const textCheck = this.contentPolicy.validateUserText(parsed.data.text);

    if (!textCheck.ok) {
      throw new BadRequestException({ code: 'DOXXING_DETECTED' });
    }

    const occurrence = await this.occurrences.findById(
      occurrenceId,
      session.cityId,
    );

    if (!occurrence) {
      throw new NotFoundException({ code: 'OCCURRENCE_NOT_FOUND' });
    }

    const authorDisplayPolicy = this.sensitivePolicy.applyAuthorDisplay(
      occurrence.category,
      session.identityMode,
    );
    const createdAt = new Date();
    const commentId = randomUUID();

    await this.comments.save({
      id: commentId,
      occurrenceId,
      cityId: session.cityId,
      authorReputationId: session.reputationId,
      parentCommentId: parsed.data.parentCommentId,
      text: textCheck.value,
      authorDisplayPolicy,
      createdAt,
    });

    const response: AddCommentResponse = {
      id: commentId,
      occurrenceId,
      text: textCheck.value,
      createdAt: createdAt.toISOString(),
    };

    if (
      authorDisplayPolicy === 'pseudonym' ||
      authorDisplayPolicy === 'public'
    ) {
      response.author = {
        displayPolicy: authorDisplayPolicy,
        pseudonym: session.pseudonym,
      };
    }

    return response;
  }
}
