import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthorDisplayPolicy } from '@sorriso-sentinel/domain';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  OCCURRENCE_COMMENT_STORE,
  type OccurrenceCommentStorePort,
} from '../../../infrastructure/database/drizzle-occurrence-comment.store';
import {
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';

export interface CommentListItemDto {
  id: string;
  text: string;
  createdAt: string;
  parentCommentId?: string;
  author?: {
    displayPolicy: AuthorDisplayPolicy;
    pseudonym: string | null;
  };
}

export interface ListCommentsResponse {
  items: CommentListItemDto[];
}

@Injectable()
export class ListCommentsHandler {
  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(OCCURRENCE_COMMENT_STORE)
    private readonly comments: OccurrenceCommentStorePort,
  ) {}

  async execute(
    occurrenceId: string,
    session: SessionClaims | undefined,
  ): Promise<ListCommentsResponse> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const occurrence = await this.occurrences.findById(
      occurrenceId,
      session.cityId,
    );

    if (!occurrence) {
      throw new NotFoundException({ code: 'OCCURRENCE_NOT_FOUND' });
    }

    const storedComments = await this.comments.listByOccurrence(
      occurrenceId,
      session.cityId,
    );

    return {
      items: storedComments.map((comment) => {
        const item: CommentListItemDto = {
          id: comment.id,
          text: comment.text,
          createdAt: comment.createdAt.toISOString(),
        };

        if (comment.parentCommentId) {
          item.parentCommentId = comment.parentCommentId;
        }

        if (
          comment.authorDisplayPolicy === 'pseudonym' ||
          comment.authorDisplayPolicy === 'public'
        ) {
          item.author = {
            displayPolicy: comment.authorDisplayPolicy as AuthorDisplayPolicy,
            pseudonym:
              comment.authorReputationId === session.reputationId
                ? session.pseudonym
                : null,
          };
        }

        return item;
      }),
    };
  }
}
