import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  ContentPolicyService,
  InvalidIdentityModeChangeError,
  type ContributorIdentityRepositoryPort,
} from '@sorriso-sentinel/domain';
import { changeIdentityModeSchema } from '@sorriso-sentinel/shared';
import {
  SESSION_TOKEN_ISSUER,
  type SessionClaims,
  type SessionTokenIssuerPort,
} from '../../../infrastructure/auth/hmac-session-token.service';

export interface ChangeIdentityModeResult {
  sessionToken: string;
  identityMode: SessionClaims['identityMode'];
  pseudonym: string | null;
  reputationId: string;
}

@Injectable()
export class ChangeIdentityModeHandler {
  private readonly contentPolicy = ContentPolicyService.default();

  constructor(
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
    @Inject(SESSION_TOKEN_ISSUER)
    private readonly sessionTokens: SessionTokenIssuerPort,
  ) {}

  async execute(
    body: unknown,
    session: SessionClaims,
  ): Promise<ChangeIdentityModeResult> {
    const parsed = changeIdentityModeSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    if (parsed.data.pseudonym) {
      const pseudonymCheck = this.contentPolicy.validatePseudonym(
        parsed.data.pseudonym,
      );

      if (!pseudonymCheck.ok) {
        throw new BadRequestException({ code: 'DOXXING_DETECTED' });
      }
    }

    const identity = await this.contributors.findById(
      session.contributorId,
      session.cityId,
    );

    if (!identity) {
      throw new NotFoundException({ code: 'CONTRIBUTOR_NOT_FOUND' });
    }

    if (parsed.data.mode === 'pseudonym' && parsed.data.pseudonym) {
      const existing = await this.contributors.findByPseudonym(
        parsed.data.pseudonym,
        session.cityId,
      );

      if (existing && existing.id !== identity.id) {
        throw new ConflictException({ code: 'PSEUDONYM_TAKEN' });
      }
    }

    try {
      identity.changeMode(
        parsed.data.mode,
        parsed.data.pseudonym,
        () => new Date(),
      );
    } catch (error) {
      if (error instanceof InvalidIdentityModeChangeError) {
        throw new BadRequestException({ code: 'INVALID_IDENTITY_MODE' });
      }
      throw error;
    }

    await this.contributors.save(identity);

    return {
      sessionToken: this.sessionTokens.issue(identity),
      identityMode: identity.identityMode,
      pseudonym: identity.pseudonym,
      reputationId: identity.reputationId,
    };
  }
}
