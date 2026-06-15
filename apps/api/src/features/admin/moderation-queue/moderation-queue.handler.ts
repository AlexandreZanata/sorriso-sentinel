import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';

export interface ModerationQueueResponse {
  status: 'ok';
  cityId: string;
  pendingReviewCount: number;
}

@Injectable()
export class ModerationQueueHandler {
  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
  ) {}

  async execute(
    session: SessionClaims | undefined,
  ): Promise<ModerationQueueResponse> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const pendingReviewCount = await this.occurrences.countByStatus(
      session.cityId,
      'unverified',
    );

    return {
      status: 'ok',
      cityId: session.cityId,
      pendingReviewCount,
    };
  }
}
