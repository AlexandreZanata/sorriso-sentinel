import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  IdentityRotationProofError,
  type ContributorIdentityRepositoryPort,
} from '@sorriso-sentinel/domain';
import { rotateIdentitySchema } from '@sorriso-sentinel/shared';
import {
  SESSION_TOKEN_ISSUER,
  type SessionClaims,
  type SessionTokenIssuerPort,
} from '../../../infrastructure/auth/hmac-session-token.service';
import { verifyRotationProof } from '../../../infrastructure/auth/rotation-proof.service';

const sessionSecret =
  process.env.SESSION_TOKEN_SECRET ?? 'dev-session-secret-change-me';

export interface RotateIdentityResult {
  sessionToken: string;
  reputationId: string;
  contributorId: string;
}

@Injectable()
export class RotateIdentityHandler {
  constructor(
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
    @Inject(SESSION_TOKEN_ISSUER)
    private readonly sessionTokens: SessionTokenIssuerPort,
  ) {}

  async execute(
    body: unknown,
    session: SessionClaims,
  ): Promise<RotateIdentityResult> {
    const parsed = rotateIdentitySchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const identity = await this.contributors.findById(
      session.contributorId,
      session.cityId,
    );

    if (!identity) {
      throw new NotFoundException({ code: 'CONTRIBUTOR_NOT_FOUND' });
    }

    try {
      identity.rotate({
        newLocalKeyRef: parsed.data.newLocalKeyRef,
        verifyProof: () =>
          verifyRotationProof({
            contributorId: identity.id,
            currentLocalKeyRef: identity.localKeyRef,
            newLocalKeyRef: parsed.data.newLocalKeyRef,
            rotationProof: parsed.data.rotationProof,
            secret: sessionSecret,
          }),
        clock: () => new Date(),
      });
    } catch (error) {
      if (error instanceof IdentityRotationProofError) {
        throw new BadRequestException({ code: 'INVALID_ROTATION_PROOF' });
      }
      throw error;
    }

    await this.contributors.save(identity);

    return {
      sessionToken: this.sessionTokens.issue(identity),
      reputationId: identity.reputationId,
      contributorId: identity.id,
    };
  }
}
